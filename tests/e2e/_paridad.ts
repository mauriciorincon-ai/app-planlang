/**
 * Paridad de la isla del playground entre motores (regla dura 1, AU-S2-11): el recálculo corre en el navegador de
 * quien visita, así que lo que pinta tras mover cada umbral tiene que ser lo mismo en Node (jsdom, que escribe el
 * golden) y en Chromium, Firefox y WebKit. Las dos funciones que leen el DOM son autocontenidas a propósito: el
 * spec de Playwright las pasa tal cual a `page.evaluate`, que solo envía el texto de la función.
 *
 * Sin dependencias de Playwright ni de Node: la importan la prueba de vitest y el spec.
 */

export type Movimiento =
  | { umbral: string; tipo: "rango"; plan: string; valores: string[] }
  | { umbral: string; tipo: "interruptor" };

/** Los umbrales de la isla y los valores de cada deslizador, leídos de sus atributos (min, max, step, value). */
export function movimientos(raiz?: ParentNode): Movimiento[] {
  const r = raiz ?? document;
  return [...r.querySelectorAll<HTMLElement>('[id^="w-"]')].map((w) => {
    const umbral = w.id.slice(2);
    const rango = w.querySelector<HTMLInputElement>('input[type="range"]');
    if (!rango) return { umbral, tipo: "interruptor" as const };
    const min = Number(rango.min);
    const max = Number(rango.max);
    const paso = Number(rango.step);
    const n = Math.round((max - min) / paso);
    const valores: string[] = [];
    for (let k = 0; k <= n; k++)
      valores.push(String(Math.round((min + k * paso) * 1e6) / 1e6));
    return { umbral, tipo: "rango" as const, plan: rango.value, valores };
  });
}

/**
 * Lo que pinta la isla: el texto de sus secciones (el juego y la curva, con lo que solo lee el lector de pantalla
 * y lo de los dos perfiles) y la geometría de la curva. Sin `id` ni `aria-*`: `useId` numera distinto al hidratar
 * que al pintar en el cliente, y no es cálculo.
 */
export function huellaDeLaIsla(raiz?: ParentNode): {
  cifras: string;
  texto: string;
  curva: string;
} {
  const r = raiz ?? document;
  const GEOMETRIA = [
    "d",
    "cx",
    "cy",
    "r",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "width",
    "height",
    "points",
    "transform",
    "viewBox",
  ];
  const texto = ["s-juego-t", "s-curva-t"]
    .map(
      (id) =>
        r.querySelector(`section[aria-labelledby="${id}"]`)?.textContent ?? "",
    )
    .join("\n§\n");
  const svg = r.querySelector("#curva-pg");
  const curva = svg
    ? [svg, ...svg.querySelectorAll("*")]
        .map(
          (e) =>
            `${e.localName}(${GEOMETRIA.filter((a) => e.hasAttribute(a))
              .map((a) => `${a}=${e.getAttribute(a)}`)
              .join(" ")})`,
        )
        .join(" ")
    : "";
  const cifras = ["k-cambian", "k-intro", "k-min", "k-crit"]
    .map((id) => r.querySelector(`#${id}`)?.textContent ?? "")
    .join(" | ");
  return { cifras, texto, curva };
}
