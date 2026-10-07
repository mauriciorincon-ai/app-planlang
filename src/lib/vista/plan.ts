/**
 * Vista de P2 Plan: arma lo que se pinta desde el plan que declara el manifiesto y el informe que lo midió. Cada
 * renglón es un elemento del plan con sus palabras (las del archivo), su línea técnica (tal como el código la lee)
 * y lo que midió la corrida; las cifras se cuentan aquí. Pura: los mismos datos dan la misma vista en los dos
 * idiomas (salvo el texto).
 */
import {
  comoBilingue,
  type Idioma,
  type TextoBilingue,
  type TextoLibre,
} from "@core/formatos/bilingue";
import { esAristaTripleta } from "@core/plan/esquema";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { demoSinDespacho } from "@/lib/demos";
import { DEMO_TEXTO } from "@/textos/demo";
import { ruta } from "@/lib/ruta";
import {
  CHIP,
  CIFRAS,
  CONTRATO,
  CRITERIO,
  DECISION,
  ENTREGA,
  FICHA_TECNICA,
  HACE,
  PARTE_DE,
  PORTADA,
  RIESGO,
  SECCIONES,
  SUPUESTO,
  UMBRAL,
  VER_MAS,
} from "@/textos/plan";
import { APAGADO, ENCENDIDO, REVERSIBILIDAD } from "@/textos/plan-comun";
import type { Fila } from "./agente";
import { pieDeCorrida } from "./caso";
import { entero, enumerar, porcentaje, versionCorta } from "./formato";
import { compararCadenas } from "@core/playground/aristas";
import { medidaContraElPlan } from "./brecha";
import { conPlan } from "./plan-en-texto";
import {
  VISIBLES,
  controlLegal,
  pausaDelPlan,
  criticidadEnTexto,
  estadoDeCriterio,
  estadoDeRiesgo,
  estadoDeSupuesto,
  prioridad,
  rangoDePrioridad,
  type EstadoMedido,
  type RiesgoDelInforme,
} from "./plan-comun";

export { VISIBLES } from "./plan-comun";

export type LadoFila =
  | { tipo: "decision"; texto: string; unaVia: boolean }
  | {
      tipo: "riesgo";
      ap: { barras: number; texto: string };
      factores: string;
      rpn: string;
      legal: string | null;
      estado: EstadoMedido;
    }
  | { tipo: "supuesto"; enPlan: string; estado: EstadoMedido }
  | { tipo: "criterio"; estado: EstadoMedido }
  | { tipo: "umbral"; href: string; texto: string; etiqueta: string };

export interface FilaPlan {
  id: string;
  titulo: string;
  /** Umbral: su valor en el plan, en mono junto al nombre. */
  valor?: string;
  /** La elección (decisión), el objetivo (criterio) o lo que hace el umbral. */
  resumen?: string;
  /** Rótulos bajo el título (la criticidad de un supuesto). */
  chips?: string[];
  /** Lo que el código lee (solo el experto): detector, métrica, regla o señal del umbral. */
  tecnica?: string;
  /** Lo que se abre: el porqué, qué pasaría o cómo se prueba; y, en la decisión, su línea técnica. */
  abrir?: { rotulo: string; filas: Fila[]; tecnica?: string };
  /** Decisión de una vía: filete a la izquierda. */
  unaVia?: boolean;
  lado: LadoFila;
}

export interface SeccionPlan {
  id: string;
  n: number;
  titulo: string;
  /** Título corto para el índice. */
  indice: string;
  lectura: string;
  chip: string;
  visibles: FilaPlan[];
  resto: FilaPlan[];
  /** «Ver N más: …» cuando hay resto. */
  mas: string | null;
}

export interface CifraPlan {
  cifra: string;
  texto: string;
  detalle: string;
  href: string;
}

export interface VistaPlan {
  portada: { antetitulo: string };
  paraQue: string;
  parteDe: Array<{
    clave: "problema" | "dominio" | "participan";
    titulo: string;
    detalle: string;
  }>;
  hace: { sub: string; pasos: string[]; hecho: boolean };
  entrega: Array<{ titulo: string; detalle: string }>;
  cifras: CifraPlan[];
  ficha: Fila[];
  secciones: SeccionPlan[];
  contrato: {
    piezas: Array<{ nombre: string; tipo: string }>;
    piezasTitulo: string;
    flujo: string[];
    flujoTitulo: string;
    apartado: string;
    tablaTitulo: string;
    tabla: Array<{
      desde: string;
      n: number;
      regla: string;
      si: string;
      no: string;
    }>;
    lineas: string[];
  };
  pie: string;
}

const X = (t: TextoBilingue, i: Idioma) => t[i];
/** Un campo del plan que puede faltar o venir en un solo idioma (M-25): «—» si falta. */
const L = (t: TextoLibre | undefined | null, i: Idioma) =>
  t ? comoBilingue(t)[i] : "—";

/** Un número del plan como lo lee una persona: coma decimal en español, sin separador de miles (como la maqueta). */
function numeroDelPlan(v: number, i: Idioma): string {
  return i === "es" ? String(v).replace(".", ",") : String(v);
}

/** El valor de un umbral junto a su nombre: «0,75», «1000», «apagado». */
function valorDeUmbral(v: unknown, i: Idioma): string {
  if (typeof v === "boolean") return X(v ? ENCENDIDO : APAGADO, i);
  if (typeof v === "number") return numeroDelPlan(v, i);
  return String(v);
}

function minuscula(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function vistaPlan(d: DatosDemo, i: Idioma): VistaPlan {
  const p = d.plan;
  const informe = d.informe;
  const cg = p.contrato_de_grafo;
  // Lo que un plan aprobado trae siempre: sin ello la página no se arma (el build falla nombrando el campo).
  const aprobadoEl = p.aprobado_el;
  const huella = p.huella;
  const etiquetaRiesgo = p.etiqueta_riesgo;
  const lineaBase = cg.linea_base;
  const m = mundoDelPlan(d);
  const faltan = [
    ...Object.entries({
      aprobado_el: aprobadoEl,
      huella,
      etiqueta_riesgo: etiquetaRiesgo,
      "contrato_de_grafo.linea_base": lineaBase,
    })
      .filter(([, v]) => v === undefined || v === null)
      .map(([k]) => k),
    ...m.faltan,
  ];
  if (!aprobadoEl || !huella || !m.texto || !etiquetaRiesgo || !lineaBase)
    throw new Error(
      `vitrina: el plan ${p.id} ${p.version} no trae lo que trae un plan aprobado: ${faltan.join(", ")}`,
    );
  const mundo = m.texto;
  const vPlan = versionCorta(p.version);
  const vCorrida = versionCorta(
    informe.ficha_reproducibilidad.corrida.plan_de_ejecucion.version,
  );
  const chipPlan = X(CHIP.plan(vPlan), i);
  const chipMedido = X(
    vPlan === vCorrida
      ? CHIP.plan(vPlan)
      : CHIP.planYCorrida({ plan: vPlan, corrida: vCorrida }),
    i,
  );
  const riesgoDe = (id: string) =>
    informe.riesgos.find((x) => x.id === id) as RiesgoDelInforme | undefined;

  // ── decisiones ─────────────────────────────────────────────────────────────────────────────────
  const decisiones: FilaPlan[] = p.decisiones.map((x) => {
    const gobierna = [...x.riesgos_asociados, ...x.umbrales_asociados];
    const tecnica = [
      `${X(DECISION.tipo, i)} ${x.tipo}`,
      `${X(DECISION.estado, i)} ${x.estado}`,
      ...(gobierna.length
        ? [`${X(DECISION.gobierna, i)} ${gobierna.join(" · ")}`]
        : []),
      ...(x.depende_de.length
        ? [`${X(DECISION.dependeDe, i)} ${x.depende_de.join(" · ")}`]
        : []),
    ].join(" · ");
    return {
      id: x.id,
      titulo: X(x.pregunta, i),
      resumen: L(x.opcion_elegida, i),
      unaVia: x.reversibilidad === "una_via",
      abrir: {
        rotulo: X(DECISION.abrir, i),
        filas: [
          { k: X(DECISION.porQue, i), v: L(x.justificacion, i) },
          {
            k: X(DECISION.opciones, i),
            v: x.opciones.map((o) => L(o.nombre, i)).join(" · "),
          },
          {
            k: X(DECISION.implica, i),
            v: L(DECISION.implicacion[x.reversibilidad], i),
          },
        ],
        tecnica,
      },
      lado: {
        tipo: "decision",
        texto: X(REVERSIBILIDAD[x.reversibilidad]!, i),
        unaVia: x.reversibilidad === "una_via",
      },
    };
  });

  // ── riesgos, por prioridad de acción efectiva ──────────────────────────────────────────────────
  const riesgos: FilaPlan[] = [...p.riesgos]
    .sort(
      (a, b) =>
        rangoDePrioridad(riesgoDe(b.id)) - rangoDePrioridad(riesgoDe(a.id)) ||
        b.severidad - a.severidad ||
        b.ocurrencia - a.ocurrencia ||
        b.deteccion - a.deteccion ||
        compararCadenas(a.id, b.id),
    )
    .map((r) => {
      const ri = riesgoDe(r.id);
      const det = r.detector_en_trazas;
      return {
        id: r.id,
        titulo: X(r.modo, i),
        tecnica: det
          ? `${det.poblacion} → ${det.condicion} · ${X(RIESGO.ocurreSi, i)} ${det.ocurre_si} · ${X(RIESGO.decision, i)} ${r.decision_id ?? "—"}`
          : `${X(RIESGO.decision, i)} ${r.decision_id ?? "—"}`,
        abrir: {
          rotulo: X(RIESGO.abrir, i),
          filas: [
            { k: X(RIESGO.siPasa, i), v: X(r.efecto, i) },
            { k: X(RIESGO.porQue, i), v: X(r.causa, i) },
            ...r.mitigaciones.map((m) => ({
              k: X(RIESGO.hecho, i),
              v: L(m.accion, i),
              nota: `${L(m.efecto_esperado, i)} · ${L(m.momento, i)}`,
            })),
          ],
        },
        lado: {
          tipo: "riesgo",
          ap: prioridad(ri, i),
          factores: `S${r.severidad} · O${r.ocurrencia} · D${r.deteccion}`,
          rpn: `RPN ${ri?.rpn ?? r.severidad * r.ocurrencia * r.deteccion}`,
          legal: controlLegal(ri, i),
          estado: estadoDeRiesgo(ri?.estado, i),
        },
      };
    });

  // ── supuestos ──────────────────────────────────────────────────────────────────────────────────
  const supuestos: FilaPlan[] = p.supuestos.map((s) => {
    const si = informe.supuestos.find((x) => x.id === s.id) as
      | {
          estado: string;
          motivo?: TextoBilingue | null;
          metricas: Record<string, number | null>;
          n: number;
        }
      | undefined;
    const m = s.medible_en_trazas as Record<string, unknown> & {
      metricas: string[];
      poblacion: string;
      umbral_confirmacion?: Record<string, unknown>;
    };
    const tecnica = [
      ...m.metricas,
      m.poblacion,
      ...(typeof m.condicion === "string" ? [m.condicion] : []),
      ...(typeof m.comparacion === "string" ? [m.comparacion] : []),
      ...Object.entries(m.umbral_confirmacion ?? {}).map(
        ([k, v]) => `${k} ${String(v)}`,
      ),
    ].join(" · ");
    return {
      id: s.id,
      titulo: X(s.enunciado, i),
      chips: [criticidadEnTexto(s.criticidad, i)],
      tecnica,
      abrir: {
        rotulo: X(SUPUESTO.abrir, i),
        filas: [
          { k: X(SUPUESTO.prueba, i), v: X(s.prueba_barata, i) },
          ...(si?.motivo
            ? [
                {
                  k: X(SUPUESTO.dio, i),
                  v:
                    medidaContraElPlan(si, m.umbral_confirmacion ?? {}, i) ??
                    X(si.motivo, i),
                },
              ]
            : []),
        ],
      },
      lado: {
        tipo: "supuesto",
        enPlan: X(
          SUPUESTO.enElPlan({
            es: estadoDeSupuesto(s.estado, "es").texto,
            en: estadoDeSupuesto(s.estado, "en").texto,
          }),
          i,
        ),
        estado: estadoDeSupuesto(si?.estado, i),
      },
    };
  });

  // ── criterios ──────────────────────────────────────────────────────────────────────────────────
  const criterios: FilaPlan[] = p.criterios_aceptacion.map((c) => {
    const ci = informe.criterios.find((x) => x.id === c.id);
    const r = c.regla_de_medicion as Record<string, unknown> & {
      poblacion: string;
      agregacion: string;
    };
    const objetivo =
      typeof c.valor_objetivo === "boolean"
        ? X(CRITERIO.todos, i)
        : c.tipo === "tasa"
          ? `≥ ${porcentaje(c.valor_objetivo, i)}`
          : c.tipo === "latencia"
            ? `≤ ${numeroDelPlan(c.valor_objetivo, i)} s`
            : String(c.valor_objetivo);
    const lee =
      typeof r.condicion === "string" ? r.condicion : String(r.metrica ?? "");
    return {
      id: c.id,
      titulo: conPlan(
        X(CRITERIO.lider[d.id][c.id] ?? c.enunciado, i),
        p,
        i,
        d.id,
      ),
      resumen: `${X(CRITERIO.objetivo, i)}: ${objetivo} · ${X(CRITERIO.origen[c.origen] ?? { es: c.origen, en: c.origen }, i)}`,
      tecnica: `${X(c.enunciado, i)} — ${r.poblacion} → ${lee} · ${r.agregacion}${typeof r.k === "number" ? ` · k = ${r.k}` : ""}${r.k_aplica_a ? ` · k_aplica_a = ${r.k_aplica_a}` : ""}`,
      lado: { tipo: "criterio", estado: estadoDeCriterio(ci?.estado, i) },
    };
  });

  // ── umbrales ───────────────────────────────────────────────────────────────────────────────────
  const playground = ruta(i, "playground", undefined, d.id);
  const umbrales: FilaPlan[] = p.umbrales.map((u) => {
    const rango =
      "tipo" in u.rango_jugable
        ? X(UMBRAL.siNo, i)
        : X(
            UMBRAL.rangoValor({
              min: numeroDelPlan(u.rango_jugable.min, i),
              max: numeroDelPlan(u.rango_jugable.max, i),
            }),
            i,
          );
    return {
      id: u.id,
      titulo: X(u.nombre, i),
      valor: valorDeUmbral(u.valor_en_plan, i),
      resumen: X(u.descripcion_lider, i),
      tecnica: [
        u.senal,
        u.operador,
        String(u.valor_en_plan),
        X(u.inclusivo ? CONTRATO.inclusivo : UMBRAL.noInclusivo, i),
        `${X(UMBRAL.rango, i)} ${rango}`,
        `${X(UMBRAL.consecuencia, i)} ${u.consecuencia_si_verdadero}`,
        `costo_humano_por_caso_min ${u.costo_humano_por_caso_min}`,
        `${X(UMBRAL.decision, i)} ${u.decision_id}`,
      ].join(" · "),
      lado: {
        tipo: "umbral",
        href: playground,
        texto: X(UMBRAL.mover, i),
        etiqueta: X(UMBRAL.moverEtiqueta(u.id), i),
      },
    };
  });
  const minutos = [
    ...new Set(
      p.umbrales
        .map((u) => u.costo_humano_por_caso_min)
        .filter((m): m is number => typeof m === "number"),
    ),
  ]
    .sort((a, b) => a - b)
    .map((m) => numeroDelPlan(m, i));

  const seccion = (
    id: string,
    n: number,
    s: { titulo: TextoBilingue; indice?: TextoBilingue },
    lectura: TextoBilingue,
    chip: string,
    filas: FilaPlan[],
  ): SeccionPlan => {
    const resto = filas.slice(VISIBLES);
    return {
      id,
      n,
      titulo: X(s.titulo, i),
      indice: X(s.indice ?? s.titulo, i),
      lectura: X(lectura, i),
      chip,
      visibles: filas.slice(0, VISIBLES),
      resto,
      mas: resto.length
        ? X(
            VER_MAS.mas({
              n: resto.length,
              ids: resto.map((f) => f.id).join(", "),
            }),
            i,
          )
        : null,
    };
  };

  // ── cifras ─────────────────────────────────────────────────────────────────────────────────────
  const altas = p.riesgos.filter(
    (r) => riesgoDe(r.id)?.prioridad_de_accion === "alta",
  );
  const porLegal = altas.filter((r) => {
    const ri = riesgoDe(r.id);
    return ri?.control_legal && ri.prioridad_de_tabla !== "alta";
  }).length;
  const cuentaSupuestos = { confirmado: 0, refutado: 0, sin_probar: 0 };
  for (const s of informe.supuestos)
    if (s.estado in cuentaSupuestos)
      cuentaSupuestos[s.estado as keyof typeof cuentaSupuestos]++;
  const cumplen = informe.criterios.filter((c) => c.estado === "cumple").length;
  const cifras: CifraPlan[] = [
    {
      cifra: String(p.decisiones.length),
      texto: X(CIFRAS.decisiones, i),
      detalle: X(
        CIFRAS.unaVia(
          p.decisiones.filter((x) => x.reversibilidad === "una_via").length,
        ),
        i,
      ),
      href: "#p-dec",
    },
    {
      cifra: String(p.riesgos.length),
      texto: X(CIFRAS.riesgos, i),
      detalle: X(CIFRAS.alta({ n: altas.length, legal: porLegal }), i),
      href: "#p-ries",
    },
    {
      cifra: String(p.supuestos.length),
      texto: X(CIFRAS.supuestos, i),
      detalle: X(CIFRAS.estadosSupuestos(cuentaSupuestos), i),
      href: "#p-sup",
    },
    {
      cifra: String(p.criterios_aceptacion.length),
      texto: X(CIFRAS.criterios, i),
      detalle: X(
        CIFRAS.cumplieron({
          si: cumplen,
          no: informe.criterios.filter((c) => c.estado === "incumple").length,
          incompletos: informe.criterios.filter(
            (c) => c.estado === "incompleto",
          ).length,
        }),
        i,
      ),
      href: "#p-crit",
    },
    {
      cifra: String(p.umbrales.length),
      texto: X(CIFRAS.umbrales, i),
      detalle: X(CIFRAS.jugables, i),
      href: "#p-umb",
    },
  ];

  // ── el contrato del grafo ──────────────────────────────────────────────────────────────────────
  const umbral = (ref: string) =>
    p.umbrales.find((u) => `umbral.${u.id}` === ref);
  const tabla = cg.aristas_condicionales.map((a) => {
    let regla: string;
    if (esAristaTripleta(a)) {
      const u = typeof a.valor === "string" ? umbral(a.valor) : undefined;
      const valor = u
        ? `${a.valor} (${valorDeUmbral(u.valor_en_plan, i)})`
        : String(a.valor);
      regla = `${a.senal} · ${a.operador} · ${valor}${a.inclusivo ? ` · ${X(CONTRATO.inclusivo, i)}` : ""}`;
    } else regla = `${a.funcion.nombre}(${a.funcion.entradas.join(", ")})`;
    const siFalso = "si_falso" in a ? a.si_falso : undefined;
    return {
      desde: a.desde,
      n: a.orden,
      regla,
      si: a.si_verdadero,
      no:
        siFalso ??
        (cg.ramas_por_defecto as Record<string, string>)[a.desde] ??
        "—",
    };
  });
  const rf = informe.contrato_de_grafo.rf_09_2;
  const pausa = pausaDelPlan(cg.pausas_humanas);
  const lineas = [
    `${X(CONTRATO.senales, i)}: ${cg.senales_obligatorias_en_traza.join(", ")}`,
    ...(pausa
      ? [
          `${X(CONTRATO.pausa, i)}: ${X(CONTRATO.rol, i)} ${pausa.rol} · ${X(CONTRATO.payload, i)} ${pausa.payload_minimo.join(", ")}`,
        ]
      : []),
    `${X(CONTRATO.lineaBase, i)}: ${[...(lineaBase.agente_unico ? [X(CONTRATO.agenteUnico, i)] : []), ...(lineaBase.mismo_presupuesto ? [X(CONTRATO.mismoPresupuesto, i)] : []), `${X(CONTRATO.lote, i)} ${lineaBase.lote}`].join(", ")} · ${X(CONTRATO.evaluadores, i)}: ${cg.evaluadores_requeridos.map((e) => e.id).join(", ")}`,
  ];

  const lotes = p.lotes;
  return {
    portada: {
      antetitulo: X(
        PORTADA.antetitulo({
          demo: DEMO_TEXTO[d.id].corto,
          id: p.id,
          version: p.version,
          fecha: aprobadoEl,
        }),
        i,
      ),
    },
    paraQue: X(p.problema, i),
    parteDe: [
      {
        clave: "problema",
        titulo: X(PARTE_DE.problema, i),
        detalle: X(PARTE_DE.problemaDetalle[d.id], i),
      },
      {
        clave: "dominio",
        titulo: X(PARTE_DE.dominio, i),
        detalle: X(mundo, i),
      },
      {
        clave: "participan",
        titulo: X(PARTE_DE.participan, i),
        detalle: enumerar(
          p.actores.map((a) => minuscula(X(a, i))),
          i,
        ),
      },
    ],
    hace: {
      sub: X(HACE.sub, i),
      pasos: HACE.pasos.map((x) => X(x, i)),
      hecho: p.estado_aprobacion === "aprobado",
    },
    entrega: [
      {
        titulo: X(ENTREGA.aprobado, i),
        detalle: `${p.id} ${p.version} · ${huella.slice(0, 12)}…`,
      },
      {
        titulo: X(ENTREGA.contrato, i),
        detalle: X(
          ENTREGA.contratoDetalle({
            nodos: cg.nodos_esperados.length,
            aristas: cg.aristas_condicionales.length,
            senales: cg.senales_obligatorias_en_traza.length,
          }),
          i,
        ),
      },
      { titulo: X(ENTREGA.vara, i), detalle: X(ENTREGA.varaDetalle, i) },
    ],
    cifras,
    ficha: [
      {
        k: X(FICHA_TECNICA.id, i),
        v: X(
          FICHA_TECNICA.idValor({
            id: p.id,
            version: p.version,
            dominio: p.dominio_id,
          }),
          i,
        ),
      },
      { k: X(FICHA_TECNICA.huella, i), v: `\`${huella}\`` },
      {
        k: X(FICHA_TECNICA.estado, i),
        v: X(
          FICHA_TECNICA.estadoValor({
            estado: p.estado_aprobacion,
            fecha: aprobadoEl,
          }),
          i,
        ),
      },
      { k: X(FICHA_TECNICA.riesgo, i), v: X(etiquetaRiesgo, i) },
      {
        k: X(FICHA_TECNICA.lotes, i),
        v: X(
          FICHA_TECNICA.lotesValor({
            demo: lotes.demo,
            completo: lotes.completo,
            de: lotes.corridas_espaciadas_de,
            ci: lotes.fuera_de_ci,
            proveedor: lotes.proveedor,
            modelo: lotes.modelo_alias,
          }),
          i,
        ),
      },
      { k: X(FICHA_TECNICA.formato, i), v: X(FICHA_TECNICA.formatoValor, i) },
    ],
    secciones: [
      seccion(
        "p-dec",
        1,
        SECCIONES.decisiones,
        SECCIONES.decisiones.lectura,
        chipPlan,
        decisiones,
      ),
      seccion(
        "p-ries",
        2,
        SECCIONES.riesgos,
        SECCIONES.riesgos.lectura,
        chipPlan,
        riesgos,
      ),
      seccion(
        "p-sup",
        3,
        SECCIONES.supuestos,
        SECCIONES.supuestos.lectura,
        chipMedido,
        supuestos,
      ),
      seccion(
        "p-crit",
        4,
        SECCIONES.criterios,
        SECCIONES.criterios.lectura,
        chipMedido,
        criterios,
      ),
      seccion(
        "p-umb",
        5,
        SECCIONES.umbrales,
        minutos.length
          ? SECCIONES.umbrales.lectura(minutos.join("–"))
          : SECCIONES.umbrales.lecturaSinCosto,
        chipPlan,
        umbrales,
      ),
    ],
    contrato: {
      piezas: cg.nodos_esperados.map((n) => ({ nombre: n.id, tipo: n.tipo })),
      piezasTitulo: X(CONTRATO.piezas(cg.nodos_esperados.length), i),
      flujo: p.flujo_objetivo.map((x) => X(x, i)),
      flujoTitulo: X(CONTRATO.flujo(p.flujo_objetivo.length), i),
      apartado: X(
        CONTRATO.apartado({
          reglas: cg.aristas_condicionales.length,
          decisiones: entero(
            rf.reduce((s, c) => s + c.visitas, 0),
            i,
          ),
          diferencias: rf.reduce((s, c) => s + c.discrepancias, 0),
          corridas: rf.length,
        }),
        i,
      ),
      tablaTitulo: X(CONTRATO.tabla(cg.aristas_condicionales.length), i),
      tabla,
      lineas,
    },
    pie: pieDeCorrida(d, i),
  };
}

/**
 * El mundo de cada demo como lo dice P3 (exhaustivo por demo, ADR-014): el plan de beneficios del A viaja en su plan;
 * el B cita sus listas desde el lote y la corrida (desviación 17). Sin su mundo, `texto` es `null` y `faltan` lo nombra.
 */
function mundoDelPlan(d: DatosDemo): {
  texto: TextoBilingue | null;
  faltan: string[];
} {
  switch (d.id) {
    case "demo-a": {
      const b = d.plan.plan_beneficios_sintetico;
      if (!b) return { texto: null, faltan: ["plan_beneficios_sintetico"] };
      if (b.topes_de_cobertura === undefined)
        return {
          texto: null,
          faltan: ["plan_beneficios_sintetico.topes_de_cobertura"],
        };
      return {
        texto: PARTE_DE.dominioDetalle({
          procedimientos: b.procedimientos,
          exentos: b.exentos_de_autorizacion,
          exclusiones: b.exclusiones_con_causal,
          topes: b.topes_de_cobertura,
        }),
        faltan: [],
      };
    }
    case "demo-b":
      return {
        texto: PARTE_DE.dominioDetalleB({
          listas: d.listas.listas.map((l) => ({
            id: l.id,
            nombre: l.nombre,
            fuente: l.fuente_simulada,
            personas: l.entradas.length,
            vinculante: l.vinculante,
          })),
        }),
        faltan: [],
      };
    default:
      return demoSinDespacho(d, "vistaPlan (el mundo del demo)");
  }
}
