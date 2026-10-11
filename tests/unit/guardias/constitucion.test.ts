/**
 * Constitución del kit v2.0.0 (S4, F1). El núcleo de `CLAUDE.md` cabe en 150 líneas, lleva sus centinelas y nombra las
 * 16 reglas de planlang y las reglas del kit; el anexo `docs/REGLAS-ANEXO.md` guarda las 16 reglas de planlang una vez
 * cada una y en orden, con la corrección de P4, y una línea «Estado v2.x (§ N)» por cada regla del kit. Los rojos de
 * esta prueba (borrar P7 del anexo, quitar un centinela) se registran en el cierre con `scripts/demo-rojo.sh`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const nucleo = readFileSync("CLAUDE.md", "utf8");
const anexo = readFileSync("docs/REGLAS-ANEXO.md", "utf8");
const reglasPlanlang = anexo.split(/^## Reglas duras de planlang/m)[1] ?? "";

const ESPERADAS_P = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
const etiquetasP = (texto: string) =>
  [...texto.matchAll(/^(P\d+)\. \*\*/gm)].map((m) => m[1]!);

/** Reglas del kit: 1–17, 17-bis, 18–28, en el orden del núcleo. */
const REGLAS_DEL_KIT = [
  ...Array.from({ length: 17 }, (_, i) => String(i + 1)),
  "17-bis",
  ...Array.from({ length: 11 }, (_, i) => String(i + 18)),
];

describe("constitución: el núcleo de CLAUDE.md (kit v2.0.0)", () => {
  it("cabe en 150 líneas", () => {
    expect(nucleo.trimEnd().split("\n").length).toBeLessThanOrEqual(150);
  });

  it("lleva sus dos centinelas", () => {
    expect(nucleo).toContain("núcleo, kit v2.0.0");
    expect(nucleo).toContain("P4. **Ninguna negación completa");
  });

  it("nombra las 16 reglas de planlang, una vez cada una y en orden", () => {
    expect(etiquetasP(nucleo)).toEqual(ESPERADAS_P);
  });

  it("nombra las reglas del kit en su orden, sin huecos ni repeticiones", () => {
    const seccion = nucleo.split("## Reglas del kit")[1]!.split("\n## ")[0]!;
    const ids = [...seccion.matchAll(/^(\d+(?:-bis)?)\. `/gm)].map(
      (m) => m[1]!,
    );
    expect(ids).toEqual(REGLAS_DEL_KIT);
  });
});

describe("constitución: el anexo docs/REGLAS-ANEXO.md", () => {
  it("guarda las 16 reglas de planlang íntegras, una vez cada una y en orden", () => {
    expect(reglasPlanlang, "sección § P1–P16").not.toBe("");
    expect(etiquetasP(reglasPlanlang), "reglas P del anexo").toEqual(ESPERADAS_P);
  });

  it("lleva la corrección de P4 («negación completa»)", () => {
    expect(reglasPlanlang).toContain(
      "P4. **NINGUNA NEGACIÓN COMPLETA NI RECHAZO SIN PAUSA HUMANA.**",
    );
  });

  it("tiene una línea «Estado v2.x (§ N)» por cada regla del kit", () => {
    const estados = [
      ...anexo.matchAll(/^Estado v2\.\d+\.\d+ \(§ ([^)]+)\)/gm),
    ].map((m) => m[1]!);
    const faltan = REGLAS_DEL_KIT.filter((id) => !estados.includes(id));
    expect(faltan, "reglas del kit sin su línea de estado").toEqual([]);
  });
});
