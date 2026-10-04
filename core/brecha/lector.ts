/**
 * Lectura con verificación de huellas (RF-06.1). El verificador solo mide lo que puede atribuir: si una
 * huella no coincide con la declarada, si un archivo no cumple su esquema o si una traza está mal
 * formada, la corrida se RECHAZA con todos los motivos juntos — nunca se mide «lo que se pudo leer».
 *
 * Puro: recibe objetos ya parseados (los scripts leen el disco; la vitrina, IndexedDB).
 */
import type { TextoBilingue } from "../formatos/bilingue";
import { verificarHuella } from "../formatos/huella";
import { jcs, type JsonValor } from "../formatos/jcs";
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
import { cargarPlan, mismaVerdad, type Plan } from "../plan";
import { LoteSchema, type Caso, type Lote } from "../sintetico/esquema";
import {
  DEMO_B,
  LoteBSchema,
  type CasoB,
  type LoteB,
} from "../sintetico/demo-b/esquema";

/** Un lote de cualquier demo, validado con el esquema de SU demo (el `demo_id` lo elige). */
export type LoteDeDemo = Lote | LoteB;

function esquemaDeLote(bruto: unknown) {
  const demo = (bruto as { demo_id?: unknown } | null)?.demo_id;
  return demo === DEMO_B
    ? LoteBSchema.safeParse(bruto)
    : LoteSchema.safeParse(bruto);
}

/** El mundo que cita el lote (plan de beneficios del A, listas del B) y la clave del manifiesto que lo cita. */
function mundoDe(lote: LoteDeDemo): {
  clave: "plan_beneficios" | "listas";
  huella: string;
} {
  return lote.demo_id === DEMO_B
    ? { clave: "listas", huella: lote.listas.huella }
    : { clave: "plan_beneficios", huella: lote.plan_beneficios.huella };
}

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
  /**
   * El plan con que se GENERÓ el lote, si no es el de la corrida: solo se acepta si conserva sus
   * umbrales y su contrato de grafo (`mismaVerdad`), es decir, si la enmienda fue de solo medición.
   */
  planDelLote?: unknown;
  /**
   * El plan con que se EJECUTARON las corridas, si no es el que se verifica (ADR-005, S2): solo se acepta si
   * verifica su huella contra el manifiesto y da la misma verdad que el plan verificado (mismos umbrales y
   * contrato de grafo), porque entonces el agente habría hecho exactamente lo mismo con cualquiera de los dos.
   */
  planDeLaCorrida?: unknown;
  /** Ruta del plan verificado, para la ficha, cuando no es el que nombra el manifiesto. */
  archivoPlan?: string;
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
  /** El plan con que se ejecutaron las corridas (el mismo que `plan` salvo `planDeLaCorrida`). */
  planCorrida: { version: string; huella: string };
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
  if (grafo.demo_id !== manifiesto.demo_id)
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("grafo.json"),
        "el grafo es de otro demo",
        "the graph belongs to another demo",
      ),
    );
  if (jcs(ramas.umbrales_aplicados) !== jcs(manifiesto.umbrales_aplicados))
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("ramas-esperadas.json"),
        "las ramas esperadas se calcularon con otros umbrales que los del manifiesto",
        "the expected branches were computed with other thresholds than the manifest's",
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
  const conError = trazas
    .filter((t) => t.resultado === "error")
    .map((t) => t.caso_id)
    .sort()
    .join(",");
  if (
    trazas.length === manifiesto.casos_ejecutados.length &&
    conError !== [...manifiesto.casos_con_error].sort().join(",")
  )
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo("corrida.json"),
        "los casos con error del manifiesto no son las trazas que terminaron en error",
        "the manifest's cases with errors are not the traces that ended in error",
      ),
    );
  return { ruta: a.ruta, manifiesto, grafo, ramas, trazas };
}

function compatible(
  c: CorridaLeida,
  plan: { huella: string; id: string; version: string },
  lote: LoteDeDemo,
  casos: ReadonlyMap<string, Caso | CasoB>,
  variante: "multiagente" | "agente_unico",
  motivos: MotivoLectura[],
): void {
  const archivo = `${c.ruta}/corrida.json`;
  // La verdad conocida del lote se deriva también de su mundo: otro plan de beneficios (A) u otras listas (B), otra
  // verdad.
  const mundo = mundoDe(lote);
  if (c.manifiesto[mundo.clave]?.huella !== mundo.huella)
    motivos.push(
      mundo.clave === "plan_beneficios"
        ? m(
            "HUELLA_NO_COINCIDE",
            archivo,
            "la corrida usó otro plan de beneficios que el del lote de casos",
            "the run used another benefits plan than the case batch's",
          )
        : m(
            "HUELLA_NO_COINCIDE",
            archivo,
            "la corrida usó otras listas de control que las del lote de casos",
            "the run used other control lists than the case batch's",
          ),
    );
  if (
    c.manifiesto.plan.id !== plan.id ||
    c.manifiesto.plan.version !== plan.version
  )
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo,
        "el manifiesto nombra otro plan (id o versión)",
        "the manifest names another plan (id or version)",
      ),
    );
  if (c.manifiesto.demo_id !== lote.demo_id)
    motivos.push(
      m(
        "REFERENCIA_ROTA",
        archivo,
        "la corrida es de otro demo que el lote de casos",
        "the run belongs to another demo than the case batch",
      ),
    );
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

/** El lote se generó con otro plan: aceptarlo solo si ese plan existe, verifica y da la misma verdad. */
async function loteCompatible(
  planBruto: unknown,
  huellaPlan: string,
  lote: LoteDeDemo,
  planDelLote: unknown,
  motivos: MotivoLectura[],
): Promise<void> {
  if (lote.plan.huella === huellaPlan) return;
  const version = lote.plan.version;
  if (planDelLote === undefined || planDelLote === null) {
    motivos.push(
      m(
        "CORRIDA_INCOMPATIBLE",
        "casos",
        `el lote se generó con el plan ${version} y no se entregó ese plan para comprobar que conserva umbrales y contrato de grafo`,
        `the batch was generated with plan ${version} and that plan was not provided to check it keeps thresholds and graph contract`,
      ),
    );
    return;
  }
  const carga = await cargarPlan(planDelLote);
  if (!carga.ok || carga.huella !== lote.plan.huella) {
    motivos.push(
      m(
        "HUELLA_NO_COINCIDE",
        "casos",
        `el plan entregado como plan del lote no es el ${version} con que se generó`,
        `the plan provided as the batch's plan is not the ${version} it was generated with`,
      ),
    );
    return;
  }
  if (!mismaVerdad(planDelLote, planBruto))
    motivos.push(
      m(
        "CORRIDA_INCOMPATIBLE",
        "casos",
        `el lote se generó con el plan ${version}, que tiene otros umbrales u otro contrato de grafo: su verdad conocida no vale para este plan`,
        `the batch was generated with plan ${version}, which has other thresholds or another graph contract: its known truth does not hold for this plan`,
      ),
    );
}

/**
 * Identidad del plan contra la que se comparan las corridas: la del plan verificado o, con `planDeLaCorrida`, la
 * del plan con que se ejecutaron — aceptado solo si es el que declara el manifiesto y da la misma verdad.
 */
async function planDeEjecucion(
  e: EntradaVerificador,
  carga: { huella: string; plan: Plan },
  corrida: CorridaLeida,
  motivos: MotivoLectura[],
): Promise<{ huella: string; id: string; version: string }> {
  const propio = {
    huella: carga.huella,
    id: carga.plan.id,
    version: carga.plan.version,
  };
  if (e.planDeLaCorrida === undefined || e.planDeLaCorrida === null)
    return propio;
  const c = await cargarPlan(e.planDeLaCorrida);
  const archivo = `${corrida.ruta}/corrida.json`;
  if (!c.ok || c.huella !== corrida.manifiesto.plan.huella) {
    motivos.push(
      m(
        "HUELLA_NO_COINCIDE",
        archivo,
        "el plan entregado como plan de las corridas no es el que declara su manifiesto",
        "the plan provided as the runs' plan is not the one their manifest declares",
      ),
    );
    return propio;
  }
  if (c.plan.id !== carga.plan.id || !mismaVerdad(e.planDeLaCorrida, e.plan)) {
    motivos.push(
      m(
        "CORRIDA_INCOMPATIBLE",
        archivo,
        `las corridas se hicieron con el plan ${c.plan.version}, que es otro plan o tiene otros umbrales u otro contrato de grafo: no valen para verificar el ${carga.plan.version}`,
        `the runs used plan ${c.plan.version}, which is another plan or has other thresholds or another graph contract: they cannot verify ${carga.plan.version}`,
      ),
    );
    return propio;
  }
  return { huella: c.huella, id: c.plan.id, version: c.plan.version };
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
    await loteCompatible(e.plan, carga.huella, lote, e.planDelLote, motivos);
    const casos = new Map(lote.casos.map((c) => [c.id, c]));
    const plan = await planDeEjecucion(e, carga, corrida, motivos);
    compatible(corrida, plan, lote, casos, "multiagente", motivos);
    const casosDe = (c: CorridaLeida) =>
      [...c.manifiesto.casos_ejecutados].sort().join(",");
    const vistas = new Set<string>([corrida.manifiesto.corrida_id]);
    for (const r of repeticiones) {
      compatible(r, plan, lote, casos, "multiagente", motivos);
      const archivo = `${r.ruta}/corrida.json`;
      // pass^k cuenta k corridas DISTINTAS del mismo grafo sobre los mismos casos (M-3).
      if (vistas.has(r.manifiesto.corrida_id))
        motivos.push(
          m(
            "CORRIDA_INCOMPATIBLE",
            archivo,
            "una repetición no puede ser la misma corrida ni repetirse",
            "a repetition cannot be the same run nor appear twice",
          ),
        );
      vistas.add(r.manifiesto.corrida_id);
      if (r.manifiesto.version_grafo !== corrida.manifiesto.version_grafo)
        motivos.push(
          m(
            "CORRIDA_INCOMPATIBLE",
            archivo,
            "la repetición corrió otra versión del grafo",
            "the repetition ran another graph version",
          ),
        );
      if (casosDe(r) !== casosDe(corrida))
        motivos.push(
          m(
            "CORRIDA_INCOMPATIBLE",
            archivo,
            "la repetición ejecutó otros casos",
            "the repetition ran other cases",
          ),
        );
    }
    if (base) compatible(base, plan, lote, casos, "agente_unico", motivos);
    if (motivos.length === 0)
      return {
        plan: carga.plan,
        huellaPlan: carga.huella,
        planCorrida: { version: plan.version, huella: plan.huella },
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
  planDelLote?: unknown,
): Promise<CorridaLeida> {
  const motivos: MotivoLectura[] = [];
  const carga = await cargarPlan(planBruto);
  if (!carga.ok)
    motivos.push(
      ...carga.motivos.map((x) =>
        m("PLAN_INVALIDO", "plan", x.mensaje.es, x.mensaje.en),
      ),
    );
  const lote = esquema<LoteDeDemo>(esquemaDeLote(casosBruto), "casos", motivos);
  if (lote) await huellaCoincide(casosBruto, "casos", motivos);
  const corrida = await leerCorrida(a, motivos);
  if (carga.ok && lote && corrida) {
    await loteCompatible(planBruto, carga.huella, lote, planDelLote, motivos);
    const casos = new Map<string, Caso | CasoB>(
      lote.casos.map((c: Caso | CasoB) => [c.id, c]),
    );
    compatible(
      corrida,
      { huella: carga.huella, id: carga.plan.id, version: carga.plan.version },
      lote,
      casos,
      corrida.manifiesto.variante,
      motivos,
    );
    if (motivos.length === 0) return corrida;
  }
  throw new ErrorDeLectura(motivos);
}
