/**
 * Evaluación de una regla del plan (población + condición) sobre los casos de una corrida. Es el motor
 * común de criterios, detectores de riesgo, supuestos y evaluadores: todos se escriben en el plan con
 * el mismo mini-lenguaje y se miden igual.
 *
 * Por caso:
 * - la población es verdadera → el caso entra; falsa → fuera; una señal NULA → «no aplica» (fuera, y se
 *   cuenta aparte para que el informe lo diga); una señal FALTANTE → el caso entra como no evaluable;
 * - la condición es verdadera / falsa; nula o faltante → no evaluable (jamás cumple por omisión);
 * - una comparación de estructuras distintas marca la REGLA como mal formada (error del plan).
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { JsonValor } from "../formatos/jcs";
import {
  ErrorComparacionSospechosa,
  ErrorEvaluacion,
  ErrorIdentificador,
  ErrorNulo,
  evaluar,
  parsear,
  type Contexto,
} from "./condiciones";
import type { VistaEvaluable } from "./contexto";

export interface NoEvaluable {
  caso_id: string;
  motivo: TextoBilingue;
}

export interface EvaluacionDeRegla {
  poblacion: string[];
  fuera_por_senal_nula: string[];
  verdaderos: string[];
  falsos: string[];
  no_evaluables: NoEvaluable[];
  mal_formada: TextoBilingue | null;
}

class ReglaMalFormada extends Error {
  constructor(public readonly motivo: TextoBilingue) {
    super(motivo.es);
  }
}

export function motivoDeError(e: ErrorEvaluacion): TextoBilingue {
  if (e instanceof ErrorNulo)
    return {
      es: "señal nula: el paso que la escribe no corrió en este caso",
      en: "null signal: the step that writes it did not run in this case",
    };
  if (e instanceof ErrorIdentificador)
    return {
      es: `falta la señal «${e.ruta}» en la traza`,
      en: `the «${e.ruta}» signal is missing from the trace`,
    };
  return {
    es: "la regla no se pudo evaluar con los valores de este caso (tipos incompatibles)",
    en: "the rule could not be evaluated with this case's values (incompatible types)",
  };
}

function malFormada(e: ErrorComparacionSospechosa): TextoBilingue {
  const izq = e.clavesIzq || "un valor que no es objeto";
  const der = e.clavesDer || "un valor que no es objeto";
  const izqEn = e.clavesIzq || "a value that is not an object";
  const derEn = e.clavesDer || "a value that is not an object";
  return {
    es: `la regla compara estructuras que nunca pueden ser iguales ({${izq}} frente a {${der}}): mide siempre «distinto»`,
    en: `the rule compares structures that can never be equal ({${izqEn}} versus {${derEn}}): it always measures “different”`,
  };
}

function booleanoDe(v: JsonValor): boolean {
  if (v === null) throw new ErrorNulo("la regla vale null");
  if (typeof v !== "boolean")
    throw new ErrorEvaluacion("la regla no produjo un booleano");
  return v;
}

type Resultado =
  | { tipo: "valor"; valor: boolean }
  | { tipo: "nulo"; error: ErrorNulo }
  | { tipo: "error"; error: ErrorEvaluacion };

function probar(nodo: ReturnType<typeof parsear>, ctx: Contexto): Resultado {
  try {
    return { tipo: "valor", valor: booleanoDe(evaluar(nodo, ctx)) };
  } catch (e) {
    if (e instanceof ErrorComparacionSospechosa)
      throw new ReglaMalFormada(malFormada(e));
    if (e instanceof ErrorNulo) return { tipo: "nulo", error: e };
    if (e instanceof ErrorEvaluacion) return { tipo: "error", error: e };
    throw e;
  }
}

/** Evalúa `poblacion` y, si existe, `condicion` sobre cada vista. */
export function evaluarRegla(
  poblacion: string,
  condicion: string | undefined,
  vistas: readonly VistaEvaluable[],
): EvaluacionDeRegla {
  const salida: EvaluacionDeRegla = {
    poblacion: [],
    fuera_por_senal_nula: [],
    verdaderos: [],
    falsos: [],
    no_evaluables: [],
    mal_formada: null,
  };
  const pob = parsear(poblacion);
  const cond = condicion === undefined ? null : parsear(condicion);
  try {
    for (const v of vistas) {
      const p = probar(pob, v.ctx);
      if (p.tipo === "nulo") {
        salida.fuera_por_senal_nula.push(v.caso_id);
        continue;
      }
      if (p.tipo === "valor" && !p.valor) continue;
      salida.poblacion.push(v.caso_id);
      if (p.tipo === "error") {
        salida.no_evaluables.push({
          caso_id: v.caso_id,
          motivo: motivoDeError(p.error),
        });
        continue;
      }
      if (!cond) continue;
      const c = probar(cond, v.ctx);
      if (c.tipo === "valor")
        (c.valor ? salida.verdaderos : salida.falsos).push(v.caso_id);
      else
        salida.no_evaluables.push({
          caso_id: v.caso_id,
          motivo: motivoDeError(c.error),
        });
    }
  } catch (e) {
    if (!(e instanceof ReglaMalFormada)) throw e;
    return {
      poblacion: [],
      fuera_por_senal_nula: [],
      verdaderos: [],
      falsos: [],
      no_evaluables: [],
      mal_formada: e.motivo,
    };
  }
  return salida;
}

/** Los valores numéricos de una métrica sobre los casos de la población (null o faltante → no evaluable). */
export function valoresDeMetrica(
  metrica: string,
  poblacion: readonly string[],
  vistas: readonly VistaEvaluable[],
): {
  valores: { caso_id: string; valor: number }[];
  no_evaluables: NoEvaluable[];
} {
  const nodo = parsear(metrica);
  const dentro = new Set(poblacion);
  const valores: { caso_id: string; valor: number }[] = [];
  const no_evaluables: NoEvaluable[] = [];
  for (const v of vistas) {
    if (!dentro.has(v.caso_id)) continue;
    try {
      const x = evaluar(nodo, v.ctx);
      if (typeof x === "number") valores.push({ caso_id: v.caso_id, valor: x });
      else if (x === null)
        no_evaluables.push({
          caso_id: v.caso_id,
          motivo: motivoDeError(new ErrorNulo(metrica)),
        });
      else
        no_evaluables.push({
          caso_id: v.caso_id,
          motivo: motivoDeError(new ErrorEvaluacion(metrica)),
        });
    } catch (e) {
      if (!(e instanceof ErrorEvaluacion)) throw e;
      no_evaluables.push({ caso_id: v.caso_id, motivo: motivoDeError(e) });
    }
  }
  return { valores, no_evaluables };
}
