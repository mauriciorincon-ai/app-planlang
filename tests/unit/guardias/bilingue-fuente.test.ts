/**
 * Regla 20 en el código de la vitrina (AU-S2-B17, B18): ninguna palabra se elige con un ternario de idioma
 * (`i === "es" ? "de" : "of"`) en `src/`. Lo que se lee nace como mapa `{ es, en }` en `src/textos/`, redactado entero
 * en cada idioma; un fragmento traducido alrededor de los datos no es una redacción. Quedan fuera los códigos de
 * idioma (`"es"`, `"en"`), los valores de atributo (`"true"`), las rutas (`".en"`, `docs/…json`) y `src/lib/vista/formato.ts`,
 * que da formato a números y listas («7.083», «0,75», «A, B y C»), no redacta.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const EXENTOS = new Set(["src/lib/vista/formato.ts"]);
const PERMITIDOS = new Set(["es", "en", "true", "false"]);

function textos(n: ts.Node, sf: ts.SourceFile): string[] {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
    return [n.text];
  if (ts.isTemplateExpression(n))
    return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)];
  if (ts.isParenthesizedExpression(n)) return textos(n.expression, sf);
  if (ts.isConditionalExpression(n))
    return [...textos(n.whenTrue, sf), ...textos(n.whenFalse, sf)];
  return [];
}

/** `i === "es"`, `"en" !== idioma`, y también la bandera `es` / `!es` que algunas vistas sacan de ella. */
function esPreguntaDeIdioma(c: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(c)) return esPreguntaDeIdioma(c.expression);
  if (ts.isIdentifier(c)) return c.text === "es" || c.text === "en";
  if (
    ts.isPrefixUnaryExpression(c) &&
    c.operator === ts.SyntaxKind.ExclamationToken
  )
    return esPreguntaDeIdioma(c.operand);
  if (!ts.isBinaryExpression(c)) return false;
  const op = c.operatorToken.kind;
  if (
    op !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
    op !== ts.SyntaxKind.ExclamationEqualsEqualsToken
  )
    return false;
  const lit = [c.left, c.right].find(ts.isStringLiteral);
  return lit !== undefined && (lit.text === "es" || lit.text === "en");
}

export function ternariosDeIdioma(archivo: string, fuente: string): string[] {
  const sf = ts.createSourceFile(
    archivo,
    fuente,
    ts.ScriptTarget.Latest,
    true,
    archivo.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: string[] = [];
  const visitar = (n: ts.Node) => {
    if (ts.isConditionalExpression(n) && esPreguntaDeIdioma(n.condition)) {
      const palabras = [
        ...textos(n.whenTrue, sf),
        ...textos(n.whenFalse, sf),
      ].filter(
        (t) =>
          /\p{L}{2,}/u.test(t) &&
          !PERMITIDOS.has(t.trim()) &&
          !t.startsWith(".") &&
          !/^[\w.-]+\/[\w./-]+$/.test(t),
      );
      if (palabras.length) {
        const linea = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        out.push(
          `${archivo}:${linea}: ${palabras.map((p) => `«${p.trim()}»`).join(" / ")}`,
        );
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return out;
}

function fuentes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? fuentes(join(dir, e.name))
      : /\.tsx?$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );
}

describe("regla 20: sin ternarios de idioma con palabras (AU-S2-B17, B18)", () => {
  it("la guardia reconoce lo que prohíbe", () => {
    expect(
      ternariosDeIdioma(
        "x.ts",
        `const a = \`\${n} \${i === "es" ? "de" : "of"} \${m}\`;
         const b = i === "es" ? "en" : "es";
         const c = idioma === "es" ? "true" : undefined;
         const d = i === "es" ? "" : ".en";
         const e = i === "es" ? "," : ".";
         const f = es ? \`real · corrida \${v}\` : \`real · run \${v}\`;
         const g = !es ? "cases" : "casos";`,
      ),
    ).toEqual([
      "x.ts:1: «de» / «of»",
      "x.ts:6: «real · corrida» / «real · run»",
      "x.ts:7: «cases» / «casos»",
    ]);
  });

  it("src/ no elige palabras por idioma fuera de los textos", () => {
    const raiz = process.cwd();
    const problemas = fuentes(join(raiz, "src"))
      .map((f) => relative(raiz, f))
      .filter((f) => !f.startsWith("src/textos/") && !EXENTOS.has(f))
      .flatMap((f) =>
        ternariosDeIdioma(f, readFileSync(join(raiz, f), "utf8")),
      );
    expect(problemas).toEqual([]);
  });
});
