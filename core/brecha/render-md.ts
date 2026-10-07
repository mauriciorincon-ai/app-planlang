/**
 * El informe en Markdown, en español y en inglés (§ 12 de la especificación, 9 secciones). Redactado en
 * los dos idiomas desde plantillas (regla 20): el JSON es la fuente y cada idioma se escribe, no se
 * traduce. Toda frase vive entera en `textos-informe.ts`; aquí solo se elige el idioma y se ponen los datos.
 * El estado nunca va solo en color: símbolo + texto (regla dura 13).
 */
import type { Idioma, TextoBilingue } from "../formatos/bilingue";
import { loteDeK, type ResultadoCriterio } from "./criterios";
import type { ResultadoRiesgo } from "./detectores";
import { partirDisparador } from "./detectores";
import type { CasoEjemplar, Informe, UmbralJugable } from "./informe";
import { num, numCorto, pct } from "./numeros";
import type { ResultadoSupuesto } from "./supuestos";
import { TEXTOS_INFORME } from "./textos-informe";

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
  const t = TEXTOS_INFORME[i];
  if (r.prioridad_de_tabla === r.prioridad_de_accion)
    return `${efectiva} · ${t.controlLegal}`;
  const tabla = PRIORIDAD[r.prioridad_de_tabla]?.[i] ?? r.prioridad_de_tabla;
  return t.conTabla(efectiva, t.controlLegal, tabla);
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
  b ? TEXTOS_INFORME[i].si : TEXTOS_INFORME[i].no;
/** Cierra una frase con punto si no lo trae (la opción elegida del B ya termina en punto: «… sin excepción.»). */
const conPunto = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);
const casos = (ids: readonly string[]) =>
  ids.length === 0 ? "—" : ids.join(", ");

/** Casos de un riesgo; con detector de ámbito `sesion` (M-14) son sesiones del manifiesto. */
const casosDeRiesgo = (r: Informe["riesgos"][number], i: Idioma) =>
  r.ambito === "sesion"
    ? casos(
        r.casos.map((c) =>
          c.startsWith("sesion-")
            ? TEXTOS_INFORME[i].sesion(c.slice("sesion-".length))
            : c,
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
  if (c.agregacion === "pass^k" && c.k) {
    // Verificador 1.3.0: si el plan limita k a otro tamaño de lote, se dice (`k_aplica_a`).
    const lote = c.k.aplica ? null : loteDeK(c.k.aplica_a ?? undefined);
    if (lote === null || lote === undefined)
      return `≥ ${pct(o, i)} (k = ${c.k.requerido})`;
    const soloEnLotes: Tb = {
      es: `solo en lotes de ${lote}`,
      en: `only in batches of ${lote}`,
    };
    return `≥ ${pct(o, i)} (k = ${c.k.requerido} ${soloEnLotes[i]})`;
  }
  return `≥ ${pct(o, i)}`;
}

function notasCriterio(c: ResultadoCriterio, i: Idioma): string[] {
  const out: string[] = [];
  if (c.nota) out.push(c.nota[i]);
  if (c.fuera_por_senal_nula > 0)
    out.push(TEXTOS_INFORME[i].fueraPorNulaCriterio(c.fuera_por_senal_nula));
  for (const n of c.no_evaluables) out.push(`${n.caso_id}: ${n.motivo[i]}`);
  return out;
}

function seccionResumen(inf: Informe, i: Idioma): string {
  const porId = new Map(inf.criterios.map((c) => [c.id, c]));
  const destacados = inf.resumen.criterios_destacados
    .map((id) => porId.get(id))
    .filter((c): c is ResultadoCriterio => c !== undefined);
  const ocurridos = inf.riesgos.filter((r) => r.estado === "ocurrio");
  const t = TEXTOS_INFORME[i];
  const motivos = [
    ...inf.veredicto.bloqueantes.map((m) => t.bloquea(m[i])),
    ...inf.veredicto.alertas.map((m) => t.alerta(m[i])),
  ];
  return [
    t.resumen,
    "",
    `**${t.veredicto}: ${VEREDICTO[inf.veredicto.valor][i]}**`,
    "",
    inf.resumen.texto[i],
    "",
    `**${t.recomendacion}:** ${inf.resumen.recomendacion[i]}`,
    "",
    `**${t.tresCriterios}**`,
    "",
    tabla(
      t.cabResumen,
      destacados.map((c) => [
        c.id,
        c.enunciado[i],
        valorCriterio(c, i),
        objetivoCriterio(c, i),
        ESTADO_CRITERIO[c.estado][i],
      ]),
    ),
    "",
    `**${t.riesgosOcurridos}:** ${
      ocurridos.length === 0
        ? t.ninguno
        : ocurridos
            .map((r) => `${r.id} (${r.modo[i]}, ${casosDeRiesgo(r, i)})`)
            .join("; ") + "."
    }`,
    "",
    `**${t.porQue}**`,
    "",
    ...(motivos.length > 0 ? motivos : [t.nadaBloquea]),
  ].join("\n");
}

function seccionPlan(inf: Informe, i: Idioma): string {
  const p = inf.plan_en_breve;
  const t = TEXTOS_INFORME[i];
  return [
    t.plan,
    "",
    `**${t.problema}.** ${p.problema[i]}`,
    "",
    `**${t.flujo}**`,
    "",
    ...p.flujo.map((f, k) => `${k + 1}. ${f[i]}`),
    "",
    `**${t.decisionesUnaVia}**`,
    "",
    ...p.decisiones_una_via.map(
      (d) =>
        `- **${d.id}** — ${d.pregunta[i]}${d.opcion_elegida ? ` → ${conPunto(d.opcion_elegida[i])}` : ""}${d.justificacion ? ` ${d.justificacion[i]}` : ""}`,
    ),
  ].join("\n");
}

function seccionCriterios(inf: Informe, i: Idioma): string {
  const notas = inf.criterios.flatMap((c) =>
    notasCriterio(c, i).map((n) => `- **${c.id}** — ${n}`),
  );
  const t = TEXTOS_INFORME[i];
  return [
    t.criterios,
    "",
    tabla(
      t.cabCriterios,
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
    ...(notas.length > 0 ? ["", `**${t.notas}**`, "", ...notas] : []),
  ].join("\n");
}

function valorRiesgo(r: ResultadoRiesgo, i: Idioma): string {
  if (r.valor === null) return "—";
  const tasa = r.tipo_detector === "tasa";
  const fmt = (x: number): string => (tasa ? pct(x, i) : numCorto(x, i));
  const d = r.ocurre_si === null ? null : partirDisparador(r.ocurre_si);
  const regla = d ? TEXTOS_INFORME[i].ocurreSi(d.op, fmt(d.n)) : "";
  return `${fmt(r.valor)}${regla}`;
}

function notasRiesgo(r: ResultadoRiesgo, i: Idioma): string[] {
  const out: string[] = [];
  if (r.nota) out.push(r.nota[i]);
  if (r.fuera_por_senal_nula > 0)
    out.push(TEXTOS_INFORME[i].fueraPorNulaRiesgo(r.fuera_por_senal_nula));
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
  const t = TEXTOS_INFORME[i];
  return [
    t.riesgos,
    "",
    tabla(
      t.cabRiesgos,
      inf.riesgos.map((r) => [
        r.id,
        r.modo[i],
        `${r.severidad}·${r.ocurrencia}·${r.deteccion}`,
        prioridadRiesgo(r, i),
        r.ambito === "sesion"
          ? t.sesiones(r.n_poblacion)
          : String(r.n_poblacion),
        valorRiesgo(r, i),
        ESTADO_RIESGO[r.estado][i],
        casosDeRiesgo(r, i),
      ]),
    ),
    "",
    t.notaPrioridad,
    ...(notas.length > 0 ? ["", ...notas] : []),
    "",
    t.contrato,
    "",
    tabla(
      t.cabNodos,
      ct.nodos.map((n) => [
        n.id,
        nombre(TIPO_NODO, n.tipo, i),
        n.en_grafo ? "✓" : "✗",
        String(n.visitas),
      ]),
    ),
    "",
    t.senalesYPausas(
      ct.senales.filter((s) => s.presente_en === s.de).length,
      ct.senales.length,
      ct.pausas.casos_con_pausa,
      ct.pausas.pausas_registradas,
      ct.pausas.rol,
    ),
    "",
    t.pruebaCruzada,
    "",
    tabla(
      t.cabRf092,
      ct.rf_09_2.map((r) => [
        r.corrida_id,
        nombre(VARIANTE, r.variante, i),
        String(r.visitas),
        String(r.discrepancias),
        r.coincide ? "✓" : "✗",
      ]),
    ),
    "",
    ...(hallazgos.length > 0 ? hallazgos : [t.sinHallazgos]),
  ].join("\n");
}

function seccionBrechas(inf: Informe, i: Idioma): string {
  const b = inf.brechas_no_previstas;
  const ESTADO_EVAL: Record<string, Tb> = {
    ejecutado: tb("ejecutado", "run"),
    no_ejecutado_opcional: tb(
      "no corrió (opcional; el plan no lo exige)",
      "did not run (optional; the plan does not require it)",
    ),
    no_ejecutado: tb("✗ no corrió", "✗ did not run"),
    sin_implementacion: tb("✗ sin implementación", "✗ not implemented"),
    mal_formado: tb("⚠ no pudo medir", "⚠ could not measure"),
  };
  const t = TEXTOS_INFORME[i];
  return [
    t.brechas,
    "",
    t.brechasQue,
    "",
    ...(b.brechas.length === 0
      ? [t.ninguna]
      : b.brechas.map(
          (x) =>
            `- ${x.caso_id ? `**${x.caso_id}**` : "—"} · ${nombre(CATEGORIA_BRECHA, x.categoria, i)}${x.corrida_id !== inf.corrida_id ? t.repeticion(x.corrida_id) : ""}${x.nodo ? t.nodoYPaso(x.nodo, String(x.paso ?? "—")) : ""}${x.reintentos !== null ? t.reintentos(x.reintentos) : ""}: ${x.detalle[i]}`,
        )),
    "",
    `**${t.evaluadores}**`,
    "",
    tabla(
      t.cabEvaluadores,
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
  const t = TEXTOS_INFORME[i];
  const lineas = [
    `### ${s.id} — ${s.enunciado[i]}`,
    "",
    `**${ESTADO_SUPUESTO[s.estado][i]}** (${t.criticidad(PRIORIDAD[s.criticidad]?.[i] ?? s.criticidad)}). ${s.motivo[i]}`,
  ];
  const metricas = Object.keys(s.metricas)
    .sort()
    .map((k) => {
      const v = s.metricas[k];
      return `${nombre(METRICA, k, i)} = ${v === null || v === undefined ? t.noExiste : numCorto(v, i, 4)}`;
    });
  if (metricas.length > 0)
    lineas.push("", t.medidas(s.n, metricas.join(" · ")));
  for (const l of s.limitaciones) lineas.push("", `> ${l[i]}`);
  if (s.curva)
    lineas.push(
      "",
      t.curva,
      "",
      tabla(
        t.cabCurva,
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
      tabla(t.cabComparacion(c.corrida_base), [
        [
          t.filaExactitud,
          pct(c.exactitud.multiagente, i),
          pct(c.exactitud.agente_unico, i),
        ],
        [
          t.filaLatencia,
          lat(c.latencia_mediana_s.multiagente),
          lat(c.latencia_mediana_s.agente_unico),
        ],
        [
          t.filaLlamadas,
          String(c.presupuesto.multiagente.llamadas_al_modelo),
          String(c.presupuesto.agente_unico.llamadas_al_modelo),
        ],
        [
          "Tokens",
          String(c.presupuesto.multiagente.tokens),
          String(c.presupuesto.agente_unico.tokens),
        ],
        [
          t.filaCosto,
          num(c.presupuesto.multiagente.costo_nominal_usd, i, 4),
          num(c.presupuesto.agente_unico.costo_nominal_usd, i, 4),
        ],
      ]),
      "",
      t.difierenYPresupuesto(
        casos(c.casos_distintos),
        siNo(c.presupuesto_respetado, i),
      ),
    );
  }
  return lineas.join("\n");
}

function seccionSupuestos(inf: Informe, i: Idioma): string {
  return [
    TEXTOS_INFORME[i].supuestos,
    "",
    ...inf.supuestos.flatMap((s) => [seccionSupuesto(s, i), ""]),
  ]
    .join("\n")
    .trimEnd();
}

function seccionEjemplares(inf: Informe, i: Idioma): string {
  const e = inf.casos_ejemplares;
  const t = TEXTOS_INFORME[i];
  const linea = (titulo: string, c: CasoEjemplar | null) =>
    `- **${titulo}:** ${c ? `${c.caso_id} (${c.subtipo}). ${c.por_que[i]}` : t.ningunoEnLaCorrida}`;
  return [
    t.ejemplares,
    "",
    linea(t.exitoso, e.exitoso),
    linea(t.escalado, e.escalado_correctamente),
    linea(t.fallido, e.fallido),
    linea(t.adversario, e.adversario_neutralizado),
  ].join("\n");
}

function observado(u: UmbralJugable, i: Idioma): string {
  const o = u.observados;
  if (o.verdaderos !== null)
    return TEXTOS_INFORME[i].verdaderos(o.verdaderos, o.n);
  if (o.min === null || o.max === null || o.mediana === null) return "—";
  return `${numCorto(o.min, i)} · ${numCorto(o.mediana, i)} · ${numCorto(o.max, i)} (n = ${o.n})`;
}

function seccionPlayground(inf: Informe, i: Idioma): string {
  const valor = (x: number | boolean | null) =>
    x === null ? "—" : typeof x === "boolean" ? String(x) : numCorto(x, i);
  const t = TEXTOS_INFORME[i];
  return [
    t.playground,
    "",
    tabla(
      t.cabPlayground,
      inf.playground.umbrales.map((u) => [
        u.id,
        u.nombre[i],
        `${u.senal} ${operador(u.operador, u.inclusivo)} ${valor(u.valor_aplicado)}`,
        u.rango === "booleano"
          ? t.siNoRango
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
  const t = TEXTOS_INFORME[i];
  const filas: string[][] = [
    [
      t.piezaPlan,
      `${f.plan.id} ${f.plan.version} (\`${f.plan.archivo}\`)`,
      `\`${f.plan.huella}\``,
    ],
    [
      t.piezaCasos,
      t.casosDelLote(
        f.casos.id,
        f.casos.semilla,
        f.casos.n_lote,
        f.casos.plan_de_generacion.version,
      ),
      `\`${f.casos.huella}\``,
    ],
    [
      t.piezaCorrida,
      t.corridaDe(
        f.corrida.id,
        f.corrida.fecha,
        `${f.corrida.proveedor}/${f.corrida.modelo}`,
        nombre(VARIANTE, f.corrida.variante, i),
        f.corrida.plan_de_ejecucion.version,
      ) +
        (f.corrida.plan_de_ejecucion.huella === f.plan.huella
          ? ""
          : t.mismaVerdad),
      `\`${f.corrida.huella}\``,
    ],
    [t.piezaGrafo, t.versionDelGrafo, `\`${f.corrida.version_grafo}\``],
    ...f.repeticiones.map((r) => [
      t.piezaRepeticion,
      r.corrida_id,
      `\`${r.huella}\``,
    ]),
    ...(f.linea_base
      ? [
          [
            t.piezaLineaBase,
            f.linea_base.corrida_id,
            `\`${f.linea_base.huella}\``,
          ],
        ]
      : []),
  ];
  return [
    t.ficha,
    "",
    tabla(t.cabFicha, filas),
    "",
    t.sesionesDeLaCorrida(
      f.corrida.sesiones,
      f.corrida.casos_ejecutados,
      f.corrida.casos_con_error,
      f.corrida.limites_alcanzados,
    ),
    "",
    t.umbralesAplicados(
      umbrales(f.umbrales_aplicados),
      umbrales(f.umbrales_del_plan),
    ),
    "",
    t.revisionHumana(f.revisor_simulado[i]),
    "",
    t.verificador(f.verificador.version, f.verificador.formato, inf.huella),
  ].join("\n");
}

/** El informe completo en un idioma. Mismas entradas → mismos bytes. */
export function renderizarInforme(inf: Informe, i: Idioma): string {
  const t = TEXTOS_INFORME[i];
  const cabecera = [
    `# ${t.titulo} — ${inf.plan_en_breve.nombre[i]}`,
    "",
    `> **${inf.etiqueta[i]}** · ${t.corrida} \`${inf.corrida_id}\` · ${inf.fecha} · plan ${inf.plan_en_breve.version}`,
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
