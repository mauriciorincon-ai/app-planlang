/**
 * Contradicciones del borrador (M2, RF-02.5): cada código se demuestra en rojo sobre el borrador de la entrevista
 * simulada (que solo trae una, real: el riesgo de inyección R4 sin criterio) y sobre el plan v1.5 del A, que nació
 * antes de `riesgos_controlados` y por eso solo marca sus riesgos graves.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  contradicciones,
  MARCA_PENDIENTE,
  rutasPendientes,
  type Plan,
} from "../../../../core/plan";

const leer = (r: string) => JSON.parse(readFileSync(r, "utf8")) as Plan;
const borrador = () =>
  leer("tests/contrato/entrevista-demo-b/v0-borrador.json");
const codigos = (b: unknown, p: { id: string; seccion: string }[] = []) =>
  contradicciones(b, p).map((c) => `${c.codigo}:${c.elemento}`);

describe("contradicciones de un borrador", () => {
  it("el borrador simulado solo trae la del riesgo de inyección; un criterio que lo controla la quita", () => {
    expect(codigos(borrador())).toEqual(["SEVERIDAD_SIN_CRITERIO:R4"]);
    const b = borrador();
    b.criterios_aceptacion[0]!.riesgos_controlados = ["R1", "R4"];
    expect(codigos(b)).toEqual([]);
  });

  it("rojo: una pausa que solo activan aristas sin umbral", () => {
    const b = borrador();
    b.contrato_de_grafo.aristas_condicionales =
      b.contrato_de_grafo.aristas_condicionales.filter(
        (a) => !("valor" in a) || !String(a.valor).startsWith("umbral."),
      );
    expect(codigos(b)).toEqual(
      expect.arrayContaining([
        "PAUSA_SIN_UMBRAL:pausa_humana",
        "UMBRAL_SIN_ARISTA:U1",
        "UMBRAL_SIN_ARISTA:U2",
        "UMBRAL_SIN_ARISTA:U3",
        "UMBRAL_SIN_ARISTA:U4",
      ]),
    );
  });

  it("rojo: un umbral cuya señal el contrato no exige, o sin señal", () => {
    const b = borrador();
    b.contrato_de_grafo.senales_obligatorias_en_traza =
      b.contrato_de_grafo.senales_obligatorias_en_traza.filter(
        (s) => s !== "puntaje_riesgo",
      );
    expect(codigos(b)).toContain("UMBRAL_SIN_SENAL:U2");
    (b.umbrales[2] as { senal: string }).senal = "";
    const c = contradicciones(b).find((x) => x.elemento === "U3")!;
    expect(c.mensaje.es).toMatch(/no declara la señal/);
  });

  it("rojo: un criterio sin regla, sin población, sin condición o sin métrica", () => {
    const b = borrador() as unknown as {
      criterios_aceptacion: Record<string, unknown>[];
    };
    const [c1, c2, c3, c4] = b.criterios_aceptacion;
    delete c1!.regla_de_medicion;
    c2!.regla_de_medicion = { poblacion: "", agregacion: "tasa" };
    c3!.regla_de_medicion = { poblacion: "todos", agregacion: "todos_cumplen" };
    c4!.regla_de_medicion = { poblacion: "todos", agregacion: "mediana" };
    const malos = contradicciones(b).filter(
      (x) => x.codigo === "CRITERIO_SIN_REGLA",
    );
    expect(malos.map((x) => x.elemento)).toEqual(["C1", "C2", "C3", "C4"]);
    expect(malos.map((x) => x.mensaje.en)).toEqual([
      expect.stringMatching(/no measurement rule/),
      expect.stringMatching(/“poblacion”/),
      expect.stringMatching(/“condicion”/),
      expect.stringMatching(/“metrica”/),
    ]);
  });

  it("rojo: textos en un solo idioma, agrupados por elemento (regla 20, M-25)", () => {
    const b = borrador() as unknown as {
      decisiones: { opciones: Record<string, unknown>[] }[];
      riesgos: { mitigaciones: Record<string, unknown>[] }[];
      umbrales: Record<string, unknown>[];
    };
    b.decisiones[0]!.opciones[1]!.nombre = "solo en español";
    b.decisiones[0]!.opciones[0]!.contras = "también";
    b.riesgos[2]!.mitigaciones[0]!.accion = "una acción";
    b.umbrales[1]!.unidad = "puntos";
    const malos = contradicciones(b).filter(
      (x) => x.codigo === "SOLO_UN_IDIOMA",
    );
    expect(malos.map((x) => x.elemento)).toEqual(["D1", "R3", "U2"]);
    expect(malos[0]!.mensaje.es).toMatch(
      /2 texto\(s\) en un solo idioma \(opciones\[0\]\.contras, opciones\[1\]\.nombre\)/,
    );
    expect(malos[2]!.mensaje.en).toMatch(/\(unidad\)/);
  });

  it("rojo: un supuesto que el verificador no sabe decidir (clave ajena o sin umbral)", () => {
    const b = borrador();
    const s2 = b.supuestos.find((s) => s.id === "S2")!;
    s2.medible_en_trazas = {
      metricas: ["proporcion_bien"],
      poblacion: "todos",
      condicion: "decision_final == verdad_conocida.decision",
      umbral_confirmacion: { proporcion_bien: 0.8 },
    };
    const [c] = contradicciones(b).filter(
      (x) => x.codigo === "SUPUESTO_NO_DECIDIBLE",
    );
    expect(c?.elemento).toBe("S2");
    expect(c?.mensaje.es).toMatch(/proporcion_bien.*tasa_min, tasa_max/);
    s2.medible_en_trazas.umbral_confirmacion = { tasa_min: 0.8 };
    expect(codigos(b)).not.toContain("SUPUESTO_NO_DECIDIBLE:S2");
    delete s2.medible_en_trazas.umbral_confirmacion;
    expect(codigos(b)).toContain("SUPUESTO_NO_DECIDIBLE:S2");
    // La línea base sin claves decide con la regla por defecto («no peor»): no es contradicción.
    delete b.supuestos.find((s) => s.id === "S1")!.medible_en_trazas!
      .umbral_confirmacion;
    expect(codigos(b)).not.toContain("SUPUESTO_NO_DECIDIBLE:S1");
  });

  it("rojo: el contrato exige línea base y ningún supuesto la compara (regla dura 10)", () => {
    const b = borrador();
    b.supuestos = b.supuestos.filter((s) => s.id !== "S1");
    expect(codigos(b)).toContain(
      "SIN_LINEA_BASE:contrato_de_grafo.linea_base",
    );
    b.contrato_de_grafo.linea_base = {
      ...b.contrato_de_grafo.linea_base!,
      agente_unico: false,
    };
    expect(codigos(b)).not.toContain(
      "SIN_LINEA_BASE:contrato_de_grafo.linea_base",
    );
  });

  it("lo pendiente: preguntas, umbrales sin valor y textos con la marca", () => {
    const b = borrador() as unknown as Record<string, unknown> & {
      umbrales: { valor_en_plan: unknown }[];
      flujo_objetivo: { es: string; en: string }[];
    };
    b.umbrales[0]!.valor_en_plan = null;
    b.flujo_objetivo[1]!.en = MARCA_PENDIENTE;
    expect(codigos(b, [{ id: "P10", seccion: "supuestos" }])).toEqual([
      "SEVERIDAD_SIN_CRITERIO:R4",
      "PENDIENTE:P10",
      "PENDIENTE:U1.valor_en_plan",
      "PENDIENTE:flujo_objetivo[1].en",
    ]);
    expect(rutasPendientes(MARCA_PENDIENTE)).toEqual(["$"]);
  });

  it("no lanza con un borrador roto o vacío", () => {
    expect(contradicciones(null)).toEqual([]);
    expect(
      contradicciones({
        riesgos: "x",
        umbrales: [{ id: "U1" }, 3],
        contrato_de_grafo: {
          aristas_condicionales: [{ funcion: { entradas: "no" } }, null],
          pausas_humanas: [{ nodo: "p" }],
        },
        criterios_aceptacion: [{ id: "C1", regla_de_medicion: "x" }],
      }).map((c) => c.codigo),
    ).toEqual([
      "PAUSA_SIN_UMBRAL",
      "UMBRAL_SIN_SENAL",
      "UMBRAL_SIN_ARISTA",
      "CRITERIO_SIN_REGLA",
      "PENDIENTE",
    ]);
  });

  it("el plan v1.5 del A: U4 (modo Texas) cuenta por la entrada de su función; solo marca sus riesgos graves", () => {
    expect(codigos(leer("plans/demo-a/v1.5.json"))).toEqual([
      "SEVERIDAD_SIN_CRITERIO:R1",
      "SEVERIDAD_SIN_CRITERIO:R2",
      "SEVERIDAD_SIN_CRITERIO:R3",
      "SEVERIDAD_SIN_CRITERIO:R10",
    ]);
  });
});
