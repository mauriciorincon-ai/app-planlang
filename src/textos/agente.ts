/**
 * Textos de P3 Agente (maqueta `docs/diseno/03-agente.html`, aprobada en la mirada 5 de la Etapa de Diseño).
 * La copia es la aprobada; las cifras NO viven aquí: las calcula `src/lib/vista/agente.ts` desde el plan, la
 * corrida (sus trazas) y el informe, y entran como parámetros de las plantillas. Los textos de cada nodo son
 * también los registros líder / experto del mapa del diagramador (`core/visor`).
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { Fuente } from "@core/visor/tipos";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb(
  "El agente de autorizaciones · planlang",
  "The authorization agent · planlang",
);
export const DESCRIPCION_PAGINA = tb(
  "El agente del demo A tal como corrió: su grafo real frente al plan, nodo por nodo. Simulación · no operativo.",
  "Demo A's agent as it ran: its real graph against the plan, node by node. Simulation · not operational.",
);

export const PORTADA = {
  antetitulo: ((p: {
    demo: TextoBilingue;
    corrida: string;
    sprint: number;
    fecha: string;
  }) =>
    tb(
      `${p.demo.es} · corrida ${p.corrida} del sprint ${p.sprint}, ${p.fecha}`,
      `${p.demo.en} · sprint ${p.sprint} run ${p.corrida}, ${p.fecha}`,
    )) as Plantilla<{
    demo: TextoBilingue;
    corrida: string;
    sprint: number;
    fecha: string;
  }>,
  titulo: tb(
    "El agente de autorizaciones, tal como corrió",
    "The authorization agent, as it ran",
  ),
  guia: tb(
    "Primero, qué es: su objetivo, qué recibe, qué hace y qué entrega. Después, su grafo real frente al plan, nodo por nodo, con el detalle que pide cada perfil.",
    "First, what it is: its goal, what it takes in, what it does and what it delivers. Then its real graph against the plan, node by node, with the detail each profile asks for.",
  ),
};

export const MARCA_CORRIO = ((c: string) =>
  tb(`corrió en la corrida ${c}`, `ran in run ${c}`)) as Plantilla<string>;

export const FICHA = {
  titulo: tb("El agente en una mirada", "The agent at a glance"),
  objetivo: {
    rotulo: tb("Objetivo", "Goal"),
    texto: tb(
      "Resolver solicitudes de autorización de procedimientos médicos: aprobar en segundos las que son claras y llevar a un auditor humano toda negación y todo caso dudoso. Nunca niega por su cuenta, nunca revela datos del afiliado y nunca obedece instrucciones escondidas en la solicitud.",
      "Resolve prior-authorization requests for medical procedures: approve the clear ones in seconds and bring every denial and every doubtful case to a human auditor. It never denies on its own, never reveals member data and never obeys instructions hidden in the request.",
    ),
  },
  recibe: {
    rotulo: tb("Recibe", "Takes in"),
    sub: tb("la solicitud", "the request"),
    texto: {
      titulo: tb("El texto libre del médico", "The physician's free text"),
      detalle: ((n: number) =>
        tb(
          `Qué pide, por qué, con qué urgencia y costo; en los ${n} casos.`,
          `What is requested, why, how urgent and at what cost; in all ${n} cases.`,
        )) as Plantilla<number>,
    },
    orden: {
      titulo: tb("La orden médica adjunta", "The attached medical order"),
      detalle: ((ids: string) =>
        tb(
          `Para cotejarla con el texto: en ${ids} no coincidían y decidió una persona.`,
          `To check it against the text: on ${ids} they did not match and a person decided.`,
        )) as Plantilla<string>,
      sinContradiccion: tb(
        "Para cotejarla con el texto; en esta corrida siempre coincidieron.",
        "To check it against the text; in this run they always matched.",
      ),
    },
    afiliado: {
      titulo: tb("Datos mínimos del afiliado", "Minimal member data"),
      detalle: tb(
        "Edad, sexo y diagnóstico. Nombre e identificación se ocultan antes del modelo (D1).",
        "Age, sex and diagnosis. Name and ID are masked before the model (D1).",
      ),
    },
    plan: {
      titulo: tb("El plan de beneficios", "The benefits plan"),
      detalle: ((p: { total: number; exentos: number; excluidos: number }) =>
        tb(
          `${p.total} procedimientos en reglas legibles: ${p.exentos} no necesitan autorización y ${p.excluidos} tienen exclusión con causal.`,
          `${p.total} procedures as readable rules: ${p.exentos} need no authorization and ${p.excluidos} carry an exclusion with a stated cause.`,
        )) as Plantilla<{ total: number; exentos: number; excluidos: number }>,
    },
  },
  hace: {
    rotulo: tb("Hace", "Does"),
    sub: ((n: number) =>
      tb(
        `${n} actividades, en orden`,
        `${n} activities, in order`,
      )) as Plantilla<number>,
  },
  entrega: {
    rotulo: tb("Entrega", "Delivers"),
    sub: tb("tres respuestas y la traza", "three answers and the trace"),
    aprobacion: {
      titulo: tb("Aprobación", "Approval"),
      detalle: ((p: { n: number; de: number }) =>
        tb(
          `Con aviso de IA para el afiliado: ${p.n} de ${p.de}.`,
          `With an AI notice for the member: ${p.n} of ${p.de}.`,
        )) as Plantilla<{
        n: number;
        de: number;
      }>,
    },
    escalamiento: {
      titulo: tb(
        "Escalamiento al auditor médico",
        "Escalation to the medical auditor",
      ),
      detalle: ((p: {
        campos: number;
        pausas: number;
        aprobo: number;
        nego: number;
      }) =>
        tb(
          `Con los ${p.campos} campos que exige el plan: ${p.pausas} pausas; el auditor simulado aprobó ${p.aprobo} y negó ${p.nego}.`,
          `With the ${p.campos} fields the plan requires: ${p.pausas} pauses; the simulated auditor approved ${p.aprobo} and denied ${p.nego}.`,
        )) as Plantilla<{
        campos: number;
        pausas: number;
        aprobo: number;
        nego: number;
      }>,
    },
    negacion: {
      titulo: tb(
        "Negación con causal tasada",
        "Denial with an enumerated cause",
      ),
      detalle: ((p: { n: number; de: number }) =>
        tb(
          `Solo después del auditor, con su documento en ES y EN: ${p.n} de ${p.de}, todas con una persona (C1).`,
          `Only after the auditor, with its document in ES and EN: ${p.n} of ${p.de}, all with a person (C1).`,
        )) as Plantilla<{ n: number; de: number }>,
    },
    traza: {
      titulo: tb("La traza de cada caso", "Each case's trace"),
      detalle: ((n: number) =>
        tb(
          `planlang-trace/v1 con huella: señales, rutas, tiempos y tokens de los ${n}.`,
          `planlang-trace/v1 with a fingerprint: signals, routes, times and tokens for all ${n}.`,
        )) as Plantilla<number>,
    },
  },
  leyenda: ((p: { n: number; casos: number; sprint: number }) =>
    tb(
      `Hoy: las ${p.n} actividades corrieron en los ${p.casos} casos del sprint ${p.sprint}`,
      `Today: all ${p.n} activities ran across sprint ${p.sprint}’s ${p.casos} cases`,
    )) as Plantilla<{ n: number; casos: number; sprint: number }>,
  puede: {
    rotulo: tb("Puede", "Can"),
    sub: tb("visto en la corrida", "seen in the run"),
  },
  nunca: {
    rotulo: tb("Nunca", "Never"),
    sub: tb("reglas del plan", "plan rules"),
    items: [
      {
        titulo: tb(
          "Negar sin que lo revise una persona",
          "Deny without a person reviewing it",
        ),
        refs: tb(
          "D2 · C1 · CA SB 1120 · TX SB 815 · AI Act art. 14",
          "D2 · C1 · CA SB 1120 · TX SB 815 · EU AI Act art. 14",
        ),
      },
      {
        titulo: tb(
          "Ver el nombre o la identificación del afiliado",
          "See the member's name or ID",
        ),
        refs: tb(
          "D1 · se ocultan antes del modelo",
          "D1 · masked before the model",
        ),
      },
      {
        titulo: tb(
          "Revelar datos del afiliado en la respuesta",
          "Reveal member data in the answer",
        ),
        refs: tb("C2 · guardia de salida", "C2 · output guard"),
      },
      {
        titulo: tb(
          "Dejar que el texto de un caso cambie lo que hace",
          "Let a case's text change what it does",
        ),
        refs: tb(
          "C6 · el texto es dato, nunca instrucción",
          "C6 · text is data, never instruction",
        ),
      },
      {
        titulo: tb(
          "Pedir autorización para una urgencia",
          "Require authorization for an emergency",
        ),
        refs: tb("C4 · Ley 1751, art. 14", "C4 · Colombian Law 1751, art. 14"),
      },
    ],
    nota: ((p: { corrida: string; criterios: string; rotas: number }) =>
      p.rotas === 0
        ? tb(
            `Las hacen cumplir la pausa humana, la guardia de salida y el contrato de grafo. En la corrida ${p.corrida} ninguna se rompió: ${p.criterios} se cumplieron.`,
            `The human pause, the output guard and the graph contract enforce them. In run ${p.corrida} none was broken: ${p.criterios} were met.`,
          )
        : tb(
            `Las hacen cumplir la pausa humana, la guardia de salida y el contrato de grafo. En la corrida ${p.corrida} se rompieron ${p.rotas}: ${p.criterios}.`,
            `The human pause, the output guard and the graph contract enforce them. In run ${p.corrida}, ${p.rotas} were broken: ${p.criterios}.`,
          )) as Plantilla<{
      corrida: string;
      criterios: string;
      rotas: number;
    }>,
  },
  participan: {
    rotulo: tb("Participan", "Who takes part"),
    /** Por id de actor del plan: qué hace y de dónde sale. */
    papel: {
      medico: tb(
        "pide la autorización y responde las aclaraciones · sintético",
        "asks for the authorization and answers clarifications · synthetic",
      ),
      afiliado: tb(
        "recibe la respuesta · sintético",
        "receives the answer · synthetic",
      ),
      auditor: tb(
        "decide en la pausa · en este demo, simulado",
        "decides at the pause · simulated in this demo",
      ),
      plan_beneficios: tb(
        "reglas de cobertura legibles · sintético",
        "readable coverage rules · synthetic",
      ),
      agente: tb(
        "este sistema, en una aseguradora sintética",
        "this system, at a synthetic insurer",
      ),
    } as Record<string, TextoBilingue>,
  },
  capacidad: {
    rotulo: tb("Capacidad medida", "Measured capacity"),
    porCaso: tb("por caso, mediana", "per case, median"),
    rango: ((p: { min: string; max: string }) =>
      tb(
        `de ${p.min} a ${p.max} s`,
        `from ${p.min} to ${p.max} s`,
      )) as Plantilla<{
      min: string;
      max: string;
    }>,
    latenciaC7: ((p: { objetivo: string; cumple: boolean }) =>
      tb(
        `el plan pide ≤ ${p.objetivo} s en un caso típico (C7): ${p.cumple ? "cumplió" : "no cumplió"}`,
        `the plan asks ≤ ${p.objetivo} s for a typical case (C7): ${p.cumple ? "met" : "not met"}`,
      )) as Plantilla<{ objetivo: string; cumple: boolean }>,
    costoPorCaso: tb("por caso, nominal", "per case, nominal"),
    costoTotal: ((p: { total: string; n: number }) =>
      tb(
        `${p.total} USD los ${p.n}; no se factura: sale de la cuota de la suscripción de Claude Code`,
        `${p.total} USD for all ${p.n}; not billed: it comes out of the Claude Code subscription quota`,
      )) as Plantilla<{ total: string; n: number }>,
    tokens: tb("tokens por caso, mediana", "tokens per case, median"),
    tokensRango: ((p: { min: string; max: string; aclaraciones: number }) =>
      tb(
        `de ${p.min} a ${p.max} · el más largo pidió ${p.aclaraciones === 1 ? "una aclaración" : `${p.aclaraciones === 2 ? "dos" : p.aclaraciones} aclaraciones`}`,
        `from ${p.min} to ${p.max} · the longest asked for ${p.aclaraciones === 1 ? "one clarification" : `${p.aclaraciones === 2 ? "two" : p.aclaraciones} clarifications`}`,
      )) as Plantilla<{ min: string; max: string; aclaraciones: number }>,
    aPersona: tb("casos a una persona", "cases to a person"),
    minutos: ((p: { min: number; porCaso: number }) =>
      tb(
        `unos ${p.min} min de auditor: ${p.porCaso} min por caso según el plan`,
        `about ${p.min} auditor minutes: ${p.porCaso} min per case per the plan`,
      )) as Plantilla<{ min: number; porCaso: number }>,
    caminos: tb(
      "caminos iguales a la verdad conocida",
      "paths matching the known truth",
    ),
    caminosDetalle: tb(
      "misma decisión y misma pausa que la verdad del caso sintético",
      "same decision and same pause as the synthetic case's truth",
    ),
    lote: tb("un lote de 200 casos", "a batch of 200 cases"),
    loteDetalle: ((p: { promedio: string; usd: string }) =>
      tb(
        `en serie, con el promedio de esta corrida (${p.promedio} s por caso); ≈ ${p.usd} USD nominales`,
        `in series, at this run's average (${p.promedio} s per case); ≈ ${p.usd} USD nominal`,
      )) as Plantilla<{ promedio: string; usd: string }>,
    estimacion: tb("estimación", "estimate"),
  },
  fuente: ((p: {
    plan: string;
    corrida: string;
    sprint: number;
    fecha: string;
    n: number;
    modelo: string;
  }) =>
    tb(
      `Objetivo, actividades y entregas: plan del demo A ${p.plan}. Estado y cifras: corrida ${p.corrida} del sprint ${p.sprint} (${p.fecha}), ${p.n} casos sintéticos, modelo ${p.modelo} por la suscripción de Claude Code.`,
      `Goal, activities and deliveries: demo A plan ${p.plan}. Status and figures: sprint ${p.sprint} run ${p.corrida} (${p.fecha}), ${p.n} synthetic cases, ${p.modelo} model via the Claude Code subscription.`,
    )) as Plantilla<{
    plan: string;
    corrida: string;
    sprint: number;
    fecha: string;
    n: number;
    modelo: string;
  }>,
};

/** Las siete actividades de «Hace», en el orden del flujo del plan; los nodos son los que las ejecutan. */
export const ACTIVIDADES: ReadonlyArray<{
  titulo: TextoBilingue;
  nodos: readonly string[];
  flecha?: boolean;
}> = [
  {
    titulo: tb(
      "Clasifica la atención: ¿es urgencia o servicio exento?",
      "Classifies the care: an emergency or an exempt service?",
    ),
    nodos: ["enrutador"],
  },
  {
    titulo: tb(
      "Si lo es, la autoriza sin revisar cobertura",
      "If so, authorizes it without a coverage check",
    ),
    nodos: ["enrutador", "redactor"],
    /** El caso va de un nodo al otro (se dibuja con flecha); en las demás, los nodos trabajan juntos. */
    flecha: true,
  },
  {
    titulo: tb(
      "Lee la solicitud y la vuelve datos, con su confianza",
      "Reads the request and turns it into data, with its confidence",
    ),
    nodos: ["extractor"],
  },
  {
    titulo: tb(
      "Si faltan datos, los pide al médico, hasta 2 veces",
      "If data is missing, asks the physician, up to 2 times",
    ),
    nodos: ["aclaracion"],
  },
  {
    titulo: tb(
      "Revisa la cobertura con reglas fijas",
      "Checks coverage with fixed rules",
    ),
    nodos: ["verificador_cobertura"],
  },
  {
    titulo: tb(
      "Decide: sigue solo o pasa al auditor",
      "Decides: go on alone or to the auditor",
    ),
    nodos: ["decision", "pausa_humana"],
  },
  {
    titulo: tb(
      "Escribe la respuesta, la filtra y, si es adversa, emite su documento",
      "Writes the answer, filters it and, if adverse, issues its document",
    ),
    nodos: ["redactor", "guardia_salida"],
  },
];

export const CIFRAS_ACTIVIDAD = {
  casos: ((p: { n: number; de?: number }) =>
    p.de === undefined
      ? tb(`${p.n} casos`, `${p.n} cases`)
      : tb(`${p.n} de ${p.de} casos`, `${p.n} of ${p.de} cases`)) as Plantilla<{
    n: number;
    de?: number;
  }>,
  urgenciasExentos: ((p: { u: number; e: number }) =>
    tb(
      `${p.u} urgencias y ${p.e} exentos`,
      `${p.u} emergencies and ${p.e} exempt`,
    )) as Plantilla<{ u: number; e: number }>,
  preguntas: ((p: { casos: number; preguntas: number }) =>
    tb(
      `${p.casos} casos, ${p.preguntas} preguntas`,
      `${p.casos} cases, ${p.preguntas} questions`,
    )) as Plantilla<{
    casos: number;
    preguntas: number;
  }>,
  sinModelo: ((n: number) =>
    tb(`${n} casos, sin modelo`, `${n} cases, no model`)) as Plantilla<number>,
  aPersona: ((p: { n: number; de: number }) =>
    tb(
      `${p.n} de ${p.de} a una persona`,
      `${p.n} of ${p.de} to a person`,
    )) as Plantilla<{
    n: number;
    de: number;
  }>,
  documentos: ((n: number) =>
    tb(
      `${n} documentos en ES y EN`,
      `${n} documents in ES and EN`,
    )) as Plantilla<number>,
};

export const PUEDE: ReadonlyArray<{ titulo: TextoBilingue }> = [
  {
    titulo: tb(
      "Leer texto libre y volverlo datos en un formato fijo",
      "Read free text and turn it into data in a fixed format",
    ),
  },
  {
    titulo: tb(
      "Preguntar lo que falta y seguir con la respuesta",
      "Ask for what is missing and go on with the answer",
    ),
  },
  {
    titulo: tb(
      "Revisar la cobertura con reglas que cualquiera puede leer",
      "Check coverage with rules anyone can read",
    ),
  },
  {
    titulo: tb(
      "Detenerse, esperar a una persona y retomar donde iba",
      "Stop, wait for a person and resume where it was",
    ),
  },
  {
    titulo: tb(
      "Ignorar órdenes escondidas en la solicitud",
      "Ignore orders hidden in the request",
    ),
  },
];

export const CIFRAS_PUEDE = {
  lee: ((p: { casos: number; reintentos: number }) =>
    p.reintentos === 0
      ? tb(
          `${p.casos} casos; ninguna respuesta fuera de formato`,
          `${p.casos} cases; no off-format answer`,
        )
      : tb(
          `${p.casos} casos; ${p.reintentos} ${p.reintentos === 1 ? "respuesta fuera de formato, reintentada" : "respuestas fuera de formato, reintentadas"}`,
          `${p.casos} cases; ${p.reintentos} off-format ${p.reintentos === 1 ? "answer" : "answers"}, retried`,
        )) as Plantilla<{ casos: number; reintentos: number }>,
  pregunta: ((p: { preguntas: number; casos: number }) =>
    tb(
      `${p.preguntas} preguntas en ${p.casos} casos`,
      `${p.preguntas} questions in ${p.casos} cases`,
    )) as Plantilla<{
    preguntas: number;
    casos: number;
  }>,
  cobertura: ((n: number) =>
    tb(`${n} casos, 0 tokens`, `${n} cases, 0 tokens`)) as Plantilla<number>,
  pausas: ((n: number) =>
    tb(
      `${n} pausas y ${n} reanudaciones`,
      `${n} pauses and ${n} resumes`,
    )) as Plantilla<number>,
  inyeccion: ((ids: string) =>
    tb(
      `${ids}: la orden plantada no cambió nada`,
      `${ids}: the planted order changed nothing`,
    )) as Plantilla<string>,
};

export const EXPERTO = {
  arquitectura: {
    rotulo: tb("Arquitectura", "Architecture"),
    patron: [
      tb("Patrón", "Pattern"),
      tb(
        "enrutador + extractor, verificador de cobertura y redactor + aclaración y decisión",
        "router + extractor, coverage checker and writer + clarification and decision",
      ),
    ],
    decision: [
      tb("Decisión", "Decision"),
      tb(
        "D4, de dos vías: se puede volver a agente único",
        "D4, two-way: it can go back to a single agent",
      ),
    ],
    lineaBase: tb("Línea base", "Baseline"),
    lineaBaseTexto: ((refutado: boolean) =>
      refutado
        ? tb(
            "agente único a igual presupuesto sobre el mismo lote: S3 quedó refutado, con varios agentes fue más lento que con uno solo",
            "single agent at equal budget on the same batch: S3 was refuted, the multi-agent version was slower than the single agent",
          )
        : tb(
            "agente único a igual presupuesto sobre el mismo lote: S3 se sostuvo, varios agentes no rindieron peor que uno solo",
            "single agent at equal budget on the same batch: S3 held, several agents did no worse than one",
          )) as Plantilla<boolean>,
    orquestacion: [
      tb("Orquestación", "Orchestration"),
      tb(
        "LangGraph 1.x: `StateGraph`, `add_conditional_edges` con `path_map` explícito, `interrupt` + `Command(resume=…)`; sin `langgraph-supervisor`",
        "LangGraph 1.x: `StateGraph`, `add_conditional_edges` with an explicit `path_map`, `interrupt` + `Command(resume=…)`; no `langgraph-supervisor`",
      ),
    ],
  },
  grafo: {
    rotulo: tb("Grafo", "Graph"),
    contrato: tb("Contrato del plan", "Plan contract"),
    contratoTexto: ((p: {
      nodos: number;
      reglas: number;
      pausas: number;
      rol: string;
      campos: number;
    }) =>
      tb(
        `${p.nodos} nodos · ${p.reglas} aristas condicionales · ${p.pausas} pausa humana (rol ${p.rol}, ${p.campos} campos mínimos)`,
        `${p.nodos} nodes · ${p.reglas} conditional edges · ${p.pausas} human pause (${p.rol} role, ${p.campos} minimum fields)`,
      )) as Plantilla<{
      nodos: number;
      reglas: number;
      pausas: number;
      rol: string;
      campos: number;
    }>,
    sprint: ((n: number) =>
      tb(`Sprint ${n}`, `Sprint ${n}`)) as Plantilla<number>,
    sprintTexto: ((p: {
      nodos: number;
      aristas: number;
      condicionales: number;
    }) =>
      tb(
        `${p.nodos} nodos + inicio y fin · ${p.aristas} aristas · ${p.condicionales} condicionales (\`get_graph().to_json()\`)`,
        `${p.nodos} nodes + start and end · ${p.aristas} edges · ${p.condicionales} conditional (\`get_graph().to_json()\`)`,
      )) as Plantilla<{
      nodos: number;
      aristas: number;
      condicionales: number;
    }>,
    coincide: tb("Coincide", "Matches"),
    coincideTexto: ((p: {
      n: number;
      de: number;
      r: number;
      rde: number;
      fuera: number;
    }) =>
      tb(
        `${p.n} de ${p.de} nodos · ${p.r} de ${p.rde} reglas · ${p.fuera} nodos fuera del contrato`,
        `${p.n} of ${p.de} nodes · ${p.r} of ${p.rde} rules · ${p.fuera} nodes outside the contract`,
      )) as Plantilla<{
      n: number;
      de: number;
      r: number;
      rde: number;
      fuera: number;
    }>,
    huella: tb("Huella del grafo", "Graph fingerprint"),
  },
  modelo: {
    rotulo: tb("Modelo y proveedor", "Model and provider"),
    adaptador: tb("Adaptador", "Adapter"),
    modelo: tb("Modelo", "Model"),
    modeloTexto: ((p: { alias: string; n: number }) =>
      tb(
        `alias \`${p.alias}\` en los ${p.n} nodos con modelo`,
        `alias \`${p.alias}\` on the ${p.n} model nodes`,
      )) as Plantilla<{
      alias: string;
      n: number;
    }>,
    regimen: [
      tb("Régimen", "Regime"),
      tb(
        "suscripción de Claude Code del autor; lotes de 20 fuera de CI; interruptor a API (Haiku 4.5) o Groq (D6)",
        "the author's Claude Code subscription; batches of 20 outside CI; switch to API (Haiku 4.5) or Groq (D6)",
      ),
    ],
    aislamiento: [
      tb("Aislamiento", "Isolation"),
      tb(
        "sin herramientas · MCP vacío · sin settings · directorio temporal limpio · nunca `--bare`",
        "no tools · empty MCP · no settings · clean temp directory · never `--bare`",
      ),
    ],
  },
  versiones: { rotulo: tb("Versiones de la corrida", "Run versions") },
  estado: {
    rotulo: tb("Estado", "State"),
    tipo: tb("Tipo", "Type"),
    tipoTexto: ((p: { senales: number; trabajo: number }) =>
      tb(
        `\`TypedDict Estado\`: ${p.senales} señales del plan con su nombre del contrato + ${p.trabajo} claves de trabajo`,
        `\`TypedDict Estado\`: ${p.senales} plan signals under their contract names + ${p.trabajo} working keys`,
      )) as Plantilla<{ senales: number; trabajo: number }>,
    trabajo: tb("Claves de trabajo", "Working keys"),
    senales: tb(
      "Señales exigidas en la traza",
      "Signals required in the trace",
    ),
  },
  persistencia: {
    rotulo: tb("Persistencia y trazas", "Persistence and traces"),
    checkpointer: [
      tb("Checkpointer", "Checkpointer"),
      tb(
        "`SqliteSaver` en las corridas (archivo 600, derivado privado) · `InMemorySaver` en las pruebas",
        "`SqliteSaver` in runs (mode 600, private derivative) · `InMemorySaver` in tests",
      ),
    ],
    hilo: [
      tb("Hilo", "Thread"),
      tb("un `thread_id` por caso", "one `thread_id` per case"),
    ],
    trazas: [
      tb("Trazas", "Traces"),
      tb(
        "propias, `planlang-trace/v1`, una por caso con su huella; LangSmith solo como espejo",
        "own, `planlang-trace/v1`, one per case with its fingerprint; LangSmith only as a mirror",
      ),
    ],
  },
  evaluacion: {
    rotulo: tb("Evaluación", "Evaluation"),
    verificador: tb("Verificador", "Verifier"),
    verificadorTexto: ((p: {
      criterios: number;
      riesgos: number;
      supuestos: number;
    }) =>
      tb(
        `determinista, sin modelo: ${p.criterios} criterios, ${p.riesgos} detectores de riesgo, ${p.supuestos} supuestos, contrato de grafo`,
        `deterministic, no model: ${p.criterios} criteria, ${p.riesgos} risk detectors, ${p.supuestos} assumptions, graph contract`,
      )) as Plantilla<{
      criterios: number;
      riesgos: number;
      supuestos: number;
    }>,
    cruzada: tb("Prueba cruzada", "Cross-check"),
    cruzadaTexto: ((p: { decisiones: number; diferencias: number }) =>
      tb(
        `RF-09.2: ${p.decisiones} decisiones de arista rehechas en TypeScript, ${p.diferencias} diferencias`,
        `RF-09.2: ${p.decisiones} edge decisions redone in TypeScript, ${p.diferencias} differences`,
      )) as Plantilla<{ decisiones: number; diferencias: number }>,
    lotes: tb("Lotes", "Batches"),
    lotesTexto: ((p: { casos: number; repeticiones: number; base: boolean }) =>
      tb(
        `${p.casos} casos × ${p.repeticiones} repeticiones${p.base ? " + línea base de agente único" : ""}`,
        `${p.casos} cases × ${p.repeticiones} repetitions${p.base ? " + single-agent baseline" : ""}`,
      )) as Plantilla<{ casos: number; repeticiones: number; base: boolean }>,
    plan: tb("Plan", "Plan"),
    planTexto: ((p: {
      d: number;
      r: number;
      s: number;
      c: number;
      u: number;
    }) =>
      tb(
        `${p.d} decisiones · ${p.r} riesgos · ${p.s} supuestos · ${p.c} criterios · ${p.u} umbrales`,
        `${p.d} decisions · ${p.r} risks · ${p.s} assumptions · ${p.c} criteria · ${p.u} thresholds`,
      )) as Plantilla<{
      d: number;
      r: number;
      s: number;
      c: number;
      u: number;
    }>,
  },
  matriz: {
    rotulo: tb(
      "Qué del plan toca a cada nodo",
      "What in the plan touches each node",
    ),
    nota: ((n: number) =>
      tb(
        `Cada fila une un nodo del contrato con las decisiones, riesgos, supuestos, criterios y umbrales que lo gobiernan, y dice en cuántos de los ${n} casos corrió.`,
        `Each row ties a contract node to the decisions, risks, assumptions, criteria and thresholds that govern it, and says in how many of the ${n} cases it ran.`,
      )) as Plantilla<number>,
    columnas: [
      tb("Nodo", "Node"),
      tb("Decisiones", "Decisions"),
      tb("Riesgos", "Risks"),
      tb("Supuestos", "Assumptions"),
      tb("Criterios", "Criteria"),
      tb("Umbrales", "Thresholds"),
      tb("En la corrida", "In the run"),
    ],
    senal: tb("señal", "signal"),
    fuente: ((plan: string) =>
      tb(
        `Lectura del plan ${plan} hecha por el autor y comprobada contra el plan: cada id existe y ningún elemento queda sin nodo. Los conteos son reales.`,
        `The author's reading of plan ${plan}, checked against the plan: every id exists and no element is left without a node. The counts are real.`,
      )) as Plantilla<string>,
  },
  codigoEstado: tb("El estado del grafo", "The graph state"),
};

export const CONTRATO_CIFRAS = {
  titulo: tb("Lo que corrió, frente a su plan", "What ran, against its plan"),
  chip: tb("real · grafo exportado", "real · exported graph"),
  nodos: tb(
    "nodos del contrato están en el grafo",
    "contract nodes are in the graph",
  ),
  nodosDetalle: ((p: { faltan: number; sobran: number }) =>
    p.faltan === 0 && p.sobran === 0
      ? tb(
          "Ninguno falta y ninguno sobra. El spike tenía 3 de 8 (abajo, al final).",
          "None missing and none extra. The spike had 3 of 8 (below, at the end).",
        )
      : tb(
          `Faltan ${p.faltan} y sobran ${p.sobran}.`,
          `${p.faltan} missing and ${p.sobran} extra.`,
        )) as Plantilla<{
    faltan: number;
    sobran: number;
  }>,
  reglas: tb(
    "reglas de arista del contrato, con su señal",
    "contract edge rules, with their signal",
  ),
  reglasDetalle: tb(
    "Cada rama que toma el agente deja su señal y su umbral en la traza antes de enrutar.",
    "Every branch the agent takes leaves its signal and threshold in the trace before routing.",
  ),
  cruzada: tb(
    "decisiones rehechas en otro lenguaje · diferencias",
    "decisions redone in another language · differences",
  ),
  cruzadaDetalle: tb(
    "El playground (TypeScript) evaluó las mismas reglas sobre las trazas y tomó las mismas ramas (RF-09.2).",
    "The playground (TypeScript) evaluated the same rules over the traces and took the same branches (RF-09.2).",
  ),
  fuente: ((p: { plan: string; corrida: string; huella: string }) =>
    tb(
      `Contrato de grafo del plan ${p.plan} frente al grafo exportado de la corrida ${p.corrida} (huella \`${p.huella}\`).`,
      `Plan ${p.plan} graph contract against the graph exported by run ${p.corrida} (fingerprint \`${p.huella}\`).`,
    )) as Plantilla<{ plan: string; corrida: string; huella: string }>,
};

export const GRAFO = {
  titulo: tb("El grafo", "The graph"),
  lienzo: tb("Lienzo", "Canvas"),
  lista: tb("Lista por capa", "List by layer"),
  vista: tb("Vista", "View"),
  nota: tb(
    "Lo genera el código desde el grafo compilado y el plan (el diagramador de la casa, contrato 0.3.0). Toca un nodo o una regla: abajo aparece su detalle por perfil.",
    "Code generates it from the compiled graph and the plan (the house diagrammer, contract 0.3.0). Tap a node or a rule: its detail by profile appears below.",
  ),
  region: tb(
    "Diagrama del agente; se desliza de lado",
    "Agent diagram; scrolls sideways",
  ),
  indice: tb("Desliza · capa", "Slide · layer"),
  irACapa: tb("Ir a la capa", "Go to layer"),
  svgTitulo: ((p: {
    demo: TextoBilingue;
    sprint: number;
    corrida: string;
    nodos: number;
    reglas: number;
  }) =>
    tb(
      `Grafo real del ${p.demo.es}, sprint ${p.sprint}, corrida ${p.corrida}: los ${p.nodos} nodos del contrato y sus ${p.reglas} reglas de arista`,
      `Real ${p.demo.en} graph, sprint ${p.sprint}, run ${p.corrida}: the ${p.nodos} contract nodes and their ${p.reglas} edge rules`,
    )) as Plantilla<{
    demo: TextoBilingue;
    sprint: number;
    corrida: string;
    nodos: number;
    reglas: number;
  }>,
  svgDescripcion: tb(
    "Seis capas de izquierda a derecha, de la entrada a la salida. La lista por capa dice lo mismo en texto.",
    "Six layers from left to right, from input to output. The list by layer says the same in text.",
  ),
  terminales: { inicio: tb("solicitud", "request"), fin: tb("fin", "end") },
  leyenda: {
    secuencia: tb("secuencia", "sequence"),
    condicional: tb(
      "condicional · señal · operador · valor; «si no», cuando ninguna regla se cumple",
      "conditional · signal · operator · value; “else”, when no rule holds",
    ),
    reanudacion: tb(
      "reanudación · responde una persona",
      "resume · a person answers",
    ),
    salto: tb(
      "salto · dos flechas que se cruzan sin unirse",
      "hop · two arrows that cross without joining",
    ),
  },
  lista_: {
    terminalInicio: tb("solicitud (terminal)", "request (terminal)"),
    terminalFin: tb(
      "fin (terminal): la respuesta filtrada y la traza",
      "end (terminal): the filtered answer and the trace",
    ),
    secuencia: tb("secuencia", "sequence"),
    reanudacion: tb(
      "reanudación (responde el auditor médico)",
      "resume (the medical auditor answers)",
    ),
    siNo: tb("si no", "else"),
    reglasEnOrden: ((n: number) =>
      tb(`${n} reglas en orden`, `${n} rules in order`)) as Plantilla<number>,
    o: tb("o", "or"),
    fin: tb("fin", "end"),
  },
  detalle: tb("Detalle de la selección", "Selection detail"),
  anuncio: ((nombre: string) =>
    tb(`Detalle: ${nombre}`, `Detail: ${nombre}`)) as Plantilla<string>,
};

/** Detalle del lienzo por tipo de nodo: lo que sigue a la etiqueta corta en la caja. */
export const DETALLE_NODO = {
  reglas: ((n: number) =>
    tb(
      `${n} ${n === 1 ? "regla" : "reglas"}`,
      `${n} ${n === 1 ? "rule" : "rules"}`,
    )) as Plantilla<number>,
};

/** Nombre corto de cada regla en las líneas que agrupan tres o más (la de decision hacia la pausa). */
export const REGLA_CORTA: Record<string, TextoBilingue> = {
  "decision#3": tb("contradicción", "contradiction"),
  "decision#4": tb("negar", "deny"),
  "decision#5": tb("Texas", "Texas"),
};

export const PANEL = {
  lider: tb("Líder", "Leader"),
  experto: tb("Experto", "Expert"),
  codigo: tb("Código", "Code"),
  trazas: tb("Trazas", "Traces"),
  pestanas: tb("Detalle por perfil", "Detail by profile"),
  recibe: tb("Recibe", "Takes in"),
  entrega: tb("Entrega", "Delivers"),
  campos: {
    paraQue: tb("Para qué existe", "Why it exists"),
    como: tb("Cómo lo hace", "How it works"),
    decide: tb("Qué decide", "What it decides"),
    siFalla: tb("Si falla", "If it fails"),
    seMide: tb("Cómo se mide", "How it is measured"),
    enLaCorrida: ((n: number) =>
      tb(`En los ${n} casos`, `In the ${n} cases`)) as Plantilla<number>,
  },
  experto_: {
    contrato: tb("Contrato y estado", "Contract and state"),
    nodo: tb("Nodo", "Node"),
    capa: ((p: { n: string; banda: TextoBilingue }) =>
      tb(
        `capa ${p.n}, ${p.banda.es.toLowerCase()}`,
        `layer ${p.n}, ${p.banda.en.toLowerCase()}`,
      )) as Plantilla<{
      n: string;
      banda: TextoBilingue;
    }>,
    lee: tb("Lee", "Reads"),
    escribe: tb("Escribe", "Writes"),
    entraDesde: tb("Entra desde", "Comes from"),
    saleHacia: tb("Sale hacia", "Goes to"),
    reglas: tb("Reglas del plan", "Plan rules"),
    sinReglas: tb(
      "ninguna: sigue siempre al mismo nodo",
      "none: it always goes to the same node",
    ),
    planExige: tb("Lo que el plan le exige", "What the plan requires"),
    observado: ((c: string) =>
      tb(
        `Observado en la corrida ${c}`,
        `Observed in run ${c}`,
      )) as Plantilla<string>,
    casosVisitas: tb("Casos · visitas", "Cases · visits"),
    modelo: tb("Modelo", "Model"),
    caminos: tb("Caminos", "Paths"),
    sinModelo: tb(
      "ninguno: 0 tokens, 0 USD, código",
      "none: 0 tokens, 0 USD, code",
    ),
    conModelo: ((p: { alias: string; tokens: string; usd: string }) =>
      tb(
        `${p.alias}: ${p.tokens} tokens, ${p.usd} USD nominales`,
        `${p.alias}: ${p.tokens} tokens, ${p.usd} USD nominal`,
      )) as Plantilla<{
      alias: string;
      tokens: string;
      usd: string;
    }>,
    inicio: tb("inicio", "start"),
    fin: tb("fin", "end"),
  },
  codigo_: {
    nodo: tb("El nodo", "The node"),
    ruta: tb(
      "La función de la arista: lee la rama que el nodo ya dejó escrita",
      "The edge function: it reads the branch the node already wrote",
    ),
    lineas: ((p: { desde: number; hasta: number }) =>
      tb(
        `líneas ${p.desde}–${p.hasta}`,
        `lines ${p.desde}–${p.hasta}`,
      )) as Plantilla<{ desde: number; hasta: number }>,
    fuente: ((p: { grafo: string; corrida: string }) =>
      tb(
        `Código del repositorio en este build, sin editar. El grafo que compila es el de la corrida ${p.corrida} (huella \`${p.grafo}\`).`,
        `The repository's code in this build, unedited. The graph it compiles is run ${p.corrida}'s (fingerprint \`${p.grafo}\`).`,
      )) as Plantilla<{ grafo: string; corrida: string }>,
    chip: tb("real · código", "real · code"),
  },
  trazas_: {
    caso: tb("Caso", "Case"),
    tipo: tb("Tipo", "Type"),
    solicitud: tb("Solicitud · texto sintético", "Request · synthetic text"),
    verCaso: tb("Ver el caso de punta a punta", "See the case end to end"),
    /** `casos`: «A-016, A-017, A-018» si son pocos, o «A-006 … A-020». */
    verMas: ((p: { n: number; casos: string }) =>
      tb(
        `Ver ${p.n} más: ${p.casos}`,
        `See ${p.n} more: ${p.casos}`,
      )) as Plantilla<{ n: number; casos: string }>,
    verMenos: tb("Ver menos", "See less"),
    reglaQueDecidio: tb("Regla que decidió", "Rule that decided"),
    porDefecto: tb("ninguna: rama por defecto", "none: default branch"),
    ninguna: tb("ninguna", "none"),
    si: tb("sí", "yes"),
    no: tb("no", "no"),
  },
};

/** Tipo de caso sintético, como lo nombra la vitrina. */
export const TIPO_DE_CASO: Record<string, TextoBilingue> = {
  normal: tb("normal", "normal"),
  borde: tb("borde", "edge case"),
  adversario: tb("adversario", "adversarial"),
  faltante: tb("faltante", "missing data"),
};

/** Cómo lo nombra un líder: rol del nodo, qué recibe y entrega, y los seis campos del panel. */
export interface TextosDeNodoVitrina {
  rol: TextoBilingue;
  recibe: { titulo: TextoBilingue; sub: TextoBilingue };
  entrega: { titulo: TextoBilingue; sub: TextoBilingue };
  paraQue: TextoBilingue;
  como: TextoBilingue;
  decide?: TextoBilingue;
  siFalla: TextoBilingue;
  seMide: TextoBilingue;
  /**
   * Un campo más, propio del nodo. `falta: true` es lo que el nodo aún no hace («Lo que aún no hace»: va tras «Qué
   * decide», en tinta 2); si no, es una garantía más («Doble cinturón») y va al final.
   */
  extra?: { rotulo: TextoBilingue; texto: TextoBilingue; falta?: boolean };
  lee: TextoBilingue;
  /**
   * El grupo propio del nodo en el panel del experto (maqueta): por qué no usa modelo, cómo está configurado, qué
   * reglas aplica o qué revisa. En los valores, `{modelo}` es el alias de la corrida, `{politica}` la del revisor
   * simulado y `{acciones}` la lista blanca vista en las trazas; `{n}` en el rótulo, cuántas reglas. Con
   * `reglasDelPlan`, las filas son las reglas del plan para el nodo, en orden.
   */
  modelo: {
    rotulo: TextoBilingue;
    filas: ReadonlyArray<readonly [TextoBilingue, TextoBilingue]>;
    reglasDelPlan?: boolean;
  };
  /** Fuentes del mapa del diagramador (V3): la documentación oficial del primitivo de LangGraph que usa. */
  fuentes: Fuente[];
}

/** Filas comunes de la configuración de los nodos con modelo (adaptador de la regla 6). */
const LLAMADA = tb("Llamada", "Call");
const LLAMADA_TEXTO = tb(
  "`claude -p` · sin herramientas · MCP vacío · directorio temporal limpio",
  "`claude -p` · no tools · empty MCP · clean temp directory",
);
const SALIDA = tb("Salida", "Output");
const SALIDA_TEXTO = tb(
  "estructurada nativa, `extra=forbid`; si no cumple, se reintenta y queda contado",
  "native structured, `extra=forbid`; if it fails, it is retried and counted",
);
const INSTRUCCION = tb("Instrucción", "Instruction");

const FECHA_FUENTES = "2026-09-27";
const F_NODOS: Fuente = {
  url: "https://docs.langchain.com/oss/python/langgraph/graph-api",
  titulo: tb(
    "LangGraph: la API del grafo (nodos y aristas)",
    "LangGraph: the graph API (nodes and edges)",
  ),
  fecha: FECHA_FUENTES,
  tipo: "oficial",
};
const F_INTERRUPT: Fuente = {
  url: "https://docs.langchain.com/oss/python/langgraph/interrupts",
  titulo: tb(
    "LangGraph: interrupciones con intervención humana",
    "LangGraph: human-in-the-loop interrupts",
  ),
  fecha: FECHA_FUENTES,
  tipo: "oficial",
};
const F_SALIDA: Fuente = {
  url: "https://docs.langchain.com/oss/python/langchain/structured-output",
  titulo: tb("LangChain: salida estructurada", "LangChain: structured output"),
  fecha: FECHA_FUENTES,
  tipo: "oficial",
};

/** «C1 y C3 se cumplieron.» · «C4 se cumplió.» · «C1 se cumplió; C3, no.» */
export function frasesDeCriterios(
  ids: readonly string[],
  cumple: (id: string) => boolean,
): TextoBilingue {
  const si = ids.filter(cumple);
  const no = ids.filter((x) => !cumple(x));
  const lista = (l: string[], y: string) =>
    l.length <= 1
      ? l.join("")
      : `${l.slice(0, -1).join(", ")} ${y} ${l[l.length - 1]}`;
  const es: string[] = [];
  const en: string[] = [];
  if (si.length) {
    es.push(
      `${lista(si, "y")} se ${si.length === 1 ? "cumplió" : "cumplieron"}`,
    );
    en.push(`${lista(si, "and")} ${si.length === 1 ? "was" : "were"} met`);
  }
  if (no.length) {
    es.push(
      `${lista(no, "y")} no se ${no.length === 1 ? "cumplió" : "cumplieron"}`,
    );
    en.push(`${lista(no, "and")} ${no.length === 1 ? "was" : "were"} not met`);
  }
  return tb(`${es.join("; ")}.`, `${en.join("; ")}.`);
}

/** Las cifras de un nodo en la corrida, que las plantillas de «En los N casos» convierten en frase. */
export interface CifrasDeNodo {
  total: number;
  casos: number;
  visitas: number;
  criterios: TextoBilingue;
  aExtractor: number;
  urgencias: number;
  exentos: number;
  reintentos: number;
  preguntas: number;
  resueltos: string[];
  tope: string[];
  excluidos: number;
  altoCosto: number;
  contradicciones: number;
  solos: number;
  aPersona: number;
  porRegla: {
    negar: number;
    altoCosto: number;
    confianza: number;
    contradiccion: number;
    texas: number;
  };
  pausas: number;
  desdeDecision: number;
  desdeAclaracion: number;
  nego: number;
  aprobo: number;
  minutos: number;
  minutosPorCaso: number;
  negaciones: number;
  hallazgos: number;
  severidadMax: number;
  cargas: string[];
  accion: string;
  s1: { medidos: number; aciertos: number; sinProbar: boolean };
  s2: string;
}

const lista = (ids: string[], y: string) =>
  ids.length <= 1
    ? ids.join("")
    : `${ids.slice(0, -1).join(", ")} ${y} ${ids[ids.length - 1]}`;

export const NODOS: Record<
  string,
  TextosDeNodoVitrina & { enLaCorrida: (c: CifrasDeNodo) => TextoBilingue }
> = {
  enrutador: {
    rol: tb(
      "Clasifica la atención y decide si el caso necesita revisión de cobertura.",
      "It classifies the care and decides whether the case needs a coverage check.",
    ),
    recibe: {
      titulo: tb(
        "La orden adjunta y el plan de beneficios",
        "The attached order and the benefits plan",
      ),
      sub: tb(
        "el tipo de atención y el código del procedimiento",
        "the type of care and the procedure code",
      ),
    },
    entrega: {
      titulo: tb(
        "El camino: al extractor, o directo al redactor",
        "The path: to the extractor, or straight to the writer",
      ),
      sub: tb(
        "si es urgencia o servicio exento",
        "if it is an emergency or an exempt service",
      ),
    },
    paraQue: tb(
      "Una urgencia no espera: la ley manda autorizarla sin revisar cobertura, y lo mismo los servicios que el plan exime. Este paso las separa antes de gastar tiempo en lo demás.",
      "An emergency does not wait: the law requires authorizing it without a coverage check, and the same goes for services the plan exempts. This step sets them apart before spending time on the rest.",
    ),
    como: tb(
      "Con reglas fijas, sin modelo: lee el tipo de atención de la orden adjunta y busca el procedimiento en la lista de exentos del plan de beneficios.",
      "With fixed rules, no model: it reads the type of care from the attached order and looks the procedure up in the benefits plan's exempt list.",
    ),
    decide: tb(
      "Dos reglas del plan, en orden: urgencia → redactor; servicio exento → redactor. Si ninguna se cumple, el caso sigue al extractor.",
      "Two plan rules, in order: emergency → writer; exempt service → writer. If neither holds, the case goes on to the extractor.",
    ),
    siFalla: tb(
      "Pediría autorización para una urgencia o para un servicio exento (riesgo R6), o confundiría el papel de cada agente (R7).",
      "It would require authorization for an emergency or an exempt service (risk R6), or blur each agent's role (R7).",
    ),
    seMide: tb(
      "Toda urgencia y todo servicio exento se autorizan sin revisar cobertura (criterio C4).",
      "Every emergency and every exempt service is authorized without a coverage check (criterion C4).",
    ),
    enLaCorrida: (c) =>
      tb(
        `${c.aExtractor} siguieron al extractor. ${c.urgencias} urgencias y ${c.exentos} servicios exentos fueron directo al redactor, sin pasar por la cobertura. ${c.criterios.es}`,
        `${c.aExtractor} went on to the extractor. ${c.urgencias} emergencies and ${c.exentos} exempt services went straight to the writer, skipping coverage. ${c.criterios.en}`,
      ),
    lee: tb(
      "la orden adjunta y el plan de beneficios",
      "the attached order and the benefits plan",
    ),
    modelo: {
      rotulo: tb("Por qué no usa modelo", "Why it uses no model"),
      filas: [
        [
          tb("Código primero", "Code first"),
          tb(
            "la urgencia viene escrita en la orden y la lista de exentos es una tabla: no hay texto libre que interpretar",
            "the urgency is written on the order and the exempt list is a table: there is no free text to interpret",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
  extractor: {
    rol: tb(
      "Lee la solicitud del médico y la vuelve datos ordenados, diciendo qué tan seguro está.",
      "It reads the physician’s request and turns it into ordered data, stating how sure it is.",
    ),
    recibe: {
      titulo: tb(
        "El texto libre del médico y la orden adjunta",
        "The physician's free text and the attached order",
      ),
      sub: tb(
        "sin nombre ni identificación del afiliado (D1)",
        "without the member's name or ID (D1)",
      ),
    },
    entrega: {
      titulo: tb(
        "Procedimiento, diagnóstico, urgencia y costo, los datos que faltan y su confianza",
        "Procedure, diagnosis, urgency and cost, the missing fields and its confidence",
      ),
      sub: tb("la confianza va de 0 a 1", "confidence goes from 0 to 1"),
    },
    paraQue: tb(
      "Las reglas no pueden leer texto libre. Este paso lo convierte en datos que el resto del agente sí puede revisar.",
      "Rules cannot read free text. This step turns it into data the rest of the agent can check.",
    ),
    como: tb(
      "Un modelo de lenguaje (sonnet, por la suscripción de Claude Code) lee el texto con instrucciones fijas y responde en un formato cerrado. Si falta un dato, lo deja vacío.",
      "A language model (sonnet, via the Claude Code subscription) reads the text under fixed instructions and answers in a closed format. If a field is absent, it leaves it empty.",
    ),
    decide: tb(
      "Una regla: si falta algún dato, el caso va a aclaración; si no, al verificador de cobertura. Su confianza decide más adelante si hace falta una persona (U1).",
      "One rule: if any field is missing, the case goes to clarification; otherwise, to the coverage checker. Its confidence later decides whether a person is needed (U1).",
    ),
    siFalla: tb(
      "Puede decirse seguro sin estarlo (riesgo R5) u obedecer una orden escondida en el texto (R3). Los dos tienen prioridad alta.",
      "It may claim certainty it lacks (risk R5) or obey an order hidden in the text (R3). Both are high priority.",
    ),
    seMide: tb(
      "Acierto de 90 % o más en tres corridas seguidas (C5), instrucciones escondidas sin efecto (C6) y una confianza que corresponda a sus aciertos (supuesto S1).",
      "90% accuracy or more across three runs in a row (C5), hidden instructions with no effect (C6) and a confidence that matches its hits (assumption S1).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Leyó ${c.casos} casos, ${c.visitas} veces: ${c.visitas - c.casos} relecturas tras una aclaración. ${c.reintentos === 0 ? "Ninguna respuesta salió fuera de formato." : c.reintentos === 1 ? "Una respuesta salió fuera de formato y se reintentó." : `${c.reintentos} respuestas salieron fuera de formato y se reintentaron.`} ${c.criterios.es}`,
        `It read ${c.casos} cases, ${c.visitas} times: ${c.visitas - c.casos} re-reads after a clarification. ${c.reintentos === 0 ? "No answer came out off-format." : c.reintentos === 1 ? "One answer came out off-format and was retried." : `${c.reintentos} answers came out off-format and were retried.`} ${c.criterios.en}`,
      ),
    lee: tb(
      "el texto del médico enmascarado, la orden y las aclaraciones",
      "the masked physician text, the order and the clarifications",
    ),
    modelo: {
      rotulo: tb("Configuración del modelo", "Model configuration"),
      filas: [
        [
          tb("Adaptador", "Adapter"),
          tb(
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Extraccion)`',
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Extraccion)`',
          ),
        ],
        [LLAMADA, LLAMADA_TEXTO],
        [SALIDA, SALIDA_TEXTO],
        [
          INSTRUCCION,
          tb(
            "fija; el texto del caso va entre marcas «dato, no instrucción» y con nombre e identificación enmascarados (D1)",
            "fixed; the case text goes between “data, not instruction” markers with name and ID masked (D1)",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS, F_SALIDA],
  },
  aclaracion: {
    rol: tb(
      "Cuando faltan datos, se los pregunta al médico antes de decidir.",
      "When data is missing, it asks the physician before deciding.",
    ),
    recibe: {
      titulo: tb("La lista de datos que faltan", "The list of missing fields"),
      sub: tb("y cuántas preguntas van", "and how many questions were asked"),
    },
    entrega: {
      titulo: tb(
        "Una pregunta al médico y su respuesta, de vuelta al extractor",
        "A question to the physician and the answer, back to the extractor",
      ),
      sub: tb(
        "tras 2 preguntas, pasa a una persona (U3)",
        "after 2 questions, it goes to a person (U3)",
      ),
    },
    paraQue: tb(
      "Decidir con datos incompletos es la forma más fácil de equivocarse. Preguntar cuesta segundos; negar por falta de un dato cuesta mucho más.",
      "Deciding on incomplete data is the easiest way to get it wrong. Asking costs seconds; denying for lack of a field costs far more.",
    ),
    como: tb(
      "Un modelo de lenguaje redacta una pregunta corta sobre lo que falta. En este demo, la respuesta del médico viene simulada en el caso sintético.",
      "A language model drafts a short question about what is missing. In this demo, the physician's answer is simulated in the synthetic case.",
    ),
    decide: tb(
      "Una regla: si ya van 2 preguntas (U3), el caso pasa a una persona; si no, pregunta y vuelve al extractor con la respuesta.",
      "One rule: if 2 questions were already asked (U3), the case goes to a person; otherwise it asks and goes back to the extractor with the answer.",
    ),
    siFalla: tb(
      "Podría quedarse preguntando sin fin (riesgo R4).",
      "It could keep asking forever (risk R4).",
    ),
    seMide: tb(
      "El supuesto S2: dos ciclos de aclaración bastan en el 95 % de los casos incompletos.",
      "Assumption S2: two clarification cycles are enough in 95% of incomplete cases.",
    ),
    enLaCorrida: (c) =>
      tb(
        `${c.casos} casos incompletos, ${c.preguntas} preguntas.${c.resueltos.length ? ` ${lista(c.resueltos, "y")} se ${c.resueltos.length === 1 ? "resolvió" : "resolvieron"} preguntando;` : ""}${c.tope.length ? ` ${lista(c.tope, "y")} ${c.tope.length === 1 ? "llegó" : "llegaron"} al tope de 2 y ${c.tope.length === 1 ? "pasó" : "pasaron"} a una persona.` : ""} S2 quedó ${c.s2}.`,
        `${c.casos} incomplete cases, ${c.preguntas} questions.${c.resueltos.length ? ` ${lista(c.resueltos, "and")} ${c.resueltos.length === 1 ? "was" : "were"} resolved by asking;` : ""}${c.tope.length ? ` ${lista(c.tope, "and")} hit the cap of 2 and went to a person.` : ""} S2 was ${c.s2}.`,
      ),
    lee: tb(
      "los datos que faltan y las respuestas previas",
      "the missing fields and previous answers",
    ),
    modelo: {
      rotulo: tb("Configuración del modelo", "Model configuration"),
      filas: [
        [
          tb("Adaptador", "Adapter"),
          tb(
            '`ChatClaudeCode(model="{modelo}").with_structured_output(PreguntaAclaracion)`',
            '`ChatClaudeCode(model="{modelo}").with_structured_output(PreguntaAclaracion)`',
          ),
        ],
        [LLAMADA, LLAMADA_TEXTO],
        [SALIDA, SALIDA_TEXTO],
        [
          INSTRUCCION,
          tb(
            "fija: una sola pregunta, corta, sobre los datos que faltan",
            "fixed: a single short question about the missing fields",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS, F_SALIDA],
  },
  verificador_cobertura: {
    rol: tb(
      "Revisa con reglas fijas si el plan de beneficios cubre el procedimiento.",
      "It checks with fixed rules whether the benefits plan covers the procedure.",
    ),
    recibe: {
      titulo: tb(
        "Procedimiento, diagnóstico y costo, más la orden adjunta",
        "Procedure, diagnosis and cost, plus the attached order",
      ),
      sub: tb("y el plan de beneficios", "and the benefits plan"),
    },
    entrega: {
      titulo: tb(
        "Cubierto, excluido con causal, alto costo o contradicción, y una propuesta",
        "Covered, excluded with a cause, high cost or contradiction, and a proposal",
      ),
      sub: tb(
        "aprobar o negar; decide el nodo siguiente",
        "approve or deny; the next node decides",
      ),
    },
    paraQue: tb(
      "La cobertura es una regla del plan de beneficios, no una opinión: la decide código que cualquiera puede leer, nunca un modelo.",
      "Coverage is a benefits-plan rule, not an opinion: code anyone can read decides it, never a model.",
    ),
    como: tb(
      "Busca el procedimiento en el plan: si está excluido, cita la causal de ley y propone negar; marca alto costo por encima de U2 y la contradicción si el texto y la orden piden cosas distintas.",
      "It looks the procedure up in the plan: if excluded, it cites the legal cause and proposes to deny; it flags high cost above U2 and a contradiction if text and order ask for different things.",
    ),
    siFalla: tb(
      "Autorizaría un servicio excluido o negaría uno cubierto (riesgo R6).",
      "It would authorize an excluded service or deny a covered one (risk R6).",
    ),
    seMide: tb(
      "Urgencias y exentos no pasan por aquí (C4) y toda negación sale con su causal y su documento (C8).",
      "Emergencies and exempt services skip it (C4) and every denial goes out with its cause and document (C8).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Revisó ${c.casos} casos: ${c.excluidos} excluidos con causal, ${c.altoCosto} de alto costo y ${c.contradicciones} ${c.contradicciones === 1 ? "contradicción" : "contradicciones"} entre el texto y la orden; los demás, cubiertos. Sin modelo: 0 tokens.`,
        `It checked ${c.casos} cases: ${c.excluidos} excluded with a cause, ${c.altoCosto} high-cost and ${c.contradicciones} ${c.contradicciones === 1 ? "contradiction" : "contradictions"} between text and order; the rest, covered. No model: 0 tokens.`,
      ),
    lee: tb(
      "la extracción, la orden adjunta y el plan de beneficios",
      "the extraction, the attached order and the benefits plan",
    ),
    modelo: {
      rotulo: tb("Reglas del plan de beneficios", "Benefits-plan rules"),
      filas: [
        [tb("RB-02", "RB-02"), tb("servicio exento", "exempt service")],
        [
          tb("RB-03", "RB-03"),
          tb(
            "servicio excluido: se niega citando la causal del art. 15 de la Ley 1751 y lo confirma una persona",
            "excluded service: denied citing its art. 15 cause of Law 1751, confirmed by a person",
          ),
        ],
        [tb("RB-04", "RB-04"), tb("alto costo: por encima de U2", "high cost: above U2")],
        [
          tb("RB-05", "RB-05"),
          tb(
            "contradicción entre el código leído y el de la orden",
            "contradiction between the code read and the order's",
          ),
        ],
        [tb("RB-07", "RB-07"), tb("cubierto, sin observaciones", "covered, no remarks")],
      ],
    },
    fuentes: [F_NODOS],
  },
  decision: {
    rol: tb(
      "Reúne las señales y decide el camino: sigue solo o pasa a una persona.",
      "It gathers the signals and decides the path: go on alone or to a person.",
    ),
    recibe: {
      titulo: tb(
        "La propuesta del verificador y las señales del caso",
        "The checker's proposal and the case signals",
      ),
      sub: tb(
        "confianza, costo, contradicción y modo Texas",
        "confidence, cost, contradiction and Texas mode",
      ),
    },
    entrega: {
      titulo: tb(
        "El camino: al redactor, o a la pausa humana",
        "The path: to the writer, or to the human pause",
      ),
      sub: tb(
        "ninguna negación sale sin una persona",
        "no denial goes out without a person",
      ),
    },
    paraQue: tb(
      "Es donde el plan pone sus umbrales: aquí se decide qué resuelve el agente solo y qué necesita a un auditor.",
      "It is where the plan places its thresholds: here it is decided what the agent resolves alone and what needs an auditor.",
    ),
    como: tb(
      "Sin modelo: evalúa en orden las 5 reglas del plan (confianza bajo U1, costo sobre U2, contradicción, propuesta de negar y modo Texas). La primera que se cumple manda el caso a una persona.",
      "No model: it evaluates the plan's 5 rules in order (confidence below U1, cost above U2, contradiction, a proposal to deny and Texas mode). The first that holds sends the case to a person.",
    ),
    siFalla: tb(
      "Emitiría una negación sin humano (riesgo R1) o dejaría pasar solo un caso dudoso (R5).",
      "It would issue a denial with no human (risk R1) or let a doubtful case through alone (R5).",
    ),
    seMide: tb(
      "Ninguna negación sin revisión humana (C1) y todo caso de alto costo pasa por una persona (C3).",
      "No denial without human review (C1) and every high-cost case goes through a person (C3).",
    ),
    enLaCorrida: (c) => {
      const r = c.porRegla;
      const partes = (
        [
          [
            r.negar,
            "propuestas de negar",
            "proposals to deny",
            "propuesta de negar",
            "proposal to deny",
          ],
          [
            r.altoCosto,
            "de alto costo",
            "high-cost",
            "de alto costo",
            "high-cost",
          ],
          [
            r.confianza,
            "de baja confianza",
            "low-confidence",
            "de baja confianza",
            "low-confidence",
          ],
          [
            r.contradiccion,
            "contradicciones",
            "contradictions",
            "contradicción",
            "contradiction",
          ],
          [
            r.texas,
            "por modo Texas",
            "under Texas mode",
            "por modo Texas",
            "under Texas mode",
          ],
        ] as const
      ).filter(([n]) => n > 0);
      const es = partes
        .map(([n, v, , u]) => `${n} ${n === 1 ? u : v}`)
        .join(", ");
      const en = partes
        .map(([n, , v, , u]) => `${n} ${n === 1 ? u : v}`)
        .join(", ");
      return tb(
        `Decidió ${c.casos} casos: ${c.solos} siguieron solos al redactor y ${c.aPersona} pasaron a una persona${es ? ` (${es})` : ""}. ${c.criterios.es}`,
        `It decided ${c.casos} cases: ${c.solos} went on alone to the writer and ${c.aPersona} went to a person${en ? ` (${en})` : ""}. ${c.criterios.en}`,
      );
    },
    lee: tb(
      "la propuesta, las señales y los umbrales aplicados",
      "the proposal, the signals and the applied thresholds",
    ),
    modelo: {
      rotulo: tb("Las {n} reglas, en orden", "The {n} rules, in order"),
      filas: [],
      reglasDelPlan: true,
    },
    fuentes: [F_NODOS],
  },
  pausa_humana: {
    rol: tb(
      "Detiene el agente y le entrega el caso completo a un auditor médico.",
      "It halts the agent and hands the full case to a medical auditor.",
    ),
    recibe: {
      titulo: tb(
        "El caso completo, con su evidencia y contraevidencia",
        "The full case, with its evidence and counter-evidence",
      ),
      sub: tb("los campos que exige el plan", "the fields the plan requires"),
    },
    entrega: {
      titulo: tb(
        "La decisión del auditor; el agente retoma donde iba",
        "The auditor's decision; the agent resumes where it was",
      ),
      sub: tb("aquí el auditor está simulado", "here the auditor is simulated"),
    },
    paraQue: tb(
      "Ninguna negación ni rechazo sin una persona: es ley en los dos dominios (CA SB 1120, TX SB 815, AI Act art. 14), no un umbral.",
      "No denial or rejection without a person: it is law in both domains (CA SB 1120, TX SB 815, EU AI Act art. 14), not a threshold.",
    ),
    como: tb(
      "LangGraph detiene el grafo con interrupt y guarda su estado; la respuesta del auditor lo reanuda en el mismo punto, hacia el redactor.",
      "LangGraph halts the graph with interrupt and saves its state; the auditor's answer resumes it at the same point, towards the writer.",
    ),
    siFalla: tb(
      "Una negación saldría sin revisión (riesgo R1), o el auditor decidiría sin ver la evidencia completa.",
      "A denial would go out unreviewed (risk R1), or the auditor would decide without the full evidence.",
    ),
    seMide: tb(
      "Toda negación pasa por aquí (C1) y el auditor ve el caso completo, con evidencia y contraevidencia (C9).",
      "Every denial goes through here (C1) and the auditor sees the full case, with evidence and counter-evidence (C9).",
    ),
    extra: {
      falta: true,
      rotulo: tb("Lo que aún no hace", "What it does not do yet"),
      texto: tb(
        "Tener un auditor de verdad: aquí responde un revisor simulado que sigue la verdad conocida del caso (DA-04), y la vitrina lo dice en cada pantalla.",
        "Have a real auditor: here a simulated reviewer answers, following the case's known truth (DA-04), and the showcase says so on every screen.",
      ),
    },
    enLaCorrida: (c) =>
      tb(
        `${c.pausas} pausas: ${c.desdeDecision} desde decision y ${c.desdeAclaracion} por el tope de aclaraciones. El auditor simulado negó ${c.nego} y aprobó ${c.aprobo}. Unos ${c.minutos} minutos de auditor: ${c.minutosPorCaso} por caso, según el plan.`,
        `${c.pausas} pauses: ${c.desdeDecision} from decision and ${c.desdeAclaracion} from the clarification cap. The simulated auditor denied ${c.nego} and approved ${c.aprobo}. About ${c.minutos} auditor minutes: ${c.minutosPorCaso} per case, per the plan.`,
      ),
    lee: tb(
      "el motivo, la señal, el umbral, la extracción, el texto y la evidencia",
      "the reason, the signal, the threshold, the extraction, the text and the evidence",
    ),
    modelo: {
      rotulo: tb("Revisor simulado", "Simulated reviewer"),
      filas: [
        [tb("Política", "Policy"), tb("`{politica}`", "`{politica}`")],
        [
          tb("Divulgación", "Disclosure"),
          tb(
            "franja del oráculo en Brecha, Playground y Casos; pie de toda pantalla",
            "oracle strip on Gap, Playground and Cases; footer of every screen",
          ),
        ],
      ],
    },
    fuentes: [F_INTERRUPT],
  },
  redactor: {
    rol: tb(
      "Escribe la respuesta al afiliado, con su aviso de IA y, si es negación, su documento.",
      "It writes the member's answer, with its AI notice and, on a denial, its document.",
    ),
    recibe: {
      titulo: tb(
        "La decisión final y su causal",
        "The final decision and its cause",
      ),
      sub: tb(
        "sin nombre ni identificación del afiliado",
        "without the member's name or ID",
      ),
    },
    entrega: {
      titulo: tb(
        "La respuesta en ES y EN y, en cada negación, su documento",
        "The answer in ES and EN and, on each denial, its document",
      ),
      sub: tb(
        "el documento lo arma el código, no el modelo",
        "code assembles the document, not the model",
      ),
    },
    paraQue: tb(
      "El afiliado merece una respuesta clara: qué se decidió, por qué y cómo contradecirlo.",
      "The member deserves a clear answer: what was decided, why and how to appeal it.",
    ),
    como: tb(
      "Un modelo de lenguaje redacta la respuesta en español y en inglés, en un formato cerrado. El documento de decisión adversa no lo escribe el modelo: lo arma el código con la decisión, la causal y la versión del plan.",
      "A language model drafts the answer in Spanish and English, in a closed format. The adverse decision document is not written by the model: code assembles it from the decision, the cause and the plan version.",
    ),
    extra: {
      rotulo: tb("Doble cinturón", "Belt and braces"),
      texto: tb(
        "Antes de escribir una negación, el código comprueba que pasó por una persona; si no, se detiene.",
        "Before writing a denial, code checks it went through a person; if not, it stops.",
      ),
    },
    siFalla: tb(
      "Podría copiar un dato del afiliado en la respuesta (riesgo R2).",
      "It could copy a member's data into the answer (risk R2).",
    ),
    seMide: tb(
      "Toda negación lleva su documento completo, en español y en inglés (C8).",
      "Every denial carries its complete document, in Spanish and English (C8).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Escribió ${c.casos} respuestas; ${c.negaciones} ${c.negaciones === 1 ? "negación" : "negaciones"} con su documento en los dos idiomas. ${c.criterios.es}`,
        `It wrote ${c.casos} answers; ${c.negaciones} ${c.negaciones === 1 ? "denial" : "denials"} with their document in both languages. ${c.criterios.en}`,
      ),
    lee: tb(
      "la decisión, la causal y la extracción, sin el texto libre",
      "the decision, the cause and the extraction, without the free text",
    ),
    modelo: {
      rotulo: tb("Configuración del modelo", "Model configuration"),
      filas: [
        [
          tb("Adaptador", "Adapter"),
          tb(
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Carta)`',
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Carta)`',
          ),
        ],
        [LLAMADA, LLAMADA_TEXTO],
        [SALIDA, SALIDA_TEXTO],
        [
          INSTRUCCION,
          tb(
            "fija: la carta en ES y EN y la lista de acciones; recibe solo decisión, procedimiento, causal y si hubo persona",
            "fixed: the letter in ES and EN and the action list; it only gets decision, procedure, cause and whether a person reviewed it",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS, F_SALIDA],
  },
  guardia_salida: {
    rol: tb(
      "Filtra la respuesta con reglas fijas antes de que llegue al afiliado.",
      "It filters the answer with fixed rules before it reaches the member.",
    ),
    recibe: {
      titulo: tb(
        "La respuesta redactada y las acciones que el agente intentó",
        "The drafted answer and the actions the agent attempted",
      ),
      sub: tb(
        "más lo que la entrada traía escondido",
        "plus whatever the input hid",
      ),
    },
    entrega: {
      titulo: tb(
        "La respuesta si pasa, con su aviso de IA, o bloqueada si no",
        "The answer if it passes, with its AI notice, or blocked if not",
      ),
      sub: tb("con la severidad de la acción", "with the action's severity"),
    },
    paraQue: tb(
      "Es la única defensa con evidencia frente a un atacante que sabe adaptarse: código fijo, no un modelo que se pueda convencer.",
      "It is the only defense with evidence against an attacker who adapts: fixed code, not a model that can be persuaded.",
    ),
    como: tb(
      "Lista blanca de acciones, filtro de los datos sensibles del conjunto sintético y separación entre control y datos: el texto de un caso jamás cambia qué herramienta se llama.",
      "An action allowlist, a filter for the synthetic set's sensitive data and a control/data split: a case's text never changes which tool gets called.",
    ),
    siFalla: tb(
      "Dejaría salir un dato del afiliado (R2) o una instrucción inyectada tendría efecto (R3).",
      "It would let a member's data out (R2) or an injected instruction would take effect (R3).",
    ),
    seMide: tb(
      "Ningún dato del afiliado en la salida (C2) e instrucciones escondidas sin efecto, con severidad cero (C6).",
      "No member data in the output (C2) and hidden instructions with no effect, at zero severity (C6).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Revisó las ${c.casos} respuestas: ${c.hallazgos} hallazgos y severidad ${c.severidadMax === 0 ? "0 en todas" : `máxima ${c.severidadMax}`}.${c.cargas.length ? ` Vio la instrucción escondida de ${lista(c.cargas, "y")}; la acción siguió siendo solo «${c.accion}».` : ""} ${c.criterios.es}`,
        `It checked all ${c.casos} answers: ${c.hallazgos} findings and severity ${c.severidadMax === 0 ? "0 on every one" : `at most ${c.severidadMax}`}.${c.cargas.length ? ` It saw the hidden instruction in ${lista(c.cargas, "and")}; the action stayed just “${c.accion}”.` : ""} ${c.criterios.en}`,
      ),
    lee: tb(
      "la respuesta, las acciones intentadas y la entrada",
      "the answer, the attempted actions and the input",
    ),
    modelo: {
      rotulo: tb("Qué revisa", "What it checks"),
      filas: [
        [tb("Acciones", "Actions"), tb("lista blanca: {acciones}", "allowlist: {acciones}")],
        [
          tb("Datos sensibles", "Sensitive data"),
          tb(
            "los identificadores del conjunto sintético, en ES y EN",
            "the synthetic set's identifiers, in ES and EN",
          ),
        ],
        [
          tb("Aviso de IA", "AI notice"),
          tb("lo añade este nodo a toda salida", "this node adds it to every output"),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
};

/** Lo que el extractor aún no sabe de sí (el supuesto S1 sin probar). */
export const EXTRACTOR_S1 = {
  rotulo: tb("Lo que aún no se sabe", "What is not known yet"),
  texto: ((p: { medidos: number }) =>
    tb(
      `Si su confianza es confiable: acertó los ${p.medidos} casos medidos y, sin un solo error, no hay con qué calibrarla. S1 quedó sin probar.`,
      `Whether its confidence can be trusted: it got all ${p.medidos} measured cases right and, without a single error, there is nothing to calibrate against. S1 remains untested.`,
    )) as Plantilla<{ medidos: number }>,
};

/**
 * La lectura del plan por nodo (matriz «Qué del plan toca a cada nodo» y «Lo que el plan le exige»). La hace el
 * autor; `textos.test.ts` la comprueba contra el plan: cada id existe y todo elemento del plan cae en algún
 * nodo. Calcularla desde el plan exige que el plan declare la relación (propuesta para el S3).
 */
export const PLAN_POR_NODO: Record<
  string,
  {
    decisiones: string[];
    riesgos: string[];
    supuestos: string[];
    criterios: string[];
    umbrales: string[];
    senal?: string[];
  }
> = {
  enrutador: {
    decisiones: ["D4"],
    riesgos: ["R6", "R7"],
    supuestos: ["S3"],
    criterios: ["C4"],
    umbrales: [],
  },
  extractor: {
    decisiones: ["D1", "D6"],
    riesgos: ["R3", "R5", "R8"],
    supuestos: ["S1"],
    criterios: ["C5", "C6"],
    umbrales: [],
    senal: ["U1"],
  },
  aclaracion: {
    decisiones: ["D5", "D6"],
    riesgos: ["R4"],
    supuestos: ["S2"],
    criterios: [],
    umbrales: ["U3"],
  },
  verificador_cobertura: {
    decisiones: [],
    riesgos: ["R6"],
    supuestos: [],
    criterios: ["C4", "C8"],
    umbrales: ["U2"],
  },
  decision: {
    decisiones: ["D2", "D3"],
    riesgos: ["R1", "R5"],
    supuestos: [],
    criterios: ["C1", "C3"],
    umbrales: ["U1", "U2", "U4"],
  },
  pausa_humana: {
    decisiones: ["D2", "D3"],
    riesgos: ["R1"],
    supuestos: [],
    criterios: ["C1", "C3", "C9"],
    umbrales: ["U1", "U2", "U3", "U4"],
  },
  redactor: {
    decisiones: ["D1", "D6"],
    riesgos: ["R2", "R8"],
    supuestos: [],
    criterios: ["C7", "C8"],
    umbrales: [],
  },
  guardia_salida: {
    decisiones: ["D1"],
    riesgos: ["R2", "R3"],
    supuestos: [],
    criterios: ["C2", "C6"],
    umbrales: [],
  },
};

export const ARISTA_U1 = {
  titulo: ((p: { umbral: string; nodo: string }) =>
    tb(
      `Arista ${p.umbral}: la primera regla de ${p.nodo}`,
      `Edge ${p.umbral}: ${p.nodo}’s first rule`,
    )) as Plantilla<{
    umbral: string;
    nodo: string;
  }>,
  rol: ((p: { valor: string; min: number }) =>
    tb(
      `Es la regla que decide si una persona revisa el caso por la confianza de la lectura: por debajo de ${p.valor}, va al auditor. Cada caso que manda cuesta unos ${p.min} minutos de auditor. En el Playground la puedes mover.`,
      `It is the rule that decides whether a person reviews the case because of the reading’s confidence: below ${p.valor}, it goes to the auditor. Each case it sends costs about ${p.min} auditor minutes. You can move it in the Playground.`,
    )) as Plantilla<{ valor: string; min: number }>,
  regla: tb("Regla", "Rule"),
  valor: tb("Valor en el plan", "Plan value"),
  valorTexto: ((p: { valor: string; inclusivo: boolean }) =>
    p.inclusivo
      ? tb(
          `${p.valor} · inclusivo: ${p.valor} exacto va a una persona`,
          `${p.valor} · inclusive: exactly ${p.valor} goes to a person`,
        )
      : tb(
          `${p.valor} · no inclusivo: ${p.valor} exacto sigue solo`,
          `${p.valor} · not inclusive: exactly ${p.valor} goes on alone`,
        )) as Plantilla<{
    valor: string;
    inclusivo: boolean;
  }>,
  donde: tb("Dónde vive", "Where it lives"),
  dondeTexto: ((p: { nodo: string; orden: number; de: number }) =>
    tb(
      `${p.nodo}, regla ${p.orden} de ${p.de}`,
      `${p.nodo}, rule ${p.orden} of ${p.de}`,
    )) as Plantilla<{ nodo: string; orden: number; de: number }>,
  rango: tb("Rango jugable", "Playable range"),
  rangoTexto: ((p: { min: string; max: string; paso: string }) =>
    tb(
      `${p.min}–${p.max} · paso ${p.paso}`,
      `${p.min}–${p.max} · step ${p.paso}`,
    )) as Plantilla<{ min: string; max: string; paso: string }>,
  costo: tb("Costo humano", "Human cost"),
  costoTexto: ((min: number) =>
    tb(
      `${min} min por caso escalado`,
      `${min} min per escalated case`,
    )) as Plantilla<number>,
  enLaCorrida: tb("En la corrida", "In the run"),
  enLaCorridaTexto: ((p: { bajo: number; de: number; casos: string }) =>
    tb(
      `${p.bajo} de ${p.de} bajo U1${p.casos ? `: ${p.casos}` : ""}`,
      `${p.bajo} of ${p.de} below U1${p.casos ? `: ${p.casos}` : ""}`,
    )) as Plantilla<{ bajo: number; de: number; casos: string }>,
  con: tb("con", "at"),
  mover: tb("Moverla en el Playground", "Move it in the Playground"),
  aPersona: tb("a una persona", "to a person"),
  sigueSolo: tb("sigue solo", "goes on alone"),
  distribucion: ((p: { n: number; otros: number; nodo: string }) =>
    tb(
      `■ a una persona por esta regla · ○ sigue a la regla siguiente. Los ${p.n} casos que llegaron a ${p.nodo}; los otros ${p.otros} no pasaron por aquí.`,
      `■ to a person by this rule · ○ on to the next rule. The ${p.n} cases that reached ${p.nodo}; the other ${p.otros} did not pass here.`,
    )) as Plantilla<{ n: number; otros: number; nodo: string }>,
  etiqueta: tb(
    "Distribución de la confianza de los casos que llegaron a la regla",
    "Confidence of the cases that reached the rule",
  ),
};

export const SPIKE = {
  titulo: tb(
    "Antes: el spike, frente al mismo contrato",
    "Before: the spike, against the same contract",
  ),
  chip: ((fecha: string) =>
    tb(`real · spike ${fecha}`, `real · spike ${fecha}`)) as Plantilla<string>,
  lectura: ((p: {
    fecha: string;
    presentes: number;
    total: number;
    ausentes: number;
    fuera: number;
    sprint: number;
  }) =>
    tb(
      `Así se ve lo que el plan exige y el grafo todavía no tiene. El spike del ${p.fecha} corrió con ${p.presentes} de las ${p.total} piezas y ${p.fuera === 1 ? "un nodo" : `${p.fuera} nodos`} fuera del contrato; las otras ${p.ausentes} aparecen con borde discontinuo y la marca «exigido». El sprint ${p.sprint} las construyó todas: es el grafo de arriba.`,
      `This is how what the plan requires and the graph does not have yet looks. The ${p.fecha} spike ran with ${p.presentes} of the ${p.total} pieces and ${p.fuera === 1 ? "one node" : `${p.fuera} nodes`} outside the contract; the other ${p.ausentes} appear with a dashed border and the “required” mark. Sprint ${p.sprint} built them all: it is the graph above.`,
    )) as Plantilla<{
    fecha: string;
    presentes: number;
    total: number;
    ausentes: number;
    fuera: number;
    sprint: number;
  }>,
  nodos: tb("nodos del contrato", "contract nodes"),
  faltaban: ((ids: string) =>
    tb(`faltaban ${ids}`, `${ids} were missing`)) as Plantilla<string>,
  reglas: tb("reglas de arista", "edge rules"),
  reglasDetalle: ((p: { umbral: string; desde: string; enPlan: string }) =>
    p.desde === p.enPlan
      ? tb(`la de ${p.umbral}, en ${p.desde}`, `${p.umbral}’s, on ${p.desde}`)
      : tb(
          `la de ${p.umbral}, pero en ${p.desde} y no en ${p.enPlan}`,
          `${p.umbral}’s, but on ${p.desde} rather than ${p.enPlan}`,
        )) as Plantilla<{ umbral: string; desde: string; enPlan: string }>,
  fuera: tb("nodo fuera del contrato", "node outside the contract"),
  fueraDetalle: tb(
    "aprobar, que aprobaba sin pasar por decision",
    "aprobar, which approved without going through decision",
  ),
  region: tb(
    "Grafo del spike; se desliza de lado",
    "Spike graph; scrolls sideways",
  ),
  svgTitulo: tb(
    "Grafo del spike frente al contrato de grafo del plan",
    "The spike's graph against the plan's graph contract",
  ),
  svgDescripcion: tb(
    "Las piezas que el plan exige y el spike no tenía van con borde discontinuo y la marca «exigido».",
    "The pieces the plan requires and the spike lacked have a dashed border and the “required” mark.",
  ),
};

export const PIE_AGENTE = ((p: {
  sprint: number;
  corrida: string;
  fecha: string;
  n: number;
  modelo: string;
}) =>
  tb(
    `Las trazas son las del sprint ${p.sprint}: corrida ${p.corrida} (${p.fecha}), ${p.n} casos, modelo ${p.modelo} por la suscripción de Claude Code del autor. Ningún visitante lanza llamadas a modelos.`,
    `The traces are sprint ${p.sprint}’s: run ${p.corrida} (${p.fecha}), ${p.n} cases, ${p.modelo} model via the author’s Claude Code subscription. No visitor triggers model calls.`,
  )) as Plantilla<{
  sprint: number;
  corrida: string;
  fecha: string;
  n: number;
  modelo: string;
}>;

/**
 * Nodos que existieron fuera del contrato (el spike): cómo se nombran en su mapa. Mismos campos que los del
 * contrato que el mapa del diagramador exige (V3).
 */
export const NODOS_FUERA_DEL_CONTRATO: Record<
  string,
  Pick<TextosDeNodoVitrina, "rol" | "como" | "paraQue" | "fuentes">
> = {
  aprobar: {
    rol: tb(
      "Aprobaba el caso sin pasar por una decisión ni por la cobertura.",
      "It approved the case without going through a decision or the coverage check.",
    ),
    como: tb(
      "Escribía «aprobación automática» en la salida, sin modelo y sin revisar nada más.",
      "It wrote “automatic approval” into the output, with no model and no further check.",
    ),
    paraQue: tb(
      "En el spike bastaba para probar el enrutamiento; el plan no lo tiene: toda decisión pasa por decision.",
      "In the spike it was enough to test routing; the plan has no such node: every decision goes through decision.",
    ),
    fuentes: [F_NODOS],
  },
};

/** Por qué se detuvo un caso: la categoría de la primera regla que se cumplió (o el tope de aclaraciones). */
export const MOTIVO_PAUSA: Record<string, TextoBilingue> = {
  negar: tb("la propuesta era negar", "the proposal was to deny"),
  altoCosto: tb("alto costo (U2)", "high cost (U2)"),
  confianza: tb("confianza bajo U1", "confidence below U1"),
  contradiccion: tb(
    "la orden y el texto no coinciden",
    "the order and the text do not match",
  ),
  texas: tb("modo Texas (U4)", "Texas mode (U4)"),
  tope: tb("tope de aclaraciones (U3)", "clarification cap (U3)"),
};

/** Columnas y rótulos de la tabla de trazas de cada nodo. */
export const TRAZAS_DE_NODO: Record<
  string,
  { columnas: TextoBilingue[]; detalle: TextoBilingue[] }
> = {
  enrutador: {
    columnas: [
      tb("Atención", "Care"),
      tb("Exento", "Exempt"),
      tb("Camino", "Path"),
    ],
    detalle: [tb("Regla que decidió", "Rule that decided")],
  },
  extractor: {
    columnas: [
      tb("Confianza que dijo", "Confidence it stated"),
      tb("Faltantes", "Missing"),
      tb("Tiempo · salida · costo", "Time · output · cost"),
    ],
    detalle: [
      tb("Visitas", "Visits"),
      tb("Camino", "Path"),
      tb("Reintentos de formato", "Format retries"),
    ],
  },
  aclaracion: {
    columnas: [
      tb("Preguntas", "Questions"),
      tb("Al final", "In the end"),
      tb("Tiempo · salida · costo", "Time · output · cost"),
    ],
    detalle: [tb("Visitas", "Visits"), tb("Decisión final", "Final decision")],
  },
  verificador_cobertura: {
    columnas: [
      tb("Cobertura", "Coverage"),
      tb("Propuesta", "Proposal"),
      tb("Reglas", "Rules"),
    ],
    detalle: [tb("Código leído · de la orden", "Code read · on the order")],
  },
  decision: {
    columnas: [
      tb("Regla que decidió", "Rule that decided"),
      tb("Propuesta", "Proposal"),
      tb("Camino", "Path"),
    ],
    detalle: [
      tb("Confianza · costo", "Confidence · cost"),
      tb("Decisión final", "Final decision"),
    ],
  },
  pausa_humana: {
    columnas: [
      tb("Por qué se detuvo", "Why it stopped"),
      tb("Auditor", "Auditor"),
      tb("Decisión final", "Final decision"),
    ],
    detalle: [tb("Señal", "Signal")],
  },
  redactor: {
    columnas: [
      tb("Decisión", "Decision"),
      tb("Documento", "Document"),
      tb("Tiempo · salida · costo", "Time · output · cost"),
    ],
    detalle: [tb("Revisada por una persona", "Reviewed by a person")],
  },
  guardia_salida: {
    columnas: [
      tb("Acciones ejecutadas", "Actions run"),
      tb("Carga en la entrada", "Payload in the input"),
      tb("Hallazgos · severidad", "Findings · severity"),
    ],
    detalle: [tb("Acciones intentadas", "Actions attempted")],
  },
};

/** La nota bajo la tabla de trazas de cada nodo; los casos que nombra salen de la corrida. */
export const NOTA_TRAZAS = {
  enrutador: tb(
    "Toca un caso para ver su texto. Las urgencias y los exentos no pasan por el extractor.",
    "Tap a case to see its text. Emergencies and exempt services skip the extractor.",
  ),
  extractor: ((u1: string) =>
    tb(
      `La marca vertical de cada barra es U1 = ${u1}. Toca un caso para ver su texto.`,
      `The vertical mark on each bar is U1 = ${u1}. Tap a case to see its text.`,
    )) as Plantilla<string>,
  aclaracion: ((caso: string) =>
    tb(
      `Las preguntas y respuestas completas de ${caso} están en la página Casos.`,
      `${caso}'s full questions and answers are on the Cases page.`,
    )) as Plantilla<string>,
  verificador_cobertura: tb(
    "La propuesta no es la decisión: la toma el nodo siguiente, y una negación siempre pasa por una persona.",
    "The proposal is not the decision: the next node makes it, and a denial always goes through a person.",
  ),
  decision: tb(
    "La tabla de cada regla, con su valor observado, está en la página Casos (paso «decision»).",
    "Each rule's table, with its observed value, is on the Cases page (the “decision” step).",
  ),
  pausa_humana: ((casos: TextoBilingue) =>
    tb(
      `Lo que vio el auditor en ${casos.es}, campo por campo, está en la página Casos.`,
      `What the auditor saw on ${casos.en}, field by field, is on the Cases page.`,
    )) as Plantilla<TextoBilingue>,
  redactor: ((casos: TextoBilingue) =>
    tb(
      `La respuesta y el documento de ${casos.es}, completos y en los dos idiomas, están en la página Casos.`,
      `${casos.en}'s answer and document, complete and in both languages, are on the Cases page.`,
    )) as Plantilla<TextoBilingue>,
  guardia_salida: ((p: {
    inyeccion: string;
    dato: string;
    sinEfecto: boolean;
  }) =>
    p.sinEfecto
      ? tb(
          `${p.inyeccion} traía una instrucción escondida; ${p.dato} intentaba sacar un dato sensible. Ninguna tuvo efecto.`,
          `${p.inyeccion} carried a hidden instruction; ${p.dato} tried to extract sensitive data. Neither had any effect.`,
        )
      : tb(
          `${p.inyeccion} traía una instrucción escondida; ${p.dato} intentaba sacar un dato sensible. La guardia registró su efecto: está en la página Casos.`,
          `${p.inyeccion} carried a hidden instruction; ${p.dato} tried to extract sensitive data. The guard recorded their effect: it is on the Cases page.`,
        )) as Plantilla<{ inyeccion: string; dato: string; sinEfecto: boolean }>,
};

export const UNIDADES = {
  deSalida: tb("de salida", "output"),
  s: tb("s", "s"),
  usd: tb("USD", "USD"),
};

/** Palabras del dominio que aparecen como valor en una celda (decisión, estado de cobertura). */
export const VALORES: Record<string, TextoBilingue> = {
  aprobar: tb("aprobar", "approve"),
  negar: tb("negar", "deny"),
  escalar: tb("escalar", "escalate"),
  requiere_autorizacion: tb("cubierto", "covered"),
  excluido: tb("excluido", "excluded"),
  exento: tb("exento", "exempt"),
  ambulatoria: tb("ambulatoria", "outpatient"),
  hospitalaria: tb("hospitalaria", "inpatient"),
  urgencia: tb("urgencia", "emergency"),
  causal: tb("causal", "cause"),
};
