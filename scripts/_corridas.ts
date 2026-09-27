/**
 * Lectura de corridas desde el disco para los CLI (el núcleo es puro: recibe objetos). Las rutas del
 * manifiesto (plan, casos) son relativas a la raíz del repo; las de las trazas, a la corrida.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
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

/**
 * Si el lote declara otro plan que el de la corrida, busca ese plan (por huella) junto al de la corrida:
 * el verificador comprobará que conserva umbrales y contrato de grafo. `undefined` si es el mismo.
 */
export function planDelLote(
  planArchivo: string,
  plan: unknown,
  casos: unknown,
): unknown {
  const huellaLote = (casos as { plan?: { huella?: string } }).plan?.huella;
  if (!huellaLote || huellaLote === (plan as { huella?: string }).huella)
    return undefined;
  const dir = dirname(planArchivo);
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".json")) continue;
    const candidato = json(join(dir, f)) as { huella?: string };
    if (candidato.huella === huellaLote) return candidato;
  }
  return null;
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
  const planArchivo = join(raiz, m.plan.archivo);
  const plan = json(planArchivo);
  const casos = json(join(raiz, m.casos.archivo));
  return {
    plan,
    casos,
    planDelLote: planDelLote(planArchivo, plan, casos),
    corrida,
    repeticiones: (opciones.repeticiones ?? []).map(archivosDeCorrida),
    base: opciones.base ? archivosDeCorrida(opciones.base) : null,
  };
}
