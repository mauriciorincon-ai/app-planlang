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
  /**
   * La planeadora publicó una versión más nueva y esta app sigue, a propósito, con la fijada (la orden del sprint la
   * fija): se declara con la versión y el sha256 del CONTRATO.md vigente allá y la decisión. Un cambio que nadie
   * declaró sigue fallando.
   */
  planeadora_adelante?: { version: string; sha256: string; decision: string };
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
    "la copia es byte a byte la versión vigente de la planeadora, o la diferencia está declarada (solo con la planeadora en la máquina)",
    () => {
      const vigente = join(PLANEADORA, paquete, "CONTRATO.md");
      const adelante = lock.planeadora_adelante;
      if (adelante) {
        // Declarado: la planeadora va en esa versión, exactamente, y la decisión está escrita.
        expect(sha(vigente)).toBe(adelante.sha256);
        expect(
          readFileSync(vigente, "utf8").match(/^version:\s*([0-9.]+)/m)?.[1],
        ).toBe(adelante.version);
        expect(adelante.version).not.toBe(lock.version);
        expect(adelante.decision.length).toBeGreaterThan(20);
        return;
      }
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

/**
 * Las enmiendas que el S2 propuso al contrato del diagramador (ADR-010 § 2, desviación 4 del S2, nota G15) vivían en el
 * lock (AU-S2-B13). La casa las aceptó en el 0.5.0: ya no se proponen, y el contrato fijado trae cada una. Las que el
 * S3 proponga van al lock con su fuente.
 */
describe("enmiendas al diagramador", () => {
  const lock = JSON.parse(
    readFileSync("packages/diagramador/CONTRATO.lock", "utf8"),
  ) as {
    version: string;
    fuente_metricas?: string;
    enmiendas_propuestas: { id: string; que: string; fuente: string }[];
  };
  const contrato = readFileSync(
    "packages/diagramador/contrato/CONTRATO.md",
    "utf8",
  );

  it("las del S2 entraron al 0.5.0: el contrato las trae y el lock ya no las propone", () => {
    const aceptadas: Record<string, RegExp> = {
      terminal: /\*\*`papel`\*\*.*`inicio` · `fin`/,
      "condicion.funcion": /\{ funcion, entradas: \[señal…\] \}/,
      "condicion.por_defecto": /\{ por_defecto: true \}/,
      "fuente.tipo-codigo":
        /\*\*`ruta` \+ `lineas` del repositorio si el tipo es `codigo`\*\*/,
      "glifo-regla-hexagono": /hex[aá]gono/i,
      "G15-inter": /options\.fuente_metricas/,
    };
    const ids = lock.enmiendas_propuestas.map((e) => e.id);
    for (const [id, enContrato] of Object.entries(aceptadas)) {
      expect(contrato, id).toMatch(enContrato);
      expect(ids, id).not.toContain(id);
    }
  });

  it("cada enmienda que el lock propone dice qué y de dónde sale", () => {
    for (const e of lock.enmiendas_propuestas) {
      expect(e.que.length, e.id).toBeGreaterThan(10);
      expect(e.fuente.length, e.id).toBeGreaterThan(3);
    }
  });

  it("el lock declara la fuente de las métricas (G15, 0.5.0)", () => {
    expect(lock.version).toBe("0.5.0");
    expect(lock.fuente_metricas).toBe("Inter");
  });
});
