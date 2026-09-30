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
      new RegExp(`<g class="d-flujo" id="[^"]*-l-[^"]*${nodo}[^"]*"[\\s\\S]*?</g>\\n`, "g"),
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
