/**
 * Supuestos (contrato § 1.3): un supuesto de criticidad `alta` exige `prueba_barata` no vacía (C05).
 * Un texto bilingüe cuenta como vacío si CUALQUIERA de sus idiomas está vacío (regla 20).
 */
import type { SupuestoMinimo, TextoOMapa } from "./tipos";

export function textoVacio(t: TextoOMapa | undefined | null): boolean {
  if (t === undefined || t === null) return true;
  if (typeof t === "string") return t.trim().length === 0;
  return t.es.trim().length === 0 || t.en.trim().length === 0;
}

/** Ids de los supuestos inválidos (criticidad alta sin prueba barata), en orden de entrada. */
export function supuestosInvalidos(
  supuestos: readonly SupuestoMinimo[],
): string[] {
  return supuestos
    .filter((s) => s.criticidad === "alta" && textoVacio(s.prueba_barata))
    .map((s) => s.id);
}
