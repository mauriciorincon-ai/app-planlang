/**
 * Plan v1.6.1 del demo A (S10, «El caso camina y el despliegue tiene plano»; el usuario lo aprobó en el G-Plan del S10,
 * chat de la planeadora, 2026-11-08, decisión 1a): la capacidad jugable del auditor baja su mínimo de 10 a 5, para que
 * el playground llegue a donde se rompe C11, y NADA más. Sale de la función de enmienda aplicada al v1.6; tiene la
 * misma verdad (ADR-005: la corrida de 200 de la v1.5 sigue valiendo).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV161 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v16 = leer("v1.6");
const v161 = leer("v1.6.1");

describe("plan v1.6.1 del demo A", () => {
  it("se reproduce desde el v1.6 con la función de enmienda y la firma de su aprobación", async () => {
    const r = await aprobarPlan(enmendarAV161(v16), {
      por: v161.aprobado_por!,
      el: v161.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan).toEqual(v161);
    expect(validarPlan(v161).ok).toBe(true);
    expect([v161.version, v161.aprobado_por, v161.aprobado_el]).toEqual([
      "1.6.1",
      "Mauricio Rincón",
      "2026-11-08",
    ]);
  });

  it("solo cambia el mínimo jugable de la capacidad: de 10 a 5, con el valor, el máximo y el paso en su sitio", () => {
    expect(
      v16.simulacion_de_plazos!.capacidad_del_auditor.rango_jugable,
    ).toEqual({
      min: 10,
      max: 60,
      paso: 5,
    });
    expect(v161.simulacion_de_plazos!.capacidad_del_auditor).toEqual({
      ...v16.simulacion_de_plazos!.capacidad_del_auditor,
      rango_jugable: { min: 5, max: 60, paso: 5 },
    });
    // Todo lo demás, igual: se compara el plan sin lo que la enmienda cambia por diseño.
    const sinLoQueCambia = (p: Plan) => {
      const { simulacion_de_plazos: sim, ...resto } = structuredClone(
        p,
      ) as Partial<Plan>;
      const simResto: Record<string, unknown> = { ...sim };
      delete simResto.capacidad_del_auditor;
      for (const k of ["version", "huella", "aprobado_el"] as const)
        delete resto[k];
      return { resto, simResto };
    };
    expect(sinLoQueCambia(v161)).toEqual(sinLoQueCambia(v16));
  });

  it("tiene la misma verdad que el v1.6: las corridas publicadas siguen valiendo (ADR-005)", () => {
    expect(mismaVerdad(v16, v161)).toBe(true);
    expect(v161.huella).not.toBe(v16.huella);
  });

  it("rojo: no se enmienda un plan que ya no tiene el mínimo en 10, ni uno sin simulación de plazos", () => {
    expect(() => enmendarAV161(v161)).toThrow(/mínimo en 10/);
    const sin = { ...v16 } as Partial<Plan>;
    delete sin.simulacion_de_plazos;
    expect(() => enmendarAV161(sin as Plan)).toThrow(/simulacion_de_plazos/);
  });
});
