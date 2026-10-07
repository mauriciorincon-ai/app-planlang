/**
 * Todo plan aprobado y versionado (`plans/<demo>/*.json`) lleva una huella que corresponde a su contenido. Sin esta
 * guarda, un plan editado a mano que conserva la huella vieja pasaba todas las pruebas: las de enmienda comparaban
 * huellas, no bytes (demo en rojo del S3, plan v1.5).
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verificarHuella } from "../../../core/formatos/huella";
import type { JsonValor } from "../../../core/formatos/jcs";

const planes = readdirSync("plans", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    readdirSync(`plans/${d.name}`)
      .filter((f) => f.endsWith(".json"))
      .map((f) => `plans/${d.name}/${f}`),
  )
  .sort();

describe("huellas de los planes versionados", () => {
  it("hay planes que revisar", () => {
    expect(planes.length).toBeGreaterThan(5);
  });

  it.each(planes)(
    "%s: si lleva huella, es la de su contenido",
    async (ruta) => {
      const plan = JSON.parse(readFileSync(ruta, "utf8")) as Record<
        string,
        JsonValor
      >;
      if (plan.huella === null || plan.huella === undefined) return;
      const v = await verificarHuella(plan);
      expect(v.ok, v.ok ? "" : v.motivo).toBe(true);
    },
  );
});
