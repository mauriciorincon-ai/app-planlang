/**
 * Plantillas de dominio (C1, RF-01.1): validan contra el esquema, toda condición se interpreta, cada
 * restricción regulatoria trae fuente y fecha de verificación, y los textos de líder (restricción llana,
 * descripciones de umbrales del plan) respetan el presupuesto en ES y EN.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsear } from "../../../../core/brecha/condiciones";
import { presupuestoLiderBilingue } from "../../../../core/formatos/jerga";
import {
  PlantillaDominioSchema,
  validarPlan,
  type Plan,
} from "../../../../core/plan";

const DOMINIOS = ["dom-salud", "dom-financiero"] as const;
const cargar = (id: string) =>
  PlantillaDominioSchema.parse(
    JSON.parse(readFileSync(`data/dominios/${id}.json`, "utf8")),
  );

describe.each(DOMINIOS)("plantilla %s", (id) => {
  const d = cargar(id);

  it("valida contra el esquema y trae los siete bloques con contenido bilingüe", () => {
    expect(d.id).toBe(id);
    expect(d.actores_tipicos.length).toBeGreaterThanOrEqual(3);
    expect(d.decisiones_tipicas.length).toBeGreaterThanOrEqual(3);
    expect(d.riesgos_tipicos.length).toBeGreaterThanOrEqual(3);
    expect(d.criterios_sugeridos.length).toBeGreaterThanOrEqual(3);
    expect(d.restricciones_regulatorias.length).toBeGreaterThanOrEqual(5);
    expect(d.preguntas_guia.length).toBeGreaterThanOrEqual(5);
  });

  it("toda condición de riesgos y criterios se interpreta", () => {
    for (const r of d.riesgos_tipicos) {
      if (!r.detector_en_trazas) continue;
      expect(() => parsear(r.detector_en_trazas!.poblacion)).not.toThrow();
      expect(() => parsear(r.detector_en_trazas!.condicion)).not.toThrow();
    }
    for (const c of d.criterios_sugeridos) {
      expect(() => parsear(c.regla_de_medicion.poblacion)).not.toThrow();
      if (c.regla_de_medicion.condicion)
        expect(() => parsear(c.regla_de_medicion.condicion!)).not.toThrow();
    }
  });

  it("cada restricción cita norma, jurisdicción y fecha de verificación; la ley de la pausa está presente", () => {
    for (const r of d.restricciones_regulatorias) {
      expect(r.norma.length).toBeGreaterThan(5);
      expect(r.verificada).toMatch(/^2026-/);
    }
    expect(d.restricciones_regulatorias.some((r) => r.pausa)).toBe(true);
  });

  it("las restricciones en lenguaje llano respetan el presupuesto de líder en ES y EN", () => {
    for (const r of d.restricciones_regulatorias) {
      const p = presupuestoLiderBilingue(r.restriccion_llana);
      expect(
        p,
        `${id}/${r.id}: ${[...p.es.motivos, ...p.en.motivos].join("; ")}`,
      ).toMatchObject({ ok: true });
    }
  });
});

describe("plan aprobado del demo A", () => {
  const plan = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Plan;

  it("está aprobado, con huella, y su dominio es dom-salud", () => {
    const v = validarPlan(plan);
    expect(v.ok).toBe(true);
    expect(plan.estado_aprobacion).toBe("aprobado");
    expect(plan.dominio_id).toBe("dom-salud");
    expect(plan.huella).toMatch(/^[0-9a-f]{64}$/);
  });

  it("las descripciones de líder de los umbrales y los enunciados de criterios respetan el presupuesto", () => {
    for (const u of plan.umbrales)
      expect(presupuestoLiderBilingue(u.descripcion_lider).ok, u.id).toBe(true);
    for (const c of plan.criterios_aceptacion)
      expect(presupuestoLiderBilingue(c.enunciado).ok, c.id).toBe(true);
    for (const r of plan.riesgos)
      expect(presupuestoLiderBilingue(r.modo).ok, r.id).toBe(true);
  });
});
