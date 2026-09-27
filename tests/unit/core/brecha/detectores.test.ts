/** RF-06.3 — cada detector de riesgo del plan, aplicado tal cual. */
import { describe, expect, it } from "vitest";
import { disparador, evaluarRiesgos } from "../../../../core/brecha/detectores";
import { planV11, riesgo, vista } from "../../../helpers/vistas";

const conRiesgos = (...rs: ReturnType<typeof riesgo>[]) => ({
  ...planV11(),
  riesgos: rs,
});

describe("disparador «ocurre si»", () => {
  it.each([
    ["> 0", 1, true],
    ["> 0", 0, false],
    [">= 2", 2, true],
    ["< 0.5", 0.4, true],
    ["<= 0.5", 0.6, false],
    ["== 3", 3, true],
  ] as const)("%s con %s → %s", (d, v, esperado) =>
    expect(disparador(d, v)).toBe(esperado),
  );
  it("un disparador ilegible es error", () =>
    expect(() => disparador("mucho", 1)).toThrow(/no interpretable/));
});

describe("evaluarRiesgos", () => {
  const conteo = riesgo(
    "RC",
    { tipo: "conteo", poblacion: "todos", condicion: "fuga", ocurre_si: "> 0" },
    { severidad: 10, ocurrencia: 4, deteccion: 4 },
  );
  const tasa = riesgo("RT", {
    tipo: "tasa",
    poblacion: "x != null AND x > 0.5",
    condicion: "malo",
    ocurre_si: "> 0.10",
  });
  it("conteo: ocurre con sus casos; prioridad de acción AIAG-VDA y RPN", () => {
    const [r] = evaluarRiesgos(conRiesgos(conteo), [
      vista("1", { fuga: true }),
      vista("2", { fuga: false }),
    ]);
    expect(r).toMatchObject({
      estado: "ocurrio",
      valor: 1,
      casos: ["1"],
      prioridad_de_accion: "alta",
      rpn: 160,
    });
  });
  it("tasa: no ocurre bajo el disparador; fuera por nulo se cuenta aparte", () => {
    const vs = [
      vista("1", { x: 0.9, malo: false }),
      vista("2", { x: null, malo: true }),
      vista("3", { x: 0.7, malo: false }),
    ];
    const [r] = evaluarRiesgos(conRiesgos(tasa), vs);
    expect(r).toMatchObject({ estado: "no_ocurrio", valor: 0, n_poblacion: 2 });
    const [r2] = evaluarRiesgos(
      conRiesgos({
        ...tasa,
        detector_en_trazas: {
          tipo: "tasa",
          poblacion: "x > 0.5",
          condicion: "malo",
          ocurre_si: "> 0.10",
        },
      }),
      vs,
    );
    expect(r2).toMatchObject({ fuera_por_senal_nula: 1, n_poblacion: 2 });
  });
  it("sin población, indeterminado, mal formado y no detectable", () => {
    const sinPob = riesgo("RS", {
      tipo: "conteo",
      poblacion: "false",
      condicion: "true",
      ocurre_si: "> 0",
    });
    const indet = riesgo("RI", {
      tipo: "conteo",
      poblacion: "todos",
      condicion: "no_existe",
      ocurre_si: "> 0",
    });
    const mal = riesgo("RM", {
      tipo: "conteo",
      poblacion: "todos",
      condicion: "a != b",
      ocurre_si: "> 0",
    });
    const nd = riesgo("RN", null, {
      no_detectable_en_trazas: "Solo se ve en producción.",
    });
    const nd2 = riesgo("RN2", null);
    const rs = evaluarRiesgos(conRiesgos(sinPob, indet, mal, nd, nd2), [
      vista("1", { a: { x: 1 }, b: 2 }),
    ]);
    expect(rs.map((r) => r.estado)).toEqual([
      "sin_poblacion",
      "indeterminado",
      "mal_formado",
      "no_detectable",
      "no_detectable",
    ]);
    expect(rs[3]?.nota?.es).toBe("Solo se ve en producción.");
    expect(rs[4]?.nota).toBeNull();
  });
});
