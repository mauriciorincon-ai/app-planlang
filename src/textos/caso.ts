/**
 * Textos de P6 Caso (maqueta `docs/diseno/06-caso.html`, aprobada en la mirada 4 de la Etapa de Diseño). La copia
 * es la aprobada; lo que cambia de un caso a otro (qué pidió, qué hizo cada nodo, por qué tomó cada rama, el relato)
 * se ARMA aquí con plantillas desde la traza: ningún caso lleva texto escrito a mano.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = ((id: string) =>
  tb(`Caso ${id} · planlang`, `Case ${id} · planlang`)) as Plantilla<string>;
export const TITULO_INDICE = tb("Los casos · planlang", "The cases · planlang");
export const DESCRIPCION_PAGINA: Record<IdDemo, TextoBilingue> = {
  "demo-a": tb(
    "Un caso del demo A de punta a punta: lo que recibió el agente, cada paso con la señal que dejó, la persona que decidió y lo que respondió. Simulación · no operativo.",
    "One demo A case end to end: what the agent received, every step with the signal it left, the person who decided and what it answered. Simulation · not operational.",
  ),
  "demo-b": tb(
    "Un caso del demo B de punta a punta: los documentos que recibió el agente, cada paso con la señal que dejó, el oficial que decidió y el expediente que escribió. Simulación · no operativo.",
    "One demo B case end to end: the documents the agent received, every step with the signal it left, the officer who decided and the file it wrote. Simulation · not operational.",
  ),
};

export const PORTADA = {
  antetitulo: ((p: { demo: TextoBilingue; corrida: string }) =>
    tb(
      `${p.demo.es} · corrida ${p.corrida} · una traza real`,
      `${p.demo.en} · run ${p.corrida} · one real trace`,
    )) as Plantilla<{ demo: TextoBilingue; corrida: string }>,
  antetituloIndice: ((p: { demo: TextoBilingue; corrida: string; n: number }) =>
    tb(
      `${p.demo.es} · corrida ${p.corrida} · ${p.n} trazas reales`,
      `${p.demo.en} · run ${p.corrida} · ${p.n} real traces`,
    )) as Plantilla<{ demo: TextoBilingue; corrida: string; n: number }>,
  titulo: tb("Un caso, de punta a punta", "One case, end to end"),
  guia: tb(
    "Lo que el agente recibió, cada paso que dio y la señal que dejó al elegir camino, la persona que decidió cuando hacía falta y lo que respondió, tal como quedó en su traza.",
    "What the agent received, every step it took and the signal it left when choosing a path, the person who decided when needed and what it answered, just as its trace recorded it.",
  ),
};

export const ORACULO = {
  titulo: tb(
    "Las decisiones humanas de esta corrida se simularon.",
    "This run’s human decisions were simulated.",
  ),
  texto: tb(
    "En cada pausa, un auditor simulado respondió lo que dice la verdad conocida del caso (DA-04). Casos, afiliados y plan de beneficios son sintéticos.",
    "At every pause, a simulated auditor answered what the case’s known truth says (DA-04). Cases, members and the benefits plan are synthetic.",
  ),
};

export const MIRADA = {
  titulo: tb("El caso en una mirada", "The case at a glance"),
  avisoLider: tb(
    "Ves qué pidió el médico, qué hizo cada nodo y por qué tomó cada camino, en palabras llanas.",
    "You see what the doctor asked, what each node did and why it took each path, in plain words.",
  ),
  avisoExperto: tb(
    "Cada paso suma sus tokens, milisegundos y costo; cada decisión, la tabla de aristas con la regla del plan y el valor observado; al final, la ficha técnica y las 16 señales de la traza.",
    "Each step adds its tokens, milliseconds and cost; each decision, the edge table with the plan’s rule and the observed value; at the end, the technical record and the trace’s 16 signals.",
  ),
  selector: tb("Casos", "Cases"),
  casosDeLaCorrida: ((n: number) =>
    tb(
      `Los ${n} casos de la corrida:`,
      `The run’s ${n} cases:`,
    )) as Plantilla<number>,
  indiceGuia: tb(
    "Elige un caso: se abre con todo lo que dejó su traza.",
    "Pick a case: it opens with everything its trace recorded.",
  ),
};

/** Cómo se nombra cada subtipo de caso sintético en el selector (`core/sintetico`). */
export const SUBTIPO: Record<string, TextoBilingue> = {
  normal_aprobable: tb("normal, aprobable", "normal, approvable"),
  normal_excluido: tb("normal, excluido", "normal, excluded"),
  normal_urgencia: tb("normal, urgencia", "normal, emergency"),
  normal_exento: tb("normal, exento", "normal, exempt"),
  normal_alto_costo: tb("normal, alto costo", "normal, high cost"),
  borde_costo_igual_U2: tb("borde: costo igual a U2", "edge: cost equal to U2"),
  borde_contradiccion_orden_texto: tb(
    "borde: la orden y el texto no coinciden",
    "edge: order and text do not match",
  ),
  borde_urgencia_cobertura_dudosa: tb(
    "borde: urgencia con cobertura dudosa",
    "edge: emergency with doubtful coverage",
  ),
  faltante_un_ciclo: tb("faltante: 1 aclaración", "missing: 1 clarification"),
  faltante_dos_ciclos: tb(
    "faltante: 2 aclaraciones",
    "missing: 2 clarifications",
  ),
  faltante_sin_respuesta: tb("faltante: sin respuesta", "missing: no answer"),
  adversario_inyeccion_texto_libre: tb(
    "adversario: inyección",
    "adversarial: injection",
  ),
  adversario_inyeccion_orden_adjunta: tb(
    "adversario: inyección en la orden",
    "adversarial: injection in the order",
  ),
  adversario_dato_sensible: tb(
    "adversario: dato sensible",
    "adversarial: sensitive data",
  ),
};

/** El caso ejemplar del informe que es este (`casos_ejemplares`). */
export const EJEMPLAR: Record<string, TextoBilingue> = {
  exitoso: tb(
    "caso ejemplar «exitoso» del informe",
    "the report’s “successful” example case",
  ),
  escalado_correctamente: tb(
    "caso ejemplar «escalado como debía» del informe",
    "the report’s “escalated as it should” example case",
  ),
  adversario_neutralizado: tb(
    "caso ejemplar «adversario neutralizado» del informe",
    "the report’s “adversary neutralized” example case",
  ),
  fallido: tb(
    "caso ejemplar «fallido» del informe",
    "the report’s “failed” example case",
  ),
};

export const CABECERA = {
  aprobado: tb("Aprobado", "Approved"),
  negado: tb("Negado", "Denied"),
  conPersona: tb("con una persona", "with a person"),
  sinPersona: tb("sin persona", "no person"),
  coincide: tb("coincide con la verdad conocida", "matches the known truth"),
  noCoincide: tb(
    "no coincide con la verdad conocida",
    "does not match the known truth",
  ),
  debia: tb("Lo que debía pasar", "What should happen"),
  paso: tb("Lo que pasó", "What happened"),
  pasoTexto: ((p: { decision: TextoBilingue; persona: boolean }) =>
    tb(
      `Decisión final: ${p.decision.es}, ${p.persona ? "con una persona" : "sin persona"}.`,
      `Final decision: ${p.decision.en}, ${p.persona ? "with a person" : "without a person"}.`,
    )) as Plantilla<{ decision: TextoBilingue; persona: boolean }>,
};

export const RECIBE = {
  titulo: tb("Recibe", "Takes in"),
  texto: tb("El texto del médico", "The doctor’s text"),
  inyeccion: tb("instrucción escondida", "hidden instruction"),
  orden: tb("La orden adjunta", "The attached order"),
  atencion: tb("atención", "care"),
  afiliado: ((p: { mujer: boolean; edad: number }) =>
    tb(
      `Afiliado: ${p.mujer ? "mujer" : "hombre"}, ${p.edad} años`,
      `Member: ${p.mujer ? "woman" : "man"}, ${p.edad} years old`,
    )) as Plantilla<{ mujer: boolean; edad: number }>,
  enmascarado: tb(
    "nombre, documento, historia clínica, teléfono y correo se enmascaran antes del modelo (decisión D1)",
    "name, ID, medical record, phone and email are masked before the model (decision D1)",
  ),
};

export const HACE = {
  titulo: tb("Hace", "Does"),
  pasos: ((n: number) => tb(`${n} pasos`, `${n} steps`)) as Plantilla<number>,
};

export const ENTREGA = {
  titulo: tb("Entrega", "Delivers"),
  respuesta: tb(
    "La respuesta al afiliado, con su aviso de IA",
    "The reply to the member, with its AI notice",
  ),
  documento: tb(
    "El documento de decisión adversa, en español e inglés",
    "The adverse decision document, in Spanish and English",
  ),
  traza: tb("La traza, con su huella", "The trace, with its fingerprint"),
};

/** El relato del caso: una frase por lo que ocurrió, armada desde la traza. */
export const RELATO = {
  pidio: ((p: { servicio: TextoBilingue; mujer: boolean; edad: number }) =>
    tb(
      `El médico pidió «${p.servicio.es}» para ${p.mujer ? "una mujer" : "un hombre"} de ${p.edad} años.`,
      `The doctor requested “${p.servicio.en}” for a ${p.edad}-year-old ${p.mujer ? "woman" : "man"}.`,
    )) as Plantilla<{ servicio: TextoBilingue; mujer: boolean; edad: number }>,
  urgencia: tb(
    "Era una urgencia: la ley manda autorizarla sin revisar cobertura, y el agente la llevó directo a la respuesta.",
    "It was an emergency: the law requires authorizing it without a coverage check, and the agent took it straight to the reply.",
  ),
  exento: tb(
    "El servicio está exento de autorización en el plan de beneficios, así que el agente lo llevó directo a la respuesta.",
    "The service is exempt from authorization in the benefits plan, so the agent took it straight to the reply.",
  ),
  leyo: ((p: { confianza: string; faltan: TextoBilingue | null }) =>
    p.faltan === null
      ? tb(
          `El extractor leyó los datos con confianza ${p.confianza} y no faltaba ninguno.`,
          `The extractor read the data with ${p.confianza} confidence and nothing was missing.`,
        )
      : tb(
          `La nota no decía ${p.faltan.es}: el extractor lo detectó y el agente le preguntó al médico.`,
          `The note did not state ${p.faltan.en}: the extractor caught it and the agent asked the doctor.`,
        )) as Plantilla<{ confianza: string; faltan: TextoBilingue | null }>,
  aclaro: ((p: { preguntas: number; completo: boolean; confianza: string }) =>
    p.completo
      ? tb(
          `Con ${p.preguntas === 1 ? "una respuesta" : `${p.preguntas} respuestas`} del médico, los datos quedaron completos (confianza ${p.confianza}).`,
          `After ${p.preguntas === 1 ? "one answer" : `${p.preguntas} answers`} from the doctor, the data were complete (${p.confianza} confidence).`,
        )
      : tb(
          `Tras ${p.preguntas} preguntas los datos seguían incompletos.`,
          `After ${p.preguntas} questions the data were still incomplete.`,
        )) as Plantilla<{
    preguntas: number;
    completo: boolean;
    confianza: string;
  }>,
  cobertura: ((p: {
    excluido: boolean;
    causal: string | null;
    propuesta: TextoBilingue;
  }) =>
    p.excluido
      ? tb(
          `El verificador de cobertura encontró que el servicio está excluido por ley${p.causal ? ` (causal ${p.causal} del art. 15 de la Ley 1751)` : ""} y propuso ${p.propuesta.es}.`,
          `The coverage checker found the service excluded by law${p.causal ? ` (ground ${p.causal} of art. 15 of Law 1751)` : ""} and proposed to ${p.propuesta.en}.`,
        )
      : tb(
          `El verificador de cobertura encontró el servicio cubierto y propuso ${p.propuesta.es}.`,
          `The coverage checker found the service covered and proposed to ${p.propuesta.en}.`,
        )) as Plantilla<{
    excluido: boolean;
    causal: string | null;
    propuesta: TextoBilingue;
  }>,
  aPersona: ((p: { motivo: TextoBilingue; decision: TextoBilingue }) =>
    tb(
      `${p.motivo.es.charAt(0).toUpperCase()}${p.motivo.es.slice(1)}: el caso pasó a un auditor, que decidió ${p.decision.es}.`,
      `${p.motivo.en.charAt(0).toUpperCase()}${p.motivo.en.slice(1)}: the case went to an auditor, who decided to ${p.decision.en}.`,
    )) as Plantilla<{ motivo: TextoBilingue; decision: TextoBilingue }>,
  solo: ((decision: TextoBilingue) =>
    tb(
      `Ninguna regla de escalamiento se cumplió y el agente decidió ${decision.es} solo.`,
      `No escalation rule held and the agent decided to ${decision.en} on its own.`,
    )) as Plantilla<TextoBilingue>,
  /** La guardia detectó una instrucción escondida en la entrada (`guardia_salida.carga_detectada_en_entrada`). */
  inyeccion: ((severidad: number) =>
    severidad === 0
      ? tb(
          "El texto del médico escondía una instrucción para la IA: la guardia la detectó en la entrada y no tuvo efecto, porque el texto de un caso nunca decide qué acción se ejecuta.",
          "The doctor’s text hid an instruction for the AI: the guard detected it in the input and it had no effect, because a case’s text never decides which action runs.",
        )
      : tb(
          `El texto del médico escondía una instrucción para la IA: la guardia la detectó en la entrada, pero la acción quedó con severidad ${severidad}.`,
          `The doctor’s text hid an instruction for the AI: the guard detected it in the input, but the action was left with severity ${severidad}.`,
        )) as Plantilla<number>,
  cierre: ((p: { documento: boolean; hallazgos: number }) =>
    tb(
      `El redactor escribió la respuesta con su aviso de IA${p.documento ? ", salió el documento de decisión adversa en español e inglés" : ""} y la guardia revisó la salida: ${p.hallazgos === 0 ? "no se filtró ningún dato" : `${p.hallazgos} hallazgos`}.`,
      `The writer drafted the reply with its AI notice${p.documento ? ", the adverse decision document was issued in Spanish and English" : ""} and the guard checked the output: ${p.hallazgos === 0 ? "no data leaked" : `${p.hallazgos} findings`}.`,
    )) as Plantilla<{ documento: boolean; hallazgos: number }>,
  tardo: ((s: string) =>
    tb(`Tardó ${s} s.`, `It took ${s} s.`)) as Plantilla<string>,
};

/** Cómo se nombra, en una frase, un campo de la solicitud que faltaba. */
export const CAMPO: Record<string, TextoBilingue> = {
  diagnostico: tb("el diagnóstico", "the diagnosis"),
  costo_estimado: tb("el costo", "the cost"),
  procedimiento: tb("el procedimiento", "the procedure"),
  urgencia: tb("la urgencia", "the urgency"),
};

/** Por qué pasó a una persona, en palabras llanas (la categoría de la regla que se cumplió). */
export const MOTIVO: Record<string, TextoBilingue> = {
  negar: tb(
    "la propuesta del agente era negar, y ninguna negación sale sin que una persona la revise",
    "the agent proposed to deny, and no denial goes out without a person reviewing it",
  ),
  confianza: tb(
    "la confianza de la lectura quedó bajo el umbral U1",
    "the reading’s confidence fell below threshold U1",
  ),
  altoCosto: tb(
    "el costo estimado supera el umbral de alto costo U2",
    "the estimated cost is above the high-cost threshold U2",
  ),
  contradiccion: tb(
    "la orden adjunta y el texto del médico piden procedimientos distintos",
    "the attached order and the doctor’s text ask for different procedures",
  ),
  texas: tb(
    "el modo Texas está encendido y la propuesta no es aprobar",
    "Texas mode is on and the proposal is not to approve",
  ),
  tope: tb(
    "el médico no completó los datos dentro del tope de aclaraciones U3",
    "the doctor did not complete the data within the clarification cap U3",
  ),
  proveedor: tb(
    "el modelo no respondió al leer o al preguntar, y el plan manda el caso a una persona",
    "the model did not respond while reading or asking, and the plan sends the case to a person",
  ),
};

export const CIFRAS = {
  puntaAPunta: tb("de punta a punta", "end to end"),
  pasos: tb("pasos", "steps"),
  llamadas: tb("llamadas al modelo", "model calls"),
  tokens: tb("tokens", "tokens"),
  usd: tb("US$ nominales, sin facturar", "nominal US$, not billed"),
};

export const FICHA = {
  titulo: tb("Ficha técnica de la traza", "The trace’s technical record"),
  traza: tb("Traza", "Trace"),
  corrida: tb("Corrida", "Run"),
  corridaTexto: ((p: {
    corrida: string;
    variante: string;
    resultado: string;
  }) =>
    tb(
      `${p.corrida} · variante ${p.variante} · resultado ${p.resultado}`,
      `${p.corrida} · variant ${p.variante} · result ${p.resultado}`,
    )) as Plantilla<{ corrida: string; variante: string; resultado: string }>,
  errores: tb("Errores", "Errors"),
  erroresTexto: ((p: { proveedor: string | null; esquema: boolean }) =>
    tb(
      `proveedor: ${p.proveedor ?? "ninguno"} · esquema en traspaso: ${p.esquema ? "sí" : "no"}`,
      `provider: ${p.proveedor ?? "none"} · schema on handoff: ${p.esquema ? "yes" : "no"}`,
    )) as Plantilla<{ proveedor: string | null; esquema: boolean }>,
  verdad: tb("Verdad conocida", "Known truth"),
  verdadTexto: ((p: {
    decision: string;
    escalar: boolean;
    ciclos: number;
    causal: string | null;
  }) =>
    tb(
      `decisión ${p.decision} · debe escalar ${p.escalar ? "sí" : "no"} · ciclos necesarios ${p.ciclos}${p.causal ? ` · causal ${p.causal}` : ""}`,
      `decision ${p.decision} · must escalate ${p.escalar ? "yes" : "no"} · cycles needed ${p.ciclos}${p.causal ? ` · ground ${p.causal}` : ""}`,
    )) as Plantilla<{
    decision: string;
    escalar: boolean;
    ciclos: number;
    causal: string | null;
  }>,
  caso: tb("Caso", "Case"),
  casoTexto: ((p: { tipo: string; subtipo: string; semilla: string }) =>
    tb(
      `${p.tipo} · ${p.subtipo} · semilla \`${p.semilla}\``,
      `${p.tipo} · ${p.subtipo} · seed \`${p.semilla}\``,
    )) as Plantilla<{ tipo: string; subtipo: string; semilla: string }>,
};

export const RECORRIDO = {
  titulo: tb("El recorrido, paso a paso", "The path, step by step"),
  chip: tb(
    "real · pasos y decisiones de arista",
    "real · steps and edge decisions",
  ),
  lectura: tb(
    "Cada paso dice qué hizo el nodo y, donde hay que elegir camino, por qué tomó esa rama: la señal que dejó, la regla del plan y el valor observado.",
    "Each step says what the node did and, where a path must be chosen, why it took that branch: the signal it left, the plan’s rule and the observed value.",
  ),
  sinModelo: tb("sin modelo", "no model"),
  medida: ((p: { s: string; tokens: string }) =>
    tb(
      `${p.s} s · ${p.tokens} tokens`,
      `${p.s} s · ${p.tokens} tokens`,
    )) as Plantilla<{
    s: string;
    tokens: string;
  }>,
  tecnico: ((p: {
    tipo: string;
    entrada: number;
    salida: number;
    ms: number;
    usd: string;
    reintentos: number;
  }) =>
    tb(
      `tipo ${p.tipo} · entrada ${p.entrada} · salida ${p.salida} tokens · ${p.ms} ms · US$ ${p.usd} · reintentos de esquema ${p.reintentos}`,
      `type ${p.tipo} · in ${p.entrada} · out ${p.salida} tokens · ${p.ms} ms · US$ ${p.usd} · schema retries ${p.reintentos}`,
    )) as Plantilla<{
    tipo: string;
    entrada: number;
    salida: number;
    ms: number;
    usd: string;
    reintentos: number;
  }>,
  columnas: [
    tb("#", "#"),
    tb("Señal", "Signal"),
    tb("Regla", "Rule"),
    tb("Observado", "Observed"),
    tb("¿Se cumple?", "Holds?"),
    tb("Rama", "Branch"),
  ],
  funcion: tb("función nombrada", "named function"),
  pregunta: tb("Pregunta", "Question"),
  respuesta: tb("Respuesta", "Answer"),
  original: tb(
    "",
    "In the original Spanish: the model asks in the case’s language.",
  ),
};

/** Qué hizo cada nodo, en una frase; los valores salen de la traza. */
export const HIZO = {
  enrutador: ((atencion: TextoBilingue) =>
    tb(
      `Clasificó la atención: ${atencion.es}.`,
      `Classified the care type: ${atencion.en}.`,
    )) as Plantilla<TextoBilingue>,
  extractor: tb(
    "Leyó el texto del médico y lo convirtió en campos, con una confianza declarada.",
    "Read the doctor’s text and turned it into fields, with a stated confidence.",
  ),
  extractorOtraVez: tb(
    "Volvió a leer el caso con la respuesta del médico.",
    "Read the case again with the doctor’s answer.",
  ),
  sinRespuesta: ((error: string) =>
    tb(
      `Llamó al modelo y no obtuvo respuesta (${error}).`,
      `Called the model and got no answer (${error}).`,
    )) as Plantilla<string>,
  aclaracion: ((ciclo: number) =>
    tb(
      `Preguntó al médico (ciclo ${ciclo}).`,
      `Asked the doctor (cycle ${ciclo}).`,
    )) as Plantilla<number>,
  verificador: ((p: {
    estado: TextoBilingue;
    causal: string | null;
    propuesta: TextoBilingue;
  }) =>
    tb(
      `Aplicó las reglas del plan de beneficios: servicio ${p.estado.es}${p.causal ? `, causal ${p.causal}` : ""}; propuesta: ${p.propuesta.es}.`,
      `Applied the benefits plan rules: service ${p.estado.en}${p.causal ? `, ground ${p.causal}` : ""}; proposal: ${p.propuesta.en}.`,
    )) as Plantilla<{
    estado: TextoBilingue;
    causal: string | null;
    propuesta: TextoBilingue;
  }>,
  decision: ((n: number) =>
    tb(
      `Revisó las ${n} reglas de escalamiento del plan, en orden.`,
      `Checked the plan’s ${n} escalation rules, in order.`,
    )) as Plantilla<number>,
  pausa: ((decision: TextoBilingue) =>
    tb(
      `Un auditor vio el caso completo y decidió: ${decision.es}.`,
      `An auditor saw the full case and decided: ${decision.en}.`,
    )) as Plantilla<TextoBilingue>,
  redactor: ((documento: boolean) =>
    documento
      ? tb(
          "Escribió la respuesta al afiliado, con el aviso de IA; el código armó el documento de decisión adversa.",
          "Wrote the reply to the member, with the AI notice; code assembled the adverse decision document.",
        )
      : tb(
          "Escribió la respuesta al afiliado, con el aviso de IA.",
          "Wrote the reply to the member, with the AI notice.",
        )) as Plantilla<boolean>,
  guardia: ((p: { hallazgos: number; severidad: number }) =>
    tb(
      `Revisó la salida: ${p.hallazgos} hallazgos, severidad ${p.severidad}.`,
      `Checked the output: ${p.hallazgos} findings, severity ${p.severidad}.`,
    )) as Plantilla<{ hallazgos: number; severidad: number }>,
};

/** Por qué tomó la rama, en palabras llanas: por nodo y por la regla que se cumplió (o la de por defecto). */
export const RAMA = {
  enrutador: {
    defecto: tb(
      "no es urgencia ni servicio exento: sigue al extractor",
      "neither an emergency nor an exempt service: on to the extractor",
    ),
    urgencia: tb(
      "es una urgencia: va directo al redactor, sin revisar cobertura",
      "it is an emergency: straight to the writer, no coverage check",
    ),
    exento: tb(
      "es un servicio exento: va directo al redactor",
      "it is an exempt service: straight to the writer",
    ),
  },
  extractor: {
    defecto: tb(
      "no falta ningún dato: sigue al verificador de cobertura",
      "nothing missing: on to the coverage checker",
    ),
    faltantes: tb(
      "faltan datos: pregunta al médico",
      "data are missing: it asks the doctor",
    ),
    proveedor: tb(
      "el modelo no respondió: pasa a una persona",
      "the model did not respond: on to a person",
    ),
  },
  aclaracion: {
    defecto: tb(
      "vuelve al extractor con la respuesta",
      "back to the extractor with the answer",
    ),
    tope: tb(
      "llegó al tope de aclaraciones: pasa a una persona",
      "it reached the clarification cap: on to a person",
    ),
    proveedor: tb(
      "el modelo no respondió: pasa a una persona",
      "the model did not respond: on to a person",
    ),
  },
  decision: {
    defecto: tb(
      "ninguna regla de escalamiento se cumple: sigue solo al redactor",
      "no escalation rule holds: on to the writer alone",
    ),
    negar: tb(
      "la propuesta es negar: ninguna negación sin una persona",
      "the proposal is to deny: no denial without a person",
    ),
    confianza: tb(
      "la confianza está bajo U1: pasa a una persona",
      "confidence is below U1: on to a person",
    ),
    altoCosto: tb(
      "el costo supera U2: pasa a una persona",
      "the cost is above U2: on to a person",
    ),
    contradiccion: tb(
      "la orden y el texto no coinciden: pasa a una persona",
      "order and text do not match: on to a person",
    ),
    texas: tb(
      "modo Texas y la propuesta no es aprobar: pasa a una persona",
      "Texas mode and the proposal is not to approve: on to a person",
    ),
  },
};

export const PAUSA = {
  titulo: tb(
    "La pausa humana: lo que vio el auditor",
    "The human pause: what the auditor saw",
  ),
  chip: tb("real · payload del interrupt", "real · interrupt payload"),
  lectura: tb(
    "Ninguna negación sale sin una persona. El agente se detiene y le entrega al auditor el caso completo: por qué se detuvo, lo que leyó, el texto original, la evidencia y la contraevidencia.",
    "No denial goes out without a person. The agent stops and hands the auditor the full case: why it stopped, what it read, the original text, the evidence and the counter-evidence.",
  ),
  porQue: tb("Por qué se detuvo", "Why it stopped"),
  motivo: tb("payload.motivo:", "payload.motivo:"),
  senal: ((p: {
    senal: string;
    declarado: string;
    aplicado: string;
    nodo: string;
    paso: number;
    rol: string;
  }) =>
    tb(
      `señal ${p.senal} · umbral declarado ${p.declarado} · aplicado ${p.aplicado} · nodo ${p.nodo} · paso ${p.paso} · rol ${p.rol}`,
      `signal ${p.senal} · declared threshold ${p.declarado} · applied ${p.aplicado} · node ${p.nodo} · step ${p.paso} · role ${p.rol}`,
    )) as Plantilla<{
    senal: string;
    declarado: string;
    aplicado: string;
    nodo: string;
    paso: number;
    rol: string;
  }>,
  evidencia: tb("Evidencia", "Evidence"),
  contraevidencia: tb("Contraevidencia", "Counter-evidence"),
  leyo: tb("Lo que leyó el extractor", "What the extractor read"),
  confianza: tb("confianza", "confidence"),
  sinExtraccion: tb(
    "nada: el extractor no respondió",
    "nothing: the extractor did not respond",
  ),
  respondio: tb("Lo que respondió el auditor", "What the auditor answered"),
  simulado: ((politica: string) =>
    tb(
      `Auditor simulado: en esta corrida por lotes sigue la verdad conocida del caso (política ${politica}). En producción lo decide una persona con este mismo payload.`,
      `Simulated auditor: in this batch run it follows the case’s known truth (policy ${politica}). In production a person decides with this same payload.`,
    )) as Plantilla<string>,
};

export const SALIDA = {
  titulo: tb("La respuesta y la guardia", "The reply and the guard"),
  chip: tb(
    "real · salida_final y guardia_salida",
    "real · salida_final and guardia_salida",
  ),
  recibe: tb("Lo que recibe el afiliado", "What the member receives"),
  guardia: tb(
    "Guardia de salida: reglas fijas, sin modelo",
    "Output guard: fixed rules, no model",
  ),
  intentadas: tb("Acciones intentadas", "Actions attempted"),
  ejecutadas: tb("Acciones ejecutadas", "Actions run"),
  instruccion: tb("Instrucción en la entrada", "Instruction in the input"),
  detectada: tb("detectada: no tuvo efecto", "detected: it had no effect"),
  ninguna: tb("ninguna", "none"),
  hallazgos: tb("Hallazgos en la salida", "Findings in the output"),
  severidad: tb("Severidad de la acción", "Action severity"),
};

export const DOCUMENTO = {
  sinDatos: tb(
    "ninguno: el extractor no respondió y el documento queda incompleto",
    "none: the extractor did not respond and the document is incomplete",
  ),
  titulo: tb(
    "El documento de decisión adversa",
    "The adverse decision document",
  ),
  chip: tb("real · generado por código", "real · generated by code"),
  lectura: tb(
    "Toda negación lleva este documento, en español y en inglés: lo arma el código, no el modelo. Dice qué se negó, con qué causal de ley, con qué regla, con qué datos y con qué versión del plan, quién decidió y cómo contradecirla.",
    "Every denial carries this document, in Spanish and English: code builds it, not the model. It says what was denied, on which legal ground, by which rule, with which data and which plan version, who decided and how to challenge it.",
  ),
  cabecera: tb("Documento de decisión adversa", "Adverse decision document"),
  servicio: tb("Servicio", "Service"),
  decision: tb("Decisión", "Decision"),
  negada: tb("Negada", "Denied"),
  causal: tb("Causal", "Ground"),
  regla: tb("Regla aplicada", "Rule applied"),
  datos: tb("Datos usados", "Data used"),
  version: tb("Versión", "Version"),
  decidido: tb("Decidido por", "Decided by"),
  contradecir: tb("Cómo contradecirla", "How to challenge it"),
  completo: ((p: { completo: boolean; idiomas: string }) =>
    tb(
      `completo: ${p.completo ? "sí" : "no"} · idiomas: ${p.idiomas} · C8: toda negación con documento completo en ES y EN`,
      `complete: ${p.completo ? "yes" : "no"} · languages: ${p.idiomas} · C8: every denial with a complete document in ES and EN`,
    )) as Plantilla<{ completo: boolean; idiomas: string }>,
};

export const SENALES = {
  titulo: ((n: number) =>
    tb(
      `Las ${n} señales que deja la traza`,
      `The ${n} signals the trace leaves`,
    )) as Plantilla<number>,
  nota: tb(
    "Las que el plan exige en toda traza: de aquí leen el verificador y el playground.",
    "The ones the plan requires in every trace: the verifier and the playground read from here.",
  ),
};

export const SI_NO = { si: tb("sí", "yes"), no: tb("no", "no") };

export const PIE_CASO = ((p: {
  corrida: string;
  sprint: number;
  fecha: string;
  n: number;
  repeticiones: number;
  base: boolean;
  modelo: string;
}) =>
  tb(
    `Datos de la corrida ${p.corrida} del sprint ${p.sprint} (${p.fecha}): ${p.n} casos, ${p.repeticiones} repeticiones${p.base ? " y una línea base de agente único" : ""}, modelo ${p.modelo} por la suscripción de Claude Code del autor. Ningún visitante lanza llamadas a modelos.`,
    `Data from sprint ${p.sprint} run ${p.corrida} (${p.fecha}): ${p.n} cases, ${p.repeticiones} repetitions${p.base ? " and a single-agent baseline" : ""}, ${p.modelo} model via the author’s Claude Code subscription. No visitor triggers model calls.`,
  )) as Plantilla<{
  corrida: string;
  sprint: number;
  fecha: string;
  n: number;
  repeticiones: number;
  base: boolean;
  modelo: string;
}>;
