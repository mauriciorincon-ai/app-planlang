// @vitest-environment node
/**
 * Regla 18 del núcleo (kit v2.1.0): UN SOLO PR VIVO POR APP. El job `un-pr-vivo` falla en el PR recién abierto si hay
 * más de uno abierto en el repo y el cuerpo de ESTE PR no empieza con «complementa #N: <razón>».
 *
 * Regla 15 (un gate se demuestra fallando): esta prueba ejecuta de verdad el script del job con un `gh` de mentira que
 * devuelve la lista de PRs abiertos, y lo ve ponerse en ROJO con dos PRs sin la línea de complemento. El kit prescribe la
 * demo con un segundo PR real; aquí se hace sin abrir ninguno (desviación declarada en el cierre del S5).
 */
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";

type Flujo = {
  permissions: Record<string, string>;
  on: { pull_request: { types: string[] } };
  jobs: Record<string, { steps: { run?: string }[] }>;
};
const flujo = parse(
  readFileSync(".github/workflows/un-pr-vivo.yml", "utf8"),
) as Flujo;
const script = flujo.jobs["un-pr-vivo"]!.steps[0]!.run!;

let carpeta = "";
beforeAll(() => {
  carpeta = mkdtempSync(join(tmpdir(), "un-pr-vivo-"));
  writeFileSync(join(carpeta, "script.sh"), script);
  // `gh pr list … --jq 'map(.number)'` ya devuelve la lista filtrada: el de mentira imprime la que se le dé.
  writeFileSync(
    join(carpeta, "gh"),
    '#!/bin/sh\nprintf "%s" "$PRS_ABIERTOS"\n',
  );
  chmodSync(join(carpeta, "gh"), 0o755);
});
afterAll(() => rmSync(carpeta, { recursive: true, force: true }));

function correr(abiertos: number[], este: number, cuerpo: string) {
  const r = spawnSync("bash", [join(carpeta, "script.sh")], {
    env: {
      ...process.env,
      PATH: `${carpeta}:${process.env.PATH ?? ""}`,
      GH_TOKEN: "x",
      REPO: "dueño/app",
      ESTE: String(este),
      CUERPO: cuerpo,
      PRS_ABIERTOS: JSON.stringify(abiertos),
    },
    encoding: "utf8",
  });
  return { codigo: r.status, salida: `${r.stdout}${r.stderr}` };
}

describe("job un-pr-vivo", () => {
  it("corre en cada PR que se abre, reabre o edita, con permiso de solo lectura", () => {
    expect(flujo.on.pull_request.types).toEqual([
      "opened",
      "reopened",
      "edited",
      "synchronize",
    ]);
    expect(flujo.permissions).toEqual({ "pull-requests": "read" });
  });

  it("con un solo PR abierto, pasa", () => {
    const r = correr([15], 15, "Cuerpo normal.");
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain("un solo PR vivo");
  });

  it("ROJO: con dos PR abiertos y un cuerpo sin la línea de complemento, falla y nombra los dos", () => {
    const r = correr([16, 17], 17, "Cuerpo normal.");
    expect(r.codigo).toBe(1);
    expect(r.salida).toContain("Hay 2 PRs abiertos");
    expect(r.salida).toContain("#17");
  });

  it("ROJO: la línea de complemento solo vale si es la PRIMERA del cuerpo", () => {
    const r = correr(
      [16, 17],
      17,
      "Resumen.\ncomplementa #16: no cabe en el 16.",
    );
    expect(r.codigo).toBe(1);
  });

  it("con dos PR abiertos y «complementa #N: <razón>» como primera línea, pasa", () => {
    const r = correr(
      [16, 17],
      17,
      "complementa #16: cambia el workflow, no cabe en el lote de dependencias.\n\nResto.",
    );
    expect(r.codigo).toBe(0);
    expect(r.salida).toContain("complementario");
  });
});
