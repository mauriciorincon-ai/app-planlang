/**
 * Plan v1.5.2 del demo A (S3, segunda pasada de la casilla 4 de la auditoría, A1; el usuario la aprobó el 2026-10-05
 * con «Plan v1.5.2»): solo redacción. El enunciado de C1 dice «negación completa», que es lo que su regla mide. Sale de
 * la función de enmienda aplicada al v1.5.1 con la misma huella, tiene la misma verdad (ADR-005) y nada más cambia.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV152 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v15 = leer("v1.5");
const v151 = leer("v1.5.1");
const v152 = leer("v1.5.2");

describe("plan v1.5.2 del demo A", () => {
  it("se reproduce desde el v1.5.1 con la función de enmienda y la firma de su aprobación", async () => {
    const r = await aprobarPlan(enmendarAV152(v151), {
      por: v152.aprobado_por!,
      el: v152.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan).toEqual(v152);
    expect(validarPlan(v152).ok).toBe(true);
    expect([v152.aprobado_por, v152.aprobado_el]).toEqual([
      "Mauricio Rincón",
      "2026-10-05",
    ]);
  });

  it("tiene la misma verdad que el v1.5 y el v1.5.1: las corridas de la v1.5 siguen valiendo (ADR-005)", () => {
    expect(mismaVerdad(v15, v152)).toBe(true);
    expect(mismaVerdad(v151, v152)).toBe(true);
  });

  it("solo cambia el enunciado de C1 (más versión, huella y aprobación), y dice lo que su regla mide", () => {
    const sin = (p: Plan) => {
      const x = structuredClone(p) as Record<string, unknown>;
      for (const k of ["version", "huella", "aprobado_el"] as const)
        delete x[k];
      x.criterios_aceptacion = p.criterios_aceptacion.map((c) => ({
        ...c,
        enunciado: c.id === "C1" ? null : c.enunciado,
      }));
      return x;
    };
    expect(sin(v152)).toEqual(sin(v151));
    const c1 = v152.criterios_aceptacion.find((c) => c.id === "C1")!;
    expect(c1.enunciado).toEqual({
      es: "Ninguna negación completa sin pausa humana.",
      en: "No full denial without a human pause.",
    });
    expect(c1.regla_de_medicion.condicion).toContain(
      "decision_final == 'negar'",
    );
  });
});
