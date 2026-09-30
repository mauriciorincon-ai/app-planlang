/** Las rutas de los glifos (datos, sin trigonometría en el núcleo) son los polígonos que se calculan con seno y coseno. */
import { describe, expect, it } from "vitest";
import { RUTA_GLIFO } from "@core/visor/glifos";

const r2 = (x: number) => Math.round(x * 100) / 100;
function poligono(radios: number[], giro = -90): string {
  const n = radios.length;
  return (
    radios
      .map((r, i) => {
        const a = ((giro + (360 / n) * i) * Math.PI) / 180;
        return `${i === 0 ? "M" : "L"}${r2(r * Math.cos(a))},${r2(r * Math.sin(a))}`;
      })
      .join(" ") + " Z"
  )
    .replaceAll("-0,", "0,")
    .replaceAll(",-0 ", ",0 ");
}

describe("glifos", () => {
  it("estrella, hexágono y rombo son los polígonos regulares", () => {
    expect(RUTA_GLIFO.estrella).toBe(
      poligono(Array.from({ length: 10 }, (_, i) => (i % 2 ? 3.5 : 8.2))),
    );
    expect(RUTA_GLIFO.hexagono).toBe(poligono([8, 8, 8, 8, 8, 8]));
    expect(RUTA_GLIFO.rombo).toBe(poligono([8, 8, 8, 8]));
  });
});
