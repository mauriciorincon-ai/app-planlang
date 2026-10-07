import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * P6 Casos en el export servido (S2 fase 2; corrida de 200 del plan v1.5 desde el S3): el índice y la página de cada
 * caso se leen en los dos idiomas, temas y perfiles sin desplazar la página de lado y sin violaciones de axe (críticas,
 * serias ni moderadas); el selector lleva a los casos con página (los 20 primeros y los que nombra el informe) y marca
 * el actual; un caso con pausa humana y documento adverso (A-017) los muestra y uno que no los tuvo (A-001) no los
 * inventa; el cambio de idioma conserva el caso; la marca de inyección (A-016) y el diálogo de aclaración (A-013) se
 * ven; y con movimiento reducido lo del experto aparece visible.
 */

/** Las páginas de caso del A que salieron en el export (las que el selector debe enlazar, ni una más). */
const PAGINAS_A = readdirSync("out/es/caso").filter((f) =>
  /^A-\d+\.html$/.test(f),
).length;

const T = {
  es: {
    pestana: "Casos",
    h1: "Un caso, de punta a punta",
    mirada: "El caso en una mirada",
    selector: "Casos",
    recorrido: "El recorrido, paso a paso",
    pausa: "La pausa humana: lo que vio el auditor",
    salida: "La respuesta y la guardia",
    documento: "El documento de decisión adversa",
    senales: /^Las \d+ señales que deja la traza$/,
    inyeccion: "instrucción escondida",
    pregunta: "Pregunta",
  },
  en: {
    pestana: "Cases",
    h1: "One case, end to end",
    mirada: "The case at a glance",
    selector: "Cases",
    recorrido: "The path, step by step",
    pausa: "The human pause: what the auditor saw",
    salida: "The reply and the guard",
    documento: "The adverse decision document",
    senales: /^The \d+ signals the trace leaves$/,
    inyeccion: "hidden instruction",
    pregunta: "Question",
  },
} as const;

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P6 Casos (${idioma})`, () => {
    test("del índice a un caso: el selector lleva a los casos con página, marca el actual y conserva el caso al cambiar de idioma", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/caso$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
      const selector = page.getByRole("navigation", {
        name: t.selector,
        exact: true,
      });
      expect(PAGINAS_A).toBeGreaterThan(20);
      expect(PAGINAS_A).toBeLessThan(200);
      await expect(selector.getByRole("link")).toHaveCount(PAGINAS_A);
      await expect(selector.locator("[aria-current]")).toHaveCount(0);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);

      await selector.getByRole("link", { name: /^A-017/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/caso/A-017$`));
      await expect(
        selector.getByRole("link", { name: /^A-017/ }),
      ).toHaveAttribute("aria-current", "page");
      await expect(selector.locator("[aria-current]")).toHaveCount(1);

      const otro = idioma === "es" ? "en" : "es";
      await page.locator(`header a[hreflang="${otro}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${otro}/caso/A-017$`));
      expect(errores).toEqual([]);
    });

    test("A-017 se lee completo en los dos temas y perfiles: pausa, documento y, para el experto, las señales", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      for (const tema of ["oscuro", "claro"])
        for (const perfil of ["lider", "experto"]) {
          await page.goto(
            `/${idioma}/caso/A-017?tema=${tema}&perfil=${perfil}`,
          );
          for (const h of [
            t.mirada,
            t.recorrido,
            t.pausa,
            t.salida,
            t.documento,
          ])
            await expect(page.getByRole("heading", { name: h })).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.senales }),
          ).toBeVisible({ visible: perfil === "experto" });
          expect(
            await desbordeLateral(page),
            `${tema}/${perfil}`,
          ).toBeLessThanOrEqual(0);
          await sinViolacionesAxe(page);
        }
      expect(errores).toEqual([]);
    });

    test("A-001 no tuvo pausa ni documento y la página no los inventa", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/caso/A-001?perfil=experto`);
      await expect(
        page.getByRole("heading", { name: t.recorrido }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: t.salida })).toBeVisible();
      await expect(page.getByRole("heading", { name: t.pausa })).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: t.documento }),
      ).toHaveCount(0);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
    });

    test("A-016 marca la instrucción escondida y A-013 muestra el diálogo de aclaración", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/caso/A-016`);
      const marca = page.locator("mark");
      await expect(marca).toHaveCount(1);
      await expect(marca).toBeVisible();
      await expect(marca).toContainText(t.inyeccion);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);

      await page.goto(`/${idioma}/caso/A-013`);
      await expect(page.locator("mark")).toHaveCount(0);
      const preguntas = page.getByText(t.pregunta, { exact: true });
      expect(await preguntas.count()).toBeGreaterThanOrEqual(1);
      await expect(preguntas.first()).toBeVisible();
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en un caso, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/caso/A-017?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.senales });
    await expect(titulo).toBeVisible();
    const estado = await titulo.evaluate((h) => ({
      opacidad: Number(
        getComputedStyle(h.closest(".solo-experto") as HTMLElement).opacity,
      ),
      animaciones: document.getAnimations().length,
    }));
    expect(estado).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesAxe(page);
  });
});
