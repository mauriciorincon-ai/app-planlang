/**
 * Texto bilingüe (regla 20 / apartado 6-B): todo texto de producto nace como mapa `{ es, en }`,
 * redactado en ambos idiomas, nunca traducido en tiempo de ejecución.
 */
import { z } from "zod";

export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const TextoBilingueSchema = z
  .object({ es: z.string().min(1), en: z.string().min(1) })
  .strict();
export type TextoBilingue = z.infer<typeof TextoBilingueSchema>;

export function tb(es: string, en: string): TextoBilingue {
  return { es, en };
}

/**
 * Texto de un campo que en planes anteriores a la v1.3 era monolingüe (M-25): acepta una cadena o un mapa
 * `{ es, en }`. Una cadena es texto en español que no se redactó en inglés: se muestra tal cual en los dos
 * idiomas y la vitrina lo marca como texto original en español (nunca se traduce).
 */
export const TextoLibreSchema = z.union([
  z.string().min(1),
  TextoBilingueSchema,
]);
export type TextoLibre = z.infer<typeof TextoLibreSchema>;

export function comoBilingue(texto: TextoLibre): TextoBilingue {
  return typeof texto === "string" ? { es: texto, en: texto } : texto;
}

export function esMonolingue(texto: TextoLibre): texto is string {
  return typeof texto === "string";
}

/** Selecciona un idioma de un texto bilingüe. */
export function t(texto: TextoBilingue, idioma: Idioma): string {
  return texto[idioma];
}
