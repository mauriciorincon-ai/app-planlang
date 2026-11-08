/**
 * Textos de la calibración con garantía (S8, ADR-018): lo que el playground y la Brecha dicen de la zona respaldada,
 * del error que el visitante acepta (α) y de la seguridad exigida (δ), en dos registros (regla dura 12). El de líder
 * habla de errores y de casos; el de experto trae α, δ, las pruebas y el método. Cada texto nace `{ es, en }`,
 * redactado y no traducido. Importable desde el cliente: solo texto y funciones puras.
 */
import { tb, type TextoBilingue } from "@core/formatos/bilingue";
import { entero } from "@/lib/vista/formato";

type Plantilla<P> = (p: P) => TextoBilingue;

/** Un entero con el separador de miles de cada idioma (la vitrina no pinta «2680»). */
const n = (x: number) => ({ es: entero(x, "es"), en: entero(x, "en") });

export const ZONA = {
  /** El nombre de la zona, corto: lo que dicen la leyenda, la tabla y el título del gráfico. */
  nombre: tb("Zona respaldada", "Backed zone"),
  glifo: tb("respaldado por los datos", "backed by the data"),
  titulo: tb(
    "Dónde el umbral tiene el respaldo de los datos",
    "Where the threshold has the data's backing",
  ),
  intro: tb(
    "La curva dice qué pasó con estos casos; no dice cuánto confiar para los que vienen. La zona marca los umbrales de confianza mínima que los datos respaldan, con el error que aceptes y la seguridad que se exige. Sale del informe, ya calculada.",
    "The curve says what happened with these cases; it does not say how far to trust it for the ones to come. The zone marks the minimum-confidence thresholds the data backs, for the error you accept and the confidence required. It comes from the report, already calculated.",
  ),
  selector: {
    leyenda: tb("Error que aceptas (α)", "Error you accept (α)"),
    opcion: ((p: { pct: string; alfa: string }) =>
      tb(`${p.pct} (α ${p.alfa})`, `${p.pct} (α ${p.alfa})`)) as Plantilla<{
      pct: string;
      alfa: string;
    }>,
    ayuda: tb(
      "Es la parte de lo que el agente decide solo que puede salir mal. Aceptar menos error estrecha la zona, o la deja vacía.",
      "It is the share of what the agent decides alone that may go wrong. Accepting less error narrows the zone, or empties it.",
    ),
    seguridad: ((p: { seguridad: string; delta: string }) =>
      tb(
        `Seguridad exigida: ${p.seguridad} (δ ${p.delta}). No se mueve: es parte de lo que se promete.`,
        `Required confidence: ${p.seguridad} (δ ${p.delta}). It does not move: it is part of the promise.`,
      )) as Plantilla<{ seguridad: string; delta: string }>,
  },
  /** Bajo el deslizador de la confianza mínima: dónde cae el valor que el visitante puso. */
  estado: {
    dentro: ((p: { umbral: string; valor: string }) =>
      tb(
        `${p.umbral} ${p.valor}: dentro de la zona respaldada.`,
        `${p.umbral} ${p.valor}: inside the backed zone.`,
      )) as Plantilla<{ umbral: string; valor: string }>,
    debajo: ((p: { umbral: string; valor: string; desde: string }) =>
      tb(
        `${p.umbral} ${p.valor}: por debajo de la zona. Desde ${p.desde} hacia arriba los datos respaldan el error aceptado; con este valor, no.`,
        `${p.umbral} ${p.valor}: below the zone. From ${p.desde} up the data backs the accepted error; at this value, it does not.`,
      )) as Plantilla<{ umbral: string; valor: string; desde: string }>,
    encima: ((p: { umbral: string; valor: string; hasta: string }) =>
      tb(
        `${p.umbral} ${p.valor}: por encima de la zona. El error sigue respaldado, pero por encima de ${p.hasta} se escalan más aciertos de los que aceptas.`,
        `${p.umbral} ${p.valor}: above the zone. The error is still backed, but above ${p.hasta} more correct cases are escalated than you accept.`,
      )) as Plantilla<{ umbral: string; valor: string; hasta: string }>,
    ninguna: ((p: { umbral: string; valor: string }) =>
      tb(
        `${p.umbral} ${p.valor}: no hay zona con este error aceptado, así que ningún valor tiene respaldo.`,
        `${p.umbral} ${p.valor}: there is no zone at this accepted error, so no value is backed.`,
      )) as Plantilla<{ umbral: string; valor: string }>,
  },
  leyenda: ((p: { alfa: string; desde: string; hasta: string }) =>
    tb(
      `Zona respaldada con ${p.alfa} de error: confianza mínima de ${p.desde} a ${p.hasta}.`,
      `Backed zone at ${p.alfa} error: minimum confidence from ${p.desde} to ${p.hasta}.`,
    )) as Plantilla<{ alfa: string; desde: string; hasta: string }>,
  sinZona: ((p: { alfa: string }) =>
    tb(
      `No hay zona respaldada con ${p.alfa} de error.`,
      `There is no backed zone at ${p.alfa} error.`,
    )) as Plantilla<{ alfa: string }>,
  tituloSvg: ((p: { desde: string; hasta: string }) =>
    tb(
      `zona respaldada de ${p.desde} a ${p.hasta}`,
      `backed zone from ${p.desde} to ${p.hasta}`,
    )) as Plantilla<{ desde: string; hasta: string }>,
};

/**
 * El párrafo de líder de cada nivel de α: lo que respaldan los datos o, si no hay zona, por qué y cuántos casos harían
 * falta. Sin siglas: errores, casos y seguridad. Cada uno cabe en el presupuesto de líder (≤ 50 palabras).
 */
export const LIDER = {
  conZona: ((p: {
    alfa: string;
    seguridad: string;
    n: number;
    desde: string;
    hasta: string;
  }) =>
    tb(
      `Aceptando hasta ${p.alfa} de error en lo que el agente decide solo, con ${p.seguridad} de seguridad, los ${n(p.n).es} casos medidos respaldan una confianza mínima de ${p.desde} a ${p.hasta}. Por debajo, los datos no sostienen ese error; por encima, se escalan aciertos de más.`,
      `Accepting up to ${p.alfa} error in what the agent decides alone, with ${p.seguridad} confidence, the ${n(p.n).en} measured cases back a minimum confidence from ${p.desde} to ${p.hasta}. Below it, the data cannot hold that error; above it, too many correct cases are escalated.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    n: number;
    desde: string;
    hasta: string;
  }>,
  /** Sin zona porque ningún umbral respalda el error: con cero errores y pocos casos, o con una tasa que no baja. */
  pocosCasos: ((p: {
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    casos: number;
  }) =>
    tb(
      `Con ${p.alfa} de error y ${p.seguridad} de seguridad no hay zona: en la confianza más alta (${p.umbral}) el agente decide solo ${n(p.solos).es} ${p.solos === 1 ? "caso" : "casos"}, y harían falta ${n(p.casos).es} sin un solo error.`,
      `At ${p.alfa} error and ${p.seguridad} confidence there is no zone: at the highest confidence (${p.umbral}) the agent decides ${n(p.solos).en} ${p.solos === 1 ? "case" : "cases"} alone, and it would take ${n(p.casos).en} without a single error.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    casos: number;
  }>,
  tasaCerca: ((p: {
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    errores: number;
    casos: number | null;
    tope: number;
  }) =>
    tb(
      `Con ${p.alfa} de error y ${p.seguridad} de seguridad no hay zona: en ${p.umbral} el agente decide solo ${n(p.solos).es} casos y falla en ${n(p.errores).es}; con esa misma tasa harían falta ${p.casos === null ? `más de ${n(p.tope * p.solos).es}` : n(p.casos).es} casos.`,
      `At ${p.alfa} error and ${p.seguridad} confidence there is no zone: at ${p.umbral} the agent decides ${n(p.solos).en} cases alone and fails in ${n(p.errores).en}; at that same rate it would take ${p.casos === null ? `more than ${n(p.tope * p.solos).en}` : n(p.casos).en} cases.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    errores: number;
    casos: number | null;
    tope: number;
  }>,
  tasaSobre: ((p: {
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    errores: number;
  }) =>
    tb(
      `Con ${p.alfa} de error y ${p.seguridad} de seguridad no hay zona: en ${p.umbral} el agente falla en ${n(p.errores).es} de ${n(p.solos).es} casos, una tasa que no baja de ${p.alfa}; más casos con esa tasa no la respaldan.`,
      `At ${p.alfa} error and ${p.seguridad} confidence there is no zone: at ${p.umbral} the agent fails in ${n(p.errores).en} of ${n(p.solos).en} cases, a rate that does not go below ${p.alfa}; more cases at that rate never back it.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    umbral: string;
    solos: number;
    errores: number;
  }>,
  sinCota: ((p: {
    alfa: string;
    seguridad: string;
    aciertos: number;
    minimo: number;
  }) =>
    tb(
      `Con ${p.alfa} de error y ${p.seguridad} de seguridad no hay zona: con ${n(p.aciertos).es} aciertos no se puede decir qué confianza deja pasar a la mayoría de ellos; hacen falta al menos ${n(p.minimo).es}.`,
      `At ${p.alfa} error and ${p.seguridad} confidence there is no zone: with ${n(p.aciertos).en} correct cases we cannot say which confidence lets most of them through; it takes at least ${n(p.minimo).en}.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    aciertos: number;
    minimo: number;
  }>,
  conformalBajo: ((p: {
    alfa: string;
    seguridad: string;
    pasa: string;
    umbral: string;
    respalda: string;
  }) =>
    tb(
      `Con ${p.alfa} de error y ${p.seguridad} de seguridad no hay zona: la confianza que deja pasar a ${p.pasa} de los aciertos (${p.umbral}) queda por debajo de la que respalda el error (${p.respalda}); ninguna cumple las dos.`,
      `At ${p.alfa} error and ${p.seguridad} confidence there is no zone: the confidence that lets ${p.pasa} of the correct cases through (${p.umbral}) falls below the one that backs the error (${p.respalda}); none meets both.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    pasa: string;
    umbral: string;
    respalda: string;
  }>,
  /** Dónde cae el umbral que usó la corrida frente a la zona. */
  aplicadoDentro: ((p: { umbral: string; valor: string }) =>
    tb(
      `El ${p.umbral} de la corrida (${p.valor}) cae dentro.`,
      `The run's ${p.umbral} (${p.valor}) falls inside.`,
    )) as Plantilla<{ umbral: string; valor: string }>,
  aplicadoFuera: ((p: { umbral: string; valor: string }) =>
    tb(
      `El ${p.umbral} de la corrida (${p.valor}) cae fuera.`,
      `The run's ${p.umbral} (${p.valor}) falls outside.`,
    )) as Plantilla<{ umbral: string; valor: string }>,
  /** La cobertura conjunta que los datos no alcanzan, en llano. */
  conjuntaNo: ((p: {
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
    solos: number;
    errores: number;
    etapa: string;
    casos: number | null;
    tope: number;
  }) =>
    tb(
      `Que ${p.etapas} acierten a la vez, con ${p.alfa} de error y ${p.seguridad} de seguridad, no se respalda con la secuencia que parte del umbral más alto: en ${p.umbral} el agente decide solo ${n(p.solos).es} casos y ${p.etapa} falla en ${n(p.errores).es}; con esa tasa harían falta ${p.casos === null ? `más de ${n(p.tope * p.solos).es}` : n(p.casos).es} casos.`,
      `That ${p.etapas} are right together, at ${p.alfa} error and ${p.seguridad} confidence, is not backed by the sequence that starts at the highest threshold: at ${p.umbral} the agent decides ${n(p.solos).en} cases alone and ${p.etapa} fails in ${n(p.errores).en}; at that rate it would take ${p.casos === null ? `more than ${n(p.tope * p.solos).en}` : n(p.casos).en} cases.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
    solos: number;
    errores: number;
    etapa: string;
    casos: number | null;
    tope: number;
  }>,
  conjuntaSobre: ((p: {
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
    solos: number;
    errores: number;
    etapa: string;
  }) =>
    tb(
      `Que ${p.etapas} acierten a la vez, con ${p.alfa} de error y ${p.seguridad} de seguridad, no se respalda con la secuencia que parte del umbral más alto: en ${p.umbral} el agente decide solo ${n(p.solos).es} casos y ${p.etapa} falla en ${n(p.errores).es}, una tasa que no baja de lo que aceptas; más casos con esa tasa no lo respaldan.`,
      `That ${p.etapas} are right together, at ${p.alfa} error and ${p.seguridad} confidence, is not backed by the sequence that starts at the highest threshold: at ${p.umbral} the agent decides ${n(p.solos).en} cases alone and ${p.etapa} fails in ${n(p.errores).en}, a rate that does not go below what you accept; more cases at that rate never back it.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
    solos: number;
    errores: number;
    etapa: string;
  }>,
  /** Con una sola etapa medida no hay nada que sumar: se dice, en vez de callar (S8, B7 del lote del hito). */
  conjuntaUnaEtapa: ((p: { etapa: string }) =>
    tb(
      `De las etapas del agente solo se midió una (${p.etapa}): no hay cobertura conjunta que sumar, es la de esa etapa sola.`,
      `Only one stage of the agent was measured (${p.etapa}): there is no joint coverage to add up, it is that stage's own.`,
    )) as Plantilla<{ etapa: string }>,
  conjuntaSi: ((p: {
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
  }) =>
    tb(
      `Que ${p.etapas} acierten a la vez, con ${p.alfa} de error y ${p.seguridad} de seguridad, los datos lo respaldan desde ${p.umbral}.`,
      `That ${p.etapas} are right together, at ${p.alfa} error and ${p.seguridad} confidence, is backed by the data from ${p.umbral}.`,
    )) as Plantilla<{
    alfa: string;
    seguridad: string;
    etapas: string;
    umbral: string;
  }>,
  /** La honestidad del orden: la secuencia fija es conservadora y el orden no se elige mirando los datos. */
  secuencia: tb(
    "La prueba parte del umbral más alto y baja hasta que uno no pasa (secuencia fija). Es conservadora: puede decir «no se respalda» donde otro orden pasaría, y elegir el orden mirando los datos invalidaría la seguridad.",
    "The test starts at the highest threshold and goes down until one fails (fixed sequence). It is conservative: it may say “not backed” where another order would pass, and choosing the order after looking at the data would void the confidence.",
  ),
  /** Cuando no hay verdad conocida para una etapa con modelo: no se observa y no entra a la cuenta. */
  noObservada: ((p: { etapas: string; n: number }) =>
    tb(
      `${p.n === 1 ? "La etapa" : "Las etapas"} ${p.etapas} no ${p.n === 1 ? "tiene" : "tienen"} verdad conocida en los casos: no se ${p.n === 1 ? "observa" : "observan"} y ${p.n === 1 ? "queda" : "quedan"} fuera de la cuenta.`,
      `The ${p.etapas} ${p.n === 1 ? "stage has" : "stages have"} no ground truth in the cases: ${p.n === 1 ? "it is" : "they are"} not observed and left out of the count.`,
    )) as Plantilla<{ etapas: string; n: number }>,
};

/** Las etapas con modelo, por el id de su nodo en el plan (el nombre llano; el id si el plan trae otra). */
export const ETAPA: Record<string, TextoBilingue> = {
  extractor: tb("la extracción", "extraction"),
  aclaracion: tb("la aclaración", "clarification"),
  redactor: tb("la redacción", "writing"),
};

/** El mismo nombre sin artículo, para las listas de la tabla del experto. */
export const ETAPA_CORTA: Record<string, TextoBilingue> = {
  extractor: tb("extractor", "extractor"),
  aclaracion: tb("aclaración", "clarification"),
  redactor: tb("redactor", "writer"),
};

/** El registro de experto: las pruebas, el método y los niveles, con α y δ. */
export const EXPERTO = {
  tabla: {
    titulo: tb(
      "Garantía de la calibración · por nivel de α",
      "Calibration guarantee · by level of α",
    ),
    alfa: tb("α", "α"),
    umbral: tb("Umbral con garantía", "Guaranteed threshold"),
    cobertura: tb("Cobertura · error en él", "Coverage · error there"),
    conformal: tb("Umbral conformal", "Conformal threshold"),
    zona: tb("Zona respaldada", "Backed zone"),
    aplicado: ((p: { umbral: string; valor: string }) =>
      tb(
        `¿Cae el de la corrida (${p.umbral} ${p.valor})?`,
        `Is the run's (${p.umbral} ${p.valor}) inside?`,
      )) as Plantilla<{ umbral: string; valor: string }>,
    conjunta: tb("Cobertura conjunta", "Joint coverage"),
    delInforme: tb("el del informe", "the report’s"),
    no: tb("no hay", "none"),
    noAlcanza: tb("no alcanza", "not reached"),
    si: tb("sí", "yes"),
    noEs: tb("no", "no"),
  },
  metodo: ((p: { delta: string; alfa: string; n: number; aciertos: number }) =>
    tb(
      `δ = ${p.delta}; el informe declara α = ${p.alfa}. Sobre ${n(p.n).es} casos con verdad conocida (${n(p.aciertos).es} aciertos de la extracción). Umbral con garantía: Learn then Test, secuencia fija desde el umbral más alto, con la cola binomial exacta; es el más bajo cuyo error entre lo que el agente decide solo es ≤ α con probabilidad ≥ 1 − δ. Umbral conformal: el ⌊(n + 1)·α⌋-ésimo menor valor de confianza entre los aciertos; deja pasar sin persona al menos 1 − α de los aciertos, marginal y bajo intercambiabilidad.`,
      `δ = ${p.delta}; the report declares α = ${p.alfa}. Over ${n(p.n).en} cases with ground truth (${n(p.aciertos).en} correct extractions). Guaranteed threshold: Learn then Test, fixed sequence from the highest threshold, with the exact binomial tail; it is the lowest one whose error among what the agent decides alone is ≤ α with probability ≥ 1 − δ. Conformal threshold: the ⌊(n + 1)·α⌋-th smallest confidence among the correct cases; it lets at least 1 − α of them through without a person, marginal and under exchangeability.`,
    )) as Plantilla<{
    delta: string;
    alfa: string;
    n: number;
    aciertos: number;
  }>,
  conjunta: ((p: { etapas: string; k: number }) =>
    tb(
      `Cobertura conjunta (Bonferroni): ${p.etapas}, cada una con α/${p.k} y δ/${p.k}, sobre los mismos casos que el agente decide solo en cada umbral. Si todas pasan, P(alguna etapa falla) ≤ α con probabilidad ≥ 1 − δ.`,
      `Joint coverage (Bonferroni): ${p.etapas}, each at α/${p.k} and δ/${p.k}, over the same cases the agent decides alone at each threshold. If all pass, P(some stage fails) ≤ α with probability ≥ 1 − δ.`,
    )) as Plantilla<{ etapas: string; k: number }>,
  observado: ((p: {
    umbral: string;
    solos: number;
    errores: number;
    tasa: string;
  }) =>
    tb(
      `Error conjunto observado en ${p.umbral}: ${n(p.errores).es} de ${n(p.solos).es} casos decididos solos fallan en alguna etapa (${p.tasa}).`,
      `Observed joint error at ${p.umbral}: ${n(p.errores).en} of ${n(p.solos).en} cases decided alone fail in some stage (${p.tasa}).`,
    )) as Plantilla<{
    umbral: string;
    solos: number;
    errores: number;
    tasa: string;
  }>,
  pruebas: ((p: { alfa: string; lista: string }) =>
    tb(
      `Pruebas a α = ${p.alfa} (umbral: casos solos/errores, p; ✓ rechaza H₀ «error > α»): ${p.lista}.`,
      `Tests at α = ${p.alfa} (threshold: cases alone/errors, p; ✓ rejects H₀ “error > α”): ${p.lista}.`,
    )) as Plantilla<{ alfa: string; lista: string }>,
  conformalLinea: ((p: { n: number; indice: number; umbral: string }) =>
    tb(
      `Conformal: ${n(p.n).es} aciertos, índice ⌊(n + 1)·α⌋ = ${n(p.indice).es} → ${p.umbral}.`,
      `Conformal: ${n(p.n).en} correct cases, index ⌊(n + 1)·α⌋ = ${n(p.indice).en} → ${p.umbral}.`,
    )) as Plantilla<{ n: number; indice: number; umbral: string }>,
  sinCota: tb("sin cota", "no bound"),
  etapas: ((p: { lista: string }) =>
    tb(
      `Etapas con modelo (fallos entre los casos medidos): ${p.lista}.`,
      `Model stages (failures among the measured cases): ${p.lista}.`,
    )) as Plantilla<{ lista: string }>,
  etapaMedida: ((p: { etapa: string; errores: number; casos: number }) =>
    tb(
      `${p.etapa} ${n(p.errores).es} de ${n(p.casos).es}`,
      `${p.etapa} ${n(p.errores).en} of ${n(p.casos).en}`,
    )) as Plantilla<{ etapa: string; errores: number; casos: number }>,
  etapaSinVerdad: ((p: { etapa: string }) =>
    tb(`${p.etapa} sin verdad`, `${p.etapa} no ground truth`)) as Plantilla<{
    etapa: string;
  }>,
  conjuntaPruebas: ((p: {
    k: number;
    alfa: string;
    delta: string;
    casos: number;
    lista: string;
  }) =>
    tb(
      `Pruebas de la conjunta a α/${p.k} = ${p.alfa} y δ/${p.k} = ${p.delta}, sobre ${n(p.casos).es} casos con todas las etapas medidas (umbral: etapa casos solos/errores, p; ✓ pasa, ✗ no): ${p.lista}.`,
      `Joint-coverage tests at α/${p.k} = ${p.alfa} and δ/${p.k} = ${p.delta}, over ${n(p.casos).en} cases with every stage measured (threshold: stage cases alone/errors, p; ✓ passes, ✗ does not): ${p.lista}.`,
    )) as Plantilla<{
    k: number;
    alfa: string;
    delta: string;
    casos: number;
    lista: string;
  }>,
  menorQue: tb("< 0,0001", "< 0.0001"),
  alcance: tb(
    "Alcance: vale para casos intercambiables con los medidos. Son sintéticos y el revisor es simulado, así que no dice nada del tráfico real. Un lote nuevo pide recalcular.",
    "Scope: it holds for cases exchangeable with the measured ones. They are synthetic and the reviewer is simulated, so it says nothing about real traffic. A new batch needs a new calculation.",
  ),
};
