/**
 * El e2e del DoD sin pantalla: corrida simulada de 3 casos (Python, `ChatSimulado`, regenerada byte a
 * byte en el job `python`) → verificador TypeScript → informe JSON + Markdown ES/EN, comparados con los
 * golden files. Corre en los proyectos `core` (Node) y `core-jsdom`: igualdad con el golden en ambos =
 * mismos bytes en Node y en el entorno de navegador (regla dura 1).
 * Regenerar: `pnpm brecha:informe --corrida runs/demo-a/simulado-3casos --salida tests/golden/demo-a/simulado-3casos`.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../core/brecha/informe";
import { renderizarInforme } from "../../core/brecha/render-md";
import { jsonBonito } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import { entradaSimulada } from "../helpers/corridas";

const GOLDEN = "tests/golden/demo-a/simulado-3casos";
const golden = (f: string) => readFileSync(`${GOLDEN}/${f}`, "utf8");

describe("informe de la corrida simulada contra los golden files", () => {
  it("informe.json idéntico byte a byte", async () => {
    const inf = await generarInforme(entradaSimulada());
    expect(jsonBonito(inf as unknown as JsonValor)).toBe(
      golden("informe.json"),
    );
  });
  it.each(["es", "en"] as const)(
    "informe.%s.md idéntico byte a byte",
    async (i) => {
      const inf = await generarInforme(entradaSimulada());
      expect(renderizarInforme(inf, i)).toBe(golden(`informe.${i}.md`));
    },
  );
});
