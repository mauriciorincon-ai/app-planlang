import { esAristaTripleta, type Plan, type Umbral } from "@core/plan/esquema";
import type { IdDemo } from "@/lib/demos";

/**
 * La categoría de cada regla del plan (una arista condicional), por demo, por su señal (y el nodo que la lee, si la
 * misma señal decide en dos nodos con dos sentidos) o por su función nombrada. Es la única lista cerrada de reglas que
 * conoce la vitrina: de ella salen el motivo de una pausa, la rama que se narra en un caso y el nombre corto de una
 * regla en el lienzo. Una regla que no esté aquí detiene el build nombrándola, en lugar de narrarse con el texto de
 * otra (AU-S2-1).
 */
export type CategoriaRegla =
  | "urgencia"
  | "exento"
  | "faltantes"
  | "proveedor"
  | "tope"
  | "confianza"
  | "altoCosto"
  | "contradiccion"
  | "negar"
  | "texas"
  // Demo B (plan B v1): vinculación con debida diligencia.
  | "carga"
  | "zonaGris"
  | "coincidencia"
  | "mismaPersona"
  | "riesgo"
  | "inconsistencias"
  | "rechazar";

const POR_SENAL_A: Readonly<Record<string, CategoriaRegla>> = {
  // M-16 (plan v1.5): la guardia de entrada deja la señal y la decisión la manda a una persona.
  carga_detectada: "carga",
  tipo_atencion: "urgencia",
  servicio_exento: "exento",
  campos_faltantes_count: "faltantes",
  proveedor_no_disponible: "proveedor",
  ciclos_aclaracion: "tope",
  senal_confianza: "confianza",
  costo_estimado: "altoCosto",
  contradiccion_orden_texto: "contradiccion",
  propuesta: "negar",
};

const POR_FUNCION_A: Readonly<Record<string, CategoriaRegla>> = {
  texas_y_no_aprobar: "texas",
};

/** En el B, `similitud_max` decide en dos nodos: hacia el investigador (zona gris) y hacia el oficial (coincidencia). */
const POR_SENAL_B: Readonly<Record<string, CategoriaRegla>> = {
  carga_detectada: "carga",
  "verificador_listas:similitud_max": "zonaGris",
  "decision:similitud_max": "coincidencia",
  conclusion_investigador: "mismaPersona",
  puntaje_riesgo: "riesgo",
  inconsistencias: "inconsistencias",
  propuesta: "rechazar",
};

const REGLAS: Readonly<
  Record<
    IdDemo,
    {
      senal: Readonly<Record<string, CategoriaRegla>>;
      funcion: Readonly<Record<string, CategoriaRegla>>;
    }
  >
> = {
  "demo-a": { senal: POR_SENAL_A, funcion: POR_FUNCION_A },
  "demo-b": { senal: POR_SENAL_B, funcion: {} },
};

/** Las categorías de cada demo, en el orden en que se declaran (para recorrerlas o iniciar un conteo en cero). */
export const CATEGORIAS: Readonly<Record<IdDemo, readonly CategoriaRegla[]>> = {
  "demo-a": [
    "urgencia",
    "exento",
    "faltantes",
    "proveedor",
    "tope",
    "confianza",
    "altoCosto",
    "contradiccion",
    "negar",
    "texas",
    "carga",
  ],
  "demo-b": [
    "carga",
    "zonaGris",
    "coincidencia",
    "mismaPersona",
    "riesgo",
    "inconsistencias",
    "rechazar",
  ],
};

/** La regla tal como la registra una traza (`senal` o `funcion`) o la declara el plan; `desde`, el nodo que decide. */
export interface ReglaNombrada {
  senal: string | null;
  funcion: string | null;
  desde?: string;
}

/** La categoría de una regla en su demo. Una regla sin categoría detiene el build nombrándola. */
export function categoriaDeRegla(
  r: ReglaNombrada,
  demo: IdDemo = "demo-a",
): CategoriaRegla {
  const m = REGLAS[demo];
  const c =
    r.senal !== null
      ? ((r.desde !== undefined
          ? m.senal[`${r.desde}:${r.senal}`]
          : undefined) ?? m.senal[r.senal])
      : r.funcion !== null
        ? m.funcion[r.funcion]
        : undefined;
  if (c === undefined)
    throw new Error(
      `vitrina: la regla «${r.senal ?? r.funcion ?? "sin nombre"}» no tiene categoría en src/lib/vista/motivo-pausa.ts; añádela con sus textos ES/EN.`,
    );
  return c;
}

/** Una arista del plan como `ReglaNombrada` (la tripleta lleva `senal`; la función, `funcion.nombre`). */
export function reglaDelPlan(a: {
  desde?: string;
  senal?: string;
  funcion?: { nombre: string };
}): ReglaNombrada {
  return {
    senal: a.senal ?? null,
    funcion: a.funcion?.nombre ?? null,
    ...(a.desde !== undefined ? { desde: a.desde } : {}),
  };
}

/** Busca el texto de una categoría y, si falta, detiene el build nombrando el diccionario y la categoría. */
export function textoDeCategoria<T>(
  textos: Readonly<Record<string, T>>,
  c: string,
  donde: string,
): T {
  const t = textos[c];
  if (t === undefined)
    throw new Error(
      `vitrina: ${donde} no tiene texto para la categoría «${c}»; añádelo en ES y EN.`,
    );
  return t;
}

interface DecisionRegistrada extends ReglaNombrada {
  desde: string;
  orden_arista: number;
  resultado: boolean;
}

/**
 * La regla que mandó un caso a la pausa: la arista que registra `payload.motivo` (`desde` y `orden_arista`), tal
 * como la evaluó el grafo. Sin motivo o sin esa arista en la traza, detiene el build nombrando el caso.
 */
export function reglaDeLaPausa(
  casoId: string,
  motivo: unknown,
  decisiones: readonly DecisionRegistrada[],
): DecisionRegistrada {
  const m = motivo as { desde?: unknown; orden_arista?: unknown } | undefined;
  const x = decisiones.find(
    (y) =>
      y.desde === m?.desde && y.orden_arista === m?.orden_arista && y.resultado,
  );
  if (!x)
    throw new Error(
      `vitrina: la pausa de ${casoId} no apunta a una arista registrada que se haya cumplido (motivo ${JSON.stringify(m ?? null)}).`,
    );
  return x;
}

/**
 * El umbral que lee la regla de una categoría (p. ej. el tope de aclaraciones): la arista del plan con esa
 * categoría cuyo valor es `umbral.<id>`. Sin esa regla, o si no lee un umbral, detiene el build nombrándola.
 */
export function umbralDeCategoria(
  plan: Plan,
  c: CategoriaRegla,
  demo: IdDemo = "demo-a",
): Umbral {
  const a = plan.contrato_de_grafo.aristas_condicionales.find(
    (x) => categoriaDeRegla(reglaDelPlan(x), demo) === c,
  );
  const id =
    a && esAristaTripleta(a) && typeof a.valor === "string"
      ? a.valor.startsWith("umbral.")
        ? a.valor.slice("umbral.".length)
        : null
      : null;
  const u = id ? plan.umbrales.find((x) => x.id === id) : undefined;
  if (!u)
    throw new Error(
      `vitrina: el plan no tiene una regla «${c}» que lea un umbral declarado; la página no puede citar su valor.`,
    );
  return u;
}
