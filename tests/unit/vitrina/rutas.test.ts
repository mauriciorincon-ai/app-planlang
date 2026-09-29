// @vitest-environment node
/** Rutas de la vitrina (ADR-007/008): una página por pantalla e idioma, enlaces desde la raíz. */
import { describe, expect, it } from "vitest";
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
