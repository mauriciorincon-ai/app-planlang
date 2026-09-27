/** RF-06.5 — el contrato de grafo contra las trazas, y RF-09.2 integrado al verificador. */
import { describe, expect, it } from "vitest";
import {
  ramasResueltas,
  verificarContrato,
} from "../../../../core/brecha/contrato-grafo";
import type { CorridaLeida } from "../../../../core/brecha/lector";
import { copia, leidaSimulada } from "../../../helpers/corridas";

async function simulada(): Promise<{
  plan: Awaited<ReturnType<typeof leidaSimulada>>["plan"];
  c: CorridaLeida;
}> {
  const e = await leidaSimulada();
  return { plan: e.plan, c: copia(e.corrida) };
}
const codigos = (r: Awaited<ReturnType<typeof verificarContrato>>) =>
  r.hallazgos.map((h) => `${h.codigo}${h.caso_id ? `@${h.caso_id}` : ""}`);

describe("contrato de grafo sobre la corrida simulada limpia", () => {
  it("solo alerta de nodo no ejercitado (el lote de humo no pide aclaraciones); RF-09.2 coincide", async () => {
    const { plan, c } = await simulada();
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r)).toEqual(["NODO_NO_EJERCITADO"]);
    expect(r.hallazgos[0]?.severidad).toBe("alerta");
    expect(r.nodos.find((n) => n.id === "aclaracion")).toMatchObject({
      en_grafo: true,
      visitas: 0,
    });
    expect(r.senales.every((s) => s.presente_en === 3 && s.de === 3)).toBe(
      true,
    );
    expect(r.pausas).toMatchObject({
      nodo: "pausa_humana",
      rol: "auditor",
      casos_con_pausa: 1,
      pausas_registradas: 1,
    });
    expect(r.rf_09_2).toEqual([
      expect.objectContaining({
        corrida_id: "simulado-3casos",
        coincide: true,
        discrepancias: 0,
        visitas: 9,
      }),
    ]);
  });
  it("las ramas por defecto resueltas son las del grafo exportado por Python", async () => {
    const { plan, c } = await simulada();
    expect(ramasResueltas(plan)).toEqual(c.grafo.ramas_por_defecto);
  });
});

describe("hallazgos del grafo", () => {
  it("nodo ausente, aristas, ramas y pausas distintas", async () => {
    const { plan, c } = await simulada();
    c.grafo.nodos = c.grafo.nodos.filter((n) => n.id !== "redactor");
    c.grafo.aristas_condicionales = c.grafo.aristas_condicionales.slice(1);
    c.grafo.ramas_por_defecto = {
      ...c.grafo.ramas_por_defecto,
      decision: "pausa_humana",
    };
    c.grafo.pausas_humanas = [];
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r)).toEqual(
      expect.arrayContaining([
        "NODO_AUSENTE",
        "ARISTAS_DISTINTAS",
        "NODO_NO_DECLARADO@AH-001",
      ]),
    );
    expect(
      r.hallazgos.filter((h) => h.codigo === "ARISTAS_DISTINTAS"),
    ).toHaveLength(3);
  });
});

describe("hallazgos por traza", () => {
  it("señal faltante, rama no seguida y rama irreproducible", async () => {
    const { plan, c } = await simulada();
    const [t1, t2] = c.trazas;
    delete t1!.senales["modo_texas"];
    t2!.pasos[4]!.nodo = "pausa_humana";
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r)).toEqual(
      expect.arrayContaining([
        "SENAL_FALTANTE@AH-001",
        "RAMA_NO_SEGUIDA@AH-002",
      ]),
    );
  });
  it("pausa sin registro, rol distinto, payload incompleto y señal de pausa sin visita", async () => {
    const { plan, c } = await simulada();
    const t3 = c.trazas[2]!;
    t3.pausas_humanas[0]!.rol = "cajero";
    delete t3.pausas_humanas[0]!.payload["evidencia"];
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r)).toEqual(
      expect.arrayContaining([
        "ROL_DISTINTO@AH-003",
        "PAYLOAD_INCOMPLETO@AH-003",
      ]),
    );
    t3.pausas_humanas = [];
    c.trazas[0]!.senales["pausa_humana"] = true;
    const r2 = await verificarContrato(plan, c, []);
    expect(codigos(r2)).toEqual(
      expect.arrayContaining([
        "PAUSA_SIN_REGISTRO@AH-003",
        "PAUSA_SIN_REGISTRO@AH-001",
      ]),
    );
    expect(
      r2.hallazgos.find((h) => h.caso_id === "AH-001")?.detalle.en,
    ).toMatch(/never went through/);
  });
  it("una traza con error no exige seguir la rama de su última visita", async () => {
    const { plan, c } = await simulada();
    const t = c.trazas[0]!;
    t.resultado = "error";
    t.pasos = t.pasos.slice(0, 2);
    t.nodos_visitados = t.nodos_visitados.slice(0, 2);
    t.decisiones_de_arista = t.decisiones_de_arista.filter((d) => d.paso <= 2);
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r).filter((x) => x.startsWith("RAMA_NO_SEGUIDA"))).toEqual(
      [],
    );
  });
  it("un nodo que decide sin registro, o con el registro a medias, se nombra sin reventar (AU-6)", async () => {
    const { plan, c } = await simulada();
    const ah002 = c.trazas.find((t) => t.caso_id === "AH-002")!;
    ah002.decisiones_de_arista = ah002.decisiones_de_arista.filter(
      (d) => !(d.desde === "decision" && d.orden_arista === 2),
    );
    const ah001 = c.trazas.find((t) => t.caso_id === "AH-001")!;
    ah001.decisiones_de_arista = ah001.decisiones_de_arista.filter(
      (d) => d.desde !== "enrutador",
    );
    const r = await verificarContrato(plan, c, []);
    const sinRegistro = r.hallazgos.filter(
      (h) => h.codigo === "DECISION_SIN_REGISTRO",
    );
    expect(sinRegistro.map((h) => h.caso_id)).toEqual(["AH-001", "AH-002"]);
    expect(sinRegistro[1]?.detalle.es).toMatch(
      /^Paso 4 \(decision\): el nodo decide con 5 arista\(s\) y la traza registra 4/,
    );
    expect(r.rf_09_2[0]?.coincide).toBe(false);
  });
  it("una corrida que aplicó otros umbrales que el plan es un hallazgo bloqueante (AU-5)", async () => {
    const { plan, c } = await simulada();
    c.manifiesto = {
      ...c.manifiesto,
      umbrales_aplicados: { ...c.manifiesto.umbrales_aplicados, U1: 0.8 },
    };
    const r = await verificarContrato(plan, c, []);
    expect(
      r.hallazgos.find((h) => h.codigo === "UMBRAL_DISTINTO_DEL_PLAN"),
    ).toMatchObject({ severidad: "bloqueante", corrida_id: "simulado-3casos" });
  });
  it("deriva entre intérpretes: la huella de Python no coincide", async () => {
    const { plan, c } = await simulada();
    c.ramas = { ...c.ramas, huella: "0".repeat(64) };
    const r = await verificarContrato(plan, c, []);
    expect(codigos(r)).toContain("DERIVA_ENTRE_INTERPRETES");
    expect(r.rf_09_2[0]?.coincide).toBe(false);
  });
});
