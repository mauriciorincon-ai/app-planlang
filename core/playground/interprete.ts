/**
 * Intérprete mínimo de las aristas del plan — el lado TypeScript de RF-09.2 (regla dura 2).
 *
 * Misma semántica que `agents/src/app_agents/reglas_arista.py`; la CI compara ambos sobre toda corrida
 * versionada (`tests/unit/core/playground/rf-09-2.test.ts`): con los umbrales del plan, el recálculo
 * debe reproducir la rama que tomó el agente y la huella de `ramas-esperadas.json` que escribió Python.
 *
 * - `igual_a` / `distinto_de`: igualdad ESTRICTA de tipo (`true` no es `1`); ignoran `inclusivo`.
 * - `menor_que` / `mayor_que`: estrictos; con `inclusivo: true` pasan a `<=` / `>=`.
 * - `menor_o_igual_que` / `mayor_o_igual_que`: siempre inclusivos.
 * - Orden solo entre números; una señal ausente es error, jamás `false`.
 * - `valor` literal o `umbral.Ux`, resuelto con los umbrales aplicados de la corrida.
 */
import { conHuella } from "../formatos/huella";
import { jcs, type JsonValor } from "../formatos/jcs";
import {
  FORMATO_RAMAS,
  type DecisionDeArista,
  type RamasEsperadas,
  type Traza,
  type Visita,
} from "../formatos/traza";
import {
  esAristaTripleta,
  type AristaCondicional,
  type Operador,
} from "../plan/esquema";

export type Umbrales = Record<string, number | boolean>;
export type Senales = Record<string, JsonValor>;

/** Orden de cadenas por unidades UTF-16, como `sorted()` de Python sobre ASCII (sin `Intl`). */
export function compararCadenas(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class ErrorArista extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorArista";
  }
}

type FuncionDeArista = {
  entradas: readonly string[];
  fn: (...args: JsonValor[]) => boolean;
};

/** Funciones nombradas del plan: registro cerrado, igual al de Python. */
export const FUNCIONES: Readonly<Record<string, FuncionDeArista>> = {
  texas_y_no_aprobar: {
    entradas: ["modo_texas", "propuesta"],
    fn: (modoTexas, propuesta) => modoTexas === true && propuesta !== "aprobar",
  },
};

export function resolverValor(valor: JsonValor, umbrales: Umbrales): JsonValor {
  if (typeof valor === "string" && valor.startsWith("umbral.")) {
    const clave = valor.slice("umbral.".length);
    if (!Object.hasOwn(umbrales, clave))
      throw new ErrorArista(`umbral desconocido: ${valor}`);
    return umbrales[clave] as number | boolean;
  }
  return valor;
}

function igual(a: JsonValor, b: JsonValor): boolean {
  if (typeof a === "object" || typeof b === "object") {
    if (a === null || b === null) return a === b;
    return jcs(a) === jcs(b);
  }
  return a === b;
}

export function comparar(
  observado: JsonValor,
  operador: Operador,
  declarado: JsonValor,
  inclusivo: boolean,
): boolean {
  if (operador === "igual_a") return igual(observado, declarado);
  if (operador === "distinto_de") return !igual(observado, declarado);
  if (typeof observado !== "number" || typeof declarado !== "number")
    throw new ErrorArista(
      `${operador} exige números: ${jcs(observado)} vs ${jcs(declarado)}`,
    );
  switch (operador) {
    case "menor_que":
      return inclusivo ? observado <= declarado : observado < declarado;
    case "mayor_que":
      return inclusivo ? observado >= declarado : observado > declarado;
    case "menor_o_igual_que":
      return observado <= declarado;
    case "mayor_o_igual_que":
      return observado >= declarado;
  }
}

function senal(senales: Senales, nombre: string): JsonValor {
  if (!Object.hasOwn(senales, nombre))
    throw new ErrorArista(`señal ausente en el estado: ${nombre}`);
  return senales[nombre] as JsonValor;
}

export interface RegistroDeArista {
  desde: string;
  orden_arista: number;
  tipo: "tripleta" | "funcion";
  senal: string | null;
  valor_observado: JsonValor;
  operador: Operador | null;
  valor_declarado: JsonValor;
  umbral_aplicado: JsonValor;
  inclusivo: boolean | null;
  funcion: string | null;
  entradas: Record<string, JsonValor> | null;
  resultado: boolean;
}

export function evaluarArista(
  arista: AristaCondicional,
  senales: Senales,
  umbrales: Umbrales,
): RegistroDeArista {
  const base = {
    desde: arista.desde,
    orden_arista: arista.orden,
    entradas: null,
    funcion: null,
    inclusivo: null,
    operador: null,
    senal: null,
    umbral_aplicado: null,
    valor_declarado: null,
    valor_observado: null,
  };
  if (!esAristaTripleta(arista)) {
    const registrada = FUNCIONES[arista.funcion.nombre];
    if (!registrada)
      throw new ErrorArista(
        `función de arista no registrada: ${arista.funcion.nombre}`,
      );
    const entradas: Record<string, JsonValor> = {};
    for (const k of registrada.entradas) entradas[k] = senal(senales, k);
    return {
      ...base,
      tipo: "funcion",
      funcion: arista.funcion.nombre,
      entradas,
      resultado: registrada.fn(
        ...registrada.entradas.map((k) => entradas[k] as JsonValor),
      ),
    };
  }
  const observado = senal(senales, arista.senal);
  const aplicado = resolverValor(arista.valor, umbrales);
  return {
    ...base,
    tipo: "tripleta",
    senal: arista.senal,
    valor_observado: observado,
    operador: arista.operador,
    valor_declarado: arista.valor,
    umbral_aplicado: aplicado,
    inclusivo: arista.inclusivo,
    resultado: comparar(observado, arista.operador, aplicado, arista.inclusivo),
  };
}

/** Evalúa TODAS las aristas de un nodo escritor en orden → rama (primera verdadera; si ninguna, la de defecto). */
export function decidir(
  aristas: readonly AristaCondicional[],
  ramaPorDefecto: string,
  senales: Senales,
  umbrales: Umbrales,
): { rama: string; registros: RegistroDeArista[] } {
  const ordenadas = [...aristas].sort((a, b) => a.orden - b.orden);
  const registros = ordenadas.map((a) => evaluarArista(a, senales, umbrales));
  const i = registros.findIndex((r) => r.resultado);
  const rama =
    i >= 0 ? (ordenadas[i] as AristaCondicional).si_verdadero : ramaPorDefecto;
  return { rama, registros };
}

/** Las señales de una visita tal como se observaron, reconstruidas desde sus registros. */
export function senalesDeVisita(
  registros: readonly DecisionDeArista[],
): Senales {
  const senales: Senales = {};
  for (const r of registros) {
    if (r.tipo === "funcion") Object.assign(senales, r.entradas ?? {});
    else if (r.senal !== null) senales[r.senal] = r.valor_observado;
  }
  return senales;
}

export type VisitaRecalculada = Omit<Visita, "caso_id">;

/** Agrupa los registros por visita `(paso, desde)`, en el orden en que Python las ordena. */
export function agruparVisitas(
  decisiones: readonly DecisionDeArista[],
): { paso: number; desde: string; registros: DecisionDeArista[] }[] {
  const mapa = new Map<
    string,
    { paso: number; desde: string; registros: DecisionDeArista[] }
  >();
  for (const d of decisiones) {
    const clave = `${d.paso}\u0000${d.desde}`;
    const v = mapa.get(clave) ?? {
      paso: d.paso,
      desde: d.desde,
      registros: [],
    };
    v.registros.push(d);
    mapa.set(clave, v);
  }
  return [...mapa.values()].sort(
    (a, b) => a.paso - b.paso || compararCadenas(a.desde, b.desde),
  );
}

/** Recalcula cada visita de nodo escritor desde lo observado y con los umbrales dados. */
export function recalcular(
  decisiones: readonly DecisionDeArista[],
  aristas: readonly AristaCondicional[],
  ramasPorDefecto: Readonly<Record<string, string>>,
  umbrales: Umbrales,
): VisitaRecalculada[] {
  return agruparVisitas(decisiones).map(({ paso, desde, registros }) => {
    const defecto = ramasPorDefecto[desde];
    if (defecto === undefined)
      throw new ErrorArista(`nodo escritor sin rama por defecto: ${desde}`);
    const propias = aristas.filter((a) => a.desde === desde);
    const { rama, registros: nuevos } = decidir(
      propias,
      defecto,
      senalesDeVisita(registros),
      umbrales,
    );
    return {
      desde,
      paso,
      rama_tomada: rama,
      resultados: nuevos.map((r) => r.resultado),
    };
  });
}

/** El mismo objeto que escribe Python en `ramas-esperadas.json`, calculado aquí (misma huella = mismo resultado). */
export async function ramasEsperadas(
  corridaId: string,
  trazas: readonly Traza[],
  grafo: {
    aristas_condicionales: readonly AristaCondicional[];
    ramas_por_defecto: Readonly<Record<string, string>>;
  },
  umbrales: Umbrales,
  fuente: string,
): Promise<RamasEsperadas> {
  const visitas: Visita[] = [];
  const ordenadas = [...trazas].sort((a, b) =>
    compararCadenas(a.caso_id, b.caso_id),
  );
  for (const t of ordenadas)
    for (const v of recalcular(
      t.decisiones_de_arista,
      grafo.aristas_condicionales,
      grafo.ramas_por_defecto,
      umbrales,
    ))
      visitas.push({ caso_id: t.caso_id, ...v });
  const objeto = {
    formato: FORMATO_RAMAS,
    corrida_id: corridaId,
    fuente,
    umbrales_aplicados: umbrales,
    visitas,
  };
  return (await conHuella(
    objeto as unknown as Record<string, JsonValor>,
  )) as unknown as RamasEsperadas;
}

export interface DiscrepanciaDeRama {
  caso_id: string;
  paso: number;
  desde: string;
  registrada: string;
  recalculada: string;
  resultados_registrados: boolean[];
  resultados_recalculados: boolean[];
}

/** RF-09.2 contra lo que el agente REGISTRÓ: cada visita recalculada debe dar la misma rama y los mismos resultados. */
export function discrepanciasDeRamas(
  trazas: readonly Traza[],
  grafo: {
    aristas_condicionales: readonly AristaCondicional[];
    ramas_por_defecto: Readonly<Record<string, string>>;
  },
  umbrales: Umbrales,
): DiscrepanciaDeRama[] {
  const salida: DiscrepanciaDeRama[] = [];
  for (const t of trazas) {
    const recalculadas = recalcular(
      t.decisiones_de_arista,
      grafo.aristas_condicionales,
      grafo.ramas_por_defecto,
      umbrales,
    );
    const registradas = agruparVisitas(t.decisiones_de_arista);
    recalculadas.forEach((r, i) => {
      const reg = registradas[i] as (typeof registradas)[number];
      const ordenados = [...reg.registros].sort(
        (a, b) => a.orden_arista - b.orden_arista,
      );
      const rama = (ordenados[0] as DecisionDeArista).rama_tomada;
      const resultados = ordenados.map((d) => d.resultado);
      if (
        rama !== r.rama_tomada ||
        jcs(resultados) !== jcs(r.resultados) ||
        ordenados.some((d) => d.rama_tomada !== rama)
      )
        salida.push({
          caso_id: t.caso_id,
          paso: r.paso,
          desde: r.desde,
          registrada: rama,
          recalculada: r.rama_tomada,
          resultados_registrados: resultados,
          resultados_recalculados: r.resultados,
        });
    });
  }
  return salida;
}
