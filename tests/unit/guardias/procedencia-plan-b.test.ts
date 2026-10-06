/**
 * AU-S3-10: `plans/demo-b/` es el registro del plan B que el usuario aprobó — el borrador del entrevistador, la
 * transcripción y la revisión que leyó. Esta guarda ata las tres piezas: aprobar el borrador con la firma de `v1.json`
 * reproduce `v1.json` byte a byte, y `contradicciones.json` apunta a ese borrador y a esa transcripción. Una entrevista
 * nueva que sobrescribiera el borrador o la transcripción la pone en rojo (la consola, además, se niega a escribir aquí
 * sin `--salida` desde que `v1.json` existe).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan } from "../../../core/plan/cargar";
import { huella, jsonBonito } from "../../../core/formatos/huella";
import type { JsonValor } from "../../../core/formatos/jcs";

const DIR = "plans/demo-b";
const leer = (archivo: string) =>
  JSON.parse(readFileSync(`${DIR}/${archivo}`, "utf8")) as Record<
    string,
    JsonValor
  >;

describe("procedencia del plan B aprobado", () => {
  it("aprobar el borrador con la firma de v1.json reproduce v1.json", async () => {
    const v1 = leer("v1.json");
    const r = await aprobarPlan(leer("v0-borrador.json"), {
      por: String(v1.aprobado_por),
      el: String(v1.aprobado_el),
    });
    expect(r.ok, r.ok ? "" : JSON.stringify(r.motivos)).toBe(true);
    if (!r.ok) return;
    expect(r.plan.huella).toBe(v1.huella);
    expect(jsonBonito(r.plan as unknown as JsonValor)).toBe(
      readFileSync(`${DIR}/v1.json`, "utf8"),
    );
  });

  it("la revisión que el usuario leyó apunta a ese borrador y a esa transcripción", async () => {
    const c = leer("contradicciones.json") as {
      borrador: { archivo: string; huella_del_contenido: string };
      transcripcion: { archivo: string; huella: string };
    };
    expect(c.borrador.archivo).toBe("v0-borrador.json");
    expect(c.borrador.huella_del_contenido).toBe(
      await huella(leer("v0-borrador.json")),
    );
    expect(c.transcripcion.archivo).toBe("transcripcion.json");
    expect(c.transcripcion.huella).toBe(leer("transcripcion.json").huella);
  });
});
