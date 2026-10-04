// Los presupuestos de `perf-budget.json` con la semántica EXACTA de LHCI (`@lhci/utils/src/budgets-converter.js`):
// `*` es comodín, `$` ancla el final y lo demás es prefijo, contra la URL entera; y LHCI aplica TODAS las entradas
// que casan con una URL (ADR-011). Lo comparten `scripts/lighthouse-margen.mjs` y `tests/unit/guardias/
// lighthouse-urls.test.ts`: si el script leyera los presupuestos de otra forma que el job, avisaría sobre lo que el
// job no mide.

/** La conversión de ruta a patrón de `@lhci/utils` (`convertPathExpressionToRegExp`). */
export function patronDeRuta(path) {
  if (!path || path === "/") return /.*/;
  const escapada = path
    .split("*")
    .map((p) => p.replace(/([-[\]{}()*+?.,\\^|#\s])/g, "\\$1"))
    .join(".*");
  return new RegExp(`https?://[^/]+${escapada}`);
}

/** Todas las entradas de `perf-budget.json` que LHCI aplica a una ruta medida (`/es/playground`). */
export function presupuestosDe(ruta, presupuestos) {
  return presupuestos.filter((p) =>
    patronDeRuta(p.path).test(`http://localhost${ruta}`),
  );
}
