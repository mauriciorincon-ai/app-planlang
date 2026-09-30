/**
 * Conversor grafo compilado + contrato de grafo del plan → mapa del contrato del diagramador 0.3.0 (gramática
 * `agentes-ia` 1.1.0). Reglas (ADR-010):
 *
 * - Nodo del plan presente en el grafo → madurez `implementado`; del plan y ausente → `exigido-por-el-plan`
 *   (el dibujo lo marca «exigido»); del grafo y fuera del plan → `implementado` con la referencia opaca
 *   `planlang:fuera-del-contrato`.
 * - Banda por tipo: enrutador → orquestación · modelo y herramienta → agentes · regla → reglas · pausa humana →
 *   pausa humana. Las franjas transversales no reciben nodos del grafo.
 * - Un flujo por REGLA del plan (una arista de LangGraph puede llevar varias: enrutador → redactor lleva dos),
 *   uno por rama por defecto (`condicion` `rama-por-defecto = true`, el «si no»), uno por arista incondicional
 *   (`secuencia`, o `reanudacion` si sale de una pausa humana). Una regla que es función nombrada lleva la
 *   condición `<funcion> = true` (convención propuesta como enmienda `condicion.funcion`).
 * - `__start__` y `__end__` no son nodos del mapa (no hay tipo terminal en 0.3.0): los dibuja el visor.
 */
import type {
  AristaCondicional,
  ContratoDeGrafo,
  PausaHumana,
} from "../plan/esquema";
import { esAristaTripleta } from "../plan/esquema";
import { idDeMapa } from "./ids";
import type {
  Condicion,
  FlujoMapa,
  Fuente,
  Gramatica,
  Mapa,
  NodoMapa,
  Operador,
  TextoIdioma,
} from "./tipos";

export const INICIO = "__start__";
export const FIN = "__end__";
export const FUERA_DEL_CONTRATO = "planlang:fuera-del-contrato";
export const SENAL_POR_DEFECTO = "rama-por-defecto";

export interface GrafoParaMapa {
  nodos: ReadonlyArray<{ id: string; tipo: string }>;
  aristas: ReadonlyArray<{
    source: string;
    target: string;
    conditional?: boolean;
  }>;
  aristas_condicionales: ReadonlyArray<AristaCondicional>;
  ramas_por_defecto: Readonly<Record<string, string>>;
  pausas_humanas: ReadonlyArray<PausaHumana>;
}

export interface TextosDeNodo {
  lider: TextoIdioma;
  experto: TextoIdioma;
  por_que_importa: TextoIdioma;
  fuentes: Fuente[];
}

export interface EntradaMapa {
  gramatica: Gramatica;
  grafo: GrafoParaMapa;
  contrato: ContratoDeGrafo;
  /** Textos de cada nodo, por id del CÓDIGO. */
  textos: Readonly<Record<string, TextosDeNodo>>;
  sujeto_id: string;
  sujeto_nombre: TextoIdioma;
  version: string;
  /** Fecha de la corrida (entrada: el núcleo no lee el reloj). */
  fecha: string;
}

export const BANDA_DE_TIPO: Readonly<Record<string, string>> = {
  enrutador: "orquestacion",
  modelo: "agentes",
  herramienta: "agentes",
  regla: "reglas",
  "pausa-humana": "pausa-humana",
};

const OPERADORES: Readonly<Record<string, readonly [Operador, Operador]>> = {
  menor_que: ["<", "<="],
  mayor_que: [">", ">="],
  menor_o_igual_que: ["<=", "<="],
  mayor_o_igual_que: [">=", ">="],
  igual_a: ["=", "="],
  distinto_de: ["!=", "!="],
};

/** `umbral.U3` → `U3` (el valor del plan, por referencia: el playground lo mueve). */
export function valorDeCondicion(valor: unknown): number | string | boolean {
  if (typeof valor === "string" && valor.startsWith("umbral."))
    return valor.slice("umbral.".length);
  if (
    typeof valor === "number" ||
    typeof valor === "string" ||
    typeof valor === "boolean"
  )
    return valor;
  throw new Error(
    `visor: valor de arista no representable en el mapa: ${JSON.stringify(valor)}`,
  );
}

export function condicionDeRegla(a: AristaCondicional): Condicion {
  if (esAristaTripleta(a)) {
    const par = OPERADORES[a.operador];
    if (!par) throw new Error(`visor: operador «${a.operador}» sin símbolo`);
    return {
      senal: idDeMapa(a.senal),
      operador: a.inclusivo ? par[1] : par[0],
      valor: valorDeCondicion(a.valor),
    };
  }
  return { senal: idDeMapa(a.funcion.nombre), operador: "=", valor: true };
}

const QUE_VIAJA: TextoIdioma = {
  es: "el estado del caso",
  en: "the case state",
};

function textoCondicion(c: Condicion): string {
  return `${c.senal.replaceAll("-", "_")} ${c.operador} ${String(c.valor)}`;
}

function liderDeFlujo(
  modo: string,
  origen: string,
  destino: string,
  c?: Condicion,
): TextoIdioma {
  if (modo === "reanudacion")
    return {
      es: `Cuando la persona responde, el caso sigue a ${destino}.`,
      en: `When the person answers, the case moves on to ${destino}.`,
    };
  if (modo === "secuencia")
    return {
      es: `Después de ${origen}, sigue ${destino}.`,
      en: `After ${origen}, ${destino} runs.`,
    };
  if (c && c.senal === SENAL_POR_DEFECTO)
    return {
      es: `Si ninguna regla de ${origen} se cumple, el caso sigue a ${destino}.`,
      en: `If none of ${origen}'s rules holds, the case moves on to ${destino}.`,
    };
  const regla = c ? textoCondicion(c) : "";
  return {
    es: `Si se cumple ${regla}, el caso sigue a ${destino}.`,
    en: `If ${regla} holds, the case moves on to ${destino}.`,
  };
}

function nombreCodigo(id: string): TextoIdioma {
  return { es: id, en: id };
}

export function construirMapa(e: EntradaMapa): Mapa {
  const tipoPlan = new Map(
    e.contrato.nodos_esperados.map((n) => [n.id, n.tipo] as const),
  );
  const enGrafo = new Map(e.grafo.nodos.map((n) => [n.id, n.tipo] as const));
  const ids = [
    ...e.contrato.nodos_esperados.map((n) => n.id),
    ...e.grafo.nodos.map((n) => n.id).filter((id) => !tipoPlan.has(id)),
  ];
  const tiposGramatica = new Set(e.gramatica.tipos_de_nodo.map((t) => t.id));

  const nodos: NodoMapa[] = ids.map((id, i) => {
    const tipo = idDeMapa(enGrafo.get(id) ?? (tipoPlan.get(id) as string));
    if (!tiposGramatica.has(tipo))
      throw new Error(
        `visor: el tipo «${tipo}» de ${id} no está en la gramática`,
      );
    const textos = e.textos[id];
    if (!textos) throw new Error(`visor: faltan los textos del nodo «${id}»`);
    const nodo: NodoMapa = {
      id: idDeMapa(id),
      banda_id: BANDA_DE_TIPO[tipo] as string,
      tipo_id: tipo,
      nombre: nombreCodigo(id),
      orden: (i + 1) * 10,
      lider: textos.lider,
      experto: textos.experto,
      por_que_importa: textos.por_que_importa,
      madurez: enGrafo.has(id) ? "implementado" : "exigido-por-el-plan",
      fuentes: textos.fuentes,
      fecha_verificacion: e.fecha,
    };
    if (!tipoPlan.has(id)) nodo.refs_externas = [FUERA_DEL_CONTRATO];
    return nodo;
  });

  const pausas = new Set(e.grafo.pausas_humanas.map((p) => p.nodo));
  const flujos: FlujoMapa[] = [];
  const agregar = (
    origen: string,
    destino: string,
    modo: string,
    condicion?: Condicion,
    sufijo = "",
  ) => {
    const o = idDeMapa(origen);
    const d = idDeMapa(destino);
    const f: FlujoMapa = {
      id: `${o}-a-${d}${sufijo}`,
      origen: o,
      destino: d,
      modo_id: modo,
      que_viaja: QUE_VIAJA,
      lider: liderDeFlujo(modo, origen, destino, condicion),
    };
    if (condicion) f.condicion = condicion;
    flujos.push(f);
  };
  const reglasDe = (desde: string) =>
    e.grafo.aristas_condicionales
      .filter((a) => a.desde === desde)
      .slice()
      .sort((a, b) => a.orden - b.orden);

  for (const a of e.grafo.aristas) {
    if (a.source === INICIO || a.target === FIN) continue;
    if (!a.conditional) {
      agregar(
        a.source,
        a.target,
        pausas.has(a.source) ? "reanudacion" : "secuencia",
      );
      continue;
    }
    for (const r of reglasDe(a.source).filter(
      (r) => r.si_verdadero === a.target,
    ))
      agregar(
        a.source,
        a.target,
        "condicional",
        condicionDeRegla(r),
        `-r${r.orden}`,
      );
    const porDefecto =
      e.grafo.ramas_por_defecto[a.source] ??
      reglasDe(a.source).find((r) => r.si_falso !== undefined)?.si_falso;
    if (porDefecto === a.target)
      agregar(
        a.source,
        a.target,
        "condicional",
        { senal: SENAL_POR_DEFECTO, operador: "=", valor: true },
        "-defecto",
      );
  }

  return {
    contrato_version: "0.3.0",
    gramatica_id: e.gramatica.id,
    gramatica_version: e.gramatica.version,
    sujeto_id: e.sujeto_id,
    sujeto_nombre: e.sujeto_nombre,
    version: e.version,
    fecha_actualizacion: e.fecha,
    estado: "aprobada",
    bloques: [],
    nodos,
    flujos,
    recorridos: [],
  };
}

/** Terminales del dibujo: a quién sigue el inicio y quién llega al fin. */
export function terminales(grafo: GrafoParaMapa): {
  inicio: string[];
  fin: string[];
} {
  return {
    inicio: grafo.aristas
      .filter((a) => a.source === INICIO)
      .map((a) => idDeMapa(a.target)),
    fin: grafo.aristas
      .filter((a) => a.target === FIN)
      .map((a) => idDeMapa(a.source)),
  };
}
