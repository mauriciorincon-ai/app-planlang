/**
 * Los errores con nombre de la Fase 2 de la auditoría (AU-S2-16, B18, C-6, C-7): con un dato que la vitrina no
 * sabe presentar, la vista se detiene nombrando qué falta y dónde, en lugar de pintar un hueco, un «0» o el código
 * crudo. Cada caso arma «otro» dato a partir del publicado y le quita o le cambia una sola cosa.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaAgente } from "@/lib/vista/agente";
import { vistaBrecha } from "@/lib/vista/brecha";
import { vistaCaso } from "@/lib/vista/caso";
import { vistaPlan } from "@/lib/vista/plan";
import { vistaPlayground } from "@/lib/vista/playground";
import { delVocabulario } from "@/lib/vista/vocabulario";
import { SENAL_DE_CONFIANZA } from "@core/brecha/contexto";
import type { DecisionDeArista } from "@core/formatos/traza";
import { demoSinDespacho } from "@/lib/demos";
import { motivoTecnico } from "@/lib/vista/caso-comun";

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

describe("despachos por demo (AU-S3-12)", () => {
  it("un plan del A sin su plan de beneficios se detiene nombrándolo", () => {
    const otro = conPlan();
    delete (otro.plan as { plan_beneficios_sintetico?: unknown })
      .plan_beneficios_sintetico;
    expect(() => vistaPlan(otro, "es")).toThrow(
      "no trae lo que trae un plan aprobado: plan_beneficios_sintetico",
    );
  });

  it("un demo que ningún despacho atiende se detiene con su nombre", () => {
    expect(() => demoSinDespacho("demo-z" as never, "cargarDemo")).toThrow(
      "cargarDemo no sabe atender el demo «demo-z»",
    );
    expect(() => vistaPlan({ ...d, id: "demo-z" } as never, "es")).toThrow(
      "no sabe atender el demo",
    );
  });
});

describe("el motivo técnico de una pausa (AU-S3-06)", () => {
  const base: DecisionDeArista = {
    desde: "decision",
    orden_arista: 2,
    paso: 5,
    tipo: "tripleta",
    senal: "senal_confianza",
    valor_observado: 0.6988,
    operador: "menor_que",
    valor_declarado: "umbral.U1",
    umbral_aplicado: 0.75,
    inclusivo: false,
    funcion: null,
    entradas: null,
    resultado: true,
    rama_tomada: "pausa_humana",
  };

  it("una tripleta: decimales con coma en español y con punto en inglés", () => {
    expect(motivoTecnico(base)).toEqual({
      es: "Arista 2 de decision: senal_confianza (0,6988) menor que umbral.U1 (0,75).",
      en: "Edge 2 of decision: senal_confianza (0.6988) less than umbral.U1 (0.75).",
    });
  });

  it("un valor vacío o compuesto se escribe como en el plan, sin `None`", () => {
    expect(
      motivoTecnico({ ...base, valor_observado: null, umbral_aplicado: [1, 2] })
        .es,
    ).toBe(
      "Arista 2 de decision: senal_confianza (null) menor que umbral.U1 ([1,2]).",
    );
  });

  it("una función nombrada: sus entradas en orden, con `true` y no `True`", () => {
    const f: DecisionDeArista = {
      ...base,
      tipo: "funcion",
      senal: null,
      operador: null,
      valor_declarado: null,
      funcion: "texas_y_no_aprobar",
      entradas: { propuesta: "negar", modo_texas: true },
    };
    expect(motivoTecnico(f)).toEqual({
      es: "Arista 2 de decision: texas_y_no_aprobar(modo_texas=true, propuesta=negar).",
      en: "Edge 2 of decision: texas_y_no_aprobar(modo_texas=true, propuesta=negar).",
    });
    expect(motivoTecnico({ ...f, entradas: null }).en).toBe(
      "Edge 2 of decision: texas_y_no_aprobar().",
    );
  });

  it("una tripleta sin señal u operador en la traza se detiene nombrando la arista", () => {
    expect(() => motivoTecnico({ ...base, operador: null })).toThrow(
      "la arista 2 de decision es una tripleta sin señal u operador",
    );
  });
});

describe("P3 Agente: lo que la vista cita por id (AU-S3-19)", () => {
  it("un criterio que el informe no trae detiene el build nombrándolo", async () => {
    const b = await datosDemo("demo-b");
    const otro = { ...b, informe: structuredClone(b.informe) };
    otro.informe.criterios = otro.informe.criterios.filter(
      (c) => c.id !== "C6",
    );
    expect(() => vistaAgente(otro, "es")).toThrow(
      "cita el criterio C6, que el informe de demo-b no trae",
    );
  });

  it("la línea base se elige por su medición en el plan; sin ella (o con dos) se detiene", async () => {
    const b = await datosDemo("demo-b");
    // El B la declara en S2 y el A en S3: el id no importa, la comparación sí.
    expect(() => vistaAgente(b, "es")).not.toThrow();
    const sinLineaBase = { ...b, plan: structuredClone(b.plan) };
    for (const s of sinLineaBase.plan.supuestos)
      delete (s.medible_en_trazas as { comparacion?: string }).comparacion;
    expect(() => vistaAgente(sinLineaBase, "es")).toThrow(
      "declara 0 supuestos de línea base",
    );
  });
});

describe("P6 Caso del B: lo que vio el oficial (AU-S3-27)", () => {
  it("un payload de pausa que no es lo que registró la traza detiene el build nombrando caso y clave", async () => {
    const b = await datosDemo("demo-b");
    expect(() => vistaCaso(b, "B-001", "es")).not.toThrow();
    // Valores que el esquema acepta (solo exige que viajen) y que no son los registrados.
    const distinto = {
      puntaje: { otro: true },
      coincidencias: { otro: true },
      documentos: { actividad: null },
    };
    for (const clave of ["puntaje", "coincidencias", "documentos"] as const) {
      const otro = {
        ...b,
        corrida: { ...b.corrida, trazas: structuredClone(b.corrida.trazas) },
      };
      const t = otro.corrida.trazas.find((x) => x.caso_id === "B-001")!;
      (t.pausas_humanas[0]!.payload as Record<string, unknown>)[clave] =
        distinto[clave];
      expect(() => vistaCaso(otro, "B-001", "es")).toThrow(
        `en la pausa de B-001, «${clave}» no es lo que registró la traza`,
      );
    }
  });
});

describe("P6 Caso del B: el expediente es del caso (AU-S3-14)", () => {
  it("un expediente con otro caso_id detiene el build", async () => {
    const b = await datosDemo("demo-b");
    const otro = {
      ...b,
      corrida: { ...b.corrida, trazas: structuredClone(b.corrida.trazas) },
    };
    otro.corrida.trazas.find(
      (x) => x.caso_id === "B-005",
    )!.expediente!.caso_id = "B-006";
    expect(() => vistaCaso(otro, "B-005", "es")).toThrow(
      "el expediente de la traza B-005 dice ser del caso B-006",
    );
  });
});
