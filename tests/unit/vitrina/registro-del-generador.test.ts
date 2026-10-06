/**
 * AU-S3-28: lo que los datos publicados traen y la vitrina NO pinta, a propósito. Es el registro del generador:
 * reproduce el lote, documenta la simulación o lo lee otro consumidor (el verificador, la afirmación de privacidad en
 * Markdown), y pintarlo no le dice nada nuevo a quien visita. La lista vive aquí para que crecer o encoger sea una
 * decisión con diff; la prueba exige que cada campo exista en los datos que publica la vitrina, para que la
 * declaración no se pudra cuando el generador cambie.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";

/** Un camino `a.b[].c` dentro de un objeto: `[]` recorre los elementos de una lista. */
function existe(raiz: unknown, camino: string): boolean {
  const pasos = camino.split(".");
  let actuales: unknown[] = [raiz];
  for (const p of pasos) {
    const lista = p.endsWith("[]");
    const k = lista ? p.slice(0, -2) : p;
    const siguientes: unknown[] = [];
    for (const a of actuales) {
      if (a === null || typeof a !== "object" || !Object.hasOwn(a, k)) continue;
      const v = (a as Record<string, unknown>)[k];
      if (lista) {
        if (Array.isArray(v)) siguientes.push(...v);
      } else siguientes.push(v);
    }
    if (siguientes.length === 0) return false;
    actuales = siguientes;
  }
  return true;
}

/** Campo · por qué no se pinta. */
const REGISTRO: Record<
  "demo-a" | "demo-b",
  Record<"lote" | "listas", Array<[string, string]>>
> = {
  "demo-a": {
    lote: [
      [
        "composicion.por_subtipo",
        "la vitrina cuenta por tipo; el subtipo de cada caso se lee en su página",
      ],
      [
        "proporciones",
        "la receta que el generador aplica; la composición real va en la fila Generador",
      ],
      [
        "umbrales_de_referencia",
        "los bordes que siembra el generador; los umbrales del plan van en el Plan",
      ],
      [
        "idioma_de_corrida",
        "el idioma en que se corrió; la vitrina publica los dos",
      ],
      [
        "afirmacion_privacidad",
        "se publica en AFIRMACION-DE-PRIVACIDAD.md, que enlaza el kit de prueba",
      ],
      [
        "politica_aclaraciones",
        "la usa el revisor simulado; la vitrina dice la del verificador",
      ],
      [
        "casos[].version_generador",
        "la del lote va en la fila Generador; la de cada caso es la misma",
      ],
      [
        "casos[].verdad_conocida.campos",
        "lo que el extractor debía leer; lo compara el verificador",
      ],
    ],
    listas: [],
  },
  "demo-b": {
    lote: [
      [
        "composicion.por_subtipo",
        "la vitrina cuenta por tipo; el subtipo de cada caso se lee en su página",
      ],
      [
        "proporciones",
        "la receta que el generador aplica; la composición real va en la fila Generador",
      ],
      [
        "umbrales_de_referencia",
        "los bordes que siembra el generador; los umbrales del plan van en el Plan",
      ],
      [
        "idioma_de_corrida",
        "el idioma en que se corrió; la vitrina publica los dos",
      ],
      [
        "afirmacion_privacidad",
        "se publica en AFIRMACION-DE-PRIVACIDAD.md, que enlaza el kit de prueba",
      ],
      [
        "politica_revisor",
        "la vitrina dice la del verificador (fila Revisión humana), redactada aparte",
      ],
      [
        "casos[].version_generador",
        "la del lote va en la fila Generador; la de cada caso es la misma",
      ],
      [
        "casos[].verdad_conocida.campos",
        "lo que el extractor debía leer; lo compara el verificador",
      ],
      [
        "casos[].verdad_conocida.reglas",
        "las reglas de verdad del generador; la decisión y sus motivos sí se pintan",
      ],
      [
        "casos[].verdad_conocida.en_lista",
        "lo dicen «en lista vinculante» y la entrada",
      ],
      [
        "casos[].verdad_conocida.conclusion_investigador",
        "la conclusión real del investigador se pinta desde la traza",
      ],
    ],
    listas: [
      ["nombre", "el nombre del conjunto; cada lista se nombra en el Plan"],
      ["aviso", "el aviso de simulación lo dice el rótulo de toda pantalla"],
      [
        "listas[].entradas[].motivo",
        "el motivo sintético de cada sanción; la coincidencia se cita por su entrada",
      ],
      [
        "reglas_verdad",
        "las reglas con que el generador fija la verdad; las del agente se citan en el expediente",
      ],
      [
        "unidad_de_ingreso",
        "la unidad de los ingresos sintéticos; los documentos la escriben",
      ],
    ],
  },
};

let datos: Record<"demo-a" | "demo-b", DatosDemo>;
beforeAll(async () => {
  datos = {
    "demo-a": await datosDemo("demo-a"),
    "demo-b": await datosDemo("demo-b"),
  };
});

describe("el registro del generador (AU-S3-28)", () => {
  it("lista lo que la vitrina no pinta, con su razón", () => {
    expect(
      Object.values(REGISTRO).flatMap((x) =>
        [...x.lote, ...x.listas].map(([c]) => c),
      ),
    ).toHaveLength(24);
    for (const x of Object.values(REGISTRO))
      for (const [c, porQue] of [...x.lote, ...x.listas])
        expect(porQue.length, c).toBeGreaterThan(20);
  });

  it.each(["demo-a", "demo-b"] as const)(
    "%s: cada campo declarado existe en los datos que publica la vitrina",
    (demo) => {
      const d = datos[demo];
      for (const [c] of REGISTRO[demo].lote)
        expect(existe(d.lote, c), `lote · ${c}`).toBe(true);
      if (d.id === "demo-b")
        for (const [c] of REGISTRO[demo].listas)
          expect(existe(d.listas, c), `listas · ${c}`).toBe(true);
    },
  );
});
