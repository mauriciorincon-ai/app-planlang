/**
 * Gate de contrato Python → TypeScript del demo B (regla 19): la corrida simulada versionada la escribió el
 * exportador de Python con su serializador real; aquí se lee con Zod. Las trazas del B traen sus campos propios
 * (coincidencias, investigación, puntaje, expediente) y su extracción de tres documentos; el manifiesto cita las
 * listas y no un plan de beneficios. El lector las acepta y rechaza las de otras listas.
 * Demo en rojo (bitácora S3, fase 2): quitar `expediente` de una traza versionada → rojo nombrando la traza.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CorridaSchema,
  ExtraccionBSchema,
  TrazaSchema,
} from "../../core/formatos/traza";
import {
  ErrorDeLectura,
  leerCorridaVerificada,
} from "../../core/brecha/lector";
import { archivosDeCorrida } from "../../scripts/_corridas";
import { datosDemo } from "../../src/lib/datos/vitrina";
import { perfilCasoB } from "../../src/lib/vista/caso-b";
import type { CasoB } from "../../core/sintetico/demo-b/esquema";

// `simulado-humo` es la corrida de la fase 2; `simulado-humo-2`, la del agente con los arreglos de la fase 4 (aviso de
// IA en el documento de rechazo, valores como el plan, conclusiones sin huecos). Las dos se leen.
const CORRIDAS = [
  "runs/demo-b/simulado-humo",
  "runs/demo-b/simulado-humo-base",
  "runs/demo-b/simulado-humo-2",
  "runs/demo-b/simulado-humo-2-base",
];
const json = (ruta: string): unknown => JSON.parse(readFileSync(ruta, "utf8"));

describe("trazas del demo B escritas por Python", () => {
  it.each(CORRIDAS)("%s: cada traza cumple el esquema y trae sus campos del B", (ruta) => {
    const dir = join(ruta, "trazas");
    expect(existsSync(dir)).toBe(true);
    const archivos = readdirSync(dir).sort();
    expect(archivos.length).toBe(4);
    for (const f of archivos) {
      const t = TrazaSchema.parse(json(join(dir, f)));
      for (const k of ["coincidencias", "investigacion", "puntaje", "expediente"] as const)
        expect(Object.hasOwn(t, k), `${f}: ${k}`).toBe(true);
      expect(ExtraccionBSchema.safeParse(t.extraccion).success, f).toBe(true);
      expect(t.expediente?.conclusiones_sin_cita, f).toBe(0);
      expect(t.coincidencias?.listas_consultadas.length, f).toBe(2);
      for (const s of ["similitud_max", "puntaje_riesgo", "extraccion_correcta", "inyeccion_neutralizada"])
        expect(Object.hasOwn(t.senales, s), `${f}: ${s}`).toBe(true);
    }
  });

  it("el manifiesto cita las listas y no un plan de beneficios; con los dos mundos se rechaza", () => {
    const m = json("runs/demo-b/simulado-humo/corrida.json") as Record<string, unknown>;
    const c = CorridaSchema.parse(m);
    expect(c.listas?.archivo).toBe("data/listas/demo-b.json");
    expect(c.plan_beneficios).toBeUndefined();
    const ambos = { ...m, plan_beneficios: m["listas"] };
    expect(CorridaSchema.safeParse(ambos).success).toBe(false);
  });

  it("el lector acepta la corrida contra su lote y rechaza un lote con otras listas", async () => {
    const archivos = archivosDeCorrida("runs/demo-b/simulado-humo");
    const plan = json("plans/demo-b/v1.json");
    const lote = json("data/casos/demo-b/planlang-b-humo-4.json") as Record<string, unknown>;
    const leida = await leerCorridaVerificada(archivos, plan, lote);
    expect(leida.trazas.map((t) => t.caso_id)).toEqual(["BH-001", "BH-002", "BH-003", "BH-004"]);
    const otro = { ...lote, listas: { ...(lote["listas"] as object), huella: "0".repeat(64) } };
    const error = await leerCorridaVerificada(archivos, plan, otro).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeLectura);
    expect((error as ErrorDeLectura).motivos.map((x) => x.detalle.es)).toContain(
      "la corrida usó otras listas de control que las del lote de casos",
    );
  });

  it("el documento de rechazo que escribe Python lleva su aviso de IA y la vista del caso lo pinta", async () => {
    // De punta a punta (regla 19): el exportador de Python lo escribió, Zod lo lee y la vista del B lo pinta.
    const t = TrazaSchema.parse(json("runs/demo-b/simulado-humo-2/trazas/BH-003.json"));
    const lote = json("data/casos/demo-b/planlang-b-humo-4.json") as { casos: CasoB[] };
    const c = lote.casos.find((x) => x.id === "BH-003")!;
    const d = await datosDemo("demo-b");
    for (const i of ["es", "en"] as const) {
      const aviso = (t.documento_adverso as unknown as { aviso_ia: Record<typeof i, string> }).aviso_ia[i];
      expect(perfilCasoB(d, t, c, i).documento?.aviso).toBe(aviso);
    }
    // La corrida de la fase 2 no lo trae: la vista no inventa uno.
    const vieja = TrazaSchema.parse(json("runs/demo-b/simulado-humo/trazas/BH-003.json"));
    expect(perfilCasoB(d, vieja, c, "es").documento?.aviso).toBeNull();
  });
});
