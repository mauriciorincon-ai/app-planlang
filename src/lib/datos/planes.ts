/**
 * Los planes sin corrida (S5): planes aprobados en `plans/<id>/vN.json` que ningún demo de la vitrina corre. SOLO en el
 * servidor y SOLO al compilar (`output: "export"`), como `vitrina.ts`. Cada uno pasa por `cargarPlan` (M1 y huella
 * verificada): un plan editado a mano que conserva la huella vieja detiene el build nombrando el archivo.
 *
 * Qué es «sin corrida»: su carpeta no es la de ningún plan que declare `data/vitrina/manifiesto.json`. Los demos A y B
 * tienen trazas, informe y playground; estos planes solo tienen el contrato que se aprobó, y la página lo dice (P15).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { cargarPlan } from "@core/plan/cargar";
import type { Plan } from "@core/plan/esquema";
import { TranscripcionSchema } from "@core/plan/revision";
import { ManifiestoVitrinaSchema } from "./esquemas";

/**
 * De quién son las respuestas de una entrevista (S6). Lo decide el archivo que la entrevista usó, no un texto escrito a
 * mano: `respuestas-por-delegacion.json` (el usuario las delegó al constructor, S5) o `respuestas-revisadas.json` (el
 * usuario las revisó y las confirmó, con su `_origen`). Un archivo `respuestas-*.json` de otro nombre detiene el build.
 */
export type ClaseDeRespuestas = "delegadas" | "revisadas";

export interface OrigenDeRespuestas {
  clase: ClaseDeRespuestas;
  /** Cuándo corrió la entrevista: la fecha de su transcripción. */
  entrevista: string;
  /** Solo las revisadas: cuándo las confirmó el usuario y qué preguntas cambió frente a la versión anterior. */
  revision: { fecha: string; cambiadas: string[] } | null;
}

/** Una versión aprobada de un plan (la más alta es la que se lee; las demás son su historia). */
export interface VersionDelPlan {
  version: string;
  huella: string;
  aprobado_por: string | null;
  aprobado_el: string | null;
  /** De quién eran las respuestas de la entrevista de esa versión. */
  respuestas: OrigenDeRespuestas | null;
}

/** El plan aprobado más reciente de una carpeta con lo que el repo guarda de su entrevista y de su historia. */
export interface PlanSinCorrida {
  id: string;
  plan: Plan;
  /** De quién son las respuestas de la entrevista de ESTA versión; `null` si el repo no guarda su archivo. */
  respuestas: OrigenDeRespuestas | null;
  /** Las versiones aprobadas anteriores, de la más nueva a la más vieja. */
  anteriores: VersionDelPlan[];
}

const RespuestasRevisadasSchema = z.object({
  _origen: z.object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    frase_del_usuario: z.string().min(1),
    cambiadas: z.array(z.string().regex(/^P\d{2}$/)),
  }),
});

const CLASE_DE_ARCHIVO: Readonly<Record<string, ClaseDeRespuestas>> = {
  "respuestas-por-delegacion.json": "delegadas",
  "respuestas-revisadas.json": "revisadas",
};

/** La carpeta donde una versión guarda su entrevista: la 1 en la del plan; la N ≥ 2 en `vN/`. */
function carpetaDeVersion(carpeta: string, version: string): string {
  const mayor = Number(version.split(".")[0]);
  return mayor >= 2 ? `${carpeta}/v${mayor}` : carpeta;
}

/** Un JSON del repo; si está roto, el error nombra el archivo (auditoría S6 B4). */
function leerJsonDelRepo(raiz: string, archivo: string): unknown {
  try {
    return JSON.parse(readFileSync(join(raiz, archivo), "utf8"));
  } catch (e) {
    throw new Error(
      `planes: ${archivo} no es JSON válido: ${(e as Error).message}`,
    );
  }
}

type Transcripcion = z.infer<typeof TranscripcionSchema>;

/** La respuesta de una pregunta tal como quedó en la transcripción: su último turno. */
function respuestaDeLaTranscripcion(
  t: Transcripcion,
  id: string,
): string | undefined {
  return t.preguntas
    .find((q) => q.id === id)
    ?.turnos.at(-1)
    ?.respuesta?.texto.trim();
}

/** Las preguntas (P01…P14) cuya respuesta revisada difiere de la delegada: lo que de verdad cambió (S6 M2). */
function preguntasCambiadas(revisadas: object, delegadas: object): string[] {
  const r = revisadas as Record<string, unknown>;
  const d = delegadas as Record<string, unknown>;
  return Object.keys(r)
    .filter((k) => /^P\d{2}$/.test(k))
    .filter((k) => String(r[k]).trim() !== String(d[k] ?? "").trim())
    .sort();
}

interface RespuestasUbicadas {
  dir: string;
  archivo: string;
  clase: ClaseDeRespuestas;
}

/** El archivo de respuestas que usó la entrevista de una versión, o `null` si el repo no lo guarda. */
function ubicarRespuestas(
  raiz: string,
  carpeta: string,
  version: string,
): RespuestasUbicadas | null {
  const dir = carpetaDeVersion(carpeta, version);
  if (!existsSync(join(raiz, dir))) return null;
  const hallados = readdirSync(join(raiz, dir)).filter((f) =>
    /^respuestas-.+\.json$/.test(f),
  );
  if (hallados.length === 0) return null;
  if (hallados.length > 1)
    throw new Error(
      `planes: ${dir} guarda ${hallados.length} archivos de respuestas (${hallados.join(", ")}): debe haber uno.`,
    );
  const nombre = hallados[0] as string;
  const archivo = `${dir}/${nombre}`;
  const clase = CLASE_DE_ARCHIVO[nombre];
  if (!clase)
    throw new Error(
      `planes: ${archivo}: no sé de quién son estas respuestas (los nombres que la vitrina entiende: ${Object.keys(CLASE_DE_ARCHIVO).join(", ")}).`,
    );
  return { dir, archivo, clase };
}

function origenDeRespuestas(
  raiz: string,
  carpeta: string,
  version: string,
): OrigenDeRespuestas | null {
  const u = ubicarRespuestas(raiz, carpeta, version);
  if (!u) return null;
  const { dir, archivo, clase } = u;
  if (!existsSync(join(raiz, dir, "transcripcion.json")))
    throw new Error(
      `planes: ${archivo} sin ${dir}/transcripcion.json: no se puede decir cuándo fue la entrevista.`,
    );
  let transcripcion: Transcripcion;
  try {
    transcripcion = TranscripcionSchema.parse(
      leerJsonDelRepo(raiz, `${dir}/transcripcion.json`),
    );
  } catch (e) {
    throw new Error(
      `planes: ${dir}/transcripcion.json no carga: ${(e as Error).message}`,
    );
  }
  const entrevista = transcripcion.fecha;
  if (clase === "delegadas") return { clase, entrevista, revision: null };
  const crudo = leerJsonDelRepo(raiz, archivo);
  const revisada = RespuestasRevisadasSchema.safeParse(crudo);
  if (!revisada.success)
    throw new Error(
      `planes: ${archivo} no trae su _origen (fecha, frase_del_usuario, cambiadas): ${revisada.error.issues[0]?.message ?? ""}`,
    );
  // M1: la vitrina no publica respuestas que la entrevista no usó. Cada una debe ser la de la transcripción.
  const r = crudo as Record<string, unknown>;
  const dispares = Object.keys(r)
    .filter((k) => /^P\d{2}$/.test(k))
    .filter(
      (k) =>
        respuestaDeLaTranscripcion(transcripcion, k) !== String(r[k]).trim(),
    );
  if (dispares.length > 0)
    throw new Error(
      `planes: ${archivo} no coincide con ${dir}/transcripcion.json en ${dispares.join(", ")}: la vitrina no publica respuestas que la entrevista no usó.`,
    );
  // Lo que cambió al revisar sale SIEMPRE de comparar con las respuestas de la versión anterior (S6 M2, S7). Lo que el
  // archivo declara en `_origen.cambiadas` debe coincidir: si no, la vitrina diría algo distinto de lo que se respondió.
  const mayor = Number(version.split(".")[0]);
  const base =
    mayor >= 2 ? ubicarRespuestas(raiz, carpeta, `${mayor - 1}`) : null;
  if (!base)
    throw new Error(
      `planes: ${archivo} son respuestas revisadas, pero el repo no guarda las de la versión anterior con qué compararlas: no se puede decir qué cambió.`,
    );
  const cambiadas = preguntasCambiadas(
    r,
    leerJsonDelRepo(raiz, base.archivo) as object,
  );
  const declaradas = [...revisada.data._origen.cambiadas].sort();
  if (cambiadas.join(",") !== declaradas.join(","))
    throw new Error(
      `planes: ${archivo}: _origen.cambiadas dice «${declaradas.join(", ") || "ninguna"}», pero frente a ${base.archivo} cambió «${cambiadas.join(", ") || "ninguna"}».`,
    );
  return {
    clase,
    entrevista,
    revision: { fecha: revisada.data._origen.fecha, cambiadas },
  };
}

const VERSIONADO = /^v\d+(?:\.\d+)*\.json$/;

/** Las carpetas de `plans/` que pertenecen a un demo de la vitrina: lo que el manifiesto declara como plan. */
function carpetasDeDemos(raiz: string): Set<string> {
  const m = ManifiestoVitrinaSchema.parse(
    JSON.parse(
      readFileSync(join(raiz, "data/vitrina/manifiesto.json"), "utf8"),
    ),
  );
  return new Set(Object.values(m.demos).map((d) => dirname(d.plan.archivo)));
}

/**
 * El archivo aprobado más reciente de una carpeta: la versión más alta por `version` del plan, no por nombre. Las
 * demás quedan como `anteriores`: la v1 sigue en el repo y la ficha de la v2 lo dice.
 */
async function planDeCarpeta(
  raiz: string,
  carpeta: string,
): Promise<PlanSinCorrida | null> {
  const archivos = readdirSync(join(raiz, carpeta))
    .filter((f) => VERSIONADO.test(f))
    .sort();
  if (archivos.length === 0) return null;
  const cargados: { archivo: string; plan: Plan; huella: string }[] = [];
  for (const f of archivos) {
    const archivo = `${carpeta}/${f}`;
    const crudo: unknown = JSON.parse(
      readFileSync(join(raiz, archivo), "utf8"),
    );
    const r = await cargarPlan(crudo);
    if (!r.ok)
      throw new Error(
        `planes: ${archivo} no carga — ${r.motivos.map((m) => `[${m.codigo}] ${m.elemento}: ${m.mensaje.es}`).join("; ")}`,
      );
    if (r.plan.id !== carpeta.split("/").at(-1))
      throw new Error(
        `planes: ${archivo} es el plan «${r.plan.id}», pero su carpeta dice «${carpeta}».`,
      );
    cargados.push({ archivo, plan: r.plan, huella: r.huella });
  }
  cargados.sort((a, b) =>
    mayorVersion(a.plan.version, b.plan.version)
      ? -1
      : mayorVersion(b.plan.version, a.plan.version)
        ? 1
        : 0,
  );
  const [elegido, ...resto] = cargados as [
    (typeof cargados)[number],
    ...typeof cargados,
  ];
  return {
    id: elegido.plan.id,
    plan: elegido.plan,
    respuestas: origenDeRespuestas(raiz, carpeta, elegido.plan.version),
    anteriores: resto.map((x) => ({
      version: x.plan.version,
      huella: x.huella,
      aprobado_por: x.plan.aprobado_por ?? null,
      aprobado_el: x.plan.aprobado_el ?? null,
      respuestas: origenDeRespuestas(raiz, carpeta, x.plan.version),
    })),
  };
}

function mayorVersion(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let k = 0; k < Math.max(pa.length, pb.length); k++) {
    const x = pa[k] ?? 0;
    const y = pb[k] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

/** Todos los planes sin corrida, por id. Vacío si no hay ninguno. */
export async function planesSinCorrida(
  raiz: string = process.cwd(),
): Promise<PlanSinCorrida[]> {
  const dir = join(raiz, "plans");
  if (!existsSync(dir)) return [];
  const deDemos = carpetasDeDemos(raiz);
  const salida: PlanSinCorrida[] = [];
  for (const d of readdirSync(dir, { withFileTypes: true })
    .filter((x) => x.isDirectory())
    .map((x) => x.name)
    .sort()) {
    const carpeta = `plans/${d}`;
    if (deDemos.has(carpeta)) continue;
    const p = await planDeCarpeta(raiz, carpeta);
    if (p) salida.push(p);
  }
  return salida;
}

/** Un plan sin corrida por id; se detiene si no existe (la ruta se generó desde esta misma lista). */
export async function planSinCorrida(
  id: string,
  raiz: string = process.cwd(),
): Promise<PlanSinCorrida> {
  const p = (await planesSinCorrida(raiz)).find((x) => x.id === id);
  if (!p) throw new Error(`planes: no hay un plan sin corrida «${id}».`);
  return p;
}
