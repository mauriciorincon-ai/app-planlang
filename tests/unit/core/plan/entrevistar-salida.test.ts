/**
 * `--salida` de `pnpm entrevistar` (S7): una entrevista nueva no puede pisar el registro de un plan aprobado. Con
 * `--salida` la entrevista se salta el guardia de «el plan ya está aprobado»; por eso solo vale una carpeta fuera de
 * `plans/` o una que cuelgue de la del propio plan. El lado Python hace el mismo control (`agents/tests`).
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { salidaInvalida } from "../../../../scripts/entrevistar";

const PLAN = "plans/hackguard-agentes";
const RAIZ = "/repo";

describe("salidaInvalida", () => {
  it("vale una carpeta que cuelga de la del propio plan, y una fuera de plans/", () => {
    for (const ok of [
      `${PLAN}/v2`,
      `${PLAN}/v2/borrador`,
      "/tmp/planlang-entrevista",
      ".entrevistas/prueba",
      "otra",
    ])
      expect(salidaInvalida(ok, PLAN, RAIZ), ok).toBeNull();
  });

  it("rechaza lo que pisaría el registro de un plan aprobado: plans/, el propio plan, otro plan, `..` y lo vacío", () => {
    for (const malo of [
      "plans",
      PLAN,
      `${PLAN}/`,
      "plans/demo-b",
      "plans/otro-plan/v2",
      `${PLAN}/../demo-b`,
      "otra/../plans/demo-b",
      `${RAIZ}/plans/demo-b`,
    ])
      expect(salidaInvalida(malo, PLAN, RAIZ), malo).toMatch(/--salida/);
    expect(salidaInvalida("", PLAN, RAIZ)).toBe("--salida: indica una carpeta");
    expect(salidaInvalida("  ", PLAN, RAIZ)).toBe(
      "--salida: indica una carpeta",
    );
  });

  it("el motivo dice qué carpeta sí vale", () => {
    expect(salidaInvalida("plans/demo-b", PLAN, RAIZ)).toContain(
      `cuelgue de ${PLAN}/ (por ejemplo ${PLAN}/v2)`,
    );
  });
});

describe("pnpm entrevistar con una --salida inválida", () => {
  const raiz = resolve(".");
  const tsx = resolve(raiz, "node_modules/.bin/tsx");

  function entrevistar(extra: string[]) {
    return spawnSync(
      tsx,
      [
        resolve(raiz, "scripts/entrevistar.ts"),
        "--dominio",
        "dom-seguridad-ia",
        "--plan",
        "hackguard-agentes",
        ...extra,
      ],
      { cwd: raiz, encoding: "utf8", env: { ...process.env } },
    );
  }

  it("se detiene con error de uso antes de lanzar el entrevistador, nombrando la carpeta", () => {
    const r = entrevistar(["--salida", "plans/demo-b"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("--salida «plans/demo-b»");
  });

  it("--salida sin valor tampoco pasa", () => {
    const r = entrevistar(["--salida"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("--salida: indica una carpeta");
  });
});
