/**
 * Copia fijada de los contratos de los reusables (CLAUDE.md regla 11; diagramador § 8): cada paquete guarda en
 * `contrato/` lo que consume de la planeadora y `CONTRATO.lock` sus huellas SHA-256. Este gate recalcula las
 * huellas en la CI (la copia no se editó a mano) y, cuando la planeadora está en la máquina, compara byte a byte
 * con ella (la copia es la versión vigente). Se renueva copiando, nunca editando.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const PLANEADORA = join(homedir(), "Code", "hr01-develop-ai-apps", "reusables");
const PAQUETES = ["diagramador", "instrumentos-de-plan"] as const;

interface Lock {
  objeto: string;
  version: string;
  sha256: string;
  archivos: Record<string, string>;
}

const sha = (ruta: string) =>
  createHash("sha256").update(readFileSync(ruta)).digest("hex");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : [p];
  });
}

describe.each(PAQUETES)("contrato fijado de %s", (paquete) => {
  const base = join("packages", paquete);
  const lock = JSON.parse(
    readFileSync(join(base, "CONTRATO.lock"), "utf8"),
  ) as Lock;
  const copia = join(base, "contrato");

  it("cada archivo de la copia está en el lock con su huella, y nada más", () => {
    const enDisco = archivos(copia)
      .map((p) => relative(copia, p))
      .sort();
    expect(enDisco).toEqual(Object.keys(lock.archivos).sort());
    for (const [ruta, huella] of Object.entries(lock.archivos))
      expect(sha(join(copia, ruta)), ruta).toBe(huella);
    expect(lock.sha256).toBe(lock.archivos["CONTRATO.md"]);
  });

  it("la versión del lock es la del contrato copiado", () => {
    const md = readFileSync(join(copia, "CONTRATO.md"), "utf8");
    expect(md.match(/^version:\s*([0-9.]+)/m)?.[1]).toBe(lock.version);
  });

  it.skipIf(!existsSync(join(PLANEADORA, paquete)))(
    "la copia es byte a byte la versión vigente de la planeadora (solo con la planeadora en la máquina)",
    () => {
      for (const ruta of Object.keys(lock.archivos))
        expect(sha(join(PLANEADORA, paquete, ruta)), ruta).toBe(
          lock.archivos[ruta],
        );
    },
  );
});
