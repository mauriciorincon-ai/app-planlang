/**
 * Plan v1.2 del demo A (aprobado por el usuario en el gate de la fase 4 del S1): enmienda de SOLO
 * medición. Sale de la función de enmienda aplicada al v1.1 con la misma huella, conserva umbrales y
 * contrato de grafo (por eso los lotes generados con la v1.1 siguen valiendo) y corrige R5, S1 y S2.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV12 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v1 = leer("v1");
const v11 = leer("v1.1");
const v12 = leer("v1.2");

describe("plan v1.2 del demo A", () => {
  it("se reproduce desde el v1.1 con la función de enmienda (misma huella)", async () => {
    const r = await aprobarPlan(enmendarAV12(v11), {
      por: v12.aprobado_por!,
      el: v12.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.huella).toBe(v12.huella);
    expect(validarPlan(v12).ok).toBe(true);
  });
  it("solo cambia la medición: misma verdad que la v1.1; la v1.1 no tenía la misma verdad que el v1", () => {
    expect(mismaVerdad(v11, v12)).toBe(true);
    expect(mismaVerdad(v1, v11)).toBe(false);
    for (const k of [
      "decisiones",
      "criterios_aceptacion",
      "umbrales",
      "contrato_de_grafo",
    ] as const)
      expect(v12[k], k).toEqual(v11[k]);
    expect(mismaVerdad({}, v12)).toBe(false);
    expect(mismaVerdad({ umbrales: [] }, { umbrales: [] })).toBe(false);
  });
  it("R5 compara campos, S1 y S2 declaran umbral numérico y S2 puede fallar", () => {
    expect(
      v12.riesgos.find((r) => r.id === "R5")?.detector_en_trazas?.condicion,
    ).toBe("extraccion.campos != verdad_conocida.campos");
    expect(
      v12.supuestos.find((s) => s.id === "S1")?.medible_en_trazas
        ?.umbral_confirmacion,
    ).toEqual({ auroc_min: 0.75, ece_max: 0.1 });
    const s2 = v12.supuestos.find((s) => s.id === "S2")?.medible_en_trazas;
    expect(s2).toMatchObject({
      condicion: "campos_faltantes_count == 0",
      umbral_confirmacion: { tasa_min: 0.95 },
    });
    expect(v12.riesgos.filter((r) => r.id !== "R5")).toEqual(
      v11.riesgos.filter((r) => r.id !== "R5"),
    );
  });
});
