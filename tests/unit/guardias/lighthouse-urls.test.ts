/**
 * El job `lighthouse` mide lo que dice `lighthouse-urls.json`: cada pantalla de la vitrina en español y, como la app
 * es bilingüe (regla 20), también el inglés — la entrada y la pantalla más pesada (el playground) — para que el
 * presupuesto de `perf-budget.json` y las cuatro categorías ≥ 90 valgan en los dos idiomas (AU-S2-B14).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const urls = JSON.parse(
  readFileSync("lighthouse-urls.json", "utf8"),
) as string[];

describe("lighthouse-urls.json (AU-S2-B14)", () => {
  it("cubre las siete pantallas en español", () => {
    for (const p of [
      "/es",
      "/es/plan",
      "/es/agente",
      "/es/brecha",
      "/es/playground",
      "/es/fichas",
    ])
      expect(urls, p).toContain(p);
    expect(urls.some((u) => u.startsWith("/es/caso/"))).toBe(true);
  });

  it("y el inglés: la entrada y el playground", () => {
    expect(urls).toContain("/en");
    expect(urls).toContain("/en/playground");
  });
});
