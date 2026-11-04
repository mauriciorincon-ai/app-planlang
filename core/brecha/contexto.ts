/**
 * El vocabulario con que el plan escribe sus reglas, resuelto sobre UN caso: señales de la traza,
 * campos derivados de la traza, datos del caso sintético (con su verdad conocida) y umbrales aplicados.
 * Cada clave está declarada aquí y en el manual; una regla que use otra cosa es «señal faltante».
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { JsonValor } from "../formatos/jcs";
import type { Traza } from "../formatos/traza";
import type { CasoDeDemo as Caso } from "../sintetico/de-demo";
import { DEMO_B } from "../sintetico/demo-b/esquema";
import {
  contextoDesdeObjeto,
  ErrorEvaluacion,
  type Contexto,
} from "./condiciones";

export type Umbrales = Record<string, number | boolean>;

/** Las claves del contexto además de las señales obligatorias de la traza. */
export const VOCABULARIO: Readonly<Record<string, TextoBilingue>> = {
  todos: {
    es: "Siempre verdadero: la población de todos los casos.",
    en: "Always true: the population of every case.",
  },
  caso: {
    es: "El identificador del caso (para identificador_sintetico(caso)).",
    en: "The case identifier (for identificador_sintetico(caso)).",
  },
  extraccion: {
    es: "Lo que extrajo el modelo: campos, campos faltantes y confianza (null si no hubo extracción).",
    en: "What the model extracted: fields, missing fields and confidence (null if there was no extraction).",
  },
  salida_final: {
    es: "El texto que recibe el afiliado, en español y en inglés (null si no hubo salida).",
    en: "The text the member receives, in Spanish and English (null if there was no output).",
  },
  documento_adverso: {
    es: "El documento de decisión adversa (null si la decisión no fue adversa).",
    en: "The adverse decision document (null if the decision was not adverse).",
  },
  interrupt_payload: {
    es: "Las claves que vio el revisor humano en TODAS las pausas del caso (lista vacía si no hubo pausa).",
    en: "The keys the human reviewer saw in EVERY pause of the case (empty list if there was no pause).",
  },
  error_de_esquema_en_traspaso: {
    es: "Si un nodo agotó los reintentos de salida estructurada.",
    en: "Whether a node ran out of structured-output retries.",
  },
  tipo: {
    es: "Tipo del caso sintético: normal, borde, faltante o adversario.",
    en: "Synthetic case type: normal, borde, faltante or adversario.",
  },
  subtipo: {
    es: "Subtipo del caso sintético.",
    en: "Synthetic case subtype.",
  },
  adversario_detalle: {
    es: "Qué ataca el adversario: inyeccion, dato_sensible u homonimo (null si no es adversario).",
    en: "What the adversary attacks: inyeccion, dato_sensible or homonimo (null if not adversarial).",
  },
  verdad_conocida: {
    es: "La respuesta correcta del caso, fijada al generarlo. En el demo B, `tipo_solicitante` vale «natural» cuando el caso no lo declara.",
    en: "The case's correct answer, fixed when it was generated. In demo B, `tipo_solicitante` is “natural” when the case does not declare it.",
  },
  umbral: {
    es: "Los umbrales aplicados en la corrida (umbral.U1, umbral.U2…).",
    en: "The thresholds applied in the run (umbral.U1, umbral.U2…).",
  },
  en_plazo: {
    es: "Si el caso se decidió dentro del plazo de su clase en el reloj simulado del lote. Vale null si la clase no tiene plazo (la urgencia no espera) y no existe si la corrida se verifica sin la capa de llegadas.",
    en: "Whether the case was decided within its class deadline on the batch's simulated clock. It is null if the class has no deadline (emergencies do not wait) and it does not exist if the run is verified without the arrivals layer.",
  },
};

/** La señal de confianza que miden la calibración y la curva riesgo-cobertura (supuesto S1). */
export const SENAL_DE_CONFIANZA = "senal_confianza";

function clavesDePausas(t: Traza): string[] {
  if (t.pausas_humanas.length === 0) return [];
  const [primera, ...resto] = t.pausas_humanas.map((p) =>
    Object.keys(p.payload),
  );
  return (primera as string[])
    .filter((k) => resto.every((ks) => ks.includes(k)))
    .sort();
}

/** Lo que un documento adverso tiene que traer (C8; la aprobación parcial suma su monto, plan v1.5). */
export const REQUERIDOS_DOCUMENTO = [
  "servicio",
  "causal",
  "regla_disparada",
  "datos_usados",
  "version",
  "via_de_contradiccion",
  "decidido_por",
  "aviso_ia",
] as const;
const IDIOMAS_DOCUMENTO = ["es", "en"] as const;

function textosBilingues(v: JsonValor): Record<string, JsonValor>[] {
  if (Array.isArray(v)) return v.flatMap(textosBilingues);
  if (v === null || typeof v !== "object") return [];
  const claves = Object.keys(v).sort();
  if (claves.length === 2 && claves[0] === "en" && claves[1] === "es")
    return [v];
  return Object.values(v).flatMap(textosBilingues);
}

const vacio = (v: JsonValor | undefined): boolean =>
  v === undefined ||
  v === null ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

/**
 * M-15: el verificador NO le cree al emisor. `completo` e `idiomas` del documento adverso se recalculan aquí, desde
 * sus campos: completo si trae cada campo requerido (y el monto, si aprueba en parte); un idioma cuenta si TODO texto
 * bilingüe del documento lo trae, no vacío. Lo que declaró el emisor no entra a la condición de C8.
 */
export function documentoVerificado(doc: JsonValor | undefined): JsonValor {
  if (
    doc === undefined ||
    doc === null ||
    typeof doc !== "object" ||
    Array.isArray(doc)
  )
    return null;
  const requeridos: readonly string[] =
    doc.decision === "aprobar_parcial"
      ? [...REQUERIDOS_DOCUMENTO, "monto"]
      : REQUERIDOS_DOCUMENTO;
  const textos = textosBilingues(doc);
  return {
    ...doc,
    completo: requeridos.every((k) => !vacio(doc[k])),
    idiomas: IDIOMAS_DOCUMENTO.filter(
      (i) =>
        textos.length > 0 &&
        textos.every((t) => typeof t[i] === "string" && t[i].trim() !== ""),
    ),
  };
}

/**
 * La verdad conocida tal como la leen las reglas. En el demo B, `tipo_solicitante` es opcional en el dato (los lotes
 * anteriores al S9 no lo traen, y sus bytes no cambian) y su ausencia significa «persona natural», como lo entiende el
 * agente simulado. Sin este valor por omisión, una regla cuya población dice `tipo_solicitante == 'juridica'` dejaría a
 * cada persona natural dentro de la población como «no evaluable», en vez de fuera de ella.
 */
function verdadDeCaso(caso: Caso): JsonValor {
  const v = caso.verdad_conocida as unknown as { [k: string]: JsonValor };
  return caso.demo_id === DEMO_B && v["tipo_solicitante"] === undefined
    ? { ...v, tipo_solicitante: "natural" }
    : (v as JsonValor);
}

/** Si el caso se decidió en plazo, según la cola del lote: por id de caso. Ausente = el lote no trae llegadas. */
export type EnPlazoPorCaso = ReadonlyMap<string, boolean | null>;

export function objetoDeCaso(
  caso: Caso,
  traza: Traza,
  umbrales: Umbrales,
  enPlazo?: EnPlazoPorCaso,
): Record<string, JsonValor> {
  return {
    ...traza.senales,
    // S9: solo existe si el lote trae su capa de llegadas; sin ella la regla queda «señal faltante», no «incumple».
    ...(enPlazo ? { en_plazo: enPlazo.get(caso.id) ?? null } : {}),
    todos: true,
    caso: caso.id,
    extraccion: (traza.extraccion ?? null) as JsonValor,
    salida_final: traza.salida_final
      ? `${traza.salida_final.es}\n${traza.salida_final.en}`
      : null,
    documento_adverso: documentoVerificado(
      (traza.documento_adverso ?? null) as JsonValor,
    ),
    interrupt_payload: clavesDePausas(traza),
    error_de_esquema_en_traspaso: traza.error_de_esquema_en_traspaso,
    tipo: caso.tipo,
    subtipo: caso.subtipo,
    adversario_detalle: caso.adversario_detalle,
    verdad_conocida: verdadDeCaso(caso),
    umbral: umbrales,
  };
}

export function contextoDeCaso(
  caso: Caso,
  traza: Traza,
  umbrales: Umbrales,
  enPlazo?: EnPlazoPorCaso,
): Contexto {
  return contextoDeObjeto(caso, objetoDeCaso(caso, traza, umbrales, enPlazo));
}

/**
 * El contexto de un caso sobre un objeto ya armado (el de `objetoDeCaso` o uno derivado: el playground lo usa
 * con el desenlace de un camino que el agente no tomó).
 */
export function contextoDeObjeto(
  caso: Caso,
  objeto: Record<string, JsonValor>,
): Contexto {
  return contextoDesdeObjeto(objeto, {
    identificador_sintetico: (id) => {
      if (id !== caso.id)
        throw new ErrorEvaluacion(
          `identificador_sintetico solo conoce el caso en curso (${caso.id})`,
        );
      return [...caso.identificadores_sinteticos];
    },
  });
}

export interface VistaDeCaso {
  caso_id: string;
  caso: Caso;
  traza: Traza;
  ctx: Contexto;
}

/** Lo que una regla necesita de una unidad medida: su id y su contexto (un caso o una sesión). */
export interface VistaEvaluable {
  caso_id: string;
  ctx: Contexto;
}

/** Lo que el contexto de una sesión expone a los detectores de ámbito `sesion` (M-14). */
export const CLAVES_DE_SESION = [
  "todos",
  "limites_alcanzados",
  "detenida_por",
  "casos_ejecutados",
] as const;

/** Las funciones que una condición puede llamar: las que `contextoDeObjeto` registra. */
export const FUNCIONES_DE_CONDICION = ["identificador_sintetico"] as const;

/**
 * Vistas de las sesiones de una corrida para los detectores de ámbito `sesion` (M-14): el id es `sesion-N` y el
 * contexto expone `todos` (como el de caso), `limites_alcanzados`, `detenida_por` y `casos_ejecutados` (cuántos
 * casos corrió la sesión).
 */
export function vistasDeSesiones(
  sesiones: readonly {
    numero: number;
    limites_alcanzados: number;
    detenida_por?: string | null;
    casos_ejecutados: readonly string[];
  }[],
): VistaEvaluable[] {
  return sesiones.map((s) => ({
    caso_id: `sesion-${s.numero}`,
    ctx: contextoDesdeObjeto({
      todos: true,
      limites_alcanzados: s.limites_alcanzados,
      detenida_por: s.detenida_por ?? null,
      casos_ejecutados: s.casos_ejecutados.length,
    }),
  }));
}

export function vistasDeCorrida(
  trazas: readonly Traza[],
  casos: ReadonlyMap<string, Caso>,
  umbrales: Umbrales,
  enPlazo?: EnPlazoPorCaso,
): VistaDeCaso[] {
  return trazas.map((traza) => {
    const caso = casos.get(traza.caso_id) as Caso;
    return {
      caso_id: traza.caso_id,
      caso,
      traza,
      ctx: contextoDeCaso(caso, traza, umbrales, enPlazo),
    };
  });
}
