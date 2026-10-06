import { readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * El paquete para hoja-de-vida (ADR-009) en marcha: desde la raíz se rastrean TODOS los enlaces de la vitrina. Cada
 * página carga sin errores en la consola, cada solicitud es del mismo origen y responde 2xx (ningún recurso sin la
 * base, ningún enlace sin `.html`, ninguna carga RSC que falte), y la raíz lleva al idioma dentro del paquete.
 */

const BASE = "/piezas/planlang";

/** Las páginas de caso del A que lleva el paquete (S3: los 20 primeros de la corrida de 200 y los que nombra el informe). */
const PAGINAS_A = readdirSync(
  "dist/paquete-hoja-de-vida/public/piezas/planlang/es/caso",
).filter((f) => /^A-\d+\.html$/.test(f)).length;

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
  // Por idioma: la Entrada y, por demo, sus 6 pestañas (el índice de casos incluido) y sus casos con página (ADR-014):
  // en el A, los de la corrida de 200 que llevan página (los enlaza el selector, todos alcanzables); en el B, sus 20.
  // La raíz entra con ?elegir.
  const paginas = [...vistas].filter((v) => !v.includes("?"));
  expect(PAGINAS_A).toBeGreaterThan(20);
  expect(paginas.length).toBeGreaterThanOrEqual(
    2 * (1 + (6 + PAGINAS_A) + (6 + 20)),
  );
  expect(paginas.filter((v) => /\/caso\/A-\d+\.html$/.test(v)).length).toBe(
    2 * PAGINAS_A,
  );
  expect(paginas.filter((v) => v.includes("/demo-b/")).length).toBe(
    2 * (6 + 20),
  );
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
  // Corrida de 200 (S3): U1 en 0,85 manda A-089 y A-144 a una persona.
  for (let k = 0; k < 2; k++) await page.keyboard.press("ArrowRight");
  await expect(page.locator("#cambios [data-caso]")).toHaveCount(2);

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/en/playground\\.html$`));

  await page.goto(`${BASE}/es/agente.html`);
  const extractor = page.locator('[data-sel-id="extractor"]');
  await extractor.focus();
  await page.keyboard.press("Enter");
  await expect(extractor).toHaveAttribute("data-sel", "true");

  expect(fallas).toEqual([]);
});
