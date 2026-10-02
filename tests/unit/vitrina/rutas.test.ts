// @vitest-environment node
/**
 * Rutas de la vitrina (ADR-007/008): una página por pantalla e idioma, enlaces desde la raíz. En el paquete para
 * hoja-de-vida (ADR-009) llevan la base `/piezas/planlang` y `.html`, también la redirección de `/`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { esIdioma, idiomaDeRuta } from "@/lib/idioma";
import { otroIdioma, PANTALLAS, ruta } from "@/lib/ruta";

describe("rutas de la vitrina", () => {
  it("la Entrada es la raíz del idioma; las demás cuelgan de ella", () => {
    expect(ruta("es", "entrada")).toBe("/es");
    expect(
      PANTALLAS.filter((p) => p !== "entrada").map((p) => ruta("en", p)),
    ).toEqual([
      "/en/plan",
      "/en/agente",
      "/en/brecha",
      "/en/playground",
      "/en/caso",
      "/en/fichas",
    ]);
    expect(ruta("es", "caso", "A-001")).toBe("/es/caso/A-001");
    expect(otroIdioma("es")).toBe("en");
    expect(otroIdioma("en")).toBe("es");
  });

  it("solo es y en son idiomas; cualquier otro segmento es una página que no existe", async () => {
    expect(esIdioma("es") && esIdioma("en")).toBe(true);
    expect(esIdioma("fr")).toBe(false);
    await expect(idiomaDeRuta(Promise.resolve({ idioma: "en" }))).resolves.toBe(
      "en",
    );
    await expect(
      idiomaDeRuta(Promise.resolve({ idioma: "fr" })),
    ).rejects.toThrow();
  });
});

describe("rutas del paquete para hoja-de-vida (PLANLANG_PAQUETE=1)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("toda ruta lleva la base y .html; la raíz elige el idioma dentro del paquete", async () => {
    vi.stubEnv("PLANLANG_PAQUETE", "1");
    vi.resetModules();
    const r = await import("@/lib/ruta");
    expect(r.ruta("es", "entrada")).toBe("/piezas/planlang/es.html");
    expect(r.ruta("en", "fichas")).toBe("/piezas/planlang/en/fichas.html");
    expect(r.ruta("es", "caso", "A-001")).toBe(
      "/piezas/planlang/es/caso/A-001.html",
    );
    expect(r.RUTA_ELEGIR).toBe("/piezas/planlang/index.html?elegir");
    const { CUERPO_SCRIPT_IDIOMA } =
      await import("@/lib/preferencias/script-idioma");
    let destino = "";
    new Function("location", "localStorage", "navigator", CUERPO_SCRIPT_IDIOMA)(
      { search: "", replace: (x: string) => (destino = x) },
      { getItem: () => "en" },
      { languages: ["es"] },
    );
    expect(destino).toBe("/piezas/planlang/en.html");
  });

  it("sin la variable, las URL siguen limpias", async () => {
    vi.resetModules();
    const r = await import("@/lib/ruta");
    expect(r.ruta("es", "plan")).toBe("/es/plan");
    expect(r.BASE_RUTA + r.SUFIJO_RUTA).toBe("");
  });
});
