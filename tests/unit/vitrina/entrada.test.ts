// @vitest-environment node
/**
 * La vista de P1 Entrada: toda cifra sale del plan, del informe y del manifiesto. Se prueba con los datos
 * reales (lo que la vitrina publica) y con variantes armadas a mano (lo que publicaría si el demo fallara).
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaEntrada } from "@/lib/vista/entrada";
import { conteo, deCada, porcentaje, versionCorta } from "@/lib/vista/formato";
import { tipoDeNodo } from "@/lib/vista/nodos";
import { tb } from "@core/formatos/bilingue";

const D = " ";
let datos: DatosDemo;
beforeAll(async () => {
  datos = await datosDemo();
});

/** Copia profunda con cambios: el informe real con otra suerte. */
function variante(cambio: (d: DatosDemo) => void): DatosDemo {
  const d = structuredClone(datos);
  cambio(d);
  return d;
}

describe("formato de la vitrina", () => {
  it("porcentaje con espacio duro en español, pegado en inglés", () => {
    expect(porcentaje(0.89, "es")).toBe(`89${D}%`);
    expect(porcentaje(0.89, "en")).toBe("89%");
  });
  it("conteos que concuerdan con el número", () => {
    const f = { uno: tb("falla", "failure"), varios: tb("fallas", "failures") };
    expect(conteo(1, f, "es")).toBe(`1${D}falla`);
    expect(conteo(2, f, "en")).toBe(`2${D}failures`);
    expect(deCada(9, 9, "es")).toBe(`9${D}de${D}9`);
    expect(versionCorta("1.2.0")).toBe("v1.2");
    expect(versionCorta("2")).toBe("v2.0");
  });
  it("un tipo de nodo fuera de la gramática no se pinta", () => {
    expect(tipoDeNodo("regla")).toBe("regla");
    expect(() => tipoDeNodo("oraculo")).toThrow(/fuera de la gramática/);
  });
});

describe("P1 Entrada con la corrida real (plan v1.5, corrida de 200)", () => {
  it("Planeé: las cinco partes del plan con su cuenta", () => {
    const v = vistaEntrada(datos, "es");
    expect(v.plan.partes.map((p) => [p.codigo, p.n])).toEqual([
      ["D", 6],
      ["R", 10],
      ["S", 3],
      ["C", 10],
      ["U", 4],
    ]);
    expect(v.plan.partes.find((p) => p.codigo === "C")?.fraccion).toBe(1);
  });

  it("Construí: las 8 piezas del contrato de grafo, en orden y con su tipo", () => {
    const v = vistaEntrada(datos, "es");
    expect(v.agente.nodos.map((n) => `${n.id}:${n.tipo}`)).toEqual([
      "enrutador:enrutador",
      "extractor:modelo",
      "aclaracion:modelo",
      "verificador_cobertura:regla",
      "decision:enrutador",
      "pausa_humana:pausa_humana",
      "redactor:modelo",
      "guardia_salida:regla",
    ]);
    expect(v.agente.pie).toBe(`el agente del sprint 3 · 8${D}de${D}8 piezas`);
    expect(vistaEntrada(datos, "en").agente.pie).toBe(
      `the sprint 3 agent · 8${D}of${D}8 pieces`,
    );
  });

  it("Medí la brecha: 10 de 10 criterios (C5 medido en una corrida, verificador 1.3.0) y lo que falló, nombrado", () => {
    const v = vistaEntrada(datos, "es");
    expect(v.brecha.cuadros).toHaveLength(10);
    expect(v.brecha.cuadros.map((c) => c.estado)).toEqual([
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
      "cumple",
    ]);
    expect(v.brecha.leyenda.criteriosCumplen).toBe(
      `10${D}de${D}10 criterios cumplen`,
    );
    expect(v.brecha.etiquetaCuadros).toBe("10 criterios: 10 cumplen");
    expect(v.brecha.fallas).toEqual([
      { tipo: "fallo", texto: "Falló S2: dos aclaraciones bastan" },
      {
        tipo: "fallo",
        texto: "Falló S3: varios agentes, más lentos que uno solo",
      },
      {
        tipo: "fallo",
        texto: `Falló lo no previsto: 3${D}fallas que solo vio un evaluador`,
      },
    ]);
    expect(v.brecha.pie).toBe(`corrida v1.5 · 200 casos${D}×${D}1`);
    expect(v.fallasALaVista).toEqual({ n: 3, texto: `3${D}fallas a la vista` });
    const en = vistaEntrada(datos, "en");
    expect(en.brecha.fallas.map((f) => f.texto)).toEqual([
      "S2 failed: two clarifications are enough",
      "S3 failed: several agents, slower than one",
      `The unforeseen failed: 3${D}failures only an evaluator saw`,
    ]);
    expect(en.brecha.etiquetaCuadros).toBe("10 criteria: 10 met");
  });

  it("capacidad, veredicto, corrida y el bloque del experto", () => {
    const v = vistaEntrada(datos, "es");
    expect(v.capacidad.casos.cifra).toBe(`200${D}×${D}1`);
    expect(v.capacidad.casos.texto).toBe(
      "casos por corrida, más una línea base de agente único",
    );
    const rf = datos.informe.contrato_de_grafo.rf_09_2;
    const total = rf.reduce((a, r) => a + r.visitas, 0);
    expect(v.capacidad.cruzada.cifra).toBe(`${total} · 0`);
    expect(v.capacidad.balance.cifra).toBe(`10${D}de${D}10 · 0${D}de${D}10`);
    expect(v.veredicto).toEqual({
      valor: "cumple_con_alertas",
      detalle: `10${D}de${D}10 criterios · 0${D}de${D}10 riesgos · 3${D}fallas`,
    });
    expect(v.corrida).toEqual({
      texto: `plan v1.5 · 200 casos${D}×${D}1 + línea base · 2026-10-04`,
      chip: "real · sprint 3",
    });
    expect(v.experto.cruzada).toContain(
      `0${D}diferencias en ${total}${D}decisiones de 2${D}corridas`,
    );
    // Los lotes de la regla 6 son las sesiones de 20, no el archivo de 200 casos.
    expect(v.experto.modelo).toMatch(
      /^sonnet por la suscripción de Claude Code del autor, en lotes de 20 fuera de CI/,
    );
    expect(v.experto.pila).toBe(
      "LangGraph 1.2.12 · LangChain 1.4.2 · Python 3.12 · Claude Code 2.1.282",
    );
  });
});

describe("P1 Entrada con otra suerte (variantes)", () => {
  it("un criterio incumplido y un riesgo ocurrido se nombran primero y cuentan como fallas", () => {
    const d = variante((x) => {
      x.informe.criterios[4].estado = "incumple";
      x.informe.riesgos[0].estado = "ocurrio";
      x.informe.criterios[5].estado = "indeterminado";
    });
    const v = vistaEntrada(d, "es");
    expect(v.brecha.cuadros[4].estado).toBe("no-cumple");
    expect(v.brecha.cuadros[5].estado).toBe("sin-probar");
    expect(v.brecha.fallas[0].texto).toMatch(/^Falló C5: /);
    expect(v.brecha.fallas[1].texto).toMatch(/^Ocurrió R1: /);
    // C5, R1, S2, S3 y lo no previsto.
    expect(v.fallasALaVista.n).toBe(5);
    expect(v.brecha.etiquetaCuadros).toBe(
      "10 criterios: 8 cumplen, 1 no cumplen (C5)",
    );
    const en = vistaEntrada(d, "en");
    expect(en.brecha.fallas[0].texto).toMatch(/^C5 failed: /);
    expect(en.brecha.fallas[1].texto).toMatch(/^R1 occurred: /);
    expect(en.brecha.etiquetaCuadros).toBe(
      "10 criteria: 8 met, 1 not met (C5)",
    );
  });

  it("sin fallas ni pendientes el detalle se acorta y la cifra lo dice", () => {
    const d = variante((x) => {
      for (const s of x.informe.supuestos) s.estado = "confirmado";
      for (const c of x.informe.criterios) c.estado = "cumple";
      x.informe.brechas_no_previstas.brechas = [];
    });
    const v = vistaEntrada(d, "es");
    expect(v.fallasALaVista).toEqual({ n: 0, texto: "Ninguna falla" });
    expect(vistaEntrada(d, "en").fallasALaVista.texto).toBe("No failures");
    expect(v.veredicto.detalle).toBe(
      `10${D}de${D}10 criterios · 0${D}de${D}10 riesgos`,
    );
    expect(v.brecha.fallas).toEqual([]);
  });

  it("un criterio incompleto sin otras fallas no es una falla, pero se dice", () => {
    const d = variante((x) => {
      for (const s of x.informe.supuestos) s.estado = "confirmado";
      x.informe.brechas_no_previstas.brechas = [];
      // La corrida publicada ya no tiene incompletos (verificador 1.3.0): se siembra uno.
      x.informe.criterios.find((c) => c.id === "C5")!.estado = "incompleto";
    });
    const v = vistaEntrada(d, "es");
    expect(v.fallasALaVista).toEqual({ n: 0, texto: "Ninguna falla" });
    expect(v.veredicto.detalle).toBe(
      `9${D}de${D}10 criterios · 0${D}de${D}10 riesgos · 1${D}criterio incompleto`,
    );
    expect(v.brecha.fallas.map((f) => f.tipo)).toEqual(["sin-probar"]);
  });

  it("sin línea base ni repeticiones, con el mismo plan que corrió y otro proveedor", () => {
    const d = variante((x) => {
      x.informe.ficha_reproducibilidad.linea_base = null;
      x.informe.ficha_reproducibilidad.repeticiones = [];
      // El mismo plan que corrió: la versión del plan y la de ejecución coinciden.
      x.informe.ficha_reproducibilidad.plan.version = "1.2.0";
      x.informe.ficha_reproducibilidad.corrida.plan_de_ejecucion.version =
        "1.2.0";
      x.informe.ficha_reproducibilidad.corrida.proveedor = "anthropic";
    });
    const v = vistaEntrada(d, "en");
    expect(v.capacidad.casos).toMatchObject({
      cifra: `200${D}×${D}1`,
      texto: "cases per run",
    });
    expect(v.corrida.texto).toBe(
      `plan v1.2 · 200 cases${D}×${D}1 · 2026-10-04`,
    );
    expect(v.experto.modelo).toBe(
      "sonnet through anthropic, in batches of 20 outside CI",
    );
    expect(vistaEntrada(d, "es").experto.modelo).toBe(
      "sonnet por anthropic, en lotes de 20 fuera de CI",
    );
  });

  it("la cuenta de lo no previsto concuerda con el número", () => {
    const una = variante((x) => {
      x.informe.brechas_no_previstas.brechas.splice(1);
    });
    const noPrevisto = (i: "es" | "en") =>
      vistaEntrada(una, i).brecha.fallas.find((f) =>
        /no previsto|unforeseen/.test(f.texto),
      )!.texto;
    expect(noPrevisto("es")).toBe(
      `Falló lo no previsto: 1${D}falla que solo vio un evaluador`,
    );
    expect(noPrevisto("en")).toBe(
      `The unforeseen failed: 1${D}failure only an evaluator saw`,
    );
  });

  it("rojo: un supuesto sin lectura corta o una brecha sin nombre no se publican en silencio", () => {
    const sinLectura = variante((x) => {
      x.informe.supuestos[1].estado = "refutado";
      x.informe.supuestos[1].id = "S9";
    });
    expect(() => vistaEntrada(sinLectura, "es")).toThrow(
      /S9 no tiene lectura corta/,
    );
    const sinNombre = variante((x) => {
      (
        x.informe.brechas_no_previstas.brechas[0] as { categoria: string }
      ).categoria = "desconocida";
    });
    expect(() => vistaEntrada(sinNombre, "es")).toThrow(
      /«desconocida» no tiene nombre/,
    );
  });
});
