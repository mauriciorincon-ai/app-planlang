/** RF-06.7 — el informe § 12: determinista, honesto con lo que no midió, y legible por quien decide. */
import { describe, expect, it } from "vitest";
import { evaluarCriterios } from "../../../../core/brecha/criterios";
import {
  criteriosDestacados,
  generarInforme,
  resumenDelInforme,
} from "../../../../core/brecha/informe";
import { mutarTraza, SIEMBRAS } from "../../../../core/brecha/m9";
import type { ResultadoRiesgo } from "../../../../core/brecha/detectores";
import type { ResultadoVeredicto } from "../../../../core/brecha/veredicto";
import { presupuestoLiderBilingue } from "../../../../core/formatos/jerga";
import {
  entradaReal,
  entradaRealV12,
  entradaSimulada,
  repeticionDe,
} from "../../../helpers/corridas";
import { criterio, planV11, vista } from "../../../helpers/vistas";

describe("informe de la corrida simulada", () => {
  it("dos ejecuciones → la misma huella (sin reloj ni azar)", async () => {
    const a = await generarInforme(entradaSimulada());
    const b = await generarInforme(entradaSimulada());
    expect(a.huella).toBe(b.huella);
    expect(a.fecha).toBe("2026-09-27");
  });
  it("veredicto, secciones y ficha", async () => {
    const i = await generarInforme(entradaSimulada());
    expect(i.veredicto.valor).toBe("cumple_con_alertas");
    expect(i.criterios.map((c) => c.id)).toEqual([
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
      "C7",
      "C8",
      "C9",
    ]);
    // Plan v1.2: el detector de R5 ya es una regla bien formada y se mide.
    expect(i.riesgos.find((r) => r.id === "R5")?.estado).toBe("no_ocurrio");
    expect(i.plan_en_breve.decisiones_una_via.map((d) => d.id)).toEqual([
      "D1",
      "D2",
    ]);
    expect(i.casos_ejemplares.exitoso?.caso_id).toBe("AH-001");
    expect(i.casos_ejemplares.adversario_neutralizado?.caso_id).toBe("AH-003");
    expect(
      i.playground.umbrales.find((u) => u.id === "U1")?.casos_en_el_umbral,
    ).toEqual(["AH-002"]);
    expect(i.playground.umbrales.find((u) => u.id === "U4")).toMatchObject({
      rango: "booleano",
      casos_en_el_umbral: [],
      observados: { verdaderos: 0, n: 3 },
    });
    expect(i.ficha_reproducibilidad).toMatchObject({
      linea_base: null,
      repeticiones: [],
      umbrales_aplicados: { U1: 0.75 },
      verificador: { version: "1.0.0" },
    });
  });
  it("el resumen y la recomendación respetan el presupuesto de líder en ES y EN", async () => {
    const i = await generarInforme(entradaSimulada());
    for (const t of [i.resumen.texto, i.resumen.recomendacion])
      expect(presupuestoLiderBilingue(t)).toMatchObject({ ok: true });
  });
});

describe("repeticiones y línea base", () => {
  it("con dos repeticiones idénticas C5 deja de estar incompleto; la ficha las lista", async () => {
    const e = entradaSimulada();
    const i = await generarInforme({
      ...e,
      repeticiones: [
        await repeticionDe(e, "simulado-3casos-r2"),
        await repeticionDe(e, "simulado-3casos-r3"),
      ],
    });
    expect(i.criterios.find((c) => c.id === "C5")).toMatchObject({
      estado: "cumple",
      k: { observado: 3 },
    });
    expect(
      i.ficha_reproducibilidad.repeticiones.map((r) => r.corrida_id),
    ).toEqual(["simulado-3casos-r2", "simulado-3casos-r3"]);
    expect(i.contrato_de_grafo.rf_09_2).toHaveLength(3);
  });
  it("la corrida real se compara con su línea base (S3)", async () => {
    const i = await generarInforme(entradaReal());
    const s3 = i.supuestos.find((s) => s.id === "S3");
    expect(s3?.estado).toBe("confirmado");
    expect(s3?.comparacion?.presupuesto_respetado).toBe(true);
    expect(i.ficha_reproducibilidad.linea_base?.corrida_id).toBe(
      "suscripcion-planlang-a-001-20-base",
    );
    // Historia v1.1: el detector de R5 estaba mal formado y el informe lo sigue diciendo.
    expect(i.riesgos.find((r) => r.id === "R5")?.estado).toBe("mal_formado");
  });
  it("bajo el plan v1.2 el mismo lote cierra C5 con k = 3 y mide R5, S1 y S2", async () => {
    const i = await generarInforme(entradaRealV12());
    const c5 = i.criterios.find((c) => c.id === "C5");
    expect(c5).toMatchObject({
      estado: "cumple",
      k: { requerido: 3, observado: 3 },
    });
    expect(i.riesgos.find((r) => r.id === "R5")?.estado).toBe("no_ocurrio");
    const estados = Object.fromEntries(
      i.supuestos.map((s) => [s.id, s.estado]),
    );
    expect(estados).toEqual({
      S1: "sin_probar",
      S2: "confirmado",
      S3: "refutado",
    });
    expect(
      i.supuestos.find((s) => s.id === "S3")?.limitaciones[0]?.es,
    ).toMatch(/A-012 \(esquema_invalido\)/);
  });
});

describe("casos ejemplares", () => {
  it("una negación sin pausa sembrada aparece como caso fallido, nombrando lo que falló", async () => {
    const siembra = SIEMBRAS.find((s) => s.id === "negacion_sin_pausa")!;
    const i = await generarInforme(await siembra.aplicar(entradaSimulada()));
    expect(i.veredicto.valor).toBe("no_cumple");
    expect(i.casos_ejemplares.fallido).toMatchObject({ caso_id: "AH-003" });
    expect(i.casos_ejemplares.fallido?.por_que.es).toMatch(/C1/);
    expect(presupuestoLiderBilingue(i.resumen.recomendacion)).toMatchObject({
      ok: true,
    });
  });
  it("una decisión equivocada que ninguna regla nombra se explica contra la verdad conocida", async () => {
    const e = await mutarTraza(entradaReal(), "A-004", (t) => {
      (t["senales"] as Record<string, unknown>)["decision_final"] = "aprobar";
    });
    const i = await generarInforme(e);
    expect(i.casos_ejemplares.fallido).toMatchObject({ caso_id: "A-004" });
    expect(i.casos_ejemplares.fallido?.por_que.en).toMatch(
      /the known truth was «negar»/,
    );
  });
});

describe("resumen para quien decide", () => {
  const plan = planV11();
  const v = (valor: ResultadoVeredicto["valor"]): ResultadoVeredicto => ({
    valor,
    bloqueantes: [],
    alertas: [],
  });
  const criterios = evaluarCriterios(
    {
      ...plan,
      criterios_aceptacion: [
        criterio("C1", {
          poblacion: "todos",
          condicion: "ok",
          agregacion: "todos_cumplen",
        }),
      ],
    },
    [vista("1", { ok: true })],
  );
  it.each(["cumple", "cumple_con_alertas", "no_cumple"] as const)(
    "%s: texto y recomendación dentro del presupuesto",
    (valor) => {
      const r = resumenDelInforme(
        plan,
        20,
        v(valor),
        criterios,
        [{ id: "R2", estado: "ocurrio", severidad: 10 } as ResultadoRiesgo],
        [],
        valor === "cumple" ? 0 : 2,
      );
      expect(presupuestoLiderBilingue(r.texto)).toMatchObject({ ok: true });
      expect(presupuestoLiderBilingue(r.recomendacion)).toMatchObject({
        ok: true,
      });
      expect(r.riesgos_ocurridos).toEqual(["R2"]);
    },
  );
  it("las brechas solas también se recomiendan revisar", () => {
    const r = resumenDelInforme(
      plan,
      3,
      v("cumple_con_alertas"),
      criterios,
      [],
      [],
      1,
    );
    expect(r.recomendacion.es).toMatch(/revise las brechas no previstas\.$/);
    expect(r.recomendacion.en).toMatch(/review the unforeseen gaps\.$/);
  });
  it("los tres criterios destacados: absolutos incumplidos primero, luego por gravedad y orden del plan", () => {
    const cs = [
      { id: "A", estado: "cumple", tipo: "absoluto" },
      { id: "B", estado: "incompleto", tipo: "tasa" },
      { id: "C", estado: "incumple", tipo: "latencia" },
      { id: "D", estado: "incumple", tipo: "absoluto" },
      { id: "E", estado: "sin_poblacion", tipo: "absoluto" },
    ] as unknown as Parameters<typeof criteriosDestacados>[0];
    expect(criteriosDestacados(cs)).toEqual(["D", "C", "B"]);
  });
});

describe("criterio de aceptación de M6", () => {
  it("alterar un solo valor de una traza cambia exactamente los criterios y riesgos que dependen de él", async () => {
    const limpio = await generarInforme(entradaSimulada());
    const siembra = SIEMBRAS.find((s) => s.id === "dato_sensible_en_salida")!;
    const sembrado = await generarInforme(
      await siembra.aplicar(entradaSimulada()),
    );
    const distintos = <T extends { id: string; estado: string }>(
      a: T[],
      b: T[],
    ) => a.filter((x, k) => x.estado !== b[k]?.estado).map((x) => x.id);
    expect(distintos(limpio.criterios, sembrado.criterios)).toEqual(["C2"]);
    expect(distintos(limpio.riesgos, sembrado.riesgos)).toEqual(["R2"]);
    expect(distintos(limpio.supuestos, sembrado.supuestos)).toEqual([]);
  });
});
