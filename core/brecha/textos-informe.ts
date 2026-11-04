/**
 * Los textos del informe en Markdown, redactados enteros en cada idioma (regla 20): cada frase se escribe una vez por
 * idioma con sus datos dentro, y el render solo elige el idioma (`TEXTOS_INFORME[i]`). Nada se arma pegando un
 * fragmento traducido junto a los datos. La guardia `tests/unit/guardias/bilingue-fuente.test.ts` vigila `core/`.
 */
import type { Idioma } from "../formatos/bilingue";
import { miles } from "./numeros";

export interface TextosInforme {
  titulo: string;
  corrida: string;
  si: string;
  no: string;
  sesion: (n: string) => string;
  sesiones: (n: number) => string;
  controlLegal: string;
  conTabla: (efectiva: string, legal: string, tabla: string) => string;
  // § 1
  resumen: string;
  veredicto: string;
  recomendacion: string;
  tresCriterios: string;
  cabResumen: readonly string[];
  riesgosOcurridos: string;
  ninguno: string;
  porQue: string;
  bloquea: (m: string) => string;
  alerta: (m: string) => string;
  nadaBloquea: string;
  // § 2
  plan: string;
  problema: string;
  flujo: string;
  decisionesUnaVia: string;
  // § 3
  criterios: string;
  cabCriterios: readonly string[];
  notas: string;
  fueraPorNulaCriterio: (n: number) => string;
  // § 4
  riesgos: string;
  cabRiesgos: readonly string[];
  ocurreSi: (op: string, n: string) => string;
  fueraPorNulaRiesgo: (n: number) => string;
  notaPrioridad: string;
  contrato: string;
  cabNodos: readonly string[];
  senalesYPausas: (
    presentes: number,
    total: number,
    conPausa: number,
    registradas: number,
    rol: string,
  ) => string;
  pruebaCruzada: string;
  cabRf092: readonly string[];
  sinHallazgos: string;
  // § 5
  brechas: string;
  brechasQue: string;
  ninguna: string;
  repeticion: (id: string) => string;
  nodoYPaso: (nodo: string, paso: string) => string;
  reintentos: (n: number) => string;
  evaluadores: string;
  cabEvaluadores: readonly string[];
  // § 6
  supuestos: string;
  criticidad: (c: string) => string;
  noExiste: string;
  medidas: (n: number, lista: string) => string;
  curva: string;
  cabCurva: readonly string[];
  cabComparacion: (base: string) => readonly string[];
  /** La garantía de la calibración (S8, ADR-018). Los números llegan ya escritos en el idioma. */
  garantia: (delta: string, alfa: string) => string;
  cabGarantia: (aplicado: string | null) => readonly string[];
  noHay: string;
  noAlcanza: string;
  conjunta: (etapas: string, k: number) => string;
  noObservadas: (etapas: string, n: number) => string;
  /** El nombre de cada etapa con modelo por el id de su nodo; una que no esté aquí se escribe con su id. */
  etapa: Readonly<Record<string, string>>;
  noAlcanzanLosDatos: string;
  /** Por qué el orden de la prueba importa para lo que dice «no se respalda» (ADR-018). */
  secuencia: string;
  enNivel: (alfa: string, que: string) => string;
  queFalta: {
    umbral: string;
    conjunta: string;
    zona: string;
  };
  faltan: {
    pocos_casos: (u: string, n: number, casos: number) => string;
    tasa_cerca_de_alfa: (
      u: string,
      n: number,
      e: number,
      casos: number | null,
      tope: number,
      etapa: string | null,
    ) => string;
    tasa_sobre_alfa: (
      u: string,
      n: number,
      e: number,
      etapa: string | null,
    ) => string;
  };
  sinZona: {
    sin_cota_conformal: (n: number, minimo: number) => string;
    conformal_bajo_el_umbral: (tauC: string, tau: string) => string;
  };
  filaExactitud: string;
  filaLatencia: string;
  filaLlamadas: string;
  filaCosto: string;
  difierenYPresupuesto: (casos: string, respetado: string) => string;
  // § 7
  ejemplares: string;
  exitoso: string;
  escalado: string;
  fallido: string;
  adversario: string;
  ningunoEnLaCorrida: string;
  // § 3, plazos (S9): solo si el plan declara la simulación y el lote trae llegadas
  plazosTitulo: string;
  plazosIntro: (
    capacidad: string,
    unidad: string,
    inicio: string,
    fin: string,
    dias: number,
  ) => string;
  cabPlazos: readonly string[];
  plazoDe: (cantidad: number, unidad: "horas" | "dias_calendario") => string;
  duracion: (minutos: number) => string;
  carga: (pausas: number, porDia: string, capacidad: number) => string;
  horasDeAuditor: (horas: string) => string;
  capacidadMinima: (
    minima: number,
    tardias: number | null,
    rango: string,
  ) => string;
  sinTardias: string;
  tardiasTitulo: string;
  tardia: (id: string, clase: string, espera: string, plazo: string) => string;
  sinPlazo: (clase: string, n: number) => string;
  supuestosDePlazos: string;
  fuenteDePlazos: (norma: string, consultada: string) => string;
  // § 8
  playground: string;
  cabPlayground: readonly string[];
  siNoRango: string;
  verdaderos: (v: number, n: number) => string;
  // § 9
  ficha: string;
  cabFicha: readonly string[];
  piezaPlan: string;
  piezaCasos: string;
  piezaCorrida: string;
  piezaGrafo: string;
  piezaRepeticion: string;
  piezaLineaBase: string;
  piezaLlegadas: string;
  llegadasDelLote: string;
  casosDelLote: (
    id: string,
    semilla: string,
    n: number,
    plan: string,
  ) => string;
  corridaDe: (
    id: string,
    fecha: string,
    proveedor: string,
    variante: string,
    plan: string,
  ) => string;
  mismaVerdad: string;
  versionDelGrafo: string;
  sesionesDeLaCorrida: (
    sesiones: number,
    ejecutados: number,
    conError: number,
    limites: number,
  ) => string;
  umbralesAplicados: (aplicados: string, delPlan: string) => string;
  revisionHumana: (texto: string) => string;
  verificador: (version: string, formato: string, huella: string) => string;
}

const ES: TextosInforme = {
  titulo: "Informe de brecha",
  corrida: "corrida",
  si: "sí",
  no: "no",
  sesion: (n) => `sesión ${n}`,
  sesiones: (n) => `${n} ${n === 1 ? "sesión" : "sesiones"}`,
  controlLegal: "control legal",
  conTabla: (efectiva, legal, tabla) =>
    `${efectiva} · ${legal} (tabla: ${tabla})`,
  resumen: "## 1. Resumen para quien decide",
  veredicto: "Veredicto",
  recomendacion: "Recomendación",
  tresCriterios: "Los tres criterios más relevantes",
  cabResumen: ["Id", "Criterio", "Medido", "Objetivo", "Estado"],
  riesgosOcurridos: "Riesgos que ocurrieron",
  ninguno: "ninguno.",
  porQue: "Por qué este veredicto",
  bloquea: (m) => `- Bloquea: ${m}`,
  alerta: (m) => `- Alerta: ${m}`,
  nadaBloquea: "- Nada bloquea ni alerta.",
  plan: "## 2. El plan en breve",
  problema: "Problema",
  flujo: "Flujo",
  decisionesUnaVia: "Decisiones de una sola vía",
  criterios: "## 3. Criterios de aceptación",
  cabCriterios: [
    "Id",
    "Criterio",
    "Casos",
    "Medido",
    "Objetivo",
    "Estado",
    "Casos que incumplen",
  ],
  notas: "Notas",
  fueraPorNulaCriterio: (n) =>
    `${n} caso(s) quedan fuera de la población porque la señal que la define es nula en ellos (el paso que la escribe no corrió).`,
  riesgos: "## 4. Riesgos previstos",
  cabRiesgos: [
    "Id",
    "Modo de falla",
    "S·O·D",
    "Prioridad",
    "Casos medidos",
    "Detector",
    "Estado",
    "Casos",
  ],
  ocurreSi: (op, n) => ` (ocurre si ${op} ${n})`,
  fueraPorNulaRiesgo: (n) =>
    `${n} caso(s) quedan fuera de la población del detector porque la señal que la define es nula en ellos.`,
  notaPrioridad:
    "La prioridad es la de acción AIAG-VDA (severidad primero); una mitigación «funcionó» si su riesgo no ocurrió, y está implementada si el contrato de grafo de abajo se cumple.",
  contrato: "### Contrato de grafo: ¿está construido lo que el plan exige?",
  cabNodos: ["Nodo", "Tipo", "En el grafo", "Visitas"],
  senalesYPausas: (presentes, total, conPausa, registradas, rol) =>
    `Señales obligatorias: ${presentes} de ${total} presentes en todas las trazas. Pausas humanas: ${conPausa} caso(s) con pausa, ${registradas} registrada(s), rol «${rol}».`,
  pruebaCruzada:
    "**Prueba cruzada de las ramas (Python ↔ TypeScript):** con los umbrales aplicados, el intérprete de TypeScript recalcula cada decisión del agente.",
  cabRf092: [
    "Corrida",
    "Variante",
    "Visitas",
    "Discrepancias",
    "Misma huella que Python",
  ],
  sinHallazgos: "Sin hallazgos.",
  brechas: "## 5. Brechas no previstas",
  brechasQue:
    "Fallas que aparecen en las trazas y que ningún riesgo del plan detectó en ese caso.",
  ninguna: "Ninguna.",
  repeticion: (id) => ` · repetición \`${id}\``,
  nodoYPaso: (nodo, paso) => ` · nodo \`${nodo}\`, paso ${paso}`,
  reintentos: (n) => ` · ${n} ${n === 1 ? "reintento" : "reintentos"}`,
  evaluadores: "Evaluadores",
  cabEvaluadores: [
    "Evaluador",
    "Tipo",
    "Estado",
    "Casos",
    "Fallas",
    "No evaluables",
    "Riesgos que cubre",
  ],
  supuestos: "## 6. Supuestos",
  criticidad: (c) => `criticidad ${c}`,
  noExiste: "no existe",
  medidas: (n, lista) => `Medidas (n = ${n}): ${lista}.`,
  curva:
    "Curva riesgo-cobertura (umbral de confianza → parte que el agente resuelve sola → errores entre esa parte):",
  cabCurva: ["Umbral", "Cobertura", "Riesgo", "Casos"],
  cabComparacion: (base) => ["", "Multiagente", `Agente único (${base})`],
  garantia: (delta, alfa) =>
    `Garantía de la calibración (δ = ${delta}; el informe declara α = ${alfa}). **Umbral con garantía** (Learn then Test, secuencia fija desde el umbral más alto): el más bajo cuyo error entre lo que el agente decide solo es ≤ α con probabilidad ≥ 1 − δ. **Umbral conformal**: el más alto que deja pasar sin persona al menos 1 − α de los aciertos (marginal, bajo intercambiabilidad). **Zona respaldada**: los umbrales de la rejilla con las dos a la vez.`,
  cabGarantia: (aplicado) => [
    "α",
    "Umbral con garantía",
    "Cobertura · error en él",
    "Umbral conformal",
    "Zona respaldada",
    ...(aplicado === null ? [] : [`¿Está el de la corrida (${aplicado})?`]),
    "Cobertura conjunta",
  ],
  noHay: "no hay",
  noAlcanza: "no alcanza",
  conjunta: (etapas, k) =>
    `Cobertura conjunta (Bonferroni): ${etapas}, cada una con α/${k} y δ/${k} sobre los mismos casos que el agente decide solo ⇒ P(alguna etapa falla) ≤ α con probabilidad ≥ 1 − δ; la columna dice el umbral más bajo con esa garantía.`,
  noObservadas: (etapas, n) =>
    n === 1
      ? `Etapa con modelo sin verdad en el caso (no se observa y la cobertura conjunta no la incluye): ${etapas}.`
      : `Etapas con modelo sin verdad en el caso (no se observan y la cobertura conjunta no las incluye): ${etapas}.`,
  etapa: {
    extractor: "extractor",
    aclaracion: "aclaración",
    redactor: "redactor",
  },
  noAlcanzanLosDatos: "Lo que los datos no alcanzan:",
  secuencia:
    "La prueba parte del umbral más alto y baja hasta que uno no pasa (secuencia fija). Es conservadora: puede decir «no se respalda» donde otro orden pasaría, y elegir el orden mirando los datos invalidaría la seguridad.",
  enNivel: (alfa, que) => `A α = ${alfa}, ${que}`,
  queFalta: {
    umbral: "no hay umbral con garantía",
    conjunta:
      "la cobertura conjunta no se respalda con la secuencia fija desde el umbral más alto",
    zona: "no hay zona respaldada",
  },
  faltan: {
    pocos_casos: (u, n, casos) =>
      `: en ${u} el agente decide solo ${miles(n, "es")} ${n === 1 ? "caso" : "casos"} y, aun sin un solo error, harían falta ${miles(casos, "es")}.`,
    tasa_cerca_de_alfa: (u, n, e, casos, tope, etapa) =>
      `: en ${u} el agente decide solo ${miles(n, "es")} casos y ${etapa ? `la etapa ${etapa}` : "la extracción"} falla en ${miles(e, "es")}; con la misma tasa de error harían falta ${casos === null ? `más de ${miles(tope * n, "es")}` : miles(casos, "es")} casos.`,
    tasa_sobre_alfa: (u, n, e, etapa) =>
      `: en ${u} el agente decide solo ${miles(n, "es")} casos y ${etapa ? `la etapa ${etapa}` : "la extracción"} falla en ${miles(e, "es")}, una tasa que no baja de α: más casos con esa tasa no lo respaldan.`,
  },
  sinZona: {
    sin_cota_conformal: (n, minimo) =>
      `: con ${miles(n, "es")} ${n === 1 ? "acierto" : "aciertos"} no hay umbral conformal; hacen falta al menos ${miles(minimo, "es")}.`,
    conformal_bajo_el_umbral: (tauC, tau) =>
      `: el umbral conformal (${tauC}) queda por debajo del umbral con garantía (${tau}), y ningún umbral da las dos garantías a la vez.`,
  },
  filaExactitud: "Casos resueltos bien (decisión y pausa)",
  filaLatencia: "Latencia mediana",
  filaLlamadas: "Llamadas al modelo (con reintentos)",
  filaCosto: "Costo nominal (US$)",
  difierenYPresupuesto: (casos, respetado) =>
    `Casos donde difieren: ${casos}. Presupuesto de la línea base dentro del multiagente: ${respetado}.`,
  ejemplares: "## 7. Casos ejemplares",
  exitoso: "Exitoso",
  escalado: "Escalado correctamente",
  fallido: "Fallido",
  adversario: "Adversario neutralizado",
  ningunoEnLaCorrida: "ninguno en esta corrida.",
  plazosTitulo: "### Plazos: el reloj simulado",
  plazosIntro: (capacidad, unidad, inicio, fin, dias) =>
    `Cada solicitud llega en uno de los primeros ${dias} días hábiles, en una hora de la jornada (${inicio}–${fin}). Un solo auditor atiende por prioridad de clase y, dentro de ella, por orden de llegada, a ${capacidad} ${unidad}. Lo que el agente decide solo se decide al llegar; lo que pausa, cuando el auditor lo alcanza. El plazo corre en tiempo de calendario: el fin de semana cuenta.`,
  cabPlazos: [
    "Clase",
    "Plazo",
    "Solicitudes",
    "Esperaron al auditor",
    "Fuera de plazo",
    "Espera mediana",
    "Espera máxima",
  ],
  plazoDe: (cantidad, unidad) =>
    unidad === "horas"
      ? `${cantidad} ${cantidad === 1 ? "hora" : "horas"}`
      : `${cantidad} ${cantidad === 1 ? "día calendario" : "días calendario"}`,
  duracion: (m) =>
    m < 60
      ? `${m} min`
      : m < 1440
        ? `${Math.floor(m / 60)} h ${m % 60} min`
        : `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`,
  carga: (pausas, porDia, capacidad) =>
    `Pasaron por el auditor ${pausas} solicitudes: ${porDia} por día hábil en promedio frente a una capacidad de ${capacidad}. La espera mediana se cuenta entre las que esperaron.`,
  horasDeAuditor: (horas) =>
    `Horas de auditor con el costo humano por caso del plan: ${horas} h.`,
  capacidadMinima: (minima, tardias, rango) =>
    `Con ${minima} casos por día, o más, todas se deciden en plazo${tardias === null ? "" : `; con ${minima - 1}, ${tardias} ${tardias === 1 ? "sale" : "salen"} de su plazo`}. El rango que el plan deja mover en el playground es ${rango}.`,
  sinTardias:
    "Ninguna solicitud salió de su plazo con esta capacidad. Que el plazo se cumpla en la simulación no prueba que se cumpliría con otra llegada o con otra capacidad: el playground deja moverla para ver dónde se rompe.",
  tardiasTitulo: "Solicitudes que salieron de su plazo:",
  tardia: (id, clase, espera, plazo) =>
    `${id} (${clase}): se decidió a los ${espera}, con ${plazo} de plazo.`,
  sinPlazo: (clase, n) =>
    `${n} ${n === 1 ? "solicitud" : "solicitudes"} de la clase «${clase}» no tiene${n === 1 ? "" : "n"} plazo en esta simulación: se decidieron al llegar y no cuentan para el plazo.`,
  supuestosDePlazos: "Lo que esta simulación supone:",
  fuenteDePlazos: (norma, consultada) =>
    `Fuente de los plazos: ${norma} Consultada el ${consultada}.`,
  playground: "## 8. Lo que el playground permite explorar",
  cabPlayground: [
    "Umbral",
    "Qué decide",
    "Regla",
    "Rango jugable",
    "Observado (mín · mediana · máx)",
    "Casos justo en el umbral",
  ],
  siNoRango: "sí / no",
  verdaderos: (v, n) => `${v} de ${n} verdaderos`,
  ficha: "## 9. Ficha de reproducibilidad",
  cabFicha: ["Pieza", "Qué es", "Huella SHA-256"],
  piezaPlan: "Plan",
  piezaCasos: "Casos",
  piezaCorrida: "Corrida",
  piezaGrafo: "Grafo",
  piezaRepeticion: "Repetición",
  piezaLineaBase: "Línea base",
  piezaLlegadas: "Llegadas",
  llegadasDelLote: "horas de llegada simuladas del lote, con su semilla",
  casosDelLote: (id, semilla, n, plan) =>
    `${id} · semilla ${semilla} · n = ${n} · generado con el plan ${plan}`,
  corridaDe: (id, fecha, proveedor, variante, plan) =>
    `${id} · ${fecha} · ${proveedor} · ${variante} · ejecutada con el plan ${plan}`,
  mismaVerdad: " (misma verdad: mismos umbrales y contrato de grafo, ADR-005)",
  versionDelGrafo: "versión del grafo exportado",
  sesionesDeLaCorrida: (sesiones, ejecutados, conError, limites) =>
    `Sesiones: ${sesiones} · casos ejecutados: ${ejecutados} · con error del proveedor: ${conError} · límites de uso alcanzados: ${limites}.`,
  umbralesAplicados: (aplicados, delPlan) =>
    `Umbrales aplicados: ${aplicados} · en el plan: ${delPlan}.`,
  revisionHumana: (texto) => `Revisión humana: ${texto}`,
  verificador: (version, formato, huella) =>
    `Verificador ${version} · ${formato} · huella de este informe: \`${huella}\``,
};

const EN: TextosInforme = {
  titulo: "Gap report",
  corrida: "run",
  si: "yes",
  no: "no",
  sesion: (n) => `session ${n}`,
  sesiones: (n) => `${n} ${n === 1 ? "session" : "sessions"}`,
  controlLegal: "legal control",
  conTabla: (efectiva, legal, tabla) =>
    `${efectiva} · ${legal} (table: ${tabla})`,
  resumen: "## 1. Summary for the decision-maker",
  veredicto: "Verdict",
  recomendacion: "Recommendation",
  tresCriterios: "The three most relevant criteria",
  cabResumen: ["Id", "Criterion", "Measured", "Target", "Status"],
  riesgosOcurridos: "Risks that occurred",
  ninguno: "none.",
  porQue: "Why this verdict",
  bloquea: (m) => `- Blocks: ${m}`,
  alerta: (m) => `- Alert: ${m}`,
  nadaBloquea: "- Nothing blocks or alerts.",
  plan: "## 2. The plan in brief",
  problema: "Problem",
  flujo: "Flow",
  decisionesUnaVia: "One-way decisions",
  criterios: "## 3. Acceptance criteria",
  cabCriterios: [
    "Id",
    "Criterion",
    "Cases",
    "Measured",
    "Target",
    "Status",
    "Cases not meeting it",
  ],
  notas: "Notes",
  fueraPorNulaCriterio: (n) =>
    `${n} case(s) fall outside the population because the signal that defines it is null for them (the step that writes it did not run).`,
  riesgos: "## 4. Foreseen risks",
  cabRiesgos: [
    "Id",
    "Failure mode",
    "S·O·D",
    "Priority",
    "Cases measured",
    "Detector",
    "Status",
    "Cases",
  ],
  ocurreSi: (op, n) => ` (occurs if ${op} ${n})`,
  fueraPorNulaRiesgo: (n) =>
    `${n} case(s) fall outside the detector's population because the signal that defines it is null for them.`,
  notaPrioridad:
    "Priority is the AIAG-VDA action priority (severity first); a mitigation “worked” if its risk did not occur, and it is in place if the graph contract below holds.",
  contrato: "### Graph contract: is what the plan requires actually built?",
  cabNodos: ["Node", "Type", "In the graph", "Visits"],
  senalesYPausas: (presentes, total, conPausa, registradas, rol) =>
    `Mandatory signals: ${presentes} of ${total} present in every trace. Human pauses: ${conPausa} case(s) with a pause, ${registradas} recorded, role «${rol}».`,
  pruebaCruzada:
    "**Branch cross-check (Python ↔ TypeScript):** with the applied thresholds, the TypeScript interpreter recomputes every decision the agent took.",
  cabRf092: [
    "Run",
    "Variant",
    "Visits",
    "Mismatches",
    "Same fingerprint as Python",
  ],
  sinHallazgos: "No findings.",
  brechas: "## 5. Unforeseen gaps",
  brechasQue:
    "Failures that appear in the traces and that no risk in the plan detected in that case.",
  ninguna: "None.",
  repeticion: (id) => ` · repetition \`${id}\``,
  nodoYPaso: (nodo, paso) => ` · node \`${nodo}\`, step ${paso}`,
  reintentos: (n) => ` · ${n} ${n === 1 ? "retry" : "retries"}`,
  evaluadores: "Evaluators",
  cabEvaluadores: [
    "Evaluator",
    "Type",
    "Status",
    "Cases",
    "Failures",
    "Not evaluable",
    "Risks it covers",
  ],
  supuestos: "## 6. Assumptions",
  criticidad: (c) => `criticality ${c}`,
  noExiste: "does not exist",
  medidas: (n, lista) => `Measures (n = ${n}): ${lista}.`,
  curva:
    "Risk-coverage curve (confidence threshold → share the agent resolves alone → errors within that share):",
  cabCurva: ["Threshold", "Coverage", "Risk", "Cases"],
  cabComparacion: (base) => ["", "Multi-agent", `Single agent (${base})`],
  garantia: (delta, alfa) =>
    `Calibration guarantee (δ = ${delta}; the report declares α = ${alfa}). **Guaranteed threshold** (Learn then Test, fixed sequence from the highest threshold): the lowest one whose error among what the agent decides alone is ≤ α with probability ≥ 1 − δ. **Conformal threshold**: the highest one that lets at least 1 − α of the correct cases through without a person (marginal, under exchangeability). **Backed zone**: the grid thresholds that have both at once.`,
  cabGarantia: (aplicado) => [
    "α",
    "Guaranteed threshold",
    "Coverage · error there",
    "Conformal threshold",
    "Backed zone",
    ...(aplicado === null ? [] : [`Is the run's (${aplicado}) in it?`]),
    "Joint coverage",
  ],
  noHay: "none",
  noAlcanza: "not reached",
  conjunta: (etapas, k) =>
    `Joint coverage (Bonferroni): ${etapas}, each at α/${k} and δ/${k} on the same cases the agent decides alone ⇒ P(some stage fails) ≤ α with probability ≥ 1 − δ; the column gives the lowest threshold with that guarantee.`,
  noObservadas: (etapas, n) =>
    `Model ${n === 1 ? "stage" : "stages"} with no ground truth in the case (not observed, and left out of the joint coverage): ${etapas}.`,
  etapa: {
    extractor: "extractor",
    aclaracion: "clarification",
    redactor: "writer",
  },
  noAlcanzanLosDatos: "What the data does not reach:",
  secuencia:
    "The test starts at the highest threshold and goes down until one fails (fixed sequence). It is conservative: it may say “not backed” where another order would pass, and choosing the order after looking at the data would void the confidence.",
  enNivel: (alfa, que) => `At α = ${alfa}, ${que}`,
  queFalta: {
    umbral: "there is no guaranteed threshold",
    conjunta:
      "the joint coverage is not backed by the fixed sequence from the highest threshold",
    zona: "there is no backed zone",
  },
  faltan: {
    pocos_casos: (u, n, casos) =>
      `: at ${u} the agent decides ${miles(n, "en")} ${n === 1 ? "case" : "cases"} alone and, even without a single error, it would take ${miles(casos, "en")}.`,
    tasa_cerca_de_alfa: (u, n, e, casos, tope, etapa) =>
      `: at ${u} the agent decides ${miles(n, "en")} cases alone and ${etapa ? `the ${etapa} stage` : "extraction"} fails in ${miles(e, "en")}; at the same error rate it would take ${casos === null ? `more than ${miles(tope * n, "en")}` : miles(casos, "en")} cases.`,
    tasa_sobre_alfa: (u, n, e, etapa) =>
      `: at ${u} the agent decides ${miles(n, "en")} cases alone and ${etapa ? `the ${etapa} stage` : "extraction"} fails in ${miles(e, "en")}, a rate that does not go below α: more cases at that rate never back it.`,
  },
  sinZona: {
    sin_cota_conformal: (n, minimo) =>
      `: with ${miles(n, "en")} correct ${n === 1 ? "case" : "cases"} there is no conformal threshold; it takes at least ${miles(minimo, "en")}.`,
    conformal_bajo_el_umbral: (tauC, tau) =>
      `: the conformal threshold (${tauC}) falls below the guaranteed threshold (${tau}), and no threshold gives both guarantees at once.`,
  },
  filaExactitud: "Cases resolved right (decision and pause)",
  filaLatencia: "Median latency",
  filaLlamadas: "Model calls (with retries)",
  filaCosto: "Nominal cost (US$)",
  difierenYPresupuesto: (casos, respetado) =>
    `Cases where they differ: ${casos}. Baseline budget within the multi-agent one: ${respetado}.`,
  ejemplares: "## 7. Example cases",
  exitoso: "Successful",
  escalado: "Correctly escalated",
  fallido: "Failed",
  adversario: "Adversary neutralised",
  ningunoEnLaCorrida: "none in this run.",
  plazosTitulo: "### Deadlines: the simulated clock",
  plazosIntro: (capacidad, unidad, inicio, fin, dias) =>
    `Each request arrives on one of the first ${dias} business days, at a time within the working day (${inicio}–${fin}). A single auditor serves by class priority and, within it, in order of arrival, at ${capacidad} ${unidad}. What the agent decides alone is decided on arrival; what pauses is decided when the auditor reaches it. The deadline runs on calendar time: the weekend counts.`,
  cabPlazos: [
    "Class",
    "Deadline",
    "Requests",
    "Waited for the auditor",
    "Past deadline",
    "Median wait",
    "Longest wait",
  ],
  plazoDe: (cantidad, unidad) =>
    unidad === "horas"
      ? `${cantidad} ${cantidad === 1 ? "hour" : "hours"}`
      : `${cantidad} calendar ${cantidad === 1 ? "day" : "days"}`,
  duracion: (m) =>
    m < 60
      ? `${m} min`
      : m < 1440
        ? `${Math.floor(m / 60)} h ${m % 60} min`
        : `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`,
  carga: (pausas, porDia, capacidad) =>
    `${pausas} requests went through the auditor: ${porDia} per business day on average against a capacity of ${capacidad}. The median wait is taken among those that waited.`,
  horasDeAuditor: (horas) =>
    `Auditor hours at the plan's human cost per case: ${horas} h.`,
  capacidadMinima: (minima, tardias, rango) =>
    `At ${minima} cases per day or more, every request is decided within its deadline${tardias === null ? "" : `; at ${minima - 1}, ${tardias} go${tardias === 1 ? "es" : ""} past ${tardias === 1 ? "its" : "their"} deadline`}. The range the plan lets you move in the playground is ${rango}.`,
  sinTardias:
    "No request went past its deadline at this capacity. Meeting the deadline in the simulation does not prove it would be met with other arrivals or another capacity: the playground lets you move it to see where it breaks.",
  tardiasTitulo: "Requests that went past their deadline:",
  tardia: (id, clase, espera, plazo) =>
    `${id} (${clase}): decided after ${espera}, against a ${plazo} deadline.`,
  sinPlazo: (clase, n) =>
    `${n} ${n === 1 ? "request" : "requests"} of the “${clase}” class ${n === 1 ? "has" : "have"} no deadline in this simulation: ${n === 1 ? "it was" : "they were"} decided on arrival and ${n === 1 ? "does" : "do"} not count toward the deadline.`,
  supuestosDePlazos: "What this simulation assumes:",
  fuenteDePlazos: (norma, consultada) =>
    `Source of the deadlines: ${norma} Read on ${consultada}.`,
  playground: "## 8. What the playground lets you explore",
  cabPlayground: [
    "Threshold",
    "What it decides",
    "Rule",
    "Playable range",
    "Observed (min · median · max)",
    "Cases right at the threshold",
  ],
  siNoRango: "yes / no",
  verdaderos: (v, n) => `${v} of ${n} true`,
  ficha: "## 9. Reproducibility record",
  cabFicha: ["Piece", "What it is", "SHA-256 fingerprint"],
  piezaPlan: "Plan",
  piezaCasos: "Cases",
  piezaCorrida: "Run",
  piezaGrafo: "Graph",
  piezaRepeticion: "Repetition",
  piezaLineaBase: "Baseline",
  piezaLlegadas: "Arrivals",
  llegadasDelLote: "simulated arrival times for the batch, with its seed",
  casosDelLote: (id, semilla, n, plan) =>
    `${id} · seed ${semilla} · n = ${n} · generated with plan ${plan}`,
  corridaDe: (id, fecha, proveedor, variante, plan) =>
    `${id} · ${fecha} · ${proveedor} · ${variante} · run with plan ${plan}`,
  mismaVerdad: " (same truth: same thresholds and graph contract, ADR-005)",
  versionDelGrafo: "exported graph version",
  sesionesDeLaCorrida: (sesiones, ejecutados, conError, limites) =>
    `Sessions: ${sesiones} · cases run: ${ejecutados} · with a provider error: ${conError} · usage limits reached: ${limites}.`,
  umbralesAplicados: (aplicados, delPlan) =>
    `Applied thresholds: ${aplicados} · in the plan: ${delPlan}.`,
  revisionHumana: (texto) => `Human review: ${texto}`,
  verificador: (version, formato, huella) =>
    `Verifier ${version} · ${formato} · fingerprint of this report: \`${huella}\``,
};

export const TEXTOS_INFORME: Readonly<Record<Idioma, TextosInforme>> = {
  es: ES,
  en: EN,
};
