/**
 * Plan v1.5.1 del demo A (S3, auditoría F8; el usuario la aprobó el 2026-10-05 con «Corregir los dos»): solo redacción.
 * S1 y S3 dejan de decir «el lote de 20» (se midieron sobre el lote medido, de 200) y el problema deja de decir «sin
 * negar jamás por su cuenta» (la D2 deja salir sola la aprobación en parte). Sale de la función de enmienda aplicada al
 * v1.5 con la misma huella, tiene la misma verdad (ADR-005) y nada más cambia.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV151 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v15 = leer("v1.5");
const v151 = leer("v1.5.1");

describe("plan v1.5.1 del demo A", () => {
  it("se reproduce desde el v1.5 con la función de enmienda y la firma de su aprobación", async () => {
    const r = await aprobarPlan(enmendarAV151(v15), {
      por: v151.aprobado_por!,
      el: v151.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan).toEqual(v151);
    expect(validarPlan(v151).ok).toBe(true);
    expect([v151.aprobado_por, v151.aprobado_el]).toEqual([
      "Mauricio Rincón",
      "2026-10-05",
    ]);
  });

  it("tiene la misma verdad que el v1.5: las corridas de la v1.5 siguen valiendo (ADR-005)", () => {
    expect(mismaVerdad(v15, v151)).toBe(true);
  });

  it("solo cambian el problema y la prueba barata de S1 y S3 (más versión, huella y aprobación)", () => {
    const sin = (p: Plan) => {
      const x = structuredClone(p) as Record<string, unknown>;
      for (const k of ["version", "huella", "aprobado_el", "problema"] as const)
        delete x[k];
      x.supuestos = (p.supuestos as Plan["supuestos"]).map((s) => ({
        ...s,
        prueba_barata: s.id === "S1" || s.id === "S3" ? null : s.prueba_barata,
      }));
      return x;
    };
    expect(sin(v151)).toEqual(sin(v15));
    expect(JSON.stringify(v151)).not.toMatch(/lote de 20|20-case batch/);
    expect(v151.problema.es).toContain(
      "sin negar jamás del todo por su cuenta",
    );
    expect(v151.problema.en).toContain("never fully denying on its own");
  });
});
