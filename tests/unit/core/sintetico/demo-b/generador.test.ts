/**
 * Generador del demo B: mezcla 60/15/15/10 por bloque, garantías del lote de 20, verdad conocida coherente con las
 * reglas RV-xx, bandas de similitud de cada subtipo y umbrales leídos de las aristas del plan (lección M-18).
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { Plan } from "../../../../../core/plan";
import {
  GARANTIAS_B,
  generarLoteB,
  RECETA_HUMO_B,
  umbralDeArista,
  umbralesB,
} from "../../../../../core/sintetico/demo-b/generador";
import {
  ListasSchema,
  type LoteB,
} from "../../../../../core/sintetico/demo-b/esquema";
import {
  identidadVerificable,
  inconsistencias,
  puntaje,
} from "../../../../../core/sintetico/demo-b/reglas";
import { mejorCoincidencia } from "../../../../../core/sintetico/demo-b/similitud";

const plan = JSON.parse(readFileSync("plans/demo-b/v1.json", "utf8")) as Plan;
const listas = ListasSchema.parse(
  JSON.parse(readFileSync("data/listas/demo-b.json", "utf8")),
);
const u = umbralesB(plan);
// Se REGENERA (no se lee del disco): estas pruebas vigilan el generador; la igualdad con lo versionado la vigila
// `tests/integration/casos-versionados-b.test.ts` (demo en rojo D19: leído del disco, ninguna regresión del
// generador podía ponerlas en rojo).
let lote200: LoteB;
beforeAll(async () => {
  lote200 = await generarLoteB({
    plan,
    listas,
    semilla: "planlang-b-001",
    n: 200,
  });
});

describe("umbrales desde las aristas del plan", () => {
  it("lee los dos umbrales de similitud por la arista que los cita, no por su id", () => {
    expect([u.zona_gris.id, u.zona_gris.valor]).toEqual(["U4", 0.7]);
    expect([u.coincidencia.id, u.coincidencia.valor]).toEqual(["U1", 0.85]);
    expect([u.escalamiento.id, u.escalamiento.valor]).toEqual(["U2", 60]);
    expect([
      u.inconsistencias.id,
      u.inconsistencias.valor,
      u.inconsistencias.operador,
    ]).toEqual(["U3", 0, "mayor_que"]);
  });

  it("si la arista falta, el lote no se genera", () => {
    const sin = structuredClone(plan);
    sin.contrato_de_grafo.aristas_condicionales =
      sin.contrato_de_grafo.aristas_condicionales.filter(
        (a) => a.desde !== "verificador_listas",
      );
    expect(() =>
      umbralDeArista(sin, "verificador_listas", "similitud_max"),
    ).toThrow(/se espera una/);
  });
});

describe("composición", () => {
  it("cada bloque de 20 lleva 12 · 3 · 3 · 2 y el primero sus garantías", () => {
    for (let b = 0; b < 10; b++) {
      const bloque = lote200.casos.slice(b * 20, b * 20 + 20);
      const por = (t: string) => bloque.filter((c) => c.tipo === t).length;
      expect([
        por("normal"),
        por("borde"),
        por("faltante"),
        por("adversario"),
      ]).toEqual([12, 3, 3, 2]);
      for (const s of GARANTIAS_B[b] ?? [])
        expect(bloque.map((c) => c.subtipo)).toContain(s);
    }
  });

  it("el lote de 20 es el primer bloque del de 200", async () => {
    const lote20 = await generarLoteB({
      plan,
      listas,
      semilla: "planlang-b-001",
      n: 20,
    });
    expect(lote20.casos).toEqual(lote200.casos.slice(0, 20));
  });

  it("la receta de humo tiene sus cuatro casos", async () => {
    const humo = await generarLoteB({
      plan,
      listas,
      semilla: "planlang-b-humo",
      n: 4,
      receta: "humo",
    });
    expect(humo.casos.map((c) => c.subtipo)).toEqual([...RECETA_HUMO_B]);
    await expect(
      generarLoteB({ plan, listas, semilla: "x", n: 3, receta: "humo" }),
    ).rejects.toThrow(/cuatro|4/);
  });

  it("exige un plan aprobado", async () => {
    await expect(
      generarLoteB({
        plan: { ...plan, estado_aprobacion: "borrador" },
        listas,
        semilla: "x",
        n: 1,
      }),
    ).rejects.toThrow(/aprobado/);
  });
});

describe("verdad conocida", () => {
  let casos: LoteB["casos"] = [];
  beforeAll(() => {
    casos = lote200.casos;
  });
  const cumple = (x: number, r: typeof u.zona_gris) =>
    r.operador === "mayor_que" ? x > r.valor : x >= r.valor;

  it("se recalcula desde los campos verdaderos con las mismas reglas", () => {
    for (const c of casos) {
      const v = c.verdad_conocida;
      expect(v.puntaje_riesgo, c.id).toBe(puntaje(v.campos, listas).total);
      expect(v.inconsistencias, c.id).toBe(inconsistencias(v.campos).length);
      expect(v.similitud_max, c.id).toBe(
        mejorCoincidencia(v.campos.nombre, listas)?.similitud ?? 0,
      );
      expect(v.decision === "rechazar", c.id).toBe(
        v.en_lista_vinculante || !identidadVerificable(v.campos),
      );
    }
  });

  it("cada subtipo cae en su banda de similitud", () => {
    for (const c of casos) {
      const s = c.verdad_conocida.similitud_max;
      if (c.subtipo === "adversario_homonimo_zona_gris") {
        expect(cumple(s, u.zona_gris) && !cumple(s, u.coincidencia), c.id).toBe(
          true,
        );
        expect(c.verdad_conocida.conclusion_investigador).toBe("homonimo");
      }
      if (c.subtipo === "adversario_homonimo_identico") expect(s, c.id).toBe(1);
      if (c.subtipo === "adversario_transliteracion") {
        expect(cumple(s, u.zona_gris) && s < 1, c.id).toBe(true);
        expect(c.verdad_conocida.en_lista_vinculante).toBe(true);
      }
      if (c.subtipo === "normal_limpio" || c.subtipo === "borde_casi_zona_gris")
        expect(cumple(s, u.zona_gris), c.id).toBe(false);
    }
  });

  it("el lote de 20 trae al menos un homónimo en la zona gris y una inyección (⭐⭐ parada 4 y C6)", () => {
    const veinte = casos.slice(0, 20).map((c) => c.subtipo);
    expect(veinte).toContain("adversario_homonimo_zona_gris");
    expect(veinte).toContain("adversario_inyeccion");
  });

  it("los adversarios documentan qué intentan y la inyección lleva su carga en el documento de fondos", () => {
    for (const c of casos.filter((x) => x.tipo === "adversario")) {
      expect(c.adversario, c.id).not.toBeNull();
      if (c.adversario_detalle === "inyeccion")
        expect(c.entrada.documentos.fondos?.es).toContain(
          c.adversario?.carga.es,
        );
    }
  });

  it("el borde del puntaje cae exactamente en U2", () => {
    for (const c of casos.filter((x) => x.subtipo === "borde_puntaje_en_U2"))
      expect(c.verdad_conocida.puntaje_riesgo, c.id).toBe(u.escalamiento.valor);
  });
});
