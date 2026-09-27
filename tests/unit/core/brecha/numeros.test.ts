/** Formato determinista del informe (sin Intl): coma decimal en español, punto en inglés. */
import { describe, expect, it } from "vitest";
import {
  maximo,
  mediana,
  minimo,
  num,
  numCorto,
  pct,
  promedio,
  redondear,
} from "../../../../core/brecha/numeros";

describe("números del informe", () => {
  it("redondear no deja -0", () => {
    expect(Object.is(redondear(-0.00001), 0)).toBe(true);
    expect(redondear(0.123456, 3)).toBe(0.123);
  });
  it("agregados sobre listas vacías y no vacías", () => {
    expect([mediana([]), promedio([]), maximo([]), minimo([])]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect([
      mediana([3, 1, 2]),
      mediana([4, 1, 3, 2]),
      promedio([1, 2]),
      maximo([1, 5, 2]),
      minimo([4, 2, 9]),
    ]).toEqual([2, 2.5, 1.5, 5, 2]);
  });
  it("formato por idioma", () => {
    expect([num(0.5, "es"), num(0.5, "en", 1)]).toEqual(["0,50", "0.5"]);
    expect([
      numCorto(11.215, "es"),
      numCorto(1000, "en"),
      numCorto(0.75, "en"),
    ]).toEqual(["11,215", "1000", "0.75"]);
    expect([pct(0.9333, "es"), pct(0.9333, "en"), pct(1, "es")]).toEqual([
      "93,3 %",
      "93.3%",
      "100 %",
    ]);
  });
});
