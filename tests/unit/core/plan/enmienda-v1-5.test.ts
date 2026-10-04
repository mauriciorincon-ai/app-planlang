/**
 * Plan v1.5 del demo A (S3: G-Plan del 2026-10-04 y «Tope por servicio» del usuario): la aprobación parcial hace
 * jugable el modo Texas (U4), M-16 manda a una persona lo que la guardia de entrada marca, M-8 amplía la pausa y U2
 * gana su unidad en los dos idiomas. Sale de la función de enmienda aplicada al v1.4 con la misma huella; cambia el
 * contrato de grafo, así que su lote de 200 es otro (`planlang-a-002`, con el plan de beneficios v2).
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
import { enmendarAV15 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v14 = leer("v1.4");
const v15 = leer("v1.5");
const lote = JSON.parse(
  readFileSync("data/casos/demo-a/planlang-a-002-200.json", "utf8"),
) as {
  plan: { huella: string };
  plan_beneficios: { version: string };
  casos: { verdad_conocida: { decision: string; debe_escalar: boolean } }[];
};

describe("plan v1.5 del demo A", () => {
  it("se reproduce desde el v1.4 con la función de enmienda (misma huella), valida y lo aprobó el G-Plan", async () => {
    const r = await aprobarPlan(enmendarAV15(v14), {
      por: v15.aprobado_por!,
      el: v15.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    // El archivo entero, no solo la huella: uno editado a mano que conserva la huella vieja también falla.
    if (r.ok) expect(r.plan).toEqual(v15);
    expect(validarPlan(v15).ok).toBe(true);
    expect([v15.aprobado_por, v15.aprobado_el]).toEqual([
      "Mauricio Rincón",
      "2026-10-04",
    ]);
  });

  it("M-16: la carga detectada es la primera arista de decision, hacia la pausa; las demás bajan un lugar", () => {
    const cg = v15.contrato_de_grafo;
    const propias = (p: Plan) =>
      p.contrato_de_grafo.aristas_condicionales
        .filter((a) => a.desde === "decision")
        .sort((a, b) => a.orden - b.orden);
    const [carga, ...resto] = propias(v15);
    expect(carga).toMatchObject({
      senal: "carga_detectada",
      operador: "igual_a",
      valor: true,
      si_verdadero: "pausa_humana",
    });
    expect(resto.map((a) => a.orden)).toEqual(
      propias(v14).map((a) => a.orden + 1),
    );
    expect(cg.senales_obligatorias_en_traza).toContain("carga_detectada");
    expect(
      JSON.stringify(
        v15.riesgos.find((r) => r.id === "R3")!.mitigaciones.at(-1)!.accion,
      ),
    ).toContain("carga_detectada");
  });

  it("U4 mueve casos: D2 permite aprobar en parte sin humano solo sin el modo Texas; R10 y C10 lo vigilan", () => {
    const d2 = v15.decisiones.find((d) => d.id === "D2")!;
    expect(JSON.stringify(d2.opcion_elegida)).toMatch(/aprobar en parte/);
    expect(d2.riesgos_asociados).toEqual(["R1", "R10"]);
    const r10 = v15.riesgos.find((r) => r.id === "R10")!;
    expect(r10.detector_en_trazas?.condicion).toBe(
      "modo_texas == true AND decision_final == 'aprobar_parcial' AND pausa_humana == false",
    );
    const c10 = v15.criterios_aceptacion.find((c) => c.id === "C10")!;
    expect(c10.regla_de_medicion.condicion).toContain("IMPLICA");
    const texas = v15.contrato_de_grafo.aristas_condicionales.find(
      (a) => !esAristaTripleta(a) && a.funcion.nombre === "texas_y_no_aprobar",
    );
    expect(texas?.orden).toBe(6);
    // C8: la aprobación parcial es adversa y también lleva su documento.
    expect(
      v15.criterios_aceptacion.find((c) => c.id === "C8")!.regla_de_medicion
        .poblacion,
    ).toBe("decision_final IN ['negar', 'aprobar_parcial']");
    // C1 sigue igual: la negación completa siempre con una persona.
    expect(v15.criterios_aceptacion.find((c) => c.id === "C1")).toEqual(
      v14.criterios_aceptacion.find((c) => c.id === "C1"),
    );
  });

  it("M-8 amplía la pausa, U2 trae su unidad en ES y EN y los demás umbrales no cambian", () => {
    expect(v15.contrato_de_grafo.pausas_humanas[0]!.payload_minimo).toEqual([
      ...v14.contrato_de_grafo.pausas_humanas[0]!.payload_minimo,
      "orden_adjunta",
      "aclaraciones",
      "cobertura",
    ]);
    const u2 = v15.umbrales.find((u) => u.id === "U2")!;
    expect(u2.unidad).toEqual({
      es: "unidades sintéticas",
      en: "synthetic units",
    });
    expect(v15.umbrales.map((u) => ({ ...u, unidad: null }))).toEqual(
      v14.umbrales.map((u) => ({ ...u, unidad: null })),
    );
  });

  it("otra verdad por contrato: su lote de 200 es el 002, con el plan de beneficios v2 y 9 aprobaciones parciales", () => {
    expect(mismaVerdad(v14, v15)).toBe(false);
    expect(lote.plan.huella).toBe(v15.huella);
    expect(lote.plan_beneficios.version).toBe("2.0.0");
    const parciales = lote.casos.filter(
      (c) => c.verdad_conocida.decision === "aprobar_parcial",
    );
    expect(parciales).toHaveLength(9);
    // Con el modo Texas apagado (valor del plan) ninguna escala por ser parcial.
    expect(parciales.every((c) => !c.verdad_conocida.debe_escalar)).toBe(true);
  });
});
