/**
 * El bundle publicable del design system (regla 16) deriva de `design-system.md` y de los tokens generados: el
 * generador lo vuelve a armar y debe dar los mismos bytes que hay en `design-sync/`. Cada tarjeta abre con la línea
 * `@dsCard` (sin ella Claude Design no la indexa), es autocontenida (ninguna dirección externa) y `project.json` no
 * lleva credenciales. Regenerar: `node scripts/design-sync/generar.mjs`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { archivosDelBundle } from "../../scripts/design-sync/generar.mjs";

const archivos = archivosDelBundle() as Record<string, string>;
const tarjetas = Object.entries(archivos).filter(([r]) =>
  r.startsWith("components/"),
);

describe("design-sync/: el bundle del design system", () => {
  it.each(Object.keys(archivos))("%s está al día con el generador", (ruta) => {
    const disco = join("design-sync", ruta);
    expect(existsSync(disco), `${disco} no existe`).toBe(true);
    expect(readFileSync(disco, "utf8")).toBe(archivos[ruta]);
  });

  it("cada tarjeta abre con su línea @dsCard y no pide nada de fuera", () => {
    expect(tarjetas.length).toBeGreaterThanOrEqual(10);
    for (const [ruta, html] of tarjetas) {
      expect(html.split("\n")[0], ruta).toMatch(
        /^<!-- @dsCard group="[^"]+" name="[^"]+" -->$/,
      );
      expect(html, ruta).not.toMatch(/(src|href)\s*=\s*"(https?:)?\/\//);
      expect(html, ruta).not.toMatch(/url\(\s*["']?(https?:)?\/\//);
    }
  });

  it("project.json lleva el destino y el registro, nunca una credencial", () => {
    const p = JSON.parse(
      readFileSync("design-sync/project.json", "utf8"),
    ) as Record<string, unknown>;
    expect(Object.keys(p)).toEqual(
      expect.arrayContaining([
        "projectId",
        "name",
        "publishedFiles",
        "lastPublished",
      ]),
    );
    for (const k of Object.keys(p))
      expect(k).not.toMatch(/token|key|secret|clave/i);
  });
});
