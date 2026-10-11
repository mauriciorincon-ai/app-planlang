// @vitest-environment node
/**
 * Los planes sin corrida (S5): `plans/<id>/vN.json` que ningún demo de la vitrina corre, cargados con M1 y huella
 * verificada. Demo en rojo: una copia con un byte cambiado en el plan (huella vieja) detiene la carga nombrando el
 * archivo; una carpeta cuyo plan dice otro id también.
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
    expect(p.archivo).toBe("plans/hackguard-agentes/v1.json");
    expect(p.plan.estado_aprobacion).toBe("aprobado");
    expect(p.plan.dominio_id).toBe("dom-seguridad-ia");
    expect(p.huella).toMatch(/^[0-9a-f]{64}$/);
    expect((await planSinCorrida("hackguard-agentes")).huella).toBe(p.huella);
    await expect(planSinCorrida("plan-demo-b")).rejects.toThrow(
      /no hay un plan sin corrida «plan-demo-b»/,
    );
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
});
