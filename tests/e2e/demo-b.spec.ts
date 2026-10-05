import { expect, test } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * Las pantallas del demo B en el export servido (S3, ADR-014). Cada una se lee en los dos idiomas y los dos temas como
 * experto (lo más denso) sin desplazar la página de lado, sin violaciones de axe (críticas, serias ni moderadas) y con
 * la consola limpia (sin #418 de hidratación). Las pestañas se quedan en el B y el conmutador lleva a la misma
 * pantalla del A; un caso del B muestra su expediente con cada conclusión citada y la instrucción escondida marcada
 * como dato, sin seguirla; y con movimiento reducido lo del experto aparece visible.
 */

const PANTALLAS: Record<string, { es: string; en: string }> = {
  plan: {
    es: "El plan, escrito como contrato",
    en: "The plan, written as a contract",
  },
  agente: {
    es: "El agente de vinculación, tal como corrió",
    en: "The onboarding agent, as it ran",
  },
  brecha: {
    es: "La brecha entre el plan y lo que hizo el agente",
    en: "The gap between the plan and what the agent did",
  },
  playground: {
    es: "¿Y si el plan hubiera fijado otros umbrales?",
    en: "What if the plan had set other thresholds?",
  },
  caso: { es: "Un caso, de punta a punta", en: "One case, end to end" },
  "caso/B-019": { es: "Un caso, de punta a punta", en: "One case, end to end" },
  fichas: {
    es: "Las fichas: repetirla, y contarla en dos minutos",
    en: "The records: repeat it, and tell it in two minutes",
  },
};

for (const idioma of ["es", "en"] as const)
  for (const [pantalla, h1] of Object.entries(PANTALLAS))
    test(`demo B · ${pantalla} (${idioma}): se lee en los dos temas como experto, sin desplazamiento ni violaciones`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const errores = consolaLimpia(page);
      for (const tema of ["oscuro", "claro"]) {
        await page.goto(
          `/${idioma}/demo-b/${pantalla}?tema=${tema}&perfil=experto`,
        );
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          h1[idioma],
        );
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
      }
      expect(errores).toEqual([]);
    });

test("las pestañas del B se quedan en el B y el conmutador lleva a la misma pantalla del A", async ({
  page,
}) => {
  await page.goto("/es/demo-b/brecha");
  const hrefs = await page
    .getByRole("navigation", { name: "Secciones", exact: true })
    .getByRole("link")
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual([
    "/es",
    "/es/demo-b/plan",
    "/es/demo-b/agente",
    "/es/demo-b/brecha",
    "/es/demo-b/playground",
    "/es/demo-b/caso",
    "/es/demo-b/fichas",
  ]);
  const conmutador = page.getByRole("group", { name: "Demo" });
  await expect(
    conmutador.getByRole("link", { name: /^Demo B/ }),
  ).toHaveAttribute("aria-current", "true");
  await conmutador.getByRole("link", { name: /^Demo A/ }).click();
  await expect(page).toHaveURL(/\/es\/brecha$/);
  // En las pantallas del A no hay conmutador: su barra es la del S2.
  await expect(page.getByRole("group", { name: "Demo" })).toHaveCount(0);
});

test("a 1280 px las siete pestañas caben sin deslizarse, en el A y en el B", async ({
  page,
}, info) => {
  // En el teléfono las pestañas se deslizan a propósito (su propia fila, design-system § 5).
  test.skip(info.project.name !== "escritorio", "solo en escritorio");
  for (const ruta of [
    "/es/brecha",
    "/en/brecha",
    "/es/demo-b/brecha",
    "/en/demo-b/brecha",
  ]) {
    await page.goto(ruta);
    const falta = await page
      .getByRole("navigation", { name: /^(Secciones|Sections)$/ })
      .evaluate((nav) => nav.scrollWidth - nav.clientWidth);
    expect(falta, ruta).toBeLessThanOrEqual(0);
  }
});

test("un caso del B: el expediente con cada conclusión citada y la instrucción escondida marcada como dato", async ({
  page,
}) => {
  await page.goto("/es/demo-b/caso/B-019");
  const expediente = page.locator('section[aria-labelledby="c-exp"]');
  await expect(expediente).toBeVisible();
  const conclusiones = expediente.locator("ol > li");
  const n = await conclusiones.count();
  expect(n).toBeGreaterThan(0);
  // Cada conclusión lleva su cita; una sin cita llevaría la marca de alerta.
  await expect(expediente.locator("ol > li small")).toHaveCount(n);
  await expect(expediente.locator("ol > li small svg")).toHaveCount(0);
  // La instrucción plantada en el documento se pinta marcada, como dato del caso.
  await expect(page.locator("mark").first()).toBeVisible();
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en la brecha del B, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/demo-b/brecha?perfil=lider");
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
