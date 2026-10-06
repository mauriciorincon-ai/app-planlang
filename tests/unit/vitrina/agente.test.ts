// @vitest-environment node
/**
 * Vista de P3 Agente sobre la corrida real: las cifras que la maqueta aprobada tomó de la corrida v1.2 salen
 * ahora calculadas de las trazas (ninguna escrita a mano), en los dos idiomas; el lienzo es el grafo (gate
 * «diagrama = grafo» sobre el mapa que dibuja la página).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente, type VistaAgente } from "@/lib/vista/agente";
import {
  NODOS,
  PLAN_POR_NODO,
  TIPO_DE_CASO,
  TRAZAS_DE_NODO,
} from "@/textos/agente";
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
      "200 de 200 casos",
      "23 urgencias y 12 exentos",
      "165 casos",
      "30 casos, 47 preguntas",
      "155 casos, sin modelo",
      "70 de 200 a una persona",
      "31 documentos en ES y EN",
    ]);
    expect(es.ficha.hace.items.every((x) => x.corrio)).toBe(true);
  });

  it("lo que corrió frente a su plan: 8 de 8, 12 de 12 y la prueba cruzada sin diferencias", () => {
    expect(es.lienzo.comparacion.ok).toBe(true);
    expect(es.contrato.cifras[0]!.cifra).toBe("8 de 8");
    expect(en.contrato.cifras[1]!.cifra).toBe("12 of 12");
    expect(es.contrato.cifras[2]!.cifra).toMatch(/^\d+ · 0$/);
  });

  it("«En los 200 casos» de cada nodo", () => {
    expect(campo(es, "enrutador", /En los 200/)).toMatch(
      /^165 siguieron al extractor\. 23 urgencias y 12 servicios exentos/,
    );
    expect(campo(es, "extractor", /En los 200/)).toMatch(
      /^Leyó 165 casos, 212 veces: 47 relecturas/,
    );
    expect(campo(es, "aclaracion", /En los 200/)).toMatch(
      /^30 casos incompletos, 47 preguntas\./,
    );
    expect(campo(es, "verificador_cobertura", /En los 200/)).toMatch(
      /^Revisó 155 casos: 21 excluidos con causal, 39 de alto costo, 9 sobre el tope del servicio y 8 contradicciones/,
    );
    // El desglose, en el orden de las reglas del plan, suma los 60 que pasaron a una persona (9 + 4 + 34 + 7 + 6).
    expect(campo(es, "decision", /En los 200/)).toMatch(
      /^Decidió 155 casos: 95 siguieron solos al redactor y 60 pasaron a una persona \(9 instrucciones escondidas, 4 de baja confianza, 34 de alto costo, 7 contradicciones, 6 propuestas de negar\)\./,
    );
    expect(campo(es, "pausa_humana", /En los 200/)).toMatch(
      /^70 pausas: 60 desde decision y 10 por el tope.*negó 22 y aprobó 48\. Unos 840 minutos/,
    );
    // 31 documentos: 22 negaciones y 9 aprobaciones en parte (no «31 negaciones»).
    expect(campo(es, "redactor", /En los 200/)).toMatch(
      /^Escribió 200 respuestas; 22 negaciones y 9 aprobaciones en parte, cada una con su documento/,
    );
    expect(campo(en, "redactor", /In the 200/)).toMatch(
      /^It wrote 200 answers; 22 denials and 9 partial approvals, each with its document/,
    );
    expect(campo(en, "guardia_salida", /In the 200/)).toMatch(
      /^It checked all 200 answers: 0 findings/,
    );
  });

  it("si una categoría que manda casos a una persona no tiene su frase, el desglose detiene el build", async () => {
    const { NODOS: N } = await import("@/textos/agente");
    const cifras = {
      casos: 3,
      solos: 0,
      aPersona: 3,
      porRegla: { carga: 1, negar: 1, tope: 1 },
      criterios: { es: "", en: "" },
    } as unknown as Parameters<(typeof N)["decision"]["enLaCorrida"]>[0];
    expect(() => N.decision!.enLaCorrida(cifras)).toThrow(
      /el desglose de decision suma 2 y 3 casos pasaron a una persona/,
    );
  });

  it("cada estado de un criterio tiene su frase; incompleto y sin población no se leen como incumplidos", async () => {
    const { frasesDeCriterios } = await import("@/textos/agente");
    const estados: Record<string, string> = {
      C1: "cumple",
      C3: "sin_poblacion",
      C5: "incompleto",
      C6: "cumple",
      C7: "incumple",
    };
    const f = frasesDeCriterios(
      ["C1", "C3", "C5", "C6", "C7"],
      (x) => estados[x],
    );
    expect(f.es).toBe(
      "C1 y C6 se cumplieron; C7 no se cumplió; C5 quedó incompleto; C3 no tuvo casos que lo prueben.",
    );
    expect(f.en).toBe(
      "C1 and C6 were met; C7 was not met; C5 was left incomplete; C3 had no case to test it.",
    );
    // Un estado que la frase no sabe decir detiene el build en lugar de leerse «no se cumplió».
    expect(() => frasesDeCriterios(["C1"], () => "raro")).toThrow(
      /el criterio C1 llega en estado «raro»/,
    );
  });

  it("la arista U1: 155 casos llegaron a decision y la regla manda a una persona a los que están bajo 0,75", () => {
    expect(es.arista.puntos).toHaveLength(155);
    expect(
      es.arista.puntos.filter((p) => p.aPersona).every((p) => p.valor < 0.75),
    ).toBe(true);
    // Cada caso con su valor entre paréntesis: con comas decimales, «A-139, con 0,20, A-082…» se leía mal.
    expect(es.arista.filas.at(-1)!.v).toBe(
      "4 de 155 bajo U1: A-139 (0,20), A-082 (0,60), A-068 (0,70) y A-148 (0,72)",
    );
    expect(en.arista.filas.at(-1)!.v).toBe(
      "4 of 155 below U1: A-139 (0.20), A-082 (0.60), A-068 (0.70) and A-148 (0.72)",
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
  it("3 de 8 nodos, 1 de 12 reglas (la de U1, en otro nodo) y aprobar fuera del contrato", async () => {
    const v = vistaAgente(await datosDemo(), "es");
    expect(v.spike).not.toBeNull();
    const s = v.spike!;
    expect(s.cifras.map((c) => c.cifra)).toEqual(["3 de 8", "1 de 12", "1"]);
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

  it("dice de qué línea del código del spike sale cada parte de la lectura, solo archivo:línea (AU-S2-P-8)", async () => {
    const d = await datosDemo();
    const es = vistaAgente(d, "es").spike!.citas;
    const en = vistaAgente(d, "en").spike!.citas;
    expect(es.rotulo).toBe("Leído del código del spike");
    expect(es.refs).toEqual([
      { que: "umbral", donde: "spike.py:44" },
      { que: "regla", donde: "spike.py:198" },
      { que: "aristas", donde: "spike.py:228" },
      { que: "pausa", donde: "spike.py:207" },
      { que: "tipos de nodo", donde: "spike.py:189-218" },
    ]);
    expect(en.refs.map((r) => r.que)).toEqual([
      "threshold",
      "rule",
      "edges",
      "pause",
      "node types",
    ]);
    // Una cita que no empieza por archivo:línea, o una parte sin nombre, detienen el build nombrándolas.
    const mala = {
      ...d,
      spike: { ...d.spike!, lectura: { ...d.spike!.lectura } },
    };
    mala.spike.lectura.citas = { regla: "en algún lugar del spike" };
    expect(() => vistaAgente(mala, "es")).toThrow(
      "la cita «regla» de la lectura del spike no empieza por archivo:línea",
    );
    mala.spike.lectura.citas = { memoria: "spike.py:12 x" };
    expect(() => vistaAgente(mala, "es")).toThrow(
      "«memoria» no tiene su entrada en SPIKE.cita",
    );
  });

  it("la lista por capa dice «exigido» donde el lienzo lo dibuja, y solo ahí (AU-S2-P-1, G10)", async () => {
    const d = await datosDemo();
    for (const [i, marca, lector] of [
      ["es", "exigido", "exigido por el plan, ausente del grafo"],
      ["en", "required", "required by the plan, missing from the graph"],
    ] as const) {
      const v = vistaAgente(d, i);
      const exigidos = v
        .spike!.lienzo.lista.flatMap((c) => c.nodos)
        .filter((n) => n.exigido);
      expect(exigidos.map((n) => n.id).sort()).toEqual(
        [
          "aclaracion",
          "decision",
          "guardia-salida",
          "redactor",
          "verificador-cobertura",
        ].sort(),
      );
      for (const n of exigidos) expect(n.exigido).toEqual({ marca, lector });
      // El grafo que corrió tiene todo lo que el plan exige: ninguna marca en su lista.
      expect(
        v.lienzo.lista.flatMap((c) => c.nodos).filter((n) => n.exigido),
      ).toEqual([]);
    }
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
      vistaAgente(otro, "en").ficha.capacidad.find((c) => c.estimacion)!.texto,
    ).toBe("a batch of 100 cases");
    // Con la corrida publicada, que ya es el lote completo, la cifra se mide y no se estima (F21).
    const real = vistaAgente(d, "es").ficha.capacidad;
    expect(real.some((c) => c.estimacion)).toBe(false);
    expect(
      real.find((c) => c.texto === `un lote de ${d.plan.lotes.completo} casos`)!
        .detalle,
    ).toMatch(/^en serie, sumando los 200 casos de esta corrida/);
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
    // El panel lo dice con el id del plan, y la línea que lo abre es la de su regla (C-1).
    expect(v.arista.umbralId).toBe("U9");
    const halos = [
      ...v.lienzo.svg.matchAll(
        /<g class="d-flujo"[^>]*id="agente-(l-[^"]+)"[^>]*>(?:(?!<\/g>)[\s\S])*?class="halo"/g,
      ),
    ].map((m) => m[1]);
    expect(halos).toEqual([v.arista.id]);
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
      // La primera regla del plan v1.5 vive en decision (la carga): su copia con orden 9 no tiene flujo.
      /el lienzo «agente» no es el grafo:[\s\S]*decision#9/,
    );
  });
});

describe("AU-S2-16: un nodo, una señal o un tipo sin su vocabulario detienen el build, nombrados", () => {
  /** Quita una entrada de un diccionario de textos mientras corre `f`, y la devuelve. */
  function sin<T>(mapa: Record<string, T>, clave: string, f: () => void) {
    const antes = mapa[clave];
    delete mapa[clave];
    try {
      f();
    } finally {
      mapa[clave] = antes as T;
    }
  }

  it("un nodo del contrato sin su presentación (NODOS) no sale en blanco", async () => {
    const d = await datosDemo();
    sin(NODOS as Record<string, unknown>, "redactor", () =>
      expect(() => vistaAgente(d, "es")).toThrow(
        "«redactor» no tiene su entrada en NODOS (src/textos/agente.ts)",
      ),
    );
  });

  it("un tipo de caso sin su nombre no se pinta con el código crudo", async () => {
    const d = await datosDemo();
    const tipo = d.lote.casos[0]!.tipo;
    sin(TIPO_DE_CASO as Record<string, unknown>, tipo, () =>
      expect(() => vistaAgente(d, "en")).toThrow(
        `«${tipo}» no tiene su entrada en TIPO_DE_CASO`,
      ),
    );
  });

  it("un nodo sin sus columnas de trazas tampoco", async () => {
    const d = await datosDemo();
    sin(TRAZAS_DE_NODO as Record<string, unknown>, "guardia_salida", () =>
      expect(() => vistaAgente(d, "es")).toThrow(
        "«guardia_salida» no tiene su entrada en TRAZAS_DE_NODO",
      ),
    );
  });
});
