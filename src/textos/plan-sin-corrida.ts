import { tb } from "@core/formatos/bilingue";

/**
 * La página de un plan sin corrida (S5, `/[idioma]/planes/<id>`): un plan aprobado que nadie ha construido en planlang.
 * Lo que dice la ficha es lo que NO hay, para que nadie tome el plan por un agente medido (P15, corte honesto).
 */
export const FICHA_SIN_CORRIDA = {
  etiqueta: tb("Sin corrida", "No run"),
  nota: tb(
    "Este plan no tiene agente construido en planlang: no hay trazas, brecha, playground ni visor. Lo que sigue es el contrato que se aprobó, no un resultado.",
    "This plan has no agent built in planlang: there are no traces, gap, playground or viewer. What follows is the contract that was approved, not a result.",
  ),
  falta: tb(
    "Lo que no hay: trazas, brecha, playground, visor.",
    "What is missing: traces, gap, playground, viewer.",
  ),
};

export const ORIGEN = {
  plantilla: tb("plantilla", "template"),
  entrevistador: tb("entrevistador", "interviewer"),
  usuario: tb("usuario", "user"),
  sinOrigen: tb("sin origen declarado", "no origin declared"),
};

export const SECCIONES = {
  problema: tb("Problema", "Problem"),
  actores: tb("Actores", "Actors"),
  decisiones: tb("Decisiones", "Decisions"),
  riesgos: tb("Riesgos", "Risks"),
  supuestos: tb("Supuestos", "Assumptions"),
  criterios: tb("Criterios de aceptación", "Acceptance criteria"),
  umbrales: tb("Umbrales", "Thresholds"),
  contrato: tb("Contrato del grafo", "Graph contract"),
};

/** El tipo de un actor (`core/plan/esquema.ts` TIPO_ACTOR), en palabras. */
export const TIPO_ACTOR = {
  humano: tb("persona", "person"),
  sistema: tb("sistema", "system"),
};

export const ETIQUETA = {
  aprobado: tb("Aprobado por", "Approved by"),
  el: tb("el", "on"),
  huella: tb("Huella", "Fingerprint"),
  version: tb("Versión", "Version"),
  dominio: tb("Dominio", "Domain"),
  elegida: tb("Elegida", "Chosen"),
  razon: tb("Razón", "Reason"),
  reversibilidad: tb("Reversibilidad", "Reversibility"),
  severidad: tb("Severidad", "Severity"),
  ocurrencia: tb("Ocurrencia", "Occurrence"),
  deteccion: tb("Detección", "Detection"),
  criterio: tb("Regla de medición", "Measurement rule"),
  objetivo: tb("Objetivo", "Target"),
  nodos: tb("nodos", "nodes"),
  aristas: tb("aristas condicionales", "conditional edges"),
  pausas: tb("pausas humanas", "human pauses"),
  /** Las mismas, para la cuenta de uno («1 pausa humana», no «1 pausas humanas»). */
  nodo: tb("nodo", "node"),
  arista: tb("arista condicional", "conditional edge"),
  pausa: tb("pausa humana", "human pause"),
  prioridad: tb("Prioridad de acción", "Action priority"),
  respuestas: tb("Respuestas", "Answers"),
  entrevista: tb("Entrevista", "Interview"),
  anteriores: tb("Versiones anteriores", "Earlier versions"),
};

/**
 * De quién son las respuestas de la entrevista (S6). La clase sale del archivo que la entrevista usó, no de este texto:
 * si el plan dice «revisadas», es porque el repo guarda las que el usuario revisó y confirmó, con su fecha.
 */
export const RESPUESTAS = {
  revisadas: (fecha: string) =>
    tb(
      `Revisadas y confirmadas por el usuario el ${fecha}`,
      `Reviewed and confirmed by the user on ${fecha}`,
    ),
  delegadas: tb(
    "Delegadas al constructor: el usuario no las escribió",
    "Delegated to the builder: the user did not write them",
  ),
  sinRegistro: tb(
    "El repo no guarda quién respondió",
    "The repo does not record who answered",
  ),
  cambiadas: (preguntas: string) =>
    tb(
      `preguntas que cambió al revisar: ${preguntas}`,
      `questions it changed on review: ${preguntas}`,
    ),
  /** La misma idea en pocas palabras, para la línea de cada versión anterior. */
  corta: {
    revisadas: tb("respuestas del usuario", "the user’s answers"),
    delegadas: tb(
      "respuestas delegadas al constructor",
      "answers delegated to the builder",
    ),
    sinRegistro: tb("sin registro de respuestas", "no record of the answers"),
  },
  sinCambios: tb(
    "no cambió ninguna pregunta al revisar",
    "it changed no question on review",
  ),
};

export const TITULO_PAGINA = (id: string) => tb(`Plan ${id}`, `Plan ${id}`);
export const DESCRIPCION_PAGINA = tb(
  "Un plan aprobado con el entrevistador de planlang, sin agente construido: el contrato tal como se aprobó, con quién propuso cada elemento.",
  "A plan approved with planlang's interviewer, with no agent built: the contract as approved, with who proposed each element.",
);

export const PORTADA = {
  antetitulo: tb("Plan sin corrida", "Plan without a run"),
  guia: tb(
    "Este plan salió de una entrevista sobre una plantilla de dominio que es solo datos. Nadie lo ha construido en planlang: aquí no hay trazas que medir, solo el contrato. «Usuario» es quien respondió la entrevista, o el constructor cuando el autor le delegó las respuestas; la ficha dice cuál fue el caso.",
    "This plan came from an interview over a domain template that is only data. No one has built it in planlang: there are no traces to measure here, only the contract. «User» is whoever answered the interview, or the builder when the author delegated the answers; the sheet says which one it was.",
  ),
  origenes: tb(
    "Quién propuso cada elemento: la plantilla del dominio, el entrevistador o la persona que respondió.",
    "Who proposed each element: the domain template, the interviewer or the person who answered.",
  ),
};

/** La sección «Planes sin corrida» de la Entrada (S5). */
export const ENTRADA = {
  titulo: tb("Planes sin corrida", "Plans without a run"),
  nota: tb(
    "Planeados con el entrevistador sobre un dominio nuevo. Sin agente, sin trazas: solo el contrato.",
    "Planned with the interviewer over a new domain. No agent, no traces: only the contract.",
  ),
  abrir: tb("Leer el plan", "Read the plan"),
  chip: tb("plan aprobado · sin corrida", "approved plan · no run"),
  columnas: {
    plan: tb("Plan", "Plan"),
    dominio: tb("Dominio", "Domain"),
    aprobado: tb("Aprobado", "Approved"),
    abrir: tb("Abrir", "Open"),
  },
};

/**
 * El contrato del grafo en detalle (S7): nodos con su tipo, aristas condicionales, ramas por defecto y pausas humanas,
 * tal como los aprobó el plan. Es lo que el agente que se construya tendrá que cumplir; aquí nadie lo ha construido.
 */
export const TIPO_NODO = {
  enrutador: tb("enrutador", "router"),
  modelo: tb("modelo", "model"),
  regla: tb("regla", "rule"),
  pausa_humana: tb("pausa humana", "human pause"),
  herramienta: tb("herramienta", "tool"),
};

export const CONTRATO = {
  nodos: tb("Nodos", "Nodes"),
  aristas: tb("Aristas condicionales", "Conditional edges"),
  aristasNota: tb(
    "Cada arista se evalúa en su orden; la primera que se cumple decide el camino.",
    "Each edge is checked in its order; the first one that holds decides the path.",
  ),
  porDefecto: tb("Ramas por defecto", "Default branches"),
  porDefectoNota: tb(
    "El camino cuando ninguna arista condicional del nodo se cumple.",
    "The path when none of the node's conditional edges holds.",
  ),
  pausas: tb("Pausas humanas", "Human pauses"),
  senales: tb(
    "Señales que el agente debe registrar en cada traza",
    "Signals the agent must log in every trace",
  ),
  funcion: tb("función", "function"),
  columnas: {
    nodo: tb("Nodo", "Node"),
    tipo: tb("Tipo", "Type"),
    desde: tb("Desde", "From"),
    orden: tb("Orden", "Order"),
    condicion: tb("Si se cumple", "If it holds"),
    hacia: tb("Va a", "Goes to"),
    quien: tb("Quién decide", "Who decides"),
    ve: tb("Lo que ve", "What it sees"),
    politica: tb("Política simulada", "Simulated policy"),
  },
};
