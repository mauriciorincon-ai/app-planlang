/**
 * Plan v1.4 del demo A (S2 fase 4, AU-9 decidido por el usuario): sin proveedor al extraer o al aclarar, el caso va a
 * una persona. Sale de la función de enmienda aplicada al v1.3 con la misma huella. Cambia el contrato de grafo, así
 * que NO da la misma verdad que la v1.3 por la regla de compatibilidad: el lote de 200 se regeneró con la v1.4 y el de
 * 20 (con sus corridas) sigue con la v1.1.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  esAristaTripleta,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV14 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v13 = leer("v1.3");
const v14 = leer("v1.4");
const lote = (n: number) =>
  JSON.parse(
    readFileSync(`data/casos/demo-a/planlang-a-001-${n}.json`, "utf8"),
  ) as { plan: { huella: string } };

describe("plan v1.4 del demo A", () => {
  it("se reproduce desde el v1.3 con la función de enmienda (misma huella) y valida", async () => {
    const r = await aprobarPlan(enmendarAV14(v13), {
      por: v14.aprobado_por!,
      el: v14.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.huella).toBe(v14.huella);
    expect(validarPlan(v14).ok).toBe(true);
  });

  it("extractor y aclaración ganan la arista de respaldo en el orden 1; sus aristas de antes pasan al 2", () => {
    const cg = v14.contrato_de_grafo;
    for (const [desde, porDefecto] of [
      ["extractor", "verificador_cobertura"],
      ["aclaracion", "extractor"],
    ] as const) {
      const propias = cg.aristas_condicionales
        .filter((a) => a.desde === desde)
        .sort((a, b) => a.orden - b.orden);
      expect(propias.map((a) => a.orden)).toEqual([1, 2]);
      const [respaldo, antes] = propias;
      expect(respaldo).toMatchObject({
        senal: "proveedor_no_disponible",
        operador: "igual_a",
        valor: true,
        si_verdadero: "pausa_humana",
      });
      expect(antes && esAristaTripleta(antes) && antes.si_falso).toBeFalsy();
      expect(cg.ramas_por_defecto[desde]).toBe(porDefecto);
    }
    expect(cg.senales_obligatorias_en_traza).toContain(
      "proveedor_no_disponible",
    );
  });

  it("R9 anticipa la falla del proveedor y el evaluador de extracción la cubre", () => {
    const r9 = v14.riesgos.find((r) => r.id === "R9");
    expect(r9?.detector_en_trazas?.condicion).toBe("error_proveedor != null");
    expect(
      v14.contrato_de_grafo.evaluadores_requeridos.find(
        (e) => e.id === "exactitud_extraccion",
      )?.riesgos_cubiertos,
    ).toEqual(["R5", "R7", "R9"]);
  });

  it("umbrales intactos y otra verdad por contrato: el lote de 200 es de la v1.4, el de 20 sigue con la v1.1", () => {
    expect(v14.umbrales).toEqual(v13.umbrales);
    expect(mismaVerdad(v13, v14)).toBe(false);
    expect(lote(200).plan.huella).toBe(v14.huella);
    expect(lote(20).plan.huella).toBe(leer("v1.1").huella);
  });
});
