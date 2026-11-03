/**
 * Plan v1.2 del demo B (S9, «El reloj y los dueños»; el usuario lo aprobó en el G-Plan del S9, chat de la planeadora,
 * 2026-11-02): el nodo `beneficiarios`, sus dos aristas y el criterio C7. Sale de la función de enmienda aplicada al v1.1
 * con la misma huella. Cambia el contrato de grafo, así que NO da la misma verdad que el v1.1 (ADR-005): las corridas
 * de la v1 y la v1.1 no valen para él, y por eso hay un lote nuevo.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  aprobarPlan,
  esAristaTripleta,
  mismaVerdad,
  validarPlan,
  type Plan,
} from "../../../../core/plan";
import { enmendarBV12 } from "../../../../scripts/enmienda-plan-demo-b";

const leer = (v: string) =>
  JSON.parse(readFileSync(`plans/demo-b/${v}.json`, "utf8")) as Plan;
const v11 = leer("v1.1");
const v12 = leer("v1.2");

describe("plan v1.2 del demo B", () => {
  it("se reproduce desde el v1.1 con la función de enmienda y la firma de su aprobación", async () => {
    const r = await aprobarPlan(enmendarBV12(v11), {
      por: v12.aprobado_por!,
      el: v12.aprobado_el!,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.plan).toEqual(v12);
    expect(validarPlan(v12).ok).toBe(true);
    expect([v12.version, v12.aprobado_por, v12.aprobado_el]).toEqual([
      "1.2.0",
      "Mauricio Rincón",
      "2026-11-02",
    ]);
  });

  it("cambia el contrato de grafo pero no los umbrales: no es la misma verdad", () => {
    expect(v12.umbrales).toEqual(v11.umbrales);
    expect(mismaVerdad(v11, v12)).toBe(false);
  });

  it("suma el nodo beneficiarios, determinista, entre el extractor y las listas", () => {
    const ids = v12.contrato_de_grafo.nodos_esperados.map((n) => n.id);
    expect(ids).toEqual([
      "enrutador",
      "extractor",
      "beneficiarios",
      "verificador_listas",
      "investigador",
      "puntaje",
      "decision",
      "pausa_humana",
      "redactor",
      "guardia_salida",
    ]);
    expect(
      v12.contrato_de_grafo.nodos_esperados.find(
        (n) => n.id === "beneficiarios",
      )?.tipo,
    ).toBe("regla");
  });

  it("suma las dos aristas con los operadores de siempre y el extractor declara su rama por defecto", () => {
    const nuevas = v12.contrato_de_grafo.aristas_condicionales
      .filter(esAristaTripleta)
      .filter((a) =>
        ["tipo_solicitante", "similitud_beneficiarios_max"].includes(a.senal),
      );
    expect(nuevas).toEqual([
      {
        desde: "extractor",
        orden: 1,
        senal: "tipo_solicitante",
        operador: "igual_a",
        valor: "juridica",
        inclusivo: false,
        si_verdadero: "beneficiarios",
      },
      {
        desde: "decision",
        orden: 7,
        senal: "similitud_beneficiarios_max",
        operador: "mayor_o_igual_que",
        valor: "umbral.U1",
        inclusivo: true,
        si_verdadero: "pausa_humana",
      },
    ]);
    expect(v12.contrato_de_grafo.ramas_por_defecto.extractor).toBe(
      "verificador_listas",
    );
    // Las aristas que ya había siguen en su orden y con su contenido.
    const viejas = v12.contrato_de_grafo.aristas_condicionales.filter(
      (a) => !nuevas.includes(a as never),
    );
    expect(viejas).toEqual(v11.contrato_de_grafo.aristas_condicionales);
  });

  it("declara las tres señales nuevas y que el oficial ve los beneficiarios", () => {
    const senales = v12.contrato_de_grafo.senales_obligatorias_en_traza;
    for (const s of [
      "tipo_solicitante",
      "beneficiarios",
      "similitud_beneficiarios_max",
    ])
      expect(senales).toContain(s);
    expect(v12.contrato_de_grafo.pausas_humanas[0]!.payload_minimo).toContain(
      "beneficiarios",
    );
  });

  it("C7 mide el conjunto de beneficiarios contra la verdad en las personas jurídicas, al 90 %", () => {
    const c7 = v12.criterios_aceptacion.find((c) => c.id === "C7")!;
    expect(c7.tipo).toBe("tasa");
    expect(c7.valor_objetivo).toBe(0.9);
    expect(c7.regla_de_medicion).toEqual({
      agregacion: "tasa",
      condicion: "beneficiarios == verdad_conocida.beneficiarios",
      poblacion: "tipo_solicitante == 'juridica'",
    });
    expect(c7.enunciado.es).toContain("31 CFR § 1010.230(d)");
    expect(c7.enunciado.en).toContain("31 CFR § 1010.230(d)");
    expect(v12.criterios_aceptacion.map((c) => c.id)).toEqual([
      ...v11.criterios_aceptacion.map((c) => c.id),
      "C7",
    ]);
  });

  it("el flujo cuenta el paso nuevo en los dos idiomas, justo después del extractor", () => {
    const i = v12.flujo_objetivo.findIndex((f) =>
      f.es.startsWith("Si el solicitante es una persona jurídica"),
    );
    expect(i).toBe(
      v11.flujo_objetivo.findIndex((f) =>
        f.es.startsWith("El extractor saca los datos"),
      ) + 1,
    );
    expect(v12.flujo_objetivo[i]!.en).toContain("legal entity");
    expect(v12.flujo_objetivo).toHaveLength(v11.flujo_objetivo.length + 1);
  });

  it("la función de enmienda no se aplica dos veces", () => {
    expect(() => enmendarBV12(v12)).toThrow(/ya tiene/);
  });
});
