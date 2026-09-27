/**
 * Lectura de corridas desde el disco para los CLI (el núcleo es puro: recibe objetos). Las rutas del
 * manifiesto (plan, casos) son relativas a la raíz del repo; las de las trazas, a la corrida.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ArchivosDeCorrida,
  EntradaVerificador,
} from "../core/brecha/lector";

function json(ruta: string): unknown {
  return JSON.parse(readFileSync(ruta, "utf8"));
}

export function archivosDeCorrida(ruta: string): ArchivosDeCorrida {
  const corrida = json(join(ruta, "corrida.json")) as {
    trazas?: { archivo: string }[];
  };
  const trazas: Record<string, unknown> = {};
  for (const t of corrida.trazas ?? []) {
    const f = join(ruta, t.archivo);
    if (existsSync(f)) trazas[t.archivo] = json(f);
  }
  return {
    ruta,
    corrida,
    grafo: json(join(ruta, "grafo.json")),
    ramas: json(join(ruta, "ramas-esperadas.json")),
    trazas,
  };
}

/** Las corridas hermanas por convención: `<id>-base` (línea base) y `<id>-r2`, `<id>-r3`… (repeticiones). */
export function hermanas(ruta: string): {
  base: string | null;
  repeticiones: string[];
} {
  const base = `${ruta}-base`;
  const repeticiones: string[] = [];
  for (let k = 2; existsSync(`${ruta}-r${k}`); k++)
    repeticiones.push(`${ruta}-r${k}`);
  return {
    base: existsSync(join(base, "corrida.json")) ? base : null,
    repeticiones,
  };
}

export function entradaDesdeDisco(
  ruta: string,
  opciones: {
    base?: string | null;
    repeticiones?: string[];
    raiz?: string;
  } = {},
): EntradaVerificador {
  const raiz = opciones.raiz ?? ".";
  const corrida = archivosDeCorrida(ruta);
  const m = corrida.corrida as {
    plan: { archivo: string };
    casos: { archivo: string };
  };
  return {
    plan: json(join(raiz, m.plan.archivo)),
    casos: json(join(raiz, m.casos.archivo)),
    corrida,
    repeticiones: (opciones.repeticiones ?? []).map(archivosDeCorrida),
    base: opciones.base ? archivosDeCorrida(opciones.base) : null,
  };
}
