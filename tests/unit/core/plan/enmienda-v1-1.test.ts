/**
 * Plan v1.1 del demo A (aprobado por el usuario en el chat, fase 3 del S1): sale de la función de
 * enmienda aplicada al v1 aprobado, con la misma huella; su único cambio de contrato es la arista del
 * enrutador para los servicios exentos.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  contratoParaConstructor,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendar } from "../../../../scripts/enmienda-plan-demo-a";

const v1 = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Plan;
const v11 = JSON.parse(readFileSync("plans/demo-a/v1.1.json", "utf8")) as Plan;

describe("plan v1.1 del demo A", () => {
  it("se reproduce desde el v1 con la función de enmienda (misma huella)", async () => {
    const r = await aprobarPlan(enmendar(v1), {
      por: v11.aprobado_por!,
      el: v11.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.huella).toBe(v11.huella);
  });

  it("valida, está aprobado y el enrutador tiene dos aristas con rama por defecto al extractor", () => {
    expect(validarPlan(v11).ok).toBe(true);
    expect(v11.version).toBe("1.1.0");
    const c = contratoParaConstructor(v11);
    const enrutador = c.aristas.filter((a) => a.desde === "enrutador");
    expect(enrutador.map((a) => [a.orden, a.si_verdadero])).toEqual([
      [1, "redactor"],
      [2, "redactor"],
    ]);
    expect(c.ramas_por_defecto.enrutador).toBe("extractor");
    expect(v11.contrato_de_grafo.senales_obligatorias_en_traza).toContain(
      "servicio_exento",
    );
    expect(v11.contrato_de_grafo.senales_obligatorias_en_traza).toHaveLength(
      16,
    );
  });

  it("no toca decisiones, riesgos, criterios, supuestos ni umbrales", () => {
    for (const k of [
      "decisiones",
      "riesgos",
      "criterios_aceptacion",
      "supuestos",
      "umbrales",
    ] as const)
      expect(v11[k], k).toEqual(v1[k]);
  });
});
