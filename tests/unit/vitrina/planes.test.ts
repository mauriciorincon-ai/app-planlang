// @vitest-environment node
/**
 * Los planes sin corrida (S5): `plans/<id>/vN.json` que ningún demo de la vitrina corre, cargados con M1 y huella
 * verificada. Demo en rojo: una copia con un byte cambiado en el plan (huella vieja) detiene la carga nombrando el
 * archivo; una carpeta cuyo plan dice otro id también. Desde el S6 se lee la versión aprobada más alta (la v2 de
 * HackGuard), la v1 queda como historia, y de quién son las respuestas sale del archivo que la entrevista usó.
 */
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { planesSinCorrida, planSinCorrida } from "@/lib/datos/planes";

const copias: string[] = [];
function copia(): string {
  const dir = mkdtempSync(join(tmpdir(), "planlang-planes-"));
  copias.push(dir);
  mkdirSync(join(dir, "data/vitrina"), { recursive: true });
  cpSync(
    "data/vitrina/manifiesto.json",
    join(dir, "data/vitrina/manifiesto.json"),
  );
  cpSync("plans", join(dir, "plans"), { recursive: true });
  return dir;
}
afterAll(() => {
  for (const d of copias) rmSync(d, { recursive: true, force: true });
});

describe("planes sin corrida", () => {
  it("el repo tiene el plan de HackGuard, aprobado, y ninguno de los demos", async () => {
    const planes = await planesSinCorrida();
    expect(planes.map((p) => p.id)).toEqual(["hackguard-agentes"]);
    const p = planes[0]!;
    expect(p.plan.version).toBe("2.0.0");
    expect(p.plan.estado_aprobacion).toBe("aprobado");
    expect(p.plan.dominio_id).toBe("dom-seguridad-ia");
    expect(p.plan.huella).toMatch(/^[0-9a-f]{64}$/);
    expect((await planSinCorrida("hackguard-agentes")).plan.huella).toBe(
      p.plan.huella,
    );
    await expect(planSinCorrida("plan-demo-b")).rejects.toThrow(
      /no hay un plan sin corrida «plan-demo-b»/,
    );
  });

  it("la v2 declara que sus respuestas son del usuario, con la fecha de la entrevista y la de su revisión", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    expect(p.respuestas).toEqual({
      clase: "revisadas",
      entrevista: "2026-10-11",
      revision: { fecha: "2026-10-11", cambiadas: ["P03", "P08", "P09"] },
    });
  });

  it("la v1 queda como historia, con su huella y con respuestas delegadas al constructor", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    expect(p.anteriores).toHaveLength(1);
    const v1 = p.anteriores[0]!;
    expect(v1).toMatchObject({
      version: "1.0.0",
      huella:
        "bf05e61da1a27baca04d0dc07b6300cb8eb31531d44912ad3768f7598cc2ca60",
      aprobado_por: "Mauricio Rincón",
    });
    expect(v1.respuestas).toMatchObject({
      clase: "delegadas",
      entrevista: "2026-10-11",
      revision: null,
    });
    expect(p.plan.huella).not.toBe(v1.huella);
  });

  it("ROJO: un byte cambiado en el plan con la huella vieja detiene la carga nombrando el archivo", async () => {
    const dir = copia();
    const archivo = join(dir, "plans/hackguard-agentes/v1.json");
    const plan = JSON.parse(readFileSync(archivo, "utf8"));
    plan.problema.es += " ";
    writeFileSync(archivo, JSON.stringify(plan));
    await expect(planesSinCorrida(dir)).rejects.toThrow(
      /plans\/hackguard-agentes\/v1\.json no carga — \[HUELLA_AUSENTE\]/,
    );
  });

  it("ROJO: una carpeta cuyo plan dice otro id se detiene", async () => {
    const dir = copia();
    cpSync(join(dir, "plans/hackguard-agentes"), join(dir, "plans/otro-id"), {
      recursive: true,
    });
    await expect(planesSinCorrida(dir)).rejects.toThrow(
      /plans\/otro-id\/v1\.json es el plan «hackguard-agentes», pero su carpeta dice «plans\/otro-id»/,
    );
  });

  it("sin carpeta plans/ no hay planes; una carpeta sin vN.json tampoco", async () => {
    const vacio = mkdtempSync(join(tmpdir(), "planlang-planes-vacio-"));
    copias.push(vacio);
    expect(await planesSinCorrida(vacio)).toEqual([]);
    const dir = copia();
    mkdirSync(join(dir, "plans/sin-plan"));
    writeFileSync(join(dir, "plans/sin-plan/notas.json"), "{}");
    expect((await planesSinCorrida(dir)).map((p) => p.id)).toEqual([
      "hackguard-agentes",
    ]);
  });

  describe("de quién son las respuestas sale del archivo, y si no se entiende se detiene", () => {
    const V2 = "plans/hackguard-agentes/v2";

    it("sin archivo de respuestas, el plan carga y dice que no hay registro", async () => {
      const dir = copia();
      rmSync(join(dir, V2, "respuestas-revisadas.json"));
      const p = await planSinCorrida("hackguard-agentes", dir);
      expect(p.respuestas).toBeNull();
      expect(p.anteriores[0]?.respuestas?.clase).toBe("delegadas");
    });

    it("ROJO: un archivo respuestas-*.json de otro nombre detiene el build nombrándolo", async () => {
      const dir = copia();
      rmSync(join(dir, V2, "respuestas-revisadas.json"));
      writeFileSync(join(dir, V2, "respuestas-del-jefe.json"), "{}");
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /v2\/respuestas-del-jefe\.json: no sé de quién son estas respuestas/,
      );
    });

    it("ROJO: dos archivos de respuestas en la misma versión detienen el build", async () => {
      const dir = copia();
      writeFileSync(join(dir, V2, "respuestas-por-delegacion.json"), "{}");
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /guarda 2 archivos de respuestas/,
      );
    });

    it("ROJO: unas respuestas revisadas sin su _origen no se dan por revisadas", async () => {
      const dir = copia();
      const f = join(dir, V2, "respuestas-revisadas.json");
      const r = JSON.parse(readFileSync(f, "utf8"));
      delete r._origen;
      writeFileSync(f, JSON.stringify(r));
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /respuestas-revisadas\.json no trae su _origen/,
      );
    });

    it("ROJO: unas respuestas sin transcripción no dicen cuándo fue la entrevista", async () => {
      const dir = copia();
      rmSync(join(dir, V2, "transcripcion.json"));
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /sin plans\/hackguard-agentes\/v2\/transcripcion\.json/,
      );
    });
  });

  describe("S6 · auditoría: las respuestas se cruzan con la transcripción y los errores nombran el archivo", () => {
    const V2 = "plans/hackguard-agentes/v2";

    it("ROJO: una respuesta alterada en el archivo revisado no coincide con la transcripción y la vitrina no la publica", async () => {
      const dir = copia();
      const f = join(dir, V2, "respuestas-revisadas.json");
      const r = JSON.parse(readFileSync(f, "utf8"));
      r.P06 = `${r.P06} (alterada)`;
      writeFileSync(f, JSON.stringify(r));
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /respuestas-revisadas\.json no coincide con plans\/hackguard-agentes\/v2\/transcripcion\.json en P06/,
      );
    });

    it("ROJO: un transcripcion.json roto nombra su archivo", async () => {
      const dir = copia();
      writeFileSync(join(dir, V2, "transcripcion.json"), "{ roto");
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /plans\/hackguard-agentes\/v2\/transcripcion\.json no es JSON válido/,
      );
    });

    it("ROJO: un archivo de respuestas roto nombra su archivo", async () => {
      const dir = copia();
      writeFileSync(join(dir, V2, "respuestas-revisadas.json"), "{ roto");
      await expect(planesSinCorrida(dir)).rejects.toThrow(
        /v2\/respuestas-revisadas\.json no es JSON válido/,
      );
    });
  });
});

describe("S7 · lote del hito: un plan sin aprobar no se publica y lo que cambió sale de la comparación", () => {
  const V2 = "plans/hackguard-agentes/v2";

  it("ROJO: un vN.json sin aprobar (borrador, sin huella) detiene el build nombrando el archivo", async () => {
    const dir = copia();
    cpSync(
      join(dir, V2, "v0-borrador.json"),
      join(dir, "plans/hackguard-agentes/v2.json"),
    );
    await expect(planesSinCorrida(dir)).rejects.toThrow(
      /plans\/hackguard-agentes\/v2\.json no carga — \[HUELLA_AUSENTE\] huella: El plan está en borrador/,
    );
  });

  it("ROJO: si _origen.cambiadas no coincide con lo que cambió frente a la versión anterior, se detiene", async () => {
    const dir = copia();
    const f = join(dir, V2, "respuestas-revisadas.json");
    const r = JSON.parse(readFileSync(f, "utf8"));
    r._origen.cambiadas = ["P03", "P08"];
    writeFileSync(f, JSON.stringify(r));
    await expect(planesSinCorrida(dir)).rejects.toThrow(
      /_origen\.cambiadas dice «P03, P08», pero frente a plans\/hackguard-agentes\/respuestas-por-delegacion\.json cambió «P03, P08, P09»/,
    );
  });

  it("ROJO: unas respuestas revisadas sin las de la versión anterior no dicen qué cambió y se detienen", async () => {
    const dir = copia();
    rmSync(join(dir, "plans/hackguard-agentes/respuestas-por-delegacion.json"));
    await expect(planesSinCorrida(dir)).rejects.toThrow(
      /son respuestas revisadas, pero el repo no guarda las de la versión anterior/,
    );
  });

  it("lo que cambió sale de la comparación aunque el archivo diga otra cosa en orden: el orden no importa", async () => {
    const dir = copia();
    const f = join(dir, V2, "respuestas-revisadas.json");
    const r = JSON.parse(readFileSync(f, "utf8"));
    r._origen.cambiadas = ["P09", "P03", "P08"];
    writeFileSync(f, JSON.stringify(r));
    const p = await planSinCorrida("hackguard-agentes", dir);
    expect(p.respuestas?.revision?.cambiadas).toEqual(["P03", "P08", "P09"]);
  });
});
