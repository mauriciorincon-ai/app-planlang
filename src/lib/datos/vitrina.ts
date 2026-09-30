/**
 * La capa de datos de la vitrina: SOLO en el servidor y SOLO al compilar (`output: "export"`). Lee lo que
 * declara `data/vitrina/manifiesto.json`, valida cada archivo con su esquema y verifica su huella contra el
 * manifiesto; si algo no coincide, el build falla con el nombre del archivo (una vitrina que muestra otra
 * corrida que la declarada es peor que ninguna). El cliente jamás recibe estos objetos enteros: cada
 * pantalla arma su vista con lo que pinta.
 */
import "server-only";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Informe } from "@core/brecha/informe";
import {
  leerCorridaVerificada,
  type ArchivosDeCorrida,
  type CorridaLeida,
} from "@core/brecha/lector";
import { verificarHuella } from "@core/formatos/huella";
import type { JsonValor } from "@core/formatos/jcs";
import { PlanSchema, type Plan } from "@core/plan/esquema";
import { LoteSchema, type Lote } from "@core/sintetico/esquema";
import {
  EntornoCorridaSchema,
  GrafoCodigoSchema,
  InformeMinimoSchema,
  ManifiestoVitrinaSchema,
  PlanBeneficiosMinimoSchema,
  type DemoDelManifiesto,
  type EntornoCorrida,
  type GrafoCodigo,
  type PlanBeneficiosMinimo,
} from "./esquemas";

export interface DatosDemo {
  id: string;
  manifiesto: DemoDelManifiesto;
  plan: Plan;
  informe: Informe;
  entorno: EntornoCorrida;
  /** La corrida que declara el manifiesto, verificada entera (grafo, ramas y trazas con sus huellas). */
  corrida: CorridaLeida;
  /** El lote sintético de la corrida: los casos con su verdad conocida. */
  lote: Lote;
  /** Código por nodo del grafo (pestaña «Código» de P3). */
  codigo: GrafoCodigo;
  /** El plan de beneficios sintético con que corrió (la huella es la que declara la corrida). */
  planBeneficios: PlanBeneficiosMinimo;
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

  // La corrida entera, con el plan con que corrió y su lote (el lector del verificador: esquema, huellas y
  // coherencia de cada traza). Una traza alterada hace fallar el build.
  const archivos = archivosDeCorrida(leer, demo.corrida.ruta);
  const m = archivos.corrida as {
    plan: { archivo: string };
    casos: { archivo: string };
    plan_beneficios: { archivo: string; huella: string };
  };
  const planCorrida = leer(m.plan.archivo);
  const casos = leer(m.casos.archivo);
  const corrida = await leerCorridaVerificada(
    archivos,
    planCorrida,
    casos,
    planDelLote(raiz, m.plan.archivo, planCorrida, casos),
  );
  const lote = LoteSchema.parse(casos);

  const archivoCodigo = join("data/vitrina", id, "grafo-codigo.json");
  const codigoCrudo = leer(archivoCodigo);
  const v = await verificarHuella(codigoCrudo as Record<string, JsonValor>);
  if (!v.ok)
    throw new Error(
      `vitrina: ${archivoCodigo} no trae una huella válida (${v.motivo}); se regenera con app_agents.exportar_grafo.`,
    );
  const codigo = GrafoCodigoSchema.parse(codigoCrudo);

  const pbCrudo = leer(m.plan_beneficios.archivo);
  await conHuellaDeclarada(
    m.plan_beneficios.archivo,
    pbCrudo,
    m.plan_beneficios.huella,
  );
  const planBeneficios = PlanBeneficiosMinimoSchema.parse(pbCrudo);

  return {
    id,
    manifiesto: demo,
    plan,
    informe,
    entorno,
    corrida,
    lote,
    codigo,
    planBeneficios,
  };
}

function archivosDeCorrida(
  leer: (r: string) => unknown,
  ruta: string,
): ArchivosDeCorrida {
  const corrida = leer(join(ruta, "corrida.json")) as {
    trazas?: { archivo: string }[];
  };
  const trazas: Record<string, unknown> = {};
  for (const t of corrida.trazas ?? [])
    trazas[t.archivo] = leer(join(ruta, t.archivo));
  return {
    ruta,
    corrida,
    grafo: leer(join(ruta, "grafo.json")),
    ramas: leer(join(ruta, "ramas-esperadas.json")),
    trazas,
  };
}

/** El plan con que se generó el lote, si no es el de la corrida (el verificador exige la misma verdad). */
function planDelLote(
  raiz: string,
  planArchivo: string,
  plan: unknown,
  casos: unknown,
): unknown {
  const huellaLote = (casos as { plan?: { huella?: string } }).plan?.huella;
  if (!huellaLote || huellaLote === (plan as { huella?: string }).huella)
    return undefined;
  const dir = join(raiz, dirname(planArchivo));
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".json") || !existsSync(join(dir, f))) continue;
    const c = JSON.parse(readFileSync(join(dir, f), "utf8")) as {
      huella?: string;
    };
    if (c.huella === huellaLote) return c;
  }
  return null;
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
