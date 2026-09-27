import { describe, expect, it } from "vitest";
import {
  contarPalabras,
  presupuestoLider,
  presupuestoLiderBilingue,
  terminosDetectados,
} from "../../../../core/formatos/jerga";

describe("presupuesto de líder y detector de jerga (ES/EN)", () => {
  it("cuenta palabras y detecta términos vigilados sin distinguir mayúsculas", () => {
    expect(contarPalabras("  uno dos\n tres ")).toBe(3);
    expect(
      terminosDetectados("El ECE y el AUROC del extractor. Sin tokens.", "es"),
    ).toEqual(["ece", "auroc", "tokens"]);
    expect(
      terminosDetectados("The pass^k rule and the interrupt.", "en"),
    ).toEqual(["pass^k", "interrupt"]);
  });

  it("un término definido en el texto no cuenta", () => {
    expect(
      terminosDetectados("ECE (error de calibración)", "es", ["ece"]),
    ).toEqual(["calibración"]);
  });

  it("pasa con ≤ 50 palabras y ≤ 1 término; falla con 51 palabras o 2 términos (demo en rojo)", () => {
    const corto = "Por debajo de este valor, una persona revisa el caso.";
    expect(presupuestoLider(corto, "es")).toMatchObject({
      ok: true,
      palabras: 10,
      terminos: [],
    });
    const largo = Array.from({ length: 51 }, () => "palabra").join(" ");
    expect(presupuestoLider(largo, "es").motivos).toEqual(["51 palabras > 50"]);
    const jerga = "El LLM devuelve un JSON.";
    expect(presupuestoLider(jerga, "es").motivos[0]).toContain(
      "2 términos vigilados > 1: llm, json",
    );
    expect(presupuestoLider("Un solo token basta.", "es").ok).toBe(true);
  });

  it("bilingüe: falla si falla cualquiera de los dos idiomas", () => {
    const r = presupuestoLiderBilingue({
      es: "Texto llano.",
      en: "The LLM prompt.",
    });
    expect(r.ok).toBe(false);
    expect(r.es.ok).toBe(true);
    expect(r.en.terminos).toEqual(["llm", "prompt"]);
    expect(
      presupuestoLiderBilingue({ es: "Bien.", en: "Fine." }, { maxPalabras: 1 })
        .ok,
    ).toBe(true);
  });
});
