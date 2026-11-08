/**
 * El contrafactual del recorrido (S10): «con el umbral en X este caso habría ido a Y», calculado con el mismo código
 * del playground. Por tipo de arista sobre un compacto mínimo (tripleta con umbral, función con un interruptor ligado,
 * literales, solo por defecto, sin valor y separado antes), el lector de `?u=`, y la IGUALDAD con el playground sobre
 * las corridas publicadas del manifiesto: con X el playground cambia ese caso en esa visita hacia Y, y ningún valor
 * más cercano al del plan lo cambia ahí (si no, el contrafactual no sería «el más cercano»).
 */
import { describe, expect, it } from "vitest";
import { compactar } from "@core/playground/compactar";
import type { Compacto, UmbralCompacto } from "@core/playground/compacto";
import {
  consecuencias,
  desvioDe,
  umbralesDelPlan,
} from "@core/playground/consecuencias";
import {
  contrafactualesDelCaso,
  dominioDesdeElPlan,
  umbralesDeConsulta,
  umbralesQueLee,
} from "@core/playground/contrafactual";
import { datosDemo } from "@/lib/datos/vitrina";
import { DEMOS } from "@/lib/demos";

const U1: UmbralCompacto = {
  id: "U1",
  senal: "confianza",
  valor_en_plan: 0.7,
  rango: { min: 0.5, max: 0.9, paso: 0.1 },
};
const U4: UmbralCompacto = {
  id: "U4",
  senal: "modo_texas",
  valor_en_plan: false,
  rango: "booleano",
};

/** Un grafo mínimo: `a` decide por U1 (y por un literal), `b` por una función con el interruptor ligado, `c` solo por defecto. */
function compacto(
  visitas: Compacto["casos"][number]["visitas"],
  aristas: Compacto["aristas"] = [
    {
      desde: "a",
      orden: 1,
      senal: "confianza",
      operador: "menor_que",
      valor: "umbral.U1",
      inclusivo: false,
      si_verdadero: "humano",
    },
    {
      desde: "a",
      orden: 2,
      senal: "faltan",
      operador: "mayor_que",
      valor: 0,
      inclusivo: false,
      si_verdadero: "pregunta",
    },
    {
      desde: "b",
      orden: 1,
      funcion: {
        nombre: "texas_y_no_aprobar",
        entradas: ["modo_texas", "propuesta"],
      },
      si_verdadero: "humano",
    },
    {
      desde: "d",
      orden: 1,
      senal: "faltan",
      operador: "mayor_que",
      valor: 0,
      inclusivo: false,
      si_verdadero: "pregunta",
    },
  ] as Compacto["aristas"],
): Compacto {
  return {
    corrida_id: "prueba",
    umbrales: [U1, U4],
    aristas,
    ramas_por_defecto: { a: "fin", b: "fin", c: "fin", d: "fin" },
    ligaduras: { modo_texas: "U4" },
    nodos_jugables: ["a", "b"],
    desenlace_de_rama: {
      humano: "persona",
      fin: "solo",
      pregunta: "no_observado",
    },
    minutos_por_persona: null,
    propuesta: { senal: "propuesta", favorable: "aprobar" },
    casos: [
      {
        id: "K",
        subtipo: "x",
        debe_escalar: false,
        registrado: "solo",
        senales_de_umbral: {},
        visitas,
        evaluaciones: { registrado: [], caminos: {} },
      },
    ],
    criterios: [],
  } as Compacto;
}

describe("dominio y umbrales que lee un nodo", () => {
  it("el dominio jugable va del valor más cercano al plan al más lejano, sin el del plan; a igual distancia, el menor", () => {
    expect(dominioDesdeElPlan(U1)).toEqual([0.6, 0.8, 0.5, 0.9]);
    expect(dominioDesdeElPlan(U4)).toEqual([true]);
  });

  it("lee el umbral de una tripleta y el de una función por su ligadura; los literales no cuentan", () => {
    const c = compacto([]);
    expect(umbralesQueLee(c.aristas, c.ligaduras, "a")).toEqual(["U1"]);
    expect(umbralesQueLee(c.aristas, c.ligaduras, "b")).toEqual(["U4"]);
    expect(umbralesQueLee(c.aristas, c.ligaduras, "d")).toEqual([]);
    // Una tripleta sobre una señal ligada (el interruptor comparado directo) también lee su umbral.
    expect(
      umbralesQueLee(
        [
          {
            desde: "e",
            orden: 1,
            senal: "modo_texas",
            operador: "igual_a",
            valor: true,
            inclusivo: false,
            si_verdadero: "humano",
          },
        ] as Compacto["aristas"],
        { modo_texas: "U4" },
        "e",
      ),
    ).toEqual(["U4"]);
  });
});

describe("contrafactual por tipo de arista", () => {
  it("tripleta con umbral: el valor más cercano que cambia la rama, y a dónde lleva", () => {
    const c = compacto([
      {
        paso: 1,
        desde: "a",
        senales: { confianza: 0.62, faltan: 0 },
        rama: "fin",
      },
    ]);
    const [v] = contrafactualesDelCaso(c, "K");
    expect(v).toMatchObject({
      paso: 1,
      desde: "a",
      rama: "fin",
      sin_umbral: null,
    });
    // 0,62 < U1 cambia con U1 = 0,8 (0,6 no basta); el más cercano en distancia que la cambia.
    expect(v!.umbrales).toEqual([
      {
        umbral: "U1",
        senal: "confianza",
        plan: 0.7,
        resultado: {
          tipo: "cambia",
          valor: 0.8,
          rama: "humano",
          desenlace: "persona",
        },
      },
    ]);
  });

  it("función con un interruptor ligado: encenderlo cambia la rama", () => {
    const c = compacto([
      {
        paso: 1,
        desde: "b",
        senales: { modo_texas: false, propuesta: "negar" },
        rama: "fin",
      },
    ]);
    expect(contrafactualesDelCaso(c, "K")[0]!.umbrales[0]!.resultado).toEqual({
      tipo: "cambia",
      valor: true,
      rama: "humano",
      desenlace: "persona",
    });
  });

  it("sin valor en el dominio: «no observado» con su razón", () => {
    // Una regla anterior (el literal) ya decide: ningún U1 la cambia.
    const c = compacto([
      {
        paso: 1,
        desde: "a",
        senales: { confianza: 0.95, faltan: 0 },
        rama: "fin",
      },
    ]);
    expect(contrafactualesDelCaso(c, "K")[0]!.umbrales[0]!.resultado).toEqual({
      tipo: "no_observado",
      razon: "sin_valor",
    });
  });

  it("solo literales o solo por defecto: no hay umbral que mover, y se dice cuál de los dos", () => {
    const c = compacto([
      { paso: 1, desde: "d", senales: { faltan: 0 }, rama: "fin" },
      { paso: 2, desde: "c", senales: {}, rama: "fin" },
    ]);
    const [d, cc] = contrafactualesDelCaso(c, "K");
    expect(d).toMatchObject({ sin_umbral: "sin_umbral", umbrales: [] });
    expect(cc).toMatchObject({ sin_umbral: "solo_por_defecto", umbrales: [] });
  });

  it("separado antes: el valor que cambia esta visita ya cambia una anterior, y se nombra ese paso", () => {
    const c = compacto([
      {
        paso: 1,
        desde: "a",
        senales: { confianza: 0.65, faltan: 0 },
        rama: "fin",
      },
      {
        paso: 3,
        desde: "a",
        senales: { confianza: 0.62, faltan: 0 },
        rama: "fin",
      },
    ]);
    const [p1, p3] = contrafactualesDelCaso(c, "K");
    expect(p1!.umbrales[0]!.resultado).toMatchObject({
      tipo: "cambia",
      valor: 0.8,
    });
    expect(p3!.umbrales[0]!.resultado).toEqual({
      tipo: "no_observado",
      razon: "se_separa_antes",
      valor: 0.8,
      paso: 1,
    });
  });

  it("un caso que no está en el compacto falla con nombre", () => {
    expect(() => contrafactualesDelCaso(compacto([]), "Z")).toThrow(/«Z»/);
  });
});

describe("la consulta del playground (?u=)", () => {
  const c = compacto([]);
  it("mueve solo ids del compacto con valores de su dominio jugable", () => {
    expect(umbralesDeConsulta(c, "U1:0.8")).toEqual({ U1: 0.8, U4: false });
    expect(umbralesDeConsulta(c, "U1:0.5,U4:true")).toEqual({
      U1: 0.5,
      U4: true,
    });
  });

  it("ignora lo que el deslizador no puede tomar, y sin movimiento devuelve null", () => {
    for (const q of [
      null,
      "",
      "U1",
      "U1:",
      "U1:0.75",
      "U1:2",
      "U1:abc",
      "U9:0.8",
      "U4:si",
      "U1:0.7",
      "U4:false",
    ])
      expect(umbralesDeConsulta(c, q)).toBeNull();
    expect(umbralesDeConsulta(c, "U1:0.9,U9:1,U4:x")).toEqual({
      U1: 0.9,
      U4: false,
    });
  });
});

describe("igualdad contrafactual = playground, sobre las corridas publicadas", () => {
  it.each(DEMOS)(
    "%s: cada contrafactual es lo que el playground calcula con ese valor",
    async (demo) => {
      const d = await datosDemo(demo);
      const c = compactar(
        d.plan,
        d.corrida,
        d.lote,
        d.informe,
        d.manifiesto.playground,
        d.llegadas,
      );
      const plan = umbralesDelPlan(c);
      let cambian = 0;
      let antes = 0;
      for (const caso of c.casos)
        for (const v of contrafactualesDelCaso(c, caso.id))
          for (const u of v.umbrales) {
            const r = u.resultado;
            if (r.tipo === "no_observado" && r.razon === "sin_valor") continue;
            const con = consecuencias(c, { ...plan, [u.umbral]: r.valor });
            const cambio = con.cambios.find((x) => x.id === caso.id);
            if (r.tipo === "cambia") {
              cambian++;
              expect(cambio, `${caso.id} ${u.umbral}=${r.valor}`).toMatchObject(
                {
                  paso: v.paso,
                  nodo: v.desde,
                  rama_nueva: r.rama,
                  ahora: r.desenlace,
                },
              );
            } else {
              antes++;
              expect(cambio?.paso).toBe(r.paso);
            }
            // El más cercano: ningún valor del dominio más cerca del plan separa el caso en esta visita o antes. La
            // cercanía se mide aquí, desde la cuadrícula del deslizador, y no con el orden de `dominioDesdeElPlan`.
            const uc = c.umbrales.find((x) => x.id === u.umbral)!;
            if (uc.rango === "booleano") continue;
            const { min, max, paso } = uc.rango;
            const p0 = u.plan as number;
            const lejos = Math.abs((r.valor as number) - p0);
            const masCerca: number[] = [];
            for (let k = 0; min + k * paso <= max + 1e-9; k++) {
              const x = Math.round((min + k * paso) * 1e6) / 1e6;
              const dx = Math.abs(x - p0);
              if (
                dx > 1e-9 &&
                (dx < lejos - 1e-9 ||
                  (Math.abs(dx - lejos) <= 1e-9 && x < (r.valor as number)))
              )
                masCerca.push(x);
            }
            const i = caso.visitas.findIndex((x) => x.paso === v.paso);
            for (const x of masCerca) {
              const dv = desvioDe(c, caso, { ...plan, [u.umbral]: x }, plan);
              expect(
                dv === null || dv.i > i,
                `${caso.id} ${u.umbral}=${x}`,
              ).toBe(true);
            }
          }
      expect(cambian).toBeGreaterThan(0);
      if (demo === "demo-a") expect(antes).toBeGreaterThan(0);
    },
  );

  it("rojo: un contrafactual desfasado un paso del dominio ya no es «el más cercano» que calcula el playground", async () => {
    const d = await datosDemo("demo-a");
    const c = compactar(
      d.plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
      d.llegadas,
    );
    const plan = umbralesDelPlan(c);
    // A-002, paso 5 (aclaración con un ciclo): con U3 = 1 va a la pausa; el plan dice 2.
    const caso = c.casos.find((k) => k.id === "A-002")!;
    const v = contrafactualesDelCaso(c, "A-002").find((x) => x.paso === 5)!;
    expect(v.umbrales[0]!.resultado).toMatchObject({
      tipo: "cambia",
      valor: 1,
    });
    const i = caso.visitas.findIndex((x) => x.paso === 5);
    const separa = (x: number) => {
      const dv = desvioDe(c, caso, { ...plan, U3: x }, plan);
      return dv !== null && dv.i <= i;
    };
    // Desfasado a 0: el playground también cambia el caso con 0, pero el 1, más cercano al plan, ya lo cambiaba.
    expect(separa(0)).toBe(true);
    expect(separa(1)).toBe(true);
    expect(
      dominioDesdeElPlan(c.umbrales.find((x) => x.id === "U3")!).indexOf(1),
    ).toBeLessThan(
      dominioDesdeElPlan(c.umbrales.find((x) => x.id === "U3")!).indexOf(0),
    );
  });
});
