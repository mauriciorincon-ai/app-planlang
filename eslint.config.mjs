import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
    // Maqueta de la Etapa de Diseño (public/diseno, con docs/diseno como enlace): HTML autocontenido con scripts clásicos que abren por file://.
    // La sirve Next tal cual desde public/; no hay paso de copia.
    "docs/diseno/**",
    "public/diseno/**",
  ]),
]);

export default eslintConfig;
