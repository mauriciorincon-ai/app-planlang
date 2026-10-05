/**
 * Textos que comparte toda la vitrina (rótulo, barra, pie, perfil, procedencia, veredictos). Nacen como
 * mapa `{ es, en }` y se redactan en los dos idiomas (regla 20): ninguno se traduce al pintar.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import type { Pantalla } from "@/lib/ruta";

export const MARCA = "planlang";

export const ROTULO = {
  simulacion: tb("Simulación · no operativo", "Simulation · not operational"),
  divulgacion: tb(
    "Datos 100 % sintéticos · las decisiones humanas de este demo se simularon en lote",
    "100% synthetic data · this demo’s human decisions were simulated in batch",
  ),
  /** El nombre de su región: el rótulo vive dentro de un landmark (AU-S2-B24). */
  region: tb("Aviso de simulación", "Simulation notice"),
};

/** El enlace para saltar la barra con el teclado (AU-S2-B24, WCAG 2.4.1). */
export const SALTO = tb("Saltar al contenido", "Skip to content");

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
  /** El conmutador de demo en las pantallas del B (ADR-014). */
  demo: tb("Demo", "Demo"),
  demoA: tb("Demo A · autorización previa", "Demo A · prior authorization"),
  demoB: tb("Demo B · vinculación", "Demo B · onboarding"),
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

/** Un caso que se nombra sin enlace: la corrida de 200 publica página solo de algunos casos (S3). */
export const SIN_PAGINA = tb("sin página propia", "no page of its own");

export const PIE = {
  simulacion: tb("Simulación · no operativo.", "Simulation · not operational."),
  /** Por demo; `ambos` es el de la entrada, que presenta los dos. */
  sintetico: {
    "demo-a": tb(
      "Todo caso, afiliado, médico y plan de beneficios es sintético. Las decisiones humanas de este demo se simularon en lote siguiendo la verdad conocida; en producción las tomaría un auditor médico con el caso completo.",
      "Every case, member, physician and benefit plan is synthetic. This demo's human decisions were simulated in batch following the known truth; in production a medical auditor would make them with the full case.",
    ),
    "demo-b": tb(
      "Todo caso, solicitante, documento y lista de control es sintético. Las decisiones humanas de este demo se simularon en lote siguiendo la verdad conocida; en producción las tomaría un oficial de cumplimiento con el caso completo.",
      "Every case, applicant, document and watchlist is synthetic. This demo's human decisions were simulated in batch following the known truth; in production a compliance officer would make them with the full case.",
    ),
    ambos: tb(
      "Todo caso, afiliado, médico, plan de beneficios, solicitante y lista de control es sintético. Las decisiones humanas de los dos demos se simularon en lote siguiendo la verdad conocida; en producción las tomaría una persona con el caso completo: un auditor médico en el A, un oficial de cumplimiento en el B.",
      "Every case, member, physician, benefit plan, applicant and watchlist is synthetic. Both demos' human decisions were simulated in batch following the known truth; in production a person would make them with the full case: a medical auditor in A, a compliance officer in B.",
    ),
  } as Record<IdDemo | "ambos", TextoBilingue>,
  modelo: tb(
    "El modelo de los agentes corrió con la suscripción de Claude Code del autor. Ningún visitante lanza llamadas a modelos: esta página es estática. LangChain, LangGraph, LangSmith y Anthropic son marcas de sus titulares; aquí solo se nombran.",
    "The agents' model ran on the author's Claude Code subscription. No visitor triggers model calls: this page is static. LangChain, LangGraph, LangSmith and Anthropic are trademarks of their owners; they are only named here.",
  ),
  /** Lo que cierra el pie cuando la pantalla dice de qué corrida salen sus datos (P3 Agente). */
  marcas: tb(
    "LangChain, LangGraph, LangSmith y Anthropic son marcas de sus titulares; aquí solo se nombran.",
    "LangChain, LangGraph, LangSmith and Anthropic are trademarks of their owners; they are only named here.",
  ),
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

/** «3 de 20» · «3 of 20»: una cifra sobre su total, en las fichas y las cifras de cada pantalla (AU-S2-B18). */
export const FRACCION = (p: {
  a: number | string;
  b: number | string;
}): TextoBilingue => tb(`${p.a} de ${p.b}`, `${p.a} of ${p.b}`);

/** El chip de procedencia de lo medido en una corrida: «real · corrida v1.2» · «real · run v1.2». */
export const CHIP_CORRIDA = (corrida: string): TextoBilingue =>
  tb(`real · corrida ${corrida}`, `real · run ${corrida}`);
