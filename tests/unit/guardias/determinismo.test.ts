/**
 * Guardia de determinismo (regla dura 1, G2 del diagramador): el núcleo y los reusables no leen el reloj ni el
 * entorno, no usan azar, no dependen de la configuración regional ni importan Node. Un archivo que lo haga pone
 * `pnpm test` en rojo con archivo:línea. Las carnadas prueban que cada regla puede fallar.
 *
 * Lee el árbol de sintaxis, no las líneas (AU-S2-B8): un token partido en dos líneas (`Date\n  .now()`) no se escapa
 * y lo que está en un comentario no cuenta. Demo en rojo (bitácora S1): un `Date.now()` en `core/formatos/huella.ts`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import { dirname, join, normalize } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const BUILTINS = new Set(builtinModules);
const esDeNode = (m: string) =>
  m.startsWith("node:") || BUILTINS.has(m.split("/")[0]!);

/** Las reglas del núcleo: un nombre por cada forma prohibida que el recorrido reconoce. */
export const REGLAS = [
  "Date.now",
  "new Date",
  "Date()",
  "Math.random",
  "Intl.",
  "toLocale*",
  "performance.now",
  "process.hrtime",
  "process.env",
  "crypto.randomUUID",
  "crypto.getRandomValues",
  'import "node:…"',
  'import("node:…")',
  "require(",
] as const;

/** G2, además, para lo que corre en el navegador: funciones inexactas, `**`, `localeCompare` y medir el DOM. */
export const REGLAS_G2 = [
  "Math inexacta",
  "**",
  "localeCompare",
  "medición del DOM",
] as const;

const INEXACTAS =
  /^(sin|cos|tan|asin|acos|atan2?|exp|expm1|log\w*|pow|cbrt|hypot|sinh|cosh|tanh)$/;
const DOM = /^(getBBox|getComputedTextLength|measureText)$/;

/** Los hallazgos de un archivo, `archivo:línea regla`, sin repetir. */
export function hallazgos(
  texto: string,
  archivo: string,
  g2 = false,
): string[] {
  const sf = ts.createSourceFile(archivo, texto, ts.ScriptTarget.Latest, true);
  const out = new Set<string>();
  const marcar = (n: ts.Node, regla: string) =>
    out.add(
      `${archivo}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${regla}`,
    );
  const nombre = (e: ts.Expression) => e.getText(sf).replace(/\s+/g, "");
  const visitar = (n: ts.Node) => {
    if (ts.isPropertyAccessExpression(n)) {
      const base = nombre(n.expression);
      const p = n.name.text;
      const par = `${base}.${p}`;
      for (const r of [
        "Date.now",
        "Math.random",
        "performance.now",
        "process.hrtime",
        "process.env",
        "crypto.randomUUID",
        "crypto.getRandomValues",
      ])
        if (par === r || par.endsWith(`.${r}`)) marcar(n, r);
      if (base === "Intl") marcar(n, "Intl.");
      if (p.startsWith("toLocale")) marcar(n, "toLocale*");
      if (g2 && base === "Math" && INEXACTAS.test(p))
        marcar(n, "Math inexacta");
      if (g2 && p === "localeCompare") marcar(n, "localeCompare");
      if (g2 && DOM.test(p)) marcar(n, "medición del DOM");
    } else if (ts.isNewExpression(n) && nombre(n.expression) === "Date") {
      marcar(n, "new Date");
    } else if (ts.isCallExpression(n)) {
      if (n.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const a = n.arguments[0];
        if (a && ts.isStringLiteralLike(a) && esDeNode(a.text))
          marcar(n, 'import("node:…")');
      } else if (ts.isIdentifier(n.expression)) {
        if (n.expression.text === "Date") marcar(n, "Date()");
        if (n.expression.text === "require") marcar(n, "require(");
      }
    } else if (
      (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) &&
      n.moduleSpecifier &&
      ts.isStringLiteral(n.moduleSpecifier) &&
      esDeNode(n.moduleSpecifier.text)
    ) {
      marcar(n, 'import "node:…"');
    } else if (
      g2 &&
      ts.isBinaryExpression(n) &&
      (n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskToken ||
        n.operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken)
    ) {
      marcar(n, "**");
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return [...out];
}

function archivosTs(raiz: string): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string): void => {
    for (const nombre of readdirSync(dir).sort()) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) {
        if (nombre !== "tests" && nombre !== "node_modules") recorrer(ruta);
      } else if (
        ruta.endsWith(".ts") &&
        !ruta.endsWith(".test.ts") &&
        !ruta.endsWith(".d.ts")
      ) {
        salida.push(ruta);
      }
    }
  };
  recorrer(raiz);
  return salida;
}

/**
 * Lo que corre en el navegador: los módulos del núcleo que importa la vitrina en el cliente (el playground y los
 * glifos del visor) y todo el visor, con lo que importan por valor (no por tipo), siguiendo los imports relativos.
 */
export function enElNavegador(): string[] {
  const vistos = new Set<string>();
  const pendientes = [
    "core/playground/consecuencias.ts",
    ...archivosTs("core/visor"),
  ];
  while (pendientes.length) {
    const f = normalize(pendientes.pop()!);
    if (vistos.has(f)) continue;
    vistos.add(f);
    const sf = ts.createSourceFile(
      f,
      readFileSync(f, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const s of sf.statements)
      if (
        (ts.isImportDeclaration(s) || ts.isExportDeclaration(s)) &&
        s.moduleSpecifier &&
        ts.isStringLiteral(s.moduleSpecifier) &&
        s.moduleSpecifier.text.startsWith(".") &&
        !(ts.isImportDeclaration(s) ? s.importClause?.isTypeOnly : s.isTypeOnly)
      ) {
        const m = s.moduleSpecifier.text;
        if (m.endsWith(".json")) continue; // datos, no código
        pendientes.push(join(dirname(f), m.endsWith(".ts") ? m : `${m}.ts`));
      }
  }
  return [...vistos].sort();
}

describe("guardia de determinismo del núcleo", () => {
  it("la carnada dispara cada regla (el gate puede fallar), también con un token partido y en un comentario no", () => {
    const h = hallazgos(
      readFileSync("tests/fixtures/guardias/carnada-determinismo.txt", "utf8"),
      "carnada",
    );
    for (const r of REGLAS)
      expect(
        h.some((x) => x.endsWith(` ${r}`)),
        r,
      ).toBe(true);
    expect(h.some((x) => x.startsWith("carnada:1 "))).toBe(false); // la línea 1 es un comentario
  });

  it("core/ y packages/*/src no contienen tokens prohibidos", () => {
    const raices = [
      "core",
      ...readdirSync("packages")
        .sort()
        .map((p) => join("packages", p, "src")),
    ].filter((r) => {
      try {
        return statSync(r).isDirectory();
      } catch {
        return false;
      }
    });
    const archivos = raices.flatMap(archivosTs);
    expect(archivos.length).toBeGreaterThan(0);
    expect(
      archivos.flatMap((a) => hallazgos(readFileSync(a, "utf8"), a)),
    ).toEqual([]);
  });
});

/**
 * G2 del diagramador para todo lo que corre en el navegador (AU-S2-B8: antes, solo `core/visor`; el playground corre
 * ahí con `core/brecha/numeros.ts`). Demo en rojo (bitácora S2): un `Math.cos` en `core/visor/geometria.ts`.
 */
describe("guardia G2 de lo que corre en el navegador", () => {
  it("la carnada dispara cada regla (el gate puede fallar)", () => {
    const h = hallazgos(
      readFileSync("tests/fixtures/guardias/carnada-visor-g2.txt", "utf8"),
      "carnada",
      true,
    );
    expect(
      h.filter((x) => REGLAS_G2.some((r) => x.endsWith(` ${r}`))),
    ).toHaveLength(13);
    for (const r of REGLAS_G2)
      expect(
        h.some((x) => x.endsWith(` ${r}`)),
        r,
      ).toBe(true);
  });

  it("el cierre del navegador incluye el playground, el visor y lo que importan", () => {
    const n = enElNavegador();
    expect(n).toContain("core/playground/aristas.ts");
    expect(n).toContain("core/brecha/numeros.ts");
    expect(n).toContain("core/visor/geometria.ts");
  });

  it("nada de lo que corre en el navegador usa funciones inexactas, `**`, localeCompare ni medición del DOM", () => {
    const archivos = enElNavegador();
    expect(
      archivos
        .flatMap((a) => hallazgos(readFileSync(a, "utf8"), a, true))
        .filter((x) => REGLAS_G2.some((r) => x.endsWith(` ${r}`))),
    ).toEqual([]);
  });
});

/**
 * La vitrina se arma al compilar con lo que diga el Node de esa máquina: en `src/lib` nada depende de la configuración
 * regional (`Intl`, `toLocale*`, `localeCompare`), que cambia con el ICU del motor (AU-S2-B7).
 */
describe("la vista de la vitrina no depende de la configuración regional", () => {
  it("src/lib no usa Intl, toLocale* ni localeCompare", () => {
    const REGIONALES = ["Intl.", "toLocale*", "localeCompare"];
    const archivos = archivosTs("src/lib");
    expect(archivos.length).toBeGreaterThan(10);
    expect(
      archivos
        .flatMap((a) => hallazgos(readFileSync(a, "utf8"), a, true))
        .filter((x) => REGIONALES.some((r) => x.endsWith(` ${r}`))),
    ).toEqual([]);
  });
});
