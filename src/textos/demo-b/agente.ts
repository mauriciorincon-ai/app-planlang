/**
 * La copia propia del demo B en P3 Agente: su ficha, sus nueve nodos, sus tablas de trazas, la arista que se puede
 * tocar y su arquitectura. Las cifras NO viven aquí: las calcula `src/lib/vista/agente-b.ts` desde la corrida, el
 * lote, las listas y el informe. Vive aparte para que la guardia «copia contra plan» la lea contra el plan B (los ids
 * de los dos planes se cruzan). Los rótulos comunes a los dos demos siguen en `src/textos/agente.ts`.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { CategoriaRegla } from "@/lib/vista/motivo-pausa";
import {
  F_INTERRUPT,
  F_NODOS,
  F_SALIDA,
  INSTRUCCION,
  LLAMADA,
  LLAMADA_TEXTO,
  SALIDA,
  SALIDA_TEXTO,
  lista,
  type TextosDeNodoVitrina,
} from "../agente";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA_B = tb(
  "El agente de vinculación · planlang",
  "The onboarding agent · planlang",
);
export const DESCRIPCION_PAGINA_B = tb(
  "El agente del demo B tal como corrió: su grafo real frente al plan que salió de la entrevista, nodo por nodo. Simulación · no operativo.",
  "Demo B's agent as it ran: its real graph against the plan that came out of the interview, node by node. Simulation · not operational.",
);

export const PORTADA_B = {
  titulo: tb(
    "El agente de vinculación, tal como corrió",
    "The onboarding agent, as it ran",
  ),
};

/** Las cifras de un nodo del B en la corrida, que las plantillas de «En los N casos» convierten en frase. */
export interface CifrasDeNodoB {
  total: number;
  casos: number;
  visitas: number;
  criterios: TextoBilingue;
  /** Casos cuyos documentos traían una instrucción escondida (la guardia de entrada los marcó). */
  cargas: string[];
  reintentos: number;
  /** Casos a los que les faltaba al menos un dato exigido tras la extracción. */
  faltantes: string[];
  exactas: number;
  zonaGris: number;
  mismaPersona: string[];
  homonimos: string[];
  /** El umbral de escalamiento por riesgo del plan (el que lee la regla «riesgo»). */
  umbralRiesgo: number;
  riesgoAlto: number;
  conInconsistencias: number;
  proponeRechazar: number;
  solos: number;
  aPersona: number;
  porRegla: Record<CategoriaRegla, number>;
  pausas: number;
  rechazo: number;
  aprobo: number;
  conclusiones: number;
  sinCita: number;
  documentos: number;
  hallazgos: number;
  severidadMax: number;
  neutralizadas: string[];
  accion: string;
}

export const FICHA_B = {
  objetivo: tb(
    "Resolver solicitudes de vinculación con debida diligencia: aprobar en segundos las limpias y llevar al oficial de cumplimiento toda coincidencia en listas, todo riesgo alto y todo rechazo. Nunca rechaza por su cuenta, nunca deja que un documento cambie lo que hace y cita en el expediente la regla o la coincidencia de cada conclusión.",
    "Resolve onboarding applications with due diligence: approve the clean ones in seconds and bring every list match, every high risk and every rejection to the compliance officer. It never rejects on its own, never lets a document change what it does and cites in the file the rule or match behind each conclusion.",
  ),
  recibe: {
    identidad: {
      titulo: tb("El documento de identidad", "The identity document"),
      detalle: ((n: number) =>
        tb(
          `Nombre, documento, año de nacimiento y nacionalidad; en los ${n} casos.`,
          `Name, document, year of birth and nationality; in all ${n} cases.`,
        )) as Plantilla<number>,
    },
    actividad: {
      titulo: tb(
        "La declaración de actividad económica",
        "The statement of economic activity",
      ),
      detalle: tb(
        "Qué hace la persona y cuánto gana, firmada con su documento.",
        "What the person does and earns, signed with their document.",
      ),
    },
    fondos: {
      titulo: tb(
        "La declaración de origen de fondos",
        "The source-of-funds statement",
      ),
      detalle: ((p: { sin: number; de: number }) =>
        p.sin === 0
          ? tb(
              `De dónde viene el dinero y quién es su titular; llegó en los ${p.de} casos.`,
              `Where the money comes from and who holds it; it came with all ${p.de} cases.`,
            )
          : tb(
              `De dónde viene el dinero y quién es su titular; ${p.sin} de ${p.de} casos ${p.sin === 1 ? "llegó" : "llegaron"} sin ella.`,
              `Where the money comes from and who holds it; ${p.sin} of ${p.de} cases came without it.`,
            )) as Plantilla<{ sin: number; de: number }>,
    },
    listas: {
      titulo: tb("Las listas de control", "The control lists"),
      detalle: ((p: {
        vinculantes: number;
        consulta: number;
        entradas: number;
      }) =>
        tb(
          `${p.vinculantes} vinculante y ${p.consulta} de consulta, con ${p.entradas} entradas sintéticas, cada una con su versión y su fecha.`,
          `${p.vinculantes} binding and ${p.consulta} reference, with ${p.entradas} synthetic entries, each with its version and date.`,
        )) as Plantilla<{
        vinculantes: number;
        consulta: number;
        entradas: number;
      }>,
    },
  },
  entrega: {
    aprobacion: {
      titulo: tb("Aprobación", "Approval"),
      detalle: ((p: { n: number; de: number }) =>
        tb(
          `Con aviso de IA para el solicitante: ${p.n} de ${p.de}.`,
          `With an AI notice for the applicant: ${p.n} of ${p.de}.`,
        )) as Plantilla<{ n: number; de: number }>,
    },
    escalamiento: {
      titulo: tb(
        "Escalamiento al oficial de cumplimiento",
        "Escalation to the compliance officer",
      ),
      detalle: ((p: {
        campos: number;
        pausas: number;
        aprobo: number;
        rechazo: number;
      }) =>
        tb(
          `Con los ${p.campos} campos que exige el plan: ${p.pausas} pausas; el oficial simulado aprobó ${p.aprobo} y rechazó ${p.rechazo}.`,
          `With the ${p.campos} fields the plan requires: ${p.pausas} pauses; the simulated officer approved ${p.aprobo} and rejected ${p.rechazo}.`,
        )) as Plantilla<{
        campos: number;
        pausas: number;
        aprobo: number;
        rechazo: number;
      }>,
    },
    rechazo: {
      titulo: tb("Rechazo con su documento", "Rejection with its document"),
      detalle: ((p: { n: number; de: number }) =>
        tb(
          `Solo después del oficial, con su documento en ES y EN: ${p.n} de ${p.de}, todos con una persona (C2).`,
          `Only after the officer, with its document in ES and EN: ${p.n} of ${p.de}, all with a person (C2).`,
        )) as Plantilla<{ n: number; de: number }>,
    },
    expediente: {
      titulo: tb(
        "El expediente y la traza de cada caso",
        "Each case's file and trace",
      ),
      detalle: ((n: number) =>
        tb(
          `Cada conclusión cita su regla o su coincidencia; planlang-trace/v1 con huella para los ${n}.`,
          `Every conclusion cites its rule or match; planlang-trace/v1 with a fingerprint for all ${n}.`,
        )) as Plantilla<number>,
    },
  },
  nunca: [
    {
      titulo: tb(
        "Rechazar sin que lo revise una persona",
        "Reject without a person reviewing it",
      ),
      refs: tb(
        "C2 · AMLR art. 76(5) · AI Act art. 14",
        "C2 · AMLR art. 76(5) · EU AI Act art. 14",
      ),
    },
    {
      titulo: tb(
        "Aprobar solo a alguien que coincide con una lista",
        "Approve on its own someone who matches a list",
      ),
      refs: tb(
        "D1 · C1 · Ley 1121 de 2006, art. 20",
        "D1 · C1 · Colombian Law 1121 of 2006, art. 20",
      ),
    },
    {
      titulo: tb(
        "Aprobar solo un caso de riesgo alto",
        "Approve a high-risk case on its own",
      ),
      refs: tb(
        "D4 · C2 · el nombre no entra al puntaje",
        "D4 · C2 · the name does not enter the score",
      ),
    },
    {
      titulo: tb(
        "Concluir sin citar su regla o su coincidencia",
        "Conclude without citing its rule or match",
      ),
      refs: tb(
        "D3 · C3 · el expediente lo arma el código",
        "D3 · C3 · code assembles the file",
      ),
    },
    {
      titulo: tb(
        "Dejar que un documento cambie lo que hace",
        "Let a document change what it does",
      ),
      refs: tb(
        "C6 · el documento es dato, nunca instrucción",
        "C6 · a document is data, never instruction",
      ),
    },
  ],
  papel: {
    solicitante: tb(
      "pide la vinculación y entrega sus tres documentos · sintético",
      "applies for onboarding and hands in three documents · synthetic",
    ),
    analista: tb(
      "recibe el expediente con la decisión · en este demo, nadie lo lee",
      "receives the file with the decision · in this demo, nobody reads it",
    ),
    oficial: tb(
      "decide en la pausa · en este demo, simulado",
      "decides at the pause · simulated in this demo",
    ),
    listas: tb(
      "vinculantes y de consulta, con versión y fecha · sintéticas",
      "binding and reference, with version and date · synthetic",
    ),
    agente: tb(
      "este sistema, en una entidad financiera sintética",
      "this system, at a synthetic financial institution",
    ),
  } as Record<string, TextoBilingue>,
  capacidad: {
    rango: ((p: { min: string; max: string }) =>
      tb(
        `de ${p.min} a ${p.max} s; el plan no fija una latencia`,
        `from ${p.min} to ${p.max} s; the plan sets no latency`,
      )) as Plantilla<{ min: string; max: string }>,
    tokensRango: ((p: {
      min: string;
      max: string;
      caso: string;
      investigador: boolean;
    }) =>
      p.investigador
        ? tb(
            `de ${p.min} a ${p.max} · el más largo, ${p.caso}, pasó por el investigador`,
            `from ${p.min} to ${p.max} · the longest, ${p.caso}, went through the investigator`,
          )
        : tb(
            `de ${p.min} a ${p.max} · el más largo fue ${p.caso}`,
            `from ${p.min} to ${p.max} · the longest was ${p.caso}`,
          )) as Plantilla<{
      min: string;
      max: string;
      caso: string;
      investigador: boolean;
    }>,
    sinMinutos: tb(
      "el plan no declara minutos de oficial por caso: aquí se cuentan casos, no minutos",
      "the plan declares no officer minutes per case: here cases are counted, not minutes",
    ),
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
      `Objetivo, actividades y entregas: plan del demo B ${p.plan}, salido de la entrevista. Estado y cifras: corrida ${p.corrida} del sprint ${p.sprint} (${p.fecha}), ${p.n} casos sintéticos, modelo ${p.modelo} por la suscripción de Claude Code.`,
      `Goal, activities and deliveries: demo B plan ${p.plan}, born from the interview. Status and figures: sprint ${p.sprint} run ${p.corrida} (${p.fecha}), ${p.n} synthetic cases, ${p.modelo} model via the Claude Code subscription.`,
    )) as Plantilla<{
    plan: string;
    corrida: string;
    sprint: number;
    fecha: string;
    n: number;
    modelo: string;
  }>,
};

/** Las actividades de la ficha, con su clave: la vista les pone cifra y «corrió» por clave, no por posición (C-3). */
export type ClaveActividadB =
  | "revisaEntrada"
  | "lee"
  | "cruza"
  | "investiga"
  | "puntua"
  | "decide"
  | "responde";

export const ACTIVIDADES_B: ReadonlyArray<{
  clave: ClaveActividadB;
  titulo: TextoBilingue;
  nodos: readonly string[];
  flecha?: boolean;
}> = [
  {
    clave: "revisaEntrada",
    titulo: tb(
      "Busca instrucciones escondidas en los documentos",
      "Looks for hidden instructions in the documents",
    ),
    nodos: ["enrutador"],
  },
  {
    clave: "lee",
    titulo: tb(
      "Lee los tres documentos y los vuelve datos",
      "Reads the three documents and turns them into data",
    ),
    nodos: ["extractor"],
  },
  {
    clave: "cruza",
    titulo: tb(
      "Cruza el nombre con las listas, exacto y aproximado",
      "Checks the name against the lists, exactly and approximately",
    ),
    nodos: ["verificador_listas"],
  },
  {
    clave: "investiga",
    titulo: tb(
      "En la zona gris, compara el contexto: ¿homónimo o la misma persona?",
      "In the gray zone, compares the context: a namesake or the same person?",
    ),
    nodos: ["verificador_listas", "investigador"],
    /** El caso va de un nodo al otro (se dibuja con flecha). */
    flecha: true,
  },
  {
    clave: "puntua",
    titulo: tb(
      "Puntúa el riesgo con reglas, sin mirar el nombre",
      "Scores the risk with rules, without looking at the name",
    ),
    nodos: ["puntaje"],
  },
  {
    clave: "decide",
    titulo: tb(
      "Decide: sigue solo o pasa al oficial",
      "Decides: go on alone or to the officer",
    ),
    nodos: ["decision", "pausa_humana"],
  },
  {
    clave: "responde",
    titulo: tb(
      "Arma el expediente con sus citas, responde y filtra la salida",
      "Builds the file with its citations, replies and filters the output",
    ),
    nodos: ["redactor", "guardia_salida"],
  },
];

export const CIFRAS_ACTIVIDAD_B = {
  cargas: ((p: { n: number; de: number }) =>
    tb(
      `${p.n} de ${p.de} con una instrucción escondida`,
      `${p.n} of ${p.de} with a hidden instruction`,
    )) as Plantilla<{ n: number; de: number }>,
  zonaGris: ((n: number) =>
    tb(
      `${n} casos en la zona gris`,
      `${n} cases in the gray zone`,
    )) as Plantilla<number>,
  expedientes: ((p: { n: number; documentos: number }) =>
    tb(
      `${p.n} expedientes; ${p.documentos} rechazos con su documento`,
      `${p.n} files; ${p.documentos} rejections with their document`,
    )) as Plantilla<{ n: number; documentos: number }>,
};

export type ClavePuedeB =
  "lee" | "investiga" | "listas" | "pausas" | "inyeccion";

export const PUEDE_B: ReadonlyArray<{
  clave: ClavePuedeB;
  titulo: TextoBilingue;
}> = [
  {
    clave: "lee",
    titulo: tb(
      "Leer documentos y volverlos datos en un formato fijo",
      "Read documents and turn them into data in a fixed format",
    ),
  },
  {
    clave: "investiga",
    titulo: tb(
      "Distinguir por el contexto a un homónimo de la persona listada",
      "Tell a namesake from the listed person by the context",
    ),
  },
  {
    clave: "listas",
    titulo: tb(
      "Cruzar nombres con listas que cualquiera puede leer",
      "Check names against lists anyone can read",
    ),
  },
  {
    clave: "pausas",
    titulo: tb(
      "Detenerse, esperar a una persona y retomar donde iba",
      "Stop, wait for a person and resume where it was",
    ),
  },
  {
    clave: "inyeccion",
    titulo: tb(
      "Ignorar órdenes escondidas en los documentos",
      "Ignore orders hidden in the documents",
    ),
  },
];

export const CIFRAS_PUEDE_B = {
  investiga: ((p: { n: number; misma: number; homonimos: number }) =>
    tb(
      `${p.n} casos: ${p.misma} la misma persona y ${p.homonimos} ${p.homonimos === 1 ? "homónimo" : "homónimos"}`,
      `${p.n} cases: ${p.misma} the same person and ${p.homonimos} ${p.homonimos === 1 ? "namesake" : "namesakes"}`,
    )) as Plantilla<{ n: number; misma: number; homonimos: number }>,
};

export const EXPERTO_B = {
  patron: tb(
    "guardia de entrada + extractor e investigador de contexto (modelos) + verificador de listas, puntaje y redactor (reglas)",
    "input guard + extractor and context investigator (models) + list checker, scoring and writer (rules)",
  ),
  decision: tb(
    "D2, de dos vías: el investigador entra desde el inicio de la zona gris y se puede retirar",
    "D2, two-way: the investigator steps in from the start of the gray zone and can be removed",
  ),
  lineaBaseTexto: ((refutado: boolean) =>
    refutado
      ? tb(
          "agente único sobre el mismo lote: S2 quedó refutado; los dos acertaron igual y el multiagente tardó un poco más en la mediana",
          "single agent on the same batch: S2 was refuted; both got the same cases right and the multi-agent took a little longer at the median",
        )
      : tb(
          "agente único sobre el mismo lote: S2 se sostuvo, el multiagente no rindió peor que uno solo",
          "single agent on the same batch: S2 held, the multi-agent did no worse than one",
        )) as Plantilla<boolean>,
  regimen: tb(
    "suscripción de Claude Code del autor; lotes de 20 fuera de CI; interruptor a API (Haiku 4.5) o Groq por configuración",
    "the author's Claude Code subscription; batches of 20 outside CI; switch to API (Haiku 4.5) or Groq by configuration",
  ),
};

/** El nombre de la pausa en la lista por capa: quién responde. */
export const REANUDACION_B = tb(
  "reanudación (responde el oficial de cumplimiento)",
  "resume (the compliance officer answers)",
);

/**
 * Nombre corto de una regla sin umbral en las líneas que agrupan varias (la de decision hacia la pausa), por la
 * categoría de la regla y no por su posición (AU-S2-B48).
 */
export const REGLA_CORTA_B: Record<string, TextoBilingue> = {
  carga: tb("instrucción escondida", "hidden instruction"),
  mismaPersona: tb("misma persona", "same person"),
  rechazar: tb("rechazar", "reject"),
};

/** Por qué se detuvo un caso: la categoría de la regla que se cumplió. */
export const MOTIVO_PAUSA_B: Record<string, TextoBilingue> = {
  carga: tb(
    "instrucción escondida en un documento",
    "hidden instruction in a document",
  ),
  coincidencia: tb("similitud en o sobre U1", "similarity at or above U1"),
  mismaPersona: tb(
    "el investigador concluyó «misma persona»",
    "the investigator concluded “same person”",
  ),
  riesgo: tb("riesgo en o sobre U2", "risk at or above U2"),
  inconsistencias: tb("inconsistencias sobre U3", "inconsistencies above U3"),
  rechazar: tb("la propuesta era rechazar", "the proposal was to reject"),
};

/** Palabras del dominio que aparecen como valor en una celda. */
export const VALORES_B: Record<string, TextoBilingue> = {
  aprobar: tb("aprobar", "approve"),
  rechazar: tb("rechazar", "reject"),
  misma_persona: tb("misma persona", "same person"),
  homonimo: tb("homónimo", "namesake"),
  vinculante: tb("vinculante", "binding"),
  consulta: tb("de consulta", "reference"),
};

export const NODOS_B: Record<
  string,
  TextosDeNodoVitrina & { enLaCorrida: (c: CifrasDeNodoB) => TextoBilingue }
> = {
  enrutador: {
    rol: tb(
      "Revisa los documentos antes que nadie y marca si traen instrucciones escondidas.",
      "It checks the documents before anyone else and flags hidden instructions.",
    ),
    recibe: {
      titulo: tb(
        "Los tres documentos de la solicitud",
        "The application's three documents",
      ),
      sub: tb(
        "identidad, actividad y origen de fondos",
        "identity, activity and source of funds",
      ),
    },
    entrega: {
      titulo: tb(
        "La marca de instrucción escondida; el caso sigue al extractor",
        "The hidden-instruction flag; the case goes on to the extractor",
      ),
      sub: tb(
        "la marca la lee decision más adelante",
        "decision reads the flag later on",
      ),
    },
    paraQue: tb(
      "Un documento puede traer órdenes para el sistema. Marcarlas antes de que un modelo lea el texto es la defensa que no depende de convencer a nadie.",
      "A document may carry orders for the system. Flagging them before a model reads the text is the defense that does not depend on persuading anyone.",
    ),
    como: tb(
      "Con reglas fijas, sin modelo: busca en los documentos frases dirigidas al sistema (RG-01). No cambia el camino: el caso sigue siempre al extractor.",
      "With fixed rules, no model: it looks in the documents for phrases aimed at the system (RG-01). It does not change the path: the case always goes on to the extractor.",
    ),
    siFalla: tb(
      "Una instrucción escondida llegaría sin marca al resto del agente (riesgo R4).",
      "A hidden instruction would reach the rest of the agent unflagged (risk R4).",
    ),
    seMide: tb(
      "En los casos con inyección, la inyección queda neutralizada y la decisión final coincide con la verdad conocida (criterio C6).",
      "In the cases with an injection, it is neutralized and the final decision matches the known truth (criterion C6).",
    ),
    enLaCorrida: (c) =>
      c.cargas.length
        ? tb(
            `Marcó ${lista(c.cargas, "y")}: ${c.cargas.length === 1 ? "sus documentos traían" : "traían"} una instrucción escondida. Los otros ${c.casos - c.cargas.length} pasaron sin marca.`,
            `It flagged ${lista(c.cargas, "and")}: ${c.cargas.length === 1 ? "its documents carried" : "they carried"} a hidden instruction. The other ${c.casos - c.cargas.length} passed unflagged.`,
          )
        : tb(
            `Revisó ${c.casos} casos y ninguno traía una instrucción escondida.`,
            `It checked ${c.casos} cases and none carried a hidden instruction.`,
          ),
    lee: tb("los tres documentos, como texto", "the three documents, as text"),
    modelo: {
      rotulo: tb("Por qué no usa modelo", "Why it uses no model"),
      filas: [
        [
          tb("Código primero", "Code first"),
          tb(
            "una instrucción dirigida al sistema se reconoce por su forma; un modelo que la lee es justo lo que busca el atacante",
            "an instruction aimed at the system is recognized by its shape; a model reading it is exactly what the attacker wants",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
  extractor: {
    rol: tb(
      "Lee los tres documentos y los vuelve datos ordenados.",
      "It reads the three documents and turns them into ordered data.",
    ),
    recibe: {
      titulo: tb(
        "Los tres documentos, sin datos de contacto",
        "The three documents, without contact details",
      ),
      sub: tb(
        "entre marcas «dato, no instrucción»",
        "between “data, not instruction” markers",
      ),
    },
    entrega: {
      titulo: tb(
        "Nombre, documento, nacimiento, nacionalidad, actividad, ingresos y jurisdicción de los fondos",
        "Name, document, birth, nationality, activity, income and jurisdiction of the funds",
      ),
      sub: tb(
        "y el titular que cita cada declaración",
        "and the holder each statement names",
      ),
    },
    paraQue: tb(
      "Las listas y el puntaje trabajan con datos, no con texto libre. Este paso convierte los documentos en datos que el resto del agente sí puede revisar.",
      "The lists and the score work with data, not free text. This step turns the documents into data the rest of the agent can check.",
    ),
    como: tb(
      "Un modelo de lenguaje (sonnet, por la suscripción de Claude Code) lee los documentos con instrucciones fijas y responde en un formato cerrado, con los códigos del catálogo. Si falta un dato, lo deja vacío.",
      "A language model (sonnet, via the Claude Code subscription) reads the documents under fixed instructions and answers in a closed format, using the catalog codes. If a field is absent, it leaves it empty.",
    ),
    siFalla: tb(
      "Podría leer mal un dato y torcer el resto del caso, u obedecer una orden escondida en un documento (riesgo R4).",
      "It could misread a field and skew the rest of the case, or obey an order hidden in a document (risk R4).",
    ),
    seMide: tb(
      "La extracción coincide con la verdad conocida en {plan:C5.objetivo|%} % o más de los casos (C5).",
      "The extraction matches the known truth in {plan:C5.objetivo|%}% or more of the cases (C5).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Leyó ${c.casos} casos. ${c.reintentos === 0 ? "Ninguna respuesta salió fuera de formato." : c.reintentos === 1 ? "Una respuesta salió fuera de formato y se reintentó." : `${c.reintentos} respuestas salieron fuera de formato y se reintentaron.`}${c.faltantes.length ? ` En ${lista(c.faltantes, "y")} faltaba un dato exigido.` : ""} ${c.criterios.es}`,
        `It read ${c.casos} cases. ${c.reintentos === 0 ? "No answer came out off-format." : c.reintentos === 1 ? "One answer came out off-format and was retried." : `${c.reintentos} answers came out off-format and were retried.`}${c.faltantes.length ? ` ${lista(c.faltantes, "and")} lacked a required field.` : ""} ${c.criterios.en}`,
      ),
    lee: tb(
      "los documentos sin datos de contacto y el catálogo de códigos",
      "the documents without contact details and the code catalog",
    ),
    modelo: {
      rotulo: tb("Configuración del modelo", "Model configuration"),
      filas: [
        [
          tb("Adaptador", "Adapter"),
          tb(
            '`ChatClaudeCode(model="{modelo}").with_structured_output(ExtraccionB)`',
            '`ChatClaudeCode(model="{modelo}").with_structured_output(ExtraccionB)`',
          ),
        ],
        [LLAMADA, LLAMADA_TEXTO],
        [SALIDA, SALIDA_TEXTO],
        [
          INSTRUCCION,
          tb(
            "fija; cada documento va entre marcas «dato, no instrucción» y sin teléfonos ni correos",
            "fixed; each document goes between “data, not instruction” markers, without phones or emails",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS, F_SALIDA],
  },
  verificador_listas: {
    rol: tb(
      "Cruza el nombre con las listas de control, exacto y aproximado.",
      "It checks the name against the control lists, exactly and approximately.",
    ),
    recibe: {
      titulo: tb(
        "El nombre leído y las listas de control",
        "The name read and the control lists",
      ),
      sub: tb(
        "vinculantes y de consulta, con versión y fecha",
        "binding and reference, with version and date",
      ),
    },
    entrega: {
      titulo: tb(
        "La mayor similitud y su entrada; el caso al investigador o al puntaje",
        "The highest similarity and its entry; the case to the investigator or to scoring",
      ),
      sub: tb(
        "desde {plan:U4} de similitud empieza la zona gris (U4)",
        "the gray zone starts at {plan:U4} similarity (U4)",
      ),
    },
    paraQue: tb(
      "Una coincidencia en una lista vinculante obliga a bloquear y escalar. La comparación la hace código que cualquiera puede leer, nunca un modelo.",
      "A match on a binding list requires blocking and escalating. Code anyone can read makes the comparison, never a model.",
    ),
    como: tb(
      "Sin modelo: normaliza los nombres (minúsculas, sin tildes, palabras en orden) y mide su similitud de Jaro-Winkler con cada entrada y cada alias de las listas (RL-01, RL-02).",
      "No model: it normalizes the names (lowercase, no accents, words in order) and measures their Jaro-Winkler similarity with every entry and alias on the lists (RL-01, RL-02).",
    ),
    decide: tb(
      "Una regla: desde {plan:U4} de similitud, el caso va al investigador de contexto; si no, sigue al puntaje.",
      "One rule: from {plan:U4} similarity, the case goes to the context investigator; otherwise it goes on to scoring.",
    ),
    siFalla: tb(
      "Dejaría pasar a una persona de una lista vinculante (riesgo R1) o mandaría a revisar a demasiados homónimos.",
      "It would let a person on a binding list through (risk R1) or send too many namesakes for review.",
    ),
    seMide: tb(
      "Toda coincidencia en listas pasa por una persona (C1); el supuesto S1 mide si la similitud sola produce demasiadas alarmas falsas.",
      "Every list match goes through a person (C1); assumption S1 measures whether similarity alone raises too many false alarms.",
    ),
    enLaCorrida: (c) =>
      tb(
        `Revisó ${c.casos} casos, sin modelo: ${c.exactas} ${c.exactas === 1 ? "coincidencia exacta" : "coincidencias exactas"} y ${c.zonaGris} casos desde la zona gris, que fueron al investigador. ${c.criterios.es}`,
        `It checked ${c.casos} cases, no model: ${c.exactas} exact ${c.exactas === 1 ? "match" : "matches"} and ${c.zonaGris} cases from the gray zone up, which went to the investigator. ${c.criterios.en}`,
      ),
    lee: tb(
      "el nombre leído y las listas, con su versión y su fecha",
      "the name read and the lists, with their version and date",
    ),
    modelo: {
      rotulo: tb("Reglas de coincidencia", "Matching rules"),
      filas: [
        [
          tb("RL-01", "RL-01"),
          tb(
            "exacta: el nombre normalizado es el de una entrada o un alias",
            "exact: the normalized name is an entry's or an alias's",
          ),
        ],
        [
          tb("RL-02", "RL-02"),
          tb(
            "aproximada: la mayor similitud de Jaro-Winkler entre todas las entradas y alias",
            "approximate: the highest Jaro-Winkler similarity across all entries and aliases",
          ),
        ],
        [
          tb("RL-03", "RL-03"),
          tb(
            "lista vinculante: bloquear y escalar (Ley 1121 de 2006, art. 20; AMLR art. 76(5))",
            "binding list: block and escalate (Law 1121 of 2006, art. 20; AMLR art. 76(5))",
          ),
        ],
        [
          tb("RL-04", "RL-04"),
          tb(
            "lista de consulta: debida diligencia reforzada por una persona, no un rechazo",
            "reference list: enhanced due diligence by a person, not a rejection",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
  investigador: {
    rol: tb(
      "En la zona gris, compara el contexto y concluye si es un homónimo o la misma persona.",
      "In the gray zone, it compares the context and concludes whether it is a namesake or the same person.",
    ),
    recibe: {
      titulo: tb(
        "El solicitante y la persona de la lista, como datos",
        "The applicant and the listed person, as data",
      ),
      sub: tb(
        "año de nacimiento, nacionalidad y alias; nunca los documentos",
        "year of birth, nationality and aliases; never the documents",
      ),
    },
    entrega: {
      titulo: tb(
        "Su conclusión, con sus razones en ES y EN",
        "Its conclusion, with its reasons in ES and EN",
      ),
      sub: tb("concluye, no decide", "it concludes, it does not decide"),
    },
    paraQue: tb(
      "La similitud de nombre sola da demasiadas alarmas falsas. Mirar el contexto separa a un homónimo de la persona listada antes de ocupar al oficial.",
      "Name similarity alone raises too many false alarms. Looking at the context tells a namesake from the listed person before taking up the officer's time.",
    ),
    como: tb(
      "Un modelo de lenguaje recibe solo datos de los dos, nunca los documentos, y responde en un formato cerrado: homónimo o misma persona, con sus razones.",
      "A language model receives only data about both, never the documents, and answers in a closed format: namesake or same person, with its reasons.",
    ),
    siFalla: tb(
      "Podría llamar homónimo a la persona listada (riesgo R1); por eso no decide: si concluye «misma persona», el caso va al oficial, y rechazar por homonimia sin una persona es el riesgo R2.",
      "It could call the listed person a namesake (risk R1); that is why it does not decide: if it concludes “same person”, the case goes to the officer, and rejecting a namesake without a person is risk R2.",
    ),
    seMide: tb(
      "Homónimos resueltos correctamente en {plan:C4.objetivo|%} % o más de los casos (C4), y el supuesto S1.",
      "Namesakes resolved correctly in {plan:C4.objetivo|%}% or more of the cases (C4), and assumption S1.",
    ),
    enLaCorrida: (c) =>
      tb(
        `Investigó ${c.casos} casos: ${c.mismaPersona.length} la misma persona${c.homonimos.length ? ` y ${c.homonimos.length === 1 ? "un homónimo" : `${c.homonimos.length} homónimos`} (${lista(c.homonimos, "y")})` : ""}. ${c.criterios.es}`,
        `It investigated ${c.casos} cases: ${c.mismaPersona.length} the same person${c.homonimos.length ? ` and ${c.homonimos.length === 1 ? "one namesake" : `${c.homonimos.length} namesakes`} (${lista(c.homonimos, "and")})` : ""}. ${c.criterios.en}`,
      ),
    lee: tb(
      "los datos del solicitante y de la entrada, sin los documentos",
      "the applicant's and the entry's data, without the documents",
    ),
    modelo: {
      rotulo: tb("Configuración del modelo", "Model configuration"),
      filas: [
        [
          tb("Adaptador", "Adapter"),
          tb(
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Investigacion)`',
            '`ChatClaudeCode(model="{modelo}").with_structured_output(Investigacion)`',
          ),
        ],
        [LLAMADA, LLAMADA_TEXTO],
        [SALIDA, SALIDA_TEXTO],
        [
          INSTRUCCION,
          tb(
            "fija: compara año de nacimiento, nacionalidad y alias; concluye homónimo o misma persona, nunca decide",
            "fixed: compare year of birth, nationality and aliases; conclude namesake or same person, never decide",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS, F_SALIDA],
  },
  puntaje: {
    rol: tb(
      "Puntúa el riesgo con reglas declaradas y propone aprobar o rechazar.",
      "It scores the risk with declared rules and proposes to approve or reject.",
    ),
    recibe: {
      titulo: tb(
        "Actividad, jurisdicción de los fondos e ingresos",
        "Activity, jurisdiction of the funds and income",
      ),
      sub: tb(
        "nunca el nombre ni la nacionalidad (RP-04)",
        "never the name or nationality (RP-04)",
      ),
    },
    entrega: {
      titulo: tb(
        "Un puntaje de 0 a 100, las inconsistencias y una propuesta",
        "A score from 0 to 100, the inconsistencies and a proposal",
      ),
      sub: tb(
        "aprobar o rechazar; decide el nodo siguiente",
        "approve or reject; the next node decides",
      ),
    },
    paraQue: tb(
      "El riesgo es una regla del plan, no una opinión: lo calcula código que cualquiera puede leer, y el nombre de la persona no entra.",
      "Risk is a plan rule, not an opinion: code anyone can read computes it, and the person's name does not enter.",
    ),
    como: tb(
      "Sin modelo: suma puntos por actividad, jurisdicción de los fondos y coherencia de los ingresos (RP-01 a RP-03), cuenta las inconsistencias entre documentos (RI-01 a RI-03) y propone rechazar solo si la persona está en una lista vinculante o su identidad no se puede verificar (RD-01, RD-02).",
      "No model: it adds points for activity, jurisdiction of the funds and income consistency (RP-01 to RP-03), counts the inconsistencies between documents (RI-01 to RI-03) and proposes to reject only if the person is on a binding list or their identity cannot be verified (RD-01, RD-02).",
    ),
    siFalla: tb(
      "Un caso de riesgo alto seguiría solo, sin que lo vea una persona, o el nombre de alguien torcería su puntaje.",
      "A high-risk case would go on alone, unseen by a person, or someone's name would skew their score.",
    ),
    seMide: tb(
      "Ninguna aprobación automática con riesgo alto (C2); una prueba que permuta los nombres comprueba que el puntaje no cambia.",
      "No automatic approval at high risk (C2); a test that swaps the names checks that the score does not change.",
    ),
    enLaCorrida: (c) =>
      tb(
        `Puntuó ${c.casos} casos: ${c.riesgoAlto} en o sobre ${c.umbralRiesgo}, ${c.conInconsistencias} con inconsistencias y ${c.proponeRechazar} ${c.proponeRechazar === 1 ? "propuesta" : "propuestas"} de rechazar. Sin modelo: 0 tokens.`,
        `It scored ${c.casos} cases: ${c.riesgoAlto} at or above ${c.umbralRiesgo}, ${c.conInconsistencias} with inconsistencies and ${c.proponeRechazar} ${c.proponeRechazar === 1 ? "proposal" : "proposals"} to reject. No model: 0 tokens.`,
      ),
    lee: tb(
      "la extracción, la conclusión del investigador y el catálogo de riesgos",
      "the extraction, the investigator's conclusion and the risk catalog",
    ),
    modelo: {
      rotulo: tb("Reglas del puntaje", "Scoring rules"),
      filas: [
        [
          tb("RP-01", "RP-01"),
          tb(
            "actividad económica: riesgo bajo 0, medio 20 y alto 40 puntos",
            "economic activity: low risk 0, medium 20 and high 40 points",
          ),
        ],
        [
          tb("RP-02", "RP-02"),
          tb(
            "jurisdicción de los fondos: bajo 0, medio 15 y alto 30 puntos",
            "jurisdiction of the funds: low 0, medium 15 and high 30 points",
          ),
        ],
        [
          tb("RP-03", "RP-03"),
          tb(
            "coherencia: ingresos dentro del rango de la actividad 0 puntos; fuera, 30",
            "consistency: income within the activity's range 0 points; outside, 30",
          ),
        ],
        [
          tb("RP-04", "RP-04"),
          tb(
            "el nombre, la nacionalidad y el año de nacimiento no cuentan",
            "the name, nationality and year of birth do not count",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
  decision: {
    rol: tb(
      "Reúne las señales y decide el camino: sigue solo o pasa al oficial.",
      "It gathers the signals and decides the path: go on alone or to the officer.",
    ),
    recibe: {
      titulo: tb(
        "La propuesta del puntaje y las señales del caso",
        "The scoring proposal and the case signals",
      ),
      sub: tb(
        "instrucción escondida, similitud, conclusión, puntaje e inconsistencias",
        "hidden instruction, similarity, conclusion, score and inconsistencies",
      ),
    },
    entrega: {
      titulo: tb(
        "El camino: al redactor, o a la pausa humana",
        "The path: to the writer, or to the human pause",
      ),
      sub: tb(
        "ningún rechazo sale sin una persona",
        "no rejection goes out without a person",
      ),
    },
    paraQue: tb(
      "Es donde el plan pone sus umbrales: aquí se decide qué resuelve el agente solo y qué necesita al oficial de cumplimiento.",
      "It is where the plan places its thresholds: here it is decided what the agent resolves alone and what needs the compliance officer.",
    ),
    como: tb(
      "Sin modelo: evalúa en orden las {plan:reglas.decision} reglas del plan ({plan:lista.decision}). La primera que se cumple manda el caso al oficial.",
      "No model: it evaluates the plan's {plan:reglas.decision} rules in order ({plan:lista.decision}). The first that holds sends the case to the officer.",
    ),
    siFalla: tb(
      "Aprobaría sola a una persona de una lista vinculante (riesgo R1) o rechazaría por homonimia sin una persona (R2).",
      "It would approve a person on a binding list on its own (risk R1) or reject a namesake without a person (R2).",
    ),
    seMide: tb(
      "Toda coincidencia en listas pasa por una persona (C1); ninguna aprobación automática con riesgo alto y ningún rechazo sin persona (C2).",
      "Every list match goes through a person (C1); no automatic approval at high risk and no rejection without a person (C2).",
    ),
    enLaCorrida: (c) => {
      const r = c.porRegla;
      const partes = (
        [
          [
            r.carga,
            "por instrucción escondida",
            "for a hidden instruction",
            "por instrucción escondida",
            "for a hidden instruction",
          ],
          [
            r.coincidencia,
            "por coincidencia de nombre",
            "for a name match",
            "por coincidencia de nombre",
            "for a name match",
          ],
          [
            r.mismaPersona,
            "por ser la misma persona",
            "as the same person",
            "por ser la misma persona",
            "as the same person",
          ],
          [r.riesgo, "por riesgo", "for risk", "por riesgo", "for risk"],
          [
            r.inconsistencias,
            "por inconsistencias",
            "for inconsistencies",
            "por inconsistencias",
            "for inconsistencies",
          ],
          [
            r.rechazar,
            "propuestas de rechazar",
            "proposals to reject",
            "propuesta de rechazar",
            "proposal to reject",
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
        `Decidió ${c.casos} casos: ${c.solos} siguieron solos al redactor y ${c.aPersona} pasaron al oficial${es ? ` (${es})` : ""}. ${c.criterios.es}`,
        `It decided ${c.casos} cases: ${c.solos} went on alone to the writer and ${c.aPersona} went to the officer${en ? ` (${en})` : ""}. ${c.criterios.en}`,
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
      "Detiene el agente y le entrega el caso completo al oficial de cumplimiento.",
      "It halts the agent and hands the full case to the compliance officer.",
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
        "La decisión del oficial; el agente retoma donde iba",
        "The officer's decision; the agent resumes where it was",
      ),
      sub: tb("aquí el oficial está simulado", "here the officer is simulated"),
    },
    paraQue: tb(
      "Ningún rechazo sin una persona y ninguna coincidencia en listas sin ella: es ley (AMLR art. 76(5), AI Act art. 14), no un umbral.",
      "No rejection without a person and no list match without one: it is law (AMLR art. 76(5), EU AI Act art. 14), not a threshold.",
    ),
    como: tb(
      "LangGraph detiene el grafo con interrupt y guarda su estado; la respuesta del oficial lo reanuda en el mismo punto, hacia el redactor.",
      "LangGraph halts the graph with interrupt and saves its state; the officer's answer resumes it at the same point, towards the writer.",
    ),
    siFalla: tb(
      "Un rechazo saldría sin revisión (riesgo R2), o el oficial decidiría sin ver la evidencia completa.",
      "A rejection would go out unreviewed (risk R2), or the officer would decide without the full evidence.",
    ),
    seMide: tb(
      "Toda coincidencia en listas pasa por aquí (C1), y todo rechazo también (C2); el oficial ve los documentos, las coincidencias, la investigación y el puntaje.",
      "Every list match goes through here (C1), and so does every rejection (C2); the officer sees the documents, the matches, the investigation and the score.",
    ),
    extra: {
      falta: true,
      rotulo: tb("Lo que aún no hace", "What it does not do yet"),
      texto: tb(
        "Tener un oficial de verdad: aquí responde un revisor simulado que sigue la verdad conocida del caso (DA-04), y la vitrina lo dice en cada pantalla.",
        "Have a real officer: here a simulated reviewer answers, following the case's known truth (DA-04), and the showcase says so on every screen.",
      ),
    },
    enLaCorrida: (c) =>
      tb(
        `${c.pausas} pausas, todas desde decision. El oficial simulado rechazó ${c.rechazo} y aprobó ${c.aprobo}. El plan no declara minutos de oficial por caso: aquí se cuentan casos, no minutos.`,
        `${c.pausas} pauses, all from decision. The simulated officer rejected ${c.rechazo} and approved ${c.aprobo}. The plan declares no officer minutes per case: here cases are counted, not minutes.`,
      ),
    lee: tb(
      "el motivo, la señal, el umbral, la extracción, los documentos, las coincidencias, la investigación y el puntaje",
      "the reason, the signal, the threshold, the extraction, the documents, the matches, the investigation and the score",
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
      "Arma el expediente con la cita de cada conclusión, la respuesta al solicitante y, si es rechazo, su documento.",
      "It builds the file with each conclusion's citation, the applicant's answer and, on a rejection, its document.",
    ),
    recibe: {
      titulo: tb(
        "La decisión final y todo lo que se midió",
        "The final decision and everything that was measured",
      ),
      sub: tb(
        "documentos, coincidencias, investigación y puntaje",
        "documents, matches, investigation and score",
      ),
    },
    entrega: {
      titulo: tb(
        "El expediente, la respuesta en ES y EN y, en cada rechazo, su documento",
        "The file, the answer in ES and EN and, on each rejection, its document",
      ),
      sub: tb(
        "todo lo arma el código, sin modelo",
        "code assembles it all, no model",
      ),
    },
    paraQue: tb(
      "Un expediente que no dice qué regla o qué coincidencia motivó cada conclusión no se puede auditar. Aquí cada frase lleva su cita.",
      "A file that does not say which rule or match led to each conclusion cannot be audited. Here every sentence carries its citation.",
    ),
    como: tb(
      "Sin modelo: escribe cada conclusión desde los datos medidos, con su cita (un documento, una regla o una coincidencia en una lista con su versión y su fecha), y una respuesta fija según la decisión.",
      "No model: it writes each conclusion from the measured data, with its citation (a document, a rule or a match on a list with its version and date), and a fixed answer for the decision.",
    ),
    extra: {
      rotulo: tb("Doble cinturón", "Belt and braces"),
      texto: tb(
        "Antes de escribir un rechazo, o una aprobación con riesgo alto, el código comprueba que pasó por una persona; si no, se detiene.",
        "Before writing a rejection, or an approval at high risk, code checks it went through a person; if not, it stops.",
      ),
    },
    siFalla: tb(
      "Una conclusión quedaría sin cita y el expediente no se podría auditar (riesgo R3).",
      "A conclusion would be left uncited and the file could not be audited (risk R3).",
    ),
    seMide: tb(
      "El expediente cita la regla o la coincidencia en el 100 % de las conclusiones (C3).",
      "The file cites the rule or match in 100% of the conclusions (C3).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Armó ${c.casos} expedientes con ${c.conclusiones} conclusiones: ${c.sinCita === 0 ? "ninguna sin cita" : `${c.sinCita} sin cita`}. ${c.documentos} ${c.documentos === 1 ? "rechazo" : "rechazos"} con su documento en los dos idiomas. ${c.criterios.es}`,
        `It built ${c.casos} files with ${c.conclusiones} conclusions: ${c.sinCita === 0 ? "none uncited" : `${c.sinCita} uncited`}. ${c.documentos} ${c.documentos === 1 ? "rejection" : "rejections"} with their document in both languages. ${c.criterios.en}`,
      ),
    lee: tb(
      "la decisión, la extracción, las coincidencias, la investigación y el puntaje",
      "the decision, the extraction, the matches, the investigation and the score",
    ),
    modelo: {
      rotulo: tb("Por qué no usa modelo", "Why it uses no model"),
      filas: [
        [
          tb("Código primero", "Code first"),
          tb(
            "cada conclusión sale de un dato ya medido; un modelo podría escribir una frase sin su cita",
            "each conclusion comes from an already measured fact; a model could write a sentence without its citation",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
  guardia_salida: {
    rol: tb(
      "Filtra la respuesta y el expediente con reglas fijas antes de que salgan.",
      "It filters the answer and the file with fixed rules before they go out.",
    ),
    recibe: {
      titulo: tb(
        "La respuesta, el expediente y las acciones que el agente intentó",
        "The answer, the file and the actions the agent attempted",
      ),
      sub: tb(
        "más lo que los documentos traían escondido",
        "plus whatever the documents hid",
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
      "Lista blanca de acciones (registrar el expediente y responder), ningún documento, teléfono ni correo en la respuesta (RG-02) y separación entre control y datos: un documento jamás cambia qué acción se ejecuta.",
      "An action allowlist (record the file and reply), no document number, phone or email in the answer (RG-02) and a control/data split: a document never changes which action runs.",
    ),
    siFalla: tb(
      "Una instrucción inyectada tendría efecto (riesgo R4) o saldría un dato del solicitante en la respuesta.",
      "An injected instruction would take effect (risk R4) or an applicant's data would go out in the answer.",
    ),
    seMide: tb(
      "En los casos con inyección, la inyección queda neutralizada y la decisión final coincide con la verdad conocida (C6).",
      "In the cases with an injection, it is neutralized and the final decision matches the known truth (C6).",
    ),
    enLaCorrida: (c) =>
      tb(
        `Revisó las ${c.casos} salidas: ${c.hallazgos} hallazgos y severidad ${c.severidadMax === 0 ? "0 en todas" : `máxima ${c.severidadMax}`}.${c.neutralizadas.length ? ` Neutralizó la instrucción escondida de ${lista(c.neutralizadas, "y")}; las acciones siguieron siendo solo «${c.accion}».` : ""} ${c.criterios.es}`,
        `It checked all ${c.casos} outputs: ${c.hallazgos} findings and severity ${c.severidadMax === 0 ? "0 on every one" : `at most ${c.severidadMax}`}.${c.neutralizadas.length ? ` It neutralized the hidden instruction in ${lista(c.neutralizadas, "and")}; the actions stayed just “${c.accion}”.` : ""} ${c.criterios.en}`,
      ),
    lee: tb(
      "la respuesta, el expediente, las acciones intentadas y la entrada",
      "the answer, the file, the attempted actions and the input",
    ),
    modelo: {
      rotulo: tb("Qué revisa", "What it checks"),
      filas: [
        [
          tb("Acciones", "Actions"),
          tb("lista blanca: {acciones}", "allowlist: {acciones}"),
        ],
        [
          tb("Datos del solicitante", "Applicant data"),
          tb(
            "ni documentos, ni teléfonos, ni correos en la respuesta; en el expediente, solo su documento y los identificadores de las listas",
            "no document numbers, phones or emails in the answer; in the file, only their document and the list identifiers",
          ),
        ],
        [
          tb("Aviso de IA", "AI notice"),
          tb(
            "lo añade este nodo a toda salida",
            "this node adds it to every output",
          ),
        ],
      ],
    },
    fuentes: [F_NODOS],
  },
};

/**
 * Los criterios que cuenta la línea «En la corrida» de cada nodo del B: un subconjunto editorial de
 * `PLAN_POR_NODO_B[nodo].criterios`; `copia-contra-plan` lo comprueba contra el plan B.
 */
export const CRITERIOS_EN_LA_CORRIDA_B: Record<string, string[]> = {
  enrutador: [],
  extractor: ["C5"],
  verificador_listas: ["C1"],
  investigador: ["C4"],
  puntaje: [],
  decision: ["C1", "C2"],
  pausa_humana: [],
  redactor: ["C3"],
  guardia_salida: ["C6"],
};

/** Los criterios absolutos que respaldan las garantías «Nunca» del B (`FICHA_B.nunca`). */
export const CRITERIOS_NUNCA_B = ["C1", "C2", "C3"] as const;

/**
 * La lectura del plan B por nodo (matriz «Qué del plan toca a cada nodo» y «Lo que el plan le exige»). La hace el
 * autor; `copia-contra-plan` la comprueba contra el plan B: cada id existe y todo elemento del plan cae en algún nodo.
 */
export const PLAN_POR_NODO_B: Record<
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
    decisiones: [],
    riesgos: ["R4"],
    supuestos: [],
    criterios: ["C6"],
    umbrales: [],
  },
  extractor: {
    decisiones: [],
    riesgos: ["R4"],
    supuestos: ["S2"],
    criterios: ["C5"],
    umbrales: [],
  },
  verificador_listas: {
    decisiones: ["D1", "D2"],
    riesgos: ["R1"],
    supuestos: ["S1"],
    criterios: ["C1"],
    umbrales: ["U4"],
    senal: ["U1"],
  },
  investigador: {
    decisiones: ["D2"],
    riesgos: ["R1", "R2"],
    supuestos: ["S1", "S2"],
    criterios: ["C4"],
    umbrales: [],
  },
  puntaje: {
    decisiones: ["D4"],
    riesgos: [],
    supuestos: [],
    criterios: ["C2"],
    umbrales: [],
    senal: ["U2", "U3"],
  },
  decision: {
    decisiones: ["D1", "D4"],
    riesgos: ["R1", "R2"],
    supuestos: [],
    criterios: ["C1", "C2"],
    umbrales: ["U1", "U2", "U3"],
  },
  pausa_humana: {
    decisiones: ["D1"],
    riesgos: ["R1", "R2"],
    supuestos: [],
    criterios: ["C1", "C2"],
    umbrales: ["U1", "U2", "U3"],
  },
  redactor: {
    decisiones: ["D3"],
    riesgos: ["R3"],
    supuestos: [],
    criterios: ["C3"],
    umbrales: [],
  },
  guardia_salida: {
    decisiones: [],
    riesgos: ["R4"],
    supuestos: [],
    criterios: ["C6"],
    umbrales: [],
  },
};

/** La arista que se puede tocar en el lienzo del B: la regla que manda a una persona toda coincidencia de nombre. */
export const ARISTA_B = {
  titulo: ((p: { umbral: string; nodo: string; orden: number }) =>
    tb(
      `Arista ${p.umbral}: la regla ${p.orden} de ${p.nodo}`,
      `Edge ${p.umbral}: ${p.nodo}’s rule ${p.orden}`,
    )) as Plantilla<{ umbral: string; nodo: string; orden: number }>,
  rol: ((valor: string) =>
    tb(
      `Es la regla que lleva a una persona toda coincidencia de nombre: desde ${valor} de similitud con una entrada de las listas, el caso va al oficial. En el Playground la puedes mover.`,
      `It is the rule that brings every name match to a person: from ${valor} similarity with a list entry, the case goes to the officer. You can move it in the Playground.`,
    )) as Plantilla<string>,
  costoTexto: tb(
    "el plan no declara minutos por caso escalado",
    "the plan declares no minutes per escalated case",
  ),
  enLaCorridaTexto: ((p: { n: number; de: number; casos: string }) =>
    tb(
      `${p.n} de ${p.de} en o sobre U1${p.casos ? `: ${p.casos}` : ""}`,
      `${p.n} of ${p.de} at or above U1${p.casos ? `: ${p.casos}` : ""}`,
    )) as Plantilla<{ n: number; de: number; casos: string }>,
  distribucion: ((p: { n: number; nodo: string }) =>
    tb(
      `■ a una persona por esta regla · ○ esta regla no lo mandó. Los ${p.n} casos llegaron a ${p.nodo}.`,
      `■ to a person by this rule · ○ this rule did not send it. All ${p.n} cases reached ${p.nodo}.`,
    )) as Plantilla<{ n: number; nodo: string }>,
  etiqueta: tb(
    "Similitud de nombre de los casos que llegaron a la regla",
    "Name similarity of the cases that reached the rule",
  ),
};

/** Columnas y rótulos de la tabla de trazas de cada nodo del B (tres columnas, como en el A). */
export const TRAZAS_DE_NODO_B: Record<
  string,
  { columnas: TextoBilingue[]; detalle: TextoBilingue[] }
> = {
  enrutador: {
    columnas: [
      tb("Instrucción escondida", "Hidden instruction"),
      tb("Regla", "Rule"),
      tb("Camino", "Path"),
    ],
    detalle: [tb("Producto pedido", "Product requested")],
  },
  extractor: {
    columnas: [
      tb("Coincide con la verdad", "Matches the truth"),
      tb("Faltantes", "Missing"),
      tb("Tiempo · salida · costo", "Time · output · cost"),
    ],
    detalle: [
      tb("Visitas", "Visits"),
      tb("Reintentos de formato", "Format retries"),
    ],
  },
  verificador_listas: {
    columnas: [
      tb("Similitud máxima", "Highest similarity"),
      tb("Entrada", "Entry"),
      tb("Camino", "Path"),
    ],
    detalle: [tb("Lista", "List")],
  },
  investigador: {
    columnas: [
      tb("Conclusión", "Conclusion"),
      tb("Entrada", "Entry"),
      tb("Tiempo · salida · costo", "Time · output · cost"),
    ],
    detalle: [tb("Similitud", "Similarity")],
  },
  puntaje: {
    columnas: [
      tb("Puntaje", "Score"),
      tb("Inconsistencias", "Inconsistencies"),
      tb("Propuesta", "Proposal"),
    ],
    detalle: [tb("Reglas", "Rules")],
  },
  decision: {
    columnas: [
      tb("Regla que decidió", "Rule that decided"),
      tb("Propuesta", "Proposal"),
      tb("Camino", "Path"),
    ],
    detalle: [
      tb("Similitud · puntaje", "Similarity · score"),
      tb("Decisión final", "Final decision"),
    ],
  },
  pausa_humana: {
    columnas: [
      tb("Por qué se detuvo", "Why it stopped"),
      tb("Oficial", "Officer"),
      tb("Decisión final", "Final decision"),
    ],
    detalle: [tb("Señal", "Signal")],
  },
  redactor: {
    columnas: [
      tb("Decisión", "Decision"),
      tb("Documento", "Document"),
      tb("Conclusiones · sin cita", "Conclusions · uncited"),
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

/** La nota bajo la tabla de trazas de cada nodo del B; los casos que nombra salen de la corrida. */
export const NOTA_TRAZAS_B = {
  enrutador: tb(
    "Toca un caso para ver sus documentos. La marca la lee decision: un caso marcado va siempre al oficial.",
    "Tap a case to see its documents. Decision reads the flag: a flagged case always goes to the officer.",
  ),
  extractor: tb(
    "Toca un caso para ver sus documentos. Lo que extrajo, campo por campo, está en la página Casos.",
    "Tap a case to see its documents. What it extracted, field by field, is on the Cases page.",
  ),
  verificador_listas: ((u4: string) =>
    tb(
      `La marca vertical de cada barra es U4 = ${u4}, donde empieza la zona gris.`,
      `The vertical mark on each bar is U4 = ${u4}, where the gray zone starts.`,
    )) as Plantilla<string>,
  investigador: ((caso: string) =>
    tb(
      `Las razones completas de ${caso}, en los dos idiomas, están en la página Casos.`,
      `${caso}'s full reasons, in both languages, are on the Cases page.`,
    )) as Plantilla<string>,
  puntaje: tb(
    "Cada punto cita su regla, de RP-01 a RP-03; el detalle de cada caso está en la página Casos.",
    "Every point cites its rule, RP-01 to RP-03; each case's detail is on the Cases page.",
  ),
  decision: tb(
    "La tabla de cada regla, con su valor observado, está en la página Casos (paso «decision»).",
    "Each rule's table, with its observed value, is on the Cases page (the “decision” step).",
  ),
  pausa_humana: ((casos: TextoBilingue) =>
    tb(
      `Lo que vio el oficial en ${casos.es}, campo por campo, está en la página Casos.`,
      `What the officer saw on ${casos.en}, field by field, is on the Cases page.`,
    )) as Plantilla<TextoBilingue>,
  redactor: ((casos: TextoBilingue) =>
    tb(
      `El expediente y el documento de ${casos.es}, completos y en los dos idiomas, están en la página Casos.`,
      `${casos.en}'s file and document, complete and in both languages, are on the Cases page.`,
    )) as Plantilla<TextoBilingue>,
  guardia_salida: ((p: { inyeccion: string; sinEfecto: boolean }) =>
    p.sinEfecto
      ? tb(
          `${p.inyeccion} traía una instrucción escondida en sus documentos. No tuvo efecto.`,
          `${p.inyeccion} carried a hidden instruction in its documents. It had no effect.`,
        )
      : tb(
          `${p.inyeccion} traía una instrucción escondida en sus documentos. La guardia registró su efecto: está en la página Casos.`,
          `${p.inyeccion} carried a hidden instruction in its documents. The guard recorded its effect: it is on the Cases page.`,
        )) as Plantilla<{ inyeccion: string; sinEfecto: boolean }>,
};

/** Los productos que puede pedir una solicitud (el detalle de la tabla del enrutador). */
export const PRODUCTO_B: Record<string, TextoBilingue> = {
  cuenta_de_ahorros: tb("cuenta de ahorros", "savings account"),
  cuenta_corriente: tb("cuenta corriente", "checking account"),
  credito_de_consumo: tb("crédito de consumo", "consumer loan"),
};
