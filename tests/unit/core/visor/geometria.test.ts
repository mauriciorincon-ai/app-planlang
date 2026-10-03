/**
 * Geometría del lienzo sobre el grafo real: disposición en serpiente, D11 (ningún tramo atraviesa una caja
 * ajena), etiquetas sin encimarse, independencia del idioma y determinismo.
 */
import { describe, expect, it } from "vitest";
import {
  geometria,
  textoDeRegla,
  type Geometria,
} from "@core/visor/geometria";
import type { Punto, Rect } from "@core/visor/ruteo";
import {
  GRAMATICA,
  LIMITE_RUTEO,
  OPCIONES,
  geometriaDemo,
  mapaDemo,
} from "./_demo";

const geo = geometriaDemo();

function corta([x1, y1]: Punto, [x2, y2]: Punto, r: Rect): boolean {
  const a = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(x2 - x1),
    h: Math.abs(y2 - y1),
  };
  return (
    a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y
  );
}
const solapan = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

describe("disposición", () => {
  it("columnas de la gramática con el paso de la maqueta (172 u) y lienzo de 1040 u", () => {
    expect(geo.ancho).toBe(1040);
    expect(geo.bandas.map((b) => [b.id, b.x])).toEqual([
      ["entrada", 10],
      ["orquestacion", 182],
      ["agentes", 354],
      ["reglas", 526],
      ["pausa-humana", 698],
      ["salida", 870],
    ]);
  });

  it("serpiente: el camino principal en las filas 0 y 2, lo demás en la intermedia", () => {
    const celda = Object.fromEntries(
      geo.nodos.map((n) => [n.id, [n.fila, n.columna]]),
    );
    expect(celda).toEqual({
      enrutador: [0, 1],
      extractor: [0, 2],
      "verificador-cobertura": [0, 3],
      aclaracion: [1, 2],
      "pausa-humana": [1, 4],
      decision: [2, 1],
      redactor: [2, 2],
      "guardia-salida": [2, 3],
    });
  });

  it("una línea por par con reglas agrupadas, más los dos terminales: 13, como las aristas de LangGraph", () => {
    expect(geo.lineas).toHaveLength(13);
    expect(
      geo.lineas.find((l) => l.id === "l-decision-a-pausa-humana")?.reglas,
    ).toBe(5);
    expect(
      geo.lineas.find((l) => l.id === "l-enrutador-a-redactor")?.reglas,
    ).toBe(2);
  });
});

describe("dibujo sin encimar", () => {
  it("D11: ningún tramo atraviesa una caja que no es su origen ni su destino", () => {
    expect(geo.avisos).toEqual([]);
    const cajas = new Map<string, Rect>(geo.nodos.map((n) => [n.id, n.caja]));
    for (const t of geo.terminales)
      cajas.set(t.id, { x: t.cx - t.r, y: t.cy - t.r, w: 2 * t.r, h: 2 * t.r });
    for (const l of geo.lineas)
      for (let i = 1; i < l.puntos.length; i++)
        for (const [id, r] of cajas)
          if (id !== l.origen && id !== l.destino)
            expect(
              corta(l.puntos[i - 1]!, l.puntos[i]!, r),
              `${l.id} × ${id}`,
            ).toBe(false);
  });

  it("cada etiqueta dentro del lienzo, bajo la cabecera, fuera de las cajas y sin tocar otra etiqueta", () => {
    const etiquetas = geo.lineas.flatMap((l) =>
      l.etiqueta ? [l.etiqueta.caja] : [],
    );
    expect(etiquetas.length).toBe(9);
    for (const e of etiquetas) {
      expect(
        e.x >= 0 &&
          e.x + e.w <= geo.ancho &&
          e.y >= geo.cabecera &&
          e.y + e.h <= geo.alto,
      ).toBe(true);
      for (const n of geo.nodos) expect(solapan(e, n.caja)).toBe(false);
    }
    for (let i = 0; i < etiquetas.length; i++)
      for (let j = i + 1; j < etiquetas.length; j++)
        expect(solapan(etiquetas[i]!, etiquetas[j]!)).toBe(false);
  });

  it("un solo cruce en todo el lienzo, dibujado con salto", () => {
    expect(
      geo.lineas.flatMap((l) => l.saltos.map((s) => `${l.id}@${s.x}`)),
    ).toEqual(["l-guardia-salida-a-fin@805"]);
  });
});

describe("determinismo e idioma", () => {
  // Las cajas, trazados y etiquetas, sin el texto de cada idioma.
  const sinTexto = (g: Geometria) =>
    JSON.stringify(g, (k, v) => (k === "lineas" ? undefined : v));

  it("dos corridas dan la misma geometría", { timeout: LIMITE_RUTEO }, () => {
    const otra = geometria(mapaDemo(), GRAMATICA, OPCIONES);
    expect(JSON.stringify(otra)).toBe(JSON.stringify(geo));
  });

  it(
    "la geometría no depende del orden ni de la lista de idiomas",
    { timeout: LIMITE_RUTEO },
    () => {
      const g2 = geometria(mapaDemo(), GRAMATICA, {
        ...OPCIONES,
        idiomas: ["en", "es"],
      });
      expect(sinTexto(g2)).toBe(sinTexto(geo));
    },
  );
});

describe("texto de una regla", () => {
  it("el valor numérico lleva coma en español y punto en inglés; lo demás, tal cual", () => {
    const c = { senal: "senal_confianza", operador: "<", valor: 0.75 } as const;
    expect(textoDeRegla(c, "es")).toBe("senal_confianza < 0,75");
    expect(textoDeRegla(c, "en")).toBe("senal_confianza < 0.75");
    expect(
      textoDeRegla({ senal: "tipo_atencion", operador: "=", valor: "urgencia" }, "es"),
    ).toBe("tipo_atencion = urgencia");
  });
});
