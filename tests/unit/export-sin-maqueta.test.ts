import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ADR-007 — la maqueta de la Etapa de Diseño vive en `docs/diseno/` y NO viaja al export.
 * Hasta el S1 vivía en `public/diseno/` (con `docs/diseno` como enlace) y Next la copiaba a `out/`:
 * la producción publicaba la sala de diseño, incluidos `MIRADAS.md` y `README.md` con citas textuales
 * del usuario. `out/` = `public/` + las páginas de `src/app/`, así que vigilar `public/` basta.
 */
function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(join(dir, e.name)) : [join(dir, e.name)],
  );
}

describe("la maqueta no viaja al export (ADR-007)", () => {
  it("docs/diseno es una carpeta real, no un enlace", () => {
    expect(lstatSync("docs/diseno").isSymbolicLink()).toBe(false);
    expect(lstatSync("docs/diseno").isDirectory()).toBe(true);
    expect(existsSync("docs/diseno/01-entrada.html")).toBe(true);
  });

  it("public/ no trae la maqueta ni documentos (HTML o Markdown)", () => {
    expect(existsSync("public/diseno")).toBe(false);
    const documentos = existsSync("public")
      ? archivos("public").filter((f) => /\.(html?|md)$/i.test(f))
      : [];
    expect(documentos, "documentos en public/: viajarían a out/").toEqual([]);
  });
});
