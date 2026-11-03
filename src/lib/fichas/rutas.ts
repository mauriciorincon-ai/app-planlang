/**
 * Dónde viven los archivos que planlang entrega por las fichas, en este repo y en el árbol de hoja-de-vida (C-9: una
 * sola vez). Sin dependencias, para que la lean tanto `pnpm fichas` como `pnpm paquete:vitrina`. Las fichas de los
 * agentes A y B ya no se producen ni se entregan (decisión del usuario, 2026-10-25; devolución 026, punto 5).
 */
/** Los hechos de la app: aquí y donde hoja-de-vida los copia. */
export const RUTA_EXPORT = "docs/brochure-export.json";
export const RUTA_EXPORT_EN_HOJA_DE_VIDA =
  "content/vitrina/planlang.brochure-export.json";
/** El complemento que planlang propone para su ficha: aquí (JSON) y en hoja-de-vida (YAML). */
export const RUTA_COMPLEMENTO =
  "docs/fichas/planlang.complemento-propuesto.json";
export const RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA = "data/fichas/planlang.yaml";
/** El complemento en YAML que escribe `pnpm fichas` para CV Viva (devolución 026, punto 4); el de hoja-de-vida lo fusiona el paquete. */
export const RUTA_COMPLEMENTO_YAML = "docs/cv-viva/complemento.yaml";
