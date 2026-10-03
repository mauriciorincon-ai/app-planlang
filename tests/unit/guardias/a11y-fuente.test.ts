/**
 * Accesibilidad que se ve en el código fuente de la vitrina (AU-S2-B22, B26), sobre el árbol de sintaxis de cada
 * `.tsx` de `src/`:
 *  - ningún elemento lleva `title`: lo que solo vive ahí no llega con el teclado ni en táctil (WCAG 1.3.1, 2.1.1);
 *  - un `aria-label` sobre un elemento genérico (`span`, `div`, `p`, `pre`) exige su `role`: sin él, el nombre no
 *    se anuncia (ARIA 1.2 lo prohíbe en el rol `generic`).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const GENERICOS = new Set(["span", "div", "p", "pre"]);

export function problemasA11y(archivo: string, fuente: string): string[] {
  const sf = ts.createSourceFile(
    archivo,
    fuente,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const out: string[] = [];
  const visitar = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const etiqueta = n.tagName.getText(sf);
      if (/^[a-z]/.test(etiqueta)) {
        const attrs = new Set(
          n.attributes.properties
            .filter(ts.isJsxAttribute)
            .map((a) => a.name.getText(sf)),
        );
        const linea = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        if (attrs.has("title"))
          out.push(
            `${archivo}:${linea}: <${etiqueta} title> (información solo en el title)`,
          );
        if (
          GENERICOS.has(etiqueta) &&
          attrs.has("aria-label") &&
          !attrs.has("role")
        )
          out.push(`${archivo}:${linea}: <${etiqueta} aria-label> sin role`);
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return out;
}

function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? tsx(join(dir, e.name))
      : e.name.endsWith(".tsx")
        ? [join(dir, e.name)]
        : [],
  );
}

describe("accesibilidad en el fuente de la vitrina (AU-S2-B22, B26)", () => {
  it("la guardia reconoce lo que prohíbe", () => {
    expect(
      problemasA11y(
        "x.tsx",
        `const a = <span title="ruta">x</span>;
         const b = <span aria-label="cadena">y</span>;
         const c = <span role="group" aria-label="cadena">z</span>;
         const d = <Componente title="prop" />;`,
      ),
    ).toEqual([
      "x.tsx:1: <span title> (información solo en el title)",
      "x.tsx:2: <span aria-label> sin role",
    ]);
  });

  it("ningún componente de src/ la viola", () => {
    const raiz = process.cwd();
    const problemas = tsx(join(raiz, "src")).flatMap((f) =>
      problemasA11y(relative(raiz, f), readFileSync(f, "utf8")),
    );
    expect(problemas).toEqual([]);
  });
});
