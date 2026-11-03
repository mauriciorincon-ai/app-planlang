/**
 * Textos de P7 Fichas (maqueta `docs/diseno/07-fichas.html`, aprobada en la mirada 4 de la Etapa de Diseño) y el
 * contenido de lo que viaja a hoja-de-vida: el `brochure-export.json` (contrato 1.0.0) y el complemento que planlang
 * propone para la ficha de la app (la arma hoja-de-vida). Las fichas de los agentes A y B ya no se producen ni se
 * entregan (decisión del 2026-10-25; devolución 026): aquí quedan solo los textos de la pantalla que las muestra. Las cifras no viven aquí: las ponen `src/lib/fichas/` desde el informe, la corrida y el repositorio.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb(
  "Las fichas · planlang",
  "The records · planlang",
);
export const DESCRIPCION_PAGINA: Record<IdDemo, TextoBilingue> = {
  "demo-a": tb(
    "La ficha de reproducibilidad del demo A, la ficha de la app, que viaja a la vitrina personal, y la del agente A, que ya no se entrega y se muestra aquí, comprobadas contra su contrato. Simulación · no operativo.",
    "Demo A's reproducibility record, the app's record, which travels to the personal showcase, and agent A's, which is no longer delivered and is shown here, checked against their contract. Simulation · not operational.",
  ),
  "demo-b": tb(
    "La ficha de reproducibilidad del demo B, la ficha de la app, que viaja a la vitrina personal, y la del agente B, que ya no se entrega y se muestra aquí, comprobadas contra su contrato. Simulación · no operativo.",
    "Demo B's reproducibility record, the app's record, which travels to the personal showcase, and agent B's, which is no longer delivered and is shown here, checked against their contract. Simulation · not operational.",
  ),
};

export const PORTADA = {
  antetitulo: {
    "demo-a": tb(
      "Demo A · las fichas y lo que viaja a la vitrina personal",
      "Demo A · the records and what travels to the personal showcase",
    ),
    "demo-b": tb(
      "Demo B · las fichas y lo que viaja a la vitrina personal",
      "Demo B · the records and what travels to the personal showcase",
    ),
  } as Record<IdDemo, TextoBilingue>,
  titulo: tb(
    "Las fichas: repetirla, y contarla en dos minutos",
    "The records: repeat it, and tell it in two minutes",
  ),
  guia: tb(
    "Una ficha para quien quiera repetir la corrida y comprobar el informe; una para quien visite la vitrina de hoja-de-vida y quiera saber en dos minutos qué es planlang; y la del agente, que ya no viaja y se queda aquí.",
    "One record for whoever wants to repeat the run and check the report; one for whoever visits the hoja-de-vida showcase and wants to know in two minutes what planlang is; and the agent's, which no longer travels and stays here.",
  ),
};

export const MIRADA = {
  titulo: tb("Las fichas en una mirada", "The records at a glance"),
  avisoLider: tb(
    "Ves las tres fichas; la del agente ya no viaja a la vitrina personal.",
    "You see the three records; the agent's no longer travels to the personal showcase.",
  ),
  avisoExperto: tb(
    "Se suman los pasos para repetir la corrida y, bajo cada ficha de la vitrina, de dónde sale cada cifra y la comprobación de cada campo contra el contrato v1.3.1.",
    "You also get the steps to repeat the run and, under each showcase record, where each figure comes from and the check of every field against the v1.3.1 contract.",
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
      "los hechos de la app, de los que hoja-de-vida arma su ficha",
      "the app's facts, from which hoja-de-vida builds its record",
    ),
    agente: {
      "demo-a": tb(
        "la ficha del agente A: ya no se entrega, se muestra solo aquí",
        "agent A's record: no longer delivered, shown only here",
      ),
      "demo-b": tb(
        "la ficha del agente B: ya no se entrega, se muestra solo aquí",
        "agent B's record: no longer delivered, shown only here",
      ),
    } as Record<IdDemo, TextoBilingue>,
    nunca: {
      titulo: tb("Ningún enlace", "No link"),
      detalle: tb(
        "lo que viaja va a hoja-de-vida por copia, en un PR de contenido",
        "what travels goes to hoja-de-vida by copy, in a content PR",
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
  cuadro: {
    "demo-a": tb(
      "Ficha de reproducibilidad · demo A",
      "Reproducibility record · demo A",
    ),
    "demo-b": tb(
      "Ficha de reproducibilidad · demo B",
      "Reproducibility record · demo B",
    ),
  } as Record<IdDemo, TextoBilingue>,
  chip: ((v: string) =>
    tb(`real · corrida ${v}`, `real · run ${v}`)) as Plantilla<string>,
  repetir: tb("Cómo repetirla, en orden", "How to repeat it, in order"),
  /** Qué hace cada paso; el comando lo arma la vista con los archivos que declara el manifiesto del demo. */
  pasos: {
    plan: tb(
      "valida el plan y comprueba su huella",
      "validates the plan and checks its fingerprint",
    ),
    casos: tb(
      "regenera los casos desde la semilla; la huella debe coincidir",
      "regenerates the cases from the seed; the fingerprint must match",
    ),
    lote: tb(
      "corre el lote en la máquina del autor, fuera de CI, con su suscripción",
      "runs the batch on the author's machine, outside CI, with their subscription",
    ),
    loteEnSesiones: ((p: { sesiones: number; n: number }) =>
      tb(
        `corre el lote en la máquina del autor, fuera de CI, con su suscripción: el mismo comando ${p.sesiones} veces, de a 20 y espaciadas, hasta completar los ${p.n} casos (retoma donde quedó)`,
        `runs the batch on the author's machine, outside CI, with their subscription: the same command ${p.sesiones} times, 20 at a time and spaced out, until all ${p.n} cases are done (it resumes where it stopped)`,
      )) as Plantilla<{ sesiones: number; n: number }>,
    trazas: tb(
      "comprueba huellas, umbrales aplicados y RF-09.2",
      "checks fingerprints, applied thresholds and RF-09.2",
    ),
    informe: tb(
      "rehace el informe y lo compara con el publicado: sale idéntico byte a byte",
      "redoes the report and compares it with the published one: it comes out identical byte for byte",
    ),
  },
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
  agente: {
    "demo-a": tb("La ficha del agente A", "Agent A's record"),
    "demo-b": tb("La ficha del agente B", "Agent B's record"),
  } as Record<IdDemo, TextoBilingue>,
  agenteNota: tb(
    "ya no se entrega: se muestra solo aquí",
    "no longer delivered: shown only here",
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
    "La ficha de la app la arma hoja-de-vida al compilar: los hechos salen de docs/brochure-export.json y la curación (titular, cifras destacadas, límites, nunca) de su complemento. Aquí se pinta con el complemento que planlang propone.",
    "hoja-de-vida builds the app's record when it compiles: the facts come from docs/brochure-export.json and the curation (headline, featured figures, limits, never) from its complement. Here it is painted with the complement planlang proposes.",
  ),
  sinProceso: tb(
    "«Cómo funciona» no aparece: la ficha de la app no trae proceso (es opcional en v1.3.1) y la sección se renumera. Los bloques siguen los seis grupos de la visión del producto.",
    "“How it works” does not appear: the app's record carries no process (optional in v1.3.1) and the section is renumbered. The blocks follow the six groups of the product vision.",
  ),
};

/**
 * Rótulos de la piel de CV Viva: los pone hoja-de-vida al pintar una ficha (su componente de ficha técnica); aquí se
 * reproducen, con sus mismas palabras, para que la vista previa diga lo que dirá allá.
 */
export const CV = {
  migas: tb("La vitrina · Ficha técnica", "The showcase · Technical sheet"),
  estado: {
    inicial: tb("Sin sellar", "Unsealed"),
    sellado: tb("Sellada", "Sealed"),
  } as Record<string, TextoBilingue>,
  sprints: ((n: number) =>
    tb(
      n === 1 ? "1 sprint" : `${n} sprints`,
      n === 1 ? "1 sprint" : `${n} sprints`,
    )) as Plantilla<number>,
  datosDel: ((f: string) =>
    tb(`Datos del ${f}`, `Data as of ${f}`)) as Plantilla<string>,
  titular: tb("Qué no hace nadie más", "What nobody else does"),
  cifras: tb("Las cifras", "The numbers"),
  paraQuienT: tb(
    "Para quién, y qué resuelve",
    "Who it's for, and what it solves",
  ),
  paraQuienSub: tb(
    "La persona antes que la tecnología.",
    "The person before the technology.",
  ),
  paraQuien: tb("Para quién", "Who it's for"),
  promesa: tb("La promesa", "The promise"),
  comoT: tb("Cómo funciona", "How it works"),
  comoSub: tb(
    "El proceso en BPMN: un carril por actor, la decisión donde se decide, y el bucle a la vista.",
    "The process in BPMN: one lane per actor, the decision where it is made, and the loop in plain sight.",
  ),
  comoNota: tb(
    "Aquí CV Viva dibuja el diagrama con su motor BPMN, a partir de estos pasos y flujos. Esta vista previa no lo dibuja: muestra lo que la ficha le entrega, carril por carril y en su orden de lectura.",
    "Here CV Viva draws the diagram with its BPMN engine, from these steps and flows. This preview does not draw it: it shows what the record hands over, lane by lane and in reading order.",
  ),
  fin: tb("fin", "end"),
  /** La palabra del tipo de paso para el lector de pantalla (la forma lo dice a la vista). */
  tipoPaso: {
    inicio: tb("inicio", "start"),
    decision: tb("decisión", "decision"),
  } as Record<string, TextoBilingue>,
  paso: tb("paso", "step"),
  stack: tb("Stack", "Stack"),
  procedencia: {
    app: tb(
      "Proceso declarado por la propia app en su export.",
      "Process declared by the app itself in its export.",
    ),
    "cv-viva": tb(
      "Proceso declarado por CV Viva a partir del export de la app.",
      "Process declared by Living CV from the app's export.",
    ),
    planeadora: tb(
      "Proceso curado por la planeadora.",
      "Process curated by the planning house.",
    ),
  } as Record<string, TextoBilingue>,
  tieneT: tb("Qué tiene", "What it has"),
  tieneSub: ((p: { grupos: number; n: number }) =>
    tb(
      `${p.grupos === 1 ? "1 grupo" : `${p.grupos} grupos`}${p.n > 0 ? ` · ${p.n} funcionalidades` : ""}.`,
      `${p.grupos === 1 ? "1 group" : `${p.grupos} groups`}${p.n > 0 ? ` · ${p.n} features` : ""}.`,
    )) as Plantilla<{ grupos: number; n: number }>,
  funcionalidades: ((n: number) =>
    tb(
      n === 1 ? "1 funcionalidad" : `${n} funcionalidades`,
      n === 1 ? "1 feature" : `${n} features`,
    )) as Plantilla<number>,
  limitesT: tb(
    "Límites, y lo que nunca hace",
    "Limits, and what it never does",
  ),
  limitesSub: tb(
    "Lo que decidió no ser vale tanto como lo que es.",
    "What it chose not to be counts as much as what it is.",
  ),
  limites: tb("Límites, a propósito", "Limits, on purpose"),
  nunca: tb("Nunca", "Never"),
  dondeT: tb("Dónde está", "Where it stands"),
  dondeSub: tb(
    "La versión anclada, no el tiempo real.",
    "The pinned version, not real time.",
  ),
  cierre: tb("Aquí se muestra; no se entrega.", "Shown here; not handed over."),
  cierreApp: tb(
    "En hoja-de-vida, aquí va la lista de espera de la app, que no promete fecha. Aquí se muestra; no se entrega.",
    "In hoja-de-vida, the app's waiting list goes here, and it promises no date. Shown here; not handed over.",
  ),
  fuente: {
    medido: tb("medido", "measured"),
    calculada: tb("calculada", "computed"),
    declarado: tb("declarado", "declared"),
    estimacion: tb("estimación", "estimate"),
  } as Record<string, TextoBilingue>,
  /**
   * Las claves de hito de la ficha de una app, como las traduce hoja-de-vida; `construccion` dice lo que es hoy (allá
   * se lee «construcción cerrada», que solo será cierto al cerrar la construcción del ciclo). Una ficha que trae otro
   * texto (la del agente) se pinta tal cual.
   */
  hito: {
    ciclo: tb("ciclo", "cycle"),
    sprints: tb("sprints cerrados", "closed sprints"),
    sellada: tb("sellada (gate de pruebas)", "sealed (testing gate)"),
    construccion: tb("construcción cerrada", "build closed"),
    version: tb("versión del repo", "repo version"),
    decisiones: tb("decisiones registradas", "recorded decisions"),
  } as Record<string, TextoBilingue>,
};

export const TABLA = {
  entrega: tb("Lo que se entrega:", "What is delivered:"),
  /** La ficha del agente: se comprueba contra el contrato, pero ya no se entrega (decisión del 2026-10-25). */
  comprobado: ((p: { version: string }) =>
    tb(
      `Comprobado contra el contrato ficha técnica v${p.version} de hoja-de-vida. Ya no se entrega: se muestra aquí como parte de la simulación.`,
      `Checked against hoja-de-vida's technical-record contract v${p.version}. It is no longer delivered: it is shown here as part of the simulation.`,
    )) as Plantilla<{ version: string }>,
  /** Lo que «Lo que se entrega» dice de la ficha del agente. */
  agenteSinEntrega: tb(
    "nada: la ficha del agente ya no se entrega",
    "nothing: the agent's record is no longer delivered",
  ),
  comprobadoApp: ((p: { ficha: string; exportacion: string }) =>
    tb(
      `planlang entrega el export (contrato brochure-export ${p.exportacion}); con él y con el complemento, hoja-de-vida arma esta ficha, que aquí se comprueba contra el contrato ficha técnica v${p.ficha}. Un archivo por idioma; se entrega el español.`,
      `planlang delivers the export (brochure-export contract ${p.exportacion}); with it and the complement, hoja-de-vida builds this record, checked here against technical-record contract v${p.ficha}. One file per language; the Spanish one is delivered.`,
    )) as Plantilla<{ ficha: string; exportacion: string }>,
  cifras: tb("De dónde sale cada cifra", "Where each figure comes from"),
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
    "Aprueba del todo o en parte, niega o escala; nunca niega del todo solo.",
    "Approves in full or in part, denies or escalates; never fully denies alone.",
  ),
  para_quien: tb(
    "Para una aseguradora —sintética— que recibe solicitudes de autorización con el texto libre del médico y hoy las revisa a mano, una por una, sin saber cuáles podían decidirse solas y cuáles necesitaban a un auditor.",
    "For an insurer —a synthetic one— that receives prior-authorization requests with the physician's free text and today reviews them by hand, one by one, without knowing which could be decided alone and which needed an auditor.",
  ),
  intro: tb(
    "El agente lee la solicitud, pide lo que falta, aplica las reglas del plan de beneficios y aprueba lo que el plan permite, hasta el tope de cada servicio; toda negación completa y todo caso dudoso los pasa a un auditor con la evidencia y la contraevidencia, y responde al afiliado con un aviso de IA.",
    "The agent reads the request, asks for what is missing, applies the benefit plan's rules and approves what the plan allows, up to each service's cap; every full denial and every doubtful case goes to an auditor with the evidence and the counter-evidence, and it answers the member with an AI notice.",
  ),
  titular: tb(
    "Un agente de autorizaciones médicas construido según un plan verificable: cada camino que toma está escrito en el plan, y una persona revisa toda negación completa con el caso completo delante.",
    "A medical prior-authorization agent built to a verifiable plan: every path it takes is written in the plan, and a person reviews every full denial with the full case in front of them.",
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
      /**
       * Las corridas que pide pass^k y las que se midieron, del informe: con la corrida de 200 (una de tres), «3 de 3
       * corridas» habría prometido lo que no se midió (S3).
       */
      etiqueta: ((p: {
        k: number;
        requerido: number | null;
        soloEnLotesDe?: number | null;
      }) =>
        p.soloEnLotesDe
          ? tb(
              `exactitud de extracción, en ${p.k === 1 ? "una corrida" : `${p.k} corridas`}`,
              `extraction accuracy, in ${p.k === 1 ? "one run" : `${p.k} runs`}`,
            )
          : p.requerido === null
            ? tb("exactitud de extracción", "extraction accuracy")
            : p.k >= p.requerido
              ? tb(
                  `exactitud de extracción, ${p.k} de ${p.requerido} corridas`,
                  `extraction accuracy, ${p.k} of ${p.requerido} runs`,
                )
              : tb(
                  `exactitud de extracción, ${p.k} de ${p.requerido} corridas (incompleto)`,
                  `extraction accuracy, ${p.k} of ${p.requerido} runs (incomplete)`,
                )) as Plantilla<{
        k: number;
        requerido: number | null;
        soloEnLotesDe?: number | null;
      }>,
      detalle: ((p: {
        n: number;
        k: number;
        requerido: number | null;
        soloEnLotesDe?: number | null;
      }) =>
        p.soloEnLotesDe
          ? tb(
              `Criterio C5 del plan: los campos extraídos son los de la verdad conocida en esta proporción de los ${p.n} casos que la tienen, en ${p.k === 1 ? "una corrida" : `${p.k} corridas`}. El plan pide ${p.requerido} corridas seguidas solo en los lotes de ${p.soloEnLotesDe} casos; este es más grande.`,
              `The plan's criterion C5: the extracted fields are the known truth's in this share of the ${p.n} cases that have one, in ${p.k === 1 ? "one run" : `${p.k} runs`}. The plan asks for ${p.requerido} runs in a row only in batches of ${p.soloEnLotesDe} cases; this one is larger.`,
            )
          : p.requerido === null
            ? tb(
                `Criterio C5 del plan: los campos extraídos son los de la verdad conocida en esta proporción de los ${p.n} casos que la tienen.`,
                `The plan's criterion C5: the extracted fields are the known truth's in this share of the ${p.n} cases that have one.`,
              )
            : p.k >= p.requerido
              ? tb(
                  `Criterio C5 del plan, medido por el verificador como pass^${p.k}: los campos extraídos son los de la verdad conocida en los ${p.n} casos que la tienen, en las ${p.k} corridas seguidas.`,
                  `The plan's criterion C5, measured by the verifier as pass^${p.k}: the extracted fields are the known truth's in the ${p.n} cases that have one, in ${p.k} runs in a row.`,
                )
              : tb(
                  `Criterio C5 del plan (pass^${p.requerido}): los campos extraídos son los de la verdad conocida en esta proporción de los ${p.n} casos que la tienen. Se midió con ${p.k} de las ${p.requerido} corridas seguidas que pide, así que todavía no puede declararse cumplido.`,
                  `The plan's criterion C5 (pass^${p.requerido}): the extracted fields are the known truth's in this share of the ${p.n} cases that have one. It was measured with ${p.k} of the ${p.requerido} runs in a row it asks for, so it cannot be declared met yet.`,
                )) as Plantilla<{
        n: number;
        k: number;
        requerido: number | null;
        soloEnLotesDe?: number | null;
      }>,
    },
    latencia: {
      etiqueta: tb(
        "mediana por caso, de punta a punta",
        "median per case, end to end",
      ),
      /** En palabras: hoja-de-vida calla la unidad que la etiqueta ya contiene, y «s» está en casi cualquier etiqueta. */
      unidad: tb("segundos", "seconds"),
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
      etiqueta: tb(
        "negaciones completas sin una persona",
        "full denials without a person",
      ),
      detalle: ((n: number) =>
        tb(
          `Criterio C1 del plan sobre ${n} casos: toda negación completa pasó por la pausa humana.`,
          `The plan's criterion C1 over ${n} cases: every full denial went through the human pause.`,
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
        "Un auditor ve el caso completo antes de negarlo del todo.",
        "An auditor sees the full case before denying it outright.",
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
      "Niega del todo sin que una persona lo revise.",
      "Fully denies without a person reviewing it.",
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
    // La fecha es la de la corrida que publica la vitrina (en el A, la de 200 del S3; la primera real fue la del S1).
    corrida: tb("corrida publicada", "published run"),
    piezas: tb("piezas del contrato", "contract pieces"),
    piezasValor: ((p: { a: number; b: number }) =>
      tb(`${p.a} de ${p.b}`, `${p.a} of ${p.b}`)) as Plantilla<{
      a: number;
      b: number;
    }>,
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
          "Ninguna negación completa sale sin el auditor; en esta demo, el auditor se simuló en lote.",
          "No full denial goes out without the auditor; in this demo, the auditor was simulated in batch.",
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
/**
 * Las métricas de la ficha de la app (`docs/brochure-export.json`): etiqueta, unidad y detalle, redactados enteros en
 * cada idioma; las cifras las pone `src/lib/fichas/armar.ts` (AU-S2-B18).
 */
export const METRICAS_APP = {
  criteriosCumplidos: {
    etiqueta: ((p: { n: number; demos: number }) =>
      tb(
        `criterios cumplidos en los planes de ${p.demos} demos, de ${p.n}`,
        `criteria met across the plans of ${p.demos} demos, of ${p.n}`,
      )) as Plantilla<{ n: number; demos: number }>,
    unidad: tb("criterios", "criteria"),
    /** Una frase por demo: el detalle las pone una tras otra (`src/lib/fichas/armar.ts`). */
    deUnDemo: ((p: {
      demo: string;
      verificador: string;
      corrida: string;
      cumplen: number;
      n: number;
    }) =>
      tb(
        `${p.demo}: ${p.cumplen} de ${p.n}, en el informe del verificador ${p.verificador} sobre la corrida ${p.corrida}.`,
        `${p.demo}: ${p.cumplen} of ${p.n}, in verifier ${p.verificador}'s report on run ${p.corrida}.`,
      )) as Plantilla<{
      demo: string;
      verificador: string;
      corrida: string;
      cumplen: number;
      n: number;
    }>,
  },
  decisionesCruzadas: {
    etiqueta: ((diferencias: number) =>
      tb(
        `decisiones rehechas en otro lenguaje, con ${diferencias} diferencias`,
        `decisions redone in another language, with ${diferencias} differences`,
      )) as Plantilla<number>,
    unidad: tb("decisiones", "decisions"),
    detalle: ((p: { corridas: number; demos: number }) =>
      tb(
        `Prueba cruzada RF-09.2 sobre ${p.corridas} corridas de ${p.demos} demos: el intérprete de aristas de TypeScript rehace cada decisión que registró Python.`,
        `RF-09.2 cross-check over ${p.corridas} runs of ${p.demos} demos: the TypeScript edge interpreter redoes every decision Python recorded.`,
      )) as Plantilla<{ corridas: number; demos: number }>,
  },
  casosSinteticos: {
    etiqueta: ((demos: number) =>
      tb(
        `casos sintéticos con respuesta conocida, en ${demos} demos`,
        `synthetic cases with a known answer, across ${demos} demos`,
      )) as Plantilla<number>,
    unidad: tb("casos", "cases"),
    /**
     * Una frase por demo: su corrida, sus repeticiones (pass^k) si las hay y su línea base si la hay. El detalle las
     * pone una tras otra.
     */
    deUnDemo: ((p: {
      demo: string;
      n: number;
      corrida: string;
      repeticiones: number;
      base: boolean;
    }) =>
      tb(
        `${p.demo}: ${p.n} casos en la corrida ${p.corrida}${p.repeticiones ? `, ${p.repeticiones === 1 ? "1 repetición" : `${p.repeticiones} repeticiones`} (pass^k)` : ""}${p.base ? " y la línea base de agente único" : ""}.`,
        `${p.demo}: ${p.n} cases in run ${p.corrida}${p.repeticiones ? `, ${p.repeticiones === 1 ? "1 repetition" : `${p.repeticiones} repetitions`} (pass^k)` : ""}${p.base ? " and the single-agent baseline" : ""}.`,
      )) as Plantilla<{
      demo: string;
      n: number;
      corrida: string;
      repeticiones: number;
      base: boolean;
    }>,
  },
  llamadasEnLaVitrina: {
    etiqueta: tb(
      "llamadas a modelos al visitar la vitrina",
      "model calls when visiting the showcase",
    ),
    unidad: tb("llamadas", "calls"),
    detalle: tb(
      "Lo fija la arquitectura: la vitrina es un export estático con los datos precalculados; el paquete se prueba sin una sola solicitud fuera de su origen.",
      "Set by the architecture: the showcase is a static export with precomputed data; the package is tested without a single request outside its origin.",
    ),
  },
  costoDeUnaCorrida: {
    etiqueta: ((n: number) =>
      tb(
        `costo nominal de correr una vez cada demo (${n} casos)`,
        `nominal cost of running each demo once (${n} cases)`,
      )) as Plantilla<number>,
    deUnDemo: ((p: { demo: string; costo: string; n: number }) =>
      tb(
        `${p.demo}: US$ ${p.costo} por ${p.n} casos.`,
        `${p.demo}: US$ ${p.costo} for ${p.n} cases.`,
      )) as Plantilla<{ demo: string; costo: string; n: number }>,
    /** Va después de la frase de cada demo. */
    detalle: tb(
      "Suma del costo nominal que el CLI declara por llamada, en las trazas de cada corrida; por la suscripción no se pagó aparte.",
      "Sum of the nominal cost the CLI declares per call, over each run's traces; through the subscription it was not paid separately.",
    ),
  },
  funcionalidades: {
    etiqueta: tb("funcionalidades construidas", "built features"),
    unidad: tb("funcionalidades", "features"),
    detalle: tb(
      "Las de la visión del producto que ya funcionan: las del corte de dos semanas y las del roadmap que se construyeron en el S3 (el entrevistador, el demo B y su expediente), contadas contra docs/MANUAL-DE-USO.md; lo que sigue en el roadmap no cuenta.",
      "The product vision's features that work today: the two-week cut's and the roadmap ones built in S3 (the interviewer, demo B and its case file), counted against docs/MANUAL-DE-USO.md; what remains on the roadmap does not count.",
    ),
  },
  decisionesRegistradas: {
    etiqueta: tb(
      "decisiones de arquitectura registradas",
      "recorded architecture decisions",
    ),
    detalle: tb("Archivos de decisions/.", "Files in decisions/."),
  },
};

export const APP = {
  slug: "planlang",
  /** La fecha en que se redactó este copy (devolución 026): entra en el «actualizado» del export. */
  redactado_el: "2026-10-27",
  nombre: "planlang",
  tagline: tb(
    "Tu agente de IA, medido contra el plan que escribiste antes de construirlo.",
    "Your AI agent, measured against the plan you wrote before building it.",
  ),
  intro: tb(
    "planlang convierte el plan de un proyecto de agentes de IA en un contrato verificable: qué decide el agente, qué puede fallar, qué se da por cierto y cómo se mide el éxito. Con ese contrato se construye el agente, se corre sobre cientos de casos de respuesta conocida y se publica la brecha entre lo planeado y lo ocurrido, fallas incluidas, en una vitrina estática que no llama a ningún modelo.",
    "planlang turns the plan of an AI-agent project into a verifiable contract: what the agent decides, what can go wrong, what is taken for granted and how success is measured. With that contract the agent is built, run on hundreds of cases whose answer is known, and the gap between what was planned and what happened is published, failures included, in a static showcase that calls no model.",
  ),
  para_quien: tb(
    "Para quien planea, construye o aprueba agentes de IA y hoy los juzga mirando trazas y corriendo evaluaciones sueltas, sin haber escrito antes qué debían hacer. A quien decide le da un veredicto en palabras llanas; a quien construye, la regla, la señal y el caso detrás de cada cifra.",
    "For whoever plans, builds or approves AI agents and today judges them by reading traces and running loose evaluations, without having written down first what they were meant to do. Whoever decides gets a verdict in plain words; whoever builds gets the rule, the signal and the case behind every figure.",
  ),
  diferencial: tb(
    "De 15 plataformas de evaluación revisadas en septiembre de 2026, ninguna obliga a planear antes de construir ni compara el plan con lo ocurrido. planlang hace las dos cosas: exige un plan medible, publica la brecha entre plan y resultado con los riesgos que se previeron y te deja mover los umbrales del plan sobre las decisiones reales del agente.",
    "Of 15 evaluation platforms reviewed in September 2026, none requires planning before building or compares the plan with what happened. planlang does both: it demands a measurable plan, publishes the gap between plan and result with the risks that were foreseen, and lets you move the plan's thresholds over the agent's real decisions.",
  ),
  /** El titular de valor que planlang propone en el complemento de su ficha. */
  titular: tb(
    "El plan de un agente de IA queda escrito como contrato antes de construirlo, y un verificador sin IA publica, caso por caso, la brecha entre lo planeado y lo ocurrido, con sus fallas a la vista y sus umbrales listos para mover.",
    "An AI agent's plan is written down as a contract before it is built, and a verifier with no AI publishes, case by case, the gap between what was planned and what happened, with its failures in plain sight and its thresholds ready to move.",
  ),
  limites: [
    tb(
      "Es una simulación: no opera casos reales ni decide sobre personas; las decisiones humanas de los demos se simularon con la respuesta conocida.",
      "It is a simulation: it handles no real cases and decides on no one; the demos' human decisions were simulated with the known answer.",
    ),
    tb(
      "El entrevistador y las corridas viven en la terminal; el sitio muestra sus resultados, ya calculados y verificados.",
      "The interviewer and the runs live in the terminal; the site shows their results, already computed and verified.",
    ),
    tb(
      "Mide lo que el plan declaró: lo que el plan no previó aparece como brecha no prevista, no como veredicto.",
      "It measures what the plan declared: what the plan did not foresee appears as an unforeseen gap, not as a verdict.",
    ),
    tb(
      "El playground recalcula sobre lo que el agente ya hizo; fuera del rango observado, el resultado se marca «no observado».",
      "The playground recomputes over what the agent already did; outside the observed range, the result is marked “not observed”.",
    ),
  ],
  nunca: [
    tb(
      "Usa datos reales: todo caso, afiliado, médico, solicitante y lista de control es sintético.",
      "Uses real data: every case, member, physician, applicant and watchlist is synthetic.",
    ),
    tb(
      "Deja que un modelo decida si el agente acertó.",
      "Lets a model decide whether the agent got it right.",
    ),
    tb(
      "Emite una negación completa o un rechazo sin que lo revise una persona.",
      "Issues a full denial or a rejection without a person reviewing it.",
    ),
    tb(
      "Llama a un modelo para validar el plan, medir la brecha, recalcular umbrales o dibujar el agente.",
      "Calls a model to validate the plan, measure the gap, recompute thresholds or draw the agent.",
    ),
    tb("Esconde un resultado desfavorable.", "Hides an unfavorable result."),
  ],
  enlaces: {
    razon: tb(
      "planlang no tiene dirección pública propia: su vitrina viaja al Portafolio como paquete estático, con el rótulo «Simulación · no operativo», y se recorre allí mismo.",
      "planlang has no public address of its own: its showcase travels to the Portfolio as a static package, labeled “Simulation · not operational”, and is walked through there.",
    ),
    razon_repositorio: tb(
      "El repositorio no se enlaza: el Portafolio no publica enlaces de acceso, por regla de la casa.",
      "The repository is not linked: the Portfolio publishes no access links, by house rule.",
    ),
    brochure_archivo: tb(
      "sin archivo propio: la vitrina y sus fichas hacen de brochure (decisión del sprint 3)",
      "no file of its own: the showcase and its records serve as the brochure (sprint 3 decision)",
    ),
    brochure_ruta_local: tb(
      "sin ruta /conoce: la vitrina es la presentación de la app (decisión del sprint 3)",
      "no /conoce route: the showcase is the app's presentation (sprint 3 decision)",
    ),
  },
  privacidad: {
    detalle: tb(
      "Todo es sintético y sale de un generador con semilla: casos, afiliados, médicos, planes de beneficios, solicitantes y listas de control. En cada cambio, un validador automático rechaza cualquier identificador con forma real. La vitrina es estática: quien la visita no lanza ninguna llamada a modelos ni a servicios externos.",
      "Everything is synthetic and comes from a seeded generator: cases, members, physicians, benefit plans, applicants and watchlists. On every change, an automated validator rejects any identifier with a real-looking form. The showcase is static: whoever visits it triggers no call to a model or to any external service.",
    ),
    datos_sinteticos: true,
    llamadas_a_modelos_en_la_vitrina: false,
    red_saliente_en_la_vitrina: false,
  },
  /** El proceso BPMN de la ficha de la app: el de la planeadora (devolución 026), en español tal cual y con su inglés redactado. */
  proceso: {
    titulo: tb(
      "Del plan a la brecha, con tu agente de IA",
      "From plan to gap, with your AI agent",
    ),
    carriles: {
      tu: tb("Tú · quien planea", "You · whoever plans"),
      planlang: tb("planlang", "planlang"),
      agente: tb("El agente · en lotes", "The agent · in batches"),
      persona: tb("Una persona revisa", "A person reviews"),
    } as Record<string, TextoBilingue>,
    pasos: [
      {
        id: "ini",
        tipo: "inicio",
        carril: "tu",
        texto: tb(
          "Tienes un proyecto de agentes de IA",
          "You have an AI-agent project",
        ),
      },
      {
        id: "entrevista",
        tipo: "tarea",
        carril: "tu",
        texto: tb(
          "Respondes la entrevista del plan",
          "You answer the plan interview",
        ),
      },
      {
        id: "borrador",
        tipo: "tarea",
        carril: "planlang",
        texto: tb(
          "Redacta el borrador y marca contradicciones",
          "Drafts the plan and flags contradictions",
        ),
      },
      {
        id: "valida",
        tipo: "tarea",
        carril: "planlang",
        texto: tb("Valida el plan, sin IA", "Validates the plan, with no AI"),
      },
      {
        id: "medible",
        tipo: "decision",
        carril: "planlang",
        texto: tb("¿El plan se puede medir?", "Can the plan be measured?"),
      },
      {
        id: "completa",
        tipo: "tarea",
        carril: "tu",
        texto: tb("Completas lo que falta", "You fill in what is missing"),
      },
      {
        id: "aprueba",
        tipo: "tarea",
        carril: "tu",
        texto: tb(
          "Apruebas el plan y queda sellado",
          "You approve the plan and it is sealed",
        ),
      },
      {
        id: "casos",
        tipo: "tarea",
        carril: "planlang",
        texto: tb(
          "Genera casos con respuesta conocida",
          "Generates cases with a known answer",
        ),
      },
      {
        id: "decide",
        tipo: "tarea",
        carril: "agente",
        texto: tb(
          "Decide cada caso según el plan",
          "Decides each case according to the plan",
        ),
      },
      {
        id: "pausa",
        tipo: "decision",
        carril: "agente",
        texto: tb(
          "¿El plan exige una persona?",
          "Does the plan require a person?",
        ),
      },
      {
        id: "revisa",
        tipo: "tarea",
        carril: "persona",
        texto: tb("Revisa el caso y decide", "Reviews the case and decides"),
      },
      {
        id: "traza",
        tipo: "tarea",
        carril: "agente",
        texto: tb(
          "Deja la traza de cada decisión",
          "Leaves the trace of each decision",
        ),
      },
      {
        id: "verifica",
        tipo: "tarea",
        carril: "planlang",
        texto: tb(
          "Compara el plan con las trazas, sin IA",
          "Compares the plan with the traces, with no AI",
        ),
      },
      {
        id: "publica",
        tipo: "tarea",
        carril: "planlang",
        texto: tb(
          "Publica la brecha, fallas incluidas",
          "Publishes the gap, failures included",
        ),
      },
      {
        id: "umbrales",
        tipo: "tarea",
        carril: "tu",
        texto: tb(
          "Mueves umbrales y ves qué cambia",
          "You move thresholds and see what changes",
        ),
      },
      {
        id: "ajustar",
        tipo: "decision",
        carril: "tu",
        texto: tb("¿Cambias el plan?", "Do you change the plan?"),
      },
      {
        id: "fin",
        tipo: "fin",
        carril: "tu",
        texto: tb(
          "Agente medido contra su plan",
          "Agent measured against its plan",
        ),
      },
    ] as {
      id: string;
      tipo: "inicio" | "tarea" | "decision" | "fin";
      carril: string;
      texto: TextoBilingue;
    }[],
    flujos: [
      { de: "ini", a: "entrevista" },
      { de: "entrevista", a: "borrador" },
      { de: "borrador", a: "valida" },
      { de: "valida", a: "medible" },
      { de: "medible", a: "completa", etiqueta: tb("no", "no") },
      { de: "completa", a: "valida" },
      { de: "medible", a: "aprueba", etiqueta: tb("sí", "yes") },
      { de: "aprueba", a: "casos" },
      { de: "casos", a: "decide" },
      { de: "decide", a: "pausa" },
      { de: "pausa", a: "revisa", etiqueta: tb("sí", "yes") },
      { de: "pausa", a: "traza", etiqueta: tb("no", "no") },
      { de: "revisa", a: "traza" },
      { de: "traza", a: "verifica" },
      { de: "verifica", a: "publica" },
      { de: "publica", a: "umbrales" },
      { de: "umbrales", a: "ajustar" },
      {
        de: "ajustar",
        a: "entrevista",
        etiqueta: tb("sí, versión nueva", "yes, a new version"),
      },
      { de: "ajustar", a: "fin", etiqueta: tb("no", "no") },
    ] as { de: string; a: string; etiqueta?: TextoBilingue }[],
    anotaciones: [
      {
        paso: "borrador",
        texto: tb(
          "Pregunta en orden lo que exige la plantilla del sector, con un ejemplo en cada pregunta; jamás aprueba por ti.",
          "Asks in order what the sector template requires, with an example in each question; it never approves for you.",
        ),
      },
      {
        paso: "valida",
        texto: tb(
          "Rechaza, con el motivo exacto, criterios sin regla, umbrales sin señal y riesgos graves sin mitigación.",
          "Rejects, with the exact reason, criteria without a rule, thresholds without a signal and serious risks without mitigation.",
        ),
      },
      {
        paso: "decide",
        texto: tb(
          "Con la suscripción de Claude Code, de a 20 casos y con pausas; si la corrida se corta, retoma sin repetir.",
          "With the Claude Code subscription, 20 cases at a time and with pauses; if the run is cut off, it resumes without repeating any.",
        ),
      },
      {
        paso: "revisa",
        texto: tb(
          "En los demos, esa persona se simula con la respuesta conocida del caso, y cada pantalla lo dice.",
          "In the demos, that person is simulated with the case's known answer, and every screen says so.",
        ),
      },
      {
        paso: "verifica",
        texto: tb(
          "Sin ningún modelo: el mismo plan y las mismas trazas dan siempre el mismo informe, en español e inglés.",
          "With no model at all: the same plan and the same traces always give the same report, in Spanish and English.",
        ),
      },
      {
        paso: "umbrales",
        texto: tb(
          "Se recalcula en el navegador sobre las decisiones reales; nadie vuelve a llamar al modelo.",
          "Recomputed in the browser over the real decisions; nobody calls the model again.",
        ),
      },
    ],
  },
  /** Los seis grupos de la visión del producto con lo construido de cada uno (lo que sigue en el roadmap no cuenta). */
  grupos: [
    {
      id: "planear",
      nombre: tb("Planea antes de construir", "Plan before you build"),
      linea: tb(
        "Escribes qué decide el agente, qué puede fallar y cómo se mide; un plan incompleto no pasa.",
        "You write what the agent decides, what can fail and how it is measured; an incomplete plan does not pass.",
      ),
      estrella: false,
      features: [
        {
          id: "plantillas",
          nombre: tb(
            "Arranca con lo que tu sector exige",
            "Start with what your sector requires",
          ),
          que_hace: tb(
            "Empiezas el plan con los actores, riesgos y criterios típicos de salud, finanzas o seguridad de IA, con las restricciones legales en lenguaje llano y su fuente. Sumar un sector nuevo es sumar un archivo de datos, sin tocar código.",
            "You start the plan with the actors, risks and criteria typical of health, finance or AI security, with the legal constraints in plain language and their source. Adding a new sector means adding a data file, without touching code.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
        {
          id: "validador",
          nombre: tb(
            "Ningún plan a medias pasa",
            "No half-finished plan gets through",
          ),
          que_hace: tb(
            "Sabes antes de construir si tu plan se puede medir. Un validador sin IA rechaza, con el motivo exacto, criterios sin regla, umbrales sin señal y riesgos graves sin mitigación. El plan aprobado queda sellado con una huella que delata cualquier cambio posterior.",
            "You know before building whether your plan can be measured. A validator with no AI rejects, with the exact reason, criteria without a rule, thresholds without a signal and serious risks without mitigation. The approved plan is sealed with a fingerprint that exposes any later change.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
        {
          id: "entrevistador",
          nombre: tb(
            "Un entrevistador que redacta tu plan",
            "An interviewer that drafts your plan",
          ),
          que_hace: tb(
            "Respondes preguntas en orden, cada una con un ejemplo, y obtienes el borrador de tu plan en español e inglés. Antes de entregarlo, señala lo que falta y las contradicciones. Nunca aprueba por ti: esa firma es tuya.",
            "You answer questions in order, each with an example, and get the draft of your plan in Spanish and English. Before handing it over, it points out what is missing and the contradictions. It never approves for you: that signature is yours.",
          ),
          seccion_manual: tb("Entrevistar un plan", "Interview a plan"),
        },
        {
          id: "plan-sin-corrida",
          nombre: tb(
            "Planea un proyecto real, no solo los demos",
            "Plan a real project, not only the demos",
          ),
          que_hace: tb(
            "El entrevistador recorre la plantilla del sector de cualquier proyecto y, cuando lo apruebas, el plan se publica en la vitrina como un contrato que dice lo que aún no tiene: trazas, brecha y playground. El primero fue el de los dos agentes de HackGuard.",
            "The interviewer walks through the sector template for any project and, when you approve it, the plan is published in the showcase as a contract that states what it does not have yet: traces, gap and playground. The first one was HackGuard's two agents.",
          ),
          seccion_manual: tb("Planear un proyecto real", "Plan a real project"),
        },
        {
          id: "contrato",
          nombre: tb(
            "El plan es el código que decide",
            "The plan is the code that decides",
          ),
          que_hace: tb(
            "Lo que el agente decide es literalmente lo que dice el plan. El plan fija sus piezas, cada regla de paso como señal, operador y valor (por ejemplo, «confianza menor que 0,75»), dónde decide una persona y qué debe registrar cada caso.",
            "What the agent decides is literally what the plan says. The plan fixes its pieces, every step rule as signal, operator and value (for example, “confidence below 0.75”), where a person decides and what every case must record.",
          ),
          seccion_manual: tb("Validar un plan", "Validate a plan"),
        },
      ],
    },
    {
      id: "correr",
      nombre: tb(
        "Prueba con casos de respuesta conocida",
        "Test with cases whose answer is known",
      ),
      linea: tb(
        "Dos demos con agentes reales corren sobre cientos de casos inventados cuya respuesta correcta ya se sabe.",
        "Two demos with real agents run on hundreds of invented cases whose correct answer is already known.",
      ),
      estrella: false,
      features: [
        {
          id: "casos",
          nombre: tb(
            "Casos con la respuesta ya conocida",
            "Cases whose answer is already known",
          ),
          que_hace: tb(
            "Pruebas el agente sobre lotes inventados cuya respuesta correcta ya se sabe: casos normales, de borde, incompletos y trampas como instrucciones escondidas o nombres parecidos. Generarlos otra vez da los mismos casos, y un validador impide cualquier dato con forma de uno real.",
            "You test the agent on invented batches whose correct answer is already known: normal cases, edge cases, incomplete ones and traps such as hidden instructions or similar names. Generating them again gives the same cases, and a validator blocks any data shaped like real data.",
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
            "Demo A: medical authorizations",
          ),
          que_hace: tb(
            "Ves a un equipo de agentes decidir 200 solicitudes de autorización médica: aprueba, aprueba hasta el tope cubierto, niega con causal legal o pasa el caso a un auditor. Las urgencias se autorizan sin revisar cobertura, y ninguna negación completa sale sin una persona.",
            "You watch a team of agents decide 200 medical authorization requests: approve, approve up to the covered cap, deny with a legal ground or hand the case to an auditor. Emergencies are authorized without checking coverage, and no full denial goes out without a person.",
          ),
          seccion_manual: tb("Correr un lote", "Run a batch"),
        },
        {
          id: "demo-b",
          nombre: tb(
            "Demo B: vinculación con debida diligencia",
            "Demo B: onboarding with due diligence",
          ),
          que_hace: tb(
            "Ves a los agentes decidir si un cliente se vincula: leen sus documentos, lo buscan en listas de control, investigan los nombres parecidos y puntúan su riesgo por reglas, sin atributos protegidos. Todo rechazo y todo riesgo alto pasan por el oficial de cumplimiento.",
            "You watch the agents decide whether a client is onboarded: they read the documents, search watchlists, investigate similar names and score risk by rules, without protected attributes. Every rejection and every high risk goes through the compliance officer.",
          ),
          seccion_manual: tb("Correr el demo B", "Run demo B"),
        },
        {
          id: "expediente",
          nombre: tb(
            "Un expediente que cita sus fuentes",
            "A case file that cites its sources",
          ),
          que_hace: tb(
            "Cada solicitud del demo B termina en un expediente en español e inglés que escribe el código, no la IA. Cada conclusión cita la regla del plan o la coincidencia en una lista, con su versión y su fecha.",
            "Every demo B request ends in a case file in Spanish and English written by code, not by the AI. Each conclusion cites the plan's rule or the watchlist match, with its version and date.",
          ),
          seccion_manual: tb("Leer un expediente", "Read a case file"),
        },
        {
          id: "documento-adverso",
          nombre: tb(
            "Toda negación, explicada y apelable",
            "Every denial, explained and appealable",
          ),
          que_hace: tb(
            "Si el agente niega un servicio, aunque sea en parte, sale un documento en español e inglés que arma el código: la causal legal, la regla aplicada, los datos usados, quién decidió y cómo contradecir la decisión.",
            "If the agent denies a service, even in part, a document in Spanish and English is produced by code: the legal ground, the rule applied, the data used, who decided and how to contest the decision.",
          ),
          seccion_manual: tb("Correr un lote", "Run a batch"),
        },
        {
          id: "lotes",
          nombre: tb(
            "Corridas por lotes, sin perder un caso",
            "Batch runs, without losing a case",
          ),
          que_hace: tb(
            "Corres cientos de casos con la suscripción de Claude Code, de a 20 y con pausas. Si la corrida se corta, retoma donde quedó sin repetir ninguno, y cada caso deja su traza, cada decisión con su señal, en un formato propio y con huella.",
            "You run hundreds of cases with the Claude Code subscription, 20 at a time and with pauses. If the run is cut off, it resumes where it stopped without repeating any, and every case leaves its trace, every decision with its signal, in a format of its own and with a fingerprint.",
          ),
          seccion_manual: tb("Correr un lote", "Run a batch"),
        },
      ],
    },
    {
      id: "medir",
      nombre: tb(
        "Mide la brecha, sin IA de por medio",
        "Measure the gap, with no AI in between",
      ),
      linea: tb(
        "Un verificador sin IA compara lo planeado con lo ocurrido y publica también lo que falló.",
        "A verifier with no AI compares what was planned with what happened and also publishes what failed.",
      ),
      estrella: true,
      features: [
        {
          id: "verificador",
          nombre: tb(
            "El informe de brecha: plan contra realidad",
            "The gap report: plan against reality",
          ),
          que_hace: tb(
            "Sabes, criterio por criterio y riesgo por riesgo, qué se cumplió y en qué casos no. Un verificador que no usa IA lee el plan y lo que hizo el agente, y escribe el informe en español e inglés, idéntico cada vez que se repite.",
            "You know, criterion by criterion and risk by risk, what was met and in which cases it was not. A verifier that uses no AI reads the plan and what the agent did, and writes the report in Spanish and English, identical every time it is repeated.",
          ),
          seccion_manual: tb(
            "Leer el informe de brecha",
            "Read the gap report",
          ),
        },
        {
          id: "supuestos",
          nombre: tb(
            "Supuestos puestos a prueba",
            "Assumptions put to the test",
          ),
          que_hace: tb(
            "Lo que el plan dio por cierto sin probarlo se mide y queda confirmado, refutado o sin probar. En el demo A cayeron dos: dos aclaraciones no bastaron, y varios agentes resultaron más lentos que uno solo.",
            "What the plan took for granted without testing is measured and ends up confirmed, refuted or untested. In demo A two fell: two clarifications were not enough, and several agents turned out slower than a single one.",
          ),
          seccion_manual: tb(
            "Leer el informe de brecha",
            "Read the gap report",
          ),
        },
        {
          id: "comparar",
          nombre: tb(
            "Varios agentes frente a uno solo",
            "Several agents against a single one",
          ),
          que_hace: tb(
            "Pones el equipo de agentes frente a un agente único, con el mismo plan y los mismos 200 casos, y comparas exactitud, tiempo, costo y casos distintos. En el demo A, el equipo acertó más (98 % frente a 90 %) pero tardó más.",
            "You put the team of agents against a single agent, with the same plan and the same 200 cases, and compare accuracy, time, cost and differing cases. In demo A the team was more accurate (98% against 90%) but slower.",
          ),
          seccion_manual: tb("Comparar dos corridas", "Compare two runs"),
        },
        {
          id: "instrumento",
          nombre: tb(
            "Un medidor que también se mide",
            "A gauge that is also gauged",
          ),
          que_hace: tb(
            "planlang pone a prueba su propia vara. Sembró 10 fallas a propósito y el verificador las encontró todas, sin falsas alarmas. Además rehízo las 1.204 decisiones de los agentes en otro lenguaje de programación, con cero diferencias.",
            "planlang tests its own yardstick. It planted 10 failures on purpose and the verifier found every one, with no false alarms. It also redid the agents' 1,204 decisions in another programming language, with zero differences.",
          ),
          seccion_manual: tb(
            "Verificar las corridas y el instrumento",
            "Check the runs and the instrument",
          ),
        },
        {
          id: "adr",
          nombre: tb(
            "Las reglas de fondo, por escrito",
            "The underlying rules, in writing",
          ),
          que_hace: tb(
            "Todo lo que se puede resolver con código se resuelve sin IA, y cada pieza del agente que no usa modelo dice por qué. El uso de la suscripción de Claude Code quedó decidido por escrito, con sus términos releídos antes de cada entrega.",
            "Everything that can be solved with code is solved without AI, and every piece of the agent that uses no model says why. Using the Claude Code subscription was decided in writing, with its terms reread before each delivery.",
          ),
          seccion_manual: tb(
            "Verificar las corridas y el instrumento",
            "Check the runs and the instrument",
          ),
        },
      ],
    },
    {
      id: "jugar",
      nombre: tb(
        "Mueve un umbral, mira qué cambia",
        "Move a threshold, see what changes",
      ),
      linea: tb(
        "Pruebas otros valores del plan sobre las decisiones reales del agente, sin volver a llamar al modelo.",
        "You try other plan values over the agent's real decisions, without calling the model again.",
      ),
      estrella: false,
      features: [
        {
          id: "playground",
          nombre: tb(
            "Mueve los umbrales del plan",
            "Move the plan's thresholds",
          ),
          que_hace: tb(
            "Cambias un umbral, como la confianza mínima o el modo Texas, que manda a una persona toda negación, incluso parcial, y ves qué casos cambian de camino, qué errores aparecen y cuánto trabajo humano cuesta. Todo se recalcula en tu navegador, sin ningún modelo.",
            "You change a threshold, such as minimum confidence or Texas mode, which sends every denial to a person, even a partial one, and you see which cases change path, which errors appear and how much human work it costs. Everything is recomputed in your browser, with no model.",
          ),
          seccion_manual: tb(
            "Mover umbrales en el playground",
            "Move thresholds in the playground",
          ),
        },
      ],
    },
    {
      id: "entender",
      nombre: tb("El agente por dentro", "The agent from the inside"),
      linea: tb(
        "El diagrama sale del código que corrió y señala cualquier pieza que el plan exige y no está.",
        "The diagram comes from the code that ran and flags any piece the plan requires that is missing.",
      ),
      estrella: false,
      features: [
        {
          id: "visor",
          nombre: tb("El agente, tal como corrió", "The agent, as it ran"),
          que_hace: tb(
            "Ves el diagrama del agente generado desde el código que corrió, no dibujado a mano. Tocas una pieza y aparece qué hace, su código y los casos reales que pasaron por ahí; si falta algo que el plan exige, el diagrama lo señala.",
            "You see the agent's diagram generated from the code that ran, not drawn by hand. You tap a piece and it shows what it does, its code and the real cases that went through it; if something the plan requires is missing, the diagram flags it.",
          ),
          seccion_manual: tb("Abrir la vitrina", "Open the showcase"),
        },
      ],
    },
    {
      id: "mostrar",
      nombre: tb("Recórrelo en el navegador", "Walk through it in the browser"),
      linea: tb(
        "La vitrina de planlang: un sitio bilingüe y sin servidor que se lee como líder o como experto.",
        "planlang's showcase: a bilingual, serverless site read as a leader or as an expert.",
      ),
      estrella: false,
      features: [
        {
          id: "entrada",
          nombre: tb("La idea en una pantalla", "The idea on one screen"),
          que_hace: tb(
            "Entiendes de entrada por qué planear importa: según una encuesta de LangChain, el 89 % de los equipos observa sus agentes y el 52 % los evalúa, pero la encuesta ni pregunta si planearon qué evaluar. Debajo, el método en tres pasos y lo medido.",
            "You understand right away why planning matters: according to a LangChain survey, 89% of teams observe their agents and 52% evaluate them, but the survey does not even ask whether they planned what to evaluate. Below, the method in three steps and what was measured.",
          ),
          seccion_manual: tb("Abrir la vitrina", "Open the showcase"),
        },
        {
          id: "pestanas",
          nombre: tb("Cada demo, de punta a punta", "Each demo, end to end"),
          que_hace: tb(
            "Recorres cada demo en seis pantallas: plan, agente, brecha, playground, casos y fichas, en español o inglés, en tema claro u oscuro y desde el teléfono. Lees como líder, en palabras llanas, o como experto, con la regla detrás de cada cifra.",
            "You walk through each demo in six screens: plan, agent, gap, playground, cases and records, in Spanish or English, in light or dark theme and from your phone. You read as a leader, in plain words, or as an expert, with the rule behind every figure.",
          ),
          seccion_manual: tb("Abrir la vitrina", "Open the showcase"),
        },
        {
          id: "fichas",
          nombre: tb(
            "Repetible y listo para el Portafolio",
            "Repeatable and ready for the Portfolio",
          ),
          que_hace: tb(
            "Cada corrida trae su ficha para obtener otra vez el mismo informe: versiones, huellas, semilla, modelo y fecha. La app arma además su propia ficha y el paquete estático que el Portafolio publica, sin un solo enlace y con la huella de cada archivo.",
            "Every run comes with its record so the same report can be obtained again: versions, fingerprints, seed, model and date. The app also builds its own record and the static package the Portfolio publishes, with no link at all and with the fingerprint of every file.",
          ),
          seccion_manual: tb(
            "Entregar el paquete a hoja-de-vida",
            "Hand the package to hoja-de-vida",
          ),
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
        "los agentes de los dos demos, con la pausa humana como interrupt",
        "both demos' agents, with the human pause as an interrupt",
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
