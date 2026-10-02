/**
 * Textos de P7 Fichas (maqueta `docs/diseno/07-fichas.html`, aprobada en la mirada 4 de la Etapa de Diseño) y el
 * contenido de lo que viaja a hoja-de-vida: la ficha del agente A (contrato ficha técnica v1.3.1, frente Agentes), el
 * `brochure-export.json` (contrato 1.0.0) y el complemento que planlang propone para la ficha de la app (la arma la
 * planeadora). Las cifras no viven aquí: las ponen `src/lib/fichas/` desde el informe, la corrida y el repositorio.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb(
  "Las fichas · planlang",
  "The records · planlang",
);
export const DESCRIPCION_PAGINA = tb(
  "La ficha de reproducibilidad del demo A y las dos fichas que viajan a la vitrina personal: la de la app y la del agente A, comprobadas contra su contrato. Simulación · no operativo.",
  "Demo A's reproducibility record and the two records that travel to the personal showcase: the app's and agent A's, checked against their contract. Simulation · not operational.",
);

export const PORTADA = {
  antetitulo: tb(
    "Demo A · lo que viaja a la vitrina personal",
    "Demo A · what travels to the personal showcase",
  ),
  titulo: tb(
    "Las fichas: repetirla, y contarla en dos minutos",
    "The records: repeat it, and tell it in two minutes",
  ),
  guia: tb(
    "Una ficha para quien quiera repetir la corrida y comprobar el informe; dos para quien visite la vitrina de hoja-de-vida y quiera saber en dos minutos qué es planlang y qué hace su agente.",
    "One record for whoever wants to repeat the run and check the report; two for whoever visits the hoja-de-vida showcase and wants to know in two minutes what planlang is and what its agent does.",
  ),
};

export const MIRADA = {
  titulo: tb("Las fichas en una mirada", "The records at a glance"),
  avisoLider: tb(
    "Ves las tres fichas como las verá cada lector.",
    "You see the three records as each reader will.",
  ),
  avisoExperto: tb(
    "Se suman los pasos para repetir la corrida y, bajo cada ficha de la vitrina, la comprobación de cada campo contra el contrato v1.3.1.",
    "You also get the steps to repeat the run and, under each showcase record, the check of every field against the v1.3.1 contract.",
  ),
  recibe: tb("Recibe", "Takes"),
  hace: tb("Hace", "Does"),
  entrega: tb("Entrega", "Delivers"),
  hecho: tb("hecho", "done"),
  recibeItems: [
    {
      titulo: tb(
        "El plan, la corrida y el informe",
        "The plan, the run and the report",
      ),
      detalle: tb("con sus huellas", "with their fingerprints"),
    },
    {
      titulo: tb("La visión del producto", "The product vision"),
      detalle: tb(
        "para los grupos de la ficha de la app",
        "for the groups of the app's record",
      ),
    },
    {
      titulo: tb(
        "El contrato ficha técnica v1.3.1",
        "The v1.3.1 technical-record contract",
      ),
      detalle: tb(
        "de hoja-de-vida: bloques, límites y reglas",
        "from hoja-de-vida: blocks, limits and rules",
      ),
    },
  ],
  haceItems: [
    tb(
      "Reúne versiones, huellas, semilla, modelo y fecha",
      "Gathers versions, fingerprints, seed, model and date",
    ),
    tb(
      "Escribe cada ficha para su lector, en español y en inglés",
      "Writes each record for its reader, in Spanish and in English",
    ),
    tb(
      "Pone a cada cifra su fuente: medida, calculada o declarada",
      "Gives every figure its source: measured, calculated or declared",
    ),
    tb(
      "Comprueba cada campo contra los límites del contrato",
      "Checks every field against the contract's limits",
    ),
  ],
  entregaItems: {
    repro: {
      titulo: tb("La ficha de reproducibilidad", "The reproducibility record"),
      detalle: tb(
        "vive en planlang: aquí y en la sección 9 de Brecha",
        "lives in planlang: here and in section 9 of Gap",
      ),
    },
    export: tb(
      "los hechos de la app, de los que la planeadora arma su ficha",
      "the app's facts, from which the planning house builds its record",
    ),
    agente: tb(
      "la ficha del agente A, para el frente Agentes",
      "agent A's record, for the Agents front",
    ),
    nunca: {
      titulo: tb("Ningún enlace", "No link"),
      detalle: tb(
        "viajan a hoja-de-vida por copia, en un PR de contenido",
        "they travel to hoja-de-vida by copy, in a content PR",
      ),
    },
  },
};

export const REPRO = {
  titulo: tb("Ficha de reproducibilidad", "Reproducibility record"),
  lectura: tb(
    "Todo lo que hace falta para obtener otra vez este mismo informe, byte a byte: versiones, huellas, semilla, modelo y fecha. Sin enlaces: las huellas bastan para comprobar que un archivo es el que dice ser.",
    "Everything it takes to get this same report again, byte for byte: versions, fingerprints, seed, model and date. No links: the fingerprints are enough to check that a file is what it claims to be.",
  ),
  cuadro: tb(
    "Ficha de reproducibilidad · demo A",
    "Reproducibility record · demo A",
  ),
  repetir: tb("Cómo repetirla, en orden", "How to repeat it, in order"),
  pasos: [
    {
      comando: "pnpm plan:validar",
      texto: tb(
        "valida el plan y comprueba su huella",
        "validates the plan and checks its fingerprint",
      ),
    },
    {
      comando: "pnpm casos:generar",
      texto: tb(
        "regenera los casos desde la semilla; la huella debe coincidir",
        "regenerates the cases from the seed; the fingerprint must match",
      ),
    },
    {
      comando: "pnpm lote:demo",
      texto: tb(
        "corre el lote en la máquina del autor, fuera de CI, con su suscripción",
        "runs the batch on the author's machine, outside CI, with their subscription",
      ),
    },
    {
      comando: "pnpm trazas:verificar",
      texto: tb(
        "comprueba huellas, umbrales aplicados y RF-09.2",
        "checks fingerprints, applied thresholds and RF-09.2",
      ),
    },
    {
      comando: "pnpm brecha:informe",
      texto: tb(
        "emite el informe: sale idéntico byte a byte",
        "emits the report: it comes out identical byte for byte",
      ),
    },
  ],
  pie: tb(
    "Scripts del repositorio. Solo el lote necesita el modelo; todo lo demás es determinista y corre igual en cualquier máquina.",
    "Repository scripts. Only the batch needs the model; everything else is deterministic and runs the same on any machine.",
  ),
};

export const SECCION = {
  app: tb("La ficha de la app", "The app's record"),
  appNota: tb(
    "para el frente Apps de la vitrina",
    "for the showcase's Apps front",
  ),
  agente: tb("La ficha del agente A", "Agent A's record"),
  agenteNota: tb(
    "para el frente Agentes de la vitrina",
    "for the showcase's Agents front",
  ),
  asi: tb(
    "así la pinta hoja-de-vida, con la piel de CV Viva",
    "this is how hoja-de-vida paints it, in CV Viva's skin",
  ),
  contrato: tb(
    "contrato ficha técnica v1.3.1",
    "technical-record contract v1.3.1",
  ),
  appArma: tb(
    "La ficha de la app la arma la planeadora: los hechos salen de docs/brochure-export.json y la curación (titular, límites, nunca) de su complemento. Aquí se pinta con el complemento que planlang le propone.",
    "The planning house builds the app's record: the facts come from docs/brochure-export.json and the curation (headline, limits, never) from its complement. Here it is painted with the complement planlang proposes.",
  ),
  sinProceso: tb(
    "«Cómo funciona» no aparece: la ficha de la app no trae proceso (es opcional en v1.3.1) y la sección se renumera. Los bloques siguen los seis grupos de la visión del producto.",
    "“How it works” does not appear: the app's record carries no process (optional in v1.3.1) and the section is renumbered. The blocks follow the six groups of the product vision.",
  ),
};

/** Rótulos de la piel de CV Viva (los pone hoja-de-vida; aquí se reproducen para la vista previa). */
export const CV = {
  migas: ((frente: TextoBilingue) =>
    tb(
      `La vitrina · ${frente.es} · Ficha técnica`,
      `The showcase · ${frente.en} · Technical record`,
    )) as Plantilla<TextoBilingue>,
  frente: {
    apps: tb("Apps", "Apps"),
    agentes: tb("Agentes", "Agents"),
  } as Record<string, TextoBilingue>,
  inicial: tb("En construcción", "In construction"),
  ciclo: ((c: string) => tb(`Ciclo ${c}`, `Cycle ${c}`)) as Plantilla<string>,
  sprints: ((n: number) =>
    tb(
      n === 1 ? "1 sprint" : `${n} sprints`,
      n === 1 ? "1 sprint" : `${n} sprints`,
    )) as Plantilla<number>,
  anclada: ((f: string) =>
    tb(
      `Anclada a la corrida del ${f}`,
      `Anchored to the ${f} run`,
    )) as Plantilla<string>,
  titular: tb("Qué no hace nadie más", "What nobody else does"),
  paraQuienT: tb(
    "Para quién, y qué resuelve",
    "Who it is for, and what it solves",
  ),
  paraQuienSub: tb(
    "La persona antes que la tecnología.",
    "The person before the technology.",
  ),
  paraQuien: tb("Para quién", "Who it is for"),
  promesa: tb("La promesa", "The promise"),
  comoT: tb("Cómo funciona", "How it works"),
  comoSub: tb(
    "El proceso en BPMN: un carril por actor.",
    "The process in BPMN: one lane per actor.",
  ),
  comoNota: tb(
    "Aquí CV Viva dibuja el diagrama con su motor BPMN, a partir de estos pasos y flujos. Esta vista previa no lo dibuja: muestra lo que la ficha le entrega, carril por carril y en su orden de lectura.",
    "Here CV Viva draws the diagram with its BPMN engine, from these steps and flows. This preview does not draw it: it shows what the record hands over, lane by lane and in reading order.",
  ),
  procedencia: {
    app: tb("Proceso declarado por la app", "Process declared by the app"),
    "cv-viva": tb("Proceso derivado por CV Viva", "Process derived by CV Viva"),
    planeadora: tb(
      "Proceso curado por la planeadora",
      "Process curated by the planning house",
    ),
  } as Record<string, TextoBilingue>,
  tieneT: tb("Qué tiene", "What it has"),
  tieneSub: ((n: number) =>
    tb(`${n} bloques.`, `${n} blocks.`)) as Plantilla<number>,
  funcionalidades: ((n: number) =>
    tb(
      n === 1 ? "1 funcionalidad" : `${n} funcionalidades`,
      n === 1 ? "1 feature" : `${n} features`,
    )) as Plantilla<number>,
  reglas: ((n: number) =>
    tb(
      n === 1 ? "1 regla del plan" : `${n} reglas del plan`,
      n === 1 ? "1 plan rule" : `${n} plan rules`,
    )) as Plantilla<number>,
  limitesT: tb(
    "Límites, y lo que nunca hace",
    "Limits, and what it never does",
  ),
  limitesSub: tb(
    "Lo que decidió no ser vale tanto como lo que es.",
    "What it chose not to be matters as much as what it is.",
  ),
  limites: tb("Límites, a propósito", "Limits, on purpose"),
  nunca: tb("Nunca", "Never"),
  dondeT: tb("Dónde está", "Where it stands"),
  dondeSub: tb(
    "La versión anclada, no el tiempo real.",
    "The anchored version, not real time.",
  ),
  espera: tb("Avísame cuando abra", "Tell me when it opens"),
  esperaNota: tb(
    "Aquí se muestra; no se entrega. La lista de espera no promete fecha.",
    "It is shown here; it is not handed over. The waiting list promises no date.",
  ),
  fuente: {
    medido: tb("medido", "measured"),
    calculada: tb("calculada", "calculated"),
    declarado: tb("declarado", "declared"),
    estimacion: tb("estimación", "estimate"),
  } as Record<string, TextoBilingue>,
  hito: {
    ciclo: tb("ciclo", "cycle"),
    sprints: tb("sprints cerrados", "closed sprints"),
    version: tb("versión", "version"),
    decisiones: tb("decisiones registradas", "recorded decisions"),
    construccion: tb("en construcción", "in construction"),
  } as Record<string, TextoBilingue>,
};

export const TABLA = {
  entrega: tb("Lo que se entrega:", "What is delivered:"),
  comprobado: ((p: { version: string }) =>
    tb(
      `Comprobado contra el contrato ficha técnica v${p.version} de hoja-de-vida. Un archivo por idioma: el contrato recibe la ficha en un idioma; se entrega el español.`,
      `Checked against hoja-de-vida's technical-record contract v${p.version}. One file per language: the contract takes the record in one language; the Spanish one is delivered.`,
    )) as Plantilla<{ version: string }>,
  campo: tb("Campo", "Field"),
  medida: tb("Medida", "Measure"),
  limite: tb("Límite", "Limit"),
  estado: tb("Estado", "Status"),
  cabe: tb("Cabe", "Fits"),
  noCabe: tb("No cabe", "Does not fit"),
  todas: tb("todas", "all"),
  enlaces: tb("enlaces", "links"),
  valida: tb(
    "La ficha completa valida contra el esquema y las reglas del proceso.",
    "The whole record validates against the schema and the process rules.",
  ),
  noValida: ((n: number) =>
    tb(
      `hoja-de-vida no publicaría esta ficha: ${n} campo${n === 1 ? "" : "s"} no cumple${n === 1 ? "" : "n"} el contrato.`,
      `hoja-de-vida would not publish this record: ${n} field${n === 1 ? "" : "s"} break${n === 1 ? "s" : ""} the contract.`,
    )) as Plantilla<number>,
};

// --------------------------------------------------------------------------------------- la ficha del agente A

/** El contenido redactado de la ficha del agente A; las cifras y los hitos los pone `src/lib/fichas/agente.ts`. */
export const AGENTE = {
  slug: "planlang-demo-a",
  nombre: tb(
    "Agente A · autorizaciones médicas",
    "Agent A · medical prior authorizations",
  ),
  tagline: tb(
    "Aprueba, niega con causal o escala; nunca niega sin una persona.",
    "Approves, denies with a stated cause or escalates; never denies alone.",
  ),
  para_quien: tb(
    "Para una aseguradora —sintética— que recibe solicitudes de autorización con el texto libre del médico y hoy las revisa a mano, una por una, sin saber cuáles podían decidirse solas y cuáles necesitaban a un auditor.",
    "For an insurer —a synthetic one— that receives prior-authorization requests with the physician's free text and today reviews them by hand, one by one, without knowing which could be decided alone and which needed an auditor.",
  ),
  intro: tb(
    "El agente lee la solicitud, pide lo que falta, aplica las reglas del plan de beneficios y aprueba solo lo que el plan permite; lo demás lo pasa a un auditor con la evidencia y la contraevidencia, y responde al afiliado con un aviso de IA.",
    "The agent reads the request, asks for what is missing, applies the benefit plan's rules and approves only what the plan allows; the rest goes to an auditor with the evidence and the counter-evidence, and it answers the member with an AI notice.",
  ),
  titular: tb(
    "Un agente de autorizaciones médicas construido según un plan verificable: cada camino que toma está escrito en el plan, y una persona revisa toda negación con el caso completo delante.",
    "A medical prior-authorization agent built to a verifiable plan: every path it takes is written in the plan, and a person reviews every denial with the full case in front of them.",
  ),
  stack: {
    langgraph: tb(
      "el grafo del agente: estado tipado, aristas condicionales y la pausa humana con interrupt",
      "the agent's graph: typed state, conditional edges and the human pause with interrupt",
    ),
    langchain: tb(
      "el adaptador del modelo y la salida estructurada por esquema",
      "the model adapter and schema-bound structured output",
    ),
    python: tb(
      "los nodos, la guardia y el exportador de trazas",
      "the nodes, the guard and the trace exporter",
    ),
    modelo: tb(
      "extrae y redacta; el binario oficial, por la suscripción del autor, sin clave de API",
      "extracts and drafts; the official binary, through the author's subscription, no API key",
    ),
    reglas: tb(
      "cobertura, guardia de salida y documento adverso, sin modelo",
      "coverage, output guard and adverse document, no model",
    ),
    trazas: tb(
      "el formato propio de las trazas, con huella; lo único que lee el verificador",
      "the traces' own format, with a fingerprint; the only thing the verifier reads",
    ),
  },
  stackNombre: {
    modelo: tb("Claude Code · sonnet", "Claude Code · sonnet"),
    reglas: tb("Reglas deterministas", "Deterministic rules"),
  },
  cifras: {
    exactitud: {
      etiqueta: tb(
        "exactitud de extracción, 3 de 3 corridas",
        "extraction accuracy, 3 of 3 runs",
      ),
      detalle: ((p: { n: number; k: number }) =>
        tb(
          `Criterio C5 del plan, medido por el verificador como pass^${p.k}: los campos extraídos son los de la verdad conocida en los ${p.n} casos que la tienen, en las ${p.k} corridas seguidas.`,
          `The plan's criterion C5, measured by the verifier as pass^${p.k}: the extracted fields are the known truth's in the ${p.n} cases that have one, in ${p.k} runs in a row.`,
        )) as Plantilla<{ n: number; k: number }>,
    },
    latencia: {
      etiqueta: tb(
        "mediana por caso, de punta a punta",
        "median per case, end to end",
      ),
      detalle: ((p: { n: number }) =>
        tb(
          `Criterio C7 del plan sobre ${p.n} casos: la mediana de la latencia total registrada en cada traza.`,
          `The plan's criterion C7 over ${p.n} cases: the median of the total latency recorded in each trace.`,
        )) as Plantilla<{ n: number }>,
    },
    personas: {
      etiqueta: ((n: number) =>
        tb(
          `de ${n} casos pasaron por una persona`,
          `of ${n} cases went through a person`,
        )) as Plantilla<number>,
      detalle: tb(
        "Pausas humanas registradas en las trazas: el auditor vio el caso completo antes de decidir.",
        "Human pauses recorded in the traces: the auditor saw the full case before deciding.",
      ),
    },
    sinPersona: {
      etiqueta: tb("negaciones sin una persona", "denials without a person"),
      detalle: ((n: number) =>
        tb(
          `Criterio C1 del plan sobre ${n} casos: toda negación pasó por la pausa humana.`,
          `The plan's criterion C1 over ${n} cases: every denial went through the human pause.`,
        )) as Plantilla<number>,
    },
    costo: {
      etiqueta: tb("costo nominal por caso", "nominal cost per case"),
      detalle: ((p: { total: string; n: number }) =>
        tb(
          `US$ ${p.total} de la corrida entre ${p.n} casos: el costo nominal que el CLI declara por llamada, sumado en las trazas. Por la suscripción no se pagó aparte.`,
          `US$ ${p.total} for the run over ${p.n} cases: the nominal cost the CLI declares per call, summed over the traces. Through the subscription it was not paid separately.`,
        )) as Plantilla<{ total: string; n: number }>,
    },
  },
  /** Un bloque por nodo del contrato del grafo (el orden es el del plan). */
  bloques: {
    enrutador: {
      nombre: tb("Enrutador", "Router"),
      linea: tb(
        "Separa urgencias y exentos, que se autorizan sin revisar cobertura.",
        "Separates emergencies and exempt services, authorized without a coverage check.",
      ),
    },
    extractor: {
      nombre: tb("Extractor", "Extractor"),
      linea: tb(
        "Convierte el texto del médico en campos, con su confianza.",
        "Turns the physician's text into fields, with their confidence.",
      ),
    },
    aclaracion: {
      nombre: tb("Aclaración", "Clarification"),
      linea: tb(
        "Pide lo que falta, hasta el máximo que fija el plan.",
        "Asks for what is missing, up to the maximum the plan sets.",
      ),
    },
    verificador_cobertura: {
      nombre: tb("Verificador de cobertura", "Coverage checker"),
      linea: tb(
        "Aplica las reglas del plan de beneficios, sin modelo.",
        "Applies the benefit plan's rules, no model.",
      ),
    },
    decision: {
      nombre: tb("Decisión", "Decision"),
      linea: tb(
        "Las reglas escritas en el plan deciden si el caso escala.",
        "The rules written in the plan decide whether the case escalates.",
      ),
    },
    pausa_humana: {
      nombre: tb("Pausa humana", "Human pause"),
      linea: tb(
        "Un auditor ve el caso completo antes de negar.",
        "An auditor sees the full case before denying.",
      ),
    },
    redactor: {
      nombre: tb("Redactor", "Drafter"),
      linea: tb(
        "Escribe la respuesta y el documento de decisión adversa.",
        "Writes the reply and the adverse-decision document.",
      ),
    },
    guardia_salida: {
      nombre: tb("Guardia de salida", "Output guard"),
      linea: tb(
        "Reglas fijas: ningún dato sensible, ninguna orden inyectada.",
        "Fixed rules: no sensitive data, no injected order.",
      ),
    },
  } as Record<string, { nombre: TextoBilingue; linea: TextoBilingue }>,
  limites: [
    tb(
      "Decide sobre casos sintéticos: es una demostración, no un servicio.",
      "It decides on synthetic cases: it is a demonstration, not a service.",
    ),
    tb(
      "Su auditor humano se simuló en lote siguiendo la verdad conocida.",
      "Its human auditor was simulated in batch, following the known truth.",
    ),
    tb(
      "Corre en lotes de 20 casos, fuera de CI y con pausas entre lotes.",
      "It runs in batches of 20 cases, outside CI and with breaks between batches.",
    ),
  ],
  nunca: [
    tb(
      "Niega sin que una persona lo revise.",
      "Denies without a person reviewing it.",
    ),
    tb(
      "Obedece instrucciones escondidas en el texto de un caso.",
      "Obeys instructions hidden in a case's text.",
    ),
    tb(
      "Deja salir un dato del afiliado en la respuesta.",
      "Lets a member's data out in the reply.",
    ),
    tb(
      "Pide autorización para una urgencia.",
      "Asks for authorization for an emergency.",
    ),
  ],
  hitos: {
    plan: tb("versión del plan", "plan version"),
    corrida: tb("primera corrida real", "first real run"),
    piezas: tb("piezas del contrato", "contract pieces"),
    decisiones: tb("decisiones verificadas", "verified decisions"),
  },
  proceso: {
    titulo: tb("Una solicitud de autorización", "One authorization request"),
    carriles: {
      medico: tb("Médico", "Physician"),
      agente: tb("El agente", "The agent"),
      auditor: tb("Auditor", "Auditor"),
      afiliado: tb("Afiliado", "Member"),
    } as Record<string, TextoBilingue>,
    /** `nodo`: el nodo del grafo que hace el paso (la prueba exige que cada nodo del contrato tenga el suyo). */
    pasos: [
      {
        id: "inicio",
        tipo: "inicio",
        carril: "medico",
        nodo: null,
        texto: tb("Una solicitud", "A request"),
      },
      {
        id: "envia",
        tipo: "tarea",
        carril: "medico",
        nodo: null,
        texto: tb("Envía la solicitud", "Sends the request"),
      },
      {
        id: "clasifica",
        tipo: "tarea",
        carril: "agente",
        nodo: "enrutador",
        texto: tb("Clasifica la atención", "Classifies the care"),
      },
      {
        id: "urgencia",
        tipo: "decision",
        carril: "agente",
        nodo: "enrutador",
        texto: tb("¿Urgente o exento?", "Urgent or exempt?"),
      },
      {
        id: "extrae",
        tipo: "tarea",
        carril: "agente",
        nodo: "extractor",
        texto: tb("Extrae los campos", "Extracts the fields"),
      },
      {
        id: "falta",
        tipo: "decision",
        carril: "agente",
        nodo: "extractor",
        texto: tb("¿Falta algo?", "Missing?"),
      },
      {
        id: "pregunta",
        tipo: "tarea",
        carril: "agente",
        nodo: "aclaracion",
        texto: tb("Pide la aclaración", "Asks for clarification"),
      },
      {
        id: "responde",
        tipo: "tarea",
        carril: "medico",
        nodo: null,
        texto: tb("Responde la aclaración", "Answers the clarification"),
      },
      {
        id: "cobertura",
        tipo: "tarea",
        carril: "agente",
        nodo: "verificador_cobertura",
        texto: tb(
          "Aplica las reglas de cobertura",
          "Applies the coverage rules",
        ),
      },
      {
        id: "escala",
        tipo: "decision",
        carril: "agente",
        nodo: "decision",
        texto: tb("¿Escala?", "Escalate?"),
      },
      {
        id: "revisa",
        tipo: "tarea",
        carril: "auditor",
        nodo: "pausa_humana",
        texto: tb(
          "Revisa el caso completo y decide",
          "Reviews the full case and decides",
        ),
      },
      {
        id: "redacta",
        tipo: "tarea",
        carril: "agente",
        nodo: "redactor",
        texto: tb("Redacta con aviso de IA", "Drafts with an AI notice"),
      },
      {
        id: "guardia",
        tipo: "tarea",
        carril: "agente",
        nodo: "guardia_salida",
        texto: tb(
          "La guardia filtra la salida",
          "The guard filters the output",
        ),
      },
      {
        id: "recibe",
        tipo: "tarea",
        carril: "afiliado",
        nodo: null,
        texto: tb("Recibe la respuesta", "Receives the reply"),
      },
      {
        id: "fin",
        tipo: "fin",
        carril: "afiliado",
        nodo: null,
        texto: null,
      },
    ] as {
      id: string;
      tipo: "inicio" | "tarea" | "decision" | "fin";
      carril: string;
      nodo: string | null;
      /** El fin no lleva texto (como en el ejemplo del contrato). */
      texto: TextoBilingue | null;
    }[],
    flujos: [
      { de: "inicio", a: "envia" },
      { de: "envia", a: "clasifica" },
      { de: "clasifica", a: "urgencia" },
      {
        de: "urgencia",
        a: "redacta",
        etiqueta: tb("sí · se autoriza", "yes · authorized"),
      },
      { de: "urgencia", a: "extrae", etiqueta: tb("no", "no") },
      { de: "extrae", a: "falta" },
      { de: "falta", a: "pregunta", etiqueta: tb("sí", "yes") },
      { de: "falta", a: "cobertura", etiqueta: tb("no", "no") },
      { de: "pregunta", a: "responde" },
      { de: "responde", a: "extrae" },
      { de: "cobertura", a: "escala" },
      { de: "escala", a: "revisa", etiqueta: tb("sí", "yes") },
      { de: "escala", a: "redacta", etiqueta: tb("no", "no") },
      { de: "revisa", a: "redacta" },
      { de: "redacta", a: "guardia" },
      { de: "guardia", a: "recibe" },
      { de: "recibe", a: "fin" },
    ] as { de: string; a: string; etiqueta?: TextoBilingue }[],
    anotaciones: [
      {
        paso: "revisa",
        texto: tb(
          "Ninguna negación sale sin el auditor; en esta demo, el auditor se simuló en lote.",
          "No denial goes out without the auditor; in this demo, the auditor was simulated in batch.",
        ),
      },
      {
        paso: "pregunta",
        texto: tb(
          "Si tras el máximo de aclaraciones sigue faltando algo, el caso va al auditor.",
          "If something is still missing after the maximum of clarifications, the case goes to the auditor.",
        ),
      },
      {
        paso: "guardia",
        texto: tb(
          "El texto del caso nunca decide qué acción se ejecuta.",
          "The case's text never decides which action runs.",
        ),
      },
    ],
  },
};

// ------------------------------------------------------------------- la app: export 1.0.0 y complemento propuesto

/** La promesa de la app (VISION aprobada el 2026-09-26) y lo que la distingue. */
export const APP = {
  slug: "planlang",
  nombre: "planlang",
  tagline: tb(
    "Planeé, construí y medí la brecha.",
    "I planned, built and measured the gap.",
  ),
  intro: tb(
    "Escribes el plan como un contrato —decisiones, riesgos, supuestos, criterios y umbrales, cada uno medible— y planlang lo usa para construir el agente, correrlo sobre casos con respuesta conocida y publicar la brecha. Luego mueves un umbral y ves qué habría costado.",
    "You write the plan as a contract —decisions, risks, assumptions, criteria and thresholds, each one measurable— and planlang uses it to build the agent, run it on cases with a known answer and publish the gap. Then you move a threshold and see what it would have cost.",
  ),
  para_quien: tb(
    "Para quien planea, construye o aprueba un proyecto de agentes de IA y hoy mide lo que el agente hace sin haber escrito antes qué debía hacer: mira trazas, corre evaluaciones sueltas y decide a ojo cuándo un resultado basta.",
    "For whoever plans, builds or approves an AI-agent project and today measures what the agent does without having written down first what it was supposed to do: they look at traces, run loose evaluations and decide by eye when a result is enough.",
  ),
  diferencial: tb(
    "Observar trazas y evaluar respuestas ya lo hacen muchas herramientas. Lo que no hace nadie es exigir el plan antes y medir contra él después: el informe de brecha plan → resultado, con el análisis de riesgos previo, y los umbrales del plan jugables sobre las trazas reales.",
    "Observing traces and evaluating answers is done by many tools. What nobody does is demand the plan first and measure against it afterwards: the plan → result gap report, with the prior risk analysis, and the plan's thresholds playable over the real traces.",
  ),
  /** El titular de valor que planlang propone para el complemento de la planeadora. */
  titular: tb(
    "El plan de un agente se escribe como contrato, y un verificador sin IA publica, caso por caso, la brecha entre lo planeado y lo que el agente hizo, con sus fallas a la vista.",
    "An agent's plan is written as a contract, and a verifier with no AI publishes, case by case, the gap between what was planned and what the agent did, with its failures in view.",
  ),
  limites: [
    tb(
      "Es una simulación: no opera casos reales ni decide sobre personas.",
      "It is a simulation: it handles no real cases and decides on no one.",
    ),
    tb(
      "El demo B y el entrevistador llegan después; hasta entonces dicen «en construcción».",
      "Demo B and the interviewer come later; until then they say “under construction”.",
    ),
    tb(
      "Mide lo que el plan declaró; lo que no previó aparece como brecha, no como veredicto.",
      "It measures what the plan declared; what it did not foresee shows up as a gap, not as a verdict.",
    ),
  ],
  nunca: [
    tb(
      "Usa datos reales: todo caso, afiliado y médico es sintético.",
      "Uses real data: every case, member and physician is synthetic.",
    ),
    tb(
      "Deja que un modelo decida si el agente acertó.",
      "Lets a model decide whether the agent got it right.",
    ),
    tb(
      "Niega un caso sin que lo revise una persona.",
      "Denies a case without a person reviewing it.",
    ),
    tb("Esconde un resultado desfavorable.", "Hides an unfavorable result."),
  ],
  enlaces: {
    razon: tb(
      "La app privada no se publica. La vitrina viaja a hoja-de-vida como paquete estático, rotulado «Simulación · no operativo», y se muestra allí.",
      "The private app is not published. The showcase travels to hoja-de-vida as a static package, labeled “Simulation · not operational”, and is shown there.",
    ),
    razon_repositorio: tb(
      "El repositorio no se enlaza desde la vitrina (regla de cero enlaces del portafolio).",
      "The repository is not linked from the showcase (the portfolio's zero-links rule).",
    ),
    brochure_archivo: tb(
      "pendiente: docs/BROCHURE.html nace al cierre del ciclo H1 (sprint 3)",
      "pending: docs/BROCHURE.html is born at the H1 cycle close (sprint 3)",
    ),
    brochure_ruta_local: tb(
      "pendiente: la ruta /conoce nace con el brochure (sprint 3)",
      "pending: the /conoce route is born with the brochure (sprint 3)",
    ),
  },
  privacidad: {
    detalle: tb(
      "Todo caso, afiliado, médico y plan de beneficios es sintético, con semilla, y un validador de identificadores en CI rechaza cualquiera con forma real. La vitrina es estática: ningún visitante lanza llamadas a modelos ni a servicios.",
      "Every case, member, physician and benefit plan is synthetic, from a seed, and an identifier validator in CI rejects any with a real-looking form. The showcase is static: no visitor triggers calls to models or services.",
    ),
    datos_sinteticos: true,
    llamadas_a_modelos_en_la_vitrina: false,
    red_saliente_en_la_vitrina: false,
  },
  /** Los seis grupos de la visión del producto con lo construido de cada uno (lo del roadmap no cuenta). */
  grupos: [
    {
      nombre: tb("Planear", "Plan"),
      linea: tb(
        "El plan como contrato: plantillas, validador y contrato para el constructor.",
        "The plan as a contract: templates, validator and the builder's contract.",
      ),
      estrella: false,
      features: [
        {
          id: "plantillas",
          nombre: tb(
            "Plantillas de dominio como datos",
            "Domain templates as data",
          ),
          que_hace: tb(
            "Actores, decisiones, riesgos y criterios típicos de salud y de vinculación financiera, con las restricciones legales en lenguaje llano y con su fuente.",
            "Typical actors, decisions, risks and criteria for health and financial onboarding, with the legal constraints in plain language and with their source.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
        {
          id: "validador",
          nombre: tb("Validador del plan", "Plan validator"),
          que_hace: tb(
            "Ningún plan se aprueba con un criterio sin regla de medición, un umbral sin señal o un riesgo de prioridad alta sin mitigación; dice exactamente qué falta.",
            "No plan is approved with a criterion without a measurement rule, a threshold without a signal or a high-priority risk without mitigation; it says exactly what is missing.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
        {
          id: "contrato",
          nombre: tb("Contrato para el constructor", "The builder's contract"),
          que_hace: tb(
            "El plan entrega los nodos, las aristas con señal · operador · valor, las pausas humanas y las señales que la traza debe registrar; lo que decide el agente es literalmente lo que dice el plan.",
            "The plan hands over the nodes, the edges as signal · operator · value, the human pauses and the signals the trace must record; what the agent decides is literally what the plan says.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
      ],
    },
    {
      nombre: tb("Correr", "Run"),
      linea: tb(
        "Casos con verdad conocida, el demo A y las corridas por lotes.",
        "Cases with a known truth, demo A and batch runs.",
      ),
      estrella: false,
      features: [
        {
          id: "casos",
          nombre: tb(
            "Casos sintéticos con verdad conocida",
            "Synthetic cases with a known truth",
          ),
          que_hace: tb(
            "Lotes reproducibles con semilla: normales, de borde, incompletos y adversarios; un validador garantiza que ningún identificador podría ser real.",
            "Reproducible seeded batches: normal, edge, incomplete and adversarial; a validator guarantees that no identifier could be real.",
          ),
          seccion_manual: tb(
            "Generar casos sintéticos",
            "Generate synthetic cases",
          ),
        },
        {
          id: "demo-a",
          nombre: tb(
            "Demo A: autorizaciones médicas",
            "Demo A: medical prior authorizations",
          ),
          que_hace: tb(
            "Un enrutador, un extractor, un verificador de cobertura por reglas y un redactor aprueban, niegan con causal o escalan a un auditor; ninguna negación sale sin una persona.",
            "A router, an extractor, a rule-based coverage checker and a drafter approve, deny with a stated cause or escalate to an auditor; no denial goes out without a person.",
          ),
          seccion_manual: tb("Correr un lote de 20", "Run a 20-case batch"),
        },
        {
          id: "documento-adverso",
          nombre: tb(
            "Documento de decisión adversa",
            "Adverse-decision document",
          ),
          que_hace: tb(
            "Toda negación produce, por código, un documento en español e inglés con la causal, la regla, los datos usados y la vía de contradicción.",
            "Every denial produces, by code, a document in Spanish and English with the cause, the rule, the data used and the way to contest it.",
          ),
          seccion_manual: tb("Correr un lote de 20", "Run a 20-case batch"),
        },
        {
          id: "lotes",
          nombre: tb(
            "Corridas por lotes y exportación",
            "Batch runs and export",
          ),
          que_hace: tb(
            "Lotes acumulables sin duplicar casos, con el modelo servido por la suscripción de Claude Code; las trazas se exportan a un formato propio y versionado.",
            "Accumulable batches without duplicate cases, with the model served by the Claude Code subscription; traces are exported to an own, versioned format.",
          ),
          seccion_manual: tb("Correr un lote de 20", "Run a 20-case batch"),
        },
      ],
    },
    {
      nombre: tb("Medir", "Measure"),
      linea: tb(
        "El verificador de brecha y los supuestos medidos de verdad.",
        "The gap verifier and assumptions measured for real.",
      ),
      estrella: true,
      features: [
        {
          id: "verificador",
          nombre: tb("Verificador de brecha", "Gap verifier"),
          que_hace: tb(
            "Lee plan, trazas y evaluaciones y dice, criterio por criterio y riesgo por riesgo, qué se cumplió y en qué casos no; emite el informe en español e inglés, idéntico byte a byte.",
            "Reads plan, traces and evaluations and says, criterion by criterion and risk by risk, what was met and in which cases it was not; it emits the report in Spanish and English, identical byte for byte.",
          ),
          seccion_manual: tb(
            "Leer el informe de brecha",
            "Read the gap report",
          ),
        },
        {
          id: "supuestos",
          nombre: tb(
            "Supuestos con prueba barata",
            "Assumptions with a cheap test",
          ),
          que_hace: tb(
            "«El modelo extrae con confianza calibrada» se mide de verdad —calibración y curva riesgo-cobertura— y queda confirmado, refutado o sin probar.",
            "“The model extracts with calibrated confidence” is measured for real —calibration and risk-coverage curve— and ends up confirmed, refuted or untested.",
          ),
          seccion_manual: tb(
            "Leer el informe de brecha",
            "Read the gap report",
          ),
        },
        {
          id: "instrumento",
          nombre: tb("Validación del instrumento", "Instrument validation"),
          que_hace: tb(
            "Brechas sembradas que el verificador debe detectar, planes con errores que debe rechazar y la prueba cruzada de que el playground reproduce las ramas del agente.",
            "Seeded gaps the verifier must detect, flawed plans it must reject and the cross-check that the playground reproduces the agent's branches.",
          ),
          seccion_manual: tb(
            "Verificar las corridas y el instrumento",
            "Check the runs and the instrument",
          ),
        },
        {
          id: "adr",
          nombre: tb("Dos ADR de arranque", "Two starting ADRs"),
          que_hace: tb(
            "«Código primero» para los demos, y proveedor y cumplimiento para el uso de la suscripción, releído antes de cada entrega.",
            "“Code first” for the demos, and provider and compliance for using the subscription, reread before every delivery.",
          ),
          seccion_manual: tb(
            "Verificar las corridas y el instrumento",
            "Check the runs and the instrument",
          ),
        },
      ],
    },
    {
      nombre: tb("Jugar", "Play"),
      linea: tb(
        "Mover los umbrales sobre las trazas reales.",
        "Move the thresholds over the real traces.",
      ),
      estrella: false,
      features: [
        {
          id: "playground",
          nombre: tb(
            "Mover los umbrales del plan",
            "Move the plan's thresholds",
          ),
          que_hace: tb(
            "Deslizas la confianza mínima, el alto costo, el máximo de aclaraciones o el modo Texas y ves qué casos cambian de camino, qué errores aparecen, cuánto trabajo humano cuesta y la curva riesgo-cobertura.",
            "You slide the minimum confidence, the high cost, the clarification maximum or Texas mode and see which cases change path, which errors appear, how much human work it costs and the risk-coverage curve.",
          ),
          seccion_manual: tb("Mover los umbrales", "Move the thresholds"),
        },
      ],
    },
    {
      nombre: tb("Entender", "Understand"),
      linea: tb(
        "El grafo real, nodo por nodo, contra el plan.",
        "The real graph, node by node, against the plan.",
      ),
      estrella: false,
      features: [
        {
          id: "visor",
          nombre: tb(
            "El grafo real desde el código",
            "The real graph from the code",
          ),
          que_hace: tb(
            "El diagrama se genera desde el grafo compilado; cada nodo muestra su explicación para líderes y expertos, su código y tres trazas reales, y el diagrama señala cualquier ausencia frente al plan.",
            "The diagram is generated from the compiled graph; each node shows its explanation for leaders and experts, its code and three real traces, and the diagram flags any absence against the plan.",
          ),
          seccion_manual: tb("Leer la vitrina", "Read the showcase"),
        },
      ],
    },
    {
      nombre: tb("Mostrar", "Show"),
      linea: tb(
        "La vitrina bilingüe y sus fichas.",
        "The bilingual showcase and its records.",
      ),
      estrella: false,
      features: [
        {
          id: "entrada",
          nombre: tb("Página de entrada", "Home page"),
          que_hace: tb(
            "La tesis en una pantalla para un visitante no técnico: todos observan, la mitad evalúa, casi nadie planeó qué evaluar.",
            "The thesis on one screen for a non-technical visitor: everyone observes, half evaluate, almost nobody planned what to evaluate.",
          ),
          seccion_manual: tb("Leer la vitrina", "Read the showcase"),
        },
        {
          id: "pestanas",
          nombre: tb(
            "Plan, Agente, Brecha y Casos",
            "Plan, Agent, Gap and Cases",
          ),
          que_hace: tb(
            "En lenguaje llano con detalle para expertos, en español e inglés, en un teléfono de 380 px, con el rótulo «Simulación · no operativo» y la divulgación del revisor simulado.",
            "In plain language with detail for experts, in Spanish and English, on a 380 px phone, with the “Simulation · not operational” label and the simulated-reviewer disclosure.",
          ),
          seccion_manual: tb("Leer la vitrina", "Read the showcase"),
        },
        {
          id: "fichas",
          nombre: tb(
            "Fichas y paquete para la vitrina personal",
            "Records and package for the personal showcase",
          ),
          que_hace: tb(
            "La ficha de reproducibilidad, la del agente A y estos hechos de la app, con el paquete estático que hoja-de-vida publica sin un solo enlace.",
            "The reproducibility record, agent A's record and these app facts, with the static package hoja-de-vida publishes without a single link.",
          ),
          seccion_manual: tb("Entregar el paquete", "Deliver the package"),
        },
      ],
    },
  ],
  stack: [
    {
      nombre: tb("Next.js exportado estático", "Next.js static export"),
      papel: tb(
        "la vitrina: siete pantallas en español e inglés, sin servidor",
        "the showcase: seven screens in Spanish and English, no server",
      ),
    },
    {
      nombre: tb("TypeScript estricto", "Strict TypeScript"),
      papel: tb(
        "el núcleo determinista: plan, verificador, playground y visor, iguales en Node y en el navegador",
        "the deterministic core: plan, verifier, playground and viewer, the same in Node and in the browser",
      ),
    },
    {
      nombre: tb("Python 3.12 · LangGraph 1.2", "Python 3.12 · LangGraph 1.2"),
      papel: tb(
        "el agente del demo A, con la pausa humana como interrupt",
        "demo A's agent, with the human pause as an interrupt",
      ),
    },
    {
      nombre: tb("Claude Code por suscripción", "Claude Code by subscription"),
      papel: tb(
        "el modelo de los agentes, en lotes fuera de CI; nunca en el núcleo ni en la vitrina",
        "the agents' model, in batches outside CI; never in the core or the showcase",
      ),
    },
    {
      nombre: tb("JSON canónico + SHA-256", "Canonical JSON + SHA-256"),
      papel: tb(
        "planes, casos, trazas e informes con huella, comprobables byte a byte",
        "plans, cases, traces and reports with a fingerprint, checkable byte for byte",
      ),
    },
    {
      nombre: tb("Vitest · Playwright · axe", "Vitest · Playwright · axe"),
      papel: tb(
        "las pruebas, incluida la cruzada de las aristas entre Python y TypeScript",
        "the tests, including the edge cross-check between Python and TypeScript",
      ),
    },
  ],
};
