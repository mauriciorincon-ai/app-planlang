/**
 * `pnpm entrevistar (--demo b | --dominio <id> --plan <id>) [--retomar] [--nueva] [--pregunta P13]
 *   [--respuestas archivo] [--idioma es|en] [--sin-modelo]`
 *
 * Corre el entrevistador M2 (Python, con la consola heredada: las preguntas y tus respuestas pasan directo) y, al
 * terminar, revisa el borrador del lado TypeScript: M1, contradicciones (RF-02.5), pendientes y textos que redactó
 * el entrevistador. Escribe `plans/demo-<x>/contradicciones.json` y `revision.{es,en}.md` (o `plans/<plan>/…` en un plan
 * real). Nunca aprueba: eso es `pnpm plan:aprobar`, y solo después de que el usuario dice «apruebo».
 *
 * Un plan real (S5) es cualquier plantilla de `data/dominios/` y cualquier id de plan: el dominio nuevo es solo datos y
 * el código no cambia.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { VOCABULARIO } from "../core/brecha/contexto";
import { conHuella, huella } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import {
  revisarBorrador,
  textoDeRevision,
  TranscripcionSchema,
  type Revision,
} from "../core/plan";
import { argumentos, escribirJson, escribirTexto, leerJson } from "./_io";

const PYTHON = resolve("agents/.venv/bin/python");
/**
 * Los demos cuyo plan nace de una entrevista: los que tienen plantilla de dominio con preguntas y entrada en el
 * entrevistador Python (`DEMOS` de `agents/src/app_agents/entrevistador/cli.py`; una prueba las compara). El plan del
 * A se escribió a mano en el S1, antes de que existiera el entrevistador, y no se reentrevista: sus corridas fijan su
 * verdad (ADR-005).
 */
export const DEMOS_ENTREVISTABLES: readonly string[] = ["b"];
const USO_OBJETIVO = `(--demo ${DEMOS_ENTREVISTABLES.join("|")} | --dominio <id> --plan <id>)`;
const SALIDA_GUARDADA = 3;
/** El mismo patrón de id estable que el plan: va al nombre de una carpeta, así que nada de barras ni `..`. */
const ID_ESTABLE = /^[A-Za-z][A-Za-z0-9_-]*$/;
/** Lo que nombra a un demo (`demo-b`, `plan-demo-b`): un plan real no puede compartir carpeta, hilo ni revisión con uno (AU-S5 M-4). */
const DE_DEMO = /^(plan-)?demo-/;

/** Qué se entrevista y dónde queda: un demo (`--demo b`) o un plan real (`--dominio <id> --plan <id>`). */
export interface ObjetivoDeEntrevista {
  /** Los argumentos que identifican el objetivo para el entrevistador Python. */
  pasar: string[];
  /** La carpeta del borrador, la transcripción y, aprobado, el `v1.json`. */
  directorio: string;
}

export function objetivoDeEntrevista(
  args: Record<string, string | true>,
): ObjetivoDeEntrevista | null {
  const { demo, dominio, plan } = args;
  if (demo !== undefined) {
    if (dominio !== undefined || plan !== undefined) return null;
    return typeof demo === "string" && DEMOS_ENTREVISTABLES.includes(demo)
      ? { pasar: ["--demo", demo], directorio: `plans/demo-${demo}` }
      : null;
  }
  if (
    typeof dominio === "string" &&
    typeof plan === "string" &&
    ID_ESTABLE.test(dominio) &&
    ID_ESTABLE.test(plan) &&
    !DE_DEMO.test(plan)
  )
    return {
      pasar: ["--dominio", dominio, "--plan", plan],
      directorio: `plans/${plan}`,
    };
  return null;
}

export async function revisarDirectorio(directorio: string): Promise<Revision> {
  const borrador = leerJson(`${directorio}/v0-borrador.json`);
  const transcripcion = TranscripcionSchema.parse(
    leerJson(`${directorio}/transcripcion.json`),
  );
  const revision = revisarBorrador(borrador, transcripcion);
  const contenido = await huella(borrador);
  escribirJson(
    `${directorio}/contradicciones.json`,
    await conHuella({
      formato: "planlang-contradicciones/v1",
      plan_id: revision.plan_id,
      borrador: {
        archivo: "v0-borrador.json",
        huella_del_contenido: contenido,
      },
      transcripcion: {
        archivo: "transcripcion.json",
        huella: transcripcion.huella,
      },
      ...(JSON.parse(JSON.stringify(revision)) as Record<string, JsonValor>),
      huella: null,
    }),
  );
  for (const idioma of ["es", "en"] as const)
    escribirTexto(
      `${directorio}/revision.${idioma}.md`,
      textoDeRevision(borrador, revision, idioma),
    );
  return revision;
}

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  const objetivo = objetivoDeEntrevista(args);
  if (!objetivo) {
    console.error(
      `uso: entrevistar ${USO_OBJETIVO} [--retomar] [--nueva] [--pregunta P13] [--respuestas archivo] [--idioma es|en] [--sin-modelo] [--salida carpeta]`,
    );
    return 2;
  }
  if (!existsSync(PYTHON)) {
    console.error(
      `falta ${PYTHON}: crea el entorno de agents/ (ver README) antes de entrevistar`,
    );
    return 2;
  }
  const pasar = [
    ...objetivo.pasar,
    "--vocabulario",
    Object.keys(VOCABULARIO).join(","),
  ];
  for (const bandera of ["retomar", "nueva", "sin-modelo"])
    if (args[bandera] === true) pasar.push(`--${bandera}`);
  for (const opcion of ["respuestas", "idioma", "pregunta", "fecha", "salida"])
    if (typeof args[opcion] === "string")
      pasar.push(`--${opcion}`, args[opcion] as string);
  const py = spawnSync(PYTHON, ["-m", "app_agents.entrevistador", ...pasar], {
    stdio: "inherit",
  });
  if (py.error) {
    console.error(`no se pudo lanzar el entrevistador: ${py.error.message}`);
    return 1;
  }
  if (py.status === SALIDA_GUARDADA) return 0;
  if (py.status !== 0) return py.status ?? 1;
  // Con el plan ya aprobado, la entrevista nueva va a `--salida`: la de `plans/<plan>/` es su registro (AU-S3-10).
  const directorio =
    typeof args.salida === "string" ? args.salida : objetivo.directorio;
  const r = await revisarDirectorio(directorio);
  const idioma = args.idioma === "en" ? "en" : "es";
  console.log(
    idioma === "es"
      ? `\nRevisión: ${directorio}/revision.es.md · M1 ${r.m1.ok ? "acepta" : `rechaza (${r.m1.motivos.length})`} · ${r.contradicciones.length} contradicciones · ${r.pendientes.length} pendientes`
      : `\nReview: ${directorio}/revision.en.md · M1 ${r.m1.ok ? "accepts" : `rejects (${r.m1.motivos.length})`} · ${r.contradicciones.length} contradictions · ${r.pendientes.length} pending`,
  );
  return 0;
}

if (process.argv[1]?.endsWith("entrevistar.ts"))
  main().then((codigo) => process.exit(codigo));
