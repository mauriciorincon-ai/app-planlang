/**
 * Paridad del playground (fase 3 del S2): el compacto que viaja al navegador y el cálculo de consecuencias dicen,
 * con los umbrales del plan, EXACTAMENTE lo que dicen el informe y RF-09.2 — ningún caso cambia, cada visita toma la
 * rama de `ramas-esperadas.json` (que escribió Python), los observados y los casos en el umbral son los del informe y
 * cada criterio queda en su estado del informe. Y al mover un umbral, cada criterio medido con el compacto coincide
 * con el verificador (`evaluarCriterios`) sobre el mismo camino. Corre en `core` y en `core-jsdom`.
 */
import { describe, expect, it } from "vitest";
import { objetoDeCaso, contextoDeObjeto } from "@core/brecha/contexto";
import { evaluarCriterios } from "@core/brecha/criterios";
import {
  CLAVES_DEL_DESENLACE,
  compactar,
  objetoEnOtroCamino,
  senalesQueLeenLasAristas,
} from "@core/playground/compactar";
import type { Compacto } from "@core/playground/compacto";
import {
  casosQueReproducen,
  consecuencias,
  observados,
  umbralesDelPlan,
} from "@core/playground/consecuencias";
import {
  recalcular,
  recalcularVisita,
  type Umbrales,
} from "@core/playground/interprete";
import { umbralesAplicados } from "@core/plan/contrato-constructor";
import type { Plan } from "@core/plan/esquema";
import { datosDemo } from "@/lib/datos/vitrina";

async function base() {
  const d = await datosDemo();
  const c = compactar(
    d.plan,
    d.corrida,
    d.lote,
    d.informe,
    d.manifiesto.playground,
  );
  return { ...d, c };
}

/** El verificador sobre el camino que dice el playground: caso por caso, el objeto registrado o el del camino nuevo. */
async function verificadorEnElCamino(plan: Plan, c: Compacto, u: Umbrales) {
  const d = await datosDemo();
  const r = consecuencias(c, u);
  const previas = new Set<string>([
    ...senalesQueLeenLasAristas(c.aristas),
    ...d.manifiesto.playground.claves_previas,
  ]);
  const lote = new Map(d.lote.casos.map((k) => [k.id, k]));
  const vistas = d.corrida.trazas.map((traza) => {
    const caso = lote.get(traza.caso_id)!;
    const registrado = objetoDeCaso(caso, traza, umbralesAplicados(plan));
    const cambio = r.cambios.find((x) => x.id === caso.id);
    const compacto = c.casos.find((k) => k.id === caso.id)!;
    const objeto = cambio
      ? objetoEnOtroCamino(
          registrado,
          caso,
          compacto.visitas,
          compacto.visitas.findIndex(
            (v) => v.paso === cambio.paso && v.desde === cambio.nodo,
          ),
          cambio.ahora,
          previas,
          d.manifiesto.playground.senal_propuesta,
        )
      : registrado;
    return {
      caso_id: caso.id,
      caso,
      traza,
      ctx: contextoDeObjeto(caso, objeto),
    };
  });
  return { r, verificador: evaluarCriterios(plan, vistas) };
}

describe("paridad del playground con el informe y con RF-09.2", () => {
  it("con los umbrales del plan ningún caso cambia y los minutos son los de las pausas registradas", async () => {
    const { c, informe, plan } = await base();
    const r = consecuencias(c, umbralesDelPlan(c));
    expect(r.movidos).toEqual([]);
    expect(r.cambios).toEqual([]);
    expect(r.personas).toBe(informe.contrato_de_grafo.pausas.casos_con_pausa);
    // Oráculo fuera del código bajo prueba (AU-S2-B57): las pausas que cuenta el informe por el costo humano que
    // declara el plan, y la cifra fija de la corrida publicada.
    const minutosDelPlan = plan.umbrales[0]!.costo_humano_por_caso_min!;
    expect(r.minutos).toBe(
      informe.contrato_de_grafo.pausas.casos_con_pausa * minutosDelPlan,
    );
    expect(r.minutos).toBe(96);
  });

  it("cada visita, recalculada con los umbrales del plan, toma la rama de ramas-esperadas.json", async () => {
    const { c, corrida } = await base();
    const esperadas = new Map(
      corrida.ramas.visitas.map((v) => [
        `${v.caso_id}|${v.paso}|${v.desde}`,
        v.rama_tomada,
      ]),
    );
    let n = 0;
    for (const caso of c.casos)
      for (const v of caso.visitas) {
        const { rama } = recalcularVisita(
          v.desde,
          v.senales,
          c.aristas,
          c.ramas_por_defecto,
          umbralesDelPlan(c),
          c.ligaduras,
        );
        const clave = `${caso.id}|${v.paso}|${v.desde}`;
        expect(rama, clave).toBe(esperadas.get(clave));
        expect(v.rama, clave).toBe(rama);
        n++;
      }
    expect(n).toBe(corrida.ramas.visitas.length);
  });

  it("los observados y los casos justo en el umbral son los del informe", async () => {
    const { c, informe } = await base();
    const obs = observados(c, umbralesDelPlan(c));
    for (const u of informe.playground.umbrales) {
      const o = obs.find((x) => x.id === u.id);
      expect(o, u.id).toBeDefined();
      expect({ ...o, id: undefined }).toEqual({
        id: undefined,
        ...u.observados,
        casos_en_el_umbral: u.casos_en_el_umbral,
      });
    }
  });

  it("cada criterio queda en el estado y el valor que midió el informe", async () => {
    const { c, informe } = await base();
    const r = consecuencias(c, umbralesDelPlan(c));
    for (const cr of informe.criterios) {
      const x = r.criterios.find((k) => k.id === cr.id);
      expect(x?.estado, cr.id).toBe(cr.estado);
      expect(x?.valor, cr.id).toEqual(cr.valor_medido);
      expect(x?.recalculado, cr.id).toBe(false);
    }
    expect(r.cumplen).toBe(
      informe.criterios.filter((k) => k.estado === "cumple").length,
    );
  });

  it("conmutar un umbral booleano cambia las decisiones que dice el informe (U4: 0 de 62)", async () => {
    const { c, corrida, plan, informe } = await base();
    const delPlan = umbralesAplicados(plan) as Umbrales;
    for (const u of plan.umbrales) {
      if (typeof u.valor_en_plan !== "boolean") continue;
      const lig = c.ligaduras;
      const ramas = (x: Umbrales) =>
        corrida.trazas.flatMap((t) =>
          recalcular(
            t.decisiones_de_arista,
            c.aristas,
            c.ramas_por_defecto,
            x,
            lig,
          ).map((v) => v.rama_tomada),
        );
      const antes = ramas(delPlan);
      const despues = ramas({ ...delPlan, [u.id]: !u.valor_en_plan });
      const n = antes.filter((r, i) => r !== despues[i]).length;
      // Oráculo sin `recalcular` (AU-S2-B57): encender Texas solo puede cambiar una visita de decisión que salió
      // sin persona con una propuesta que no es «aprobar»; las que dicen «negar» ya iban a una persona por su regla.
      const independientes = corrida.trazas.flatMap((t) => {
        const porPaso = new Map<number, typeof t.decisiones_de_arista>();
        for (const x of t.decisiones_de_arista.filter(
          (x) => x.desde === "decision",
        ))
          porPaso.set(x.paso, [...(porPaso.get(x.paso) ?? []), x]);
        return [...porPaso.values()].filter((xs) => {
          const propuesta = xs.find(
            (x) => x.senal === "propuesta",
          )?.valor_observado;
          return (
            xs.every((x) => x.resultado === false) &&
            propuesta !== "aprobar" &&
            propuesta !== "negar"
          );
        });
      }).length;
      expect(n, u.id).toBe(independientes);
      expect([n, antes.length], u.id).toEqual([0, 62]);
      expect(
        informe.playground.limites.some(
          (l) =>
            l.es.startsWith(`${u.id} (`) &&
            l.es.includes(`cambia ${n} de las ${antes.length} decisiones`),
        ),
        u.id,
      ).toBe(true);
      // Si ninguna decisión cambia, ningún caso puede cambiar de camino en el playground.
      if (n === 0)
        expect(
          consecuencias(c, { ...umbralesDelPlan(c), [u.id]: !u.valor_en_plan })
            .cambios,
        ).toEqual([]);
    }
  });
});

describe("al mover un umbral, el compacto mide igual que el verificador", () => {
  async function referencia(c: Compacto, u: Umbrales) {
    return verificadorEnElCamino((await datosDemo()).plan, c, u);
  }

  const combinaciones: Umbrales[] = [];
  for (const U1 of [0.5, 0.75, 0.85, 0.9, 0.95])
    for (const U2 of [200, 1000, 1600, 5000])
      for (const U3 of [0, 1, 2, 3, 4])
        for (const U4 of [false, true]) combinaciones.push({ U1, U2, U3, U4 });

  it(`en ${combinaciones.length} combinaciones de umbrales, cada criterio (salvo pass^k) coincide con evaluarCriterios`, async () => {
    const { c } = await base();
    for (const u of combinaciones) {
      const { r, verificador } = await referencia(c, u);
      for (const v of verificador) {
        if (v.agregacion === "pass^k") continue;
        const x = r.criterios.find((k) => k.id === v.id)!;
        const etiqueta = `${v.id} con ${JSON.stringify(u)}`;
        expect(x.estado, etiqueta).toBe(v.estado);
        expect(x.valor, etiqueta).toEqual(v.valor_medido);
        expect([...x.casos_que_incumplen].sort(), etiqueta).toEqual(
          [...v.casos_que_incumplen].sort(),
        );
      }
    }
  });
});

describe("al mover un umbral, un oráculo sacado de las señales crudas de la traza (AU-S2-B57)", () => {
  /** Las visitas de decisión de cada caso que salieron sin persona (ninguna regla verdadera) y su señal observada. */
  async function soloConSenal(senal: string) {
    const { corrida } = await base();
    return corrida.trazas.flatMap((t) => {
      const xs = t.decisiones_de_arista.filter((x) => x.desde === "decision");
      if (xs.length === 0 || xs.some((x) => x.resultado)) return [];
      const v = xs.find((x) => x.senal === senal)?.valor_observado;
      return typeof v === "number" ? [{ id: t.caso_id, v }] : [];
    });
  }

  it.each([0.8, 0.85, 0.9, 0.95])(
    "subir U1 a %s manda a una persona exactamente los casos que salieron solos con menos confianza",
    async (U1) => {
      const { c } = await base();
      const esperados = (await soloConSenal("senal_confianza"))
        .filter((x) => x.v < U1)
        .map((x) => x.id)
        .sort();
      const r = consecuencias(c, { ...umbralesDelPlan(c), U1 });
      expect(r.cambios.map((x) => x.id).sort()).toEqual(esperados);
      for (const x of r.cambios) expect(x.ahora, x.id).toBe("persona");
    },
  );

  it.each([900, 500, 200])(
    "bajar U2 a %s manda a una persona exactamente los casos que salieron solos con más costo",
    async (U2) => {
      const { c } = await base();
      const esperados = (await soloConSenal("costo_estimado"))
        .filter((x) => x.v > U2)
        .map((x) => x.id)
        .sort();
      const r = consecuencias(c, { ...umbralesDelPlan(c), U2 });
      expect(r.cambios.map((x) => x.id).sort()).toEqual(esperados);
      for (const x of r.cambios) expect(x.ahora, x.id).toBe("persona");
    },
  );
});

describe("los ejemplos de la maqueta, medidos", () => {
  it("U1 = 0,90: A-008 (confianza 0,88) pasa a una persona; +12 min; ningún error nuevo", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U1: 0.9 });
    expect(r.cambios.map((x) => [x.id, x.antes, x.ahora, x.efecto])).toEqual([
      ["A-008", "solo", "persona", "revision_de_mas"],
    ]);
    expect(r.minutos! - r.minutos_plan!).toBe(12);
    expect(r.introducidos).toEqual([]);
    const a008 = r.cambios[0]!;
    expect(a008.ahora_decide?.senal).toBe("senal_confianza");
    expect(a008.ahora_decide?.umbral_aplicado).toBe(0.9);
  });

  it("U2 = 1600: A-010 (costo 1500) sale sin persona — un error — y C3 deja de cumplirse", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U2: 1600 });
    const a010 = r.cambios.find((x) => x.id === "A-010");
    expect(a010?.efecto).toBe("error_introducido");
    expect(a010?.ahora_decide).toBeNull();
    expect(a010?.ya_no_decide?.senal).toBe("costo_estimado");
    expect(r.introducidos).toContain("A-010");
    const c3 = r.criterios.find((k) => k.id === "C3")!;
    expect(c3.estado).toBe("incumple");
    expect(c3.casos_que_incumplen).toEqual(["A-010"]);
  });

  it("lo que el camino nuevo no registró queda sin medir: con U1 = 0,90, C9 no puede ver la pausa de A-008", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U1: 0.9 });
    const c9 = r.criterios.find((k) => k.id === "C9")!;
    expect(c9.estado).toBe("indeterminado");
    expect(c9.no_evaluables).toEqual(["A-008"]);
    expect(c9.recalculado).toBe(true);
    // C4 no lee nada que A-008 cambie: sigue como en el informe.
    expect(r.criterios.find((k) => k.id === "C4")?.recalculado).toBe(false);
  });

  it("U3 = 3: A-007 pediría otra aclaración que la traza no tiene → «no observado»", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U3: 3 });
    expect(r.cambios.map((x) => [x.id, x.efecto])).toEqual([
      ["A-007", "no_observado"],
    ]);
    expect(r.no_observados).toEqual(["A-007"]);
    // AU-S2-22: los minutos se comparan sobre la misma población; el caso que nadie midió no cuenta como ahorro.
    expect(r.minutos! - r.minutos_plan!).toBe(0);
    expect(r.minutos_plan).toBe(r.personas * c.minutos_por_persona!);
  });

  it("U3 = 1: A-007 llega a una persona con una aclaración menos; A-008 pasa a una persona", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U3: 1 });
    const a007 = r.cambios.find((x) => x.id === "A-007");
    expect(a007?.efecto).toBe("mismo_destino");
    expect(a007?.visitas_ahorradas).toBe(1);
    expect(r.cambios.find((x) => x.id === "A-008")?.ahora).toBe("persona");
  });

  it("encender el modo Texas no cambia ningún caso: toda propuesta adversa ya pasaba por una persona", async () => {
    const { c } = await base();
    const r = consecuencias(c, { ...umbralesDelPlan(c), U4: true });
    expect(r.movidos).toEqual(["U4"]);
    expect(r.cambios).toEqual([]);
  });
});

describe("el compacto se niega a adivinar", () => {
  it("una clave del contexto que nadie clasificó hace fallar el compacto, nombrándola", async () => {
    const d = await datosDemo();
    const trazas = d.corrida.trazas.map((t, i) =>
      i === 0 ? { ...t, senales: { ...t.senales, senal_nueva: 1 } } : t,
    );
    expect(() =>
      compactar(
        d.plan,
        { ...d.corrida, trazas },
        d.lote,
        d.informe,
        d.manifiesto.playground,
      ),
    ).toThrow(/senal_nueva/);
  });

  it("el desenlace está clasificado: lo que el agente produce después de decidir no se da por sabido", () => {
    expect(CLAVES_DEL_DESENLACE).toEqual(
      expect.arrayContaining([
        "pausa_humana",
        "decision_final",
        "salida_final",
        "documento_adverso",
        "interrupt_payload",
        "latencia_total_s",
      ]),
    );
  });
});

describe("con otras reglas de medición, el compacto mide igual que el verificador", () => {
  type Criterio = Plan["criterios_aceptacion"][number];
  const VARIANTES: [string, string, (c: Criterio) => void][] = [
    [
      "C7 con promedio",
      "C7",
      (c) => (c.regla_de_medicion.agregacion = "promedio"),
    ],
    [
      "C7 con máximo (A-008 pasa de 30 s)",
      "C7",
      (c) => (c.regla_de_medicion.agregacion = "maximo"),
    ],
    [
      "C7 como métrica a superar (mayor es mejor)",
      "C7",
      (c) => {
        c.tipo = "tasa";
        c.regla_de_medicion.agregacion = "promedio";
        c.valor_objetivo = 10;
      },
    ],
    ["C7 sin objetivo numérico", "C7", (c) => (c.valor_objetivo = true)],
    [
      "C7 sobre una población vacía",
      "C7",
      (c) => (c.regla_de_medicion.poblacion = "tipo == 'ninguno'"),
    ],
    [
      // AU-S2-B53: la métrica se agrega sobre toda la población, cumpla o no la condición (como `porMetrica`).
      "C7 con una condición que algunos casos no cumplen",
      "C7",
      (c) => (c.regla_de_medicion.condicion = "pausa_humana == true"),
    ],
    [
      "C3 como tasa ≥ 0,9",
      "C3",
      (c) => {
        c.tipo = "tasa";
        c.regla_de_medicion.agregacion = "tasa";
        c.valor_objetivo = 0.9;
      },
    ],
    [
      "C1 sobre una población vacía",
      "C1",
      (c) => (c.regla_de_medicion.poblacion = "tipo == 'ninguno'"),
    ],
    [
      "C2 con una regla mal formada (compara estructuras que nunca son iguales)",
      "C2",
      (c) => (c.regla_de_medicion.condicion = "extraccion == verdad_conocida"),
    ],
  ];
  const MOVIDOS: Partial<Umbrales>[] = [
    {},
    { U1: 0.9 },
    { U2: 1600 },
    { U2: 200 },
    { U3: 0 },
    { U3: 3 },
  ];

  it.each(VARIANTES)("%s", async (_, id, cambiar) => {
    const d = await datosDemo();
    const plan = structuredClone(d.plan) as Plan;
    cambiar(plan.criterios_aceptacion.find((x) => x.id === id)!);
    // El informe de esa regla: el verificador sobre lo que se registró (el playground parte de ahí).
    const enPlan = await verificadorEnElCamino(
      plan,
      compactar(d.plan, d.corrida, d.lote, d.informe, d.manifiesto.playground),
      umbralesDelPlan(
        compactar(
          d.plan,
          d.corrida,
          d.lote,
          d.informe,
          d.manifiesto.playground,
        ),
      ),
    );
    const informe = {
      ...d.informe,
      criterios: d.informe.criterios.map((x) =>
        x.id === id ? enPlan.verificador.find((v) => v.id === id)! : x,
      ),
    };
    const c = compactar(
      plan,
      d.corrida,
      d.lote,
      informe,
      d.manifiesto.playground,
    );
    for (const m of MOVIDOS) {
      const u = { ...umbralesDelPlan(c), ...m } as Umbrales;
      const { r, verificador } = await verificadorEnElCamino(plan, c, u);
      const v = verificador.find((x) => x.id === id)!;
      const x = r.criterios.find((k) => k.id === id)!;
      const etiqueta = `${id} con ${JSON.stringify(m)}`;
      expect(x.estado, etiqueta).toBe(v.estado);
      expect(x.valor, etiqueta).toEqual(v.valor_medido);
      expect([...x.casos_que_incumplen].sort(), etiqueta).toEqual(
        [...v.casos_que_incumplen].sort(),
      );
    }
  });
});

describe("los cuatro efectos dependen de la verdad conocida (DA-04)", () => {
  async function conVerdad(id: string, debeEscalar: boolean) {
    const { c } = await base();
    return {
      ...c,
      casos: c.casos.map((k) =>
        k.id === id ? { ...k, debe_escalar: debeEscalar } : k,
      ),
    };
  }
  it("a una persona: revisión de más si no debía escalar, error evitado si sí", async () => {
    for (const [debe, efecto] of [
      [false, "revision_de_mas"],
      [true, "error_evitado"],
    ] as const) {
      const c = await conVerdad("A-008", debe);
      const r = consecuencias(c, { ...umbralesDelPlan(c), U1: 0.9 });
      expect(r.cambios.map((x) => [x.id, x.efecto])).toEqual([
        ["A-008", efecto],
      ]);
      expect(r.evitados.length).toBe(debe ? 1 : 0);
    }
  });
  it("sin persona: error introducido si debía escalar, revisión ahorrada si no", async () => {
    for (const [debe, efecto] of [
      [true, "error_introducido"],
      [false, "revision_ahorrada"],
    ] as const) {
      const c = await conVerdad("A-010", debe);
      const r = consecuencias(c, { ...umbralesDelPlan(c), U2: 1600 });
      expect(r.cambios.map((x) => [x.id, x.efecto])).toEqual([
        ["A-010", efecto],
      ]);
      expect(r.introducidos.length).toBe(debe ? 1 : 0);
    }
  });
});

describe("el compacto se niega a adivinar (las entradas)", () => {
  it("un plan con dos costos humanos distintos en sus umbrales no se compacta; sin ninguno, no se inventa (S3)", async () => {
    const d = await datosDemo();
    const plan = structuredClone(d.plan) as Plan;
    plan.umbrales[1]!.costo_humano_por_caso_min = 15;
    expect(() =>
      compactar(plan, d.corrida, d.lote, d.informe, d.manifiesto.playground),
    ).toThrow(/varios costos humanos/);
    for (const u of plan.umbrales)
      delete (u as { costo_humano_por_caso_min?: number })
        .costo_humano_por_caso_min;
    // El plan B no declara costo humano: el playground cuenta los casos que van a una persona y no pone minutos.
    const c = compactar(
      plan,
      d.corrida,
      d.lote,
      d.informe,
      d.manifiesto.playground,
    );
    expect(c.minutos_por_persona).toBe(null);
    const r = consecuencias(c, umbralesDelPlan(c));
    expect([r.minutos, r.minutos_plan]).toEqual([null, null]);
    expect(r.personas).toBe(r.personas_plan);
  });
  it("un informe sin un criterio del plan, o una traza sin su caso en el lote, se nombran", async () => {
    const d = await datosDemo();
    const informe = {
      ...d.informe,
      criterios: d.informe.criterios.filter((x) => x.id !== "C9"),
    };
    expect(() =>
      compactar(d.plan, d.corrida, d.lote, informe, d.manifiesto.playground),
    ).toThrow(/no trae el criterio C9/);
    const lote = {
      ...d.lote,
      casos: d.lote.casos.filter((k) => k.id !== "A-001"),
    };
    expect(() =>
      compactar(d.plan, d.corrida, lote, d.informe, d.manifiesto.playground),
    ).toThrow(/A-001 no está en el lote/);
  });
  it("un camino sin su evaluación precalculada no se inventa", async () => {
    const { c } = await base();
    const roto = {
      ...c,
      casos: c.casos.map((k) =>
        k.id === "A-008"
          ? { ...k, evaluaciones: { ...k.evaluaciones, caminos: {} } }
          : k,
      ),
    };
    expect(() =>
      consecuencias(roto, { ...umbralesDelPlan(c), U1: 0.9 }),
    ).toThrow(/A-008 no trae la evaluación del camino/);
  });
});

describe("tiempos (en el navegador, sin modelo)", () => {
  function replicar(c: Compacto, veces: number): Compacto {
    const casos = Array.from({ length: veces }, (_, k) =>
      c.casos.map((x) => ({ ...x, id: `${x.id}-${k}` })),
    ).flat();
    return { ...c, casos };
  }
  function medianaDe(fn: () => void, n: number): number {
    const t: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = performance.now();
      fn();
      t.push(performance.now() - a);
    }
    t.sort((a, b) => a - b);
    return t[Math.floor(n / 2)] as number;
  }

  it("200 casos se recalculan en menos de 100 ms (mediana)", async () => {
    const { c } = await base();
    const grande = replicar(c, 10);
    expect(grande.casos.length).toBe(200);
    const u = { ...umbralesDelPlan(c), U1: 0.9, U2: 1600, U3: 1 };
    expect(medianaDe(() => consecuencias(grande, u), 15)).toBeLessThan(100);
  });

  it("cada movimiento sobre los 20 casos cabe en un cuadro (< 16 ms, mediana)", async () => {
    const { c } = await base();
    let k = 0;
    const valores = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
    expect(
      medianaDe(
        () =>
          consecuencias(c, {
            ...umbralesDelPlan(c),
            U1: valores[k++ % valores.length]!,
          }),
        30,
      ),
    ).toBeLessThan(16);
  });
});

describe("AU-S2-B45: una propuesta adversa sin persona es un error, nunca una revisión ahorrada", () => {
  it("si el plan dejara salir solo un caso con propuesta de negar, el efecto es «error_introducido» aunque la verdad no pida escalar", async () => {
    const { c } = await base();
    const x = structuredClone(c);
    // Sin la regla literal «propuesta = negar», una negación iría sola por la rama por defecto.
    x.aristas = x.aristas.filter(
      (a) => !("senal" in a) || a.senal !== x.propuesta.senal,
    );
    const negado = x.casos.find((k) =>
      k.visitas.some(
        (v) =>
          v.senales[x.propuesta.senal] !== undefined &&
          v.senales[x.propuesta.senal] !== x.propuesta.favorable,
      ),
    )!;
    negado.debe_escalar = false;
    const r = consecuencias(x, umbralesDelPlan(x));
    const cambio = r.cambios.find((k) => k.id === negado.id);
    expect(cambio?.ahora).toBe("solo");
    expect(cambio?.efecto).toBe("error_introducido");
  });
});

describe("C-2: la comprobación «N de N casos reproducen su camino» se calcula", () => {
  it("con los umbrales del plan, los veinte reproducen el camino registrado", async () => {
    const { c } = await base();
    expect(casosQueReproducen(c)).toBe(c.casos.length);
  });

  it("un caso cuya rama registrada no es la que da la regla baja la cuenta", async () => {
    const { c } = await base();
    const otro = structuredClone(c);
    const caso = otro.casos.find((k) =>
      k.visitas.some((v) => otro.nodos_jugables.includes(v.desde)),
    )!;
    const v = caso.visitas.find((x) => otro.nodos_jugables.includes(x.desde))!;
    v.rama = `${v.rama}-otra`;
    expect(casosQueReproducen(otro)).toBe(c.casos.length - 1);
  });
});
