import localFont from "next/font/local";

/**
 * Inter (variable 400–700) y JetBrains Mono (variable 100–800), OFL, servidas desde el mismo sitio: los
 * mismos archivos que la maqueta aprobada (tests/unit/vitrina/fuentes.test.ts; licencias en /licencias).
 * `swap` con respaldo ajustado a las métricas, y no `block` como la maqueta: la primera pintura no espera a
 * la fuente (LCP de la Entrada ≤ 2,5 s). La mono no se precarga y se activa después de la carga
 * (`html[data-mono]`, src/styles/base.css): solo la usan los datos, nunca lo primero que se lee (ADR-008).
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
  preload: false,
});
