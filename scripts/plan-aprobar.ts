/**
 * `pnpm plan:aprobar --demo b --por "<nombre>" --el <YYYY-MM-DD> [--con-contradicciones]`
 *
 * Lo corre el constructor SOLO después de que el usuario dice «apruebo el plan B». Revisa el borrador otra vez
 * (M1, contradicciones, pendientes): lo pendiente nunca se aprueba, y una contradicción solo pasa si el usuario la
 * aceptó de forma explícita (`--con-contradicciones`, registrado en la bitácora). Escribe `plans/demo-<x>/v1.json`
 * con `aprobado_por`, `aprobado_el` y huella (`aprobarPlan` de M1).
 */
import { existsSync } from "node:fs";
import { aprobarPlan, impideAprobar } from "../core/plan";
import { DEMOS_ENTREVISTABLES, revisarDirectorio } from "./entrevistar";
import { argumentos, escribirJson, leerJson } from "./_io";

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  if (
    typeof args.demo !== "string" ||
    !DEMOS_ENTREVISTABLES.includes(args.demo) ||
    typeof args.por !== "string" ||
    typeof args.el !== "string"
  ) {
    console.error(
      `uso: plan:aprobar --demo ${DEMOS_ENTREVISTABLES.join("|")} --por "<nombre>" --el <YYYY-MM-DD> [--con-contradicciones]`,
    );
    return 2;
  }
  const directorio = `plans/demo-${args.demo}`;
  const destino = `${directorio}/v1.json`;
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
  const a = await aprobarPlan(leerJson(`${directorio}/v0-borrador.json`), {
    por: args.por,
    el: args.el,
  });
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

main().then((codigo) => process.exit(codigo));
