/**
 * Cómo nombra la vitrina los estados que calcula el verificador y los atributos del plan (P2 Plan, P3 Agente,
 * P4 Brecha). Sin símbolos de texto: la marca de cada estado se DIBUJA (`Veredicto`, design-system § 5).
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

export const ESTADO_CRITERIO: Record<string, TextoBilingue> = {
  cumple: tb("Cumplió", "Met"),
  incumple: tb("No cumplió", "Not met"),
  incompleto: tb("Incompleto", "Incomplete"),
  indeterminado: tb("Indeterminado", "Undetermined"),
  sin_poblacion: tb("Sin casos que lo prueben", "No case tests it"),
  mal_formado: tb("Regla mal formada", "Malformed rule"),
};

export const ESTADO_RIESGO: Record<string, TextoBilingue> = {
  ocurrio: tb("Ocurrió", "Occurred"),
  no_ocurrio: tb("No ocurrió", "Did not occur"),
  indeterminado: tb("Indeterminado", "Undetermined"),
  sin_poblacion: tb("Sin casos que lo prueben", "No case tests it"),
  no_detectable: tb("No detectable en trazas", "Not detectable in traces"),
  mal_formado: tb("Detector mal formado", "Malformed detector"),
};

export const ESTADO_SUPUESTO: Record<string, TextoBilingue> = {
  confirmado: tb("Confirmado", "Confirmed"),
  refutado: tb("Refutado", "Refuted"),
  sin_probar: tb("Sin probar", "Untested"),
};

/** Prioridad de acción AIAG-VDA (instrumentos-de-plan 0.2.0): «AP alta». */
export const PRIORIDAD_ACCION: Record<string, TextoBilingue> = {
  alta: tb("AP alta", "AP high"),
  media: tb("AP media", "AP medium"),
  baja: tb("AP baja", "AP low"),
};

export const CONTROL_LEGAL = tb("control legal", "legal control");

/** El valor de un umbral booleano y el lado inclusivo de su comparación. */
export const ENCENDIDO = tb("encendido", "on");
export const APAGADO = tb("apagado", "off");
export const INCLUSIVO = tb("inclusivo", "inclusive");
export const TABLA = tb("tabla", "table");

export const REVERSIBILIDAD: Record<string, TextoBilingue> = {
  una_via: tb("Una vía", "One-way"),
  dos_vias: tb("Dos vías", "Two-way"),
  costosa: tb("Costosa", "Costly"),
};
