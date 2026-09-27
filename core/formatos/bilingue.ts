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

/** Selecciona un idioma de un texto bilingüe. */
export function t(texto: TextoBilingue, idioma: Idioma): string {
  return texto[idioma];
}
