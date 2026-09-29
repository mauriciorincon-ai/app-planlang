// @vitest-environment node
/**
 * La capa de datos de la vitrina (ADR-008): lee lo que declara el manifiesto y verifica cada huella al
 * compilar. Demo en rojo: una copia del repo con un byte de más en el plan o una huella cambiada en el
 * manifiesto hace fallar la carga nombrando el archivo.
 */
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { cargarDemo, datosDemo } from "@/lib/datos/vitrina";

const copias: string[] = [];
function copia(): string {
  const dir = mkdtempSync(join(tmpdir(), "planlang-vitrina-"));
  copias.push(dir);
  const m = JSON.parse(readFileSync("data/vitrina/manifiesto.json", "utf8"));
  const d = m.demos["demo-a"];
  for (const r of [
    "data/vitrina/manifiesto.json",
    d.plan.archivo,
    d.informe.archivo,
    join(d.corrida.ruta, "corrida.json"),
    join(d.corrida.ruta, "entorno.json"),
  ])
    cpSync(r, join(dir, r));
  return dir;
}
afterAll(() => {
  for (const d of copias) rmSync(d, { recursive: true, force: true });
});

describe("datos de la vitrina", () => {
  it("carga el demo A con plan, informe y entorno verificados, y lo memoriza", async () => {
    const d = await datosDemo();
    expect(d.plan.version).toBe("1.3.0");
    expect(d.informe.ficha_reproducibilidad.plan.version).toBe("1.3.0");
    expect(d.manifiesto.corrida.sprint).toBe(1);
    expect(d.entorno.paquetes.langgraph).toMatch(/^1\.2\./);
    expect(await datosDemo()).toBe(d);
  });

  it("un demo que el manifiesto no declara no existe", async () => {
    await expect(cargarDemo("demo-z")).rejects.toThrow(/no declara «demo-z»/);
  });

  it("rojo: el plan alterado no coincide con su huella", async () => {
    const dir = copia();
    const ruta = join(dir, "plans/demo-a/v1.3.json");
    const plan = JSON.parse(readFileSync(ruta, "utf8"));
    plan.nombre = { es: "otro", en: "other" };
    writeFileSync(ruta, JSON.stringify(plan));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /plans\/demo-a\/v1\.3\.json no trae una huella válida \(no_coincide\)/,
    );
  });

  it("rojo: el manifiesto declara otra huella para el informe", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    m.demos["demo-a"].informe.huella = "0".repeat(64);
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /informe\.json tiene la huella 70c1cb23…, el manifiesto declara 00000000…/,
    );
  });

  it("rojo: el informe no es el de la corrida declarada", async () => {
    const dir = copia();
    const m = JSON.parse(
      readFileSync(join(dir, "data/vitrina/manifiesto.json"), "utf8"),
    );
    const corrida = m.demos["demo-a"].corrida.ruta;
    // Otra corrida con huella propia válida: la del informe deja de coincidir.
    const cj = JSON.parse(
      readFileSync(join(dir, corrida, "corrida.json"), "utf8"),
    );
    const { conHuella } = await import("@core/formatos/huella");
    const otra = await conHuella({ ...cj, fecha: "2026-09-30" });
    writeFileSync(join(dir, corrida, "corrida.json"), JSON.stringify(otra));
    m.demos["demo-a"].corrida.huella = otra.huella;
    writeFileSync(join(dir, "data/vitrina/manifiesto.json"), JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /no es el de la corrida que declara el manifiesto/,
    );
  });
});
