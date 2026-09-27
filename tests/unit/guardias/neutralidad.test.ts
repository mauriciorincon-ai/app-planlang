/**
 * G6 del contrato instrumentos-de-plan (y G3 del diagramador): los reusables no contienen nombres de
 * dominio, plataforma ni producto. Se barren `packages/<objeto>/src` y `packages/<objeto>/datos` (sin tildes ni
 * mayúsculas) contra la lista de términos de los dominios de esta app y de la casa.
 * Demo en rojo (bitácora S1): la cadena «autorizaciones» en un comentario de `packages/…/src`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

export const TERMINOS_DE_DOMINIO = [
  "autorizacion",
  "afiliado",
  "medic",
  "aseguradora",
  "salud",
  "clinic",
  "financier",
  "vinculacion",
  "kyc",
  "lavado",
  "planlang",
  "demo-a",
  "demo_a",
  "big-d",
  "langgraph",
  "langchain",
  "langsmith",
  "claude",
  "anthropic",
];

function plano(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function archivos(dir: string): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir).sort()) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else if (/\.(ts|json)$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

export function hallazgosDeDominio(texto: string, archivo: string, terminos = TERMINOS_DE_DOMINIO): string[] {
  const encontrados: string[] = [];
  plano(texto)
    .split("\n")
    .forEach((linea, i) => {
      for (const t of terminos) if (linea.includes(t)) encontrados.push(`${archivo}:${i + 1} «${t}»`);
    });
  return encontrados;
}

describe("neutralidad de dominio de los reusables (G6)", () => {
  it("la carnada dispara", () => {
    expect(hallazgosDeDominio("// reglas de Autorizaciones médicas\nconst x = 1;", "carnada")).toEqual([
      "carnada:1 «autorizacion»",
      "carnada:1 «medic»",
    ]);
  });

  it("packages/*/src y packages/*/datos no nombran ningún dominio", () => {
    const rutas = readdirSync("packages")
      .sort()
      .flatMap((p) => ["src", "datos"].map((d) => join("packages", p, d)))
      .filter((r) => {
        try {
          return statSync(r).isDirectory();
        } catch {
          return false;
        }
      })
      .flatMap(archivos);
    expect(rutas.length).toBeGreaterThan(0);
    expect(rutas.flatMap((r) => hallazgosDeDominio(readFileSync(r, "utf8"), r))).toEqual([]);
  });
});
