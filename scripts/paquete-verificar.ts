/**
 * `pnpm paquete:verificar [--en <carpeta>] [--manifiesto <ruta>]` — el lector del manifiesto del paquete (AU-S2-8).
 * Comprueba que `<carpeta>` (por defecto el propio `dist/paquete-hoja-de-vida/`; tras la entrega, el checkout de
 * hoja-de-vida) tiene cada archivo del manifiesto con su SHA-256 y que en `public/piezas/planlang/` no sobra ninguno.
 * Solo lee. Sale con 1 y nombra cada diferencia.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { argumentos } from "./_io";
import { arbolEnDisco } from "./paquete/arbol-disco";
import {
  verificarContraManifiesto,
  type ManifiestoPaquete,
} from "./paquete/verificar";

const a = argumentos(process.argv.slice(2));
const PAQUETE = resolve("dist", "paquete-hoja-de-vida");
const en = resolve(typeof a.en === "string" ? a.en : PAQUETE);
const ruta =
  typeof a.manifiesto === "string"
    ? resolve(a.manifiesto)
    : join(PAQUETE, "manifiesto.json");
console.log(`paquete:verificar: lee ${ruta} y compara ${en} (solo lectura)`);
const m = JSON.parse(readFileSync(ruta, "utf8")) as ManifiestoPaquete;
const problemas = verificarContraManifiesto(m, arbolEnDisco(en));
if (problemas.length) {
  for (const p of problemas) console.error(`✗ ${p}`);
  console.error(`\n✗ paquete:verificar: ${problemas.length} diferencia(s).`);
  process.exit(1);
}
console.log(
  `✓ ${Object.keys(m.archivos).length} archivos con su huella y nada de más en public${m.base}/`,
);
