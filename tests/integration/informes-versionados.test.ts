/**
 * Frescura de los informes versionados junto a cada corrida real: si alguien toca el verificador, el
 * plan o una traza sin regenerar el informe, este test lo nombra. Regenerar:
 * `pnpm brecha:informe --corrida runs/demo-a/<corrida>`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generarInforme } from "../../core/brecha/informe";
import { renderizarInforme } from "../../core/brecha/render-md";
import { jsonBonito } from "../../core/formatos/huella";
import type { JsonValor } from "../../core/formatos/jcs";
import { entradaDesdeDisco, hermanas } from "../../scripts/_corridas";
import { corridasVersionadas } from "../helpers/corridas";

const conInforme = corridasVersionadas().filter((c) =>
  existsSync(join(c, "informe.json")),
);

describe("informes versionados al día", () => {
  it("la corrida real de 20 tiene su informe", () => {
    expect(conInforme).toContain("runs/demo-a/suscripcion-planlang-a-001-20");
  });
  it.each(conInforme)("%s", async (ruta) => {
    const inf = await generarInforme(entradaDesdeDisco(ruta, hermanas(ruta)));
    expect(jsonBonito(inf as unknown as JsonValor)).toBe(
      readFileSync(join(ruta, "informe.json"), "utf8"),
    );
    for (const i of ["es", "en"] as const)
      expect(renderizarInforme(inf, i)).toBe(
        readFileSync(join(ruta, `informe.${i}.md`), "utf8"),
      );
  });
});
