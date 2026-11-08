/**
 * Gate de contrato de los beneficiarios finales (S9, regla 19; ADR-019): el nodo `beneficiarios` del agente en Python
 * (`agents/src/app_agents/demo_b/beneficiarios.py`, con `Fraction`) es quien escribe lo esperado; el gemelo de verdad
 * en TS (`core/sintetico/demo-b/beneficiarios.ts`, con `BigInt`), con el que el generador fija la verdad conocida,
 * tiene que dar lo mismo al bit, en Node y en jsdom. Las entradas son las estructuras que produce el serializador real
 * (el lote `planlang-b-002-20`) y casos chicos que fuerzan cada borde (`scripts/beneficiarios-contrato.ts`).
 * Regenerar, en este orden: `npx tsx scripts/beneficiarios-contrato.ts` y
 * `agents/.venv/bin/python tests/contrato/beneficiarios_agente.py --escribir`.
 *
 * Demos en rojo (cierre del S9): la participación indirecta sumada en vez de multiplicada, y el 25,00 % tratado como
 * «menos de».
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  beneficiariosDe,
  type EstructuraLeida,
  type ResultadoDeBeneficiarios,
} from "../../core/sintetico/demo-b/beneficiarios";
import {
  ARCHIVO_ENTRADAS,
  entradasDelContrato,
  FORMATO_ENTRADAS,
} from "../../scripts/beneficiarios-contrato";

const entradas = JSON.parse(readFileSync(ARCHIVO_ENTRADAS, "utf8")) as {
  formato: string;
  casos: { nombre: string; estructura: EstructuraLeida }[];
};
const esperada = JSON.parse(
  readFileSync("tests/contrato/beneficiarios-esperada.json", "utf8"),
) as {
  formato: string;
  casos: { nombre: string; resultado: ResultadoDeBeneficiarios }[];
};
const estructura = (nombre: string) =>
  entradas.casos.find((c) => c.nombre === nombre)!.estructura;

describe("contrato de los beneficiarios Python → TS", () => {
  it("los dos archivos son el formato esperado y traen los mismos casos, con cada borde", () => {
    expect(entradas.formato).toBe(FORMATO_ENTRADAS);
    expect(esperada.formato).toBe("planlang-contrato-beneficiarios/v1");
    const nombres = entradas.casos.map((c) => c.nombre);
    expect(esperada.casos.map((c) => c.nombre)).toEqual(nombres);
    expect(nombres.filter((n) => n.startsWith("lote:"))).toHaveLength(8);
    for (const n of [
      "borde-25-exacto-por-dos-vias",
      "borde-24-99",
      "borde-24-995-se-muestra-25-y-no-llega",
      "dos-caminos-suman-26",
      "cadena-de-cuatro-niveles",
      "ciclo",
      "suma-sobre-100",
      "porcentaje-tres-decimales-y-cero",
      "referencias-rotas",
      "sin-entidad",
      "id-repetido",
      "solo-control",
      "en-el-tope-16-sociedades",
      "sobre-el-tope-17-sociedades",
      "sobre-el-tope-33-personas",
      "sobre-el-tope-65-participaciones",
    ])
      expect(nombres).toContain(n);
  });

  it("las entradas siguen siendo las de hoy: el lote versionado y los casos a mano", () => {
    expect(entradasDelContrato()).toBe(readFileSync(ARCHIVO_ENTRADAS, "utf8"));
  });

  it.each(esperada.casos.map((c) => [c.nombre, c] as const))(
    "da los mismos beneficiarios que el nodo de Python: %s",
    (nombre, c) => {
      expect(
        JSON.parse(JSON.stringify(beneficiariosDe(estructura(nombre)))),
      ).toEqual(c.resultado);
    },
  );

  it("los bordes dicen lo que la norma dice: el 25,00 % entra, el 24,99 % y el 24,995 % no", () => {
    const r = (n: string) => esperada.casos.find((c) => c.nombre === n)!.resultado;
    expect(r("borde-25-exacto-por-dos-vias").por_participacion).toContain(
      "SYN-ID-000001",
    );
    expect(r("borde-24-99").por_participacion).toEqual(["SYN-ID-000003"]);
    const redondeo = r("borde-24-995-se-muestra-25-y-no-llega");
    expect(
      redondeo.participaciones.find((x) => x.documento === "SYN-ID-000001")
        ?.porcentaje,
    ).toBe("25.00");
    expect(redondeo.por_participacion).toEqual(["SYN-ID-000002"]);
    expect(r("ciclo")).toMatchObject({ valida: false, beneficiarios: null });
  });

  it("el tope de tamaño: en el borde se calcula; un paso más es RB-03, igual en los dos lados (S10, M3)", () => {
    const r = (n: string) => esperada.casos.find((c) => c.nombre === n)!.resultado;
    expect(r("en-el-tope-16-sociedades")).toMatchObject({
      valida: true,
      beneficiarios: ["SYN-ID-000001"],
    });
    for (const [nombre, campo] of [
      ["sobre-el-tope-17-sociedades", "entidades"],
      ["sobre-el-tope-33-personas", "personas"],
      ["sobre-el-tope-65-participaciones", "participaciones"],
    ] as const)
      expect(r(nombre)).toMatchObject({
        valida: false,
        beneficiarios: null,
        problemas: [`demasiado_grande:${campo}`],
      });
  });
});
