/**
 * Gate de contrato de la garantía (S8, regla 19; ADR-018): Python con `fractions` (`garantia_fracciones.py`) es el
 * oráculo; el núcleo (`core/brecha/garantia.ts`) tiene que dar lo mismo al bit, en Node y en jsdom (y en los tres
 * motores, `tests/e2e/garantia.paridad.spec.ts`). Las entradas son las muestras de S1 de la corrida publicada y casos
 * chicos que fuerzan cada borde (`scripts/garantia-contrato.ts`). Regenerar, en este orden:
 * `npx tsx scripts/garantia-contrato.ts` y `python3 tests/contrato/garantia_fracciones.py --escribir`.
 *
 * Demos en rojo (cierre del S8): la cola con `Math.pow` (la caza G2), un umbral aceptado después de un rechazo (la
 * secuencia fija) y el conformal sin el «+ 1».
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  colaBinomial,
  garantiaDeCalibracion,
  type EntradaDeGarantia,
  type GarantiaDeCalibracion,
} from "../../core/brecha/garantia";
import {
  ARCHIVO_ENTRADAS,
  entradasDelContrato,
  FORMATO_ENTRADAS,
} from "../../scripts/garantia-contrato";

const entradas = JSON.parse(readFileSync(ARCHIVO_ENTRADAS, "utf8")) as {
  formato: string;
  casos: { nombre: string; entrada: EntradaDeGarantia }[];
};
const esperada = JSON.parse(
  readFileSync("tests/contrato/garantia-esperada.json", "utf8"),
) as {
  formato: string;
  casos: {
    nombre: string;
    garantia: GarantiaDeCalibracion | null;
    colas: { n: number; e: number; alfa: string; p: string }[];
  }[];
};
const caso = (nombre: string) =>
  entradas.casos.find((c) => c.nombre === nombre)!.entrada;
const calcular = (e: EntradaDeGarantia) =>
  JSON.parse(JSON.stringify(garantiaDeCalibracion(e))) as GarantiaDeCalibracion;
const nivel = (g: GarantiaDeCalibracion, alfa: number) =>
  g.niveles.find((n) => n.alfa === alfa)!;

describe("contrato de la garantía Python → TS", () => {
  it("los dos archivos son el formato esperado y traen los mismos casos, con cada borde", () => {
    expect(entradas.formato).toBe(FORMATO_ENTRADAS);
    expect(esperada.formato).toBe("planlang-contrato-garantia/v1");
    const nombres = entradas.casos.map((c) => c.nombre);
    expect(esperada.casos.map((c) => c.nombre)).toEqual(nombres);
    for (const n of [
      "publicada-demo-a",
      "pocos-casos",
      "conformal-justo",
      "secuencia-rota",
      "tasa-sobre-alfa",
      "conformal-bajo-el-umbral",
      "etapas-a-medias",
      "operador-sin-garantia",
    ])
      expect(nombres).toContain(n);
  });

  it("las entradas siguen siendo las de hoy: las muestras de S1 de la corrida publicada y los casos a mano", async () => {
    expect(await entradasDelContrato()).toBe(
      readFileSync(ARCHIVO_ENTRADAS, "utf8"),
    );
  });

  it("en la corrida publicada, la etapa del extractor es el acierto de S1, caso por caso", () => {
    const e = caso("publicada-demo-a");
    expect(e.muestras.length).toBe(159);
    for (const m of e.muestras) expect(m.etapas.extractor, m.caso_id).toBe(m.correcto);
  });

  it.each(esperada.casos.map((c) => [c.nombre, c] as const))(
    "da la misma garantía que Python: %s",
    (nombre, c) => {
      expect(calcular(caso(nombre))).toEqual(c.garantia);
    },
  );

  it.each(esperada.casos.map((c) => [c.nombre, c] as const))(
    "cada cola binomial es la misma fracción que la de Python: %s",
    (_nombre, c) => {
      for (const x of c.colas) {
        const [num, den] = x.alfa.split("/").map(Number) as [number, number];
        const p = colaBinomial(x.n, x.e, { num, den });
        expect(`${p.num}/${p.den}`, `${x.n} ${x.e} ${x.alfa}`).toBe(x.p);
      }
    },
  );
});

describe("los bordes que la corrida publicada no toca", () => {
  it("secuencia fija: tras el primer rechazo no se acepta nada, aunque un umbral más bajo respaldaría", () => {
    const n = nivel(calcular(caso("secuencia-rota")), 0.1);
    expect(n.umbral_con_garantia.umbral).toBe(0.9);
    expect(n.umbral_con_garantia.pruebas.map((p) => p.umbral)).toEqual([
      0.9, 0.7,
    ]);
    // 0,5 respaldaría por sí solo (10 errores en 270): la secuencia no llega a probarlo.
    const solo = calcular({ ...caso("secuencia-rota"), rejilla: [0.5] });
    expect(nivel(solo, 0.1).umbral_con_garantia.umbral).toBe(0.5);
  });

  it("el conformal lleva el «+ 1»: con 19 aciertos y α = 0,05 hay cota", () => {
    const c = nivel(calcular(caso("conformal-justo")), 0.05).conformal;
    expect(c).toMatchObject({ n_aciertos: 19, indice: 1, umbral: 0.95 });
    expect(c.aciertos_minimos).toBe(19);
  });

  it("sin umbral con garantía, dice por qué y cuántos casos harían falta", () => {
    const pocos = nivel(calcular(caso("pocos-casos")), 0.1);
    expect(pocos.umbral_con_garantia.faltan).toMatchObject({
      motivo: "pocos_casos",
      aceptados: 8,
      casos: 22,
    });
    expect(pocos.sin_zona).toBe("sin_umbral_con_garantia");
    expect(
      nivel(calcular(caso("tasa-sobre-alfa")), 0.2).umbral_con_garantia.faltan,
    ).toMatchObject({ motivo: "tasa_sobre_alfa", casos: null });
  });

  it("el conformal por debajo del umbral con garantía deja sin zona", () => {
    const n = nivel(calcular(caso("conformal-bajo-el-umbral")), 0.1);
    expect(n.umbral_con_garantia.umbral).toBe(0.7);
    expect(n.conformal.umbral).toBe(0.55);
    expect(n.zona).toBeNull();
    expect(n.sin_zona).toBe("conformal_bajo_el_umbral");
  });

  it("la conjunta solo cuenta las etapas medidas, sobre los casos con todas medidas", () => {
    const g = calcular(caso("etapas-a-medias"));
    expect(g.etapas.map((e) => [e.nodo, e.observada, e.casos])).toEqual([
      ["extractor", true, 82],
      ["aclaracion", true, 81],
      ["vacia", false, 0],
      ["redactor", false, 0],
    ]);
    expect(nivel(g, 0.1).conjunta).toMatchObject({
      k: 2,
      nodos: ["extractor", "aclaracion"],
      casos: 81,
      alfa_por_etapa: 0.05,
      delta_por_etapa: 0.05,
    });
  });

  it("una arista que escala por confianza alta no tiene garantía", () => {
    expect(garantiaDeCalibracion(caso("operador-sin-garantia"))).toBeNull();
    expect(
      garantiaDeCalibracion({ ...caso("pocos-casos"), rejilla: [] }),
    ).toBeNull();
  });

  it("el orden de las muestras no cambia el resultado", () => {
    const e = caso("publicada-demo-a");
    expect(calcular({ ...e, muestras: [...e.muestras].reverse() })).toEqual(
      calcular(e),
    );
  });
});
