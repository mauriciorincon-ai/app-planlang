/**
 * Plan v1.1 del demo B (S3 fase 3; decisión del usuario 2026-10-04: «v1.1 con los tres»): redacción bilingüe, S1 con
 * una clave que el verificador decide y S2 con la línea base de agente único. Sale de la función de enmienda aplicada
 * al v1 con la misma huella y conserva umbrales y contrato de grafo: las corridas del B siguen valiendo (ADR-005).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  contradicciones,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarBV11 } from "../../../../scripts/enmienda-plan-demo-b";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-b/${v}.json`, "utf8")) as Plan;
const v1 = leer("v1");
const v11 = leer("v1.1");
const codigos = (p: Plan) =>
  contradicciones(p).map((c) => `${c.codigo}:${c.elemento}`);

describe("plan v1.1 del demo B", () => {
  it("se reproduce desde el v1 con la función de enmienda (misma huella) y valida", async () => {
    const r = await aprobarPlan(enmendarBV11(v1), {
      por: v11.aprobado_por!,
      el: v11.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan.huella).toBe(v11.huella);
    expect(validarPlan(v11).ok).toBe(true);
    expect([v11.aprobado_por, v11.aprobado_el]).toEqual([
      "Mauricio Rincón",
      "2026-10-04",
    ]);
  });

  it("misma verdad que el v1: umbrales, contrato de grafo y criterios intactos", () => {
    expect(mismaVerdad(v1, v11)).toBe(true);
    expect(v11.umbrales).toEqual(v1.umbrales);
    expect(v11.contrato_de_grafo).toEqual(v1.contrato_de_grafo);
    expect(v11.criterios_aceptacion).toEqual(v1.criterios_aceptacion);
  });

  it("el v1 trae los tres huecos y la v1.1 ninguno", () => {
    expect(codigos(v1)).toEqual([
      "SOLO_UN_IDIOMA:D1",
      "SOLO_UN_IDIOMA:D3",
      "SOLO_UN_IDIOMA:D4",
      "SOLO_UN_IDIOMA:R1",
      "SOLO_UN_IDIOMA:R2",
      "SOLO_UN_IDIOMA:R3",
      "SOLO_UN_IDIOMA:R4",
      "SUPUESTO_NO_DECIDIBLE:S1",
      "SIN_LINEA_BASE:contrato_de_grafo.linea_base",
    ]);
    expect(codigos(v11)).toEqual([]);
  });

  it("el español del v1 queda palabra por palabra; S1 conserva su mínimo; S2 es la regla estricta del A", () => {
    const opcionV1 = v1.decisiones[0]!.opciones[0]!.nombre;
    expect(v11.decisiones[0]!.opciones[0]!.nombre).toEqual({
      es: opcionV1,
      en: "exact matches only",
    });
    const s1 = v11.supuestos.find((s) => s.id === "S1")!;
    expect(s1.medible_en_trazas).toMatchObject({
      metricas: ["tasa"],
      umbral_confirmacion: { tasa_min: 0.8 },
      condicion: v1.supuestos[0]!.medible_en_trazas!.condicion,
      poblacion: v1.supuestos[0]!.medible_en_trazas!.poblacion,
    });
    const s2 = v11.supuestos.find((s) => s.id === "S2")!;
    expect(s2.medible_en_trazas).toEqual({
      comparacion: "linea_base_agente_unico",
      metricas: ["exactitud", "latencia_mediana"],
      poblacion: "todos",
      umbral_confirmacion: {
        exactitud_dif_min: 0,
        latencia_mediana_razon_max: 1,
      },
    });
  });

  it("un texto sin redacción en inglés detiene la enmienda (no se inventa en silencio)", () => {
    const roto = structuredClone(v1);
    (roto.decisiones[0]!.opciones[0] as { nombre: string }).nombre =
      "una opción nueva";
    expect(() => enmendarBV11(roto)).toThrow(/sin redacción en inglés/);
  });
});
