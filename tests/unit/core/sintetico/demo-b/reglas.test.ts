/**
 * Reglas deterministas del B: inconsistencias (RI-xx) y puntaje (RP-xx). Incluye la PRUEBA DE PERMUTACIÓN (D4 del
 * plan B, RP-04): intercambiar entre casos el nombre, el documento, el año de nacimiento y la nacionalidad no mueve
 * ningún puntaje del lote de 200. Demo en rojo (bitácora S3, fase 2): sumar la nacionalidad al puntaje → rojo.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  identidadVerificable,
  inconsistencias,
  puntaje,
} from "../../../../../core/sintetico/demo-b/reglas";
import {
  ListasSchema,
  LoteBSchema,
  type CamposB,
} from "../../../../../core/sintetico/demo-b/esquema";
import { crearAzar } from "../../../../../core/sintetico/sfc32";

const listas = ListasSchema.parse(
  JSON.parse(readFileSync("data/listas/demo-b.json", "utf8")),
);
const lote = LoteBSchema.parse(
  JSON.parse(readFileSync("data/casos/demo-b/planlang-b-001-200.json", "utf8")),
);

const base: CamposB = {
  nombre: "Lucía Varnesa Quindral",
  documento: "SYN-ID-123456",
  nacimiento: 1980,
  nacionalidad: "SYN-J-01",
  actividad: "SYN-ACT-01",
  ingresos_mensuales: 3000,
  jurisdiccion_fondos: "SYN-J-01",
  titular_actividad: "SYN-ID-123456",
  titular_fondos: "Varnesa Quindral Lucía",
};

describe("inconsistencias", () => {
  it("un expediente completo y coherente no tiene ninguna (el titular invertido no cuenta)", () => {
    expect(inconsistencias(base)).toEqual([]);
    expect(identidadVerificable(base)).toBe(true);
  });

  it("cuenta cada dato exigido que falta (RI-01) y los titulares distintos (RI-02, RI-03)", () => {
    const c = {
      ...base,
      nacionalidad: null,
      titular_actividad: "SYN-ID-654321",
      titular_fondos: "Clara Galdrin Murenzo",
    };
    expect(inconsistencias(c).map((i) => i.regla)).toEqual([
      "RI-01",
      "RI-02",
      "RI-03",
    ]);
    expect(identidadVerificable(c)).toBe(false);
    expect(identidadVerificable({ ...base, nacionalidad: null })).toBe(true);
  });
});

describe("puntaje de riesgo", () => {
  it("suma los tres factores con los pesos del archivo de listas", () => {
    const r = puntaje(
      {
        ...base,
        actividad: "SYN-ACT-07",
        jurisdiccion_fondos: "SYN-J-06",
        ingresos_mensuales: 500,
      },
      listas,
    );
    expect(r.componentes.map((c) => [c.regla, c.nivel, c.puntos])).toEqual([
      ["RP-01", "alto", 40],
      ["RP-02", "alto", 30],
      ["RP-03", "incoherente", 30],
    ]);
    expect(r.total).toBe(100);
  });

  it("lo que no se declara puntúa como el máximo de su factor", () => {
    const r = puntaje(
      { ...base, actividad: null, jurisdiccion_fondos: null },
      listas,
    );
    expect(r.total).toBe(
      listas.puntaje.actividad.sin_dato +
        listas.puntaje.jurisdiccion.sin_dato +
        listas.puntaje.coherencia.sin_dato,
    );
  });

  it("los ingresos en el borde del rango típico son coherentes", () => {
    const act = listas.actividades.find((a) => a.codigo === "SYN-ACT-01")!;
    for (const x of [act.ingreso_tipico.min, act.ingreso_tipico.max])
      expect(
        puntaje({ ...base, ingresos_mensuales: x }, listas).componentes[2]
          ?.nivel,
      ).toBe("coherente");
  });

  it("PERMUTACIÓN: intercambiar nombre, documento, año de nacimiento y nacionalidad entre casos no cambia ningún puntaje", () => {
    const campos = lote.casos.map((c) => c.verdad_conocida.campos);
    const orden = crearAzar("permutacion-de-nombres").barajar(
      campos.map((_, i) => i),
    );
    const permutados = campos.map((c, i) => {
      const otro = campos[orden[i] as number] as CamposB;
      return {
        ...c,
        nombre: otro.nombre,
        documento: otro.documento,
        nacimiento: otro.nacimiento,
        nacionalidad: otro.nacionalidad,
      };
    });
    expect(permutados.map((c) => puntaje(c, listas).total)).toEqual(
      campos.map((c) => puntaje(c, listas).total),
    );
    expect(new Set(orden).size).toBe(campos.length);
    expect(orden.some((j, i) => j !== i)).toBe(true);
  });
});
