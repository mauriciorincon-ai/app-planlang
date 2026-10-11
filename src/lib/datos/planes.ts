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
  /** `plans/<id>[/vN]/respuestas-*.json`, relativo a la raíz. */
  archivo: string;
  /** Cuándo corrió la entrevista: la fecha de su transcripción. */
  entrevista: string;
  /** Solo las revisadas: cuándo las confirmó el usuario y qué preguntas cambió. */
  revision: { fecha: string; cambiadas: string[] } | null;
}

/** Una versión aprobada de un plan (la más alta es la que se lee; las demás son su historia). */
export interface VersionDelPlan {
  version: string;
  archivo: string;
  huella: string;
  aprobado_por: string | null;
  aprobado_el: string | null;
  /** De quién eran las respuestas de la entrevista de esa versión. */
  respuestas: OrigenDeRespuestas | null;
}

export interface PlanSinCorrida {
  id: string;
  /** `plans/<id>/vN.json`, relativo a la raíz. */
  archivo: string;
  plan: Plan;
  huella: string;
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

function origenDeRespuestas(
  raiz: string,
  carpeta: string,
  version: string,
): OrigenDeRespuestas | null {
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
  const rutaTranscripcion = join(raiz, dir, "transcripcion.json");
  if (!existsSync(rutaTranscripcion))
    throw new Error(
      `planes: ${archivo} sin ${dir}/transcripcion.json: no se puede decir cuándo fue la entrevista.`,
    );
  const entrevista = TranscripcionSchema.parse(
    JSON.parse(readFileSync(rutaTranscripcion, "utf8")),
  ).fecha;
  if (clase === "delegadas")
    return { clase, archivo, entrevista, revision: null };
  const revisada = RespuestasRevisadasSchema.safeParse(
    JSON.parse(readFileSync(join(raiz, archivo), "utf8")),
  );
  if (!revisada.success)
    throw new Error(
      `planes: ${archivo} no trae su _origen (fecha, frase_del_usuario, cambiadas): ${revisada.error.issues[0]?.message ?? ""}`,
    );
  const o = revisada.data._origen;
  return {
    clase,
    archivo,
    entrevista,
    revision: { fecha: o.fecha, cambiadas: o.cambiadas },
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
  const cargados: Omit<PlanSinCorrida, "respuestas" | "anteriores">[] = [];
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
    cargados.push({ id: r.plan.id, archivo, plan: r.plan, huella: r.huella });
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
    ...elegido,
    respuestas: origenDeRespuestas(raiz, carpeta, elegido.plan.version),
    anteriores: resto.map((x) => ({
      version: x.plan.version,
      archivo: x.archivo,
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
