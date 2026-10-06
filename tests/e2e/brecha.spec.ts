import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * P4 Brecha en el export servido (S2 fase 3): se llega por su pestaña y se lee en los dos idiomas, temas y perfiles
 * sin desplazar la página de lado y sin violaciones de axe (críticas, serias ni moderadas); lo que falló y lo sin probar están al frente y el
 * balance lleva a cada uno; las nueve secciones del informe tienen su ancla; el informe abre el playground; y con
 * movimiento reducido lo del experto aparece visible. Desde el S3, sobre la corrida de 200 del plan v1.5: fallaron S2 y
 * S3 y lo que vio un evaluador; C5 quedó incompleto.
 */

const T = {
  es: {
    pestana: "Brecha",
    h1: "La brecha entre el plan y lo que hizo el agente",
    mirada: "El informe en una mirada",
    abrir: "Abrir el playground",
  },
  en: {
    pestana: "Gap",
    h1: "The gap between the plan and what the agent did",
    mirada: "The report at a glance",
    abrir: "Open the playground",
  },
} as const;

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P4 Brecha (${idioma})`, () => {
    test("se llega por su pestaña", async ({ page }) => {
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/brecha$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
    });

    for (const tema of ["oscuro", "claro"])
      for (const perfil of ["lider", "experto"])
        test(`se lee en tema ${tema} como ${perfil}: lo que falló al frente, las 9 secciones, sin desplazamiento ni violaciones`, async ({
          page,
        }) => {
          const errores = consolaLimpia(page);
          await page.goto(`/${idioma}/brecha?tema=${tema}&perfil=${perfil}`);
          await expect(
            page.getByRole("heading", { name: t.mirada }),
          ).toBeVisible();
          for (const id of ["f-S2", "f-S3", "f-np", "f-C5"])
            await expect(page.locator(`#${id}`)).toBeVisible();
          for (let n = 1; n <= 9; n++)
            await expect(page.locator(`h2#b${n}`)).toBeVisible();
          expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
          await sinViolacionesAxe(page);
          expect(errores).toEqual([]);
        });

    test("el balance lleva a lo que falló (S2) y a lo incompleto (C5); el informe abre el playground", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/brecha`);
      await page.locator('a[href="#f-S2"]').first().click();
      await expect(page).toHaveURL(/#f-S2$/);
      await expect(page.locator("#f-S2")).toBeInViewport();
      await page.locator('a[href="#f-C5"]').first().click();
      await expect(page.locator("#f-C5")).toBeInViewport();
      await page.getByRole("link", { name: t.abrir }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/playground$`));
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en la brecha, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/brecha?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const experto = page.locator(".solo-experto").first();
    await expect(experto).toBeVisible();
    const est = await experto.evaluate((el) => ({
      opacidad: Number(getComputedStyle(el).opacity),
      animaciones: document.getAnimations().length,
    }));
    expect(est).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesAxe(page);
  });
});
