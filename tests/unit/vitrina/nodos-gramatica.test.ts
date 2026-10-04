/**
 * C-8: `TIPOS_DE_NODO` y `GLIFO_DE_TIPO` (src/lib/vista/nodos.ts) viven en TypeScript para dar tipos al cliente sin
 * cargarle la gramática, pero no son una segunda fuente: deben ser la gramática `agentes-ia` copiada en
 * `packages/diagramador/contrato/` (los mismos tipos, los mismos glifos), salvo la desviación declarada: el glifo de
 * `regla` es el hexágono que selló el usuario (desviación 4 del S2), no el escudo.
 */
import { describe, expect, it } from "vitest";
import { GLIFO_DE_TIPO, TIPOS_DE_NODO } from "@/lib/vista/nodos";
import { GRAMATICA } from "@/lib/vista/visor";

const DESVIACIONES: Readonly<Record<string, string>> = { regla: "hexagono" };

describe("C-8: los tipos de nodo de la vitrina son los de la gramática", () => {
  const deLaGramatica = (
    GRAMATICA as unknown as { tipos_de_nodo: { id: string; glifo: string }[] }
  ).tipos_de_nodo.map((t) => ({
    id: t.id.replaceAll("-", "_"),
    glifo: t.glifo,
  }));

  it("los mismos tipos, en el mismo orden", () => {
    expect([...TIPOS_DE_NODO]).toEqual(deLaGramatica.map((t) => t.id));
  });

  it("los mismos glifos, salvo la desviación declarada", () => {
    for (const t of deLaGramatica)
      expect(GLIFO_DE_TIPO[t.id as keyof typeof GLIFO_DE_TIPO], t.id).toBe(
        DESVIACIONES[t.id] ?? t.glifo,
      );
  });
});
