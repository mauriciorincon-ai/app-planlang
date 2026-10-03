import { expect, test, type Page } from "@playwright/test";

/**
 * El paquete para hoja-de-vida (ADR-009) en marcha: desde la raíz se rastrean TODOS los enlaces de la vitrina. Cada
 * página carga sin errores en la consola, cada solicitud es del mismo origen y responde 2xx (ningún recurso sin la
 * base, ningún enlace sin `.html`, ninguna carga RSC que falte), y la raíz lleva al idioma dentro del paquete.
 */

const BASE = "/piezas/planlang";

function vigilar(page: Page) {
  const fallas: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") fallas.push(`consola: ${m.text()}`);
  });
  page.on("pageerror", (e) => fallas.push(`error: ${e.message}`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.protocol === "data:") return;
    if (u.host !== "localhost:3100") fallas.push(`sale del origen: ${r.url()}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400) fallas.push(`${r.status()}: ${r.url()}`);
  });
  return fallas;
}

test("desde la raíz, todos los enlaces de la vitrina cargan dentro del paquete y del origen", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const fallas = vigilar(page);
  const pendientes = [`${BASE}/index.html?elegir`];
  const vistas = new Set<string>();
  while (pendientes.length) {
    const ruta = pendientes.shift()!;
    const clave = ruta.split("#")[0]!;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    const r = await page.goto(clave, { waitUntil: "load" });
    expect(r?.status(), clave).toBe(200);
    const enlaces = await page.$$eval("a[href]", (as) =>
      as.map((a) => a.getAttribute("href")!),
    );
    for (const h of enlaces) {
      if (h.startsWith("#")) continue;
      expect(h, `${clave} → ${h}`).toMatch(
        new RegExp(`^${BASE}/[^?#]*\\.(html|txt|svg)([?#].*)?$`),
      );
      if (h.endsWith(".html") || /\.html[?#]/.test(h))
        pendientes.push(h.split("#")[0]!);
    }
  }
  // Por idioma: la Entrada, las 6 pestañas (el índice de casos incluido) y los 20 casos. La raíz entra con ?elegir.
  const paginas = [...vistas].filter((v) => !v.includes("?"));
  expect(paginas.length).toBeGreaterThanOrEqual(2 * (1 + 6 + 20));
  expect(fallas).toEqual([]);
});

test.describe("la raíz elige el idioma dentro del paquete", () => {
  test.use({ locale: "en-US" });
  test("con el navegador en inglés, lleva a en.html bajo la base", async ({
    page,
  }) => {
    const fallas = vigilar(page);
    await page.goto(`${BASE}/index.html`);
    await expect(page).toHaveURL(new RegExp(`${BASE}/en\\.html$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(fallas).toEqual([]);
  });
});

/**
 * Una pasada de INTERACCIÓN dentro del paquete (AU-S2-B32, regla 22 b): el rastreo solo carga páginas. Aquí cada
 * control de la isla y del marco hace algo — tema, perfil, idioma, un umbral del playground, un nodo del lienzo — y
 * ninguna acción pide nada fuera del origen ni falla.
 */
test("los controles funcionan dentro del paquete sin salir del origen", async ({
  page,
}) => {
  const fallas = vigilar(page);
  await page.goto(`${BASE}/es/playground.html`);
  const html = page.locator("html");

  await page.getByRole("button", { name: "Claro" }).click();
  await expect(html).toHaveAttribute("data-theme", "claro");
  await page.getByRole("button", { name: "Experto" }).first().click();
  await expect(html).toHaveAttribute("data-perfil", "experto");

  const u1 = page.getByRole("slider", { name: /Confianza mínima/ });
  await u1.focus();
  for (let k = 0; k < 3; k++) await page.keyboard.press("ArrowRight");
  await expect(page.locator("#cambios [data-caso]")).toHaveCount(1);

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/en/playground\\.html$`));

  await page.goto(`${BASE}/es/agente.html`);
  const extractor = page.locator('[data-sel-id="extractor"]');
  await extractor.focus();
  await page.keyboard.press("Enter");
  await expect(extractor).toHaveAttribute("data-sel", "true");

  expect(fallas).toEqual([]);
});
