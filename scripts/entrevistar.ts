/**
 * `pnpm entrevistar --demo b [--retomar] [--nueva] [--pregunta P13] [--respuestas archivo] [--idioma es|en]
 *   [--sin-modelo]`
 *
 * Corre el entrevistador M2 (Python, con la consola heredada: las preguntas y tus respuestas pasan directo) y, al
 * terminar, revisa el borrador del lado TypeScript: M1, contradicciones (RF-02.5), pendientes y textos que redactó
 * el entrevistador. Escribe `plans/demo-<x>/contradicciones.json` y `revision.{es,en}.md`. Nunca aprueba: eso es
 * `pnpm plan:aprobar`, y solo después de que el usuario dice «apruebo».
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
const SALIDA_GUARDADA = 3;

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
  const demo = args.demo;
  if (demo !== "b") {
    console.error(
      "uso: entrevistar --demo b [--retomar] [--nueva] [--pregunta P13] [--respuestas archivo] [--idioma es|en] [--sin-modelo] [--salida carpeta]",
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
    "--demo",
    demo,
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
  // Con el plan ya aprobado, la entrevista nueva va a `--salida`: la de `plans/demo-<x>/` es su registro (AU-S3-10).
  const directorio =
    typeof args.salida === "string" ? args.salida : `plans/demo-${demo}`;
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
