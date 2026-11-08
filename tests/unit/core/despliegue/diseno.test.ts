/**
 * El diseño de despliegue (S10): la mediana con su convención, las medidas de las trazas, el control de cada riesgo
 * en su componente y la forma del grafo que se le entrega al visor. Es una función pura de datos: no nombra ningún demo.
 */
import { describe, expect, it } from "vitest";
import {
  COMPONENTES,
  COMPONENTES_DEL_DISENO,
  costoPorCaso,
  disenoDeDespliegue,
  latenciaPorNodo,
  mediana,
  type EntradaDeDespliegue,
} from "@core/despliegue/diseno";

const paso = (nodo: string, duracion_ms: number, costo_nominal_usd = 0) => ({
  nodo,
  duracion_ms,
  costo_nominal_usd,
});
const trazas = [
  { caso_id: "c1", pasos: [paso("a", 10, 0.01), paso("b", 100, 0.02)] },
  { caso_id: "c2", pasos: [paso("a", 30, 0.01), paso("a", 20, 0.01)] },
  { caso_id: "c3", pasos: [paso("b", 300, 0.05)] },
];
const riesgo = (id: string) => ({
  id,
  modo: { es: `modo ${id}`, en: `mode ${id}` },
  severidad: 5,
  mitigaciones: [{ accion: "hacer algo" }, { accion: { es: "x", en: "y" } }],
});
const entrada = (
  sobre: Partial<EntradaDeDespliegue> = {},
): EntradaDeDespliegue => ({
  riesgos: [riesgo("R1"), riesgo("R2")],
  pausa: null,
  controles: { R1: ["guardia", "cola_humana"], R2: [] },
  plazos: null,
  trazas,
  ...sobre,
});

describe("mediana", () => {
  it("el del medio con cantidad impar y la media de los dos del medio con par", () => {
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([7])).toBe(7);
  });
  it("una lista vacía no tiene mediana: falla, no inventa", () => {
    expect(() => mediana([])).toThrow(/vacía/);
  });
  it("no reordena la lista que recibe", () => {
    const xs = [3, 1, 2];
    mediana(xs);
    expect(xs).toEqual([3, 1, 2]);
  });
});

describe("medidas de las trazas", () => {
  it("la latencia por nodo: veces, mediana y máximo, de la mayor mediana a la menor", () => {
    expect(latenciaPorNodo(trazas)).toEqual([
      { nodo: "b", pasos: 2, p50_ms: 200, max_ms: 300 },
      { nodo: "a", pasos: 3, p50_ms: 20, max_ms: 30 },
    ]);
  });
  it("a igual mediana, por nombre (el orden no depende de cómo llegaron las trazas)", () => {
    const t = [{ caso_id: "x", pasos: [paso("z", 5), paso("m", 5)] }];
    expect(latenciaPorNodo(t).map((l) => l.nodo)).toEqual(["m", "z"]);
  });
  it("el costo por caso es la suma de sus pasos: media, mediana y máximo", () => {
    // c1 = 0,03 · c2 = 0,02 · c3 = 0,05
    expect(costoPorCaso(trazas)).toEqual({
      media_usd: 0.033333,
      p50_usd: 0.03,
      max_usd: 0.05,
    });
  });
  it("sin trazas no hay costo que decir", () => {
    expect(costoPorCaso([])).toBeNull();
  });
});

describe("el diseño", () => {
  it("siete componentes en el orden de la arquitectura, cada uno con tipo y banda de la gramática", () => {
    const d = disenoDeDespliegue(entrada());
    expect(d.componentes.map((c) => c.id)).toEqual([...COMPONENTES]);
    expect(d.grafo.nodos.map((n) => n.id)).toEqual([...COMPONENTES]);
    expect(d.contrato.nodos_esperados.map((n) => n.id)).toEqual([
      ...COMPONENTES,
    ]);
    // Las franjas transversales no reciben nodos del grafo: ninguno cae en ellas.
    expect(
      d.componentes.every(
        (c) =>
          c.banda !== ("guardarrailes" as never) &&
          c.banda !== ("trazas-costo" as never),
      ),
    ).toBe(true);
  });

  it("«implementado» solo con evidencia en el código; sin ella, «sin código aún»", () => {
    for (const c of COMPONENTES_DEL_DISENO)
      expect(c.madurez === "implementado", c.id).toBe(c.evidencia.length > 0);
  });

  it("cada componente está en la cadena: todos llevan y reciben flujo (nada queda suelto)", () => {
    const d = disenoDeDespliegue(entrada());
    for (const n of d.grafo.nodos) {
      const toca = d.grafo.aristas.some(
        (a) => a.source === n.id || a.target === n.id,
      );
      expect(toca, n.id).toBe(true);
    }
  });

  it("la cola humana lleva la pausa del plan, con su rol; sin pausa en el plan, ninguna", () => {
    const pausa = {
      rol: "revisor",
      payload_minimo: ["motivo"],
      politica_simulada: { es: "p", en: "p" },
    };
    expect(disenoDeDespliegue(entrada({ pausa })).grafo.pausas_humanas).toEqual(
      [{ nodo: "cola_humana", ...pausa }],
    );
    expect(disenoDeDespliegue(entrada()).grafo.pausas_humanas).toEqual([]);
  });
});

describe("riesgo → control → componente", () => {
  it("cada riesgo trae sus mitigaciones tal cual (en los dos idiomas) y sus componentes en el orden del diseño", () => {
    const [r1, r2] = disenoDeDespliegue(entrada()).riesgos;
    expect(r1!.componentes).toEqual(["guardia", "cola_humana"]);
    expect(r1!.mitigaciones).toEqual([
      { es: "hacer algo", en: "hacer algo" },
      { es: "x", en: "y" },
    ]);
    expect(r2!.componentes).toEqual([]);
  });

  it("rojo: un riesgo del plan sin entrada en los controles rompe el diseño, con su nombre", () => {
    expect(() =>
      disenoDeDespliegue(entrada({ controles: { R1: ["guardia"] } })),
    ).toThrow(/«R2» no tiene su control/);
  });

  it("rojo: un control de un riesgo que el plan no tiene también", () => {
    expect(() =>
      disenoDeDespliegue(
        entrada({ controles: { R1: [], R2: [], R9: ["guardia"] } }),
      ),
    ).toThrow(/«R9» está en los controles/);
  });
});

describe("la capacidad: lo que mide el informe o «no medido»", () => {
  it("sin sección de plazos, la capacidad es null (se dice «no medido», no se inventa)", () => {
    expect(disenoDeDespliegue(entrada()).medidas.capacidad).toBeNull();
  });

  it("con plazos, copia lo medido: capacidad, mínima, carga y horas", () => {
    const plazos = {
      capacidad: {
        valor: 30,
        unidad: { es: "casos por día hábil", en: "cases per business day" },
        rango: { min: 5, max: 60, paso: 1 },
      },
      dias_habiles: 5,
      pausas: 70,
      carga_por_dia: 14,
      capacidad_minima: { valor: 8, tardias_con_una_menos: 14 },
      horas_de_auditor: 14,
    } as unknown as NonNullable<EntradaDeDespliegue["plazos"]>;
    expect(disenoDeDespliegue(entrada({ plazos })).medidas.capacidad).toEqual({
      valor: 30,
      unidad: { es: "casos por día hábil", en: "cases per business day" },
      rango: { min: 5, max: 60, paso: 1 },
      dias_habiles: 5,
      pausas: 70,
      carga_por_dia: 14,
      minima: { valor: 8, tardias_con_una_menos: 14 },
      horas_de_auditor: 14,
    });
  });
});
