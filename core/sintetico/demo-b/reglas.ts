/**
 * Las reglas deterministas del demo B que también aplica el agente (RF-04b.3): inconsistencias documentales
 * (RI-xx), puntaje de riesgo (RP-xx) y la propuesta (RD-xx). El generador las usa para derivar la verdad conocida y
 * el agente las aplica en Python (`agents/src/app_agents/demo_b/reglas.py`); la suite de Python recalcula la verdad
 * de cada caso versionado y exige los mismos números (gate de contrato, regla 19 del kit).
 *
 * RP-04 en código: el puntaje lee actividad, jurisdicción de los fondos e ingresos. Jamás el nombre, la
 * nacionalidad, el año de nacimiento ni nada que identifique a la persona (decisión D4; prueba de permutación).
 */
import type { CamposB, ListasB, Nivel } from "./esquema";
import { normalizarNombre } from "./similitud";

/** Campos exigidos: si falta uno, es una inconsistencia (RI-01). Los titulares citados no lo son. */
export const CAMPOS_EXIGIDOS = [
  "nombre",
  "documento",
  "nacimiento",
  "nacionalidad",
  "actividad",
  "ingresos_mensuales",
  "jurisdiccion_fondos",
] as const satisfies readonly (keyof CamposB)[];

export interface Inconsistencia {
  regla: "RI-01" | "RI-02" | "RI-03";
  campo: keyof CamposB;
}

export function inconsistencias(c: CamposB): Inconsistencia[] {
  const salida: Inconsistencia[] = [];
  for (const k of CAMPOS_EXIGIDOS)
    if (c[k] === null) salida.push({ regla: "RI-01", campo: k });
  if (
    c.titular_actividad !== null &&
    c.documento !== null &&
    c.titular_actividad !== c.documento
  )
    salida.push({ regla: "RI-02", campo: "titular_actividad" });
  if (
    c.titular_fondos !== null &&
    c.nombre !== null &&
    normalizarNombre(c.titular_fondos) !== normalizarNombre(c.nombre)
  )
    salida.push({ regla: "RI-03", campo: "titular_fondos" });
  return salida;
}

/** ¿Se puede verificar la identidad? No, si un documento cita a otro titular (RI-02 o RI-03). */
export const identidadVerificable = (c: CamposB): boolean =>
  !inconsistencias(c).some((i) => i.regla !== "RI-01");

export interface Componente {
  regla: "RP-01" | "RP-02" | "RP-03";
  factor: "actividad" | "jurisdiccion" | "coherencia";
  valor: string | null;
  nivel: Nivel | "coherente" | "incoherente" | "sin_dato";
  puntos: number;
}

export function puntaje(
  c: CamposB,
  m: Pick<ListasB, "actividades" | "jurisdicciones" | "puntaje">,
): { total: number; componentes: Componente[] } {
  const act = m.actividades.find((a) => a.codigo === c.actividad) ?? null;
  const jur =
    m.jurisdicciones.find((j) => j.codigo === c.jurisdiccion_fondos) ?? null;
  const nAct = act ? act.riesgo : "sin_dato";
  const nJur = jur ? jur.riesgo : "sin_dato";
  const coh =
    act === null || c.ingresos_mensuales === null
      ? "sin_dato"
      : c.ingresos_mensuales >= act.ingreso_tipico.min &&
          c.ingresos_mensuales <= act.ingreso_tipico.max
        ? "coherente"
        : "incoherente";
  const componentes: Componente[] = [
    {
      regla: "RP-01",
      factor: "actividad",
      valor: c.actividad,
      nivel: nAct,
      puntos: m.puntaje.actividad[nAct],
    },
    {
      regla: "RP-02",
      factor: "jurisdiccion",
      valor: c.jurisdiccion_fondos,
      nivel: nJur,
      puntos: m.puntaje.jurisdiccion[nJur],
    },
    {
      regla: "RP-03",
      factor: "coherencia",
      valor:
        c.ingresos_mensuales === null ? null : String(c.ingresos_mensuales),
      nivel: coh,
      puntos: m.puntaje.coherencia[coh],
    },
  ];
  return {
    total: componentes.reduce((s, x) => s + x.puntos, 0),
    componentes,
  };
}
