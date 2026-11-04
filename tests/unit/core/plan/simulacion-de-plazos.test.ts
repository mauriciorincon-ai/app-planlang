/**
 * M1 y la simulación de plazos (S9): un bloque que no puede correr —jornada al revés, capacidad fuera de su rango o de
 * su paso, clases repetidas, una señal que la traza no declara— se rechaza con su nombre. Y un plan sin el bloque (todos
 * los anteriores) sigue valiendo: el campo es opcional.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validarPlan, type Plan } from "../../../../core/plan";

const v16 = JSON.parse(readFileSync("plans/demo-a/v1.6.json", "utf8")) as Plan;
const v152 = JSON.parse(
  readFileSync("plans/demo-a/v1.5.2.json", "utf8"),
) as Plan;

function con(cambio: (s: NonNullable<Plan["simulacion_de_plazos"]>) => void) {
  const p = structuredClone(v16);
  cambio(p.simulacion_de_plazos!);
  return validarPlan(p);
}

function motivos(r: ReturnType<typeof validarPlan>) {
  return r.ok ? [] : r.motivos.map((m) => [m.codigo, m.elemento]);
}

describe("M1: simulacion_de_plazos", () => {
  it("el v1.6 aprobado pasa, y los planes sin el bloque también", () => {
    expect(validarPlan(v16).ok).toBe(true);
    expect(v152.simulacion_de_plazos).toBeUndefined();
    expect(validarPlan(v152).ok).toBe(true);
  });

  it("rechaza una señal de clase que la traza no declara", () => {
    const r = con((s) => {
      s.senal_de_clase = "no_existe";
    });
    expect(motivos(r)).toContainEqual([
      "SIMULACION_INCOHERENTE",
      "simulacion_de_plazos.senal_de_clase",
    ]);
  });

  it("rechaza una jornada que termina antes de empezar", () => {
    const r = con((s) => {
      s.jornada = { inicio: "17:00", fin: "08:00" };
    });
    expect(motivos(r)).toContainEqual([
      "SIMULACION_INCOHERENTE",
      "simulacion_de_plazos.jornada",
    ]);
  });

  it("rechaza una capacidad fuera de su rango jugable o fuera de su paso", () => {
    const fuera = con((s) => {
      s.capacidad_del_auditor.valor = 75;
    });
    expect(motivos(fuera)).toContainEqual([
      "SIMULACION_INCOHERENTE",
      "simulacion_de_plazos.capacidad_del_auditor",
    ]);
    const sinPaso = con((s) => {
      s.capacidad_del_auditor.valor = 33;
    });
    expect(motivos(sinPaso)).toContainEqual([
      "SIMULACION_INCOHERENTE",
      "simulacion_de_plazos.capacidad_del_auditor",
    ]);
  });

  it("rechaza dos clases iguales o dos con la misma prioridad", () => {
    const igual = con((s) => {
      s.clases[1]!.valor = s.clases[0]!.valor;
    });
    expect(motivos(igual).map((m) => m[0])).toContain("SIMULACION_INCOHERENTE");
    const empate = con((s) => {
      s.clases[1]!.prioridad = s.clases[0]!.prioridad;
    });
    expect(motivos(empate).map((m) => m[0])).toContain(
      "SIMULACION_INCOHERENTE",
    );
  });

  it("el esquema es estricto: una clave desconocida en el bloque es un error de esquema", () => {
    const p = structuredClone(v16) as Record<string, unknown>;
    (p.simulacion_de_plazos as Record<string, unknown>).sorpresa = 1;
    const r = validarPlan(p);
    expect(r.ok).toBe(false);
    expect(motivos(r).map((m) => m[0])).toContain("ESQUEMA");
  });
});
