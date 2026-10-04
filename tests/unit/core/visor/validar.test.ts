/**
 * Validación en código (contrato § 7, fase 2) con carnadas: cada una debe fallar POR SU REGLA y con su id
 * (C18 densidad · C19 cobertura · C20 condición · C21 idioma, y las de referencias). El mapa real: cero.
 */
import { describe, expect, it } from "vitest";
import { erroresDe, validarMapa } from "@core/visor/validar";
import type { Mapa } from "@core/visor/tipos";
import { GRAMATICA, mapaDemo } from "./_demo";

// JSON y no structuredClone: este conserva los objetos compartidos (los textos de relleno son uno solo).
const copia = (): Mapa => JSON.parse(JSON.stringify(mapaDemo())) as Mapa;
const reglas = (m: Mapa) =>
  validarMapa(m, GRAMATICA, { cobertura: "letra" }).map(
    (e) => `${e.regla}:${e.id}`,
  );

describe("validación del mapa", () => {
  it("el mapa real del demo A no tiene errores ni alertas", () => {
    expect(validarMapa(mapaDemo(), GRAMATICA, { cobertura: "letra" })).toEqual(
      [],
    );
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
    const informe = validarMapa(m, GRAMATICA, { cobertura: "letra" });
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
    m.nodos[0]!.banda_id = "inventada";
    m.flujos[0]!.destino = "fantasma";
    m.flujos[1]!.id = m.flujos[2]!.id;
    m.nodos[2]!.fuentes = [
      { ...m.nodos[2]!.fuentes[0]!, url: "http://sin-tls" },
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
    const informe = validarMapa(m, GRAMATICA);
    expect(informe.map((e) => e.regla)).toEqual(["V10", "V10"]);
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
