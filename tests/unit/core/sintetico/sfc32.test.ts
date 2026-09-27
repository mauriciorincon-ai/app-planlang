/**
 * Azar con semilla: el vector de referencia de sfc32 lo calculó una implementación independiente en
 * Python (aritmética de 32 bits con máscaras), así que este test cruza la costura «mismo algoritmo,
 * otro lenguaje». Si alguien toca un desplazamiento, cambia la secuencia y se pone en rojo.
 */
import { describe, expect, it } from "vitest";
import { crearAzar, cyrb128, sfc32 } from "../../../../core/sintetico/sfc32";

describe("sfc32", () => {
  it("reproduce el vector de referencia calculado en Python con la semilla (1, 2, 3, 4)", () => {
    const siguiente = sfc32(1, 2, 3, 4);
    const salida = Array.from({ length: 6 }, siguiente);
    expect(salida).toEqual([7, 34, 56623200, 188882296, 3431242869, 399395954]);
  });

  it("cyrb128 es determinista, de 32 bits sin signo y distingue semillas", () => {
    const a = cyrb128("planlang-a-001");
    expect(cyrb128("planlang-a-001")).toEqual(a);
    expect(cyrb128("planlang-a-002")).not.toEqual(a);
    for (const h of a) expect(h >>> 0).toBe(h);
  });
});

describe("crearAzar", () => {
  it("la misma semilla da la misma secuencia; otra semilla, otra", () => {
    const x = crearAzar("s");
    const y = crearAzar("s");
    const z = crearAzar("t");
    const sx = Array.from({ length: 20 }, () => x.real());
    expect(Array.from({ length: 20 }, () => y.real())).toEqual(sx);
    expect(Array.from({ length: 20 }, () => z.real())).not.toEqual(sx);
    for (const r of sx) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it("entero respeta los bordes incluidos y rechaza rangos inválidos", () => {
    const a = crearAzar("enteros");
    const vistos = new Set<number>();
    for (let i = 0; i < 400; i++) vistos.add(a.entero(3, 6));
    expect([...vistos].sort()).toEqual([3, 4, 5, 6]);
    expect(() => a.entero(5, 4)).toThrow(RangeError);
    expect(() => a.entero(0.5, 2)).toThrow(RangeError);
  });

  it("elegir, elegirPonderado, barajar y probabilidad", () => {
    const a = crearAzar("listas");
    expect(() => a.elegir([])).toThrow(RangeError);
    expect(() => a.elegirPonderado([])).toThrow(RangeError);
    expect(() => a.elegirPonderado([["x", 0]])).toThrow(RangeError);
    const conteo: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i++)
      conteo[
        a.elegirPonderado([
          ["a", 9],
          ["b", 1],
        ] as const)
      ]! += 1;
    expect(conteo.a).toBeGreaterThan(800);
    expect(conteo.b).toBeGreaterThan(50);
    expect(a.elegirPonderado([["solo", 1]] as const)).toBe("solo");
    const lista = [1, 2, 3, 4, 5, 6, 7, 8];
    const barajada = a.barajar(lista);
    expect([...barajada].sort()).toEqual(lista);
    expect(lista).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a.probabilidad(0)).toBe(false);
    expect(a.probabilidad(1)).toBe(true);
    expect(["x", "y"]).toContain(a.elegir(["x", "y"]));
  });
});
