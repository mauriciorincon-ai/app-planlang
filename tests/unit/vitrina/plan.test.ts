/**
 * P2 Plan: la vista se arma desde el plan que declara el manifiesto y el informe que lo midió. Las cifras se cuentan;
 * los riesgos van por prioridad de acción efectiva (con el control legal visible); cada sección muestra 5 y el resto
 * tras «Ver N más»; el contrato del grafo lista las 9 reglas con su «si no»; y un plan sin lo de un plan aprobado no
 * se pinta.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { VISIBLES, vistaPlan, type VistaPlan } from "@/lib/vista/plan";
import { CRITERIO } from "@/textos/plan";

let d: DatosDemo;
let es: VistaPlan;
let en: VistaPlan;
beforeAll(async () => {
  d = await datosDemo();
  es = vistaPlan(d, "es");
  en = vistaPlan(d, "en");
});

const seccion = (v: VistaPlan, id: string) =>
  v.secciones.find((s) => s.id === id)!;
const todas = (v: VistaPlan, id: string) => [
  ...seccion(v, id).visibles,
  ...seccion(v, id).resto,
];

describe("las cifras se cuentan en el plan y el informe", () => {
  it("decisiones, riesgos, supuestos, criterios y umbrales", () => {
    expect(es.cifras.map((c) => [c.cifra, c.texto, c.detalle, c.href])).toEqual(
      [
        ["6", "decisiones", "2 de una vía", "#p-dec"],
        [
          "8",
          "riesgos",
          "5 con prioridad alta, 2 por control legal",
          "#p-ries",
        ],
        [
          "3",
          "supuestos",
          "1 confirmado · 1 refutado · 1 sin probar",
          "#p-sup",
        ],
        ["9", "criterios", "9 cumplieron en la corrida", "#p-crit"],
        ["4", "umbrales", "jugables en el playground", "#p-umb"],
      ],
    );
    expect(en.cifras[1]!.detalle).toBe("5 high priority, 2 by legal control");
  });

  it("cada cifra lleva a una sección que existe", () => {
    const ids = new Set(es.secciones.map((s) => `#${s.id}`));
    for (const c of es.cifras) expect(ids.has(c.href), c.href).toBe(true);
  });
});

describe("las secciones", () => {
  it("cada una trae todos los elementos del plan, los primeros 5 a la vista", () => {
    const cuantos: Record<string, number> = {
      "p-dec": d.plan.decisiones.length,
      "p-ries": d.plan.riesgos.length,
      "p-sup": d.plan.supuestos.length,
      "p-crit": d.plan.criterios_aceptacion.length,
      "p-umb": d.plan.umbrales.length,
    };
    for (const s of es.secciones) {
      expect(s.visibles.length + s.resto.length, s.id).toBe(cuantos[s.id]);
      expect(s.visibles.length, s.id).toBe(Math.min(VISIBLES, cuantos[s.id]!));
      expect(s.mas === null, s.id).toBe(s.resto.length === 0);
    }
    expect(seccion(es, "p-dec").mas).toBe("Ver 1 más: D6");
    expect(seccion(en, "p-crit").mas).toBe("Show 4 more: C6, C7, C8, C9");
  });

  it("riesgos por prioridad efectiva: el control legal sube R1 y R6 y lo dice", () => {
    expect(todas(es, "p-ries").map((f) => f.id)).toEqual([
      "R2",
      "R3",
      "R1",
      "R6",
      "R5",
      "R7",
      "R4",
      "R8",
    ]);
    expect(seccion(es, "p-ries").mas).toBe("Ver 3 más: R7, R4, R8");
    const r1 = todas(es, "p-ries").find((f) => f.id === "R1")!;
    expect(r1.lado).toMatchObject({
      tipo: "riesgo",
      ap: { barras: 3, texto: "AP alta" },
      factores: "S9 · O3 · D3",
      rpn: "RPN 81",
      legal: "control legal (tabla: baja)",
      estado: { texto: "No ocurrió", clase: "cumple" },
    });
    expect(r1.tecnica).toBe(
      "todos → decision_final == 'negar' AND pausa_humana == false · ocurre si > 0 · decisión D2",
    );
    const r2 = todas(es, "p-ries").find((f) => f.id === "R2")!;
    expect(r2.lado).toMatchObject({ legal: null });
    expect(r2.abrir!.filas.at(-1)).toMatchObject({
      k: "Qué se hizo",
      nota: "detección → 1 · diseño",
    });
  });

  it("decisiones: la de una vía marcada, su porqué y lo que gobierna", () => {
    const [d1, , d3] = todas(es, "p-dec");
    expect(d1!.unaVia).toBe(true);
    expect(d1!.lado).toEqual({
      tipo: "decision",
      texto: "Una vía",
      unaVia: true,
    });
    expect(d3!.abrir!.tecnica).toBe(
      "tipo explicita · estado decidida · gobierna R1 · R5 · U1 · U2 · U4 · depende de D2",
    );
    expect(d3!.abrir!.filas.map((f) => f.k)).toEqual([
      "Por qué",
      "Opciones consideradas",
      "Qué implica",
    ]);
  });

  it("supuestos: lo que decía el plan y lo que midió la corrida", () => {
    const s = todas(es, "p-sup");
    expect(
      s.map((f) => (f.lado.tipo === "supuesto" ? f.lado.estado.texto : "")),
    ).toEqual(["Sin probar", "Confirmado", "Refutado"]);
    expect(s[0]!.lado).toMatchObject({ enPlan: "en el plan: sin probar" });
    expect(s[0]!.tecnica).toBe(
      "ece · auroc · curva_riesgo_cobertura · verdad_conocida.presente · auroc_min 0.75 · ece_max 0.1",
    );
    expect(s[0]!.abrir!.filas[1]!.v).toMatch(/auroc/);
  });

  it("criterios: cada uno con su frase llana, su objetivo y su regla tal cual", () => {
    for (const c of d.plan.criterios_aceptacion)
      expect(CRITERIO.lider, c.id).toHaveProperty(c.id);
    const c = todas(es, "p-crit");
    expect(c[0]!.resumen).toBe(
      "Objetivo: todos los casos · plantilla del dominio",
    );
    expect(c[4]!.resumen).toBe("Objetivo: ≥ 90\u00a0% · lo pidió el autor");
    expect(c[6]!.resumen).toBe("Objetivo: ≤ 30 s · lo pidió el autor");
    expect(c[4]!.tecnica).toBe(
      "Exactitud de extracción ≥ 90 % sobre casos con verdad conocida. — verdad_conocida.presente → extraccion.campos == verdad_conocida.campos · pass^k · k = 3",
    );
    expect(
      c.every(
        (f) => f.lado.tipo === "criterio" && f.lado.estado.clase === "cumple",
      ),
    ).toBe(true);
  });

  it("umbrales: su valor como lo lee una persona y el enlace al playground", () => {
    const u = todas(es, "p-umb");
    expect(u.map((f) => f.valor)).toEqual(["0,75", "1000", "2", "apagado"]);
    expect(todas(en, "p-umb").map((f) => f.valor)).toEqual([
      "0.75",
      "1000",
      "2",
      "off",
    ]);
    expect(u[0]!.lado).toMatchObject({
      tipo: "umbral",
      href: "/es/playground",
    });
    expect(u[0]!.tecnica).toBe(
      "senal_confianza · menor_que · 0.75 · no inclusivo · rango 0,5 a 0,95 · consecuencia pausa_humana · costo_humano_por_caso_min 12 · decisión D3",
    );
    expect(u[3]!.tecnica).toContain("rango sí / no");
    expect(seccion(es, "p-umb").lectura).toContain(
      "cuesta 12 minutos de auditor",
    );
  });
});

describe("el contrato del grafo", () => {
  it("las 9 reglas con su «si se cumple» y su «si no»", () => {
    const t = es.contrato.tabla;
    expect(t).toHaveLength(9);
    expect(t[0]).toEqual({
      desde: "enrutador",
      n: 1,
      regla: "tipo_atencion · igual_a · urgencia",
      si: "redactor",
      no: "extractor",
    });
    expect(t[3]).toEqual({
      desde: "aclaracion",
      n: 1,
      regla:
        "ciclos_aclaracion · mayor_o_igual_que · umbral.U3 (2) · inclusivo",
      si: "pausa_humana",
      no: "extractor",
    });
    expect(t[4]!.regla).toBe("senal_confianza · menor_que · umbral.U1 (0,75)");
    expect(en.contrato.tabla[4]!.regla).toBe(
      "senal_confianza · menor_que · umbral.U1 (0.75)",
    );
    expect(t[8]).toMatchObject({
      regla: "texas_y_no_aprobar(modo_texas, propuesta)",
      no: "redactor",
    });
  });

  it("las piezas, el flujo y la prueba cruzada con sus cifras", () => {
    expect(es.contrato.piezas).toHaveLength(8);
    expect(es.contrato.flujo).toHaveLength(7);
    expect(es.contrato.piezasTitulo).toBe("Las 8 piezas exigidas");
    expect(es.contrato.apartado).toContain("sus 233 decisiones");
    expect(es.contrato.apartado).toContain("no hubo una sola diferencia");
    expect(es.contrato.lineas[0]).toMatch(
      /^señales obligatorias en toda traza: tipo_atencion, /,
    );
  });
});

describe("la mirada general", () => {
  it("parte de, hace y entrega, desde el plan", () => {
    expect(es.portada.antetitulo).toBe(
      "Demo A · plan-demo-a 1.3.0 · aprobado el 2026-09-28",
    );
    expect(es.parteDe[1]!.detalle).toBe(
      "plan de beneficios sintético: 40 procedimientos, 5 exentos, 6 exclusiones con causal",
    );
    expect(es.hace.hecho).toBe(true);
    expect(es.entrega[0]!.detalle).toMatch(
      /^plan-demo-a 1\.3\.0 · [0-9a-f]{12}…$/,
    );
    expect(es.entrega[1]!.detalle).toBe(
      "8 nodos, 9 aristas con su regla y 16 señales que toda traza debe dejar",
    );
    expect(es.ficha.map((f) => f.k)).toEqual([
      "Id",
      "Huella",
      "Estado",
      "Riesgo",
      "Lotes",
      "Formato",
    ]);
  });

  it("en inglés, sin español residual en lo que no es código", () => {
    const texto = JSON.stringify([
      en.cifras,
      en.parteDe,
      en.entrega,
      en.secciones.map((s) => [s.titulo, s.lectura, s.chip, s.mas]),
      en.contrato.apartado,
    ]);
    for (const residuo of [
      " de ",
      " con ",
      "decisiones",
      "riesgos",
      "Ver ",
      "plan de beneficios",
    ])
      expect(texto, residuo).not.toContain(residuo);
  });

  it("un plan sin lo de un plan aprobado no se pinta: el build falla nombrando qué falta", () => {
    const sinHuella = {
      ...d,
      plan: { ...d.plan, huella: null },
    } as unknown as DatosDemo;
    expect(() => vistaPlan(sinHuella, "es")).toThrow(
      /no trae lo que trae un plan aprobado: huella/,
    );
  });
});

describe("cómo se lee cada estado que el verificador puede dar (no solo los de esta corrida)", () => {
  it("riesgo, supuesto y criterio: texto y clase dibujada para cada estado, y un estado desconocido", async () => {
    const m = await import("@/lib/vista/plan-comun");
    expect(m.estadoDeRiesgo("ocurrio", "es")).toEqual({
      texto: "Ocurrió",
      clase: "no-cumple",
    });
    expect(m.estadoDeRiesgo("sin_poblacion", "en").clase).toBe("alerta");
    expect(m.estadoDeRiesgo(undefined, "es").texto).toBe("Indeterminado");
    expect(m.estadoDeSupuesto("refutado", "en")).toEqual({
      texto: "Refuted",
      clase: "no-cumple",
    });
    // Un estado que el vocabulario no conoce no se lee como «Sin probar» en silencio: detiene el build (AU-S2-16).
    expect(m.estadoDeSupuesto(undefined, "es").texto).toBe("Sin probar");
    expect(() => m.estadoDeSupuesto("raro", "es")).toThrow(
      "«raro» no tiene su entrada en ESTADO_SUPUESTO",
    );
    expect(() => m.estadoDeRiesgo("raro", "es")).toThrow("ESTADO_RIESGO");
    expect(() => m.estadoDeCriterio("raro", "es", "informe")).toThrow(
      "ESTADO_CRITERIO",
    );
    expect(m.estadoDeCriterio("incumple", "es")).toEqual({
      texto: "No cumplió",
      clase: "no-cumple",
    });
    expect(m.estadoDeCriterio("incompleto", "en").clase).toBe("alerta");
    expect(m.estadoDeCriterio(undefined, "en").texto).toBe("Undetermined");
  });

  it("prioridad y control legal", async () => {
    const m = await import("@/lib/vista/plan-comun");
    const r = (
      p: Partial<import("@/lib/vista/plan-comun").RiesgoDelInforme>,
    ) => ({
      estado: "no_ocurrio",
      prioridad_de_accion: "media",
      prioridad_de_tabla: "media",
      rpn: 1,
      ...p,
    });
    expect(m.prioridad(r({}), "en")).toEqual({ barras: 2, texto: "AP medium" });
    expect(m.prioridad(undefined, "es")).toEqual({ barras: 0, texto: "" });
    expect(() =>
      m.prioridad(r({ prioridad_de_accion: "urgente" }), "es"),
    ).toThrow("«urgente» no tiene su entrada en PRIORIDAD_ACCION");
    expect(m.rangoDePrioridad(r({ prioridad_de_accion: "baja" }))).toBe(1);
    expect(m.rangoDePrioridad(undefined)).toBe(0);
    expect(m.controlLegal(r({}), "es")).toBeNull();
    expect(m.controlLegal(r({ control_legal: true }), "es")).toBe(
      "control legal",
    );
    expect(
      m.controlLegal(
        r({
          control_legal: true,
          prioridad_de_accion: "alta",
          prioridad_de_tabla: "baja",
        }),
        "en",
      ),
    ).toBe("legal control (table: low)");
  });
});

describe("C-7: la vitrina dibuja una pausa humana; con más, se detiene nombrándolo", () => {
  it("un plan con dos pausas no se publica mostrando solo la primera", async () => {
    const d = await datosDemo();
    const otro = { ...d, plan: structuredClone(d.plan) };
    const cg = otro.plan.contrato_de_grafo;
    cg.pausas_humanas = [...cg.pausas_humanas, { ...cg.pausas_humanas[0]! }];
    expect(() => vistaPlan(otro, "es")).toThrow(
      "el contrato de grafo del plan trae 2 pausas humanas y la página dibuja una",
    );
    const sin = { ...d, plan: structuredClone(d.plan) };
    sin.plan.contrato_de_grafo.pausas_humanas = [];
    expect(() => vistaPlan(sin, "es")).toThrow("no declara pausa humana");
  });
});
