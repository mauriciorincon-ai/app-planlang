/**
 * Textos que comparte toda la vitrina (rótulo, barra, pie, perfil, procedencia, veredictos). Nacen como
 * mapa `{ es, en }` y se redactan en los dos idiomas (regla 20): ninguno se traduce al pintar.
 */
import { tb } from "@core/formatos/bilingue";
import type { Pantalla } from "@/lib/ruta";

export const MARCA = "planlang";

export const ROTULO = {
  simulacion: tb("Simulación · no operativo", "Simulation · not operational"),
  divulgacion: tb(
    "Datos 100 % sintéticos · las decisiones humanas de este demo se simularon en lote",
    "100% synthetic data · this demo’s human decisions were simulated in batch",
  ),
};

export const PESTANAS: Record<Pantalla, ReturnType<typeof tb>> = {
  entrada: tb("Entrada", "Home"),
  plan: tb("Plan", "Plan"),
  agente: tb("Agente", "Agent"),
  brecha: tb("Brecha", "Gap"),
  playground: tb("Playground", "Playground"),
  caso: tb("Casos", "Cases"),
  fichas: tb("Fichas", "Records"),
};

export const BARRA = {
  secciones: tb("Secciones", "Sections"),
  idioma: tb("Idioma", "Language"),
  tema: tb("Tema", "Theme"),
  oscuro: tb("Oscuro", "Dark"),
  claro: tb("Claro", "Light"),
  inicio: tb("planlang, entrada", "planlang, home"),
  espanol: tb("Español", "Spanish"),
  ingles: tb("Inglés", "English"),
};

export const PERFIL = {
  leerComo: tb("Leer como", "Read as"),
  lider: tb("Líder", "Leader"),
  experto: tb("Experto", "Expert"),
  leesComoLider: tb("Lees como líder.", "Reading as leader."),
  leesComoExperto: tb("Lees como experto.", "Reading as expert."),
  verComoExperto: tb("Ver como experto", "View as expert"),
  volverALider: tb("Volver a líder", "Back to leader"),
};

export const PROCEDENCIA = {
  real: tb("real", "real"),
  maqueta: tb("maqueta", "mock-up"),
  fuente: tb("fuente", "source"),
  declarado: tb("declarado", "declared"),
};

export const VEREDICTOS = {
  cumple: tb("Cumple", "Meets"),
  cumple_con_alertas: tb("Cumple con alertas", "Meets with warnings"),
  no_cumple: tb("No cumple", "Does not meet"),
  en_construccion: tb("En construcción", "Under construction"),
};

export const PIE = {
  simulacion: tb("Simulación · no operativo.", "Simulation · not operational."),
  sintetico: tb(
    "Todo caso, afiliado, médico y plan de beneficios es sintético. Las decisiones humanas de este demo se simularon en lote siguiendo la verdad conocida; en producción las tomaría un auditor médico con el caso completo.",
    "Every case, member, physician and benefit plan is synthetic. This demo's human decisions were simulated in batch following the known truth; in production a medical auditor would make them with the full case.",
  ),
  modelo: tb(
    "El modelo de los agentes corrió con la suscripción de Claude Code del autor. Ningún visitante lanza llamadas a modelos: esta página es estática. LangChain, LangGraph, LangSmith y Anthropic son marcas de sus titulares; aquí solo se nombran.",
    "The agents' model ran on the author's Claude Code subscription. No visitor triggers model calls: this page is static. LangChain, LangGraph, LangSmith and Anthropic are trademarks of their owners; they are only named here.",
  ),
};

/** Las pantallas que llegan en las fases siguientes del sprint 2 dicen que están en construcción, sin simular nada. */
export const EN_CONSTRUCCION = {
  titulo: tb(
    "Esta pantalla se está construyendo",
    "This screen is being built",
  ),
  texto: tb(
    "Llega en este mismo sprint, después de la Entrada. Aquí no se muestra nada que no haya corrido.",
    "It arrives in this same sprint, after Home. Nothing that did not run is shown here.",
  ),
  volver: tb("Volver a la Entrada", "Back to Home"),
};

/** `/`: la elección de idioma. Cada opción se escribe en SU idioma (se lee antes de elegir). */
export const ELEGIR = {
  grupo: "Idioma / Language",
  es: { nombre: "Español", texto: "Leer la vitrina en español" },
  en: { nombre: "English", texto: "Read the showcase in English" },
};

export const NO_ENCONTRADA = {
  titulo: tb("Esta página no existe", "This page does not exist"),
  texto: tb(
    "La dirección no corresponde a ninguna pantalla de la vitrina.",
    "The address does not match any screen of the showcase.",
  ),
  volver: tb("Ir a la Entrada", "Go to Home"),
};
