// @vitest-environment node
/**
 * Textos de la vitrina (regla 20 y regla dura 12): todo texto nace `{ es, en }` con los dos idiomas llenos y
 * redactados (no el mismo texto dos veces, salvo nombres propios); los párrafos de líder cumplen el
 * presupuesto (≤ 50 palabras, ≤ 1 término vigilado) en los dos; y cada supuesto o brecha que el informe
 * pueda nombrar en la Entrada tiene su lectura corta.
 */
import { describe, expect, it } from "vitest";
import { presupuestoLiderBilingue } from "@core/formatos/jerga";
import type { TextoBilingue } from "@core/formatos/bilingue";
import { datosDemo } from "@/lib/datos/vitrina";
import * as brecha from "@/textos/brecha";
import * as comun from "@/textos/comun";
import * as entrada from "@/textos/entrada";
import * as plan from "@/textos/plan";
import * as playground from "@/textos/playground";

/** Recorre un módulo de textos y devuelve cada `{ es, en }` con su ruta. */
function bilingues(
  valor: unknown,
  ruta: string,
  out: [string, TextoBilingue][] = [],
) {
  if (valor && typeof valor === "object") {
    const o = valor as Record<string, unknown>;
    if (
      typeof o.es === "string" &&
      typeof o.en === "string" &&
      Object.keys(o).length === 2
    ) {
      out.push([ruta, o as TextoBilingue]);
      return out;
    }
    for (const [k, v] of Object.entries(o)) bilingues(v, `${ruta}.${k}`, out);
  }
  return out;
}
const todos = [
  ...bilingues(comun, "comun"),
  ...bilingues(entrada, "entrada"),
  ...bilingues(plan, "plan"),
  ...bilingues(brecha, "brecha"),
  ...bilingues(playground, "playground"),
];

/** Los párrafos que lee el líder en P4 y P5 (los de la Entrada viven en `entrada.LIDER`). */
const LIDER_P4_P5: [string, TextoBilingue][] = [
  ["brecha.PORTADA.guia", brecha.PORTADA.guia],
  ["playground.PORTADA.guia", playground.PORTADA.guia],
  ["playground.MIRADA.avisoLider", playground.MIRADA.avisoLider],
  ["playground.MIRADA.objetivoTexto", playground.MIRADA.objetivoTexto],
  ["playground.CAMBIOS.texas", playground.CAMBIOS.texas],
  ["playground.FRASE.nada", playground.FRASE.nada],
];

/** Iguales en los dos idiomas a propósito: nombres propios, siglas y palabras que el inglés comparte. */
const IGUALES = new Set([
  "Plan",
  "Playground",
  "real",
  "Demo",
  "planlang",
  "Id",
  "#",
  "payload",
  "no",
  "Tokens",
  "No",
]);

describe("textos de la vitrina", () => {
  it("hay textos que revisar", () => expect(todos.length).toBeGreaterThan(80));

  it.each(todos)(
    "%s: los dos idiomas llenos y sin espacios sobrantes",
    (_, t) => {
      for (const i of ["es", "en"] as const) {
        expect(t[i].length).toBeGreaterThan(0);
        expect(t[i]).toBe(t[i].trim());
        expect(t[i]).not.toMatch(/ {2}/);
      }
    },
  );

  it("redactados dos veces: ninguno repite el español en inglés (salvo nombres propios)", () => {
    const repetidos = todos
      .filter(([, t]) => t.es === t.en && !IGUALES.has(t.es))
      .map(([r]) => r);
    expect(repetidos).toEqual([]);
  });

  it.each([...Object.entries(entrada.LIDER), ...LIDER_P4_P5])(
    "párrafo de líder «%s»: ≤ 50 palabras y ≤ 1 término vigilado, en español y en inglés",
    (_, t) => {
      const r = presupuestoLiderBilingue(t);
      expect(r.ok, JSON.stringify({ es: r.es.motivos, en: r.en.motivos })).toBe(
        true,
      );
    },
  );

  it("cada supuesto del plan tiene su lectura corta y cada categoría de brecha del informe su nombre", async () => {
    const { plan, informe } = await datosDemo();
    for (const s of plan.supuestos)
      expect(entrada.LECTURA_DE_SUPUESTO, s.id).toHaveProperty(s.id);
    for (const b of informe.brechas_no_previstas.brechas)
      expect(entrada.CATEGORIA_DE_BRECHA, b.categoria).toHaveProperty(
        b.categoria,
      );
  });
});
