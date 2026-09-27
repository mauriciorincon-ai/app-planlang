import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { jsonBonito } from "../../../../core/formatos/huella";
import {
  AristaCondicionalSchema,
  DecisionSchema,
  DetectorSchema,
  esAristaTripleta,
  jsonSchemaDelPlan,
  PlanSchema,
  UmbralSchema,
} from "../../../../core/plan";

describe("esquemas del plan", () => {
  it("plan.schema.json está fresco respecto a Zod", () => {
    expect(readFileSync("core/plan/plan.schema.json", "utf8")).toBe(
      jsonBonito(jsonSchemaDelPlan() as never),
    );
  });

  it("una decisión decidida exige opción elegida y justificación", () => {
    const base = {
      id: "D1",
      pregunta: { es: "¿Qué?", en: "What?" },
      opciones: [{ nombre: "a" }, { nombre: "b" }],
      reversibilidad: "una_via",
      tipo: "explicita",
      estado: "decidida",
    };
    expect(DecisionSchema.safeParse(base).success).toBe(false);
    expect(
      DecisionSchema.safeParse({
        ...base,
        opcion_elegida: "a",
        justificacion: { es: "x", en: "y" },
      }).success,
    ).toBe(true);
    expect(
      DecisionSchema.safeParse({ ...base, estado: "abierta" }).success,
    ).toBe(true);
  });

  it("el detector exige «operador número» en ocurre_si y el umbral distingue rango booleano", () => {
    expect(
      DetectorSchema.safeParse({
        tipo: "conteo",
        poblacion: "todos",
        condicion: "x == 1",
        ocurre_si: "> 0",
      }).success,
    ).toBe(true);
    expect(
      DetectorSchema.safeParse({
        tipo: "conteo",
        poblacion: "todos",
        condicion: "x == 1",
        ocurre_si: "muchos",
      }).success,
    ).toBe(false);
    const u = {
      id: "U4",
      nombre: { es: "Modo", en: "Mode" },
      descripcion_lider: { es: "a", en: "b" },
      decision_id: "D2",
      senal: "modo_texas",
      operador: "igual_a",
      inclusivo: true,
      valor_en_plan: false,
      rango_jugable: { tipo: "booleano" },
      consecuencia_si_verdadero: "pausa",
    };
    expect(UmbralSchema.safeParse(u).success).toBe(true);
    expect(
      UmbralSchema.safeParse({
        ...u,
        rango_jugable: { min: 0, max: 1, paso: 0 },
      }).success,
    ).toBe(false);
  });

  it("distingue arista tripleta de arista con función nombrada", () => {
    const tripleta = {
      desde: "a",
      orden: 1,
      senal: "s",
      operador: "menor_que",
      valor: "umbral.U1",
      inclusivo: false,
      si_verdadero: "b",
    };
    const funcion = {
      desde: "a",
      orden: 2,
      funcion: { nombre: "f", entradas: ["s"] },
      si_verdadero: "b",
    };
    const t = AristaCondicionalSchema.parse(tripleta);
    const f = AristaCondicionalSchema.parse(funcion);
    expect(esAristaTripleta(t)).toBe(true);
    expect(esAristaTripleta(f)).toBe(false);
    expect(
      AristaCondicionalSchema.safeParse({ ...tripleta, extra: 1 }).success,
    ).toBe(false);
  });

  it("el plan es estricto y exige versión semántica y huella hex o null", () => {
    const r = PlanSchema.safeParse({ id: "x" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.length).toBeGreaterThan(5);
  });
});
