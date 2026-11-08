/**
 * Textos de «Diseño de despliegue» (S10, FORMA y TEXTO «no vistos»: van al ensayo general del H-2). Cómo se pondría a
 * correr el agente de un plan, sin desplegar nada: los siete componentes, lo que la corrida publicada sí midió y el
 * control de cada riesgo del plan en su componente. Redactado dos veces (no traducido) y sin hosts, URL ni precios:
 * lo que no se midió se dice «no medido». Los textos de los componentes son también los registros líder / experto del
 * mapa del diagramador. Los dos demos comparten el diseño: nada aquí nombra uno.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdComponente } from "@core/despliegue/diseno";
import type { Fuente } from "@core/visor/tipos";
import { F_INTERRUPT, F_NODOS, F_SALIDA } from "./agente";

export const TITULO_PAGINA = tb(
  "Diseño de despliegue · planlang",
  "Deployment design · planlang",
);
export const DESCRIPCION_PAGINA = tb(
  "Cómo se pondría a correr este agente, con lo que la corrida publicada midió y el control de cada riesgo del plan. Diseño · no desplegado.",
  "How this agent would be put to run, with what the published run measured and the control for each risk in the plan. Design · not deployed.",
);

export const PORTADA = {
  antetitulo: tb("Diseño · no desplegado", "Design · not deployed"),
  titulo: tb("Cómo correría en producción", "How it would run in production"),
  guia: tb(
    "Nada de esto está desplegado: es el plano. Siete componentes, las cifras que la corrida publicada sí midió y, para cada riesgo del plan, el componente que lo controla.",
    "None of this is deployed: it is the blueprint. Seven components, the figures the published run did measure and, for each risk in the plan, the component that controls it.",
  ),
};

export const AVISO = {
  rotulo: tb("Diseño · no desplegado", "Design · not deployed"),
  texto: tb(
    "«Implementado» quiere decir que el componente existe en el código que corrió en la construcción; no que esté en un servidor. Ningún componente está desplegado y esta página no nombra servidores ni precios.",
    "“Implemented” means the component exists in the code that ran during the build; not that it sits on a server. No component is deployed and this page names no servers or prices.",
  ),
};

export interface TextosDeComponente {
  /** El nombre del componente en la lista, la tabla de riesgos y el texto equivalente. */
  nombre: TextoBilingue;
  lider: TextoBilingue;
  experto: TextoBilingue;
  paraQue: TextoBilingue;
}

export const COMPONENTE: Readonly<Record<IdComponente, TextosDeComponente>> = {
  canal: {
    nombre: tb("Canal de entrada", "Input channel"),
    lider: tb(
      "Por aquí llega cada solicitud, ya enmascarada. Aún no existe: hoy el agente recibe los casos de un lote.",
      "Every request arrives here, already masked. It does not exist yet: today the agent receives cases from a batch.",
    ),
    experto: tb(
      "Recibe la solicitud, la valida contra el esquema de entrada y la entrega al orquestador con un identificador de caso. Sin código todavía: es lo primero que habría que construir.",
      "Takes the request, validates it against the input schema and hands it to the orchestrator with a case id. No code yet: it is the first thing that would have to be built.",
    ),
    paraQue: tb(
      "Es la frontera del sistema: lo que no pasa por aquí no tiene traza ni guardia.",
      "It is the system's boundary: whatever does not pass through here has no trace and no guard.",
    ),
  },
  orquestador: {
    nombre: tb(
      "Orquestador con checkpointer",
      "Orchestrator with checkpointer",
    ),
    lider: tb(
      "Decide a dónde va el caso en cada paso y guarda su estado, para que una pausa de horas no lo pierda.",
      "Decides where the case goes at each step and saves its state, so a pause of hours does not lose it.",
    ),
    experto: tb(
      "El grafo con las aristas del plan y un checkpointer en disco (SQLite en las corridas) que permite reanudar tras la pausa humana. En producción el checkpointer tendría que ser de un almacén compartido; eso no se midió.",
      "The graph with the plan's edges and an on-disk checkpointer (SQLite in the runs) that allows resuming after the human pause. In production the checkpointer would need a shared store; that was not measured.",
    ),
    paraQue: tb(
      "Sin estado guardado, una pausa humana larga obliga a repetir el caso desde el principio.",
      "Without saved state, a long human pause forces the case to start over.",
    ),
  },
  puerto_modelo: {
    nombre: tb("Puerto de modelo", "Model port"),
    lider: tb(
      "Una sola puerta hacia el modelo de lenguaje; el proveedor se elige fuera del agente.",
      "A single door to the language model; the provider is chosen outside the agent.",
    ),
    experto: tb(
      "La función `crear_modelo()` entrega el modelo del proveedor configurado (suscripción, interruptor a API o simulado en la CI). El diseño no fija ningún proveedor: cambiarlo no toca el grafo.",
      "The `crear_modelo()` function returns the model of the configured provider (subscription, switch to API, or simulated in CI). The design fixes no provider: changing it does not touch the graph.",
    ),
    paraQue: tb(
      "El límite de uso o la caída de un proveedor no puede decidir un caso: el puerto lo aísla.",
      "A usage limit or a provider outage cannot decide a case: the port isolates it.",
    ),
  },
  guardia: {
    nombre: tb("Guardia determinista", "Deterministic guard"),
    lider: tb(
      "Revisa con reglas fijas, sin modelo, lo que sale antes de que llegue a nadie.",
      "Checks with fixed rules, no model, what goes out before it reaches anyone.",
    ),
    experto: tb(
      "Reglas de código sobre la salida: lista blanca de acciones, filtro de identificadores y separación entre instrucciones y datos. Es lo único que corre igual con el modelo caído.",
      "Code rules over the output: an allow-list of actions, an identifier filter and a split between instructions and data. It is the only part that runs the same with the model down.",
    ),
    paraQue: tb(
      "Un modelo puede equivocarse con seguridad; una regla fija se equivoca siempre igual y se puede probar.",
      "A model can be confidently wrong; a fixed rule is always wrong the same way and can be tested.",
    ),
  },
  cola_humana: {
    nombre: tb("Cola humana", "Human queue"),
    lider: tb(
      "Los casos que una persona debe decidir esperan aquí con todo lo que necesita para hacerlo.",
      "The cases a person must decide wait here with everything needed to decide.",
    ),
    experto: tb(
      "Una pausa del grafo con rol declarado y el caso completo como carga. La capacidad de quien revisa se mide con la simulación de plazos del plan; cuántas personas hacen falta no se calcula aquí.",
      "A graph pause with a declared role and the whole case as payload. The reviewer's capacity is measured with the plan's deadline simulation; how many people it takes is not computed here.",
    ),
    paraQue: tb(
      "Es el cuello de botella real: si la cola se desborda, el plazo se incumple aunque el agente vaya perfecto.",
      "It is the real bottleneck: if the queue overflows, the deadline is missed even when the agent runs perfectly.",
    ),
  },
  trazas: {
    nombre: tb("Almacén de trazas", "Trace store"),
    lider: tb(
      "Guarda, de cada caso, lo que cada paso vio y decidió.",
      "Keeps, for each case, what every step saw and decided.",
    ),
    experto: tb(
      "El formato `planlang-trace/v1` con huella: es la única entrada del verificador y del playground. Con él se miden la latencia y el costo de esta página.",
      "The `planlang-trace/v1` format with its fingerprint: the only input of the verifier and the playground. The latency and cost on this page are measured from it.",
    ),
    paraQue: tb(
      "Sin trazas no hay brecha que medir ni umbral que probar.",
      "Without traces there is no gap to measure and no threshold to try.",
    ),
  },
  observabilidad: {
    nombre: tb("Observabilidad", "Observability"),
    lider: tb(
      "Avisaría cuando algo se degrada en producción. Aún no existe.",
      "It would warn when something degrades in production. It does not exist yet.",
    ),
    experto: tb(
      "Métricas y alertas sobre las mismas medidas de esta página (latencia por nodo, costo por caso, cola). Sin código todavía: la vitrina solo reporta errores del navegador, no del agente.",
      "Metrics and alerts over the same measures as this page (latency per node, cost per case, queue). No code yet: the showcase only reports browser errors, not the agent's.",
    ),
    paraQue: tb(
      "Lo que no se mide en producción solo se descubre cuando alguien se queja.",
      "What is not measured in production is only found out when someone complains.",
    ),
  },
};

export const MADUREZ = {
  implementado: tb("Implementado y corrido", "Implemented and run"),
  "en-construccion": tb("Sin código aún", "No code yet"),
} as const;

/** Lo que dice la caja del plano: corto, para que quepa en su ancho (el texto completo va en «El diseño en texto»). */
export const MADUREZ_CAJA = tb("sin código", "no code");

export const SECCIONES = {
  plano: tb("Los siete componentes", "The seven components"),
  medido: tb("Lo que sí se midió", "What was measured"),
  riesgos: tb(
    "Cada riesgo, su control, su componente",
    "Each risk, its control, its component",
  ),
  nodefine: tb("Lo que este diseño no dice", "What this design does not say"),
};

export const PLANO = {
  lectura: tb(
    "De la solicitud a la salida, de izquierda a derecha. El glifo y la etiqueta de cada caja dicen el tipo; «sin código» en una caja (y «Sin código aún» en el texto de abajo) marca lo que sería nuevo.",
    "From request to output, left to right. The glyph and the label of each box say the type; “no code” on a box (and “No code yet” in the text below) marks what would be new.",
  ),
  region: tb("Diagrama del diseño de despliegue", "Deployment design diagram"),
  indice: tb("Capas del diagrama", "Diagram layers"),
  irACapa: tb("Ir a la capa", "Go to layer"),
  saltar: tb("Saltar el diagrama", "Skip the diagram"),
  equivalente: tb("El diseño en texto", "The design in text"),
  tituloSvg: tb(
    "Diseño de despliegue del agente",
    "The agent's deployment design",
  ),
  descripcionSvg: tb(
    "Siete componentes de la solicitud a la salida: canal, orquestador, puerto de modelo, guardia, cola humana, trazas y observabilidad.",
    "Seven components from request to output: channel, orchestrator, model port, guard, human queue, traces and observability.",
  ),
  paso: ((p: { k: number; nombre: string; madurez: string; lider: string }) =>
    tb(
      `${p.nombre} (${p.madurez}). ${p.lider}`,
      `${p.nombre} (${p.madurez}). ${p.lider}`,
    )) as (p: {
    k: number;
    nombre: string;
    madurez: string;
    lider: string;
  }) => TextoBilingue,
};

export const MEDIDO = {
  lectura: tb(
    "Estas cifras salen de la corrida publicada: las trazas (latencia y costo) y el informe (capacidad). Se midieron con la suscripción del constructor y en su máquina; en un servidor serían otras.",
    "These figures come from the published run: the traces (latency and cost) and the report (capacity). They were measured on the builder's subscription and machine; on a server they would differ.",
  ),
  noMedido: tb("no medido", "not measured"),
  casos: ((p: { n: string }) =>
    tb(`Corrida de ${p.n} casos.`, `Run of ${p.n} cases.`)) as (p: {
    n: string;
  }) => TextoBilingue,
  latencia: {
    titulo: tb("Latencia por nodo", "Latency per node"),
    columnas: [
      tb("Nodo del grafo", "Graph node"),
      tb("Veces", "Times"),
      tb("Mediana (s)", "Median (s)"),
      tb("Máxima (s)", "Maximum (s)"),
    ],
    nota: tb(
      "Mediana: el valor del medio de las duraciones de cada paso; con cantidad par, la media de los dos del medio.",
      "Median: the middle value of each step's durations; with an even count, the mean of the middle two.",
    ),
  },
  costo: {
    titulo: tb("Costo nominal por caso", "Nominal cost per case"),
    columnas: [
      tb("Media", "Mean"),
      tb("Mediana", "Median"),
      tb("Máximo", "Maximum"),
    ],
    nota: tb(
      "Nominal: tokens por la tarifa de referencia del plan, no una factura. Con la suscripción no se paga por token.",
      "Nominal: tokens times the plan's reference rate, not an invoice. On the subscription nothing is paid per token.",
    ),
  },
  capacidad: {
    titulo: tb("Capacidad de quien revisa", "Reviewer capacity"),
    nominal: ((p: { valor: string; unidad: TextoBilingue }) =>
      tb(
        `Con ${p.valor} ${p.unidad.es} la simulación del plan cumple todos los plazos.`,
        `With ${p.valor} ${p.unidad.en} the plan's simulation meets every deadline.`,
      )) as (p: { valor: string; unidad: TextoBilingue }) => TextoBilingue,
    minima: ((p: {
      valor: string;
      unidad: TextoBilingue;
      tardias: string | null;
    }) =>
      tb(
        p.tardias === null
          ? `La capacidad mínima que cumple es ${p.valor} ${p.unidad.es}.`
          : `La capacidad mínima que cumple es ${p.valor} ${p.unidad.es}; con una menos, ${p.tardias} solicitudes salen tardías.`,
        p.tardias === null
          ? `The minimum capacity that meets them is ${p.valor} ${p.unidad.en}.`
          : `The minimum capacity that meets them is ${p.valor} ${p.unidad.en}; with one fewer, ${p.tardias} requests are late.`,
      )) as (p: {
      valor: string;
      unidad: TextoBilingue;
      tardias: string | null;
    }) => TextoBilingue,
    carga: ((p: { carga: string; dias: string; pausas: string }) =>
      tb(
        `Llegaron ${p.carga} solicitudes por día hábil a la cola humana (${p.pausas} en ${p.dias} días hábiles).`,
        `${p.carga} requests per business day reached the human queue (${p.pausas} over ${p.dias} business days).`,
      )) as (p: {
      carga: string;
      dias: string;
      pausas: string;
    }) => TextoBilingue,
    horas: ((p: { horas: string }) =>
      tb(
        `Eso son ${p.horas} horas de revisión con el costo humano por caso del plan.`,
        `That is ${p.horas} hours of review at the plan's human cost per case.`,
      )) as (p: { horas: string }) => TextoBilingue,
    sinMinima: tb(
      "Ni la capacidad medida cumple todos los plazos: no hay mínima que decir.",
      "Not even the measured capacity meets every deadline: there is no minimum to state.",
    ),
    noMedida: tb(
      "No medido: este plan no declara plazos ni llegadas, así que la corrida no midió la cola de quien revisa. Cuántas personas harían falta es una pregunta abierta, no una cifra.",
      "Not measured: this plan declares no deadlines or arrivals, so the run did not measure the reviewer queue. How many people would be needed is an open question, not a figure.",
    ),
    personas: tb(
      "Convertir esa capacidad en personas necesita una jornada y un ritmo de trabajo que el plan no declara: no se calcula.",
      "Turning that capacity into people needs a workday and a work rate that the plan does not declare: it is not computed.",
    ),
  },
};

export const RIESGOS = {
  lectura: tb(
    "Cada riesgo del plan con lo que el plan declara como mitigación, tal cual, y el componente donde ese control viviría. «Sin componente»: el plan lo mitiga con algo que no es un componente de despliegue.",
    "Each risk in the plan with what the plan declares as mitigation, verbatim, and the component where that control would live. “No component”: the plan mitigates it with something that is not a deployment component.",
  ),
  columnas: [
    tb("Riesgo", "Risk"),
    tb("Control declarado en el plan", "Control declared in the plan"),
    tb("Componente", "Component"),
  ],
  sinComponente: tb("Sin componente", "No component"),
  legal: tb("control legal", "legal control"),
  severidad: ((p: { n: number }) =>
    tb(`gravedad ${p.n}`, `severity ${p.n}`)) as (p: {
    n: number;
  }) => TextoBilingue,
  nota: tb(
    "La asignación de cada riesgo a su componente es una lectura del autor sobre la mitigación que el plan declara; una prueba comprueba que ningún riesgo del plan quede sin lectura.",
    "Assigning each risk to its component is the author's reading of the mitigation the plan declares; a test checks that no risk in the plan is left without a reading.",
  ),
};

export const NO_DICE = {
  items: [
    tb(
      "Dónde correría: ningún servidor, región ni proveedor de nube se nombra porque ninguno se eligió.",
      "Where it would run: no server, region or cloud provider is named because none was chosen.",
    ),
    tb(
      "Cuánto costaría la infraestructura: solo se midió el costo nominal de los tokens, no el de alojar nada.",
      "What the infrastructure would cost: only the nominal token cost was measured, not hosting anything.",
    ),
    tb(
      "Cuántos casos por segundo aguantaría: la corrida fue en lotes, un caso a la vez; no se midió concurrencia.",
      "How many cases per second it could take: the run was in batches, one case at a time; concurrency was not measured.",
    ),
    tb(
      "Qué pasa si el proveedor de modelo cae a mitad de un caso: el plan declara una arista de respaldo hacia una persona, pero no se probó una caída real.",
      "What happens if the model provider drops mid-case: the plan declares a fallback edge to a person, but a real outage was not tried.",
    ),
  ],
};

export const ENLACE = {
  rotulo: tb("Diseño de despliegue", "Deployment design"),
  texto: tb(
    "Cómo correría en producción: componentes, cifras medidas y el control de cada riesgo.",
    "How it would run in production: components, measured figures and the control for each risk.",
  ),
  abrir: tb("Ver el diseño →", "See the design →"),
};

export const COLUMNAS_LISTA = {
  componente: tb("Componente", "Component"),
};

/** Comprobado al cierre del S10 (2026-11-08): las dos páginas responden; que cubran lo que el componente afirma es lectura del autor. */
const FECHA_FUENTES = "2026-11-08";
const F_PERSISTENCIA: Fuente = {
  url: "https://docs.langchain.com/oss/python/langgraph/persistence",
  titulo: tb(
    "LangGraph: persistencia y checkpointers",
    "LangGraph: persistence and checkpointers",
  ),
  fecha: FECHA_FUENTES,
  tipo: "oficial",
};
const F_OBSERVABILIDAD: Fuente = {
  url: "https://docs.langchain.com/oss/python/langgraph/observability",
  titulo: tb(
    "LangGraph: trazado y observabilidad",
    "LangGraph: tracing and observability",
  ),
  fecha: FECHA_FUENTES,
  tipo: "oficial",
};

/** La fuente oficial de cada componente (el contrato pide al menos una https por nodo); el código que lo respalda se añade aparte. */
export const FUENTES: Readonly<Record<IdComponente, Fuente[]>> = {
  canal: [F_NODOS],
  orquestador: [F_PERSISTENCIA],
  puerto_modelo: [F_SALIDA],
  guardia: [F_NODOS],
  cola_humana: [F_INTERRUPT],
  trazas: [F_OBSERVABILIDAD],
  observabilidad: [F_OBSERVABILIDAD],
};
