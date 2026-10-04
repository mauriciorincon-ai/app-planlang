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
