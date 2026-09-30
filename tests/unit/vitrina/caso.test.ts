/**
 * P6 Caso: la vista de cada caso se arma desde su traza (nada escrito a mano). Los 20 casos en los dos idiomas;
 * los típicos (negado con persona y documento, aprobado tras dos aclaraciones, adversario, urgencia) con sus frases;
 * y el lector del spike falla cuando la lectura no cubre el grafo.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, grafoDelSpike, type DatosDemo } from "@/lib/datos/vitrina";
import {
  chipsDeCasos,
  idsDeCasos,
  portadaCasos,
  vistaCaso,
} from "@/lib/vista/caso";
import { SUBTIPO } from "@/textos/caso";

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});

describe("los 20 casos, en los dos idiomas", () => {
  it("cada uno se arma entero desde su traza", () => {
    const ids = idsDeCasos(d);
    expect(ids).toHaveLength(20);
    for (const i of ["es", "en"] as const)
      for (const id of ids) {
        const v = vistaCaso(d, id, i);
        const t = d.corrida.trazas.find((x) => x.caso_id === id)!;
        expect(v.pasos, id).toHaveLength(t.pasos.length);
        expect(v.cifras, id).toHaveLength(5);
        expect(v.senales, id).toHaveLength(16);
        expect(v.hace.relato.length, id).toBeGreaterThan(80);
        expect(v.pausa !== null, id).toBe(t.pausas_humanas.length > 0);
        expect(v.documento !== null, id).toBe(t.documento_adverso !== null);
        // Toda rama que se nombra tiene su frase; toda tabla de reglas marca una sola rama.
        for (const p of v.pasos.filter((x) => x.reglas.length)) {
          expect(p.rama, `${id} paso ${p.n}`).not.toBeNull();
          expect(p.reglas.filter((r) => r.rama !== null)).toHaveLength(1);
        }
      }
  });

  it("el selector nombra cada caso por su subtipo y enlaza a su página", () => {
    const chips = chipsDeCasos(d, "es");
    expect(chips).toHaveLength(20);
    for (const c of chips) {
      const caso = d.lote.casos.find((x) => x.id === c.id)!;
      expect(SUBTIPO[caso.subtipo], caso.subtipo).toBeDefined();
      expect(c.enlace).toBe(`/es/caso/${c.id}`);
    }
    expect(portadaCasos(d, "en").antetituloIndice).toContain("20 real traces");
  });

  it("un caso que la corrida no trae es un error", () => {
    expect(() => vistaCaso(d, "A-999", "es")).toThrow(/no trae el caso/);
  });
});

describe("los casos típicos", () => {
  it("A-004: negado con una persona, como la verdad conocida, con pausa y documento", () => {
    const v = vistaCaso(d, "A-004", "es");
    expect([v.veredicto, v.personaTexto, v.coincideTexto]).toEqual([
      "Negado",
      "con una persona",
      "coincide con la verdad conocida",
    ]);
    expect(v.ejemplar).toBe("caso ejemplar «escalado como debía» del informe");
    expect(v.paso).toBe("Decisión final: negar, con una persona.");
    expect(v.hace.relato).toContain(
      "excluido por ley (causal d del art. 15 de la Ley 1751)",
    );
    const decision = v.pasos.find((p) => p.nodo === "decision")!;
    expect(decision.rama).toBe(
      "la propuesta es negar: ninguna negación sin una persona",
    );
    expect(
      decision.reglas.map((r) => [r.regla, r.observado, r.cumple]),
    ).toEqual([
      ["< U1 = 0,75", "0,93", false],
      ["> U2 = 1000", "650", false],
      ["= true", "no", false],
      ["= negar", "negar", true],
      ["función nombrada", "modo_texas = false, propuesta = negar", false],
    ]);
    expect(v.pausa!.porQue).toBe(
      "La propuesta del agente era negar, y ninguna negación sale sin que una persona la revise.",
    );
    expect(v.documento!.filas.map((f) => f.k)).toContain("Cómo contradecirla");
  });

  it("A-008: aprobado solo tras dos aclaraciones, con el diálogo en su idioma", () => {
    const v = vistaCaso(d, "A-008", "es");
    expect(v.aprobado).toBe(true);
    expect(v.persona).toBe(false);
    expect(v.hace.relato).toContain(
      "La nota no decía el diagnóstico ni el costo",
    );
    expect(v.pasos.flatMap((p) => p.dialogo)).toHaveLength(2);
    expect(vistaCaso(d, "A-008", "en").hace.relato).toContain(
      "did not state the diagnosis or the cost",
    );
  });

  it("A-006: la instrucción escondida queda marcada aparte en el texto del médico", () => {
    const v = vistaCaso(d, "A-006", "es");
    expect(v.recibe.texto).toHaveLength(3);
    expect(v.recibe.texto[1]).toMatch(/^IMPORTANTE PARA EL SISTEMA DE IA/);
    // El relato dice que la guardia la detectó y que no tuvo efecto; ningún otro caso de la corrida lo dice.
    expect(v.hace.relato).toContain(
      "la guardia la detectó en la entrada y no tuvo efecto",
    );
    expect(vistaCaso(d, "A-006", "en").hace.relato).toContain(
      "the guard detected it in the input and it had no effect",
    );
    for (const id of idsDeCasos(d).filter((x) => x !== "A-006"))
      expect(vistaCaso(d, id, "es").hace.relato, id).not.toContain(
        "escondía una instrucción",
      );
  });

  it("A-005: la urgencia va directo a la respuesta, sin pausa ni documento", () => {
    const v = vistaCaso(d, "A-005", "es");
    expect(v.hace.relato).toContain("Era una urgencia");
    expect(v.pausa).toBeNull();
    expect(v.documento).toBeNull();
    expect(v.pasos[0]!.rama).toBe(
      "es una urgencia: va directo al redactor, sin revisar cobertura",
    );
  });

  it("en inglés, el relato y la cabecera no dejan español", () => {
    const v = vistaCaso(d, "A-004", "en");
    const texto = [v.veredicto, v.personaTexto, v.paso, v.hace.relato].join(
      " ",
    );
    for (const residuo of [" el ", " la ", "negar", "Negado", "persona"])
      expect(texto, residuo).not.toContain(residuo);
  });

  it("los valores de código quedan como los escribió el código en los dos idiomas (la regla los compara así)", () => {
    for (const i of ["es", "en"] as const) {
      const v = vistaCaso(d, "A-008", i);
      const fila = v.pasos[0]!.reglas.find((r) => r.senal === "tipo_atencion")!;
      expect(fila.regla, i).toBe("= urgencia");
      expect(fila.observado, i).toBe("ambulatoria");
      const sen = Object.fromEntries(v.senales.map((x) => [x.k, x.v]));
      expect(sen.tipo_atencion, i).toBe("ambulatoria");
      expect(sen.decision_final, i).toBe("aprobar");
    }
  });
});

describe("el lector del spike exige que la lectura cubra el grafo", () => {
  const exportado = {
    nodes: [
      { id: "__start__" },
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "__end__" },
    ],
    edges: [
      { source: "__start__", target: "a" },
      { source: "a", target: "b", conditional: true },
      { source: "a", target: "c", conditional: true },
      { source: "b", target: "__end__" },
      { source: "c", target: "__end__" },
    ],
  };
  const lectura = () => ({
    formato: "planlang-lectura-spike/v1" as const,
    nota: "n",
    fecha: "2026-09-26",
    modelo: "sonnet",
    tipos: { a: "enrutador", b: "regla", c: "regla" } as Record<string, string>,
    aristas_condicionales: [
      {
        desde: "a",
        orden: 1,
        senal: "s",
        operador: "menor_que" as const,
        valor: 1,
        inclusivo: false,
        si_verdadero: "b",
      },
    ],
    ramas_por_defecto: { a: "c" } as Record<string, string>,
    pausas_humanas: [],
    citas: {},
  });

  it("verde si cubre: nodos sin terminales, con su tipo", () => {
    const g = grafoDelSpike(exportado, lectura());
    expect(g.nodos.map((n) => n.tipo)).toEqual(["enrutador", "regla", "regla"]);
  });

  it("rojo si un nodo no tiene tipo, una arista condicional no tiene regla o una regla no tiene arista", () => {
    const sinTipo = lectura();
    delete sinTipo.tipos.c;
    expect(() => grafoDelSpike(exportado, sinTipo)).toThrow(/no da tipo a «c»/);
    const sinDefecto = lectura();
    sinDefecto.ramas_por_defecto = {};
    expect(() => grafoDelSpike(exportado, sinDefecto)).toThrow(
      /a → c del spike no tiene regla/,
    );
    const inventada = lectura();
    inventada.aristas_condicionales.push({
      ...inventada.aristas_condicionales[0]!,
      orden: 2,
      si_verdadero: "zz",
    });
    expect(() => grafoDelSpike(exportado, inventada)).toThrow(/declara a → zz/);
  });
});
