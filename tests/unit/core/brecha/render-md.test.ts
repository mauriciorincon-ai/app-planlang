/** El informe en Markdown ES/EN: 9 secciones, estado con símbolo + texto, nada sin resolver. */
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../../../core/brecha/informe";
import { SIEMBRAS } from "../../../../core/brecha/m9";
import { garantiaDeCalibracion } from "../../../../core/brecha/garantia";
import { renderizarInforme } from "../../../../core/brecha/render-md";
import { casosSinteticos } from "../../../../scripts/garantia-contrato";
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

  it("la garantía de S1 dice en cada idioma lo que los datos no alcanzan, con su porqué (S8, P9)", async () => {
    const inf = await generarInforme(entradaSimulada());
    const conGarantia = (nombre: string) => {
      const entrada = casosSinteticos().find(
        (c) => c.nombre === nombre,
      )!.entrada;
      return {
        ...inf,
        supuestos: inf.supuestos.map((s) =>
          s.id === "S1"
            ? { ...s, garantia: garantiaDeCalibracion(entrada) }
            : s,
        ),
      };
    };
    const bajo = conGarantia("conformal-bajo-el-umbral");
    expect(renderizarInforme(bajo, "es")).toContain(
      "A α = 0,10, no hay zona respaldada: el umbral conformal (0,55) queda por debajo del umbral con garantía (0,70)",
    );
    expect(renderizarInforme(bajo, "en")).toContain(
      "At α = 0.10, there is no backed zone: the conformal threshold (0.55) falls below the guaranteed threshold (0.70)",
    );
    const sobre = conGarantia("tasa-sobre-alfa");
    expect(renderizarInforme(sobre, "es")).toContain(
      "A α = 0,20, no hay umbral con garantía: en 0,90 el agente decide solo 20 casos y la extracción falla en 5, una tasa que no baja de α",
    );
    const pocos = conGarantia("pocos-casos");
    expect(renderizarInforme(pocos, "es")).toContain("harían falta 22");
    // Con umbral con garantía pero sin conformal (α = 0,05 sobre 19 aciertos sí lo hay; sobre 8, no).
    const sinCota = {
      ...pocos,
      supuestos: pocos.supuestos.map((s) =>
        s.id === "S1" && s.garantia
          ? {
              ...s,
              garantia: {
                ...s.garantia,
                niveles: s.garantia.niveles.map((n) => ({
                  ...n,
                  umbral_con_garantia: {
                    ...n.umbral_con_garantia,
                    umbral: 0.9,
                    faltan: null,
                  },
                  sin_zona: "sin_cota_conformal" as const,
                })),
              },
            }
          : s,
      ),
    };
    expect(renderizarInforme(sinCota, "es")).toContain(
      "A α = 0,10, no hay zona respaldada: con 8 aciertos no hay umbral conformal; hacen falta al menos 9.",
    );
    expect(renderizarInforme(sinCota, "en")).toContain(
      "At α = 0.10, there is no backed zone: with 8 correct cases there is no conformal threshold; it takes at least 9.",
    );
    for (const md of [
      renderizarInforme(bajo, "es"),
      renderizarInforme(sobre, "en"),
    ])
      expect(md).not.toMatch(/undefined|NaN|\[object Object\]/);
  });
});
