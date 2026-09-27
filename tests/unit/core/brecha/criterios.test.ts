/** RF-06.2 — cada criterio se mide con su regla y su población, con estados honestos. */
import { describe, expect, it } from "vitest";
import { evaluarCriterios } from "../../../../core/brecha/criterios";
import { criterio, planV11, vista } from "../../../helpers/vistas";

const conCriterios = (...cs: ReturnType<typeof criterio>[]) => ({
  ...planV11(),
  criterios_aceptacion: cs,
});

describe("todos_cumplen (absoluto)", () => {
  const c = criterio("C", {
    poblacion: "tipo == 'a'",
    condicion: "ok == true",
    agregacion: "todos_cumplen",
  });
  it("cumple / incumple con los casos que fallan", () => {
    const [r] = evaluarCriterios(conCriterios(c), [
      vista("1", { tipo: "a", ok: true }),
      vista("2", { tipo: "b", ok: false }),
    ]);
    expect(r).toMatchObject({
      estado: "cumple",
      valor_medido: true,
      n_poblacion: 1,
    });
    const [r2] = evaluarCriterios(conCriterios(c), [
      vista("1", { tipo: "a", ok: true }),
      vista("2", { tipo: "a", ok: false }),
    ]);
    expect(r2).toMatchObject({
      estado: "incumple",
      valor_medido: false,
      casos_que_incumplen: ["2"],
    });
  });
  it("sin población, indeterminado (nulo o faltante) y fuera por señal nula", () => {
    expect(
      evaluarCriterios(conCriterios(c), [
        vista("1", { tipo: "b", ok: true }),
      ])[0]?.estado,
    ).toBe("sin_poblacion");
    const [r] = evaluarCriterios(conCriterios(c), [
      vista("1", { tipo: "a", ok: true }),
      vista("2", { tipo: "a" }),
    ]);
    expect(r).toMatchObject({ estado: "indeterminado", valor_medido: false });
    expect(r?.no_evaluables[0]?.motivo.es).toMatch(/falta la señal «ok»/);
    const nulo = criterio("N", {
      poblacion: "x > 1",
      condicion: "ok",
      agregacion: "todos_cumplen",
    });
    const [r3] = evaluarCriterios(conCriterios(nulo), [
      vista("1", { x: null, ok: true }),
      vista("2", { x: 2, ok: null }),
    ]);
    expect(r3).toMatchObject({
      fuera_por_senal_nula: 1,
      n_poblacion: 1,
      estado: "indeterminado",
    });
    expect(r3?.no_evaluables[0]?.motivo.en).toMatch(/null signal/);
    const falta = criterio("F", {
      poblacion: "no_existe == 1",
      condicion: "true",
      agregacion: "todos_cumplen",
    });
    expect(
      evaluarCriterios(conCriterios(falta), [vista("1", {})])[0],
    ).toMatchObject({ estado: "indeterminado", n_poblacion: 1 });
  });
  it("una regla que compara estructuras distintas queda mal formada", () => {
    const mal = criterio("M", {
      poblacion: "todos",
      condicion: "a == b",
      agregacion: "todos_cumplen",
    });
    const [r] = evaluarCriterios(conCriterios(mal), [
      vista("1", { a: { x: 1 }, b: { y: 1 } }),
    ]);
    expect(r?.estado).toBe("mal_formado");
    expect(r?.nota?.es).toMatch(/nunca pueden ser iguales/);
  });
  it("tipos incompatibles en la condición → no evaluable", () => {
    const t = criterio("T", {
      poblacion: "todos",
      condicion: "a < 3",
      agregacion: "todos_cumplen",
    });
    expect(
      evaluarCriterios(conCriterios(t), [vista("1", { a: "x" })])[0]
        ?.no_evaluables[0]?.motivo.es,
    ).toMatch(/tipos incompatibles/);
  });
});

describe("tasa y pass^k", () => {
  const tasa = criterio(
    "T",
    { poblacion: "todos", condicion: "ok", agregacion: "tasa" },
    { tipo: "tasa", valor_objetivo: 0.5 },
  );
  it("tasa", () => {
    const vs = [
      vista("1", { ok: true }),
      vista("2", { ok: false }),
      vista("3", { ok: true }),
    ];
    expect(evaluarCriterios(conCriterios(tasa), vs)[0]).toMatchObject({
      estado: "cumple",
      valor_medido: 0.6667,
      casos_que_incumplen: ["2"],
    });
    expect(
      evaluarCriterios(conCriterios({ ...tasa, valor_objetivo: 0.9 }), vs)[0]
        ?.estado,
    ).toBe("incumple");
  });

  const pk = criterio(
    "K",
    {
      poblacion: "todos",
      condicion: "ok",
      agregacion: "pass^k",
      k: 3,
      k_aplica_a: "lote_demo_20",
    },
    { tipo: "tasa", valor_objetivo: 0.9 },
  );
  const buenos = [vista("1", { ok: true }), vista("2", { ok: true })];
  it("con k_observado < k y sin fallar → incompleto (nunca «cumple»)", () => {
    const [r] = evaluarCriterios(conCriterios(pk), buenos);
    expect(r).toMatchObject({
      estado: "incompleto",
      valor_medido: 1,
      k: { requerido: 3, observado: 1, aplica_a: "lote_demo_20" },
    });
    expect(r?.nota?.en).toMatch(/1 of the 3 required runs/);
  });
  it("si la tasa observada ya está bajo el objetivo → incumple aunque falten corridas", () => {
    const [r] = evaluarCriterios(conCriterios(pk), [
      vista("1", { ok: true }),
      vista("2", { ok: false }),
    ]);
    expect(r).toMatchObject({ estado: "incumple", valor_medido: 0.5 });
  });
  it("con las k corridas: un caso cuenta solo si pasa en todas", () => {
    const [r] = evaluarCriterios(conCriterios(pk), buenos, [
      buenos,
      [vista("1", { ok: true }), vista("2", { ok: false })],
    ]);
    expect(r).toMatchObject({
      estado: "incumple",
      valor_medido: 0.5,
      casos_que_incumplen: ["2"],
      k: { observado: 3 },
    });
    const [ok] = evaluarCriterios(conCriterios(pk), buenos, [buenos, buenos]);
    expect(ok?.estado).toBe("cumple");
    const sinK = criterio(
      "K1",
      { poblacion: "todos", condicion: "ok", agregacion: "pass^k" },
      { tipo: "tasa", valor_objetivo: 0.9 },
    );
    expect(evaluarCriterios(conCriterios(sinK), buenos)[0]).toMatchObject({
      estado: "cumple",
      k: { requerido: 1, aplica_a: null },
    });
  });
  it("una repetición que no pudo medir deja el criterio mal formado, no «pasó» (AU-7)", () => {
    const igual = criterio(
      "KE",
      { poblacion: "todos", condicion: "a == b", agregacion: "pass^k", k: 2 },
      { tipo: "tasa", valor_objetivo: 0.9 },
    );
    const bien = [vista("1", { a: { x: 1 }, b: { x: 1 } })];
    const rota = [vista("1", { a: { x: 1 }, b: { y: 1 } })];
    const [r] = evaluarCriterios(conCriterios(igual), bien, [rota]);
    expect(r?.estado).toBe("mal_formado");
    expect(r?.nota?.es).toMatch(/^Repetición 2: /);
  });
});

describe("métricas agregadas", () => {
  const lat = (agregacion: "mediana" | "promedio" | "maximo") =>
    criterio(
      "L",
      { poblacion: "todos", metrica: "lat", agregacion },
      { tipo: "latencia", valor_objetivo: 30 },
    );
  const vs = [
    vista("1", { lat: 10 }),
    vista("2", { lat: 40 }),
    vista("3", { lat: 12 }),
    vista("4", { lat: 11 }),
  ];
  it("mediana (par), promedio y máximo; menor es mejor para latencia", () => {
    expect(evaluarCriterios(conCriterios(lat("mediana")), vs)[0]).toMatchObject(
      { estado: "cumple", valor_medido: 11.5, casos_que_incumplen: ["2"] },
    );
    expect(
      evaluarCriterios(conCriterios(lat("promedio")), vs)[0],
    ).toMatchObject({ estado: "cumple", valor_medido: 18.25 });
    expect(evaluarCriterios(conCriterios(lat("maximo")), vs)[0]).toMatchObject({
      estado: "incumple",
      valor_medido: 40,
    });
  });
  it("mayor es mejor para otros tipos; métrica nula o no numérica → no evaluable", () => {
    const t = criterio(
      "P",
      { poblacion: "todos", metrica: "x", agregacion: "promedio" },
      { tipo: "tasa", valor_objetivo: 0.5 },
    );
    const [r] = evaluarCriterios(conCriterios(t), [
      vista("1", { x: 0.9 }),
      vista("2", { x: null }),
      vista("3", { x: "a" }),
      vista("4", {}),
    ]);
    expect(r).toMatchObject({ estado: "indeterminado", valor_medido: 0.9 });
    expect(r?.no_evaluables.map((n) => n.caso_id)).toEqual(["2", "3", "4"]);
    expect(
      evaluarCriterios(conCriterios(t), [vista("1", { x: 0.1 })])[0]?.estado,
    ).toBe("incumple");
    expect(
      evaluarCriterios(conCriterios(t), [vista("1", { x: null })])[0]?.estado,
    ).toBe("sin_poblacion");
  });
});
