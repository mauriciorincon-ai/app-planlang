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
import { conHuella } from "@core/formatos/huella";
import { cargarDemo, datosDemo } from "@/lib/datos/vitrina";

const copias: string[] = [];
function copia(): string {
  const dir = mkdtempSync(join(tmpdir(), "planlang-vitrina-"));
  copias.push(dir);
  const m = JSON.parse(readFileSync("data/vitrina/manifiesto.json", "utf8"));
  const d = m.demos["demo-a"];
  const c = JSON.parse(
    readFileSync(join(d.corrida.ruta, "corrida.json"), "utf8"),
  );
  for (const r of [
    "data/vitrina/manifiesto.json",
    "data/vitrina/demo-a/grafo-codigo.json",
    "data/plan-beneficios",
    "plans/demo-a",
    d.informe.archivo,
    d.corrida.ruta,
    c.casos.archivo,
  ])
    cpSync(r, join(dir, r), { recursive: true });
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
    expect(d.corrida.trazas).toHaveLength(20);
    expect(d.corrida.grafo.huella).toBe(d.corrida.manifiesto.version_grafo);
    expect(d.lote.casos).toHaveLength(20);
    expect(Object.keys(d.codigo.nodos)).toHaveLength(8);
    expect(d.planBeneficios.procedimientos).toHaveLength(40);
    expect(await datosDemo()).toBe(d);
  });

  it("un demo que el manifiesto no declara no existe", async () => {
    await expect(cargarDemo("demo-z")).rejects.toThrow(/no declara «demo-z»/);
  });

  it("AU-S2-19 · rojo: un segundo demo en el manifiesto se detiene con su nombre (las páginas no tienen [demo])", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    m.demos["demo-b"] = m.demos["demo-a"];
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /declara «demo-b», pero la vitrina solo pinta «demo-a»; un demo nuevo exige rutas por demo/,
    );
  });

  it("AU-S2-19 · rojo: una corrida sin plan de beneficios se nombra (antes, un TypeError sin nombre)", async () => {
    const dir = copia();
    const rutaM = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(rutaM, "utf8"));
    const ruta = join(dir, m.demos["demo-a"].corrida.ruta, "corrida.json");
    const c = JSON.parse(readFileSync(ruta, "utf8"));
    delete c.plan_beneficios;
    delete c.huella;
    // Una corrida bien sellada, solo que sin plan de beneficios (el manifiesto declara su huella nueva).
    const sellada = await conHuella(c);
    writeFileSync(ruta, JSON.stringify(sellada));
    m.demos["demo-a"].corrida.huella = sellada.huella;
    // El informe publicado es el de esa corrida (si no, el build se detiene antes, por el informe).
    const rutaI = join(dir, m.demos["demo-a"].informe.archivo);
    const inf = JSON.parse(readFileSync(rutaI, "utf8"));
    inf.ficha_reproducibilidad.corrida.huella = sellada.huella;
    delete inf.huella;
    const infSellado = await conHuella(inf);
    writeFileSync(rutaI, JSON.stringify(infSellado));
    m.demos["demo-a"].informe.huella = infSellado.huella;
    writeFileSync(rutaM, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /no declara su plan de beneficios/,
    );
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
      /informe\.json tiene la huella ca000282…, el manifiesto declara 00000000…/,
    );
  });

  it("rojo: una traza alterada no pasa el lector del verificador", async () => {
    const dir = copia();
    const m = JSON.parse(
      readFileSync(join(dir, "data/vitrina/manifiesto.json"), "utf8"),
    );
    const ruta = join(dir, m.demos["demo-a"].corrida.ruta, "trazas/A-004.json");
    const t = JSON.parse(readFileSync(ruta, "utf8"));
    t.senales.decision_final = "aprobar";
    writeFileSync(ruta, JSON.stringify(t));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(/A-004/);
  });

  it("rojo: el código por nodo sin su huella", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/demo-a/grafo-codigo.json");
    const c = JSON.parse(readFileSync(ruta, "utf8"));
    c.nodos.enrutador.hasta += 1;
    writeFileSync(ruta, JSON.stringify(c));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /grafo-codigo\.json no trae una huella válida/,
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
