/**
 * Rutas de la vitrina (ADR-007, ADR-008): sitio de varias páginas, una por pantalla e idioma, con
 * enlaces `<a>` absolutos desde la raíz. En el build normal las URL van limpias (`/es/plan`); en el
 * paquete para hoja-de-vida (ADR-009, `PLANLANG_PAQUETE=1`) llevan su base y `.html`
 * (`/piezas/planlang/es/plan.html`): el proxy de idioma de hoja-de-vida intercepta toda ruta sin punto.
 * El modo lo fija `next.config.ts` al compilar.
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

const PAQUETE = process.env.PLANLANG_PAQUETE === "1";

/** Lo que va delante y detrás de cada camino: nada en el build normal; base y `.html` en el paquete. */
export const BASE_RUTA = PAQUETE ? "/piezas/planlang" : "";
export const SUFIJO_RUTA = PAQUETE ? ".html" : "";

export function ruta(idioma: Idioma, pantalla: Pantalla, id?: string): string {
  const camino =
    pantalla === "entrada"
      ? `/${idioma}`
      : id === undefined
        ? `/${idioma}/${pantalla}`
        : `/${idioma}/${pantalla}/${id}`;
  return `${BASE_RUTA}${camino}${SUFIJO_RUTA}`;
}

export function otroIdioma(idioma: Idioma): Idioma {
  return idioma === "es" ? "en" : "es";
}

/** `/`: la elección de idioma; `?elegir` la muestra sin llevar a ninguna parte. */
export const RUTA_ELEGIR = PAQUETE
  ? `${BASE_RUTA}/index.html?elegir`
  : "/?elegir";
