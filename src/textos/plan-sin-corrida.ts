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
  lotes: tb("Lotes", "Batches"),
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
  valorEnPlan: tb("Valor en el plan", "Value in the plan"),
  nodos: tb("nodos", "nodes"),
  aristas: tb("aristas condicionales", "conditional edges"),
  pausas: tb("pausas humanas", "human pauses"),
  sinValor: tb("sin valor todavía", "no value yet"),
};
