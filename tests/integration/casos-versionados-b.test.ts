/**
 * Reproducibilidad byte a byte del conjunto del demo B: las listas de control y los lotes versionados se regeneran
 * desde sus semillas y el plan B v1 aprobado, y deben dar LOS MISMOS BYTES (en Node y en jsdom). También la
 * afirmación de privacidad derivada. Regenerar: `pnpm casos:generar --versionados --demo b`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { jsonBonito } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import type { Plan } from "../../core/plan";
import { generarListas, generarLoteB, type LoteB } from "../../core/sintetico";
import {
  LISTAS_DEMO_B,
  LOTES_VERSIONADOS_B,
  markdownAfirmacion,
  PLAN_DEMO_B,
  RUTA_AFIRMACION_B,
  rutaDeLoteB,
} from "../../scripts/lotes-versionados";

const plan = JSON.parse(readFileSync(PLAN_DEMO_B, "utf8")) as Plan;

describe("conjunto versionado del demo B", () => {
  it("las listas de control se regeneran con los mismos bytes", async () => {
    const listas = await generarListas();
    expect(jsonBonito(listas as unknown as JsonValor)).toBe(
      readFileSync(LISTAS_DEMO_B, "utf8"),
    );
  });

  it("los lotes y la afirmación de privacidad se regeneran con los mismos bytes", async () => {
    const listas = await generarListas();
    const lotes: LoteB[] = [];
    for (const l of LOTES_VERSIONADOS_B) {
      const lote = await generarLoteB({
        plan,
        listas,
        semilla: l.semilla,
        n: l.n,
        receta: l.receta,
      });
      expect(
        jsonBonito(lote as unknown as JsonValor),
        `${l.semilla}-${l.n}`,
      ).toBe(readFileSync(rutaDeLoteB(l.semilla, l.n), "utf8"));
      lotes.push(lote);
    }
    expect(markdownAfirmacion(lotes, "B")).toBe(
      readFileSync(RUTA_AFIRMACION_B, "utf8"),
    );
  });
});
