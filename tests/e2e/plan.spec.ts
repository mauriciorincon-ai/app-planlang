import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * P2 Plan en el export servido (S2 fase 2): se lee entera en los dos idiomas, temas y perfiles sin desplazar la
 * página de lado y sin violaciones de axe (críticas, serias ni moderadas); cada control hace algo (regla 22 b): el índice lleva a su sección,
 * «Ver N más» abre el resto, cada renglón se abre y «Moverlo» lleva al playground; y con movimiento reducido lo del
 * experto se ve de verdad.
 */

const T = {
  es: {
    pestana: "Plan",
    h1: "El plan, escrito como contrato",
    ficha: "Ficha técnica del plan",
    indice: "Partes del plan",
    riesgos: /^2\s*Riesgos$/,
    mas: "Ver 3 más: R7, R4, R8",
    r4: "Bucle de aclaraciones",
    abrir: "Qué pasaría y qué se hizo",
    siPasa: "Si pasa",
    mover: "Moverlo: U1 en el playground",
  },
  en: {
    pestana: "Plan",
    h1: "The plan, written as a contract",
    ficha: "The plan’s technical record",
    indice: "Parts of the plan",
    riesgos: /^2\s*Risks$/,
    mas: "Show 3 more: R7, R4, R8",
    r4: "Clarification loop",
    abrir: "What would happen and what was done",
    siPasa: "If it happens",
    mover: "Move it: U1 in the playground",
  },
} as const;

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P2 Plan (${idioma})`, () => {
    test("se lee completa en los dos temas y perfiles: sin desplazamiento de lado ni violaciones de axe", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/plan$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
      for (const tema of ["oscuro", "claro"])
        for (const perfil of ["lider", "experto"]) {
          await page.goto(`/${idioma}/plan?tema=${tema}&perfil=${perfil}`);
          await expect(
            page.getByRole("heading", { name: t.ficha }),
          ).toBeVisible({
            visible: perfil === "experto",
          });
          expect(
            await desbordeLateral(page),
            `${tema}/${perfil}`,
          ).toBeLessThanOrEqual(0);
          await sinViolacionesAxe(page);
        }
      expect(errores).toEqual([]);
    });

    test("cada control hace algo: índice, «Ver N más», abrir un renglón y «Moverlo»", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/${idioma}/plan?tema=oscuro&perfil=lider`);

      // El índice lleva a su sección.
      await page
        .getByRole("navigation", { name: t.indice })
        .getByRole("link", { name: /Riesgos|Risks/ })
        .click();
      await expect(page).toHaveURL(/#p-ries$/);
      await expect(
        page.getByRole("heading", { name: t.riesgos }),
      ).toBeInViewport();

      // «Ver N más» abre el resto.
      await expect(page.getByText(t.r4, { exact: true })).toBeHidden();
      await page.getByRole("button", { name: t.mas }).click();
      await expect(page.getByText(t.r4, { exact: true })).toBeVisible();

      // Un renglón se abre y muestra su porqué.
      const fila = page.locator("#fila-R2");
      await expect(fila.getByText(t.siPasa)).toBeHidden();
      await fila.getByText(t.abrir).click();
      await expect(fila.getByText(t.siPasa)).toBeVisible();

      // «Moverlo» lleva al playground.
      await page.getByRole("link", { name: t.mover }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/playground$`));
      expect(errores).toEqual([]);
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/plan?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.ficha });
    await expect(titulo).toBeVisible();
    const estado = await titulo.evaluate((h) => ({
      opacidad: Number(
        getComputedStyle(h.closest(".cambia-perfil") as HTMLElement).opacity,
      ),
      animaciones: document.getAnimations().length,
    }));
    expect(estado).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesAxe(page);
  });
});
