// @vitest-environment node
/**
 * La comparación de dos corridas (S4) contra el disco: el golden del par chico, la carnada de dos lotes distintos, y que
 * la comparación publicada del A sale de sus corridas y dice lo mismo que el informe de su supuesto S3.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compararCorridas } from "@core/comparar";
import { jsonBonito } from "@core/formatos/huella";
import { entradaDesdeDisco } from "../../scripts/_corridas";

const A = "runs/demo-a/suscripcion-planlang-a-002-200-v1.5";
const PUBLICADA = "data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5";
const leer = (ruta: string) => JSON.parse(readFileSync(ruta, "utf8"));

describe("comparación de dos corridas", () => {
  it("el par chico produce el golden byte a byte", async () => {
    const cmp = await compararCorridas(
      entradaDesdeDisco("runs/demo-a/suscripcion-planlang-a-001-20", {
        base: "runs/demo-a/suscripcion-planlang-a-001-20-base",
      }),
    );
    expect(jsonBonito(cmp as never)).toBe(
      readFileSync("tests/golden/comparar/comparacion.json", "utf8"),
    );
  });

  it("carnada: dos lotes distintos no se comparan (la entrada se rechaza con nombre)", async () => {
    await expect(
      compararCorridas(
        entradaDesdeDisco("runs/demo-a/suscripcion-planlang-a-001-20", {
          base: `${A}-base`,
        }),
      ),
    ).rejects.toThrow();
  });

  it("la comparación publicada del A se regenera byte a byte desde sus corridas", async () => {
    const cmp = await compararCorridas(
      entradaDesdeDisco(A, {
        base: `${A}-base`,
        plan: "plans/demo-a/v1.5.2.json",
      }),
    );
    expect(jsonBonito(cmp as never)).toBe(
      readFileSync(`${PUBLICADA}/comparacion.json`, "utf8"),
    );
  });

  it("dice lo mismo que el informe de su supuesto S3: exactitud, latencia, presupuesto y casos", () => {
    const cmp = leer(`${PUBLICADA}/comparacion.json`);
    const s3 = leer(`${PUBLICADA}/informe.json`).supuestos.find(
      (s: { id: string }) => s.id === "S3",
    ).comparacion;
    expect(cmp.lados.multiagente.exactitud).toBe(s3.exactitud.multiagente);
    expect(cmp.lados.agente_unico.exactitud).toBe(s3.exactitud.agente_unico);
    expect(cmp.lados.multiagente.latencia_mediana_s).toBe(
      s3.latencia_mediana_s.multiagente,
    );
    expect(cmp.lados.agente_unico.latencia_mediana_s).toBe(
      s3.latencia_mediana_s.agente_unico,
    );
    expect(cmp.lados.multiagente.presupuesto).toEqual(
      s3.presupuesto.multiagente,
    );
    expect(cmp.lados.agente_unico.presupuesto).toEqual(
      s3.presupuesto.agente_unico,
    );
    expect(cmp.casos_que_difieren.map((c: { id: string }) => c.id)).toEqual(
      s3.casos_distintos,
    );
  });
});
