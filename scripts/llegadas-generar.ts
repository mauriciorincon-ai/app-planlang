/**
 * `pnpm llegadas:generar [--verificar]` — la capa de llegadas de los lotes que la tienen (S9, ADR-019).
 *
 * Cada solicitud de un lote llega en un día hábil y un minuto de la jornada, sorteados con `sfc32` desde la semilla del
 * lote. La capa vive junto al lote (`<lote>.llegadas.json`), con su huella y la del lote al que sirve, y NO toca los
 * bytes de los casos ni las huellas de sus corridas. La jornada y los días salen del bloque `simulacion_de_plazos` del
 * plan que se nombra. Con `--verificar` no escribe: exige que lo que hay en disco sea lo que sale de aquí.
 */
import { readFileSync } from "node:fs";
import { conHuella } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import { cargarPlan } from "../core/plan";
import {
  configDeCola,
  llegadasDelLote,
  type CapaDeLlegadas,
} from "../core/plazos";
import { jcs } from "../core/formatos/jcs";
import { argumentos, escribirJson, leerJson } from "./_io";
import { PLAN_DEMO_A_VIGENTE, rutaDeLote } from "./lotes-versionados";

/** Los lotes con capa de llegadas: hoy el de 200 de la v1.5 del A, medido con el plan v1.6.1. */
export const LLEGADAS_VERSIONADAS = [
  { semilla: "planlang-a-002", n: 200, plan: PLAN_DEMO_A_VIGENTE },
] as const;

export const rutaDeLlegadas = (semilla: string, n: number): string =>
  rutaDeLote(semilla, n).replace(/\.json$/, ".llegadas.json");

/** La capa de un lote leído de disco, medida con la jornada y los días de `plan`. */
export async function capaDelLote(
  rutaDelLote: string,
  rutaDelPlan: string,
): Promise<CapaDeLlegadas> {
  const lote = JSON.parse(readFileSync(rutaDelLote, "utf8")) as {
    id: string;
    huella: string;
    semilla: string;
    casos: { id: string }[];
  };
  const carga = await cargarPlan(leerJson(rutaDelPlan));
  if (!carga.ok) throw new Error(`${rutaDelPlan} no carga`);
  const sim = carga.plan.simulacion_de_plazos;
  if (!sim) throw new Error(`${rutaDelPlan} no declara simulacion_de_plazos`);
  const sinHuella = llegadasDelLote({
    lote: { id: lote.id, huella: lote.huella, semilla: lote.semilla },
    ids: lote.casos.map((c) => c.id),
    dias_habiles: sim.dias_habiles,
    minutos_de_jornada: configDeCola(sim).jornada_min,
  });
  return (await conHuella(
    sinHuella as unknown as Record<string, JsonValor>,
  )) as unknown as CapaDeLlegadas;
}

async function main(): Promise<number> {
  const args = argumentos(process.argv.slice(2));
  let distintas = 0;
  for (const l of LLEGADAS_VERSIONADAS) {
    const ruta = rutaDeLlegadas(l.semilla, l.n);
    const capa = await capaDelLote(rutaDeLote(l.semilla, l.n), l.plan);
    if (args.verificar === true) {
      // Forma canónica (JCS): el archivo guarda las claves ordenadas y el generador las arma en otro orden; lo que
      // importa es que el contenido y la huella sean los mismos (el S9 comparaba cadenas y fallaba siempre).
      const enDisco = jcs(leerJson(ruta));
      if (enDisco !== jcs(capa)) {
        console.error(`${ruta}: no es lo que sale del generador`);
        distintas++;
      } else console.log(`OK ${ruta} · huella ${capa.huella}`);
    } else {
      escribirJson(ruta, capa as unknown as JsonValor);
      console.log(
        `escrito ${ruta} · ${capa.llegadas.length} llegadas · huella ${capa.huella}`,
      );
    }
  }
  return distintas === 0 ? 0 : 1;
}

if (process.argv[1]?.endsWith("llegadas-generar.ts"))
  main().then((c) => process.exit(c));
