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

/** Entero con separador de miles: «7.083» (es) · «7,083» (en), como la maqueta. */
export function entero(n: number, idioma: Idioma): string {
  const s = String(Math.round(Math.abs(n))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    idioma === "es" ? "." : ",",
  );
  return n < 0 ? `-${s}` : s;
}

/** Decimal con `d` cifras: «11,8» (es) · «11.8» (en). */
export function decimal(x: number, d: number, idioma: Idioma): string {
  const s = x.toFixed(d);
  return idioma === "es" ? s.replace(".", ",") : s;
}

/** Un dato del plan tal cual: entero sin decimales, si no con dos («0,75» · «0.75»). */
export function numeroDato(x: number, idioma: Idioma): string {
  if (Number.isInteger(x)) return String(x);
  return decimal(x, 2, idioma);
}

/** 0,9333 con 1 decimal → «93,3 %» (es) · «93.3%» (en): para columnas que se leen alineadas (la curva). */
export function porcentajeFijo(x: number, d: number, idioma: Idioma): string {
  const s = decimal(x * 100, d, idioma);
  return idioma === "es" ? `${s}${ESPACIO_DURO}%` : `${s}%`;
}

/** Lista legible: «A, B y C» · «A, B and C». */
export function enumerar(items: readonly string[], idioma: Idioma): string {
  if (items.length <= 1) return items.join("");
  const y = idioma === "es" ? "y" : "and";
  return `${items.slice(0, -1).join(", ")} ${y} ${items[items.length - 1]}`;
}
