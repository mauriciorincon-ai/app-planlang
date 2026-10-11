/**
 * Forma de la comparación de dos corridas (S4): lo que mide cada lado por separado y lo que los separa. Es de datos, sin
 * texto de pantalla; las etiquetas de los criterios y de los riesgos vienen del plan, ya bilingües.
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { EstadoCriterio, ResultadoCriterio } from "../brecha/criterios";
import type { EstadoRiesgo } from "../brecha/detectores";
import type { Veredicto } from "../brecha/veredicto";

export const FORMATO_COMPARACION = "planlang-comparacion/v1";
/** 1.0.0 (S4): primera versión; el formato se sella con la huella de la comparación entera. */
export const VERSION_COMPARACION = "1.0.0";

export const LADOS = ["multiagente", "agente_unico"] as const;
export type Lado = (typeof LADOS)[number];
export type PorLado<T> = Record<Lado, T>;

/**
 * Qué hizo la pausa frente a la verdad conocida. `necesaria`: el caso debía escalar y se pausó; `innecesaria`: se pausó
 * un caso que no lo pedía; `omitida`: debía escalar y no se pausó; `sin_pausa_correcta`: no debía escalar y no se pausó.
 */
export const CATEGORIAS_DE_PAUSA = [
  "necesaria",
  "innecesaria",
  "omitida",
  "sin_pausa_correcta",
] as const;
export type CategoriaDePausa = (typeof CATEGORIAS_DE_PAUSA)[number];

export type ResumenDeLado = {
  veredicto: { valor: Veredicto; bloqueantes: TextoBilingue[]; alertas: TextoBilingue[] };
  /** La exactitud de la regla S3 (decisión y pausa a la vez, contra la verdad), redondeada a 4 decimales. */
  exactitud: number;
  latencia_mediana_s: number | null;
  decisiones: {
    /** La decisión final coincide con la verdad conocida. */
    correctas: number;
    propuesta_correcta: number;
    propuesta_incorrecta: number;
    /** El agente no llegó a proponer una decisión (la traza no tiene propuesta). */
    propuesta_ausente: number;
  };
  pausas: Record<CategoriaDePausa, number>;
  presupuesto: { llamadas_al_modelo: number; tokens: number; costo_nominal_usd: number };
};

export type CriterioComparado = {
  id: string;
  enunciado: TextoBilingue;
  tipo: ResultadoCriterio["tipo"];
  objetivo: number | boolean;
  por_lado: PorLado<{
    estado: EstadoCriterio;
    /** `null` cuando la corrida no registra la señal que el criterio mide: se muestra como «no observado». */
    valor_medido: number | boolean | null;
  }>;
};

export type RiesgoComparado = {
  id: string;
  modo: TextoBilingue;
  severidad: number;
  /** El umbral del plan que decide la ocurrencia (p. ej. `> 0.10`): la tasa de `valor` se compara con él. */
  ocurre_si: string | null;
  por_lado: PorLado<{
    estado: EstadoRiesgo;
    /** Casos que cumplen la condición del detector. No basta para decir que el riesgo ocurrió: decide `valor`. */
    casos_marcados: number;
    valor: number | null;
  }>;
};

export type FilaDeCaso = {
  decision_final: string | null;
  propuesta: string | null;
  pausa: boolean;
};

export type CasoQueDifiere = {
  id: string;
  verdad: { decision: string; debe_escalar: boolean };
  por_lado: PorLado<FilaDeCaso>;
};

export type Comparacion = {
  formato: typeof FORMATO_COMPARACION;
  version_comparacion: string;
  version_verificador: string;
  plan: {
    id: string;
    version: string;
    huella: string;
    /** El plan con que se ejecutaron las corridas (ADR-005: puede ser una versión anterior con la misma verdad). */
    de_ejecucion: { version: string; huella: string };
  };
  lote: { id: string; huella: string; n: number };
  corridas: PorLado<{ corrida_id: string; huella: string }>;
  lados: PorLado<ResumenDeLado>;
  criterios: CriterioComparado[];
  riesgos: RiesgoComparado[];
  casos_que_difieren: CasoQueDifiere[];
  huella: string;
};
