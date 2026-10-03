/**
 * Supuestos medibles (RF-06.4, regla dura 9): se MIDEN y se marcan confirmados o refutados con el umbral
 * numérico declarado en el plan (`umbral_confirmacion`, claves `<métrica>_min` / `<métrica>_max`). Sin
 * umbral, o si la medida no puede fallar, un supuesto de medida queda `sin_probar` con el motivo a la vista.
 * La comparación con la línea base aplica una regla por defecto fija («no peor»: tolerancia cero) y lo dice.
 *
 * Tres familias, según lo que declare `medible_en_trazas`:
 * - calibración (`ece`, `auroc`, `curva_riesgo_cobertura`) sobre la señal de confianza;
 * - tasa de una condición sobre una población;
 * - comparación con la línea base de agente único (exactitud y latencia mediana, con el presupuesto).
 */
import { IDIOMAS, type TextoBilingue } from "../formatos/bilingue";
import type { Traza } from "../formatos/traza";
import type { Plan, Supuesto } from "../plan/esquema";
import { esAristaTripleta } from "../plan/esquema";
import { resolverValor } from "../playground/interprete";
import {
  auroc,
  curvaRiesgoCobertura,
  ece,
  rejilla,
  type Muestra,
  type PuntoRiesgoCobertura,
} from "./calibracion";
import { parsear } from "./condiciones";
import {
  SENAL_DE_CONFIANZA,
  type Umbrales,
  type VistaDeCaso,
} from "./contexto";
import { mediana, numCorto, pct, redondear } from "./numeros";
import { evaluarRegla } from "./reglas";

/** Qué cuenta como extracción correcta para la calibración (la misma regla que el criterio de exactitud). */
export const ETIQUETA_CORRECTO = "extraccion.campos == verdad_conocida.campos";
/** Qué cuenta como caso resuelto correctamente al comparar con la línea base. */
export const EXACTITUD_DE_CASO =
  "decision_final == verdad_conocida.decision AND pausa_humana == verdad_conocida.debe_escalar";

export type EstadoSupuesto = "confirmado" | "refutado" | "sin_probar";

export interface Presupuesto {
  llamadas_al_modelo: number;
  tokens: number;
  costo_nominal_usd: number;
}

export interface ComparacionLineaBase {
  corrida_base: string;
  exactitud: { multiagente: number; agente_unico: number };
  latencia_mediana_s: {
    multiagente: number | null;
    agente_unico: number | null;
  };
  presupuesto: { multiagente: Presupuesto; agente_unico: Presupuesto };
  presupuesto_respetado: boolean;
  casos_distintos: string[];
}

export interface ResultadoSupuesto {
  id: string;
  enunciado: TextoBilingue;
  criticidad: Supuesto["criticidad"];
  estado_en_plan: Supuesto["estado"];
  estado: EstadoSupuesto;
  motivo: TextoBilingue;
  n: number;
  metricas: Record<string, number | null>;
  curva: PuntoRiesgoCobertura[] | null;
  comparacion: ComparacionLineaBase | null;
  limitaciones: TextoBilingue[];
}

const SIN_UMBRAL: TextoBilingue = {
  es: "El plan no declara un umbral numérico de confirmación: se reportan las medidas sin decidir.",
  en: "The plan declares no numeric confirmation threshold: the measures are reported without a decision.",
};

/**
 * Aplica `umbral_confirmacion` a las métricas medidas. Una métrica que no cumple refuta aunque otra no se
 * haya podido medir: la falta de un valor jamás esconde una refutación medida (regla dura 9).
 */
function decidirConUmbral(
  umbral: Record<string, number> | undefined,
  metricas: Record<string, number | null>,
): { estado: EstadoSupuesto; motivo: TextoBilingue } {
  if (!umbral || Object.keys(umbral).length === 0)
    return { estado: "sin_probar", motivo: SIN_UMBRAL };
  const fallidas: string[] = [];
  const sinValor: string[] = [];
  for (const clave of Object.keys(umbral).sort()) {
    const lim = umbral[clave] as number;
    const m = /^(.*)_(min|max)$/.exec(clave);
    const metrica = m?.[1] ?? clave;
    const valor = metricas[metrica];
    if (valor === null || valor === undefined) {
      sinValor.push(metrica);
      continue;
    }
    const ok = m?.[2] === "max" ? valor <= lim : valor >= lim;
    if (!ok) fallidas.push(clave);
  }
  if (fallidas.length > 0) {
    const extra: TextoBilingue =
      sinValor.length > 0
        ? {
            es: ` Sin valor medido: ${sinValor.join(", ")}.`,
            en: ` No measured value: ${sinValor.join(", ")}.`,
          }
        : { es: "", en: "" };
    return {
      estado: "refutado",
      motivo: {
        es: `No cumple el umbral de confirmación: ${fallidas.join(", ")}.${extra.es}`,
        en: `It misses the confirmation threshold: ${fallidas.join(", ")}.${extra.en}`,
      },
    };
  }
  if (sinValor.length > 0)
    return {
      estado: "sin_probar",
      motivo: {
        es: `No hay valor medido para ${sinValor.join(", ")}: el supuesto no se puede decidir.`,
        en: `There is no measured value for ${sinValor.join(", ")}: the assumption cannot be decided.`,
      },
    };
  return {
    estado: "confirmado",
    motivo: {
      es: "Todas las medidas cumplen el umbral de confirmación del plan.",
      en: "Every measure meets the plan's confirmation threshold.",
    },
  };
}

/**
 * ¿Puede fallar la condición? Si es `señal <= n` (o `< n`) y el grafo manda a una persona en cuanto la
 * señal alcanza un valor ≤ n, la medida se cumple por construcción: confirma el diseño, no el supuesto.
 */
export function acotadaPorElGrafo(
  condicion: string,
  plan: Plan,
  umbrales: Umbrales,
): { senal: string; valor: string | number | boolean; cota: number } | null {
  const nodo = parsear(condicion);
  if (
    nodo.tipo !== "binario" ||
    (nodo.op !== "<=" && nodo.op !== "<") ||
    nodo.izq.tipo !== "id" ||
    nodo.der.tipo !== "literal" ||
    typeof nodo.der.valor !== "number"
  )
    return null;
  const senal = nodo.izq.ruta;
  const n = nodo.der.valor;
  const pausas = new Set(
    plan.contrato_de_grafo.pausas_humanas.map((p) => p.nodo),
  );
  for (const a of plan.contrato_de_grafo.aristas_condicionales) {
    if (
      !esAristaTripleta(a) ||
      a.senal !== senal ||
      !pausas.has(a.si_verdadero)
    )
      continue;
    const alcanza =
      a.operador === "mayor_o_igual_que" ||
      (a.operador === "mayor_que" && a.inclusivo);
    if (!alcanza) continue;
    const cota = resolverValor(a.valor, umbrales);
    if (typeof cota !== "number") continue;
    if ((nodo.op === "<=" && cota <= n) || (nodo.op === "<" && cota < n))
      return { senal, valor: a.valor, cota };
  }
  return null;
}

/** Por debajo de 30 casos, toda medida del supuesto orienta pero no prueba. */
function muestraPequena(n: number): TextoBilingue[] {
  return n > 0 && n < 30
    ? [
        {
          es: `Muestra pequeña (${n} casos): la medida orienta, no prueba.`,
          en: `Small sample (${n} cases): the measure guides, it does not prove.`,
        },
      ]
    : [];
}

/** La regla del supuesto no pudo medir (comparación sospechosa, tipos incompatibles): no se decide. */
function reglaRota(
  motivo: TextoBilingue,
): Omit<
  ResultadoSupuesto,
  "id" | "enunciado" | "criticidad" | "estado_en_plan"
> {
  return {
    estado: "sin_probar",
    motivo: {
      es: `La regla del supuesto no pudo medir: ${motivo.es}.`,
      en: `The assumption's rule could not measure: ${motivo.en}.`,
    },
    n: 0,
    metricas: {},
    curva: null,
    comparacion: null,
    limitaciones: [],
  };
}

function calibracion(
  s: Supuesto,
  plan: Plan,
  vistas: readonly VistaDeCaso[],
): Omit<
  ResultadoSupuesto,
  "id" | "enunciado" | "criticidad" | "estado_en_plan"
> {
  const medible = s.medible_en_trazas!;
  const ev = evaluarRegla(medible.poblacion, ETIQUETA_CORRECTO, vistas);
  if (ev.mal_formada) return reglaRota(ev.mal_formada);
  const porId = new Map(vistas.map((v) => [v.caso_id, v]));
  const muestras: Muestra[] = [];
  for (const id of [...ev.verdaderos, ...ev.falsos].sort()) {
    const c = porId.get(id)?.traza.senales[SENAL_DE_CONFIANZA];
    if (typeof c === "number")
      muestras.push({
        caso_id: id,
        confianza: c,
        correcto: ev.verdaderos.includes(id),
      });
  }
  const umbral = plan.umbrales.find((u) => u.senal === SENAL_DE_CONFIANZA);
  const rango =
    umbral && "min" in umbral.rango_jugable ? umbral.rango_jugable : null;
  const curva =
    medible.metricas.includes("curva_riesgo_cobertura") && umbral && rango
      ? curvaRiesgoCobertura(
          muestras,
          rejilla(rango),
          umbral.operador,
          umbral.inclusivo,
        )
      : null;
  const aciertos = muestras.filter((m) => m.correcto).length;
  const metricas: Record<string, number | null> = {
    ece: medible.metricas.includes("ece") ? ece(muestras) : null,
    auroc: medible.metricas.includes("auroc") ? auroc(muestras) : null,
    exactitud:
      muestras.length === 0 ? null : redondear(aciertos / muestras.length),
  };
  const limitaciones: TextoBilingue[] = [];
  if (muestras.length > 0 && (aciertos === 0 || aciertos === muestras.length))
    limitaciones.push({
      es: `Los ${muestras.length} casos medidos fueron todos ${aciertos === 0 ? "fallos" : "aciertos"}: sin las dos clases, la confianza no tiene nada que discriminar y el área bajo la curva no existe.`,
      en: `The ${muestras.length} measured cases were all ${aciertos === 0 ? "failures" : "successes"}: without both classes, confidence has nothing to tell apart and the area under the curve does not exist.`,
    });
  limitaciones.push(...muestraPequena(muestras.length));
  const decision = decidirConUmbral(medible.umbral_confirmacion, metricas);
  return {
    ...decision,
    n: muestras.length,
    metricas,
    curva,
    comparacion: null,
    limitaciones,
  };
}

function tasa(
  s: Supuesto,
  plan: Plan,
  vistas: readonly VistaDeCaso[],
  umbrales: Umbrales,
): Omit<
  ResultadoSupuesto,
  "id" | "enunciado" | "criticidad" | "estado_en_plan"
> {
  const medible = s.medible_en_trazas!;
  const ev = evaluarRegla(medible.poblacion, medible.condicion, vistas);
  if (ev.mal_formada) return reglaRota(ev.mal_formada);
  const n = ev.poblacion.length;
  const metricas: Record<string, number | null> = {
    tasa: n === 0 ? null : redondear(ev.verdaderos.length / n),
  };
  const limitaciones: TextoBilingue[] = [];
  const acotada = medible.condicion
    ? acotadaPorElGrafo(medible.condicion, plan, umbrales)
    : null;
  if (acotada) {
    const motivo: TextoBilingue = {
      es: `La condición «${medible.condicion}» no puede fallar: el grafo manda a una persona en cuanto ${acotada.senal} llega a ${acotada.cota} (${String(acotada.valor)}). La medida confirma el diseño, no el supuesto.`,
      en: `The condition «${medible.condicion}» cannot fail: the graph sends the case to a person as soon as ${acotada.senal} reaches ${acotada.cota} (${String(acotada.valor)}). The measure confirms the design, not the assumption.`,
    };
    return {
      estado: "sin_probar",
      motivo,
      n,
      metricas,
      curva: null,
      comparacion: null,
      limitaciones,
    };
  }
  if (n === 0)
    return {
      estado: "sin_probar",
      motivo: {
        es: "Ningún caso del lote cae en la población del supuesto.",
        en: "No case in the batch falls in the assumption's population.",
      },
      n,
      metricas,
      curva: null,
      comparacion: null,
      limitaciones,
    };
  return {
    ...decidirConUmbral(medible.umbral_confirmacion, metricas),
    n,
    metricas,
    curva: null,
    comparacion: null,
    limitaciones: [...limitaciones, ...muestraPequena(n)],
  };
}

export function presupuestoDe(trazas: readonly Traza[]): Presupuesto {
  let llamadas = 0;
  let tokens = 0;
  let costo = 0;
  for (const t of trazas)
    for (const p of t.pasos) {
      // Un paso de tipo modelo que no gastó nada no llamó al modelo (p. ej. la aclaración que ya escala).
      const llamo =
        p.tokens.entrada + p.tokens.salida > 0 || p.costo_nominal_usd > 0;
      if (p.tipo_nodo === "modelo" && llamo)
        llamadas += 1 + p.reintentos_esquema;
      tokens += p.tokens.entrada + p.tokens.salida;
      costo += p.costo_nominal_usd;
    }
  return {
    llamadas_al_modelo: llamadas,
    tokens,
    costo_nominal_usd: redondear(costo, 4),
  };
}

function exactitudYLatencia(vistas: readonly VistaDeCaso[]): {
  exactitud: number;
  latencia: number | null;
  correctos: Set<string>;
} {
  const ev = evaluarRegla("todos", EXACTITUD_DE_CASO, vistas);
  const lat = vistas
    .map((v) => v.traza.senales["latencia_total_s"])
    .filter((x): x is number => typeof x === "number");
  const m = mediana(lat);
  return {
    exactitud:
      vistas.length === 0 ? 0 : redondear(ev.verdaderos.length / vistas.length),
    latencia: m === null ? null : redondear(m, 3),
    correctos: new Set(ev.verdaderos),
  };
}

/**
 * Una respuesta al afiliado inservible: vacía, JSON crudo o texto de relleno en algún idioma. Las trazas que
 * terminaron en error se cuentan aparte (no tienen respuesta que juzgar). Desde AU-9, `error_proveedor` dice el
 * primer paso que falló aunque el caso haya terminado `completo` por el respaldo: esa respuesta sí se juzga
 * (AU-S2-10).
 */
export function respuestaInservible(t: Traza): boolean {
  if (t.resultado === "error" || !t.salida_final) return false;
  return IDIOMAS.some((l) => {
    const texto = t.salida_final![l].trim();
    return (
      texto === "" ||
      texto.startsWith("{") ||
      texto.startsWith("[") ||
      texto.toLowerCase().includes("placeholder")
    );
  });
}

/**
 * Tolerancia de la comparación con la línea base (plan v1.3, S3): `exactitud_dif_min` = cuánto puede quedar la
 * exactitud del multiagente por debajo (negativo) o por encima (positivo) de la base; `latencia_mediana_razon_max`
 * = cuántas veces la latencia mediana de la base se tolera. Sin claves declaradas rige la regla por defecto
 * («no peor»: 0 y 1), y el informe lo dice.
 */
const TOLERANCIA = ["exactitud_dif_min", "latencia_mediana_razon_max"] as const;

function reglaDeclarada(dif: number, razon: number): TextoBilingue {
  const margen = (i: "es" | "en") =>
    dif === 0 ? "" : ` ${dif > 0 ? "+" : "−"} ${pct(Math.abs(dif), i)}`;
  return {
    es: ` Tolerancia declarada en el plan: exactitud del multiagente ≥ la de la línea base${margen("es")} y latencia mediana ≤ ${numCorto(razon, "es")} × la de la línea base.`,
    en: ` Tolerance declared in the plan: multi-agent accuracy ≥ the baseline's${margen("en")} and median latency ≤ ${numCorto(razon, "en")} × the baseline's.`,
  };
}

const REGLA_POR_DEFECTO: TextoBilingue = {
  es: " Regla por defecto del verificador (el plan no declara tolerancia): exactitud mayor o igual y latencia mediana menor o igual que las de la línea base.",
  en: " Verifier default rule (the plan declares no tolerance): accuracy greater than or equal to, and median latency less than or equal to, the baseline's.",
};

function comparacion(
  s: Supuesto,
  vistas: readonly VistaDeCaso[],
  base: { corrida_id: string; vistas: readonly VistaDeCaso[] } | null,
): Omit<
  ResultadoSupuesto,
  "id" | "enunciado" | "criticidad" | "estado_en_plan"
> {
  if (!base)
    return {
      estado: "sin_probar",
      motivo: {
        es: "No hay corrida de línea base de agente único con la que comparar.",
        en: "There is no single-agent baseline run to compare with.",
      },
      n: vistas.length,
      metricas: {},
      curva: null,
      comparacion: null,
      limitaciones: [],
    };
  const multi = exactitudYLatencia(vistas);
  const unico = exactitudYLatencia(base.vistas);
  const pm = presupuestoDe(vistas.map((v) => v.traza));
  const pu = presupuestoDe(base.vistas.map((v) => v.traza));
  const ids = new Set([
    ...vistas.map((v) => v.caso_id),
    ...base.vistas.map((v) => v.caso_id),
  ]);
  const casos_distintos = [...ids]
    .sort()
    .filter((id) => multi.correctos.has(id) !== unico.correctos.has(id));
  const comp: ComparacionLineaBase = {
    corrida_base: base.corrida_id,
    exactitud: { multiagente: multi.exactitud, agente_unico: unico.exactitud },
    latencia_mediana_s: {
      multiagente: multi.latencia,
      agente_unico: unico.latencia,
    },
    presupuesto: { multiagente: pm, agente_unico: pu },
    presupuesto_respetado:
      pu.llamadas_al_modelo <= pm.llamadas_al_modelo &&
      pu.costo_nominal_usd <= pm.costo_nominal_usd,
    casos_distintos,
  };
  const umbral = s.medible_en_trazas?.umbral_confirmacion ?? {};
  // «Declarada» solo si el plan trae al menos una clave que la comparación conoce y aplica: con solo claves
  // desconocidas rige la regla por defecto, y el motivo lo dice así (AU-S2-B56).
  const declarada = Object.keys(umbral).some((k) =>
    (TOLERANCIA as readonly string[]).includes(k),
  );
  const dif = umbral.exactitud_dif_min ?? 0;
  const razon = umbral.latencia_mediana_razon_max ?? 1;
  const noPeorExactitud = redondear(multi.exactitud - unico.exactitud) >= dif;
  const limitaciones: TextoBilingue[] = [];
  const desconocidas = Object.keys(umbral)
    .filter((k) => !(TOLERANCIA as readonly string[]).includes(k))
    .sort();
  if (desconocidas.length > 0)
    limitaciones.push({
      es: `El plan declara claves de tolerancia que la comparación no conoce y no aplica: ${desconocidas.join(", ")}.`,
      en: `The plan declares tolerance keys the comparison does not know and does not apply: ${desconocidas.join(", ")}.`,
    });
  const idsMulti = new Set(vistas.map((v) => v.caso_id));
  const idsBase = new Set(base.vistas.map((v) => v.caso_id));
  const soloUno = [...ids]
    .filter((id) => idsMulti.has(id) !== idsBase.has(id))
    .sort();
  if (soloUno.length > 0)
    limitaciones.push({
      es: `La línea base y el multiagente no corrieron los mismos casos: ${soloUno.join(", ")}.`,
      en: `The baseline and the multi-agent run did not run the same cases: ${soloUno.join(", ")}.`,
    });
  if (!comp.presupuesto_respetado)
    limitaciones.push({
      es: "La línea base gastó más que el multiagente: la comparación no es a igual presupuesto.",
      en: "The baseline spent more than the multi-agent run: the comparison is not at equal budget.",
    });
  const conError = base.vistas
    .filter((v) => v.traza.error_proveedor)
    .map((v) => `${v.caso_id} (${v.traza.error_proveedor})`)
    .sort();
  if (conError.length > 0)
    limitaciones.push({
      es: `La línea base terminó ${conError.length} caso(s) con error del proveedor, que cuentan como mal resueltos: ${conError.join(", ")}.`,
      en: `The baseline ended ${conError.length} case(s) with a provider error, counted as wrongly resolved: ${conError.join(", ")}.`,
    });
  for (const [lado, vs] of [
    [{ es: "La línea base", en: "The baseline" }, base.vistas],
    [{ es: "El multiagente", en: "The multi-agent run" }, vistas],
  ] as const) {
    const malas = vs
      .filter((v) => respuestaInservible(v.traza))
      .map((v) => v.caso_id)
      .sort();
    if (malas.length > 0)
      limitaciones.push({
        es: `${lado.es} entregó ${malas.length} respuesta(s) al afiliado inservibles (vacías, JSON crudo o texto de relleno), que la comparación no penaliza: ${malas.join(", ")}.`,
        en: `${lado.en} gave ${malas.length} unusable reply(ies) to the member (empty, raw JSON or filler text), which the comparison does not penalize: ${malas.join(", ")}.`,
      });
  }
  limitaciones.push(...muestraPequena(vistas.length));
  const metricas = {
    exactitud: multi.exactitud,
    exactitud_base: unico.exactitud,
    latencia_mediana: multi.latencia,
    latencia_mediana_base: unico.latencia,
  };
  if (multi.latencia === null || unico.latencia === null)
    return {
      estado: "sin_probar",
      motivo: {
        es: "Falta la latencia mediana de una de las dos corridas: el supuesto no se puede decidir.",
        en: "The median latency of one of the two runs is missing: the assumption cannot be decided.",
      },
      n: vistas.length,
      metricas,
      curva: null,
      comparacion: comp,
      limitaciones,
    };
  const noPeorLatencia = multi.latencia <= unico.latencia * razon;
  const confirmado = noPeorExactitud && noPeorLatencia;
  const motivo: TextoBilingue = confirmado
    ? {
        es: "El multiagente no rinde peor que el agente único: igual o mejor en exactitud y en latencia mediana.",
        en: "The multi-agent run does no worse than the single agent: equal or better in accuracy and median latency.",
      }
    : {
        es: `El multiagente rinde peor que el agente único en ${[!noPeorExactitud ? "exactitud" : null, !noPeorLatencia ? "latencia mediana" : null].filter(Boolean).join(" y ")}.`,
        en: `The multi-agent run does worse than the single agent in ${[!noPeorExactitud ? "accuracy" : null, !noPeorLatencia ? "median latency" : null].filter(Boolean).join(" and ")}.`,
      };
  return {
    estado: confirmado ? "confirmado" : "refutado",
    motivo: {
      es: `${motivo.es}${(declarada ? reglaDeclarada(dif, razon) : REGLA_POR_DEFECTO).es}`,
      en: `${motivo.en}${(declarada ? reglaDeclarada(dif, razon) : REGLA_POR_DEFECTO).en}`,
    },
    n: vistas.length,
    metricas,
    curva: null,
    comparacion: comp,
    limitaciones,
  };
}

export function evaluarSupuestos(
  plan: Plan,
  vistas: readonly VistaDeCaso[],
  umbrales: Umbrales,
  base: { corrida_id: string; vistas: readonly VistaDeCaso[] } | null,
): ResultadoSupuesto[] {
  return plan.supuestos.map((s) => {
    const cabecera = {
      id: s.id,
      enunciado: s.enunciado,
      criticidad: s.criticidad,
      estado_en_plan: s.estado,
    };
    const m = s.medible_en_trazas;
    if (!m)
      return {
        ...cabecera,
        estado: "sin_probar" as const,
        motivo: {
          es: "El plan no declara cómo medirlo en las trazas.",
          en: "The plan does not declare how to measure it in the traces.",
        },
        n: 0,
        metricas: {},
        curva: null,
        comparacion: null,
        limitaciones: [],
      };
    if (m.comparacion === "linea_base_agente_unico")
      return { ...cabecera, ...comparacion(s, vistas, base) };
    if (
      m.metricas.some(
        (x) => x === "ece" || x === "auroc" || x === "curva_riesgo_cobertura",
      )
    )
      return { ...cabecera, ...calibracion(s, plan, vistas) };
    return { ...cabecera, ...tasa(s, plan, vistas, umbrales) };
  });
}
