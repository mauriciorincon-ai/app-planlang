/** RF-06.4 — los supuestos se miden y solo se deciden con un umbral numérico que pueda fallar. */
import { describe, expect, it } from "vitest";
import {
  acotadaPorElGrafo,
  evaluarSupuestos,
  presupuestoDe,
} from "../../../../core/brecha/supuestos";
import type { Paso, Traza } from "../../../../core/formatos/traza";
import { planV11, supuesto, vista } from "../../../helpers/vistas";

const U = { U1: 0.75, U2: 1000, U3: 2, U4: false };
const campos = {
  procedimiento: "SYN-P-001",
  diagnostico: "SYN-D-01",
  urgencia: false,
  costo_estimado: 100,
};
const extraido = (confianza: number, ok: boolean, id: string) =>
  vista(id, {
    senal_confianza: confianza,
    extraccion: {
      campos: ok ? campos : { ...campos, costo_estimado: 1 },
      campos_faltantes: [],
      confianza,
      costo_estimado: 100,
      urgencia: false,
    },
    verdad_conocida: { presente: true, campos },
  });
const conSupuestos = (...ss: ReturnType<typeof supuesto>[]) => ({
  ...planV11(),
  supuestos: ss,
});

describe("calibración (S1)", () => {
  const vs = [
    extraido(0.9, true, "1"),
    extraido(0.95, true, "2"),
    extraido(0.6, false, "3"),
    extraido(0.8, true, "4"),
  ];
  const s1 = (umbral?: Record<string, number>) =>
    supuesto("S1", {
      metricas: ["ece", "auroc", "curva_riesgo_cobertura"],
      poblacion: "verdad_conocida.presente",
      ...(umbral ? { umbral_confirmacion: umbral } : {}),
    });
  it("sin umbral numérico: mide y no decide", () => {
    const [r] = evaluarSupuestos(conSupuestos(s1()), vs, U, null);
    expect(r).toMatchObject({
      estado: "sin_probar",
      n: 4,
      metricas: { auroc: 1, exactitud: 0.75 },
    });
    expect(r?.curva?.length).toBe(10);
    expect(r?.limitaciones.map((l) => l.es).join()).toMatch(/Muestra pequeña/);
  });
  it("con umbral: confirma o refuta; sin valor medido no decide", () => {
    expect(
      evaluarSupuestos(
        conSupuestos(s1({ auroc_min: 0.75, ece_max: 0.5 })),
        vs,
        U,
        null,
      )[0]?.estado,
    ).toBe("confirmado");
    const [r] = evaluarSupuestos(
      conSupuestos(s1({ ece_max: 0.01 })),
      vs,
      U,
      null,
    );
    expect(r).toMatchObject({ estado: "refutado" });
    expect(r?.motivo.es).toMatch(/ece_max/);
    const todos = [extraido(0.9, true, "1"), extraido(0.8, true, "2")];
    const [r2] = evaluarSupuestos(
      conSupuestos(s1({ auroc_min: 0.75 })),
      todos,
      U,
      null,
    );
    expect(r2?.estado).toBe("sin_probar");
    expect(r2?.limitaciones[0]?.es).toMatch(/todos aciertos/);
  });
  it("una métrica sin valor no esconde otra que refuta (AU-1)", () => {
    const [r] = evaluarSupuestos(
      conSupuestos(s1({ auroc_min: 0.75, ece_max: 0.1 })),
      [extraido(0.55, true, "1"), extraido(0.55, true, "2")],
      U,
      null,
    );
    expect(r?.metricas.auroc).toBeNull();
    expect(r?.estado).toBe("refutado");
    expect(r?.motivo.es).toBe(
      "No cumple el umbral de confirmación: ece_max. Sin valor medido: auroc.",
    );
    expect(r?.motivo.en).toBe(
      "It misses the confirmation threshold: ece_max. No measured value: auroc.",
    );
  });
  it("si su regla no puede medir, el supuesto lo dice y no culpa a la falta de valor (AU-7)", () => {
    const sinClave = vista("X", {
      senal_confianza: 0.9,
      extraccion: {
        campos: { procedimiento: "X", diagnostico: "D", urgencia: false },
      },
      verdad_conocida: { presente: true, campos },
    });
    const [r] = evaluarSupuestos(
      conSupuestos(s1({ auroc_min: 0.75, ece_max: 0.1 })),
      [sinClave],
      U,
      null,
    );
    expect(r?.estado).toBe("sin_probar");
    expect(r?.motivo.es).toMatch(/^La regla del supuesto no pudo medir: /);
  });
  it("todos fallos y métricas no pedidas", () => {
    const [r] = evaluarSupuestos(
      conSupuestos(
        supuesto("S", {
          metricas: ["ece"],
          poblacion: "verdad_conocida.presente",
        }),
      ),
      [extraido(0.9, false, "1")],
      U,
      null,
    );
    expect(r?.metricas).toMatchObject({ auroc: null, exactitud: 0 });
    expect(r?.curva).toBeNull();
    expect(r?.limitaciones[0]?.en).toMatch(/all failures/);
  });
});

describe("tasa (S2) y la pregunta «¿puede fallar?»", () => {
  const s2 = supuesto("S2", {
    metricas: ["tasa"],
    poblacion: "tipo == 'faltante'",
    condicion: "ciclos_aclaracion <= 2",
    umbral_confirmacion: { tasa_min: 0.95 },
  });
  const vs = [
    vista("1", { tipo: "faltante", ciclos_aclaracion: 2 }),
    vista("2", { tipo: "faltante", ciclos_aclaracion: 1 }),
  ];
  it("con U3 = 2 la condición «<= 2» no puede fallar: queda sin probar y lo dice", () => {
    const [r] = evaluarSupuestos(conSupuestos(s2), vs, U, null);
    expect(r).toMatchObject({ estado: "sin_probar", metricas: { tasa: 1 } });
    expect(r?.motivo.es).toMatch(/no puede fallar/);
    expect(acotadaPorElGrafo("ciclos_aclaracion <= 2", planV11(), U)).toEqual({
      senal: "ciclos_aclaracion",
      valor: "umbral.U3",
      cota: 2,
    });
  });
  it("con U3 = 4 sí puede fallar y se decide con el umbral", () => {
    const U4 = { ...U, U3: 4 };
    expect(
      acotadaPorElGrafo("ciclos_aclaracion <= 2", planV11(), U4),
    ).toBeNull();
    expect(evaluarSupuestos(conSupuestos(s2), vs, U4, null)[0]?.estado).toBe(
      "confirmado",
    );
    expect(
      evaluarSupuestos(
        conSupuestos(s2),
        [...vs, vista("3", { tipo: "faltante", ciclos_aclaracion: 3 })],
        U4,
        null,
      )[0]?.estado,
    ).toBe("refutado");
  });
  it("otras formas no se consideran acotadas", () => {
    expect(acotadaPorElGrafo("ciclos_aclaracion < 2", planV11(), U)).toBeNull();
    expect(acotadaPorElGrafo("ciclos_aclaracion < 3", planV11(), U)?.cota).toBe(
      2,
    );
    expect(acotadaPorElGrafo("otra <= 2", planV11(), U)).toBeNull();
    expect(
      acotadaPorElGrafo("ciclos_aclaracion == 2", planV11(), U),
    ).toBeNull();
    expect(acotadaPorElGrafo("senal_confianza <= 2", planV11(), U)).toBeNull();
  });
  it("sin población y sin medible", () => {
    const sinUmbral = supuesto("S", {
      metricas: ["tasa"],
      poblacion: "tipo == 'faltante'",
      condicion: "ok",
    });
    expect(
      evaluarSupuestos(
        conSupuestos(sinUmbral),
        [vista("1", { tipo: "normal" })],
        U,
        null,
      )[0]?.motivo.es,
    ).toMatch(/Ningún caso/);
    expect(
      evaluarSupuestos(
        conSupuestos(sinUmbral),
        [vista("1", { tipo: "faltante", ok: true })],
        U,
        null,
      )[0]?.estado,
    ).toBe("sin_probar");
    expect(
      evaluarSupuestos(conSupuestos(supuesto("S", undefined)), [], U, null)[0]
        ?.motivo.es,
    ).toMatch(/no declara cómo medirlo/);
  });
});

describe("comparación con la línea base (S3)", () => {
  const s3 = supuesto("S3", {
    metricas: ["exactitud", "latencia_mediana"],
    poblacion: "todos",
    comparacion: "linea_base_agente_unico",
  });
  const paso = (tokens: number, costo: number, reintentos = 0): Paso => ({
    orden: 1,
    nodo: "m",
    tipo_nodo: "modelo",
    inicio_ms: 0,
    duracion_ms: 1,
    tokens: { entrada: tokens, salida: 0 },
    costo_nominal_usd: costo,
    error_proveedor: null,
    reintentos_esquema: reintentos,
  });
  const caso = (id: string, bien: boolean, lat: number, pasos: Paso[]) =>
    vista(
      id,
      {
        decision_final: bien ? "aprobar" : "negar",
        pausa_humana: false,
        latencia_total_s: lat,
        verdad_conocida: { decision: "aprobar", debe_escalar: false },
      },
      { pasos } as Partial<Traza>,
    );
  const multi = [
    caso("1", true, 10, [paso(100, 0.1, 1)]),
    caso("2", true, 12, [paso(100, 0.1), paso(0, 0)]),
  ];
  it("sin corrida base: sin probar", () => {
    expect(
      evaluarSupuestos(conSupuestos(s3), multi, U, null)[0]?.motivo.es,
    ).toMatch(/No hay corrida de línea base/);
  });
  it("no peor en exactitud ni en latencia → confirmado, con presupuesto y casos que difieren", () => {
    const base = [
      caso("1", true, 11, [paso(50, 0.05)]),
      caso("2", false, 13, [paso(50, 0.05)]),
    ];
    const [r] = evaluarSupuestos(conSupuestos(s3), multi, U, {
      corrida_id: "b",
      vistas: base,
    });
    expect(r).toMatchObject({
      estado: "confirmado",
      comparacion: {
        exactitud: { multiagente: 1, agente_unico: 0.5 },
        presupuesto_respetado: true,
        casos_distintos: ["2"],
      },
    });
    expect(r?.comparacion?.presupuesto.multiagente).toEqual({
      llamadas_al_modelo: 3,
      tokens: 200,
      costo_nominal_usd: 0.2,
    });
  });
  it("peor en algo → refutado; base que gasta más → limitación", () => {
    const base = [
      caso("1", true, 5, [paso(500, 1)]),
      caso("2", true, 6, [paso(500, 1)]),
    ];
    const [r] = evaluarSupuestos(conSupuestos(s3), multi, U, {
      corrida_id: "b",
      vistas: base,
    });
    expect(r?.estado).toBe("refutado");
    expect(r?.motivo.es).toMatch(/latencia mediana/);
    expect(r?.limitaciones[0]?.es).toMatch(/gastó más/);
    const peorExactitud = [caso("1", false, 20, []), caso("2", true, 20, [])];
    expect(
      evaluarSupuestos(conSupuestos(s3), peorExactitud, U, {
        corrida_id: "b",
        vistas: base,
      })[0]?.motivo.en,
    ).toMatch(/accuracy and median latency/);
  });
  it("una base con error del proveedor lo declara; toda muestra < 30 lleva su nota", () => {
    const base = [
      caso("1", true, 11, [paso(50, 0.05)]),
      vista(
        "2",
        {
          decision_final: null,
          pausa_humana: false,
          latencia_total_s: 13,
          verdad_conocida: { decision: "aprobar", debe_escalar: false },
        },
        { pasos: [], error_proveedor: "esquema_invalido" } as Partial<Traza>,
      ),
    ];
    const [r] = evaluarSupuestos(conSupuestos(s3), multi, U, {
      corrida_id: "b",
      vistas: base,
    });
    expect(r?.limitaciones.map((l) => l.es)).toEqual([
      "La línea base terminó 1 caso(s) con error del proveedor, que cuentan como mal resueltos: 2 (esquema_invalido).",
      "Muestra pequeña (2 casos): la medida orienta, no prueba.",
    ]);
    const [s2] = evaluarSupuestos(
      conSupuestos(
        supuesto("S2", {
          metricas: ["tasa"],
          poblacion: "tipo == 'faltante'",
          condicion: "ok",
          umbral_confirmacion: { tasa_min: 0.95 },
        }),
      ),
      [vista("1", { tipo: "faltante", ok: true })],
      U,
      null,
    );
    expect(s2?.estado).toBe("confirmado");
    expect(s2?.limitaciones[0]?.en).toBe(
      "Small sample (1 cases): the measure guides, it does not prove.",
    );
  });
  it("dice su regla por defecto; sin latencia no decide; nombra casos distintos y respuestas inservibles", () => {
    const aviso = { es: "a", en: "a" };
    const conSalida = (id: string, es: string, en: string) =>
      vista(
        id,
        {
          decision_final: "aprobar",
          pausa_humana: false,
          latencia_total_s: 5,
          verdad_conocida: { decision: "aprobar", debe_escalar: false },
        },
        {
          pasos: [],
          salida_final: { es, en, aviso_ia: aviso },
        } as Partial<Traza>,
      );
    const base = [
      conSalida("1", "Aprobada.", '{"procedimiento": "X"}'),
      conSalida("3", "placeholder", "Approved."),
    ];
    const [r] = evaluarSupuestos(conSupuestos(s3), multi, U, {
      corrida_id: "b",
      vistas: base,
    });
    expect(r?.motivo.es).toMatch(/Regla por defecto del verificador/);
    expect(r?.motivo.en).toMatch(/Verifier default rule/);
    expect(r?.limitaciones.map((l) => l.es)).toEqual([
      "La línea base y el multiagente no corrieron los mismos casos: 2, 3.",
      "La línea base entregó 2 respuesta(s) al afiliado inservibles (vacías, JSON crudo o texto de relleno), que la comparación no penaliza: 1, 3.",
      "Muestra pequeña (2 casos): la medida orienta, no prueba.",
    ]);
    const sinLatencia = [
      vista("1", { decision_final: "aprobar", pausa_humana: false }, {
        pasos: [],
      } as Partial<Traza>),
    ];
    const [r2] = evaluarSupuestos(conSupuestos(s3), multi, U, {
      corrida_id: "b",
      vistas: sinLatencia,
    });
    expect(r2?.estado).toBe("sin_probar");
    expect(r2?.motivo.es).toMatch(/Falta la latencia mediana/);
  });
  it("presupuestoDe no cuenta pasos de modelo que no gastaron nada", () => {
    expect(
      presupuestoDe([
        { pasos: [paso(0, 0), paso(10, 0, 2)] } as unknown as Traza,
      ]),
    ).toEqual({ llamadas_al_modelo: 3, tokens: 10, costo_nominal_usd: 0 });
  });
});
