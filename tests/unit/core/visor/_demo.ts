/**
 * Datos reales del demo A para las pruebas del visor: la gramática `agentes-ia` fijada, el grafo exportado de la
 * corrida que declara el manifiesto y el contrato de grafo del plan v1.3, con los recorridos de sus trazas (contrato
 * 0.5.0 § 3.5). Los textos que NO se dibujan (líder, experto, por qué importa, fuentes) son de relleno: la vitrina
 * pone los suyos; los que se dibujan son los de la página.
 */
import { readdirSync, readFileSync } from "node:fs";
import { geometria, type OpcionesGeometria } from "@core/visor/geometria";
import {
  construirMapa,
  terminalesDelMapa,
  type GrafoParaMapa,
  type TextosDeNodo,
} from "@core/visor/mapa";
import {
  recorridosDeTrazas,
  type TrazaParaRecorrido,
} from "@core/visor/recorridos";
import type { Gramatica, Mapa, TextoIdioma } from "@core/visor/tipos";
import type { ContratoDeGrafo } from "@core/plan/esquema";

const leer = (r: string) => JSON.parse(readFileSync(r, "utf8"));

export const GRAMATICA = leer(
  "packages/diagramador/contrato/gramaticas/agentes-ia.json",
) as Gramatica;
const manifiesto = leer("data/vitrina/manifiesto.json");
const demo = manifiesto.demos["demo-a"];
const grafo = leer(`${demo.corrida.ruta}/grafo.json`);
export const PLAN = leer(demo.plan.archivo);
export const CONTRATO = PLAN.contrato_de_grafo as ContratoDeGrafo;

/** Las trazas de la corrida (caso y nodos visitados): sus caminos son los recorridos del mapa. */
export const TRAZAS: TrazaParaRecorrido[] = readdirSync(
  `${demo.corrida.ruta}/trazas`,
)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => leer(`${demo.corrida.ruta}/trazas/${f}`) as TrazaParaRecorrido);

export const GRAFO: GrafoParaMapa = {
  nodos: grafo.nodos,
  aristas: grafo.langgraph.edges,
  aristas_condicionales: grafo.aristas_condicionales,
  ramas_por_defecto: grafo.ramas_por_defecto,
  pausas_humanas: grafo.pausas_humanas,
};

const RELLENO: TextoIdioma = { es: "Relleno.", en: "Filler." };
export function textosDeRelleno(
  ids: readonly string[],
): Record<string, TextosDeNodo> {
  return Object.fromEntries(
    ids.map((id) => [
      id,
      {
        lider: RELLENO,
        experto: RELLENO,
        por_que_importa: RELLENO,
        fuentes: [
          {
            url: "https://langchain-ai.github.io/langgraph/",
            titulo: RELLENO,
            fecha: "2026-09-27",
            tipo: "oficial" as const,
          },
        ],
      },
    ]),
  );
}

export function mapaDemo(
  g: GrafoParaMapa = GRAFO,
  trazas: readonly TrazaParaRecorrido[] = TRAZAS,
): Mapa {
  const textos = textosDeRelleno([
    ...CONTRATO.nodos_esperados.map((n) => n.id),
    ...g.nodos.map((n) => n.id),
  ]);
  return construirMapa({
    gramatica: GRAMATICA,
    grafo: g,
    contrato: CONTRATO,
    textos,
    recorridos: recorridosDeTrazas(trazas, textos),
    sujeto_id: "demo-a",
    sujeto_nombre: {
      es: "Demo A · autorizaciones médicas",
      en: "Demo A · medical prior authorisation",
    },
    version: "1.2.0",
    fecha: "2026-09-27",
  });
}

const r = (es: string, en: string): TextoIdioma => ({ es, en });
export const OPCIONES: OpcionesGeometria = {
  idiomas: ["es", "en"],
  terminales: terminalesDelMapa(mapaDemo()),
  textosTerminales: { inicio: r("solicitud", "request"), fin: r("fin", "end") },
  detalleNodo: {
    enrutador: r("2 reglas", "2 rules"),
    decision: r("5 reglas", "5 rules"),
    extractor: r("sonnet", "sonnet"),
    aclaracion: r("sonnet", "sonnet"),
    redactor: r("sonnet", "sonnet"),
    "pausa-humana": r("auditor", "auditor"),
  },
  reglasCortas: {
    "decision-a-pausa-humana-r1": r("U1", "U1"),
    "decision-a-pausa-humana-r2": r("U2", "U2"),
    "decision-a-pausa-humana-r3": r("contradicción", "contradiction"),
    "decision-a-pausa-humana-r4": r("negar", "deny"),
    "decision-a-pausa-humana-r5": r("Texas", "Texas"),
  },
};

/** La geometría del demo, calculada una vez por archivo de pruebas (el ruteo cuesta ~0,25 s; con cobertura, más). */
let memo: ReturnType<typeof geometria> | undefined;
export const geometriaDemo = () =>
  (memo ??= geometria(mapaDemo(), GRAMATICA, OPCIONES));

/** Límite de las pruebas que rutean: con la instrumentación de cobertura y en paralelo, el ruteo se alarga. */
export const LIMITE_RUTEO = 30_000;
