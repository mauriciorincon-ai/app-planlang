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
  tabla_de_metricas?: Record<string, string>;
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

  it.runIf(paquete === "diagramador")(
    "la tabla de métricas del visor (G15) está en el lock con su huella",
    () => {
      const t = lock.tabla_de_metricas ?? {};
      const rutas = Object.keys(t).filter((k) => k !== "nota");
      expect(rutas).toEqual(["core/visor/metricas.json"]);
      for (const r of rutas) expect(sha(r), r).toBe(t[r]);
    },
  );

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

/**
 * Los contratos que planlang alimenta (ficha técnica de hoja-de-vida y brochure-export de la planeadora) viven
 * fijados en `docs/contratos/hoja-de-vida/` con su lock. Las reglas que el consumidor tiene solo en código (su Zod) se
 * reescriben en `src/lib/fichas/contrato.ts`: si ese código cambia allá, la huella de `reglas_en_codigo` lo delata.
 */
describe("contratos fijados de hoja-de-vida", () => {
  const base = join("docs", "contratos", "hoja-de-vida");
  const lock = JSON.parse(
    readFileSync(join(base, "CONTRATO.lock"), "utf8"),
  ) as {
    archivos: Record<string, string>;
    origen: Record<string, string>;
    version: Record<string, string>;
    reglas_en_codigo: Record<string, string>;
  };
  const CODE = join(homedir(), "Code");

  it("cada archivo de la copia está en el lock con su huella, y nada más", () => {
    const enDisco = archivos(base)
      .map((p) => relative(base, p))
      .filter((p) => p !== "CONTRATO.lock")
      .sort();
    expect(enDisco).toEqual(Object.keys(lock.archivos).sort());
    for (const [ruta, huella] of Object.entries(lock.archivos))
      expect(sha(join(base, ruta)), ruta).toBe(huella);
  });

  it("la versión del lock es la que declaran las copias", () => {
    const md = readFileSync(
      join(base, "ficha-tecnica", "CLAVE-VISUAL.md"),
      "utf8",
    );
    expect(md).toContain(`— v${lock.version["ficha-tecnica"]}`);
    const exp = readFileSync(
      join(base, "brochure-export", "contrato-brochure-export-v1.0.0.md"),
      "utf8",
    );
    expect(exp.match(/^version:\s*([0-9.]+)/m)?.[1]).toBe(
      lock.version["brochure-export"],
    );
  });

  it.skipIf(!existsSync(join(CODE, "app-hoja-de-vida")))(
    "la copia y las reglas en código son las vigentes en hoja-de-vida y la planeadora (solo con ellas en la máquina)",
    () => {
      for (const [ruta, origen] of Object.entries(lock.origen))
        expect(sha(join(CODE, origen)), ruta).toBe(lock.archivos[ruta]);
      for (const [ruta, huella] of Object.entries(lock.reglas_en_codigo))
        if (ruta !== "nota") expect(sha(join(CODE, ruta)), ruta).toBe(huella);
    },
  );
});
