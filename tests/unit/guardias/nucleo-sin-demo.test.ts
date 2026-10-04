// @vitest-environment node
/**
 * AU-S2-18 (RNF-06: «un demo nuevo no requiere cambiar el núcleo»): el núcleo del playground no escribe nombres
 * de señales ni valores de ningún demo. Lo que necesita del demo (la señal de la propuesta, su valor favorable, las
 * claves previas) llega como `OpcionesDeDemo` desde el manifiesto de la vitrina. Se leen los literales de texto con
 * el analizador de TypeScript, no los comentarios.
 *
 * Única excepción declarada: `aristas.ts`, el registro de funciones nombradas (`texas_y_no_aprobar`), espejo de
 * `agents/src/app_agents/reglas_arista.py` (regla dura 2: una regla que no cabe en la tripleta es una función
 * nombrada con sus entradas; las dos orillas la implementan).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const DIR = "core/playground";
const EXENTOS = new Set(["aristas.ts"]);
/** El vocabulario del demo A que el núcleo escribía (señales, valores y claves de su traza). */
const VOCABULARIO_DEMO = [
  "propuesta",
  "aprobar",
  "negar",
  "extraccion",
  "senal_confianza",
  "costo_estimado",
  "ciclos_aclaracion",
  "modo_texas",
];

export function literalesDeDemo(archivo: string, fuente: string): string[] {
  const sf = ts.createSourceFile(archivo, fuente, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visitar = (n: ts.Node) => {
    const linea = () => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (VOCABULARIO_DEMO.includes(n.text))
        out.push(`${archivo}:${linea()} «${n.text}»`);
    } else if (
      // `objeto.propuesta` era la otra forma: un acceso por nombre a una señal del demo. «propuesta» a secas es
      // también el campo genérico del compacto (`c.propuesta.senal`), así que aquí cuentan las señales y valores.
      ts.isPropertyAccessExpression(n) &&
      ts.isIdentifier(n.expression) &&
      n.expression.text === "objeto" &&
      VOCABULARIO_DEMO.includes(n.name.text)
    )
      out.push(`${archivo}:${linea()} «.${n.name.text}»`);
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return out;
}

describe("el núcleo del playground no conoce ningún demo", () => {
  it("ningún literal del vocabulario del demo A fuera del registro de funciones nombradas", () => {
    const fuera = readdirSync(DIR)
      .filter((f) => f.endsWith(".ts") && !EXENTOS.has(f))
      .flatMap((f) =>
        literalesDeDemo(join(DIR, f), readFileSync(join(DIR, f), "utf8")),
      );
    expect(fuera).toEqual([]);
  });

  it('demo en rojo: un `objeto.propuesta === "aprobar"` escrito en el núcleo se nombra', () => {
    expect(
      literalesDeDemo(
        "core/playground/falso.ts",
        'const x = o["propuesta"] === "aprobar";\nconst y = objeto.propuesta;\n',
      ),
    ).toEqual([
      "core/playground/falso.ts:1 «propuesta»",
      "core/playground/falso.ts:1 «aprobar»",
      "core/playground/falso.ts:2 «.propuesta»",
    ]);
  });
});
