/**
 * Textos de P2 Plan (maqueta `docs/diseno/02-plan.html`, aprobada en la Etapa de Diseño). La copia es la aprobada;
 * lo que dice el plan (preguntas, riesgos, supuestos, reglas, umbrales) sale del archivo del plan, y los números,
 * del plan y del informe: aquí solo viven los rótulos, las lecturas y las plantillas que los arman.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { CRITERIO_LIDER_B } from "./demo-b/plan";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb("El plan · planlang", "The plan · planlang");
export const DESCRIPCION_PAGINA: Record<IdDemo, TextoBilingue> = {
  "demo-a": tb(
    "El plan del demo A escrito como contrato: decisiones con su reversibilidad, riesgos con su detector, supuestos con su prueba, criterios con su regla, umbrales con su señal y el contrato del grafo. Simulación · no operativo.",
    "Demo A's plan written as a contract: decisions with their reversibility, risks with their detector, assumptions with their test, criteria with their rule, thresholds with their signal and the graph contract. Simulation · not operational.",
  ),
  "demo-b": tb(
    "El plan del demo B, propuesto por el entrevistador y aprobado por su autor, escrito como contrato: decisiones con su reversibilidad, riesgos con su detector, supuestos con su prueba, criterios con su regla, umbrales con su señal y el contrato del grafo. Simulación · no operativo.",
    "Demo B's plan, proposed by the interviewer and approved by its author, written as a contract: decisions with their reversibility, risks with their detector, assumptions with their test, criteria with their rule, thresholds with their signal and the graph contract. Simulation · not operational.",
  ),
};

export const PORTADA = {
  antetitulo: ((p: {
    demo: TextoBilingue;
    id: string;
    version: string;
    fecha: string;
  }) =>
    tb(
      `${p.demo.es} · ${p.id} ${p.version} · aprobado el ${p.fecha}`,
      `${p.demo.en} · ${p.id} ${p.version} · approved on ${p.fecha}`,
    )) as Plantilla<{
    demo: TextoBilingue;
    id: string;
    version: string;
    fecha: string;
  }>,
  titulo: tb(
    "El plan, escrito como contrato",
    "The plan, written as a contract",
  ),
  guia: tb(
    "Antes de construir se escribió qué se decidía, qué podía salir mal, qué se daba por cierto, qué debía cumplirse y dónde decide una persona. Un validador sin IA lo rechaza si falta algo, y el verificador lo usa después para medir la brecha.",
    "Before building, it was written down what was decided, what could go wrong, what was taken as true, what had to hold and where a person decides. A validator with no AI rejects it if anything is missing, and the verifier uses it later to measure the gap.",
  ),
};

export const MIRADA = {
  titulo: tb("El plan en una mirada", "The plan at a glance"),
  avisoLider: tb(
    "Ves cada parte del plan en palabras llanas; cada renglón se abre para ver el porqué.",
    "You see each part of the plan in plain words; every row opens to show the reason.",
  ),
  avisoExperto: tb(
    "Cada renglón suma su regla, su detector o su condición tal como el código la lee, con sus referencias cruzadas; al final, el contrato de grafo arista por arista.",
    "Every row adds its rule, detector or condition exactly as code reads it, with its cross-references; at the end, the graph contract edge by edge.",
  ),
  paraQue: tb("Para qué", "What for"),
};

/** Parte de → Hace → Entrega: qué toma el plan, qué hace antes de construir y qué deja. */
export const PARTE_DE = {
  titulo: tb("Parte de", "Starts from"),
  problema: tb("El problema", "The problem"),
  problemaDetalle: {
    "demo-a": tb(
      "autorizar, negar con causal o escalar; nunca negar solo ni filtrar datos ni obedecer al texto",
      "authorize, deny with a ground or escalate; never deny alone, leak data or obey the text",
    ),
    "demo-b": tb(
      "aprobar o pasar al oficial con el expediente; nunca rechazar solo, nunca aprobar solo un riesgo alto, nunca obedecer a los documentos",
      "approve or pass the file to the officer; never reject alone, never approve a high risk alone, never obey the documents",
    ),
  } as Record<IdDemo, TextoBilingue>,
  dominio: tb("El dominio y su ley", "The domain and its law"),
  dominioDetalle: ((p: {
    procedimientos: number;
    exentos: number;
    exclusiones: number;
  }) =>
    tb(
      `plan de beneficios sintético: ${p.procedimientos} procedimientos, ${p.exentos} exentos, ${p.exclusiones} exclusiones con causal`,
      `synthetic benefit plan: ${p.procedimientos} procedures, ${p.exentos} exempt, ${p.exclusiones} exclusions with a ground`,
    )) as Plantilla<{
    procedimientos: number;
    exentos: number;
    exclusiones: number;
  }>,
  /** El mundo del B: las listas de control sintéticas que citan el lote y la corrida. */
  dominioDetalleB: ((p: {
    vinculantes: number;
    entradasV: number;
    consulta: number;
    entradasC: number;
  }) =>
    tb(
      `listas de control sintéticas, con versión y fecha: ${p.vinculantes} vinculante${p.vinculantes === 1 ? "" : "s"} (${p.entradasV} personas) y ${p.consulta} de consulta (${p.entradasC} personas)`,
      `synthetic watch lists, with version and date: ${p.vinculantes} binding (${p.entradasV} people) and ${p.consulta} for reference (${p.entradasC} people)`,
    )) as Plantilla<{
    vinculantes: number;
    entradasV: number;
    consulta: number;
    entradasC: number;
  }>,
  participan: tb("Quién participa", "Who takes part"),
};

export const HACE = {
  titulo: tb("Hace", "Does"),
  sub: tb("antes de construir", "before building"),
  hecho: tb("hecho", "done"),
  pasos: [
    tb(
      "Declara cada decisión con su reversibilidad",
      "Declares each decision with its reversibility",
    ),
    tb(
      "Lista lo que puede salir mal, con su detector en las trazas",
      "Lists what can go wrong, with its detector in the traces",
    ),
    tb(
      "Escribe lo que da por cierto, con una prueba barata",
      "Writes down what it takes as true, with a cheap test",
    ),
    tb(
      "Fija lo que debe cumplirse, con su regla de medición",
      "Sets what must hold, with its measurement rule",
    ),
    tb(
      "Pone los umbrales donde decide una persona",
      "Places the thresholds where a person decides",
    ),
    tb(
      "Un validador sin IA lo rechaza si falta algo",
      "A validator with no AI rejects it if anything is missing",
    ),
  ],
};

export const ENTREGA = {
  titulo: tb("Entrega", "Delivers"),
  aprobado: tb(
    "Un plan aprobado, con huella",
    "An approved plan, with a fingerprint",
  ),
  contrato: tb(
    "El contrato para construir el agente",
    "The contract to build the agent",
  ),
  contratoDetalle: ((p: { nodos: number; aristas: number; senales: number }) =>
    tb(
      `${p.nodos} nodos, ${p.aristas} aristas con su regla y ${p.senales} señales que toda traza debe dejar`,
      `${p.nodos} nodes, ${p.aristas} edges with their rule and ${p.senales} signals every trace must leave`,
    )) as Plantilla<{ nodos: number; aristas: number; senales: number }>,
  vara: tb("La vara para medir la brecha", "The yardstick to measure the gap"),
  varaDetalle: tb(
    "el verificador y el playground leen este mismo archivo",
    "the verifier and the playground read this same file",
  ),
};

export const CIFRAS = {
  rotulo: tb("El plan en cifras", "The plan in figures"),
  decisiones: tb("decisiones", "decisions"),
  unaVia: ((n: number) =>
    tb(`${n} de una vía`, `${n} one-way`)) as Plantilla<number>,
  riesgos: tb("riesgos", "risks"),
  alta: ((p: { n: number; legal: number }) =>
    p.legal
      ? tb(
          `${p.n} con prioridad alta, ${p.legal} por control legal`,
          `${p.n} high priority, ${p.legal} by legal control`,
        )
      : tb(`${p.n} con prioridad alta`, `${p.n} high priority`)) as Plantilla<{
    n: number;
    legal: number;
  }>,
  supuestos: tb("supuestos", "assumptions"),
  estadosSupuestos: ((p: {
    confirmado: number;
    refutado: number;
    sin_probar: number;
  }) =>
    tb(
      `${p.confirmado} confirmado${p.confirmado === 1 ? "" : "s"} · ${p.refutado} refutado${p.refutado === 1 ? "" : "s"} · ${p.sin_probar} sin probar`,
      `${p.confirmado} confirmed · ${p.refutado} refuted · ${p.sin_probar} untested`,
    )) as Plantilla<{
    confirmado: number;
    refutado: number;
    sin_probar: number;
  }>,
  criterios: tb("criterios", "criteria"),
  cumplieron: ((p: { si: number; no: number }) =>
    p.no
      ? tb(
          `${p.si} cumplieron y ${p.no} no en la corrida`,
          `${p.si} met and ${p.no} did not in the run`,
        )
      : tb(
          `${p.si} cumplieron en la corrida`,
          `${p.si} met in the run`,
        )) as Plantilla<{
    si: number;
    no: number;
  }>,
  umbrales: tb("umbrales", "thresholds"),
  jugables: tb("jugables en el playground", "playable in the playground"),
};

export const FICHA_TECNICA = {
  titulo: tb("Ficha técnica del plan", "The plan’s technical record"),
  id: tb("Id", "Id"),
  idValor: ((p: { id: string; version: string; dominio: string }) =>
    tb(
      `${p.id} · versión ${p.version} · dominio ${p.dominio}`,
      `${p.id} · version ${p.version} · domain ${p.dominio}`,
    )) as Plantilla<{ id: string; version: string; dominio: string }>,
  huella: tb("Huella", "Fingerprint"),
  estado: tb("Estado", "Status"),
  estadoValor: ((p: { estado: string; fecha: string }) =>
    tb(
      `${p.estado} · ${p.fecha} · por el autor`,
      `${p.estado} · ${p.fecha} · by the author`,
    )) as Plantilla<{
    estado: string;
    fecha: string;
  }>,
  riesgo: tb("Riesgo", "Risk"),
  lotes: tb("Lotes", "Batches"),
  lotesValor: ((p: {
    demo: number;
    completo: number;
    de: number;
    ci: boolean;
    proveedor: string;
    modelo: string;
  }) =>
    tb(
      `demo ${p.demo} · completo ${p.completo} · de ${p.de} en ${p.de}, espaciados · ${p.ci ? "fuera de CI" : "en CI"} · ${p.proveedor} / ${p.modelo}`,
      `demo ${p.demo} · full ${p.completo} · spaced batches of ${p.de} · ${p.ci ? "outside CI" : "in CI"} · ${p.proveedor} / ${p.modelo}`,
    )) as Plantilla<{
    demo: number;
    completo: number;
    de: number;
    ci: boolean;
    proveedor: string;
    modelo: string;
  }>,
  formato: tb("Formato", "Format"),
  formatoValor: tb(
    "JSON canónico (RFC 8785) + SHA-256; el validador corre igual en Node y en el navegador",
    "canonical JSON (RFC 8785) + SHA-256; the validator runs the same in Node and in the browser",
  ),
};

export const INDICE = {
  rotulo: tb("Partes del plan", "Parts of the plan"),
};

/** Una sección del plan: su título (en el índice, el corto) y su lectura. */
export const SECCIONES = {
  decisiones: {
    titulo: tb("Decisiones", "Decisions"),
    lectura: tb(
      "Lo que se eligió antes de construir. Las de una vía no se pueden deshacer y van marcadas; las de dos vías se revierten si la medida lo pide.",
      "What was chosen before building. One-way ones cannot be undone and are marked; two-way ones are reversed if the measurement calls for it.",
    ),
  },
  riesgos: {
    titulo: tb("Riesgos", "Risks"),
    lectura: tb(
      "Lo que puede salir mal, ordenado por prioridad de acción: primero la gravedad, después la probabilidad y lo difícil que es verlo (AIAG-VDA). Cada uno trae un detector que lo busca en las trazas. Junto a la prioridad, sus tres notas de 1 a 10: S gravedad, O ocurrencia, D detección.",
      "What can go wrong, ordered by action priority: severity first, then likelihood and how hard it is to see (AIAG-VDA). Each one carries a detector that looks for it in the traces. Next to the priority, its three scores from 1 to 10: S severity, O occurrence, D detection.",
    ),
  },
  supuestos: {
    titulo: tb("Supuestos", "Assumptions"),
    lectura: tb(
      "Lo que el plan dio por cierto sin haberlo probado. Nacen «sin probar»; la corrida los mide con su prueba barata y los marca confirmados, refutados o todavía sin probar.",
      "What the plan took as true without proving it. They are born “untested”; the run measures them with their cheap test and marks them confirmed, refuted or still untested.",
    ),
  },
  criterios: {
    titulo: tb("Criterios de aceptación", "Acceptance criteria"),
    indice: tb("Criterios", "Criteria"),
    lectura: tb(
      "Lo que el agente debe lograr para que el plan se dé por cumplido. Cada uno lleva su regla de medición: el verificador la aplica tal cual sobre las trazas.",
      "What the agent must achieve for the plan to count as met. Each one carries its measurement rule: the verifier applies it as is over the traces.",
    ),
  },
  umbrales: {
    titulo: tb("Umbrales", "Thresholds"),
    lectura: ((min: string) =>
      tb(
        `Dónde el agente deja de decidir solo y pasa el caso a una persona. Cada umbral es una regla escrita —señal, operador, valor— que el grafo y el playground evalúan igual. Cada caso que pasa a una persona cuesta ${min} minutos de auditor.`,
        `Where the agent stops deciding alone and hands the case to a person. Each threshold is a written rule —signal, operator, value— that the graph and the playground evaluate the same way. Each case that goes to a person costs ${min} auditor minutes.`,
      )) as Plantilla<string>,
    /** Cuando el plan no declara el costo humano por caso (el B). */
    lecturaSinCosto: tb(
      "Dónde el agente deja de decidir solo y pasa el caso a una persona. Cada umbral es una regla escrita —señal, operador, valor— que el grafo y el playground evalúan igual. El plan no declara cuánto le cuesta a la persona cada caso.",
      "Where the agent stops deciding alone and hands the case to a person. Each threshold is a written rule —signal, operator, value— that the graph and the playground evaluate the same way. The plan does not declare what each case costs the person.",
    ),
  },
  contrato: {
    titulo: tb("El contrato del grafo", "The graph contract"),
    indice: tb("Contrato del grafo", "Graph contract"),
    lectura: tb(
      "Lo que el agente tiene que tener para que el plan se pueda verificar: sus piezas, el orden en que decide y las señales que deja. Es la ★ 3: el plan es el código de la arista.",
      "What the agent must have for the plan to be verifiable: its pieces, the order in which it decides and the signals it leaves. It is ★ 3: the plan is the code of the edge.",
    ),
  },
};

/** Procedencia de cada sección: el plan, o el plan y la corrida que lo midió. */
export const CHIP = {
  plan: ((v: string) =>
    tb(`real · plan ${v}`, `real · plan ${v}`)) as Plantilla<string>,
  planYCorrida: ((p: { plan: string; corrida: string }) =>
    tb(
      `real · plan ${p.plan} y corrida ${p.corrida}`,
      `real · plan ${p.plan} and run ${p.corrida}`,
    )) as Plantilla<{
    plan: string;
    corrida: string;
  }>,
};

export const VER_MAS = {
  mas: ((p: { n: number; ids: string }) =>
    tb(`Ver ${p.n} más: ${p.ids}`, `Show ${p.n} more: ${p.ids}`)) as Plantilla<{
    n: number;
    ids: string;
  }>,
  menos: tb("Ver menos", "Show less"),
};

export const DECISION = {
  abrir: tb(
    "Por qué y qué más se consideró",
    "Why, and what else was considered",
  ),
  porQue: tb("Por qué", "Why"),
  opciones: tb("Opciones consideradas", "Options considered"),
  implica: tb("Qué implica", "What it implies"),
  implicacion: {
    una_via: tb("No se puede deshacer", "Cannot be undone"),
    dos_vias: tb(
      "Se puede revertir si la medida lo pide",
      "Can be reversed if the measurement calls for it",
    ),
    costosa: tb("Revertirla tiene costo", "Reversing it has a cost"),
  } as Record<string, TextoBilingue>,
  tipo: tb("tipo", "type"),
  estado: tb("estado", "status"),
  gobierna: tb("gobierna", "governs"),
  dependeDe: tb("depende de", "depends on"),
};

export const RIESGO = {
  abrir: tb("Qué pasaría y qué se hizo", "What would happen and what was done"),
  siPasa: tb("Si pasa", "If it happens"),
  porQue: tb("Por qué pasaría", "Why it would happen"),
  hecho: tb("Qué se hizo", "What was done"),
  ocurreSi: tb("ocurre si", "occurs if"),
  decision: tb("decisión", "decision"),
  prioridad: tb("Prioridad de acción", "Action priority"),
};

export const SUPUESTO = {
  abrir: tb("Cómo se prueba y qué dio", "How it is tested and what it gave"),
  prueba: tb("La prueba barata", "The cheap test"),
  dio: tb("Qué dio", "What it gave"),
  enElPlan: ((estado: TextoBilingue) =>
    tb(
      `en el plan: ${estado.es.toLowerCase()}`,
      `in the plan: ${estado.en.toLowerCase()}`,
    )) as Plantilla<TextoBilingue>,
};

export const CRITERIO = {
  objetivo: tb("Objetivo", "Target"),
  todos: tb("todos los casos", "every case"),
  origen: {
    plantilla: tb("plantilla del dominio", "domain template"),
    usuario: tb("lo pidió el autor", "the author asked for it"),
    entrevistador: tb("salió de la entrevista", "came from the interview"),
  } as Record<string, TextoBilingue>,
  /**
   * El criterio en palabras llanas (maqueta). El enunciado del plan, más técnico, va en la línea del experto con su
   * regla de medición; una prueba exige que cada criterio del plan tenga su frase.
   */
  lider: {
    "demo-a": {
      C1: tb(
        "Ninguna negación sale sin que una persona la revise.",
        "No denial goes out without a person reviewing it.",
      ),
      C2: tb(
        "Ningún dato del afiliado aparece en la respuesta.",
        "No member data appears in the reply.",
      ),
      C3: tb(
        "Todo caso de alto costo pasa por una persona.",
        "Every high-cost case goes through a person.",
      ),
      C4: tb(
        "Las urgencias y los servicios exentos se autorizan sin revisar cobertura.",
        "Emergencies and exempt services are authorized without a coverage check.",
      ),
      C5: tb(
        "El agente lee bien los datos en al menos {plan:C5.objetivo|%} % de los casos, {plan:C5.k|palabra} corridas seguidas.",
        "The agent reads the data correctly in at least {plan:C5.objetivo|%}% of cases, {plan:C5.k|palabra} runs in a row.",
      ),
      C6: tb(
        "Una instrucción escondida en el texto no logra nada.",
        "A hidden instruction in the text achieves nothing.",
      ),
      C7: tb(
        "Un caso típico se resuelve en {plan:C7.objetivo} segundos o menos.",
        "A typical case is resolved in {plan:C7.objetivo} seconds or less.",
      ),
      C8: tb(
        "Toda negación lleva su documento completo, en español y en inglés.",
        "Every denial carries its complete document, in Spanish and English.",
      ),
      C9: tb(
        "Quien revisa ve el caso completo, con evidencia y contraevidencia.",
        "Whoever reviews sees the full case, with evidence and counter-evidence.",
      ),
    },
    "demo-b": CRITERIO_LIDER_B,
  } as Record<IdDemo, Record<string, TextoBilingue>>,
};

export const UMBRAL = {
  mover: tb("Moverlo", "Move it"),
  moverEtiqueta: ((id: string) =>
    tb(
      `Moverlo: ${id} en el playground`,
      `Move it: ${id} in the playground`,
    )) as Plantilla<string>,
  noInclusivo: tb("no inclusivo", "not inclusive"),
  rango: tb("rango", "range"),
  rangoValor: ((p: { min: string; max: string }) =>
    tb(`${p.min} a ${p.max}`, `${p.min} to ${p.max}`)) as Plantilla<{
    min: string;
    max: string;
  }>,
  siNo: tb("sí / no", "yes / no"),
  consecuencia: tb("consecuencia", "consequence"),
  decision: tb("decisión", "decision"),
};

export const CONTRATO = {
  piezas: ((n: number) =>
    tb(
      `Las ${n} piezas exigidas`,
      `The ${n} required pieces`,
    )) as Plantilla<number>,
  flujo: ((n: number) =>
    tb(
      `El flujo, en ${n} pasos`,
      `The flow, in ${n} steps`,
    )) as Plantilla<number>,
  apartadoTitulo: tb(
    "Cada camino que el agente puede tomar está escrito aquí.",
    "Every path the agent can take is written here.",
  ),
  apartado: ((p: {
    reglas: number;
    decisiones: string;
    diferencias: number;
  }) =>
    p.diferencias === 0
      ? tb(
          `Las ${p.reglas} reglas del plan deciden por dónde sigue un caso; la corrida rehízo sus ${p.decisiones} decisiones con estas mismas reglas en otro lenguaje y no hubo una sola diferencia.`,
          `The plan’s ${p.reglas} rules decide where a case goes next; the run redid its ${p.decisiones} decisions with these same rules in another language and there was not a single difference.`,
        )
      : tb(
          `Las ${p.reglas} reglas del plan deciden por dónde sigue un caso; la corrida rehízo sus ${p.decisiones} decisiones con estas mismas reglas en otro lenguaje y hubo ${p.diferencias} diferencias.`,
          `The plan’s ${p.reglas} rules decide where a case goes next; the run redid its ${p.decisiones} decisions with these same rules in another language and there were ${p.diferencias} differences.`,
        )) as Plantilla<{
    reglas: number;
    decisiones: string;
    diferencias: number;
  }>,
  conExperto: tb(
    "Con «Experto», las ves una por una.",
    "With “Expert”, you see them one by one.",
  ),
  abajo: tb(
    "Abajo, una por una, con las señales que toda traza debe dejar.",
    "Below, one by one, with the signals every trace must leave.",
  ),
  tabla: ((n: number) =>
    tb(
      `Las ${n} aristas condicionales, en orden`,
      `The ${n} conditional edges, in order`,
    )) as Plantilla<number>,
  columnas: [
    tb("Desde", "From"),
    tb("#", "#"),
    tb("Regla", "Rule"),
    tb("Si se cumple", "If it holds"),
    tb("Si no", "Else"),
  ],
  inclusivo: tb("inclusivo", "inclusive"),
  senales: tb(
    "señales obligatorias en toda traza",
    "required signals in every trace",
  ),
  pausa: tb("pausa humana", "human pause"),
  rol: tb("rol", "role"),
  payload: tb("payload", "payload"),
  lineaBase: tb("línea base", "baseline"),
  agenteUnico: tb("agente único", "single agent"),
  mismoPresupuesto: tb("mismo presupuesto", "same budget"),
  lote: tb("lote", "batch"),
  evaluadores: tb("evaluadores", "evaluators"),
};
