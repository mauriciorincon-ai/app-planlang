/**
 * Gate E-11 (legal F13, RF-03.4): NINGÚN archivo del conjunto sintético ni de las corridas exportadas
 * contiene un identificador con formato real. Recorre `data/casos/`, `data/plan-beneficios/` y
 * `runs/` (si existe: la salida de un modelo también podría inventar un teléfono real).
 * Las tres carnadas de `tests/fixtures/identificadores/` prueban que el gate PUEDE fallar.
 * Demo en rojo (bitácora S1, fase 2): una cédula real inyectada en el lote de 20 → rojo con la ruta.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validarIdentificadores } from "../../../core/sintetico/validador-identificadores";

const RAICES = ["data/casos", "data/plan-beneficios", "data/listas", "runs"];

function jsonBajo(raiz: string): string[] {
  if (!existsSync(raiz)) return [];
  const salida: string[] = [];
  for (const nombre of readdirSync(raiz).sort()) {
    const ruta = join(raiz, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...jsonBajo(ruta));
    else if (ruta.endsWith(".json")) salida.push(ruta);
  }
  return salida;
}

interface Carnada {
  id: string;
  regla_esperada: string;
  caso: unknown;
}

describe("gate de identificadores (E-11)", () => {
  it("las tres carnadas se ponen en rojo con su regla (el gate puede fallar)", () => {
    const carnadas = JSON.parse(
      readFileSync("tests/fixtures/identificadores/carnadas.json", "utf8"),
    ) as Carnada[];
    expect(carnadas.map((c) => c.regla_esperada)).toEqual([
      "cedula_rango_real",
      "nit_dv_valido",
      "hipaa_ssn",
    ]);
    for (const c of carnadas)
      expect(
        validarIdentificadores(c.caso).map((h) => h.regla),
        c.id,
      ).toContain(c.regla_esperada);
  });

  it("demo B: un nombre fuera de los diccionarios en una lista o en una extracción se pone en rojo; la caja no importa", () => {
    const carnada = {
      listas: [
        { entradas: [{ nombre: "Juan Pérez García", alias: ["Juan Pérez"] }] },
      ],
      extraccion: {
        campos: {
          nombre: "LUCÍA VARNESA QUINDRAL",
          titular_fondos: "Pedro Ramírez",
        },
      },
    };
    expect(
      validarIdentificadores(carnada).map((h) => `${h.regla} ${h.fragmento}`),
    ).toEqual([
      "nombre_fuera_de_lista Pedro Ramírez",
      "nombre_fuera_de_lista Juan Pérez",
      "nombre_fuera_de_lista Juan Pérez García",
    ]);
  });

  const archivos = RAICES.flatMap(jsonBajo);

  it("hay conjunto que revisar (los lotes versionados existen)", () => {
    expect(archivos.some((a) => a.startsWith("data/casos/"))).toBe(true);
    expect(archivos.some((a) => a.startsWith("data/plan-beneficios/"))).toBe(
      true,
    );
    expect(archivos).toContain("data/listas/demo-b.json");
  });

  it.each(archivos)(
    "%s no contiene identificadores con formato real",
    (archivo) => {
      const hallazgos = validarIdentificadores(
        JSON.parse(readFileSync(archivo, "utf8")),
      );
      expect(
        hallazgos.map((h) => `[${h.regla}] ${h.ruta}: ${h.fragmento}`),
      ).toEqual([]);
    },
  );
});
