/**
 * Ramas del validador que los planes sembrados no cubren: referencias rotas de distinto tipo, criterios
 * de latencia/pass^k, umbrales con tipo incoherente, aristas con función, orden de aristas, ambigüedad
 * de rama por defecto, advertencias y huella ausente en plan aprobado.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validarPlan, type Codigo } from "../../../../core/plan";

type Obj = Record<string, unknown>;
const base = JSON.parse(
  readFileSync("plans/demo-a/v0-migrado.json", "utf8"),
) as Obj;
const clon = (): Obj => JSON.parse(JSON.stringify(base)) as Obj;
const arr = (p: Obj, k: string): Obj[] => p[k] as Obj[];
const contrato = (p: Obj): Obj => p.contrato_de_grafo as Obj;

function codigos(p: Obj): [Codigo, string][] {
  const v = validarPlan(p);
  return v.ok ? [] : v.motivos.map((m) => [m.codigo, m.elemento]);
}

describe("validador — referencias rotas", () => {
  it("decisión → umbral y riesgo inexistentes; umbral → decisión; riesgo → decisión; evaluador → riesgo", () => {
    const p = clon();
    const d = arr(p, "decisiones")[0] as Obj;
    d.umbrales_asociados = ["U9"];
    d.riesgos_asociados = ["R99"];
    (arr(p, "umbrales")[0] as Obj).decision_id = "D77";
    (arr(p, "riesgos")[0] as Obj).decision_id = "D88";
    (arr(contrato(p), "evaluadores_requeridos")[0] as Obj).riesgos_cubiertos = [
      "R55",
    ];
    const c = codigos(p);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "D1"]);
    expect(
      c.filter(([k, e]) => k === "REFERENCIA_ROTA" && e === "D1"),
    ).toHaveLength(2);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "U1"]);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "R1"]);
    expect(c).toContainEqual([
      "REFERENCIA_ROTA",
      "evaluadores.exactitud_extraccion",
    ]);
  });

  it("aristas: nodo desconocido, umbral inexistente, señal no declarada, entrada de función no declarada", () => {
    const p = clon();
    const aristas = arr(contrato(p), "aristas_condicionales");
    (aristas[0] as Obj).si_verdadero = "nodo_fantasma";
    (aristas[1] as Obj).valor = "umbral.U9";
    (aristas[2] as Obj).senal = "senal_fantasma";
    const f = aristas.find((a) => "funcion" in a) as Obj;
    (f.funcion as Obj).entradas = ["modo_texas", "no_es_senal"];
    const c = codigos(p).map(([k]) => k);
    expect(c.filter((k) => k === "REFERENCIA_ROTA")).toHaveLength(2);
    expect(c.filter((k) => k === "UMBRAL_SIN_SENAL")).toHaveLength(2);
  });

  it("pausas: nodo inexistente o de tipo distinto a pausa_humana", () => {
    const p = clon();
    (arr(contrato(p), "pausas_humanas")[0] as Obj).nodo = "redactor";
    expect(codigos(p)).toContainEqual([
      "SIN_PAUSA_HUMANA",
      "contrato_de_grafo.pausas_humanas",
    ]);
    const q = clon();
    (arr(contrato(q), "pausas_humanas")[0] as Obj).nodo = "inexistente";
    expect(codigos(q)).toContainEqual([
      "REFERENCIA_ROTA",
      "pausas_humanas.inexistente",
    ]);
  });

  it("ramas_por_defecto: nodo sin aristas o destino inexistente", () => {
    const p = clon();
    contrato(p).ramas_por_defecto = {
      decision: "no_existe",
      redactor: "decision",
    };
    const c = codigos(p);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "ramas_por_defecto.decision"]);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "ramas_por_defecto.redactor"]);
  });
});

describe("validador — combinaciones de medición sin sentido (M-26)", () => {
  it("una métrica en un criterio que no la agrega, o una condición en uno que solo agrega la métrica, se rechazan", () => {
    const p = clon();
    const criterios = arr(p, "criterios_aceptacion");
    const c5 = criterios.find((c) => c.id === "C5") as Obj;
    (c5.regla_de_medicion as Obj).metrica = "latencia_total_s";
    const c7 = criterios.find((c) => c.id === "C7") as Obj;
    (c7.regla_de_medicion as Obj).condicion = "pausa_humana == true";
    const c = codigos(p);
    expect(c).toContainEqual(["CRITERIO_SIN_REGLA", "C5"]);
    expect(c).toContainEqual(["CRITERIO_SIN_REGLA", "C7"]);
    // El plan sembrado, sin tocar, no las tiene.
    expect(codigos(clon()).filter(([k]) => k === "CRITERIO_SIN_REGLA")).toEqual(
      [],
    );
  });
});

describe("validador — criterios, umbrales y contrato", () => {
  it("criterio de latencia sin métrica, métrica no declarada, pass^k sin k, población con umbral roto", () => {
    const p = clon();
    const criterios = arr(p, "criterios_aceptacion");
    const c7 = criterios.find((c) => c.id === "C7") as Obj;
    delete (c7.regla_de_medicion as Obj).metrica;
    const c5 = criterios.find((c) => c.id === "C5") as Obj;
    delete (c5.regla_de_medicion as Obj).k;
    (c5.regla_de_medicion as Obj).poblacion =
      "verdad_conocida.presente AND x > umbral.U8";
    const c = codigos(p);
    expect(c).toContainEqual(["CRITERIO_SIN_REGLA", "C7"]);
    expect(c).toContainEqual(["CRITERIO_SIN_REGLA", "C5"]);
    expect(c).toContainEqual(["REFERENCIA_ROTA", "C5.poblacion"]);
    const q = clon();
    (
      (arr(q, "criterios_aceptacion").find((x) => x.id === "C7") as Obj)
        .regla_de_medicion as Obj
    ).metrica = "no_declarada";
    expect(codigos(q)).toContainEqual(["UMBRAL_SIN_SENAL", "C7"]);
  });

  it("umbral con rango booleano y valor numérico (y viceversa)", () => {
    const p = clon();
    (arr(p, "umbrales").find((u) => u.id === "U4") as Obj).valor_en_plan = 1;
    (arr(p, "umbrales").find((u) => u.id === "U1") as Obj).valor_en_plan = true;
    const c = codigos(p);
    expect(c).toContainEqual(["UMBRAL_TIPO_INCOHERENTE", "U4"]);
    expect(c).toContainEqual(["UMBRAL_TIPO_INCOHERENTE", "U1"]);
  });

  it("arista con operador ≥ e inclusivo false; orden con hueco; ambigüedad de rama por defecto", () => {
    const p = clon();
    const aristas = arr(contrato(p), "aristas_condicionales");
    const acl = aristas.find((a) => a.desde === "aclaracion") as Obj;
    acl.inclusivo = false;
    const dec = aristas.filter((a) => a.desde === "decision");
    (dec[1] as Obj).orden = 7;
    (dec[0] as Obj).si_falso = "redactor";
    const c = codigos(p);
    expect(c).toContainEqual([
      "OPERADOR_INCLUSIVO_INCOHERENTE",
      "aristas_condicionales[2] (aclaracion #1)",
    ]);
    expect(c.map(([k]) => k)).toContain("ORDEN_DE_ARISTAS");
    expect(
      c.filter(
        ([k, e]) =>
          k === "NODO_ESCRITOR_SIN_RAMA_POR_DEFECTO" && e === "decision",
      ),
    ).toHaveLength(1);
  });

  it("riesgo marcado «no detectable» con razón pasa; condición de riesgo y de supuesto mal formada falla", () => {
    const p = clon();
    const r8 = arr(p, "riesgos").find((r) => r.id === "R8") as Obj;
    r8.detector_en_trazas = null;
    r8.no_detectable_en_trazas =
      "la cuota no deja rastro en la traza salvo el error del proveedor";
    expect(validarPlan(p).ok).toBe(true);
    const q = clon();
    ((arr(q, "riesgos")[0] as Obj).detector_en_trazas as Obj).condicion = "((";
    ((arr(q, "supuestos")[1] as Obj).medible_en_trazas as Obj).condicion =
      "ciclos <= ";
    const c = codigos(q);
    expect(c).toContainEqual(["CONDICION_NO_INTERPRETABLE", "R1.condicion"]);
    expect(c).toContainEqual(["CONDICION_NO_INTERPRETABLE", "S2.condicion"]);
  });

  it("plan aprobado sin huella → HUELLA_AUSENTE; advertencia por evaluador de regla sin riesgos", () => {
    const p = clon();
    p.estado_aprobacion = "aprobado";
    expect(codigos(p)).toContainEqual(["HUELLA_AUSENTE", "huella"]);
    const q = clon();
    (arr(contrato(q), "evaluadores_requeridos")[0] as Obj).riesgos_cubiertos =
      [];
    const v = validarPlan(q);
    expect(v.ok).toBe(true);
    if (v.ok)
      expect(v.advertencias.map((a) => a.elemento)).toContain(
        "evaluadores.exactitud_extraccion",
      );
  });

  it("los mensajes de esquema traen la ruta del campo", () => {
    const v = validarPlan({ ...clon(), version: "v1" });
    expect(v.ok).toBe(false);
    if (!v.ok)
      expect(v.motivos[0]).toMatchObject({
        codigo: "ESQUEMA",
        elemento: "version",
      });
  });
});
