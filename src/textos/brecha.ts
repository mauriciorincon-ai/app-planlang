/**
 * Textos de P4 Brecha (maqueta `docs/diseno/04-brecha.html`, aprobada en la mirada 3 de la Etapa de Diseño). La copia
 * es la aprobada; los números, los estados, los casos y las reglas salen del informe y del plan. Lo editorial que la
 * maqueta escribió a mano por elemento («qué significa» un supuesto refutado o una brecha) vive aquí ligado a su id y
 * su estado: la vista falla, nombrándolo, si el informe trae un elemento que no tiene su lectura.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb("La brecha · planlang", "The gap · planlang");
export const DESCRIPCION_PAGINA = tb(
  "El informe de brecha del demo A: un verificador sin modelo de lenguaje compara lo que el plan prometió con lo que el agente hizo y lo publica con sus fallas. Simulación · no operativo.",
  "Demo A's gap report: a verifier with no language model compares what the plan promised with what the agent did and publishes it with its failures. Simulation · not operational.",
);

export const PORTADA = {
  antetitulo: ((p: { corrida: string; fecha: string }) =>
    tb(
      `Demo A · autorizaciones médicas · corrida ${p.corrida} · ${p.fecha}`,
      `Demo A · medical prior authorizations · run ${p.corrida} · ${p.fecha}`,
    )) as Plantilla<{ corrida: string; fecha: string }>,
  titulo: tb(
    "La brecha entre el plan y lo que hizo el agente",
    "The gap between the plan and what the agent did",
  ),
  guia: tb(
    "Un verificador sin modelo de lenguaje compara, caso por caso, lo que el plan prometió con lo que el agente hizo, y publica el resultado con sus fallas a la vista.",
    "A verifier with no language model compares, case by case, what the plan promised with what the agent did, and publishes the result with its failures in view.",
  ),
};

export const MIRADA = {
  titulo: tb("El informe en una mirada", "The report at a glance"),
  avisoLider: tb(
    "Ves qué se planeó, qué pasó y qué significa, en palabras llanas.",
    "You see what was planned, what happened and what it means, in plain words.",
  ),
  avisoExperto: tb(
    "Cada renglón cambia a su regla de medición, el valor exacto, n y los casos; en las secciones aparecen los detectores, los evaluadores y las medidas de los supuestos.",
    "Every row switches to its measurement rule, the exact value, n and the cases; the sections add the detectors, the evaluators and the assumption measurements.",
  ),
  recomendacionPie: tb(
    "Recomendación del informe, escrita por el verificador.",
    "The report’s recommendation, written by the verifier.",
  ),
};

/** Números en palabras para las frases llanas («Fallaron dos cosas»). Más allá de diez, la cifra. */
const PALABRAS = {
  es: [
    "cero",
    "una",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
  ],
  en: [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ],
} as const;
export function enPalabras(n: number, i: "es" | "en"): string {
  return PALABRAS[i][n] ?? String(n);
}

/** La frase del veredicto para el líder, por partes: lo que se cumplió, lo que falló y lo que quedó sin probar. */
export const FRASE = {
  todoCumplido: ((p: { criterios: number; riesgos: number }) =>
    tb(
      `Se cumplieron los ${p.criterios} criterios y no ocurrió ninguno de los ${p.riesgos} riesgos.`,
      `All ${p.criterios} criteria were met and none of the ${p.riesgos} risks occurred.`,
    )) as Plantilla<{ criterios: number; riesgos: number }>,
  parcial: ((p: {
    cumplen: number;
    criterios: number;
    ocurridos: number;
    riesgos: number;
  }) =>
    tb(
      `Se cumplieron ${p.cumplen} de los ${p.criterios} criterios y ${p.ocurridos === 0 ? `no ocurrió ninguno de los ${p.riesgos} riesgos` : `ocurrió${p.ocurridos === 1 ? "" : "eron"} ${p.ocurridos} de los ${p.riesgos} riesgos`}.`,
      `${p.cumplen} of the ${p.criterios} criteria were met and ${p.ocurridos === 0 ? `none of the ${p.riesgos} risks occurred` : `${p.ocurridos} of the ${p.riesgos} risks occurred`}.`,
    )) as Plantilla<{
    cumplen: number;
    criterios: number;
    ocurridos: number;
    riesgos: number;
  }>,
  fallaron: ((p: { n: number; es: string[]; en: string[] }) =>
    tb(
      `${p.n === 1 ? "Falló una cosa" : `Fallaron ${enPalabras(p.n, "es")} cosas`}: ${unir(p.es, "y")}.`,
      `${p.n === 1 ? "One thing failed" : `${mayuscula(enPalabras(p.n, "en"))} things failed`}: ${unir(p.en, "and")}.`,
    )) as Plantilla<{ n: number; es: string[]; en: string[] }>,
  sinProbar: ((p: { es: string[]; en: string[] }) =>
    tb(
      `Y quedó sin probar ${unir(p.es, "ni")}.`,
      `And it was left untested ${unir(p.en, "or")}.`,
    )) as Plantilla<{ es: string[]; en: string[] }>,
};

function mayuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/** «a, y b» con la coma de la maqueta antes de la conjunción cuando hay dos o más. */
function unir(xs: readonly string[], y: string): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")}, ${y} ${xs[xs.length - 1]}`;
}

/**
 * Lectura llana de cada elemento que puede fallar o quedar sin probar, ligada a su id y su estado (la maqueta las
 * escribió a mano; aquí se escriben una vez por elemento). `frase` entra en la línea del veredicto; `titulo`,
 * `planeo` y `significa`, en su renglón. Lo que se midió («qué pasó») sale del informe.
 */
export interface LecturaDeFalla {
  frase: TextoBilingue;
  titulo: TextoBilingue;
  planeo: TextoBilingue;
  significa: TextoBilingue;
}

export const LECTURA_SUPUESTO: Record<string, LecturaDeFalla> = {
  "S3:refutado": {
    frase: tb(
      "repartir el trabajo entre varios agentes resultó más lento que un solo agente (S3)",
      "splitting the work among several agents turned out slower than a single agent (S3)",
    ),
    titulo: tb(
      "Varios agentes frente a uno solo",
      "Several agents against one",
    ),
    planeo: tb(
      "Repartir el trabajo entre un enrutador y tres agentes especializados no rinde peor que un solo agente con un presupuesto no mayor.",
      "Splitting the work between a router and three specialized agents does no worse than a single agent on no larger a budget.",
    ),
    significa: tb(
      "La exactitud extra se paga en tiempo, y el plan solo tolera la misma demora que un agente único. Antes del lote de 200, o el plan acepta más demora, o el enrutador tiene que ser más rápido.",
      "The extra accuracy is paid for in time, and the plan only tolerates the same delay as a single agent. Before the 200-case batch, either the plan accepts more delay or the router has to get faster.",
    ),
  },
  "S1:sin_probar": {
    frase: tb(
      "si su confianza es fiable (S1)",
      "whether its confidence can be trusted (S1)",
    ),
    titulo: tb("La confianza del modelo", "The model’s confidence"),
    planeo: tb(
      "La confianza que el modelo declara al extraer separa sus aciertos de sus errores. En ella se apoya el umbral U1 para decidir cuándo llamar a una persona.",
      "The confidence the model declares when extracting separates its hits from its errors. Threshold U1 relies on it to decide when to call a person.",
    ),
    significa: tb(
      "El umbral U1 sigue sin respaldo medido. Hace falta un lote con casos difíciles, donde el modelo se equivoque.",
      "Threshold U1 still has no measured backing. It needs a batch with hard cases, where the model gets things wrong.",
    ),
  },
};

export const LECTURA_BRECHA: Record<
  string,
  Omit<LecturaDeFalla, "frase" | "planeo"> & {
    frase: Plantilla<number>;
    planeo: Plantilla<number>;
  }
> = {
  reintento_de_esquema: {
    frase: ((n: number) =>
      tb(
        `${n} ${n === 1 ? "vez" : "veces"} el modelo respondió fuera del formato pedido`,
        `${n} ${n === 1 ? "time" : "times"} the model answered outside the requested format`,
      )) as Plantilla<number>,
    titulo: tb(
      "Respuestas fuera del formato pedido",
      "Answers outside the requested format",
    ),
    planeo: ((riesgos: number) =>
      tb(
        `Nada: ninguno de los ${riesgos} riesgos del plan contemplaba que el modelo respondiera fuera del formato pedido.`,
        `Nothing: none of the plan’s ${riesgos} risks considered that the model might answer outside the requested format.`,
      )) as Plantilla<number>,
    significa: tb(
      "Cada reintento suma tiempo y costo. El plan debe sumarlo como riesgo nuevo, con su detector.",
      "Every retry adds time and cost. The plan should add it as a new risk, with its detector.",
    ),
  },
};

/** El renglón de un criterio que se cumplió con una nota: lo que la nota significa. */
export const LECTURA_NOTA: Record<string, Plantilla<number>> = {
  C7: (() =>
    tb(
      "Cumple, porque la regla mira la mediana. Si el límite debe valer caso por caso, la regla tiene que decirlo.",
      "It is met, because the rule looks at the median. If the limit must hold case by case, the rule has to say so.",
    )) as Plantilla<number>,
  C3: ((n: number) =>
    tb(
      `Cumple, pero sobre solo ${n} ${n === 1 ? "caso" : "casos"}.`,
      `It is met, but on only ${n} ${n === 1 ? "case" : "cases"}.`,
    )) as Plantilla<number>,
};

/**
 * «Qué pasó» de un criterio con casos fuera de su población, dicho con el nombre de esa población (editorial por
 * criterio; sin entrada, la vista usa `PASO.fuera`, que lo dice en general).
 */
export const PASO_FUERA: Record<
  string,
  Plantilla<{ dentro: number; fuera: number }>
> = {
  C3: ((p: { dentro: number; fuera: number }) =>
    tb(
      `Los ${p.dentro} casos de alto costo pasaron por una persona. Otros ${p.fuera} no tienen costo medido —el paso que lo escribe no corrió en ellos— y quedan fuera de la cuenta.`,
      `The ${p.dentro} high-cost cases went through a person. Another ${p.fuera} have no measured cost —the step that writes it did not run for them— and are left out of the count.`,
    )) as Plantilla<{ dentro: number; fuera: number }>,
};

/** Lo que pasó, armado con las cifras del informe. */
export const PASO = {
  comparacion: ((p: {
    exactitud: string;
    exactitudBase: string;
    acerto: "mas" | "menos" | "igual";
    latencia: string;
    latenciaBase: string;
    tardo: "mas" | "menos" | "igual";
    llamadas: number;
    llamadasBase: number;
  }) =>
    tb(
      `${{ mas: "Acertó más", menos: "Acertó menos", igual: "Acertó lo mismo" }[p.acerto]} (${p.exactitud} de los casos frente a ${p.exactitudBase}), ${p.tardo === "mas" ? "pero tardó más" : p.tardo === "menos" ? "y tardó menos" : "y tardó lo mismo"}: ${p.latencia} por caso frente a ${p.latenciaBase}, y usó ${p.llamadas >= p.llamadasBase ? "más" : "menos"} llamadas al modelo (${p.llamadas} frente a ${p.llamadasBase}).`,
      `It got ${{ mas: "more right", menos: "fewer right", igual: "the same right" }[p.acerto]} (${p.exactitud} of the cases against ${p.exactitudBase}), ${p.tardo === "mas" ? "but took longer" : p.tardo === "menos" ? "and took less time" : "and took the same time"}: ${p.latencia} per case against ${p.latenciaBase}, and used ${p.llamadas >= p.llamadasBase ? "more" : "fewer"} model calls (${p.llamadas} against ${p.llamadasBase}).`,
    )) as Plantilla<{
    exactitud: string;
    exactitudBase: string;
    acerto: "mas" | "menos" | "igual";
    latencia: string;
    latenciaBase: string;
    tardo: "mas" | "menos" | "igual";
    llamadas: number;
    llamadasBase: number;
  }>,
  sinErrores: ((n: number) =>
    tb(
      `No se pudo comprobar: el modelo acertó los ${n} casos medidos y, sin un solo error, no hay con qué comparar su confianza.`,
      `It could not be checked: the model got all ${n} measured cases right and, without a single error, there is nothing to compare its confidence against.`,
    )) as Plantilla<number>,
  reintentos: ((p: {
    veces: number;
    casos: number;
    nodo: TextoBilingue;
    reintentos: number;
    corridas: number;
  }) =>
    tb(
      `${p.veces} ${p.veces === 1 ? "vez" : "veces"}, en ${p.casos} ${p.casos === 1 ? "caso" : "casos"}, ${p.nodo.es} no entregó su respuesta en el formato pedido a la primera y hubo que repetir la llamada: ${p.reintentos} ${p.reintentos === 1 ? "reintento" : "reintentos"} en las ${p.corridas} corridas.`,
      `${p.veces} ${p.veces === 1 ? "time" : "times"}, in ${p.casos} ${p.casos === 1 ? "case" : "cases"}, ${p.nodo.en} did not return its answer in the requested format on the first try and the call had to be repeated: ${p.reintentos} ${p.reintentos === 1 ? "retry" : "retries"} across the ${p.corridas} runs.`,
    )) as Plantilla<{
    veces: number;
    casos: number;
    nodo: TextoBilingue;
    reintentos: number;
    corridas: number;
  }>,
  mediana: ((p: { mediana: string; casos: string; valores: string }) =>
    tb(
      `La mediana fue ${p.mediana}. Pero ${p.casos} pasó el objetivo uno a uno: ${p.valores}.`,
      `The median was ${p.mediana}. But ${p.casos} went past the target one by one: ${p.valores}.`,
    )) as Plantilla<{ mediana: string; casos: string; valores: string }>,
  fuera: ((p: { dentro: number; fuera: number }) =>
    tb(
      `Los ${p.dentro} casos de la población cumplieron. Otros ${p.fuera} no tienen la señal que la define —el paso que la escribe no corrió en ellos— y quedan fuera de la cuenta.`,
      `The ${p.dentro} cases in the population met it. Another ${p.fuera} lack the signal that defines it —the step that writes it did not run for them— and are left out of the count.`,
    )) as Plantilla<{ dentro: number; fuera: number }>,
  playground: ((p: { umbral: string; valor: string; caso: string }) =>
    tb(
      `En el playground, con ${p.umbral} en ${p.valor}, deja de cumplirse (${p.caso} saldría sin persona).`,
      `In the playground, with ${p.umbral} at ${p.valor}, it stops being met (${p.caso} would go out without a person).`,
    )) as Plantilla<{ umbral: string; valor: string; caso: string }>,
};

/** Nombre llano de cada nodo dentro de una frase («el extractor no entregó…»). */
export const NODO_EN_FRASE: Record<string, TextoBilingue> = {
  enrutador: tb("el enrutador", "the router"),
  extractor: tb("el extractor", "the extractor"),
  aclaracion: tb("el nodo de aclaración", "the clarification node"),
  verificador_cobertura: tb(
    "el verificador de cobertura",
    "the coverage checker",
  ),
  decision: tb("el nodo de decisión", "the decision node"),
  pausa_humana: tb("la pausa humana", "the human pause"),
  redactor: tb("el redactor", "the writer"),
  guardia_salida: tb("la guardia de salida", "the output guard"),
};

export const BALANCE = {
  titulo: tb("El plan frente a la corrida", "The plan against the run"),
  partes: ((n: number) => tb(`${n} partes`, `${n} parts`)) as Plantilla<number>,
  nota: tb(
    "las cifras de «Falló» y «Sin probar» llevan a su explicación",
    "the “Failed” and “Untested” figures lead to their explanation",
  ),
  parte: tb("Parte del plan", "Part of the plan"),
  pide: tb("Qué pide el plan", "What the plan asks"),
  cumplio: tb("Se cumplió", "Met"),
  fallo: tb("Falló", "Failed"),
  sinProbar: tb("Sin probar", "Untested"),
  srCumplio: tb("se cumplió:", "met:"),
  srFallo: tb("falló:", "failed:"),
  srSinProbar: tb("sin probar:", "untested:"),
  experto: tb("experto", "expert"),
  criterios: {
    parte: tb("Criterios de aceptación", "Acceptance criteria"),
    nota: tb("lo que el agente debe lograr", "what the agent must achieve"),
    lider: ((n: number) =>
      tb(
        `${n} promesas, cada una con su forma de medirla`,
        `${n} promises, each with its way of being measured`,
      )) as Plantilla<number>,
  },
  riesgos: {
    parte: tb("Riesgos previstos", "Foreseen risks"),
    nota: tb("lo que podía salir mal", "what could go wrong"),
    lider: ((n: number) =>
      tb(
        `que no ocurra ninguno de los ${n}`,
        `that none of the ${n} occurs`,
      )) as Plantilla<number>,
    experto: ((p: { n: number; alta: number; media: number; baja: number }) =>
      tb(
        `${p.n} detectores sobre las trazas · prioridad AIAG-VDA: ${[p.alta ? `${p.alta} alta` : "", p.media ? `${p.media} media` : "", p.baja ? `${p.baja} baja` : ""].filter(Boolean).join(", ")}`,
        `${p.n} detectors over the traces · AIAG-VDA priority: ${[p.alta ? `${p.alta} high` : "", p.media ? `${p.media} medium` : "", p.baja ? `${p.baja} low` : ""].filter(Boolean).join(", ")}`,
      )) as Plantilla<{ n: number; alta: number; media: number; baja: number }>,
    noOcurrieron: ((n: number) =>
      tb(
        `${n} no ${n === 1 ? "ocurrió" : "ocurrieron"}`,
        `${n} did not occur`,
      )) as Plantilla<number>,
    ocurrieron: ((n: number) =>
      tb(
        `${n} ${n === 1 ? "ocurrió" : "ocurrieron"}`,
        `${n} occurred`,
      )) as Plantilla<number>,
  },
  supuestos: {
    parte: tb("Supuestos", "Assumptions"),
    nota: tb("lo que el plan dio por cierto", "what the plan took as true"),
    lider: tb(
      "que cada uno se confirme con su prueba",
      "that each is confirmed by its test",
    ),
  },
  noPrevisto: {
    parte: tb("Lo que el plan no previó", "What the plan did not foresee"),
    nota: tb(
      "fallas sin un riesgo que las cubra",
      "failures with no risk to cover them",
    ),
    lider: tb("nada fuera de lo previsto", "nothing outside what was foreseen"),
    experto: tb(
      "eventos en las trazas sin detector del plan",
      "events in the traces with no detector in the plan",
    ),
    fallas: ((n: number) =>
      tb(
        `${n} ${n === 1 ? "falla" : "fallas"}`,
        `${n} ${n === 1 ? "failure" : "failures"}`,
      )) as Plantilla<number>,
  },
  grafo: {
    parte: tb("Grafo exigido", "Required graph"),
    nota: tb(
      "lo que el agente debe tener construido",
      "what the agent must have built",
    ),
    lider: ((p: { nodos: number; senales: number }) =>
      tb(
        `${p.nodos} piezas, ${p.senales} datos registrados y la pausa humana`,
        `${p.nodos} parts, ${p.senales} recorded data and the human pause`,
      )) as Plantilla<{ nodos: number; senales: number }>,
    experto: ((p: { nodos: number; senales: number; rol: string }) =>
      tb(
        `contrato: ${p.nodos} nodos · ${p.senales} señales obligatorias · interrupt con rol ${p.rol}`,
        `contract: ${p.nodos} nodes · ${p.senales} mandatory signals · interrupt with role ${p.rol}`,
      )) as Plantilla<{ nodos: number; senales: number; rol: string }>,
    senales: ((p: { a: number; b: number }) =>
      tb(`${p.a} de ${p.b} señales`, `${p.a} of ${p.b} signals`)) as Plantilla<{
      a: number;
      b: number;
    }>,
  },
  cruzada: {
    parte: tb("Prueba cruzada", "Cross-check"),
    nota: tb(
      "el playground decide igual que el agente",
      "the playground decides as the agent does",
    ),
    lider: tb(
      "que Python y TypeScript decidan igual",
      "that Python and TypeScript decide alike",
    ),
    experto: ((n: number) =>
      tb(
        `RF-09.2 sobre ${n} corridas`,
        `RF-09.2 over ${n} runs`,
      )) as Plantilla<number>,
    decisiones: tb("decisiones", "decisions"),
  },
};

/** Las cuatro agrupaciones de «El informe en una mirada». */
export const GRUPOS = {
  fallo: {
    titulo: tb("Lo que falló", "What failed"),
    lider: tb(
      "qué se planeó, qué pasó y qué significa",
      "what was planned, what happened and what it means",
    ),
    experto: tb("regla, medida y evidencia", "rule, measure and evidence"),
  },
  sinProbar: tb("Lo que quedó sin probar", "What was left untested"),
  conNota: tb("Se cumplió, con una nota", "Met, with a note"),
  cumplido: tb("Lo que se cumplió, uno por uno", "What was met, one by one"),
  noFallo: tb(
    "Nada falló en esta corrida: ningún criterio, ningún riesgo, ningún supuesto y nada fuera de lo previsto.",
    "Nothing failed in this run: no criterion, no risk, no assumption and nothing unforeseen.",
  ),
};

export const COLUMNAS = {
  planeo: tb("Qué se planeó", "What was planned"),
  paso: tb("Qué pasó", "What happened"),
  significa: tb("Qué significa", "What it means"),
  regla: tb("Regla de medición", "Measurement rule"),
  medido: tb("Medido", "Measured"),
  evidencia: tb("Evidencia", "Evidence"),
  casos: tb("Casos", "Cases"),
};

export const ETIQUETA_FILA = {
  fallo: tb("Falló", "Failed"),
  sinProbar: tb("Sin probar", "Untested"),
  conNota: tb("Cumple, con nota", "Met, with a note"),
  noPrevisto: tb("no previsto", "unforeseen"),
};

export const CUMPLIDO = {
  criterios: ((p: { a: number; b: number }) =>
    tb(
      `Criterios · ${p.a} de ${p.b}`,
      `Criteria · ${p.a} of ${p.b}`,
    )) as Plantilla<{ a: number; b: number }>,
  riesgos: ((p: { a: number; b: number }) =>
    tb(
      `Riesgos que no ocurrieron · ${p.a} de ${p.b}`,
      `Risks that did not occur · ${p.a} of ${p.b}`,
    )) as Plantilla<{ a: number; b: number }>,
  ademas: ((n: number) =>
    tb(`Además · ${n}`, `Also · ${n}`)) as Plantilla<number>,
  grafo: tb(
    "El agente tiene las piezas que el plan exige y deja sus datos en cada traza",
    "The agent has the parts the plan requires and leaves its data in every trace",
  ),
  cruzada: tb(
    "Rehechas en TypeScript, las decisiones del agente dan lo mismo",
    "Redone in TypeScript, the agent’s decisions come out the same",
  ),
  casos: ((p: { a: number; b: number }) =>
    tb(
      `${p.a} de ${p.b} ${p.b === 1 ? "caso" : "casos"}`,
      `${p.a} of ${p.b} ${p.b === 1 ? "case" : "cases"}`,
    )) as Plantilla<{ a: number; b: number }>,
  sesiones: ((p: { a: number; b: number }) =>
    tb(
      `${p.a} de ${p.b} ${p.b === 1 ? "sesión" : "sesiones"}`,
      `${p.a} of ${p.b} ${p.b === 1 ? "session" : "sessions"}`,
    )) as Plantilla<{ a: number; b: number }>,
  corridas: ((p: { valor: string; k: number; de: number }) =>
    tb(
      `${p.valor} · ${p.k} de ${p.de} corridas`,
      `${p.valor} · ${p.k} of ${p.de} runs`,
    )) as Plantilla<{ valor: string; k: number; de: number }>,
};

export const IPO = {
  titulo: tb("Cómo se obtuvo este informe", "How this report was obtained"),
  recibe: tb("Recibe", "Takes"),
  recibeSub: tb("con huella", "with fingerprint"),
  hace: tb("Hace", "Does"),
  haceSub: ((n: number) =>
    tb(`${n} pasos, sin modelo`, `${n} steps, no model`)) as Plantilla<number>,
  entrega: tb("Entrega", "Delivers"),
  entregaSub: tb("con sus fallas", "with its failures"),
  hecho: tb("hecho", "done"),
  plan: ((v: string) =>
    tb(`El plan ${v}`, `The plan ${v}`)) as Plantilla<string>,
  planDetalle: ((p: { c: number; r: number; s: number; u: number }) =>
    tb(
      `${p.c} criterios, ${p.r} riesgos, ${p.s} supuestos y ${p.u} umbrales, con su huella`,
      `${p.c} criteria, ${p.r} risks, ${p.s} assumptions and ${p.u} thresholds, with their fingerprint`,
    )) as Plantilla<{ c: number; r: number; s: number; u: number }>,
  casos: ((n: number) =>
    tb(
      `${n} casos sintéticos con su verdad conocida`,
      `${n} synthetic cases with their known truth`,
    )) as Plantilla<number>,
  composicion: ((p: {
    normal: number;
    borde: number;
    faltante: number;
    adversario: number;
  }) =>
    tb(
      `${p.normal} normales, ${p.borde} de borde, ${p.faltante} con datos faltantes y ${p.adversario} adversarios`,
      `${p.normal} normal, ${p.borde} edge, ${p.faltante} with missing data and ${p.adversario} adversarial`,
    )) as Plantilla<{
    normal: number;
    borde: number;
    faltante: number;
    adversario: number;
  }>,
  trazas: ((n: number) =>
    tb(
      `Las trazas de ${n} corridas`,
      `The traces of ${n} runs`,
    )) as Plantilla<number>,
  trazasDetalle: ((p: { multi: number; base: boolean }) =>
    tb(
      `${p.multi} del agente multiagente${p.base ? " y 1 de un agente único, para comparar" : ""}`,
      `${p.multi} from the multi-agent agent${p.base ? " and 1 from a single agent, to compare" : ""}`,
    )) as Plantilla<{ multi: number; base: boolean }>,
  pasos: ((p: { c: number; r: number; s: number; k: number }) => [
    tb(
      "Verifica las huellas: si una traza cambió, rechaza la corrida",
      "Checks the fingerprints: if a trace changed, it rejects the run",
    ),
    tb(
      `Mide los ${p.c} criterios con su regla${p.k > 1 ? `; las tasas pass^k exigen ${p.k} corridas seguidas` : ""}`,
      `Measures the ${p.c} criteria with their rule${p.k > 1 ? `; pass^k rates require ${p.k} runs in a row` : ""}`,
    ),
    tb(
      `Corre los ${p.r} detectores de riesgo sobre las trazas`,
      `Runs the ${p.r} risk detectors over the traces`,
    ),
    tb(
      `Mide los ${p.s} supuestos con su prueba barata`,
      `Measures the ${p.s} assumptions with their cheap test`,
    ),
    tb(
      "Revisa que el grafo tenga lo que el plan exige",
      "Checks that the graph has what the plan requires",
    ),
    tb(
      "Rehace cada decisión en TypeScript y exige que coincida con Python",
      "Redoes every decision in TypeScript and requires it to match Python",
    ),
    tb(
      "Busca fallas que ningún riesgo del plan previó",
      "Looks for failures no risk in the plan foresaw",
    ),
    tb(
      "Emite el veredicto y la recomendación",
      "Issues the verdict and the recommendation",
    ),
  ]) as (p: { c: number; r: number; s: number; k: number }) => TextoBilingue[],
  entregas: [
    {
      titulo: tb(
        "El veredicto y su recomendación",
        "The verdict and its recommendation",
      ),
      detalle: tb(
        "cumple · cumple con alertas · no cumple",
        "met · met with alerts · not met",
      ),
    },
    {
      titulo: tb(
        "El informe en español y en inglés",
        "The report in Spanish and English",
      ),
      detalle: tb(
        "las 9 secciones, con la misma estructura en los dos idiomas",
        "the 9 sections, with the same structure in both languages",
      ),
    },
    {
      titulo: tb(
        "Un archivo con huella SHA-256",
        "A file with a SHA-256 fingerprint",
      ),
      detalle: tb(
        "se puede verificar de nuevo: sale igual en Node y en el navegador",
        "it can be checked again: it comes out the same in Node and in the browser",
      ),
    },
  ],
  nunca: tb("Nunca un modelo de lenguaje", "Never a language model"),
  nuncaDetalle: tb(
    "el veredicto sale de reglas y cuentas, no de una IA",
    "the verdict comes from rules and counts, not from an AI",
  ),
  fuente: ((p: { version: string; sprint: number; huella: string }) =>
    tb(
      `Informe real del verificador ${p.version} sobre la corrida del sprint ${p.sprint}; huella del informe ${p.huella}…`,
      `Real report from verifier ${p.version} on the sprint ${p.sprint} run; report fingerprint ${p.huella}…`,
    )) as Plantilla<{ version: string; sprint: number; huella: string }>,
  chip: ((v: string) =>
    tb(`real · corrida ${v}`, `real · run ${v}`)) as Plantilla<string>,
};

export const INDICE = {
  nota: tb(
    "Las 9 secciones del informe, en su orden",
    "The report’s 9 sections, in their order",
  ),
  rotulo: tb("Secciones del informe", "Report sections"),
};

export const SECCIONES = {
  b1: tb("Resumen para quien decide", "Summary for the decision-maker"),
  b2: tb("El plan en breve", "The plan in brief"),
  b3: tb("Criterios de aceptación", "Acceptance criteria"),
  b4: tb("Riesgos previstos", "Foreseen risks"),
  b5: tb("Brechas no previstas", "Unforeseen gaps"),
  b6: tb("Supuestos", "Assumptions"),
  b7: tb("Casos ejemplares", "Example cases"),
  b8: tb(
    "Lo que el playground permite explorar",
    "What the playground lets you explore",
  ),
  b9: tb("Ficha de reproducibilidad", "Reproducibility record"),
};

export const RESUMEN = {
  porque: tb(
    "El porqué del veredicto, renglón por renglón, está arriba: «Lo que falló».",
    "The reason for the verdict, row by row, is above: “What failed”.",
  ),
  destacados: tb(
    "Los tres criterios más relevantes",
    "The three most relevant criteria",
  ),
  id: tb("Id", "Id"),
  criterio: tb("Criterio", "Criterion"),
  medido: tb("Medido", "Measured"),
  estado: tb("Estado", "Status"),
  ningunRiesgo: ((n: number) =>
    tb(
      `Riesgos que ocurrieron: ninguno de los ${n}.`,
      `Risks that occurred: none of the ${n}.`,
    )) as Plantilla<number>,
  riesgosOcurridos: ((ids: string) =>
    tb(
      `Riesgos que ocurrieron: ${ids}.`,
      `Risks that occurred: ${ids}.`,
    )) as Plantilla<string>,
  si: tb("sí", "yes"),
  no: tb("no", "no"),
};

export const PLAN_EN_BREVE = {
  flujo: ((p: { n: number; corrieron: number }) =>
    tb(
      `El flujo, en ${p.n} pasos (${p.corrieron === p.n ? `los ${p.n} corrieron` : `${p.corrieron} corrieron`})`,
      `The flow, in ${p.n} steps (${p.corrieron === p.n ? `all ${p.n} ran` : `${p.corrieron} ran`})`,
    )) as Plantilla<{ n: number; corrieron: number }>,
  unaVia: tb(
    "Decisiones de una sola vía: no se pueden deshacer",
    "One-way decisions: they cannot be undone",
  ),
  otras: ((n: number) =>
    tb(
      `Las otras ${n} decisiones son de dos vías: se pueden revertir si la medida lo pide.`,
      `The other ${n} decisions are two-way: they can be reversed if the measurement calls for it.`,
    )) as Plantilla<number>,
};

export const CRITERIOS = {
  chip: ((p: { n: number; k: number }) =>
    tb(
      `real · ${p.n} casos × ${p.k} corridas`,
      `real · ${p.n} cases × ${p.k} runs`,
    )) as Plantilla<{ n: number; k: number }>,
  lectura: ((p: {
    n: number;
    cumplen: number;
    exigente: string | null;
    k: number;
  }) =>
    tb(
      `Cada criterio es una promesa del plan con su regla de medición. ${p.cumplen === p.n ? `Los ${p.n} se cumplieron` : `Se cumplieron ${p.cumplen} de ${p.n}`}${p.exigente ? `; el más exigente, ${p.exigente}, tenía que cumplirse en las ${p.k} corridas seguidas` : ""}.`,
      `Each criterion is a promise of the plan with its measurement rule. ${p.cumplen === p.n ? `All ${p.n} were met` : `${p.cumplen} of ${p.n} were met`}${p.exigente ? `; the most demanding, ${p.exigente}, had to be met in the ${p.k} runs in a row` : ""}.`,
    )) as Plantilla<{
    n: number;
    cumplen: number;
    exigente: string | null;
    k: number;
  }>,
  columnas: {
    criterio: tb("Criterio", "Criterion"),
    regla: tb("y regla de medición", "and measurement rule"),
    medido: tb("Medido frente al objetivo", "Measured against the target"),
    veredicto: tb(
      "Veredicto y casos que incumplen",
      "Verdict and cases that miss it",
    ),
  },
  cumplen: tb("cumplen", "meet"),
  medido: tb("medido", "measured"),
  mediana: tb("mediana", "median"),
  promedio: tb("promedio", "mean"),
  maximo: tb("máximo", "maximum"),
  objetivo: tb("objetivo", "target"),
  todos: tb("todos", "all"),
  corridas: ((p: { k: number; de: number; n: number }) =>
    tb(
      `${p.k} de ${p.de} corridas · ${p.n} casos`,
      `${p.k} of ${p.de} runs · ${p.n} cases`,
    )) as Plantilla<{ k: number; de: number; n: number }>,
  fuera: ((n: number) =>
    tb(
      `${n} ${n === 1 ? "caso queda" : "casos quedan"} fuera: en ${n === 1 ? "él" : "ellos"} la señal que define la población no existe, porque el paso que la escribe no corrió.`,
      `${n} ${n === 1 ? "case is" : "cases are"} left out: the signal that defines the population does not exist for ${n === 1 ? "it" : "them"}, because the step that writes it did not run.`,
    )) as Plantilla<number>,
  unoAUno: ((p: { casos: string; valores: string }) =>
    tb(
      `Se mide sobre el agregado. Uno a uno, ${p.casos} pasó el objetivo: ${p.valores}.`,
      `It is measured on the aggregate. One by one, ${p.casos} went past the target: ${p.valores}.`,
    )) as Plantilla<{ casos: string; valores: string }>,
  noEvaluables: ((p: { n: number; casos: string }) =>
    tb(
      `${p.n} ${p.n === 1 ? "caso no se pudo" : "casos no se pudieron"} evaluar: ${p.casos}.`,
      `${p.n} ${p.n === 1 ? "case could" : "cases could"} not be evaluated: ${p.casos}.`,
    )) as Plantilla<{ n: number; casos: string }>,
};

export const RIESGOS = {
  chip: ((n: number) =>
    tb(
      `real · detectores sobre ${n} casos`,
      `real · detectors over ${n} cases`,
    )) as Plantilla<number>,
  lectura: ((p: { n: number; ocurridos: number }) =>
    tb(
      `Cada riesgo del plan trae su detector: una regla que busca el daño en las trazas. ${p.ocurridos === 0 ? `Ninguno de los ${p.n} ocurrió` : `Ocurri${p.ocurridos === 1 ? "ó" : "eron"} ${p.ocurridos} de los ${p.n}`}. La prioridad de acción ordena por gravedad primero (AIAG-VDA); el RPN queda como dato secundario.`,
      `Every risk in the plan carries its detector: a rule that looks for the harm in the traces. ${p.ocurridos === 0 ? `None of the ${p.n} occurred` : `${p.ocurridos} of the ${p.n} occurred`}. Action priority ranks severity first (AIAG-VDA); the RPN stays as a secondary figure.`,
    )) as Plantilla<{ n: number; ocurridos: number }>,
  columnas: {
    modo: tb(
      "Modo de falla y su detector en las trazas",
      "Failure mode and its detector in the traces",
    ),
    prioridad: tb("Prioridad de acción", "Action priority"),
    corrida: tb("En la corrida", "In the run"),
  },
  ocurreSi: tb("ocurre si", "occurs if"),
  efecto: tb("Efecto", "Effect"),
  causa: tb("causa", "cause"),
  construido: tb(
    "¿Está construido lo que el plan exige?",
    "Is what the plan requires built?",
  ),
  construidoNota: ((p: {
    n: number;
    todos: boolean;
    extractor: number | null;
    aclaraciones: number;
  }) =>
    tb(
      `${p.todos ? `Los ${p.n} nodos del contrato están en el grafo` : `No todos los ${p.n} nodos del contrato están en el grafo`}. Barras: visitas en la corrida${p.extractor !== null && p.aclaraciones > 0 ? ` (el extractor pasa ${p.extractor} veces porque ${p.aclaraciones} ${p.aclaraciones === 1 ? "caso pidió" : "casos pidieron"} aclaración)` : ""}.`,
      `${p.todos ? `All ${p.n} contract nodes are in the graph` : `Not all ${p.n} contract nodes are in the graph`}. Bars: visits in the run${p.extractor !== null && p.aclaraciones > 0 ? ` (the extractor runs ${p.extractor} times because ${p.aclaraciones} ${p.aclaraciones === 1 ? "case" : "cases"} asked for clarification)` : ""}.`,
    )) as Plantilla<{
    n: number;
    todos: boolean;
    extractor: number | null;
    aclaraciones: number;
  }>,
  senalesYPausas: ((p: {
    a: number;
    b: number;
    casos: number;
    registradas: number;
    rol: string;
    spike: number | null;
    nodos: number;
  }) =>
    tb(
      `Señales obligatorias: ${p.a} de ${p.b} en todas las trazas. Pausas humanas: ${p.casos} casos, ${p.registradas} registradas, rol ${p.rol}.${p.spike !== null ? ` El spike de la pantalla Agente tenía ${p.spike} de estos ${p.nodos} nodos.` : ""}`,
      `Mandatory signals: ${p.a} of ${p.b} in every trace. Human pauses: ${p.casos} cases, ${p.registradas} recorded, role ${p.rol}.${p.spike !== null ? ` The Agent screen’s spike had ${p.spike} of these ${p.nodos} nodes.` : ""}`,
    )) as Plantilla<{
    a: number;
    b: number;
    casos: number;
    registradas: number;
    rol: string;
    spike: number | null;
    nodos: number;
  }>,
  otroLenguaje: tb(
    "¿El plan decide lo mismo en otro lenguaje?",
    "Does the plan decide the same in another language?",
  ),
  otroLenguajeLectura: ((p: {
    decisiones: number;
    corridas: number;
    diferencias: number;
  }) =>
    tb(
      `Cada decisión del agente se rehízo en TypeScript con la regla del plan: ${p.decisiones} decisiones en ${p.corridas} corridas, ${p.diferencias === 0 ? "cero diferencias. Por eso el playground no puede mentir sobre el grafo." : `${p.diferencias} diferencias.`}`,
      `Every decision the agent took was redone in TypeScript with the plan’s rule: ${p.decisiones} decisions in ${p.corridas} runs, ${p.diferencias === 0 ? "zero differences. That is why the playground cannot lie about the graph." : `${p.diferencias} differences.`}`,
    )) as Plantilla<{
    decisiones: number;
    corridas: number;
    diferencias: number;
  }>,
  rf: {
    corrida: tb("Corrida", "Run"),
    variante: tb("Variante", "Variant"),
    decisiones: tb("Decisiones", "Decisions"),
    diferencias: tb("Diferencias", "Differences"),
    huella: tb("Misma huella", "Same fingerprint"),
    si: tb("Sí", "Yes"),
    no: tb("No", "No"),
  },
};

export const VARIANTE: Record<string, TextoBilingue> = {
  multiagente: tb("multiagente", "multi-agent"),
  agente_unico: tb("agente único", "single agent"),
};

export const BRECHAS = {
  chip: ((n: number) =>
    tb(`real · ${n} corridas`, `real · ${n} runs`)) as Plantilla<number>,
  lectura: ((p: { n: number; categorias: number; lectura: string | null }) =>
    tb(
      p.n === 0
        ? "Fallas que aparecen en las trazas y que ningún riesgo del plan detectó. En esta corrida no hubo ninguna."
        : `Fallas que aparecen en las trazas y que ningún riesgo del plan detectó.${p.categorias === 1 && p.lectura ? ` ${p.n === 1 ? "Es una" : `Las ${p.n} son la misma`}: ${p.lectura}, con su costo. El plan puede sumarla como riesgo.` : ""}`,
      p.n === 0
        ? "Failures that show up in the traces and that no risk in the plan detected. There were none in this run."
        : `Failures that show up in the traces and that no risk in the plan detected.${p.categorias === 1 && p.lectura ? ` ${p.n === 1 ? "It is one" : `All ${p.n} are the same`}: ${p.lectura}, with its cost. The plan can add it as a risk.` : ""}`,
    )) as Plantilla<{ n: number; categorias: number; lectura: string | null }>,
  columnas: {
    caso: tb("Caso", "Case"),
    corrida: tb("Corrida", "Run"),
    donde: tb("Dónde", "Where"),
    reintentos: tb("Reintentos", "Retries"),
    paso: tb("Qué pasó", "What happened"),
  },
  principal: tb("principal", "main"),
  pasoN: tb("paso", "step"),
  evaluadores: tb("Evaluadores", "Evaluators"),
  ev: {
    evaluador: tb("Evaluador", "Evaluator"),
    tipo: tb("Tipo", "Type"),
    estado: tb("Estado", "Status"),
    casos: tb("Casos", "Cases"),
    fallas: tb("Fallas", "Failures"),
    noEvaluables: tb("No evaluables", "Not evaluable"),
    riesgos: tb("Riesgos que cubre", "Risks it covers"),
  },
};

/** La lectura de una categoría de brecha para la frase de § 5 (la misma de la frase del veredicto, sin la cifra). */
export const CATEGORIA_LECTURA: Record<string, TextoBilingue> = {
  reintento_de_esquema: tb(
    "el modelo no devolvió el formato pedido a la primera y hubo que repetir la llamada",
    "the model did not return the requested format on the first try and the call had to be repeated",
  ),
};

export const TIPO_EVALUADOR: Record<string, TextoBilingue> = {
  regla: tb("regla", "rule"),
  juez_modelo: tb("juez con modelo", "model judge"),
  humano: tb("persona", "person"),
};

export const ESTADO_EVALUADOR: Record<string, TextoBilingue> = {
  ejecutado: tb("ejecutado", "run"),
  no_ejecutado_opcional: tb(
    "no corrió (opcional en este corte)",
    "did not run (optional in this cut)",
  ),
  no_ejecutado: tb("no corrió", "did not run"),
  sin_implementacion: tb("sin implementación", "not implemented"),
  mal_formado: tb("no pudo medir", "could not measure"),
};

export const SUPUESTOS = {
  lectura: tb(
    "Los supuestos son lo que el plan dio por cierto sin haberlo probado. Cada uno trae una prueba barata; el verificador la corre y dice si se confirmó, se refutó o quedó sin probar.",
    "Assumptions are what the plan took as true without having tested it. Each comes with a cheap test; the verifier runs it and says whether it was confirmed, refuted or left untested.",
  ),
  /** La lectura llana de lo que salió de cada supuesto, por id y estado. */
  dio: {
    "S1:sin_probar": ((n: number) =>
      tb(
        `La prueba pedía medir si la confianza del modelo separa aciertos de errores. El modelo acertó los ${n} casos: sin errores, esa medida no existe y el supuesto queda abierto.`,
        `The test asked whether the model’s confidence separates hits from errors. The model got all ${n} cases right: with no errors, that measure does not exist and the assumption stays open.`,
      )) as Plantilla<number>,
    "S3:refutado": ((p: {
      exactitud: string;
      exactitudBase: string;
      latencia: string;
      latenciaBase: string;
    }) =>
      tb(
        `El plan suponía que repartir el trabajo entre varios agentes no rendiría peor que uno solo. Acertó más (${p.exactitud} frente a ${p.exactitudBase}) pero tardó más (${p.latencia} frente a ${p.latenciaBase}), y el plan solo tolera la misma demora: refutado.`,
        `The plan assumed that splitting the work among several agents would do no worse than one. It got more right (${p.exactitud} against ${p.exactitudBase}) but took longer (${p.latencia} against ${p.latenciaBase}), and the plan only tolerates the same delay: refuted.`,
      )) as Plantilla<{
      exactitud: string;
      exactitudBase: string;
      latencia: string;
      latenciaBase: string;
    }>,
    "S2:confirmado": ((p: { n: number; u: number }) =>
      tb(
        `Los ${p.n} casos con datos faltantes que recibieron respuesta se cerraron en ${p.u} aclaraciones o menos.`,
        `The ${p.n} cases with missing data that got an answer were closed in ${p.u} clarifications or fewer.`,
      )) as Plantilla<{ n: number; u: number }>,
  } as Record<string, (p: never) => TextoBilingue>,
  noExiste: tb(
    "no existe: no hubo errores",
    "does not exist: there were no errors",
  ),
  pide: ((v: string) =>
    tb(`el plan pide ${v}`, `the plan asks ${v}`)) as Plantilla<string>,
  frente: tb("frente a", "against"),
  regla: tb("Regla", "Rule"),
  reglaComparacion: tb(
    "exactitud ≥ y latencia ≤ la de la línea base",
    "accuracy ≥ and latency ≤ the baseline’s",
  ),
  exactitud: tb("Exactitud", "Accuracy"),
  tasa: tb("Tasa", "Rate"),
  latencia: tb("Latencia mediana", "Median latency"),
  leyendaMulti: tb("multiagente (el plan)", "multi-agent (the plan)"),
  leyendaUnico: tb("agente único (línea base)", "single agent (baseline)"),
  filas: {
    exactitud: {
      t: tb("Casos resueltos bien", "Cases solved correctly"),
      n: tb("mejor: más", "better: higher"),
    },
    latencia: {
      t: tb("Latencia mediana", "Median latency"),
      n: tb("mejor: menos", "better: lower"),
    },
    llamadas: {
      t: tb("Llamadas al modelo", "Model calls"),
      n: tb("con reintentos", "with retries"),
    },
    tokens: { t: tb("Tokens", "Tokens"), n: null },
    costo: {
      t: tb("Costo nominal", "Nominal cost"),
      n: tb("US$, sin facturar", "US$, not billed"),
    },
  },
  difieren: ((p: { casos: string; cupo: boolean }) =>
    tb(
      `Casos donde difieren: ${p.casos}. ${p.cupo ? "El presupuesto de la línea base cupo dentro del multiagente." : "La línea base gastó más que el multiagente."}`,
      `Cases where they differ: ${p.casos}. ${p.cupo ? "The baseline budget fit within the multi-agent one." : "The baseline spent more than the multi-agent run."}`,
    )) as Plantilla<{ casos: string; cupo: boolean }>,
  chipComparacion: ((p: { v: string; base: string }) =>
    tb(
      `real · ${p.v} y ${p.base}`,
      `real · ${p.v} and ${p.base}`,
    )) as Plantilla<{ v: string; base: string }>,
  cerrados: ((p: { a: number; b: number }) =>
    tb(`${p.a} de ${p.b}`, `${p.a} of ${p.b}`)) as Plantilla<{
    a: number;
    b: number;
  }>,
  cerradosNota: ((u: number) =>
    tb(
      `cerrados en ≤ ${u} aclaraciones`,
      `closed in ≤ ${u} clarifications`,
    )) as Plantilla<number>,
  pideElPlan: tb("lo que pide el plan", "what the plan asks"),
  curvaPie: ((n: number) =>
    tb(
      `Riesgo 0 % en todo el rango: los ${n} casos medidos fueron aciertos. n = ${n}.`,
      `Risk 0% across the range: all ${n} measured cases were correct. n = ${n}.`,
    )) as Plantilla<number>,
  curvaPieConRiesgo: ((n: number) =>
    tb(
      `Riesgo entre los casos que resuelve solo, por valor de U1. n = ${n}.`,
      `Risk among the cases it resolves alone, by value of U1. n = ${n}.`,
    )) as Plantilla<number>,
  chipCurva: ((v: string) =>
    tb(`real · ${v}`, `real · ${v}`)) as Plantilla<string>,
};

export const EJEMPLARES = {
  chip: ((v: string) => tb(`real · ${v}`, `real · ${v}`)) as Plantilla<string>,
  lectura: tb(
    "Cuatro casos que cuentan la corrida: uno que salió bien solo, uno que pasó por una persona como debía, uno que falló y uno que intentó engañar al agente.",
    "Four cases that tell the run: one that went well on its own, one that went through a person as it should, one that failed and one that tried to fool the agent.",
  ),
  rol: {
    exitoso: tb("Exitoso", "Successful"),
    escalado_correctamente: tb("Escalado como debía", "Escalated as it should"),
    fallido: tb("Fallido", "Failed"),
    adversario_neutralizado: tb(
      "Adversario neutralizado",
      "Adversary neutralized",
    ),
  } as Record<string, TextoBilingue>,
  ninguno: tb("Ninguno en esta corrida", "None in this run"),
  ningunoTexto: tb(
    "Ningún caso terminó mal. El informe lo diría aquí; no se inventa uno para llenar el hueco.",
    "No case ended badly. The report would say so here; one is not made up to fill the gap.",
  ),
  decisionFinal: tb("decisión final", "final decision"),
  conPersona: tb("con persona", "with a person"),
  sinPersona: tb("sin persona", "without a person"),
  traza: tb("Traza completa, paso a paso", "Full trace, step by step"),
  cadena: ((id: string) =>
    tb(`Recorrido de ${id}`, `Path of ${id}`)) as Plantilla<string>,
};

export const PLAYGROUND = {
  lectura: ((n: number) =>
    tb(
      `Los ${n} umbrales del plan se pueden mover sobre estas mismas trazas. El playground rehace las decisiones con la misma regla y declara lo que no puede saber.`,
      `The plan’s ${n} thresholds can be moved over these same traces. The playground redoes the decisions with the same rule and declares what it cannot know.`,
    )) as Plantilla<number>,
  columnas: {
    umbral: tb("Umbral", "Threshold"),
    regla: tb("Regla", "Rule"),
    rango: tb("Rango jugable", "Playable range"),
    observado: tb(
      "Observado: mín · mediana · máx",
      "Observed: min · median · max",
    ),
    justo: tb("Justo en el umbral", "Right at the threshold"),
  },
  rango: ((p: { min: string; max: string }) =>
    tb(`${p.min} a ${p.max}`, `${p.min} to ${p.max}`)) as Plantilla<{
    min: string;
    max: string;
  }>,
  siNo: tb("sí / no", "yes / no"),
  verdaderos: ((p: { a: number; b: number }) =>
    tb(`${p.a} de ${p.b} verdaderos`, `${p.a} of ${p.b} true`)) as Plantilla<{
    a: number;
    b: number;
  }>,
  limites: tb(
    "Sus límites, dichos por el informe",
    "Its limits, as the report states them",
  ),
  abrir: tb("Abrir el playground", "Open the playground"),
};

export const FICHA = {
  lectura: tb(
    "Todo lo que hace falta para volver a obtener este mismo informe, byte a byte. Sin enlaces: las huellas bastan para comprobar que corresponde a estas trazas.",
    "Everything needed to obtain this same report again, byte for byte. No links: the fingerprints are enough to check it matches these traces.",
  ),
  titulo: tb("Ficha de reproducibilidad", "Reproducibility record"),
  plan: tb("Plan", "Plan"),
  casos: tb("Casos", "Cases"),
  corrida: tb("Corrida", "Run"),
  grafo: tb("Grafo", "Graph"),
  repeticion: tb("Repetición", "Repetition"),
  lineaBase: tb("Línea base", "Baseline"),
  ejecucion: tb("Ejecución", "Execution"),
  umbrales: tb("Umbrales aplicados", "Applied thresholds"),
  revision: tb("Revisión humana", "Human review"),
  verificador: tb("Verificador", "Verifier"),
  huella: tb("Huella de este informe", "This report’s fingerprint"),
  semilla: tb("semilla", "seed"),
  suscripcion: tb("suscripción", "subscription"),
  ejecucionValor: ((p: {
    sesiones: number;
    casos: number;
    errores: number;
    limites: number;
  }) =>
    tb(
      `${p.sesiones} ${p.sesiones === 1 ? "sesión" : "sesiones"} · ${p.casos} casos · ${p.errores} errores del proveedor · ${p.limites} límites de uso`,
      `${p.sesiones} ${p.sesiones === 1 ? "session" : "sessions"} · ${p.casos} cases · ${p.errores} provider errors · ${p.limites} usage limits`,
    )) as Plantilla<{
    sesiones: number;
    casos: number;
    errores: number;
    limites: number;
  }>,
  losDelPlan: tb("los del plan", "the plan’s"),
  distintosDelPlan: tb(
    "distintos de los del plan",
    "different from the plan’s",
  ),
};
