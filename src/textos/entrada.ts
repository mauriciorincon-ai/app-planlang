/**
 * Textos de P1 Entrada (maqueta `docs/diseno/01-entrada.html`, aprobada en la mirada 4, ronda 2). La copia
 * es la aprobada; las cifras NO viven aquí: salen del plan, del informe y del manifiesto de la vitrina
 * (`src/lib/vista/entrada.ts`). `LIDER` reúne los párrafos que lee quien decide: el test de textos les
 * aplica el presupuesto de líder (≤ 50 palabras, ≤ 1 término vigilado) en los dos idiomas.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

export const TITULO_PAGINA = tb(
  "planlang · Planeé, construí y medí la brecha",
  "planlang · I planned, I built, and I measured the gap",
);

export const DESCRIPCION_PAGINA = tb(
  "El planeador de agentes de IA donde cada demo es la prueba de su propio plan. Simulación · no operativo.",
  "The AI agent planner where every demo is the proof of its own plan. Simulation · not operational.",
);

export const PORTADA = {
  antetitulo: tb(
    "Planeador de agentes de IA · demo A: autorizaciones médicas",
    "AI agent planner · demo A: medical prior authorizations",
  ),
  titulo: tb(
    "Planeé, construí y medí la brecha.",
    "I planned, I built, and I measured the gap.",
  ),
  verBrecha: tb("Ver la brecha del demo A", "See demo A's gap"),
  recorrerPlan: tb("Recorrer el plan", "Walk through the plan"),
};

/**
 * El gancho es una cita con fuente, no un dato de planlang: sus cifras vienen de la encuesta y se muestran
 * con el chip «fuente».
 */
export const GANCHO = {
  titulo: tb(
    "Qué hacen hoy los equipos que construyen agentes",
    "What teams building agents do today",
  ),
  filas: [
    {
      cifra: 0.89,
      texto: tb(
        "observan sus agentes en producción",
        "observe their agents in production",
      ),
    },
    { cifra: 0.52, texto: tb("los evalúan", "evaluate them") },
  ],
  nadie: tb("planearon qué evaluar", "planned what to evaluate"),
  nadieNota: tb(
    "La encuesta no lo pregunta. planlang parte de ahí.",
    "The survey doesn't ask. planlang starts there.",
  ),
  fuente: tb(
    "LangChain, State of Agent Engineering · 1.340 respuestas · nov–dic 2025",
    "LangChain, State of Agent Engineering · 1,340 responses · Nov–Dec 2025",
  ),
};

export const COMO_FUNCIONA = {
  titulo: tb("Cómo funciona", "How it works"),
  objetivo: tb("Objetivo", "Goal"),
  pasos: {
    planee: tb("Planeé", "I planned"),
    construi: tb("Construí", "I built"),
    medi: tb("Medí la brecha", "I measured the gap"),
  },
  partesDelPlan: {
    decisiones: tb("Decisiones", "Decisions"),
    riesgos: tb("Riesgos", "Risks"),
    supuestos: tb("Supuestos", "Assumptions"),
    criterios: tb("Criterios", "Criteria"),
    umbrales: tb("Umbrales", "Thresholds"),
  },
  pieDelPlan: tb("plan del demo A", "demo A plan"),
  capacidad: tb(
    "Capacidad medida con el demo A",
    "Capacity measured with demo A",
  ),
  sostiene: tb("Cómo se sostiene cada afirmación", "How each claim holds up"),
};

/** Rótulos de las cuatro cifras de «Capacidad medida»; las cifras y sus chips salen de la vista. */
export const CAPACIDAD = {
  cruzada: tb(
    "decisiones rehechas en otro lenguaje · diferencias",
    "decisions redone in another language · differences",
  ),
  balance: tb(
    "criterios cumplidos · riesgos ocurridos",
    "criteria met · risks occurred",
  ),
  balanceChip: tb("real · informe", "real · report"),
  llamadas: tb(
    "llamadas a modelos al visitar esta vitrina",
    "model calls when visiting this showcase",
  ),
};

export const LO_QUE_NINGUNA = {
  titulo: tb("Lo que ninguna herramienta muestra", "What no tool shows"),
  nota: tb(
    "Las tres se ven en el demo A, sobre corridas reales.",
    "All three are visible in demo A, on real runs.",
  ),
  informe: tb(
    "El informe de brecha, con sus fallas",
    "The gap report, failures included",
  ),
  umbral: tb(
    "Mover un umbral y ver qué cambia",
    "Move a threshold and see what changes",
  ),
  arista: tb(
    "El plan es el código de la arista",
    "The plan is the code of the edge",
  ),
  tripleta: tb("señal · operador · valor", "signal · operator · value"),
};

export const DEMOS = {
  titulo: tb("Los demos", "The demos"),
  nota: tb(
    "Aquí no se simula lo que no corrió.",
    "Nothing that did not run is simulated here.",
  ),
  columnas: {
    demo: tb("Demo", "Demo"),
    veredicto: tb("Veredicto del plan", "Plan verdict"),
    corrida: tb("Corrida", "Run"),
    abrir: tb("Abrir", "Open"),
  },
  demoA: tb("A · Autorizaciones médicas", "A · Medical prior authorizations"),
  demoB: tb(
    "B · Vinculación con debida diligencia",
    "B · Customer onboarding with due diligence",
  ),
  demoBLlega: tb("Llega en el sprint 3.", "Arrives in sprint 3."),
  brecha: tb("Brecha", "Gap"),
  agente: tb("Agente", "Agent"),
  unCaso: tb("Un caso", "A case"),
  chipInforme: tb("real · informe del verificador", "real · verifier’s report"),
};

/**
 * Lo que sigue del roadmap, «en construcción» en la Entrada (regla dura 15: el entrevistador y lo demás del roadmap
 * aparecen desde el primer día; AU-S2-6). Son los ids estables del bloque `roadmap:` de la ficha que define la
 * planeadora (`SPRINT_002.md`), menos el demo B, que tiene su fila en la tabla. Ninguno se simula.
 */
export const EN_CONSTRUCCION = {
  titulo: tb("También en construcción", "Also under construction"),
  nota: tb(
    "Del roadmap, desde el sprint 3 en adelante.",
    "From the roadmap, from sprint 3 on.",
  ),
  items: [
    {
      id: "entrevistador-que-propone-el-plan",
      titulo: tb(
        "Entrevistador que propone el plan",
        "Interviewer that drafts the plan",
      ),
    },
    {
      id: "comparar-dos-corridas",
      titulo: tb(
        "Comparar dos corridas lado a lado",
        "Compare two runs side by side",
      ),
    },
    {
      id: "calibracion-conformal",
      titulo: tb(
        "Calibración conformal y cobertura conjunta",
        "Conformal calibration and joint coverage",
      ),
    },
    {
      id: "recorrido-animado-de-un-caso",
      titulo: tb(
        "Recorrido animado de un caso por el grafo",
        "Animated walk of one case through the graph",
      ),
    },
  ],
};

export const PREGUNTA = {
  rotulo: tb(
    "La pregunta de entrevista de 2026",
    "The 2026 interview question",
  ),
  cita: tb(
    "¿Cómo sabes que tu evaluación es confiable?",
    "How do you know your evaluation is trustworthy?",
  ),
};

/** Párrafos para quien decide: presupuesto de líder en los dos idiomas (tests/unit/textos.test.ts). */
export const LIDER = {
  guia: tb(
    "planlang escribe el plan de un agente como un contrato que el código puede verificar, construye el agente según ese contrato, lo corre sobre casos con respuesta conocida y publica la brecha entre lo planeado y lo ocurrido, con sus fallas a la vista.",
    "planlang writes an agent's plan as a contract that code can verify, builds the agent to that contract, runs it on cases with a known answer, and publishes the gap between what was planned and what happened, failures in plain sight.",
  ),
  avisoLider: tb(
    "Ves qué hace planlang y qué dio con el demo A, en palabras llanas.",
    "You see what planlang does and what it gave with demo A, in plain words.",
  ),
  avisoExperto: tb(
    "Se suman cómo se sostiene cada afirmación —núcleo sin IA, trazas propias con huella, prueba cruzada entre dos lenguajes— y la fuente completa del gancho.",
    "You also get how each claim holds up —an AI-free core, own traces with fingerprints, a cross-check between two languages— and the hook’s full source.",
  ),
  objetivo: tb(
    "Que un proyecto de agentes de IA se planee antes de construirse, y que el plan se pueda comprobar contra lo que el agente hizo, caso por caso.",
    "That an AI agent project is planned before it is built, and that the plan can be checked against what the agent did, case by case.",
  ),
  planee: tb(
    "El plan se escribe como contrato: cada criterio con su regla de medición, cada umbral con su señal. Un validador lo rechaza si está incompleto.",
    "The plan is written as a contract: every criterion with its measurement rule, every threshold with its signal. A validator rejects it if it is incomplete.",
  ),
  construi: tb(
    "El agente en LangGraph se construye según ese contrato y corre sobre casos con respuesta conocida y adversarios sembrados.",
    "The LangGraph agent is built to that contract and runs on cases with a known answer and seeded adversaries.",
  ),
  medi: tb(
    "Un verificador sin IA compara plan y trazas y publica la brecha, con lo que falló a la vista.",
    "A verifier with no AI compares plan and traces and publishes the gap, with what failed in plain sight.",
  ),
  informe: tb(
    "El plan dice qué debía pasar; las trazas, qué pasó. Un verificador que no usa inteligencia artificial lista, criterio por criterio, qué se cumplió y qué no. Nada se esconde.",
    "The plan says what should happen; the traces, what did. A verifier that uses no AI lists, criterion by criterion, what was met and what was not. Nothing is hidden.",
  ),
  umbral: tb(
    "Sube la confianza mínima o enciende el modo Texas y mira, sobre las corridas reales, cuántos casos cambian de camino y cuántos minutos de revisión humana cuesta.",
    "Raise the minimum confidence or switch on Texas mode and see, on the real runs, how many cases change path and how many minutes of human review it costs.",
  ),
  demoA: tb(
    "Un enrutador, un extractor, un verificador de cobertura por reglas y un redactor deciden aprobar, negar con causal o escalar a un auditor humano. Ninguna negación sale sin una persona.",
    "A router, an extractor, a rule-based coverage checker and a writer decide to approve, deny with a stated ground, or escalate to a human auditor. No denial goes out without a person.",
  ),
  demoB: tb(
    "Extractor de documentos, verificación contra listas de control por reglas y modelo en cascada, investigador de contexto para homónimos.",
    "Document extractor, watchlist screening by rules and a cascaded model, a context investigator for namesakes.",
  ),
  respuesta: tb(
    "Con un verificador determinista sobre casos con verdad conocida y adversarios sembrados: ningún modelo de lenguaje decide si el agente acertó. Y con la brecha publicada aunque no favorezca.",
    "With a deterministic verifier over cases with known truth and seeded adversaries: no language model decides whether the agent got it right. And with the gap published even when it is unfavorable.",
  ),
} satisfies Record<string, TextoBilingue>;

/**
 * «El plan es el código de la arista» lleva la tripleta en mono en medio de la frase: se guarda en dos
 * mitades para no partir el texto al pintar.
 */
export const ARISTA_FRASE = {
  antes: tb(
    "Cada decisión del agente se declara en el plan como",
    "Every agent decision is declared in the plan as",
  ),
  despues: tb(
    ", y una prueba en dos lenguajes confirma que el grafo hace exactamente eso.",
    ", and a two-language test confirms the graph does exactly that.",
  ),
};

/**
 * Lectura corta de cada supuesto del plan del demo A, para la miniatura «Medí la brecha» («Falló S3: …»).
 * Es copia editorial ligada al dato por su id: el test exige una por cada supuesto que el informe marque
 * refutado o sin probar, así un supuesto nuevo no puede quedar sin nombre.
 */
export const LECTURA_DE_SUPUESTO: Record<string, TextoBilingue> = {
  S1: tb("la confianza del modelo", "the model’s confidence"),
  S2: tb("dos aclaraciones bastan", "two clarifications are enough"),
  S3: tb(
    "varios agentes, más lentos que uno solo",
    "several agents, slower than one",
  ),
};

/** Nombre llano de cada categoría de brecha no prevista, en singular y plural. */
export const CATEGORIA_DE_BRECHA: Record<
  string,
  { uno: TextoBilingue; varios: TextoBilingue }
> = {
  reintento_de_esquema: {
    uno: tb("respuesta fuera de formato", "off-format answer"),
    varios: tb("respuestas fuera de formato", "off-format answers"),
  },
};

/** El bloque del experto: cómo se sostiene cada afirmación. Las cifras entran por la vista. */
export const SOSTIENE = {
  nucleo: {
    dt: tb("Núcleo sin IA", "AI-free core"),
    dd: tb(
      "planeador, verificador y playground no llaman a ningún modelo; dan los mismos bytes en Node y en el navegador (JSON canónico RFC 8785 + SHA-256, sin reloj ni azar)",
      "planner, verifier and playground call no model; they give the same bytes in Node and in the browser (canonical JSON RFC 8785 + SHA-256, no clock, no randomness)",
    ),
  },
  trazas: {
    dt: tb("Trazas propias", "Own traces"),
    dd: tb(
      "planlang-trace/v1, cada una con su huella; LangSmith es solo un espejo de observabilidad",
      "planlang-trace/v1, each with its fingerprint; LangSmith is only an observability mirror",
    ),
  },
  cruzada: { dt: tb("Prueba cruzada", "Cross-check") },
  modelo: { dt: tb("Modelo", "Model") },
  humanas: {
    dt: tb("Decisiones humanas", "Human decisions"),
    dd: tb(
      "simuladas en lote: el auditor sigue la verdad conocida de cada caso (DA-04), y la vitrina lo dice en cada pantalla",
      "simulated in batch: the auditor follows each case’s known truth (DA-04), and the showcase says so on every screen",
    ),
  },
  pila: {
    dt: tb("Pila", "Stack"),
    vitrina: tb(
      "Next.js exportado estático · TypeScript estricto",
      "Next.js static export · strict TypeScript",
    ),
  },
  fuente: {
    dt: tb("Fuente del gancho", "Hook source"),
    dd: tb(
      "LangChain, State of Agent Engineering (2025): 1.340 respuestas, nov–dic 2025; 89 % tiene observabilidad y 52 % corre evaluaciones. La encuesta no pregunta si se planeó qué evaluar.",
      "LangChain, State of Agent Engineering (2025): 1,340 responses, Nov–Dec 2025; 89% have observability and 52% run evaluations. The survey does not ask whether what to evaluate was planned.",
    ),
  },
};
