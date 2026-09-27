/**
 * Utilidades de E/S para los CLI del núcleo. SOLO los scripts tocan disco: `core/` es puro y corre en el
 * navegador. Los archivos con huella se escriben «bonitos» (claves ordenadas, indentación 2, salto final)
 * y jamás pasan por prettier (`.prettierignore`).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";

export function leerJson(ruta: string): JsonValor {
  return JSON.parse(readFileSync(ruta, "utf8")) as JsonValor;
}

export function escribirJson(ruta: string, valor: JsonValor): void {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, jsonBonito(valor), "utf8");
}

export function escribirTexto(ruta: string, texto: string): void {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto, "utf8");
}

/** Parseo mínimo de `--clave valor` y `--bandera`. */
export function argumentos(argv: string[]): Record<string, string | true> {
  const salida: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (!a.startsWith("--")) continue;
    const clave = a.slice(2);
    const siguiente = argv[i + 1];
    if (siguiente !== undefined && !siguiente.startsWith("--")) {
      salida[clave] = siguiente;
      i++;
    } else {
      salida[clave] = true;
    }
  }
  return salida;
}
