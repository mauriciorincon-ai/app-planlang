import { expect, test, type Page } from "@playwright/test";
import { consolaLimpia, sinViolacionesAxe } from "./_comun";

/**
 * El caso camina (S10, contrato del diagramador 0.5.0 § 4.3 nivel 3) en el export servido, en los dos demos y los dos
 * idiomas: el contenedor cambia `data-paso` con los botones y con ← →, el nodo del paso se marca activo con filete
 * grueso (no solo color), el texto equivalente tiene un paso por nodo del lienzo y «Saltar el diagrama» lleva a él
 * (G10), con movimiento reducido no hay ninguna animación y el SVG no cambia de paso a paso (G12), axe sigue limpio,
 * y el contrafactual abre el playground con el valor que cambiaría la rama.
 */

const T = {
  es: {
    titulo: "El caso camina por el grafo",
    siguiente: "Paso siguiente",
    anterior: "Paso anterior",
    reproducir: "Reproducir",
    saltar: "Saltar el diagrama",
    equivalente: "El recorrido en texto",
    recorrer: "Recorrer",
    probar: /^Probar U\d+ = .+ en el playground →$/,
  },
  en: {
    titulo: "The case walks the graph",
    siguiente: "Next step",
    anterior: "Previous step",
    reproducir: "Play",
    saltar: "Skip the diagram",
    equivalente: "The walkthrough in text",
    recorrer: "Walk through",
    probar: /^Try U\d+ = .+ in the playground →$/,
  },
} as const;

/** A-002: aclaraciones, pausa humana y un contrafactual de U3 en el paso 3. B-002: el de U4 en el paso 3. */
const CASOS = [
  {
    demo: "demo-a",
    ruta: "caso/A-002",
    panel: 3,
    umbral: "U3",
    playground: "playground",
  },
  {
    demo: "demo-b",
    ruta: "demo-b/caso/B-002",
    panel: 3,
    umbral: "U4",
    playground: "demo-b/playground",
  },
] as const;

const camina = (page: Page) => page.locator("#camina");
const svg = (page: Page) => page.locator('#camina svg[data-visor="recorrido"]');

/** Los ids del mapa de cada paso, en orden, leídos del CSS generado no: del panel visible de cada paso. */
async function pasos(page: Page): Promise<number> {
  return page.locator("#camina [data-panel]").count();
}

for (const idioma of ["es", "en"] as const)
  for (const c of CASOS)
    test.describe(`${c.demo} · ${idioma}`, () => {
      const t = T[idioma];

      test("G10: el lienzo y el texto equivalente tienen los mismos pasos, y «Saltar el diagrama» lleva a él", async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/${idioma}/${c.ruta}`);
        await expect(
          page.getByRole("heading", { name: t.titulo }),
        ).toBeVisible();
        const n = await pasos(page);
        expect(n).toBeGreaterThan(2);
        const items = page.locator("#camina-texto + ol[data-equivalente] > li");
        await expect(items).toHaveCount(n);
        // Cada paso del texto nombra el nodo de su panel (el mismo orden que el lienzo).
        for (let k = 1; k <= n; k++) {
          const nodo = await page
            .locator(`#camina [data-panel="${k}"] [data-tipo]`)
            .first()
            .textContent();
          await expect(items.nth(k - 1)).toContainText(nodo!.trim());
        }
        const salto = page.getByRole("link", { name: t.saltar });
        await expect(salto).toHaveAttribute("href", "#camina-texto");
        await salto.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/#camina-texto$/);
        await expect(
          page.getByRole("heading", { name: t.equivalente }),
        ).toBeInViewport();
        expect(errores).toEqual([]);
      });

      test("botones y teclado cambian el paso; el nodo activo no se marca solo con color", async ({
        page,
      }) => {
        await page.goto(`/${idioma}/${c.ruta}`);
        await expect(camina(page)).toHaveAttribute("data-paso", "1");
        const siguiente = page.getByRole("button", { name: t.siguiente });
        await siguiente.click();
        await expect(camina(page)).toHaveAttribute("data-paso", "2");
        await page.keyboard.press("ArrowRight");
        await expect(camina(page)).toHaveAttribute("data-paso", "3");
        await page.keyboard.press("ArrowLeft");
        await expect(camina(page)).toHaveAttribute("data-paso", "2");
        await expect(camina(page).getByRole("status")).toContainText(
          idioma === "es" ? "Paso 2 de" : "Step 2 of",
        );
        // Solo el panel del paso se ve; el nodo activo lleva filete de 3 y los visitados, discontinuo.
        await expect(page.locator('#camina [data-panel="2"]')).toBeVisible();
        await expect(page.locator('#camina [data-panel="1"]')).toBeHidden();
        // El estilo se lee quieto: con movimiento, la transición interpola el filete a medias.
        await page.waitForFunction(() =>
          document.getAnimations().every((a) => a.playState !== "running"),
        );
        const estilo = await page.evaluate(() => {
          const visibles = [
            ...document.querySelectorAll<SVGGElement>("#camina .d-nodo"),
          ].map((g) => {
            const caja = g.querySelector(".caja")!;
            const s = getComputedStyle(caja);
            return { w: s.strokeWidth, dash: s.strokeDasharray };
          });
          return {
            activos: visibles.filter((v) => v.w === "3px").length,
            discontinuos: visibles.filter((v) => v.dash !== "none").length,
          };
        });
        expect(estilo.activos).toBe(1);
        expect(estilo.discontinuos).toBeGreaterThanOrEqual(1);
        // Al principio, «anterior» se anuncia deshabilitado y ← no retrocede de 1.
        await page.keyboard.press("ArrowLeft");
        await expect(camina(page)).toHaveAttribute("data-paso", "1");
        await expect(
          page.getByRole("button", { name: t.anterior }),
        ).toHaveAttribute("aria-disabled", "true");
        await page.keyboard.press("ArrowLeft");
        await expect(camina(page)).toHaveAttribute("data-paso", "1");
        await sinViolacionesAxe(page);
      });

      test("el contrafactual abre el playground con el valor que cambiaría la rama", async ({
        page,
      }) => {
        await page.goto(`/${idioma}/${c.ruta}`);
        for (let k = 1; k < c.panel; k++)
          await page.getByRole("button", { name: t.siguiente }).click();
        const enlace = page
          .locator(
            `#camina [data-panel="${c.panel}"] [data-contrafactual="${c.umbral}"]`,
          )
          .getByRole("link", { name: t.probar });
        await expect(enlace).toBeVisible();
        const href = (await enlace.getAttribute("href"))!;
        expect(href).toMatch(
          new RegExp(`^/${idioma}/${c.playground}\\?u=${c.umbral}:`),
        );
        const valor = href.split(":").pop()!;
        await enlace.click();
        const deslizador = page.locator(`#w-${c.umbral} input[type=range]`);
        await expect(deslizador).toHaveValue(String(Number(valor)));
        await expect(page.locator(`#w-${c.umbral}`)).toHaveAttribute(
          "data-movido",
          "true",
        );
      });
    });

test.describe("movimiento reducido (G12)", () => {
  test.use({ reducedMotion: "reduce" });
  for (const c of CASOS)
    test(`${c.demo}: ninguna animación en ningún paso, el SVG no cambia y reproducir avanza un paso`, async ({
      page,
    }) => {
      await page.goto(`/es/${c.ruta}`);
      const n = await pasos(page);
      const antes = await svg(page).evaluate((s) => s.outerHTML);
      for (let k = 2; k <= n; k++) {
        await page.getByRole("button", { name: T.es.siguiente }).click();
        await expect(camina(page)).toHaveAttribute("data-paso", String(k));
        expect(await page.evaluate(() => document.getAnimations().length)).toBe(
          0,
        );
      }
      expect(await svg(page).evaluate((s) => s.outerHTML)).toBe(antes);
      await page.getByRole("button", { name: T.es.anterior }).click();
      await page.getByRole("button", { name: T.es.reproducir }).click();
      await page.waitForTimeout(2_000);
      await expect(camina(page)).toHaveAttribute("data-paso", String(n));
      await sinViolacionesAxe(page);
    });
});

test.describe("con movimiento", () => {
  test.use({ reducedMotion: "no-preference" });
  test("la transición vive en la hoja aparte: al cambiar de paso, anima, y reproducir recorre hasta el final", async ({
    page,
  }) => {
    await page.goto("/es/caso/A-002");
    const animaciones = await page.evaluate(async () => {
      (
        [...document.querySelectorAll("#camina button")].find((b) =>
          b.textContent?.includes("Paso siguiente"),
        ) as HTMLButtonElement
      ).click();
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      return document.getAnimations().length;
    });
    expect(animaciones).toBeGreaterThan(0);
    const n = await pasos(page);
    await page.getByRole("button", { name: T.es.reproducir }).click();
    await expect(camina(page)).toHaveAttribute("data-paso", String(n), {
      timeout: 1_400 * n + 2_000,
    });
  });
});

test("el visor del agente lleva al recorrido de cada caso, junto a «Ver caso»", async ({
  page,
}) => {
  await page.goto("/es/agente");
  // Los enlaces viven en el detalle (cerrado) de cada traza: cada «Ver caso» tiene su «Recorrer» al mismo caso.
  const ver = page.locator('a[href^="/es/caso/A-"]:not([href*="#"])');
  const recorrer = page.locator('a[href^="/es/caso/A-"][href$="#c-camina"]');
  expect(await recorrer.count()).toBeGreaterThan(0);
  expect(await recorrer.count()).toBe(await ver.count());
  await expect(recorrer.first()).toContainText("Recorrer →");
});
