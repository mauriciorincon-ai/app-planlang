/**
 * Texto bilingüe (regla 20 / apartado 6-B): todo texto de producto nace como mapa `{ es, en }`,
 * redactado en ambos idiomas, nunca traducido en tiempo de ejecución.
 *
 * Sin Zod a propósito: los diccionarios de la vitrina importan `tb` desde aquí y viajan a la isla del playground;
 * los esquemas viven en `bilingue-esquema.ts` (con Zod en este módulo, el navegador cargaba 100 KB comprimidos de
 * más y el LCP del playground quedaba en el borde del presupuesto).
 */

export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

// Alias y no `interface`: como el `z.infer` que reemplaza, admite la firma de índice implícita.
export type TextoBilingue = { es: string; en: string };

export function tb(es: string, en: string): TextoBilingue {
  return { es, en };
}

/**
 * Texto de un campo que en planes anteriores a la v1.3 era monolingüe (M-25): una cadena o un mapa `{ es, en }`.
 * Una cadena es texto en español que no se redactó en inglés: se muestra tal cual en los dos idiomas y la vitrina
 * lo marca como texto original en español (nunca se traduce).
 */
export type TextoLibre = string | TextoBilingue;

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
