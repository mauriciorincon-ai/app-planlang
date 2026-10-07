// @vitest-environment node
/**
 * `scripts/verificar-dependencias.mjs` (regla 18): ninguna dependencia queda por debajo de `main`. Con la auditoría
 * del S2 (AU-S2-B37) compara cada línea mayor que tienen las dos orillas, una entrada permitida que ya no aplica es
 * una falla, y una base ilegible también (en local y en CI, kit v1.35.0); una base sin lockfile falla en CI.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { revisar } from "../../../scripts/verificar-dependencias.mjs";

const lock = (...ps: string[]) =>
  `lockfileVersion: '9.0'\n\npackages:\n\n${ps.map((p) => `  ${p}:\n    resolution: {}\n`).join("\n")}\nsnapshots:\n`;

describe("verificar-dependencias (AU-S2-B37)", () => {
  it("una subida pasa; una bajada falla nombrando el paquete", () => {
    expect(
      revisar({
        lockBase: lock("a@1.0.0"),
        lockPR: lock("a@1.1.0"),
        permitidas: [],
      }).degradados,
    ).toEqual([]);
    expect(
      revisar({
        lockBase: lock("a@1.1.0"),
        lockPR: lock("a@1.0.0"),
        permitidas: [],
      }).degradados,
    ).toEqual(["a: 1.1.0 (origin/main) → 1.0.0 (este árbol)"]);
  });

  it("con dos copias, la vieja también cuenta: se compara cada línea mayor", () => {
    const r = revisar({
      lockBase: lock("b@1.4.0", "b@2.0.0"),
      lockPR: lock("b@1.2.0", "b@2.0.0"),
      permitidas: [],
    });
    expect(r.degradados).toEqual([
      "b: 1.4.0 (origin/main) → 1.2.0 (este árbol)",
    ]);
  });

  it("una degradación declarada pasa con su razón; una entrada que ya no aplica se informa para fallar", () => {
    const permitidas = [
      {
        nombre: "c",
        de: "26.0.0",
        a: "22.0.0",
        razon: "sigue al Node de la CI",
      },
      { nombre: "d", de: "2.0.0", a: "1.0.0", razon: "vieja" },
    ];
    const r = revisar({
      lockBase: lock("c@26.0.0"),
      lockPR: lock("c@22.0.0"),
      permitidas,
    });
    expect(r.degradados).toEqual([]);
    expect(r.aceptados[0]).toContain(
      "degradado a propósito (sigue al Node de la CI)",
    );
    expect(r.sinUso).toEqual(["d 2.0.0 → 1.0.0"]);
  });

  it("una base que no se puede leer falla en local y en CI (kit v1.35.0: falla cerrado)", () => {
    for (const CI of ["true", ""]) {
      const r = spawnSync(
        process.execPath,
        ["scripts/verificar-dependencias.mjs", "no-existe/rama-fantasma"],
        { encoding: "utf8", env: { ...process.env, CI } },
      );
      expect(r.status, `CI=${CI}`).toBe(1);
      expect(r.stderr).toContain(
        "no puedo leer la rama base no-existe/rama-fantasma",
      );
    }
  });

  it("una base que existe sin lockfile falla en CI y pasa con aviso fuera de CI (planlang, sobre el kit)", () => {
    const dir = mkdtempSync(join(tmpdir(), "verificar-dependencias-"));
    try {
      const git = (...a: string[]) =>
        spawnSync("git", a, { cwd: dir, encoding: "utf8" });
      git("init", "-q");
      writeFileSync(join(dir, "README.md"), "base sin lockfile\n");
      git("add", "README.md");
      git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
      git("branch", "base-sin-lock");
      writeFileSync(join(dir, "pnpm-lock.yaml"), lock("a@1.0.0"));
      const correr = (CI: string) =>
        spawnSync(
          process.execPath,
          [resolve("scripts/verificar-dependencias.mjs"), "base-sin-lock"],
          { cwd: dir, encoding: "utf8", env: { ...process.env, CI } },
        );
      const ci = correr("true");
      expect(ci.status).toBe(1);
      expect(ci.stderr).toContain("existe pero no tiene pnpm-lock.yaml");
      const local = correr("");
      expect(local.status).toBe(0);
      expect(local.stdout).toContain("existe pero no tiene pnpm-lock.yaml");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
