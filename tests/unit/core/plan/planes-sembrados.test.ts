/**
 * RF-09.4 — planes sembrados con errores: el validador los rechaza con el código y el elemento esperados.
 * Los fixtures son DATOS (`tests/fixtures/planes-sembrados/`, generados por `scripts/sembrar-planes.ts`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validarPlan } from "../../../../core/plan";

const DIR = "tests/fixtures/planes-sembrados";
const manifiesto = JSON.parse(
  readFileSync(`${DIR}/manifiesto.json`, "utf8"),
) as {
  base: string;
  semillas: {
    archivo: string;
    codigo: string;
    elemento: string;
    descripcion: string;
  }[];
};

describe("planes sembrados (RF-09.4)", () => {
  it("el plan base (migrado, borrador) es válido", () => {
    const v = validarPlan(JSON.parse(readFileSync(manifiesto.base, "utf8")));
    expect(v.ok).toBe(true);
  });

  it("hay al menos cinco semillas", () => {
    expect(manifiesto.semillas.length).toBeGreaterThanOrEqual(5);
  });

  it.each(manifiesto.semillas.map((s) => [s.archivo, s] as const))(
    "%s se rechaza con el motivo esperado",
    (_a, s) => {
      const v = validarPlan(
        JSON.parse(readFileSync(`${DIR}/${s.archivo}`, "utf8")),
      );
      expect(v.ok).toBe(false);
      if (v.ok) return;
      const coincidencias = v.motivos.filter(
        (m) => m.codigo === s.codigo && m.elemento === s.elemento,
      );
      expect(
        coincidencias,
        `motivos: ${JSON.stringify(v.motivos.map((m) => [m.codigo, m.elemento]))}`,
      ).not.toHaveLength(0);
      for (const m of v.motivos) {
        expect(m.mensaje.es.length).toBeGreaterThan(0);
        expect(m.mensaje.en.length).toBeGreaterThan(0);
      }
    },
  );
});
