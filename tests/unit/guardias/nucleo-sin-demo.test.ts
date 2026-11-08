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
import { readdirSync, readFileSync, type Dirent } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const DIR = "core";
/**
 * Exentos, cada uno con su razón: el registro de funciones nombradas, la casa de los demos (`core/sintetico`: sus
 * esquemas, generadores y diccionarios; allí es donde SE nombra un demo, y `de-demo.ts` lo registra para el resto del
 * núcleo) y los archivos cuyo oficio es hablar de lo propio de un demo. Un exento que ya no tiene ni un literal sobra y
 * el segundo test lo dice.
 */
const EXENTOS: Readonly<Record<string, string>> = {
  "core/playground/aristas.ts":
    "registro de funciones nombradas, espejo de reglas_arista.py (regla dura 2)",
  "core/sintetico/": "la casa de los demos: sus esquemas y generadores",
  "core/formatos/traza.ts":
    "el formato planlang-trace/v1 declara la forma de la extracción de cada demo",
  "core/formatos/jerga.ts":
    "lista de palabras que el texto del líder no debe usar, no una referencia a un demo",
  "core/brecha/m9.ts":
    "las mutaciones adversariales de M9 (AH-002, AH-003) son del demo A por diseño",
  "core/brecha/informe.ts":
    "glosario bilingüe de los valores de decisión que el informe nombra",
  "core/brecha/contexto.ts":
    "SENAL_DE_CONFIANZA: la señal que miden la calibración y la curva (supuesto S1)",
  "core/comparar/resumen.ts":
    "la fila de comparación lee la decisión y la propuesta de la traza",
};
const esExento = (ruta: string) =>
  Object.keys(EXENTOS).some((e) =>
    e.endsWith("/") ? ruta.startsWith(e) : ruta === e,
  );

/** El vocabulario de los demos que el núcleo escribía (señales, valores y claves de su traza). */
const VOCABULARIO_DEMO = [
  "propuesta",
  "aprobar",
  "negar",
  "extraccion",
  "senal_confianza",
  "costo_estimado",
  "ciclos_aclaracion",
  "modo_texas",
  // El B (S9): lo que el núcleo no debe escribir por él.
  "beneficiarios",
  "tipo_solicitante",
  "juridica",
];

export function literalesDeDemo(archivo: string, fuente: string): string[] {
  const sf = ts.createSourceFile(archivo, fuente, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visitar = (n: ts.Node) => {
    const linea = () => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      // Un literal en posición de TIPO (`estado: "propuesta" | "aprobada"`) no es un valor que el núcleo escriba.
      if (!ts.isLiteralTypeNode(n.parent) && VOCABULARIO_DEMO.includes(n.text))
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

const archivosTs = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e: Dirent) => {
    const ruta = `${dir}/${e.name}`;
    return e.isDirectory()
      ? archivosTs(ruta)
      : e.name.endsWith(".ts")
        ? [ruta]
        : [];
  });

describe("el núcleo no conoce ningún demo (todo `core/`, no solo el playground)", () => {
  it("ningún literal del vocabulario de un demo fuera del registro de funciones nombradas y de `core/sintetico`", () => {
    const fuera = archivosTs(DIR)
      .filter((f) => !esExento(f))
      .flatMap((f) => literalesDeDemo(f, readFileSync(f, "utf8")));
    expect(fuera).toEqual([]);
  });

  it("cada exento sigue teniendo su razón: si ya no tiene un solo literal del vocabulario, sale de la lista", () => {
    for (const e of Object.keys(EXENTOS)) {
      const archivos = archivosTs(DIR).filter((f) =>
        e.endsWith("/") ? f.startsWith(e) : f === e,
      );
      expect(archivos.length, `${e} no existe`).toBeGreaterThan(0);
      const hits = archivos.flatMap((f) =>
        literalesDeDemo(f, readFileSync(f, "utf8")),
      );
      expect(hits.length, `${e} ya no necesita su exención`).toBeGreaterThan(0);
    }
  });

  it("recorre todo `core/` (brecha, comparar, plan, visor…), no solo el playground", () => {
    const vistos = new Set(archivosTs(DIR).map((f) => f.split("/")[1]));
    for (const c of ["brecha", "comparar", "plan", "playground", "visor"])
      expect(vistos.has(c), c).toBe(true);
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

  it("demo en rojo: el vocabulario del B escrito en `core/brecha` se nombra; un literal en posición de tipo no", () => {
    expect(
      literalesDeDemo(
        "core/brecha/falso.ts",
        'const t = v["tipo_solicitante"] === "juridica";\n',
      ),
    ).toEqual([
      "core/brecha/falso.ts:1 «tipo_solicitante»",
      "core/brecha/falso.ts:1 «juridica»",
    ]);
    expect(
      literalesDeDemo(
        "core/visor/falso.ts",
        'type E = { estado: "propuesta" | "aprobada" };\n',
      ),
    ).toEqual([]);
  });
});
