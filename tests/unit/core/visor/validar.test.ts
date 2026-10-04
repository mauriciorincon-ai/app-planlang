/**
 * Validación en código (contrato 0.5.0 § 7, fase 2) con carnadas: cada una debe fallar POR SU REGLA y con su id
 * (C18 densidad · C19 cobertura · C20 condición · C21 idioma, las de referencias y, desde el 0.5.0, V4 autoflujo,
 * V5 recorridos, V12 bifurcación y V17 dos ramas por defecto). Con las excepciones nombradas de planlang (V5 por
 * `papel`, V7 como alerta), el mapa real solo deja la alerta V7.
 */
import { describe, expect, it } from "vitest";
import {
  EXCEPCIONES_PLANLANG,
  erroresDe,
  validarMapa,
} from "@core/visor/validar";
import type { Mapa } from "@core/visor/tipos";
import { GRAMATICA, mapaDemo } from "./_demo";

// JSON y no structuredClone: este conserva los objetos compartidos (los textos de relleno son uno solo).
const copia = (): Mapa => JSON.parse(JSON.stringify(mapaDemo())) as Mapa;
const op = { cobertura: "letra" as const, excepciones: EXCEPCIONES_PLANLANG };
/** Los errores (sin la alerta V7 declarada), como `regla:id`. */
const reglas = (m: Mapa) =>
  erroresDe(validarMapa(m, GRAMATICA, op)).map((e) => `${e.regla}:${e.id}`);

describe("validación del mapa", () => {
  it("el mapa real del demo A solo deja la alerta V7 declarada, con sus recorridos", () => {
    const m = mapaDemo();
    expect(m.recorridos.length).toBeGreaterThan(1);
    const informe = validarMapa(m, GRAMATICA, op);
    expect(informe.map((e) => [e.regla, e.id, !!e.alerta])).toEqual([
      ["V7", "demo-a", true],
    ]);
    expect(informe[0]!.mensaje).toContain("desviación 6 del S3");
  });

  it("sin las excepciones nombradas, V7 es error y los recorridos no empiezan ni terminan donde dice la gramática (V5)", () => {
    const sin = erroresDe(validarMapa(mapaDemo(), GRAMATICA)).map(
      (e) => e.regla,
    );
    expect(sin).toContain("V7");
    expect(sin).toContain("V5");
  });

  it("V4: un flujo de un nodo hacia sí mismo", () => {
    const m = copia();
    m.flujos[0]!.destino = m.flujos[0]!.origen;
    expect(reglas(m)).toContain(`V4:${m.flujos[0]!.id}`);
  });

  it("V17: dos ramas por defecto desde el mismo origen", () => {
    const m = copia();
    const d = m.flujos.find((f) => f.id.endsWith("-defecto"))!;
    m.flujos.push({ ...d, id: `${d.id}-2` });
    expect(reglas(m)).toEqual([`V17:${d.origen}`]);
  });

  it("V5: un paso que sigue a uno posterior, y uno sin flujo que lo una al anterior", () => {
    const m = copia();
    const rec = m.recorridos[0]!;
    rec.pasos[1]!.sigue_de = rec.pasos[2]!.id;
    expect(reglas(m)).toEqual([`V5:${rec.pasos[1]!.id}`]);
    const m2 = copia();
    const r2 = m2.recorridos[0]!;
    r2.pasos.splice(1, 1);
    expect(reglas(m2)).toContain(`V5:${r2.pasos[1]!.id}`);
  });

  it("V5: un recorrido que empieza o termina lejos del inicio y el fin (con la excepción de papel)", () => {
    const m = copia();
    const rec = m.recorridos[0]!;
    rec.pasos.pop();
    expect(reglas(m)).toEqual([`V5:${rec.id}`]);
    const m2 = copia();
    const r2 = m2.recorridos[0]!;
    r2.pasos.shift();
    delete r2.pasos[0]!.sigue_de;
    expect(reglas(m2)).toEqual([`V5:${r2.id}`]);
  });

  it("V12: una bifurcación que no declara su tipo, y una declarada que no existe", () => {
    const m = copia();
    const rec = m.recorridos[0]!;
    rec.pasos.push({
      ...rec.pasos[2]!,
      id: "rama",
      sigue_de: rec.pasos[1]!.id,
    });
    expect(reglas(m)).toEqual([`V12:${rec.pasos[1]!.id}`]);
    const m2 = copia();
    m2.recorridos[0]!.pasos[0]!.bifurca = "paralela";
    expect(reglas(m2)).toEqual([`V12:${m2.recorridos[0]!.pasos[0]!.id}`]);
  });

  it("C20 · V13: un flujo condicional sin condición", () => {
    const m = copia();
    delete m.flujos.find((f) => f.id === "decision-a-pausa-humana-r1")!
      .condicion;
    expect(reglas(m)).toEqual(["V13:decision-a-pausa-humana-r1"]);
  });

  it("C21 · V14: un texto sin uno de los idiomas", () => {
    const m = copia();
    delete (m.nodos[0]!.lider as Partial<Record<string, string>>).en;
    expect(reglas(m)).toEqual(["V14:enrutador"]);
  });

  it("C19 · V15: un carácter fuera de la tabla de métricas", () => {
    const m = copia();
    m.nodos[1]!.nombre = { es: "extractor ✓", en: "extractor" };
    const informe = erroresDe(validarMapa(m, GRAMATICA, op));
    expect(informe.map((e) => [e.regla, e.id, e.idioma])).toEqual([
      ["V15", "extractor", "es"],
    ]);
  });

  it("C18 · V11: más nodos en una banda que el límite de la gramática", () => {
    const m = copia();
    const base = m.nodos.find((n) => n.id === "extractor")!;
    for (let k = 0; k < GRAMATICA.limites.nodos_por_banda_max; k++)
      m.nodos.push({ ...base, id: `extra-${k}` });
    expect(reglas(m)).toEqual(["V11:agentes"]);
  });

  it("V2 · V4 · V6 · V3: referencias, flujos colgados, ids repetidos y fuentes sin https", () => {
    const m = copia();
    // Sin recorridos: desviar un flujo deja sin unión a los pasos que lo recorren (V5, secundario legítimo).
    m.recorridos = [];
    m.nodos[0]!.banda_id = "inventada";
    m.flujos[0]!.destino = "fantasma";
    m.flujos[1]!.id = m.flujos[2]!.id;
    const { titulo, fecha } = m.nodos[2]!.fuentes[0]!;
    m.nodos[2]!.fuentes = [
      { tipo: "tercero", url: "http://sin-tls", titulo, fecha },
    ];
    expect(reglas(m).sort()).toEqual(
      [
        "V2:enrutador",
        "V4:aclaracion-a-extractor-defecto",
        "V6:" + m.flujos[2]!.id,
        "V3:aclaracion",
      ].sort(),
    );
  });

  it("V10 es alerta, no error: un líder con más frases que el límite", () => {
    const m = copia();
    m.nodos[0]!.lider = { es: "Una. Dos. Tres.", en: "One. Two. Three." };
    const informe = validarMapa(m, GRAMATICA, op);
    expect(informe.map((e) => e.regla)).toEqual(["V7", "V10", "V10"]);
    expect(erroresDe(informe)).toEqual([]);
  });

  it("el informe va ordenado por (doc, ruta, regla)", () => {
    const m = copia();
    m.flujos[3]!.modo_id = "telepatia";
    m.nodos[0]!.tipo_id = "oraculo";
    const rutas = validarMapa(m, GRAMATICA).map((e) => e.ruta);
    expect(rutas).toEqual([...rutas].sort());
  });
});
