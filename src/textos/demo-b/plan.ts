/**
 * La copia propia del demo B en P2 Plan: cada criterio en palabras llanas (las plantillas `{plan:…}` se resuelven
 * contra el plan B).
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

/** El criterio del plan B en palabras llanas; una prueba exige una frase por criterio del plan. */
export const CRITERIO_LIDER_B: Record<string, TextoBilingue> = {
  C1: tb(
    "Toda coincidencia con una lista pasa por el oficial.",
    "Every match with a list goes to the officer.",
  ),
  C2: tb(
    "Nada que el puntaje marque de riesgo alto se aprueba solo, y nada se rechaza sin el oficial.",
    "Nothing the score marks high-risk is approved alone, and nothing is rejected without the officer.",
  ),
  C3: tb(
    "Cada conclusión del expediente cita su regla o su coincidencia.",
    "Every conclusion in the file cites its rule or its match.",
  ),
  C4: tb(
    "Al menos {plan:C4.objetivo|%} % de los homónimos se resuelven bien.",
    "At least {plan:C4.objetivo|%}% of look-alike names are resolved correctly.",
  ),
  C5: tb(
    "El agente lee bien los documentos en al menos {plan:C5.objetivo|%} % de los casos.",
    "The agent reads the documents correctly in at least {plan:C5.objetivo|%}% of cases.",
  ),
  C6: tb(
    "Una instrucción escondida en un documento no logra nada.",
    "An instruction hidden in a document achieves nothing.",
  ),
};

/**
 * Cómo se nombra cada regla del plan B en una frase (`{plan:lista.<nodo>}`), por su categoría; `{u}` es el umbral que
 * lee la regla.
 */
export const NOMBRE_DE_REGLA_B: Record<string, TextoBilingue> = {
  carga: tb("instrucción escondida", "hidden instruction"),
  zonaGris: tb("zona gris desde {u}", "gray zone from {u}"),
  coincidencia: tb("similitud desde {u}", "similarity from {u}"),
  mismaPersona: tb(
    "el investigador concluye «misma persona»",
    "the investigator concludes “same person”",
  ),
  riesgo: tb("riesgo desde {u}", "risk from {u}"),
  inconsistencias: tb("inconsistencias sobre {u}", "inconsistencies above {u}"),
  rechazar: tb("propuesta de rechazar", "a proposal to reject"),
};

/** A dónde manda una regla del plan B, en una frase (`{plan:destinos.<nodo>}`). */
export const NODO_DESTINO_B: Record<string, TextoBilingue> = {
  extractor: tb("extractor", "extractor"),
  verificador_listas: tb("verificador de listas", "list checker"),
  investigador: tb("investigador de contexto", "context investigator"),
  puntaje: tb("puntaje", "scoring"),
  decision: tb("decisión", "decision"),
  pausa_humana: tb("una persona", "a person"),
  redactor: tb("redactor", "writer"),
  guardia_salida: tb("guardia de salida", "output guard"),
};
