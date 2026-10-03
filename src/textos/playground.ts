/**
 * Textos de P5 Playground (maqueta `docs/diseno/05-playground.html`, aprobada en la mirada 3 de la Etapa de Diseño).
 * La copia es la aprobada; lo que cambia al mover un umbral (qué casos cambian, por qué, cuánto cuesta, qué criterio
 * deja de cumplirse) se arma aquí con plantillas desde `core/playground/consecuencias.ts`. Importable desde el cliente:
 * solo texto y funciones puras.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import type { Operador } from "@core/plan/esquema";

type Plantilla<P> = (p: P) => TextoBilingue;

export const TITULO_PAGINA = tb(
  "El playground · planlang",
  "The playground · planlang",
);
export const DESCRIPCION_PAGINA = tb(
  "Mueve los umbrales del plan del demo A sobre las decisiones que el agente ya tomó: qué casos cambian de camino, qué errores aparecen o se evitan y cuánto trabajo humano cuesta. Sin modelo. Simulación · no operativo.",
  "Move demo A's plan thresholds over the decisions the agent already took: which cases change path, which errors appear or are avoided and how much human work it costs. No model. Simulation · not operational.",
);

export const PORTADA = {
  antetitulo: ((p: { corrida: string; casos: number; decisiones: number }) =>
    tb(
      `Demo A · corrida ${p.corrida} · ${p.casos} casos · ${p.decisiones} decisiones registradas`,
      `Demo A · run ${p.corrida} · ${p.casos} cases · ${p.decisiones} recorded decisions`,
    )) as Plantilla<{ corrida: string; casos: number; decisiones: number }>,
  titulo: tb(
    "¿Y si el plan hubiera fijado otros umbrales?",
    "What if the plan had set other thresholds?",
  ),
  guia: tb(
    "Mueve los umbrales del plan y mira qué casos habrían tomado otro camino, qué errores aparecen o se evitan y cuánto trabajo humano cuesta. Todo se recalcula sobre las decisiones que el agente ya tomó: nadie vuelve a llamar al modelo.",
    "Move the plan’s thresholds and see which cases would have taken another path, which errors appear or are avoided and how much human work it costs. Everything is recomputed over the decisions the agent already took: nobody calls the model again.",
  ),
};

export const MIRADA = {
  titulo: tb("El playground en una mirada", "The playground at a glance"),
  avisoLider: tb(
    "Ves qué cambia y cuánto cuesta, en palabras llanas, con un ejemplo.",
    "You see what changes and what it costs, in plain words, with an example.",
  ),
  avisoExperto: tb(
    "Aparecen la ficha técnica, la regla de decisión con los valores que muevas, lo observado en cada umbral, la regla aplicada a cada cambio y las señales de las decisiones.",
    "You get the technical record, the decision rule with the values you move, what was observed at each threshold, the rule applied to each change and the signals of the decisions.",
  ),
  objetivo: tb("Objetivo", "Goal"),
  objetivoTexto: tb(
    "Probar otros valores de los umbrales del plan sobre lo que el agente ya hizo, y ver el costo de cada cambio antes de tocar el plan.",
    "Try other values for the plan’s thresholds over what the agent already did, and see the cost of each change before touching the plan.",
  ),
};

export const IPO = {
  recibe: tb("Recibe", "Takes"),
  recibeSub: ((p: { casos: number; decisiones: number }) =>
    tb(
      `${p.casos} casos · ${p.decisiones} decisiones`,
      `${p.casos} cases · ${p.decisiones} decisions`,
    )) as Plantilla<{
    casos: number;
    decisiones: number;
  }>,
  hace: tb("Hace", "Does"),
  haceSub: tb("al instante, sin modelo", "instantly, no model"),
  entrega: tb("Entrega", "Delivers"),
  entregaSub: tb("consecuencias", "consequences"),
  hecho: tb("hecho", "done"),
  recibeItems: ((p: { senales: string; casos: number; umbrales: number }) => [
    {
      titulo: tb(
        "Las señales que dejó cada decisión",
        "The signals each decision left",
      ),
      detalle: tb(
        `${p.senales} de los ${p.casos} casos`,
        `${p.senales} of the ${p.casos} cases`,
      ),
    },
    {
      titulo: tb(
        `Los ${p.umbrales} umbrales del plan`,
        `The plan’s ${p.umbrales} thresholds`,
      ),
      detalle: tb(
        "cada uno con su regla escrita y su rango jugable",
        "each with its written rule and playable range",
      ),
    },
    {
      titulo: tb("La verdad conocida de cada caso", "Each case’s known truth"),
      detalle: tb(
        "para saber si un cambio evita o introduce un error",
        "to know whether a change avoids or introduces an error",
      ),
    },
  ]) as (p: {
    senales: string;
    casos: number;
    umbrales: number;
  }) => { titulo: TextoBilingue; detalle: TextoBilingue }[],
  haceItems: ((min: number) => [
    tb(
      "Rehace cada decisión con la regla del plan y el valor que elegiste",
      "Redoes each decision with the plan’s rule and the value you chose",
    ),
    tb(
      "Compara el camino nuevo con el que tomó el agente",
      "Compares the new path with the one the agent took",
    ),
    tb(
      "Mira la verdad conocida: ¿evita o introduce un error?",
      "Looks at the known truth: does it avoid or introduce an error?",
    ),
    tb(
      `Suma los minutos de auditor: ${min} por caso que va a una persona, como declara el plan`,
      `Adds up auditor minutes: ${min} per case that goes to a person, as the plan declares`,
    ),
    tb(
      "Vuelve a medir los criterios con la regla del plan",
      "Measures the criteria again with the plan’s rule",
    ),
  ]) as (min: number) => TextoBilingue[],
  entregaItems: [
    {
      titulo: tb(
        "Los casos que cambian de camino, uno por uno",
        "The cases that change path, one by one",
      ),
      detalle: tb("con el porqué y su traza", "with the reason and its trace"),
    },
    {
      titulo: tb(
        "Errores evitados e introducidos, y minutos de auditor",
        "Errors avoided and introduced, and auditor minutes",
      ),
      detalle: tb(
        "frente a lo que hizo el agente",
        "against what the agent did",
      ),
    },
    {
      titulo: tb(
        "Qué criterios pasarían a cumplirse o a fallar",
        "Which criteria would come to be met or to fail",
      ),
      detalle: tb(
        "medidos con la regla del plan",
        "measured with the plan’s rule",
      ),
    },
    {
      titulo: tb("La curva riesgo-cobertura", "The risk-coverage curve"),
      detalle: tb(
        "con el punto del plan y el tuyo",
        "with the plan’s point and yours",
      ),
    },
  ],
  nunca: tb(
    "Nunca vuelve a llamar al modelo",
    "It never calls the model again",
  ),
  nuncaDetalle: tb(
    "lo que el agente habría hecho después se marca «no observado»",
    "what the agent would have done afterwards is marked “not observed”",
  ),
};

/** Nombre llano de cada señal de decisión (en las frases y en las columnas de la tabla). */
export const SENAL: Record<string, TextoBilingue> = {
  senal_confianza: tb("confianza", "confidence"),
  costo_estimado: tb("costo", "cost"),
  contradiccion_orden_texto: tb("contradicción", "contradiction"),
  propuesta: tb("propuesta", "proposal"),
  ciclos_aclaracion: tb("aclaraciones", "clarifications"),
  campos_faltantes_count: tb("campos que faltan", "missing fields"),
  tipo_atencion: tb("tipo de atención", "type of care"),
  servicio_exento: tb("servicio exento", "exempt service"),
  modo_texas: tb("modo Texas", "Texas mode"),
};

export const OPERADOR: Record<string, TextoBilingue> = {
  menor_que: tb("menor que", "below"),
  mayor_que: tb("mayor que", "above"),
  menor_o_igual_que: tb("igual o menor que", "at or below"),
  mayor_o_igual_que: tb("igual o mayor que", "at or above"),
  igual_a: tb("es", "is"),
  distinto_de: tb("no es", "is not"),
};

export const SIMBOLO: Record<Operador, string> = {
  menor_que: "<",
  mayor_que: ">",
  menor_o_igual_que: "≤",
  mayor_o_igual_que: "≥",
  igual_a: "=",
  distinto_de: "≠",
};

/** Cómo se cuentan, en una frase, las visitas que el camino nuevo se ahorra («1 aclaración menos»). */
export const VISITA_DE: Record<
  string,
  { uno: TextoBilingue; varios: TextoBilingue }
> = {
  aclaracion: {
    uno: tb("aclaración", "clarification"),
    varios: tb("aclaraciones", "clarifications"),
  },
};

export const PORQUE = {
  ahora: ((p: { senal: string; valor: string; op: string; umbral: string }) =>
    tb(
      `${p.senal} ${p.valor} ${p.op} ${p.umbral}`,
      `${p.senal} ${p.valor} ${p.op} ${p.umbral}`,
    )) as Plantilla<{
    senal: string;
    valor: string;
    op: string;
    umbral: string;
  }>,
  yaNo: ((p: { senal: string; valor: string; op: string; umbral: string }) =>
    tb(
      `${p.senal} ${p.valor} ya no es ${p.op} ${p.umbral}`,
      `${p.senal} ${p.valor} is no longer ${p.op} ${p.umbral}`,
    )) as Plantilla<{
    senal: string;
    valor: string;
    op: string;
    umbral: string;
  }>,
  texas: tb(
    "modo Texas con una propuesta que no es aprobar",
    "Texas mode with a proposal that is not approve",
  ),
  noObservado: ((nodo: string) =>
    tb(
      `seguiría a ${nodo}: lo que habría pasado ahí no está en la traza`,
      `it would go on to ${nodo}: what would have happened there is not in the trace`,
    )) as Plantilla<string>,
  ninguna: tb("ninguna regla lo detiene", "no rule stops it"),
};

/** Por qué una regla declarada como función nombrada manda el caso a otro lado (una entrada por función del plan). */
export const PORQUE_FUNCION: Record<string, TextoBilingue> = {
  texas_y_no_aprobar: PORQUE.texas,
};

export const DESTINO = {
  persona: tb("a una persona", "to a person"),
  solo: tb("solo", "alone"),
  no_observado: tb("no observado", "not observed"),
  corto: {
    persona: tb("persona", "person"),
    solo: tb("solo", "alone"),
    no_observado: tb("no observado", "not observed"),
  } as Record<string, TextoBilingue>,
};

export const EFECTO = {
  error_introducido: tb(
    "error: debía ir a una persona",
    "error: it had to go to a person",
  ),
  error_evitado: tb("error evitado", "error avoided"),
  revision_de_mas: ((m: number) =>
    tb(
      `revisión de más · +${m} min`,
      `extra review · +${m} min`,
    )) as Plantilla<number>,
  revision_ahorrada: ((m: number) =>
    tb(
      `revisión ahorrada · −${m} min`,
      `review saved · −${m} min`,
    )) as Plantilla<number>,
  mismo_destino: tb(
    "mismo destino, otro camino",
    "same destination, another path",
  ),
  menos: ((p: { n: number; que: TextoBilingue }) =>
    tb(
      `mismo destino · ${p.n} ${p.que.es} menos`,
      `same destination · ${p.n} fewer ${p.que.en}`,
    )) as Plantilla<{
    n: number;
    que: TextoBilingue;
  }>,
  no_observado: tb("no observado", "not observed"),
  traza: tb("ver su traza", "see its trace"),
};

export const JUEGO = {
  titulo: tb("Mueve los umbrales", "Move the thresholds"),
  chip: ((n: number) =>
    tb(
      `real · señales de ${n} trazas`,
      `real · signals from ${n} traces`,
    )) as Plantilla<number>,
  plan: ((v: string) => tb(`plan ${v}`, `plan ${v}`)) as Plantilla<string>,
  movido: ((v: string) =>
    tb(`movido desde ${v}`, `moved from ${v}`)) as Plantilla<string>,
  planApagado: tb("plan: apagado", "plan: off"),
  planEncendido: tb("plan: encendido", "plan: on"),
  texasMovido: tb(
    "encendido; el plan lo deja apagado",
    "on; the plan leaves it off",
  ),
  texasMovidoApagado: tb(
    "apagado; el plan lo deja encendido",
    "off; the plan leaves it on",
  ),
  encendido: tb("encendido", "on"),
  apagado: tb("apagado", "off"),
  observado: tb("observado", "observed"),
  justo: tb("justo en el umbral", "right at the threshold"),
  noInclusivo: tb("no inclusivo", "not inclusive"),
  inclusivo: tb("inclusivo", "inclusive"),
  verdadero: tb("verdadero", "true"),
  verdaderos: ((p: { a: number; b: number }) =>
    tb(`${p.a} de ${p.b} verdaderos`, `${p.a} of ${p.b} true`)) as Plantilla<{
    a: number;
    b: number;
  }>,
};

export const CIFRAS = {
  cambian: tb("casos cambian de camino", "cases change path"),
  de: ((n: number) => tb(`de ${n}`, `of ${n}`)) as Plantilla<number>,
  noObservados: ((n: number) =>
    tb(
      `${n} no observado${n === 1 ? "" : "s"}`,
      `${n} not observed`,
    )) as Plantilla<number>,
  introducidos: tb("errores introducidos", "errors introduced"),
  evitados: ((n: number) =>
    tb(`evitados: ${n}`, `avoided: ${n}`)) as Plantilla<number>,
  minutos: tb("min de auditor", "auditor min"),
  minutosPlan: ((p: { plan: number; delta: number }) =>
    tb(
      `plan: ${p.plan} · ${p.delta > 0 ? "+" : p.delta < 0 ? "−" : "±"}${Math.abs(p.delta)}`,
      `plan: ${p.plan} · ${p.delta > 0 ? "+" : p.delta < 0 ? "−" : "±"}${Math.abs(p.delta)}`,
    )) as Plantilla<{ plan: number; delta: number }>,
  criterios: ((n: number) =>
    tb(
      `de ${n} criterios cumplen`,
      `of ${n} criteria met`,
    )) as Plantilla<number>,
  antes: ((n: number) =>
    tb(`antes: ${n}`, `before: ${n}`)) as Plantilla<number>,
  sinCambio: tb("sin cambio", "unchanged"),
  sinMedir: ((n: number) =>
    tb(
      `${n} sin poder medirse`,
      `${n} cannot be measured`,
    )) as Plantilla<number>,
  nota: ((m: number) =>
    tb(
      `Minutos: ${m} por caso que pasa a una persona, el costo humano que el plan declara en cada umbral.`,
      `Minutes: ${m} per case that goes to a person, the human cost the plan declares on each threshold.`,
    )) as Plantilla<number>,
  chip: ((v: string) =>
    tb(`real · plan ${v}`, `real · plan ${v}`)) as Plantilla<string>,
};

export const FRASE = {
  plan: ((p: {
    personas: number;
    minutos: number;
    cumplen: number;
    criterios: number;
  }) =>
    tb(
      `En los valores del plan nada cambia: ${p.personas} casos pasan por una persona (${p.minutos} minutos de auditor) y se cumplen ${p.cumplen === p.criterios ? `los ${p.criterios}` : `${p.cumplen} de los ${p.criterios}`} criterios. Mueve un umbral y esta frase te dirá qué cambia.`,
      `At the plan values nothing changes: ${p.personas} cases go through a person (${p.minutos} auditor minutes) and ${p.cumplen === p.criterios ? `all ${p.criterios}` : `${p.cumplen} of the ${p.criterios}`} criteria are met. Move a threshold and this sentence will tell you what changes.`,
    )) as Plantilla<{
    personas: number;
    minutos: number;
    cumplen: number;
    criterios: number;
  }>,
  nada: tb(
    "Con estos valores ningún caso cambia de camino: el costo y los criterios quedan igual que en el plan.",
    "With these values no case changes path: cost and criteria stay as in the plan.",
  ),
  cambian: ((p: { n: number; es: string[]; en: string[] }) =>
    tb(
      `Con estos valores ${p.n === 1 ? "cambia 1 caso" : `cambian ${p.n} casos`}: ${p.es.join("; ")}.`,
      `With these values ${p.n === 1 ? "1 case changes" : `${p.n} cases change`}: ${p.en.join("; ")}.`,
    )) as Plantilla<{ n: number; es: string[]; en: string[] }>,
  caso: {
    no_observado: ((id: string) =>
      tb(
        `${id} queda «no observado»: su traza no dice qué habría pasado`,
        `${id} is left “not observed”: its trace does not say what would have happened`,
      )) as Plantilla<string>,
    mismo_destino: ((id: string) =>
      tb(
        `${id} llega al mismo destino por otro camino`,
        `${id} reaches the same destination another way`,
      )) as Plantilla<string>,
    persona: ((id: string) =>
      tb(
        `${id} pasa a una persona`,
        `${id} goes to a person`,
      )) as Plantilla<string>,
    solo: ((id: string) =>
      tb(
        `${id} saldría sin persona`,
        `${id} would go out without a person`,
      )) as Plantilla<string>,
  },
  introducidos: ((p: { n: number; ids: string }) =>
    tb(
      p.n === 1
        ? `Eso es un error: ${p.ids} necesitaba a una persona.`
        : `Son ${p.n} errores: ${p.ids} necesitaban a una persona.`,
      p.n === 1
        ? `That is an error: ${p.ids} needed a person.`
        : `Those are ${p.n} errors: ${p.ids} needed a person.`,
    )) as Plantilla<{ n: number; ids: string }>,
  evitados: ((n: number) =>
    tb(
      n === 1 ? "Se evita 1 error." : `Se evitan ${n} errores.`,
      n === 1 ? "1 error is avoided." : `${n} errors are avoided.`,
    )) as Plantilla<number>,
  minutos: ((p: { minutos: number; delta: number; sinContar: number }) =>
    tb(
      p.delta === 0
        ? "Los minutos de auditor no cambian."
        : `Minutos de auditor: ${p.minutos} (${p.delta > 0 ? "+" : "−"}${Math.abs(p.delta)} frente al plan${p.sinContar ? `, sin contar ${p.sinContar === 1 ? "el caso no observado" : "los casos no observados"}` : ""}).`,
      p.delta === 0
        ? "Auditor minutes do not change."
        : `Auditor minutes: ${p.minutos} (${p.delta > 0 ? "+" : "−"}${Math.abs(p.delta)} against the plan${p.sinContar ? `, not counting the unobserved ${p.sinContar === 1 ? "case" : "cases"}` : ""}).`,
    )) as Plantilla<{ minutos: number; delta: number; sinContar: number }>,
  dejan: ((p: { n: number; ids: string; idsEn: string }) =>
    tb(
      p.n === 1
        ? `Deja de cumplirse ${p.ids}.`
        : `Dejan de cumplirse ${p.ids}.`,
      `${p.idsEn} ${p.n === 1 ? "stops" : "stop"} being met.`,
    )) as Plantilla<{ n: number; ids: string; idsEn: string }>,
  vuelven: ((p: { n: number; ids: string; idsEn: string }) =>
    tb(
      p.n === 1
        ? `Vuelve a cumplirse ${p.ids}.`
        : `Vuelven a cumplirse ${p.ids}.`,
      `${p.idsEn} ${p.n === 1 ? "is" : "are"} met again.`,
    )) as Plantilla<{ n: number; ids: string; idsEn: string }>,
  sinMedir: ((p: {
    ids: string;
    idsEn: string;
    casos: string;
    casosEn: string;
  }) =>
    tb(
      `${p.ids} no se ${p.ids.includes(" y ") || p.ids.includes(",") ? "pueden" : "puede"} medir en ${p.casos}: lee${p.ids.includes(" y ") || p.ids.includes(",") ? "n" : ""} lo que pasa después del cambio, que la traza no registró.`,
      `${p.idsEn} cannot be measured on ${p.casosEn}: ${p.idsEn.includes(" and ") || p.idsEn.includes(",") ? "they read" : "it reads"} what happens after the change, which the trace did not record.`,
    )) as Plantilla<{
    ids: string;
    idsEn: string;
    casos: string;
    casosEn: string;
  }>,
  siguen: tb(
    "Los demás criterios siguen como en el plan.",
    "The other criteria stay as in the plan.",
  ),
};

export const CRITERIO_CAMBIO = {
  incumple: ((id: string) =>
    tb(`${id} no cumple`, `${id} fails`)) as Plantilla<string>,
  cumple: ((id: string) =>
    tb(`${id} vuelve a cumplirse`, `${id} is met again`)) as Plantilla<string>,
  indeterminado: ((id: string) =>
    tb(
      `${id} sin poder medirse`,
      `${id} cannot be measured`,
    )) as Plantilla<string>,
  casos: ((ids: string) =>
    tb(
      `casos que lo incumplen: ${ids}`,
      `cases that miss it: ${ids}`,
    )) as Plantilla<string>,
  noEvaluables: ((ids: string) =>
    tb(
      `lee lo que pasa después del cambio en ${ids}`,
      `it reads what happens after the change in ${ids}`,
    )) as Plantilla<string>,
};

export const ESTADO = {
  movido: ((p: { es: string; en: string }) =>
    tb(
      `Movido: ${p.es}. Lo demás, como en el plan.`,
      `Moved: ${p.en}. The rest, as in the plan.`,
    )) as Plantilla<{
    es: string;
    en: string;
  }>,
  enPlan: ((n: number) =>
    tb(
      `En los valores del plan: el recálculo reproduce el camino de los ${n} casos.`,
      `At the plan values: the recalculation reproduces the path of all ${n} cases.`,
    )) as Plantilla<number>,
  volver: tb("Volver al plan", "Back to the plan"),
  texasOn: tb("modo Texas encendido", "Texas mode on"),
  texasOff: tb("modo Texas apagado", "Texas mode off"),
};

export const CAMBIOS = {
  titulo: tb("Casos que cambian de camino", "Cases that change path"),
  columnas: {
    caso: tb("Caso", "Case"),
    tipo: tb("Tipo", "Type"),
    antesAhora: tb("Antes → ahora", "Before → now"),
    porque: tb("Por qué", "Why"),
    consecuencia: tb("Consecuencia", "Consequence"),
  },
  mueve: tb(
    "Mueve un umbral para ver qué casos cambian.",
    "Move a threshold to see which cases change.",
  ),
  ninguno: tb(
    "Con estos valores, ningún caso cambia de camino.",
    "With these values, no case changes path.",
  ),
  texas: tb(
    "Encender el modo Texas no cambia ningún caso: toda propuesta adversa ya pasaba por una persona.",
    "Turning Texas mode on changes no case: every adverse proposal already went to a person.",
  ),
  comprobacion: ((p: { a: number; b: number }) =>
    tb(
      `Comprobación: con los valores del plan, ${p.a} de ${p.b} casos reproducen el camino que registró el agente, con el mismo intérprete que RF-09.2.`,
      `Check: at the plan values, ${p.a} of ${p.b} cases reproduce the path the agent recorded, with the same interpreter as RF-09.2.`,
    )) as Plantilla<{ a: number; b: number }>,
};

export const REGLA_VIVA = {
  titulo: tb(
    "La regla de decisión, con tus valores",
    "The decision rule, with your values",
  ),
  siNo: ((r: string) => tb(`si no → ${r}`, `else → ${r}`)) as Plantilla<string>,
  siNinguna: ((r: string) =>
    tb(`si ninguna → ${r}`, `if none → ${r}`)) as Plantilla<string>,
  criterios: tb("criterios", "criteria"),
  ningunCriterio: tb(
    "ninguno cambia con estos valores",
    "none changes with these values",
  ),
};

export const TABLA = {
  titulo: ((n: number) =>
    tb(
      `Las ${n} decisiones, con sus señales`,
      `The ${n} decisions, with their signals`,
    )) as Plantilla<number>,
  nota: tb(
    "Señales tal como las dejó cada traza. ■ marca los casos que cambian con tus valores.",
    "Signals as each trace left them. ■ marks the cases that change with your values.",
  ),
  caso: tb("Caso", "Case"),
  tipo: tb("Tipo", "Type"),
  planAhora: tb("Plan → ahora", "Plan → now"),
  si: tb("sí", "yes"),
  no: tb("no", "no"),
};

export const CURVA = {
  titulo: tb("La curva riesgo-cobertura", "The risk-coverage curve"),
  chip: ((n: number) =>
    tb(`real · S1, n = ${n}`, `real · S1, n = ${n}`)) as Plantilla<number>,
  lecturaSinRiesgo: ((n: number) =>
    tb(
      `Subir la confianza mínima (U1) manda más casos a una persona: baja la cobertura. En esta corrida el riesgo quedó en 0 % en todo el rango, porque los ${n} casos medidos fueron aciertos: la curva no puede mostrar dónde se equilibra. La corrida de 200 del plan v1.4 confirmó S1 y entra a la vitrina en el sprint 3.`,
      `Raising the minimum confidence (U1) sends more cases to a person: coverage drops. In this run risk stayed at 0% across the whole range, because all ${n} measured cases were correct: the curve cannot show where it balances. The 200-case run of plan v1.4 confirmed S1 and joins the showcase in sprint 3.`,
    )) as Plantilla<number>,
  lectura: tb(
    "Subir la confianza mínima (U1) manda más casos a una persona: baja la cobertura y, si la confianza está calibrada, también el riesgo.",
    "Raising the minimum confidence (U1) sends more cases to a person: coverage drops and, if confidence is calibrated, so does risk.",
  ),
  pie: tb(
    "El cuadro ■ sigue a U1; el círculo ◯ es el plan. En la tabla, las mismas marcas.",
    "The square ■ follows U1; the circle ◯ is the plan. The table uses the same marks.",
  ),
  ejeCobertura: tb(
    "cobertura: casos que resuelve solo →",
    "coverage: cases it resolves alone →",
  ),
  ejeRiesgo: tb(
    "riesgo: errores entre esos casos",
    "risk: errors among those cases",
  ),
  columnas: {
    cobertura: tb("Cobertura", "Coverage"),
    escalamiento: tb("Escalamiento", "Escalation"),
    riesgo: tb("Riesgo", "Risk"),
    solos: tb("Solos", "Alone"),
  },
  srPlan: tb("valor del plan", "plan value"),
  srActual: tb("valor actual", "current value"),
  sinCaso: tb("sin casos", "no cases"),
  tituloSvg: ((p: { n: number }) =>
    tb(
      `Curva riesgo-cobertura de U1 sobre ${p.n} casos medidos, con el punto del plan y el valor actual`,
      `U1 risk-coverage curve over ${p.n} measured cases, with the plan point and the current value`,
    )) as Plantilla<{ n: number }>,
};

export const LIMITES = {
  titulo: tb(
    "Lo que el playground no puede saber",
    "What the playground cannot know",
  ),
  nucleo: tb(
    "El cálculo lo hace el núcleo de planlang en tu navegador.",
    "The calculation is done by planlang’s core in your browser.",
  ),
  nucleoDetalle: ((n: number) =>
    tb(
      `Es el mismo intérprete de aristas que coincide con Python en las ${n} decisiones de las corridas (RF-09.2), y no llama a ningún modelo.`,
      `It is the same edge interpreter that matches Python on the ${n} decisions of the runs (RF-09.2), and it calls no model.`,
    )) as Plantilla<number>,
};

export const EJEMPLO = {
  titulo: tb("Un ejemplo.", "An example."),
  texto: ((p: {
    umbral: string;
    nombre: TextoBilingue;
    desde: string;
    hasta: string;
    caso: string;
    senal: TextoBilingue;
    valor: string;
    minutos: number;
    errores: number;
  }) =>
    tb(
      `Si subes el umbral de ${p.nombre.es.toLowerCase()} (${p.umbral}) de ${p.desde} a ${p.hasta}, el caso ${p.caso} —que el agente resolvió solo, con ${p.senal.es} ${p.valor}— pasaría a una persona: ${p.minutos} minutos más de auditor y ${p.errores === 0 ? "ningún error nuevo" : `${p.errores} errores nuevos`}. Pruébalo abajo.`,
      `If you raise the ${p.nombre.en.toLowerCase()} (${p.umbral}) from ${p.desde} to ${p.hasta}, case ${p.caso} —which the agent resolved alone, with ${p.senal.en} ${p.valor}— would go to a person: ${p.minutos} more auditor minutes and ${p.errores === 0 ? "no new error" : `${p.errores} new errors`}. Try it below.`,
    )) as Plantilla<{
    umbral: string;
    nombre: TextoBilingue;
    desde: string;
    hasta: string;
    caso: string;
    senal: TextoBilingue;
    valor: string;
    minutos: number;
    errores: number;
  }>,
};

export const FICHA_TECNICA = {
  titulo: tb("Ficha técnica del playground", "Playground technical record"),
  entrada: tb("Entrada", "Input"),
  entradaValor: ((p: { n: number; v: string; d: number }) =>
    tb(
      `planlang-trace/v1 · las ${p.n} trazas de la corrida ${p.v} · ${p.d} decisiones con su señal y el umbral aplicado`,
      `planlang-trace/v1 · the ${p.n} traces of run ${p.v} · ${p.d} decisions with their signal and applied threshold`,
    )) as Plantilla<{ n: number; v: string; d: number }>,
  regla: tb("Regla de cada umbral", "Rule of each threshold"),
  reglaValor: ((f: string) =>
    tb(
      `señal · operador · valor · inclusivo${f ? `; ${f}` : ""}`,
      `signal · operator · value · inclusive${f ? `; ${f}` : ""}`,
    )) as Plantilla<string>,
  orden: tb("Orden de evaluación", "Evaluation order"),
  cruzada: tb("Prueba cruzada", "Cross-check"),
  cruzadaValor: ((p: { dif: number; d: number; c: number }) =>
    tb(
      `RF-09.2: ${p.dif} diferencias en ${p.d} decisiones de ${p.c} corridas, Python frente a TypeScript`,
      `RF-09.2: ${p.dif} differences in ${p.d} decisions from ${p.c} runs, Python against TypeScript`,
    )) as Plantilla<{ dif: number; d: number; c: number }>,
  determinismo: tb("Determinismo", "Determinism"),
  determinismoValor: tb(
    "mismos bytes en Node y en el navegador; sin reloj ni azar",
    "same bytes in Node and in the browser; no clock, no randomness",
  ),
  noObservado: tb("No observado", "Not observed"),
  noObservadoValor: tb(
    "lo que el agente haría después de un camino nuevo que la traza no registra (otra aclaración, otra extracción)",
    "what the agent would do after a new path that the trace does not record (another clarification, another extraction)",
  ),
  carga: tb("Carga humana", "Human load"),
  cargaValor: ((p: { m: number; n: number; v: string }) =>
    tb(
      `costo_humano_por_caso_min = ${p.m} en los ${p.n} umbrales del plan ${p.v}: cada caso que pasa a una persona suma ${p.m} min de auditor`,
      `costo_humano_por_caso_min = ${p.m} on the plan ${p.v}’s ${p.n} thresholds: each case that goes to a person adds ${p.m} auditor min`,
    )) as Plantilla<{ m: number; n: number; v: string }>,
  criterios: tb("Criterios recalculados", "Recomputed criteria"),
  criteriosValor: ((n: number) =>
    tb(
      `los ${n}, con la regla y los umbrales del plan sobre el camino nuevo; un criterio que lee lo que pasa después del cambio (respuesta, documento, latencia) queda sin poder medirse en ese caso`,
      `all ${n}, with the plan’s rule and thresholds over the new path; a criterion that reads what happens after the change (reply, document, latency) cannot be measured on that case`,
    )) as Plantilla<number>,
};

/**
 * Cómo se lee cada umbral booleano del plan (un interruptor): encendido, apagado y por qué encenderlo no cambia ningún
 * caso cuando toda propuesta adversa ya pasaba por una persona. Un umbral booleano sin entrada detiene el build.
 */
export const INTERRUPTOR: Record<
  string,
  { on: TextoBilingue; off: TextoBilingue; sinCambio: TextoBilingue }
> = {
  U4: { on: ESTADO.texasOn, off: ESTADO.texasOff, sinCambio: CAMBIOS.texas },
};
