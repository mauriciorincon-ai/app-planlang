/**
 * AU-S2-1: la vitrina narra cada pausa con la regla que la mandó, no con la de otra. Una regla que la vitrina no
 * conoce detiene el build nombrándola (antes se narraba como «modo Texas»), y una pausa sin extracción no inventa
 * una confianza «0,00». Se prueba con la corrida simulada del respaldo AU-9 del plan v1.4.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { PlanSchema } from "@core/plan/esquema";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { vistaAgente } from "@/lib/vista/agente";
import { vistaCaso } from "@/lib/vista/caso";
import {
  categoriaDeRegla,
  reglaDelPlan,
  umbralDeCategoria,
} from "@/lib/vista/motivo-pausa";
import { MOTIVO, PAUSA, RAMA } from "@/textos/caso";
import { datosConRespaldo } from "./_respaldo-v14";

const PLANES = ["v1.2", "v1.3", "v1.4"].map((v) =>
  PlanSchema.parse(JSON.parse(readFileSync(`plans/demo-a/${v}.json`, "utf8"))),
);

describe("la categoría de cada regla", () => {
  it("la señal del respaldo es «proveedor»", () => {
    expect(
      categoriaDeRegla({ senal: "proveedor_no_disponible", funcion: null }),
    ).toBe("proveedor");
    expect(
      categoriaDeRegla({ senal: null, funcion: "texas_y_no_aprobar" }),
    ).toBe("texas");
  });

  it("una regla desconocida detiene el build nombrándola (antes caía en «texas»)", () => {
    expect(() => categoriaDeRegla({ senal: "x", funcion: null })).toThrow(
      /«x»/,
    );
    expect(() =>
      categoriaDeRegla({ senal: null, funcion: "otra_funcion" }),
    ).toThrow(/«otra_funcion»/);
  });

  it("toda arista condicional de los planes v1.2, v1.3 y v1.4 tiene categoría y texto de rama", () => {
    for (const p of PLANES)
      for (const a of p.contrato_de_grafo.aristas_condicionales) {
        const c = categoriaDeRegla(reglaDelPlan(a));
        const textos = RAMA[a.desde as keyof typeof RAMA] as
          Record<string, unknown> | undefined;
        expect(
          textos?.[c],
          `${p.version} ${a.desde}#${a.orden} → ${c}`,
        ).toBeDefined();
        if (a.si_verdadero === "pausa_humana")
          expect(MOTIVO[c], `${p.version} motivo ${c}`).toBeDefined();
      }
  });

  it("el tope de aclaraciones se lee del umbral del plan", () => {
    for (const p of PLANES)
      expect(umbralDeCategoria(p, "tope").valor_en_plan).toBe(2);
    const sinTope = structuredClone(PLANES[2]!);
    sinTope.contrato_de_grafo.aristas_condicionales =
      sinTope.contrato_de_grafo.aristas_condicionales.filter(
        (a) => !("senal" in a) || a.senal !== "ciclos_aclaracion",
      );
    expect(() => umbralDeCategoria(sinTope, "tope")).toThrow(/«tope»/);
  });
});

describe("una corrida con respaldo AU-9 se narra con su motivo", () => {
  let d: DatosDemo;
  beforeAll(async () => {
    d = await datosConRespaldo();
  });

  it("A-001 (el extractor no respondió): motivo «proveedor», sin confianza inventada", () => {
    for (const i of ["es", "en"] as const) {
      const v = vistaCaso(d, "A-001", i);
      expect(v.pausa!.porQue.toLowerCase()).toContain(
        MOTIVO.proveedor![i].slice(0, 20).toLowerCase(),
      );
      expect(v.pausa!.porQue).not.toMatch(/Texas/);
      expect(v.pausa!.leyo).toBe(PAUSA.sinExtraccion[i]);
      expect(v.pausa!.leyo).not.toMatch(/0[,.]00/);
      const ext = v.pasos.find((p) => p.nodo === "extractor")!;
      expect(ext.hizo).toMatch(/otro/);
      expect(ext.rama).toBe(RAMA.extractor.proveedor[i]);
    }
  });

  it("A-008 (la aclaración sin respuesta): motivo «proveedor», no el tope de U3", () => {
    for (const i of ["es", "en"] as const) {
      const v = vistaCaso(d, "A-008", i);
      expect(v.pausa!.porQue).not.toMatch(/U3/);
      expect(v.pausa!.porQue.toLowerCase()).toContain(
        MOTIVO.proveedor![i].slice(0, 20).toLowerCase(),
      );
      const acl = v.pasos.find((p) => p.nodo === "aclaracion")!;
      expect(acl.rama).toBe(RAMA.aclaracion.proveedor[i]);
    }
  });

  it("P3 cuenta las pausas por su regla: ninguna del respaldo se suma al tope", () => {
    const v = vistaAgente(d, "es");
    const pausa = v.paneles.find((p) => p.nombre === "pausa_humana")!;
    const enLaCorrida = pausa.lider.campos.find(
      (c) => c.clave === "enLaCorrida",
    )!.texto;
    // 5 pausas: 1 desde decision, 1 por el tope y 3 por el respaldo (A-001 y A-004 desde el extractor, A-008
    // desde la aclaración). Antes, A-008 se sumaba al tope y las del extractor no se contaban.
    expect(enLaCorrida).toMatch(
      /^5 pausas: 1 desde decision y 1 por el tope de aclaraciones; 3 porque el modelo no respondió\./,
    );
    const acl = v.paneles.find((p) => p.nombre === "aclaracion")!;
    const texto = acl.lider.campos.find(
      (c) => c.clave === "enLaCorrida",
    )!.texto;
    expect(texto).toMatch(
      /A-008 pasó a una persona porque el modelo no respondió/,
    );
    expect(texto).not.toMatch(/A-008[^.]*tope/);
  });
});
