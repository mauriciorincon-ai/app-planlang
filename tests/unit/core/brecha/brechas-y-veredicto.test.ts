/** RF-06.6 y RF-06.7 — brechas no previstas (con agente y paso) y el veredicto con sus motivos. */
import { describe, expect, it } from "vitest";
import { brechasNoPrevistas } from "../../../../core/brecha/brechas-no-previstas";
import { documentoVerificado } from "../../../../core/brecha/contexto";
import type { ResultadoContrato } from "../../../../core/brecha/contrato-grafo";
import type { ResultadoCriterio } from "../../../../core/brecha/criterios";
import type { ResultadoRiesgo } from "../../../../core/brecha/detectores";
import type { ResultadoSupuesto } from "../../../../core/brecha/supuestos";
import { veredicto } from "../../../../core/brecha/veredicto";
import type { Paso, Traza } from "../../../../core/formatos/traza";
import { planV11, vista } from "../../../helpers/vistas";

const paso = (
  orden: number,
  nodo: string,
  extra: Partial<Paso> = {},
): Paso => ({
  orden,
  nodo,
  tipo_nodo: "modelo",
  inicio_ms: 0,
  duracion_ms: 1,
  tokens: { entrada: 1, salida: 1 },
  costo_nominal_usd: 0,
  error_proveedor: null,
  reintentos_esquema: 0,
  ...extra,
});
const riesgo = (id: string, casos: string[]): ResultadoRiesgo =>
  ({ id, casos }) as unknown as ResultadoRiesgo;
const campos = {
  procedimiento: "P",
  diagnostico: "D",
  urgencia: false,
  costo_estimado: 1,
};

describe("brechas no previstas", () => {
  const plan = planV11();
  const base = {
    verdad_conocida: {
      presente: true,
      campos,
      debe_escalar: false,
      decision: "aprobar",
    },
    pausa_humana: false,
    decision_final: "aprobar",
    salida_final: "hola",
    severidad_accion: 0,
  };
  const malExtraido = vista(
    "A",
    { ...base, extraccion: { campos: { ...campos, costo_estimado: 2 } } },
    {
      pasos: [paso(1, "extractor"), paso(2, "extractor"), paso(3, "redactor")],
    } as Partial<Traza>,
  );
  it("una falla de evaluador que ningún riesgo cubrió, atribuida al último paso de su nodo", () => {
    const { brechas, evaluadores } = brechasNoPrevistas(
      plan,
      [malExtraido],
      [],
      "c",
    );
    expect(brechas).toEqual([
      expect.objectContaining({
        categoria: "evaluador",
        evaluador: "exactitud_extraccion",
        caso_id: "A",
        nodo: "extractor",
        paso: 2,
      }),
    ]);
    expect(
      evaluadores.find((e) => e.id === "exactitud_extraccion"),
    ).toMatchObject({ estado: "ejecutado", fallas: ["A"], casos_evaluados: 1 });
    expect(evaluadores.find((e) => e.id === "calidad_redaccion")?.estado).toBe(
      "no_ejecutado_opcional",
    );
  });
  it("si un riesgo que el evaluador cubre detectó el caso, no es brecha", () => {
    expect(
      brechasNoPrevistas(plan, [malExtraido], [riesgo("R5", ["A"])], "c")
        .brechas,
    ).toEqual([]);
  });
  it("errores del proveedor y reintentos sin riesgo que los cubra", () => {
    const v = vista("B", { ...base, extraccion: { campos } }, {
      pasos: [
        paso(1, "extractor", { reintentos_esquema: 2 }),
        paso(2, "redactor", { error_proveedor: "timeout" }),
      ],
    } as Partial<Traza>);
    const { brechas } = brechasNoPrevistas(plan, [v], [], "c");
    expect(brechas.map((b) => `${b.categoria}@${b.nodo}:${b.paso}`)).toEqual([
      "error_proveedor@redactor:2",
      "reintento_de_esquema@extractor:1",
    ]);
    expect(brechas[1]?.detalle.en).toMatch(/2 retries, with their cost/);
    expect(brechas.every((b) => b.corrida_id === "c")).toBe(true);
    // Solo el riesgo que mira la falla la cubre (M-21): R8 mira error_proveedor, R2 no mira ninguna.
    expect(
      brechasNoPrevistas(plan, [v], [riesgo("R8", ["B"])], "c").brechas.map(
        (b) => b.categoria,
      ),
    ).toEqual(["reintento_de_esquema"]);
    expect(
      brechasNoPrevistas(plan, [v], [riesgo("R2", ["B"])], "c").brechas.map(
        (b) => b.categoria,
      ),
    ).toEqual(["error_proveedor", "reintento_de_esquema"]);
  });
  it("un evaluador cuya regla no puede medir se reporta mal formado, no «ejecutado» (AU-7)", () => {
    const sinClave = vista(
      "S",
      {
        ...base,
        extraccion: {
          campos: { procedimiento: "X", diagnostico: "D", urgencia: false },
        },
      },
      { pasos: [paso(1, "extractor")] } as Partial<Traza>,
    );
    const { brechas, evaluadores } = brechasNoPrevistas(
      plan,
      [sinClave],
      [],
      "c",
    );
    expect(
      evaluadores.find((e) => e.id === "exactitud_extraccion")?.estado,
    ).toBe("mal_formado");
    expect(
      brechas.find((b) => b.evaluador === "exactitud_extraccion")?.detalle.es,
    ).toMatch(/no pudo medir/);
  });
  it("una salida «rechazar» sin pausa también falla pausas_cumplidas (M-20)", () => {
    const rechazo = vista(
      "R",
      { ...base, decision_final: "rechazar", pausa_humana: false },
      { pasos: [paso(1, "redactor")] } as Partial<Traza>,
    );
    const { evaluadores } = brechasNoPrevistas(plan, [rechazo], [], "c");
    expect(
      evaluadores.find((e) => e.id === "pausas_cumplidas")?.fallas,
    ).toEqual(["R"]);
  });
  it("con el modo Texas, una aprobación en parte sin pausa falla pausas_cumplidas; sin él, no (plan v1.5, R10)", () => {
    const parcial = (id: string, modo_texas: boolean) =>
      vista(
        id,
        {
          ...base,
          decision_final: "aprobar_parcial",
          pausa_humana: false,
          modo_texas,
        },
        { pasos: [paso(1, "redactor")] } as Partial<Traza>,
      );
    const { evaluadores } = brechasNoPrevistas(
      plan,
      [parcial("T", true), parcial("S", false)],
      [],
      "c",
    );
    expect(
      evaluadores.find((e) => e.id === "pausas_cumplidas")?.fallas,
    ).toEqual(["T"]);
  });
  it("M-15: el verificador recalcula completo e idiomas del documento adverso, no le cree al emisor", () => {
    const doc = {
      decision: "aprobar_parcial",
      servicio: { codigo: "SYN-P-001", nombre: { es: "x", en: "x" } },
      causal: { id: "tope_cobertura", resumen: { es: "y", en: "" } },
      regla_disparada: { id: "RB-08", texto: { es: "z", en: "z" } },
      datos_usados: [{ campo: "costo_estimado", valor: 850 }],
      version: { plan: { id: "p" } },
      via_de_contradiccion: { es: "v", en: "v" },
      decidido_por: { es: "d", en: "d" },
      aviso_ia: { es: "a", en: "a" },
      completo: true,
      idiomas: ["es", "en"],
    };
    // Sin monto (lo exige la parcial) y con un texto vacío en inglés: lo declarado no cuenta.
    expect(documentoVerificado(doc)).toMatchObject({
      completo: false,
      idiomas: ["es"],
    });
    expect(
      documentoVerificado({
        ...doc,
        monto: { aprobado: 590 },
        causal: { id: "t", resumen: { es: "y", en: "y" } },
      }),
    ).toMatchObject({ completo: true, idiomas: ["es", "en"] });
    expect(documentoVerificado(null)).toBeNull();
  });
  it("un juez requerido que no corrió y una regla sin implementación se reportan", () => {
    const p = planV11();
    p.contrato_de_grafo.evaluadores_requeridos = [
      { id: "juez", tipo: "juez_modelo", riesgos_cubiertos: [] },
      { id: "regla_inventada", tipo: "regla", riesgos_cubiertos: [] },
    ];
    const { brechas, evaluadores } = brechasNoPrevistas(p, [], [], "c");
    expect(evaluadores.map((e) => e.estado)).toEqual([
      "no_ejecutado",
      "sin_implementacion",
    ]);
    expect(brechas.map((b) => b.categoria)).toEqual([
      "evaluador_no_ejecutado",
      "evaluador_no_ejecutado",
    ]);
  });
});

describe("veredicto", () => {
  const crit = (
    id: string,
    estado: ResultadoCriterio["estado"],
    tipo: ResultadoCriterio["tipo"] = "absoluto",
  ) => ({ id, estado, tipo }) as ResultadoCriterio;
  const rie = (id: string, estado: ResultadoRiesgo["estado"], severidad = 5) =>
    ({ id, estado, severidad }) as ResultadoRiesgo;
  const sup = (id: string, estado: ResultadoSupuesto["estado"]) =>
    ({ id, estado }) as ResultadoSupuesto;
  const contrato = (bloqueantes: number): ResultadoContrato =>
    ({
      hallazgos: Array.from({ length: bloqueantes }, () => ({
        severidad: "bloqueante",
      })),
    }) as unknown as ResultadoContrato;

  it("cumple cuando nada bloquea ni alerta", () => {
    expect(
      veredicto(
        [crit("C1", "cumple")],
        [rie("R1", "no_ocurrio")],
        [sup("S1", "confirmado")],
        contrato(0),
        [],
      ),
    ).toEqual({ valor: "cumple", bloqueantes: [], alertas: [] });
  });
  it("no cumple: absoluto incumplido, riesgo de severidad ≥ 9, contrato roto", () => {
    const v = veredicto(
      [crit("C1", "incumple")],
      [rie("R2", "ocurrio", 10)],
      [],
      contrato(2),
      [],
    );
    expect(v.valor).toBe("no_cumple");
    expect(v.bloqueantes.map((b) => b.es)).toEqual([
      "C1: criterio absoluto incumplido.",
      "R2: ocurrió un riesgo de severidad 10.",
      "Contrato de grafo: 2 hallazgo(s) bloqueante(s).",
    ]);
  });
  it("cumple con alertas: cada motivo nombrado", () => {
    const v = veredicto(
      [
        crit("C5", "incompleto", "tasa"),
        crit("C7", "incumple", "latencia"),
        crit("C3", "sin_poblacion"),
        crit("C8", "indeterminado"),
        crit("C9", "mal_formado"),
      ],
      [
        rie("R4", "ocurrio"),
        rie("R5", "mal_formado"),
        rie("R6", "indeterminado"),
      ],
      [sup("S1", "refutado")],
      contrato(0),
      [{} as never],
    );
    expect(v.valor).toBe("cumple_con_alertas");
    expect(v.alertas.map((a) => a.es.split(":")[0])).toEqual([
      "C5",
      "C7",
      "C3",
      "C8",
      "C9",
      "R4",
      "R5",
      "R6",
      "S1",
      "1 brecha(s) no prevista(s) por el plan.",
    ]);
  });
  it("lo que no se pudo medir alerta: supuesto crítico sin probar, riesgo sin población, alertas del contrato y riesgos de las repeticiones (AU-2, AU-3)", () => {
    const critico = {
      id: "S1",
      estado: "sin_probar",
      criticidad: "alta",
    } as ResultadoSupuesto;
    const medio = {
      id: "S2",
      estado: "sin_probar",
      criticidad: "media",
    } as ResultadoSupuesto;
    const conAlerta = {
      hallazgos: [{ severidad: "alerta" }],
    } as unknown as ResultadoContrato;
    const v = veredicto(
      [crit("C1", "cumple")],
      [rie("R3", "sin_poblacion")],
      [critico, medio],
      conAlerta,
      [],
      [
        {
          id: "x-r2",
          riesgos: [rie("R4", "ocurrio"), rie("R2", "ocurrio", 10)],
        },
      ],
    );
    expect(v.valor).toBe("no_cumple");
    expect(v.bloqueantes.map((b) => b.es)).toEqual([
      "R2: ocurrió en la repetición x-r2.",
    ]);
    expect(v.alertas.map((a) => a.es)).toEqual([
      "R3: ningún caso del lote puso a prueba su detector.",
      "R4: ocurrió en la repetición x-r2.",
      "S1: supuesto crítico sin probar.",
      "Contrato de grafo: 1 alerta(s).",
    ]);
  });
});

describe("AU-S2-B50: lo que el modelo dejó sin medir es una alerta", () => {
  it("la corrida de respaldo (el modelo no respondió en 3 casos) alerta en C3 y en R5; la de 200, con nulos legítimos, no", async () => {
    const { generarInforme, fueraPorElProveedor } =
      await import("../../../../core/brecha/informe");
    const { entradaDesdeDisco, hermanas } =
      await import("../../../../scripts/_corridas");
    const ruta = "runs/demo-a/simulado-v1.4-respaldo";
    const inf = await generarInforme(entradaDesdeDisco(ruta, hermanas(ruta)));
    const alertas = inf.veredicto.alertas.map((a) => a.es);
    expect(alertas).toContain(
      "C3: 3 caso(s) quedaron fuera de su población porque el modelo no respondió; ahí no se verificó.",
    );
    expect(alertas.some((a) => a.startsWith("R5: "))).toBe(true);
    expect(fueraPorElProveedor(planV11(), [])).toEqual([]);
    const de200 = "runs/demo-a/suscripcion-planlang-a-001-200-v1.4";
    const inf200 = await generarInforme(
      entradaDesdeDisco(de200, hermanas(de200)),
    );
    expect(
      inf200.veredicto.alertas.some((a) =>
        a.es.includes("el modelo no respondió"),
      ),
    ).toBe(false);
  });
});
