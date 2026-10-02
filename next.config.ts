import type { NextConfig } from "next";

/**
 * El paquete para hoja-de-vida (ADR-009) es este mismo export compilado con `PLANLANG_PAQUETE=1`: vive bajo
 * `/piezas/planlang`, sus enlaces llevan `.html` (el proxy de idioma de hoja-de-vida intercepta toda ruta sin punto),
 * se compila en su propia carpeta para no pisar `out/`, con un id de build fijo (los mismos bytes en cada build del
 * mismo árbol) y sin Sentry. Lo arma y lo comprueba `scripts/paquete-vitrina.ts`.
 */
const PAQUETE = process.env.PLANLANG_PAQUETE === "1";
export const BASE_PAQUETE = "/piezas/planlang";

const nextConfig: NextConfig = {
  // Perfil EXPORTADO ESTÁTICO (kit v1.29.0): un HTML por ruta en out/, sin servidor.
  // `pnpm start` sirve out/ con serve (versión exacta) porque `next start` falla con export (E375).
  output: "export",
  images: { unoptimized: true },
  // El indicador de desarrollo de Next tapa la navegación inferior móvil e intercepta taps en los
  // e2e (visto en nutri-kids S1) — apagado por default.
  devIndicators: false,
  // Dos raíces (`(raiz)` para `/`, `[idioma]` para la vitrina): el 404 tiene que ser global (ADR-008).
  experimental: { globalNotFound: true },
  // `src/lib/ruta.ts` y el script de `/` leen el modo al compilar (también en el cliente).
  env: { PLANLANG_PAQUETE: PAQUETE ? "1" : "" },
  ...(PAQUETE
    ? {
        basePath: BASE_PAQUETE,
        distDir: ".next-paquete",
        generateBuildId: async () => "planlang-paquete",
        turbopack: {
          resolveAlias: { "@sentry/nextjs": "./src/lib/sin-sentry.ts" },
        },
      }
    : {}),
};

export default nextConfig;
