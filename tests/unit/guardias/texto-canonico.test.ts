// @vitest-environment node
/**
 * Lo que sostiene el NFC del JCS entre motores (AU-S2-B9, ADR-003, adenda del S2): `core/formatos/jcs.ts` normaliza
 * cada cadena a NFC, y `String.prototype.normalize` depende de la versión de Unicode del motor. Si todo texto
 * versionado YA está en NFC y no trae sustitutos sueltos, la normalización no cambia nada y la huella no puede variar
 * entre Node, Chromium, Firefox y WebKit. Esta prueba recorre cada JSON versionado del repositorio.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** La carnada del contrato JCS lleva texto no normalizado a propósito: prueba que las dos orillas lo normalizan igual. */
const CARNADAS = new Set(["tests/contrato/jcs-valores-tramposos.json"]);

const SUELTO =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

export function problemasDeTexto(valor: unknown, ruta = "$"): string[] {
  if (typeof valor === "string") {
    const out: string[] = [];
    if (valor !== valor.normalize("NFC")) out.push(`${ruta}: no está en NFC`);
    if (SUELTO.test(valor)) out.push(`${ruta}: sustituto suelto`);
    return out;
  }
  if (Array.isArray(valor))
    return valor.flatMap((v, i) => problemasDeTexto(v, `${ruta}[${i}]`));
  if (valor && typeof valor === "object")
    return Object.entries(valor).flatMap(([k, v]) => [
      ...problemasDeTexto(k, `${ruta}.«clave»`),
      ...problemasDeTexto(v, `${ruta}.${k}`),
    ]);
  return [];
}

describe("texto canónico en lo versionado (AU-S2-B9)", () => {
  it("la prueba reconoce lo que veta", () => {
    expect(problemasDeTexto({ a: "é" })).toEqual(["$.a: no está en NFC"]);
    expect(problemasDeTexto(["\uD800"])).toEqual(["$[0]: sustituto suelto"]);
    expect(problemasDeTexto({ ok: "é", emoji: "😀" })).toEqual([]);
  });

  it("todo JSON versionado está en NFC y sin sustitutos sueltos", () => {
    const archivos = execFileSync("git", ["ls-files", "*.json"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => f && !CARNADAS.has(f));
    expect(archivos.length).toBeGreaterThan(300);
    const problemas = archivos.flatMap((f) =>
      problemasDeTexto(JSON.parse(readFileSync(f, "utf8"))).map(
        (p) => `${f} ${p}`,
      ),
    );
    expect(problemas).toEqual([]);
  });
});
