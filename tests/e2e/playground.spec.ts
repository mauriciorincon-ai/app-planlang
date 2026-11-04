import { expect, test, type Page } from "@playwright/test";
import { consolaLimpia, desbordeLateral, sinViolacionesAxe } from "./_comun";

/**
 * P5 Playground en el export servido (S2 fase 3): se llega por su pestaña y se lee en los dos idiomas, temas y
 * perfiles sin desplazar la página de lado, sin violaciones de axe (críticas, serias ni moderadas) y sin errores de hidratación; los
 * deslizadores se mueven con el teclado y recalculan en el navegador sobre la corrida de 200 del plan v1.5 (U1 a 0,85
 * manda A-089 y A-144 a una persona; U2 a 1600 introduce doce errores, el primero A-007, cuyo enlace abre la traza en el
 * paso donde el camino se separa); el modo Texas es un interruptor que manda a una persona las nueve aprobaciones en parte
 * y dice que es la revisión que exige; «Volver al plan» deshace; y con movimiento reducido lo del experto aparece visible.
 */

const T = {
  es: {
    pestana: "Playground",
    h1: "¿Y si el plan hubiera fijado otros umbrales?",
    mirada: "El playground en una mirada",
    ficha: "Ficha técnica del playground",
    juego: "Mueve los umbrales",
    curva: "La curva riesgo-cobertura",
    limites: "Lo que el playground no puede saber",
    u1: /Confianza mínima de extracción/,
    u2: /Alto costo/,
    texas: /Modo Texas/,
    enPlan: "En los valores del plan",
    movidoU1: "Movido: U1 0,85.",
    texasExige: "la exige el modo Texas",
    error: "error: debía ir a una persona",
    volver: "Volver al plan",
  },
  en: {
    pestana: "Playground",
    h1: "What if the plan had set other thresholds?",
    mirada: "The playground at a glance",
    ficha: "Playground technical record",
    juego: "Move the thresholds",
    curva: "The risk-coverage curve",
    limites: "What the playground cannot know",
    u1: /Minimum extraction confidence/,
    u2: /High cost/,
    texas: /Texas mode/,
    enPlan: "At the plan values",
    movidoU1: "Moved: U1 0.85.",
    texasExige: "required by Texas mode",
    error: "error: it had to go to a person",
    volver: "Back to the plan",
  },
} as const;

const estado = (page: Page) =>
  page.getByRole("status").filter({ hasText: /plan|Movido|Moved/ });
const cambios = (page: Page) => page.locator("#cambios [data-caso]");

for (const idioma of ["es", "en"] as const) {
  const t = T[idioma];

  test.describe(`P5 Playground (${idioma})`, () => {
    test("se llega por su pestaña", async ({ page }) => {
      await page.goto(`/${idioma}`);
      await page
        .getByRole("navigation")
        .first()
        .getByRole("link", { name: t.pestana, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`/${idioma}/playground$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.h1);
    });

    for (const tema of ["oscuro", "claro"])
      for (const perfil of ["lider", "experto"])
        test(`se lee en tema ${tema} como ${perfil}, sin errores de hidratación, desplazamiento ni violaciones`, async ({
          page,
        }) => {
          const errores = consolaLimpia(page);
          await page.goto(
            `/${idioma}/playground?tema=${tema}&perfil=${perfil}`,
          );
          for (const h of [t.mirada, t.juego, t.curva, t.limites])
            await expect(
              page.getByRole("heading", { name: h, exact: true }),
            ).toBeVisible();
          await expect(
            page.getByRole("heading", { name: t.ficha }),
          ).toBeVisible({ visible: perfil === "experto" });
          await expect(estado(page)).toContainText(t.enPlan);
          expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
          await sinViolacionesAxe(page);
          expect(errores).toEqual([]);
        });

    test("con el teclado: U1 a 0,85 manda A-089 y A-144 a una persona y «Volver al plan» lo deshace", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground`);
      const u1 = page.getByRole("slider", { name: t.u1 });
      // Deshabilitado no se lee igual que habilitado, y no solo por el color: el borde cambia (AU-S2-B23).
      const volver = page.getByRole("button", { name: t.volver });
      const borde = () =>
        volver.evaluate((b) => getComputedStyle(b).borderTopStyle);
      await expect(volver).toBeDisabled();
      expect(await borde()).toBe("dashed");
      await u1.focus();
      for (let k = 0; k < 2; k++) await page.keyboard.press("ArrowRight");
      await expect(volver).toBeEnabled();
      expect(await borde()).toBe("solid");
      await expect(u1).toHaveValue("0.85");
      await expect(cambios(page)).toHaveCount(2);
      await expect(cambios(page).first()).toHaveAttribute("data-caso", "A-089");
      await expect(estado(page)).toContainText(t.movidoU1);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
      await page.getByRole("button", { name: t.volver }).click();
      await expect(cambios(page)).toHaveCount(0);
      await expect(u1).toHaveValue("0.75");
      await expect(estado(page)).toContainText(t.enPlan);
    });

    test("U2 a 1600 introduce doce errores; el de A-007 enlaza a su traza", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground?tema=claro`);
      const u2 = page.getByRole("slider", { name: t.u2 });
      await u2.focus();
      for (let k = 0; k < 6; k++) await page.keyboard.press("ArrowRight");
      await expect(u2).toHaveValue("1600");
      await expect(cambios(page)).toHaveCount(12);
      const fila = page.locator('#cambios [data-caso="A-007"]');
      await expect(fila).toContainText(t.error);
      expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
      await sinViolacionesAxe(page);
      await fila.getByRole("link").click();
      // Abre el caso en el paso donde el camino se separa (AU-S2-P-5), y ese paso queda a la vista.
      await expect(page).toHaveURL(
        new RegExp(`/${idioma}/caso/A-007#paso-\\d+$`),
      );
      const paso = new URL(page.url()).hash;
      await expect(page.locator(`li${paso}`)).toBeInViewport();
    });

    test("el modo Texas es un interruptor: con la barra espaciadora se enciende y manda a una persona las nueve aprobaciones en parte", async ({
      page,
    }) => {
      await page.goto(`/${idioma}/playground`);
      const texas = page.getByRole("switch", { name: t.texas });
      await expect(texas).toHaveAttribute("aria-checked", "false");
      await texas.focus();
      await page.keyboard.press("Space");
      await expect(texas).toHaveAttribute("aria-checked", "true");
      await expect(cambios(page)).toHaveCount(9);
      await expect(cambios(page).first()).toHaveAttribute("data-caso", "A-006");
      await expect(cambios(page).first()).toContainText(t.texasExige);
      await page.keyboard.press("Enter");
      await expect(texas).toHaveAttribute("aria-checked", "false");
    });
  });
}

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });
  test("en el playground, lo del experto aparece visible, sin animación, y axe sigue limpio", async ({
    page,
  }) => {
    await page.goto("/es/playground?perfil=lider");
    await page
      .getByRole("group", { name: "Leer como" })
      .getByRole("button", { name: "Experto" })
      .click();
    const titulo = page.getByRole("heading", { name: T.es.ficha });
    await expect(titulo).toBeVisible();
    const est = await titulo.evaluate((h) => ({
      opacidad: Number(
        getComputedStyle(h.closest(".solo-experto") as HTMLElement).opacity,
      ),
      animaciones: document.getAnimations().length,
    }));
    expect(est).toEqual({ opacidad: 1, animaciones: 0 });
    await sinViolacionesAxe(page);
  });
});

/**
 * La zona respaldada por los datos (S8, ADR-018; e2e en español, el inglés al cierre del hito): con el error del informe
 * (10 %), la zona va de 0,50 a 0,90 y el U1 de la corrida cae dentro; elegir otro error la cambia, con el teclado y el
 * ratón; el deslizador dice si su valor cae debajo, adentro o encima; lo que los datos no alcanzan se lee sin abrir
 * nada; y el color nunca va solo (trama, glifo y texto). Todo viene precalculado del informe: nada se calcula al pintar.
 */
const Z = {
  panel: "#zona-respaldada",
  opcion: (pct: string) => new RegExp(`^${pct}\\s%\\s\\(α`),
  filasEnZona: '[role="row"][data-zona="true"]',
};
const textoPlano = (t: string | null) => (t ?? "").replaceAll("\u00a0", " ");

test.describe("la zona respaldada (es)", () => {
  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`con el error del informe, de 0,50 a 0,90 y el U1 de la corrida adentro: tema ${tema}, ${perfil}, sin desplazamiento ni violaciones`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/es/playground?tema=${tema}&perfil=${perfil}`);
        const panel = page.locator(Z.panel);
        await expect(
          panel.getByRole("heading", {
            name: "Dónde el umbral tiene el respaldo de los datos",
          }),
        ).toBeVisible();
        await expect(
          panel.getByRole("radio", { name: Z.opcion("10") }),
        ).toBeChecked();
        expect(textoPlano(await panel.textContent())).toContain(
          "Zona respaldada con 10 % de error: confianza mínima de 0,50 a 0,90.",
        );
        expect(textoPlano(await panel.textContent())).toContain(
          "Seguridad exigida: 90 % (δ 0,10)",
        );
        // Lo que los datos no alcanzan, a la vista del líder, sin abrir nada.
        await expect(
          panel.getByText(/no se respalda con la secuencia/),
        ).toBeVisible();
        await expect(
          panel.getByText(/La etapa redactor no tiene verdad/),
        ).toBeVisible();
        await expect(page.locator(Z.filasEnZona)).toHaveCount(9);
        await expect(
          page.locator('#w-U1 [data-zona-estado="dentro"]'),
        ).toHaveText("U1 0,75: dentro de la zona respaldada.");
        // El método y las pruebas son del experto: el bloque existe en los dos perfiles y se ve solo en el suyo.
        await expect(
          panel.getByText(/Learn then Test, secuencia fija/),
        ).toBeVisible({
          visible: perfil === "experto",
        });
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("elegir 5 % estrecha la zona a 0,75–0,85; con el teclado se pasa de una opción a otra y el deslizador dice dónde cae su valor", async ({
    page,
  }) => {
    await page.goto("/es/playground?tema=claro");
    const panel = page.locator(Z.panel);
    await panel.getByRole("radio", { name: Z.opcion("10") }).focus();
    // Las flechas mueven el grupo de opciones (comportamiento del radio nativo): ← va a 5 %, → vuelve a 10 %, → a 20 %.
    await page.keyboard.press("ArrowLeft");
    await expect(
      panel.getByRole("radio", { name: Z.opcion("5") }),
    ).toBeChecked();
    expect(textoPlano(await panel.textContent())).toContain(
      "confianza mínima de 0,75 a 0,85",
    );
    await expect(page.locator(Z.filasEnZona)).toHaveCount(3);
    // A 5 % la cobertura conjunta pide más de veinte veces los casos de hoy: se dice con su número.
    expect(textoPlano(await panel.textContent())).toContain(
      "más de 2.680 casos",
    );
    const u1 = page.getByRole("slider", { name: T.es.u1 });
    await u1.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(u1).toHaveValue("0.65");
    await expect(
      page.locator('#w-U1 [data-zona-estado="fuera"]'),
    ).toContainText("por debajo de la zona");
    await page.keyboard.press("End");
    await expect(
      page.locator('#w-U1 [data-zona-estado="fuera"]'),
    ).toContainText("por encima de la zona");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.locator('#w-U1 [data-zona-estado="dentro"]'),
    ).toContainText("dentro de la zona respaldada");
    // «Volver al plan» devuelve los umbrales, no el error elegido: es otra pregunta.
    await panel.getByRole("radio", { name: Z.opcion("20") }).check();
    expect(textoPlano(await panel.textContent())).toContain(
      "confianza mínima de 0,50 a 0,95",
    );
    await expect(page.locator(Z.filasEnZona)).toHaveCount(10);
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
  });

  test("el color nunca va solo: la zona tiene trama en la curva y en el deslizador, un glifo y un texto en cada fila, y su leyenda", async ({
    page,
  }) => {
    await page.goto("/es/playground?tema=oscuro&perfil=experto");
    const svg = page.locator("#curva-pg");
    await expect(
      svg.locator('[data-zona="respaldada"] rect[fill^="url(#"]'),
    ).toHaveCount(1);
    await expect(svg.locator("desc")).toHaveText(
      "zona respaldada de 0,50 a 0,90",
    );
    await expect(page.locator('#w-U1 [data-zona="deslizador"]')).toHaveCount(1);
    const fila = page.locator('[role="row"][data-u="0.75"]');
    await expect(fila.locator("svg")).toHaveCount(1);
    await expect(fila).toContainText("respaldado por los datos");
    await expect(
      page.getByText("Zona respaldada", { exact: true }).first(),
    ).toBeVisible();
    // Las dos marcas (la trama diagonal y el borde discontinuo) son lo que el ojo ve aunque no distinga el verde.
    const trama = await page
      .locator('[role="row"][data-u="0.75"]')
      .evaluate((f) => getComputedStyle(f).backgroundImage);
    expect(trama).toContain("repeating-linear-gradient");
  });

  test("el demo B no mide la confianza: su playground no trae zona", async ({
    page,
  }) => {
    await page.goto("/es/demo-b/playground");
    await expect(page.locator(Z.panel)).toHaveCount(0);
    await expect(page.locator("#curva-pg")).toHaveCount(0);
  });

  test.describe("movimiento reducido", () => {
    test.use({ reducedMotion: "reduce" });
    test("la zona y el selector son los mismos, sin animación, y axe sigue limpio", async ({
      page,
    }) => {
      await page.goto("/es/playground?perfil=experto");
      const panel = page.locator(Z.panel);
      await panel.getByRole("radio", { name: Z.opcion("5") }).check();
      await expect(page.locator(Z.filasEnZona)).toHaveCount(3);
      const animaciones = await page.evaluate(
        () => document.getAnimations().length,
      );
      expect(animaciones).toBe(0);
      await sinViolacionesAxe(page);
    });
  });
});

test.describe("la capacidad del auditor (es)", () => {
  const seccion = (page: Page) =>
    page.locator('section[aria-labelledby="s-plazos-t"]');
  const frase = (page: Page) => page.locator("#k-plazos-frase");

  for (const tema of ["oscuro", "claro"])
    for (const perfil of ["lider", "experto"])
      test(`con el plan: 30 casos por día hábil y toda solicitud en plazo, con su tabla y dónde se rompe: tema ${tema}, ${perfil}, sin desplazamiento ni violaciones`, async ({
        page,
      }) => {
        const errores = consolaLimpia(page);
        await page.goto(`/es/playground?tema=${tema}&perfil=${perfil}`);
        const s = seccion(page);
        await expect(
          s.getByRole("heading", { name: "La capacidad del auditor" }),
        ).toBeVisible();
        const control = page.getByRole("slider", {
          name: "Capacidad del auditor",
        });
        await expect(control).toHaveValue("30");
        await expect(frase(page)).toHaveText(
          "Con 30 casos por día hábil, toda solicitud se decide dentro de su plazo.",
        );
        const tabla = textoPlano(await s.textContent());
        // Las dos clases del plan, con su plazo y cuántas esperaron (la tabla de escritorio y las tarjetas del teléfono).
        expect(tabla).toContain("Hospitalaria");
        expect(tabla).toContain("72 horas");
        expect(tabla).toContain("30 / 54");
        expect(tabla).toContain("7 días calendario");
        expect(tabla).toContain("40 / 123");
        // Dónde se rompe, aunque el control no deje llegar: se dice con su número.
        expect(tabla).toContain(
          "Con estos umbrales el plazo se cumple desde 8 casos por día hábil; con una menos salen 14. Queda por debajo de lo que este control deja mover (10–60).",
        );
        // El color nunca va solo: cada clase lleva su símbolo y su palabra.
        await expect(
          s.locator('table [data-v="cumple"] svg').first(),
        ).toBeVisible({
          visible: await s.locator("table").first().isVisible(),
        });
        expect(tabla).toContain("cumple");
        expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
        await sinViolacionesAxe(page);
        expect(errores).toEqual([]);
      });

  test("con el teclado: la capacidad a 10 sigue en plazo y dice «movido desde 30»; subir U1 a 0,95 manda más solicitudes al auditor", async ({
    page,
  }) => {
    await page.goto("/es/playground?tema=claro");
    const control = page.getByRole("slider", { name: "Capacidad del auditor" });
    await control.focus();
    await page.keyboard.press("Home");
    await expect(control).toHaveValue("10");
    await expect(frase(page)).toHaveText(
      "Con 10 casos por día hábil, toda solicitud se decide dentro de su plazo.",
    );
    await expect(seccion(page)).toContainText("movido desde 30");
    // Con la capacidad del plan, U1 en 0,95 manda 4 hospitalarias más al auditor (34 de 54, no 30).
    const u1 = page.getByRole("slider", { name: T.es.u1 });
    await u1.focus();
    await page.keyboard.press("End");
    await expect(u1).toHaveValue("0.95");
    expect(textoPlano(await seccion(page).textContent())).toContain("34 / 54");
    // Con estos umbrales el plazo se rompe un poco más arriba: 9 casos por día hábil.
    expect(textoPlano(await seccion(page).textContent())).toContain(
      "se cumple desde 9 casos por día hábil; con una menos salen 24.",
    );
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
  });

  test("en el teléfono cada clase es una tarjeta y nada desplaza la página de lado", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 380, height: 800 });
    await page.goto("/es/playground?tema=claro");
    const tarjetas = seccion(page).locator('[data-vista="tarjetas"] dl');
    await expect(tarjetas).toHaveCount(2);
    await expect(tarjetas.first()).toContainText("0 · cumple");
    expect(await desbordeLateral(page)).toBeLessThanOrEqual(0);
    await sinViolacionesAxe(page);
  });

  test("el demo B no tiene capacidad del auditor: su plan no declara plazos", async ({
    page,
  }) => {
    await page.goto("/es/demo-b/playground");
    await expect(seccion(page)).toHaveCount(0);
    await expect(page.locator("#w-capacidad")).toHaveCount(0);
  });
});
