import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * Un plan sin corrida (S5) en el export servido, en español: se llega desde la sección «Planes sin corrida» de la
 * Entrada; la ficha dice lo que NO hay (trazas, brecha, playground, visor); cada sección del plan trae sus elementos
 * y, como experto, quién los propuso; se lee en los dos temas y los dos perfiles sin desplazar la página de lado y sin violaciones
 * de axe; el idioma lleva a la misma página en inglés. Sobre el plan de HackGuard (`plans/hackguard-agentes/v1.json`).
 */

const ID = "hackguard-agentes";

test.describe("Plan sin corrida (es)", () => {
  test("se llega desde la Entrada y la ficha dice lo que no hay", async ({
    page,
  }) => {
    await page.goto("/es");
    const fila = page.locator(`[data-plan="${ID}"]`);
    await expect(fila).toBeVisible();
    await fila.getByRole("link", { name: "Leer el plan" }).click();
    await expect(page).toHaveURL(new RegExp(`/es/planes/${ID}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Seguridad de IA · planeación de pruebas y evidencia de resultados",
    );
    const ficha = page.locator('[data-ficha="sin-corrida"]');
    await expect(ficha).toContainText("Sin corrida");
    await expect(ficha).toContainText(
      "Lo que no hay: trazas, brecha, playground, visor.",
    );
    await expect(ficha).toContainText("Mauricio Rincón · el 2026-10-11");
  });

  test("cada sección trae sus elementos y, como experto, quién los propuso", async ({
    page,
  }) => {
    await page.goto(`/es/planes/${ID}?perfil=lider`);
    const chips = page.locator(
      'section[aria-labelledby="ps-decisiones-t"] [data-procedencia]',
    );
    await expect(chips.first()).toBeHidden();
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    await expect(chips.first()).toBeVisible();
    for (const s of [
      "actores",
      "decisiones",
      "riesgos",
      "supuestos",
      "criterios",
      "umbrales",
    ])
      await expect(page.locator(`#ps-${s}-t`)).toBeVisible();
    // Las cuatro decisiones las decidió quien respondió; los umbrales llevan su valor del plan.
    const decisiones = page.locator(
      'section[aria-labelledby="ps-decisiones-t"] [data-elemento]',
    );
    await expect(decisiones).toHaveCount(4);
    await expect(decisiones.first()).toContainText("usuario");
    await expect(
      page.locator('section[aria-labelledby="ps-umbrales-t"]'),
    ).toContainText("antiguedad_marco_dias > 180 días (mayor que)");
  });

  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`se lee en tema ${tema} como ${perfil}, sin desplazamiento ni violaciones`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/es/planes/${ID}?tema=${tema}&perfil=${perfil}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator("#ps-ficha-t")).toBeVisible();
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("el idioma lleva a la misma página en inglés", async ({ page }) => {
    await page.goto(`/es/planes/${ID}`);
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(new RegExp(`/en/planes/${ID}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "AI security · test planning and result evidence",
    );
    await expect(page.locator('[data-ficha="sin-corrida"]')).toContainText(
      "What is missing: traces, gap, playground, viewer.",
    );
  });
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en el plan sin corrida nada se anima y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto(`/es/planes/${ID}?perfil=lider`);
    await page
      .getByRole("group", { name: "Tema" })
      .getByRole("button", { name: "Claro" })
      .click();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await sinViolacionesAxe(page);
  });
});
