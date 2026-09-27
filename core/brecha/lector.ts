/**
 * Lectura con verificación de huellas (RF-06.1). El verificador solo mide lo que puede atribuir: si una
 * huella no coincide con la declarada, si un archivo no cumple su esquema o si una traza está mal
 * formada, la corrida se RECHAZA con todos los motivos juntos — nunca se mide «lo que se pudo leer».
 *
 * Puro: recibe objetos ya parseados (los scripts leen el disco; la vitrina, IndexedDB).
 */
import type { TextoBilingue } from "../formatos/bilingue";
import { verificarHuella } from "../formatos/huella";
import type { JsonValor } from "../formatos/jcs";
import {
  CorridaSchema,
  GrafoSchema,
  RamasEsperadasSchema,
  TrazaSchema,
  type Corrida,
  type Grafo,
  type RamasEsperadas,
  type Traza,
} from "../formatos/traza";
import { cargarPlan, type Plan } from "../plan";
import { LoteSchema, type Caso, type Lote } from "../sintetico/esquema";

export interface ArchivosDeCorrida {
  /** Ruta lógica de la corrida (p. ej. `runs/demo-a/<id>`), solo para los mensajes. */
  ruta: string;
  corrida: unknown;
  grafo: unknown;
  ramas: unknown;
  /** Trazas por ruta relativa a la corrida (`trazas/A-001.json`), como las declara el manifiesto. */
  trazas: Readonly<Record<string, unknown>>;
}

export interface EntradaVerificador {
  plan: unknown;
  casos: unknown;
  corrida: ArchivosDeCorrida;
  /** Otras corridas del MISMO lote y plan (para `pass^k`): k_observado = 1 + repeticiones. */
  repeticiones?: readonly ArchivosDeCorrida[];
  /** Línea base de agente único sobre el mismo lote (supuesto S3). */
  base?: ArchivosDeCorrida | null;
}

export const CODIGOS_LECTURA = [
  "PLAN_INVALIDO",
  "LOTE_INVALIDO",
  "ESQUEMA",
  "HUELLA_NO_COINCIDE",
  "REFERENCIA_ROTA",
  "TRAZA_MALFORMADA",
  "CORRIDA_INCOMPATIBLE",
] as const;
export type CodigoLectura = (typeof CODIGOS_LECTURA)[number];

export interface MotivoLectura {
  codigo: CodigoLectura;
  archivo: string;
  detalle: TextoBilingue;
}

export class ErrorDeLectura extends Error {
  constructor(public readonly motivos: readonly MotivoLectura[]) {
    super(
      `corrida rechazada (${motivos.length} motivo(s)): ` +
        motivos
          .map((m) => `${m.codigo} ${m.archivo}: ${m.detalle.es}`)
          .join(" · "),
    );
    this.name = "ErrorDeLectura";
  }
}

export interface CorridaLeida {
  ruta: string;
  manifiesto: Corrida;
  grafo: Grafo;
  ramas: RamasEsperadas;
  /** En el orden de `casos_ejecutados`. */
  trazas: Traza[];
}

export interface EntradaLeida {
  plan: Plan;
  huellaPlan: string;
  lote: Lote;
  casos: ReadonlyMap<string, Caso>;
  corrida: CorridaLeida;
  repeticiones: CorridaLeida[];
  base: CorridaLeida | null;
}

const m = (
  codigo: CodigoLectura,
  archivo: string,
  es: string,
  en: string,
): MotivoLectura => ({ codigo, archivo, detalle: { es, en } });

async function huellaCoincide(
  valor: unknown,
  archivo: string,
  motivos: MotivoLectura[],
): Promise<void> {
  const v = await verificarHuella(valor as Record<string, JsonValor>);
  if (!v.ok)
    motivos.push(
      m(
        "HUELLA_NO_COINCIDE",
        archivo,
        `la huella declarada (${v.declarada ?? "ninguna"}) no coincide con la calculada (${v.calculada})`,
        `the declared fingerprint (${v.declarada ?? "none"}) does not match the computed one (${v.calculada})`,
      ),
    );
}

function esquema<T>(
  resultado:
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: { path: PropertyKey[]; message: string }[] };
      },
  archivo: string,
  motivos: MotivoLectura[],
): T | null {
  if (resultado.success) return resultado.data;
  const primero = resultado.error.issues[0];
  const donde = primero
    ? primero.path.map(String).join(".") || "(raíz)"
    : "(raíz)";
  const msg = primero?.message ?? "";
  motivos.push(
    m(
      "ESQUEMA",
      archivo,
      `no cumple su esquema en ${donde}: ${msg}`,
      `does not match its schema at ${donde}: ${msg}`,
    ),
  );
  return null;
}

/** Coherencia interna de una traza: lo que la exportación garantiza y el verificador presupone. */
function trazaMalformada(t: Traza): { es: string; en: string } | null {
  const nodos = t.pasos.map((p) => p.nodo);
  if (nodos.join("\u0000") !== t.nodos_visitados.join("\u0000"))
    return {
      es: "nodos_visitados no coincide con la secuencia de pasos",
      en: "nodos_visitados does not match the sequence of steps",
    };
  const enSenales = t.senales["nodos_visitados"];
  if (
    Array.isArray(enSenales) &&
    enSenales.join("\u0000") !== t.nodos_visitados.join("\u0000")
  )
    return {
      es: "la señal nodos_visitados no coincide con los pasos",
      en: "the nodos_visitados signal does not match the steps",
    };
  if (t.pasos.some((p, i) => p.orden !== i + 1))
    return {
      es: "los pasos no están numerados 1..n",
      en: "the steps are not numbered 1..n",
    };
  for (const d of t.decisiones_de_arista) {
    const paso = t.pasos[d.paso - 1];
    if (!paso || paso.nodo !== d.desde)
      return {
        es: `la decisión de arista del paso ${d.paso} no corresponde a una visita de ${d.desde}`,
        en: `the edge decision at step ${d.paso} is not a visit to ${d.desde}`,
      };
  }
  return null;
}

async function leerCorrida(
  a: ArchivosDeCorrida,
  motivos: MotivoLectura[],
): Promise<CorridaLeida | null> {
  const archivo = (f: string) => `${a.ruta}/${f}`;
  const manifiesto = esquema(
    CorridaSchema.safeParse(a.corrida),
    archivo("corrida.json"),
    motivos,
  );
  const grafo = esquema(
    GrafoSchema.safeParse(a.grafo),
    archivo("grafo.json"),
    motivos,
  );
  const ramas = esquema(
    RamasEsperadasSchema.safeParse(a.ramas),
    archivo("ramas-esperadas.json"),
    motivos,
  );
  if (manifiesto)
    await huellaCoincide(a.corrida, archivo("corrida.json"), motivos);
  if (grafo) await huellaCoincide(a.grafo, archivo("grafo.json"), motivos);
  if (ramas)
    await huellaCoincide(a.ramas, archivo("ramas-esperadas.json"), motivos);
  if (!manifiesto || !grafo || !ramas) return null;

  if (manifiesto.version_grafo !== grafo.huella)
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("grafo.json"),
        "el manifiesto declara otra versión del grafo",
        "the manifest declares another graph version",
      ),
    );
  if (
    manifiesto.ramas_esperadas.huella !== ramas.huella ||
    ramas.corrida_id !== manifiesto.corrida_id
  )
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("ramas-esperadas.json"),
        "el manifiesto declara otras ramas esperadas",
        "the manifest declares other expected branches",
      ),
    );
  if (grafo.variante !== manifiesto.variante)
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("grafo.json"),
        "el grafo es de otra variante",
        "the graph belongs to another variant",
      ),
    );

  const ids = manifiesto.trazas.map((t) => t.caso_id);
  if (
    new Set(ids).size !== ids.length ||
    [...ids].sort().join(",") !==
      [...manifiesto.casos_ejecutados].sort().join(",")
  )
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("corrida.json"),
        "trazas declaradas y casos ejecutados no coinciden (o hay repetidos)",
        "declared traces and executed cases differ (or repeat)",
      ),
    );

  const porCaso = new Map<string, Traza>();
  for (const decl of manifiesto.trazas) {
    const bruto = a.trazas[decl.archivo];
    if (bruto === undefined) {
      motivos.push(
        m(
          "REFERENCIA_ROTA",
          archivo(decl.archivo),
          "la traza declarada no existe",
          "the declared trace does not exist",
        ),
      );
      continue;
    }
    const t = esquema(
      TrazaSchema.safeParse(bruto),
      archivo(decl.archivo),
      motivos,
    );
    if (!t) continue;
    await huellaCoincide(bruto, archivo(decl.archivo), motivos);
    if (t.huella !== decl.huella)
      motivos.push(
        m(
          "HUELLA_NO_COINCIDE",
          archivo(decl.archivo),
          "la traza no es la que el manifiesto declara",
          "the trace is not the one the manifest declares",
        ),
      );
    if (
      t.caso_id !== decl.caso_id ||
      t.corrida_id !== manifiesto.corrida_id ||
      t.variante !== manifiesto.variante ||
      t.resultado !== decl.resultado
    )
      motivos.push(
        m(
          "REFERENCIA_ROTA",
          archivo(decl.archivo),
          "caso, corrida, variante o resultado no coinciden con el manifiesto",
          "case, run, variant or outcome differ from the manifest",
        ),
      );
    const mal = trazaMalformada(t);
    if (mal)
      motivos.push({
        codigo: "TRAZA_MALFORMADA",
        archivo: archivo(decl.archivo),
        detalle: mal,
      });
    porCaso.set(t.caso_id, t);
  }
  const trazas = manifiesto.casos_ejecutados
    .map((c) => porCaso.get(c))
    .filter((t): t is Traza => t !== undefined);
  return { ruta: a.ruta, manifiesto, grafo, ramas, trazas };
}

function compatible(
  c: CorridaLeida,
  plan: { huella: string },
  lote: Lote,
  casos: ReadonlyMap<string, Caso>,
  variante: "multiagente" | "agente_unico",
  motivos: MotivoLectura[],
): void {
  const archivo = `${c.ruta}/corrida.json`;
  if (c.manifiesto.plan.huella !== plan.huella)
    motivos.push(
      m(
        "HUELLA_NO_COINCIDE",
        archivo,
        "la corrida se hizo con otro plan (huella distinta)",
        "the run used another plan (different fingerprint)",
      ),
    );
  if (c.manifiesto.casos.huella !== lote.huella)
    motivos.push(
      m(
        "HUELLA_NO_COINCIDE",
        archivo,
        "la corrida se hizo con otro lote de casos (huella distinta)",
        "the run used another case batch (different fingerprint)",
      ),
    );
  if (c.manifiesto.variante !== variante)
    motivos.push(
      m(
        "CORRIDA_INCOMPATIBLE",
        archivo,
        `se esperaba la variante ${variante}`,
        `expected the ${variante} variant`,
      ),
    );
  for (const id of c.manifiesto.casos_ejecutados)
    if (!casos.has(id))
      motivos.push(
        m(
          "REFERENCIA_ROTA",
          archivo,
          `el caso ${id} no está en el lote`,
          `case ${id} is not in the batch`,
        ),
      );
}

/** Lee y verifica todo; lanza `ErrorDeLectura` con TODOS los motivos si algo no cuadra. */
export async function leerEntrada(
  e: EntradaVerificador,
): Promise<EntradaLeida> {
  const motivos: MotivoLectura[] = [];
  const carga = await cargarPlan(e.plan);
  if (!carga.ok)
    motivos.push(
      ...carga.motivos.map((x) =>
        m("PLAN_INVALIDO", "plan", x.mensaje.es, x.mensaje.en),
      ),
    );
  const lote = esquema(LoteSchema.safeParse(e.casos), "casos", motivos);
  if (lote) await huellaCoincide(e.casos, "casos", motivos);
  const corrida = await leerCorrida(e.corrida, motivos);
  const repeticiones: CorridaLeida[] = [];
  for (const r of e.repeticiones ?? []) {
    const leida = await leerCorrida(r, motivos);
    if (leida) repeticiones.push(leida);
  }
  const base = e.base ? await leerCorrida(e.base, motivos) : null;

  if (carga.ok && lote && corrida) {
    const casos = new Map(lote.casos.map((c) => [c.id, c]));
    const plan = { huella: carga.huella };
    compatible(corrida, plan, lote, casos, "multiagente", motivos);
    for (const r of repeticiones) {
      compatible(r, plan, lote, casos, "multiagente", motivos);
      if (r.manifiesto.corrida_id === corrida.manifiesto.corrida_id)
        motivos.push(
          m(
            "CORRIDA_INCOMPATIBLE",
            `${r.ruta}/corrida.json`,
            "una repetición no puede ser la misma corrida",
            "a repetition cannot be the same run",
          ),
        );
    }
    if (base) compatible(base, plan, lote, casos, "agente_unico", motivos);
    if (motivos.length === 0)
      return {
        plan: carga.plan,
        huellaPlan: carga.huella,
        lote,
        casos,
        corrida,
        repeticiones,
        base,
      };
  }
  throw new ErrorDeLectura(motivos);
}

/**
 * Lee y verifica UNA corrida de cualquier variante contra su plan y su lote (para `trazas:verificar`):
 * mismas comprobaciones que `leerEntrada`, sin exigir que sea la corrida multiagente principal.
 */
export async function leerCorridaVerificada(
  a: ArchivosDeCorrida,
  planBruto: unknown,
  casosBruto: unknown,
): Promise<CorridaLeida> {
  const motivos: MotivoLectura[] = [];
  const carga = await cargarPlan(planBruto);
  if (!carga.ok)
    motivos.push(
      ...carga.motivos.map((x) =>
        m("PLAN_INVALIDO", "plan", x.mensaje.es, x.mensaje.en),
      ),
    );
  const lote = esquema(LoteSchema.safeParse(casosBruto), "casos", motivos);
  if (lote) await huellaCoincide(casosBruto, "casos", motivos);
  const corrida = await leerCorrida(a, motivos);
  if (carga.ok && lote && corrida) {
    const casos = new Map(lote.casos.map((c) => [c.id, c]));
    compatible(
      corrida,
      { huella: carga.huella },
      lote,
      casos,
      corrida.manifiesto.variante,
      motivos,
    );
    if (motivos.length === 0) return corrida;
  }
  throw new ErrorDeLectura(motivos);
}
