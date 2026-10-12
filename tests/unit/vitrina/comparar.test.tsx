// @vitest-environment node
/**
 * La vista de «Comparar dos corridas» (S4) sobre los datos reales del A: las cifras cuadran con el lote, cada caso que
 * difiere tiene página (son 18, bajo el tope), los dos idiomas dicen lo suyo y el B no la tiene.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChipCaso } from "@/components/brecha/chip-caso";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaComparar } from "@/lib/vista/comparar";
import {
  casosConPagina,
  TOPE_CASOS_QUE_DIFIEREN_CON_PAGINA,
} from "@/lib/vista/paginas-caso";

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
        (s, p) =>
          s + (k === 0 ? p.valores.multiagente : p.valores.agente_unico),
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

  it("la frase de líder nombra lo que separa a las corridas (C5 y R5) y usa los conteos de pausa", async () => {
    const v = vistaComparar(await datosDemo("demo-a"), "es");
    expect(v!.textos.lider.veredicto).toBe("Lo que las separa: C5, R5.");
    expect(v!.textos.lider.riesgos).toBe(
      "El agente único pausa 20 casos que no lo pedían; la multiagente, 4.",
    );
  });
});

/**
 * S7, B-3: el caso «sin página». Con la corrida real hay 18 casos que difieren, bajo el tope; aquí se fuerza una
 * comparación con más de las que caben para que el camino de «sin enlace» se ejerza de verdad.
 */
describe("vistaComparar: los casos que difieren por encima del tope se listan sin página", () => {
  async function conMas(extra: number) {
    const d = await datosDemo("demo-a");
    const base = d.comparacion!.casos_que_difieren;
    const usados = new Set(base.map((c) => c.id));
    const nuevos = d.corrida.trazas
      .map((t) => t.caso_id)
      .filter((id) => !usados.has(id))
      .slice(0, TOPE_CASOS_QUE_DIFIEREN_CON_PAGINA - base.length + extra)
      .map((id) => ({ ...base[0]!, id }));
    return {
      ...d,
      comparacion: {
        ...d.comparacion!,
        casos_que_difieren: [...base, ...nuevos],
      },
    };
  }

  it("los primeros del tope llevan enlace y el resto, no; ninguno se pierde de la lista", async () => {
    const d = await conMas(5);
    const v = vistaComparar(d, "es")!;
    expect(v.casos).toHaveLength(TOPE_CASOS_QUE_DIFIEREN_CON_PAGINA + 5);
    const sinPagina = v.casos.filter((c) => c.href === null);
    // Un caso que difiere pero ya tiene página por otra razón (los primeros del lote, uno señalado) sigue con enlace:
    // lo que se cuenta es lo que ninguna regla deja con página.
    const conPagina = casosConPagina(d);
    expect(sinPagina.every((c) => !conPagina.has(c.id))).toBe(true);
    expect(sinPagina.length).toBeGreaterThan(0);
    expect(sinPagina.length).toBeLessThanOrEqual(5);
  });

  it("el caso sin página se pinta sin enlace, con borde punteado y la razón para el lector de pantalla, en los dos idiomas", async () => {
    const v = vistaComparar(await conMas(5), "es")!;
    const sin = v.casos.find((c) => c.href === null)!;
    for (const [idioma, razon] of [
      ["es", "sin página propia"],
      ["en", "no page of its own"],
    ] as const) {
      const html = renderToStaticMarkup(
        <ChipCaso c={{ id: sin.id, href: sin.href }} idioma={idioma} />,
      );
      expect(html).not.toContain("<a");
      expect(html).toContain("border-dashed");
      expect(html).toContain(razon);
    }
  });
});
