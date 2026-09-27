/**
 * RF-09.2 — prueba cruzada Python ↔ TypeScript de las aristas (regla dura 2, gate de contrato de la
 * regla 19): sobre TODA corrida versionada, con los umbrales DEL PLAN (no los que la corrida declara haber
 * aplicado: si difirieran, el gate tendría que fallar — AU-5 de la auditoría), el intérprete TypeScript
 * (1) reproduce la rama y los resultados que el agente registró en cada visita de un nodo escritor y
 * (2) produce la misma huella que `ramas-esperadas.json`, escrito por el intérprete Python.
 * Demo en rojo (bitácora S1, fase 4): `menor_que` tratado como `<=` en interprete.ts → rojo nombrando
 * AH-002 · paso 4 · decision.
 */
import { describe, expect, it } from "vitest";
import { leerCorridaVerificada } from "../../../../core/brecha/lector";
import { cargarPlan } from "../../../../core/plan/cargar";
import { umbralesAplicados } from "../../../../core/plan/contrato-constructor";
import {
  discrepanciasDeRamas,
  ramasEsperadas,
  type Umbrales,
} from "../../../../core/playground/interprete";
import { archivosDeCorrida, planDelLote } from "../../../../scripts/_corridas";
import {
  copia,
  corridasVersionadas,
  SIMULADO,
} from "../../../helpers/corridas";
import { readFileSync } from "node:fs";

async function leer(ruta: string) {
  const a = archivosDeCorrida(ruta);
  const m = a.corrida as {
    plan: { archivo: string };
    casos: { archivo: string };
  };
  const plan = JSON.parse(readFileSync(m.plan.archivo, "utf8")) as unknown;
  const casos = JSON.parse(readFileSync(m.casos.archivo, "utf8")) as unknown;
  const leida = await leerCorridaVerificada(
    a,
    plan,
    casos,
    planDelLote(m.plan.archivo, plan, casos),
  );
  const carga = await cargarPlan(plan);
  if (!carga.ok) throw new Error(`plan inválido: ${m.plan.archivo}`);
  return { ...leida, delPlan: umbralesAplicados(carga.plan) as Umbrales };
}

const corridas = corridasVersionadas();

describe("RF-09.2 sobre las corridas versionadas", () => {
  it("hay corrida simulada y al menos una real que verificar", () => {
    expect(corridas).toContain(SIMULADO);
    expect(corridas.some((c) => c.includes("suscripcion"))).toBe(true);
  });

  it.each(corridas)(
    "%s: el recálculo TypeScript reproduce cada rama que tomó el agente",
    async (ruta) => {
      const c = await leer(ruta);
      const disc = discrepanciasDeRamas(c.trazas, c.grafo, c.delPlan);
      expect(disc, JSON.stringify(disc.slice(0, 3))).toEqual([]);
    },
  );

  it.each(corridas)(
    "%s: misma huella que ramas-esperadas.json de Python",
    async (ruta) => {
      const c = await leer(ruta);
      const ts = await ramasEsperadas(
        c.manifiesto.corrida_id,
        c.trazas,
        c.grafo,
        c.delPlan,
        c.ramas.fuente,
      );
      expect(ts.visitas).toEqual(c.ramas.visitas);
      expect(ts.huella).toBe(c.ramas.huella);
    },
  );

  it("el gate puede fallar: un registro alterado se nombra con caso, paso y nodo", async () => {
    const c = await leer(SIMULADO);
    const trazas = copia(c.trazas);
    const ah002 = trazas.find((t) => t.caso_id === "AH-002")!;
    for (const d of ah002.decisiones_de_arista.filter(
      (x) => x.desde === "decision",
    ))
      d.rama_tomada = "pausa_humana";
    const disc = discrepanciasDeRamas(trazas, c.grafo, c.delPlan);
    expect(disc).toEqual([
      expect.objectContaining({
        caso_id: "AH-002",
        paso: 4,
        desde: "decision",
        registrada: "pausa_humana",
        recalculada: "redactor",
      }),
    ]);
  });

  it("con otro umbral el recálculo SÍ cambia la rama del empate (el playground mueve algo real)", async () => {
    const c = await leer(SIMULADO);
    const disc = discrepanciasDeRamas(c.trazas, c.grafo, {
      ...c.delPlan,
      U1: 0.8,
    });
    expect(disc.map((d) => d.caso_id)).toContain("AH-002");
  });
});
