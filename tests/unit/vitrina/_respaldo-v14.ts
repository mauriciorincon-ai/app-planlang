/**
 * Los datos del demo con la corrida simulada del respaldo AU-9 (`runs/demo-a/simulado-v1.4-respaldo`, plan v1.4):
 * pausas desde el extractor sin extracción y desde la aclaración por el proveedor. La vitrina publica hoy la
 * corrida v1.2; estas pruebas comprueban que una corrida con respaldo se narra con su motivo y no con el de otra
 * regla (AU-S2-1).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Informe } from "@core/brecha/informe";
import { leerCorridaVerificada } from "@core/brecha/lector";
import { PlanSchema } from "@core/plan/esquema";
import { LoteSchema } from "@core/sintetico/esquema";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";

const RUTA = "runs/demo-a/simulado-v1.4-respaldo";
const leer = (r: string): unknown => JSON.parse(readFileSync(r, "utf8"));

export async function datosConRespaldo(): Promise<DatosDemo> {
  const base = await datosDemo();
  const corrida = leer(join(RUTA, "corrida.json")) as {
    plan: { archivo: string };
    casos: { archivo: string };
    trazas: { archivo: string }[];
  };
  const trazas: Record<string, unknown> = {};
  for (const t of corrida.trazas)
    trazas[t.archivo] = leer(join(RUTA, t.archivo));
  const planCrudo = leer(corrida.plan.archivo);
  const casos = leer(corrida.casos.archivo);
  const leida = await leerCorridaVerificada(
    {
      ruta: RUTA,
      corrida,
      grafo: leer(join(RUTA, "grafo.json")),
      ramas: leer(join(RUTA, "ramas-esperadas.json")),
      trazas,
    },
    planCrudo,
    casos,
  );
  return {
    ...base,
    plan: PlanSchema.parse(planCrudo),
    informe: leer(join(RUTA, "informe.json")) as Informe,
    corrida: leida,
    lote: LoteSchema.parse(casos),
  };
}
