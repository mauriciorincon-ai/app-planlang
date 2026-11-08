/**
 * P4 Brecha: la vista se arma desde el informe que declara el manifiesto y lo publica con sus fallas (regla dura 9):
 * sobre la corrida de 200 del plan v1.5, el veredicto con alertas, S2 y S3 refutados al frente, C5 cumplido en una
 * corrida (el plan pide k = 3 solo en lotes de 20: verificador 1.3.0), las brechas no previstas como falla, lo cumplido con nota y su porqué medido en el
 * playground. Una lectura editorial que falte no se suple con un genérico: el build se detiene nombrándola.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { compactar } from "@core/playground/compactar";
import { consecuencias, umbralesDelPlan } from "@core/playground/consecuencias";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import { idsDeCasos } from "@/lib/vista/caso";
import { VEREDICTOS } from "@/textos/comun";
import { noCumple } from "./_brecha-no-cumple";
import {
  _paraPruebas,
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
    expect(es.veredicto.lider).toContain("(S2)");
    expect(es.veredicto.lider).toContain("(S3)");
    // Verificador 1.3.0: C5 se mide en una corrida en el lote de 200 (k_aplica_a: lote_demo_20) y cumple.
    expect(es.veredicto.lider).toMatch(/^Se cumplieron los 11 criterios/);
    expect(es.veredicto.lider).not.toMatch(/incomplet/);
    expect(en.veredicto.lider).not.toMatch(/incomplete/);
    const total = d.informe.contrato_de_grafo.rf_09_2.reduce(
      (a, r) => a + r.visitas,
      0,
    );
    expect(es.veredicto.experto).toContain(
      `RF-09.2: 0 diferencias en ${total} decisiones`,
    );
  });

  it("el informe en Markdown que se publica dice el veredicto con las mismas palabras que la pantalla (AU-S2-B44)", () => {
    const valor = d.informe.veredicto.valor as keyof typeof VEREDICTOS;
    for (const i of ["es", "en"] as const) {
      const md = readFileSync(
        join(
          process.cwd(),
          d.manifiesto.corrida.ruta.replace(/^runs\//, "data/vitrina/"),
          `informe.${i}.md`,
        ),
        "utf8",
      );
      expect(md).toContain(VEREDICTOS[valor][i].toUpperCase());
    }
  });

  it("seis renglones; en supuestos, S1 cumplió y S2 y S3 fallaron; en criterios, nada quedó sin decidir", () => {
    expect(es.balance.map((b) => b.clave)).toEqual([
      "criterios",
      "riesgos",
      "supuestos",
      "noPrevisto",
      "grafo",
      "cruzada",
    ]);
    const s = es.balance.find((b) => b.clave === "supuestos")!;
    expect(s.cumplio?.ids).toBe("S1");
    expect(s.fallo).toMatchObject({ ids: "S2, S3", href: "#f-S2" });
    expect(s.sinProbar).toBeNull();
    const c = es.balance.find((b) => b.clave === "criterios")!;
    expect(c.sinProbar).toBeNull();
  });
});

describe("las fallas a la vista (regla dura 9)", () => {
  it("lo que falló: S2, S3 y lo que vio un evaluador; nada sin decidir", () => {
    expect(es.fallos.map((f) => f.codigo)).toEqual(["S2", "S3", "no previsto"]);
    expect(es.fallos.every((f) => f.clase === "no-cumple")).toBe(true);
    expect(es.sinProbar).toEqual([]);
    // Los casos en que difieren multiagente y línea base enlazan a su traza si tienen página; los demás, sin enlace.
    const s3 = es.fallos.find((f) => f.codigo === "S3")!;
    const distintos = d.informe.supuestos.find((x) => x.id === "S3")!
      .comparacion!.casos_distintos;
    expect(s3.casos.map((c) => c.id)).toEqual(distintos);
    const conPagina = new Set(idsDeCasos(d));
    for (const c of s3.casos)
      expect(c.href, c.id).toBe(
        conPagina.has(c.id) ? `/es/caso/${c.id}` : null,
      );
  });

  it("S2 dice lo que midió frente a lo que pide el plan, no el motivo crudo del verificador", () => {
    const s2 = es.fallos.find((f) => f.codigo === "S2")!;
    const m = d.informe.supuestos.find((x) => x.id === "S2")!;
    expect(s2.lider[1]).toMatch(
      /^Midió tasa \d+(,\d)?\u00a0% \(el plan pide ≥ 95\u00a0%\), sobre \d+ casos\.$/,
    );
    expect(s2.lider[1]).toContain(`sobre ${m.n} casos`);
    expect(s2.lider.join(" ")).not.toContain("tasa_min");
  });

  it("lo no previsto dice cada detalle una vez, con sus casos", () => {
    const np = es.fallos.find((f) => f.codigo === "no previsto")!;
    const ids = d.informe.brechas_no_previstas.brechas.map((b) => b.caso_id!);
    expect(np.lider[1]).toBe(
      `La extracción no coincide con la verdad conocida (${ids.slice(0, -1).join(", ")} y ${ids.at(-1)}).`,
    );
  });

  it("la lectura editorial de S3 refutado («la exactitud extra se paga en tiempo») solo vale si las cifras la sostienen", () => {
    const s3 = d.informe.supuestos.find((x) => x.id === "S3")!;
    if (s3.estado !== "refutado") return;
    const c = s3.comparacion!;
    // Si una corrida nueva da otro sentido, esta prueba obliga a reescribir LECTURA_SUPUESTO_A["S3:refutado"].
    expect(c.exactitud.multiagente).toBeGreaterThan(c.exactitud.agente_unico);
    expect(c.latencia_mediana_s.multiagente!).toBeGreaterThan(
      c.latencia_mediana_s.agente_unico!,
    );
  });

  it("C3 se cumple con nota, y el umbral que lo rompe lo mide el playground (U2 en 1200 → cuatro casos)", () => {
    const c3 = es.conNota.find((f) => f.codigo === "C3")!;
    expect(c3.lider.join(" ")).toContain(
      "con U2 en 1200, deja de cumplirse (A-007, A-083, A-142 y A-191 saldrían sin persona)",
    );
    expect(c3.enlaces.map((e) => e.href)).toContain("/es/playground");
    const c = compactar(
      d.plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
    );
    expect(umbralQueLoRompe(c, "C3")).toEqual({
      umbral: "U2",
      valor: 1200,
      casos: ["A-007", "A-083", "A-142", "A-191"],
    });
    // Un paso antes (1100) todavía se cumple: 1200 es el más cercano al plan.
    const r = consecuencias(c, { ...umbralesDelPlan(c), U2: 1100 });
    expect(r.criterios.find((x) => x.id === "C3")!.estado).toBe("cumple");
  });

  it("un criterio que ningún umbral rompe no recibe una nota inventada", () => {
    const c = compactar(
      d.plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
    );
    expect(umbralQueLoRompe(c, "C4")).toBeNull();
  });

  it("R8 se cuenta en sesiones, no en casos", () => {
    const r8 = es.cumplido.riesgos.items.find((x) => x.codigo === "R8")!;
    // La corrida de 200 corrió en 10 sesiones de 20.
    expect(r8.valor).toBe("0 de 10 sesiones");
    expect(
      en.cumplido.riesgos.items.find((x) => x.codigo === "R8")!.valor,
    ).toBe("0 of 10 sessions");
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
    // Los nueve casos con costo exactamente 1000: el borde de U2 (no inclusivo) que el lote siembra.
    const u2 = es.playground.filas.find((f) => f.id === "U2")!;
    expect(u2.justo.map((x) => x.id)).toEqual([
      "A-010",
      "A-040",
      "A-067",
      "A-110",
      "A-118",
      "A-127",
      "A-153",
      "A-161",
      "A-173",
    ]);
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
      expect.arrayContaining(["C6"]),
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
    (s2 as { estado: string }).estado = "sin_probar";
    expect(() => vistaBrecha(otro, "es")).toThrow(
      /S2 «sin_probar» y Brecha no tiene su lectura/,
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

describe("AU-S2-16: el tope de aclaraciones sale de la regla del plan, nunca de un «0»", () => {
  it("sin la regla que aplica el tope, la vista se detiene nombrándola", async () => {
    const d = await datosDemo();
    const otro = { ...d, plan: structuredClone(d.plan) };
    otro.plan.contrato_de_grafo.aristas_condicionales =
      otro.plan.contrato_de_grafo.aristas_condicionales.filter(
        (a) => !("senal" in a && a.senal === "ciclos_aclaracion"),
      );
    expect(() => vistaBrecha(otro, "es")).toThrow(
      "el plan no tiene una regla «tope» que lea un umbral declarado",
    );
  });
});

describe("los recortes de ids y corridas (AU-S2-P-3)", () => {
  const { rangoDeIds, cortarCorridas } = _paraPruebas;
  it("«C1–C9» solo si son todos los del plan, en orden y más de dos", () => {
    const todos = ["C1", "C2", "C3", "C4"];
    expect(rangoDeIds(todos, todos)).toBe("C1–C4");
    expect(rangoDeIds(["C1", "C2", "C4"], todos)).toBe("C1, C2, C4");
    expect(rangoDeIds(["C2", "C1", "C3", "C4"], todos)).toBe("C2, C1, C3, C4");
    expect(rangoDeIds(["C1", "C2"], ["C1", "C2"])).toBe("C1, C2");
  });
  it("recorta el prefijo común en su último guion; una sola corrida o sin guion, entera", () => {
    const c = cortarCorridas(["2026-09-27-v1.2", "2026-09-27-v1.2-r2"]);
    expect(c("2026-09-27-v1.2")).toBe("…v1.2");
    expect(c("2026-09-27-v1.2-r2")).toBe("…v1.2-r2");
    expect(cortarCorridas(["solo-una"])("solo-una")).toBe("solo-una");
    expect(cortarCorridas(["abc", "abd"])("abc")).toBe("abc");
  });
});

describe("los plazos del A (S9, C11): se publican con su margen, su rotura y sus supuestos", () => {
  it("dice a tiempo con el margen de la clase más apretada, dónde se rompe y que las llegadas son simuladas", () => {
    const p = es.criterios.plazos!;
    expect(p.titulo).toBe("Plazos: el reloj simulado");
    expect(p.lectura[0]).toBe(
      "Toda solicitud con plazo se decidió a tiempo. La que más esperó fue hospitalaria: 15 h 33 min de espera frente a un plazo de 72 horas. Al auditor le llegan 14 solicitudes por día hábil y atiende 30 casos por día hábil.",
    );
    expect(p.lectura[1]).toBe(
      "Donde se rompe: el plazo se cumple desde 8 casos por día hábil y con una menos salen 14. Eso cae dentro del tramo que el playground deja mover (5–60): baja la capacidad ahí para verlo.",
    );
    expect(p.lectura[2]).toContain("Las horas de llegada son simuladas");
    expect(p.lineas.filas.map((f) => [f[0], f[1], f[2], f[3], f[4]])).toEqual([
      ["Hospitalaria", "72 horas", "54", "30", "0"],
      ["Ambulatoria", "7 días calendario", "123", "40", "0"],
    ]);
    expect(p.lineas.fuente).toContain("Consultada el 2026-11-03");
  });

  it("M4 y B5: la señal de la clase y cómo se lee cada clase frente a la norma (supuesto) van antes de los supuestos del plan (ES y EN)", () => {
    const e = es.criterios.plazos!.lineas.supuestos;
    expect(e[0]).toMatch(/^La clase de cada solicitud se lee de la señal «/);
    expect(e[1]).toMatch(/^Hospitalaria: Solicitud expedita de la norma/);
    expect(e[1]).toContain("Es un supuesto de la simulación");
    expect(e[2]).toMatch(/^Ambulatoria: Solicitud estándar de la norma/);
    const n = en.criterios.plazos!.lineas.supuestos;
    expect(n[0]).toMatch(/^Each request's class is read from the “/);
    expect(n[1]).toMatch(/^Inpatient: The rule's expedited request/);
    expect(n[1]).toContain("It is a simulation assumption");
    expect(n.length).toBe(e.length);
  });

  it("en inglés está redactado, no copiado; y el criterio C11 está en la lista de criterios", () => {
    const p = en.criterios.plazos!;
    expect(p.lectura[0]).toContain(
      "Every request with a deadline was decided in time.",
    );
    expect(p.lectura[1]).toContain(
      "the deadline is met from 8 cases per business day",
    );
    expect(JSON.stringify(p)).not.toMatch(/urgencia|hospitalaria|ambulatoria/);
    expect(es.criterios.filas.map((f) => f.id)).toContain("C11");
    expect(es.criterios.duenos).toBeNull();
  });
});

describe("los dueños de las sociedades del B (S9, C7): con sus fallas y lo que el lote no probó", () => {
  it("dice 8 de 8 con el peso de cada sociedad y que no hubo inyecciones", async () => {
    const b = await datosDemo("demo-b");
    const x = vistaBrecha(b, "es").criterios;
    expect(x.plazos).toBeNull();
    expect(x.duenos!.lectura).toBe(
      "De 8 sociedades, el conjunto de dueños finales coincidió con la verdad conocida en las 8. Con tan pocas, la cifra orienta pero no prueba: cada sociedad pesa 12,5 puntos.",
    );
    expect(x.duenos!.aviso).toContain("no trae instrucciones escondidas");
    expect(vistaBrecha(b, "en").criterios.duenos!.lectura).toContain(
      "each company weighs 12.5 points",
    );
  });
});
