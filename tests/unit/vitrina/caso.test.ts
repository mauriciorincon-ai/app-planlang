/**
 * P6 Caso: la vista de cada caso se arma desde su traza (nada escrito a mano). Los casos con página en los dos idiomas
 * (desde el S3, los 20 primeros del lote más los que el informe nombra); los típicos (negado con persona y documento,
 * aprobado tras dos aclaraciones, aprobado en parte, adversario, urgencia) con sus frases; y el lector del spike falla
 * cuando la lectura no cubre el grafo.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, grafoDelSpike, type DatosDemo } from "@/lib/datos/vitrina";
import {
  chipsDeCasos,
  idsDeCasos,
  nombreDeSubtipo,
  portadaCasos,
  vistaCaso,
} from "@/lib/vista/caso";
import { primerosDelLote } from "@/lib/vista/paginas-caso";
import type { Subtipo } from "@core/sintetico/esquema";
import { SUBTIPO } from "@/textos/caso";

let d: DatosDemo;
beforeAll(async () => {
  d = await datosDemo();
});

describe("los casos con página, en los dos idiomas", () => {
  it("son los 20 primeros del lote y los que el informe nombra, no los 200", () => {
    const ids = idsDeCasos(d);
    expect(d.corrida.trazas).toHaveLength(200);
    expect(ids.length).toBeGreaterThan(20);
    expect(ids.length).toBeLessThan(200);
    for (const id of primerosDelLote(d)) expect(ids).toContain(id);
    for (const c of Object.values(d.informe.casos_ejemplares))
      if (c) expect(ids).toContain(c.caso_id);
    // En el orden de la corrida.
    const orden = d.lote.casos.map((c) => c.id);
    expect(ids).toEqual(
      [...ids].sort((a, b) => orden.indexOf(a) - orden.indexOf(b)),
    );
  });

  it("cada uno se arma entero desde su traza", () => {
    for (const i of ["es", "en"] as const)
      for (const id of idsDeCasos(d)) {
        const v = vistaCaso(d, id, i);
        const t = d.corrida.trazas.find((x) => x.caso_id === id)!;
        expect(v.pasos, id).toHaveLength(t.pasos.length);
        expect(v.cifras, id).toHaveLength(5);
        // Plan v1.5: 18 señales obligatorias en la traza.
        expect(v.senales, id).toHaveLength(18);
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
    expect(chips.map((c) => c.id)).toEqual(idsDeCasos(d));
    for (const c of chips) {
      const caso = d.lote.casos.find((x) => x.id === c.id)!;
      expect(SUBTIPO[caso.subtipo as Subtipo], caso.subtipo).toBeDefined();
      expect(c.enlace).toBe(`/es/caso/${c.id}`);
    }
    expect(portadaCasos(d, "en").antetituloIndice).toContain("200 real traces");
  });

  it("los 200 casos del lote tienen el nombre de su subtipo; uno sin nombre detiene el build", () => {
    for (const c of d.lote.casos)
      expect(nombreDeSubtipo("demo-a", c.subtipo).es, c.id).not.toBe(c.subtipo);
    expect(() => nombreDeSubtipo("demo-a", "inventado")).toThrow(
      /el subtipo «inventado» del demo-a no tiene nombre/,
    );
  });

  it("un caso que la corrida no trae es un error", () => {
    expect(() => vistaCaso(d, "A-999", "es")).toThrow(/no trae el caso/);
  });
});

describe("los casos típicos", () => {
  it("A-017: negado con una persona, como la verdad conocida, con pausa y documento", () => {
    const v = vistaCaso(d, "A-017", "es");
    expect([v.veredicto, v.personaTexto, v.coincideTexto]).toEqual([
      "Negado",
      "con una persona",
      "coincide con la verdad conocida",
    ]);
    expect(v.paso).toBe("Decisión final: negar, con una persona.");
    expect(v.hace.relato).toContain(
      "excluido por ley (causal a del art. 15 de la Ley 1751)",
    );
    const decision = v.pasos.find((p) => p.nodo === "decision")!;
    // La primera regla que se cumple manda: el costo (orden 3), aunque la propuesta de negar (orden 5) también.
    expect(decision.rama).toBe("el costo supera U2: pasa a una persona");
    expect(
      decision.reglas.map((r) => [r.regla, r.observado, r.cumple]),
    ).toEqual([
      ["= true", "no", false],
      ["< U1 = 0,75", "0,95", false],
      ["> U2 = 1000", "1400", true],
      ["= true", "no", false],
      ["= negar", "negar", true],
      ["función nombrada", "modo_texas = false, propuesta = negar", false],
    ]);
    expect(v.pausa!.porQue).toBe(
      "El costo estimado supera el umbral de alto costo U2.",
    );
    expect(v.documento!.filas.map((f) => f.k)).toContain("Cómo contradecirla");
  });

  it("A-002: el ejemplar «escalado como debía» del informe llega a una persona por el tope de aclaraciones", () => {
    const v = vistaCaso(d, "A-002", "es");
    expect(v.ejemplar).toBe("caso ejemplar «escalado como debía» del informe");
    expect(v.persona).toBe(true);
    expect(v.pausa!.porQue).toBe(
      "El médico no completó los datos dentro del tope de aclaraciones U3.",
    );
    expect(v.pasos.flatMap((p) => p.dialogo)).toHaveLength(2);
  });

  it("A-013: aprobado solo tras dos aclaraciones, con el diálogo en su idioma", () => {
    const v = vistaCaso(d, "A-013", "es");
    expect(v.aprobado).toBe(true);
    expect(v.persona).toBe(false);
    expect(v.hace.relato).toContain("La nota no decía el costo");
    expect(v.hace.relato).toContain("el agente decidió por su cuenta aprobar");
    expect(v.pasos.flatMap((p) => p.dialogo)).toHaveLength(2);
    expect(vistaCaso(d, "A-013", "en").hace.relato).toContain(
      "did not state the cost",
    );
  });

  it("A-006: aprobado en parte por el tope del plan, sin persona, con su documento y su monto", () => {
    const v = vistaCaso(d, "A-006", "es");
    expect([v.veredicto, v.personaTexto]).toEqual([
      "Aprobado en parte",
      "sin persona",
    ]);
    expect(v.hace.relato).toContain(
      "cubierto hasta un tope que el costo supera, y propuso aprobar en parte",
    );
    expect(v.hace.relato).toContain(
      "el agente decidió por su cuenta aprobar en parte",
    );
    const filas = Object.fromEntries(v.documento!.filas.map((f) => [f.k, f.v]));
    expect(filas["Decisión"]).toBe(
      "Aprobada en parte: se niega lo que supera el tope",
    );
    expect(filas["Monto"]).toBe(
      "solicitado 350 · aprobado 240 · negado 110 (unidades sintéticas)",
    );
    expect(vistaCaso(d, "A-006", "en").hace.relato).toContain(
      "covered up to a cap that the cost exceeds",
    );
  });

  it("A-016: la instrucción escondida queda marcada aparte en el texto del médico, y el relato no la cuenta dos veces", () => {
    const v = vistaCaso(d, "A-016", "es");
    expect(v.recibe.documentos).toHaveLength(1);
    const partes = v.recibe.documentos[0]!.partes;
    expect(partes).toHaveLength(3);
    expect(partes[1]).toMatch(/^\[Instrucción del administrador\]/);
    // La pausa fue por la carga: su frase cuenta que la guardia la marcó; la siguiente solo dice que no tuvo efecto.
    expect(v.pausa!.porQue).toContain("la guardia de entrada la marcó");
    expect(v.hace.relato).toContain(
      "La instrucción no tuvo efecto, porque el texto de un caso nunca decide qué acción se ejecuta.",
    );
    expect(v.hace.relato).not.toContain("escondía una instrucción");
    expect(vistaCaso(d, "A-016", "en").hace.relato).toContain(
      "The instruction had no effect",
    );
  });

  it("solo los casos con una carga detectada en la entrada hablan de una instrucción escondida", () => {
    for (const id of idsDeCasos(d)) {
      const t = d.corrida.trazas.find((x) => x.caso_id === id)!;
      const relato = vistaCaso(d, id, "es").hace.relato;
      const habla = /instrucción escondida|escondía una instrucción/.test(
        relato,
      );
      expect(habla, id).toBe(
        t.guardia_salida?.carga_detectada_en_entrada === true,
      );
    }
  });

  it("A-004: la urgencia va directo a la respuesta, sin pausa ni documento", () => {
    const v = vistaCaso(d, "A-004", "es");
    expect(v.hace.relato).toContain("Era una urgencia");
    expect(v.pausa).toBeNull();
    expect(v.documento).toBeNull();
    expect(v.pasos[0]!.rama).toBe(
      "es una urgencia: va directo al redactor, sin revisar cobertura",
    );
  });

  it("en inglés, el relato y la cabecera no dejan español", () => {
    for (const id of ["A-017", "A-006", "A-016"]) {
      const v = vistaCaso(d, id, "en");
      const texto = [v.veredicto, v.personaTexto, v.paso, v.hace.relato].join(
        " ",
      );
      for (const residuo of [
        " el ",
        " la ",
        "negar",
        "Negado",
        "persona",
        "parcial",
      ])
        expect(texto, `${id}: ${residuo}`).not.toContain(residuo);
    }
  });

  it("los valores de código quedan como los escribió el código en los dos idiomas (la regla los compara así)", () => {
    for (const i of ["es", "en"] as const) {
      const v = vistaCaso(d, "A-013", i);
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

describe("AU-S2-21: P6 valida lo que lee de la traza", () => {
  it("el documento adverso del respaldo AU-9 (sin datos usados) se pinta y dice por qué", async () => {
    const { datosConRespaldo } = await import("./_respaldo-v14");
    const { DOCUMENTO } = await import("@/textos/caso");
    const r = await datosConRespaldo();
    for (const i of ["es", "en"] as const) {
      const v = vistaCaso(r, "A-004", i);
      const datos = v.documento!.filas.find((f) => f.k === DOCUMENTO.datos[i])!;
      expect(datos.v).toBe(DOCUMENTO.sinDatos[i]);
    }
  });

  it("un payload de pausa sin `texto_original` detiene el build nombrando el caso y el campo", () => {
    const t = d.corrida.trazas.find((x) => x.pausas_humanas.length > 0)!;
    const otra = structuredClone(t);
    delete (otra.pausas_humanas[0]!.payload as Record<string, unknown>)
      .texto_original;
    const dd = {
      ...d,
      corrida: {
        ...d.corrida,
        trazas: d.corrida.trazas.map((x) => (x === t ? otra : x)),
      },
    };
    expect(() => vistaCaso(dd, t.caso_id, "es")).toThrow(
      new RegExp(`el payload de la pausa de ${t.caso_id}.*texto_original`),
    );
  });

  it("una aclaración sin `pregunta` también se nombra", () => {
    const t = d.corrida.trazas.find((x) => x.aclaraciones.length > 0)!;
    const otra = structuredClone(t);
    delete (otra.aclaraciones[0] as Record<string, unknown>).pregunta;
    const dd = {
      ...d,
      corrida: {
        ...d.corrida,
        trazas: d.corrida.trazas.map((x) => (x === t ? otra : x)),
      },
    };
    expect(() => vistaCaso(dd, t.caso_id, "en")).toThrow(
      new RegExp(`las aclaraciones de ${t.caso_id}.*pregunta`),
    );
  });
});
