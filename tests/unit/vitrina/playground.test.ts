/**
 * P5 Playground: la vista arma en el build lo que no cambia y los datos de la isla. El ejemplo del líder se MIDE (el
 * primer valor de U1 que cambia un caso), la ficha técnica sale de la corrida y del informe, el orden de evaluación es
 * el del grafo del plan y la isla viaja como datos puros (lo que no sobrevive a JSON no llega al navegador).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { consecuencias, umbralesDelPlan } from "@core/playground/consecuencias";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { idsDeCasos } from "@/lib/vista/caso";
import { vistaPlayground, type VistaPlayground } from "@/lib/vista/playground";
import { INTERRUPTOR, PORQUE_FUNCION } from "@/textos/playground";

let d: DatosDemo;
let es: VistaPlayground;
let en: VistaPlayground;
beforeAll(async () => {
  d = await datosDemo();
  es = vistaPlayground(d, "es");
  en = vistaPlayground(d, "en");
});

const ficha = (v: VistaPlayground, k: string) =>
  v.ficha.find((f) => f.k === k)!.v;

describe("el playground en una mirada", () => {
  it("la portada y lo que recibe se cuentan en la corrida", () => {
    expect(es.portada.antetitulo).toBe(
      "Demo A · corrida suscripcion-planlang-a-002-200-v1.5 · 200 casos · 624 decisiones registradas",
    );
    expect(es.recibeSub).toBe("200 casos · 624 decisiones");
    expect(es.recibe[0]!.detalle).toBe(
      "instrucción escondida, confianza, costo, contradicción, propuesta, sin respuesta del modelo y aclaraciones de los 200 casos",
    );
    expect(en.recibe[0]!.detalle).toBe(
      "hidden instruction, confidence, cost, contradiction, proposal, no model response and clarifications of the 200 cases",
    );
    expect(es.hace[3]).toContain("12 por caso");
  });

  it("el ejemplo del líder es una medida: U1 a 0,85 manda A-089 y A-144 a una persona, +24 min, ningún error", () => {
    // Con la corrida de 200, el primer valor que mueve algo mueve dos casos, los dos con confianza 0,80.
    expect(es.ejemplo).toBe(
      "Si subes el umbral de confianza mínima de extracción (U1) de 0,75 a 0,85, los casos A-089 y A-144 —que el agente resolvió solo, con confianza 0,80 cada uno— pasarían a una persona: 24 minutos más de auditor y ningún error nuevo. Pruébalo abajo.",
    );
    expect(en.ejemplo).toContain(
      "from 0.75 to 0.85, cases A-089 and A-144 —which the agent resolved alone, each with confidence 0.80—",
    );
    // La misma cuenta, hecha a mano con el núcleo.
    const c = es.isla.compacto;
    const r = consecuencias(c, { ...umbralesDelPlan(c), U1: 0.85 });
    expect(r.cambios.map((x) => [x.id, x.antes, x.ahora])).toEqual([
      ["A-089", "solo", "persona"],
      ["A-144", "solo", "persona"],
    ]);
    expect(r.minutos! - r.minutos_plan!).toBe(24);
    expect(r.introducidos).toEqual([]);
    // Y 0,80 no cambia nada: el ejemplo es el primer valor que mueve un caso.
    for (const v of [0.8])
      expect(
        consecuencias(c, { ...umbralesDelPlan(c), U1: v }).cambios,
      ).toEqual([]);
  });

  it("la ficha técnica sale de la corrida y del informe", () => {
    // La corrida de 200 y su línea base: las decisiones de las dos, como las cuenta el informe.
    const rf = d.informe.contrato_de_grafo.rf_09_2;
    const total = rf.reduce((a, r) => a + r.visitas, 0);
    expect(ficha(es, "Prueba cruzada")).toBe(
      `RF-09.2: 0 diferencias en ${total} decisiones de 2 corridas, Python frente a TypeScript`,
    );
    expect(ficha(es, "Regla de cada umbral")).toContain(
      "U4 es la función nombrada texas_y_no_aprobar(modo_texas, propuesta)",
    );
    expect(ficha(es, "Carga humana")).toContain(
      "costo_humano_por_caso_min = 12 en los 4 umbrales del plan v1.5",
    );
    expect(ficha(en, "Cross-check")).toContain(`0 differences in ${total}`);
  });

  it("el orden de evaluación sigue el grafo del plan, no el orden alfabético", () => {
    const orden = ficha(es, "Orden de evaluación")
      .split(" · ")
      .map((x) => x.split(" (")[0]);
    expect(orden).toEqual(["enrutador", "extractor", "aclaracion", "decision"]);
    expect(es.isla.nodosEnOrden).toEqual(orden);
  });

  it("los límites vienen del informe: U4 ya no es inerte (mueve las 9 aprobaciones en parte) y lo dice", () => {
    expect(es.limites).toHaveLength(3);
    expect(es.limites[1]).toBe(
      "U4 (Modo Texas): conmutarlo cambia 9 de las 624 decisiones registradas en esta corrida.",
    );
    const rf = d.informe.contrato_de_grafo.rf_09_2;
    expect(es.nucleoDetalle).toContain(
      `${rf.reduce((a, r) => a + r.visitas, 0)} decisiones`,
    );
  });
});

describe("lo que la vista no inventa", () => {
  it("si ningún valor de U1 en su rango cambia un caso, no hay ejemplo (no se escribe uno fijo)", () => {
    const otro = structuredClone(d);
    const u1 = otro.plan.umbrales.find((u) => u.id === "U1")!;
    // 0,80 no mueve ningún caso; 0,85 sí (A-089 y A-144).
    if ("min" in u1.rango_jugable) u1.rango_jugable.max = 0.8;
    expect(vistaPlayground(otro, "es").ejemplo).toBeNull();
  });

  it("si el primer valor que mueve algo mueve más casos de los que caben en una frase, no hay ejemplo", () => {
    const otro = structuredClone(d);
    const u1 = otro.plan.umbrales.find((u) => u.id === "U1")!;
    // Con pasos de 0,20, el primer valor por encima del plan es 0,95: mueve once casos.
    if ("min" in u1.rango_jugable) u1.rango_jugable.paso = 0.2;
    expect(vistaPlayground(otro, "es").ejemplo).toBeNull();
  });

  it("una señal que decide sin nombre llano detiene el build, nombrándola (no se pinta el código en su lugar)", () => {
    const otro = structuredClone(d);
    // Una regla más en `decision` que lee una clave del caso que el playground no sabe nombrar.
    const aristas = otro.corrida.grafo.aristas_condicionales;
    const base = aristas.find((x) => x.desde === "decision")!;
    aristas.push({
      ...base,
      orden: 99,
      senal: "tipo",
      operador: "igual_a",
      valor: "x",
    } as typeof base);
    expect(() => vistaPlayground(otro, "es")).toThrow(
      /«tipo» decide en el grafo y el playground no tiene su nombre llano/,
    );
  });

  it("con riesgo en la curva, la lectura deja de decir «0 % en todo el rango»; sin curva, no hay curva", () => {
    const otro = structuredClone(d);
    const s1 = otro.informe.supuestos.find((s) => s.curva && s.curva.length)!;
    s1.curva![0]!.riesgo = 0.2;
    expect(vistaPlayground(otro, "es").isla.curva!.lectura).toBe(
      "Subir la confianza mínima (U1) manda más casos a una persona: baja la cobertura y, si la confianza está calibrada, también el riesgo.",
    );
    s1.curva = [];
    expect(vistaPlayground(otro, "es").isla.curva).toBeNull();
  });
});

describe("los datos de la isla", () => {
  it("AU-S3-11: el compacto del A trae la aprobación parcial que el plan v1.5 deja salir sola sin modo Texas", () => {
    expect(es.isla.compacto.propuesta).toEqual({
      senal: "propuesta",
      favorable: "aprobar",
      parcial: {
        valor: "aprobar_parcial",
        senal_que_exige_persona: "modo_texas",
      },
    });
  });

  it("cuatro umbrales con su rango y sus decimales; U4 es un interruptor", () => {
    expect(
      es.isla.umbrales.map((u) => [u.id, u.valorPlan, u.rango, u.decimales]),
    ).toEqual([
      ["U1", 0.75, { min: 0.5, max: 0.95, paso: 0.05 }, 2],
      ["U2", 1000, { min: 200, max: 5000, paso: 100 }, 0],
      ["U3", 2, { min: 0, max: 4, paso: 1 }, 0],
      ["U4", false, null, 0],
    ]);
  });

  it("las columnas son las señales que leen las aristas; las ligadas a un umbral no se repiten", () => {
    expect(es.isla.columnas.map((c) => c.senal)).toEqual([
      "carga_detectada",
      "senal_confianza",
      "costo_estimado",
      "contradiccion_orden_texto",
      "propuesta",
      "proveedor_no_disponible",
      "ciclos_aclaracion",
    ]);
  });

  it("los 200 casos van en la isla; solo los que tienen página enlazan a ella, en el idioma de la vista", () => {
    expect(es.isla.casos).toHaveLength(200);
    expect(es.isla.casos[0]).toMatchObject({
      id: "A-001",
      href: "/es/caso/A-001",
    });
    expect(en.isla.casos[0]!.href).toBe("/en/caso/A-001");
    const conPagina = new Set(idsDeCasos(d));
    for (const x of es.isla.casos)
      expect(x.href, x.id).toBe(
        conPagina.has(x.id) ? `/es/caso/${x.id}` : null,
      );
    // A-021 no está entre los 20 primeros ni lo nombra el informe: va sin enlace.
    expect(es.isla.casos.find((x) => x.id === "A-021")!.href).toBeNull();
  });

  it("la curva lleva el punto del plan; con errores medidos, la lectura no dice «0 % en todo el rango»", () => {
    // S1 se midió sobre los 159 casos con verdad conocida, y no todos fueron aciertos.
    expect(es.isla.curva).toMatchObject({ plan: 0.75, n: 159, umbral: "U1" });
    expect(es.isla.curva!.lectura).toBe(
      "Subir la confianza mínima (U1) manda más casos a una persona: baja la cobertura y, si la confianza está calibrada, también el riesgo.",
    );
    expect(en.isla.curva!.lectura).toContain(
      "Raising the minimum confidence (U1) sends more cases to a person",
    );
  });

  it("viaja como datos puros: sobrevive a JSON sin perder nada", () => {
    expect(JSON.parse(JSON.stringify(es.isla))).toEqual(es.isla);
  });
});

describe("AU-S2-1: la isla no narra una regla con el texto de otra", () => {
  it("un umbral booleano sin sus textos detiene el build nombrándolo", () => {
    const u4 = INTERRUPTOR.U4!;
    delete INTERRUPTOR.U4;
    try {
      expect(() => vistaPlayground(d, "es")).toThrow(/umbral booleano U4/);
    } finally {
      INTERRUPTOR.U4 = u4;
    }
  });

  it("una función nombrada sin su «por qué» detiene el build nombrándola", () => {
    const t = PORQUE_FUNCION.texas_y_no_aprobar!;
    delete PORQUE_FUNCION.texas_y_no_aprobar;
    try {
      expect(() => vistaPlayground(d, "en")).toThrow(/«texas_y_no_aprobar»/);
    } finally {
      PORQUE_FUNCION.texas_y_no_aprobar = t;
    }
  });
});
