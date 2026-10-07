/**
 * M-20: los evaluadores de tipo `regla` se miden con el registro de SU dominio y atribuyen la falla a un nodo de ese
 * dominio. El A conserva sus reglas byte a byte (los informes publicados no cambian: los vigila el manifiesto); el B
 * mide sus tres evaluadores sobre la corrida real sin un solo caso «no evaluable».
 */
import { describe, expect, it } from "vitest";
import { brechasNoPrevistas } from "../../../../core/brecha/brechas-no-previstas";
import {
  EVALUADORES_POR_DOMINIO,
  reglaDeEvaluador,
} from "../../../../core/brecha/evaluadores";
import { generarInforme } from "../../../../core/brecha/informe";
import { entradaDesdeDisco } from "../../../../scripts/_corridas";

const CORRIDA_B = "runs/demo-b/suscripcion-planlang-b-001-20";

describe("registro de evaluadores por dominio (M-20)", () => {
  it("cada dominio declara exactamente los evaluadores de regla que exige su plan", () => {
    expect(Object.keys(EVALUADORES_POR_DOMINIO)).toEqual([
      "dom-salud",
      "dom-financiero",
    ]);
    expect(Object.keys(EVALUADORES_POR_DOMINIO["dom-financiero"]!)).toEqual([
      "pausas_cumplidas",
      "expediente_con_cita",
      "inyeccion_neutralizada",
    ]);
    expect(reglaDeEvaluador("dom-financiero", "exactitud_extraccion")).toBe(
      undefined,
    );
    expect(reglaDeEvaluador("dom-salud", "toString")).toBe(undefined);
  });

  it("el B mide sus tres evaluadores sobre la corrida real: ejecutados, sin fallas y sin no evaluables", async () => {
    const inf = await generarInforme(
      entradaDesdeDisco(CORRIDA_B, { plan: "plans/demo-b/v1.1.json" }),
    );
    expect(
      inf.brechas_no_previstas.evaluadores.map(
        (e) =>
          `${e.id}:${e.estado}:${e.casos_evaluados}:${e.fallas.length}:${e.no_evaluables}`,
      ),
    ).toEqual([
      "pausas_cumplidas:ejecutado:20:0:0",
      "expediente_con_cita:ejecutado:20:0:0",
      "inyeccion_neutralizada:ejecutado:1:0:0",
    ]);
    expect(inf.brechas_no_previstas.brechas).toEqual([]);
  });

  it("una falla del B se atribuye a un nodo del B; un dominio sin registro deja sus evaluadores sin implementación", async () => {
    const entrada = entradaDesdeDisco(CORRIDA_B, {
      plan: "plans/demo-b/v1.1.json",
    });
    const inf = await generarInforme(entrada);
    expect(inf.brechas_no_previstas.evaluadores.length).toBe(3);
    // Un expediente con una conclusión sin cita: falla de `expediente_con_cita`, atribuida al redactor del B.
    const { leerEntrada } = await import("../../../../core/brecha/lector");
    const { vistasDeCorrida } = await import("../../../../core/brecha/contexto");
    const leida = await leerEntrada(entrada);
    const umbrales = leida.corrida.manifiesto.umbrales_aplicados;
    const trazas = leida.corrida.trazas.map((t) =>
      t.caso_id === "B-003"
        ? { ...t, senales: { ...t.senales, conclusiones_sin_cita: 1 } }
        : t,
    );
    const vistas = vistasDeCorrida(trazas, leida.casos, umbrales);
    const r = brechasNoPrevistas(leida.plan, vistas, [], "c");
    expect(
      r.brechas.map((b) => `${b.evaluador}:${b.caso_id}:${b.nodo}`),
    ).toEqual(["expediente_con_cita:B-003:redactor"]);
    const ajeno = brechasNoPrevistas(
      { ...leida.plan, dominio_id: "dom-otro" },
      vistas,
      [],
      "c",
    );
    expect(ajeno.evaluadores.map((e) => e.estado)).toEqual([
      "sin_implementacion",
      "sin_implementacion",
      "sin_implementacion",
    ]);
  });
});
