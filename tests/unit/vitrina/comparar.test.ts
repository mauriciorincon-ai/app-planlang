// @vitest-environment node
/**
 * La vista de «Comparar dos corridas» (S4) sobre los datos reales del A: las cifras cuadran con el lote, cada caso que
 * difiere tiene página (son 18, bajo el tope), los dos idiomas dicen lo suyo y el B no la tiene.
 */
import { describe, expect, it } from "vitest";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaComparar } from "@/lib/vista/comparar";

describe("vistaComparar: la comparación del A en la pantalla", () => {
  it("el A la tiene; el B no (la comparación es del demo con base de 200)", async () => {
    expect(vistaComparar(await datosDemo("demo-a"), "es")).not.toBeNull();
    expect(vistaComparar(await datosDemo("demo-b"), "es")).toBeNull();
  });

  it("cada lado reparte el lote entero entre sus cuatro categorías de pausa", async () => {
    const v = vistaComparar(await datosDemo("demo-a"), "es");
    expect(v).not.toBeNull();
    for (const k of [0, 1] as const) {
      const total = v!.pausas.reduce(
        (s, p) => s + (k === 0 ? p.valores.multiagente : p.valores.agente_unico),
        0,
      );
      expect(total).toBe(v!.n);
    }
  });

  it("los 18 casos que difieren tienen página propia, y cada uno dice su verdad", async () => {
    const v = vistaComparar(await datosDemo("demo-a"), "es");
    expect(v!.casos).toHaveLength(18);
    expect(v!.casos.every((c) => c.href !== null)).toBe(true);
    expect(v!.casos.every((c) => c.verdad.length > 0)).toBe(true);
  });

  it("las decisiones finales coinciden con la verdad en los dos lados", async () => {
    const v = vistaComparar(await datosDemo("demo-a"), "es");
    expect(v!.decisiones.multiagente).toBe("200 de 200 correctas");
    expect(v!.decisiones.agente_unico).toBe("200 de 200 correctas");
  });

  it("el inglés dice su veredicto en inglés, no en español", async () => {
    const d = await datosDemo("demo-a");
    expect(vistaComparar(d, "en")!.veredictos.multiagente.texto).toBe("Meets");
    expect(vistaComparar(d, "es")!.veredictos.multiagente.texto).toBe("Cumple");
  });
});
