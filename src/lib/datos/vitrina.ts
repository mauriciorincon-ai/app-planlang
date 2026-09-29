/**
 * La capa de datos de la vitrina: SOLO en el servidor y SOLO al compilar (`output: "export"`). Lee lo que
 * declara `data/vitrina/manifiesto.json`, valida cada archivo con su esquema y verifica su huella contra el
 * manifiesto; si algo no coincide, el build falla con el nombre del archivo (una vitrina que muestra otra
 * corrida que la declarada es peor que ninguna). El cliente jamás recibe estos objetos enteros: cada
 * pantalla arma su vista con lo que pinta.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Informe } from "@core/brecha/informe";
import { verificarHuella } from "@core/formatos/huella";
import type { JsonValor } from "@core/formatos/jcs";
import { PlanSchema, type Plan } from "@core/plan/esquema";
import {
  EntornoCorridaSchema,
  InformeMinimoSchema,
  ManifiestoVitrinaSchema,
  type DemoDelManifiesto,
  type EntornoCorrida,
} from "./esquemas";

export interface DatosDemo {
  id: string;
  manifiesto: DemoDelManifiesto;
  plan: Plan;
  informe: Informe;
  entorno: EntornoCorrida;
}

function lector(raiz: string) {
  return (ruta: string): unknown =>
    JSON.parse(readFileSync(join(raiz, ruta), "utf8"));
}

async function conHuellaDeclarada(
  ruta: string,
  valor: unknown,
  esperada: string,
): Promise<void> {
  const v = await verificarHuella(valor as Record<string, JsonValor>);
  if (!v.ok)
    throw new Error(
      `vitrina: ${ruta} no trae una huella válida (${v.motivo}); se regenera con su script, no a mano.`,
    );
  if (v.huella !== esperada)
    throw new Error(
      `vitrina: ${ruta} tiene la huella ${v.huella.slice(0, 8)}…, el manifiesto declara ${esperada.slice(0, 8)}….`,
    );
}

/** Carga y verifica un demo desde `raiz` (el repo al compilar; una copia alterada en las pruebas). */
export async function cargarDemo(
  id: string,
  raiz: string = process.cwd(),
): Promise<DatosDemo> {
  const leer = lector(raiz);
  const manifiesto = ManifiestoVitrinaSchema.parse(
    leer("data/vitrina/manifiesto.json"),
  );
  const demo = manifiesto.demos[id];
  if (!demo) throw new Error(`vitrina: el manifiesto no declara «${id}».`);

  const planCrudo = leer(demo.plan.archivo);
  await conHuellaDeclarada(demo.plan.archivo, planCrudo, demo.plan.huella);
  const plan = PlanSchema.parse(planCrudo);

  const informeCrudo = leer(demo.informe.archivo);
  await conHuellaDeclarada(
    demo.informe.archivo,
    informeCrudo,
    demo.informe.huella,
  );
  InformeMinimoSchema.parse(informeCrudo);
  const informe = informeCrudo as Informe;

  const corridaJson = join(demo.corrida.ruta, "corrida.json");
  await conHuellaDeclarada(corridaJson, leer(corridaJson), demo.corrida.huella);
  if (informe.ficha_reproducibilidad.corrida.huella !== demo.corrida.huella)
    throw new Error(
      `vitrina: el informe de «${id}» no es el de la corrida que declara el manifiesto.`,
    );
  const entorno = EntornoCorridaSchema.parse(
    leer(join(demo.corrida.ruta, "entorno.json")),
  );

  return { id, manifiesto: demo, plan, informe, entorno };
}

const memoria = new Map<string, Promise<DatosDemo>>();

/** Los datos de un demo, una sola lectura por build aunque los pidan varias páginas. */
export function datosDemo(id = "demo-a"): Promise<DatosDemo> {
  let p = memoria.get(id);
  if (!p) {
    p = cargarDemo(id);
    memoria.set(id, p);
  }
  return p;
}
