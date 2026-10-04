/**
 * Plantillas de dominio (C1, RF-01.1): validan contra el esquema, toda condición se interpreta, cada
 * restricción regulatoria trae fuente y fecha de verificación, y los textos de líder (restricción llana,
 * descripciones de umbrales del plan) respetan el presupuesto en ES y EN.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsear } from "../../../../core/brecha/condiciones";
import { verificarHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import { presupuestoLiderBilingue } from "../../../../core/formatos/jerga";
import {
  PlantillaDominioSchema,
  SECCIONES_DE_ENTREVISTA,
  UmbralSugeridoSchema,
  validarPlan,
  type Plan,
} from "../../../../core/plan";

const DOMINIOS = ["dom-salud", "dom-financiero"] as const;
const cargar = (id: string) =>
  PlantillaDominioSchema.parse(
    JSON.parse(readFileSync(`data/dominios/${id}.json`, "utf8")),
  );

describe.each(DOMINIOS)("plantilla %s", (id) => {
  const d = cargar(id);

  it("valida contra el esquema y trae los siete bloques con contenido bilingüe", () => {
    expect(d.id).toBe(id);
    expect(d.actores_tipicos.length).toBeGreaterThanOrEqual(3);
    expect(d.decisiones_tipicas.length).toBeGreaterThanOrEqual(3);
    expect(d.riesgos_tipicos.length).toBeGreaterThanOrEqual(3);
    expect(d.criterios_sugeridos.length).toBeGreaterThanOrEqual(3);
    expect(d.restricciones_regulatorias.length).toBeGreaterThanOrEqual(5);
    expect(d.preguntas_guia.length).toBeGreaterThanOrEqual(5);
  });

  it("toda condición de riesgos y criterios se interpreta", () => {
    for (const r of d.riesgos_tipicos) {
      if (!r.detector_en_trazas) continue;
      expect(() => parsear(r.detector_en_trazas!.poblacion)).not.toThrow();
      expect(() => parsear(r.detector_en_trazas!.condicion)).not.toThrow();
    }
    for (const c of d.criterios_sugeridos) {
      expect(() => parsear(c.regla_de_medicion.poblacion)).not.toThrow();
      if (c.regla_de_medicion.condicion)
        expect(() => parsear(c.regla_de_medicion.condicion!)).not.toThrow();
    }
  });

  it("cada restricción cita norma, jurisdicción y fecha de verificación; la ley de la pausa está presente", () => {
    for (const r of d.restricciones_regulatorias) {
      expect(r.norma.length).toBeGreaterThan(5);
      expect(r.verificada).toMatch(/^2026-/);
    }
    expect(d.restricciones_regulatorias.some((r) => r.pausa)).toBe(true);
  });

  it("está sellada (huella que verifica) y cada pregunta guía trae su ejemplo en ES y EN (RF-02.2)", async () => {
    const crudo = JSON.parse(
      readFileSync(`data/dominios/${id}.json`, "utf8"),
    ) as Record<string, JsonValor>;
    expect((await verificarHuella(crudo)).ok).toBe(true);
    const ids = d.preguntas_guia.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of d.preguntas_guia) {
      expect(q.ejemplo.es.length, q.id).toBeGreaterThan(10);
      expect(q.ejemplo.en.length, q.id).toBeGreaterThan(10);
      expect(/¿[^?]+\?/.test(q.es) && q.en.includes("?"), q.id).toBe(true);
    }
  });

  it("las restricciones en lenguaje llano respetan el presupuesto de líder en ES y EN", () => {
    for (const r of d.restricciones_regulatorias) {
      const p = presupuestoLiderBilingue(r.restriccion_llana);
      expect(
        p,
        `${id}/${r.id}: ${[...p.es.motivos, ...p.en.motivos].join("; ")}`,
      ).toMatchObject({ ok: true });
    }
  });
});

describe("plantilla financiera: la que conduce la entrevista del demo B", () => {
  const d = cargar("dom-financiero");
  const ids = new Set([
    ...d.decisiones_tipicas.map((x) => x.id),
    ...d.riesgos_tipicos.map((x) => x.id),
    ...d.criterios_sugeridos.map((x) => x.id),
    ...(d.umbrales_sugeridos ?? []).map((x) => x.id),
  ]);

  it("sus preguntas cubren cada sección del plan, en el orden de las secciones (RF-02.1)", () => {
    const secciones = d.preguntas_guia.map((q) => q.seccion);
    expect(new Set(secciones)).toEqual(new Set(SECCIONES_DE_ENTREVISTA));
    const orden = secciones.map((s) => SECCIONES_DE_ENTREVISTA.indexOf(s));
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it("conserva textuales las cinco preguntas guía de la v1.0.0 (§ 9.2: no se omite ninguna)", () => {
    const textos = d.preguntas_guia.map((q) => q.es);
    for (const vieja of [
      "¿Qué coincidencias en listas exigen una persona sin excepción?",
      "¿Qué factores, y con qué pesos, forman el puntaje de riesgo? ¿Alguno es un atributo protegido?",
      "¿Cómo se resuelve una coincidencia aproximada antes de molestar al oficial?",
      "¿Qué queda en el expediente y qué versión de lista se citó?",
      "¿Cómo se sabe en las trazas que un riesgo ocurrió?",
    ])
      expect(textos).toContain(vieja);
  });

  it("propone umbrales SIN valor (los fija el usuario) y todas sus referencias resuelven", () => {
    const umbrales = d.umbrales_sugeridos ?? [];
    expect(umbrales.map((u) => u.valor_en_plan)).toEqual([
      null,
      null,
      null,
      null,
    ]);
    for (const u of umbrales) expect(ids.has(u.decision_id), u.id).toBe(true);
    for (const c of d.criterios_sugeridos)
      for (const r of c.riesgos_controlados ?? [])
        expect(ids.has(r), c.id).toBe(true);
    for (const x of d.decisiones_tipicas)
      for (const r of [...x.umbrales_asociados, ...x.riesgos_asociados])
        expect(ids.has(r), x.id).toBe(true);
    const cg = d.contrato_sugerido!;
    for (const e of cg.evaluadores_requeridos)
      for (const r of e.riesgos_cubiertos) expect(ids.has(r), e.id).toBe(true);
    const referidos = JSON.stringify(d).match(/umbral\.([A-Z0-9]+)/g) ?? [];
    for (const r of referidos)
      expect(ids.has(r.slice("umbral.".length)), r).toBe(true);
  });

  it("su contrato propuesto tiene la pausa del oficial y la activan umbrales", () => {
    const cg = d.contrato_sugerido!;
    expect(cg.pausas_humanas.map((p) => [p.nodo, p.rol])).toEqual([
      ["pausa_humana", "oficial"],
    ]);
    const nodos = new Set(cg.nodos_esperados.map((n) => n.id));
    for (const a of cg.aristas_condicionales) {
      expect(nodos.has(a.desde), a.desde).toBe(true);
      expect(nodos.has(a.si_verdadero), a.si_verdadero).toBe(true);
    }
  });

  it("el esquema de un umbral sugerido es estricto", () => {
    const u = d.umbrales_sugeridos![0]!;
    expect(UmbralSugeridoSchema.safeParse(u).success).toBe(true);
    expect(UmbralSugeridoSchema.safeParse({ ...u, extra: 1 }).success).toBe(
      false,
    );
  });
});

describe("plan aprobado del demo A", () => {
  const plan = JSON.parse(readFileSync("plans/demo-a/v1.json", "utf8")) as Plan;

  it("está aprobado, con huella, y su dominio es dom-salud", () => {
    const v = validarPlan(plan);
    expect(v.ok).toBe(true);
    expect(plan.estado_aprobacion).toBe("aprobado");
    expect(plan.dominio_id).toBe("dom-salud");
    expect(plan.huella).toMatch(/^[0-9a-f]{64}$/);
  });

  it("las descripciones de líder de los umbrales y los enunciados de criterios respetan el presupuesto", () => {
    for (const u of plan.umbrales)
      expect(presupuestoLiderBilingue(u.descripcion_lider).ok, u.id).toBe(true);
    for (const c of plan.criterios_aceptacion)
      expect(presupuestoLiderBilingue(c.enunciado).ok, c.id).toBe(true);
    for (const r of plan.riesgos)
      expect(presupuestoLiderBilingue(r.modo).ok, r.id).toBe(true);
  });
});
