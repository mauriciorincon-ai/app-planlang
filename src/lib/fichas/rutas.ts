/**
 * Dónde viven las fichas que planlang entrega, en este repo y en el árbol de hoja-de-vida (C-9: una sola vez). Sin
 * dependencias, para que la lean tanto `pnpm fichas` como `pnpm paquete:vitrina`.
 */
import type { IdDemo } from "../demos";

/** El slug de la ficha de cada agente (uno por demo). */
export const SLUG_AGENTE: Readonly<Record<IdDemo, string>> = {
  "demo-a": "planlang-demo-a",
  "demo-b": "planlang-demo-b",
};
/** La ficha de cada agente en español: la que se copia, con la misma ruta aquí y en hoja-de-vida. */
export const RUTA_FICHA_AGENTE: Readonly<Record<IdDemo, string>> = {
  "demo-a": `content/agentes/${SLUG_AGENTE["demo-a"]}.ficha-tecnica.json`,
  "demo-b": `content/agentes/${SLUG_AGENTE["demo-b"]}.ficha-tecnica.json`,
};
/** Su hermana en inglés (no se entrega: el contrato del consumidor es monolingüe). */
export const RUTA_FICHA_AGENTE_EN: Readonly<Record<IdDemo, string>> = {
  "demo-a": `docs/fichas/${SLUG_AGENTE["demo-a"]}.ficha-tecnica.en.json`,
  "demo-b": `docs/fichas/${SLUG_AGENTE["demo-b"]}.ficha-tecnica.en.json`,
};
/** Los hechos de la app: aquí y donde hoja-de-vida los copia. */
export const RUTA_EXPORT = "docs/brochure-export.json";
export const RUTA_EXPORT_EN_HOJA_DE_VIDA =
  "content/vitrina/planlang.brochure-export.json";
/** El complemento que planlang propone para su ficha: aquí (JSON) y en hoja-de-vida (YAML). */
export const RUTA_COMPLEMENTO =
  "docs/fichas/planlang.complemento-propuesto.json";
export const RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA = "data/fichas/planlang.yaml";
