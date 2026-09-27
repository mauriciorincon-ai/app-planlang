/** El informe en Markdown ES/EN: 9 secciones, estado con símbolo + texto, nada sin resolver. */
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../../../core/brecha/informe";
import { SIEMBRAS } from "../../../../core/brecha/m9";
import { renderizarInforme } from "../../../../core/brecha/render-md";
import {
  entradaReal,
  entradaSimulada,
  repeticionDe,
} from "../../../helpers/corridas";

const secciones = (md: string) =>
  md.split("\n").filter((l) => /^## \d\. /.test(l)).length;

describe("render del informe", () => {
  it.each(["es", "en"] as const)(
    "%s: nueve secciones, etiqueta de simulación y nada sin resolver",
    async (i) => {
      const md = renderizarInforme(await generarInforme(entradaReal()), i);
      expect(secciones(md)).toBe(9);
      expect(md).toMatch(
        i === "es"
          ? /Simulación · no operativo/
          : /Simulation · not operational/,
      );
      expect(md).not.toMatch(/undefined|NaN|\[object Object\]/);
      expect(md.endsWith("\n")).toBe(true);
      expect(md).toMatch(
        i === "es" ? /⚠ CUMPLE CON ALERTAS/ : /⚠ MET WITH ALERTS/,
      );
      expect(md).toMatch(
        i === "es"
          ? /Agente único \(suscripcion-planlang-a-001-20-base\)/
          : /Single agent \(suscripcion-planlang-a-001-20-base\)/,
      );
      expect(md).toMatch(i === "es" ? /\| Línea base \|/ : /\| Baseline \|/);
    },
  );
  it("los números van con coma en español y punto en inglés", async () => {
    const inf = await generarInforme(entradaSimulada());
    expect(renderizarInforme(inf, "es")).toMatch(/senal_confianza < 0,75/);
    expect(renderizarInforme(inf, "en")).toMatch(/senal_confianza < 0\.75/);
  });
  it.each(["es", "en"] as const)(
    "%s: un no cumple muestra qué bloquea y el caso fallido",
    async (i) => {
      const e = await SIEMBRAS.find(
        (s) => s.id === "dato_sensible_en_salida",
      )!.aplicar(entradaSimulada());
      const md = renderizarInforme(await generarInforme(e), i);
      expect(md).toMatch(i === "es" ? /✗ NO CUMPLE/ : /✗ NOT MET/);
      expect(md).toMatch(i === "es" ? /- Bloquea: C2/ : /- Blocks: C2/);
      expect(md).toMatch(/R2 \(/);
    },
  );
  it("hallazgos del contrato y repeticiones en la ficha", async () => {
    const e = entradaSimulada();
    const inf = await generarInforme({
      ...e,
      repeticiones: [await repeticionDe(e, "simulado-3casos-r2")],
    });
    const es = renderizarInforme(inf, "es");
    expect(es).toMatch(/⚠ `NODO_NO_EJERCITADO`/);
    expect(es).toMatch(/\| Repetición \| simulado-3casos-r2 \|/);
    expect(renderizarInforme(inf, "en")).toMatch(
      /\| Repetition \| simulado-3casos-r2 \|/,
    );
  });
});
