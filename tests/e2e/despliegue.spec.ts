import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * El diseño de despliegue (S10) en el export servido, en los dos demos y los dos idiomas: la página se rotula «Diseño ·
 * no desplegado», el lienzo generado y el texto equivalente dicen los mismos siete componentes (G10), cada riesgo del
 * plan trae su control, la capacidad se mide en el A y dice «no medido» en el B, y la página no se desborda ni rompe axe.
 */

const T = {
  es: {
    titulo: "Cómo correría en producción",
    rotulo: "Diseño · no desplegado",
    saltar: "Saltar el diagrama",
    equivalente: "El diseño en texto",
    sinComponente: "Sin componente",
    noMedido: /^No medido:/,
    minima: /La capacidad mínima que cumple es \d+ casos por día hábil/,
  },
  en: {
    titulo: "How it would run in production",
    rotulo: "Design · not deployed",
    saltar: "Skip the diagram",
    equivalente: "The design in text",
    sinComponente: "No component",
    noMedido: /^Not measured:/,
    minima:
      /The minimum capacity that meets them is \d+ cases per business day/,
  },
} as const;

const DEMOS = [
  { demo: "demo-a", ruta: "despliegue", riesgos: 10, medida: true },
  { demo: "demo-b", ruta: "demo-b/despliegue", riesgos: 4, medida: false },
] as const;

for (const idioma of ["es", "en"] as const)
  for (const c of DEMOS)
    test.describe(`${c.demo} · ${idioma}`, () => {
      const t = T[idioma];

      test("rotulada «Diseño · no desplegado», con el lienzo y el texto equivalente de los mismos siete componentes (G10)", async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/${idioma}/${c.ruta}`);
        await expect(
          page.getByRole("heading", { level: 1, name: t.titulo }),
        ).toBeVisible();
        await expect(
          page.locator('[data-procedencia="maqueta"]'),
        ).toContainText(t.rotulo);
        const items = page.locator("ol[data-equivalente] > li");
        await expect(items).toHaveCount(7);
        await expect(
          page.locator('svg[data-visor="despliegue"] .d-nodo'),
        ).toHaveCount(7);
        // Ningún componente aparece desplegado: dos «sin código aún» y cinco «implementado y corrido».
        expect(
          await page.locator('li[data-madurez="en-construccion"]').count(),
        ).toBe(2);
        expect(
          await page.locator('li[data-madurez="implementado"]').count(),
        ).toBe(5);
        const salto = page.getByRole("link", { name: t.saltar });
        await expect(salto).toHaveAttribute("href", "#despliegue-texto");
        await salto.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/#despliegue-texto$/);
        await expect(
          page.getByRole("heading", { name: t.equivalente }),
        ).toBeInViewport();
        expect(errores).toEqual([]);
      });

      test("cada riesgo del plan trae su control y su componente; lo medido es cifra o «no medido»", async ({
        page,
      }) => {
        await page.goto(`/${idioma}/${c.ruta}`);
        const filas = page.locator("[data-riesgo]");
        await expect(filas).toHaveCount(c.riesgos);
        for (const fila of await filas.all())
          await expect(fila.getByRole("cell").nth(2)).not.toBeEmpty();
        const noMedida = page.locator('[data-no-medido="capacidad"]');
        if (c.medida) {
          await expect(noMedida).toHaveCount(0);
          await expect(page.getByText(t.minima)).toBeVisible();
        } else {
          await expect(noMedida).toHaveText(t.noMedido);
          await expect(page.getByText(t.minima)).toHaveCount(0);
        }
      });

      test("sin desborde lateral y axe limpio", async ({ page }) => {
        await page.goto(`/${idioma}/${c.ruta}`);
        await expect(
          page.getByRole("heading", { level: 1, name: t.titulo }),
        ).toBeVisible();
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
      });
    });

test("la Entrada lleva al diseño de despliegue de cada demo y ya no lista nada «en construcción»", async ({
  page,
}) => {
  await page.goto("/es");
  for (const c of DEMOS)
    await expect(
      page.locator(`[data-demo="${c.demo}"] a[href$="/${c.ruta}"]`),
    ).toHaveCount(1);
  await expect(page.locator("[data-roadmap]")).toHaveCount(0);
});
