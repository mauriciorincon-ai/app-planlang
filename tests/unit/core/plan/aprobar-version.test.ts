/**
 * `plan:aprobar --version N` (S6): una versión nueva de un plan que ya tiene la anterior. Sin el flag todo sigue como
 * en el S5 (`v1.json` en la carpeta del plan: regresión para el demo B y para la v1 de HackGuard); con `--version 2`
 * el borrador se lee de `vN/`, el plan aprobado se escribe como `vN.json` con la versión `N.0.0`, y un `vN.json` que ya
 * existe no se reescribe. La función pura se prueba directo; el recorrido corre el script de verdad en una carpeta
 * temporal con el borrador y la transcripción de la fixture del gate de contrato.
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  revisarBorrador,
  textoDeRevision,
  TranscripcionSchema,
} from "../../../../core/plan";
import { versionDeLaCarpeta } from "../../../../scripts/entrevistar";
import { destinoDeAprobacion } from "../../../../scripts/plan-aprobar";

const BASE = "plans/hackguard-agentes";

describe("destinoDeAprobacion", () => {
  it("sin el flag, v1.json en la carpeta del plan (regresión)", () => {
    expect(destinoDeAprobacion(BASE, undefined)).toEqual({
      directorio: BASE,
      destino: `${BASE}/v1.json`,
      version: null,
    });
    expect(destinoDeAprobacion("plans/demo-b", undefined)?.destino).toBe(
      "plans/demo-b/v1.json",
    );
  });

  it("con --version 2: borrador en v2/, plan en v2.json, versión 2.0.0", () => {
    expect(destinoDeAprobacion(BASE, "2")).toEqual({
      directorio: `${BASE}/v2`,
      destino: `${BASE}/v2.json`,
      version: "2.0.0",
    });
    expect(destinoDeAprobacion(BASE, "12")?.version).toBe("12.0.0");
  });

  it("rechaza lo que no es una versión nueva: la 1, el 0, ceros a la izquierda, decimales, texto y el flag sin valor", () => {
    for (const malo of ["1", "0", "02", "2.1", "-3", "dos", "", "2/../x"])
      expect(destinoDeAprobacion(BASE, malo), malo).toBeNull();
    expect(destinoDeAprobacion(BASE, true)).toBeNull();
  });
});

describe("la revisión dice cómo se aprueba la versión que propone", () => {
  const dir = resolve("tests/contrato/entrevista-dominio-nuevo");
  const borrador: unknown = JSON.parse(
    readFileSync(join(dir, "v0-borrador.json"), "utf8"),
  );
  const revision = revisarBorrador(
    borrador,
    TranscripcionSchema.parse(
      JSON.parse(readFileSync(join(dir, "transcripcion.json"), "utf8")),
    ),
  );

  it("la versión sale de la carpeta: vN dentro de un plan, nunca un plan que se llama v2", () => {
    expect(versionDeLaCarpeta("plans/hackguard-agentes/v2")).toBe(2);
    expect(versionDeLaCarpeta("plans/hackguard-agentes/v10/")).toBe(10);
    for (const primera of [
      "plans/hackguard-agentes",
      "plans/demo-b",
      "plans/v2",
      "v2",
      "plans/hackguard-agentes/v1",
      "plans/hackguard-agentes/v02",
      "/tmp/x/v2",
    ])
      expect(versionDeLaCarpeta(primera), primera).toBe(1);
  });

  it("la v1 conserva su texto de siempre (frase, comando y archivo)", () => {
    const es = textoDeRevision(borrador, revision, "es");
    expect(es).toContain("el plan pasa a v1 solo cuando dices");
    expect(es).toContain("«apruebo el plan fixture-dominio-nuevo»");
    expect(es).toContain("`plans/fixture-dominio-nuevo/v1.json`");
    expect(es).not.toContain("--version");
    expect(textoDeRevision(borrador, revision, "es", 1)).toBe(es);
  });

  it("una versión nueva se aprueba con «apruebo el plan vN», --version N y su vN.json, en los dos idiomas", () => {
    const es = textoDeRevision(borrador, revision, "es", 2);
    expect(es).toContain("el plan pasa a v2 solo cuando dices");
    expect(es).toContain("«apruebo el plan v2»");
    expect(es).toContain(
      "--dominio dom-seguridad-ia --plan fixture-dominio-nuevo --version 2 --por",
    );
    expect(es).toContain("`plans/fixture-dominio-nuevo/v2.json`");
    expect(es).not.toContain("v1.json");
    const en = textoDeRevision(borrador, revision, "en", 2);
    expect(en).toContain("the plan becomes v2 only when you say");
    expect(en).toContain("“I approve plan v2”");
    expect(en).toContain("--plan fixture-dominio-nuevo --version 2 --por");
    expect(en).toContain("`plans/fixture-dominio-nuevo/v2.json`");
    expect(en).not.toContain("v1.json");
  });
});

describe("el script aprueba la versión que se le pide", () => {
  const raiz = resolve(".");
  const FIXTURE = join(raiz, "tests/contrato/entrevista-dominio-nuevo");
  const temporales: string[] = [];

  afterEach(() => {
    while (temporales.length) {
      const t = temporales.pop();
      if (t) rmSync(t, { recursive: true, force: true });
    }
  });

  /** Una raíz temporal con el borrador y la transcripción de la fixture en `plans/fixture-dominio-nuevo/<sub>`. */
  function raizConBorrador(sub: string): string {
    const t = mkdtempSync(join(tmpdir(), "planlang-aprobar-"));
    temporales.push(t);
    const carpeta = join(t, "plans/fixture-dominio-nuevo", sub);
    mkdirSync(carpeta, { recursive: true });
    for (const f of ["v0-borrador.json", "transcripcion.json"])
      cpSync(join(FIXTURE, f), join(carpeta, f));
    return t;
  }

  function aprobar(cwd: string, extra: string[]) {
    return spawnSync(
      join(raiz, "node_modules/.bin/tsx"),
      [
        join(raiz, "scripts/plan-aprobar.ts"),
        "--dominio",
        "dom-seguridad-ia",
        "--plan",
        "fixture-dominio-nuevo",
        "--por",
        "Prueba",
        "--el",
        "2026-10-11",
        ...extra,
      ],
      { cwd, encoding: "utf8", env: { ...process.env } },
    );
  }

  it("--version 2 escribe v2.json con la versión 2.0.0 y no reescribe una v2 que ya existe", () => {
    const t = raizConBorrador("v2");
    cpSync(
      join(FIXTURE, "v0-borrador.json"),
      join(t, "plans/fixture-dominio-nuevo/v1.json"),
    );
    const r = aprobar(t, ["--version", "2"]);
    expect(r.status, r.stderr).toBe(0);
    const destino = join(t, "plans/fixture-dominio-nuevo/v2.json");
    expect(existsSync(destino)).toBe(true);
    expect(existsSync(join(t, "plans/fixture-dominio-nuevo/v1.json"))).toBe(
      true,
    );
    const plan = JSON.parse(readFileSync(destino, "utf8")) as {
      version: string;
      estado_aprobacion: string;
      aprobado_por: string;
      huella: string;
    };
    expect(plan.version).toBe("2.0.0");
    expect(plan.estado_aprobacion).toBe("aprobado");
    expect(plan.aprobado_por).toBe("Prueba");
    expect(plan.huella).toMatch(/^[0-9a-f]{64}$/);

    const otra = aprobar(t, ["--version", "2"]);
    expect(otra.status).toBe(1);
    expect(otra.stderr).toContain("las versiones aprobadas son v1, v2");
  });

  it("sin el flag escribe v1.json y deja la versión del borrador (1.0.0)", () => {
    const t = raizConBorrador("");
    const r = aprobar(t, []);
    expect(r.status, r.stderr).toBe(0);
    const plan = JSON.parse(
      readFileSync(join(t, "plans/fixture-dominio-nuevo/v1.json"), "utf8"),
    ) as { version: string };
    expect(plan.version).toBe("1.0.0");
  });

  it("una versión que se salta la anterior se rechaza sin escribir nada", () => {
    const t = raizConBorrador("v3");
    mkdirSync(join(t, "plans/fixture-dominio-nuevo"), { recursive: true });
    cpSync(
      join(FIXTURE, "v0-borrador.json"),
      join(t, "plans/fixture-dominio-nuevo/v1.json"),
    );
    const r = aprobar(t, ["--version", "3"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      "las versiones aprobadas son v1; la nueva debe ser v2",
    );
    expect(existsSync(join(t, "plans/fixture-dominio-nuevo/v3.json"))).toBe(
      false,
    );
  });

  it("una versión mal escrita es un error de uso, no una aprobación", () => {
    const t = raizConBorrador("v2");
    const r = aprobar(t, ["--version", "1"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("uso: plan:aprobar");
    expect(existsSync(join(t, "plans/fixture-dominio-nuevo/v2.json"))).toBe(
      false,
    );
  });
});
