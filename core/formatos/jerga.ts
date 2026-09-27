/**
 * Presupuesto de los textos de líder (regla dura 12, RNF-08): ≤ 50 palabras y ≤ 1 término vigilado,
 * en español y en inglés. La lista de términos vigilados es un DATO de este módulo; un texto que la
 * viole pone el test en rojo (patrón «la regla dura que no compila»).
 */
import type { Idioma, TextoBilingue } from "./bilingue";

export const TERMINOS_VIGILADOS: Record<Idioma, readonly string[]> = {
  es: [
    "ece",
    "auroc",
    "pass^k",
    "interrupt",
    "checkpointer",
    "llm",
    "token",
    "tokens",
    "json",
    "hash",
    "sha-256",
    "endpoint",
    "pipeline",
    "prompt",
    "embedding",
    "calibración",
    "conformal",
    "determinista",
    "aurc",
    "fmea",
    "rpn",
    "langgraph",
    "langchain",
  ],
  en: [
    "ece",
    "auroc",
    "pass^k",
    "interrupt",
    "checkpointer",
    "llm",
    "token",
    "tokens",
    "json",
    "hash",
    "sha-256",
    "endpoint",
    "pipeline",
    "prompt",
    "embedding",
    "calibration",
    "conformal",
    "deterministic",
    "aurc",
    "fmea",
    "rpn",
    "langgraph",
    "langchain",
  ],
};

export const PRESUPUESTO_LIDER = { maxPalabras: 50, maxTerminos: 1 } as const;

export function contarPalabras(texto: string): number {
  return texto
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0).length;
}

function palabrasDe(texto: string): string[] {
  return texto
    .toLowerCase()
    .split(/[^\p{L}\p{N}^\-.]+/u)
    .map((p) => p.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((p) => p.length > 0);
}

/** Términos vigilados presentes en el texto (sin repetir, en orden de aparición). */
export function terminosDetectados(
  texto: string,
  idioma: Idioma,
  definidos: readonly string[] = [],
): string[] {
  const vigilados = new Set(
    TERMINOS_VIGILADOS[idioma].filter((t) => !definidos.includes(t)),
  );
  const vistos: string[] = [];
  for (const p of palabrasDe(texto))
    if (vigilados.has(p) && !vistos.includes(p)) vistos.push(p);
  return vistos;
}

export interface ResultadoPresupuesto {
  ok: boolean;
  idioma: Idioma;
  palabras: number;
  terminos: string[];
  motivos: string[];
}

export function presupuestoLider(
  texto: string,
  idioma: Idioma,
  opciones: {
    maxPalabras?: number;
    maxTerminos?: number;
    definidos?: readonly string[];
  } = {},
): ResultadoPresupuesto {
  const maxPalabras = opciones.maxPalabras ?? PRESUPUESTO_LIDER.maxPalabras;
  const maxTerminos = opciones.maxTerminos ?? PRESUPUESTO_LIDER.maxTerminos;
  const palabras = contarPalabras(texto);
  const terminos = terminosDetectados(texto, idioma, opciones.definidos ?? []);
  const motivos: string[] = [];
  if (palabras > maxPalabras)
    motivos.push(`${palabras} palabras > ${maxPalabras}`);
  if (terminos.length > maxTerminos)
    motivos.push(
      `${terminos.length} términos vigilados > ${maxTerminos}: ${terminos.join(", ")}`,
    );
  return { ok: motivos.length === 0, idioma, palabras, terminos, motivos };
}

/** Aplica el presupuesto a ambos idiomas de un texto bilingüe; falla si falla cualquiera (regla 20). */
export function presupuestoLiderBilingue(
  texto: TextoBilingue,
  opciones: {
    maxPalabras?: number;
    maxTerminos?: number;
    definidos?: readonly string[];
  } = {},
): { ok: boolean; es: ResultadoPresupuesto; en: ResultadoPresupuesto } {
  const es = presupuestoLider(texto.es, "es", opciones);
  const en = presupuestoLider(texto.en, "en", opciones);
  return { ok: es.ok && en.ok, es, en };
}
