/**
 * P4 Brecha: la vista se arma desde el informe que declara el manifiesto y lo publica con sus fallas (regla dura 9):
 * el veredicto con alertas, S3 refutado y S1 sin probar al frente, las brechas no previstas como falla, lo cumplido
 * con nota y su porqué medido en el playground. Una lectura editorial que falte no se suple con un genérico: el build
 * se detiene nombrándola.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { compactar } from "@core/playground/compactar";
import { consecuencias, umbralesDelPlan } from "@core/playground/consecuencias";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { noCumple } from "./_brecha-no-cumple";
import {
  umbralQueLoRompe,
  vistaBrecha,
  type VistaBrecha,
} from "@/lib/vista/brecha";

let d: DatosDemo;
let es: VistaBrecha;
let en: VistaBrecha;
beforeAll(async () => {
  d = await datosDemo();
  es = vistaBrecha(d, "es");
  en = vistaBrecha(d, "en");
});

describe("el veredicto y el balance", () => {
  it("cumple con alertas, con las dos lecturas y la recomendación", () => {
    expect(es.veredicto.clase).toBe("alerta");
    expect(es.veredicto.texto).toBe("Cumple con alertas");
    expect(en.veredicto.texto).toBe("Meets with warnings");
    expect(es.veredicto.lider).toContain("(S3)");
    expect(es.veredicto.lider).toContain("(S1)");
    expect(es.veredicto.experto).toContain(
      "RF-09.2: 0 diferencias en 233 decisiones",
    );
  });

  it("seis renglones; en supuestos, S2 cumplió, S3 falló y S1 quedó sin probar", () => {
    expect(es.balance.map((b) => b.clave)).toEqual([
      "criterios",
      "riesgos",
      "supuestos",
      "noPrevisto",
      "grafo",
      "cruzada",
    ]);
    const s = es.balance.find((b) => b.clave === "supuestos")!;
    expect(s.cumplio?.ids).toBe("S2");
    expect(s.fallo).toMatchObject({ ids: "S3", href: "#f-S3" });
    expect(s.sinProbar).toMatchObject({ ids: "S1", href: "#f-S1" });
  });
});

describe("las fallas a la vista (regla dura 9)", () => {
  it("lo que falló: S3 y las respuestas fuera de formato; lo sin probar: S1", () => {
    expect(es.fallos.map((f) => f.codigo)).toEqual(["S3", "no previsto"]);
    expect(es.fallos.every((f) => f.clase === "no-cumple")).toBe(true);
    expect(es.sinProbar.map((f) => [f.codigo, f.clase])).toEqual([
      ["S1", "beta"],
    ]);
    // Los casos en que difieren multiagente y línea base enlazan a su traza.
    expect(es.fallos[0]!.casos.map((c) => c.href)).toEqual([
      "/es/caso/A-008",
      "/es/caso/A-012",
      "/es/caso/A-020",
    ]);
  });

  it("C3 se cumple con nota, y el umbral que lo rompe lo mide el playground (U2 en 1500 → A-010)", () => {
    const c3 = es.conNota.find((f) => f.codigo === "C3")!;
    expect(c3.lider.join(" ")).toContain("con U2 en 1500");
    expect(c3.enlaces.map((e) => e.href)).toContain("/es/playground");
    const c = compactar(d.plan, d.corrida, d.lote, d.informe);
    expect(umbralQueLoRompe(c, "C3")).toEqual({
      umbral: "U2",
      valor: 1500,
      casos: ["A-010"],
    });
    // Un paso antes (1400) todavía se cumple: 1500 es el más cercano al plan.
    const r = consecuencias(c, { ...umbralesDelPlan(c), U2: 1400 });
    expect(r.criterios.find((x) => x.id === "C3")!.estado).toBe("cumple");
  });

  it("un criterio que ningún umbral rompe no recibe una nota inventada", () => {
    const c = compactar(d.plan, d.corrida, d.lote, d.informe);
    expect(umbralQueLoRompe(c, "C4")).toBeNull();
  });

  it("R8 se cuenta en sesiones, no en casos", () => {
    const r8 = es.cumplido.riesgos.items.find((x) => x.codigo === "R8")!;
    expect(r8.valor).toBe("0 de 1 sesión");
    expect(
      en.cumplido.riesgos.items.find((x) => x.codigo === "R8")!.valor,
    ).toBe("0 of 1 session");
  });
});

describe("las nueve secciones del informe", () => {
  it("en su orden, con su ancla", () => {
    expect(es.indice.map((x) => x.id)).toEqual([
      "b1",
      "b2",
      "b3",
      "b4",
      "b5",
      "b6",
      "b7",
      "b8",
      "b9",
    ]);
  });

  it("el playground del informe muestra los 4 umbrales con lo observado y los casos justo en el umbral", () => {
    expect(es.playground.filas.map((f) => f.id)).toEqual([
      "U1",
      "U2",
      "U3",
      "U4",
    ]);
    const u2 = es.playground.filas.find((f) => f.id === "U2")!;
    expect(u2.justo.map((x) => x.id)).toEqual(["A-003"]);
  });
});

describe("un informe que no cumple se publica con sus fallas al frente", () => {
  it("el veredicto, la frase y el balance lo dicen", () => {
    const v = vistaBrecha(noCumple(d), "es");
    expect(v.veredicto.clase).toBe("no-cumple");
    expect(v.veredicto.texto).toBe("No cumple");
    expect(v.veredicto.lider).toContain("no se cumplió C7");
    expect(v.veredicto.lider).toContain("ocurrió R2");
    const crit = v.balance.find((b) => b.clave === "criterios")!;
    expect(crit.fallo?.ids).toBe("C7");
    const ries = v.balance.find((b) => b.clave === "riesgos")!;
    expect(ries.fallo?.ids).toBe("R2");
  });

  it("lo que falló trae C7 con sus casos lentos y R2 con A-015; C6 y R5 quedan sin probar, no cumplidos", () => {
    const x = noCumple(d);
    const v = vistaBrecha(x, "es");
    const codigos = v.fallos.map((f) => f.codigo);
    expect(codigos).toEqual(expect.arrayContaining(["S3", "C7", "R2"]));
    const c7 = v.fallos.find((f) => f.codigo === "C7")!;
    expect(c7.clase).toBe("no-cumple");
    expect(c7.casos.length).toBeGreaterThan(0);
    expect(
      v.fallos.find((f) => f.codigo === "R2")!.casos.map((c) => c.id),
    ).toEqual(["A-015"]);
    expect(v.sinProbar.map((f) => f.codigo)).toEqual(
      expect.arrayContaining(["S1", "C6"]),
    );
    expect(v.cumplido.criterios.items.map((c) => c.codigo)).not.toContain("C7");
    expect(v.cumplido.riesgos.items.map((c) => c.codigo)).not.toContain("R2");
    // En inglés, lo mismo.
    const en = vistaBrecha(x, "en");
    expect(en.veredicto.texto).toBe("Does not meet");
    expect(en.veredicto.lider).toContain("C7 was not met");
  });
});

describe("una lectura editorial que falta detiene el build", () => {
  it("un supuesto en un estado sin lectura se nombra", () => {
    const otro = structuredClone(d);
    const s2 = otro.informe.supuestos.find((s) => s.id === "S2")!;
    (s2 as { estado: string }).estado = "refutado";
    expect(() => vistaBrecha(otro, "es")).toThrow(
      /S2 «refutado» y Brecha no tiene su lectura/,
    );
  });

  it("una categoría de brecha no prevista sin lectura se nombra", () => {
    const otro = structuredClone(d);
    (
      otro.informe.brechas_no_previstas.brechas[0] as { categoria: string }
    ).categoria = "categoria_nueva";
    expect(() => vistaBrecha(otro, "es")).toThrow(
      /brechas «categoria_nueva» y Brecha no tiene su lectura/,
    );
  });
});
