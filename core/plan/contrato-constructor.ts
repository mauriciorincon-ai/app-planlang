/**
 * Contrato para el constructor (RF-01.6): la vista del plan que el agente (Python) y el playground (TS)
 * necesitan — nodos, aristas con `señal · operador · valor · inclusivo` y los umbrales RESUELTOS a su
 * valor del plan, ramas por defecto, pausas, señales obligatorias y evaluadores.
 */
import { esAristaTripleta, type AristaCondicional, type Plan } from "./esquema";

export type ValorUmbral = number | boolean;
export type UmbralesAplicados = Record<string, ValorUmbral>;

const REFERENCIA_UMBRAL = /^umbral\.([A-Za-z0-9_-]+)$/;

/** Umbrales del plan resueltos a su valor (`{ U1: 0.75, … }`), o con los cambios del playground. */
export function umbralesAplicados(
  plan: Plan,
  cambios: Partial<UmbralesAplicados> = {},
): UmbralesAplicados {
  const salida: UmbralesAplicados = {};
  for (const u of plan.umbrales)
    salida[u.id] = cambios[u.id] ?? u.valor_en_plan;
  return salida;
}

/**
 * Umbrales booleanos cuya señal ES el interruptor (U4 → `modo_texas`): el agente la escribe con el valor del
 * umbral, así que al mover el umbral en el playground la señal registrada debe seguirlo. Devuelve
 * `señal → id de umbral` (los umbrales numéricos comparan contra una señal observada y no se ligan).
 */
export function ligadurasDeUmbrales(plan: Plan): Record<string, string> {
  return Object.fromEntries(
    plan.umbrales
      .filter((u) => !("min" in u.rango_jugable))
      .map((u) => [u.senal, u.id]),
  );
}

/** Resuelve `umbral.Ux` con los umbrales aplicados; un literal se devuelve tal cual. */
export function resolverValor(
  valor: number | boolean | string,
  umbrales: UmbralesAplicados,
): number | boolean | string {
  if (typeof valor !== "string") return valor;
  const m = REFERENCIA_UMBRAL.exec(valor);
  if (!m) return valor;
  const id = m[1] as string;
  if (!(id in umbrales)) throw new Error(`umbral desconocido: ${id}`);
  return umbrales[id] as ValorUmbral;
}

export interface AristaResuelta {
  desde: string;
  orden: number;
  senal: string | null;
  operador: string | null;
  valor_declarado: number | boolean | string | null;
  valor_aplicado: number | boolean | string | null;
  inclusivo: boolean | null;
  funcion: { nombre: string; entradas: string[] } | null;
  si_verdadero: string;
  si_falso: string | null;
}

export interface ContratoParaConstructor {
  plan_id: string;
  plan_version: string;
  nodos: { id: string; tipo: string }[];
  aristas: AristaResuelta[];
  ramas_por_defecto: Record<string, string>;
  pausas_humanas: Plan["contrato_de_grafo"]["pausas_humanas"];
  senales_obligatorias: string[];
  evaluadores: Plan["contrato_de_grafo"]["evaluadores_requeridos"];
  umbrales_aplicados: UmbralesAplicados;
}

function resolverArista(
  a: AristaCondicional,
  umbrales: UmbralesAplicados,
): AristaResuelta {
  if (esAristaTripleta(a)) {
    return {
      desde: a.desde,
      orden: a.orden,
      senal: a.senal,
      operador: a.operador,
      valor_declarado: a.valor,
      valor_aplicado: resolverValor(a.valor, umbrales),
      inclusivo: a.inclusivo,
      funcion: null,
      si_verdadero: a.si_verdadero,
      si_falso: a.si_falso ?? null,
    };
  }
  return {
    desde: a.desde,
    orden: a.orden,
    senal: null,
    operador: null,
    valor_declarado: null,
    valor_aplicado: null,
    inclusivo: null,
    funcion: { nombre: a.funcion.nombre, entradas: [...a.funcion.entradas] },
    si_verdadero: a.si_verdadero,
    si_falso: a.si_falso ?? null,
  };
}

/** Rama por defecto de un nodo escritor: `ramas_por_defecto[nodo]` o el `si_falso` de su única arista. */
export function ramaPorDefecto(plan: Plan, nodo: string): string {
  const explicita = plan.contrato_de_grafo.ramas_por_defecto[nodo];
  if (explicita) return explicita;
  const aristas = plan.contrato_de_grafo.aristas_condicionales.filter(
    (a) => a.desde === nodo,
  );
  const unica = aristas[0];
  if (aristas.length === 1 && unica?.si_falso) return unica.si_falso;
  throw new Error(`el nodo ${nodo} no tiene rama por defecto`);
}

export function contratoParaConstructor(
  plan: Plan,
  cambios: Partial<UmbralesAplicados> = {},
): ContratoParaConstructor {
  const umbrales = umbralesAplicados(plan, cambios);
  const aristas = plan.contrato_de_grafo.aristas_condicionales
    .map((a) => resolverArista(a, umbrales))
    .sort((x, y) =>
      x.desde < y.desde ? -1 : x.desde > y.desde ? 1 : x.orden - y.orden,
    );
  const escritores = [...new Set(aristas.map((a) => a.desde))].sort();
  const ramas: Record<string, string> = {};
  for (const n of escritores) ramas[n] = ramaPorDefecto(plan, n);
  return {
    plan_id: plan.id,
    plan_version: plan.version,
    nodos: plan.contrato_de_grafo.nodos_esperados.map((n) => ({
      id: n.id,
      tipo: n.tipo,
    })),
    aristas,
    ramas_por_defecto: ramas,
    pausas_humanas: plan.contrato_de_grafo.pausas_humanas,
    senales_obligatorias: [
      ...plan.contrato_de_grafo.senales_obligatorias_en_traza,
    ],
    evaluadores: plan.contrato_de_grafo.evaluadores_requeridos,
    umbrales_aplicados: umbrales,
  };
}
