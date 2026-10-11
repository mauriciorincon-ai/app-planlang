/**
 * «Un dominio nuevo no toca `core/`» (S5, promesa D6): el CLI acepta cualquier plantilla de `data/dominios/` y cualquier
 * id de plan; los demos siguen funcionando igual; y la plantilla `dom-seguridad-ia` es solo un archivo de datos que
 * pasa el esquema de dominio (el recorrido de la entrevista lo prueba el gate de contrato).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PlantillaDominioSchema } from "../../../../core/plan";
import {
  DEMOS_ENTREVISTABLES,
  objetivoDeEntrevista,
} from "../../../../scripts/entrevistar";

describe("el CLI entrevista un demo o un plan real", () => {
  it("un demo sigue siendo el de siempre (regresión)", () => {
    expect(DEMOS_ENTREVISTABLES).toContain("b");
    expect(objetivoDeEntrevista({ demo: "b" })).toEqual({
      pasar: ["--demo", "b"],
      directorio: "plans/demo-b",
    });
  });

  it("un plan real nombra su dominio y su id, y vive en plans/<id>", () => {
    expect(
      objetivoDeEntrevista({
        dominio: "dom-seguridad-ia",
        plan: "hackguard-agentes",
      }),
    ).toEqual({
      pasar: ["--dominio", "dom-seguridad-ia", "--plan", "hackguard-agentes"],
      directorio: "plans/hackguard-agentes",
    });
  });

  it("rechaza lo que no es un objetivo: nada, un demo que no existe, mezclas y ids con barras o `..`", () => {
    const rechazados: Record<string, string | true>[] = [
      {},
      { demo: "z" },
      { demo: true },
      { demo: "b", dominio: "dom-financiero", plan: "x" },
      { demo: "b", plan: "x" },
      { dominio: "dom-financiero" },
      { plan: "x" },
      { dominio: "../x", plan: "p" },
      { dominio: "dom-financiero", plan: "a/../b" },
      { dominio: "dom-financiero", plan: "a b" },
      { dominio: "dom-financiero", plan: true },
    ];
    for (const a of rechazados)
      expect(objetivoDeEntrevista(a), JSON.stringify(a)).toBeNull();
  });
});

describe("dom-seguridad-ia es solo datos", () => {
  const archivo = "data/dominios/dom-seguridad-ia.json";
  const plantilla = PlantillaDominioSchema.parse(
    JSON.parse(readFileSync(archivo, "utf8")),
  );

  it("pasa el esquema de dominio con las 14 preguntas que cubren las diez secciones de la entrevista", () => {
    expect(plantilla.id).toBe("dom-seguridad-ia");
    expect(plantilla.version).toBe("1.1.0");
    expect(plantilla.preguntas_guia).toHaveLength(14);
    expect(new Set(plantilla.preguntas_guia.map((q) => q.seccion)).size).toBe(
      10,
    );
  });

  it("toda restricción trae su fuente y la fecha en que se verificó; la que no se pudo verificar por curl lo dice", () => {
    for (const r of plantilla.restricciones_regulatorias) {
      expect(r.verificada, r.id).toBe("2026-10-11");
      if (!r.url) expect(r.vigencia, r.id).toMatch(/403/);
    }
    expect(
      plantilla.restricciones_regulatorias.map((r) => r.norma).join(" "),
    ).toMatch(/OWASP[\s\S]*ISO\/IEC 42001[\s\S]*NIST AI RMF/);
  });

  it("vive junto a las otras plantillas sin que ningún módulo de core/ la nombre", () => {
    expect(readdirSync("data/dominios")).toContain("dom-seguridad-ia.json");
    expect(existsSync("core/plan")).toBe(true);
    for (const f of readdirSync("core/plan").filter((x) => x.endsWith(".ts")))
      expect(readFileSync(`core/plan/${f}`, "utf8"), f).not.toContain(
        "dom-seguridad-ia",
      );
  });
});
