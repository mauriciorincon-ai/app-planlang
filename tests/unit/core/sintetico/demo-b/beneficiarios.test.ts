/**
 * Los beneficiarios finales (S9, ADR-019; 31 CFR § 1010.230(d)): la participación efectiva es exacta (centésimas
 * enteras y fracciones en BigInt), el 25 % es inclusivo y lo que no cierra no se adivina. Los mismos casos, con el
 * agente en Python, los vigila el gate de contrato (`tests/contrato/beneficiarios.test.ts`).
 */
import { describe, expect, it } from "vitest";
import {
  beneficiariosDe,
  centesimas,
  type EstructuraLeida,
} from "../../../../../core/sintetico/demo-b/beneficiarios";

const S = "SYN-NIT-100000";
const E1 = "SYN-NIT-200000";
const E2 = "SYN-NIT-300000";
const P = (n: number) => `SYN-ID-${String(n).padStart(6, "0")}`;

function estructura(
  participaciones: [string, string, string][],
  personas: number,
  controla: number | null = null,
  entidades: string[] = [S, E1, E2],
): EstructuraLeida {
  return {
    entidad: S,
    entidades: entidades.map((nit) => ({ nit, nombre: `Sociedad ${nit}` })),
    personas: Array.from({ length: personas }, (_, i) => ({
      documento: P(i + 1),
      nombre: `Persona ${i + 1}`,
    })),
    participaciones: participaciones.map(
      ([titular, participada, porcentaje]) => ({
        titular,
        participada,
        porcentaje,
      }),
    ),
    controla:
      controla === null ? null : { documento: P(controla), rol: "presidente" },
  };
}

const efectiva = (r: ReturnType<typeof beneficiariosDe>, n: number) =>
  r.participaciones.find((x) => x.documento === P(n))?.porcentaje;

describe("centesimas", () => {
  it("lee un porcentaje con dos decimales a lo sumo, sin coma flotante", () => {
    expect(centesimas("60")).toBe(BigInt(6000));
    expect(centesimas("33.33")).toBe(BigInt(3333));
    expect(centesimas("0.5")).toBe(BigInt(50));
    expect(centesimas("100.00")).toBe(BigInt(10000));
    for (const malo of ["33.333", "101", "-5", "60,5", "abc", "", "1e2"])
      expect(centesimas(malo), malo).toBeNull();
  });
});

describe("beneficiariosDe", () => {
  it("socios directos: los que llegan al 25 % y quien controla, por documento", () => {
    const r = beneficiariosDe(
      estructura(
        [
          [P(1), S, "60.00"],
          [P(2), S, "30.00"],
          [P(3), S, "10.00"],
        ],
        4,
        4,
      ),
    );
    expect(r.valida).toBe(true);
    expect(r.por_participacion).toEqual([P(1), P(2)]);
    expect(r.beneficiarios).toEqual([P(1), P(2), P(4)]);
    expect(efectiva(r, 3)).toBe("10.00");
    expect(efectiva(r, 4)).toBe("0.00");
  });

  it("la participación indirecta multiplica cada eslabón: 60 % de un 50 % es un 30 %", () => {
    const r = beneficiariosDe(
      estructura(
        [
          [E1, S, "50.00"],
          [P(3), S, "50.00"],
          [P(1), E1, "60.00"],
          [P(2), E1, "40.00"],
        ],
        3,
      ),
    );
    expect([efectiva(r, 1), efectiva(r, 2), efectiva(r, 3)]).toEqual([
      "30.00",
      "20.00",
      "50.00",
    ]);
    expect(r.beneficiarios).toEqual([P(1), P(3)]);
  });

  it("el 25 % es inclusivo y se compara sobre la fracción exacta: 25,00 % entra, 24,99 % no", () => {
    const exacta = beneficiariosDe(
      estructura(
        [
          [P(1), S, "10.00"],
          [P(2), S, "60.00"],
          [E1, S, "30.00"],
          [P(1), E1, "50.00"],
          [P(3), E1, "50.00"],
        ],
        3,
      ),
    );
    expect(efectiva(exacta, 1)).toBe("25.00");
    expect(exacta.por_participacion).toContain(P(1));
    const bajo = beneficiariosDe(
      estructura(
        [
          [E1, S, "49.98"],
          [P(3), S, "50.02"],
          [P(1), E1, "50.00"],
          [P(2), E1, "50.00"],
        ],
        3,
      ),
    );
    expect(efectiva(bajo, 1)).toBe("24.99");
    expect(bajo.por_participacion).toEqual([P(3)]);
  });

  it("no decide sobre el redondeo: 24,995 % se lee 25,00 y aun así no llega", () => {
    // 49,99 % × 50,00 % = 24,995 %: con dos decimales se muestra 25,00, pero la fracción queda bajo 1/4.
    const r = beneficiariosDe(
      estructura(
        [
          [E1, S, "49.99"],
          [P(2), S, "50.01"],
          [P(1), E1, "50.00"],
        ],
        2,
      ),
    );
    expect(efectiva(r, 1)).toBe("25.00");
    expect(r.por_participacion).toEqual([P(2)]);
  });

  it("suma los caminos que llegan a la misma persona: 12 % + 14 % = 26 %", () => {
    const r = beneficiariosDe(
      estructura(
        [
          [E1, S, "40.00"],
          [E2, S, "40.00"],
          [P(2), S, "20.00"],
          [P(1), E1, "30.00"],
          [P(3), E1, "70.00"],
          [P(1), E2, "35.00"],
          [P(4), E2, "65.00"],
        ],
        4,
      ),
    );
    expect(efectiva(r, 1)).toBe("26.00");
    expect(r.por_participacion).toEqual([P(1), P(3), P(4)]);
  });

  it("recorre una cadena de cuatro niveles", () => {
    const r = beneficiariosDe(
      estructura(
        [
          [E1, S, "80.00"],
          [P(2), S, "20.00"],
          [E2, E1, "75.00"],
          [P(4), E1, "25.00"],
          [P(1), E2, "60.00"],
          [P(3), E2, "40.00"],
        ],
        4,
      ),
    );
    expect([1, 2, 3, 4].map((n) => efectiva(r, n))).toEqual([
      "36.00",
      "20.00",
      "24.00",
      "20.00",
    ]);
    expect(r.por_participacion).toEqual([P(1)]);
    // La fracción exacta: 0,8 × 0,75 × 0,6 = 9/25.
    expect(r.participaciones[0]).toMatchObject({ num: "9", den: "25" });
  });

  it("sin nadie sobre el 25 %, el beneficiario es solo quien controla; sin quien controle, nadie", () => {
    const cinco: [string, string, string][] = [1, 2, 3, 4, 5].map((n) => [
      P(n),
      S,
      "20.00",
    ]);
    expect(beneficiariosDe(estructura(cinco, 6, 6)).beneficiarios).toEqual([
      P(6),
    ]);
    const sinControl = beneficiariosDe(estructura(cinco, 5));
    expect(sinControl.valida).toBe(true);
    expect(sinControl.beneficiarios).toEqual([]);
    expect(sinControl.controla).toBeNull();
  });

  it("lo que no cierra no se adivina: ciclo, suma sobre 100 %, porcentaje mal escrito o alguien que no está", () => {
    const ciclo = beneficiariosDe(
      estructura(
        [
          [E1, S, "50.00"],
          [E2, E1, "50.00"],
          [E1, E2, "50.00"],
        ],
        1,
      ),
    );
    expect(ciclo).toMatchObject({
      valida: false,
      beneficiarios: null,
      participaciones: [],
    });
    expect(ciclo.problemas).toEqual([`ciclo:${E1}`]);
    expect(
      beneficiariosDe(
        estructura(
          [
            [P(1), S, "60.00"],
            [P(2), S, "50.00"],
          ],
          2,
        ),
      ).problemas,
    ).toEqual([`suma_sobre_100:${S}`]);
    expect(
      beneficiariosDe(estructura([[P(1), S, "33.333"]], 1)).problemas,
    ).toEqual([`porcentaje_invalido:${P(1)}>${S}`]);
    expect(beneficiariosDe(estructura([[P(1), S, "0"]], 1)).problemas).toEqual([
      `porcentaje_invalido:${P(1)}>${S}`,
    ]);
    expect(
      beneficiariosDe(estructura([[P(9), S, "50"]], 1, 8)).problemas,
    ).toEqual([`referencia_rota:${P(9)}`, `referencia_rota:${P(8)}`]);
    expect(
      beneficiariosDe({ ...estructura([[P(1), S, "50"]], 1), entidad: null })
        .problemas,
    ).toEqual(["sin_entidad"]);
    expect(
      beneficiariosDe(estructura([[P(1), S, "50"]], 1, null, [S, S])).problemas,
    ).toEqual([`id_repetido:${S}`]);
  });

  it("muestra la participación con dos decimales, a la mitad hacia arriba", () => {
    const r = beneficiariosDe(
      estructura(
        [
          [E1, S, "100"],
          [P(1), E1, "33.33"],
          [P(2), E1, "66.67"],
        ],
        2,
      ),
    );
    expect([efectiva(r, 1), efectiva(r, 2)]).toEqual(["33.33", "66.67"]);
  });
});
