// @vitest-environment node
/**
 * Estilos de la vitrina (regla de desarrollo 5-b y design-system § 2):
 *  1. Tintas VETADAS como texto: `tinta-3` y `linea` no alcanzan 4,5:1; ninguna clase de texto ni regla
 *     `color:` las usa (como trazo de una guía gráfica sí: prop `trazo`, `stroke`, bordes).
 *  2. Toda variable CSS que un archivo de `src/` lee existe: la declaran los tokens generados, el tema, la
 *     base o next/font. Una variable mal escrita pinta con el valor por defecto sin avisar.
 * El barrido de clases vive también en ESLint (`no-restricted-syntax`) para que falle en `pnpm lint`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function archivos(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((f) => {
    const r = join(dir, f);
    return statSync(r).isDirectory()
      ? archivos(r, ext)
      : ext.test(f)
        ? [r]
        : [];
  });
}
const fuentes = archivos("src", /\.(tsx?|css)$/);
const css = fuentes.filter((f) => f.endsWith(".css"));

// La clase, la variable de Tailwind v4, el valor y la propiedad arbitrarios, con o sin `!` (AU-S2-B28).
const CLASE_VETADA =
  /(^|[\s"'`:])(text|placeholder|decoration|caret|fill)-(tinta-3|linea|\(--(tinta-3|linea)\)|\[var\(--(tinta-3|linea)\)\])(?=[\s"'`/!]|$)|\[(color|fill):var\(--(tinta-3|linea)\)\]/;
// En el CSS: `color:` y también `fill:` (el texto de un SVG se pinta con `fill`).
const COLOR_VETADO = /(^|[\s;{])(color|fill):\s*var\(--(tinta-3|linea)\)/;

describe("tintas vetadas como texto", () => {
  it("el barrido encuentra lo que debe (demo en rojo dentro de la prueba)", () => {
    expect(CLASE_VETADA.test('className="mt-2 text-tinta-3"')).toBe(true);
    expect(CLASE_VETADA.test("hover:text-linea")).toBe(true);
    expect(CLASE_VETADA.test("border-tinta-3 text-tinta-2")).toBe(false);
    expect(COLOR_VETADO.test(".x{color: var(--tinta-3)}")).toBe(true);
    expect(COLOR_VETADO.test(".x{border-color: var(--tinta-3)}")).toBe(false);
    // Las formas que el barrido no veía (AU-S2-B28).
    expect(CLASE_VETADA.test("text-(--tinta-3)")).toBe(true);
    expect(CLASE_VETADA.test('"[color:var(--tinta-3)]"')).toBe(true);
    expect(CLASE_VETADA.test('"[fill:var(--linea)]"')).toBe(true);
    expect(CLASE_VETADA.test('"text-tinta-3!"')).toBe(true);
    expect(CLASE_VETADA.test("text-[var(--tinta-3)]")).toBe(true);
    expect(CLASE_VETADA.test("shadow-[inset_0_0_0_1px_var(--tinta-3)]")).toBe(
      false,
    );
    expect(CLASE_VETADA.test('trazo="var(--tinta-3)"')).toBe(false);
    expect(COLOR_VETADO.test(".d-texto{fill: var(--tinta-3)}")).toBe(true);
    expect(COLOR_VETADO.test(".guia{stroke: var(--tinta-3)}")).toBe(false);
  });

  it.each(fuentes)("%s no pinta texto con tinta-3 ni linea", (f) => {
    const texto = readFileSync(f, "utf8");
    expect(texto).not.toMatch(CLASE_VETADA);
    expect(texto).not.toMatch(COLOR_VETADO);
  });
});

describe("variables CSS declaradas", () => {
  const declaradas = new Set<string>(["fuente-letra", "fuente-mono"]); // las declara next/font (src/app/fuentes.ts)
  for (const f of css)
    for (const m of readFileSync(f, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g))
      declaradas.add(m[1].slice(2));

  it.each(fuentes)("%s solo lee variables que existen", (f) => {
    const texto = readFileSync(f, "utf8");
    const leidas = [
      ...texto.matchAll(/var\(--([a-z0-9-]+)/g),
      // Utilidades de Tailwind con variable, con o sin tipo: px-(--margen) · text-(color:--cv-tinta-0).
      ...texto.matchAll(/-\((?:[a-z-]+:)?--([a-z0-9-]+)\)/g),
    ].map((m) => m[1]);
    // Una variable que el propio componente fija en `style` (p. ej. el reparto de columnas de las trazas).
    const locales = new Set(
      [...texto.matchAll(/"--([a-z0-9-]+)"\s*:/g)].map((m) => m[1]),
    );
    const faltan = leidas.filter(
      (v) =>
        !declaradas.has(v) && !locales.has(v) && !/^(tw-|default-)/.test(v),
    );
    expect(faltan, f).toEqual([]);
  });
});
