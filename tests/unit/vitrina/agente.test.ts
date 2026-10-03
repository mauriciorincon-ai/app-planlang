// @vitest-environment node
/**
 * Vista de P3 Agente sobre la corrida real: las cifras que la maqueta aprobada tomó de la corrida v1.2 salen
 * ahora calculadas de las trazas (ninguna escrita a mano), en los dos idiomas; el lienzo es el grafo (gate
 * «diagrama = grafo» sobre el mapa que dibuja la página).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente, type VistaAgente } from "@/lib/vista/agente";
import { PLAN_POR_NODO } from "@/textos/agente";
import { esAristaTripleta } from "@core/plan/esquema";

let es: VistaAgente;
let en: VistaAgente;
beforeAll(async () => {
  const d = await datosDemo();
  es = vistaAgente(d, "es");
  en = vistaAgente(d, "en");
}, 60_000);

const panel = (v: VistaAgente, id: string) =>
  v.paneles.find((p) => p.nombre === id)!;
const campo = (v: VistaAgente, id: string, rotulo: RegExp) =>
  panel(v, id).lider.campos.find((c) => rotulo.test(c.rotulo))!.texto;

describe("P3 Agente: las cifras salen de las trazas", () => {
  it("las 7 actividades con su cifra real", () => {
    expect(es.ficha.hace.items.map((x) => x.detalle)).toEqual([
      "20 de 20 casos",
      "2 urgencias y 2 exentos",
      "16 casos",
      "3 casos, 5 preguntas",
      "15 casos, sin modelo",
      "8 de 20 a una persona",
      "5 documentos en ES y EN",
    ]);
    expect(es.ficha.hace.items.every((x) => x.corrio)).toBe(true);
  });

  it("lo que corrió frente a su plan: 8 de 8, 9 de 9 y la prueba cruzada sin diferencias", () => {
    expect(es.lienzo.comparacion.ok).toBe(true);
    expect(es.contrato.cifras[0]!.cifra).toBe("8 de 8");
    expect(en.contrato.cifras[1]!.cifra).toBe("9 of 9");
    expect(es.contrato.cifras[2]!.cifra).toMatch(/^\d+ · 0$/);
  });

  it("«En los 20 casos» de cada nodo", () => {
    expect(campo(es, "enrutador", /En los 20/)).toMatch(
      /^16 siguieron al extractor\. 2 urgencias y 2 servicios exentos/,
    );
    expect(campo(es, "extractor", /En los 20/)).toMatch(
      /^Leyó 16 casos, 21 veces: 5 relecturas/,
    );
    expect(campo(es, "aclaracion", /En los 20/)).toMatch(
      /^3 casos incompletos, 5 preguntas\./,
    );
    expect(campo(es, "verificador_cobertura", /En los 20/)).toMatch(
      /^Revisó 15 casos: 5 excluidos con causal, 3 de alto costo y 1 contradicción/,
    );
    expect(campo(es, "decision", /En los 20/)).toMatch(
      /^Decidió 15 casos: 8 siguieron solos al redactor y 7 pasaron a una persona/,
    );
    expect(campo(es, "pausa_humana", /En los 20/)).toMatch(
      /^8 pausas: 7 desde decision y 1 por el tope.*negó 5 y aprobó 3\. Unos 96 minutos/,
    );
    expect(campo(es, "redactor", /En los 20/)).toMatch(
      /^Escribió 20 respuestas; 5 negaciones/,
    );
    expect(campo(en, "guardia_salida", /In the 20/)).toMatch(
      /^It checked all 20 answers: 0 findings/,
    );
  });

  it("la arista U1: 15 casos llegaron a decision y la regla manda a una persona a los que están bajo 0,75", () => {
    expect(es.arista.puntos).toHaveLength(15);
    expect(
      es.arista.puntos.filter((p) => p.aPersona).every((p) => p.valor < 0.75),
    ).toBe(true);
    expect(es.arista.filas.at(-1)!.v).toMatch(
      /^1 de 15 bajo U1: A-012, con 0,70$/,
    );
  });

  it("el lienzo trae el SVG en su idioma y la lista por capa", () => {
    expect(es.lienzo.svg).toContain('lang="es"');
    expect(en.lienzo.svg).toContain('lang="en"');
    expect(es.lienzo.lista).toHaveLength(6);
    expect(es.lienzo.lista[1]!.nodos.map((n) => n.nombre)).toEqual([
      "enrutador",
      "decision",
    ]);
    expect(es.paneles).toHaveLength(8);
    for (const p of es.paneles)
      expect(p.trazas.filas.length).toBeGreaterThan(0);
  });
});

describe("el spike, frente al mismo contrato", () => {
  it("3 de 8 nodos, 1 de 9 reglas (la de U1, en otro nodo) y aprobar fuera del contrato", async () => {
    const v = vistaAgente(await datosDemo(), "es");
    expect(v.spike).not.toBeNull();
    const s = v.spike!;
    expect(s.cifras.map((c) => c.cifra)).toEqual(["3 de 8", "1 de 9", "1"]);
    expect(s.cifras[0]!.detalle).toBe(
      "faltaban aclaracion, verificador_cobertura, decision, redactor y guardia_salida",
    );
    expect(s.cifras[1]!.detalle).toBe(
      "la de U1, pero en enrutador y no en decision",
    );
    expect(s.lienzo.comparacion.nodos.fueraDelContrato).toEqual(["aprobar"]);
    // Lo exigido y ausente va discontinuo con su marca; lo que sobraba, «sin contrato»; nada se elige.
    expect(s.lienzo.svg.match(/data-madurez="exigido"/g)).toHaveLength(5);
    expect(s.lienzo.svg).toContain("sin contrato");
    expect(s.lienzo.svg).not.toContain("data-sel-id");
    expect(s.lienzo.svg).toContain("senal_confianza &lt; 0,75");
  });
});

describe("«qué del plan toca a cada nodo» (lectura del autor, comprobada contra el plan)", () => {
  it("cada nodo del contrato tiene su fila, cada id existe y ningún elemento del plan queda sin nodo", async () => {
    const { plan } = await datosDemo();
    const nodos = plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
    expect(Object.keys(PLAN_POR_NODO).sort()).toEqual([...nodos].sort());
    const delPlan = {
      decisiones: plan.decisiones.map((x) => x.id),
      riesgos: plan.riesgos.map((x) => x.id),
      supuestos: plan.supuestos.map((x) => x.id),
      criterios: plan.criterios_aceptacion.map((x) => x.id),
      umbrales: plan.umbrales.map((x) => x.id),
    };
    for (const [nodo, p] of Object.entries(PLAN_POR_NODO)) {
      for (const k of Object.keys(delPlan) as Array<keyof typeof delPlan>)
        for (const id of p[k])
          expect(delPlan[k], `${nodo}: ${k} ${id}`).toContain(id);
      for (const id of p.senal ?? [])
        expect(delPlan.umbrales, `${nodo}: señal ${id}`).toContain(id);
    }
    for (const k of Object.keys(delPlan) as Array<keyof typeof delPlan>)
      for (const id of delPlan[k])
        expect(
          Object.values(PLAN_POR_NODO).some(
            (p) =>
              p[k].includes(id) || (k === "umbrales" && p.senal?.includes(id)),
          ),
          `${id} no toca ningún nodo`,
        ).toBe(true);
  });

  it("el umbral de cada regla de arista está en la fila del nodo donde vive la regla", async () => {
    const { plan } = await datosDemo();
    for (const a of plan.contrato_de_grafo.aristas_condicionales)
      if (
        esAristaTripleta(a) &&
        typeof a.valor === "string" &&
        a.valor.startsWith("umbral.")
      )
        expect(
          PLAN_POR_NODO[a.desde]!.umbrales,
          `${a.desde} ${a.valor}`,
        ).toContain(a.valor.slice("umbral.".length));
  });
});

describe("AU-S2-2: el lote, el eje y el umbral de confianza salen del plan", () => {
  it("la estimación del lote completo usa `lotes.completo` del plan, no un 200 escrito", async () => {
    const d = await datosDemo();
    const otro = { ...d, plan: structuredClone(d.plan) };
    otro.plan.lotes.completo = 100;
    const v = vistaAgente(otro, "es");
    const lat = d.corrida.trazas.map((t) => Number(t.senales.latencia_total_s));
    const promedio = lat.reduce((a, b) => a + b, 0) / lat.length;
    const lote = v.ficha.capacidad.find((c) => c.estimacion)!;
    expect(lote.cifra).toBe(`≈ ${Math.round((promedio * 100) / 60)} min`);
    expect(lote.texto).toBe("un lote de 100 casos");
    expect(
      vistaAgente(d, "en").ficha.capacidad.find((c) => c.estimacion)!.texto,
    ).toBe(`a batch of ${d.plan.lotes.completo} cases`);
  });

  it("el eje del panel de U1 cubre todo valor observado", () => {
    const min = Math.min(...es.arista.puntos.map((p) => p.valor));
    const max = Math.max(...es.arista.puntos.map((p) => p.valor));
    expect(es.arista.eje.min).toBeLessThanOrEqual(min);
    expect(es.arista.eje.max).toBeGreaterThanOrEqual(max);
  });

  it("el umbral se busca por la señal de confianza: renumerarlo no rompe el panel", async () => {
    const d = await datosDemo();
    // El umbral cambia de id en el plan y en el grafo de la corrida (si no, el lienzo ya no sería el grafo).
    const otro = {
      ...d,
      plan: structuredClone(d.plan),
      corrida: { ...d.corrida, grafo: structuredClone(d.corrida.grafo) },
    };
    otro.plan.huella = "plan-con-U9";
    const u = otro.plan.umbrales.find((x) => x.id === "U1")!;
    u.id = "U9";
    for (const a of [
      ...otro.plan.contrato_de_grafo.aristas_condicionales,
      ...otro.corrida.grafo.aristas_condicionales,
    ])
      if (esAristaTripleta(a) && a.valor === "umbral.U1") a.valor = "umbral.U9";
    const v = vistaAgente(otro, "es");
    expect(v.arista.titulo).toMatch(/U9/);
    const sin = { ...d, plan: structuredClone(d.plan) };
    sin.plan.umbrales = sin.plan.umbrales.filter((x) => x.id !== "U1");
    expect(() => vistaAgente(sin, "es")).toThrow(/señal de confianza/);
  });
});

describe("P-11: el lienzo del agente exige «diagrama = grafo» en el build", () => {
  it("si el contrato pide una regla que el grafo no dibuja, la vista se detiene con la falla", async () => {
    const d = await datosDemo();
    const otro = { ...d, plan: structuredClone(d.plan) };
    otro.plan.huella = "otra-huella-para-no-usar-el-dibujo-en-memoria";
    otro.plan.contrato_de_grafo.aristas_condicionales.push({
      ...otro.plan.contrato_de_grafo.aristas_condicionales[0]!,
      orden: 9,
    });
    expect(() => vistaAgente(otro, "es")).toThrow(
      /el lienzo «agente» no es el grafo:[\s\S]*enrutador#9/,
    );
  });
});
