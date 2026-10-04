// @vitest-environment node
/**
 * Kit v1.37.0 (README de diseño): la pasada de capturas recorre la maqueta y la app SERVIDAS, entrando por el índice,
 * nunca abriendo `file://` (planlang: el índice sin barra final resolvía sus enlaces contra la raíz y cuatro miradas
 * no lo vieron). Cada arnés `scripts/capturar-*.mjs` sirve su árbol con `scripts/servidor-estatico.mjs` y ninguno
 * navega a un `file:`. Demo en rojo (bitácora S3): `capturar-maqueta.mjs` vuelto a `pathToFileURL`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ARNESES = readdirSync("scripts").filter((f) =>
  /^capturar-.+\.mjs$/.test(f),
);

describe("arneses de capturas sobre páginas servidas (kit v1.37.0)", () => {
  it("hay arneses que vigilar", () => {
    expect(ARNESES).toEqual(
      expect.arrayContaining(["capturar-maqueta.mjs", "capturar-vitrina.mjs"]),
    );
  });

  it.each(ARNESES)("%s sirve su árbol y no abre file://", (f) => {
    const s = readFileSync(`scripts/${f}`, "utf8");
    expect(s).toContain('from "./servidor-estatico.mjs"');
    expect(s).not.toMatch(/pathToFileURL\s*\(/);
    expect(s).not.toMatch(/goto\(\s*[`"']file:/);
  });
});
