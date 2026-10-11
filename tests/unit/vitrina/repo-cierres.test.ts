import { describe, expect, it } from "vitest";
import { cierresDeSprint } from "@/lib/datos/repo";

describe("cierres de sprint: un cierre por sprint, summary (hasta S3) o cierre ejecutivo (desde S4)", () => {
  it("cuenta cada sprint una vez aunque tenga summary y cierre, y mira solo los nombres de cierre", () => {
    const cierres = cierresDeSprint([
      "SPRINT_001-summary.md",
      "SPRINT_002-summary.md",
      "SPRINT_002-implementation-log.md",
      "SPRINT_003-summary.md",
      "SPRINT_004-cierre.md",
      "SPRINT_004-implementation-log.md",
      "SPRINT_004-auditoria.md",
      "ETAPA-DISENO.md",
    ]);
    expect(cierres.map((c) => c.archivo)).toEqual([
      "SPRINT_001-summary.md",
      "SPRINT_002-summary.md",
      "SPRINT_003-summary.md",
      "SPRINT_004-cierre.md",
    ]);
    expect(new Set(cierres.map((c) => c.sprint)).size).toBe(4);
  });

  it("un sprint con summary y cierre cuenta una sola vez", () => {
    const cierres = cierresDeSprint([
      "SPRINT_003-summary.md",
      "SPRINT_003-cierre.md",
    ]);
    expect(new Set(cierres.map((c) => c.sprint)).size).toBe(1);
  });
});
