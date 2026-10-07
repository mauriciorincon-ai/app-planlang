/**
 * Criterios de aceptación (RF-06.2): cada uno se mide con SU regla de medición y SU población, tal como
 * los escribió el plan. Estados honestos:
 * - `cumple` / `incumple`;
 * - `incompleto`: una tasa `pass^k` medida con menos corridas de las exigidas (k_observado < k) que aún
 *   no falla — como pass^k no crece con k, si la tasa observada ya está bajo el objetivo es `incumple`;
 * - `indeterminado`: nada falló pero hay casos que no se pudieron evaluar;
 * - `sin_poblacion`: ningún caso del lote cae en la población: no se midió (y se dice); con casos en la población
 *   pero ningún valor de su métrica, `indeterminado` (M-26);
 * - `mal_formado`: la regla del plan no puede medir lo que dice (error del plan, no del agente).
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { Criterio, Plan } from "../plan/esquema";
import type { VistaDeCaso } from "./contexto";
import { maximo, mediana, promedio, redondear } from "./numeros";
import {
  evaluarRegla,
  valoresDeMetrica,
  type EvaluacionDeRegla,
  type NoEvaluable,
} from "./reglas";

export const ESTADOS_CRITERIO = [
  "cumple",
  "incumple",
  "incompleto",
  "indeterminado",
  "sin_poblacion",
  "mal_formado",
] as const;
export type EstadoCriterio = (typeof ESTADOS_CRITERIO)[number];

export interface ResultadoCriterio {
  id: string;
  enunciado: TextoBilingue;
  tipo: Criterio["tipo"];
  agregacion: Criterio["regla_de_medicion"]["agregacion"];
  poblacion: string;
  condicion: string | null;
  metrica: string | null;
  n_poblacion: number;
  fuera_por_senal_nula: number;
  valor_medido: number | boolean | null;
  objetivo: number | boolean;
  estado: EstadoCriterio;
  casos_que_incumplen: string[];
  no_evaluables: NoEvaluable[];
  /**
   * `pass^k`: las corridas que pide la regla y las que hubo. `aplica` es falso cuando la regla limita k a otro tamaño de
   * lote (`k_aplica_a: "lote_demo_20"`) y este lote no lo tiene: el criterio se mide en una corrida (S3, AU-S3 C5).
   */
  k: {
    requerido: number;
    observado: number;
    aplica_a: string | null;
    aplica: boolean;
  } | null;
  nota: TextoBilingue | null;
}

function base(c: Criterio, ev: EvaluacionDeRegla | null): ResultadoCriterio {
  const r = c.regla_de_medicion;
  return {
    id: c.id,
    enunciado: c.enunciado,
    tipo: c.tipo,
    agregacion: r.agregacion,
    poblacion: r.poblacion,
    condicion: r.condicion ?? null,
    metrica: r.metrica ?? null,
    n_poblacion: ev?.poblacion.length ?? 0,
    fuera_por_senal_nula: ev?.fuera_por_senal_nula.length ?? 0,
    valor_medido: null,
    objetivo: c.valor_objetivo,
    estado: "sin_poblacion",
    casos_que_incumplen: [],
    no_evaluables: ev?.no_evaluables ?? [],
    k: null,
    nota: null,
  };
}

const MENOR_ES_MEJOR = new Set(["latencia", "costo"]);

function porMetrica(
  c: Criterio,
  ev: EvaluacionDeRegla,
  vistas: readonly VistaDeCaso[],
): ResultadoCriterio {
  const r = c.regla_de_medicion;
  const salida = base(c, ev);
  const { valores, no_evaluables } = valoresDeMetrica(
    r.metrica as string,
    ev.poblacion,
    vistas,
  );
  salida.no_evaluables = [...ev.no_evaluables, ...no_evaluables];
  const xs = valores.map((v) => v.valor);
  const agregado =
    r.agregacion === "mediana"
      ? mediana(xs)
      : r.agregacion === "promedio"
        ? promedio(xs)
        : maximo(xs);
  // M-26: una población con casos pero sin un solo valor medido no es «sin población»: es indeterminado.
  if (agregado === null) {
    if (ev.poblacion.length > 0) salida.estado = "indeterminado";
    return salida;
  }
  if (typeof c.valor_objetivo !== "number") return salida;
  const objetivo = c.valor_objetivo;
  const menor = MENOR_ES_MEJOR.has(c.tipo);
  const bien = (x: number) => (menor ? x <= objetivo : x >= objetivo);
  salida.valor_medido = redondear(agregado, 3);
  salida.casos_que_incumplen = valores
    .filter((v) => !bien(v.valor))
    .map((v) => v.caso_id);
  salida.estado = !bien(agregado)
    ? "incumple"
    : salida.no_evaluables.length > 0
      ? "indeterminado"
      : "cumple";
  // M-26: la nota dice el sentido del objetivo (una latencia lo supera; una exactitud queda por debajo).
  if (salida.casos_que_incumplen.length > 0)
    salida.nota = menor
      ? {
          es: "El criterio se mide sobre el agregado; los casos listados superan el objetivo uno a uno.",
          en: "The criterion is measured on the aggregate; the listed cases exceed the target one by one.",
        }
      : {
          es: "El criterio se mide sobre el agregado; los casos listados quedan por debajo del objetivo uno a uno.",
          en: "The criterion is measured on the aggregate; the listed cases fall below the target one by one.",
        };
  return salida;
}

/**
 * El tamaño de lote al que la regla limita su k (`k_aplica_a`): `lote_demo_<n>` → n; sin campo, `null` (k rige en
 * todo lote); un valor que el verificador no sabe leer, `undefined` (el criterio queda mal formado, con su nombre).
 */
export function loteDeK(
  aplicaA: string | undefined,
): number | null | undefined {
  if (aplicaA === undefined) return null;
  const m = /^lote_demo_(\d+)$/.exec(aplicaA);
  return m ? Number(m[1]) : undefined;
}

/**
 * Evalúa todos los criterios del plan. `repeticiones`: vistas de las otras corridas del mismo lote (pass^k).
 * `nLote`: los casos del lote de esta corrida, para la regla que limita su k a un tamaño de lote.
 */
export function evaluarCriterios(
  plan: Plan,
  vistas: readonly VistaDeCaso[],
  repeticiones: readonly (readonly VistaDeCaso[])[] = [],
  nLote: number | null = null,
): ResultadoCriterio[] {
  return plan.criterios_aceptacion.map((c) => {
    const r = c.regla_de_medicion;
    const ev = evaluarRegla(r.poblacion, r.condicion, vistas);
    if (ev.mal_formada) {
      const s = base(c, null);
      s.estado = "mal_formado";
      s.nota = ev.mal_formada;
      return s;
    }
    if (r.metrica) return porMetrica(c, ev, vistas);
    const salida = base(c, ev);
    const n = ev.poblacion.length;
    if (n === 0) return salida;

    if (r.agregacion === "pass^k") {
      const lote = loteDeK(r.k_aplica_a);
      if (lote === undefined) {
        const s = base(c, null);
        s.estado = "mal_formado";
        s.nota = {
          es: `k_aplica_a «${r.k_aplica_a}» no es un tamaño de lote que el verificador sepa leer (lote_demo_<n>).`,
          en: `k_aplica_a «${r.k_aplica_a}» is not a batch size the verifier can read (lote_demo_<n>).`,
        };
        return s;
      }
      // k rige si la regla no la limita, si este lote tiene el tamaño al que la limita, o si no se sabe el tamaño del
      // lote: sin esa prueba no se declara cumplido con menos corridas (regla dura 9).
      const aplica = lote === null || nLote === null || nLote === lote;
      const evs = repeticiones.map((vs) =>
        evaluarRegla(r.poblacion, r.condicion, vs),
      );
      // Una repetición que no pudo medir no cuenta como «pasó» (AU-7): el criterio queda mal formado.
      const rota = evs.findIndex((e) => e.mal_formada);
      if (rota >= 0) {
        const s = base(c, null);
        s.estado = "mal_formado";
        const motivo = evs[rota]!.mal_formada!;
        s.nota = {
          es: `Repetición ${rota + 2}: ${motivo.es}`,
          en: `Repetition ${rota + 2}: ${motivo.en}`,
        };
        return s;
      }
      const otras = evs.map((e) => new Set(e.verdaderos));
      const pasan = ev.verdaderos.filter((id) => otras.every((s) => s.has(id)));
      const valor = pasan.length / n;
      const k = r.k ?? 1;
      const observado = 1 + repeticiones.length;
      salida.k = {
        requerido: k,
        observado,
        aplica_a: r.k_aplica_a ?? null,
        aplica,
      };
      salida.valor_medido = redondear(valor);
      salida.casos_que_incumplen = ev.poblacion.filter(
        (id) => !pasan.includes(id),
      );
      const objetivo = Number(c.valor_objetivo);
      salida.estado =
        valor < objetivo
          ? "incumple"
          : aplica && observado < k
            ? "incompleto"
            : "cumple";
      if (salida.estado === "incompleto")
        salida.nota = {
          es: `Medido con ${observado} de ${k} corridas exigidas: todavía no puede declararse cumplido.`,
          en: `Measured with ${observado} of the ${k} required runs: it cannot be declared met yet.`,
        };
      else if (!aplica && k > 1)
        salida.nota = {
          es: `El plan exige ${k} corridas solo en lotes de ${lote} casos (k_aplica_a: ${r.k_aplica_a}); este lote tiene ${nLote} casos y se mide en ${observado === 1 ? "una corrida" : `${observado} corridas`}.`,
          en: `The plan requires ${k} runs only in batches of ${lote} cases (k_aplica_a: ${r.k_aplica_a}); this batch has ${nLote} cases and is measured in ${observado === 1 ? "one run" : `${observado} runs`}.`,
        };
      return salida;
    }

    if (r.agregacion === "tasa") {
      const valor = ev.verdaderos.length / n;
      salida.valor_medido = redondear(valor);
      salida.casos_que_incumplen = ev.poblacion.filter(
        (id) => !ev.verdaderos.includes(id),
      );
      salida.estado = valor >= Number(c.valor_objetivo) ? "cumple" : "incumple";
      return salida;
    }

    // todos_cumplen
    salida.casos_que_incumplen = ev.falsos;
    salida.valor_medido =
      ev.falsos.length === 0 && ev.no_evaluables.length === 0;
    salida.estado =
      ev.falsos.length > 0
        ? "incumple"
        : ev.no_evaluables.length > 0
          ? "indeterminado"
          : "cumple";
    return salida;
  });
}
