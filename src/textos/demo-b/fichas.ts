/**
 * La ficha técnica del agente B (contrato ficha técnica v1.3.1, frente Agentes): su texto redactado, entero en cada
 * idioma; las cifras las pone `src/lib/fichas/armar.ts` desde el informe y la corrida del B. Vive aparte para que la
 * guardia «copia contra plan» la lea contra el plan B. Los rótulos comunes (hitos) siguen en `src/textos/fichas.ts`.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

type Plantilla<P> = (p: P) => TextoBilingue;

export const AGENTE_B = {
  slug: "planlang-demo-b",
  nombre: tb(
    "Agente B · vinculación con debida diligencia",
    "Agent B · due-diligence onboarding",
  ),
  tagline: tb(
    "Aprueba lo limpio; toda coincidencia, riesgo alto o rechazo va a una persona.",
    "Approves the clean ones; every match, high risk or rejection goes to a person.",
  ),
  para_quien: tb(
    "Para una entidad financiera —sintética— que vincula clientes con debida diligencia: hoy un analista cruza a mano cada nombre con las listas de control y no sabe cuáles alarmas eran homónimos ni deja escrito por qué decidió.",
    "For a financial institution —a synthetic one— that onboards customers with due diligence: today an analyst checks every name against the control lists by hand, cannot tell which alarms were namesakes and leaves no written reason for each decision.",
  ),
  intro: tb(
    "El agente lee los tres documentos de la solicitud, cruza el nombre con las listas, investiga el contexto desde el inicio de la zona gris y puntúa el riesgo con reglas que no miran el nombre; aprueba solo lo limpio, lleva lo demás al oficial con la evidencia y deja un expediente que cita la regla o la coincidencia de cada conclusión.",
    "The agent reads the application's three documents, checks the name against the lists, investigates the context from the start of the gray zone and scores the risk with rules that ignore the name; it approves only the clean ones, brings the rest to the officer with the evidence and leaves a file that cites the rule or match behind each conclusion.",
  ),
  titular: tb(
    "Un agente de vinculación cuyo plan salió de una entrevista y se verifica caso por caso: ninguna coincidencia en listas ni ningún rechazo sale sin una persona, y cada conclusión del expediente cita su regla.",
    "An onboarding agent whose plan came out of an interview and is verified case by case: no list match and no rejection goes out without a person, and every conclusion in the file cites its rule.",
  ),
  stack: {
    langgraph: tb(
      "el grafo del agente: estado tipado, aristas condicionales y la pausa del oficial con interrupt",
      "the agent's graph: typed state, conditional edges and the officer's pause with interrupt",
    ),
    langchain: tb(
      "el adaptador del modelo y la salida estructurada por esquema",
      "the model adapter and schema-bound structured output",
    ),
    python: tb(
      "los nodos, las guardias, la similitud de nombres y el exportador de trazas",
      "the nodes, the guards, the name similarity and the trace exporter",
    ),
    modelo: tb(
      "extrae los documentos e investiga la zona gris; el binario oficial, por la suscripción del autor",
      "extracts the documents and investigates the gray zone; the official binary, through the author's subscription",
    ),
    reglas: tb(
      "listas, puntaje, expediente y guardias, sin modelo",
      "lists, score, file and guards, no model",
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
        "exactitud de extracción, una corrida",
        "extraction accuracy, one run",
      ),
      detalle: ((n: number) =>
        tb(
          `Criterio C5 del plan B, medido por el verificador: los campos extraídos de los tres documentos son los de la verdad conocida en los ${n} casos, en una sola corrida.`,
          `Plan B's criterion C5, measured by the verifier: the fields extracted from the three documents are the known truth's in all ${n} cases, in a single run.`,
        )) as Plantilla<number>,
    },
    personas: {
      etiqueta: ((n: number) =>
        tb(
          `de ${n} casos pasaron por el oficial`,
          `of ${n} cases went through the officer`,
        )) as Plantilla<number>,
      detalle: tb(
        "Pausas humanas registradas en las trazas: el oficial vio los documentos, las coincidencias, la investigación y el puntaje antes de decidir.",
        "Human pauses recorded in the traces: the officer saw the documents, the matches, the investigation and the score before deciding.",
      ),
    },
    coincidencias: {
      etiqueta: tb(
        "coincidencias en listas sin una persona",
        "list matches without a person",
      ),
      detalle: ((n: number) =>
        tb(
          `Criterio C1 del plan B sobre los ${n} casos que están en una lista: todos pasaron por el oficial.`,
          `Plan B's criterion C1 over the ${n} cases that are on a list: every one went through the officer.`,
        )) as Plantilla<number>,
    },
    rechazos: {
      etiqueta: tb("rechazos sin una persona", "rejections without a person"),
      detalle: ((n: number) =>
        tb(
          `Criterio C2 del plan B sobre ${n} casos: todo rechazo, y toda aprobación con riesgo alto, pasó por el oficial.`,
          `Plan B's criterion C2 over ${n} cases: every rejection, and every approval at high risk, went through the officer.`,
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
      nombre: tb("Guardia de entrada", "Input guard"),
      linea: tb(
        "Marca las instrucciones escondidas en los documentos antes de que las lea un modelo.",
        "Flags instructions hidden in the documents before any model reads them.",
      ),
    },
    extractor: {
      nombre: tb("Extractor", "Extractor"),
      linea: tb(
        "Convierte los tres documentos en campos, con los códigos del catálogo.",
        "Turns the three documents into fields, with the catalog codes.",
      ),
    },
    verificador_listas: {
      nombre: tb("Verificador de listas", "List checker"),
      linea: tb(
        "Cruza el nombre con las listas, exacto y aproximado, sin modelo.",
        "Checks the name against the lists, exactly and approximately, no model.",
      ),
    },
    investigador: {
      nombre: tb("Investigador de contexto", "Context investigator"),
      linea: tb(
        "Desde el inicio de la zona gris: ¿homónimo o la misma persona? Concluye, no decide.",
        "From the start of the gray zone: a namesake or the same person? It concludes, it does not decide.",
      ),
    },
    puntaje: {
      nombre: tb("Puntaje de riesgo", "Risk score"),
      linea: tb(
        "Reglas declaradas sobre actividad, fondos e ingresos; el nombre no cuenta.",
        "Declared rules on activity, funds and income; the name does not count.",
      ),
    },
    decision: {
      nombre: tb("Decisión", "Decision"),
      linea: tb(
        "Las reglas escritas en el plan deciden si el caso va al oficial.",
        "The rules written in the plan decide whether the case goes to the officer.",
      ),
    },
    pausa_humana: {
      nombre: tb("Pausa humana", "Human pause"),
      linea: tb(
        "El oficial de cumplimiento ve el caso completo antes de decidir.",
        "The compliance officer sees the full case before deciding.",
      ),
    },
    redactor: {
      nombre: tb("Expediente", "File"),
      linea: tb(
        "Cada conclusión con su cita, la respuesta y, si es rechazo, su documento.",
        "Every conclusion with its citation, the reply and, on a rejection, its document.",
      ),
    },
    guardia_salida: {
      nombre: tb("Guardia de salida", "Output guard"),
      linea: tb(
        "Reglas fijas: ningún dato del solicitante, ninguna acción fuera de la lista.",
        "Fixed rules: no applicant data, no action off the list.",
      ),
    },
  } as Record<string, { nombre: TextoBilingue; linea: TextoBilingue }>,
  limites: [
    tb(
      "Decide sobre casos sintéticos: es una demostración, no un servicio.",
      "It decides on synthetic cases: it is a demonstration, not a service.",
    ),
    tb(
      "Su oficial de cumplimiento se simuló en lote siguiendo la verdad conocida.",
      "Its compliance officer was simulated in batch, following the known truth.",
    ),
    tb(
      "Corre en lotes de 20 casos, fuera de CI y con pausas entre lotes.",
      "It runs in batches of 20 cases, outside CI and with breaks between batches.",
    ),
    tb(
      "Su plan no declara minutos de oficial por caso: se cuentan casos, no minutos.",
      "Its plan declares no officer minutes per case: cases are counted, not minutes.",
    ),
  ],
  nunca: [
    tb(
      "Rechaza sin que una persona lo revise.",
      "Rejects without a person reviewing it.",
    ),
    tb(
      "Aprueba solo a alguien que coincide con una lista.",
      "Approves on its own someone who matches a list.",
    ),
    tb(
      "Usa el nombre o la nacionalidad para puntuar el riesgo.",
      "Uses the name or nationality to score the risk.",
    ),
    tb(
      "Deja que un documento cambie lo que hace.",
      "Lets a document change what it does.",
    ),
    tb(
      "Escribe una conclusión sin citar su regla o su coincidencia.",
      "Writes a conclusion without citing its rule or match.",
    ),
  ],
  proceso: {
    titulo: tb("Una solicitud de vinculación", "One onboarding application"),
    carriles: {
      solicitante: tb("Solicitante", "Applicant"),
      agente: tb("El agente", "The agent"),
      oficial: tb("Oficial de cumplimiento", "Compliance officer"),
    } as Record<string, TextoBilingue>,
    /** `nodo`: el nodo del grafo que hace el paso (la prueba exige que cada nodo del contrato tenga el suyo). */
    pasos: [
      {
        id: "inicio",
        tipo: "inicio",
        carril: "solicitante",
        nodo: null,
        texto: tb("Una solicitud", "An application"),
      },
      {
        id: "entrega",
        tipo: "tarea",
        carril: "solicitante",
        nodo: null,
        texto: tb("Entrega sus tres documentos", "Hands in three documents"),
      },
      {
        id: "marca",
        tipo: "tarea",
        carril: "agente",
        nodo: "enrutador",
        texto: tb(
          "Busca instrucciones escondidas",
          "Looks for hidden instructions",
        ),
      },
      {
        id: "extrae",
        tipo: "tarea",
        carril: "agente",
        nodo: "extractor",
        texto: tb("Extrae los campos", "Extracts the fields"),
      },
      {
        id: "cruza",
        tipo: "tarea",
        carril: "agente",
        nodo: "verificador_listas",
        texto: tb(
          "Cruza el nombre con las listas",
          "Checks the name against the lists",
        ),
      },
      {
        id: "gris",
        tipo: "decision",
        carril: "agente",
        nodo: "verificador_listas",
        texto: tb(
          "¿Parecido desde la zona gris?",
          "Similarity from the gray zone up?",
        ),
      },
      {
        id: "investiga",
        tipo: "tarea",
        carril: "agente",
        nodo: "investigador",
        texto: tb("Compara el contexto", "Compares the context"),
      },
      {
        id: "puntua",
        tipo: "tarea",
        carril: "agente",
        nodo: "puntaje",
        texto: tb(
          "Puntúa el riesgo sin el nombre",
          "Scores the risk without the name",
        ),
      },
      {
        id: "escala",
        tipo: "decision",
        carril: "agente",
        nodo: "decision",
        texto: tb("¿Al oficial?", "To the officer?"),
      },
      {
        id: "revisa",
        tipo: "tarea",
        carril: "oficial",
        nodo: "pausa_humana",
        texto: tb(
          "Revisa el caso completo y decide",
          "Reviews the full case and decides",
        ),
      },
      {
        id: "expediente",
        tipo: "tarea",
        carril: "agente",
        nodo: "redactor",
        texto: tb(
          "Arma el expediente con sus citas",
          "Builds the file with its citations",
        ),
      },
      {
        id: "filtra",
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
        carril: "solicitante",
        nodo: null,
        texto: tb("Recibe la respuesta", "Receives the reply"),
      },
      {
        id: "fin",
        tipo: "fin",
        carril: "solicitante",
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
      { de: "inicio", a: "entrega" },
      { de: "entrega", a: "marca" },
      { de: "marca", a: "extrae" },
      { de: "extrae", a: "cruza" },
      { de: "cruza", a: "gris" },
      { de: "gris", a: "investiga", etiqueta: tb("sí", "yes") },
      { de: "gris", a: "puntua", etiqueta: tb("no", "no") },
      { de: "investiga", a: "puntua" },
      { de: "puntua", a: "escala" },
      { de: "escala", a: "revisa", etiqueta: tb("sí", "yes") },
      { de: "escala", a: "expediente", etiqueta: tb("no", "no") },
      { de: "revisa", a: "expediente" },
      { de: "expediente", a: "filtra" },
      { de: "filtra", a: "recibe" },
      { de: "recibe", a: "fin" },
    ] as { de: string; a: string; etiqueta?: TextoBilingue }[],
    anotaciones: [
      {
        paso: "revisa",
        texto: tb(
          "Ningún rechazo ni coincidencia en listas sale sin el oficial; en esta demo, el oficial se simuló en lote.",
          "No rejection and no list match goes out without the officer; in this demo, the officer was simulated in batch.",
        ),
      },
      {
        paso: "investiga",
        texto: tb(
          "El investigador concluye, no decide: si dice «misma persona», el caso va al oficial.",
          "The investigator concludes, it does not decide: if it says “same person”, the case goes to the officer.",
        ),
      },
      {
        paso: "filtra",
        texto: tb(
          "Un documento nunca decide qué acción se ejecuta.",
          "A document never decides which action runs.",
        ),
      },
    ],
  },
};
