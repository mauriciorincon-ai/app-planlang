/** El informe en Markdown ES/EN: 9 secciones, estado con símbolo + texto, nada sin resolver. */
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../../../core/brecha/informe";
import { SIEMBRAS } from "../../../../core/brecha/m9";
import { renderizarInforme } from "../../../../core/brecha/render-md";
import { entradaDesdeDisco, hermanas } from "../../../../scripts/_corridas";
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
        i === "es" ? /⚠ CUMPLE CON ALERTAS/ : /⚠ MEETS WITH WARNINGS/,
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
  it("el disparador de un riesgo sale en el formato del idioma", async () => {
    const inf = await generarInforme(entradaSimulada());
    expect(renderizarInforme(inf, "es")).toContain("0 % (ocurre si > 10 %)");
    expect(renderizarInforme(inf, "en")).toContain("0% (occurs if > 10%)");
    expect(renderizarInforme(inf, "es")).toContain("0 (ocurre si > 0)");
  });
  it.each(["es", "en"] as const)(
    "%s: un no cumple muestra qué bloquea y el caso fallido",
    async (i) => {
      const e = await SIEMBRAS.find(
        (s) => s.id === "dato_sensible_en_salida",
      )!.aplicar(entradaSimulada());
      const md = renderizarInforme(await generarInforme(e), i);
      expect(md).toMatch(i === "es" ? /✗ NO CUMPLE/ : /✗ DOES NOT MEET/);
      expect(md).toMatch(i === "es" ? /- Bloquea: C2/ : /- Blocks: C2/);
      expect(md).toMatch(/R2 \(/);
    },
  );
  it("M-24: cada brecha dice su categoría y sus reintentos; los evaluadores, sus no evaluables", async () => {
    const inf = await generarInforme(entradaReal());
    const es = renderizarInforme(inf, "es");
    const en = renderizarInforme(inf, "en");
    expect(es).toContain("| Fallas | No evaluables | Riesgos que cubre |");
    expect(en).toContain("| Failures | Not evaluable | Risks it covers |");
    const conReintento = inf.brechas_no_previstas.brechas.filter(
      (b) => b.categoria === "reintento_de_esquema",
    );
    expect(conReintento.length).toBeGreaterThan(0);
    for (const b of conReintento) {
      expect(b.reintentos).toBeGreaterThan(0);
      expect(es).toMatch(
        new RegExp(
          `\\*\\*${b.caso_id}\\*\\* · reintento de salida estructurada .* · ${b.reintentos} reintentos?:`,
        ),
      );
    }
    expect(en).toMatch(/· structured-output retry ·/);
  });
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

describe("las decisiones de una vía dicen qué se eligió (AU-S2-P-6)", () => {
  it("con un plan bilingüe (v1.4), cada idioma la suya tras la pregunta", async () => {
    const ruta = "runs/demo-a/simulado-v1.4-respaldo";
    const inf = await generarInforme(entradaDesdeDisco(ruta, hermanas(ruta)));
    const d1 = inf.plan_en_breve.decisiones_una_via.find((d) => d.id === "D1")!;
    expect(d1.opcion_elegida).not.toBeNull();
    for (const i of ["es", "en"] as const)
      expect(renderizarInforme(inf, i)).toContain(
        `? → ${d1.opcion_elegida![i]}. `,
      );
  });
  it("si el plan la escribió en un solo idioma (v1.1), el informe no la copia al otro como si fuera suya", async () => {
    const inf = await generarInforme(entradaReal());
    const d1 = inf.plan_en_breve.decisiones_una_via.find((d) => d.id === "D1")!;
    expect(d1.opcion_elegida).toBeNull();
    expect(renderizarInforme(inf, "en")).not.toMatch(/→ solo edad/);
  });
});
