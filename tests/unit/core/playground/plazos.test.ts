/**
 * La capacidad del auditor en el playground (S9, ADR-019): el compacto trae la cola cuando el plan declara plazos y el
 * lote sus llegadas; `consecuencias` la recalcula con los destinos que dan los umbrales jugados y con la capacidad
 * jugada, y el criterio de plazos sale de esa cola, no de la evaluación por caso.
 */
import { describe, expect, it } from "vitest";
import { compactar } from "../../../../core/playground/compactar";
import type { Compacto } from "../../../../core/playground/compacto";
import {
  consecuencias,
  umbralesDelPlan,
} from "../../../../core/playground/consecuencias";
import { datosDemo } from "../../../../src/lib/datos/vitrina";

async function base() {
  const d = await datosDemo();
  const c = compactar(
    d.plan,
    d.corrida,
    d.lote,
    d.informe,
    d.manifiesto.playground,
    d.llegadas,
  );
  return { d, c };
}

/** El mismo compacto con plazos más cortos: sirve para ver lo que la capacidad hace cuando el plazo aprieta. */
function conPlazoCorto(c: Compacto, minutos: number): Compacto {
  const p = c.plazos!;
  return {
    ...c,
    plazos: {
      ...p,
      config: {
        ...p.config,
        clases: p.config.clases.map((k) => ({ ...k, plazo_min: minutos })),
      },
    },
  };
}

describe("el compacto con plazos", () => {
  it("trae la cola, la llegada de cada caso y marca el criterio que lee en_plazo", async () => {
    const { c } = await base();
    expect(c.plazos?.capacidad).toEqual({
      valor: 30,
      min: 10,
      max: 60,
      paso: 5,
    });
    expect(c.plazos?.config.clases.map((k) => [k.valor, k.plazo_min])).toEqual([
      ["hospitalaria", 72 * 60],
      ["ambulatoria", 7 * 1440],
    ]);
    expect(c.casos.every((k) => k.plazo !== undefined)).toBe(true);
    expect(c.criterios.filter((k) => k.de_plazos).map((k) => k.id)).toEqual([
      "C11",
    ]);
  });

  it("sin la capa de llegadas el compacto conserva sus bytes: ni plazos ni llegadas", async () => {
    const { d } = await base();
    const sin = compactar(
      d.plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
    );
    expect(sin.plazos).toBeUndefined();
    expect(sin.casos.some((k) => k.plazo !== undefined)).toBe(false);
  });
});

describe("la cola con los umbrales y la capacidad jugados", () => {
  it("con los valores del plan dice lo mismo que el informe: ninguna fuera de plazo y C11 sin cambio", async () => {
    const { c, d } = await base();
    const r = consecuencias(c, umbralesDelPlan(c));
    const z = r.plazos!;
    expect(z.capacidad).toBe(30);
    expect(z.tardias).toEqual([]);
    expect(z.en_cola).toBe(d.informe.plazos!.pausas);
    expect(z.clases.map((k) => [k.clase, k.n, k.en_cola, k.tardias])).toEqual(
      d.informe.plazos!.clases.map((k) => [k.valor, k.n, k.en_cola, k.tardias]),
    );
    const c11 = r.criterios.find((k) => k.id === "C11")!;
    expect(c11).toMatchObject({
      estado: "cumple",
      valor: true,
      recalculado: false,
    });
    expect(z.capacidad_minima).toEqual(d.informe.plazos!.capacidad_minima);
  });

  it("es determinista: dos veces, los mismos bytes", async () => {
    const { c } = await base();
    const u = { ...umbralesDelPlan(c), U1: 0.9 };
    expect(JSON.stringify(consecuencias(c, u, 25))).toBe(
      JSON.stringify(consecuencias(c, u, 25)),
    );
  });

  it("mover un umbral cambia cuántas van al auditor: con U1 en 0,95 pasan más que con el plan", async () => {
    const { c } = await base();
    const plan = consecuencias(c, umbralesDelPlan(c)).plazos!;
    const alto = consecuencias(c, { ...umbralesDelPlan(c), U1: 0.95 }).plazos!;
    expect(alto.en_cola).toBeGreaterThan(plan.en_cola);
  });

  it("en este lote, más capacidad no suma solicitudes tardías en todo el rango jugable, con plazos que aprietan", async () => {
    const { c } = await base();
    const apretado = conPlazoCorto(c, 6 * 60);
    const cuentas = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(
      (cap) =>
        consecuencias(apretado, umbralesDelPlan(c), cap).plazos!.tardias.length,
    );
    expect([...cuentas].sort((a, b) => b - a)).toEqual(cuentas);
    expect(cuentas[0]).toBeGreaterThan(cuentas[cuentas.length - 1]!);
  });

  it("si el plazo aprieta, el criterio de plazos pasa a incumple con los casos que se pasaron, y el rango jugable lo mueve", async () => {
    const { c } = await base();
    const apretado = conPlazoCorto(c, 6 * 60);
    const lento = consecuencias(apretado, umbralesDelPlan(c), 10);
    const c11 = lento.criterios.find((k) => k.id === "C11")!;
    expect(c11.estado).toBe("incumple");
    expect(c11.valor).toBe(false);
    expect(c11.recalculado).toBe(true);
    expect(c11.casos_que_incumplen).toEqual(
      lento.plazos!.tardias.map((t) => t.caso_id),
    );
    const rapido = consecuencias(apretado, umbralesDelPlan(c), 60);
    expect(rapido.plazos!.tardias.length).toBeLessThan(
      lento.plazos!.tardias.length,
    );
  });

  it("lo que se mide sale de la cola: con los plazos del plan, el plazo se rompe por debajo del rango que el plan deja mover", async () => {
    const { c, d } = await base();
    const min = c.plazos!.capacidad.min;
    const z = consecuencias(c, umbralesDelPlan(c)).plazos!;
    expect(z.capacidad_minima!.valor).toBeLessThan(min);
    // Lo que el control no deja mover se puede comprobar con la propia cola: con una menos que la mínima, salen.
    const con = (cap: number) =>
      consecuencias(c, umbralesDelPlan(c), cap).plazos!;
    expect(con(z.capacidad_minima!.valor).tardias).toHaveLength(0);
    expect(con(z.capacidad_minima!.valor - 1).tardias).toHaveLength(
      z.capacidad_minima!.tardias_con_una_menos!,
    );
    expect(d.informe.plazos!.capacidad_minima!.valor).toBe(
      z.capacidad_minima!.valor,
    );
  });

  it("un caso «no observado» no se mide: el criterio queda abierto («indeterminado») y los nombra", async () => {
    const { c } = await base();
    // U3 = 3 con U1 = 0,5 y U2 = 0 deja 10 casos con clase sin observar (el camino nuevo llega a otro nodo que decide).
    const r = consecuencias(c, {
      ...umbralesDelPlan(c),
      U1: 0.5,
      U2: 0,
      U3: 3,
    });
    expect(r.no_observados).toHaveLength(10);
    expect(r.plazos!.sin_medir).toHaveLength(10);
    const c11 = r.criterios.find((k) => k.id === "C11")!;
    expect(r.plazos!.tardias).toEqual([]);
    expect(c11).toMatchObject({ estado: "indeterminado", valor: false });
    expect(c11.no_evaluables).toEqual(r.plazos!.sin_medir);
    // Los no observados no entran a la cola: ni esperan ni cuentan como pausas.
    expect(r.plazos!.clases.reduce((n, k) => n + k.n, 0)).toBe(
      c.casos.filter((k) =>
        c.plazos!.config.clases.some((x) => x.valor === k.plazo?.clase),
      ).length - 10,
    );
  });
});
