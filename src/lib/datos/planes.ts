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
import { cargarPlan } from "@core/plan/cargar";
import type { Plan } from "@core/plan/esquema";
import { ManifiestoVitrinaSchema } from "./esquemas";

export interface PlanSinCorrida {
  id: string;
  /** `plans/<id>/vN.json`, relativo a la raíz. */
  archivo: string;
  plan: Plan;
  huella: string;
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

/** El archivo aprobado más reciente de una carpeta: la versión más alta por `version` del plan, no por nombre. */
async function planDeCarpeta(
  raiz: string,
  carpeta: string,
): Promise<PlanSinCorrida | null> {
  const archivos = readdirSync(join(raiz, carpeta))
    .filter((f) => VERSIONADO.test(f))
    .sort();
  if (archivos.length === 0) return null;
  let elegido: PlanSinCorrida | null = null;
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
    if (!elegido || mayorVersion(r.plan.version, elegido.plan.version))
      elegido = { id: r.plan.id, archivo, plan: r.plan, huella: r.huella };
  }
  return elegido;
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
