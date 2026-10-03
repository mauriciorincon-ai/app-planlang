/**
 * El lienzo del visor para la vitrina: arma el mapa del diagramador desde el grafo compilado de la corrida y el
 * contrato del plan, con los textos de cada nodo (`src/textos/agente.ts`), y lo dibuja con `core/visor`. La
 * geometría no depende del idioma y cuesta ~0,25 s: se calcula una vez por build y por grafo. Todo lo dibujado
 * sale del dato (el visual se genera, no se dibuja).
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { Grafo } from "@core/formatos/traza";
import type { ContratoDeGrafo } from "@core/plan/esquema";
import { esAristaTripleta } from "@core/plan/esquema";
import { geometria, valorDeRegla, type Geometria } from "@core/visor/geometria";
import { idDeCodigo, idDeMapa } from "@core/visor/ids";
import {
  diagramaIgualGrafo,
  type ComparacionDiagrama,
} from "@core/visor/igualdad";
import {
  SENAL_POR_DEFECTO,
  construirMapa,
  terminales,
  type GrafoParaMapa,
  type TextosDeNodo,
} from "@core/visor/mapa";
import { aSvg } from "@core/visor/svg";
import type { Gramatica, Mapa, TextoIdioma } from "@core/visor/tipos";
import { validarMapa, erroresDe } from "@core/visor/validar";
import gramaticaJson from "../../../packages/diagramador/contrato/gramaticas/agentes-ia.json";
import {
  DETALLE_NODO,
  GRAFO,
  NODOS,
  NODOS_FUERA_DEL_CONTRATO,
  REGLA_CORTA,
} from "@/textos/agente";
import { categoriaDeRegla, reglaDelPlan } from "./motivo-pausa";
import { conPlan } from "./plan-en-texto";

export const GRAMATICA = gramaticaJson as unknown as Gramatica;

export function grafoParaMapa(g: Grafo): GrafoParaMapa {
  return {
    nodos: g.nodos,
    aristas: g.langgraph.edges as unknown as GrafoParaMapa["aristas"],
    aristas_condicionales: g.aristas_condicionales,
    ramas_por_defecto: g.ramas_por_defecto,
    pausas_humanas: g.pausas_humanas,
  };
}

function textosDeNodos(
  ids: readonly string[],
  contrato: ContratoDeGrafo,
): Record<string, TextosDeNodo> {
  const out: Record<string, TextosDeNodo> = {};
  // Los textos citan el plan con `{plan:…}` (AU-S2-3); en el mapa se resuelven con el contrato del lienzo.
  const p = (t: TextoIdioma): TextoIdioma => ({
    es: conPlan(t.es, { contrato_de_grafo: contrato }, "es"),
    en: conPlan(t.en, { contrato_de_grafo: contrato }, "en"),
  });
  for (const id of ids) {
    const t = NODOS[id] ?? NODOS_FUERA_DEL_CONTRATO[id];
    if (!t)
      throw new Error(
        `vitrina: faltan los textos del nodo «${id}» en src/textos/agente.ts`,
      );
    out[id] = {
      lider: p(t.rol),
      experto: p(t.como),
      por_que_importa: p(t.paraQue),
      fuentes: t.fuentes,
    };
  }
  return out;
}

export interface EntradaLienzo {
  grafo: GrafoParaMapa;
  contrato: ContratoDeGrafo;
  sujeto: { id: string; nombre: TextoIdioma };
  version: string;
  fecha: string;
  modelo: string;
}

export function mapaDe(e: EntradaLienzo): Mapa {
  const ids = [
    ...new Set([
      ...e.contrato.nodos_esperados.map((n) => n.id),
      ...e.grafo.nodos.map((n) => n.id),
    ]),
  ];
  const mapa = construirMapa({
    gramatica: GRAMATICA,
    grafo: e.grafo,
    contrato: e.contrato,
    textos: textosDeNodos(ids, e.contrato),
    sujeto_id: e.sujeto.id,
    sujeto_nombre: e.sujeto.nombre,
    version: e.version,
    fecha: e.fecha,
  });
  const errores = erroresDe(
    validarMapa(mapa, GRAMATICA, { cobertura: "letra" }),
  );
  if (errores.length)
    throw new Error(
      `vitrina: el mapa no pasa la validación del contrato (G14): ${errores.map((x) => `${x.regla} ${x.id} ${x.mensaje}`).join(" · ")}`,
    );
  return mapa;
}

/** Lo que va en la caja de cada nodo tras la etiqueta corta: reglas del enrutador, modelo o rol de la pausa. */
function detalles(e: EntradaLienzo): Record<string, TextoIdioma> {
  const out: Record<string, TextoIdioma> = {};
  const presentes = new Set(e.grafo.nodos.map((n) => n.id));
  for (const n of e.contrato.nodos_esperados) {
    if (!presentes.has(n.id)) continue;
    const reglas = e.grafo.aristas_condicionales.filter(
      (a) => a.desde === n.id,
    ).length;
    if (n.tipo === "enrutador" && reglas > 0)
      out[idDeMapa(n.id)] = DETALLE_NODO.reglas(reglas);
    if (n.tipo === "modelo")
      out[idDeMapa(n.id)] = { es: e.modelo, en: e.modelo };
    if (n.tipo === "pausa_humana") {
      const p = e.grafo.pausas_humanas.find((x) => x.nodo === n.id);
      if (p) out[idDeMapa(n.id)] = { es: p.rol, en: p.rol };
    }
  }
  return out;
}

/** Nombre corto de cada regla (para las líneas con tres o más): el umbral si lo tiene, si no el de los textos. */
function reglasCortas(e: EntradaLienzo): Record<string, TextoIdioma> {
  const out: Record<string, TextoIdioma> = {};
  for (const a of e.grafo.aristas_condicionales) {
    const id = `${idDeMapa(a.desde)}-a-${idDeMapa(a.si_verdadero)}-r${a.orden}`;
    if (
      esAristaTripleta(a) &&
      typeof a.valor === "string" &&
      a.valor.startsWith("umbral.")
    ) {
      const u = a.valor.slice("umbral.".length);
      out[id] = { es: u, en: u };
    } else {
      const corta = REGLA_CORTA[categoriaDeRegla(reglaDelPlan(a))];
      if (corta) out[id] = corta;
    }
  }
  return out;
}

const memo = new Map<string, { mapa: Mapa; geo: Geometria }>();

/** Mapa y geometría de un grafo, una sola vez por build (la clave es la huella del grafo y del contrato). */
export function dibujo(
  e: EntradaLienzo,
  clave: string,
): { mapa: Mapa; geo: Geometria } {
  let d = memo.get(clave);
  if (!d) {
    const mapa = mapaDe(e);
    const geo = geometria(mapa, GRAMATICA, {
      idiomas: GRAMATICA.idiomas,
      terminales: terminales(e.grafo),
      textosTerminales: GRAFO.terminales,
      detalleNodo: detalles(e),
      reglasCortas: reglasCortas(e),
    });
    if (geo.avisos.length)
      throw new Error(
        `vitrina: el lienzo no se dibuja sin encimar: ${geo.avisos.join(" · ")}`,
      );
    d = { mapa, geo };
    memo.set(clave, d);
  }
  return d;
}

export interface CapaDeLista {
  numero: string;
  nombre: string;
  pregunta: string;
  nodos: Array<{
    id: string;
    tipo: string;
    codigo: string;
    nombre: string;
    flujos: string[];
    exigido: boolean;
  }>;
  /** Líneas sin nodo: los terminales de la entrada y la salida, o que la capa está vacía. */
  notas: string[];
}

export interface Lienzo {
  svg: string;
  ancho: number;
  columnas: Array<{ numero: string; x: number }>;
  lista: CapaDeLista[];
  comparacion: ComparacionDiagrama;
}

/** El texto de las reglas de un origen hacia un destino, como en la lista por capa. */
function reglasEnTexto(
  mapa: Mapa,
  origen: string,
  destino: string,
  i: Idioma,
  cortas: Record<string, TextoIdioma>,
): string {
  const reglas = mapa.flujos.filter(
    (f) =>
      f.origen === origen &&
      f.destino === destino &&
      f.condicion &&
      f.condicion.senal !== SENAL_POR_DEFECTO,
  );
  const txt = (c: NonNullable<(typeof reglas)[number]["condicion"]>) =>
    `${idDeCodigo(c.senal)} ${{ "<": "<", "<=": "≤", "=": "=", "!=": "≠", ">=": "≥", ">": ">" }[c.operador]} ${valorDeRegla(c.valor, i)}`;
  if (reglas.length >= 3)
    return `${GRAFO.lista_.reglasEnOrden(reglas.length)[i]} (${reglas.map((f) => cortas[f.id]?.[i] ?? idDeCodigo(f.condicion!.senal)).join(" · ")})`;
  return reglas.map((f) => txt(f.condicion!)).join(` ${GRAFO.lista_.o[i]} `);
}

export function lienzo(
  e: EntradaLienzo,
  clave: string,
  i: Idioma,
  op: {
    ns: string;
    titulo: TextoIdioma;
    descripcion: TextoIdioma;
    lineasSeleccionables?: string[];
    seleccionables?: boolean;
  },
): Lienzo {
  const { mapa, geo } = dibujo(e, clave);
  const svg = aSvg(geo, GRAMATICA, {
    idioma: i,
    ns: op.ns,
    titulo: op.titulo,
    descripcion: op.descripcion,
    seleccionables: op.seleccionables ?? true,
    lineasSeleccionables: op.lineasSeleccionables,
  });
  const cortas = reglasCortas(e);
  const nombre = (id: string) => idDeCodigo(id);
  const terminal = (id: string) =>
    id === "inicio"
      ? GRAFO.terminales.inicio[i]
      : id === "fin"
        ? GRAFO.lista_.fin[i]
        : nombre(id);
  const lista: CapaDeLista[] = geo.bandas.map((b) => {
    const nodos = geo.nodos
      .filter((n) => n.columna === b.columna)
      .sort((a, z) => a.fila - z.fila)
      .map((n) => {
        const salientes = geo.lineas.filter((l) => l.origen === n.id);
        const reglas = salientes.filter((l) => l.reglas > 0);
        const defecto = salientes.find((l) => l.id.endsWith("-defecto"));
        const flujos: string[] = [];
        for (const l of reglas) {
          const siNo = defecto
            ? ` · ${GRAFO.lista_.siNo[i]} → ${terminal(defecto.destino)}`
            : "";
          flujos.push(
            `${reglasEnTexto(mapa, l.origen, l.destino, i, cortas)} → ${terminal(l.destino)}${siNo}`,
          );
        }
        if (!reglas.length && defecto)
          flujos.push(`${GRAFO.lista_.siNo[i]} → ${terminal(defecto.destino)}`);
        for (const l of salientes.filter((x) => x.modo === "secuencia"))
          flujos.push(
            `${nombre(n.id)} → ${terminal(l.destino)} · ${GRAFO.lista_.secuencia[i]}`,
          );
        for (const l of salientes.filter((x) => x.modo === "reanudacion"))
          flujos.push(
            `${nombre(n.id)} → ${terminal(l.destino)} · ${GRAFO.lista_.reanudacion[i]}`,
          );
        return {
          id: n.id,
          tipo: n.tipo,
          codigo: n.codigo.lineas[i].join(" "),
          nombre: n.nombre.lineas[i].join(""),
          flujos,
          exigido: n.madurez === "exigido-por-el-plan",
        };
      });
    const notas: string[] = [];
    for (const t of geo.terminales) {
      const col = geo.bandas.find((x) => x.x <= t.cx && t.cx < x.x + 160);
      if (col?.columna !== b.columna) continue;
      if (t.id === "inicio") {
        notas.push(GRAFO.lista_.terminalInicio[i]);
        for (const l of geo.lineas.filter((x) => x.origen === "inicio"))
          notas.push(
            `${GRAFO.terminales.inicio[i]} → ${nombre(l.destino)} · ${GRAFO.lista_.secuencia[i]}`,
          );
      } else notas.push(GRAFO.lista_.terminalFin[i]);
    }
    return {
      numero: b.numero,
      nombre: b.nombre.lineas[i].join(" "),
      pregunta: b.pregunta.lineas[i].join(" "),
      nodos,
      notas,
    };
  });
  return {
    svg,
    ancho: geo.ancho,
    columnas: geo.bandas.map((b) => ({ numero: b.numero, x: b.x })),
    lista,
    comparacion: diagramaIgualGrafo(mapa, e.grafo, e.contrato),
  };
}
