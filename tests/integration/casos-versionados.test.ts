/**
 * Reproducibilidad byte a byte de los lotes versionados (criterio de la fase 2 y acceptance del S1).
 * Regenera cada lote desde su semilla, el plan aprobado y el plan de beneficios, y exige los MISMOS
 * BYTES que hay en disco — en el proyecto `core` (Node) y en `core-jsdom`: igualdad en ambos = paridad
 * Node/navegador del generador. También la afirmación de privacidad derivada.
 * Demo en rojo (bitácora S1, fase 2): cambiar una frase de un diccionario → rojo nombrando el lote.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { jsonBonito } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import type { Plan } from "../../core/plan";
import {
  generarLote,
  PlanBeneficiosSchema,
  type Lote,
} from "../../core/sintetico";
import {
  LOTES_VERSIONADOS,
  markdownAfirmacion,
  PLAN_BENEFICIOS_DEMO_A,
  PLAN_DEMO_A,
  RUTA_AFIRMACION,
  rutaDeLote,
} from "../../scripts/lotes-versionados";

const leerPlan = (ruta: string) =>
  JSON.parse(readFileSync(ruta, "utf8")) as Plan;
const plan = leerPlan(PLAN_DEMO_A);
const planBeneficios = PlanBeneficiosSchema.parse(
  JSON.parse(readFileSync(PLAN_BENEFICIOS_DEMO_A, "utf8")),
);

describe("lotes versionados de data/casos/demo-a", () => {
  const generados: Lote[] = [];

  it.each(LOTES_VERSIONADOS)(
    "$semilla-$n se regenera con los mismos bytes",
    async ({ semilla, n, receta, plan: rutaPlan }) => {
      const lote = await generarLote({
        plan: leerPlan(rutaPlan),
        planBeneficios,
        semilla,
        n,
        receta,
      });
      generados.push(lote);
      expect(jsonBonito(lote as unknown as JsonValor)).toBe(
        readFileSync(rutaDeLote(semilla, n), "utf8"),
      );
    },
  );

  it("dos generaciones del lote de 200 dan la misma huella", async () => {
    const a = await generarLote({
      plan,
      planBeneficios,
      semilla: "planlang-a-001",
      n: 200,
    });
    const b = await generarLote({
      plan,
      planBeneficios,
      semilla: "planlang-a-001",
      n: 200,
    });
    expect(a.huella).toBe(b.huella);
  });

  it("el lote de 20 es el primer bloque del de 200 aunque los planes difieran", () => {
    const [l20, l200] = generados.filter((l) => l.semilla === "planlang-a-001");
    expect(l200?.casos.slice(0, 20)).toEqual(l20?.casos);
    expect(l20?.plan.version).toBe("1.1.0");
    expect(l200?.plan.version).toBe("1.4.0");
  });

  it("la afirmación de privacidad en Markdown está al día con los lotes", () => {
    expect(generados).toHaveLength(LOTES_VERSIONADOS.length);
    expect(markdownAfirmacion(generados)).toBe(
      readFileSync(RUTA_AFIRMACION, "utf8"),
    );
  });
});
