/** E-5 — ECE, AUROC y curva riesgo-cobertura con valores calculados a mano. */
import { describe, expect, it } from "vitest";
import {
  auroc,
  curvaRiesgoCobertura,
  ece,
  rejilla,
  type Muestra,
} from "../../../../core/brecha/calibracion";

const m = (confianza: number, correcto: boolean, caso_id = "x"): Muestra => ({
  caso_id,
  confianza,
  correcto,
});

describe("ECE", () => {
  it("vacío → null; perfectamente calibrado → 0", () => {
    expect(ece([])).toBeNull();
    expect(ece([m(1, true), m(0.05, false)])).toBe(0.05 / 2);
  });
  it("a mano: dos intervalos", () => {
    // intervalo 9: conf 0.9 y 0.95, aciertos 1/2 → |0.5 − 0.925| = 0.425, peso 2/3
    // intervalo 6: conf 0.6, acierto 1 → |1 − 0.6| = 0.4, peso 1/3
    expect(ece([m(0.9, true), m(0.95, false), m(0.6, true)])).toBeCloseTo(
      (2 / 3) * 0.425 + (1 / 3) * 0.4,
      4,
    );
  });
});

describe("AUROC", () => {
  it("sin las dos clases → null", () => {
    expect(auroc([m(0.9, true), m(0.8, true)])).toBeNull();
    expect(auroc([m(0.9, false)])).toBeNull();
  });
  it("separación perfecta, inversa y empates promediados", () => {
    expect(auroc([m(0.9, true), m(0.8, true), m(0.3, false)])).toBe(1);
    expect(auroc([m(0.2, true), m(0.8, false)])).toBe(0);
    expect(auroc([m(0.5, true), m(0.5, false)])).toBe(0.5);
    expect(
      auroc([m(0.9, true), m(0.5, true), m(0.5, false), m(0.1, false)]),
    ).toBe(0.875);
  });
  it("el orden de entrada no cambia el resultado", () => {
    const xs = [
      m(0.7, true),
      m(0.4, false),
      m(0.7, false),
      m(0.9, true),
      m(0.2, true),
    ];
    expect(auroc([...xs].reverse())).toBe(auroc(xs));
  });
});

describe("curva riesgo-cobertura", () => {
  it("rejilla sin deriva de coma flotante", () => {
    expect(rejilla({ min: 0.5, max: 0.95, paso: 0.05 })).toEqual([
      0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95,
    ]);
  });
  it("escala lo que la arista del plan marca; el riesgo es el error entre lo aceptado", () => {
    const xs = [m(0.9, true), m(0.8, false), m(0.6, true), m(0.75, true)];
    const c = curvaRiesgoCobertura(xs, [0.5, 0.75, 0.95], "menor_que", false);
    expect(c).toEqual([
      { umbral: 0.5, cobertura: 1, riesgo: 0.25, aceptados: 4 },
      { umbral: 0.75, cobertura: 0.75, riesgo: 0.3333, aceptados: 3 },
      { umbral: 0.95, cobertura: 0, riesgo: null, aceptados: 0 },
    ]);
    expect(
      curvaRiesgoCobertura(xs, [0.75], "menor_que", true)[0]?.aceptados,
    ).toBe(2);
    expect(curvaRiesgoCobertura([], [0.5], "menor_que", false)[0]).toEqual({
      umbral: 0.5,
      cobertura: 0,
      riesgo: null,
      aceptados: 0,
    });
  });
});
