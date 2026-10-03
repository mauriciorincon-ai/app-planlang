/**
 * Conversor grafo compilado + contrato del plan → mapa 0.3.0 (ADR-010), sobre el grafo REAL de la corrida que
 * declara el manifiesto. Fase 1 de la validación del contrato: el mapa pasa el esquema JSON fijado (Ajv 2020).
 */
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { idDeCodigo, idDeMapa } from "@core/visor/ids";
import {
  FUERA_DEL_CONTRATO,
  SENAL_POR_DEFECTO,
  condicionDeRegla,
  construirMapa,
  terminales,
  valorDeCondicion,
} from "@core/visor/mapa";
import { CONTRATO, GRAFO, GRAMATICA, mapaDemo, textosDeRelleno } from "./_demo";

const esquema = JSON.parse(
  readFileSync(
    "packages/diagramador/contrato/esquema/mapa.schema.json",
    "utf8",
  ),
);

describe("mapa del demo A", () => {
  const mapa = mapaDemo();

  it("pasa el esquema del contrato 0.3.0 (fase 1)", () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const valida = ajv.compile(esquema);
    expect(valida(mapa), JSON.stringify(valida.errors)).toBe(true);
  });

  it("los 8 nodos del contrato, implementados, en la banda de su tipo", () => {
    expect(mapa.nodos.map((n) => n.id)).toEqual(
      CONTRATO.nodos_esperados.map((n) => idDeMapa(n.id)),
    );
    expect(mapa.nodos.every((n) => n.madurez === "implementado")).toBe(true);
    const banda = Object.fromEntries(mapa.nodos.map((n) => [n.id, n.banda_id]));
    expect(banda).toMatchObject({
      enrutador: "orquestacion",
      decision: "orquestacion",
      extractor: "agentes",
      "verificador-cobertura": "reglas",
      "guardia-salida": "reglas",
      "pausa-humana": "pausa-humana",
    });
  });

  it("un flujo por regla del plan, uno por rama por defecto y uno por arista incondicional", () => {
    const reglas = mapa.flujos.filter(
      (f) => f.condicion && f.condicion.senal !== SENAL_POR_DEFECTO,
    );
    const defectos = mapa.flujos.filter(
      (f) => f.condicion?.senal === SENAL_POR_DEFECTO,
    );
    expect(reglas).toHaveLength(CONTRATO.aristas_condicionales.length);
    expect(defectos.map((f) => `${f.origen}>${f.destino}`).sort()).toEqual([
      "aclaracion>extractor",
      "decision>redactor",
      "enrutador>extractor",
      "extractor>verificador-cobertura",
    ]);
    expect(
      mapa.flujos
        .filter((f) => f.modo_id === "secuencia")
        .map((f) => f.id)
        .sort(),
    ).toEqual([
      "redactor-a-guardia-salida",
      "verificador-cobertura-a-decision",
    ]);
    expect(
      mapa.flujos.filter((f) => f.modo_id === "reanudacion").map((f) => f.id),
    ).toEqual(["pausa-humana-a-redactor"]);
  });

  it("la condición es la tripleta del plan; la función nombrada va como `<función> = true`", () => {
    const porId = Object.fromEntries(
      mapa.flujos.map((f) => [f.id, f.condicion]),
    );
    expect(porId["decision-a-pausa-humana-r1"]).toEqual({
      senal: "senal-confianza",
      operador: "<",
      valor: "U1",
    });
    expect(porId["aclaracion-a-pausa-humana-r1"]).toEqual({
      senal: "ciclos-aclaracion",
      operador: ">=",
      valor: "U3",
    });
    expect(porId["extractor-a-aclaracion-r1"]).toEqual({
      senal: "campos-faltantes-count",
      operador: ">",
      valor: 0,
    });
    expect(porId["decision-a-pausa-humana-r5"]).toEqual({
      senal: "texas-y-no-aprobar",
      operador: "=",
      valor: true,
    });
  });

  it("los terminales salen del grafo: el inicio va al enrutador y la guardia llega al fin", () => {
    expect(terminales(GRAFO)).toEqual({
      inicio: ["enrutador"],
      fin: ["guardia-salida"],
    });
  });
});

describe("casos límite del conversor", () => {
  it("un nodo del plan que falta en el grafo queda «exigido por el plan»; uno de más, fuera del contrato", () => {
    const grafo = {
      ...GRAFO,
      nodos: [
        ...GRAFO.nodos.filter((n) => n.id !== "decision"),
        { id: "aprobar", tipo: "regla" },
      ],
      aristas: GRAFO.aristas.filter(
        (a) => a.source !== "decision" && a.target !== "decision",
      ),
      aristas_condicionales: GRAFO.aristas_condicionales.filter(
        (a) => a.desde !== "decision",
      ),
    };
    const mapa = mapaDemo(grafo);
    const n = Object.fromEntries(mapa.nodos.map((x) => [x.id, x]));
    expect(n.decision?.madurez).toBe("exigido-por-el-plan");
    expect(n.aprobar?.refs_externas).toEqual([FUERA_DEL_CONTRATO]);
    expect(
      mapa.flujos.some(
        (f) => f.origen === "decision" || f.destino === "decision",
      ),
    ).toBe(false);
  });

  it("falla con un tipo fuera de la gramática o sin los textos de un nodo", () => {
    const base = {
      gramatica: GRAMATICA,
      contrato: CONTRATO,
      sujeto_id: "demo-a",
      sujeto_nombre: { es: "x", en: "x" },
      version: "1.0.0",
      fecha: "2026-09-27",
    };
    expect(() =>
      construirMapa({
        ...base,
        grafo: { ...GRAFO, nodos: [{ id: "enrutador", tipo: "oraculo" }] },
        textos: textosDeRelleno(["enrutador"]),
      }),
    ).toThrow(/oraculo/);
    expect(() => construirMapa({ ...base, grafo: GRAFO, textos: {} })).toThrow(
      /textos del nodo/,
    );
  });

  it("valores y operadores", () => {
    expect(valorDeCondicion("umbral.U2")).toBe("U2");
    expect(valorDeCondicion(true)).toBe(true);
    expect(() => valorDeCondicion({ a: 1 })).toThrow(/no representable/);
    expect(
      condicionDeRegla({
        desde: "a",
        orden: 1,
        senal: "s",
        operador: "menor_que",
        valor: 1,
        inclusivo: true,
        si_verdadero: "b",
      }),
    ).toEqual({ senal: "s", operador: "<=", valor: 1 });
  });
});

describe("ids", () => {
  it("guion bajo ↔ guion, inyectivo, y rechaza lo que rompería la ida y vuelta", () => {
    for (const id of [
      ...GRAFO.nodos.map((n) => n.id),
      ...CONTRATO.senales_obligatorias_en_traza,
    ])
      expect(idDeCodigo(idDeMapa(id))).toBe(id);
    expect(() => idDeMapa("con-guion")).toThrow(/inyectiva/);
    expect(() => idDeMapa("Mayus")).toThrow(/id válido/);
  });
});
