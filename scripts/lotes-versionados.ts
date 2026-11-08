import { readFileSync } from "node:fs";
import type { Plan } from "../core/plan";
import {
  generarLoteB,
  generarLoteJuridicoB,
  type ListasB,
  type LoteB,
} from "../core/sintetico";
/**
 * Los lotes de casos que viven versionados en `data/casos/demo-a/` (fase 2 del S1). El test de
 * frescura los regenera y exige los mismos bytes; `pnpm casos:generar --versionados` los reescribe.
 * Cada lote nombra el plan con que se genera: el de 20 y el de humo siguen con la v1.1 (sus corridas los citan por
 * huella); el de 200 pasó a la v1.4 en el S2 (AU-9 cambió el contrato de grafo, y la regla de compatibilidad compara
 * el contrato entero). Los casos son los mismos: el de 20 sigue siendo el primer bloque del de 200.
 * S3: el lote de 200 de la v1.5 (`planlang-a-002`) usa el plan de beneficios v2 (topes por servicio, aprobación
 * parcial): otra semilla, porque el subtipo nuevo cambia la mezcla y los casos ya no son los del 001.
 */
export const PLAN_DEMO_A = "plans/demo-a/v1.1.json";
export const PLAN_DEMO_A_V14 = "plans/demo-a/v1.4.json";
export const PLAN_DEMO_A_V15 = "plans/demo-a/v1.5.json";
/** S9 y S10: el plan que declara la simulación de plazos con que se miden las llegadas del lote de 200 (v1.6.1 desde el S10: solo cambia el mínimo jugable de la capacidad). */
export const PLAN_DEMO_A_VIGENTE = "plans/demo-a/v1.6.1.json";
export const PLAN_BENEFICIOS_DEMO_A = "data/plan-beneficios/demo-a.json";
export const PLAN_BENEFICIOS_DEMO_A_V2 = "data/plan-beneficios/demo-a-v2.json";
export const DIRECTORIO_CASOS_DEMO_A = "data/casos/demo-a";

export const LOTES_VERSIONADOS = [
  {
    semilla: "planlang-a-001",
    n: 20,
    receta: "estandar",
    plan: PLAN_DEMO_A,
    beneficios: PLAN_BENEFICIOS_DEMO_A,
  },
  {
    semilla: "planlang-a-001",
    n: 200,
    receta: "estandar",
    plan: PLAN_DEMO_A_V14,
    beneficios: PLAN_BENEFICIOS_DEMO_A,
  },
  {
    semilla: "planlang-a-humo",
    n: 3,
    receta: "humo",
    plan: PLAN_DEMO_A,
    beneficios: PLAN_BENEFICIOS_DEMO_A,
  },
  {
    semilla: "planlang-a-002",
    n: 200,
    receta: "estandar",
    plan: PLAN_DEMO_A_V15,
    beneficios: PLAN_BENEFICIOS_DEMO_A_V2,
  },
] as const;

export const rutaDeLote = (semilla: string, n: number): string =>
  `${DIRECTORIO_CASOS_DEMO_A}/${semilla}-${n}.json`;

export const RUTA_AFIRMACION = `${DIRECTORIO_CASOS_DEMO_A}/AFIRMACION-DE-PRIVACIDAD.md`;

/**
 * Demo B (S3): las listas de control sintéticas y los lotes que se generan con ellas y con el plan B v1 aprobado. El
 * de 20 es el primer bloque del de 200; el de humo alimenta la corrida simulada de CI.
 */
export const PLAN_DEMO_B = "plans/demo-b/v1.json";
/** S9: el plan B v1.2 (nodo de beneficiarios, C7), con que se genera el lote de personas jurídicas. */
export const PLAN_DEMO_B_V12 = "plans/demo-b/v1.2.json";
export const LISTAS_DEMO_B = "data/listas/demo-b.json";
export const DIRECTORIO_CASOS_DEMO_B = "data/casos/demo-b";
export const LOTES_VERSIONADOS_B: readonly {
  semilla: string;
  n: number;
  receta: "estandar" | "humo" | "juridicas";
  plan: string;
}[] = [
  { semilla: "planlang-b-001", n: 20, receta: "estandar", plan: PLAN_DEMO_B },
  { semilla: "planlang-b-001", n: 200, receta: "estandar", plan: PLAN_DEMO_B },
  { semilla: "planlang-b-humo", n: 4, receta: "humo", plan: PLAN_DEMO_B },
  // S9: 8 personas jurídicas y 12 naturales, con el plan B v1.2 (su corrida es la `b-002-20`).
  {
    semilla: "planlang-b-002",
    n: 20,
    receta: "juridicas",
    plan: PLAN_DEMO_B_V12,
  },
];
/** Genera un lote versionado del B con su plan y su receta (la de personas jurídicas tiene su propio generador). */
export async function generarLoteVersionadoB(
  l: (typeof LOTES_VERSIONADOS_B)[number],
  listas: ListasB,
): Promise<LoteB> {
  const plan = JSON.parse(readFileSync(l.plan, "utf8")) as Plan;
  const op = { plan, listas, semilla: l.semilla, n: l.n };
  return l.receta === "juridicas"
    ? generarLoteJuridicoB(op)
    : generarLoteB({ ...op, receta: l.receta });
}

export const rutaDeLoteB = (semilla: string, n: number): string =>
  `${DIRECTORIO_CASOS_DEMO_B}/${semilla}-${n}.json`;
export const RUTA_AFIRMACION_B = `${DIRECTORIO_CASOS_DEMO_B}/AFIRMACION-DE-PRIVACIDAD.md`;

interface ResumenLote {
  id: string;
  n: number;
  version_generador: string;
  huella: string | null;
  afirmacion_privacidad: { es: string; en: string };
}

/**
 * La afirmación de privacidad (I13) como documento legible, derivada de los lotes que cubre. Un lote con una afirmación
 * propia (S9: el de personas jurídicas también habla de sociedades) la suma en su sección, con su versión del generador.
 */
export function markdownAfirmacion(
  lotes: readonly ResumenLote[],
  demo = "A",
): string {
  const primero = lotes[0];
  if (!primero) throw new Error("sin lotes");
  const filas = lotes.map((l) => `| ${l.id} | ${l.n} | \`${l.huella}\` |`);
  const propias = lotes.filter(
    (l) =>
      l.afirmacion_privacidad.es !== primero.afirmacion_privacidad.es ||
      l.afirmacion_privacidad.en !== primero.afirmacion_privacidad.en,
  );
  const secciones = propias.flatMap((l) => [
    `## ${l.id} · generador v${l.version_generador}`,
    "",
    l.afirmacion_privacidad.es,
    "",
    l.afirmacion_privacidad.en,
    "",
  ]);
  return [
    "# Afirmación de privacidad · Privacy claim",
    "",
    `> Conjunto sintético del demo ${demo} de planlang · generador v${primero.version_generador}.`,
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
    ...secciones,
    "## Lotes cubiertos · Batches covered",
    "",
    "| Lote · Batch | Casos · Cases | Huella · Fingerprint (SHA-256) |",
    "|---|---|---|",
    ...filas,
    "",
  ].join("\n");
}
