import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * «Comparar dos corridas» (S4) en el export servido, en español (y desde el S7 también en inglés): se llega desde la fila del A en la Entrada y desde la
 * fila de la línea base en la Brecha; se lee en los dos temas y los dos perfiles sin desplazar la página de lado y sin
 * violaciones de axe; los casos que difieren enlazan a su página; y con movimiento reducido lo del experto aparece
 * visible. Sobre la corrida de 200 del plan v1.5: 18 casos difieren, todos por la pausa.
 */

test.describe("Comparar dos corridas (es)", () => {
  test("se llega desde la fila del A en la Entrada", async ({ page }) => {
    await page.goto("/es");
    await page
      .getByRole("link", { name: "Comparar", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/es\/comparar$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Comparar dos corridas",
    );
  });

  test("se llega desde la fila de la línea base en la Brecha del A", async ({
    page,
  }) => {
    await page.goto("/es/brecha");
    await page
      .getByRole("link", { name: "Comparar las dos corridas", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/es\/comparar$/);
  });

  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`se lee en tema ${tema} como ${perfil}: veredicto, criterios, riesgos y casos, sin desplazamiento ni violaciones`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/es/comparar?tema=${tema}&perfil=${perfil}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        for (const id of ["s-veredicto-t", "s-riesgos-t", "s-casos-t"])
          await expect(page.locator(`#${id}`)).toBeVisible();
        await expect(
          page.getByText("Cumple con alertas").first(),
        ).toBeVisible();
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("cada caso que difiere enlaza a su página", async ({ page }) => {
    await page.goto("/es/comparar");
    const enlaces = page.locator('a[href*="/es/caso/A-"]');
    await expect(enlaces.first()).toBeVisible();
    expect(await enlaces.count()).toBeGreaterThanOrEqual(18);
    await enlaces.first().click();
    await expect(page).toHaveURL(/\/es\/caso\/A-\d{3}$/);
  });
});

/**
 * S7, el segundo idioma: lo mismo que arriba en inglés (la pantalla, sus dos entradas, los dos temas y perfiles, sus
 * casos enlazados). El texto de cada idioma sale del dato, no de una traducción de la prueba.
 */
test.describe("Compare two runs (en)", () => {
  test("it is reached from demo A's row on the home page", async ({ page }) => {
    await page.goto("/en");
    await page
      .getByRole("link", { name: "Compare", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/comparar$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Compare two runs",
    );
  });

  test("it is reached from the baseline row of demo A's Gap", async ({
    page,
  }) => {
    await page.goto("/en/brecha");
    await page
      .getByRole("link", { name: "Compare the two runs", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/comparar$/);
  });

  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`it reads in the ${tema} theme as ${perfil}: verdict, criteria, risks and cases, with no sideways scroll or violations`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/en/comparar?tema=${tema}&perfil=${perfil}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        for (const id of ["s-veredicto-t", "s-riesgos-t", "s-casos-t"])
          await expect(page.locator(`#${id}`)).toBeVisible();
        await expect(
          page.getByText(/Meets with (alerts|warnings)/).first(),
        ).toBeVisible();
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("every case that differs links to its page", async ({ page }) => {
    await page.goto("/en/comparar");
    const enlaces = page.locator('a[href*="/en/caso/A-"]');
    await expect(enlaces.first()).toBeVisible();
    expect(await enlaces.count()).toBeGreaterThanOrEqual(18);
    await enlaces.first().click();
    await expect(page).toHaveURL(/\/en\/caso\/A-\d{3}$/);
  });

  test("the language switch leads to the same page in Spanish", async ({
    page,
  }) => {
    await page.goto("/en/comparar");
    await page.getByRole("link", { name: "Español" }).click();
    await expect(page).toHaveURL(/\/es\/comparar$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Comparar dos corridas",
    );
  });
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en la comparación, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/comparar?perfil=lider");
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
