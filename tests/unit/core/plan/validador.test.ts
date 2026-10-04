/**
 * Ramas del validador que los planes sembrados no cubren: referencias rotas de distinto tipo, criterios
 * de latencia/pass^k, umbrales con tipo incoherente, aristas con función, orden de aristas, ambigüedad
 * de rama por defecto, advertencias y huella ausente en plan aprobado. Y M-23 (S2): lo que leen las condiciones y
 * las aristas existe — una señal no declarada se advierte y detiene la aprobación; una función no registrada es una
 * referencia rota.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan, validarPlan, type Codigo } from "../../../../core/plan";

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

  it("criterio → riesgo que dice controlar y no existe (RF-02.5, S3)", () => {
    const p = clon();
    (arr(p, "criterios_aceptacion")[0] as Obj).riesgos_controlados = [
      "R1",
      "R99",
    ];
    expect(codigos(p).filter(([k]) => k === "REFERENCIA_ROTA")).toEqual([
      ["REFERENCIA_ROTA", "C1"],
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
    // Nodo, umbral y (M-23) la función con entradas distintas de las de su registro.
    expect(c.filter((k) => k === "REFERENCIA_ROTA")).toHaveLength(3);
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

describe("validador — lo que leen las condiciones y las aristas (M-23)", () => {
  const v1 = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Obj;
  const v13 = JSON.parse(readFileSync("plans/demo-a/v1.3.json", "utf8")) as Obj;

  it("una condición que lee una señal no declarada se advierte (el v1 lee servicio_exento sin declararla)", () => {
    const v = validarPlan(v1);
    expect(v.ok).toBe(true);
    const adv = v.advertencias.filter((m) => m.codigo === "SENAL_NO_DECLARADA");
    expect(adv.map((m) => m.elemento)).toContain("C4.poblacion");
    expect(adv.every((m) => m.mensaje.es.includes("servicio_exento"))).toBe(
      true,
    );
    // El plan vigente la declara: ninguna advertencia.
    const actual = validarPlan(v13);
    expect(
      actual.advertencias.filter((m) => m.codigo === "SENAL_NO_DECLARADA"),
    ).toEqual([]);
  });

  it("y al aprobar es un motivo: el plan no se aprueba", async () => {
    const borrador = { ...v1, estado_aprobacion: "borrador", huella: null };
    const r = await aprobarPlan(borrador, { por: "prueba", el: "2026-10-01" });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(new Set(r.motivos.map((m) => m.codigo))).toEqual(
        new Set(["SENAL_NO_DECLARADA"]),
      );
  });

  it("las claves del contexto del caso (verdad_conocida, extraccion, umbral…) no se advierten", () => {
    const p = JSON.parse(JSON.stringify(v13)) as Obj;
    const c = arr(p, "criterios_aceptacion")[0] as Obj;
    (c.regla_de_medicion as Obj).poblacion =
      "verdad_conocida.presente AND extraccion.confianza > umbral.U1";
    const v = validarPlan(p);
    expect(
      v.advertencias.filter((m) => m.codigo === "SENAL_NO_DECLARADA"),
    ).toEqual([]);
  });

  it("por ámbito (AU-S2-B54): una condición de caso no lee claves de sesión, un detector de sesión no lee señales del caso, y la métrica también se valida", () => {
    const p = JSON.parse(JSON.stringify(v13)) as Obj;
    const c = arr(p, "criterios_aceptacion")[0] as Obj;
    (c.regla_de_medicion as Obj).poblacion = "limites_alcanzados == 0";
    const c7 = arr(p, "criterios_aceptacion").find(
      (x) => (x as Obj).id === "C7",
    ) as Obj;
    (c7.regla_de_medicion as Obj).metrica = "latencia_inventada_s";
    const r8 = arr(p, "riesgos").find((x) => (x as Obj).id === "R8") as Obj;
    (r8.detector_en_trazas as Obj).condicion = "decision_final == 'negar'";
    const avisos = validarPlan(p)
      .advertencias.filter((m) => m.codigo === "SENAL_NO_DECLARADA")
      .map((m) => m.elemento);
    expect(avisos).toEqual(
      expect.arrayContaining(["C1.poblacion", "C7.metrica", "R8.condicion"]),
    );
    // R8 tal como está en el plan (sesión, `limites_alcanzados`) no se advierte.
    expect(
      validarPlan(v13).advertencias.filter(
        (m) => m.codigo === "SENAL_NO_DECLARADA",
      ),
    ).toEqual([]);
  });

  it("una función de arista no registrada, o con otras entradas, es una referencia rota", () => {
    const conFuncion = (f: Obj) => {
      const p = JSON.parse(JSON.stringify(v13)) as Obj;
      const a = (contrato(p).aristas_condicionales as Obj[]).find(
        (x) => x.funcion !== undefined,
      )!;
      a.funcion = f;
      return codigos(p);
    };
    expect(
      conFuncion({
        nombre: "otra_funcion",
        entradas: ["modo_texas", "propuesta"],
      }),
    ).toContainEqual(["REFERENCIA_ROTA", expect.stringContaining("decision")]);
    expect(
      conFuncion({
        nombre: "texas_y_no_aprobar",
        entradas: ["propuesta", "modo_texas"],
      }),
    ).toContainEqual(["REFERENCIA_ROTA", expect.stringContaining("decision")]);
  });

  it("una condición que llama a una función que el verificador no registra es una referencia rota", () => {
    const p = JSON.parse(JSON.stringify(v13)) as Obj;
    const r = arr(p, "riesgos").find((x) => x.detector_en_trazas)!;
    (r.detector_en_trazas as Obj).condicion = "dato_inventado(caso) == 1";
    expect(codigos(p)).toContainEqual([
      "REFERENCIA_ROTA",
      `${r.id as string}.condicion`,
    ]);
  });
});
