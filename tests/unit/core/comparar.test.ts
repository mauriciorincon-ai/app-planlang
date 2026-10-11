// @vitest-environment node
/**
 * La comparación de dos corridas (S4): las categorías de la pausa frente a la verdad y la lectura de las señales de una
 * traza. El veredicto por lado sale de criterios y riesgos; sin ninguno, cumple. Lo que cruza dos corridas reales va en
 * tests/integration/comparar.test.ts.
 */
import { describe, expect, it } from "vitest";
import { categoriaDePausa, filaDeCaso, verdadDe } from "@core/comparar";
import { veredictoDeCriteriosYRiesgos } from "@core/brecha/veredicto";
import type { CasoDeDemo } from "@core/sintetico/de-demo";
import type { Traza } from "@core/formatos/traza";

const traza = (senales: Record<string, unknown>) =>
  ({ senales }) as unknown as Traza;

describe("categoría de la pausa frente a la verdad", () => {
  it("cubre las cuatro combinaciones de (debía escalar, se pausó)", () => {
    expect(categoriaDePausa(true, true)).toBe("necesaria");
    expect(categoriaDePausa(false, true)).toBe("innecesaria");
    expect(categoriaDePausa(true, false)).toBe("omitida");
    expect(categoriaDePausa(false, false)).toBe("sin_pausa_correcta");
  });
});

describe("lectura de las señales de una traza", () => {
  it("toma la decisión final y la propuesta como texto, y la pausa solo si es verdadera", () => {
    expect(
      filaDeCaso(
        traza({ decision_final: "negar", propuesta: "negar", pausa_humana: true }),
      ),
    ).toEqual({ decision_final: "negar", propuesta: "negar", pausa: true });
  });

  it("una señal ausente o no textual es null, nunca un valor inventado", () => {
    expect(filaDeCaso(traza({ propuesta: 3, pausa_humana: "sí" }))).toEqual({
      decision_final: null,
      propuesta: null,
      pausa: false,
    });
  });
});

describe("verdad conocida del caso", () => {
  it("nombra el caso que no está en el lote, en lugar de inventar su verdad", () => {
    expect(() => verdadDe(new Map<string, CasoDeDemo>(), "A-999")).toThrow(
      /A-999/,
    );
  });
});

describe("veredicto de un lado: solo criterios y riesgos", () => {
  it("sin criterios ni riesgos que contar, el lado cumple y no tiene motivos", () => {
    expect(veredictoDeCriteriosYRiesgos([], [])).toEqual({
      valor: "cumple",
      bloqueantes: [],
      alertas: [],
    });
  });
});
