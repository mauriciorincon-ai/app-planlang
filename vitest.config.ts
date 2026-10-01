import path from "node:path";
import { defineConfig } from "vitest/config";

// Config que el ci.yml del kit ya asume (job quality: "pnpm test").
// planlang S1 (K3/K8): tres proyectos porque el núcleo determinista (`core/`, `packages/`) debe
// producir LOS MISMOS BYTES en Node y en el navegador (regla dura 1):
//   - `core`        → entorno node: unitarias, integración y contratos del núcleo.
//   - `core-jsdom`  → los MISMOS tests que producen bytes, bajo jsdom (jsdom 30 no trae
//                     `crypto.subtle`: el setup lo toma de `node:crypto`, solo para el arnés).
//                     Igualdad con el golden en ambos proyectos = paridad Node/jsdom. La paridad
//                     con Chromium/Firefox/WebKit reales llega en S2 con la vitrina.
//   - `vitrina`     → el arnés original del kit (jsdom + Testing Library) para `src/`.
// La cobertura vive en la raíz y se aplica SOLO con `--coverage` en el script `test` (K7 ds S1).
// `server-only` lanza fuera de un componente de servidor: en vitest se sustituye por un módulo vacío (el
// build de Next sigue impidiendo que la capa de datos llegue al cliente).
const alias = {
  "@": path.resolve(__dirname, "src"),
  "@core": path.resolve(__dirname, "core"),
  "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
};

const incluyeNucleo = [
  "tests/unit/core/**/*.test.ts",
  "tests/unit/guardias/**/*.test.ts",
  "tests/integration/**/*.test.ts",
  "tests/contrato/**/*.test.ts",
  "packages/*/tests/**/*.test.ts",
];

// Subconjunto que PRODUCE bytes (huellas, informes, JCS): corre dos veces, en node y en jsdom.
const produceBytes = [
  "tests/unit/core/formatos/**/*.test.ts",
  // S2: el lienzo del visor (golden SVG ES/EN) — mismos bytes en Node y en jsdom (G1 del diagramador).
  "tests/unit/core/visor/svg.test.ts",
  // S2 fase 3: el playground recalcula en el navegador — la paridad con el informe y RF-09.2 corre en los dos.
  "tests/unit/core/playground/paridad.test.ts",
  "tests/integration/**/*.test.ts",
  "tests/contrato/**/*.test.ts",
];

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "core", environment: "node", include: incluyeNucleo },
      },
      {
        resolve: { alias },
        test: {
          name: "core-jsdom",
          environment: "jsdom",
          include: produceBytes,
          setupFiles: ["./tests/setup.core-jsdom.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "vitrina",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          exclude: [
            "tests/unit/core/**",
            "tests/unit/guardias/**",
            "**/node_modules/**",
          ],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // Solo globs de ARCHIVO: un include de directorio hace que v8 intente parsear .gitkeep y
      // truene con PARSE_ERROR (K8, ds S1).
      include: [
        "core/**/*.ts",
        "packages/*/src/**/*.ts",
        "src/lib/**/*.ts",
        "src/engine/**/*.ts",
        // S2: los componentes de la vitrina (UI > 50 %, regla 2); las páginas de src/app las cubre el e2e.
        "src/components/**/*.{ts,tsx}",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        // Regla dura 1 + RNF-09: verificador y playground ≥ 90 %; el planeador también (orden S1).
        "core/plan/**/*.ts": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        "core/brecha/**/*.ts": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        "core/playground/**/*.ts": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        // S2: el visor (conversor, validación, geometría, SVG) — núcleo determinista, como brecha y playground.
        "core/visor/**/*.ts": {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
        // Motores puros restantes (regla 2 del CLAUDE.md): > 80 %.
        "core/sintetico/**/*.ts": {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        "core/formatos/**/*.ts": {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        "packages/*/src/**/*.ts": {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        "src/lib/**/*.ts": {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        "src/components/**/*.{ts,tsx}": {
          lines: 50,
          functions: 50,
          branches: 50,
          statements: 50,
        },
      },
    },
  },
});
