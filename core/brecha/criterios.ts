/**
 * Criterios de aceptación (RF-06.2): cada uno se mide con SU regla de medición y SU población, tal como
 * los escribió el plan. Estados honestos:
 * - `cumple` / `incumple`;
 * - `incompleto`: una tasa `pass^k` medida con menos corridas de las exigidas (k_observado < k) que aún
 *   no falla — como pass^k no crece con k, si la tasa observada ya está bajo el objetivo es `incumple`;
 * - `indeterminado`: nada falló pero hay casos que no se pudieron evaluar;
 * - `sin_poblacion`: ningún caso del lote cae en la población: no se midió (y se dice);
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
  k: { requerido: number; observado: number; aplica_a: string | null } | null;
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
  if (agregado === null || typeof c.valor_objetivo !== "number") return salida;
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
  if (salida.casos_que_incumplen.length > 0)
    salida.nota = {
      es: "El criterio se mide sobre el agregado; los casos listados superan el objetivo uno a uno.",
      en: "The criterion is measured on the aggregate; the listed cases exceed the target one by one.",
    };
  return salida;
}

/** Evalúa todos los criterios del plan. `repeticiones`: vistas de las otras corridas del mismo lote (pass^k). */
export function evaluarCriterios(
  plan: Plan,
  vistas: readonly VistaDeCaso[],
  repeticiones: readonly (readonly VistaDeCaso[])[] = [],
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
      salida.k = { requerido: k, observado, aplica_a: r.k_aplica_a ?? null };
      salida.valor_medido = redondear(valor);
      salida.casos_que_incumplen = ev.poblacion.filter(
        (id) => !pasan.includes(id),
      );
      const objetivo = Number(c.valor_objetivo);
      salida.estado =
        valor < objetivo ? "incumple" : observado < k ? "incompleto" : "cumple";
      if (salida.estado === "incompleto")
        salida.nota = {
          es: `Medido con ${observado} de ${k} corridas exigidas: todavía no puede declararse cumplido.`,
          en: `Measured with ${observado} of the ${k} required runs: it cannot be declared met yet.`,
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
