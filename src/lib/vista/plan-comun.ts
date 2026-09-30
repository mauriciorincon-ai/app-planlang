/**
 * Cómo se leen los elementos del plan frente al informe, en P2 Plan y en P3 Agente: la prioridad de acción efectiva
 * (en barras y en palabras, con el control legal cuando lo sube), y el estado que midió el verificador para cada
 * riesgo, supuesto o criterio, con la clase con que se dibuja.
 */
import type { Idioma } from "@core/formatos/bilingue";
import {
  CONTROL_LEGAL,
  ESTADO_CRITERIO,
  ESTADO_RIESGO,
  ESTADO_SUPUESTO,
  PRIORIDAD_ACCION,
  TABLA,
} from "@/textos/plan-comun";

export type ClaseDeEstado = "cumple" | "alerta" | "no-cumple" | "beta";
export interface EstadoMedido {
  texto: string;
  clase: ClaseDeEstado;
}

/** Lo que el informe dice de un riesgo y que la vitrina lee (instrumentos-de-plan 0.2.0). */
export interface RiesgoDelInforme {
  estado: string;
  prioridad_de_accion: string;
  prioridad_de_tabla: string;
  control_legal?: boolean;
  rpn: number;
}

const BARRAS: Record<string, number> = { baja: 1, media: 2, alta: 3 };
const RANGO: Record<string, number> = { alta: 3, media: 2, baja: 1 };

/** Prioridad de acción efectiva: barras llenas (1–3) y «AP alta». */
export function prioridad(
  ri: RiesgoDelInforme | undefined,
  i: Idioma,
): { barras: number; texto: string } {
  const p = ri?.prioridad_de_accion ?? "";
  return { barras: BARRAS[p] ?? 0, texto: PRIORIDAD_ACCION[p]?.[i] ?? "" };
}

/** Orden de prioridad (mayor primero) para ordenar riesgos. */
export function rangoDePrioridad(ri: RiesgoDelInforme | undefined): number {
  return RANGO[ri?.prioridad_de_accion ?? ""] ?? 0;
}

/**
 * El control legal, cuando lo hay: «control legal (tabla: baja)» si subió la prioridad de la tabla; «control
 * legal» si no la cambió; null sin control legal.
 */
export function controlLegal(
  ri: RiesgoDelInforme | undefined,
  i: Idioma,
): string | null {
  if (!ri?.control_legal) return null;
  if (ri.prioridad_de_tabla === ri.prioridad_de_accion) return CONTROL_LEGAL[i];
  const tabla = PRIORIDAD_ACCION[ri.prioridad_de_tabla]?.[i].replace(
    /^AP /,
    "",
  );
  return `${CONTROL_LEGAL[i]} (${TABLA[i]}: ${tabla})`;
}

export function estadoDeRiesgo(
  estado: string | undefined,
  i: Idioma,
): EstadoMedido {
  return {
    texto: (ESTADO_RIESGO[estado ?? ""] ?? ESTADO_RIESGO.indeterminado!)[i],
    clase:
      estado === "no_ocurrio"
        ? "cumple"
        : estado === "ocurrio"
          ? "no-cumple"
          : "alerta",
  };
}

export function estadoDeSupuesto(
  estado: string | undefined,
  i: Idioma,
): EstadoMedido {
  return {
    texto: (ESTADO_SUPUESTO[estado ?? ""] ?? ESTADO_SUPUESTO.sin_probar!)[i],
    clase:
      estado === "confirmado"
        ? "cumple"
        : estado === "refutado"
          ? "no-cumple"
          : "beta",
  };
}

export function estadoDeCriterio(
  estado: string | undefined,
  i: Idioma,
): EstadoMedido {
  return {
    texto: (ESTADO_CRITERIO[estado ?? ""] ?? ESTADO_CRITERIO.indeterminado!)[i],
    clase:
      estado === "cumple"
        ? "cumple"
        : estado === "incumple"
          ? "no-cumple"
          : "alerta",
  };
}
