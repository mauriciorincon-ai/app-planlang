/**
 * Generador de casos (M3 · RF-03.1–03.5): proporciones 60/15/15/10 por bloque, subtipos obligatorios,
 * prefijo estable (el lote de 20 es el primer bloque del de 200), verdad conocida derivada de los
 * umbrales y del contrato de grafo del plan, y textos en ES y EN.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { presupuestoLiderBilingue } from "../../../../core/formatos/jerga";
import type { Plan } from "../../../../core/plan";
import {
  CATALOGO,
  composicionDeBloque,
  conteosPorTipo,
  GARANTIAS_POR_BLOQUE,
  generarLote,
  PROPORCIONES_POR_DEFECTO,
  RECETA_HUMO,
  textoEsperado,
  textoIntenta,
  umbralesDelPlan,
} from "../../../../core/sintetico/generador";
import {
  PlanBeneficiosSchema,
  SUBTIPOS,
  type Caso,
} from "../../../../core/sintetico/esquema";
import { crearAzar } from "../../../../core/sintetico/sfc32";

const plan = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Plan;
const planBeneficios = PlanBeneficiosSchema.parse(
  JSON.parse(readFileSync("data/plan-beneficios/demo-a.json", "utf8")),
);
const base = { plan, planBeneficios };

const conUmbral = (id: string, valor: number | boolean): Plan => ({
  ...plan,
  umbrales: plan.umbrales.map((u) =>
    u.id === id ? { ...u, valor_en_plan: valor } : u,
  ),
});

describe("reparto por tipo (mayor resto, enteros)", () => {
  it("20 → 12/3/3/2 y 200 → 120/30/30/20", () => {
    expect(conteosPorTipo(20, PROPORCIONES_POR_DEFECTO)).toEqual({
      normal: 12,
      borde: 3,
      faltante: 3,
      adversario: 2,
    });
    expect(conteosPorTipo(200, PROPORCIONES_POR_DEFECTO)).toEqual({
      normal: 120,
      borde: 30,
      faltante: 30,
      adversario: 20,
    });
  });

  it("reparte el resto por fracción mayor y desempata en el orden declarado", () => {
    // 7 casos: 4,2 · 1,05 · 1,05 · 0,7 → base 4/1/1/0 y el que sobra va al adversario (0,7).
    expect(conteosPorTipo(7, PROPORCIONES_POR_DEFECTO)).toEqual({
      normal: 4,
      borde: 1,
      faltante: 1,
      adversario: 1,
    });
    expect(
      conteosPorTipo(2, {
        normal: 25,
        borde: 25,
        faltante: 25,
        adversario: 25,
      }),
    ).toEqual({ normal: 1, borde: 1, faltante: 0, adversario: 0 });
  });
});

describe("composición de bloque", () => {
  it("el primer bloque trae todas sus garantías; con menos casillas toma las primeras", () => {
    const c = composicionDeBloque(
      crearAzar("x"),
      0,
      20,
      PROPORCIONES_POR_DEFECTO,
    );
    for (const s of GARANTIAS_POR_BLOQUE[0]!) expect(c).toContain(s);
    const chico = composicionDeBloque(
      crearAzar("x"),
      0,
      5,
      PROPORCIONES_POR_DEFECTO,
    );
    expect(chico).toHaveLength(5);
    expect(chico).toContain("normal_aprobable");
  });

  it("los bloques sin garantías sortean solo subtipos con peso", () => {
    const c = composicionDeBloque(
      crearAzar("y"),
      7,
      20,
      PROPORCIONES_POR_DEFECTO,
    );
    expect(c).toHaveLength(20);
    for (const s of c) expect(CATALOGO[s].peso).toBeGreaterThan(0);
  });
});

const l20 = await generarLote({ ...base, semilla: "prueba", n: 20 });
const l200 = await generarLote({ ...base, semilla: "prueba", n: 200 });
const humo = await generarLote({
  ...base,
  semilla: "humo",
  n: 3,
  receta: "humo",
});
const deSubtipo = (l: { casos: Caso[] }, s: string) =>
  l.casos.filter((c) => c.subtipo === s);

describe("lotes", () => {
  it("el lote de 20 es exactamente el primer bloque del de 200 (prefijo estable)", () => {
    expect(l200.casos.slice(0, 20)).toEqual(l20.casos);
    expect(l20.composicion.por_tipo).toEqual({
      normal: 12,
      borde: 3,
      faltante: 3,
      adversario: 2,
    });
    expect(l200.composicion.por_tipo).toEqual({
      normal: 120,
      borde: 30,
      faltante: 30,
      adversario: 20,
    });
  });

  it("el lote de 20 trae los adversarios y bordes obligatorios del plan", () => {
    const s = new Set(l20.casos.map((c) => c.subtipo));
    for (const obligatorio of [
      "adversario_inyeccion_texto_libre",
      "adversario_dato_sensible",
      "borde_contradiccion_orden_texto",
      "borde_urgencia_cobertura_dudosa",
      "borde_costo_igual_U2",
    ])
      expect(s.has(obligatorio as never), obligatorio).toBe(true);
  });

  it("el lote de 200 cubre todo subtipo sorteable (inyección en orden adjunta y homónimo incluidos)", () => {
    const s = new Set(l200.casos.map((c) => c.subtipo));
    for (const sub of SUBTIPOS)
      if (CATALOGO[sub].peso > 0) expect(s.has(sub), sub).toBe(true);
  });

  it("la receta de humo: normal · empate en U1 y U2 · inyección con negación", () => {
    expect(humo.casos.map((c) => c.subtipo)).toEqual([...RECETA_HUMO]);
    expect(humo.casos.map((c) => c.id)).toEqual(["AH-001", "AH-002", "AH-003"]);
    expect(humo.proporciones).toBeNull();
    const { U1, U2 } = umbralesDelPlan(plan);
    const empate = humo.casos[1]!;
    expect(empate.simulacion.confianza_extractor).toBe(U1);
    expect(empate.verdad_conocida.campos.costo_estimado).toBe(U2);
    expect(empate.verdad_conocida.debe_escalar).toBe(false);
    const inyeccion = humo.casos[2]!;
    expect(inyeccion.verdad_conocida.decision).toBe("negar");
    expect(inyeccion.adversario_detalle).toBe("inyeccion");
  });

  it("verdad conocida: exclusión ⇒ negar con causal; urgencia ⇒ aprobar sin extracción", () => {
    for (const c of deSubtipo(l200, "normal_excluido")) {
      expect(c.verdad_conocida.decision).toBe("negar");
      expect(c.verdad_conocida.causal).not.toBeNull();
      expect(c.verdad_conocida.motivos_escalamiento).toContain(
        "propuesta_negar",
      );
    }
    for (const s of ["normal_urgencia", "borde_urgencia_cobertura_dudosa"]) {
      for (const c of deSubtipo(l200, s)) {
        expect(c.verdad_conocida.decision).toBe("aprobar");
        expect(c.verdad_conocida.presente).toBe(false);
        expect(c.verdad_conocida.debe_escalar).toBe(false);
        expect(c.entrada.orden_adjunta.tipo_atencion).toBe("urgencia");
      }
    }
    for (const c of deSubtipo(l200, "borde_contradiccion_orden_texto")) {
      expect(c.entrada.orden_adjunta.codigo_procedimiento).not.toBe(
        c.verdad_conocida.campos.procedimiento,
      );
      expect(c.verdad_conocida.motivos_escalamiento).toEqual([
        "contradiccion_orden_texto",
      ]);
    }
    for (const c of deSubtipo(l200, "normal_exento")) {
      expect(c.verdad_conocida.servicio_exento).toBe(true);
      expect(c.verdad_conocida.decision).toBe("aprobar");
    }
  });

  it("aclaraciones: el guion entrega los campos que faltan en el ciclo declarado", () => {
    for (const c of l200.casos.filter((x) => x.tipo === "faltante")) {
      const guion = c.entrada.aclaraciones_simuladas;
      const aportados = guion.flatMap((g) => g.aporta);
      const necesarios = c.verdad_conocida.ciclos_aclaracion_necesarios;
      if (necesarios === null) {
        expect(aportados).toEqual([]);
        expect(c.verdad_conocida.presente).toBe(false);
      } else {
        expect(guion).toHaveLength(necesarios);
        expect(guion[necesarios - 1]!.aporta.length).toBeGreaterThan(0);
      }
      if (!aportados.includes("diagnostico") && necesarios !== null)
        expect(c.entrada.texto_medico.es).toContain("Diagnóstico:");
    }
  });

  it("con U3 = 2 el caso de tres ciclos escala; con U3 = 3 ya no", async () => {
    const tres = (l: { casos: Caso[] }) =>
      deSubtipo(l, "faltante_tres_ciclos")[0]!;
    expect(tres(l200).verdad_conocida.debe_escalar).toBe(true);
    const otro = await generarLote({
      ...base,
      plan: conUmbral("U3", 3),
      semilla: "prueba",
      n: 200,
    });
    expect(tres(otro).verdad_conocida.debe_escalar).toBe(false);
  });

  it("si el plan enruta los exentos fuera del extractor, su verdad deja de exigir extracción", async () => {
    const aristas = plan.contrato_de_grafo.aristas_condicionales;
    const conExentos: Plan = {
      ...plan,
      contrato_de_grafo: {
        ...plan.contrato_de_grafo,
        aristas_condicionales: [
          ...aristas,
          {
            desde: "enrutador",
            orden: 2,
            senal: "servicio_exento",
            operador: "igual_a",
            valor: true,
            inclusivo: false,
            si_verdadero: "redactor",
            si_falso: "extractor",
          },
        ],
      },
    };
    const antes = deSubtipo(l20, "normal_exento")[0]!;
    const l = await generarLote({
      ...base,
      plan: conExentos,
      semilla: "prueba",
      n: 20,
    });
    const despues = deSubtipo(l, "normal_exento")[0]!;
    expect(antes.verdad_conocida.presente).toBe(true);
    expect(despues.verdad_conocida.presente).toBe(false);
  });

  it("el dato sensible viaja en el texto y figura entre los identificadores del caso", () => {
    for (const c of deSubtipo(l200, "adversario_dato_sensible")) {
      expect(c.simulacion.redactor_repite_identificador).toBe(true);
      expect(c.entrada.texto_medico.es).toContain(c.entrada.afiliado.documento);
      expect(c.identificadores_sinteticos).toContain(
        c.entrada.afiliado.telefono,
      );
    }
  });

  it("todo texto de producto está en ES y EN; los de líder respetan el presupuesto", () => {
    for (const c of l200.casos) {
      expect(c.entrada.texto_medico.es.length).toBeGreaterThan(20);
      expect(c.entrada.texto_medico.en.length).toBeGreaterThan(20);
    }
    for (const s of SUBTIPOS) {
      expect(presupuestoLiderBilingue(textoEsperado(s)).ok, s).toBe(true);
      const intenta = textoIntenta(s);
      if (s.startsWith("adversario")) expect(intenta, s).not.toBeNull();
      if (intenta) expect(presupuestoLiderBilingue(intenta).ok, s).toBe(true);
    }
  });

  it("el ruido simulado deja errores y confianzas repartidas (hay curva que medir)", () => {
    const errados = l200.casos.filter(
      (c) =>
        JSON.stringify(c.simulacion.campos_extraidos) !==
        JSON.stringify(c.verdad_conocida.campos),
    );
    expect(errados.length).toBeGreaterThan(5);
    expect(errados.length).toBeLessThan(40);
    const confianzas = new Set(
      l200.casos.map((c) => c.simulacion.confianza_extractor),
    );
    expect(confianzas.size).toBeGreaterThan(20);
  });
});

describe("errores del generador", () => {
  it("exige plan aprobado con huella, plan de beneficios con huella y n válido", async () => {
    await expect(
      generarLote({
        ...base,
        plan: { ...plan, estado_aprobacion: "borrador" },
        semilla: "x",
        n: 3,
      }),
    ).rejects.toThrow(/aprobado/);
    await expect(
      generarLote({
        ...base,
        planBeneficios: { ...planBeneficios, huella: null },
        semilla: "x",
        n: 3,
      }),
    ).rejects.toThrow(/beneficios/);
    await expect(generarLote({ ...base, semilla: "x", n: 0 })).rejects.toThrow(
      RangeError,
    );
    await expect(
      generarLote({ ...base, semilla: "x", n: 4, receta: "humo" }),
    ).rejects.toThrow(/humo/);
  });

  it("falla si el plan de beneficios no tiene un servicio con costo igual a U2", async () => {
    await expect(
      generarLote({
        ...base,
        plan: conUmbral("U2", 1234),
        semilla: "x",
        n: 20,
      }),
    ).rejects.toThrow(/U2/);
  });

  it("umbralesDelPlan exige los cuatro umbrales con su tipo", () => {
    expect(() =>
      umbralesDelPlan({
        ...plan,
        umbrales: plan.umbrales.filter((u) => u.id !== "U4"),
      }),
    ).toThrow(/U4/);
    expect(() => umbralesDelPlan(conUmbral("U4", 1))).toThrow(/booleano/);
  });
});
