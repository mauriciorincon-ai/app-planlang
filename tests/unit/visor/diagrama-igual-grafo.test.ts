// @vitest-environment node
/**
 * Gate «diagrama = grafo» sobre lo publicado (`scripts/diagrama-igual-grafo.ts`): verde sobre el SVG golden del
 * demo A; rojo, con cada falla nombrada, cuando el dibujo pierde `guardia_salida` (la demo de la orden), cuando un
 * nodo ausente pierde su marca o cuando aparece uno que nadie declaró.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compararPagina,
  leerSvg,
  svgDeLaPagina,
} from "../../../scripts/diagrama-igual-grafo";
import { CONTRATO, GRAFO } from "../core/visor/_demo";

const svg = readFileSync("tests/golden/visor/demo-a.es.svg", "utf8");

/** Quita del SVG un nodo (su grupo deja de nombrarlo) y las líneas que lo tocan. */
function sinNodo(s: string, nodo: string): string {
  return s
    .replace(`data-nodo-id="${nodo}"`, "")
    .replace(
      new RegExp(
        `<g class="d-flujo" id="[^"]*-l-[^"]*${nodo}[^"]*"[\\s\\S]*?</g>\\n`,
        "g",
      ),
      "",
    );
}

describe("diagrama = grafo, sobre la página", () => {
  it("el golden del demo A dibuja sus 8 nodos, 13 aristas, 9 reglas y 4 ramas por defecto", () => {
    const l = leerSvg(svg);
    expect(l.nodos.size).toBe(8);
    expect(compararPagina(svg, GRAFO, CONTRATO)).toEqual([]);
  });

  it("rojo si el dibujo pierde guardia_salida (la demo de la orden)", () => {
    const f = compararPagina(sinNodo(svg, "guardia-salida"), GRAFO, CONTRATO);
    expect(f).toEqual(
      expect.arrayContaining([
        "nodo del grafo sin dibujar: guardia-salida",
        "arista del grafo sin línea: redactor → guardia_salida",
        "arista del grafo sin línea: guardia_salida → __end__",
      ]),
    );
  });

  it("rojo si un nodo del grafo lleva la marca «exigido» o aparece uno que nadie declaró", () => {
    const marcado = svg.replace(
      'data-nodo-id="aclaracion"',
      'data-nodo-id="aclaracion" data-madurez="exigido"',
    );
    expect(compararPagina(marcado, GRAFO, CONTRATO)).toContain(
      "nodo del grafo marcado «exigido»: aclaracion",
    );
    const extra = svg.replace(
      '<g class="d-nodo"',
      '<g class="d-nodo" data-nodo-id="aprobar"></g><g class="d-nodo"',
    );
    expect(compararPagina(extra, GRAFO, CONTRATO)).toContain(
      "nodo dibujado que no está en el grafo ni en el plan: aprobar",
    );
  });

  it("encuentra el lienzo dentro de la página y falla si no está", () => {
    expect(svgDeLaPagina(`<main>${svg}</main>`, "visor-a")).toBe(svg.trim());
    expect(() => svgDeLaPagina("<main></main>")).toThrow(/no lleva el lienzo/);
  });
});

describe("AU-S2-23: en los dos sentidos y con la condición", () => {
  const ns = leerSvg(svg).ns;

  it("rojo con una línea inventada a mano (no es arista del grafo) y su flujo", () => {
    const inventada = svg.replace(
      '<g class="d-flujo"',
      `<g class="d-flujo" id="${ns}-l-decision-a-aclaracion" data-origen="decision" data-destino="aclaracion" data-flujos="decision-a-aclaracion-r9" data-condiciones="senal-x = 1"></g><g class="d-flujo"`,
    );
    expect(compararPagina(inventada, GRAFO, CONTRATO)).toEqual([
      "línea dibujada que no es una arista del grafo: decision-a-aclaracion (decision → aclaracion)",
      "flujo dibujado que el grafo y el plan no tienen: decision-a-aclaracion-r9",
    ]);
  });

  it("rojo si la condición publicada de una regla no es la del plan (un paquete viejo con otro umbral)", () => {
    const cambiada = svg.replace(
      'data-condiciones="campos-faltantes-count &gt; 0"',
      'data-condiciones="campos-faltantes-count &gt; 1"',
    );
    expect(cambiada).not.toBe(svg);
    expect(compararPagina(cambiada, GRAFO, CONTRATO)).toEqual([
      "condición distinta en extractor-a-aclaracion-r1: el dibujo dice «campos-faltantes-count > 1» y el plan «campos-faltantes-count > 0»",
    ]);
  });

  it("las líneas se leen por su origen y destino, no por el id compuesto", () => {
    const l = leerSvg(svg).lineas;
    for (const x of l.values()) {
      expect(x.origen).not.toBe("");
      expect(x.destino).not.toBe("");
    }
  });
});

describe("AU-S2-B55: el script sabe cuándo es el programa", () => {
  it("compara rutas reales: la misma ruta sí, otra no, ninguna no", async () => {
    const { esElPrograma } =
      await import("../../../scripts/diagrama-igual-grafo");
    const { pathToFileURL } = await import("node:url");
    const { resolve } = await import("node:path");
    const ruta = resolve("scripts/diagrama-igual-grafo.ts");
    expect(esElPrograma(pathToFileURL(ruta).href, ruta)).toBe(true);
    expect(
      esElPrograma(pathToFileURL(ruta).href, resolve("scripts/_io.ts")),
    ).toBe(false);
    expect(esElPrograma(pathToFileURL(ruta).href, undefined)).toBe(false);
  });
});
