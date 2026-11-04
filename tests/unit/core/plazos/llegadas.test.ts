/**
 * Las llegadas simuladas (S9, ADR-019): sorteadas con `sfc32` desde la semilla del lote, una por caso, dentro de los
 * días hábiles y la jornada del plan. Cada caso sortea con su propia semilla: añadir casos no mueve a los demás.
 */
import { describe, expect, it } from "vitest";
import {
  llegadaDe,
  llegadasDelLote,
  problemasDeLaCapa,
} from "../../../../core/plazos";

const LOTE = { id: "lote-x", huella: "h".repeat(64), semilla: "semilla-x" };
const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => `C-${String(i + 1).padStart(3, "0")}`);
const entrada = (n: number) => ({
  lote: LOTE,
  ids: ids(n),
  dias_habiles: 5,
  minutos_de_jornada: 540,
});

describe("llegadasDelLote", () => {
  it("da la misma capa cada vez, con una llegada por caso en el orden del lote", () => {
    const a = llegadasDelLote(entrada(50));
    expect(llegadasDelLote(entrada(50))).toEqual(a);
    expect(a.formato).toBe("planlang-llegadas/v1");
    expect(a.llegadas.map((l) => l.caso_id)).toEqual(ids(50));
  });

  it("cada llegada cae en un día hábil y dentro de la jornada, y se reparten en todos los días", () => {
    const { llegadas } = llegadasDelLote(entrada(200));
    for (const l of llegadas) {
      expect(Number.isInteger(l.dia) && l.dia >= 0 && l.dia <= 4).toBe(true);
      expect(
        Number.isInteger(l.minuto) && l.minuto >= 0 && l.minuto < 540,
      ).toBe(true);
    }
    expect(new Set(llegadas.map((l) => l.dia)).size).toBe(5);
  });

  it("otra semilla da otras llegadas", () => {
    const a = llegadasDelLote(entrada(30)).llegadas;
    const b = llegadasDelLote({
      ...entrada(30),
      lote: { ...LOTE, semilla: "otra" },
    }).llegadas;
    expect(b).not.toEqual(a);
  });

  it("añadir casos al lote no mueve las llegadas de los que ya estaban", () => {
    const corta = llegadasDelLote(entrada(20)).llegadas;
    const larga = llegadasDelLote(entrada(80)).llegadas;
    expect(larga.slice(0, 20)).toEqual(corta);
    expect(llegadaDe("semilla-x", "C-007", 5, 540)).toEqual(corta[6]);
  });

  it("rechaza días o jornada que no pueden sortearse", () => {
    expect(() => llegadasDelLote({ ...entrada(3), dias_habiles: 0 })).toThrow(
      /dias_habiles/,
    );
    expect(() =>
      llegadasDelLote({ ...entrada(3), minutos_de_jornada: 0 }),
    ).toThrow(/minutos_de_jornada/);
  });
});

describe("problemasDeLaCapa", () => {
  const capa = llegadasDelLote(entrada(10));

  it("una capa que sirve al lote y al plan no tiene problemas", () => {
    expect(problemasDeLaCapa(capa, ids(10), 5, 540)).toEqual([]);
  });

  it("dice qué falla: días o jornada distintos de los del plan, un caso sin llegada o repetido, una hora fuera de la jornada", () => {
    expect(problemasDeLaCapa(capa, ids(10), 4, 540).join()).toContain(
      "5 días hábiles",
    );
    expect(problemasDeLaCapa(capa, ids(10), 5, 480).join()).toContain(
      "jornada de 540",
    );
    expect(problemasDeLaCapa(capa, ids(11), 5, 540)).toEqual([
      "el caso C-011 no tiene llegada",
    ]);
    expect(
      problemasDeLaCapa(
        { ...capa, llegadas: [...capa.llegadas, capa.llegadas[0]!] },
        ids(10),
        5,
        540,
      ),
    ).toEqual(["el caso C-001 llega dos veces"]);
    const mala = {
      ...capa,
      llegadas: capa.llegadas.map((l, i) =>
        i === 0 ? { ...l, dia: 5, minuto: 540 } : l,
      ),
    };
    expect(problemasDeLaCapa(mala, ids(10), 5, 540)).toHaveLength(2);
    expect(
      problemasDeLaCapa(
        {
          ...capa,
          llegadas: [...capa.llegadas, { caso_id: "X", dia: 0, minuto: 0 }],
        },
        ids(10),
        5,
        540,
      ),
    ).toEqual(["la llegada de X no es de ningún caso del lote"]);
  });
});
