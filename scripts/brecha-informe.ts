/**
 * `pnpm brecha:informe --corrida runs/demo-a/<id> [--salida <dir>] [--base <ruta>|--sin-base]
 *  [--repeticiones <ruta>,<ruta>] [--verificar]`
 *
 * Verifica la corrida (huellas, contrato de grafo, RF-09.2) y escribe `informe.json`, `informe.es.md` e
 * `informe.en.md` en `--salida` (por defecto, la carpeta de la corrida). Por convención toma como línea
 * base `<corrida>-base` y como repeticiones `<corrida>-r2`, `<corrida>-r3`… si existen.
 * `--verificar` no escribe: compara con lo que hay en disco y sale con código 1 si difiere (frescura).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ErrorDeLectura } from "../core/brecha/lector";
import { generarInforme } from "../core/brecha/informe";
import { renderizarInforme } from "../core/brecha/render-md";
import { jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { argumentos, escribirTexto } from "./_io";
import { entradaDesdeDisco, hermanas } from "./_corridas";

async function main(): Promise<number> {
  const a = argumentos(process.argv.slice(2));
  const ruta =
    typeof a.corrida === "string" ? a.corrida.replace(/\/$/, "") : null;
  if (!ruta) {
    console.error(
      "uso: pnpm brecha:informe --corrida runs/demo-a/<id> [--salida <dir>] [--verificar]",
    );
    return 2;
  }
  const h = hermanas(ruta);
  const base = a["sin-base"]
    ? null
    : typeof a.base === "string"
      ? a.base
      : h.base;
  const repeticiones =
    typeof a.repeticiones === "string"
      ? a.repeticiones.split(",")
      : h.repeticiones;
  const salida = typeof a.salida === "string" ? a.salida : ruta;

  let informe;
  try {
    informe = await generarInforme(
      entradaDesdeDisco(ruta, { base, repeticiones }),
    );
  } catch (e) {
    if (e instanceof ErrorDeLectura) {
      console.error(`✗ corrida rechazada: ${e.motivos.length} motivo(s)`);
      for (const m of e.motivos)
        console.error(`  ${m.codigo} ${m.archivo}: ${m.detalle.es}`);
      return 1;
    }
    throw e;
  }
  const archivos: Record<string, string> = {
    "informe.json": jsonBonito(informe as unknown as JsonValor),
    "informe.es.md": renderizarInforme(informe, "es"),
    "informe.en.md": renderizarInforme(informe, "en"),
  };
  if (a.verificar) {
    const distintos = Object.keys(archivos).filter((f) => {
      const p = join(salida, f);
      return !existsSync(p) || readFileSync(p, "utf8") !== archivos[f];
    });
    if (distintos.length > 0) {
      console.error(
        `✗ informe desactualizado en ${salida}: ${distintos.join(", ")} — regenerar con pnpm brecha:informe --corrida ${ruta}`,
      );
      return 1;
    }
    console.log(
      `✓ informe al día (${informe.veredicto.valor}, huella ${informe.huella.slice(0, 12)}…)`,
    );
    return 0;
  }
  for (const [f, texto] of Object.entries(archivos))
    escribirTexto(join(salida, f), texto);
  console.log(
    `✓ ${salida}: veredicto ${informe.veredicto.valor} · huella ${informe.huella}`,
  );
  return 0;
}

main().then((c) => process.exit(c));
