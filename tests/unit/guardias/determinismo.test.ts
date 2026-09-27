/**
 * Guardia de determinismo (regla dura 1, G2 del diagramador): el núcleo y los reusables no leen el
 * reloj, no usan azar, no dependen de la configuración regional ni importan Node. Un archivo que lo
 * haga pone `pnpm test` en rojo con archivo:línea. La carnada prueba que cada regla puede fallar.
 * Demo en rojo (bitácora S1): un `Date.now()` en `core/formatos/huella.ts`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REGLAS: ReadonlyArray<{ nombre: string; patron: RegExp }> = [
  { nombre: "Date.now", patron: /\bDate\.now\b/ },
  { nombre: "new Date()", patron: /\bnew Date\s*\(/ },
  { nombre: "Math.random", patron: /\bMath\.random\b/ },
  { nombre: "Intl.", patron: /\bIntl\./ },
  { nombre: "toLocale*", patron: /\.toLocale[A-Za-z]*\s*\(/ },
  { nombre: "performance.now", patron: /\bperformance\.now\b/ },
  { nombre: "process.hrtime", patron: /\bprocess\.hrtime\b/ },
  { nombre: "crypto.randomUUID", patron: /\bcrypto\.randomUUID\b/ },
  { nombre: "crypto.getRandomValues", patron: /\bcrypto\.getRandomValues\b/ },
  { nombre: 'import "node:…"', patron: /from\s+["']node:/ },
  { nombre: "require(", patron: /\brequire\s*\(/ },
];

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

function hallazgos(texto: string, archivo: string): string[] {
  const lineas = texto.split("\n");
  const encontrados: string[] = [];
  lineas.forEach((linea, i) => {
    if (linea.trimStart().startsWith("//") || linea.trimStart().startsWith("*"))
      return; // comentarios
    for (const r of REGLAS)
      if (r.patron.test(linea))
        encontrados.push(`${archivo}:${i + 1} ${r.nombre}`);
  });
  return encontrados;
}

describe("guardia de determinismo del núcleo", () => {
  it("la carnada dispara las 11 reglas (el gate puede fallar)", () => {
    const carnada = readFileSync(
      "tests/fixtures/guardias/carnada-determinismo.txt",
      "utf8",
    );
    const h = hallazgos(carnada, "carnada");
    expect(h).toHaveLength(REGLAS.length);
    for (const r of REGLAS)
      expect(h.some((x) => x.endsWith(r.nombre))).toBe(true);
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
    const todos = archivos.flatMap((a) =>
      hallazgos(readFileSync(a, "utf8"), a),
    );
    expect(todos).toEqual([]);
  });
});
