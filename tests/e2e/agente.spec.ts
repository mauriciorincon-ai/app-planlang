import { expect, test, type Page } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesSerias } from "./_comun";

/**
 * P3 Agente en el export servido (S2 fase 2): se lee entera en los dos idiomas, temas y perfiles sin desplazar
 * la página de lado y sin violaciones serias de axe; cada control hace algo (regla 22 b): elegir un nodo en el
 * lienzo y con el teclado, la regla U1, las pestañas del panel, «Ver N más», el conmutador lienzo · lista y el
 * índice de capas en el teléfono; y con movimiento reducido lo del experto se ve de verdad.
 */

const T = {
  es: {
    h1: "El agente de autorizaciones, tal como corrió",
    ficha: "El agente en una mirada",
    experto: "Qué del plan toca a cada nodo",
    lista: "Lista por capa",
    codigo: "Código",
    trazas: /^Trazas · \d+$/,
    mas: /^Ver \d+ más/,
    menos: "Ver menos",
    region: /Diagrama del agente/,
    u1: /U1 = 0,75/,
    capa: "Ir a la capa 06",
  },
  en: {
    h1: "The authorization agent, as it ran",
    ficha: "The agent at a glance",
    experto: "What in the plan touches each node",
    lista: "List by layer",
    codigo: "Code",
    trazas: /^Traces · \d+$/,
    mas: /^See \d+ more/,
    menos: "See less",
    region: /Agent diagram/,
    u1: /U1 = 0.75/,
    capa: "Go to layer 06",
  },
} as const;

const detalle = (page: Page, id: string) => page.locator(`#detalle-${id}`);

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P3 Agente (${idioma})`, () => {
    test("se lee completa en los dos temas y perfiles: sin desplazamiento de lado ni violaciones serias", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto("/?elegir");
      await page.locator(`a[hreflang="${idioma}"]`).click();
      await page
        .getByRole("navigation")
        .first()
        .locator(`a[href="/${idioma}/agente"]`)
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
      for (const tema of ["oscuro", "claro"])
        for (const perfil of ["lider", "experto"]) {
          await page.goto(`/${idioma}/agente?tema=${tema}&perfil=${perfil}`);
          await expect(
            page.getByRole("heading", { name: t.ficha }),
          ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.experto }),
          ).toBeVisible({ visible: perfil === "experto" });
          expect(
            await desbordeLateral(page),
            `${tema}/${perfil}`,
          ).toBeLessThanOrEqual(0);
          await sinViolacionesSerias(page);
        }
      expect(errores).toEqual([]);
    });

    test("cada control hace algo: nodo, teclado, regla U1, pestañas, «Ver más» y lista", async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/${idioma}/agente?tema=oscuro&perfil=lider`);
      await expect(detalle(page, "enrutador")).toBeVisible();

      // Tocar un nodo del lienzo cambia el detalle.
      await page.locator('[data-sel-id="extractor"]').click();
      await expect(detalle(page, "extractor")).toBeVisible();
      await expect(detalle(page, "enrutador")).toBeHidden();
      await expect(page.locator('[data-sel-id="extractor"]')).toHaveAttribute(
        "data-sel",
        "true",
      );

      // Con el teclado: la regla U1 se enfoca y se elige con Enter.
      await page.locator('[data-sel-id^="l-decision"]').focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("img", { name: t.u1 })).toBeVisible();

      // Pestañas del panel: Código y Trazas son locales; «Ver N más» abre el resto.
      await page.locator('[data-sel-id="decision"]').click();
      const panel = detalle(page, "decision");
      await panel.getByRole("button", { name: t.codigo, exact: true }).click();
      await expect(panel.locator("figure").first()).toBeVisible();
      await panel.getByRole("button", { name: t.trazas }).click();
      const filas = panel.locator("details:visible");
      const antes = await filas.count();
      await panel.getByRole("button", { name: t.mas }).click();
      await expect(panel.getByRole("button", { name: t.menos })).toBeVisible();
      expect(await filas.count()).toBeGreaterThan(antes);
      await filas.first().locator("summary").click();
      await expect(filas.first().getByRole("link").first()).toBeVisible();

      // Lienzo · lista.
      await page.getByRole("button", { name: t.lista }).click();
      await expect(page.getByRole("region", { name: t.region })).toBeHidden();
      await page
        .locator('button[aria-controls="detalle-guardia-salida"]')
        .click();
      await expect(detalle(page, "guardia-salida")).toBeVisible();
      expect(errores).toEqual([]);
    });
  });
}

test("en el teléfono el lienzo se desliza dentro de su marco y el índice lo lleva a cada capa", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "telefono", "solo en el teléfono");
  await page.goto("/es/agente");
  const region = page.getByRole("region", { name: T.es.region });
  const [scroll, client] = await region.evaluate((r) => [
    r.scrollWidth,
    r.clientWidth,
  ]);
  expect(scroll).toBeGreaterThan(client);
  expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: T.es.capa }).click();
  await expect
    .poll(() => region.evaluate((r) => r.scrollLeft))
    .toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: T.es.capa })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/agente?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.experto });
    await expect(titulo).toBeVisible();
    const estado = await titulo.evaluate((h) => {
      const caja = h.closest(".cambia-perfil") as HTMLElement;
      return {
        opacidad: Number(getComputedStyle(caja).opacity),
        animaciones: document.getAnimations().length,
      };
    });
    expect(estado).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesSerias(page);
  });
});

test("AU-S2-14: el foco con teclado se ve con su anillo, distinto de la selección, en los dos temas", async ({
  page,
}) => {
  for (const tema of ["oscuro", "claro"] as const) {
    await page.goto(`/es/agente?tema=${tema}&perfil=lider`);
    // Hasta el primer nodo del lienzo con Tab (el foco de teclado activa :focus-visible).
    let enNodo = false;
    for (let k = 0; k < 60 && !enNodo; k++) {
      await page.keyboard.press("Tab");
      enNodo = await page.evaluate(
        () => !!document.activeElement?.matches(".d-nodo[data-sel-id]"),
      );
    }
    expect(enNodo).toBe(true);
    const anillo = await page.evaluate(() => {
      const foco = document.activeElement!.querySelector(".foco")!;
      const s = getComputedStyle(foco);
      return { stroke: s.stroke, ancho: s.strokeWidth };
    });
    expect(anillo.stroke).not.toBe("none");
    expect(anillo.ancho).toBe("2px");
    // Un nodo sin foco no lo dibuja.
    const otro = await page.evaluate(() => {
      const n = [
        ...document.querySelectorAll(".d-nodo[data-sel-id] .foco"),
      ].find((x) => x.parentElement !== document.activeElement)!;
      return getComputedStyle(n).stroke;
    });
    expect(otro).toBe("none");
  }
});
