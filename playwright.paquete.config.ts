import { defineConfig, devices } from "@playwright/test";

/**
 * El paquete de la vitrina para hoja-de-vida (ADR-009), servido como lo serviría hoja-de-vida desde su `public/`:
 * bajo `/piezas/planlang`, SIN URL limpias (un enlace sin `.html` da 404, que es lo que allá haría su proxy de idioma)
 * y sin listar carpetas. Corre sobre `dist/paquete-hoja-de-vida/` ya armado: `pnpm paquete:vitrina` antes.
 */
export default defineConfig({
  testDir: "tests/e2e-paquete",
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "paquete",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command:
      "node_modules/.bin/serve -c tests/e2e-paquete/serve.json -l 3100 --no-request-logging",
    url: "http://localhost:3100/piezas/planlang/index.html",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
