/**
 * Rutas de la vitrina (ADR-007, ADR-008): sitio de varias páginas, una por pantalla e idioma, con
 * enlaces `<a>` absolutos desde la raíz. En el build normal las URL van limpias (`/es/plan`); el
 * paquete para hoja-de-vida (ADR-009, fase 4) las reescribe con su base y `.html`.
 */
import type { Idioma } from "@core/formatos/bilingue";

export const PANTALLAS = [
  "entrada",
  "plan",
  "agente",
  "brecha",
  "playground",
  "caso",
  "fichas",
] as const;
export type Pantalla = (typeof PANTALLAS)[number];

export function ruta(idioma: Idioma, pantalla: Pantalla, id?: string): string {
  const base = `/${idioma}`;
  if (pantalla === "entrada") return base;
  return id === undefined ? `${base}/${pantalla}` : `${base}/${pantalla}/${id}`;
}

export function otroIdioma(idioma: Idioma): Idioma {
  return idioma === "es" ? "en" : "es";
}

/** `/`: la elección de idioma; `?elegir` la muestra sin llevar a ninguna parte. */
export const RUTA_ELEGIR = "/?elegir";
