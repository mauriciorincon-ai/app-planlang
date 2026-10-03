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

/** En el informe (P4 Brecha) el criterio se lee en presente, como su veredicto: «Cumple», «No cumple». */
export const ESTADO_CRITERIO_INFORME: Record<string, TextoBilingue> = {
  ...ESTADO_CRITERIO,
  cumple: tb("Cumple", "Meets"),
  incumple: tb("No cumple", "Does not meet"),
};

export const ESTADO_RIESGO: Record<string, TextoBilingue> = {
  ocurrio: tb("Ocurrió", "Occurred"),
  no_ocurrio: tb("No ocurrió", "Did not occur"),
  indeterminado: tb("Indeterminado", "Undetermined"),
  sin_poblacion: tb("Sin casos que lo prueben", "No case tests it"),
  no_detectable: tb("No detectable en trazas", "Not detectable in traces"),
  mal_formado: tb("Detector mal formado", "Malformed detector"),
};

/** La criticidad de un supuesto, en una sola palabra con su nombre (P2 Plan y P4 Brecha). */
export const CRITICIDAD: Record<string, TextoBilingue> = {
  alta: tb("criticidad alta", "high criticality"),
  media: tb("criticidad media", "medium criticality"),
  baja: tb("criticidad baja", "low criticality"),
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

/**
 * Cómo se nombra cada regla del plan dentro de una frase, por su categoría (`src/lib/vista/motivo-pausa.ts`); `{u}`
 * es el id del umbral que lee, si lee uno. Con estos nombres, `{plan:lista.<nodo>}` enumera las reglas de un nodo
 * en el orden del plan (AU-S2-3).
 */
export const NOMBRE_DE_REGLA: Record<string, TextoBilingue> = {
  urgencia: tb("urgencia", "emergency"),
  exento: tb("servicio exento", "exempt service"),
  faltantes: tb("faltan datos", "missing data"),
  proveedor: tb("el modelo no respondió", "the model did not respond"),
  tope: tb("tope de aclaraciones {u}", "clarification cap {u}"),
  confianza: tb("confianza bajo {u}", "confidence below {u}"),
  altoCosto: tb("costo sobre {u}", "cost above {u}"),
  contradiccion: tb("contradicción", "contradiction"),
  negar: tb("propuesta de negar", "a proposal to deny"),
  texas: tb("modo Texas", "Texas mode"),
};

/** Los números pequeños en palabras, para las plantillas `{plan:…|palabra}` (más allá de diez, en cifras). */
export const NUMERO_EN_PALABRAS: Readonly<Record<number, TextoBilingue>> = {
  1: tb("una", "one"),
  2: tb("dos", "two"),
  3: tb("tres", "three"),
  4: tb("cuatro", "four"),
  5: tb("cinco", "five"),
  6: tb("seis", "six"),
  7: tb("siete", "seven"),
  8: tb("ocho", "eight"),
  9: tb("nueve", "nine"),
  10: tb("diez", "ten"),
};

/** Cómo se nombra un nodo como destino de una regla dentro de una frase (`{plan:destinos.<nodo>}`). */
export const NODO_EN_FRASE: Record<string, TextoBilingue> = {
  enrutador: tb("enrutador", "router"),
  extractor: tb("extractor", "extractor"),
  aclaracion: tb("aclaración", "clarification"),
  verificador_cobertura: tb("verificador de cobertura", "coverage checker"),
  decision: tb("decisión", "decision"),
  pausa_humana: tb("una persona", "a person"),
  redactor: tb("redactor", "writer"),
  guardia_salida: tb("guardia de salida", "output guard"),
};
