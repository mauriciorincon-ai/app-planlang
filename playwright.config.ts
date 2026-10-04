import { defineConfig, devices } from "@playwright/test";

// El puerto se puede mover (`PLANLANG_E2E_PUERTO`) cuando otra app de la máquina ocupa el 3000: sin reuso del
// servidor, el suite no arranca sobre uno ajeno, pero tampoco tiene por qué esperar a que se libere.
const PUERTO = process.env.PLANLANG_E2E_PUERTO ?? "3000";

// Config que el ci.yml del kit ya asume (job e2e: "pnpm test:e2e").
// Patrón validado en app-nutri-kids S1. Móvil primero: las apps del pipeline son mobile-first.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // En CI, los dos reporters: "github" anota los fallos en el PR (y SÍ imprime `N flaky`,
  // verificado); "list" añade lo que github NO da — el avance prueba por prueba, con su
  // duración. Sin él, el log salta de "Running N tests" al resumen y no se ve cuál se quedó
  // colgada: es lo que vuelve legible un timeout (kit v1.15.1, demo en rojo de Velo S3, que
  // de paso desmintió la razón original del cambio — ver CHANGELOG).
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "on-first-retry",
  },
  // S2: el teléfono se mide a 380 px (design-system § 2.4 y la orden); el Pixel 7 de Playwright mide 412, así
  // que se conserva el dispositivo (táctil, escala) y se fuerza el ancho.
  // La paridad del playground entre motores (regla dura 1, AU-S2-11) corre en Chromium (`escritorio`), Firefox y
  // WebKit; el resto del suite, solo en Chromium.
  projects: [
    {
      name: "telefono",
      testIgnore: /paridad\.spec\.ts/,
      use: { ...devices["Pixel 7"], viewport: { width: 380, height: 800 } },
    },
    {
      name: "escritorio",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "paridad-firefox",
      testMatch: /paridad\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "paridad-webkit",
      testMatch: /paridad\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    // SIEMPRE contra el BUILD, nunca contra el dev server (kit v1.12.0 — lección Velo S1).
    // El dev server mete en la página cosas que NO existen en producción: websocket de HMR y
    // `eval()` de React dev. En una app con CSP estricta o gate de red eso produce rojos sobre
    // un árbol limpio — 5 en Velo S1 — y un suite que grita cuando no pasa nada acaba ignorado.
    // Cuesta el tiempo del build; compra que el e2e local afirme lo mismo que el de CI.
    command: `pnpm build && pnpm exec serve out -l ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    // Sin reuso: un `pnpm dev` olvidado en :3000 secuestraría el suite entero en silencio.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
