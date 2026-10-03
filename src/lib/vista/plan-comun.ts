/**
 * Cómo se leen los elementos del plan frente al informe, en P2 Plan y en P3 Agente: la prioridad de acción efectiva
 * (en barras y en palabras, con el control legal cuando lo sube), y el estado que midió el verificador para cada
 * riesgo, supuesto o criterio, con la clase con que se dibuja.
 */
import type { Idioma } from "@core/formatos/bilingue";
import {
  CONTROL_LEGAL,
  CRITICIDAD,
  ESTADO_CRITERIO,
  ESTADO_CRITERIO_INFORME,
  ESTADO_RIESGO,
  ESTADO_SUPUESTO,
  PRIORIDAD_ACCION,
  TABLA,
} from "@/textos/plan-comun";
import { delVocabulario } from "./vocabulario";

/**
 * Renglones que se ven de entrada en cada lista larga (las secciones de P2, las trazas de cada nodo de P3); el resto
 * va tras «Ver N más» (maqueta: 5 decisiones, 5 riesgos, 5 criterios, 5 trazas). Es un parámetro de lectura, no del
 * dato: la lista muestra todos los que haya (C-4).
 */
export const VISIBLES = 5;

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
  // Sin informe del riesgo no hay prioridad que dibujar; una prioridad que el vocabulario no conoce detiene el build.
  if (!ri) return { barras: 0, texto: "" };
  const p = ri.prioridad_de_accion;
  const donde = "PRIORIDAD_ACCION (src/textos/plan-comun.ts)";
  return {
    barras: delVocabulario(BARRAS, p, donde),
    texto: delVocabulario(PRIORIDAD_ACCION, p, donde)[i],
  };
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
  const tabla = delVocabulario(
    PRIORIDAD_ACCION,
    ri.prioridad_de_tabla,
    "PRIORIDAD_ACCION (src/textos/plan-comun.ts)",
  )[i].replace(/^AP /, "");
  return `${CONTROL_LEGAL[i]} (${TABLA[i]}: ${tabla})`;
}

export function estadoDeRiesgo(
  estado: string | undefined,
  i: Idioma,
): EstadoMedido {
  return {
    texto: delVocabulario(
      ESTADO_RIESGO,
      estado ?? "indeterminado",
      "ESTADO_RIESGO (src/textos/plan-comun.ts)",
    )[i],
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
    texto: delVocabulario(
      ESTADO_SUPUESTO,
      estado ?? "sin_probar",
      "ESTADO_SUPUESTO (src/textos/plan-comun.ts)",
    )[i],
    clase:
      estado === "confirmado"
        ? "cumple"
        : estado === "refutado"
          ? "no-cumple"
          : "beta",
  };
}

/** «criticidad alta» / «high criticality»; una criticidad sin su nombre detiene el build. */
export function criticidadEnTexto(criticidad: string, i: Idioma): string {
  const t = CRITICIDAD[criticidad];
  if (!t)
    throw new Error(
      `vitrina: la criticidad «${criticidad}» no tiene nombre en src/textos/plan-comun.ts`,
    );
  return t[i];
}

export function estadoDeCriterio(
  estado: string | undefined,
  i: Idioma,
  /** «corrida» (Plan, Agente: «Cumplió») o «informe» (Brecha: «Cumple»), como sus maquetas. */
  voz: "corrida" | "informe" = "corrida",
): EstadoMedido {
  const m = voz === "informe" ? ESTADO_CRITERIO_INFORME : ESTADO_CRITERIO;
  return {
    texto: delVocabulario(
      m,
      estado ?? "indeterminado",
      "ESTADO_CRITERIO (src/textos/plan-comun.ts)",
    )[i],
    clase:
      estado === "cumple"
        ? "cumple"
        : estado === "incumple"
          ? "no-cumple"
          : "alerta",
  };
}

/**
 * La pausa humana que dibuja la vitrina: el plan declara una (el nodo `interrupt` del demo A) y cada caso pausa a lo
 * sumo una vez. Con más de una, la página no muestra la primera y calla las demás: se detiene nombrándolo (C-7).
 */
export function pausaUnica<T>(
  pausas: readonly T[],
  donde: string,
): T | undefined {
  if (pausas.length > 1)
    throw new Error(
      `vitrina: ${donde} trae ${pausas.length} pausas humanas y la página dibuja una; hace falta su presentación.`,
    );
  return pausas[0];
}

/** La pausa del plan, que la regla dura 4 exige: sin ella, ni una página. */
export function pausaDelPlan<T>(pausas: readonly T[]): T {
  const p = pausaUnica(pausas, "el contrato de grafo del plan");
  if (p === undefined)
    throw new Error(
      "vitrina: el contrato de grafo no declara pausa humana (regla dura 4): la vitrina no lo publica.",
    );
  return p;
}
