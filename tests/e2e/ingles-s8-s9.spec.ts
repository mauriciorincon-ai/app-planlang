import { expect, test, type Page } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * El inglés de lo que el S8 y el S9 probaron solo en español (cierre del H-2, S10): la zona respaldada del playground,
 * la garantía de S1 en la Brecha, la capacidad del auditor, los plazos del A y los dueños del B. Mismas afirmaciones que
 * sus gemelas en español (`playground.spec.ts`, `brecha.spec.ts`), con los textos en inglés redactados en `src/textos/`
 * (no traducidos del español): las cifras son las mismas y el formato del número es el del idioma (0.75, 2,680).
 */
const plano = (t: string | null) => (t ?? "").replaceAll(" ", " ");

const Z = {
  panel: "#zona-respaldada",
  opcion: (pct: string) => new RegExp(`^${pct}%\\s\\(α`),
  filasEnZona: '[role="row"][data-zona="true"]',
};

test.describe("the backed zone (en)", () => {
  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`at the report's error, from 0.50 to 0.90 with the run's U1 inside: theme ${tema}, ${perfil}, no sideways scroll, no violations`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/en/playground?tema=${tema}&perfil=${perfil}`);
        const panel = page.locator(Z.panel);
        await expect(
          panel.getByRole("heading", {
            name: "Where the threshold has the data's backing",
          }),
        ).toBeVisible();
        await expect(
          panel.getByRole("radio", { name: Z.opcion("10") }),
        ).toBeChecked();
        expect(plano(await panel.textContent())).toContain(
          "Backed zone at 10% error: minimum confidence from 0.50 to 0.90.",
        );
        expect(plano(await panel.textContent())).toContain(
          "Required confidence: 90% (δ 0.10)",
        );
        await expect(
          panel.getByText(/is not backed by the sequence/),
        ).toBeVisible();
        await expect(
          panel.getByText(/The writer stage has no ground truth/),
        ).toBeVisible();
        await expect(page.locator(Z.filasEnZona)).toHaveCount(9);
        await expect(
          page.locator('#w-U1 [data-zona-estado="dentro"]'),
        ).toHaveText("U1 0.75: inside the backed zone.");
        await expect(
          panel.getByText(/Learn then Test, fixed sequence/),
        ).toBeVisible({ visible: perfil === "experto" });
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("choosing 5% narrows the zone to 0.75–0.85; the arrow keys move between options and the slider says where its value falls", async ({
    page,
  }) => {
    await page.goto("/en/playground?tema=claro");
    const panel = page.locator(Z.panel);
    await panel.getByRole("radio", { name: Z.opcion("10") }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(
      panel.getByRole("radio", { name: Z.opcion("5") }),
    ).toBeChecked();
    expect(plano(await panel.textContent())).toContain(
      "minimum confidence from 0.75 to 0.85",
    );
    await expect(page.locator(Z.filasEnZona)).toHaveCount(3);
    const u1 = page.getByRole("slider", {
      name: /Minimum extraction confidence/,
    });
    await u1.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(u1).toHaveValue("0.65");
    await expect(
      page.locator('#w-U1 [data-zona-estado="fuera"]'),
    ).toContainText("below the zone");
    await page.keyboard.press("End");
    await expect(
      page.locator('#w-U1 [data-zona-estado="fuera"]'),
    ).toContainText("above the zone");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.locator('#w-U1 [data-zona-estado="dentro"]'),
    ).toContainText("inside the backed zone");
    await panel.getByRole("radio", { name: Z.opcion("20") }).check();
    expect(plano(await panel.textContent())).toContain(
      "minimum confidence from 0.50 to 0.95",
    );
    await expect(page.locator(Z.filasEnZona)).toHaveCount(10);
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
  });

  test("colour never goes alone: the zone has a pattern on the curve and the slider, a glyph and text in each row", async ({
    page,
  }) => {
    await page.goto("/en/playground?tema=oscuro&perfil=experto");
    const svg = page.locator("#curva-pg");
    await expect(
      svg.locator('[data-zona="respaldada"] rect[fill^="url(#"]'),
    ).toHaveCount(1);
    await expect(svg.locator("desc")).toHaveText(
      "backed zone from 0.50 to 0.90",
    );
    await expect(page.locator('#w-U1 [data-zona="deslizador"]')).toHaveCount(1);
    const fila = page.locator('[role="row"][data-u="0.75"]');
    await expect(fila.locator("svg")).toHaveCount(1);
    await expect(fila).toContainText("backed by the data");
  });

  test("demo B does not measure confidence: its playground has no zone", async ({
    page,
  }) => {
    await page.goto("/en/demo-b/playground");
    await expect(page.locator(Z.panel)).toHaveCount(0);
    await expect(page.locator("#curva-pg")).toHaveCount(0);
  });
});

test.describe("S1 with its guarantee (en)", () => {
  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`S1 says what the data backs and what it does not reach: theme ${tema}, ${perfil}, no sideways scroll, no violations`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/en/brecha?tema=${tema}&perfil=${perfil}`);
        const s1 = page.locator("#s-S1");
        await s1.scrollIntoViewIfNeeded();
        const g = s1.locator('[data-garantia="s1"]');
        const texto = async () => plano(await g.textContent());
        expect(await texto()).toContain(
          "Backed zone at 10% error: minimum confidence from 0.50 to 0.90.",
        );
        expect(await texto()).toContain("The run's U1 (0.75) falls inside.");
        await expect(
          g.getByText(/is not backed by the sequence/),
        ).toBeVisible();
        await expect(
          g.getByText(/The writer stage has no ground truth/),
        ).toBeVisible();
        await expect(
          s1.locator('#curva-S1 [data-zona="respaldada"]'),
        ).toHaveCount(1);
        await expect(g.locator("[data-alfa]")).toHaveCount(3);
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("the report and the playground say the same of the zone: 0.50 to 0.90 at 10%", async ({
    page,
  }) => {
    await page.goto("/en/brecha");
    const enBrecha = plano(
      await page.locator('#s-S1 [data-garantia="s1"]').textContent(),
    );
    await page.goto("/en/playground");
    const enPlayground = plano(
      await page.locator("#zona-respaldada").textContent(),
    );
    const lider =
      "Accepting up to 10% error in what the agent decides alone, with 90% confidence, the 159 measured cases back a minimum confidence from 0.50 to 0.90.";
    expect(enBrecha).toContain(lider);
    expect(enPlayground).toContain(lider);
  });
});

test.describe("the auditor's capacity (en)", () => {
  const seccion = (page: Page) =>
    page.locator('section[aria-labelledby="s-plazos-t"]');
  const frase = (page: Page) => page.locator("#k-plazos-frase");

  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`at the plan: 30 cases per business day and every request on time, with its table and where it breaks: theme ${tema}, ${perfil}, no sideways scroll, no violations`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/en/playground?tema=${tema}&perfil=${perfil}`);
        const s = seccion(page);
        await expect(
          s.getByRole("heading", { name: "The auditor’s capacity" }),
        ).toBeVisible();
        const control = page.getByRole("slider", { name: "Auditor capacity" });
        await expect(control).toHaveValue("30");
        await expect(frase(page)).toHaveText(
          "At 30 cases per business day, every request is decided within its deadline.",
        );
        const tabla = plano(await s.textContent());
        expect(tabla).toContain("Inpatient");
        expect(tabla).toContain("72 hours");
        expect(tabla).toContain("30 / 54");
        expect(tabla).toContain("7 calendar days");
        expect(tabla).toContain("40 / 123");
        expect(tabla).toContain(
          "With these thresholds the deadline is met from 8 cases per business day; with one fewer, 14 go past it. It fits within what this control lets you move (5–60): lower the capacity to see it.",
        );
        await expect(
          s.locator('table [data-v="cumple"] svg').first(),
        ).toBeVisible({
          visible: await s.locator("table").first().isVisible(),
        });
        expect(tabla).toContain("met");
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("with the keyboard: capacity at 5 breaks the deadline, at 10 it holds and says “moved from 30”; U1 at 0.95 sends more requests to the auditor", async ({
    page,
  }) => {
    await page.goto("/en/playground?tema=claro");
    const control = page.getByRole("slider", { name: "Auditor capacity" });
    await control.focus();
    await page.keyboard.press("Home");
    await expect(control).toHaveValue("5");
    await expect(frase(page)).toHaveText(
      /^At 5 cases per business day, \d+ requests go past their deadline\.$/,
    );
    await page.keyboard.press("ArrowRight");
    await expect(control).toHaveValue("10");
    await expect(frase(page)).toHaveText(
      "At 10 cases per business day, every request is decided within its deadline.",
    );
    await expect(seccion(page)).toContainText("moved from 30");
    const u1 = page.getByRole("slider", {
      name: /Minimum extraction confidence/,
    });
    await u1.focus();
    await page.keyboard.press("End");
    await expect(u1).toHaveValue("0.95");
    expect(plano(await seccion(page).textContent())).toContain("34 / 54");
    expect(plano(await seccion(page).textContent())).toContain(
      "is met from 9 cases per business day; with one fewer, 24 go past it.",
    );
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
  });

  test("demo B has no auditor capacity: its plan declares no deadlines", async ({
    page,
  }) => {
    await page.goto("/en/demo-b/playground");
    await expect(seccion(page)).toHaveCount(0);
    await expect(page.locator("#w-capacidad")).toHaveCount(0);
  });
});

test.describe("A's deadlines and B's owners (en)", () => {
  for (const perfil of ["lider", "experto"])
    test(`the deadlines block says the margin, where it breaks and that arrivals are simulated: ${perfil}, no sideways scroll, no violations`, async ({
      page,
    }) => {
      const errores = consolaLimpia(page);
      await page.goto(`/en/brecha?tema=claro&perfil=${perfil}`);
      const bloque = page.locator('[data-bloque="plazos"]');
      await expect(
        bloque.getByRole("heading", { name: "Deadlines: the simulated clock" }),
      ).toBeVisible();
      await expect(bloque).toContainText(
        "Every request with a deadline was decided in time. The one that waited longest was inpatient",
      );
      await expect(bloque).toContainText(
        "the deadline is met from 8 cases per business day and with one fewer, 14 go past it",
      );
      await expect(bloque).toContainText(
        "The arrival times are simulated, with the batch’s seed",
      );
      await expect(page.locator('[data-criterio="C11"]')).toContainText(
        "meets",
        {
          ignoreCase: true,
        },
      );
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
      expect(errores).toEqual([]);
    });

  test("B's Brecha says the companies' owners and what the batch did not test", async ({
    page,
  }) => {
    const errores = consolaLimpia(page);
    await page.goto("/en/demo-b/brecha?tema=oscuro");
    const bloque = page.locator('[data-bloque="duenos"]');
    await expect(bloque).toContainText(
      "Of 8 companies, the set of beneficial owners matched the known truth in all 8.",
    );
    await expect(bloque).toContainText("carries no hidden instructions");
    await expect(page.locator('[data-bloque="plazos"]')).toHaveCount(0);
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
    expect(errores).toEqual([]);
  });
});

/**
 * La Brecha entre 1001 y 1100 px (el corte `amplio` parte el resumen en dos columnas y la tabla de criterios queda a
 * ~415 px): su chip de estado «Sin casos que lo prueben» / «No case tests it» no cabía y desplazaba la página de lado
 * (lo encontró el script de capturas de CV Viva a 1024 px; solo se ve aquí, porque el escritorio de este suite mide 1280).
 */
test.describe("the Brecha between 1001 and 1100 px", () => {
  for (const ancho of [1001, 1024, 1100])
    for (const ruta of ["/es/demo-b/brecha", "/en/demo-b/brecha", "/en/brecha"])
      test(`${ruta} at ${ancho} px does not scroll sideways`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: ancho, height: 800 });
        await page.goto(`${ruta}?tema=claro&perfil=experto`);
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      });
});
