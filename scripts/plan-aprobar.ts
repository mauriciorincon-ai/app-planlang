/**
 * `pnpm plan:aprobar (--demo b | --dominio <id> --plan <id>) --por "<nombre>" --el <YYYY-MM-DD>
 *  [--version N] [--con-contradicciones]`
 *
 * Lo corre el constructor SOLO después de que el usuario dice «apruebo el plan». Revisa el borrador otra vez
 * (M1, contradicciones, pendientes): lo pendiente nunca se aprueba, y una contradicción solo pasa si el usuario la
 * aceptó de forma explícita (`--con-contradicciones`, registrado en la bitácora). Escribe `plans/demo-<x>/v1.json`
 * (o `plans/<plan>/v1.json` en un plan real) con `aprobado_por`, `aprobado_el` y huella (`aprobarPlan` de M1).
 *
 * `--version N` (S6, N ≥ 2) aprueba una versión nueva de un plan que ya tiene la anterior: lee el borrador de
 * `plans/<plan>/vN/` (la entrevista nueva va allí con `--salida`), escribe `plans/<plan>/vN.json` y sella la versión
 * `N.0.0`. La anterior no se toca: es la historia. Sin el flag, todo sigue como en el S5.
 */
import { existsSync, readdirSync } from "node:fs";
import type { JsonValor } from "../core/formatos/jcs";
import { aprobarPlan, impideAprobar } from "../core/plan";
import {
  DEMOS_ENTREVISTABLES,
  objetivoDeEntrevista,
  revisarDirectorio,
} from "./entrevistar";
import { argumentos, escribirJson, leerJson } from "./_io";

/** Dónde se lee el borrador, dónde se escribe el plan aprobado y qué versión lleva. */
export interface DestinoDeAprobacion {
  directorio: string;
  destino: string;
  /** `N.0.0` con `--version N`; `null` sin el flag (el borrador conserva su versión, la 1.0.0). */
  version: string | null;
}

/** Una versión nueva es un entero desde el 2: la 1 es la de siempre y se pide sin el flag. */
const VERSION_NUEVA = /^([2-9]|[1-9]\d+)$/;

export function destinoDeAprobacion(
  base: string,
  version: string | true | undefined,
): DestinoDeAprobacion | null {
  if (version === undefined)
    return { directorio: base, destino: `${base}/v1.json`, version: null };
  if (typeof version !== "string" || !VERSION_NUEVA.test(version)) return null;
  return {
    directorio: `${base}/v${version}`,
    destino: `${base}/v${version}.json`,
    version: `${version}.0.0`,
  };
}

/** Las versiones aprobadas de un plan (`vN.json` en su carpeta), en orden. */
export function versionesAprobadas(directorio: string): number[] {
  if (!existsSync(directorio)) return [];
  return readdirSync(directorio)
    .map((f) => /^v(\d+)\.json$/.exec(f))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  const objetivo = objetivoDeEntrevista(args);
  const donde =
    objetivo && destinoDeAprobacion(objetivo.directorio, args.version);
  if (
    !objetivo ||
    !donde ||
    typeof args.por !== "string" ||
    typeof args.el !== "string"
  ) {
    console.error(
      `uso: plan:aprobar (--demo ${DEMOS_ENTREVISTABLES.join("|")} | --dominio <id> --plan <id>) --por "<nombre>" --el <YYYY-MM-DD> [--version N (N ≥ 2)] [--con-contradicciones]`,
    );
    return 2;
  }
  const { directorio, destino } = donde;
  if (donde.version) {
    // Una versión nueva encadena con la anterior: no se salta ninguna y no se aprueba una igual o menor a la vigente.
    const n = Number(args.version);
    const carpetaDelPlan = objetivo.directorio;
    const aprobadas = versionesAprobadas(carpetaDelPlan);
    if (!aprobadas.includes(n - 1) || aprobadas.some((k) => k >= n)) {
      console.error(
        `${carpetaDelPlan}: las versiones aprobadas son ${aprobadas.map((k) => `v${k}`).join(", ") || "ninguna"}; la nueva debe ser v${(aprobadas.at(-1) ?? 0) + 1}.`,
      );
      return 1;
    }
  }
  if (existsSync(destino)) {
    console.error(
      `${destino} ya existe: un plan aprobado no se reescribe (sube la versión).`,
    );
    return 1;
  }
  const r = await revisarDirectorio(directorio);
  const acepta = args["con-contradicciones"] === true;
  if (impideAprobar(r, acepta)) {
    console.error("NO SE APRUEBA:");
    for (const m of r.m1.motivos)
      console.error(`  [M1 ${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
    for (const c of r.contradicciones)
      console.error(`  [${c.codigo}] ${c.elemento}: ${c.mensaje.es}`);
    if (!acepta && r.contradicciones.some((c) => c.codigo !== "PENDIENTE"))
      console.error(
        "  Si el usuario acepta estas contradicciones, vuelve a correr con --con-contradicciones.",
      );
    return 1;
  }
  const borrador = leerJson(`${directorio}/v0-borrador.json`) as Record<
    string,
    JsonValor
  >;
  const a = await aprobarPlan(
    donde.version ? { ...borrador, version: donde.version } : borrador,
    { por: args.por, el: args.el },
  );
  if (!a.ok) {
    for (const m of a.motivos)
      console.error(`  [${m.codigo}] ${m.elemento}: ${m.mensaje.es}`);
    return 1;
  }
  escribirJson(destino, a.plan as never);
  console.log(
    `APROBADO ${destino} · ${a.plan.id} v${a.plan.version} · por ${args.por} el ${args.el} · huella ${a.plan.huella}`,
  );
  return 0;
}

if (process.argv[1]?.endsWith("plan-aprobar.ts"))
  main().then((codigo) => process.exit(codigo));
