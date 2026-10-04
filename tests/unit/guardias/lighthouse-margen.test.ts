// @vitest-environment node
/**
 * `scripts/lighthouse-margen.mjs` (kit v1.37.0, parcheado en planlang S3): avisa cuando la mediana de una métrica
 * queda a menos del 10 % de su presupuesto y falla si una URL medida no tiene presupuesto de LCP. Lee los presupuestos
 * con la semántica de LHCI y aplica TODAS las entradas que casan (el del kit tomaba la primera: con los presupuestos
 * por ruta del ADR-011, todo caía en `/*` y el LCP no se miraba). Demo en rojo (bitácora S3): una URL medida sin LCP.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = resolve("scripts/lighthouse-margen.mjs");
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const PRESUPUESTOS = [
  {
    path: "/*",
    timings: [{ metric: "first-contentful-paint", budget: 1500 }],
  },
  {
    path: "/es$",
    timings: [{ metric: "largest-contentful-paint", budget: 2500 }],
  },
  {
    path: "/*/playground",
    timings: [{ metric: "largest-contentful-paint", budget: 2800 }],
  },
];

function correr(urls: string[], corridas: Record<string, number[]>) {
  const dir = mkdtempSync(join(tmpdir(), "lighthouse-margen-"));
  dirs.push(dir);
  writeFileSync(join(dir, "lighthouse-urls.json"), JSON.stringify(urls));
  writeFileSync(join(dir, "perf-budget.json"), JSON.stringify(PRESUPUESTOS));
  mkdirSync(join(dir, ".lighthouseci"));
  let n = 0;
  for (const [ruta, lcps] of Object.entries(corridas))
    for (const lcp of lcps)
      writeFileSync(
        join(dir, ".lighthouseci", `lhr-${n++}.json`),
        JSON.stringify({
          requestedUrl: `http://localhost:3000${ruta}`,
          audits: {
            "largest-contentful-paint": { numericValue: lcp },
            "first-contentful-paint": { numericValue: 900 },
          },
        }),
      );
  return spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: "utf8" });
}

describe("lighthouse-margen (presupuestos por ruta, semántica de LHCI)", () => {
  it("avisa con la entrada por ruta que casa, no con la primera", () => {
    const r = correr(["/es", "/es/playground"], {
      "/es": [1900, 2000, 2100],
      "/es/playground": [2640, 2646, 2650],
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(
      "/es/playground · largest-contentful-paint mediana 2646 vs presupuesto 2800 (path /*/playground; margen 5.5 %",
    );
    expect(r.stdout).not.toMatch(/\/es · largest-contentful-paint/);
    expect(r.stdout).toContain("1 aviso(s)");
  });

  it("sin medianas cerca del presupuesto, verde", () => {
    const r = correr(["/es"], { "/es": [1800, 1900, 2000] });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("✓ lighthouse-margen");
  });

  it("una URL medida sin presupuesto de LCP falla nombrándola", () => {
    const r = correr(["/es", "/es/plan"], { "/es": [1900] });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(
      "la URL medida /es/plan no tiene presupuesto de LCP",
    );
  });
});
