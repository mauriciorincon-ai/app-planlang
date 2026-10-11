/**
 * La vista de un plan sin corrida (S5): lo que la ficha dice que no hay, el origen de cada elemento tal como lo guardó el
 * plan, y la vista en los dos idiomas. Plan de prueba: el borrador del gate de contrato de dom-seguridad-ia, aprobado aquí.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan, PlanSchema } from "../../../core/plan";
import { vistaSinCorrida } from "../../../src/lib/vista/plan-sin-corrida";

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
