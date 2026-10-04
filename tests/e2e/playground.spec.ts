import { expect, test, type Page } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * P5 Playground en el export servido (S2 fase 3): se llega por su pestaña y se lee en los dos idiomas, temas y
 * perfiles sin desplazar la página de lado, sin violaciones de axe (críticas, serias ni moderadas) y sin errores de hidratación; los
 * deslizadores se mueven con el teclado y recalculan en el navegador (U1 a 0,90 manda A-008 a una persona; U2 a 1600
 * introduce el error de A-010, cuyo enlace abre la traza en el paso donde el camino se separa); el modo Texas es un interruptor que no cambia ningún caso y lo dice; «Volver al plan»
 * deshace; y con movimiento reducido lo del experto aparece visible.
 */

const T = {
  es: {
    pestana: "Playground",
    h1: "¿Y si el plan hubiera fijado otros umbrales?",
    mirada: "El playground en una mirada",
    ficha: "Ficha técnica del playground",
    juego: "Mueve los umbrales",
    curva: "La curva riesgo-cobertura",
    limites: "Lo que el playground no puede saber",
    u1: /Confianza mínima de extracción/,
    u2: /Alto costo/,
    texas: /Modo Texas/,
    enPlan: "En los valores del plan",
    movidoU1: "Movido: U1 0,90.",
    texasNada: "Encender el modo Texas no cambia ningún caso",
    error: "error: debía ir a una persona",
    volver: "Volver al plan",
  },
  en: {
    pestana: "Playground",
    h1: "What if the plan had set other thresholds?",
    mirada: "The playground at a glance",
    ficha: "Playground technical record",
    juego: "Move the thresholds",
    curva: "The risk-coverage curve",
    limites: "What the playground cannot know",
    u1: /Minimum extraction confidence/,
    u2: /High cost/,
    texas: /Texas mode/,
    enPlan: "At the plan values",
    movidoU1: "Moved: U1 0.90.",
    texasNada: "Turning Texas mode on changes no case",
    error: "error: it had to go to a person",
    volver: "Back to the plan",
  },
} as const;

const estado = (page: Page) =>
  page.getByRole("status").filter({ hasText: /plan|Movido|Moved/ });
const cambios = (page: Page) => page.locator("#cambios [data-caso]");

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P5 Playground (${idioma})`, () => {
    test("se llega por su pestaña", async ({ page }) => {
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/playground$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
    });

    for (const tema of ["oscuro", "claro"])
      for (const perfil of ["lider", "experto"])
        test(`se lee en tema ${tema} como ${perfil}, sin errores de hidratación, desplazamiento ni violaciones`, async ({
          page,
        }) => {
          const errores = consolaLimpia(page);
          await page.goto(
            `/${idioma}/playground?tema=${tema}&perfil=${perfil}`,
          );
          for (const h of [t.mirada, t.juego, t.curva, t.limites])
            await expect(
              page.getByRole("heading", { name: h, exact: true }),
            ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.ficha }),
          ).toBeVisible({ visible: perfil === "experto" });
          await expect(estado(page)).toContainText(t.enPlan);
          expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
          await sinViolacionesAxe(page);
          expect(errores).toEqual([]);
        });

    test("con el teclado: U1 a 0,90 manda A-008 a una persona y «Volver al plan» lo deshace", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground`);
      const u1 = page.getByRole("slider", { name: t.u1 });
      // Deshabilitado no se lee igual que habilitado, y no solo por el color: el borde cambia (AU-S2-B23).
      const volver = page.getByRole("button", { name: t.volver });
      const borde = () =>
        volver.evaluate((b) => getComputedStyle(b).borderTopStyle);
      await expect(volver).toBeDisabled();
      expect(await borde()).toBe("dashed");
      await u1.focus();
      for (let k = 0; k < 3; k++) await page.keyboard.press("ArrowRight");
      await expect(volver).toBeEnabled();
      expect(await borde()).toBe("solid");
      await expect(u1).toHaveValue("0.9");
      await expect(cambios(page)).toHaveCount(1);
      await expect(cambios(page).first()).toHaveAttribute("data-caso", "A-008");
      await expect(estado(page)).toContainText(t.movidoU1);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
      await page.getByRole("button", { name: t.volver }).click();
      await expect(cambios(page)).toHaveCount(0);
      await expect(u1).toHaveValue("0.75");
      await expect(estado(page)).toContainText(t.enPlan);
    });

    test("U2 a 1600 introduce el error de A-010, que enlaza a su traza", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground?tema=claro`);
      const u2 = page.getByRole("slider", { name: t.u2 });
      await u2.focus();
      for (let k = 0; k < 6; k++) await page.keyboard.press("ArrowRight");
      await expect(u2).toHaveValue("1600");
      const fila = page.locator('#cambios [data-caso="A-010"]');
      await expect(fila).toContainText(t.error);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
      await fila.getByRole("link").click();
      // Abre el caso en el paso donde el camino se separa (AU-S2-P-5), y ese paso queda a la vista.
      await expect(page).toHaveURL(
        new RegExp(`/${idioma}/caso/A-010#paso-\\d+$`),
      );
      const paso = new URL(page.url()).hash;
      await expect(page.locator(`li${paso}`)).toBeInViewport();
    });

    test("el modo Texas es un interruptor: con la barra espaciadora se enciende y no cambia ningún caso", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground`);
      const texas = page.getByRole("switch", { name: t.texas });
      await expect(texas).toHaveAttribute("aria-checked", "false");
      await texas.focus();
      await page.keyboard.press("Space");
      await expect(texas).toHaveAttribute("aria-checked", "true");
      await expect(cambios(page)).toHaveCount(0);
      await expect(page.locator("#cambios")).toContainText(t.texasNada);
      await page.keyboard.press("Enter");
      await expect(texas).toHaveAttribute("aria-checked", "false");
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en el playground, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/playground?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.ficha });
    await expect(titulo).toBeVisible();
    const est = await titulo.evaluate((h) => ({
      opacidad: Number(
        getComputedStyle(h.closest(".solo-experto") as HTMLElement).opacity,
      ),
      animaciones: document.getAnimations().length,
    }));
    expect(est).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesAxe(page);
  });
});
