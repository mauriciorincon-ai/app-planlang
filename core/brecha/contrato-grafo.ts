/**
 * Contrato de grafo contra las trazas (RF-06.5) y la prueba cruzada de aristas (RF-09.2):
 * - el grafo exportado declara los nodos, aristas, ramas por defecto y pausas del plan;
 * - cada traza trae las señales obligatorias, visita solo nodos declarados y registra cada pausa con su
 *   rol y el payload mínimo;
 * - cada visita de un nodo escritor se recalcula con el intérprete TypeScript: debe dar la rama y los
 *   resultados que el agente registró, el siguiente paso debe ser esa rama, y el conjunto debe tener la
 *   misma huella que `ramas-esperadas.json` escrito por Python;
 * - cada corrida aplicó los umbrales del plan (si no, la prueba cruzada mide otro plan) y cada visita de un
 *   nodo que decide dejó el registro de TODAS sus aristas (sin registro no hay prueba cruzada ni playground).
 */
import type { TextoBilingue } from "../formatos/bilingue";
import { jcs } from "../formatos/jcs";
import type { Traza } from "../formatos/traza";
import {
  ramaPorDefecto,
  umbralesAplicados,
} from "../plan/contrato-constructor";
import type { AristaCondicional, Plan } from "../plan/esquema";
import {
  agruparVisitas,
  discrepanciasDeRamas,
  ramasEsperadas,
  type Umbrales,
} from "../playground/interprete";
import type { CorridaLeida } from "./lector";

export const CODIGOS_CONTRATO = [
  "NODO_AUSENTE",
  "ARISTAS_DISTINTAS",
  "NODO_NO_DECLARADO",
  "SENAL_FALTANTE",
  "RAMA_IRREPRODUCIBLE",
  "RAMA_NO_SEGUIDA",
  "PAUSA_SIN_REGISTRO",
  "PAYLOAD_INCOMPLETO",
  "ROL_DISTINTO",
  "DERIVA_ENTRE_INTERPRETES",
  "NODO_NO_EJERCITADO",
  "UMBRAL_DISTINTO_DEL_PLAN",
  "DECISION_SIN_REGISTRO",
] as const;
export type CodigoContrato = (typeof CODIGOS_CONTRATO)[number];

export interface HallazgoDeContrato {
  codigo: CodigoContrato;
  severidad: "bloqueante" | "alerta";
  corrida_id: string;
  caso_id: string | null;
  detalle: TextoBilingue;
}

export interface ResultadoRf092 {
  corrida_id: string;
  variante: string;
  visitas: number;
  discrepancias: number;
  huella_typescript: string;
  huella_python: string;
  coincide: boolean;
}

export interface ResultadoContrato {
  nodos: { id: string; tipo: string; en_grafo: boolean; visitas: number }[];
  senales: { senal: string; presente_en: number; de: number }[];
  pausas: {
    nodo: string;
    rol: string;
    casos_con_pausa: number;
    pausas_registradas: number;
  };
  rf_09_2: ResultadoRf092[];
  hallazgos: HallazgoDeContrato[];
}

const ordenar = (as: readonly AristaCondicional[]) =>
  [...as].sort((x, y) =>
    x.desde < y.desde ? -1 : x.desde > y.desde ? 1 : x.orden - y.orden,
  );

/** Las ramas por defecto del plan resueltas para cada nodo escritor (igual que Python). */
export function ramasResueltas(plan: Plan): Record<string, string> {
  const escritores = [
    ...new Set(
      plan.contrato_de_grafo.aristas_condicionales.map((a) => a.desde),
    ),
  ].sort();
  return Object.fromEntries(
    escritores.map((n) => [n, ramaPorDefecto(plan, n)]),
  );
}

/** ¿Aplicó cada corrida los umbrales del plan? Si no, RF-09.2 y los criterios no miden el plan (AU-5). */
export function umbralesDistintosDelPlan(
  plan: Plan,
  corridas: readonly CorridaLeida[],
): HallazgoDeContrato[] {
  const delPlan = jcs(umbralesAplicados(plan));
  return corridas
    .filter((c) => jcs(c.manifiesto.umbrales_aplicados) !== delPlan)
    .map((c) => ({
      codigo: "UMBRAL_DISTINTO_DEL_PLAN",
      severidad: "bloqueante",
      corrida_id: c.manifiesto.corrida_id,
      caso_id: null,
      detalle: {
        es: "La corrida aplicó umbrales distintos de los del plan: la prueba cruzada y los criterios no miden el plan.",
        en: "The run applied thresholds other than the plan's: the cross-check and the criteria do not measure the plan.",
      },
    }));
}

/**
 * Cada paso de un nodo con aristas condicionales debe registrar exactamente sus aristas 1..n (AU-6). La única
 * excepción es el último paso de una traza que terminó con error del proveedor: el nodo no llegó a decidir.
 */
function decisionesIncompletas(
  t: Traza,
  porNodo: ReadonlyMap<string, number>,
  corridaId: string,
): HallazgoDeContrato[] {
  const salida: HallazgoDeContrato[] = [];
  for (const p of t.pasos) {
    const n = porNodo.get(p.nodo);
    if (n === undefined) continue;
    const regs = t.decisiones_de_arista.filter((d) => d.paso === p.orden);
    const ultimoConError =
      t.resultado === "error" &&
      p.orden === t.pasos.length &&
      p.error_proveedor !== null;
    if (regs.length === 0 && ultimoConError) continue;
    const tiene = regs
      .map((d) => d.orden_arista)
      .sort((a, b) => a - b)
      .join(",");
    const debe = Array.from({ length: n }, (_, i) => i + 1).join(",");
    if (tiene !== debe)
      salida.push({
        codigo: "DECISION_SIN_REGISTRO",
        severidad: "bloqueante",
        corrida_id: corridaId,
        caso_id: t.caso_id,
        detalle: {
          es: `Paso ${p.orden} (${p.nodo}): el nodo decide con ${n} arista(s) y la traza registra ${regs.length}; sin registro no hay prueba cruzada ni playground.`,
          en: `Step ${p.orden} (${p.nodo}): the node decides with ${n} edge(s) and the trace records ${regs.length}; without a record there is no cross-check and no playground.`,
        },
      });
  }
  return salida;
}

/** RF-09.2 sobre una corrida: discrepancias contra lo registrado y huella contra Python. */
export async function rf092(
  c: CorridaLeida,
): Promise<{ resultado: ResultadoRf092; hallazgos: HallazgoDeContrato[] }> {
  const umbrales = c.manifiesto.umbrales_aplicados as Umbrales;
  const id = c.manifiesto.corrida_id;
  const porNodo = new Map<string, number>();
  for (const a of c.grafo.aristas_condicionales)
    porNodo.set(a.desde, (porNodo.get(a.desde) ?? 0) + 1);
  const incompletas = c.trazas.flatMap((t) =>
    decisionesIncompletas(t, porNodo, id),
  );
  const visitas = c.trazas.reduce(
    (n, t) => n + agruparVisitas(t.decisiones_de_arista).length,
    0,
  );
  if (incompletas.length > 0)
    // Sin los registros completos no hay nada que recalcular: se reporta, no se revienta.
    return {
      resultado: {
        corrida_id: id,
        variante: c.manifiesto.variante,
        visitas,
        discrepancias: 0,
        huella_typescript: "",
        huella_python: c.ramas.huella,
        coincide: false,
      },
      hallazgos: incompletas,
    };
  const hallazgos: HallazgoDeContrato[] = [];
  const disc = discrepanciasDeRamas(c.trazas, c.grafo, umbrales);
  for (const d of disc)
    hallazgos.push({
      codigo: "RAMA_IRREPRODUCIBLE",
      severidad: "bloqueante",
      corrida_id: id,
      caso_id: d.caso_id,
      detalle: {
        es: `Paso ${d.paso} (${d.desde}): el agente tomó «${d.registrada}» pero el plan, con los umbrales aplicados, da «${d.recalculada}».`,
        en: `Step ${d.paso} (${d.desde}): the agent took «${d.registrada}» but the plan, with the applied thresholds, gives «${d.recalculada}».`,
      },
    });
  const ts = await ramasEsperadas(
    id,
    c.trazas,
    c.grafo,
    umbrales,
    c.ramas.fuente,
  );
  if (ts.huella !== c.ramas.huella)
    hallazgos.push({
      codigo: "DERIVA_ENTRE_INTERPRETES",
      severidad: "bloqueante",
      corrida_id: id,
      caso_id: null,
      detalle: {
        es: "El intérprete TypeScript y el de Python no recalculan las mismas ramas sobre esta corrida.",
        en: "The TypeScript and Python interpreters do not recompute the same branches on this run.",
      },
    });
  return {
    resultado: {
      corrida_id: id,
      variante: c.manifiesto.variante,
      visitas,
      discrepancias: disc.length,
      huella_typescript: ts.huella,
      huella_python: c.ramas.huella,
      coincide: ts.huella === c.ramas.huella,
    },
    hallazgos,
  };
}

function ramasNoSeguidas(t: Traza, corridaId: string): HallazgoDeContrato[] {
  const salida: HallazgoDeContrato[] = [];
  for (const v of agruparVisitas(t.decisiones_de_arista)) {
    const rama = v.registros[0]?.rama_tomada;
    const siguiente = t.pasos[v.paso]?.nodo;
    if (siguiente === undefined && t.resultado === "error") continue;
    if (siguiente !== rama)
      salida.push({
        codigo: "RAMA_NO_SEGUIDA",
        severidad: "bloqueante",
        corrida_id: corridaId,
        caso_id: t.caso_id,
        detalle: {
          es: `Paso ${v.paso} (${v.desde}): registró la rama «${rama}» pero el siguiente paso fue «${siguiente ?? "ninguno"}».`,
          en: `Step ${v.paso} (${v.desde}): it recorded the «${rama}» branch but the next step was «${siguiente ?? "none"}».`,
        },
      });
  }
  return salida;
}

function pausas(t: Traza, plan: Plan, corridaId: string): HallazgoDeContrato[] {
  const salida: HallazgoDeContrato[] = [];
  const h = (codigo: CodigoContrato, es: string, en: string) =>
    salida.push({
      codigo,
      severidad: "bloqueante",
      corrida_id: corridaId,
      caso_id: t.caso_id,
      detalle: { es, en },
    });
  for (const decl of plan.contrato_de_grafo.pausas_humanas) {
    const visitas = t.pasos.filter((p) => p.nodo === decl.nodo);
    for (const v of visitas) {
      const reg = t.pausas_humanas.find(
        (p) => p.paso === v.orden && p.nodo === decl.nodo,
      );
      if (!reg) {
        h(
          "PAUSA_SIN_REGISTRO",
          `Paso ${v.orden}: el caso pasó por ${decl.nodo} sin registro de la pausa humana.`,
          `Step ${v.orden}: the case went through ${decl.nodo} with no record of the human pause.`,
        );
        continue;
      }
      if (reg.rol !== decl.rol)
        h(
          "ROL_DISTINTO",
          `Paso ${v.orden}: revisó el rol «${reg.rol}», el plan exige «${decl.rol}».`,
          `Step ${v.orden}: reviewed by role «${reg.rol}», the plan requires «${decl.rol}».`,
        );
      const faltan = decl.payload_minimo.filter(
        (k) => !Object.hasOwn(reg.payload, k),
      );
      if (faltan.length > 0)
        h(
          "PAYLOAD_INCOMPLETO",
          `Paso ${v.orden}: el revisor no vio ${faltan.join(", ")}.`,
          `Step ${v.orden}: the reviewer did not see ${faltan.join(", ")}.`,
        );
    }
    if (t.senales["pausa_humana"] === true && visitas.length === 0)
      h(
        "PAUSA_SIN_REGISTRO",
        `La señal pausa_humana es verdadera pero el caso nunca pasó por ${decl.nodo}.`,
        `The pausa_humana signal is true but the case never went through ${decl.nodo}.`,
      );
  }
  return salida;
}

/** Verifica el contrato de grafo de la corrida principal y RF-09.2 sobre todas las corridas leídas. */
export async function verificarContrato(
  plan: Plan,
  principal: CorridaLeida,
  otras: readonly CorridaLeida[],
): Promise<ResultadoContrato> {
  const c = plan.contrato_de_grafo;
  const id = principal.manifiesto.corrida_id;
  const hallazgos: HallazgoDeContrato[] = [];
  const alGrafo = (codigo: CodigoContrato, es: string, en: string) =>
    hallazgos.push({
      codigo,
      severidad: "bloqueante",
      corrida_id: id,
      caso_id: null,
      detalle: { es, en },
    });

  const enGrafo = new Map(principal.grafo.nodos.map((n) => [n.id, n.tipo]));
  const visitas = new Map<string, number>();
  for (const t of principal.trazas)
    for (const p of t.pasos)
      visitas.set(p.nodo, (visitas.get(p.nodo) ?? 0) + 1);

  const nodos = c.nodos_esperados.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    en_grafo: enGrafo.get(n.id) === n.tipo,
    visitas: visitas.get(n.id) ?? 0,
  }));
  for (const n of nodos) {
    if (!n.en_grafo)
      alGrafo(
        "NODO_AUSENTE",
        `El grafo no tiene el nodo ${n.id} de tipo ${n.tipo} que exige el plan.`,
        `The graph lacks the ${n.id} node of type ${n.tipo} the plan requires.`,
      );
    else if (n.visitas === 0)
      hallazgos.push({
        codigo: "NODO_NO_EJERCITADO",
        severidad: "alerta",
        corrida_id: id,
        caso_id: null,
        detalle: {
          es: `Ningún caso de la corrida pasó por ${n.id}: el lote no lo puso a prueba.`,
          en: `No case in the run went through ${n.id}: the batch did not put it to the test.`,
        },
      });
  }
  if (
    jcs(ordenar(principal.grafo.aristas_condicionales)) !==
    jcs(ordenar(c.aristas_condicionales))
  )
    alGrafo(
      "ARISTAS_DISTINTAS",
      "Las aristas condicionales del grafo no son las del plan.",
      "The graph's conditional edges are not the plan's.",
    );
  if (jcs(principal.grafo.ramas_por_defecto) !== jcs(ramasResueltas(plan)))
    alGrafo(
      "ARISTAS_DISTINTAS",
      "Las ramas por defecto del grafo no son las del plan.",
      "The graph's default branches are not the plan's.",
    );
  if (jcs(principal.grafo.pausas_humanas) !== jcs(c.pausas_humanas))
    alGrafo(
      "ARISTAS_DISTINTAS",
      "Las pausas humanas del grafo no son las del plan.",
      "The graph's human pauses are not the plan's.",
    );

  const obligatorias = c.senales_obligatorias_en_traza;
  const presentes = new Map<string, number>(obligatorias.map((s) => [s, 0]));
  for (const t of principal.trazas) {
    for (const s of obligatorias) {
      if (Object.hasOwn(t.senales, s))
        presentes.set(s, (presentes.get(s) ?? 0) + 1);
      else
        hallazgos.push({
          codigo: "SENAL_FALTANTE",
          severidad: "bloqueante",
          corrida_id: id,
          caso_id: t.caso_id,
          detalle: {
            es: `La traza no registra la señal obligatoria «${s}».`,
            en: `The trace does not record the mandatory «${s}» signal.`,
          },
        });
    }
    const desconocidos = [
      ...new Set(t.pasos.map((p) => p.nodo).filter((n) => !enGrafo.has(n))),
    ];
    for (const n of desconocidos)
      hallazgos.push({
        codigo: "NODO_NO_DECLARADO",
        severidad: "bloqueante",
        corrida_id: id,
        caso_id: t.caso_id,
        detalle: {
          es: `La traza pasa por «${n}», que el grafo no declara.`,
          en: `The trace goes through «${n}», which the graph does not declare.`,
        },
      });
    hallazgos.push(...ramasNoSeguidas(t, id), ...pausas(t, plan, id));
  }

  hallazgos.push(...umbralesDistintosDelPlan(plan, [principal, ...otras]));
  const rf: ResultadoRf092[] = [];
  for (const corrida of [principal, ...otras]) {
    const r = await rf092(corrida);
    rf.push(r.resultado);
    hallazgos.push(...r.hallazgos);
  }

  const decl = c.pausas_humanas[0];
  return {
    nodos,
    senales: obligatorias.map((s) => ({
      senal: s,
      presente_en: presentes.get(s) ?? 0,
      de: principal.trazas.length,
    })),
    pausas: {
      nodo: decl?.nodo ?? "",
      rol: decl?.rol ?? "",
      casos_con_pausa: principal.trazas.filter(
        (t) => t.senales["pausa_humana"] === true,
      ).length,
      pausas_registradas: principal.trazas.reduce(
        (n, t) => n + t.pausas_humanas.length,
        0,
      ),
    },
    rf_09_2: rf,
    hallazgos,
  };
}
