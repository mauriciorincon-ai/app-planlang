/**
 * Serializador del lienzo (D8, D9, G1): golden files ES/EN del grafo real del demo A, en `core` (Node) y en
 * `core-jsdom`. El SVG se genera al compilar, en Node: el navegador lo recibe hecho y no lo recalcula, así que la
 * igualdad en los dos proyectos (el mismo V8) no prueba un motor de navegador ni le hace falta. Lo que sí se calcula
 * en el navegador es el playground, y su paridad entre motores la mide `tests/e2e/paridad.spec.ts` (AU-S2-11).
 * Regenerar (tras un cambio deliberado del motor o de los datos): `VISOR_GOLDEN=escribir pnpm vitest run
 * tests/unit/core/visor/svg.test.ts --project core`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Idioma } from "@core/formatos/bilingue";
import { fueraDeCobertura } from "@core/visor/medida";
import { aSvg, escapar, num } from "@core/visor/svg";
import { GRAMATICA, geometriaDemo } from "./_demo";

const geo = geometriaDemo();
const opciones = (idioma: Idioma, ns = "visor-a") => ({
  idioma,
  ns,
  titulo: { es: "Grafo real del demo A", en: "Real demo A graph" },
  descripcion: {
    es: "Ocho nodos y sus reglas.",
    en: "Eight nodes and their rules.",
  },
  seleccionables: true,
});
const GOLDEN = (i: Idioma) => `tests/golden/visor/demo-a.${i}.svg`;

describe.each(["es", "en"] as const)("SVG del demo A (%s)", (idioma) => {
  const svg = aSvg(geo, GRAMATICA, opciones(idioma));

  it("es byte a byte el golden", () => {
    if (process.env.VISOR_GOLDEN === "escribir")
      writeFileSync(GOLDEN(idioma), svg);
    expect(svg).toBe(readFileSync(GOLDEN(idioma), "utf8"));
  });

  it("raíz accesible en su idioma, sin versiones ni fechas, LF y un salto final", () => {
    expect(
      svg.startsWith(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 ${geo.alto}"`,
      ),
    ).toBe(true);
    expect(svg).toContain(
      `lang="${idioma}" role="graphics-document document" aria-labelledby="visor-a-t visor-a-d"`,
    );
    expect(svg).not.toMatch(/\r|20\d\d-\d\d-\d\d|0\.[35]\.0/);
    expect(svg.endsWith("</svg>\n")).toBe(true);
  });

  it("ids únicos y con espacio de nombres (D8); dos lienzos en una página no repiten ids", () => {
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith("visor-a-"))).toBe(true);
    const otro = aSvg(geo, GRAMATICA, opciones(idioma, "visor-b"));
    const ids2 = [...otro.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!);
    expect(ids.some((id) => ids2.includes(id))).toBe(false);
  });

  it("los 8 nodos y las 5 líneas con reglas son botones con nombre; lo demás, aria-hidden (D9)", () => {
    const botones = [
      ...svg.matchAll(/<g [^>]*role="button"[^>]*aria-label="([^"]+)"/g),
    ].map((m) => m[1]!);
    // Plan v1.5 (S3): el respaldo sin modelo suma la línea extractor → pausa_humana con su regla.
    expect(botones).toHaveLength(13);
    expect(svg.match(/data-sel-id="/g)).toHaveLength(13);
    expect(svg.match(/class="d-flujo"[^>]*aria-hidden="true"/g)).toHaveLength(
      9,
    );
  });

  it("todo texto está en la tabla de métricas de su letra (V15 sobre la salida)", () => {
    for (const m of svg.matchAll(
      /<text class="(\w[^"]*)"[^>]*>([^<]*)<\/text>/g,
    )) {
      const mono = /cod|regla|num/.test(m[1]!);
      const texto = m[2]!
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
      expect(fueraDeCobertura(texto, mono ? "mono" : "letra"), texto).toEqual(
        [],
      );
    }
  });
});

describe("serialización", () => {
  it("números cuantizados a medio punto, sin -0", () => {
    expect([
      num(-0),
      num(0.24),
      num(0.26),
      num(12),
      num(-3.5),
      num(7.75),
    ]).toEqual(["0", "0", "0.5", "12", "-3.5", "8"]);
  });
  it("escapa el texto", () => {
    expect(escapar(`a<b & "c">`)).toBe("a&lt;b &amp; &quot;c&quot;&gt;");
  });
});
