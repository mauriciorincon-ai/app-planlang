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
import { sha256Hex, verificarHuella } from "@core/formatos/huella";
import type { JsonValor } from "@core/formatos/jcs";
import { PlanSchema, type Plan } from "@core/plan/esquema";
import { LoteSchema, type Lote } from "@core/sintetico/esquema";
import type { GrafoParaMapa } from "@core/visor/mapa";
import type { z } from "zod";
import {
  EntornoCorridaSchema,
  GrafoCodigoSchema,
  GrafoLangGraphSchema,
  InformeMinimoSchema,
  LecturaSpikeSchema,
  ManifiestoVitrinaSchema,
  PlanBeneficiosMinimoSchema,
  type DemoDelManifiesto,
  type EntornoCorrida,
  type GrafoCodigo,
  type LecturaSpike,
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
  /** El spike de la F1, si el manifiesto lo declara: su grafo con la lectura del autor. */
  spike: SpikeLeido | null;
}

export interface SpikeLeido {
  fecha: string;
  lectura: LecturaSpike;
  /** El grafo del spike en la forma que dibuja el visor. */
  grafo: GrafoParaMapa;
}

const TERMINALES = new Set(["__start__", "__end__"]);

/**
 * El grafo exportado del spike más la lectura del autor. Falla si la lectura no cubre el grafo: un nodo sin tipo,
 * una arista condicional sin regla ni rama por defecto, o una regla hacia una arista que el grafo no tiene.
 */
export function grafoDelSpike(
  exportado: z.infer<typeof GrafoLangGraphSchema>,
  lectura: LecturaSpike,
): GrafoParaMapa {
  const nodos = exportado.nodes
    .filter((n) => !TERMINALES.has(n.id))
    .map((n) => {
      const tipo = lectura.tipos[n.id];
      if (!tipo)
        throw new Error(
          `vitrina: la lectura del spike no da tipo a «${n.id}».`,
        );
      return { id: n.id, tipo };
    });
  const condicionales = exportado.edges.filter((e) => e.conditional);
  for (const e of condicionales) {
    const conRegla = lectura.aristas_condicionales.some(
      (a) => a.desde === e.source && a.si_verdadero === e.target,
    );
    if (!conRegla && lectura.ramas_por_defecto[e.source] !== e.target)
      throw new Error(
        `vitrina: la arista condicional ${e.source} → ${e.target} del spike no tiene regla en la lectura.`,
      );
  }
  for (const a of lectura.aristas_condicionales)
    if (
      !condicionales.some(
        (e) => e.source === a.desde && e.target === a.si_verdadero,
      )
    )
      throw new Error(
        `vitrina: la lectura del spike declara ${a.desde} → ${a.si_verdadero}, que el grafo no tiene.`,
      );
  return {
    nodos,
    aristas: exportado.edges,
    aristas_condicionales: lectura.aristas_condicionales,
    ramas_por_defecto: lectura.ramas_por_defecto,
    pausas_humanas: lectura.pausas_humanas,
  };
}

async function conSha256(
  raiz: string,
  ruta: string,
  esperado: string,
): Promise<string> {
  const texto = readFileSync(join(raiz, ruta), "utf8");
  const h = await sha256Hex(texto);
  if (h !== esperado)
    throw new Error(
      `vitrina: ${ruta} tiene SHA-256 ${h.slice(0, 8)}…, el manifiesto declara ${esperado.slice(0, 8)}….`,
    );
  return texto;
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

/**
 * La corrida nombra el plan de beneficios con que corrió (id y versión); el archivo que lee la vitrina tiene que
 * ser ese (AU-S2-P-10). Una corrida sin esos campos (anterior al S2) solo se ata por la huella.
 */
export function esElPlanDeBeneficiosDeLaCorrida(
  ref: { archivo: string; id?: string; version?: string },
  pb: { id: string; version: string },
  demo: string,
): void {
  for (const k of ["id", "version"] as const)
    if (ref[k] !== undefined && ref[k] !== pb[k])
      throw new Error(
        `vitrina: la corrida de «${demo}» corrió con el plan de beneficios ${k} «${ref[k]}» y ${ref.archivo} trae «${pb[k]}».`,
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
  // Las páginas no llevan segmento `[demo]`: todas pintan el demo A. Un segundo demo en el manifiesto se detiene
  // aquí con su nombre, en lugar de no aparecer o de caer más adelante con un error sin nombre (AU-S2-19).
  const otros = Object.keys(manifiesto.demos).filter(
    (x) => x !== DEMO_PUBLICADO,
  );
  if (otros.length)
    throw new Error(
      `vitrina: el manifiesto declara ${otros.map((x) => `«${x}»`).join(", ")}, pero la vitrina solo pinta «${DEMO_PUBLICADO}»; un demo nuevo exige rutas por demo (segmento [demo]) antes de entrar al manifiesto.`,
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
  // Las repeticiones (pass^k) y la línea base del manifiesto traen su huella y son las que midió el informe
  // (AU-S2-P-7): una corrida regenerada o cambiada de carpeta no pasa en silencio a la ficha de reproducibilidad.
  const ficha = informe.ficha_reproducibilidad;
  for (const r of [
    ...demo.repeticiones,
    ...(demo.linea_base ? [demo.linea_base] : []),
  ]) {
    const cj = join(r.ruta, "corrida.json");
    await conHuellaDeclarada(cj, leer(cj), r.huella);
  }
  const huellas = (xs: readonly { huella: string }[]) =>
    xs
      .map((x) => x.huella)
      .sort()
      .join(" ");
  if (huellas(demo.repeticiones) !== huellas(ficha.repeticiones))
    throw new Error(
      `vitrina: las repeticiones que declara el manifiesto de «${id}» no son las que midió su informe (pass^k).`,
    );
  if ((demo.linea_base?.huella ?? null) !== (ficha.linea_base?.huella ?? null))
    throw new Error(
      `vitrina: la línea base que declara el manifiesto de «${id}» no es la que midió su informe.`,
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
    plan_beneficios?: {
      archivo: string;
      huella: string;
      id?: string;
      version?: string;
    };
  };
  if (!m.plan_beneficios)
    throw new Error(
      `vitrina: la corrida de «${id}» (${demo.corrida.ruta}) no declara su plan de beneficios; la vitrina lo necesita para P3 y P6.`,
    );
  const planBeneficiosRef = m.plan_beneficios;
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
  if (codigo.demo_id !== id)
    throw new Error(
      `vitrina: ${archivoCodigo} es el código del demo «${codigo.demo_id}», no el de «${id}»; se regenera con app_agents.exportar_grafo.`,
    );

  const pbCrudo = leer(planBeneficiosRef.archivo);
  await conHuellaDeclarada(
    planBeneficiosRef.archivo,
    pbCrudo,
    planBeneficiosRef.huella,
  );
  const planBeneficios = PlanBeneficiosMinimoSchema.parse(pbCrudo);
  esElPlanDeBeneficiosDeLaCorrida(planBeneficiosRef, planBeneficios, id);

  let spike: SpikeLeido | null = null;
  if (demo.spike) {
    const exportado = GrafoLangGraphSchema.parse(
      JSON.parse(
        await conSha256(
          raiz,
          demo.spike.grafo.archivo,
          demo.spike.grafo.sha256,
        ),
      ),
    );
    const lectura = LecturaSpikeSchema.parse(
      JSON.parse(
        await conSha256(
          raiz,
          demo.spike.lectura.archivo,
          demo.spike.lectura.sha256,
        ),
      ),
    );
    if (lectura.fecha !== demo.spike.fecha)
      throw new Error(
        `vitrina: la lectura del spike es del ${lectura.fecha} y el manifiesto declara el spike del ${demo.spike.fecha}.`,
      );
    spike = {
      fecha: demo.spike.fecha,
      lectura,
      grafo: grafoDelSpike(exportado, lectura),
    };
  }

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
    spike,
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

/** El único demo que la vitrina pinta hoy (las páginas no llevan segmento `[demo]`). */
export const DEMO_PUBLICADO = "demo-a";

const memoria = new Map<string, Promise<DatosDemo>>();

/** Los datos de un demo, una sola lectura por build aunque los pidan varias páginas. */
export function datosDemo(id = DEMO_PUBLICADO): Promise<DatosDemo> {
  let p = memoria.get(id);
  if (!p) {
    p = cargarDemo(id);
    memoria.set(id, p);
  }
  return p;
}
