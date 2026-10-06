/**
 * Los errores con nombre de la Fase 2 de la auditoría (AU-S2-16, B18, C-6, C-7): con un dato que la vitrina no
 * sabe presentar, la vista se detiene nombrando qué falta y dónde, en lugar de pintar un hueco, un «0» o el código
 * crudo. Cada caso arma «otro» dato a partir del publicado y le quita o le cambia una sola cosa.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaBrecha } from "@/lib/vista/brecha";
import { vistaCaso } from "@/lib/vista/caso";
import { vistaPlan } from "@/lib/vista/plan";
import { vistaPlayground } from "@/lib/vista/playground";
import { delVocabulario } from "@/lib/vista/vocabulario";
import { SENAL_DE_CONFIANZA } from "@core/brecha/contexto";

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});
const conInforme = () => ({ ...d, informe: structuredClone(d.informe) });
const conPlan = () => ({ ...d, plan: structuredClone(d.plan) });

describe("delVocabulario", () => {
  it("devuelve la entrada, o se detiene nombrando la clave y el diccionario", () => {
    expect(delVocabulario({ a: 1 }, "a", "X")).toBe(1);
    expect(() => delVocabulario({ a: 1 }, "b", "X (src/x.ts)")).toThrow(
      "«b» no tiene su entrada en X (src/x.ts)",
    );
  });
});

describe("P4 Brecha", () => {
  it("un veredicto sin nombre", () => {
    const otro = conInforme();
    (otro.informe.veredicto as { valor: string }).valor = "a_medias";
    expect(() => vistaBrecha(otro, "es")).toThrow(
      "el veredicto «a_medias» no tiene nombre",
    );
  });

  it("una curva de supuesto sin umbral de confianza en el plan", () => {
    // El umbral sigue (las aristas del plan v1.5 lo citan y el playground de la Brecha lo recalcula), pero ya no lee la
    // señal de confianza: la curva no sabe dónde marcar el punto del plan y lo dice.
    const otro = conPlan();
    otro.plan.umbrales.find((u) => u.senal === SENAL_DE_CONFIANZA)!.senal =
      "otra_senal";
    expect(() => vistaBrecha(otro, "en")).toThrow(
      `no tiene un umbral sobre «${SENAL_DE_CONFIANZA}»`,
    );
  });

  it("un criterio pass^k sin su nombre corto", () => {
    // El criterio se renombra en el plan y en el informe: así lo verían un plan y una corrida nuevos.
    const otro = { ...conPlan(), informe: structuredClone(d.informe) };
    const enInforme = otro.informe.criterios.find(
      (x) => x.agregacion === "pass^k",
    )!;
    const enPlan = otro.plan.criterios_aceptacion.find(
      (x) => x.id === enInforme.id,
    )!;
    enInforme.id = "C99";
    enPlan.id = "C99";
    expect(() => vistaBrecha(otro, "es")).toThrow(
      "el criterio «C99» es el más exigente (pass^k) y no tiene su nombre corto",
    );
  });
});

describe("P5 Playground (C-6)", () => {
  it("un informe sin la prueba cruzada de la corrida que el playground recalcula", () => {
    const otro = conInforme();
    otro.informe.contrato_de_grafo.rf_09_2 =
      otro.informe.contrato_de_grafo.rf_09_2.filter(
        (r) => r.corrida_id !== otro.corrida.manifiesto.corrida_id,
      );
    expect(() => vistaPlayground(otro, "es")).toThrow(
      `no trae la prueba cruzada RF-09.2 de la corrida que recalcula (${otro.corrida.manifiesto.corrida_id})`,
    );
  });
});

describe("P5 Playground: la prueba cruzada es la de la corrida del compacto (AU-S2-P-4)", () => {
  it("lee el corrida_id del compacto, no el del informe", () => {
    const otro = conInforme();
    // Cargar ya exige que informe y corrida sean la misma; aquí solo se separan los dos ids para ver cuál se lee.
    otro.informe.corrida_id = "otra-corrida";
    expect(() => vistaPlayground(otro, "es")).not.toThrow();
  });
});

describe("P6 Caso (C-7)", () => {
  it("un caso con dos pausas no muestra solo la primera", () => {
    const t = d.corrida.trazas.find((x) => x.pausas_humanas.length === 1)!;
    const otro = {
      ...d,
      corrida: {
        ...d.corrida,
        trazas: d.corrida.trazas.map((x) =>
          x.caso_id === t.caso_id
            ? {
                ...x,
                pausas_humanas: [...x.pausas_humanas, x.pausas_humanas[0]!],
              }
            : x,
        ),
      },
    };
    expect(() => vistaCaso(otro, t.caso_id, "es")).toThrow(
      `el caso ${t.caso_id} trae 2 pausas humanas`,
    );
  });
});

describe("P2 Plan: la criticidad", () => {
  it("una criticidad sin nombre", () => {
    const otro = conPlan();
    (otro.plan.supuestos[0]! as { criticidad: string }).criticidad = "extrema";
    expect(() => vistaPlan(otro, "en")).toThrow(
      "la criticidad «extrema» no tiene nombre",
    );
  });
});
