import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import {
  aprobarPlan,
  cargarPlan,
  contratoParaConstructor,
  ramaPorDefecto,
  resolverValor,
  umbralesAplicados,
  validarPlan,
  type Plan,
} from "../../../../core/plan";

type Obj = Record<string, JsonValor>;
const v0 = JSON.parse(
  readFileSync("plans/demo-a/v0-migrado.json", "utf8"),
) as Obj & { contrato_de_grafo: { senales_obligatorias_en_traza: string[] } };
// El borrador v0 lee `servicio_exento` en C4 y R6 sin declararla (M-23 lo advierte y no deja aprobarlo): la base de
// estas pruebas la declara, como lo hizo la v1.1.
const borrador = {
  ...v0,
  contrato_de_grafo: {
    ...v0.contrato_de_grafo,
    senales_obligatorias_en_traza: [
      ...v0.contrato_de_grafo.senales_obligatorias_en_traza,
      "servicio_exento",
    ],
  },
} as Obj;
const planValido = (): Plan => {
  const v = validarPlan(borrador);
  if (!v.ok) throw new Error("el plan base debe ser válido");
  return v.plan;
};

describe("contrato para el constructor", () => {
  it("resuelve los umbrales a su valor del plan y admite cambios del playground", () => {
    const plan = planValido();
    expect(umbralesAplicados(plan)).toEqual({
      U1: 0.75,
      U2: 1000,
      U3: 2,
      U4: false,
    });
    expect(umbralesAplicados(plan, { U1: 0.9 }).U1).toBe(0.9);
    expect(resolverValor("umbral.U2", umbralesAplicados(plan))).toBe(1000);
    expect(resolverValor("urgencia", umbralesAplicados(plan))).toBe("urgencia");
    expect(resolverValor(3, umbralesAplicados(plan))).toBe(3);
    expect(() => resolverValor("umbral.U9", umbralesAplicados(plan))).toThrow(
      /umbral desconocido/,
    );
  });

  it("ordena las aristas por nodo y orden, con valores aplicados y funciones nombradas", () => {
    const plan = planValido();
    const c = contratoParaConstructor(plan);
    expect(c.nodos.map((n) => n.id)).toContain("pausa_humana");
    expect(c.aristas.map((a) => `${a.desde}#${a.orden}`)).toEqual([
      "aclaracion#1",
      "decision#1",
      "decision#2",
      "decision#3",
      "decision#4",
      "decision#5",
      "enrutador#1",
      "extractor#1",
    ]);
    const u1 = c.aristas.find((a) => a.desde === "decision" && a.orden === 1);
    expect(u1).toMatchObject({
      senal: "senal_confianza",
      valor_declarado: "umbral.U1",
      valor_aplicado: 0.75,
      inclusivo: false,
    });
    const texas = c.aristas.find((a) => a.funcion !== null);
    expect(texas?.funcion).toEqual({
      nombre: "texas_y_no_aprobar",
      entradas: ["modo_texas", "propuesta"],
    });
    expect(c.ramas_por_defecto).toEqual({
      aclaracion: "extractor",
      decision: "redactor",
      enrutador: "extractor",
      extractor: "verificador_cobertura",
    });
    expect(c.senales_obligatorias).toHaveLength(16); // las 15 del v0 + servicio_exento
    expect(
      contratoParaConstructor(plan, { U2: 500 }).umbrales_aplicados.U2,
    ).toBe(500);
  });

  it("ramaPorDefecto falla para un nodo sin rama", () => {
    const plan = planValido();
    expect(() => ramaPorDefecto(plan, "redactor")).toThrow(
      /no tiene rama por defecto/,
    );
  });
});

describe("aprobar y cargar con huella (RF-01.7, RF-06.1)", () => {
  it("aprobarPlan calcula la huella; cargarPlan la verifica; una alteración la rechaza", async () => {
    const r = await aprobarPlan(borrador, { por: "prueba", el: "2026-09-27" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.estado_aprobacion).toBe("aprobado");
    expect(r.plan.huella).toMatch(/^[0-9a-f]{64}$/);
    const c = await cargarPlan(r.plan);
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.huella).toBe(r.plan.huella);
    const alterado = { ...r.plan, version: "1.0.1" } as Obj;
    const c2 = await cargarPlan(alterado);
    expect(c2.ok).toBe(false);
    if (!c2.ok) expect(c2.motivos[0]?.mensaje.en).toContain("does not match");
  });

  it("M-22: un plan aprobado siempre carga, aunque el borrador omita lo que el esquema completa (depende_de)", async () => {
    // El borrador sin `depende_de` en sus decisiones: Zod lo completa con []. Antes, la huella se calculaba sobre el
    // borrador crudo y se verificaba sobre el plan parseado: el plan recién aprobado no cargaba.
    const sinDepende = structuredClone(borrador) as Obj & {
      decisiones: Record<string, JsonValor>[];
    };
    for (const d of sinDepende.decisiones) delete d.depende_de;
    const r = await aprobarPlan(sinDepende, {
      por: "prueba",
      el: "2026-09-27",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Lo que se escribe a disco es el plan canónico parseado, sellado: trae `depende_de: []`.
    expect(r.plan.decisiones.every((d) => Array.isArray(d.depende_de))).toBe(
      true,
    );
    const enDisco = JSON.parse(JSON.stringify(r.plan)) as Obj;
    const c = await cargarPlan(enDisco);
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.huella).toBe(r.plan.huella);
  });

  it("M-22: la huella se verifica sobre lo que hay en disco, no sobre lo que el esquema completa", async () => {
    const r = await aprobarPlan(borrador, { por: "prueba", el: "2026-09-27" });
    if (!r.ok) throw new Error("debía aprobar");
    // Quitarle al archivo sellado un `depende_de: []` cambia lo que hay en disco: la huella ya no coincide, aunque
    // el esquema vuelva a completarlo al parsear.
    const tocado = structuredClone(r.plan) as unknown as Obj & {
      decisiones: Record<string, JsonValor>[];
    };
    delete tocado.decisiones[0]!.depende_de;
    const c = await cargarPlan(tocado);
    expect(c.ok).toBe(false);
  });

  it("cargarPlan rechaza un borrador (sin huella que verificar) y un plan inválido", async () => {
    const c = await cargarPlan(borrador);
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.motivos[0]?.codigo).toBe("HUELLA_AUSENTE");
    const inv = await cargarPlan({ ...borrador, version: "mala" });
    expect(inv.ok).toBe(false);
    if (!inv.ok) expect(inv.motivos[0]?.codigo).toBe("ESQUEMA");
  });

  it("aprobarPlan rechaza un plan inválido y no calcula huella", async () => {
    const roto = { ...borrador, umbrales: [] } as Obj;
    const r = await aprobarPlan(roto, { por: "prueba", el: "2026-09-27" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivos.map((m) => m.codigo)).toContain("ESQUEMA");
  });

  it("la huella es la misma que calcula conHuella sobre el objeto aprobado (dos ejecuciones)", async () => {
    const a = await aprobarPlan(borrador, { por: "prueba", el: "2026-09-27" });
    const b = await aprobarPlan(borrador, { por: "prueba", el: "2026-09-27" });
    expect(a.ok && b.ok && a.plan.huella === b.plan.huella).toBe(true);
    if (a.ok)
      expect((await conHuella(a.plan as unknown as Obj)).huella).toBe(
        a.plan.huella,
      );
  });
});
