/**
 * M1 rechaza que una decisión llame «pendiente» a un umbral que el plan ya fijó (S7). Es lo que la auditoría del S6 vio
 * en la primera v2 de HackGuard: la justificación de D1 decía «el mínimo concreto sigue pendiente en el umbral U2» y la de
 * D4 «(umbral U3, aún pendiente)», con U2 = 2 y U3 = 180. M1 no lo detectaba porque es texto libre. Aquí se prueba con
 * esas mismas frases, aplicadas al plan v2 aprobado.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { aprobarPlan, validarPlan } from "../../../../core/plan";

type Plan = Record<string, unknown> & {
  decisiones: {
    id: string;
    justificacion: { es: string; en: string };
    opcion_elegida?: string | { es: string; en: string };
  }[];
  umbrales: { id: string; valor_en_plan: number | boolean }[];
};
const v2 = (): Plan =>
  JSON.parse(readFileSync("plans/hackguard-agentes/v2.json", "utf8"));

const D1_ES =
  "Solo se consultan fuentes de la lista blanca. Una propuesta con menos fuentes verificadas que el mínimo del plan llega a la persona marcada como no verificada; no se descarta sola. El mínimo concreto sigue pendiente en el umbral U2.";
const D1_EN =
  "Only whitelisted sources are consulted. A proposal with fewer verified sources than the plan's minimum reaches the person marked as unverified; it is not dropped on its own. The exact minimum is still pending in threshold U2.";
const D4_ES =
  "Toda prueba nueva entra como borrador. Si esa versión supera la antigüedad tolerada del plan (umbral U3, aún pendiente), una persona la mira antes de usarla.";
const D4_EN =
  "Every new test enters as a draft. If that version is older than the plan's tolerated age (threshold U3, still pending), a person looks at it before it is used.";

function con(cambio: (p: Plan) => void): Plan {
  const p = v2();
  cambio(p);
  return p;
}
const dichos = (p: Plan) =>
  (() => {
    const r = validarPlan(p);
    return r.ok
      ? []
      : r.motivos
          .filter((m) => m.codigo === "UMBRAL_DICHO_PENDIENTE")
          .map((m) => m.elemento);
  })();

describe("M1 · un umbral con valor no puede llamarse pendiente en una decisión", () => {
  it("el plan v2 aprobado, con U2 = 2 y U3 = 180, no dispara la regla", () => {
    const p = v2();
    expect(p.umbrales.map((u) => [u.id, u.valor_en_plan])).toEqual([
      ["U1", 1],
      ["U2", 2],
      ["U3", 180],
    ]);
    expect(validarPlan(p).ok).toBe(true);
    expect(dichos(p)).toEqual([]);
  });

  it("ROJO: las frases de la primera v2 (D1 y D4, en español e inglés) se rechazan nombrando la decisión y el idioma", () => {
    const p = con((x) => {
      x.decisiones.find((d) => d.id === "D1")!.justificacion = {
        es: D1_ES,
        en: D1_EN,
      };
      x.decisiones.find((d) => d.id === "D4")!.justificacion = {
        es: D4_ES,
        en: D4_EN,
      };
    });
    expect(dichos(p)).toEqual([
      "D1.justificacion.es",
      "D1.justificacion.en",
      "D4.justificacion.es",
      "D4.justificacion.en",
    ]);
  });

  it("el motivo dice qué umbral y con qué valor fijado, en los dos idiomas", () => {
    const p = con((x) => {
      x.decisiones.find((d) => d.id === "D1")!.justificacion = {
        es: D1_ES,
        en: D1_EN,
      };
    });
    const r = validarPlan(p);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const m = r.motivos.find((x) => x.codigo === "UMBRAL_DICHO_PENDIENTE")!;
    expect(m.mensaje.es).toContain("umbral U2 sigue pendiente");
    expect(m.mensaje.es).toContain("valor 2");
    expect(m.mensaje.en).toContain("threshold U2 is still pending");
    expect(m.mensaje.en).toContain("to 2");
  });

  it("también se revisa la opción elegida, como texto o en los dos idiomas", () => {
    const comoTexto = con((x) => {
      x.decisiones[0]!.opcion_elegida = "el mínimo, aún no definido en U2";
    });
    expect(dichos(comoTexto)).toEqual([
      `${comoTexto.decisiones[0]!.id}.opcion_elegida`,
    ]);
    const bilingue = con((x) => {
      x.decisiones[0]!.opcion_elegida = {
        es: "ok",
        en: "the minimum is pending in U2",
      };
    });
    expect(dichos(bilingue)).toEqual([
      `${bilingue.decisiones[0]!.id}.opcion_elegida.en`,
    ]);
  });

  it("no rechaza lo que no se contradice: «pendiente» sin umbral, un umbral con su valor, otro id que empieza igual", () => {
    const p = con((x) => {
      const j = x.decisiones.find((d) => d.id === "D1")!;
      j.justificacion = {
        es: "Una propuesta sin verificar queda pendiente de una persona. El mínimo es de 2 fuentes (umbral U2). El umbral U20 sigue pendiente.",
        en: "An unverified proposal stays pending a person. The minimum is 2 sources (threshold U2). Threshold U20 is still pending.",
      };
    });
    expect(dichos(p)).toEqual([]);
    expect(validarPlan(p).ok).toBe(true);
  });

  it("el camino de la aprobación también lo detiene: aprobarPlan no sella un borrador con la frase", async () => {
    const borrador = con((x) => {
      x.decisiones.find((d) => d.id === "D4")!.justificacion = {
        es: D4_ES,
        en: D4_EN,
      };
      x.estado_aprobacion = "borrador";
      x.aprobado_por = null;
      x.aprobado_el = null;
      x.huella = null;
    });
    const a = await aprobarPlan(borrador, { por: "Prueba", el: "2026-10-12" });
    expect(a.ok).toBe(false);
    if (a.ok) return;
    expect(a.motivos.map((m) => m.codigo)).toContain("UMBRAL_DICHO_PENDIENTE");
  });
});
