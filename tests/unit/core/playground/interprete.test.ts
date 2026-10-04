/**
 * Semántica del intérprete TypeScript de aristas: la misma tabla que `agents/tests/test_reglas_arista.py`
 * (empates señal = umbral con `inclusivo` verdadero y falso, igualdad estricta de tipo, errores).
 */
import { describe, expect, it } from "vitest";
import type { DecisionDeArista } from "../../../../core/formatos/traza";
import type { AristaCondicional } from "../../../../core/plan/esquema";
import {
  compararCadenas,
  comparar,
  decidir,
  ErrorArista,
  evaluarArista,
  recalcular,
  resolverValor,
  senalesDeVisita,
} from "../../../../core/playground/interprete";

describe("comparar — operadores y empates", () => {
  it.each([
    ["menor_que", 0.75, 0.75, false, false],
    ["menor_que", 0.75, 0.75, true, true],
    ["menor_que", 0.7, 0.75, false, true],
    ["mayor_que", 1000, 1000, false, false],
    ["mayor_que", 1000, 1000, true, true],
    ["mayor_que", 1001, 1000, false, true],
    ["menor_o_igual_que", 2, 2, false, true],
    ["menor_o_igual_que", 3, 2, true, false],
    ["mayor_o_igual_que", 2, 2, true, true],
    ["mayor_o_igual_que", 1, 2, false, false],
  ] as const)("%s(%s, %s, inclusivo=%s) = %s", (op, a, b, inc, esperado) => {
    expect(comparar(a, op, b, inc)).toBe(esperado);
  });

  it("igual_a / distinto_de son estrictos de tipo e ignoran inclusivo", () => {
    expect(comparar(true, "igual_a", true, false)).toBe(true);
    expect(comparar(1, "igual_a", true, true)).toBe(false);
    expect(comparar("negar", "distinto_de", "negar", true)).toBe(false);
    expect(comparar(null, "igual_a", null, false)).toBe(true);
    expect(comparar(null, "igual_a", "x", false)).toBe(false);
    expect(comparar({ a: 1 }, "igual_a", { a: 1 }, false)).toBe(true);
    expect(comparar([1, 2], "distinto_de", [1, 2], false)).toBe(false);
  });

  it("ordenar algo que no es número es error, no false", () => {
    expect(() => comparar("a", "mayor_que", 1, false)).toThrow(/exige números/);
    expect(() => comparar(true, "menor_que", 1, false)).toThrow(ErrorArista);
    expect(() => comparar(null, "mayor_que", "x", false)).toThrow(ErrorArista);
  });

  it("una señal nula no cumple ninguna comparación de orden (AU-9: no se observó)", () => {
    for (const op of [
      "menor_que",
      "mayor_que",
      "menor_o_igual_que",
      "mayor_o_igual_que",
    ] as const) {
      expect(comparar(null, op, 0, false)).toBe(false);
      expect(comparar(null, op, 0.75, true)).toBe(false);
    }
  });

  it("ni de igualdad: con señal nula, «distinto de» también es falso (AU-S2-B51, igual que Python)", () => {
    expect(comparar(null, "distinto_de", "urgencia", false)).toBe(false);
    expect(comparar(null, "igual_a", "urgencia", false)).toBe(false);
  });

  it("un operador desconocido falla con nombre, aun con señal nula (AU-S2-B52, igual que Python)", () => {
    const op = "parecido_a" as unknown as Parameters<typeof comparar>[1];
    expect(() => comparar(0.5, op, 0.75, false)).toThrow(
      "operador desconocido: parecido_a",
    );
    expect(() => comparar(null, op, 0.75, false)).toThrow(ErrorArista);
  });
});

const tripleta = (
  orden: number,
  senal: string,
  operador: "menor_que" | "igual_a",
  valor: string | number | boolean,
  si: string,
): AristaCondicional => ({
  desde: "decision",
  orden,
  senal,
  operador,
  valor,
  inclusivo: false,
  si_verdadero: si,
});
const texas: AristaCondicional = {
  desde: "decision",
  orden: 3,
  funcion: {
    nombre: "texas_y_no_aprobar",
    entradas: ["modo_texas", "propuesta"],
  },
  si_verdadero: "pausa_humana",
};

describe("evaluarArista / decidir", () => {
  const aristas = [
    tripleta(2, "propuesta", "igual_a", "negar", "pausa_humana"),
    tripleta(1, "senal_confianza", "menor_que", "umbral.U1", "pausa_humana"),
    texas,
  ];

  it("resuelve umbral.Ux con los umbrales aplicados y falla si no existe", () => {
    expect(resolverValor("umbral.U1", { U1: 0.75 })).toBe(0.75);
    expect(resolverValor("urgencia", {})).toBe("urgencia");
    expect(() => resolverValor("umbral.U9", { U1: 0.75 })).toThrow(
      /umbral desconocido/,
    );
  });

  it("evalúa todas en orden; la primera verdadera gana; si ninguna, la de defecto", () => {
    const s = { senal_confianza: 0.9, propuesta: "negar", modo_texas: false };
    const r = decidir(aristas, "redactor", s, { U1: 0.75 });
    expect(r.rama).toBe("pausa_humana");
    expect(r.registros.map((x) => [x.orden_arista, x.resultado])).toEqual([
      [1, false],
      [2, true],
      [3, false],
    ]);
    expect(
      decidir(aristas, "redactor", { ...s, propuesta: "aprobar" }, { U1: 0.75 })
        .rama,
    ).toBe("redactor");
  });

  it("la función nombrada registra sus entradas; modo Texas solo con propuesta distinta de aprobar", () => {
    const r = evaluarArista(texas, { modo_texas: true, propuesta: null }, {});
    expect(r).toMatchObject({
      tipo: "funcion",
      funcion: "texas_y_no_aprobar",
      entradas: { modo_texas: true, propuesta: null },
      resultado: true,
    });
    expect(
      evaluarArista(texas, { modo_texas: true, propuesta: "aprobar" }, {})
        .resultado,
    ).toBe(false);
    expect(
      evaluarArista(texas, { modo_texas: false, propuesta: "negar" }, {})
        .resultado,
    ).toBe(false);
  });

  it("señal ausente y función no registrada son errores", () => {
    expect(() =>
      evaluarArista(aristas[1] as AristaCondicional, {}, { U1: 0.75 }),
    ).toThrow(/señal ausente/);
    const otra = {
      ...texas,
      funcion: { nombre: "inventada", entradas: ["x"] },
    } as AristaCondicional;
    expect(() => evaluarArista(otra, { x: 1 }, {})).toThrow(/no registrada/);
  });
});

describe("recalcular desde lo registrado", () => {
  const registro = (
    paso: number,
    desde: string,
    orden: number,
    senal: string | null,
    valor: unknown,
    extra: Partial<DecisionDeArista> = {},
  ): DecisionDeArista => ({
    desde,
    orden_arista: orden,
    paso,
    tipo: senal === null ? "funcion" : "tripleta",
    senal,
    valor_observado: valor as DecisionDeArista["valor_observado"],
    operador: null,
    valor_declarado: null,
    umbral_aplicado: null,
    inclusivo: null,
    funcion: null,
    entradas: null,
    resultado: false,
    rama_tomada: "redactor",
    ...extra,
  });

  it("reconstruye las señales de cada visita (tripletas y entradas de funciones)", () => {
    const regs = [
      registro(4, "decision", 1, "senal_confianza", 0.75),
      registro(4, "decision", 3, null, null, {
        funcion: "texas_y_no_aprobar",
        entradas: { modo_texas: false, propuesta: "aprobar" },
      }),
    ];
    expect(senalesDeVisita(regs)).toEqual({
      senal_confianza: 0.75,
      modo_texas: false,
      propuesta: "aprobar",
    });
  });

  it("con el umbral en su valor el empate no escala; con otro valor, sí", () => {
    const aristas = [
      tripleta(1, "senal_confianza", "menor_que", "umbral.U1", "pausa_humana"),
    ];
    const regs = [registro(4, "decision", 1, "senal_confianza", 0.75)];
    expect(
      recalcular(regs, aristas, { decision: "redactor" }, { U1: 0.75 }),
    ).toEqual([
      {
        desde: "decision",
        paso: 4,
        rama_tomada: "redactor",
        resultados: [false],
      },
    ]);
    expect(
      recalcular(regs, aristas, { decision: "redactor" }, { U1: 0.8 })[0]
        ?.rama_tomada,
    ).toBe("pausa_humana");
  });

  it("un umbral ligado a su señal la reemplaza al recalcular; sin ligaduras se usa lo registrado (AU-4)", () => {
    const regs = [
      registro(4, "decision", 3, null, null, {
        funcion: "texas_y_no_aprobar",
        entradas: { modo_texas: false, propuesta: "negar" },
      }),
    ];
    const sinArista4 = [texas];
    const defecto = { decision: "redactor" };
    const encendido = { U4: true };
    expect(
      recalcular(regs, sinArista4, defecto, encendido)[0]?.rama_tomada,
    ).toBe("redactor");
    expect(
      recalcular(regs, sinArista4, defecto, encendido, {
        modo_texas: "U4",
      })[0]?.rama_tomada,
    ).toBe("pausa_humana");
    // Con la arista de «negar» delante, conmutar U4 no mueve nada: la negación ya iba a una persona.
    const conArista4 = [
      tripleta(1, "propuesta", "igual_a", "negar", "pausa_humana"),
      texas,
    ];
    const regs4 = [registro(4, "decision", 1, "propuesta", "negar"), ...regs];
    for (const u4 of [false, true])
      expect(
        recalcular(
          regs4,
          conArista4,
          defecto,
          { U4: u4 },
          {
            modo_texas: "U4",
          },
        )[0]?.rama_tomada,
      ).toBe("pausa_humana");
  });

  it("un nodo escritor sin rama por defecto es error", () => {
    const regs = [registro(4, "decision", 1, "senal_confianza", 0.75)];
    expect(() => recalcular(regs, [], {}, { U1: 0.75 })).toThrow(
      /sin rama por defecto/,
    );
  });

  it("ordena las visitas por paso y, en empate, por nodo", () => {
    const regs = [
      registro(2, "extractor", 1, "x", 0),
      registro(1, "enrutador", 1, "y", 0),
      registro(1, "aclaracion", 1, "z", 0),
    ];
    const orden = recalcular(
      regs,
      [],
      { extractor: "a", enrutador: "b", aclaracion: "c" },
      {},
    ).map((v) => `${v.paso}${v.desde}`);
    expect(orden).toEqual(["1aclaracion", "1enrutador", "2extractor"]);
  });
});

describe("bordes del recálculo", () => {
  it("orden de cadenas sin Intl", () => {
    expect([
      compararCadenas("a", "b"),
      compararCadenas("b", "a"),
      compararCadenas("a", "a"),
    ]).toEqual([-1, 1, 0]);
  });
  it("registros sin entradas ni señal no aportan señales", () => {
    const base = {
      desde: "d",
      orden_arista: 1,
      paso: 1,
      valor_observado: 1,
      operador: null,
      valor_declarado: null,
      umbral_aplicado: null,
      inclusivo: null,
      funcion: null,
      entradas: null,
      resultado: false,
      rama_tomada: "x",
    } as const;
    expect(
      senalesDeVisita([
        { ...base, tipo: "funcion", senal: null },
        { ...base, tipo: "tripleta", senal: null },
      ]),
    ).toEqual({});
  });
});
