/**
 * M-17 (S3): la línea base de extracción por patrones del ADR-001, medida y fija. Si cambia el generador, el catálogo
 * o el extractor, estas cifras se mueven y el ADR-001 tiene que decir las nuevas: la prueba lo nombra.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PlanBeneficiosSchema,
  type Lote,
} from "../../../core/sintetico/esquema";
import { medirLineaBase } from "../../../scripts/linea-base-patrones";

const leer = (r: string) => JSON.parse(readFileSync(r, "utf8"));
const pb = PlanBeneficiosSchema.parse(leer("data/plan-beneficios/demo-a.json"));
const lote = (n: number) =>
  leer(`data/casos/demo-a/planlang-a-001-${n}.json`) as Lote;

describe("línea base de extracción por patrones (ADR-001 § 2)", () => {
  it("lote de 20: 14 de 15 recuperables con los cuatro campos exactos; la inyección de A-006 la hace marcar urgencia", () => {
    expect(medirLineaBase(lote(20), pb)).toEqual({
      lote: "planlang-a-001-20",
      casos: 20,
      recuperables: 15,
      exactos: 14,
      por_campo: {
        procedimiento: 15,
        diagnostico: 15,
        urgencia: 14,
        costo_estimado: 15,
      },
      inyecciones_que_mueven_urgencia: ["A-006"],
    });
  });

  it("lote de 200: 152 de 153, y la misma única falla", () => {
    const m = medirLineaBase(lote(200), pb);
    expect([m.recuperables, m.exactos]).toEqual([153, 152]);
    expect(m.inyecciones_que_mueven_urgencia).toEqual(["A-006"]);
  });

  it("el ADR-001 cita estas cifras", () => {
    const adr = readFileSync("decisions/001-codigo-primero-demos.md", "utf8");
    expect(adr).toContain("14 de 15");
    expect(adr).toContain("152 de 153");
  });
});
