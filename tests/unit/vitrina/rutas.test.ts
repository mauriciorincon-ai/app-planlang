// @vitest-environment node
/**
 * Rutas de la vitrina (ADR-007/008): una página por pantalla e idioma, enlaces desde la raíz. En el paquete para
 * hoja-de-vida (ADR-009) llevan la base `/piezas/planlang` y `.html`, también la redirección de `/`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { esIdioma, idiomaDeRuta } from "@/lib/idioma";
import { otroIdioma, PANTALLAS, ruta, rutaEntrada } from "@/lib/ruta";

describe("rutas de la vitrina", () => {
  it("la Entrada es la raíz del idioma; las demás cuelgan de ella", () => {
    expect(rutaEntrada("es")).toBe("/es");
    expect(ruta("es", "entrada", undefined, "demo-b")).toBe("/es");
    expect(
      PANTALLAS.filter((p) => p !== "entrada").map((p) =>
        ruta("en", p, undefined, "demo-a"),
      ),
    ).toEqual([
      "/en/plan",
      "/en/agente",
      "/en/brecha",
      "/en/playground",
      "/en/caso",
      "/en/fichas",
    ]);
    expect(ruta("es", "caso", "A-001", "demo-a")).toBe("/es/caso/A-001");
    // El B cuelga de su prefijo (ADR-014); el demo es obligatorio: olvidarlo enlazaba al A sin romperse.
    expect(ruta("es", "caso", "B-001", "demo-b")).toBe("/es/demo-b/caso/B-001");
    expect(ruta("en", "playground", undefined, "demo-b")).toBe(
      "/en/demo-b/playground",
    );
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
    expect(r.rutaEntrada("es")).toBe("/piezas/planlang/es.html");
    expect(r.ruta("en", "fichas", undefined, "demo-a")).toBe(
      "/piezas/planlang/en/fichas.html",
    );
    expect(r.ruta("es", "caso", "A-001", "demo-a")).toBe(
      "/piezas/planlang/es/caso/A-001.html",
    );
    expect(r.ruta("es", "caso", "B-001", "demo-b")).toBe(
      "/piezas/planlang/es/demo-b/caso/B-001.html",
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
    expect(r.ruta("es", "plan", undefined, "demo-a")).toBe("/es/plan");
    expect(r.BASE_RUTA + r.SUFIJO_RUTA).toBe("");
  });
});
