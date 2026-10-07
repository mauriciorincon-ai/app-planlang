/**
 * Las rutas de los glifos son las de la tabla del contrato del diagramador 0.5.0 § 5.4 (copia fijada), y la forma de
 * cada tipo es la que declara la gramática `agentes-ia` (el hexágono para `regla` desde la 1.2.0).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formaDeGlifo, RUTA_GLIFO } from "@core/visor/glifos";
import type { Gramatica } from "@core/visor/tipos";
import gramaticaJson from "../../../../packages/diagramador/contrato/gramaticas/agentes-ia.json";

const CONTRATO = readFileSync(
  "packages/diagramador/contrato/CONTRATO.md",
  "utf8",
);
const G = gramaticaJson as unknown as Gramatica;

describe("glifos", () => {
  it.each(Object.entries(RUTA_GLIFO))(
    "%s es la ruta de la tabla del § 5.4 del contrato",
    (forma, ruta) => {
      expect(CONTRATO).toContain(`| \`${forma}\` | lleno | \`${ruta}\` |`);
    },
  );

  it("cada tipo de la gramática tiene su glifo, y regla es el hexágono", () => {
    for (const t of G.tipos_de_nodo)
      expect(RUTA_GLIFO[formaDeGlifo(G, t.id)], t.id).toBeTruthy();
    expect(formaDeGlifo(G, "regla")).toBe("hexagono");
  });

  it("un glifo sin ruta detiene el dibujo", () => {
    const g = {
      ...G,
      tipos_de_nodo: [{ ...G.tipos_de_nodo[0]!, glifo: "pentagono" }],
    } as Gramatica;
    expect(() => formaDeGlifo(g, G.tipos_de_nodo[0]!.id)).toThrow(
      /no tiene ruta/,
    );
  });
});
