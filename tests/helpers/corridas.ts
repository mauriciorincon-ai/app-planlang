/** Corridas versionadas para los tests del verificador (el cwd de vitest es la raíz del repo). */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { leerEntrada, type EntradaVerificador } from "../../core/brecha/lector";
import { entradaDesdeDisco } from "../../scripts/_corridas";

export const SIMULADO = "runs/demo-a/simulado-3casos";
export const REAL = "runs/demo-a/suscripcion-planlang-a-001-20";
export const REAL_BASE = "runs/demo-a/suscripcion-planlang-a-001-20-base";

export const entradaSimulada = (): EntradaVerificador =>
  entradaDesdeDisco(SIMULADO);
export const entradaReal = (): EntradaVerificador =>
  entradaDesdeDisco(REAL, { base: REAL_BASE });
export const leidaSimulada = () => leerEntrada(entradaSimulada());

/** Toda corrida versionada bajo `runs/<demo>/<corrida>/`. */
export function corridasVersionadas(): string[] {
  const salida: string[] = [];
  for (const demo of readdirSync("runs").sort())
    for (const c of readdirSync(join("runs", demo)).sort())
      if (existsSync(join("runs", demo, c, "corrida.json")))
        salida.push(join("runs", demo, c));
  return salida;
}

export const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Una copia de la corrida con otro id, re-sellada entera: sirve de repetición (pass^k) en los tests. */
export async function repeticionDe(
  e: EntradaVerificador,
  nuevoId: string,
): Promise<EntradaVerificador["corrida"]> {
  const { conHuella, sinHuella } = await import("../../core/formatos/huella");
  type O = Record<string, import("../../core/formatos/jcs").JsonValor>;
  const c = copia(e.corrida);
  const manifiesto = c.corrida as O & { trazas: O[] };
  const trazas: Record<string, unknown> = {};
  for (const d of manifiesto.trazas) {
    const t = await conHuella(
      sinHuella({
        ...(c.trazas[d["archivo"] as string] as O),
        corrida_id: nuevoId,
      }),
    );
    trazas[d["archivo"] as string] = t;
    d["huella"] = t.huella;
  }
  const ramas = await conHuella(
    sinHuella({ ...(c.ramas as O), corrida_id: nuevoId }),
  );
  manifiesto["ramas_esperadas"] = {
    archivo: "ramas-esperadas.json",
    huella: ramas.huella,
  };
  manifiesto["corrida_id"] = nuevoId;
  return {
    ruta: `runs/demo-a/${nuevoId}`,
    corrida: await conHuella(sinHuella(manifiesto)),
    grafo: c.grafo,
    ramas,
    trazas,
  };
}
