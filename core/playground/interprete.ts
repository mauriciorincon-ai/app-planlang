/**
 * Intérprete mínimo de las aristas del plan — el lado TypeScript de RF-09.2 (regla dura 2).
 *
 * Misma semántica que `agents/src/app_agents/reglas_arista.py`; la CI compara ambos sobre toda corrida
 * versionada (`tests/unit/core/playground/rf-09-2.test.ts`): con los umbrales del plan, el recálculo
 * debe reproducir la rama que tomó el agente y la huella de `ramas-esperadas.json` que escribió Python.
 *
 * - `igual_a` / `distinto_de`: igualdad ESTRICTA de tipo (`true` no es `1`); ignoran `inclusivo`.
 * - `menor_que` / `mayor_que`: estrictos; con `inclusivo: true` pasan a `<=` / `>=`.
 * - `menor_o_igual_que` / `mayor_o_igual_que`: siempre inclusivos.
 * - Orden solo entre números; una señal ausente es error, jamás `false`.
 * - `valor` literal o `umbral.Ux`, resuelto con los umbrales aplicados de la corrida.
 */
import { conHuella } from "../formatos/huella";
import { jcs, type JsonValor } from "../formatos/jcs";
import {
  FORMATO_RAMAS,
  type DecisionDeArista,
  type RamasEsperadas,
  type Traza,
  type Visita,
} from "../formatos/traza";
import type { AristaCondicional } from "../plan/esquema";
import {
  compararCadenas,
  recalcularVisita,
  senalesDeVisita,
  type Umbrales,
} from "./aristas";

// La evaluación pura vive en `aristas.ts` (la comparte el playground en el navegador, sin Zod); aquí se re-exporta
// para que RF-09.2, el verificador y sus pruebas sigan importando desde el intérprete.
export {
  comparar,
  compararCadenas,
  decidir,
  ErrorArista,
  evaluarArista,
  FUNCIONES,
  recalcularVisita,
  resolverValor,
  senalesDeVisita,
  type RegistroDeArista,
  type Senales,
  type Umbrales,
} from "./aristas";

export type VisitaRecalculada = Omit<Visita, "caso_id">;

/** Agrupa los registros por visita `(paso, desde)`, en el orden en que Python las ordena. */
export function agruparVisitas(
  decisiones: readonly DecisionDeArista[],
): { paso: number; desde: string; registros: DecisionDeArista[] }[] {
  const mapa = new Map<
    string,
    { paso: number; desde: string; registros: DecisionDeArista[] }
  >();
  for (const d of decisiones) {
    const clave = `${d.paso}\u0000${d.desde}`;
    const v = mapa.get(clave) ?? {
      paso: d.paso,
      desde: d.desde,
      registros: [],
    };
    v.registros.push(d);
    mapa.set(clave, v);
  }
  return [...mapa.values()].sort(
    (a, b) => a.paso - b.paso || compararCadenas(a.desde, b.desde),
  );
}

/**
 * Recalcula cada visita de nodo escritor desde lo observado y con los umbrales dados. `ligaduras`
 * (`señal → id de umbral`) nombra las señales que SON un umbral (un interruptor como el modo Texas): al
 * recalcular, su valor registrado se reemplaza por el del umbral aplicado. Sin ligaduras (RF-09.2) el
 * recálculo usa exactamente lo registrado.
 */
export function recalcular(
  decisiones: readonly DecisionDeArista[],
  aristas: readonly AristaCondicional[],
  ramasPorDefecto: Readonly<Record<string, string>>,
  umbrales: Umbrales,
  ligaduras: Readonly<Record<string, string>> = {},
): VisitaRecalculada[] {
  return agruparVisitas(decisiones).map(({ paso, desde, registros }) => {
    const { rama, registros: nuevos } = recalcularVisita(
      desde,
      senalesDeVisita(registros),
      aristas,
      ramasPorDefecto,
      umbrales,
      ligaduras,
    );
    return {
      desde,
      paso,
      rama_tomada: rama,
      resultados: nuevos.map((r) => r.resultado),
    };
  });
}

/** El mismo objeto que escribe Python en `ramas-esperadas.json`, calculado aquí (misma huella = mismo resultado). */
export async function ramasEsperadas(
  corridaId: string,
  trazas: readonly Traza[],
  grafo: {
    aristas_condicionales: readonly AristaCondicional[];
    ramas_por_defecto: Readonly<Record<string, string>>;
  },
  umbrales: Umbrales,
  fuente: string,
): Promise<RamasEsperadas> {
  const visitas: Visita[] = [];
  const ordenadas = [...trazas].sort((a, b) =>
    compararCadenas(a.caso_id, b.caso_id),
  );
  for (const t of ordenadas)
    for (const v of recalcular(
      t.decisiones_de_arista,
      grafo.aristas_condicionales,
      grafo.ramas_por_defecto,
      umbrales,
    ))
      visitas.push({ caso_id: t.caso_id, ...v });
  const objeto = {
    formato: FORMATO_RAMAS,
    corrida_id: corridaId,
    fuente,
    umbrales_aplicados: umbrales,
    visitas,
  };
  return (await conHuella(
    objeto as unknown as Record<string, JsonValor>,
  )) as unknown as RamasEsperadas;
}

export interface DiscrepanciaDeRama {
  caso_id: string;
  paso: number;
  desde: string;
  registrada: string;
  recalculada: string;
  resultados_registrados: boolean[];
  resultados_recalculados: boolean[];
}

/** RF-09.2 contra lo que el agente REGISTRÓ: cada visita recalculada debe dar la misma rama y los mismos resultados. */
export function discrepanciasDeRamas(
  trazas: readonly Traza[],
  grafo: {
    aristas_condicionales: readonly AristaCondicional[];
    ramas_por_defecto: Readonly<Record<string, string>>;
  },
  umbrales: Umbrales,
): DiscrepanciaDeRama[] {
  const salida: DiscrepanciaDeRama[] = [];
  for (const t of trazas) {
    const recalculadas = recalcular(
      t.decisiones_de_arista,
      grafo.aristas_condicionales,
      grafo.ramas_por_defecto,
      umbrales,
    );
    const registradas = agruparVisitas(t.decisiones_de_arista);
    recalculadas.forEach((r, i) => {
      const reg = registradas[i] as (typeof registradas)[number];
      const ordenados = [...reg.registros].sort(
        (a, b) => a.orden_arista - b.orden_arista,
      );
      const rama = (ordenados[0] as DecisionDeArista).rama_tomada;
      const resultados = ordenados.map((d) => d.resultado);
      if (
        rama !== r.rama_tomada ||
        jcs(resultados) !== jcs(r.resultados) ||
        ordenados.some((d) => d.rama_tomada !== rama)
      )
        salida.push({
          caso_id: t.caso_id,
          paso: r.paso,
          desde: r.desde,
          registrada: rama,
          recalculada: r.rama_tomada,
          resultados_registrados: resultados,
          resultados_recalculados: r.resultados,
        });
    });
  }
  return salida;
}
