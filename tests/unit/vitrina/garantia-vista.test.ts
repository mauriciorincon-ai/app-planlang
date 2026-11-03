// @vitest-environment node
/**
 * La calibración con garantía lista para pintar (S8, ADR-018): los tres niveles de α del demo A con su zona, su párrafo
 * de líder en el presupuesto, lo que los datos no alcanzan dicho en cada idioma, y los casos sin zona (pocos casos, tasa
 * sobre α, conformal por debajo del umbral, sin cota conformal) con el porqué y el n que haría falta. Los casos sin
 * zona vienen del contrato con Python (`scripts/garantia-contrato.ts`).
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  garantiaDeCalibracion,
  type GarantiaDeCalibracion,
} from "@core/brecha/garantia";
import { presupuestoLiderBilingue } from "@core/formatos/jerga";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { vistaGarantia } from "@/lib/vista/garantia";
import { dentroDeLaZona, lugarEnLaZona } from "@/lib/vista/zona";
import { casosSinteticos } from "../../../scripts/garantia-contrato";

const IDIOMAS = ["es", "en"] as const;
/** La vitrina une la cifra y su signo con un espacio duro; aquí se lee con espacio normal. */
const llano = (t: string) => t.replaceAll("\u00a0", " ");
let g: GarantiaDeCalibracion;
beforeAll(async () => {
  const d: DatosDemo = await datosDemo();
  g = d.informe.supuestos.find((s) => s.garantia)!.garantia!;
});

const sintetica = (nombre: string) =>
  garantiaDeCalibracion(
    casosSinteticos().find((c) => c.nombre === nombre)!.entrada,
  )!;

describe("la garantía de S1 del demo A, para pintar", () => {
  it("trae los tres niveles de α, el del informe por omisión, con su zona", () => {
    const v = vistaGarantia(g, "U1", 2, "es");
    expect(v.niveles.map((n) => llano(n.alfaPct))).toEqual([
      "5 %",
      "10 %",
      "20 %",
    ]);
    expect(v.niveles[v.porOmision]!.alfa).toBe(0.1);
    expect(
      v.niveles.map((n) => n.zona && [n.zona.desde, n.zona.hasta]),
    ).toEqual([
      [0.75, 0.85],
      [0.5, 0.9],
      [0.5, 0.95],
    ]);
    expect(llano(v.seguridad)).toBe("90 %");
    expect(v.delta).toBe("0,10");
    expect(v.n).toBe(159);
  });

  it.each(IDIOMAS)(
    "los números salen con el formato del idioma y nada queda sin resolver (%s)",
    (i) => {
      const v = vistaGarantia(g, "U1", 2, i);
      const todo = [
        v.metodo,
        v.alcance,
        v.noObservadas ?? "",
        ...v.niveles.flatMap((n) => [
          n.leyenda,
          n.lider,
          n.aplicado ?? "",
          n.opcion,
          ...n.noAlcanza,
          ...n.experto,
          ...n.fila,
        ]),
      ].join("\n");
      expect(todo).not.toMatch(/undefined|NaN|\[object Object\]|null/);
      expect(todo).toContain(i === "es" ? "0,50 a 0,90" : "0.50 to 0.90");
      // Con miles: «2.680» en español, «2,680» en inglés.
      expect(todo).toContain(i === "es" ? "2.680" : "2,680");
    },
  );

  it("el párrafo de líder de cada nivel cabe en el presupuesto (≤ 50 palabras, ≤ 1 término vigilado), en la corrida y en cada borde", () => {
    const todas: [string, GarantiaDeCalibracion][] = [
      ["publicada", g],
      ...casosSinteticos()
        .map((c) => [c.nombre, garantiaDeCalibracion(c.entrada)] as const)
        .filter((x): x is [string, GarantiaDeCalibracion] => x[1] !== null),
    ];
    const sinCota = sintetica("pocos-casos");
    todas.push([
      "sin-cota-conformal",
      {
        ...sinCota,
        niveles: sinCota.niveles.map((n) => ({
          ...n,
          umbral_con_garantia: { ...n.umbral_con_garantia, faltan: null },
          sin_zona: "sin_cota_conformal" as const,
        })),
      },
    ]);
    for (const [nombre, garantia] of todas) {
      const es = vistaGarantia(garantia, "U1", 2, "es").niveles;
      const en = vistaGarantia(garantia, "U1", 2, "en").niveles;
      es.forEach((n, k) => {
        const r = presupuestoLiderBilingue({ es: n.lider, en: en[k]!.lider });
        expect(r.ok, `${nombre} ${n.alfaPct}: ${JSON.stringify(r)}`).toBe(true);
      });
    }
  });

  it("dice lo que los datos no alcanzan: la cobertura conjunta a 5 % y a 10 %, no a 20 %; y el redactor sin verdad", () => {
    const v = vistaGarantia(g, "U1", 2, "es");
    expect(v.niveles.map((n) => n.noAlcanza.length)).toEqual([1, 1, 0]);
    expect(v.niveles[1]!.noAlcanza[0]).toContain("la extracción falla en 3");
    expect(v.niveles[1]!.noAlcanza[0]).toContain("harían falta 268 casos");
    expect(v.noObservadas).toContain("redactor");
    expect(v.niveles[1]!.aplicado).toBe(
      "El U1 de la corrida (0,75) cae dentro.",
    );
  });

  it("la tabla del experto tiene una fila por nivel, con la columna del umbral de la corrida", () => {
    const v = vistaGarantia(g, "U1", 2, "es");
    expect(v.tablaExperto.columnas).toHaveLength(7);
    for (const n of v.niveles) expect(n.fila).toHaveLength(7);
    expect(v.niveles[1]!.fila.map(llano)).toEqual([
      "α 0,10",
      "0,50",
      "99,4 % · 3,2 %",
      "0,90",
      "0,50–0,90",
      "sí",
      "no alcanza",
    ]);
    // Sin umbral aplicado, la columna no existe.
    const sin = vistaGarantia({ ...g, umbral_aplicado: null }, "U1", 2, "es");
    expect(sin.tablaExperto.columnas).toHaveLength(6);
    expect(sin.niveles[1]!.aplicado).toBeNull();
  });

  it("el nombre de cada etapa sale llano y una etapa que el plan nombra distinto se escribe con su id", () => {
    const v = vistaGarantia(
      {
        ...g,
        niveles: g.niveles.map((n) => ({
          ...n,
          conjunta: n.conjunta && {
            ...n.conjunta,
            nodos: ["extractor", "verificador"],
          },
        })),
      },
      "U1",
      2,
      "es",
    );
    expect(v.niveles[1]!.noAlcanza[0]).toContain("la extracción y verificador");
  });
});

describe("los niveles sin zona dicen por qué, con los números", () => {
  const nivel = (nombre: string, alfa: number, i: "es" | "en" = "es") =>
    vistaGarantia(sintetica(nombre), "U1", 2, i).niveles.find(
      (n) => n.alfa === alfa,
    )!;

  it("pocos casos: cuántos harían falta sin un solo error", () => {
    const n = nivel("pocos-casos", 0.1);
    expect(n.zona).toBeNull();
    expect(llano(n.leyenda)).toBe("No hay zona respaldada con 10 % de error.");
    expect(n.lider).toContain("el agente decide solo 8 casos");
    expect(n.lider).toContain("harían falta 22 sin un solo error");
    expect(nivel("pocos-casos", 0.1, "en").lider).toContain(
      "it would take 22 without a single error",
    );
  });

  it("una tasa que no baja de α: más casos con esa tasa no la respaldan", () => {
    const n = nivel("tasa-sobre-alfa", 0.2);
    expect(llano(n.lider)).toContain("falla en 5 de 20 casos");
    expect(llano(n.lider)).toContain("no baja de 20 %");
  });

  it("el conformal por debajo del umbral con garantía: ninguna cumple las dos", () => {
    const n = nivel("conformal-bajo-el-umbral", 0.1);
    expect(n.lider).toContain(
      "(0,55) queda por debajo de la que respalda el error (0,70)",
    );
    expect(nivel("conformal-bajo-el-umbral", 0.1, "en").lider).toContain(
      "falls below the one that backs the error (0.70)",
    );
  });

  it("sin cota conformal: cuántos aciertos hacen falta", () => {
    const base = sintetica("pocos-casos");
    const sin = {
      ...base,
      niveles: base.niveles.map((n) => ({
        ...n,
        umbral_con_garantia: { ...n.umbral_con_garantia, faltan: null },
        sin_zona: "sin_cota_conformal" as const,
      })),
    };
    const n = vistaGarantia(sin, "U1", 2, "es").niveles[1]!;
    expect(n.lider).toContain("con 8 aciertos no se puede decir");
    expect(n.lider).toContain("al menos 9");
  });

  it("la cobertura conjunta con una tasa sobre α no promete que más casos la respalden", () => {
    const n = nivel("etapas-a-medias", 0.2);
    expect(n.noAlcanza.length).toBeGreaterThan(0);
    const t = vistaGarantia(
      {
        ...sintetica("etapas-a-medias"),
        niveles: sintetica("etapas-a-medias").niveles.map((x) => ({
          ...x,
          conjunta: x.conjunta && {
            ...x.conjunta,
            faltan: {
              ...(x.conjunta.faltan as object),
              nodo: "aclaracion",
              motivo: "tasa_sobre_alfa" as const,
              casos: null,
              umbral: 0.9,
              aceptados: 40,
              errores: 9,
            },
          },
        })),
      },
      "U1",
      2,
      "es",
    ).niveles[1]!;
    expect(t.noAlcanza[0]).toContain("la aclaración falla en 9");
    expect(t.noAlcanza[0]).toContain("más casos con esa tasa no lo respaldan");
  });

  it("una sola etapa medida no tiene cobertura conjunta que sumar en llano (el experto sí la ve)", () => {
    const v = vistaGarantia(sintetica("pocos-casos"), "U1", 2, "es");
    for (const n of v.niveles) {
      expect(n.noAlcanza).toEqual([]);
      expect(n.experto.join(" ")).toContain("Cobertura conjunta (Bonferroni)");
    }
  });
});

describe("dónde cae un valor frente a la zona", () => {
  const zona = { desde: 0.75, hasta: 0.85, umbrales: [0.75, 0.8, 0.85] };
  it("dentro, por debajo y por encima; sin zona, ninguna", () => {
    expect(lugarEnLaZona(zona, 0.8)).toBe("dentro");
    expect(lugarEnLaZona(zona, 0.7)).toBe("debajo");
    expect(lugarEnLaZona(zona, 0.9)).toBe("encima");
    expect(lugarEnLaZona(null, 0.8)).toBe("ninguna");
    expect(dentroDeLaZona(zona, 0.75)).toBe(true);
    expect(dentroDeLaZona(null, 0.75)).toBe(false);
  });
});
