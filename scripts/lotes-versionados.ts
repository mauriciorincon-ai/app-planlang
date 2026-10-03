/**
 * Los lotes de casos que viven versionados en `data/casos/demo-a/` (fase 2 del S1). El test de
 * frescura los regenera y exige los mismos bytes; `pnpm casos:generar --versionados` los reescribe.
 * Cada lote nombra el plan con que se genera: el de 20 y el de humo siguen con la v1.1 (sus corridas los citan por
 * huella); el de 200 pasó a la v1.4 en el S2 (AU-9 cambió el contrato de grafo, y la regla de compatibilidad compara
 * el contrato entero). Los casos son los mismos: el de 20 sigue siendo el primer bloque del de 200.
 */
export const PLAN_DEMO_A = "plans/demo-a/v1.1.json";
export const PLAN_DEMO_A_V14 = "plans/demo-a/v1.4.json";
export const PLAN_BENEFICIOS_DEMO_A = "data/plan-beneficios/demo-a.json";
export const DIRECTORIO_CASOS_DEMO_A = "data/casos/demo-a";

export const LOTES_VERSIONADOS = [
  { semilla: "planlang-a-001", n: 20, receta: "estandar", plan: PLAN_DEMO_A },
  {
    semilla: "planlang-a-001",
    n: 200,
    receta: "estandar",
    plan: PLAN_DEMO_A_V14,
  },
  { semilla: "planlang-a-humo", n: 3, receta: "humo", plan: PLAN_DEMO_A },
] as const;

export const rutaDeLote = (semilla: string, n: number): string =>
  `${DIRECTORIO_CASOS_DEMO_A}/${semilla}-${n}.json`;

export const RUTA_AFIRMACION = `${DIRECTORIO_CASOS_DEMO_A}/AFIRMACION-DE-PRIVACIDAD.md`;

interface ResumenLote {
  id: string;
  n: number;
  version_generador: string;
  huella: string | null;
  afirmacion_privacidad: { es: string; en: string };
}

/** La afirmación de privacidad (I13) como documento legible, derivada de los lotes que cubre. */
export function markdownAfirmacion(lotes: readonly ResumenLote[]): string {
  const primero = lotes[0];
  if (!primero) throw new Error("sin lotes");
  const filas = lotes.map((l) => `| ${l.id} | ${l.n} | \`${l.huella}\` |`);
  return [
    "# Afirmación de privacidad · Privacy claim",
    "",
    `> Conjunto sintético del demo A de planlang · generador v${primero.version_generador}.`,
    "> Archivo generado por `pnpm casos:generar --versionados`: no se edita a mano.",
    "> Generated file: do not edit by hand.",
    "",
    "## Español",
    "",
    primero.afirmacion_privacidad.es,
    "",
    "## English",
    "",
    primero.afirmacion_privacidad.en,
    "",
    "## Lotes cubiertos · Batches covered",
    "",
    "| Lote · Batch | Casos · Cases | Huella · Fingerprint (SHA-256) |",
    "|---|---|---|",
    ...filas,
    "",
  ].join("\n");
}
