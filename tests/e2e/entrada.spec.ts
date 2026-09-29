import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * P1 Entrada en el export servido (S2 fase 1). Se entra por el ÍNDICE (`/`), como un visitante; se recorre en
 * los dos idiomas, los dos temas y los dos perfiles; cada control se pulsa y cambia algo (regla 22 b); axe
 * sin violaciones serias; sin desplazamiento de lado a 380 px; consola limpia (sin #418 de hidratación); y con
 * movimiento reducido lo que aparece se ve de verdad.
 */

function consolaLimpia(page: Page): string[] {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(String(e)));
  return errores;
}

async function sinViolacionesSerias(page: Page) {
  // axe mide colores: una transición a medias (150 ms) daría un contraste que nadie ve quieto.
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  const scan = await new AxeBuilder({ page }).analyze();
  const serias = scan.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    serias,
    JSON.stringify(serias.map((v) => [v.id, v.nodes.map((n) => n.target)])),
  ).toEqual([]);
}

test.describe("el índice elige idioma", () => {
  test.describe("navegador en español", () => {
    test.use({ locale: "es-CO" });
    test("`/` lleva a /es", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/es$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "es");
    });
  });

  test.describe("navegador en inglés", () => {
    test.use({ locale: "en-US" });
    test("`/` lleva a /en y recuerda el idioma elegido después", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/en$/);
      await page.goto("/?elegir");
      await expect(page).toHaveURL(/\?elegir$/);
      await page.getByRole("link", { name: /Español/ }).click();
      await expect(page).toHaveURL(/\/es$/);
      await page.goto("/");
      await expect(page).toHaveURL(/\/es$/);
    });
  });
});

for (const idioma of ["es", "en"] as const) {
  const T =
    idioma === "es"
      ? {
          h1: "Planeé, construí y medí la brecha.",
          rotulo: "Simulación · no operativo",
          veredicto: "Cumple con alertas",
          experto: "Cómo se sostiene cada afirmación",
          verExperto: "Ver como experto",
          volver: "Volver a líder",
          claro: "Claro",
          plan: "Plan",
          nav: "Secciones",
          otro: "English",
        }
      : {
          h1: "I planned, I built, and I measured the gap.",
          rotulo: "Simulation · not operational",
          veredicto: "Meets with warnings",
          experto: "How each claim holds up",
          verExperto: "View as expert",
          volver: "Back to leader",
          claro: "Light",
          plan: "Plan",
          nav: "Sections",
          otro: "Español",
        };

  test.describe(`P1 Entrada (${idioma})`, () => {
    test("se lee completa, sin desplazamiento de lado y sin violaciones serias en los dos temas y perfiles", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto("/?elegir");
      await page.locator(`a[hreflang="${idioma}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(T.h1);
      await expect(page.getByText(T.rotulo).first()).toBeVisible();
      await expect(page.getByText(T.veredicto)).toBeVisible();
      for (const tema of ["oscuro", "claro"])
        for (const perfil of ["lider", "experto"]) {
          await page.goto(`/${idioma}?tema=${tema}&perfil=${perfil}`);
          await expect(page.locator("html")).toHaveAttribute(
            "data-theme",
            tema,
          );
          await expect(
            page.getByRole("heading", { name: T.experto }),
          ).toBeVisible({ visible: perfil === "experto" });
          const lado = await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          );
          expect(
            lado,
            `${tema}/${perfil}: la página se desplaza de lado`,
          ).toBeLessThanOrEqual(0);
          await sinViolacionesSerias(page);
        }
      expect(errores).toEqual([]);
    });

    test("cada control cambia algo (regla 22): tema, perfil, idioma y pestaña", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/${idioma}?tema=oscuro&perfil=lider`);
      const fondo = () =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const oscuro = await fondo();
      await page.getByRole("button", { name: T.claro }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "claro");
      expect(await fondo()).not.toBe(oscuro);

      await page.getByRole("button", { name: T.verExperto }).click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-perfil",
        "experto",
      );
      await expect(
        page.getByRole("heading", { name: T.experto }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: T.volver })).toBeFocused();
      await page.getByRole("button", { name: T.volver }).click();
      await expect(page.getByRole("heading", { name: T.experto })).toBeHidden();

      // Las preferencias sobreviven a la navegación: otra página, mismo tema.
      await page
        .getByRole("navigation", { name: T.nav })
        .getByRole("link", { name: T.plan })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/plan$`));
      await expect(page.locator("html")).toHaveAttribute("data-theme", "claro");
      await page.getByRole("link", { name: T.otro }).click();
      await expect(page).toHaveURL(
        new RegExp(`/${idioma === "es" ? "en" : "es"}/plan$`),
      );
      expect(errores).toEqual([]);
    });
  });
}

test("a 380 px las pestañas se deslizan dentro de su fila y la página no", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "telefono", "solo en el teléfono");
  await page.goto("/es");
  const nav = page.getByRole("navigation", { name: "Secciones" });
  const [scroll, client] = await nav.evaluate((n) => [
    n.scrollWidth,
    n.clientWidth,
  ]);
  expect(scroll).toBeGreaterThan(client);
  const lado = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(lado).toBeLessThanOrEqual(0);
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("lo que aparece al cambiar de perfil se ve de verdad, sin animación", async ({
    page,
  }) => {
    await page.goto("/es?perfil=lider");
    for (const sel of ["h1", "#capacidad"]) {
      const el = page.locator(sel).first();
      await expect(el).toBeVisible();
      expect(
        await el.evaluate((e) => Number(getComputedStyle(e).opacity)),
      ).toBe(1);
    }
    await page.getByRole("button", { name: "Ver como experto" }).click();
    const bloque = page.getByRole("heading", {
      name: "Cómo se sostiene cada afirmación",
    });
    await expect(bloque).toBeVisible();
    const estado = await bloque.evaluate((h) => {
      const caja = h.closest(".cambia-perfil") as HTMLElement;
      return {
        opacidad: Number(getComputedStyle(caja).opacity),
        animaciones: document.getAnimations().length,
        alto: caja.getBoundingClientRect().height,
      };
    });
    expect(estado).toEqual({
      opacidad: 1,
      animaciones: 0,
      alto: expect.any(Number),
    });
    expect(estado.alto).toBeGreaterThan(100);
    await sinViolacionesSerias(page);
  });
});

test("una ruta que no existe responde con la 404 en los dos idiomas", async ({
  page,
}) => {
  const r = await page.goto("/es/no-existe");
  expect(r?.status()).toBe(404);
  await expect(page.getByText("Esta página no existe")).toBeVisible();
  await expect(page.getByText("This page does not exist")).toBeVisible();
});
