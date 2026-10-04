/** El árbol de archivos de una carpeta del disco, para `verificarContraManifiesto` (solo lee). */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Arbol } from "./verificar";

export function arbolEnDisco(raiz: string): Arbol {
  const recorrer = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir).flatMap((f) => {
          const r = join(dir, f);
          return statSync(r).isDirectory() ? recorrer(r) : [r];
        })
      : [];
  return {
    listar: (carpeta) =>
      recorrer(join(raiz, carpeta)).map((f) => relative(raiz, f)),
    sha256: (ruta) => {
      const f = join(raiz, ruta);
      return existsSync(f)
        ? createHash("sha256").update(readFileSync(f)).digest("hex")
        : null;
    },
  };
}
