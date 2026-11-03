/**
 * Plan v1.6 del demo A (S9, «El reloj y los dueños»; el usuario lo aprobó en el G-Plan del S9, chat de la planeadora,
 * 2026-11-02): el plazo legal medible. Sale de la función de enmienda aplicada al v1.5.2 con la misma huella, tiene la
 * misma verdad (ADR-005: la corrida de 200 de la v1.5 sigue valiendo) y lo único nuevo es C11 y el bloque
 * `simulacion_de_plazos`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarAV16 } from "../../../../scripts/enmienda-plan-demo-a";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8")) as Plan;
const v15 = leer("v1.5");
const v152 = leer("v1.5.2");
const v16 = leer("v1.6");

describe("plan v1.6 del demo A", () => {
  it("se reproduce desde el v1.5.2 con la función de enmienda y la firma de su aprobación", async () => {
    const r = await aprobarPlan(enmendarAV16(v152), {
      por: v16.aprobado_por!,
      el: v16.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan).toEqual(v16);
    expect(validarPlan(v16).ok).toBe(true);
    expect([v16.version, v16.aprobado_por, v16.aprobado_el]).toEqual([
      "1.6.0",
      "Mauricio Rincón",
      "2026-11-02",
    ]);
  });

  it("tiene la misma verdad que el v1.5 y el v1.5.2: la corrida de 200 sigue valiendo (ADR-005)", () => {
    expect(mismaVerdad(v15, v16)).toBe(true);
    expect(mismaVerdad(v152, v16)).toBe(true);
  });

  it("solo suma C11 y la simulación de plazos (más versión, huella y aprobación)", () => {
    const sin = (p: Plan) => {
      const x = structuredClone(p) as Record<string, unknown>;
      for (const k of ["version", "huella", "aprobado_el"] as const)
        delete x[k];
      delete x.simulacion_de_plazos;
      x.criterios_aceptacion = p.criterios_aceptacion.filter(
        (c) => c.id !== "C11",
      );
      return x;
    };
    expect(sin(v16)).toEqual(sin(v152));
    expect(v16.criterios_aceptacion.map((c) => c.id)).toEqual([
      ...v152.criterios_aceptacion.map((c) => c.id),
      "C11",
    ]);
  });

  it("C11 es un plazo legal absoluto: hospitalaria y ambulatoria, la urgencia fuera", () => {
    const c11 = v16.criterios_aceptacion.find((c) => c.id === "C11")!;
    expect(c11.tipo).toBe("absoluto");
    expect(c11.valor_objetivo).toBe(true);
    expect(c11.regla_de_medicion).toEqual({
      agregacion: "todos_cumplen",
      condicion: "en_plazo == true",
      poblacion: "tipo_atencion IN ['hospitalaria', 'ambulatoria']",
    });
    expect(c11.enunciado.es).toContain("72 horas");
    expect(c11.enunciado.es).toContain("7 días calendario");
    expect(c11.enunciado.es).toContain("la urgencia no espera (C4)");
  });

  it("la simulación declara la capacidad jugable, el plazo de cada clase y lo que supone", () => {
    const s = v16.simulacion_de_plazos!;
    expect(s.senal_de_clase).toBe("tipo_atencion");
    expect(s.dias_habiles).toBe(5);
    expect(s.jornada).toEqual({ inicio: "08:00", fin: "17:00" });
    expect(s.capacidad_del_auditor.valor).toBe(30);
    expect(s.capacidad_del_auditor.rango_jugable).toEqual({
      min: 10,
      max: 60,
      paso: 5,
    });
    expect(s.clases.map((c) => [c.valor, c.prioridad, c.plazo])).toEqual([
      ["hospitalaria", 1, { cantidad: 72, unidad: "horas" }],
      ["ambulatoria", 2, { cantidad: 7, unidad: "dias_calendario" }],
    ]);
    // «Hospitalaria = expedita» es un supuesto de la simulación y se rotula como tal, en los dos idiomas.
    expect(s.clases[0]!.equivale_a.es).toContain("supuesto de la simulación");
    expect(s.clases[0]!.equivale_a.en).toContain("simulation assumption");
    // La prórroga de la norma no se modela y el plan lo dice.
    expect(s.supuestos.some((t) => /prórroga/.test(t.es))).toBe(true);
    expect(s.supuestos.some((t) => /extension/.test(t.en))).toBe(true);
    expect(s.fuente.norma.es).toContain("CMS-0057-F");
    expect(s.fuente.consultada).toBe("2026-11-03");
  });

  it("los umbrales y el contrato de grafo no se tocan: la capacidad vive fuera de ellos", () => {
    expect(v16.umbrales).toEqual(v152.umbrales);
    expect(v16.contrato_de_grafo).toEqual(v152.contrato_de_grafo);
    expect(v16.umbrales.some((u) => /capacidad/i.test(u.id + u.senal))).toBe(
      false,
    );
  });

  it("la función de enmienda no se aplica dos veces", () => {
    expect(() => enmendarAV16(v16)).toThrow(/ya tiene/);
  });
});
