// Gate de la paleta de la Etapa de Diseño (regla dura 13 + regla de desarrollo 5-b).
// Cuatro cosas, en este orden:
//   1. Sin deriva: tokens.json y tokens.css son exactamente lo que el generador produce hoy.
//   2. Contraste: todo trazo cromático ≥ 3:1 sobre sup-1, sup-2 y su tinte; tinta-1 y tinta-2 ≥ 4,5:1
//      sobre fondo, superficies y tintes, en los dos temas (cromo neutro desde la ronda 2 de la mirada 1).
//   3. Tintas VETADAS como texto: `tinta-3` y `linea` NO alcanzan 4,5:1 (si llegaran, el veto sobraría),
//      pero `tinta-3` sí pasa 3:1 (sirve para guías gráficas).
//   4. Distancia entre los 8 cromáticos bajo las 7 vistas de daltonismo ≥ umbral declarado.
// Nació en ROJO (ver docs/diseno/README.md § gates) forzando un naranja sin contraste en claro.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contraste } from "../../scripts/paleta/color.mjs";
import {
  aCss,
  generar,
  RUTA_CSS,
  RUTA_JSON,
  UMBRALES,
} from "../../scripts/paleta/generar-tokens.mjs";

const tokens = generar();
const TEMAS = ["oscuro", "claro"] as const;
const CROMOS = ["neutro"] as const;

describe("diseno-tokens · sin deriva entre generador y archivos", () => {
  it("tokens.json es lo que el generador produce", () => {
    expect(JSON.parse(readFileSync(RUTA_JSON, "utf8"))).toEqual(tokens);
  });
  it("tokens.css es lo que el generador produce", () => {
    expect(readFileSync(RUTA_CSS, "utf8")).toBe(aCss(tokens));
  });
});

describe.each(TEMAS)("diseno-tokens · contraste en tema %s", (tema) => {
  const t = tokens.temas[tema];
  it.each(CROMOS)(
    "trazos cromáticos ≥ 3:1 sobre superficies y tinte (cromo %s)",
    (cromo) => {
      const n = t.neutros[cromo];
      for (const [token, v] of Object.entries(t.cromaticos)) {
        expect(
          contraste(v.hex, n["sup-1"]),
          `${token} sobre sup-1`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contraste(v.hex, n["sup-2"]),
          `${token} sobre sup-2`,
        ).toBeGreaterThanOrEqual(3);
        expect(
          contraste(v.hex, t.tintes[cromo][token]),
          `${token} sobre su tinte`,
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );
  it.each(CROMOS)(
    "tinta-1 y tinta-2 ≥ 4,5:1 sobre fondo, superficies y tintes (cromo %s)",
    (cromo) => {
      const n = t.neutros[cromo];
      const fondos = [
        n.fondo,
        n["sup-1"],
        n["sup-2"],
        ...Object.values(t.tintes[cromo]),
      ];
      for (const tinta of ["tinta-1", "tinta-2"]) {
        for (const f of fondos)
          expect(
            contraste(n[tinta], f),
            `${tinta} sobre ${f}`,
          ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
  it.each(CROMOS)(
    "tinta-3 y linea están VETADAS como texto y tinta-3 sirve de guía (cromo %s)",
    (cromo) => {
      const n = t.neutros[cromo];
      expect(contraste(n["tinta-3"], n.fondo)).toBeLessThan(4.5);
      expect(contraste(n["tinta-3"], n.fondo)).toBeGreaterThanOrEqual(3);
      expect(contraste(n.linea, n.fondo)).toBeLessThan(4.5);
    },
  );
});

describe.each(TEMAS)(
  "diseno-tokens · distancia entre cromáticos bajo daltonismo en tema %s",
  (tema) => {
    for (const [vista, m] of Object.entries(tokens.medidas[tema])) {
      const umbral = m.umbral;
      if (umbral === null) continue;
      it(`${vista}: peor par ${m.peor_par?.join(" ~ ")} ≥ ${umbral}`, () => {
        expect(m.distancia).toBeGreaterThanOrEqual(umbral);
      });
    }
    it("los umbrales declarados son los de la casa", () => {
      expect(UMBRALES).toEqual({ normal: 0.1, 0.6: 0.06, 1.0: 0.03 });
    });
  },
);
