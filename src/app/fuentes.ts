import localFont from "next/font/local";

/**
 * Inter (variable 400–700) y JetBrains Mono (variable 100–800), OFL, servidas desde el mismo sitio: los
 * mismos archivos que la maqueta aprobada (test de huellas en tests/unit/fuentes.test.ts; licencias en
 * /licencias). `swap` con respaldo ajustado a las métricas, y no `block` como la maqueta: la primera pintura
 * no espera a la fuente (LCP de la Entrada ≤ 2,5 s) y el salto al cambiarla es mínimo (ADR-008).
 */
export const inter = localFont({
  src: "./fuentes/inter.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--fuente-letra",
  adjustFontFallback: "Arial",
});

export const mono = localFont({
  src: "./fuentes/jetbrains-mono.woff2",
  weight: "100 800",
  style: "normal",
  display: "swap",
  variable: "--fuente-mono",
  adjustFontFallback: false,
});
