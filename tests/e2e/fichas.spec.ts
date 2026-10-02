import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesSerias } from "./_comun";

/**
 * P7 Fichas en el export servido (S2 fase 4): se llega por su pestaña y se lee en los dos idiomas, temas y perfiles
 * sin desplazar la página de lado, sin violaciones serias de axe y sin errores de hidratación; las dos fichas de la
 * vitrina se pintan en la piel de CV Viva (papel claro también en el tema oscuro, Fraunces solo dentro del marco); el
 * experto ve la tabla de campos bajo cada ficha y el líder no; y con movimiento reducido aparece sin animación.
 */

const T = {
  es: {
    pestana: "Fichas",
    h1: "Las fichas: repetirla, y contarla en dos minutos",
    mirada: "Las fichas en una mirada",
    repro: "Ficha de reproducibilidad",
    app: "La ficha de la app",
    agente: "La ficha del agente A",
    repetir: "Cómo repetirla, en orden",
    nombreAgente: "Agente A · autorizaciones médicas",
  },
  en: {
    pestana: "Records",
    h1: "The records: repeat it, and tell it in two minutes",
    mirada: "The records at a glance",
    repro: "Reproducibility record",
    app: "The app's record",
    agente: "Agent A's record",
    repetir: "How to repeat it, in order",
    nombreAgente: "Agent A · medical prior authorizations",
  },
} as const;

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P7 Fichas (${idioma})`, () => {
    test("se llega por su pestaña", async ({ page }) => {
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/fichas$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
    });

    for (const tema of ["oscuro", "claro"])
      for (const perfil of ["lider", "experto"])
        test(`se lee en tema ${tema} como ${perfil}, sin errores de hidratación, desplazamiento ni violaciones`, async ({
          page,
        }) => {
          const errores = consolaLimpia(page);
          await page.goto(`/${idioma}/fichas?tema=${tema}&perfil=${perfil}`);
          for (const h of [t.mirada, t.repro, t.app, t.agente])
            await expect(
              page.getByRole("heading", { name: h }).first(),
            ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.nombreAgente, exact: true }),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.repetir }),
          ).toBeVisible({ visible: perfil === "experto" });
          await expect(
            page.locator('[data-campo="proceso.carriles[]"]'),
          ).toBeVisible({ visible: perfil === "experto" });
          expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
          await sinViolacionesSerias(page);
          expect(errores).toEqual([]);
        });

    test("la piel de CV Viva: papel claro en el tema oscuro y Fraunces solo dentro del marco", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/fichas?tema=oscuro`);
      // Fraunces entra después de la carga, como la mono (`html[data-mono]`).
      await expect(page.locator("html")).toHaveAttribute("data-mono", /.*/);
      const ficha = page.locator('[data-ficha-cv="agente"]');
      await expect(ficha).toHaveAttribute("lang", idioma);
      const piel = await ficha.evaluate((el) => {
        const titulo = el.querySelector("h3") as HTMLElement;
        return {
          fondo: getComputedStyle(el).backgroundColor,
          letra: getComputedStyle(titulo).fontFamily,
          fuera: getComputedStyle(document.querySelector("h1")!).fontFamily,
        };
      });
      expect(piel.fondo).toBe("rgb(251, 250, 247)");
      expect(piel.letra.toLowerCase()).toContain("fraunces");
      expect(piel.fuera.toLowerCase()).not.toContain("fraunces");
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en las fichas, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/fichas?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.repetir });
    await expect(titulo).toBeVisible();
    const est = await titulo.evaluate((h) => ({
      opacidad: Number(
        getComputedStyle(h.closest(".solo-experto") as HTMLElement).opacity,
      ),
      animaciones: document.getAnimations().length,
    }));
    expect(est).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesSerias(page);
  });
});
