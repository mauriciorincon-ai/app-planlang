import { tb } from "@core/formatos/bilingue";

/**
 * La pantalla «Comparar dos corridas» (S4, `/[idioma]/comparar`). Dos registros: el líder lee la conclusión; el experto
 * lee la medida y la regla. Lo que dicen los números lo calcula el núcleo; aquí solo van las palabras.
 */
export const TITULO_PAGINA = tb("Comparar dos corridas", "Compare two runs");
export const DESCRIPCION_PAGINA = tb(
  "La corrida multiagente y su línea base de agente único, sobre los mismos casos: criterio por criterio, riesgo por riesgo y caso por caso.",
  "The multi-agent run and its single-agent baseline, on the same cases: criterion by criterion, risk by risk and case by case.",
);

export const PORTADA = {
  antetitulo: tb(
    "Demo A · la decisión de dos vías",
    "Demo A · the two-route decision",
  ),
  titulo: tb("Comparar dos corridas", "Compare two runs"),
  intro: tb(
    "Las dos corridas usan el mismo plan, los mismos casos y las mismas semillas. Lo único que cambia es la arquitectura: un enrutador con agentes especialistas frente a un solo agente.",
    "Both runs use the same plan, the same cases and the same seeds. Only the architecture changes: a router with specialist agents against a single agent.",
  ),
};

export const ENLACE = {
  entrada: tb("Comparar", "Compare"),
  brecha: tb("Comparar las dos corridas", "Compare the two runs"),
};

export const SECCIONES = {
  veredicto: tb("Veredicto y criterios", "Verdict and criteria"),
  riesgos: tb("Riesgos y pausas", "Risks and pauses"),
  casos: tb(
    "Decisiones y casos que difieren",
    "Decisions and cases that differ",
  ),
};

/**
 * El líder: una frase por sección, con su presupuesto (≤ 50 palabras, ≤ 1 término definido). Las que dependen de los
 * datos son funciones: lo que dicen sale de la comparación, nunca de un texto fijo (regla 9).
 */
export const LIDER = {
  veredictoIguales: tb(
    "Las dos corridas cumplen los mismos criterios y riesgos.",
    "Both runs meet the same criteria and risks.",
  ),
  veredictoSeparan: (ids: string) =>
    tb(
      `Lo que las separa: ${ids}.`,
      `What separates them: ${ids}.`,
    ),
  pausasMasEnBase: (base: number, multi: number) =>
    tb(
      `El agente único pausa ${base} casos que no lo pedían; la multiagente, ${multi}.`,
      `The single agent pauses ${base} cases that did not need it; the multi-agent run, ${multi}.`,
    ),
  pausasMasEnMulti: (base: number, multi: number) =>
    tb(
      `La multiagente pausa ${multi} casos que no lo pedían; el agente único, ${base}.`,
      `The multi-agent run pauses ${multi} cases that did not need it; the single agent, ${base}.`,
    ),
  casos: tb(
    "Estos son los casos donde las dos corridas hacen cosas distintas. Cada uno tiene su página propia cuando la tiene.",
    "These are the cases where the two runs act differently. Each one has its own page when it has one.",
  ),
};

/** El experto: la regla de cada sección, en una frase. */
export const EXPERTO = {
  riesgos: tb(
    "Un riesgo ocurre cuando su tasa cruza el umbral del plan. Los casos marcados no bastan: deciden la tasa y el umbral.",
    "A risk occurs when its rate crosses the plan's threshold. Flagged cases are not enough: the rate and the threshold decide.",
  ),
  casos: tb(
    "Un caso difiere si cambia la decisión final o la pausa. La exactitud de la regla S3 exige decisión y pausa a la vez.",
    "A case differs if the final decision or the pause changes. The S3 accuracy rule requires decision and pause together.",
  ),
};

export const LADOS = {
  multiagente: tb("Multiagente", "Multi-agent"),
  agente_unico: tb("Agente único", "Single agent"),
};

export const METRICAS = {
  exactitud: tb("Exactitud (regla S3)", "Accuracy (rule S3)"),
  latencia: tb("Latencia mediana", "Median latency"),
  costo: tb("Costo nominal (US$)", "Nominal cost (US$)"),
  llamadas: tb("Llamadas al modelo", "Model calls"),
  decisiones: tb("Decisiones correctas", "Correct decisions"),
  propuestaAusente: tb("Sin propuesta", "No proposal"),
};

export const PAUSAS = {
  titulo: tb("Pausas frente a la verdad", "Pauses against the truth"),
  necesaria: tb(
    "Necesarias (el caso debía escalar)",
    "Needed (the case had to escalate)",
  ),
  innecesaria: tb(
    "Innecesarias (no debían escalar)",
    "Unneeded (should not escalate)",
  ),
  omitida: tb(
    "Omitidas (debían escalar y no se pausaron)",
    "Missed (had to escalate, not paused)",
  ),
  sinPausaCorrecta: tb("Bien sin pausa", "Correctly unpaused"),
};

export const VEREDICTO = {
  cumple: tb("Cumple", "Meets"),
  cumple_con_alertas: tb("Cumple con alertas", "Meets with alerts"),
  no_cumple: tb("No cumple", "Does not meet"),
};

export const ESTADO_CRITERIO = {
  cumple: tb("Cumple", "Met"),
  incumple: tb("No cumple", "Not met"),
  incompleto: tb("Incompleto", "Incomplete"),
  indeterminado: tb("No observado", "Not observed"),
  sin_poblacion: tb("Sin casos", "No cases"),
  mal_formado: tb("Mal formado", "Malformed"),
};

export const ESTADO_RIESGO = {
  ocurrio: tb("Ocurrió", "Occurred"),
  no_ocurrio: tb("No ocurrió", "Did not occur"),
  indeterminado: tb("No observado", "Not observed"),
  sin_poblacion: tb("Sin casos", "No cases"),
  no_detectable: tb("No detectable", "Not detectable"),
  mal_formado: tb("Mal formado", "Malformed"),
};

export const DECISION = {
  aprobar: tb("Aprobar", "Approve"),
  aprobar_parcial: tb("Aprobar en parte", "Approve in part"),
  negar: tb("Negar", "Deny"),
};

export const ETIQUETA = {
  criterio: tb("Criterio", "Criterion"),
  riesgo: tb("Riesgo", "Risk"),
  caso: tb("Caso", "Case"),
  verdad: tb("Verdad", "Truth"),
  decision: tb("Decisión", "Decision"),
  pausa: tb("Pausa", "Pause"),
  medida: tb("Medida", "Measure"),
  objetivo: tb("Objetivo", "Target"),
  ocurrencia: tb("Ocurrencia", "Occurrence"),
  umbral: tb("Umbral del plan", "Plan threshold"),
  pagina: tb("Página", "Page"),
  si: tb("Sí", "Yes"),
  no: tb("No", "No"),
  sinPagina: tb("Sin página propia", "No page of its own"),
  noObservado: tb("No observado", "Not observed"),
  debeEscalar: tb("Debía escalar", "Had to escalate"),
  noDebeEscalar: tb("No debía escalar", "Did not have to escalate"),
  sinPropuesta: tb("Sin propuesta", "No proposal"),
  correctas: tb("correctas", "correct"),
  de: tb("de", "of"),
  casos: tb("casos", "cases"),
  criteriosCumplidos: tb("criterios cumplidos", "criteria met"),
  riesgosOcurridos: tb("riesgos ocurridos", "risks occurred"),
};

export const AVISO = {
  revisor: tb(
    "El revisor simulado sigue la verdad conocida del lote: por eso las decisiones finales coinciden casi siempre. Lo que las separa es la pausa.",
    "The simulated reviewer follows the batch's known truth: that is why final decisions almost always match. What separates them is the pause.",
  ),
  costo: tb(
    "El costo es nominal: lo que costarían las llamadas a precio de API. Aquí se paga con la suscripción.",
    "The cost is nominal: what the calls would cost at API prices. Here it is paid through the subscription.",
  ),
  alcance: tb(
    "El veredicto de cada lado mira solo criterios y riesgos. El contrato de grafo y los supuestos son del informe de la corrida principal.",
    "Each side's verdict looks only at criteria and risks. The graph contract and assumptions belong to the main run's report.",
  ),
  noPublicada: tb(
    "La comparación de esta corrida todavía no está publicada.",
    "The comparison for this run is not published yet.",
  ),
};
