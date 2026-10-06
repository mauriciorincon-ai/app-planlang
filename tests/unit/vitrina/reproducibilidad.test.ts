/**
 * La ficha de reproducibilidad (P4 § 9 y P7) en sus variantes, no solo la de la corrida publicada: una corrida de
 * agente único por un proveedor con clave, sin línea base, con los umbrales movidos y con el mismo plan con que corrió.
 * Y una variante que el vocabulario no conoce se detiene nombrándola (AU-S2-16).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { filasDeReproducibilidad } from "@/lib/vista/reproducibilidad";

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});

function otra(
  cambiar: (f: DatosDemo["informe"]["ficha_reproducibilidad"]) => void,
) {
  const informe = structuredClone(d.informe);
  cambiar(informe.ficha_reproducibilidad);
  return { ...d, informe };
}

describe("ficha de reproducibilidad", () => {
  it("la publicada: plan con que corrió, línea base y umbrales del plan; P7 suma el entorno", () => {
    const brecha = filasDeReproducibilidad(d, "es", "brecha");
    const fichas = filasDeReproducibilidad(d, "es", "fichas");
    expect(fichas.length).toBe(brecha.length + 1);
    expect(fichas.map((f) => f.v).join(" ")).toContain("Python");
  });

  it("otra corrida: agente único, por clave, sin línea base, umbrales movidos, mismo plan", () => {
    const x = otra((f) => {
      f.corrida.variante = "agente_unico";
      (f.corrida as { proveedor: string }).proveedor = "groq";
      f.linea_base = null;
      f.corrida.plan_de_ejecucion.huella = f.plan.huella;
      const [k] = Object.keys(f.umbrales_aplicados);
      f.umbrales_aplicados = { ...f.umbrales_aplicados, [k!]: 0.5 };
    });
    const filas = filasDeReproducibilidad(x, "en", "brecha");
    const texto = filas.map((f) => `${f.k}: ${f.v}`).join("\n");
    expect(texto).toContain("single agent");
    expect(texto).toContain("groq");
    // La publicada (S3) ya corrió con el plan que la mide: solo se va la fila de la línea base.
    expect(filas.length).toBe(
      filasDeReproducibilidad(d, "en", "brecha").length - 1,
    );
  });

  it("una corrida hecha con otro plan que el que la mide suma la fila del plan con que corrió", () => {
    const x = otra((f) => {
      f.corrida.plan_de_ejecucion = {
        ...f.corrida.plan_de_ejecucion,
        huella: "0".repeat(64),
        version: "1.4.0",
      };
    });
    expect(filasDeReproducibilidad(x, "es", "brecha").length).toBe(
      filasDeReproducibilidad(d, "es", "brecha").length + 1,
    );
  });

  it("una variante sin nombre detiene el build", () => {
    const x = otra((f) => {
      f.corrida.variante = "enjambre" as typeof f.corrida.variante;
    });
    expect(() => filasDeReproducibilidad(x, "es", "brecha")).toThrow(
      "«enjambre» no tiene su entrada en VARIANTE",
    );
  });
});

describe("cómo se generó el lote (AU-S3-28)", () => {
  it("la fila Generador dice receta, versión y casos por tipo, en los dos idiomas y los dos demos", async () => {
    const fila = (x: DatosDemo, i: "es" | "en") =>
      filasDeReproducibilidad(x, i, "brecha").find((f) =>
        ["Generador", "Generator"].includes(f.k),
      )!.v;
    expect(fila(d, "es")).toBe(
      "receta estandar · versión 1.1.0 · adversario 20 · borde 30 · faltante 30 · normal 120",
    );
    expect(fila(d, "en")).toBe(
      "recipe estandar · version 1.1.0 · adversarial 20 · edge case 30 · missing data 30 · normal 120",
    );
    const b = await datosDemo("demo-b");
    expect(fila(b, "es")).toBe(
      "receta estandar · versión 1.0.0 · adversario 2 · borde 3 · faltante 3 · normal 12",
    );
  });
});
