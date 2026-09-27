/**
 * `pnpm m9:reporte [--verificar]` — valida el instrumento (M9) sobre la corrida simulada versionada y
 * escribe `docs/kit-de-prueba/M9-brechas-sembradas.md`. Sale con código 1 si alguna siembra no se detecta
 * o si el control limpio dispara algo; con `--verificar`, también si el archivo está desactualizado.
 */
import { existsSync, readFileSync } from "node:fs";
import { renderizarM9, validarInstrumento } from "../core/brecha/m9";
import { argumentos, escribirTexto } from "./_io";
import { entradaDesdeDisco } from "./_corridas";

export const CORRIDA_M9 = "runs/demo-a/simulado-3casos";
export const REPORTE_M9 = "docs/kit-de-prueba/M9-brechas-sembradas.md";

async function main(): Promise<number> {
  const a = argumentos(process.argv.slice(2));
  const r = await validarInstrumento(entradaDesdeDisco(CORRIDA_M9));
  const texto = renderizarM9(r, CORRIDA_M9);
  const ok = r.control_limpio && r.detectadas === r.sembradas;
  if (a.verificar) {
    const fresco =
      existsSync(REPORTE_M9) && readFileSync(REPORTE_M9, "utf8") === texto;
    if (!fresco)
      console.error(
        `✗ ${REPORTE_M9} desactualizado — regenerar con pnpm m9:reporte`,
      );
    console.log(
      `M9: ${r.detectadas}/${r.sembradas} · control ${r.control_limpio ? "limpio" : "SUCIO"}`,
    );
    return ok && fresco ? 0 : 1;
  }
  escribirTexto(REPORTE_M9, texto);
  console.log(
    `${ok ? "✓" : "✗"} M9: ${r.detectadas}/${r.sembradas} · control ${r.control_limpio ? "limpio" : "SUCIO"} → ${REPORTE_M9}`,
  );
  return ok ? 0 : 1;
}

main().then((c) => process.exit(c));
