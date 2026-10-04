/**
 * Gate de contrato del entrevistador (regla 19): Python EMITE el borrador y la transcripción con su serializador
 * real (`agents/tests/entrevista_simulada.py` → `tests/contrato/entrevista-demo-b/`); TypeScript los LEE con el
 * esquema del plan, M1, la transcripción declarada en Zod, las contradicciones y la aprobación. La marca de pendiente
 * es la misma cadena en los dos lados.
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

const DIR = "tests/contrato/entrevista-demo-b";
const borrador = JSON.parse(readFileSync(`${DIR}/v0-borrador.json`, "utf8"));
const crudo = JSON.parse(readFileSync(`${DIR}/transcripcion.json`, "utf8"));

describe("borrador del entrevistador (Python → TS)", () => {
  it("la transcripción valida contra su esquema Zod y su huella verifica", async () => {
    const t = TranscripcionSchema.parse(crudo);
    expect(t.preguntas).toHaveLength(14);
    expect((await verificarHuella(crudo as Record<string, JsonValor>)).ok).toBe(true);
  });

  it("el borrador pasa el esquema del plan y M1, en estado borrador y sin huella", () => {
    expect(PlanSchema.safeParse(borrador).success).toBe(true);
    const v = validarPlan(borrador);
    expect(v.ok).toBe(true);
    expect([borrador.estado_aprobacion, borrador.huella]).toEqual(["borrador", null]);
  });

  it("la revisión: M1 acepta, una contradicción real, nada pendiente, textos que redactó el entrevistador", () => {
    const r = revisarBorrador(borrador, TranscripcionSchema.parse(crudo));
    expect(r.m1.ok).toBe(true);
    expect(r.contradicciones.map((c) => c.codigo)).toEqual(["SEVERIDAD_SIN_CRITERIO"]);
    expect(r.pendientes).toEqual([]);
    expect(r.redactado_por_entrevistador.map((x) => x.pregunta)).toEqual([
      "P01", "P03", "P04", "P05", "P06", "P07", "P10", "P11", "P12",
    ]);
    expect(r.redactado_por_entrevistador.every((x) => x.idioma === "en")).toBe(true);
    expect(r.senales_derivadas).toEqual([{ senal: "extraccion_exacta", leida_por: ["C5"] }]);
    // Una contradicción no pendiente se aprueba solo si el usuario la acepta.
    expect(impideAprobar(r, false)).toBe(true);
    expect(impideAprobar(r, true)).toBe(false);
  });

  it("se aprueba con M1 (huella y firma) sin que el borrador cambie de estado", async () => {
    const a = await aprobarPlan(borrador, { por: "prueba", el: "2026-10-04" });
    expect(a.ok).toBe(true);
    if (a.ok) {
      expect(a.plan.estado_aprobacion).toBe("aprobado");
      expect(a.plan.huella).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(borrador.estado_aprobacion).toBe("borrador");
  });

  it("la marca de pendiente es la misma cadena en Python y en TypeScript", () => {
    const fuente = readFileSync(
      "agents/src/app_agents/entrevistador/borrador.py",
      "utf8",
    );
    expect(fuente).toContain(`MARCA_PENDIENTE = "${MARCA_PENDIENTE}"`);
  });

  it("el documento de revisión sale en los dos idiomas, sin la marca y con cada sección", () => {
    const r = revisarBorrador(borrador, TranscripcionSchema.parse(crudo));
    const es = textoDeRevision(borrador, r, "es");
    const en = textoDeRevision(borrador, r, "en");
    for (const t of [es, en]) expect(t).not.toContain(MARCA_PENDIENTE);
    expect(es).toMatch(/^# Revisión del borrador — plan-demo-b/);
    expect(en).toMatch(/^# Draft review — plan-demo-b/);
    for (const s of ["Problema", "Actores", "Flujo", "Decisiones", "Riesgos", "Supuestos", "Criterios de aceptación", "Umbrales", "Contrato de grafo", "Lotes"])
      expect(es).toContain(`### ${s}`);
    expect(es).toContain("`extraccion_exacta`: la lee C5.");
    expect(en).toContain("P12: the English text was written by the interviewer");
  });
});
