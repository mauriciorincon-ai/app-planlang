/**
 * Formato de números para la vitrina (design-system § 3): coma decimal en español, punto en inglés; la
 * cifra y su signo van unidos por un espacio duro («89 %» no se parte al final de la línea); todo texto
 * armado con un número concuerda con él.
 */
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import { pct } from "@core/brecha/numeros";

export const ESPACIO_DURO = " ";

/** 0,89 → «89 %» (es) · «89%» (en), sin partirse. */
export function porcentaje(x: number, idioma: Idioma): string {
  return pct(x, idioma).replace(" ", ESPACIO_DURO);
}

/** «1 falla» · «2 fallas»: elige la forma por el número y los une con espacio duro. */
export function conteo(
  n: number,
  forma: { uno: TextoBilingue; varios: TextoBilingue },
  idioma: Idioma,
): string {
  return `${n}${ESPACIO_DURO}${(n === 1 ? forma.uno : forma.varios)[idioma]}`;
}

/** «1.2.0» → «v1.2»: la versión corta con que se nombra un plan en la vitrina. */
export function versionCorta(version: string): string {
  const [mayor, menor] = version.split(".");
  return `v${mayor}.${menor ?? "0"}`;
}

/** «a de b» / «a of b» con espacios duros alrededor de la preposición corta. */
export function deCada(a: number, b: number, idioma: Idioma): string {
  return `${a}${ESPACIO_DURO}${idioma === "es" ? "de" : "of"}${ESPACIO_DURO}${b}`;
}
