// @vitest-environment node
/**
 * La entrega del paquete a hoja-de-vida (AU-S2-7, AU-S2-8): el complemento conserva el `roadmap:` que administra la
 * planeadora, y el manifiesto tiene lector — un árbol con un archivo cambiado, uno que falta o uno que sobra (una
 * entrega vieja copiada encima) no pasa.
 */
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { fusionarComplemento } from "../../../scripts/paquete/complemento";
import {
  verificarContraManifiesto,
  type Arbol,
  type ManifiestoPaquete,
} from "../../../scripts/paquete/verificar";

const PROPUESTO = { app: "planlang", nombre: "planlang", estado: "inicial" };
const CON_ROADMAP = `app: "planlang"
nombre: "nombre viejo"
roadmap:
  - id: entrevistador-que-propone-el-plan
    titulo: { es: "Entrevistador", en: "Interviewer" }
`;

describe("AU-S2-7: el complemento conserva el roadmap de la planeadora", () => {
  it("sin archivo previo, solo lo que propone planlang", () => {
    const f = fusionarComplemento(PROPUESTO, null);
    expect(f.conservoRoadmap).toBe(false);
    expect(parse(f.yaml)).toEqual(PROPUESTO);
    expect(f.yaml.startsWith("# Complemento de la ficha técnica")).toBe(true);
  });

  it("con un roadmap previo, lo conserva tal cual y actualiza lo demás", () => {
    const f = fusionarComplemento(PROPUESTO, CON_ROADMAP);
    expect(f.conservoRoadmap).toBe(true);
    const y = parse(f.yaml) as Record<string, unknown>;
    expect(y.nombre).toBe("planlang");
    expect(y.roadmap).toEqual([
      {
        id: "entrevistador-que-propone-el-plan",
        titulo: { es: "Entrevistador", en: "Interviewer" },
      },
    ]);
  });

  it("planlang no propone un roadmap: lo rechaza", () => {
    expect(() =>
      fusionarComplemento({ ...PROPUESTO, roadmap: [] }, null),
    ).toThrow(/administra la planeadora/);
  });
});

function arbol(archivos: Record<string, string>): Arbol {
  return {
    listar: (carpeta) =>
      Object.keys(archivos).filter((r) => r.startsWith(carpeta)),
    sha256: (ruta) => archivos[ruta] ?? null,
  };
}

const M: ManifiestoPaquete = {
  formato: "planlang-paquete/v1",
  base: "/piezas/planlang",
  archivos: {
    "public/piezas/planlang/es.html": "a1",
    "public/piezas/planlang/_next/static/x-1.js": "b2",
    "data/fichas/planlang.yaml": "c3",
  },
};

describe("AU-S2-8: el manifiesto tiene lector", () => {
  it("el árbol que coincide pasa", () => {
    expect(verificarContraManifiesto(M, arbol({ ...M.archivos }))).toEqual([]);
  });

  it("un archivo cambiado, uno que falta y uno que sobra se nombran", () => {
    const p = verificarContraManifiesto(
      M,
      arbol({
        "public/piezas/planlang/es.html": "OTRO",
        "public/piezas/planlang/_next/static/x-0.js": "viejo",
        "data/fichas/planlang.yaml": "c3",
        // Fuera de la carpeta de la vitrina, hoja-de-vida tiene lo suyo: no cuenta como sobrante.
        "public/otra-pieza/index.html": "z",
      }),
    );
    expect(p).toEqual([
      "public/piezas/planlang/es.html no es el del manifiesto",
      "falta public/piezas/planlang/_next/static/x-1.js",
      "public/piezas/planlang/_next/static/x-0.js sobra: no está en el manifiesto (¿una entrega vieja? borra public/piezas/planlang/ antes de copiar)",
    ]);
  });

  it("otro formato no se lee", () => {
    expect(
      verificarContraManifiesto(
        { ...M, formato: "otro" as "planlang-paquete/v1" },
        arbol({}),
      ),
    ).toEqual(["el manifiesto no es planlang-paquete/v1 (otro)"]);
  });
});
