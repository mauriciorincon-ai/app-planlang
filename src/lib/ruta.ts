/**
 * Rutas de la vitrina (ADR-007, ADR-008): sitio de varias páginas, una por pantalla e idioma, con
 * enlaces `<a>` absolutos desde la raíz. En el build normal las URL van limpias (`/es/plan`); en el
 * paquete para hoja-de-vida (ADR-009, `PLANLANG_PAQUETE=1`) llevan su base y `.html`
 * (`/piezas/planlang/es/plan.html`): el proxy de idioma de hoja-de-vida intercepta toda ruta sin punto.
 * El modo lo fija `next.config.ts` al compilar. El demo B cuelga de su segmento (`/es/demo-b/plan`, ADR-014).
 */
import type { Idioma } from "@core/formatos/bilingue";
import { DEMOS, SEGMENTO_DEMO, type IdDemo } from "./demos";

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
/**
 * Las páginas de la vitrina: las pestañas (`PANTALLAS`) y las que no son pestaña. `comparar` (S4) se entra desde la
 * Entrada y desde la Brecha del A; no tiene pestaña y no existe en el demo B. `planes` (S5) es un plan aprobado sin
 * corrida (`/es/planes/<id>`): no es de ningún demo y no lleva segmento.
 */
export type Pagina = Pantalla | "comparar" | "planes";

/**
 * En qué demos existe una página (S7, B-5): las pestañas, en todos; `comparar`, solo en el A; `planes` en ninguno, es de
 * un plan. La ruta y el conmutador de demo de la barra salen de aquí: un conmutador nunca ofrece un demo donde la página
 * no existe, y un demo nuevo no necesita tocar nada más.
 */
export function demosConPagina(pagina: Pagina): readonly IdDemo[] {
  if (pagina === "planes") return [];
  if (pagina === "comparar") return ["demo-a"];
  return DEMOS;
}

const PAQUETE = process.env.PLANLANG_PAQUETE === "1";

/** Lo que va delante y detrás de cada camino: nada en el build normal; base y `.html` en el paquete. */
export const BASE_RUTA = PAQUETE ? "/piezas/planlang" : "";
export const SUFIJO_RUTA = PAQUETE ? ".html" : "";

/**
 * El camino de una pantalla. La Entrada es una sola para los dos demos (`/es`); las demás llevan el segmento del demo
 * (ninguno para el A, ADR-014).
 */
export function ruta(
  idioma: Idioma,
  pantalla: Pagina,
  id: string | undefined,
  demo: IdDemo,
): string {
  if (pantalla !== "planes" && !demosConPagina(pantalla).includes(demo))
    throw new Error(
      `ruta: «${pantalla}» solo existe en ${demosConPagina(pantalla).join(", ")}, no en «${demo}».`,
    );
  if (pantalla === "planes") {
    if (id === undefined)
      throw new Error("ruta: «planes» es la página de UN plan: falta su id.");
    return `${BASE_RUTA}/${idioma}/planes/${id}${SUFIJO_RUTA}`;
  }
  const segmento = SEGMENTO_DEMO[demo];
  const base = segmento ? `/${idioma}/${segmento}` : `/${idioma}`;
  const camino =
    pantalla === "entrada"
      ? `/${idioma}`
      : id === undefined
        ? `${base}/${pantalla}`
        : `${base}/${pantalla}/${id}`;
  return `${BASE_RUTA}${camino}${SUFIJO_RUTA}`;
}

/** La Entrada: una sola para los dos demos (`/es`). */
export function rutaEntrada(idioma: Idioma): string {
  return ruta(idioma, "entrada", undefined, "demo-a");
}

export function otroIdioma(idioma: Idioma): Idioma {
  return idioma === "es" ? "en" : "es";
}

/** `/`: la elección de idioma; `?elegir` la muestra sin llevar a ninguna parte. */
export const RUTA_ELEGIR = PAQUETE
  ? `${BASE_RUTA}/index.html?elegir`
  : "/?elegir";
