/**
 * Detectores de riesgo (RF-06.3): cada modo de falla del plan trae su detector en trazas (población +
 * condición + «ocurre si»). Se aplica tal cual y se reporta si ocurrió y en qué casos, con la prioridad
 * de acción AIAG-VDA del reusable `instrumentos-de-plan` (RPN solo secundario): la efectiva, que sube a
 * `alta` si el modo tiene control legal, y la de tabla al lado (contrato v0.2.0, G8).
 */
import { prioridades, rpn } from "../../packages/instrumentos-de-plan/src";
import { comoBilingue, type TextoBilingue } from "../formatos/bilingue";
import type { ModoDeFalla, Plan } from "../plan/esquema";
import type { VistaEvaluable } from "./contexto";
import { redondear } from "./numeros";
import { evaluarRegla, type NoEvaluable } from "./reglas";

export const ESTADOS_RIESGO = [
  "ocurrio",
  "no_ocurrio",
  "indeterminado",
  "sin_poblacion",
  "no_detectable",
  "mal_formado",
] as const;
export type EstadoRiesgo = (typeof ESTADOS_RIESGO)[number];

export interface ResultadoRiesgo {
  id: string;
  modo: TextoBilingue;
  decision_id: string | null;
  severidad: number;
  ocurrencia: number;
  deteccion: number;
  /** Efectiva: `alta` si el modo tiene control legal; si no, la de la tabla. */
  prioridad_de_accion: "alta" | "media" | "baja";
  prioridad_de_tabla: "alta" | "media" | "baja";
  control_legal: boolean;
  rpn: number;
  mitigaciones_declaradas: number;
  tipo_detector: "conteo" | "tasa" | null;
  /** `caso`: `casos` son ids de caso · `sesion`: `casos` son `sesion-N` del manifiesto (M-14). */
  ambito: "caso" | "sesion";
  n_poblacion: number;
  fuera_por_senal_nula: number;
  valor: number | null;
  ocurre_si: string | null;
  casos: string[];
  no_evaluables: NoEvaluable[];
  estado: EstadoRiesgo;
  nota: TextoBilingue | null;
}

export type OperadorDisparador = ">=" | "<=" | "==" | ">" | "<";

/** «> 0.10» → { op: ">", n: 0.1 }. */
export function partirDisparador(ocurreSi: string): {
  op: OperadorDisparador;
  n: number;
} {
  const m = /^(>=|<=|==|>|<)\s*(-?[0-9]+(?:\.[0-9]+)?)$/.exec(ocurreSi.trim());
  if (!m) throw new RangeError(`ocurre_si no interpretable: ${ocurreSi}`);
  return { op: m[1] as OperadorDisparador, n: Number(m[2]) };
}

/** «> 0.10» → ¿el valor cumple el disparador? */
export function disparador(ocurreSi: string, valor: number): boolean {
  const { op, n } = partirDisparador(ocurreSi);
  switch (op) {
    case ">":
      return valor > n;
    case ">=":
      return valor >= n;
    case "<":
      return valor < n;
    case "<=":
      return valor <= n;
    default:
      return valor === n;
  }
}

function evaluarRiesgo(
  r: ModoDeFalla,
  vistas: readonly VistaEvaluable[],
  sesiones: readonly VistaEvaluable[],
): ResultadoRiesgo {
  const salida: ResultadoRiesgo = {
    id: r.id,
    modo: r.modo,
    decision_id: r.decision_id ?? null,
    severidad: r.severidad,
    ocurrencia: r.ocurrencia,
    deteccion: r.deteccion,
    ...prioridades(r),
    rpn: rpn(r),
    mitigaciones_declaradas: r.mitigaciones.length,
    tipo_detector: r.detector_en_trazas?.tipo ?? null,
    ambito: r.detector_en_trazas?.ambito ?? "caso",
    n_poblacion: 0,
    fuera_por_senal_nula: 0,
    valor: null,
    ocurre_si: r.detector_en_trazas?.ocurre_si ?? null,
    casos: [],
    no_evaluables: [],
    estado: "no_detectable",
    nota: null,
  };
  const d = r.detector_en_trazas;
  if (!d) {
    salida.nota = r.no_detectable_en_trazas
      ? comoBilingue(r.no_detectable_en_trazas)
      : null;
    return salida;
  }
  const ev = evaluarRegla(
    d.poblacion,
    d.condicion,
    salida.ambito === "sesion" ? sesiones : vistas,
  );
  if (ev.mal_formada) {
    salida.estado = "mal_formado";
    salida.nota = ev.mal_formada;
    return salida;
  }
  salida.n_poblacion = ev.poblacion.length;
  salida.fuera_por_senal_nula = ev.fuera_por_senal_nula.length;
  salida.casos = ev.verdaderos;
  salida.no_evaluables = ev.no_evaluables;
  if (ev.poblacion.length === 0) {
    salida.estado = "sin_poblacion";
    return salida;
  }
  const valor =
    d.tipo === "conteo"
      ? ev.verdaderos.length
      : redondear(ev.verdaderos.length / ev.poblacion.length);
  salida.valor = valor;
  salida.estado = disparador(d.ocurre_si, valor)
    ? "ocurrio"
    : ev.no_evaluables.length > 0
      ? "indeterminado"
      : "no_ocurrio";
  return salida;
}

export function evaluarRiesgos(
  plan: Plan,
  vistas: readonly VistaEvaluable[],
  sesiones: readonly VistaEvaluable[] = [],
): ResultadoRiesgo[] {
  return plan.riesgos.map((r) => evaluarRiesgo(r, vistas, sesiones));
}
