/**
 * Plan de beneficios v2.0.0 del demo A (S3, «Tope por servicio»): sale de la enmienda del v1.0.0 y de nada más, con
 * los topes de la regla fija, y con él el generador 1.1.0 siembra aprobaciones parciales (RB-08) cuya escalada depende
 * del modo Texas (U4). Con el v1.0.0 el generador no cambia un byte (lo prueban los lotes versionados).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conHuella, verificarHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import type { Plan } from "../../../../core/plan";
import {
  PlanBeneficiosSchema,
  type PlanBeneficios,
} from "../../../../core/sintetico/esquema";
import {
  exigirTopeAltoCosto,
  generarLote,
  SUBTIPO_TOPE,
  umbralesDelPlan,
  VERSION_GENERADOR_TOPE,
} from "../../../../core/sintetico/generador";
import {
  enmendarPlanBeneficiosV2,
  topeDe,
} from "../../../../scripts/enmienda-plan-beneficios-demo-a";

const leer = (r: string) => JSON.parse(readFileSync(r, "utf8"));
const v1 = PlanBeneficiosSchema.parse(leer("data/plan-beneficios/demo-a.json"));
const crudoV2 = leer("data/plan-beneficios/demo-a-v2.json");
const v2 = PlanBeneficiosSchema.parse(crudoV2);
const plan = leer("plans/demo-a/v1.4.json") as Plan;
const { U2 } = umbralesDelPlan(plan);
const conTexas = (valor: boolean): Plan => ({
  ...plan,
  umbrales: plan.umbrales.map((u) =>
    u.id === "U4" ? { ...u, valor_en_plan: valor } : u,
  ),
});

describe("plan de beneficios v2.0.0", () => {
  it("es la enmienda del v1.0.0, sellada: mismos bytes y huella que verifica", async () => {
    const sellado = await conHuella(
      enmendarPlanBeneficiosV2(v1, U2) as unknown as Record<string, JsonValor>,
    );
    expect(sellado).toEqual(crudoV2);
    expect((await verificarHuella(crudoV2)).ok).toBe(true);
    expect(v2.huella).not.toBe(v1.huella);
  });

  it("6 topes por la regla fija, cada uno bajo su costo y solo en servicios que requieren autorización", () => {
    const topes = v2.procedimientos.filter((p) => p.tope_cobertura != null);
    expect(topes.map((p) => [p.codigo, p.costo, p.tope_cobertura])).toEqual([
      ["SYN-P-001", 850, 590],
      ["SYN-P-003", 600, 420],
      ["SYN-P-016", 520, 360],
      ["SYN-P-017", 350, 240],
      ["SYN-P-019", 700, 490],
      ["SYN-P-028", 480, 330],
    ]);
    for (const p of v2.procedimientos)
      expect(p.tope_cobertura ?? null, p.codigo).toBe(topeDe(p, U2));
  });

  it("trae RB-08 y deja el resto del plan de beneficios igual", () => {
    expect(v2.reglas.map((r) => r.id)).toEqual([
      ...v1.reglas.map((r) => r.id),
      "RB-08",
    ]);
    expect(v2.causales_de_exclusion).toEqual(v1.causales_de_exclusion);
    const sinTope = v2.procedimientos.map((p) => {
      const q = { ...p };
      delete q.tope_cobertura;
      return q;
    });
    expect(sinTope).toEqual(v1.procedimientos);
  });

  it("el esquema rechaza un tope en un servicio excluido o un tope que no es menor que el costo", () => {
    const malo = (cambio: Partial<PlanBeneficios["procedimientos"][number]>) =>
      PlanBeneficiosSchema.safeParse({
        ...v2,
        procedimientos: v2.procedimientos.map((p, i) =>
          i === 0 ? { ...p, ...cambio } : p,
        ),
      }).success;
    expect(malo({ tope_cobertura: 900 })).toBe(false);
    const excluido = v2.procedimientos.find((p) => p.estado === "excluido")!;
    expect(
      PlanBeneficiosSchema.safeParse({
        ...v2,
        procedimientos: v2.procedimientos.map((p) =>
          p === excluido ? { ...p, tope_cobertura: 10 } : p,
        ),
      }).success,
    ).toBe(false);
  });
});

describe("generador 1.1.0 con topes", () => {
  it("siembra aprobaciones parciales que solo escalan con el modo Texas", async () => {
    const op = { semilla: "planlang-a-prueba-tope", n: 40, planBeneficios: v2 };
    const sin = await generarLote({ ...op, plan: conTexas(false) });
    const con = await generarLote({ ...op, plan: conTexas(true) });
    expect(sin.version_generador).toBe(VERSION_GENERADOR_TOPE);
    const parciales = sin.casos.filter(
      (c) => c.verdad_conocida.decision === "aprobar_parcial",
    );
    expect(parciales.length).toBeGreaterThan(0);
    expect(sin.casos.some((c) => c.subtipo === SUBTIPO_TOPE)).toBe(true);
    for (const c of parciales) {
      const p = v2.procedimientos.find(
        (x) => x.codigo === c.verdad_conocida.campos.procedimiento,
      )!;
      expect(c.verdad_conocida.campos.costo_estimado!).toBeGreaterThan(
        p.tope_cobertura!,
      );
      expect(c.verdad_conocida.motivos_escalamiento).not.toContain(
        "modo_texas",
      );
      const gemelo = con.casos.find((x) => x.id === c.id)!;
      expect(gemelo.verdad_conocida.motivos_escalamiento).toContain(
        "modo_texas",
      );
      expect(gemelo.verdad_conocida.debe_escalar).toBe(true);
    }
    // Un «aprobable» nunca cae en un servicio con tope.
    for (const c of sin.casos.filter((x) => x.subtipo === "normal_aprobable"))
      expect(
        v2.procedimientos.find(
          (x) => x.codigo === c.verdad_conocida.campos.procedimiento,
        )!.tope_cobertura,
      ).toBeNull();
  });

  it("M-18: el tope de alto costo del plan de beneficios se lee y tiene que ser el umbral del costo (U2)", () => {
    expect(() => exigirTopeAltoCosto(plan, v2)).not.toThrow();
    expect(() =>
      exigirTopeAltoCosto(plan, { ...v2, tope_alto_costo: "umbral.U9" }),
    ).toThrow(/que el plan no declara/);
    expect(() =>
      exigirTopeAltoCosto(plan, { ...v2, tope_alto_costo: "umbral.U1" }),
    ).toThrow(/no es el umbral del costo estimado/);
  });
});
