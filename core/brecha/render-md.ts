/**
 * El informe en Markdown, en español y en inglés (§ 12 de la especificación, 9 secciones). Redactado en
 * los dos idiomas desde plantillas (regla 20): el JSON es la fuente y cada idioma se escribe, no se
 * traduce. El estado nunca va solo en color: símbolo + texto (regla dura 13).
 */
import type { Idioma, TextoBilingue } from "../formatos/bilingue";
import type { ResultadoCriterio } from "./criterios";
import type { ResultadoRiesgo } from "./detectores";
import { partirDisparador } from "./detectores";
import type { CasoEjemplar, Informe, UmbralJugable } from "./informe";
import { num, numCorto, pct } from "./numeros";
import type { ResultadoSupuesto } from "./supuestos";

type Tb = TextoBilingue;
const tb = (es: string, en: string): Tb => ({ es, en });

const ESTADO_CRITERIO: Record<ResultadoCriterio["estado"], Tb> = {
  cumple: tb("✓ cumple", "✓ met"),
  incumple: tb("✗ incumple", "✗ not met"),
  incompleto: tb("◐ incompleto", "◐ incomplete"),
  indeterminado: tb("? indeterminado", "? undetermined"),
  sin_poblacion: tb("— sin casos que lo prueben", "— no case tests it"),
  mal_formado: tb("⚠ regla mal formada", "⚠ malformed rule"),
};

const ESTADO_RIESGO: Record<ResultadoRiesgo["estado"], Tb> = {
  ocurrio: tb("✗ ocurrió", "✗ occurred"),
  no_ocurrio: tb("✓ no ocurrió", "✓ did not occur"),
  indeterminado: tb("? indeterminado", "? undetermined"),
  sin_poblacion: tb("— sin casos que lo prueben", "— no case tests it"),
  no_detectable: tb("— no detectable en trazas", "— not detectable in traces"),
  mal_formado: tb("⚠ detector mal formado", "⚠ malformed detector"),
};

const ESTADO_SUPUESTO: Record<ResultadoSupuesto["estado"], Tb> = {
  confirmado: tb("✓ confirmado", "✓ confirmed"),
  refutado: tb("✗ refutado", "✗ refuted"),
  sin_probar: tb("◌ sin probar", "◌ untested"),
};

/** Las mismas palabras que la vitrina y la maqueta aprobada («Meets with warnings»): AU-S2-B44. */
const VEREDICTO: Record<Informe["veredicto"]["valor"], Tb> = {
  cumple: tb("✓ CUMPLE", "✓ MEETS"),
  cumple_con_alertas: tb("⚠ CUMPLE CON ALERTAS", "⚠ MEETS WITH WARNINGS"),
  no_cumple: tb("✗ NO CUMPLE", "✗ DOES NOT MEET"),
};

const PRIORIDAD: Record<string, Tb> = {
  alta: tb("alta", "high"),
  media: tb("media", "medium"),
  baja: tb("baja", "low"),
};

/**
 * Prioridad de un riesgo (instrumentos-de-plan v0.2.0, G8): la efectiva manda; con control legal se dice, y
 * la de tabla se muestra al lado cuando difiere — nunca se oculta.
 */
function prioridadRiesgo(r: Informe["riesgos"][number], i: Idioma): string {
  const efectiva =
    PRIORIDAD[r.prioridad_de_accion]?.[i] ?? r.prioridad_de_accion;
  if (!r.control_legal) return efectiva;
  const legal = i === "es" ? "control legal" : "legal control";
  if (r.prioridad_de_tabla === r.prioridad_de_accion)
    return `${efectiva} · ${legal}`;
  const tabla = PRIORIDAD[r.prioridad_de_tabla]?.[i] ?? r.prioridad_de_tabla;
  return `${efectiva} · ${legal} (${i === "es" ? "tabla" : "table"}: ${tabla})`;
}

/** Enumeraciones del dominio del verificador, redactadas en los dos idiomas (regla 20). */
const TIPO_NODO: Record<string, Tb> = {
  enrutador: tb("enrutador", "router"),
  modelo: tb("modelo", "model"),
  regla: tb("regla", "rule"),
  pausa_humana: tb("pausa humana", "human pause"),
};
const TIPO_EVALUADOR: Record<string, Tb> = {
  regla: tb("regla", "rule"),
  juez_modelo: tb("juez con modelo", "model judge"),
  humano: tb("persona", "person"),
};
const CATEGORIA_BRECHA: Record<string, Tb> = {
  evaluador: tb("evaluador", "evaluator"),
  error_proveedor: tb("error del proveedor", "provider error"),
  reintento_de_esquema: tb(
    "reintento de salida estructurada",
    "structured-output retry",
  ),
  evaluador_no_ejecutado: tb("evaluador sin correr", "evaluator not run"),
};
const VARIANTE: Record<string, Tb> = {
  multiagente: tb("multiagente", "multi-agent"),
  agente_unico: tb("agente único", "single agent"),
};
const METRICA: Record<string, Tb> = {
  auroc: tb("AUROC", "AUROC"),
  ece: tb("ECE", "ECE"),
  exactitud: tb("exactitud", "accuracy"),
  exactitud_base: tb("exactitud de la línea base", "baseline accuracy"),
  latencia_mediana: tb("latencia mediana", "median latency"),
  latencia_mediana_base: tb(
    "latencia mediana de la línea base",
    "baseline median latency",
  ),
  tasa: tb("tasa", "rate"),
};
const nombre = (mapa: Record<string, Tb>, x: string, i: Idioma): string =>
  mapa[x]?.[i] ?? x;

const SIMBOLO_OPERADOR: Record<string, [string, string]> = {
  igual_a: ["=", "="],
  distinto_de: ["≠", "≠"],
  menor_que: ["<", "≤"],
  mayor_que: [">", "≥"],
  menor_o_igual_que: ["≤", "≤"],
  mayor_o_igual_que: ["≥", "≥"],
};

function operador(op: string, inclusivo: boolean): string {
  const par = SIMBOLO_OPERADOR[op] ?? [op, op];
  return inclusivo ? par[1] : par[0];
}

const celda = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const fila = (xs: readonly string[]) => `| ${xs.map(celda).join(" | ")} |`;
const tabla = (cab: readonly string[], filas: readonly (readonly string[])[]) =>
  [fila(cab), fila(cab.map(() => "---")), ...filas.map(fila)].join("\n");
const siNo = (b: boolean, i: Idioma) =>
  b ? (i === "es" ? "sí" : "yes") : "no";
const casos = (ids: readonly string[]) =>
  ids.length === 0 ? "—" : ids.join(", ");

/** Casos de un riesgo; con detector de ámbito `sesion` (M-14) son sesiones del manifiesto. */
const casosDeRiesgo = (r: Informe["riesgos"][number], i: Idioma) =>
  r.ambito === "sesion"
    ? casos(
        r.casos.map((c) =>
          c.replace(/^sesion-/, i === "es" ? "sesión " : "session "),
        ),
      )
    : casos(r.casos);

function valorCriterio(c: ResultadoCriterio, i: Idioma): string {
  const v = c.valor_medido;
  if (v === null) return "—";
  if (typeof v === "boolean") return siNo(v, i);
  if (c.metrica)
    return c.tipo === "latencia" ? `${numCorto(v, i)} s` : numCorto(v, i);
  return pct(v, i);
}

function objetivoCriterio(c: ResultadoCriterio, i: Idioma): string {
  const o = c.objetivo;
  if (typeof o === "boolean") return siNo(o, i);
  if (c.tipo === "latencia") return `≤ ${numCorto(o, i)} s`;
  if (c.tipo === "costo") return `≤ ${numCorto(o, i)}`;
  if (c.agregacion === "pass^k" && c.k)
    return `≥ ${pct(o, i)} (k = ${c.k.requerido})`;
  return `≥ ${pct(o, i)}`;
}

function notasCriterio(c: ResultadoCriterio, i: Idioma): string[] {
  const out: string[] = [];
  if (c.nota) out.push(c.nota[i]);
  if (c.fuera_por_senal_nula > 0)
    out.push(
      i === "es"
        ? `${c.fuera_por_senal_nula} caso(s) quedan fuera de la población porque la señal que la define es nula en ellos (el paso que la escribe no corrió).`
        : `${c.fuera_por_senal_nula} case(s) fall outside the population because the signal that defines it is null for them (the step that writes it did not run).`,
    );
  for (const n of c.no_evaluables) out.push(`${n.caso_id}: ${n.motivo[i]}`);
  return out;
}

function seccionResumen(inf: Informe, i: Idioma): string {
  const porId = new Map(inf.criterios.map((c) => [c.id, c]));
  const destacados = inf.resumen.criterios_destacados
    .map((id) => porId.get(id))
    .filter((c): c is ResultadoCriterio => c !== undefined);
  const ocurridos = inf.riesgos.filter((r) => r.estado === "ocurrio");
  const motivos = [
    ...inf.veredicto.bloqueantes.map(
      (m) => `- ${i === "es" ? "Bloquea" : "Blocks"}: ${m[i]}`,
    ),
    ...inf.veredicto.alertas.map(
      (m) => `- ${i === "es" ? "Alerta" : "Alert"}: ${m[i]}`,
    ),
  ];
  return [
    i === "es"
      ? "## 1. Resumen para quien decide"
      : "## 1. Summary for the decision-maker",
    "",
    `**${i === "es" ? "Veredicto" : "Verdict"}: ${VEREDICTO[inf.veredicto.valor][i]}**`,
    "",
    inf.resumen.texto[i],
    "",
    `**${i === "es" ? "Recomendación" : "Recommendation"}:** ${inf.resumen.recomendacion[i]}`,
    "",
    `**${i === "es" ? "Los tres criterios más relevantes" : "The three most relevant criteria"}**`,
    "",
    tabla(
      i === "es"
        ? ["Id", "Criterio", "Medido", "Objetivo", "Estado"]
        : ["Id", "Criterion", "Measured", "Target", "Status"],
      destacados.map((c) => [
        c.id,
        c.enunciado[i],
        valorCriterio(c, i),
        objetivoCriterio(c, i),
        ESTADO_CRITERIO[c.estado][i],
      ]),
    ),
    "",
    `**${i === "es" ? "Riesgos que ocurrieron" : "Risks that occurred"}:** ${
      ocurridos.length === 0
        ? i === "es"
          ? "ninguno."
          : "none."
        : ocurridos
            .map((r) => `${r.id} (${r.modo[i]}, ${casosDeRiesgo(r, i)})`)
            .join("; ") + "."
    }`,
    "",
    `**${i === "es" ? "Por qué este veredicto" : "Why this verdict"}**`,
    "",
    ...(motivos.length > 0
      ? motivos
      : [
          i === "es"
            ? "- Nada bloquea ni alerta."
            : "- Nothing blocks or alerts.",
        ]),
  ].join("\n");
}

function seccionPlan(inf: Informe, i: Idioma): string {
  const p = inf.plan_en_breve;
  return [
    i === "es" ? "## 2. El plan en breve" : "## 2. The plan in brief",
    "",
    `**${i === "es" ? "Problema" : "Problem"}.** ${p.problema[i]}`,
    "",
    `**${i === "es" ? "Flujo" : "Flow"}**`,
    "",
    ...p.flujo.map((f, k) => `${k + 1}. ${f[i]}`),
    "",
    `**${i === "es" ? "Decisiones de una sola vía" : "One-way decisions"}**`,
    "",
    ...p.decisiones_una_via.map(
      (d) =>
        `- **${d.id}** — ${d.pregunta[i]}${d.opcion_elegida ? ` → ${d.opcion_elegida[i]}.` : ""}${d.justificacion ? ` ${d.justificacion[i]}` : ""}`,
    ),
  ].join("\n");
}

function seccionCriterios(inf: Informe, i: Idioma): string {
  const notas = inf.criterios.flatMap((c) =>
    notasCriterio(c, i).map((n) => `- **${c.id}** — ${n}`),
  );
  return [
    i === "es" ? "## 3. Criterios de aceptación" : "## 3. Acceptance criteria",
    "",
    tabla(
      i === "es"
        ? [
            "Id",
            "Criterio",
            "Casos",
            "Medido",
            "Objetivo",
            "Estado",
            "Casos que incumplen",
          ]
        : [
            "Id",
            "Criterion",
            "Cases",
            "Measured",
            "Target",
            "Status",
            "Cases not meeting it",
          ],
      inf.criterios.map((c) => [
        c.id,
        c.enunciado[i],
        String(c.n_poblacion),
        valorCriterio(c, i),
        objetivoCriterio(c, i),
        ESTADO_CRITERIO[c.estado][i],
        casos(c.casos_que_incumplen),
      ]),
    ),
    ...(notas.length > 0
      ? ["", `**${i === "es" ? "Notas" : "Notes"}**`, "", ...notas]
      : []),
  ].join("\n");
}

function valorRiesgo(r: ResultadoRiesgo, i: Idioma): string {
  if (r.valor === null) return "—";
  const tasa = r.tipo_detector === "tasa";
  const fmt = (x: number): string => (tasa ? pct(x, i) : numCorto(x, i));
  const d = r.ocurre_si === null ? null : partirDisparador(r.ocurre_si);
  const regla = d
    ? ` (${i === "es" ? "ocurre si" : "occurs if"} ${d.op} ${fmt(d.n)})`
    : "";
  return `${fmt(r.valor)}${regla}`;
}

function notasRiesgo(r: ResultadoRiesgo, i: Idioma): string[] {
  const out: string[] = [];
  if (r.nota) out.push(r.nota[i]);
  if (r.fuera_por_senal_nula > 0)
    out.push(
      i === "es"
        ? `${r.fuera_por_senal_nula} caso(s) quedan fuera de la población del detector porque la señal que la define es nula en ellos.`
        : `${r.fuera_por_senal_nula} case(s) fall outside the detector's population because the signal that defines it is null for them.`,
    );
  for (const n of r.no_evaluables) out.push(`${n.caso_id}: ${n.motivo[i]}`);
  return out;
}

function seccionRiesgos(inf: Informe, i: Idioma): string {
  const ct = inf.contrato_de_grafo;
  // M-24: los casos que el detector no pudo medir y los que quedan fuera por una señal nula se ven, como en criterios.
  const notas = inf.riesgos.flatMap((r) =>
    notasRiesgo(r, i).map((n) => `- **${r.id}** — ${n}`),
  );
  const hallazgos = ct.hallazgos.map(
    (h) =>
      `- ${h.severidad === "bloqueante" ? "✗" : "⚠"} \`${h.codigo}\`${h.caso_id ? ` ${h.caso_id}` : ""} (${h.corrida_id}): ${h.detalle[i]}`,
  );
  return [
    i === "es" ? "## 4. Riesgos previstos" : "## 4. Foreseen risks",
    "",
    tabla(
      i === "es"
        ? [
            "Id",
            "Modo de falla",
            "S·O·D",
            "Prioridad",
            "Casos medidos",
            "Detector",
            "Estado",
            "Casos",
          ]
        : [
            "Id",
            "Failure mode",
            "S·O·D",
            "Priority",
            "Cases measured",
            "Detector",
            "Status",
            "Cases",
          ],
      inf.riesgos.map((r) => [
        r.id,
        r.modo[i],
        `${r.severidad}·${r.ocurrencia}·${r.deteccion}`,
        prioridadRiesgo(r, i),
        r.ambito === "sesion"
          ? `${r.n_poblacion} ${i === "es" ? (r.n_poblacion === 1 ? "sesión" : "sesiones") : r.n_poblacion === 1 ? "session" : "sessions"}`
          : String(r.n_poblacion),
        valorRiesgo(r, i),
        ESTADO_RIESGO[r.estado][i],
        casosDeRiesgo(r, i),
      ]),
    ),
    "",
    i === "es"
      ? "La prioridad es la de acción AIAG-VDA (severidad primero); una mitigación «funcionó» si su riesgo no ocurrió, y está implementada si el contrato de grafo de abajo se cumple."
      : "Priority is the AIAG-VDA action priority (severity first); a mitigation “worked” if its risk did not occur, and it is in place if the graph contract below holds.",
    ...(notas.length > 0 ? ["", ...notas] : []),
    "",
    i === "es"
      ? "### Contrato de grafo: ¿está construido lo que el plan exige?"
      : "### Graph contract: is what the plan requires actually built?",
    "",
    tabla(
      i === "es"
        ? ["Nodo", "Tipo", "En el grafo", "Visitas"]
        : ["Node", "Type", "In the graph", "Visits"],
      ct.nodos.map((n) => [
        n.id,
        nombre(TIPO_NODO, n.tipo, i),
        n.en_grafo ? "✓" : "✗",
        String(n.visitas),
      ]),
    ),
    "",
    i === "es"
      ? `Señales obligatorias: ${ct.senales.filter((s) => s.presente_en === s.de).length} de ${ct.senales.length} presentes en todas las trazas. Pausas humanas: ${ct.pausas.casos_con_pausa} caso(s) con pausa, ${ct.pausas.pausas_registradas} registrada(s), rol «${ct.pausas.rol}».`
      : `Mandatory signals: ${ct.senales.filter((s) => s.presente_en === s.de).length} of ${ct.senales.length} present in every trace. Human pauses: ${ct.pausas.casos_con_pausa} case(s) with a pause, ${ct.pausas.pausas_registradas} recorded, role «${ct.pausas.rol}».`,
    "",
    i === "es"
      ? "**Prueba cruzada de las ramas (Python ↔ TypeScript):** con los umbrales aplicados, el intérprete de TypeScript recalcula cada decisión del agente."
      : "**Branch cross-check (Python ↔ TypeScript):** with the applied thresholds, the TypeScript interpreter recomputes every decision the agent took.",
    "",
    tabla(
      i === "es"
        ? [
            "Corrida",
            "Variante",
            "Visitas",
            "Discrepancias",
            "Misma huella que Python",
          ]
        : [
            "Run",
            "Variant",
            "Visits",
            "Mismatches",
            "Same fingerprint as Python",
          ],
      ct.rf_09_2.map((r) => [
        r.corrida_id,
        nombre(VARIANTE, r.variante, i),
        String(r.visitas),
        String(r.discrepancias),
        r.coincide ? "✓" : "✗",
      ]),
    ),
    "",
    ...(hallazgos.length > 0
      ? hallazgos
      : [i === "es" ? "Sin hallazgos." : "No findings."]),
  ].join("\n");
}

function seccionBrechas(inf: Informe, i: Idioma): string {
  const b = inf.brechas_no_previstas;
  const ESTADO_EVAL: Record<string, Tb> = {
    ejecutado: tb("ejecutado", "run"),
    no_ejecutado_opcional: tb(
      "no corrió (opcional en este corte)",
      "did not run (optional in this cut)",
    ),
    no_ejecutado: tb("✗ no corrió", "✗ did not run"),
    sin_implementacion: tb("✗ sin implementación", "✗ not implemented"),
    mal_formado: tb("⚠ no pudo medir", "⚠ could not measure"),
  };
  return [
    i === "es" ? "## 5. Brechas no previstas" : "## 5. Unforeseen gaps",
    "",
    i === "es"
      ? "Fallas que aparecen en las trazas y que ningún riesgo del plan detectó en ese caso."
      : "Failures that appear in the traces and that no risk in the plan detected in that case.",
    "",
    ...(b.brechas.length === 0
      ? [i === "es" ? "Ninguna." : "None."]
      : b.brechas.map(
          (x) =>
            `- ${x.caso_id ? `**${x.caso_id}**` : "—"} · ${nombre(CATEGORIA_BRECHA, x.categoria, i)}${x.corrida_id !== inf.corrida_id ? ` · ${i === "es" ? "repetición" : "repetition"} \`${x.corrida_id}\`` : ""}${x.nodo ? ` · ${i === "es" ? "nodo" : "node"} \`${x.nodo}\`, ${i === "es" ? "paso" : "step"} ${x.paso ?? "—"}` : ""}${x.reintentos !== null ? ` · ${x.reintentos} ${i === "es" ? (x.reintentos === 1 ? "reintento" : "reintentos") : x.reintentos === 1 ? "retry" : "retries"}` : ""}: ${x.detalle[i]}`,
        )),
    "",
    `**${i === "es" ? "Evaluadores" : "Evaluators"}**`,
    "",
    tabla(
      i === "es"
        ? [
            "Evaluador",
            "Tipo",
            "Estado",
            "Casos",
            "Fallas",
            "No evaluables",
            "Riesgos que cubre",
          ]
        : [
            "Evaluator",
            "Type",
            "Status",
            "Cases",
            "Failures",
            "Not evaluable",
            "Risks it covers",
          ],
      b.evaluadores.map((e) => [
        e.id,
        nombre(TIPO_EVALUADOR, e.tipo, i),
        ESTADO_EVAL[e.estado]?.[i] ?? e.estado,
        String(e.casos_evaluados),
        casos(e.fallas),
        String(e.no_evaluables),
        casos(e.riesgos_cubiertos),
      ]),
    ),
  ].join("\n");
}

function seccionSupuesto(s: ResultadoSupuesto, i: Idioma): string {
  const lineas = [
    `### ${s.id} — ${s.enunciado[i]}`,
    "",
    `**${ESTADO_SUPUESTO[s.estado][i]}** (${i === "es" ? "criticidad" : "criticality"} ${PRIORIDAD[s.criticidad]?.[i] ?? s.criticidad}). ${s.motivo[i]}`,
  ];
  const metricas = Object.keys(s.metricas)
    .sort()
    .map((k) => {
      const v = s.metricas[k];
      return `${nombre(METRICA, k, i)} = ${v === null || v === undefined ? (i === "es" ? "no existe" : "does not exist") : numCorto(v, i, 4)}`;
    });
  if (metricas.length > 0)
    lineas.push(
      "",
      `${i === "es" ? "Medidas" : "Measures"} (n = ${s.n}): ${metricas.join(" · ")}.`,
    );
  for (const l of s.limitaciones) lineas.push("", `> ${l[i]}`);
  if (s.curva)
    lineas.push(
      "",
      i === "es"
        ? "Curva riesgo-cobertura (umbral de confianza → parte que el agente resuelve sola → errores entre esa parte):"
        : "Risk-coverage curve (confidence threshold → share the agent resolves alone → errors within that share):",
      "",
      tabla(
        i === "es"
          ? ["Umbral", "Cobertura", "Riesgo", "Casos"]
          : ["Threshold", "Coverage", "Risk", "Cases"],
        s.curva.map((p) => [
          num(p.umbral, i, 2),
          pct(p.cobertura, i),
          p.riesgo === null ? "—" : pct(p.riesgo, i),
          String(p.aceptados),
        ]),
      ),
    );
  if (s.comparacion) {
    const c = s.comparacion;
    const lat = (x: number | null) =>
      x === null ? "—" : `${numCorto(x, i)} s`;
    lineas.push(
      "",
      tabla(
        i === "es"
          ? ["", "Multiagente", `Agente único (${c.corrida_base})`]
          : ["", "Multi-agent", `Single agent (${c.corrida_base})`],
        [
          [
            i === "es"
              ? "Casos resueltos bien (decisión y pausa)"
              : "Cases resolved right (decision and pause)",
            pct(c.exactitud.multiagente, i),
            pct(c.exactitud.agente_unico, i),
          ],
          [
            i === "es" ? "Latencia mediana" : "Median latency",
            lat(c.latencia_mediana_s.multiagente),
            lat(c.latencia_mediana_s.agente_unico),
          ],
          [
            i === "es"
              ? "Llamadas al modelo (con reintentos)"
              : "Model calls (with retries)",
            String(c.presupuesto.multiagente.llamadas_al_modelo),
            String(c.presupuesto.agente_unico.llamadas_al_modelo),
          ],
          [
            "Tokens",
            String(c.presupuesto.multiagente.tokens),
            String(c.presupuesto.agente_unico.tokens),
          ],
          [
            i === "es" ? "Costo nominal (US$)" : "Nominal cost (US$)",
            num(c.presupuesto.multiagente.costo_nominal_usd, i, 4),
            num(c.presupuesto.agente_unico.costo_nominal_usd, i, 4),
          ],
        ],
      ),
      "",
      i === "es"
        ? `Casos donde difieren: ${casos(c.casos_distintos)}. Presupuesto de la línea base dentro del multiagente: ${siNo(c.presupuesto_respetado, i)}.`
        : `Cases where they differ: ${casos(c.casos_distintos)}. Baseline budget within the multi-agent one: ${siNo(c.presupuesto_respetado, i)}.`,
    );
  }
  return lineas.join("\n");
}

function seccionSupuestos(inf: Informe, i: Idioma): string {
  return [
    i === "es" ? "## 6. Supuestos" : "## 6. Assumptions",
    "",
    ...inf.supuestos.flatMap((s) => [seccionSupuesto(s, i), ""]),
  ]
    .join("\n")
    .trimEnd();
}

function seccionEjemplares(inf: Informe, i: Idioma): string {
  const e = inf.casos_ejemplares;
  const linea = (titulo: Tb, c: CasoEjemplar | null) =>
    `- **${titulo[i]}:** ${c ? `${c.caso_id} (${c.subtipo}). ${c.por_que[i]}` : i === "es" ? "ninguno en esta corrida." : "none in this run."}`;
  return [
    i === "es" ? "## 7. Casos ejemplares" : "## 7. Example cases",
    "",
    linea(tb("Exitoso", "Successful"), e.exitoso),
    linea(
      tb("Escalado correctamente", "Correctly escalated"),
      e.escalado_correctamente,
    ),
    linea(tb("Fallido", "Failed"), e.fallido),
    linea(
      tb("Adversario neutralizado", "Adversary neutralised"),
      e.adversario_neutralizado,
    ),
  ].join("\n");
}

function observado(u: UmbralJugable, i: Idioma): string {
  const o = u.observados;
  if (o.verdaderos !== null)
    return i === "es"
      ? `${o.verdaderos} de ${o.n} verdaderos`
      : `${o.verdaderos} of ${o.n} true`;
  if (o.min === null || o.max === null || o.mediana === null) return "—";
  return `${numCorto(o.min, i)} · ${numCorto(o.mediana, i)} · ${numCorto(o.max, i)} (n = ${o.n})`;
}

function seccionPlayground(inf: Informe, i: Idioma): string {
  const valor = (x: number | boolean | null) =>
    x === null ? "—" : typeof x === "boolean" ? String(x) : numCorto(x, i);
  return [
    i === "es"
      ? "## 8. Lo que el playground permite explorar"
      : "## 8. What the playground lets you explore",
    "",
    tabla(
      i === "es"
        ? [
            "Umbral",
            "Qué decide",
            "Regla",
            "Rango jugable",
            "Observado (mín · mediana · máx)",
            "Casos justo en el umbral",
          ]
        : [
            "Threshold",
            "What it decides",
            "Rule",
            "Playable range",
            "Observed (min · median · max)",
            "Cases right at the threshold",
          ],
      inf.playground.umbrales.map((u) => [
        u.id,
        u.nombre[i],
        `${u.senal} ${operador(u.operador, u.inclusivo)} ${valor(u.valor_aplicado)}`,
        u.rango === "booleano"
          ? i === "es"
            ? "sí / no"
            : "yes / no"
          : `${numCorto(u.rango.min, i)}–${numCorto(u.rango.max, i)}`,
        observado(u, i),
        casos(u.casos_en_el_umbral),
      ]),
    ),
    "",
    ...inf.playground.limites.map((l) => `- ${l[i]}`),
  ].join("\n");
}

function seccionFicha(inf: Informe, i: Idioma): string {
  const f = inf.ficha_reproducibilidad;
  const umbrales = (u: Record<string, number | boolean>) =>
    Object.keys(u)
      .sort()
      .map(
        (k) =>
          `${k} = ${typeof u[k] === "number" ? numCorto(u[k] as number, i) : String(u[k])}`,
      )
      .join(" · ");
  const filas: string[][] = [
    [
      i === "es" ? "Plan" : "Plan",
      `${f.plan.id} ${f.plan.version} (\`${f.plan.archivo}\`)`,
      `\`${f.plan.huella}\``,
    ],
    [
      i === "es" ? "Casos" : "Cases",
      `${f.casos.id} · ${i === "es" ? "semilla" : "seed"} ${f.casos.semilla} · n = ${f.casos.n_lote} · ${i === "es" ? "generado con el plan" : "generated with plan"} ${f.casos.plan_de_generacion.version}`,
      `\`${f.casos.huella}\``,
    ],
    [
      i === "es" ? "Corrida" : "Run",
      `${f.corrida.id} · ${f.corrida.fecha} · ${f.corrida.proveedor}/${f.corrida.modelo} · ${nombre(VARIANTE, f.corrida.variante, i)} · ${i === "es" ? "ejecutada con el plan" : "run with plan"} ${f.corrida.plan_de_ejecucion.version}${f.corrida.plan_de_ejecucion.huella === f.plan.huella ? "" : i === "es" ? " (misma verdad: mismos umbrales y contrato de grafo, ADR-005)" : " (same truth: same thresholds and graph contract, ADR-005)"}`,
      `\`${f.corrida.huella}\``,
    ],
    [
      i === "es" ? "Grafo" : "Graph",
      i === "es" ? "versión del grafo exportado" : "exported graph version",
      `\`${f.corrida.version_grafo}\``,
    ],
    ...f.repeticiones.map((r) => [
      i === "es" ? "Repetición" : "Repetition",
      r.corrida_id,
      `\`${r.huella}\``,
    ]),
    ...(f.linea_base
      ? [
          [
            i === "es" ? "Línea base" : "Baseline",
            f.linea_base.corrida_id,
            `\`${f.linea_base.huella}\``,
          ],
        ]
      : []),
  ];
  return [
    i === "es"
      ? "## 9. Ficha de reproducibilidad"
      : "## 9. Reproducibility record",
    "",
    tabla(
      i === "es"
        ? ["Pieza", "Qué es", "Huella SHA-256"]
        : ["Piece", "What it is", "SHA-256 fingerprint"],
      filas,
    ),
    "",
    i === "es"
      ? `Sesiones: ${f.corrida.sesiones} · casos ejecutados: ${f.corrida.casos_ejecutados} · con error del proveedor: ${f.corrida.casos_con_error} · límites de uso alcanzados: ${f.corrida.limites_alcanzados}.`
      : `Sessions: ${f.corrida.sesiones} · cases run: ${f.corrida.casos_ejecutados} · with a provider error: ${f.corrida.casos_con_error} · usage limits reached: ${f.corrida.limites_alcanzados}.`,
    "",
    `${i === "es" ? "Umbrales aplicados" : "Applied thresholds"}: ${umbrales(f.umbrales_aplicados)} · ${i === "es" ? "en el plan" : "in the plan"}: ${umbrales(f.umbrales_del_plan)}.`,
    "",
    `${i === "es" ? "Revisión humana" : "Human review"}: ${f.revisor_simulado[i]}`,
    "",
    `${i === "es" ? "Verificador" : "Verifier"} ${f.verificador.version} · ${f.verificador.formato} · ${i === "es" ? "huella de este informe" : "fingerprint of this report"}: \`${inf.huella}\``,
  ].join("\n");
}

/** El informe completo en un idioma. Mismas entradas → mismos bytes. */
export function renderizarInforme(inf: Informe, i: Idioma): string {
  const titulo = i === "es" ? "Informe de brecha" : "Gap report";
  const cabecera = [
    `# ${titulo} — ${inf.plan_en_breve.nombre[i]}`,
    "",
    `> **${inf.etiqueta[i]}** · ${i === "es" ? "corrida" : "run"} \`${inf.corrida_id}\` · ${inf.fecha} · plan ${inf.plan_en_breve.version}`,
  ].join("\n");
  return (
    [
      cabecera,
      seccionResumen(inf, i),
      seccionPlan(inf, i),
      seccionCriterios(inf, i),
      seccionRiesgos(inf, i),
      seccionBrechas(inf, i),
      seccionSupuestos(inf, i),
      seccionEjemplares(inf, i),
      seccionPlayground(inf, i),
      seccionFicha(inf, i),
    ].join("\n\n") + "\n"
  );
}
