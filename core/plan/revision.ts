/**
 * Revisión de un borrador que entregó el entrevistador (M2): lo que el usuario mira antes de decir «apruebo».
 * Reúne M1 (lo que impediría aprobar), las contradicciones (RF-02.5), lo pendiente y los textos que redactó el
 * entrevistador en el idioma que el usuario no escribió (ADR-012), y lo pone en un documento ES/EN.
 *
 * La transcripción la escribe Python (`agents/…/entrevistador/transcripcion.py`); aquí se declara con Zod y el gate
 * de contrato la valida contra el fixture que escribe el serializador real (regla 19).
 */
import { z } from "zod";
import type { TextoBilingue } from "../formatos/bilingue";
import { TextoBilingueSchema } from "../formatos/bilingue-esquema";
import {
  contradicciones,
  MARCA_PENDIENTE,
  type Contradiccion,
  type PreguntaPendiente,
} from "./contradicciones";
import { validarPlan, type Motivo } from "./validador";

const IDIOMA = z.enum(["es", "en"]);
const QUIEN_REDACTA = z.enum(["usuario", "entrevistador", "pendiente"]);

export const TurnoSchema = z
  .object({
    pasada: z.number().int().min(1),
    respuesta: z.object({ texto: z.string(), idioma: IDIOMA }).strict(),
    resultado: z.enum([
      "redactada",
      "aceptada",
      "pendiente",
      "literal",
      "literal_sin_redactar",
    ]),
    motivo: z.string().optional(),
    elementos: z
      .array(z.object({ id: z.string(), origen: z.string() }).strict())
      .optional(),
    explicaciones: z
      .array(
        z
          .object({ elemento: z.string(), es: z.string(), en: z.string() })
          .strict(),
      )
      .optional(),
    redaccion: z.object({ es: QUIEN_REDACTA, en: QUIEN_REDACTA }).optional(),
    costo_nominal_usd: z.number().nonnegative().optional(),
    tokens_entrada: z.number().int().nonnegative().optional(),
    tokens_salida: z.number().int().nonnegative().optional(),
  })
  .strict();

export const TranscripcionSchema = z
  .object({
    formato: z.literal("planlang-transcripcion/v1"),
    demo_id: z.string().min(1),
    plan_id: z.string().min(1),
    plantilla: z
      .object({
        id: z.string(),
        version: z.string(),
        huella: z.string().regex(/^[0-9a-f]{64}$/),
      })
      .strict(),
    idioma: IDIOMA,
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    proveedor: z.string().min(1),
    modelo: z.string().min(1),
    pasadas: z.number().int().min(1),
    preguntas: z.array(
      z
        .object({
          id: z.string(),
          seccion: z.string(),
          pregunta: TextoBilingueSchema,
          ejemplo: TextoBilingueSchema,
          obligatoria: z.boolean(),
          estado: z.enum([
            "sin_responder",
            "respondida",
            "aceptada",
            "pendiente",
          ]),
          turnos: z.array(TurnoSchema),
        })
        .strict(),
    ),
    senales_derivadas: z.array(
      z
        .object({ senal: z.string(), leida_por: z.array(z.string()).min(1) })
        .strict(),
    ),
    llamadas_al_modelo: z.number().int().nonnegative(),
    costo_nominal_usd: z.number().nonnegative(),
    huella: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();
export type Transcripcion = z.infer<typeof TranscripcionSchema>;

export interface Revision {
  plan_id: string;
  /** M1 sobre el borrador; `bloquea` suma las advertencias que `aprobarPlan` convierte en motivo (M-23). */
  m1: { ok: boolean; motivos: Motivo[]; advertencias: Motivo[] };
  contradicciones: Contradiccion[];
  pendientes: PreguntaPendiente[];
  /** Respuestas cuyo otro idioma redactó el entrevistador: hay que leerlas antes de aprobar. */
  redactado_por_entrevistador: { pregunta: string; idioma: "es" | "en" }[];
  senales_derivadas: Transcripcion["senales_derivadas"];
  llamadas_al_modelo: number;
  costo_nominal_usd: number;
}

export function pendientesDe(t: Transcripcion): PreguntaPendiente[] {
  return t.preguntas
    .filter((p) => p.estado === "pendiente" || p.estado === "sin_responder")
    .map((p) => ({ id: p.id, seccion: p.seccion }));
}

export function revisarBorrador(borrador: unknown, t: Transcripcion): Revision {
  const v = validarPlan(borrador);
  const bloqueantes = v.advertencias.filter(
    (m) => m.codigo === "SENAL_NO_DECLARADA",
  );
  const motivos = v.ok ? bloqueantes : [...v.motivos, ...bloqueantes];
  const pendientes = pendientesDe(t);
  const redactado = t.preguntas.flatMap((p) => {
    const ultimo = p.turnos.at(-1);
    if (!ultimo?.redaccion) return [];
    return (["es", "en"] as const)
      .filter((i) => ultimo.redaccion![i] === "entrevistador")
      .map((idioma) => ({ pregunta: p.id, idioma }));
  });
  return {
    plan_id: t.plan_id,
    m1: {
      ok: motivos.length === 0,
      motivos,
      advertencias: v.advertencias.filter(
        (m) => m.codigo !== "SENAL_NO_DECLARADA",
      ),
    },
    contradicciones: contradicciones(borrador, pendientes),
    pendientes,
    redactado_por_entrevistador: redactado,
    senales_derivadas: t.senales_derivadas,
    llamadas_al_modelo: t.llamadas_al_modelo,
    costo_nominal_usd: t.costo_nominal_usd,
  };
}

/** Lo que impide aprobar: M1, lo pendiente y, salvo que el usuario las acepte, las contradicciones. */
export function impideAprobar(
  r: Revision,
  aceptaContradicciones: boolean,
): boolean {
  const hayPendientes = r.contradicciones.some((c) => c.codigo === "PENDIENTE");
  const otras = r.contradicciones.some((c) => c.codigo !== "PENDIENTE");
  return !r.m1.ok || hayPendientes || (otras && !aceptaContradicciones);
}

// ------------------------------------------------------------------------------------------- documento ES/EN

const T = {
  es: {
    titulo: "Revisión del borrador",
    intro:
      "Lo propuso el entrevistador con tus respuestas. Nada está aprobado: el plan pasa a v1 solo cuando dices «apruebo el plan B».",
    estado: "Estado",
    listo:
      "M1 lo acepta: se puede aprobar si estás de acuerdo con lo de abajo.",
    noListo: "M1 todavía no lo acepta: corrige lo de abajo antes de aprobar.",
    m1: "Lo que M1 rechaza",
    contr: "Contradicciones que señala el entrevistador",
    ninguna: "Ninguna.",
    redactado: "Textos que redactó el entrevistador (léelos)",
    redactadoLinea: (p: string, i: string) =>
      `${p}: el texto en ${i === "es" ? "español" : "inglés"} lo redactó el entrevistador desde tu respuesta.`,
    senales: "Señales que el agente tendrá que registrar y que sumó el código",
    senalLinea: (s: string, q: string[]) => `\`${s}\`: la lee ${q.join(", ")}.`,
    plan: "El plan, sección por sección",
    origen: "origen",
    costo: (n: number, c: number) =>
      `${n} llamadas al modelo · costo nominal US$ ${c.toFixed(4)} (la suscripción no cobra por llamada).`,
    aprobar: "Cómo se aprueba",
    aprobarTexto:
      'Si estás de acuerdo, dile al constructor «apruebo el plan B». Él corre `pnpm plan:aprobar --demo b --por "<tu nombre>" --el <fecha>`, que vuelve a validar y escribe `plans/demo-b/v1.json` con su huella.',
    secciones: {
      problema: "Problema",
      actores: "Actores",
      flujo: "Flujo",
      decisiones: "Decisiones",
      riesgos: "Riesgos",
      supuestos: "Supuestos",
      criterios: "Criterios de aceptación",
      umbrales: "Umbrales",
      contrato: "Contrato de grafo",
      lotes: "Lotes",
    },
    pendiente: "pendiente",
  },
  en: {
    titulo: "Draft review",
    intro:
      "The interviewer proposed it from your answers. Nothing is approved: the plan becomes v1 only when you say “I approve plan B”.",
    estado: "Status",
    listo: "M1 accepts it: it can be approved if you agree with what follows.",
    noListo: "M1 does not accept it yet: fix what follows before approving.",
    m1: "What M1 rejects",
    contr: "Contradictions the interviewer flags",
    ninguna: "None.",
    redactado: "Texts the interviewer wrote (read them)",
    redactadoLinea: (p: string, i: string) =>
      `${p}: the ${i === "es" ? "Spanish" : "English"} text was written by the interviewer from your answer.`,
    senales: "Signals the agent will have to record, added by code",
    senalLinea: (s: string, q: string[]) =>
      `\`${s}\`: read by ${q.join(", ")}.`,
    plan: "The plan, section by section",
    origen: "origin",
    costo: (n: number, c: number) =>
      `${n} model calls · nominal cost US$ ${c.toFixed(4)} (the subscription does not charge per call).`,
    aprobar: "How to approve",
    aprobarTexto:
      'If you agree, tell the builder “I approve plan B”. They run `pnpm plan:aprobar --demo b --por "<your name>" --el <date>`, which validates again and writes `plans/demo-b/v1.json` with its fingerprint.',
    secciones: {
      problema: "Problem",
      actores: "Actors",
      flujo: "Flow",
      decisiones: "Decisions",
      riesgos: "Risks",
      supuestos: "Assumptions",
      criterios: "Acceptance criteria",
      umbrales: "Thresholds",
      contrato: "Graph contract",
      lotes: "Batches",
    },
    pendiente: "pending",
  },
} as const;

type Idioma = "es" | "en";
type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(esObj) : []);

function txt(v: unknown, idioma: Idioma): string {
  const s =
    typeof v === "string"
      ? v
      : esObj(v) && typeof v[idioma] === "string"
        ? (v[idioma] as string)
        : "";
  return !s || s.includes(MARCA_PENDIENTE) ? `_${T[idioma].pendiente}_` : s;
}

const celda = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function tabla(cabeza: string[], filas: string[][]): string[] {
  return [
    `| ${cabeza.join(" | ")} |`,
    `|${cabeza.map(() => "---").join("|")}|`,
    ...filas.map((f) => `| ${f.map(celda).join(" | ")} |`),
  ];
}

function seccionesDelPlan(b: Obj, idioma: Idioma): string[] {
  const t = T[idioma];
  const s = t.secciones;
  const o = t.origen;
  const out: string[] = [];
  out.push(`### ${s.problema}`, "", `**${txt(b.nombre, idioma)}**`, "");
  out.push(txt(b.problema, idioma), "");
  out.push(
    `### ${s.actores}`,
    "",
    ...tabla(
      ["id", idioma === "es" ? "actor" : "actor", "tipo", o],
      lista(b.actores).map((a) => [
        String(a.id),
        txt(a, idioma),
        String(a.tipo),
        String(a.origen ?? ""),
      ]),
    ),
    "",
  );
  out.push(
    `### ${s.flujo}`,
    "",
    ...(Array.isArray(b.flujo_objetivo) ? b.flujo_objetivo : []).map(
      (p, i) => `${i + 1}. ${txt(p, idioma)}`,
    ),
    "",
  );
  out.push(
    `### ${s.decisiones}`,
    "",
    ...tabla(
      [
        "id",
        idioma === "es" ? "pregunta" : "question",
        idioma === "es" ? "elegida" : "chosen",
        "reversibilidad",
        o,
      ],
      lista(b.decisiones).map((d) => [
        String(d.id),
        txt(d.pregunta, idioma),
        d.opcion_elegida
          ? txt(d.opcion_elegida, idioma)
          : `_${String(d.estado)}_`,
        String(d.reversibilidad),
        String(d.origen ?? ""),
      ]),
    ),
    "",
  );
  out.push(
    `### ${s.riesgos}`,
    "",
    ...tabla(
      [
        "id",
        idioma === "es" ? "modo de falla" : "failure mode",
        "S·O·D",
        idioma === "es" ? "detector" : "detector",
        o,
      ],
      lista(b.riesgos).map((r) => {
        const d = esObj(r.detector_en_trazas) ? r.detector_en_trazas : null;
        return [
          String(r.id),
          txt(r.modo, idioma),
          `${String(r.severidad)}·${String(r.ocurrencia)}·${String(r.deteccion)}`,
          d
            ? `\`${String(d.condicion)}\``
            : txt(r.no_detectable_en_trazas, idioma),
          String(r.origen ?? ""),
        ];
      }),
    ),
    "",
  );
  out.push(
    `### ${s.supuestos}`,
    "",
    ...tabla(
      [
        "id",
        idioma === "es" ? "supuesto" : "assumption",
        idioma === "es" ? "prueba barata" : "cheap test",
        o,
      ],
      lista(b.supuestos).map((x) => [
        String(x.id),
        txt(x.enunciado, idioma),
        txt(x.prueba_barata, idioma),
        String(x.origen ?? ""),
      ]),
    ),
    "",
  );
  out.push(
    `### ${s.criterios}`,
    "",
    ...tabla(
      [
        "id",
        idioma === "es" ? "enunciado" : "statement",
        idioma === "es" ? "objetivo" : "target",
        idioma === "es" ? "regla" : "rule",
        idioma === "es" ? "controla" : "controls",
        o,
      ],
      lista(b.criterios_aceptacion).map((c) => {
        const r = esObj(c.regla_de_medicion) ? c.regla_de_medicion : {};
        const regla = [r.poblacion, r.condicion ?? r.metrica]
          .filter(Boolean)
          .map((x) => `\`${String(x)}\``)
          .join(" → ");
        return [
          String(c.id),
          txt(c.enunciado, idioma),
          `${String(c.tipo)} · ${String(c.valor_objetivo)}`,
          `${regla} (${String(r.agregacion)})`,
          (Array.isArray(c.riesgos_controlados)
            ? c.riesgos_controlados
            : []
          ).join(", "),
          String(c.origen ?? ""),
        ];
      }),
    ),
    "",
  );
  out.push(
    `### ${s.umbrales}`,
    "",
    ...tabla(
      [
        "id",
        idioma === "es" ? "nombre" : "name",
        idioma === "es"
          ? "señal · operador · valor"
          : "signal · operator · value",
        idioma === "es" ? "rango" : "range",
        idioma === "es" ? "si se cumple" : "if true",
        o,
      ],
      lista(b.umbrales).map((u) => {
        const r = esObj(u.rango_jugable) ? u.rango_jugable : {};
        return [
          String(u.id),
          txt(u.nombre, idioma),
          `\`${String(u.senal)}\` · ${String(u.operador)} · ${u.valor_en_plan === null || u.valor_en_plan === undefined ? `_${T[idioma].pendiente}_` : String(u.valor_en_plan)}`,
          "tipo" in r
            ? String(r.tipo)
            : `${String(r.min)}–${String(r.max)} (${String(r.paso)})`,
          String(u.consecuencia_si_verdadero),
          String(u.origen ?? ""),
        ];
      }),
    ),
    "",
  );
  const cg = esObj(b.contrato_de_grafo) ? b.contrato_de_grafo : null;
  out.push(`### ${s.contrato}`, "");
  if (cg) {
    out.push(
      `- ${idioma === "es" ? "Nodos" : "Nodes"}: ${lista(cg.nodos_esperados)
        .map((n) => `\`${String(n.id)}\` (${String(n.tipo)})`)
        .join(", ")}`,
      ...lista(cg.aristas_condicionales).map((a) => {
        const f = esObj(a.funcion) ? a.funcion : null;
        const cond = f
          ? `${String(f.nombre)}(${(Array.isArray(f.entradas) ? f.entradas : []).join(", ")})`
          : `${String(a.senal)} ${String(a.operador)} ${JSON.stringify(a.valor)}`;
        return `- \`${String(a.desde)}\` #${String(a.orden)}: \`${cond}\` → \`${String(a.si_verdadero)}\``;
      }),
      ...Object.entries(
        esObj(cg.ramas_por_defecto) ? cg.ramas_por_defecto : {},
      ).map(
        ([d, h]) =>
          `- \`${d}\` ${idioma === "es" ? "por defecto" : "by default"} → \`${String(h)}\``,
      ),
      ...lista(cg.pausas_humanas).map(
        (p) =>
          `- ⏸ \`${String(p.nodo)}\` · ${String(p.rol)} · ${(Array.isArray(p.payload_minimo) ? p.payload_minimo : []).join(", ")}`,
      ),
      `- ${idioma === "es" ? "Señales obligatorias" : "Required signals"}: ${(Array.isArray(cg.senales_obligatorias_en_traza) ? cg.senales_obligatorias_en_traza : []).map((x) => `\`${String(x)}\``).join(", ")}`,
      `- ${o}: ${String(cg.origen ?? "")}`,
      "",
    );
  } else out.push(`_${T[idioma].pendiente}_`, "");
  const l = esObj(b.lotes) ? b.lotes : null;
  out.push(
    `### ${s.lotes}`,
    "",
    l
      ? `${String(l.demo)} / ${String(l.completo)} · ${String(l.corridas_espaciadas_de)} · ${String(l.proveedor)} · ${String(l.modelo_alias)} · ${o}: ${String(l.origen ?? "")}`
      : `_${T[idioma].pendiente}_`,
    "",
  );
  return out;
}

export function textoDeRevision(
  borrador: unknown,
  r: Revision,
  idioma: Idioma,
): string {
  const t = T[idioma];
  const b = esObj(borrador) ? borrador : {};
  const linea = (m: {
    codigo: string;
    elemento: string;
    mensaje: TextoBilingue;
  }) => `- \`${m.codigo}\` · ${m.elemento}: ${m.mensaje[idioma]}`;
  return [
    `# ${t.titulo} — ${r.plan_id}`,
    "",
    t.intro,
    "",
    `## ${t.estado}`,
    "",
    r.m1.ok ? t.listo : t.noListo,
    "",
    t.costo(r.llamadas_al_modelo, r.costo_nominal_usd),
    "",
    `## ${t.m1}`,
    "",
    ...(r.m1.motivos.length ? r.m1.motivos.map(linea) : [t.ninguna]),
    "",
    `## ${t.contr}`,
    "",
    ...(r.contradicciones.length ? r.contradicciones.map(linea) : [t.ninguna]),
    "",
    `## ${t.redactado}`,
    "",
    ...(r.redactado_por_entrevistador.length
      ? r.redactado_por_entrevistador.map(
          (x) => `- ${t.redactadoLinea(x.pregunta, x.idioma)}`,
        )
      : [t.ninguna]),
    "",
    `## ${t.senales}`,
    "",
    ...(r.senales_derivadas.length
      ? r.senales_derivadas.map(
          (s) => `- ${t.senalLinea(s.senal, s.leida_por)}`,
        )
      : [t.ninguna]),
    "",
    `## ${t.plan}`,
    "",
    ...seccionesDelPlan(b, idioma),
    `## ${t.aprobar}`,
    "",
    t.aprobarTexto,
    "",
  ].join("\n");
}
