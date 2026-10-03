/** Gate «diagrama = grafo»: verde sobre el demo A; rojo, con la falla nombrada, al quitar o inventar algo. */
import { describe, expect, it } from "vitest";
import { diagramaIgualGrafo } from "@core/visor/igualdad";
import type { Mapa } from "@core/visor/tipos";
import { CONTRATO, GRAFO, mapaDemo } from "./_demo";

const copia = (): Mapa => JSON.parse(JSON.stringify(mapaDemo())) as Mapa;

describe("diagrama = grafo", () => {
  it("el demo A: 8 de 8 nodos, 9 de 9 reglas, 0 fuera del contrato, 11 pares de aristas", () => {
    const c = diagramaIgualGrafo(mapaDemo(), GRAFO, CONTRATO);
    expect(c.fallas).toEqual([]);
    expect(c.ok).toBe(true);
    expect(c.nodos).toEqual({
      contrato: 8,
      enGrafo: 8,
      coinciden: 8,
      exigidosAusentes: [],
      fueraDelContrato: [],
    });
    expect(c.reglas).toEqual({
      contrato: 9,
      dibujadas: 9,
      exigidasAusentes: [],
    });
    expect(c.aristas).toEqual({ grafo: 13, dibujadas: 11 });
  });

  it("rojo si el dibujo pierde un nodo (la demo de la orden: guardia_salida fuera del mapa)", () => {
    const m = copia();
    m.nodos = m.nodos.filter((n) => n.id !== "guardia-salida");
    m.flujos = m.flujos.filter(
      (f) => f.origen !== "guardia-salida" && f.destino !== "guardia-salida",
    );
    const c = diagramaIgualGrafo(m, GRAFO, CONTRATO);
    expect(c.ok).toBe(false);
    expect(c.fallas).toEqual([
      "nodo del plan ausente del dibujo: guardia-salida",
      "nodo del grafo ausente del dibujo: guardia-salida",
      "arista del grafo sin flujo en el dibujo: redactor>guardia-salida",
    ]);
  });

  it("rojo si una regla cambia de umbral, se pierde, o aparece una que el plan no tiene", () => {
    const m = copia();
    m.flujos.find(
      (f) => f.id === "decision-a-pausa-humana-r1",
    )!.condicion!.valor = "U2";
    m.flujos = m.flujos.filter((f) => f.id !== "extractor-a-aclaracion-r1");
    m.flujos.push({
      ...m.flujos[0]!,
      id: "inventada",
      condicion: { senal: "x", operador: "=", valor: 1 },
    });
    const c = diagramaIgualGrafo(m, GRAFO, CONTRATO);
    expect(c.fallas).toEqual(
      expect.arrayContaining([
        "regla del plan sin su flujo en el dibujo: decision#1",
        "regla del plan sin su flujo en el dibujo: extractor#1",
        "flujo con una regla que el plan no declara: inventada",
        "flujo con una regla que el plan no declara: decision-a-pausa-humana-r1",
      ]),
    );
  });

  it("rojo si un nodo ausente del grafo no lleva la marca «exigido», o uno de más no lleva la suya", () => {
    const grafo = {
      ...GRAFO,
      nodos: GRAFO.nodos.filter((n) => n.id !== "aclaracion"),
      aristas: GRAFO.aristas.filter(
        (a) => a.source !== "aclaracion" && a.target !== "aclaracion",
      ),
    };
    const m = copia();
    m.flujos = m.flujos.filter(
      (f) => f.origen !== "aclaracion" && f.destino !== "aclaracion",
    );
    const c = diagramaIgualGrafo(m, grafo, CONTRATO);
    expect(c.fallas).toContain(
      "nodo exigido y ausente del grafo sin la marca «exigido»: aclaracion",
    );
    expect(c.reglas.exigidasAusentes).toEqual(["aclaracion#1", "extractor#1"]);

    const conExtra = {
      ...GRAFO,
      nodos: [...GRAFO.nodos, { id: "aprobar", tipo: "regla" }],
    };
    const m2 = copia();
    m2.nodos.push({ ...m2.nodos[0]!, id: "aprobar" });
    expect(diagramaIgualGrafo(m2, conExtra, CONTRATO).fallas).toEqual([
      "nodo fuera del contrato sin su marca: aprobar",
    ]);
  });

  it("rojo si el dibujo inventa un nodo o un flujo sin arista", () => {
    const m = copia();
    m.nodos.push({ ...m.nodos[0]!, id: "fantasma" });
    m.flujos.push({
      ...m.flujos.find((f) => f.modo_id === "secuencia")!,
      id: "atajo",
      origen: "enrutador",
      destino: "guardia-salida",
    });
    const c = diagramaIgualGrafo(m, GRAFO, CONTRATO);
    expect(c.fallas).toEqual([
      "nodo dibujado que no está ni en el plan ni en el grafo: fantasma",
      "flujo sin arista en el grafo: enrutador>guardia-salida",
    ]);
  });
});

describe("AU-S2-B49: orden, ramas por defecto y valores literales", () => {
  it("rojo si dos reglas cambian de orden (la precedencia es parte de la regla)", () => {
    const m = copia();
    const r1 = m.flujos.find((f) => f.id === "decision-a-pausa-humana-r1")!;
    const r2 = m.flujos.find((f) => f.id === "decision-a-pausa-humana-r2")!;
    [r1.condicion, r2.condicion] = [r2.condicion, r1.condicion];
    const c = diagramaIgualGrafo(m, GRAFO, CONTRATO);
    expect(c.fallas).toEqual(
      expect.arrayContaining([
        "regla del plan sin su flujo en el dibujo: decision#1",
        "regla del plan sin su flujo en el dibujo: decision#2",
      ]),
    );
  });

  it("rojo si se pierde un «si no» o aparece uno que el grafo no tiene", () => {
    const m = copia();
    m.flujos = m.flujos.filter((f) => f.id !== "decision-a-redactor-defecto");
    m.flujos.push({
      ...m.flujos.find((f) => f.id === "enrutador-a-extractor-defecto")!,
      id: "extractor-a-redactor-defecto",
      origen: "extractor",
      destino: "redactor",
    });
    const c = diagramaIgualGrafo(m, GRAFO, CONTRATO);
    expect(c.fallas).toEqual(
      expect.arrayContaining([
        "rama por defecto sin su flujo en el dibujo: decision-a-redactor-defecto",
        "flujo «si no» que el grafo no tiene: extractor-a-redactor-defecto",
      ]),
    );
  });

  it("un valor literal con forma de umbral no entra al mapa (se confundiría con la referencia)", async () => {
    const { valorDeCondicion } = await import("@core/visor/mapa");
    expect(valorDeCondicion("umbral.U1")).toBe("U1");
    expect(() => valorDeCondicion("U1")).toThrow(
      /se confundiría con el umbral U1/,
    );
    expect(valorDeCondicion("negar")).toBe("negar");
  });
});
