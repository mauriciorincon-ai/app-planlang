/**
 * La vista de un plan sin corrida (S5): lo que la ficha dice que no hay, el origen de cada elemento tal como lo guardó el
 * plan, y la vista en los dos idiomas. Plan de prueba: el borrador del gate de contrato de dom-seguridad-ia, aprobado aquí.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan, PlanSchema } from "../../../core/plan";
import { planSinCorrida } from "../../../src/lib/datos/planes";
import {
  vistaSinCorrida,
  type ContextoDelPlan,
} from "../../../src/lib/vista/plan-sin-corrida";

const borrador = JSON.parse(
  readFileSync(
    "tests/contrato/entrevista-dominio-nuevo/v0-borrador.json",
    "utf8",
  ),
);

async function aprobado() {
  const a = await aprobarPlan(borrador, { por: "prueba", el: "2026-10-11" });
  if (!a.ok) throw new Error("el borrador de prueba debe aprobarse");
  return PlanSchema.parse(a.plan);
}

describe("vistaSinCorrida", () => {
  it("dice que no hay corrida y lista lo que falta, en los dos idiomas", async () => {
    const p = await aprobado();
    const es = vistaSinCorrida(p, "es");
    const en = vistaSinCorrida(p, "en");
    expect(es.ficha.etiqueta).toBe("Sin corrida");
    expect(es.ficha.falta).toContain("trazas, brecha, playground, visor");
    expect(en.ficha.etiqueta).toBe("No run");
    expect(en.ficha.falta).toContain("traces, gap, playground, viewer");
  });

  it("muestra la aprobación y la huella del plan aprobado", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    expect(v.aprobacion).toBe("prueba · el 2026-10-11");
    expect(v.huella).toMatch(/^[0-9a-f]{64}$/);
    expect(v.id).toBe(p.id);
  });

  it("pinta cada sección con sus elementos completos, sin inventar ninguno", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    const cuenta = Object.fromEntries(
      v.secciones.map((s) => [s.id, s.elementos.length]),
    );
    expect(cuenta).toEqual({
      actores: p.actores.length,
      decisiones: p.decisiones.length,
      riesgos: p.riesgos.length,
      supuestos: p.supuestos.length,
      criterios: p.criterios_aceptacion.length,
      umbrales: p.umbrales.length,
    });
  });

  it("el origen de cada elemento es el que guardó el plan: plantilla, entrevistador o usuario", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    const origenes = v.secciones.flatMap((s) =>
      s.elementos.map((e) => e.origen),
    );
    // Todo elemento del plan de prueba trae origen: ninguno cae en «sin origen declarado».
    expect(new Set(origenes)).toEqual(new Set(["plantilla", "usuario"]));
    const decisionesUsuario = v.secciones
      .find((s) => s.id === "decisiones")!
      .elementos.filter((e) => e.origen === "usuario").length;
    expect(decisionesUsuario).toBe(p.decisiones.length);
  });

  it("ningún enum del plan sale crudo: reversibilidad, criticidad, estado, tipo de actor y operador van en palabras (AU-S5 M-1)", async () => {
    const p = await aprobado();
    for (const i of ["es", "en"] as const) {
      const v = vistaSinCorrida(p, i);
      const detalles = v.secciones.flatMap((s) =>
        s.elementos.flatMap((e) => e.detalle),
      );
      for (const d of detalles)
        expect(d).not.toMatch(
          /\b(una_via|dos_vias|costosa|sin_probar|menor_que|mayor_que|menor_o_igual_que|mayor_o_igual_que|igual_a|distinto_de)\b/,
        );
    }
    const dec = vistaSinCorrida(p, "es").secciones.find(
      (s) => s.id === "decisiones",
    )!.elementos[0]!;
    expect(dec.detalle.at(-1)).toMatch(
      /^Reversibilidad: (Una vía|Dos vías|Costosa)$/,
    );
  });

  it("los umbrales dicen su señal, su operador y su valor del plan, sin unidad inventada", async () => {
    const p = await aprobado();
    const umbral = vistaSinCorrida(p, "en").secciones.find(
      (s) => s.id === "umbrales",
    )!.elementos[0]!;
    expect(umbral.detalle[0]).toMatch(
      /similitud_cita|similitud_max|fuentes_verificadas|antiguedad_marco_dias/,
    );
    expect(umbral.origen).toBe("user");
  });
});

/**
 * S6, el primer uso real: la v2 de HackGuard con las respuestas que el usuario revisó. La ficha dice de quién son las
 * respuestas y cuándo fue la entrevista (los dos salen del archivo que la entrevista usó), nombra la v1 que queda como
 * historia, y cada riesgo trae su prioridad de acción y, si lo hay, su control legal.
 */
describe("vistaSinCorrida · de quién es el plan y cada riesgo", () => {
  const huellaV1 =
    "bf05e61da1a27baca04d0dc07b6300cb8eb31531d44912ad3768f7598cc2ca60";

  it("la v2 dice que el usuario revisó y confirmó las respuestas, qué cambió y cuándo fue la entrevista", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const contexto: ContextoDelPlan = {
      respuestas: p.respuestas,
      anteriores: p.anteriores,
    };
    const es = vistaSinCorrida(p.plan, "es", contexto);
    expect(es.version).toBe("2.0.0");
    expect(es.respuestas).toBe(
      "Revisadas y confirmadas por el usuario el 2026-10-11 · preguntas que cambió al revisar: P03, P08, P09",
    );
    expect(es.entrevista).toBe("2026-10-11");
    expect(es.aprobacion).toBe("Mauricio Rincón · el 2026-10-11");
    expect(es.anteriores).toEqual([
      `v1.0.0 · Mauricio Rincón el 2026-10-11 · respuestas delegadas al constructor · ${huellaV1.slice(0, 8)}…`,
    ]);
    const en = vistaSinCorrida(p.plan, "en", contexto);
    expect(en.respuestas).toBe(
      "Reviewed and confirmed by the user on 2026-10-11 · questions it changed on review: P03, P08, P09",
    );
    expect(en.anteriores[0]).toContain("answers delegated to the builder");
  });

  it("la v1, vista sola, dice que las respuestas se delegaron al constructor y no tiene historia", () => {
    const v1 = PlanSchema.parse(
      JSON.parse(readFileSync("plans/hackguard-agentes/v1.json", "utf8")),
    );
    const v = vistaSinCorrida(v1, "es", {
      respuestas: {
        clase: "delegadas",
        entrevista: "2026-10-11",
        revision: null,
      },
      anteriores: [],
    });
    expect(v.version).toBe("1.0.0");
    expect(v.respuestas).toBe(
      "Delegadas al constructor: el usuario no las escribió",
    );
    expect(v.anteriores).toEqual([]);
    expect(v.secciones.find((x) => x.id === "riesgos")!.elementos).toHaveLength(
      4,
    );
  });

  it("sin contexto la ficha no inventa: dice que el repo no guarda quién respondió", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const v = vistaSinCorrida(p.plan, "es");
    expect(v.respuestas).toBe("El repo no guarda quién respondió");
    expect(v.entrevista).toBeNull();
    expect(v.anteriores).toEqual([]);
  });

  it("unas respuestas revisadas sin preguntas cambiadas lo dicen", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const v = vistaSinCorrida(p.plan, "es", {
      respuestas: {
        clase: "revisadas",
        entrevista: "2026-10-12",
        revision: { fecha: "2026-10-13", cambiadas: [] },
      },
      anteriores: [],
    });
    expect(v.respuestas).toBe(
      "Revisadas y confirmadas por el usuario el 2026-10-13 · no cambió ninguna pregunta al revisar",
    );
    expect(v.entrevista).toBe("2026-10-12");
  });

  it("los cinco riesgos de la v2 traen su prioridad de acción por la tabla, en los dos idiomas", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const prioridad = (i: "es" | "en") =>
      Object.fromEntries(
        vistaSinCorrida(p.plan, i)
          .secciones.find((s) => s.id === "riesgos")!
          .elementos.map((e) => [e.id, e.detalle.at(-1)]),
      );
    expect(prioridad("es")).toEqual({
      R1: "Prioridad de acción: AP alta",
      R2: "Prioridad de acción: AP alta",
      R3: "Prioridad de acción: AP alta",
      R4: "Prioridad de acción: AP baja",
      R5: "Prioridad de acción: AP alta",
    });
    expect(prioridad("en").R4).toBe("Action priority: AP low");
    expect(prioridad("en").R5).toBe("Action priority: AP high");
  });

  it("un riesgo con control legal sube a prioridad alta y dice cuál era la de la tabla", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const conLegal = {
      ...p.plan,
      riesgos: p.plan.riesgos.map((r) =>
        r.id === "R4" ? { ...r, control_legal: true } : r,
      ),
    };
    const r4 = (i: "es" | "en") =>
      vistaSinCorrida(conLegal, i)
        .secciones.find((s) => s.id === "riesgos")!
        .elementos.find((e) => e.id === "R4")!
        .detalle.at(-1);
    expect(r4("es")).toBe(
      "Prioridad de acción: AP alta · control legal (tabla: baja)",
    );
    expect(r4("en")).toBe(
      "Action priority: AP high · legal control (table: low)",
    );
  });
});
