/**
 * El job `lighthouse` mide lo que dice `lighthouse-urls.json`: cada pantalla de la vitrina en español y, como la app
 * es bilingüe (regla 20), también el inglés — la entrada y la pantalla más pesada (el playground) — para que el
 * presupuesto de `perf-budget.json` y las cuatro categorías ≥ 90 valgan en los dos idiomas (AU-S2-B14).
 *
 * El LCP va por ruta (ADR-011): LHCI aplica TODAS las entradas de `perf-budget.json` que casan con una URL, así que el
 * margen del playground no puede convivir con un LCP en `/*`. Estas pruebas cuidan el reparto: cada URL medida cae en
 * exactamente un presupuesto de LCP (una pantalla nueva no queda sin él) y ninguna ruta pasa de 2,5 s sin un margen
 * declarado aquí con su ADR. Demo en rojo (bitácora S2): `/es/nueva` en `lighthouse-urls.json` y Fichas a 2,8 s.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const urls = JSON.parse(
  readFileSync("lighthouse-urls.json", "utf8"),
) as string[];

type Presupuesto = {
  path: string;
  timings?: { metric: string; budget: number }[];
  resourceSizes?: { resourceType: string; budget: number }[];
};
const presupuestos = JSON.parse(
  readFileSync("perf-budget.json", "utf8"),
) as Presupuesto[];

/** La conversión de ruta a patrón de `@lhci/utils` (`budgets-converter.js`): `*` comodín, `$` final, prefijo. */
function patron(path: string): RegExp {
  if (!path || path === "/") return /.*/;
  const escapada = path
    .split("*")
    .map((p) => p.replace(/([-[\]{}()*+?.,\\^|#\s])/g, "\\$1"))
    .join(".*");
  return new RegExp(`https?://[^/]+${escapada}`);
}

const LCP = "largest-contentful-paint";
const LCP_MAXIMO = 2500;
/** Rutas con margen de LCP sobre los 2,5 s, cada una con su ADR (deuda declarada con sprint de pago). */
const MARGENES: Record<string, { lcp: number; adr: string }> = {
  "/*/playground": {
    lcp: 2800,
    adr: "decisions/011-margen-de-lcp-del-playground.md",
  },
};

const conLcp = presupuestos.filter((p) =>
  p.timings?.some((t) => t.metric === LCP),
);
const casan = (u: string, p: Presupuesto) =>
  patron(p.path).test(`http://localhost:3000${u}`);

describe("lighthouse-urls.json (AU-S2-B14)", () => {
  it("cubre las siete pantallas en español", () => {
    for (const p of [
      "/es",
      "/es/plan",
      "/es/agente",
      "/es/brecha",
      "/es/playground",
      "/es/fichas",
    ])
      expect(urls, p).toContain(p);
    expect(urls.some((u) => u.startsWith("/es/caso/"))).toBe(true);
  });

  it("y el inglés: la entrada y el playground", () => {
    expect(urls).toContain("/en");
    expect(urls).toContain("/en/playground");
  });
});

describe("perf-budget.json: el LCP por ruta (ADR-011)", () => {
  it.each(urls)("%s cae en exactamente un presupuesto de LCP", (u) => {
    expect(conLcp.filter((p) => casan(u, p)).map((p) => p.path)).toHaveLength(
      1,
    );
  });

  it("ninguna ruta pasa de 2,5 s sin un margen declarado con su ADR", () => {
    for (const p of conLcp) {
      const lcp = p.timings!.find((t) => t.metric === LCP)!.budget;
      expect(lcp, p.path).toBe(MARGENES[p.path]?.lcp ?? LCP_MAXIMO);
    }
    for (const [path, { adr }] of Object.entries(MARGENES)) {
      expect(conLcp.map((p) => p.path)).toContain(path);
      expect(readFileSync(adr, "utf8")).toContain(path);
    }
  });

  it("FCP, TBT, CLS y los pesos siguen valiendo para todas las URL", () => {
    const todas = presupuestos.find((p) => p.path === "/*")!;
    expect(todas.timings!.map((t) => t.metric).sort()).toEqual([
      "cumulative-layout-shift",
      "first-contentful-paint",
      "total-blocking-time",
    ]);
    expect(todas.resourceSizes!.map((r) => r.resourceType).sort()).toEqual([
      "script",
      "total",
    ]);
    for (const u of urls) expect(casan(u, todas), u).toBe(true);
  });
});
