/**
 * Las lecturas de la Brecha que el S3 hizo depender de las cifras (y no de una frase fija), en las variantes que la
 * corrida publicada no trae: lo que midió un supuesto frente a su umbral, el sentido de la comparación de S3, el
 * rótulo de un criterio sin población frente a uno incompleto, el plural de los incompletos y los detalles repetidos
 * de lo no previsto.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { medidaContraElPlan, vistaBrecha } from "@/lib/vista/brecha";

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});

describe("lo que midió un supuesto frente a lo que pide el plan (`medidaContraElPlan`)", () => {
  it("una tasa se dice en porcentaje, con el mínimo del plan", () => {
    expect(
      medidaContraElPlan(
        { estado: "refutado", metricas: { tasa: 0.8333 }, n: 24 },
        { tasa_min: 0.95 },
        "es",
      ),
    ).toBe("Midió tasa 83,3 % (el plan pide ≥ 95 %), sobre 24 casos.");
    expect(
      medidaContraElPlan(
        { estado: "refutado", metricas: { tasa: 0.8333 }, n: 24 },
        { tasa_min: 0.95 },
        "en",
      ),
    ).toBe("It measured rate 83.3% (the plan asks ≥ 95%), on 24 cases.");
  });

  it("ECE y AUROC se dicen como el número que son, con su máximo y su mínimo", () => {
    expect(
      medidaContraElPlan(
        { estado: "refutado", metricas: { ece: 0.2, auroc: 0.6 }, n: 40 },
        { ece_max: 0.1, auroc_min: 0.75 },
        "es",
      ),
    ).toBe(
      "Midió ECE 0,2 (el plan pide ≤ 0,10) y AUROC 0,6 (el plan pide ≥ 0,75), sobre 40 casos.",
    );
  });

  it("confirmado, sin umbral declarado o con una medida que falta, no hay frase: queda el motivo del verificador", () => {
    const m = { tasa: 0.99 };
    expect(
      medidaContraElPlan(
        { estado: "confirmado", metricas: m, n: 10 },
        { tasa_min: 0.95 },
        "es",
      ),
    ).toBeNull();
    expect(
      medidaContraElPlan({ estado: "refutado", metricas: m, n: 10 }, {}, "es"),
    ).toBeNull();
    expect(
      medidaContraElPlan(
        { estado: "sin_probar", metricas: { ece: null, auroc: 0.8 }, n: 10 },
        { ece_max: 0.1, auroc_min: 0.75 },
        "es",
      ),
    ).toBeNull();
  });
});

describe("la Brecha con otra suerte", () => {
  it("S3 con el multiagente menos exacto y igual de rápido lo dice así: «acertó menos pero tardó lo mismo», no «acertó más pero tardó más»", () => {
    const otro = structuredClone(d);
    const c = otro.informe.supuestos.find((s) => s.id === "S3")!.comparacion!;
    c.exactitud.multiagente = 0.8;
    c.exactitud.agente_unico = 0.9;
    c.latencia_mediana_s.multiagente = c.latencia_mediana_s.agente_unico;
    const s3 = vistaBrecha(otro, "es").supuestos.find((s) => s.id === "S3")!;
    expect(s3.dio).toContain(
      "Acertó menos (80 % frente a 90 %) pero tardó lo mismo",
    );
    const en = vistaBrecha(otro, "en").supuestos.find((s) => s.id === "S3")!;
    expect(en.dio).toContain(
      "It got fewer right (80% against 90%) but took the same time",
    );
  });

  it("S3 más exacto y más rápido: «y», no «pero»", () => {
    const otro = structuredClone(d);
    const c = otro.informe.supuestos.find((s) => s.id === "S3")!.comparacion!;
    c.latencia_mediana_s.multiagente = 1;
    expect(
      vistaBrecha(otro, "es").supuestos.find((s) => s.id === "S3")!.dio,
    ).toMatch(/Acertó más \(98 % frente a 90 %\) y tardó menos/);
  });

  it("un criterio sin población va a «lo sin probar» con ese rótulo; uno incompleto, con el suyo", () => {
    const otro = structuredClone(d);
    Object.assign(
      otro.informe.criterios.find((c) => c.id === "C6")!,
      {
        estado: "sin_poblacion",
        n_poblacion: 0,
        casos_que_incumplen: [],
      },
    );
    const v = vistaBrecha(otro, "es");
    const rotulo = (id: string) =>
      v.sinProbar.find((f) => f.codigo === id)!.etiqueta;
    expect(rotulo("C6")).toBe("Sin probar");
    expect(rotulo("C5")).toBe("Incompleto");
  });

  it("dos criterios incompletos se dicen en plural en el veredicto", () => {
    const otro = structuredClone(d);
    otro.informe.criterios.find((c) => c.id === "C7")!.estado = "incompleto";
    expect(vistaBrecha(otro, "es").veredicto.lider).toContain(
      "Y C5 y C7 quedaron incompletos: se midieron con menos corridas de las que pide su regla.",
    );
    expect(vistaBrecha(otro, "en").veredicto.lider).toContain(
      "And C5 and C7 were left incomplete: measured with fewer runs than their rules ask for.",
    );
  });

  it("lo no previsto: un detalle por renglón con sus casos, y uno sin caso no inventa paréntesis", () => {
    const otro = structuredClone(d);
    const bs = otro.informe.brechas_no_previstas.brechas;
    bs.push({
      ...bs[0]!,
      caso_id: null,
      detalle: { es: "Otra cosa que vio el evaluador.", en: "Something else." },
    });
    const np = vistaBrecha(otro, "es").fallos.find(
      (f) => f.codigo === "no previsto",
    )!;
    expect(np.lider[1]).toBe(
      "La extracción no coincide con la verdad conocida (A-022, A-126 y A-139). Otra cosa que vio el evaluador.",
    );
  });
});
