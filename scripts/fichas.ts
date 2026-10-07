/**
 * Escribe las fichas y el export que planlang entrega a hoja-de-vida (ver `src/lib/fichas/archivos.ts`): la ficha del
 * agente de cada demo, el `brochure-export.json`, sus versiones en inglés, el complemento propuesto y la ficha de la
 * app como la arma hoja-de-vida. Lee las corridas que declara el manifiesto, verificadas enteras; cada archivo pasa su contrato
 * antes de escribirse. Con `--verificar` no escribe: dice qué archivo cambiaría y sale con 1.
 *
 * Uso: `pnpm fichas` · `pnpm fichas --verificar`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { hechosDelRepo } from "../src/lib/datos/repo";
import { datosDeLosDemos } from "../src/lib/datos/vitrina";
import { archivosDeFichas } from "../src/lib/fichas/archivos";

async function main(): Promise<number> {
  const verificar = process.argv.includes("--verificar");
  const archivos = archivosDeFichas(await datosDeLosDemos(), hechosDelRepo());
  let distintos = 0;
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const igual = existsSync(ruta) && readFileSync(ruta, "utf8") === contenido;
    if (igual) continue;
    distintos++;
    if (verificar)
      console.error(`✗ ${ruta}: no es lo que generaría pnpm fichas`);
    else {
      mkdirSync(dirname(ruta), { recursive: true });
      writeFileSync(ruta, contenido);
      console.log(`✓ ${ruta}`);
    }
  }
  console.log(
    `fichas: ${Object.keys(archivos).length} archivos, ${distintos} ${verificar ? "desactualizados" : "escritos"}.`,
  );
  return verificar && distintos ? 1 : 0;
}

main().then((c) => process.exit(c));
