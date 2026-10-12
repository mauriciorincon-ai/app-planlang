/**
 * La vista de un plan sin corrida (S5): lo que la ficha dice que no hay, el origen de cada elemento tal como lo guardó el
 * plan, y la vista en los dos idiomas. Plan de prueba: el borrador del gate de contrato de dom-seguridad-ia, aprobado aquí.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan, PlanSchema } from "../../../core/plan";
import { planSinCorrida } from "../../../src/lib/datos/planes";
import {
  vistaSinCorrida,
  type ContextoDelPlan,
} from "../../../src/lib/vista/plan-sin-corrida";

const borrador = JSON.parse(
  readFileSync(
    "tests/contrato/entrevista-dominio-nuevo/v0-borrador.json",
    "utf8",
  ),
);

async function aprobado() {
  const a = await aprobarPlan(borrador, { por: "prueba", el: "2026-10-11" });
  if (!a.ok) throw new Error("el borrador de prueba debe aprobarse");
  return PlanSchema.parse(a.plan);
}

describe("vistaSinCorrida", () => {
  it("dice que no hay corrida y lista lo que falta, en los dos idiomas", async () => {
    const p = await aprobado();
    const es = vistaSinCorrida(p, "es");
    const en = vistaSinCorrida(p, "en");
    expect(es.ficha.etiqueta).toBe("Sin corrida");
    expect(es.ficha.falta).toContain("trazas, brecha, playground, visor");
    expect(en.ficha.etiqueta).toBe("No run");
    expect(en.ficha.falta).toContain("traces, gap, playground, viewer");
  });

  it("muestra la aprobación y la huella del plan aprobado", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    expect(v.aprobacion).toBe("prueba · el 2026-10-11");
    expect(v.huella).toMatch(/^[0-9a-f]{64}$/);
    expect(v.id).toBe(p.id);
  });

  it("pinta cada sección con sus elementos completos, sin inventar ninguno", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    const cuenta = Object.fromEntries(
      v.secciones.map((s) => [s.id, s.elementos.length]),
    );
    expect(cuenta).toEqual({
      actores: p.actores.length,
      decisiones: p.decisiones.length,
      riesgos: p.riesgos.length,
      supuestos: p.supuestos.length,
      criterios: p.criterios_aceptacion.length,
      umbrales: p.umbrales.length,
    });
  });

  it("el origen de cada elemento es el que guardó el plan: plantilla, entrevistador o usuario", async () => {
    const p = await aprobado();
    const v = vistaSinCorrida(p, "es");
    const origenes = v.secciones.flatMap((s) =>
      s.elementos.map((e) => e.origen),
    );
    // Todo elemento del plan de prueba trae origen: ninguno cae en «sin origen declarado».
    expect(new Set(origenes)).toEqual(new Set(["plantilla", "usuario"]));
    const decisionesUsuario = v.secciones
      .find((s) => s.id === "decisiones")!
      .elementos.filter((e) => e.origen === "usuario").length;
    expect(decisionesUsuario).toBe(p.decisiones.length);
  });

  it("ningún enum del plan sale crudo: reversibilidad, criticidad, estado, tipo de actor y operador van en palabras (AU-S5 M-1)", async () => {
    const p = await aprobado();
    for (const i of ["es", "en"] as const) {
      const v = vistaSinCorrida(p, i);
      const detalles = v.secciones.flatMap((s) =>
        s.elementos.flatMap((e) => e.detalle),
      );
      for (const d of detalles)
        expect(d).not.toMatch(
          /\b(una_via|dos_vias|costosa|sin_probar|menor_que|mayor_que|menor_o_igual_que|mayor_o_igual_que|igual_a|distinto_de)\b/,
        );
    }
    const dec = vistaSinCorrida(p, "es").secciones.find(
      (s) => s.id === "decisiones",
    )!.elementos[0]!;
    expect(dec.detalle.at(-1)).toMatch(
      /^Reversibilidad: (Una vía|Dos vías|Costosa)$/,
    );
  });

  it("los umbrales dicen su señal, su operador y su valor del plan, sin unidad inventada", async () => {
    const p = await aprobado();
    const umbral = vistaSinCorrida(p, "en").secciones.find(
      (s) => s.id === "umbrales",
    )!.elementos[0]!;
    expect(umbral.detalle[0]).toMatch(
      /similitud_cita|similitud_max|fuentes_verificadas|antiguedad_marco_dias/,
    );
    expect(umbral.origen).toBe("user");
  });
});

/**
 * S6, el primer uso real: la v2 de HackGuard con las respuestas que el usuario revisó. La ficha dice de quién son las
 * respuestas y cuándo fue la entrevista (los dos salen del archivo que la entrevista usó), nombra la v1 que queda como
 * historia, y cada riesgo trae su prioridad de acción y, si lo hay, su control legal.
 */
describe("vistaSinCorrida · de quién es el plan y cada riesgo", () => {
  const huellaV1 =
    "bf05e61da1a27baca04d0dc07b6300cb8eb31531d44912ad3768f7598cc2ca60";

  it("la v2 dice que el usuario revisó y confirmó las respuestas, qué cambió y cuándo fue la entrevista", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const contexto: ContextoDelPlan = {
      respuestas: p.respuestas,
      anteriores: p.anteriores,
    };
    const es = vistaSinCorrida(p.plan, "es", contexto);
    expect(es.version).toBe("2.0.0");
    expect(es.respuestas).toBe(
      "Revisadas y confirmadas por el usuario el 2026-10-11 · preguntas que cambió al revisar: P03, P08, P09",
    );
    expect(es.entrevista).toBe("2026-10-11");
    expect(es.aprobacion).toBe("Mauricio Rincón · el 2026-10-11");
    expect(es.anteriores).toEqual([
      `v1.0.0 · Mauricio Rincón el 2026-10-11 · respuestas delegadas al constructor · ${huellaV1.slice(0, 8)}…`,
    ]);
    const en = vistaSinCorrida(p.plan, "en", contexto);
    expect(en.respuestas).toBe(
      "Reviewed and confirmed by the user on 2026-10-11 · questions it changed on review: P03, P08, P09",
    );
    expect(en.anteriores[0]).toContain("answers delegated to the builder");
  });

  it("la v1, vista sola, dice que las respuestas se delegaron al constructor y no tiene historia", () => {
    const v1 = PlanSchema.parse(
      JSON.parse(readFileSync("plans/hackguard-agentes/v1.json", "utf8")),
    );
    const v = vistaSinCorrida(v1, "es", {
      respuestas: {
        clase: "delegadas",
        entrevista: "2026-10-11",
        revision: null,
      },
      anteriores: [],
    });
    expect(v.version).toBe("1.0.0");
    expect(v.respuestas).toBe(
      "Delegadas al constructor: el usuario no las escribió",
    );
    expect(v.anteriores).toEqual([]);
    expect(v.secciones.find((x) => x.id === "riesgos")!.elementos).toHaveLength(
      4,
    );
  });

  it("sin contexto la ficha no inventa: dice que el repo no guarda quién respondió", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const v = vistaSinCorrida(p.plan, "es");
    expect(v.respuestas).toBe("El repo no guarda quién respondió");
    expect(v.entrevista).toBeNull();
    expect(v.anteriores).toEqual([]);
  });

  it("unas respuestas revisadas sin preguntas cambiadas lo dicen", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const v = vistaSinCorrida(p.plan, "es", {
      respuestas: {
        clase: "revisadas",
        entrevista: "2026-10-12",
        revision: { fecha: "2026-10-13", cambiadas: [] },
      },
      anteriores: [],
    });
    expect(v.respuestas).toBe(
      "Revisadas y confirmadas por el usuario el 2026-10-13 · no cambió ninguna pregunta al revisar",
    );
    expect(v.entrevista).toBe("2026-10-12");
  });

  it("los cinco riesgos de la v2 traen su prioridad de acción por la tabla, en los dos idiomas", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const prioridad = (i: "es" | "en") =>
      Object.fromEntries(
        vistaSinCorrida(p.plan, i)
          .secciones.find((s) => s.id === "riesgos")!
          .elementos.map((e) => [e.id, e.detalle.at(-1)]),
      );
    expect(prioridad("es")).toEqual({
      R1: "Prioridad de acción: AP alta",
      R2: "Prioridad de acción: AP alta",
      R3: "Prioridad de acción: AP alta",
      R4: "Prioridad de acción: AP baja",
      R5: "Prioridad de acción: AP alta",
    });
    expect(prioridad("en").R4).toBe("Action priority: AP low");
    expect(prioridad("en").R5).toBe("Action priority: AP high");
  });

  it("un riesgo con control legal sube a prioridad alta y dice cuál era la de la tabla", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const conLegal = {
      ...p.plan,
      riesgos: p.plan.riesgos.map((r) =>
        r.id === "R4" ? { ...r, control_legal: true } : r,
      ),
    };
    const r4 = (i: "es" | "en") =>
      vistaSinCorrida(conLegal, i)
        .secciones.find((s) => s.id === "riesgos")!
        .elementos.find((e) => e.id === "R4")!
        .detalle.at(-1);
    expect(r4("es")).toBe(
      "Prioridad de acción: AP alta · control legal (tabla: baja)",
    );
    expect(r4("en")).toBe(
      "Action priority: AP high · legal control (table: low)",
    );
  });
});

/**
 * S7: el contrato del grafo en detalle. La página dejó de decir solo «9 nodos · 4 aristas · 1 pausa»: lista los nodos
 * con su tipo, las aristas en el orden del flujo con su condición en palabras (el umbral dice su valor), las ramas por
 * defecto y la pausa humana con quién decide y qué ve.
 */
describe("vistaSinCorrida · el contrato del grafo en detalle", () => {
  it("lista los nueve nodos con su tipo, en los dos idiomas", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const es = vistaSinCorrida(p.plan, "es").contratoDetalle;
    const en = vistaSinCorrida(p.plan, "en").contratoDetalle;
    expect(es.nodos).toHaveLength(
      p.plan.contrato_de_grafo.nodos_esperados.length,
    );
    expect(es.nodos.slice(0, 4)).toEqual([
      { id: "enrutador", tipo: "enrutador" },
      { id: "investigador", tipo: "modelo" },
      { id: "verificador_fuentes", tipo: "regla" },
      { id: "catalogo_borrador", tipo: "herramienta" },
    ]);
    expect(es.nodos.at(-1)).toEqual({
      id: "pausa_humana",
      tipo: "pausa humana",
    });
    expect(en.nodos[0]).toEqual({ id: "enrutador", tipo: "router" });
    expect(en.nodos.at(-1)).toEqual({
      id: "pausa_humana",
      tipo: "human pause",
    });
  });

  it("las aristas van en el orden del flujo y su condición lleva el valor que el plan dio al umbral", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const a = vistaSinCorrida(p.plan, "es").contratoDetalle.aristas;
    expect(a.map((x) => `${x.desde}#${x.orden}`)).toEqual([
      "enrutador#1",
      "verificador_fuentes#1",
      "verificador_fuentes#2",
      "verificador_citas#1",
    ]);
    expect(a.map((x) => x.condicion)).toEqual([
      "tarea = investigar",
      "fuentes_verificadas < umbral.U2 (= 2)",
      "antiguedad_marco_dias > umbral.U3 (= 180)",
      "similitud_cita < umbral.U1 (= 1)",
    ]);
    expect(a.map((x) => x.hacia)).toEqual([
      "investigador",
      "pausa_humana",
      "pausa_humana",
      "pausa_humana",
    ]);
    const en = vistaSinCorrida(p.plan, "en").contratoDetalle.aristas;
    expect(en[1]!.condicion).toBe("fuentes_verificadas < umbral.U2 (= 2)");
  });

  it("las ramas por defecto en el orden del flujo, la pausa humana con quién decide y qué ve, y las señales que hay que registrar", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const d = vistaSinCorrida(p.plan, "es").contratoDetalle;
    expect(d.porDefecto).toEqual([
      { desde: "enrutador", hacia: "filtro_instrucciones" },
      { desde: "verificador_fuentes", hacia: "catalogo_borrador" },
      { desde: "verificador_citas", hacia: "calculo_veredicto" },
    ]);
    expect(d.pausas).toHaveLength(1);
    expect(d.pausas[0]).toMatchObject({
      nodo: "pausa_humana",
      quien: "Revisor humano",
    });
    expect(d.pausas[0]!.ve).toContain("veredicto_sugerido");
    expect(d.pausas[0]!.politica).toContain("no hay revisor simulado");
    expect(d.senales).toHaveLength(
      p.plan.contrato_de_grafo.senales_obligatorias_en_traza.length,
    );
    expect(d.senales).toContain("veredicto_corregido_por_persona");
  });

  it("una arista que es una función nombrada se dice con su nombre y sus entradas", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const c = p.plan.contrato_de_grafo;
    const conFuncion = {
      ...p.plan,
      contrato_de_grafo: {
        ...c,
        aristas_condicionales: [
          ...c.aristas_condicionales,
          {
            desde: "extractor",
            orden: 1,
            funcion: { nombre: "calcula_algo", entradas: ["a", "b"] },
            si_verdadero: "pausa_humana",
          },
        ],
      },
    };
    const a = vistaSinCorrida(conFuncion, "es").contratoDetalle.aristas;
    const f = a.find((x) => x.desde === "extractor" && x.orden === 1)!;
    expect(f.condicion).toBe("función calcula_algo(a, b)");
  });

  it("la condición dice el operador que de verdad se evalúa: «<» o «>» con inclusivo son «≤» y «≥»; la bandera no suma palabras", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    const c = p.plan.contrato_de_grafo;
    const arista = (
      orden: number,
      operador:
        | "menor_que"
        | "mayor_que"
        | "menor_o_igual_que"
        | "mayor_o_igual_que"
        | "igual_a"
        | "distinto_de",
      inclusivo: boolean,
      valor: string | number,
    ) => ({
      desde: "extractor",
      orden,
      senal: "tokens",
      operador,
      valor,
      inclusivo,
      si_verdadero: "pausa_humana",
    });
    const plan = {
      ...p.plan,
      contrato_de_grafo: {
        ...c,
        aristas_condicionales: [
          ...c.aristas_condicionales,
          arista(1, "menor_que", true, 5),
          arista(2, "mayor_que", true, 10),
          arista(3, "menor_que", false, 5),
          arista(4, "mayor_o_igual_que", true, 10),
          arista(5, "menor_o_igual_que", false, 3),
          arista(6, "igual_a", true, "x"),
          arista(7, "distinto_de", true, "y"),
        ],
      },
    };
    for (const idioma of ["es", "en"] as const) {
      const condiciones = vistaSinCorrida(plan, idioma)
        .contratoDetalle.aristas.filter((x) => x.desde === "extractor")
        .map((x) => x.condicion);
      expect(condiciones).toEqual([
        "tokens ≤ 5",
        "tokens ≥ 10",
        "tokens < 5",
        "tokens ≥ 10",
        "tokens ≤ 3",
        "tokens = x",
        "tokens ≠ y",
      ]);
      for (const c of condiciones) expect(c).not.toMatch(/inclusiv|\(/);
    }
  });
});

describe("vistaSinCorrida · las cuentas del contrato concuerdan con su número", () => {
  it("«1 pausa humana» en singular y «9 nodos» en plural, en los dos idiomas", async () => {
    const p = await planSinCorrida("hackguard-agentes");
    expect(vistaSinCorrida(p.plan, "es").contrato).toEqual([
      "9 nodos",
      "4 aristas condicionales",
      "1 pausa humana",
    ]);
    expect(vistaSinCorrida(p.plan, "en").contrato).toEqual([
      "9 nodes",
      "4 conditional edges",
      "1 human pause",
    ]);
    const c = p.plan.contrato_de_grafo;
    const una = {
      ...p.plan,
      contrato_de_grafo: {
        ...c,
        aristas_condicionales: c.aristas_condicionales.slice(0, 1),
      },
    };
    expect(vistaSinCorrida(una, "es").contrato[1]).toBe("1 arista condicional");
    expect(vistaSinCorrida(una, "en").contrato[1]).toBe("1 conditional edge");
  });
});
