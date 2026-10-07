/**
 * Arma el compacto del playground (`compacto.ts`) desde la corrida VERIFICADA, en el build. Lee el plan, el grafo
 * compilado, las trazas y el lote; jamás un modelo.
 *
 * Lo delicado es medir los criterios en un camino que el agente NO tomó. Ahí se sabe:
 * - lo del caso sintético (tipo, subtipo, verdad conocida) y los umbrales del plan (la promesa con que se mide);
 * - si el camino cambia en la ÚLTIMA visita escritora del caso: todo lo que el agente observó antes de decidir
 *   (las señales que leen las aristas del plan y la extracción);
 * - si cambia ANTES: solo las señales que observaron las visitas hasta ese punto (lo de después no ocurrió);
 * - y del desenlace, solo lo que el plan fija: a una persona → hubo pausa y, en lote, el revisor simulado decide lo
 *   que dice la verdad conocida (DA-04); solo → no hubo pausa y sale la propuesta del agente.
 * Todo lo demás del desenlace (la respuesta, el documento, lo que vio el revisor, la latencia) no está en ninguna
 * traza: la regla que lo lee queda «no evaluable» en ese caso, y el criterio lo dice.
 */
import type { JsonValor } from "../formatos/jcs";
import type { CorridaLeida } from "../brecha/lector";
import type { Informe } from "../brecha/informe";
import { contextoDeObjeto, objetoDeCaso } from "../brecha/contexto";
import { evaluarRegla, valoresDeMetrica } from "../brecha/reglas";
import {
  esAristaTripleta,
  type AristaCondicional,
  type Plan,
} from "../plan/esquema";
import {
  ligadurasDeUmbrales,
  umbralesAplicados,
} from "../plan/contrato-constructor";
import {
  casosPorId,
  type CasoDeDemo as Caso,
  type LoteDeDemo as Lote,
} from "../sintetico/de-demo";
import { agruparVisitas, senalesDeVisita } from "./interprete";
import {
  type CasoCompacto,
  type Compacto,
  type CriterioCompacto,
  type Desenlace,
  type Evaluacion,
  type OpcionesDeDemo,
  type Resultado,
  type VisitaCompacta,
} from "./compacto";

/** Claves del contexto que son del caso sintético o de la medición, no del camino. */
export const CLAVES_DEL_CASO = [
  "todos",
  "caso",
  "tipo",
  "subtipo",
  "adversario_detalle",
  "verdad_conocida",
  "umbral",
] as const;

/** Claves que produce el desenlace del caso o que suman su recorrido entero (`planlang-trace/v1`). */
export const CLAVES_DEL_DESENLACE = [
  "pausa_humana",
  "decision_final",
  "nodos_visitados",
  "severidad_accion",
  "latencia_total_s",
  "tokens",
  "error_proveedor",
  "error_de_esquema_en_traspaso",
  "salida_final",
  "documento_adverso",
  "interrupt_payload",
] as const;

/** Las señales que leen las aristas del plan: por la regla dura 3, están en el estado ANTES de enrutar. */
export function senalesQueLeenLasAristas(
  aristas: readonly AristaCondicional[],
): string[] {
  const s = new Set<string>();
  for (const a of aristas)
    if (esAristaTripleta(a)) s.add(a.senal);
    else for (const e of a.funcion.entradas) s.add(e);
  return [...s].sort();
}

/** Nodos escritores cuyas aristas leen un umbral (`umbral.Ux`) o una señal ligada a un umbral. */
export function nodosJugables(
  aristas: readonly AristaCondicional[],
  ligaduras: Readonly<Record<string, string>>,
): string[] {
  const ligadas = new Set(Object.keys(ligaduras));
  const s = new Set<string>();
  for (const a of aristas) {
    const lee = esAristaTripleta(a)
      ? (typeof a.valor === "string" && a.valor.startsWith("umbral.")) ||
        ligadas.has(a.senal)
      : a.funcion.entradas.some((e) => ligadas.has(e));
    if (lee) s.add(a.desde);
  }
  return [...s].sort();
}

/**
 * El desenlace de llegar a `nodo`: a una persona si pasa por un nodo de pausa; solo si sigue sin más decisiones
 * hasta el final; «no observado» si llega a otro nodo que decide (lo que habría decidido no está en la traza).
 */
export function desenlaceDeNodo(
  nodo: string,
  aristasLangGraph: readonly { source: string; target: string }[],
  pausas: ReadonlySet<string>,
  escritores: ReadonlySet<string>,
): Desenlace {
  const vistos = new Set<string>();
  let actual = nodo;
  for (;;) {
    if (pausas.has(actual)) return "persona";
    if (actual === "__end__") return "solo";
    if (escritores.has(actual) || vistos.has(actual)) return "no_observado";
    vistos.add(actual);
    const salidas = aristasLangGraph.filter((e) => e.source === actual);
    if (salidas.length !== 1) return "no_observado";
    actual = (salidas[0] as { target: string }).target;
  }
}

function resultadoDe(
  ev: ReturnType<typeof evaluarRegla>,
  conCondicion: boolean,
): Resultado {
  if (ev.fuera_por_senal_nula.length > 0) return "nulo";
  if (ev.poblacion.length === 0) return "fuera";
  if (ev.no_evaluables.length > 0) return "ne";
  if (!conCondicion) return "v";
  return ev.verdaderos.length > 0 ? "v" : "f";
}

function evaluar(
  plan: Plan,
  caso: Caso,
  objeto: Record<string, JsonValor>,
): Evaluacion[] {
  const vista = { caso_id: caso.id, ctx: contextoDeObjeto(caso, objeto) };
  return plan.criterios_aceptacion.map((c) => {
    const r = c.regla_de_medicion;
    const ev = evaluarRegla(r.poblacion, r.condicion, [vista]);
    if (ev.mal_formada) return { r: "ne" };
    const resultado = resultadoDe(ev, r.condicion !== undefined);
    if (!r.metrica) return { r: resultado };
    // Como el verificador (`porMetrica`), la métrica se toma de todo caso de la población, cumpla o no la condición
    // y aunque no se pueda evaluar: solo queda fuera lo que está fuera de la población (AU-S2-B53).
    if (resultado === "fuera" || resultado === "nulo")
      return { r: resultado, m: null };
    const { valores } = valoresDeMetrica(r.metrica, ev.poblacion, [vista]);
    return { r: resultado, m: valores[0]?.valor ?? null };
  });
}

/** El objeto de contexto del caso si el camino cambia en la visita `i` y lleva a `desenlace`. */
export function objetoEnOtroCamino(
  registrado: Record<string, JsonValor>,
  caso: Caso,
  visitas: readonly VisitaCompacta[],
  i: number,
  desenlace: Desenlace,
  previas: ReadonlySet<string>,
  senalPropuesta: string,
): Record<string, JsonValor> {
  const objeto: Record<string, JsonValor> = {};
  for (const k of CLAVES_DEL_CASO) objeto[k] = registrado[k] as JsonValor;
  if (i === visitas.length - 1) {
    for (const k of previas)
      if (Object.hasOwn(registrado, k)) objeto[k] = registrado[k] as JsonValor;
  } else {
    for (const v of visitas.slice(0, i + 1)) Object.assign(objeto, v.senales);
  }
  if (desenlace === "persona") {
    objeto.pausa_humana = true;
    objeto.decision_final = caso.verdad_conocida.decision;
  } else if (desenlace === "solo") {
    objeto.pausa_humana = false;
    const propuesta = objeto[senalPropuesta];
    if (typeof propuesta === "string") objeto.decision_final = propuesta;
  }
  return objeto;
}

function clasificarClaves(
  objeto: Record<string, JsonValor>,
  previas: ReadonlySet<string>,
  desenlaceDelDemo: readonly string[],
  casoId: string,
): void {
  const conocidas = new Set<string>([
    ...CLAVES_DEL_CASO,
    ...CLAVES_DEL_DESENLACE,
    ...desenlaceDelDemo,
    ...previas,
  ]);
  const sueltas = Object.keys(objeto).filter((k) => !conocidas.has(k));
  if (sueltas.length > 0)
    throw new Error(
      `playground: ${casoId} trae ${sueltas.join(", ")}, que el playground no sabe si se conoce antes de decidir o es parte del desenlace; clasifícala en el manifiesto del demo (claves_previas o claves_del_desenlace).`,
    );
}

/**
 * El costo humano por caso que el plan declara en sus umbrales: `null` si no declara ninguno (el playground no lo
 * inventa); si declara varios distintos, el playground no sabe a cuál atribuir y lo dice.
 */
export function minutosPorPersona(plan: Plan): number | null {
  const costos = [
    ...new Set(plan.umbrales.map((u) => u.costo_humano_por_caso_min)),
  ].filter((c): c is number => typeof c === "number");
  if (costos.length === 0) return null;
  if (costos.length > 1)
    throw new Error(
      `playground: el plan declara varios costos humanos por caso en sus umbrales (${costos.join(", ")}); el playground suma uno solo.`,
    );
  return costos[0] as number;
}

export function compactar(
  plan: Plan,
  corrida: CorridaLeida,
  lote: Lote,
  informe: Informe,
  demo: OpcionesDeDemo,
): Compacto {
  const grafo = corrida.grafo;
  const ligaduras = ligadurasDeUmbrales(plan);
  const umbralesPlan = umbralesAplicados(plan);
  const aristas = grafo.aristas_condicionales;
  const jugables = nodosJugables(aristas, ligaduras);
  const previas = new Set<string>([
    ...senalesQueLeenLasAristas(aristas),
    ...demo.claves_previas,
  ]);
  const escritores = new Set<string>([
    ...Object.keys(grafo.ramas_por_defecto),
    ...aristas.map((a) => a.desde),
  ]);
  const pausas = new Set(grafo.pausas_humanas.map((p) => p.nodo));
  const edges = (grafo.langgraph.edges as { source: string; target: string }[])
    .filter((e) => typeof e.source === "string")
    .map((e) => ({ source: e.source, target: e.target }));

  const desenlace_de_rama: Record<string, Desenlace> = {};
  for (const nodo of jugables) {
    const destinos = [
      ...aristas
        .filter((a) => a.desde === nodo)
        .flatMap((a) => [a.si_verdadero, a.si_falso ?? null]),
      grafo.ramas_por_defecto[nodo] ?? null,
    ].filter((d): d is string => d !== null);
    for (const d of destinos)
      desenlace_de_rama[d] = desenlaceDeNodo(d, edges, pausas, escritores);
  }

  const casosDelLote = casosPorId(lote);
  const casos: CasoCompacto[] = corrida.trazas.map((traza) => {
    const caso = casosDelLote.get(traza.caso_id);
    if (!caso)
      throw new Error(`playground: ${traza.caso_id} no está en el lote.`);
    const visitas: VisitaCompacta[] = agruparVisitas(
      traza.decisiones_de_arista,
    ).map(({ paso, desde, registros }) => ({
      paso,
      desde,
      senales: senalesDeVisita(registros),
      rama: (registros[0] as { rama_tomada: string }).rama_tomada,
    }));
    const objeto = objetoDeCaso(caso, traza, umbralesPlan);
    clasificarClaves(
      objeto,
      previas,
      demo.claves_del_desenlace ?? [],
      caso.id,
    );
    const caminos: Record<string, Evaluacion[]> = {};
    visitas.forEach((v, i) => {
      if (!jugables.includes(v.desde)) return;
      const posibles = new Set(
        Object.entries(desenlace_de_rama)
          .filter(([nodo]) =>
            [
              ...aristas
                .filter((a) => a.desde === v.desde)
                .flatMap((a) => [a.si_verdadero, a.si_falso]),
              grafo.ramas_por_defecto[v.desde],
            ].includes(nodo),
          )
          .map(([, d]) => d),
      );
      for (const d of [...posibles].sort())
        caminos[`${i}:${d}`] = evaluar(
          plan,
          caso,
          objetoEnOtroCamino(
            objeto,
            caso,
            visitas,
            i,
            d,
            previas,
            demo.senal_propuesta,
          ),
        );
    });
    const senales_de_umbral: Record<string, JsonValor> = {};
    for (const u of plan.umbrales)
      if (Object.hasOwn(traza.senales, u.senal))
        senales_de_umbral[u.id] = traza.senales[u.senal] as JsonValor;
    return {
      id: caso.id,
      subtipo: caso.subtipo,
      debe_escalar: caso.verdad_conocida.debe_escalar,
      registrado: traza.pausas_humanas.length > 0 ? "persona" : "solo",
      senales_de_umbral,
      visitas,
      evaluaciones: { registrado: evaluar(plan, caso, objeto), caminos },
    };
  });

  const criterios: CriterioCompacto[] = plan.criterios_aceptacion.map((c) => {
    const delInforme = informe.criterios.find((x) => x.id === c.id);
    if (!delInforme)
      throw new Error(`playground: el informe no trae el criterio ${c.id}.`);
    return {
      id: c.id,
      agregacion: c.regla_de_medicion.agregacion,
      tipo: c.tipo,
      objetivo: c.valor_objetivo,
      con_metrica: c.regla_de_medicion.metrica !== undefined,
      estado_informe: delInforme.estado,
      valor_informe: delInforme.valor_medido,
    };
  });

  return {
    corrida_id: corrida.manifiesto.corrida_id,
    umbrales: plan.umbrales.map((u) => ({
      id: u.id,
      senal: u.senal,
      valor_en_plan: u.valor_en_plan,
      rango:
        "min" in u.rango_jugable
          ? {
              min: u.rango_jugable.min,
              max: u.rango_jugable.max,
              paso: u.rango_jugable.paso,
            }
          : "booleano",
    })),
    aristas: [...aristas],
    ramas_por_defecto: { ...grafo.ramas_por_defecto },
    ligaduras,
    nodos_jugables: jugables,
    desenlace_de_rama,
    minutos_por_persona: minutosPorPersona(plan),
    propuesta: {
      senal: demo.senal_propuesta,
      favorable: demo.valor_favorable,
      // Solo si el demo la declara: sin ella, el compacto conserva sus bytes.
      ...(demo.parcial ? { parcial: { ...demo.parcial } } : {}),
    },
    casos,
    criterios,
  };
}
