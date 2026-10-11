/**
 * Gate de contrato de «un dominio nuevo es solo datos» (S5, regla 19): Python EMITE el borrador y la transcripción de
 * una entrevista sobre `dom-seguridad-ia` con su serializador real (`agents/tests/entrevista_dominio_nuevo.py` →
 * `tests/contrato/entrevista-dominio-nuevo/`); TypeScript los LEE con el esquema del plan, M1, las contradicciones y la
 * aprobación, sin ninguna regla propia del dominio. Si el dominio exigiera tocar `core/`, esta prueba lo diría.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verificarHuella } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import {
  aprobarPlan,
  impideAprobar,
  MARCA_PENDIENTE,
  PlanSchema,
  revisarBorrador,
  textoDeRevision,
  TranscripcionSchema,
  validarPlan,
} from "../../core/plan";

const DIR = "tests/contrato/entrevista-dominio-nuevo";
const borrador = JSON.parse(readFileSync(`${DIR}/v0-borrador.json`, "utf8"));
const crudo = JSON.parse(readFileSync(`${DIR}/transcripcion.json`, "utf8"));

describe("borrador de un dominio nuevo (Python → TS)", () => {
  it("la transcripción valida contra su esquema Zod, nombra su plantilla y su huella verifica", async () => {
    const t = TranscripcionSchema.parse(crudo);
    expect(t.preguntas).toHaveLength(14);
    expect(t.plantilla.id).toBe("dom-seguridad-ia");
    expect(t.plan_id).toBe("fixture-dominio-nuevo");
    expect((await verificarHuella(crudo as Record<string, JsonValor>)).ok).toBe(
      true,
    );
  });

  it("el borrador pasa el esquema del plan y M1 con la plantilla nueva, en estado borrador y sin huella", () => {
    expect(PlanSchema.safeParse(borrador).success).toBe(true);
    expect(validarPlan(borrador).ok).toBe(true);
    expect([
      borrador.dominio_id,
      borrador.estado_aprobacion,
      borrador.huella,
    ]).toEqual(["dom-seguridad-ia", "borrador", null]);
  });

  it("la revisión: M1 acepta, ninguna contradicción ni pendiente, y el comando para retomar nombra el dominio", () => {
    const r = revisarBorrador(borrador, TranscripcionSchema.parse(crudo));
    expect(r.m1.ok).toBe(true);
    expect(r.contradicciones).toEqual([]);
    expect(r.pendientes).toEqual([]);
    expect(impideAprobar(r, false)).toBe(false);
  });

  it("se aprueba con M1 (huella y firma) sin que el borrador cambie de estado", async () => {
    const a = await aprobarPlan(borrador, { por: "prueba", el: "2026-10-11" });
    expect(a.ok).toBe(true);
    if (a.ok) {
      expect(a.plan.estado_aprobacion).toBe("aprobado");
      expect(a.plan.huella).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(borrador.estado_aprobacion).toBe("borrador");
  });

  it("el documento de revisión nombra el plan real: su comando de aprobación y su carpeta, no los de un demo", () => {
    const r = revisarBorrador(borrador, TranscripcionSchema.parse(crudo));
    const es = textoDeRevision(borrador, r, "es");
    const en = textoDeRevision(borrador, r, "en");
    for (const md of [es, en]) {
      expect(md).not.toContain(MARCA_PENDIENTE);
      expect(md).toContain(
        "pnpm plan:aprobar --dominio dom-seguridad-ia --plan fixture-dominio-nuevo --por",
      );
      expect(md).toContain("`plans/fixture-dominio-nuevo/v1.json`");
      expect(md).not.toMatch(/--demo |plans\/demo-/);
    }
    expect(es).toContain("«apruebo el plan fixture-dominio-nuevo»");
    expect(en).toContain("“I approve plan fixture-dominio-nuevo”");
  });
});
