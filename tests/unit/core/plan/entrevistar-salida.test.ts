/**
 * `--salida` de `pnpm entrevistar` (S7): una entrevista nueva no puede pisar el registro de un plan aprobado. Con
 * `--salida` la entrevista se salta el guardia de «el plan ya está aprobado»; por eso solo vale una carpeta que cuelgue
 * de la del propio plan, una bajo `.entrevistas/` o una fuera del repo, y los enlaces simbólicos se siguen antes de
 * decidir. El lado Python hace el mismo control (`agents/tests`).
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { salidaInvalida } from "../../../../scripts/entrevistar";

const PLAN = "plans/hackguard-agentes";
const RAIZ = "/repo";

describe("salidaInvalida", () => {
  it("vale una carpeta que cuelga de la del propio plan, una bajo .entrevistas/ y una fuera del repo", () => {
    for (const ok of [
      `${PLAN}/v2`,
      `${PLAN}/v2/borrador`,
      "/tmp/planlang-entrevista",
      "../fuera-del-repo",
      ".entrevistas/prueba",
    ])
      expect(salidaInvalida(ok, PLAN, RAIZ), ok).toBeNull();
  });

  it("rechaza lo que pisaría un registro o un archivo del repo: plans/, el propio plan, otro plan, `..`, el resto del repo y lo vacío", () => {
    for (const malo of [
      "plans",
      PLAN,
      `${PLAN}/`,
      "plans/demo-b",
      "plans/otro-plan/v2",
      `${PLAN}/../demo-b`,
      "otra/../plans/demo-b",
      `${RAIZ}/plans/demo-b`,
      "otra",
      "runs/demo-a",
      "docs",
      "src/lib",
      ".entrevistas",
      ".",
      RAIZ,
    ])
      expect(salidaInvalida(malo, PLAN, RAIZ), malo).toMatch(/--salida/);
    expect(salidaInvalida("", PLAN, RAIZ)).toBe("--salida: indica una carpeta");
    expect(salidaInvalida("  ", PLAN, RAIZ)).toBe(
      "--salida: indica una carpeta",
    );
  });

  it("el motivo dice qué carpeta sí vale", () => {
    const motivo = salidaInvalida("plans/demo-b", PLAN, RAIZ);
    expect(motivo).toContain(`cuelgue de ${PLAN}/ (por ejemplo ${PLAN}/v2)`);
    expect(motivo).toContain(".entrevistas/");
    expect(motivo).toContain("fuera del repo");
  });
});

describe("salidaInvalida sigue los enlaces simbólicos", () => {
  const temporales: string[] = [];
  afterEach(() => {
    while (temporales.length) {
      const t = temporales.pop();
      if (t) rmSync(t, { recursive: true, force: true });
    }
  });

  /** Un repo falso con `plans/<plan>` y `plans/demo-b`, y una carpeta hermana fuera del repo. */
  function repo() {
    const t = realpathSync(mkdtempSync(join(tmpdir(), "planlang-salida-")));
    temporales.push(t);
    const raiz = join(t, "repo");
    mkdirSync(join(raiz, PLAN), { recursive: true });
    mkdirSync(join(raiz, "plans/demo-b"), { recursive: true });
    mkdirSync(join(t, "fuera"));
    return { t, raiz };
  }

  it("un enlace de fuera del repo hacia plans/demo-b no deja pisar su registro", () => {
    const { t, raiz } = repo();
    symlinkSync(join(raiz, "plans/demo-b"), join(t, "fuera/atajo"));
    expect(salidaInvalida(join(t, "fuera/atajo"), PLAN, raiz)).toMatch(
      /--salida/,
    );
    expect(salidaInvalida(join(t, "fuera/atajo/v2"), PLAN, raiz)).toMatch(
      /--salida/,
    );
  });

  it("un enlace dentro del propio plan que sale hacia otro plan se rechaza; uno hacia fuera del repo vale", () => {
    const { t, raiz } = repo();
    symlinkSync(join(raiz, "plans/demo-b"), join(raiz, PLAN, "v2"));
    expect(salidaInvalida(`${PLAN}/v2`, PLAN, raiz)).toMatch(/--salida/);
    symlinkSync(join(t, "fuera"), join(raiz, PLAN, "v3"));
    expect(salidaInvalida(`${PLAN}/v3`, PLAN, raiz)).toBeNull();
  });

  it("un enlace roto no se puede resolver y se rechaza", () => {
    const { t, raiz } = repo();
    symlinkSync(join(t, "no-existe"), join(t, "fuera/roto"));
    expect(salidaInvalida(join(t, "fuera/roto"), PLAN, raiz)).toContain(
      "no se puede resolver",
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
