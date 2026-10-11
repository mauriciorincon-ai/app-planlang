/**
 * `pnpm comparacion --corrida runs/demo-a/<id> --salida data/vitrina/demo-a/<id> [--base <ruta>] [--plan <plan>]
 *  [--verificar]`
 *
 * Compara la corrida multiagente con su línea base de agente único (S4) y escribe `comparacion.json` en `--salida`. Por
 * convención la base es `<corrida>-base` (`hermanas`); `--plan` verifica contra otro plan que el de la corrida, solo si da
 * la misma verdad (ADR-005). `--verificar` no escribe: compara con lo que hay en disco y sale con código 1 si difiere.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compararCorridas, ErrorDeComparacion } from "../core/comparar";
import { ErrorDeLectura } from "../core/brecha/lector";
import { jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { argumentos, escribirTexto } from "./_io";
import { entradaDesdeDisco, hermanas } from "./_corridas";

async function main(): Promise<number> {
  const a = argumentos(process.argv.slice(2));
  const ruta =
    typeof a.corrida === "string" ? a.corrida.replace(/\/$/, "") : null;
  const salida = typeof a.salida === "string" ? a.salida : null;
  if (!ruta || !salida) {
    console.error(
      "uso: pnpm comparacion --corrida runs/demo-a/<id> --salida data/vitrina/demo-a/<id> [--base <ruta>] [--plan <plan>] [--verificar]",
    );
    return 2;
  }
  const base = typeof a.base === "string" ? a.base : hermanas(ruta).base;
  if (!base) {
    console.error(`✗ sin línea base: falta ${ruta}-base/corrida.json`);
    return 1;
  }

  let cmp;
  try {
    cmp = await compararCorridas(
      entradaDesdeDisco(ruta, {
        base,
        ...(typeof a.plan === "string" ? { plan: a.plan } : {}),
      }),
    );
  } catch (e) {
    if (e instanceof ErrorDeLectura) {
      console.error(`✗ corrida rechazada: ${e.motivos.length} motivo(s)`);
      for (const m of e.motivos)
        console.error(`  ${m.codigo} ${m.archivo}: ${m.detalle.es}`);
      return 1;
    }
    if (e instanceof ErrorDeComparacion) {
      console.error(`✗ ${e.message}`);
      return 1;
    }
    throw e;
  }
  const texto = jsonBonito(cmp as unknown as JsonValor);
  const ruta_json = join(salida, "comparacion.json");
  if (a.verificar) {
    if (!existsSync(ruta_json) || readFileSync(ruta_json, "utf8") !== texto) {
      console.error(
        `✗ comparación desactualizada en ${ruta_json} — regenerar con pnpm comparacion --corrida ${ruta} --salida ${salida}`,
      );
      return 1;
    }
    console.log(`✓ comparación al día (huella ${cmp.huella.slice(0, 12)}…)`);
    return 0;
  }
  escribirTexto(ruta_json, texto);
  console.log(`✓ ${ruta_json}: huella ${cmp.huella}`);
  return 0;
}

main().then((c) => process.exit(c));
