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
import {
  cargarDemo,
  datosDemo,
  esElPlanDeBeneficiosDeLaCorrida,
} from "@/lib/datos/vitrina";

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
    "data/vitrina/demo-a/spike-2026-09-26",
    "data/plan-beneficios",
    "plans/demo-a",
    d.informe.archivo,
    d.corrida.ruta,
    c.casos.archivo,
    ...[...d.repeticiones, d.linea_base].map((x: { ruta: string }) =>
      join(x.ruta, "corrida.json"),
    ),
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

  it("AU-S2-19 · rojo: un demo del manifiesto que la vitrina no sabe pintar se detiene con su nombre (ADR-014)", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    m.demos["demo-c"] = m.demos["demo-a"];
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /declara «demo-c», que la vitrina no sabe pintar \(demo-a, demo-b\); un demo nuevo exige sus rutas/,
    );
  });

  it("AU-S2-19 · rojo: una corrida sin su mundo (el plan de beneficios del A) se nombra (antes, un TypeError sin nombre)", async () => {
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
    // Desde el S3 la corrida cita un solo mundo (plan de beneficios o listas): el lector la rechaza por esquema y lo
    // dice con su nombre, antes de que la vitrina la pinte.
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /ESQUEMA .*la corrida cita un solo mundo: plan de beneficios \(A\) o listas \(B\)/,
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

  it("AU-S2-P-7 · rojo: una repetición regenerada no coincide con la huella del manifiesto", async () => {
    const dir = copia();
    const m = JSON.parse(
      readFileSync(join(dir, "data/vitrina/manifiesto.json"), "utf8"),
    );
    const r2 = join(
      dir,
      m.demos["demo-a"].repeticiones[0].ruta,
      "corrida.json",
    );
    const cj = JSON.parse(readFileSync(r2, "utf8"));
    writeFileSync(
      r2,
      JSON.stringify(await conHuella({ ...cj, fecha: "2026-09-30" })),
    );
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /v1\.2-r2\/corrida\.json tiene la huella [0-9a-f]{8}…, el manifiesto declara 0f5257d5…/,
    );
  });

  it("AU-S2-P-7 · rojo: la línea base del manifiesto no es la que midió el informe", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    // Otra corrida con su huella válida (la r2 como si fuera la base): el informe midió otra.
    m.demos["demo-a"].linea_base = m.demos["demo-a"].repeticiones[0];
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /la línea base que declara el manifiesto de «demo-a» no es la que midió su informe/,
    );
  });

  it("AU-S2-P-7 · rojo: una repetición de menos en el manifiesto", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    m.demos["demo-a"].repeticiones.pop();
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /las repeticiones que declara el manifiesto de «demo-a» no son las que midió su informe/,
    );
  });

  it("AU-S2-P-8 · rojo: la lectura del spike es de otra fecha que la del manifiesto", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/manifiesto.json");
    const m = JSON.parse(readFileSync(ruta, "utf8"));
    m.demos["demo-a"].spike.fecha = "2026-09-25";
    writeFileSync(ruta, JSON.stringify(m));
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /la lectura del spike es del 2026-09-26 y el manifiesto declara el spike del 2026-09-25/,
    );
  });

  it("AU-S2-P-9 · rojo: el código por nodo es de otro demo", async () => {
    const dir = copia();
    const ruta = join(dir, "data/vitrina/demo-a/grafo-codigo.json");
    const c = JSON.parse(readFileSync(ruta, "utf8"));
    delete c.huella;
    writeFileSync(
      ruta,
      JSON.stringify(await conHuella({ ...c, demo_id: "demo-b" })),
    );
    await expect(cargarDemo("demo-a", dir)).rejects.toThrow(
      /grafo-codigo\.json es el código del demo «demo-b», no el de «demo-a»/,
    );
  });

  it("AU-S2-P-10 · rojo: el plan de beneficios no es el que nombra la corrida", () => {
    const ref = {
      archivo: "data/plan-beneficios/demo-a.json",
      id: "pb-demo-a",
      version: "1.0.0",
    };
    expect(() =>
      esElPlanDeBeneficiosDeLaCorrida(
        ref,
        { id: "pb-demo-a", version: "9.9.9" },
        "demo-a",
      ),
    ).toThrow(
      "corrió con el plan de beneficios version «1.0.0» y data/plan-beneficios/demo-a.json trae «9.9.9»",
    );
    expect(() =>
      esElPlanDeBeneficiosDeLaCorrida(
        ref,
        { id: "pb-otro", version: "1.0.0" },
        "demo-a",
      ),
    ).toThrow("plan de beneficios id «pb-demo-a»");
    // Sin id ni versión en la corrida, solo la huella la ata.
    esElPlanDeBeneficiosDeLaCorrida(
      { archivo: ref.archivo },
      { id: "x", version: "y" },
      "demo-a",
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
