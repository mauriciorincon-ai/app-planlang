/**
 * La evaluación pura de las aristas del plan: comparar, evaluar una arista, decidir la rama de un nodo escritor y
 * recalcular UNA visita desde lo que observó. Es el corazón que comparten RF-09.2 (`interprete.ts`, sobre toda
 * corrida versionada) y el playground (`consecuencias.ts`, en el navegador con los umbrales que mueve el visitante):
 * el mismo código, no dos copias que coinciden.
 *
 * Solo importa TIPOS de `plan/esquema` y `formatos/traza`: así el navegador no carga Zod para mover un umbral.
 * La semántica está documentada en `interprete.ts` (y es la de `agents/src/app_agents/reglas_arista.py`).
 */
import { jcs, type JsonValor } from "../formatos/jcs";
import type { DecisionDeArista } from "../formatos/traza";
import type {
  AristaCondicional,
  AristaTripleta,
  Operador,
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

/** Igual que `esAristaTripleta` de `plan/esquema`, sin importar el módulo de Zod. */
function esTripleta(a: AristaCondicional): a is AristaTripleta {
  return "senal" in a;
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

const DE_ORDEN: readonly string[] = [
  "menor_que",
  "mayor_que",
  "menor_o_igual_que",
  "mayor_o_igual_que",
];

export function comparar(
  observado: JsonValor,
  operador: Operador,
  declarado: JsonValor,
  inclusivo: boolean,
): boolean {
  // Una señal nula no se observó (el nodo no pudo medirla: sin proveedor, AU-9): no cumple ninguna comparación, ni de
  // igualdad ni de orden — «distinto de» tampoco (AU-S2-B51, igual en reglas_arista.py). Ausente sigue siendo error.
  if (operador === "igual_a") return igual(observado, declarado);
  if (operador === "distinto_de")
    return observado !== null && !igual(observado, declarado);
  // En el navegador no hay Zod que filtre el plan: un operador desconocido falla con nombre, como en Python, y no cae
  // a la rama por defecto (AU-S2-B52).
  if (!DE_ORDEN.includes(operador))
    throw new ErrorArista(`operador desconocido: ${operador}`);
  if (observado === null && typeof declarado === "number") return false;
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
  if (!esTripleta(arista)) {
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

/**
 * Recalcula UNA visita de un nodo escritor desde las señales que observó. `ligaduras` (`señal → id de umbral`)
 * nombra las señales que SON un umbral (un interruptor como el modo Texas): su valor registrado se reemplaza por el
 * del umbral aplicado. Sin ligaduras (RF-09.2) se usa exactamente lo registrado.
 */
export function recalcularVisita(
  desde: string,
  observadas: Senales,
  aristas: readonly AristaCondicional[],
  ramasPorDefecto: Readonly<Record<string, string>>,
  umbrales: Umbrales,
  ligaduras: Readonly<Record<string, string>> = {},
): { rama: string; registros: RegistroDeArista[] } {
  const defecto = ramasPorDefecto[desde];
  if (defecto === undefined)
    throw new ErrorArista(`nodo escritor sin rama por defecto: ${desde}`);
  const senales = { ...observadas };
  for (const [s, id] of Object.entries(ligaduras))
    if (Object.hasOwn(senales, s) && Object.hasOwn(umbrales, id))
      senales[s] = umbrales[id] as JsonValor;
  return decidir(
    aristas.filter((a) => a.desde === desde),
    defecto,
    senales,
    umbrales,
  );
}
