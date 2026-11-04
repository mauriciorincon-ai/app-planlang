// @vitest-environment node
/**
 * `docs/cv-viva/capturas.yaml` (S8, devolución 026 punto 6): la tabla de estados que `pnpm capturas:cv-viva` toma de
 * `out/`. Cada funcionalidad de la ficha de la app tiene su captura o se declara sin pantalla; cada estado dice su ruta
 * en español, su perfil y un ancla que es una expresión regular válida; los archivos no se repiten y el pie va en los
 * dos idiomas.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { APP } from "@/textos/fichas";

interface Estado {
  funcionalidad?: string;
  archivo: string;
  ruta: string;
  perfil: string;
  ancla: string | null;
  accion: string | null;
  pie?: { es: string; en: string };
}
const config = parse(readFileSync("docs/cv-viva/capturas.yaml", "utf8")) as {
  portada: Estado;
  capturas: Estado[];
  sin_pantalla: string[];
};

describe("docs/cv-viva/capturas.yaml", () => {
  it("cada funcionalidad de la ficha de la app tiene su captura o está declarada sin pantalla, y nada sobra", () => {
    const funcionalidades = APP.grupos.flatMap((g) =>
      g.features.map((f) => f.id),
    );
    const cubiertas = [
      ...config.capturas.map((c) => c.funcionalidad!),
      ...config.sin_pantalla,
    ];
    expect([...cubiertas].sort()).toEqual([...funcionalidades].sort());
    expect(config.capturas).toHaveLength(24);
    expect(config.sin_pantalla).toEqual(["entrevistador"]);
  });

  it("la portada y las 24 capturas: WebP sin repetir, ruta en español, perfil líder o experto, ancla válida", () => {
    const todas = [config.portada, ...config.capturas];
    expect(todas).toHaveLength(25);
    const archivos = todas.map((e) => e.archivo);
    expect(new Set(archivos).size).toBe(25);
    for (const e of todas) {
      expect(e.archivo, e.archivo).toMatch(/^[a-z0-9-]+\.webp$/);
      expect(e.ruta, e.archivo).toMatch(/^\/es(\/|$)/);
      expect(["lider", "experto"], e.archivo).toContain(e.perfil);
      if (e.ancla) expect(() => new RegExp(e.ancla!), e.archivo).not.toThrow();
      expect([null, "u2-a-1600"], e.archivo).toContain(e.accion);
    }
    expect(config.portada.archivo).toBe("entrada.webp");
  });

  it("el pie de cada captura está en español y en inglés, redactado y corto", () => {
    for (const c of config.capturas) {
      expect(c.pie!.es.length, c.archivo).toBeGreaterThan(20);
      expect(c.pie!.es.length, c.archivo).toBeLessThanOrEqual(90);
      expect(c.pie!.en.length, c.archivo).toBeGreaterThan(20);
      expect(c.pie!.en, c.archivo).not.toBe(c.pie!.es);
    }
  });

  it("`pnpm capturas:cv-viva` existe y el único estado con acción es el playground con U2 a 1600", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["capturas:cv-viva"]).toBe(
      "node scripts/capturas-cv-viva.mjs",
    );
    expect(
      config.capturas.filter((c) => c.accion).map((c) => c.funcionalidad),
    ).toEqual(["playground"]);
  });
});
