/**
 * Plan v1.3 del demo A (S2 fase 0; en el plan del S2 el usuario decidió que U4 queda y se explica y que la
 * tolerancia de S3 es estricta): medición y redacción. Sale de la función de enmienda aplicada al v1.2 con la misma
 * huella y conserva umbrales y contrato de grafo, por eso el lote de 20 y sus corridas siguen valiendo (ADR-005).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { comoBilingue, esMonolingue } from "../../../../core/formatos/bilingue";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV13 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v12 = leer("v1.2");
const v13 = leer("v1.3");

describe("plan v1.3 del demo A", () => {
  it("se reproduce desde el v1.2 con la función de enmienda (misma huella) y valida", async () => {
    const r = await aprobarPlan(enmendarAV13(v12), {
      por: v13.aprobado_por!,
      el: v13.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.huella).toBe(v13.huella);
    expect(validarPlan(v13).ok).toBe(true);
  });
  it("misma verdad que la v1.2: umbrales (U4 incluido) y contrato de grafo intactos", () => {
    expect(mismaVerdad(v12, v13)).toBe(true);
    expect(v13.umbrales).toEqual(v12.umbrales);
    expect(v13.contrato_de_grafo).toEqual(v12.contrato_de_grafo);
    expect(v13.criterios_aceptacion).toEqual(v12.criterios_aceptacion);
  });
  it("R8 se mide sobre las sesiones; R1 y R6 son control legal; S3 declara tolerancia estricta", () => {
    const r = (id: string) => v13.riesgos.find((x) => x.id === id);
    expect(r("R8")?.detector_en_trazas).toMatchObject({
      ambito: "sesion",
      condicion: "limites_alcanzados > 0",
    });
    expect(v13.riesgos.filter((x) => x.control_legal).map((x) => x.id)).toEqual(
      ["R1", "R6"],
    );
    const s3 = v13.supuestos.find((s) => s.id === "S3");
    expect(s3?.medible_en_trazas?.umbral_confirmacion).toEqual({
      exactitud_dif_min: 0,
      latencia_mediana_razon_max: 1,
    });
    expect(s3?.enunciado.es).toMatch(/presupuesto no mayor/);
  });
  it("decisiones y mitigaciones bilingües; el EN de D1, D2 y D4 conserva los hechos del ES (M-25)", () => {
    for (const d of v13.decisiones) {
      for (const o of d.opciones)
        expect(esMonolingue(o.nombre), `${d.id} opción`).toBe(false);
      expect(
        d.opcion_elegida && esMonolingue(d.opcion_elegida),
        `${d.id} elegida`,
      ).toBe(false);
    }
    for (const x of v13.riesgos)
      for (const m of x.mitigaciones)
        for (const campo of [m.accion, m.momento, m.efecto_esperado])
          expect(esMonolingue(campo), `${x.id} mitigación`).toBe(false);
    const j = (id: string) =>
      v13.decisiones.find((d) => d.id === id)?.justificacion?.en ?? "";
    expect(j("D1")).toMatch(/1581.*GDPR art\. 9/);
    expect(j("D2")).toMatch(/CA SB 1120, TX SB 815, AI Act art\. 14/);
    expect(j("D4")).toMatch(/RF-04\.3.*Tran & Kiela 2026/);
    // Lo único que queda en español es la unidad de U2: cambiarla invalidaría el lote (ADR-005 compara umbrales).
    const u2 = v13.umbrales.find((u) => u.id === "U2")?.unidad;
    expect(u2 && comoBilingue(u2)).toEqual({
      es: "unidades sintéticas",
      en: "unidades sintéticas",
    });
  });
});
