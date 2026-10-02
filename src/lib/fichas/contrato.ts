/**
 * Validación de lo que planlang entrega a hoja-de-vida, contra las copias fijadas en `docs/contratos/hoja-de-vida/`
 * (huellas en su `CONTRATO.lock`):
 * - la ficha técnica pasa el JSON Schema v1.3.1 (Ajv 2020) y las reglas que en hoja-de-vida viven solo en su Zod: el
 *   proceso BPMN (un inicio, al menos un fin, todo paso alcanzable y con salida, una decisión con dos caminos), un
 *   proceso con su procedencia y nunca una sin el otro; y, de la clave visual, que cada camino de una decisión lleve
 *   su etiqueta;
 * - el `brochure-export.json` pasa el espejo del esquema 1.0.0 (`brochureExportSchema` de hoja-de-vida): forma
 *   estricta, el total igual a la suma de los grupos y los dos enlaces en `null`;
 * - y en los dos, cero enlaces en el texto (regla 17).
 * Corre en el build (P7 muestra el resultado) y en las pruebas; nunca llega al navegador.
 */
import Ajv2020 from "ajv/dist/2020";
import { z } from "zod";
import esquemaFicha from "../../../docs/contratos/hoja-de-vida/ficha-tecnica/ficha-tecnica.schema.json";
import type { ProcesoBpmn } from "./tipos";

export const VERSION_FICHA = "1.3.1";
export const VERSION_EXPORT = "1.0.0";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validarEsquemaFicha = ajv.compile(esquemaFicha);

/** Hosts y esquemas que delatan un enlace (los patrones del barrido de la regla 17, sin escribirlos literales). */
const ENLACE = /https?:\/\/|www\.|vercel\.app|workers\.dev|pages\.dev/i;

function textos(v: unknown, ruta: string, out: [string, string][] = []) {
  if (typeof v === "string") out.push([ruta, v]);
  else if (Array.isArray(v))
    v.forEach((x, i) => textos(x, `${ruta}/${i}`, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) textos(x, `${ruta}/${k}`, out);
  return out;
}

function sinEnlaces(v: unknown): string[] {
  return textos(v, "")
    .filter(([, t]) => ENLACE.test(t))
    .map(([r]) => `${r || "/"}: trae un enlace (regla de cero enlaces)`);
}

/** Las reglas del proceso que el JSON Schema no puede decir (hoja-de-vida las tiene en el `superRefine` de su Zod). */
export function problemasDelProceso(p: ProcesoBpmn): string[] {
  const out: string[] = [];
  const carriles = new Set(p.carriles.map((c) => c.id));
  const ids = new Set<string>();
  for (const paso of p.pasos) {
    if (ids.has(paso.id)) out.push(`proceso: paso repetido «${paso.id}»`);
    ids.add(paso.id);
    if (!carriles.has(paso.carril))
      out.push(
        `proceso: «${paso.id}» está en un carril que no existe («${paso.carril}»)`,
      );
    if (paso.tipo === "tarea" && paso.texto.trim().length < 3)
      out.push(`proceso: la tarea «${paso.id}» necesita texto`);
  }
  const inicios = p.pasos.filter((x) => x.tipo === "inicio").length;
  if (inicios !== 1)
    out.push(`proceso: necesita exactamente un inicio (tiene ${inicios})`);
  if (!p.pasos.some((x) => x.tipo === "fin"))
    out.push("proceso: necesita al menos un fin");
  const entra = new Map<string, number>();
  const sale = new Map<string, number>();
  for (const f of p.flujos) {
    for (const extremo of [f.de, f.a])
      if (!ids.has(extremo))
        out.push(
          `proceso: un flujo nombra un paso que no existe («${extremo}»)`,
        );
    sale.set(f.de, (sale.get(f.de) ?? 0) + 1);
    entra.set(f.a, (entra.get(f.a) ?? 0) + 1);
  }
  for (const paso of p.pasos) {
    if (paso.tipo !== "inicio" && !entra.get(paso.id))
      out.push(`proceso: «${paso.id}» no es alcanzable`);
    if (paso.tipo !== "fin" && !sale.get(paso.id))
      out.push(`proceso: «${paso.id}» no tiene salida`);
    if (paso.tipo === "decision") {
      const caminos = p.flujos.filter((f) => f.de === paso.id);
      if (caminos.length < 2)
        out.push(
          `proceso: la decisión «${paso.id}» necesita al menos dos caminos`,
        );
      if (caminos.some((f) => !f.etiqueta))
        out.push(
          `proceso: cada camino de la decisión «${paso.id}» lleva su etiqueta`,
        );
    }
  }
  for (const a of p.anotaciones)
    if (!ids.has(a.paso))
      out.push(
        `proceso: una anotación nombra un paso que no existe («${a.paso}»)`,
      );
  return out;
}

/** Todo lo que la ficha incumple del contrato v1.3.1 (vacío: la ficha se puede entregar). */
export function problemasDeFicha(ficha: unknown): string[] {
  const out: string[] = [];
  if (!validarEsquemaFicha(ficha))
    for (const e of validarEsquemaFicha.errors ?? [])
      out.push(
        `${e.instancePath || "/"}: ${e.message ?? "no cumple el esquema"}`,
      );
  const f = ficha as { proceso?: ProcesoBpmn; procedencia_proceso?: string };
  if (f && typeof f === "object") {
    if (f.proceso !== undefined && f.procedencia_proceso === undefined)
      out.push("procedencia_proceso: el proceso necesita su procedencia");
    if (f.proceso === undefined && f.procedencia_proceso !== undefined)
      out.push("procedencia_proceso: sin proceso, sobra");
    if (f.proceso && Array.isArray(f.proceso.pasos))
      out.push(...problemasDelProceso(f.proceso));
  }
  out.push(...sinEnlaces(ficha));
  return out;
}

// ------------------------------------------------------------------------------------- brochure-export 1.0.0

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const fuente = z.enum(["medido", "calculada", "declarado", "estimacion"]);
const lleno = z.string().min(1);

/** Espejo del `brochureExportSchema` de hoja-de-vida (`src/lib/vitrina/schemas.ts`, huella en el lock). */
export const EsquemaExport = z
  .object({
    _schema: z.record(z.string(), z.unknown()).optional(),
    schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    actualizado: fecha,
    app: z
      .object({
        slug: z
          .string()
          .min(1)
          .max(60)
          .regex(/^[a-z0-9-]+$/),
        nombre: lleno,
        ciclo: lleno,
        estado: z.enum(["inicial", "sellado"]),
        sellado_en: fecha.nullable(),
        sprints_cerrados: z.number().int().nonnegative(),
        version_repo: lleno,
      })
      .strict(),
    promesa: z
      .object({
        tagline: lleno,
        intro: lleno,
        para_quien: lleno,
        diferencial: lleno,
      })
      .strict(),
    funcionalidades: z
      .object({
        total: z.number().int().nonnegative(),
        fuente_del_conteo: lleno,
        descartadas: z
          .array(
            z
              .object({ id: lleno, nombre: lleno, fecha, razon: lleno })
              .strict(),
          )
          .default([]),
        grupos: z
          .array(
            z
              .object({
                orden: z.number().int().positive(),
                estrella: z.boolean(),
                nombre: lleno,
                linea: lleno,
                features: z
                  .array(
                    z
                      .object({
                        id: lleno,
                        nombre: lleno,
                        que_hace: lleno,
                        seccion_manual: lleno,
                      })
                      .strict(),
                  )
                  .min(1),
              })
              .strict(),
          )
          .min(1),
      })
      .strict()
      .superRefine((f, ctx) => {
        const suma = f.grupos.reduce((n, g) => n + g.features.length, 0);
        if (suma !== f.total)
          ctx.addIssue({
            code: "custom",
            path: ["total"],
            message: `total declarado ${f.total} ≠ ${suma} funcionalidades en los grupos`,
          });
      }),
    metricas: z
      .array(
        z
          .object({
            clave: lleno,
            etiqueta: lleno,
            valor: z.number(),
            unidad: z.string(),
            fuente,
            detalle: lleno,
          })
          .strict(),
      )
      .min(1),
    stack: z.array(z.object({ nombre: lleno, papel: lleno }).strict()).min(1),
    privacidad: z.object({ detalle: lleno }).catchall(z.boolean()),
    enlaces: z
      .object({
        produccion: z.null(),
        razon: lleno,
        repositorio: z.null(),
        razon_repositorio: lleno,
        brochure_archivo: lleno,
        brochure_ruta_local: lleno,
      })
      .strict(),
  })
  .strict();

/** Todo lo que el export incumple del contrato 1.0.0 (vacío: se puede entregar). */
export function problemasDeExport(exp: unknown): string[] {
  const r = EsquemaExport.safeParse(exp);
  const out = r.success
    ? []
    : r.error.issues.map((i) => `/${i.path.join("/")}: ${i.message}`);
  const sinSchema = { ...(exp as Record<string, unknown>) };
  delete sinSchema._schema;
  out.push(...sinEnlaces(sinSchema));
  return out;
}

// ------------------------------------------------------------------------------------- límites para la tabla de P7

type Nodo = {
  type?: string;
  properties?: Record<string, Nodo>;
  items?: Nodo;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};

/** El límite que el esquema fijado pone a un campo (`promesa.tagline`, `cifras`…), leído de la copia, no escrito. */
export function limiteDe(ruta: string): {
  min?: number;
  max?: number;
  tipo: "texto" | "lista";
} {
  let n = esquemaFicha as Nodo;
  for (const parte of ruta.split(".")) {
    const sig = n.properties?.[parte] ?? (parte === "[]" ? n.items : undefined);
    if (!sig)
      throw new Error(`fichas: el contrato no tiene el campo «${ruta}»`);
    n = sig;
  }
  return n.type === "array"
    ? { min: n.minItems, max: n.maxItems, tipo: "lista" }
    : { min: n.minLength, max: n.maxLength, tipo: "texto" };
}
