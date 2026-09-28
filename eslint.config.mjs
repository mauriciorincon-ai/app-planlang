import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // ADR-008 (S2): la vitrina navega como sitio de varias páginas con <a> y el helper `ruta()`. `next/link`
    // pediría payloads RSC que el paquete para hoja-de-vida (enlaces `.html` bajo /piezas/planlang) no tiene.
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // planlang S1 (K5, regla 2 del CLAUDE.md): directorios generados o ajenos al lint de TS.
    "coverage/**",
    "agents/**",
    "runs/**",
    // Maqueta de la Etapa de Diseño (docs/diseno, fuera del export desde el S2 — ADR-007): HTML autocontenido
    // con scripts clásicos que abren por file://. Referencia congelada: se reproduce, no se compila.
    "docs/diseno/**",
  ]),
]);

export default eslintConfig;
