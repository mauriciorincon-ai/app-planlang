/**
 * El informe de brecha (§ 6.10 y § 12 de la especificación, RF-06.7): un objeto JSON canónico con huella,
 * del que salen los Markdown en español y en inglés (`render-md.ts`). Dos ejecuciones sobre los mismos
 * archivos dan los mismos bytes: no hay reloj (la fecha es la de la corrida), ni azar, ni `Intl`.
 */
import { comoBilingue, type TextoBilingue } from "../formatos/bilingue";
import { conHuella } from "../formatos/huella";
import type { JsonValor } from "../formatos/jcs";
import { ligadurasDeUmbrales } from "../plan/contrato-constructor";
import { esAristaTripleta, type Plan } from "../plan/esquema";
import {
  ErrorArista,
  recalcular,
  type Umbrales,
} from "../playground/interprete";
import {
  brechasNoPrevistas,
  type BrechaNoPrevista,
  type ResultadoEvaluador,
} from "./brechas-no-previstas";
import {
  vistasDeCorrida,
  vistasDeSesiones,
  type VistaDeCaso,
} from "./contexto";
import { verificarContrato, type ResultadoContrato } from "./contrato-grafo";
import { evaluarCriterios, type ResultadoCriterio } from "./criterios";
import { evaluarRiesgos, type ResultadoRiesgo } from "./detectores";
import {
  leerEntrada,
  type CorridaLeida,
  type EntradaVerificador,
} from "./lector";
import { mediana, redondear } from "./numeros";
import { evaluarSupuestos, type ResultadoSupuesto } from "./supuestos";
import {
  veredicto,
  type ResultadoVeredicto,
  type Veredicto,
} from "./veredicto";

export const FORMATO_INFORME = "planlang-informe/v1";
/**
 * 1.1.0 (S2): cada riesgo trae la prioridad de tabla y el control legal junto a la efectiva (instrumentos-de-plan
 * v0.2.0, G8); `opcion_elegida` de las decisiones de una vía es bilingüe (M-25).
 * 1.2.0 (S2, fase 3): cada brecha no prevista trae `reintentos` (M-24); un criterio con métrica cuya población no
 * tiene un solo valor medido queda `indeterminado`, no `sin_poblacion`, y su nota dice el sentido del objetivo (M-26).
 */
export const VERSION_VERIFICADOR = "1.2.0";

export interface CasoEjemplar {
  caso_id: string;
  tipo: string;
  subtipo: string;
  por_que: TextoBilingue;
}

export interface UmbralJugable {
  id: string;
  nombre: TextoBilingue;
  senal: string;
  operador: string;
  inclusivo: boolean;
  valor_en_plan: number | boolean;
  valor_aplicado: number | boolean | null;
  rango: { min: number; max: number; paso: number } | "booleano";
  observados: {
    n: number;
    min: number | null;
    mediana: number | null;
    max: number | null;
    verdaderos: number | null;
  };
  casos_en_el_umbral: string[];
}

export interface Informe {
  formato: typeof FORMATO_INFORME;
  version_verificador: string;
  demo_id: string;
  corrida_id: string;
  fecha: string;
  etiqueta: TextoBilingue;
  veredicto: ResultadoVeredicto;
  resumen: {
    texto: TextoBilingue;
    criterios_destacados: string[];
    riesgos_ocurridos: string[];
    recomendacion: TextoBilingue;
  };
  plan_en_breve: {
    id: string;
    version: string;
    nombre: TextoBilingue;
    problema: TextoBilingue;
    flujo: TextoBilingue[];
    decisiones_una_via: {
      id: string;
      pregunta: TextoBilingue;
      opcion_elegida: TextoBilingue | null;
      justificacion: TextoBilingue | null;
    }[];
  };
  criterios: ResultadoCriterio[];
  riesgos: ResultadoRiesgo[];
  brechas_no_previstas: {
    brechas: BrechaNoPrevista[];
    evaluadores: ResultadoEvaluador[];
  };
  supuestos: ResultadoSupuesto[];
  contrato_de_grafo: ResultadoContrato;
  casos_ejemplares: {
    exitoso: CasoEjemplar | null;
    escalado_correctamente: CasoEjemplar | null;
    fallido: CasoEjemplar | null;
    adversario_neutralizado: CasoEjemplar | null;
  };
  playground: { umbrales: UmbralJugable[]; limites: TextoBilingue[] };
  ficha_reproducibilidad: {
    plan: { id: string; version: string; archivo: string; huella: string };
    casos: {
      id: string;
      archivo: string;
      semilla: string;
      n_lote: number;
      huella: string;
      /** El plan con que se generó el lote (puede ser anterior al de la corrida si solo cambió la medición). */
      plan_de_generacion: { version: string; huella: string };
    };
    corrida: {
      id: string;
      huella: string;
      fecha: string;
      proveedor: string;
      modelo: string;
      variante: string;
      version_grafo: string;
      sesiones: number;
      casos_ejecutados: number;
      casos_con_error: number;
      limites_alcanzados: number;
      /** El plan con que se ejecutó (puede ser anterior al verificado si solo cambió la medición, ADR-005). */
      plan_de_ejecucion: { version: string; huella: string };
    };
    repeticiones: { corrida_id: string; huella: string }[];
    linea_base: { corrida_id: string; huella: string } | null;
    umbrales_aplicados: Umbrales;
    umbrales_del_plan: Umbrales;
    revisor_simulado: TextoBilingue;
    verificador: { version: string; formato: string };
  };
  huella: string;
}

const ORDEN_ESTADO: Record<string, number> = {
  incumple: 1,
  mal_formado: 2,
  indeterminado: 3,
  incompleto: 4,
  sin_poblacion: 5,
  cumple: 6,
};

export function criteriosDestacados(
  criterios: readonly ResultadoCriterio[],
): string[] {
  const rango = (c: ResultadoCriterio) =>
    c.estado === "incumple" && c.tipo === "absoluto"
      ? 0
      : (ORDEN_ESTADO[c.estado] ?? 9);
  return criterios
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rango(a.c) - rango(b.c) || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.c.id);
}

const FRASE_VEREDICTO: Record<Veredicto, TextoBilingue> = {
  cumple: { es: "El plan se cumplió", en: "The plan was met" },
  cumple_con_alertas: {
    es: "El plan se cumplió con alertas",
    en: "The plan was met with alerts",
  },
  no_cumple: { es: "El plan no se cumplió", en: "The plan was not met" },
};

function lista(ids: readonly string[], ninguno: string): string {
  return ids.length === 0 ? ninguno : ids.join(", ");
}

/** Ids pendientes en orden de gravedad, para la recomendación. */
function pendientes(
  criterios: readonly ResultadoCriterio[],
  riesgos: readonly ResultadoRiesgo[],
  supuestos: readonly ResultadoSupuesto[],
): string[] {
  const ids: string[] = [];
  for (const c of criterios)
    if (c.estado === "incumple" && c.tipo === "absoluto") ids.push(c.id);
  for (const r of riesgos)
    if (r.estado === "ocurrio" && r.severidad >= 9) ids.push(r.id);
  for (const c of criterios)
    if (c.estado !== "cumple" && !ids.includes(c.id)) ids.push(c.id);
  for (const r of riesgos)
    if (
      (r.estado === "ocurrio" ||
        r.estado === "mal_formado" ||
        r.estado === "indeterminado") &&
      !ids.includes(r.id)
    )
      ids.push(r.id);
  for (const s of supuestos) if (s.estado === "refutado") ids.push(s.id);
  for (const s of supuestos)
    if (
      s.estado === "sin_probar" &&
      s.criticidad === "alta" &&
      !ids.includes(s.id)
    )
      ids.push(s.id);
  return ids;
}

export function resumenDelInforme(
  plan: Plan,
  n: number,
  v: ResultadoVeredicto,
  criterios: readonly ResultadoCriterio[],
  riesgos: readonly ResultadoRiesgo[],
  supuestos: readonly ResultadoSupuesto[],
  brechas: number,
  riesgosDeRepeticiones: readonly ResultadoRiesgo[] = [],
): Informe["resumen"] {
  const cumplidos = criterios.filter((c) => c.estado === "cumple").length;
  const fallidos = criterios.filter((c) => c.estado === "incumple").length;
  const abiertos = criterios.length - cumplidos - fallidos;
  // Un riesgo que ocurrió en una repetición de pass^k también ocurrió (AU-2).
  const ocurrieron = new Set(
    [...riesgos, ...riesgosDeRepeticiones]
      .filter((r) => r.estado === "ocurrio")
      .map((r) => r.id),
  );
  const ocurridos = riesgos.map((r) => r.id).filter((id) => ocurrieron.has(id));
  const frase = FRASE_VEREDICTO[v.valor];
  const texto: TextoBilingue = {
    es: `${frase.es}. Se midieron ${n} casos sintéticos. Criterios: ${cumplidos} cumplidos, ${fallidos} fallidos y ${abiertos} sin cerrar, de ${criterios.length}. Riesgos ocurridos: ${lista(ocurridos, "ninguno")}. Las decisiones humanas se simularon.`,
    en: `${frase.en}. ${n} synthetic cases were measured. Criteria: ${cumplidos} met, ${fallidos} failed and ${abiertos} still open, out of ${criterios.length}. Risks that occurred: ${lista(ocurridos, "none")}. Human decisions were simulated.`,
  };
  const p = pendientes(criterios, riesgos, supuestos).slice(0, 3);
  const extraEs =
    brechas > 0
      ? p.length > 0
        ? " y las brechas no previstas"
        : "las brechas no previstas"
      : "";
  const extraEn =
    brechas > 0
      ? p.length > 0
        ? " and the unforeseen gaps"
        : "the unforeseen gaps"
      : "";
  const completo = plan.lotes.completo;
  const recomendacion: TextoBilingue =
    v.valor === "no_cumple"
      ? {
          es: `No amplíe el agente a más casos: primero corrija ${lista(p, "lo señalado")} y repita el lote.`,
          en: `Do not extend the agent to more cases: first fix ${lista(p, "what is flagged")} and rerun the batch.`,
        }
      : v.valor === "cumple_con_alertas"
        ? {
            es: `Puede seguir, con cuidado: antes del lote de ${completo} casos, revise ${p.join(", ")}${extraEs}.`,
            en: `You may go on, carefully: before the ${completo}-case batch, review ${p.join(", ")}${extraEn}.`,
          }
        : {
            es: `El plan se cumplió en este lote: el siguiente paso es el lote de ${completo} casos.`,
            en: `The plan was met in this batch: the next step is the ${completo}-case batch.`,
          };
  return {
    texto,
    criterios_destacados: criteriosDestacados(criterios),
    riesgos_ocurridos: ocurridos,
    recomendacion,
  };
}

/** Los valores de dominio que el informe nombra, redactados en cada idioma (regla 20: nada crudo en el EN). */
const DECISION: Readonly<Record<string, TextoBilingue>> = {
  aprobar: { es: "aprobar", en: "approve" },
  negar: { es: "negar", en: "deny" },
  rechazar: { es: "rechazar", en: "reject" },
  escalar: { es: "escalar", en: "escalate" },
};
const ATAQUE: Readonly<Record<string, TextoBilingue>> = {
  inyeccion: { es: "inyección", en: "injection" },
  dato_sensible: { es: "dato sensible", en: "sensitive data" },
  homonimo: { es: "homónimo", en: "look-alike name" },
};

function nombreDecision(d: unknown, i: "es" | "en"): string {
  if (d === null || d === undefined)
    return i === "es" ? "sin decisión" : "no decision";
  return DECISION[String(d)]?.[i] ?? String(d);
}

function nombreAtaque(a: string | null, i: "es" | "en"): string {
  return a === null ? "" : (ATAQUE[a]?.[i] ?? a);
}

function ejemplares(
  vistas: readonly VistaDeCaso[],
  criterios: readonly ResultadoCriterio[],
  riesgos: readonly ResultadoRiesgo[],
  evaluadores: readonly ResultadoEvaluador[],
): Informe["casos_ejemplares"] {
  const fallos = new Map<string, string[]>();
  const anotar = (caso: string, id: string) => {
    const l = fallos.get(caso) ?? [];
    if (!l.includes(id)) l.push(id);
    fallos.set(caso, l);
  };
  for (const c of criterios)
    if (!c.metrica)
      for (const caso of c.casos_que_incumplen) anotar(caso, c.id);
  for (const r of riesgos)
    if (r.estado !== "mal_formado")
      for (const caso of r.casos) anotar(caso, r.id);
  for (const e of evaluadores) for (const caso of e.fallas) anotar(caso, e.id);
  const correcto = (v: VistaDeCaso) =>
    v.traza.senales["decision_final"] === v.caso.verdad_conocida.decision;
  const pausa = (v: VistaDeCaso) => v.traza.senales["pausa_humana"] === true;
  const ficha = (
    v: VistaDeCaso | undefined,
    por_que: (v: VistaDeCaso) => TextoBilingue,
  ): CasoEjemplar | null =>
    v
      ? {
          caso_id: v.caso_id,
          tipo: v.caso.tipo,
          subtipo: v.caso.subtipo,
          por_que: por_que(v),
        }
      : null;
  const decisionEs = (v: VistaDeCaso) =>
    nombreDecision(v.traza.senales["decision_final"], "es");
  const decisionEn = (v: VistaDeCaso) =>
    nombreDecision(v.traza.senales["decision_final"], "en");
  return {
    exitoso: ficha(
      vistas.find(
        (v) =>
          v.caso.tipo === "normal" &&
          !pausa(v) &&
          correcto(v) &&
          !fallos.has(v.caso_id),
      ),
      (v) => ({
        es: `Decidió «${decisionEs(v)}» solo, como indica la verdad conocida, sin fallar ninguna regla.`,
        en: `It decided «${decisionEn(v)}» on its own, as the known truth says, without failing any rule.`,
      }),
    ),
    escalado_correctamente: ficha(
      vistas.find(
        (v) =>
          pausa(v) &&
          v.caso.verdad_conocida.debe_escalar &&
          correcto(v) &&
          !fallos.has(v.caso_id),
      ),
      (v) => ({
        es: `Debía pasar por una persona y pasó; la decisión final fue «${decisionEs(v)}».`,
        en: `It had to go to a person and it did; the final decision was «${decisionEn(v)}».`,
      }),
    ),
    fallido: ficha(
      vistas.find((v) => fallos.has(v.caso_id) || !correcto(v)),
      (v) => {
        const ids = fallos.get(v.caso_id) ?? [];
        return ids.length > 0
          ? {
              es: `Falló: ${ids.join(", ")}.`,
              en: `It failed: ${ids.join(", ")}.`,
            }
          : {
              es: `Decidió «${decisionEs(v)}»; la verdad conocida era «${nombreDecision(v.caso.verdad_conocida.decision, "es")}».`,
              en: `It decided «${decisionEn(v)}»; the known truth was «${nombreDecision(v.caso.verdad_conocida.decision, "en")}».`,
            };
      },
    ),
    adversario_neutralizado: ficha(
      vistas.find(
        (v) =>
          v.caso.tipo === "adversario" &&
          correcto(v) &&
          v.traza.senales["severidad_accion"] === 0 &&
          !fallos.has(v.caso_id),
      ),
      (v) => ({
        es: `Ataque de tipo «${nombreAtaque(v.caso.adversario_detalle, "es")}»: la decisión fue la correcta y no se intentó ninguna acción fuera de la lista blanca.`,
        en: `An attack of type «${nombreAtaque(v.caso.adversario_detalle, "en")}»: the decision was the right one and no action outside the allow-list was attempted.`,
      }),
    ),
  };
}

const LIMITE_RECALCULO: TextoBilingue = {
  es: "Mover un umbral recalcula, sobre las señales registradas, qué rama habría tomado cada nodo que decide. Lo que el agente habría hecho después (otra extracción, otra respuesta) no se simula: se marca «no observado».",
  en: "Moving a threshold recomputes, on the recorded signals, which branch each deciding node would have taken. What the agent would have done afterwards (another extraction, another reply) is not simulated: it is marked “not observed”.",
};

/**
 * Lo que el playground puede y no puede mover, CALCULADO sobre la corrida (AU-4): cuántas decisiones cambia
 * conmutar cada umbral booleano, y si cada regla con nombre tiene sus entradas en todas las trazas.
 */
function limitesDelPlayground(
  plan: Plan,
  corrida: CorridaLeida,
  umbrales: Umbrales,
): TextoBilingue[] {
  const salida: TextoBilingue[] = [LIMITE_RECALCULO];
  const lig = ligadurasDeUmbrales(plan);
  const ramas = (u: Umbrales) =>
    corrida.trazas.flatMap((t) =>
      recalcular(
        t.decisiones_de_arista,
        corrida.grafo.aristas_condicionales,
        corrida.grafo.ramas_por_defecto,
        u,
        lig,
      ).map((v) => v.rama_tomada),
    );
  for (const u of plan.umbrales) {
    const valor = umbrales[u.id];
    if (typeof valor !== "boolean") continue;
    try {
      const antes = ramas(umbrales);
      const despues = ramas({ ...umbrales, [u.id]: !valor });
      const n = antes.filter((r, i) => r !== despues[i]).length;
      salida.push({
        es: `${u.id} (${u.nombre.es}): conmutarlo cambia ${n} de las ${antes.length} decisiones registradas en esta corrida.`,
        en: `${u.id} (${u.nombre.en}): switching it changes ${n} of the ${antes.length} decisions recorded in this run.`,
      });
    } catch (err) {
      if (!(err instanceof ErrorArista)) throw err;
      salida.push({
        es: `${u.id} (${u.nombre.es}): no se puede recalcular porque hay decisiones sin registro completo (ver el contrato de grafo).`,
        en: `${u.id} (${u.nombre.en}): it cannot be recomputed because some decisions lack a complete record (see the graph contract).`,
      });
    }
  }
  for (const a of plan.contrato_de_grafo.aristas_condicionales) {
    if (esAristaTripleta(a)) continue;
    const firma = `${a.funcion.nombre}(${a.funcion.entradas.join(", ")})`;
    const completas = corrida.trazas.every((t) =>
      a.funcion.entradas.every((k) => Object.hasOwn(t.senales, k)),
    );
    salida.push(
      completas
        ? {
            es: `La regla ${firma} se puede recalcular: sus entradas están en todas las trazas.`,
            en: `The ${firma} rule can be recomputed: its inputs are in every trace.`,
          }
        : {
            es: `La regla ${firma} no se puede mover: falta alguna de sus entradas en las trazas («no observado»).`,
            en: `The ${firma} rule cannot be moved: some of its inputs are missing from the traces (“not observed”).`,
          },
    );
  }
  return salida;
}

function playground(
  plan: Plan,
  corrida: CorridaLeida,
  vistas: readonly VistaDeCaso[],
  umbrales: Umbrales,
): Informe["playground"] {
  return {
    umbrales: plan.umbrales.map((u) => {
      const valores = vistas.map((v) => ({
        id: v.caso_id,
        x: v.traza.senales[u.senal],
      }));
      const nums = valores.filter(
        (v): v is { id: string; x: number } => typeof v.x === "number",
      );
      const bools = valores.filter(
        (v): v is { id: string; x: boolean } => typeof v.x === "boolean",
      );
      const aplicado = Object.hasOwn(umbrales, u.id)
        ? (umbrales[u.id] as number | boolean)
        : null;
      const xs = nums.map((v) => v.x);
      const med = mediana(xs);
      return {
        id: u.id,
        nombre: u.nombre,
        senal: u.senal,
        operador: u.operador,
        inclusivo: u.inclusivo,
        valor_en_plan: u.valor_en_plan,
        valor_aplicado: aplicado,
        rango: "min" in u.rango_jugable ? { ...u.rango_jugable } : "booleano",
        observados: {
          n: nums.length + bools.length,
          min: xs.length ? Math.min(...xs) : null,
          mediana: med === null ? null : redondear(med, 3),
          max: xs.length ? Math.max(...xs) : null,
          verdaderos: bools.length ? bools.filter((b) => b.x).length : null,
        },
        casos_en_el_umbral:
          typeof aplicado === "number"
            ? nums.filter((v) => v.x === aplicado).map((v) => v.id)
            : [],
      };
    }),
    limites: limitesDelPlayground(plan, corrida, umbrales),
  };
}

function umbralesDelPlan(plan: Plan): Umbrales {
  return Object.fromEntries(plan.umbrales.map((u) => [u.id, u.valor_en_plan]));
}

/** Verifica una corrida contra su plan y produce el informe (lanza `ErrorDeLectura` si algo no cuadra). */
export async function generarInforme(
  entrada: EntradaVerificador,
): Promise<Informe> {
  const e = await leerEntrada(entrada);
  const { plan, corrida } = e;
  const m = corrida.manifiesto;
  const umbrales = m.umbrales_aplicados as Umbrales;
  const vistas = vistasDeCorrida(corrida.trazas, e.casos, umbrales);
  const vistasDe = (c: CorridaLeida) =>
    vistasDeCorrida(
      c.trazas,
      e.casos,
      c.manifiesto.umbrales_aplicados as Umbrales,
    );

  const criterios = evaluarCriterios(
    plan,
    vistas,
    e.repeticiones.map(vistasDe),
  );
  const riesgos = evaluarRiesgos(plan, vistas, vistasDeSesiones(m.sesiones));
  const supuestos = evaluarSupuestos(
    plan,
    vistas,
    umbrales,
    e.base
      ? { corrida_id: e.base.manifiesto.corrida_id, vistas: vistasDe(e.base) }
      : null,
  );
  const contrato = await verificarContrato(plan, corrida, [
    ...e.repeticiones,
    ...(e.base ? [e.base] : []),
  ]);
  const principal = brechasNoPrevistas(plan, vistas, riesgos, m.corrida_id);
  // Las repeticiones que cierran pass^k también se miran: sus riesgos y sus brechas se reportan (AU-2).
  const deRepeticiones = e.repeticiones.map((r) => {
    const vs = vistasDe(r);
    const rs = evaluarRiesgos(
      plan,
      vs,
      vistasDeSesiones(r.manifiesto.sesiones),
    );
    return {
      id: r.manifiesto.corrida_id,
      riesgos: rs,
      brechas: brechasNoPrevistas(plan, vs, rs, r.manifiesto.corrida_id)
        .brechas,
    };
  });
  const brechas = [
    ...principal.brechas,
    ...deRepeticiones.flatMap((x) => x.brechas),
  ];
  const evaluadores = principal.evaluadores;
  const v = veredicto(
    criterios,
    riesgos,
    supuestos,
    contrato,
    brechas,
    deRepeticiones.map(({ id, riesgos: rs }) => ({ id, riesgos: rs })),
  );

  const informe = {
    formato: FORMATO_INFORME,
    version_verificador: VERSION_VERIFICADOR,
    demo_id: m.demo_id,
    corrida_id: m.corrida_id,
    fecha: m.fecha,
    etiqueta: m.ficha.etiqueta,
    veredicto: v,
    resumen: resumenDelInforme(
      plan,
      vistas.length,
      v,
      criterios,
      riesgos,
      supuestos,
      brechas.length,
      deRepeticiones.flatMap((x) => x.riesgos),
    ),
    plan_en_breve: {
      id: plan.id,
      version: plan.version,
      nombre: plan.nombre,
      problema: plan.problema,
      flujo: plan.flujo_objetivo,
      decisiones_una_via: plan.decisiones
        .filter((d) => d.reversibilidad === "una_via")
        .map((d) => ({
          id: d.id,
          pregunta: d.pregunta,
          opcion_elegida: d.opcion_elegida
            ? comoBilingue(d.opcion_elegida)
            : null,
          justificacion: d.justificacion ?? null,
        })),
    },
    criterios,
    riesgos,
    brechas_no_previstas: { brechas, evaluadores },
    supuestos,
    contrato_de_grafo: contrato,
    casos_ejemplares: ejemplares(vistas, criterios, riesgos, evaluadores),
    playground: playground(plan, corrida, vistas, umbrales),
    ficha_reproducibilidad: {
      plan: {
        id: plan.id,
        version: plan.version,
        archivo: entrada.archivoPlan ?? m.plan.archivo,
        huella: e.huellaPlan,
      },
      casos: {
        id: m.casos.id,
        archivo: m.casos.archivo,
        semilla: m.casos.semilla,
        n_lote: m.casos.n_lote,
        huella: m.casos.huella,
        plan_de_generacion: {
          version: e.lote.plan.version,
          huella: e.lote.plan.huella,
        },
      },
      corrida: {
        id: m.corrida_id,
        huella: m.huella,
        fecha: m.fecha,
        proveedor: m.proveedor,
        modelo: m.modelo,
        variante: m.variante,
        version_grafo: m.version_grafo,
        sesiones: m.sesiones.length,
        casos_ejecutados: m.casos_ejecutados.length,
        casos_con_error: m.casos_con_error.length,
        limites_alcanzados: m.sesiones.reduce(
          (n, s) => n + s.limites_alcanzados,
          0,
        ),
        plan_de_ejecucion: e.planCorrida,
      },
      repeticiones: e.repeticiones.map((r) => ({
        corrida_id: r.manifiesto.corrida_id,
        huella: r.manifiesto.huella,
      })),
      linea_base: e.base
        ? {
            corrida_id: e.base.manifiesto.corrida_id,
            huella: e.base.manifiesto.huella,
          }
        : null,
      umbrales_aplicados: umbrales,
      umbrales_del_plan: umbralesDelPlan(plan),
      revisor_simulado: m.revisor_simulado,
      verificador: { version: VERSION_VERIFICADOR, formato: FORMATO_INFORME },
    },
  };
  return (await conHuella(
    informe as unknown as Record<string, JsonValor>,
  )) as unknown as Informe;
}
