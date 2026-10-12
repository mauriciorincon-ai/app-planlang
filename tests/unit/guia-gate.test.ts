// @vitest-environment node
/**
 * El bloque «Gate de los hitos H-1 y H-2» de la guía de prueba (S7). Las reglas del gate único son de la planeadora:
 * ≤ 10 preguntas de sí o no, numeradas G1…Gn, todas desde el teléfono con la vitrina de producción, nada en la
 * terminal ni en un archivo del repo, cada una en los dos idiomas, y ninguna dirección de producción en la guía. Aquí
 * se vigilan en el archivo para que el gate no se infle ni vuelva a hablar el idioma del proceso viejo.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("docs/GUIA-DE-PRUEBA.html", "utf8");

/** Las preguntas del gate: cada `<li … data-gate>` con su texto en español y en inglés, sin etiquetas. */
function preguntas() {
  const bloque = /<section class="bloque" id="gate">([\s\S]*?)<\/section>/.exec(
    html,
  )?.[1];
  if (!bloque) throw new Error("falta el bloque del gate");
  return [...bloque.matchAll(/<li[^>]*data-gate[^>]*>([\s\S]*?)<\/li>/g)].map(
    (m) => {
      const li = m[1] as string;
      const texto = (idioma: "es" | "en") =>
        (
          new RegExp(
            `<span class="${idioma}"(?: lang="en")?>([\\s\\S]*?)</span>`,
          ).exec(li)?.[1] ?? ""
        )
          .replace(/<[^>]+>/g, "")
          .trim();
      return { li, es: texto("es"), en: texto("en") };
    },
  );
}

describe("el gate de los hitos H-1 y H-2 en la guía", () => {
  const g = preguntas();

  it("son de 1 a 10 preguntas, numeradas G1…Gn en orden, cada una con su casilla y su etiqueta de gate", () => {
    expect(g.length).toBeGreaterThanOrEqual(1);
    expect(g.length).toBeLessThanOrEqual(10);
    g.forEach((p, k) => {
      expect(p.es.startsWith(`G${k + 1}.`), `G${k + 1} es`).toBe(true);
      expect(p.en.startsWith(`G${k + 1}.`), `G${k + 1} en`).toBe(true);
      expect(p.li).toContain(`id="gate-${k + 1}"`);
      expect(p.li).toContain(`Gate G${k + 1} de ${g.length}`);
      expect(p.li).toContain(`Gate G${k + 1} of ${g.length}`);
    });
  });

  it("cada pregunta es de sí o no y está en español y en inglés, redactada en cada uno", () => {
    for (const [k, p] of g.entries()) {
      expect(p.es.length, `G${k + 1}`).toBeGreaterThan(80);
      expect(p.en.length, `G${k + 1}`).toBeGreaterThan(80);
      expect(p.es, `G${k + 1}`).toMatch(/[¿?]/);
      expect(p.en, `G${k + 1}`).toContain("?");
      expect(p.es).not.toBe(p.en);
    }
  });

  it("ninguna se hace en la terminal ni en un archivo del repo: no pide un comando, una ruta ni un archivo", () => {
    for (const [k, p] of g.entries()) {
      for (const t of [p.es, p.en])
        expect(t, `G${k + 1}`).not.toMatch(
          /pnpm|terminal|git |docs\/|plans\/|\.json|\.md\b|\.html/i,
        );
      expect(p.li, `G${k + 1}`).not.toContain("<code>");
    }
  });

  it("el encabezado del bloque declara su duración y dónde empieza, sin enlazar a nada", () => {
    const bloque =
      /<section class="bloque" id="gate">([\s\S]*?)<\/section>/.exec(
        html,
      )![1] as string;
    expect(bloque).toContain("~30 min");
    expect(bloque).toContain("la vitrina de producción · tu teléfono");
    expect(bloque).not.toMatch(/https?:\/\//);
  });

  it("el filtro «Gate de hitos» existe y cuenta exactamente las preguntas del gate", () => {
    expect(html).toContain('data-filtro="gate"');
    expect(html).toContain('li.hasAttribute("data-gate")');
    expect(html.match(/<li[^>]*\bdata-gate\b/g)?.length).toBe(g.length);
  });

  it("el gate no mueve los demás filtros: ninguna de sus preguntas es ⭐ mínimo", () => {
    for (const p of g) expect(p.li).not.toContain("⭐");
    // Lo que el texto declara es lo que los marcadores miden (el texto decía 27 y eran 25: un conteo hecho a mano).
    const real = html.match(/<li[^>]*\bdata-minimo\b/g)?.length;
    expect(Number(/Gate mínimo ⭐: (\d+) pruebas/.exec(html)?.[1])).toBe(real);
    expect(Number(/Minimum gate ⭐: (\d+) tests/.exec(html)?.[1])).toBe(real);
    expect(real).toBe(25);
  });

  it("la guía ya no habla el proceso viejo fuera de su historial y de la cabecera interna", () => {
    const visible = html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<details class="chica">[\s\S]*?<\/details>/, "")
      .replace(/<script>[\s\S]*?<\/script>/, "");
    for (const frase of [
      "Acto 2",
      "sello MVP",
      "ciclo",
      "Gate corto",
      "data-corto",
      "PR #14",
    ])
      expect(visible.includes(frase), frase).toBe(false);
  });

  it("el estado de las casillas lleva el prefijo del sprint vigente", () => {
    expect(html).toContain('var NS = "guia-planlang:s7:";');
  });
});
