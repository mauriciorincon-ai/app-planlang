/**
 * La copia propia del demo B en P6 Caso: lo que recibe (tres documentos y una solicitud), qué hizo cada nodo, por qué
 * tomó cada rama, el relato, el documento de rechazo y el expediente con sus citas. Lo que cambia de un caso a otro
 * se arma con plantillas desde la traza; ningún caso lleva texto escrito a mano. Vive aparte para que la guardia
 * «copia contra plan» la lea contra el plan B.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { SubtipoB } from "@core/sintetico/demo-b/esquema";

type Plantilla<P> = (p: P) => TextoBilingue;

export const ORACULO_TEXTO_B = tb(
  "En cada pausa, un oficial de cumplimiento simulado respondió lo que dice la verdad conocida del caso (DA-04). Solicitantes, documentos y listas de control son sintéticos.",
  "At every pause, a simulated compliance officer answered what the case’s known truth says (DA-04). Applicants, documents and control lists are synthetic.",
);

export const MIRADA_B = {
  avisoLider: tb(
    "Ves qué documentos entregó el solicitante, qué hizo cada nodo y por qué tomó cada camino, en palabras llanas.",
    "You see which documents the applicant handed in, what each node did and why it took each path, in plain words.",
  ),
  avisoExperto: tb(
    "Cada paso suma sus tokens, milisegundos y costo; cada decisión, la tabla de aristas con la regla del plan y el valor observado; al final, el expediente con sus citas, la ficha técnica y las señales de la traza.",
    "Each step adds its tokens, milliseconds and cost; each decision, the edge table with the plan’s rule and the observed value; at the end, the file with its citations, the technical record and the trace’s signals.",
  ),
};

/** Cómo se nombra cada subtipo de caso sintético del B en el selector (`core/sintetico/demo-b`). */
export const SUBTIPO_B: Record<SubtipoB, TextoBilingue> = {
  normal_limpio: tb("normal, limpio", "normal, clean"),
  normal_riesgo_alto: tb("normal, riesgo alto", "normal, high risk"),
  normal_lista_vinculante: tb(
    "normal, en lista vinculante",
    "normal, on a binding list",
  ),
  normal_lista_consulta: tb(
    "normal, en lista de consulta",
    "normal, on a reference list",
  ),
  borde_puntaje_en_U2: tb(
    "borde: puntaje igual a U2",
    "edge: score equal to U2",
  ),
  borde_titular_invertido: tb(
    "borde: titular de los fondos cambiado",
    "edge: funds holder swapped",
  ),
  borde_casi_zona_gris: tb(
    "borde: casi en la zona gris",
    "edge: almost in the gray zone",
  ),
  borde_ingresos_en_limite: tb(
    "borde: ingresos en el límite",
    "edge: income at the limit",
  ),
  faltante_documento_fondos: tb(
    "faltante: sin origen de fondos",
    "missing: no source of funds",
  ),
  faltante_ingresos: tb("faltante: sin ingresos", "missing: no income"),
  faltante_dato_identidad: tb(
    "faltante: un dato de identidad",
    "missing: an identity detail",
  ),
  adversario_homonimo_zona_gris: tb(
    "adversario: homónimo en la zona gris",
    "adversarial: namesake in the gray zone",
  ),
  adversario_homonimo_identico: tb(
    "adversario: homónimo idéntico",
    "adversarial: identical namesake",
  ),
  adversario_transliteracion: tb(
    "adversario: nombre transliterado",
    "adversarial: transliterated name",
  ),
  adversario_inyeccion: tb("adversario: inyección", "adversarial: injection"),
  adversario_documentos_contradictorios: tb(
    "adversario: documentos contradictorios",
    "adversarial: contradictory documents",
  ),
  adversario_dato_sensible: tb(
    "adversario: dato sensible",
    "adversarial: sensitive data",
  ),
};

/** El producto pedido, con su artículo, como entra al relato («pidió una cuenta corriente»). */
export const PRODUCTO_PEDIDO_B: Record<string, TextoBilingue> = {
  cuenta_de_ahorros: tb("una cuenta de ahorros", "a savings account"),
  cuenta_corriente: tb("una cuenta corriente", "a checking account"),
  credito_de_consumo: tb("un crédito de consumo", "a consumer loan"),
};

export const CABECERA_B = {
  aprobado: tb("Aprobado", "Approved"),
  rechazado: tb("Rechazado", "Rejected"),
};

export const RECIBE_B = {
  identidad: tb("El documento de identidad", "The identity document"),
  actividad: tb(
    "La declaración de actividad económica",
    "The statement of economic activity",
  ),
  fondos: tb(
    "La declaración de origen de fondos",
    "The source-of-funds statement",
  ),
  sinFondos: tb(
    "no la entregó: el dato que falta lo cuenta RI-01",
    "not handed in: RI-01 counts the missing detail",
  ),
  solicitud: tb("La solicitud", "The application"),
  solicitudTexto: ((p: { id: string; producto: TextoBilingue }) =>
    tb(
      `${p.id} · ${p.producto.es}`,
      `${p.id} · ${p.producto.en}`,
    )) as Plantilla<{
    id: string;
    producto: TextoBilingue;
  }>,
  contacto: tb("Datos de contacto", "Contact details"),
  minimizado: tb(
    "teléfonos y correos se quitan antes del modelo; el nombre sí se lee, porque es lo que se cruza con las listas",
    "phones and emails are removed before the model; the name is read, because it is what gets checked against the lists",
  ),
};

export const ENTREGA_B = {
  respuesta: tb(
    "La respuesta al solicitante, con su aviso de IA",
    "The reply to the applicant, with its AI notice",
  ),
  documento: tb(
    "El documento de rechazo, en español e inglés",
    "The rejection document, in Spanish and English",
  ),
  expediente: tb(
    "El expediente, con la cita de cada conclusión",
    "The file, with each conclusion’s citation",
  ),
};

/** Qué hizo cada nodo, en una frase; los valores salen de la traza. */
export const HIZO_B = {
  enrutador: ((carga: boolean) =>
    carga
      ? tb(
          "Revisó los documentos y encontró una instrucción escondida: marcó el caso (RG-01).",
          "Checked the documents and found a hidden instruction: it flagged the case (RG-01).",
        )
      : tb(
          "Revisó los documentos: ninguna instrucción escondida.",
          "Checked the documents: no hidden instruction.",
        )) as Plantilla<boolean>,
  extractor: ((faltan: number) =>
    faltan === 0
      ? tb(
          "Leyó los documentos y los convirtió en campos; no faltaba ningún dato exigido.",
          "Read the documents and turned them into fields; no required detail was missing.",
        )
      : tb(
          `Leyó los documentos y los convirtió en campos; ${faltan === 1 ? "faltaba un dato exigido" : `faltaban ${faltan} datos exigidos`}.`,
          `Read the documents and turned them into fields; ${faltan === 1 ? "one required detail was" : `${faltan} required details were`} missing.`,
        )) as Plantilla<number>,
  verificador: ((
    p: {
      similitud: string;
      entrada: string;
      lista: string;
      vinculante: boolean;
    } | null,
  ) =>
    p === null
      ? tb(
          "Cruzó el nombre con las listas: no hubo con qué compararlo.",
          "Checked the name against the lists: there was nothing to compare it with.",
        )
      : tb(
          `Cruzó el nombre con las listas: la mayor similitud es ${p.similitud}, con ${p.entrada} de la lista ${p.vinculante ? "vinculante" : "de consulta"} ${p.lista}.`,
          `Checked the name against the lists: the highest similarity is ${p.similitud}, with ${p.entrada} on ${p.vinculante ? "binding" : "reference"} list ${p.lista}.`,
        )) as Plantilla<{
    similitud: string;
    entrada: string;
    lista: string;
    vinculante: boolean;
  } | null>,
  investigador: ((p: { misma: boolean; entrada: string }) =>
    p.misma
      ? tb(
          `Comparó el contexto con ${p.entrada} y concluyó: puede ser la misma persona.`,
          `Compared the context with ${p.entrada} and concluded: it may be the same person.`,
        )
      : tb(
          `Comparó el contexto con ${p.entrada} y concluyó: es un homónimo.`,
          `Compared the context with ${p.entrada} and concluded: it is a namesake.`,
        )) as Plantilla<{ misma: boolean; entrada: string }>,
  puntaje: ((p: {
    total: number;
    inconsistencias: number;
    propuesta: TextoBilingue;
  }) =>
    tb(
      `Puntuó el riesgo con las reglas del plan: ${p.total} de 100 y ${p.inconsistencias} ${p.inconsistencias === 1 ? "inconsistencia" : "inconsistencias"}; propuesta: ${p.propuesta.es}.`,
      `Scored the risk with the plan’s rules: ${p.total} out of 100 and ${p.inconsistencias} ${p.inconsistencias === 1 ? "inconsistency" : "inconsistencies"}; proposal: ${p.propuesta.en}.`,
    )) as Plantilla<{
    total: number;
    inconsistencias: number;
    propuesta: TextoBilingue;
  }>,
  decision: ((n: number) =>
    tb(
      `Revisó las ${n} reglas de escalamiento del plan, en orden.`,
      `Checked the plan’s ${n} escalation rules, in order.`,
    )) as Plantilla<number>,
  pausa: ((decision: TextoBilingue) =>
    tb(
      `El oficial de cumplimiento vio el caso completo y decidió: ${decision.es}.`,
      `The compliance officer saw the full case and decided: ${decision.en}.`,
    )) as Plantilla<TextoBilingue>,
  redactor: ((p: { conclusiones: number; documento: boolean }) =>
    p.documento
      ? tb(
          `Armó el expediente con ${p.conclusiones} conclusiones y la respuesta al solicitante; el código armó también el documento de rechazo.`,
          `Built the file with ${p.conclusiones} conclusions and the reply to the applicant; code also built the rejection document.`,
        )
      : tb(
          `Armó el expediente con ${p.conclusiones} conclusiones y la respuesta al solicitante.`,
          `Built the file with ${p.conclusiones} conclusions and the reply to the applicant.`,
        )) as Plantilla<{ conclusiones: number; documento: boolean }>,
};

/** Por qué tomó la rama, en palabras llanas: por nodo y por la regla que se cumplió (o la de por defecto). */
export const RAMA_B: Record<string, Record<string, TextoBilingue>> = {
  verificador_listas: {
    defecto: tb(
      "la similitud está bajo U4: sigue al puntaje, sin investigador",
      "similarity is below U4: on to scoring, no investigator",
    ),
    zonaGris: tb(
      "la similitud está en la zona gris o más arriba (U4): va al investigador de contexto",
      "similarity is in the gray zone or above (U4): on to the context investigator",
    ),
  },
  decision: {
    defecto: tb(
      "ninguna regla de escalamiento se cumple: sigue solo al redactor",
      "no escalation rule holds: on to the writer alone",
    ),
    carga: tb(
      "los documentos traían una instrucción escondida: pasa al oficial",
      "the documents carried a hidden instruction: on to the officer",
    ),
    coincidencia: tb(
      "la similitud está en o sobre U1: pasa al oficial",
      "similarity is at or above U1: on to the officer",
    ),
    mismaPersona: tb(
      "el investigador concluyó «misma persona»: pasa al oficial",
      "the investigator concluded “same person”: on to the officer",
    ),
    riesgo: tb(
      "el puntaje está en o sobre U2: pasa al oficial",
      "the score is at or above U2: on to the officer",
    ),
    inconsistencias: tb(
      "hay más inconsistencias de las que tolera U3: pasa al oficial",
      "there are more inconsistencies than U3 tolerates: on to the officer",
    ),
    rechazar: tb(
      "la propuesta es rechazar: ningún rechazo sin una persona",
      "the proposal is to reject: no rejection without a person",
    ),
  },
};

/** Por qué pasó a una persona, en palabras llanas (la categoría de la regla que se cumplió). */
export const MOTIVO_B: Record<string, TextoBilingue> = {
  carga: tb(
    "los documentos traían una instrucción escondida para el sistema",
    "the documents carried a hidden instruction for the system",
  ),
  coincidencia: tb(
    "el nombre se parece a una entrada de las listas en o sobre el umbral U1",
    "the name resembles a list entry at or above threshold U1",
  ),
  mismaPersona: tb(
    "el investigador concluyó que el solicitante puede ser la persona de la lista",
    "the investigator concluded the applicant may be the listed person",
  ),
  riesgo: tb(
    "el puntaje de riesgo alcanzó el umbral de escalamiento U2",
    "the risk score reached the escalation threshold U2",
  ),
  inconsistencias: tb(
    "los documentos tienen más inconsistencias de las que tolera U3",
    "the documents have more inconsistencies than U3 tolerates",
  ),
  rechazar: tb(
    "la propuesta del agente era rechazar, y ningún rechazo sale sin que una persona lo revise",
    "the agent proposed to reject, and no rejection goes out without a person reviewing it",
  ),
};

/** El relato del caso: una frase por lo que ocurrió, armada desde la traza. */
export const RELATO_B = {
  pidio: ((p: { producto: TextoBilingue; fondos: boolean }) =>
    p.fondos
      ? tb(
          `El solicitante pidió ${p.producto.es} y entregó sus tres documentos.`,
          `The applicant asked for ${p.producto.en} and handed in all three documents.`,
        )
      : tb(
          `El solicitante pidió ${p.producto.es} y entregó dos de los tres documentos: le faltó el de origen de fondos.`,
          `The applicant asked for ${p.producto.en} and handed in two of the three documents: the source-of-funds one was missing.`,
        )) as Plantilla<{ producto: TextoBilingue; fondos: boolean }>,
  carga: tb(
    "Uno de sus documentos escondía una instrucción para el sistema: la guardia de entrada la marcó antes de que la leyera un modelo.",
    "One of the documents hid an instruction for the system: the input guard flagged it before any model read it.",
  ),
  leyo: ((faltan: number) =>
    faltan === 0
      ? tb(
          "El extractor leyó los documentos y no faltaba ningún dato exigido.",
          "The extractor read the documents and no required detail was missing.",
        )
      : tb(
          `El extractor leyó los documentos; ${faltan === 1 ? "faltaba un dato exigido" : `faltaban ${faltan} datos exigidos`}.`,
          `The extractor read the documents; ${faltan === 1 ? "one required detail was" : `${faltan} required details were`} missing.`,
        )) as Plantilla<number>,
  listas: ((
    p: {
      similitud: string;
      entrada: string;
      vinculante: boolean;
      investigado: boolean;
    } | null,
  ) =>
    p === null
      ? tb(
          "Sin nombre, no hubo coincidencia que medir en las listas.",
          "With no name, there was no list match to measure.",
        )
      : p.investigado
        ? tb(
            `El nombre se parece ${p.similitud} a ${p.entrada}, de una lista ${p.vinculante ? "vinculante" : "de consulta"}: con esa similitud, el caso pasó al investigador de contexto.`,
            `The name is ${p.similitud} similar to ${p.entrada}, on a ${p.vinculante ? "binding" : "reference"} list: with that similarity, the case went to the context investigator.`,
          )
        : tb(
            `El nombre se parece ${p.similitud} a ${p.entrada}, de una lista ${p.vinculante ? "vinculante" : "de consulta"}: por debajo de la zona gris, siguió sin investigador.`,
            `The name is ${p.similitud} similar to ${p.entrada}, on a ${p.vinculante ? "binding" : "reference"} list: below the gray zone, it went on without the investigator.`,
          )) as Plantilla<{
    similitud: string;
    entrada: string;
    vinculante: boolean;
    investigado: boolean;
  } | null>,
  investigo: ((misma: boolean) =>
    misma
      ? tb(
          "El investigador de contexto concluyó que puede ser la misma persona.",
          "The context investigator concluded it may be the same person.",
        )
      : tb(
          "El investigador de contexto concluyó que es un homónimo.",
          "The context investigator concluded it is a namesake.",
        )) as Plantilla<boolean>,
  puntuo: ((p: { total: number; inconsistencias: number }) =>
    p.inconsistencias === 0
      ? tb(
          `El puntaje de riesgo fue ${p.total} de 100 y los documentos eran coherentes entre sí.`,
          `The risk score was ${p.total} out of 100 and the documents were consistent with each other.`,
        )
      : tb(
          `El puntaje de riesgo fue ${p.total} de 100, con ${p.inconsistencias === 1 ? "una inconsistencia" : `${p.inconsistencias} inconsistencias`} entre los documentos.`,
          `The risk score was ${p.total} out of 100, with ${p.inconsistencias === 1 ? "one inconsistency" : `${p.inconsistencias} inconsistencies`} between the documents.`,
        )) as Plantilla<{ total: number; inconsistencias: number }>,
  aPersona: ((p: { motivo: TextoBilingue; decision: TextoBilingue }) =>
    tb(
      `${p.motivo.es.charAt(0).toUpperCase()}${p.motivo.es.slice(1)}: el caso pasó al oficial de cumplimiento, que decidió ${p.decision.es}.`,
      `${p.motivo.en.charAt(0).toUpperCase()}${p.motivo.en.slice(1)}: the case went to the compliance officer, who decided to ${p.decision.en}.`,
    )) as Plantilla<{ motivo: TextoBilingue; decision: TextoBilingue }>,
  solo: ((decision: TextoBilingue) =>
    tb(
      `Ninguna regla de escalamiento se cumplió y el agente decidió ${decision.es} solo.`,
      `No escalation rule held and the agent decided to ${decision.en} on its own.`,
    )) as Plantilla<TextoBilingue>,
  cierre: ((p: {
    conclusiones: number;
    sinCita: number;
    documento: boolean;
    hallazgos: number;
  }) =>
    tb(
      `El redactor armó el expediente con ${p.conclusiones} conclusiones, ${p.sinCita === 0 ? "todas con su cita" : `${p.sinCita} sin cita`}${p.documento ? ", y el documento de rechazo en español e inglés" : ""}; la guardia revisó la salida: ${p.hallazgos === 0 ? "no se filtró ningún dato" : `${p.hallazgos} hallazgos`}.`,
      `The writer built the file with ${p.conclusiones} conclusions, ${p.sinCita === 0 ? "all with their citation" : `${p.sinCita} uncited`}${p.documento ? ", and the rejection document in Spanish and English" : ""}; the guard checked the output: ${p.hallazgos === 0 ? "no data leaked" : `${p.hallazgos} findings`}.`,
    )) as Plantilla<{
    conclusiones: number;
    sinCita: number;
    documento: boolean;
    hallazgos: number;
  }>,
};

export const FICHA_CASO_B = {
  verdadTexto: ((p: {
    decision: string;
    escalar: boolean;
    vinculante: boolean;
    entrada: string | null;
  }) =>
    tb(
      `decisión ${p.decision} · debe escalar ${p.escalar ? "sí" : "no"} · en lista vinculante ${p.vinculante ? "sí" : "no"}${p.entrada ? ` · entrada ${p.entrada}` : ""}`,
      `decision ${p.decision} · must escalate ${p.escalar ? "yes" : "no"} · on a binding list ${p.vinculante ? "yes" : "no"}${p.entrada ? ` · entry ${p.entrada}` : ""}`,
    )) as Plantilla<{
    decision: string;
    escalar: boolean;
    vinculante: boolean;
    entrada: string | null;
  }>,
};

export const PAUSA_B = {
  titulo: tb(
    "La pausa humana: lo que vio el oficial",
    "The human pause: what the officer saw",
  ),
  lectura: tb(
    "Ningún rechazo ni coincidencia en listas sale sin una persona. El agente se detiene y le entrega al oficial el caso completo: por qué se detuvo, los documentos, lo que leyó, las coincidencias, la investigación, el puntaje, la evidencia y la contraevidencia.",
    "No rejection and no list match goes out without a person. The agent stops and hands the officer the full case: why it stopped, the documents, what it read, the matches, the investigation, the score, the evidence and the counter-evidence.",
  ),
  respondio: tb("Lo que respondió el oficial", "What the officer answered"),
  sinExtraccion: tb(
    "nada: el extractor no respondió",
    "nothing: the extractor did not respond",
  ),
  simulado: ((politica: string) =>
    tb(
      `Oficial simulado: en esta corrida por lotes sigue la verdad conocida del caso (política ${politica}). En producción lo decide una persona con este mismo payload.`,
      `Simulated officer: in this batch run it follows the case’s known truth (policy ${politica}). In production a person decides with this same payload.`,
    )) as Plantilla<string>,
};

export const SALIDA_B = {
  recibe: tb("Lo que recibe el solicitante", "What the applicant receives"),
};

export const DOCUMENTO_B = {
  titulo: tb("El documento de rechazo", "The rejection document"),
  avisoFaltaChip: tb("Sin aviso de IA", "No AI notice"),
  avisoFalta: tb(
    "Este documento no trae su aviso de IA: la corrida es anterior al arreglo que lo añadió (bitácora del S3, D54); las corridas nuevas lo traen.",
    "This document carries no AI notice: the run predates the fix that added it (S3 log, D54); new runs carry it.",
  ),
  cabecera: tb("Documento de rechazo", "Rejection document"),
  lectura: tb(
    "Todo rechazo lleva este documento, en español y en inglés: lo arma el código, no el modelo. Dice por qué se rechazó, con qué norma, con qué regla, con qué datos y con qué versión del plan y de las listas, si lo revisó una persona y cómo pedir otra revisión.",
    "Every rejection carries this document, in Spanish and English: code builds it, not the model. It says why it was rejected, under which rule of law, by which rule, with which data and which version of the plan and the lists, whether a person reviewed it and how to ask for another review.",
  ),
  decision: tb("Decisión", "Decision"),
  rechazada: tb("Rechazada", "Rejected"),
  causa: tb("Causa", "Reason"),
  regla: tb("Regla aplicada", "Rule applied"),
  datos: tb("Datos usados", "Data used"),
  version: tb("Versión", "Version"),
  revisado: tb("Revisado por una persona", "Reviewed by a person"),
  contradecir: tb("Cómo pedir otra revisión", "How to ask for another review"),
  completo: ((p: { completo: boolean; idiomas: string; persona: boolean }) =>
    tb(
      `completo: ${p.completo ? "sí" : "no"} · idiomas: ${p.idiomas} · revisado por una persona: ${p.persona ? "sí" : "no"} (C2)`,
      `complete: ${p.completo ? "yes" : "no"} · languages: ${p.idiomas} · reviewed by a person: ${p.persona ? "yes" : "no"} (C2)`,
    )) as Plantilla<{ completo: boolean; idiomas: string; persona: boolean }>,
};

export const EXPEDIENTE_B = {
  titulo: tb(
    "El expediente: cada conclusión con su cita",
    "The file: every conclusion with its citation",
  ),
  chip: tb("real · generado por código", "real · generated by code"),
  lectura: tb(
    "Lo arma el código, sin modelo, desde lo que se midió. Cada conclusión cita su fuente: un documento, una regla o una coincidencia en una lista con su versión y su fecha. Es lo que se conserva (D3).",
    "Code builds it, without a model, from what was measured. Every conclusion cites its source: a document, a rule or a match on a list with its version and date. It is what gets kept (D3).",
  ),
  cabecera: tb("Expediente", "File"),
  /** Cómo se lee la cita de una conclusión, por su tipo. */
  cita: {
    documento: ((ref: string) =>
      tb(`documento: ${ref}`, `document: ${ref}`)) as Plantilla<string>,
    regla: ((ref: string) =>
      tb(`regla: ${ref}`, `rule: ${ref}`)) as Plantilla<string>,
    coincidencia: ((ref: string) =>
      tb(`coincidencia: ${ref}`, `match: ${ref}`)) as Plantilla<string>,
    arista: ((ref: string) =>
      tb(`arista: ${ref}`, `edge: ${ref}`)) as Plantilla<string>,
    decision_del_plan: ((ref: string) =>
      tb(
        `decisión del plan: ${ref}`,
        `plan decision: ${ref}`,
      )) as Plantilla<string>,
  } as Record<string, Plantilla<string>>,
  lista: ((p: { id: string; version: string; fecha: string }) =>
    tb(
      `lista ${p.id}, versión ${p.version} del ${p.fecha}`,
      `list ${p.id}, version ${p.version} of ${p.fecha}`,
    )) as Plantilla<{ id: string; version: string; fecha: string }>,
  sinCita: tb("sin cita", "uncited"),
  cuenta: ((p: { n: number; sinCita: number }) =>
    p.sinCita === 0
      ? tb(
          `${p.n} conclusiones, todas con su cita (C3)`,
          `${p.n} conclusions, all with their citation (C3)`,
        )
      : tb(
          `${p.n} conclusiones, ${p.sinCita} sin cita (C3)`,
          `${p.n} conclusions, ${p.sinCita} uncited (C3)`,
        )) as Plantilla<{ n: number; sinCita: number }>,
};
