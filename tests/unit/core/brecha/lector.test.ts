/**
 * RF-06.1 — el lector rechaza, con TODOS sus motivos, lo que no puede atribuir: huellas que no
 * coinciden, archivos fuera de esquema, referencias rotas, trazas mal formadas y corridas incompatibles.
 */
import { describe, expect, it } from "vitest";
import { conHuella, sinHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import {
  ErrorDeLectura,
  leerCorridaVerificada,
  leerEntrada,
  type EntradaVerificador,
  type MotivoLectura,
} from "../../../../core/brecha/lector";
import { archivosDeCorrida } from "../../../../scripts/_corridas";
import {
  copia,
  entradaReal,
  entradaSimulada,
  REAL_BASE,
} from "../../../helpers/corridas";

type O = Record<string, JsonValor>;

async function motivos(e: EntradaVerificador): Promise<MotivoLectura[]> {
  try {
    await leerEntrada(e);
  } catch (err) {
    expect(err).toBeInstanceOf(ErrorDeLectura);
    expect((err as Error).message).toMatch(/corrida rechazada/);
    return [...(err as ErrorDeLectura).motivos];
  }
  throw new Error("se esperaba un rechazo");
}

const codigos = (ms: MotivoLectura[]) =>
  [...new Set(ms.map((m) => m.codigo))].sort();
const sellar = async (x: unknown) => conHuella(sinHuella(x as O));

/** Re-sella una traza y el manifiesto tras mutarla (un exportador «honesto» con un defecto). */
async function conTrazaMutada(
  e: EntradaVerificador,
  archivo: string,
  f: (t: O) => void,
): Promise<EntradaVerificador> {
  const c = copia(e.corrida);
  const t = c.trazas[archivo] as O;
  f(t);
  const nueva = await sellar(t);
  const manifiesto = c.corrida as O & { trazas: O[] };
  for (const d of manifiesto.trazas)
    if (d["archivo"] === archivo) d["huella"] = nueva.huella;
  return {
    ...e,
    corrida: {
      ...c,
      trazas: { ...c.trazas, [archivo]: nueva },
      corrida: await sellar(manifiesto),
    },
  };
}

describe("lector — lo que sí acepta", () => {
  it("la corrida simulada versionada se lee entera, en el orden de casos_ejecutados", async () => {
    const e = await leerEntrada(entradaSimulada());
    expect(e.corrida.trazas.map((t) => t.caso_id)).toEqual([
      "AH-001",
      "AH-002",
      "AH-003",
    ]);
    expect(e.plan.version).toBe("1.2.0");
    expect(e.casos.size).toBe(3);
    expect(e.base).toBeNull();
    expect(e.repeticiones).toEqual([]);
  });
  it("la corrida real con su línea base", async () => {
    const e = await leerEntrada(entradaReal());
    expect(e.base?.manifiesto.variante).toBe("agente_unico");
  });
  it("leerCorridaVerificada acepta una corrida de cualquier variante", async () => {
    const r = entradaReal();
    const c = await leerCorridaVerificada(
      archivosDeCorrida(REAL_BASE),
      r.plan,
      r.casos,
    );
    expect(c.manifiesto.variante).toBe("agente_unico");
  });
});

describe("lector — huellas (RF-06.1)", () => {
  it("un byte cambiado en una traza sin re-sellar → HUELLA_NO_COINCIDE nombrando el archivo", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    ((c.trazas["trazas/AH-001.json"] as O)["salida_final"] as O)["es"] =
      "otra cosa";
    const ms = await motivos({ ...e, corrida: c });
    expect(ms).toContainEqual(
      expect.objectContaining({
        codigo: "HUELLA_NO_COINCIDE",
        archivo: "runs/demo-a/simulado-3casos/trazas/AH-001.json",
      }),
    );
  });
  it("una traza re-sellada que no es la que declara el manifiesto también se rechaza", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    (c.trazas as Record<string, unknown>)["trazas/AH-002.json"] = await sellar({
      ...(c.trazas["trazas/AH-002.json"] as O),
      aclaraciones: [{ ciclo: 9 }],
    });
    expect(codigos(await motivos({ ...e, corrida: c }))).toContain(
      "HUELLA_NO_COINCIDE",
    );
  });
  it("manifiesto, grafo y ramas alterados", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    (c.corrida as O)["modelo"] = "otro";
    (c.grafo as O)["demo_id"] = "demo-z";
    (c.ramas as O)["fuente"] = "otra";
    const ms = await motivos({ ...e, corrida: c });
    expect(
      ms
        .filter((m) => m.codigo === "HUELLA_NO_COINCIDE")
        .map((m) => m.archivo.split("/").pop()),
    ).toEqual(
      expect.arrayContaining([
        "corrida.json",
        "grafo.json",
        "ramas-esperadas.json",
      ]),
    );
  });
  it("plan en borrador o alterado, y lote alterado", async () => {
    const e = entradaSimulada();
    const plan = copia(e.plan) as O;
    plan["version"] = "9.9.9";
    const casos = copia(e.casos) as O;
    casos["semilla"] = "otra";
    expect(codigos(await motivos({ ...e, plan, casos }))).toEqual(
      expect.arrayContaining(["PLAN_INVALIDO", "HUELLA_NO_COINCIDE"]),
    );
    const borrador = { ...(copia(e.plan) as O), estado_aprobacion: "borrador" };
    expect(codigos(await motivos({ ...e, plan: borrador }))).toContain(
      "PLAN_INVALIDO",
    );
  });
});

describe("lector — esquema y referencias", () => {
  it("una clave desconocida en la traza rompe el esquema (strict)", async () => {
    const e = await conTrazaMutada(
      entradaSimulada(),
      "trazas/AH-001.json",
      (t) => {
        t["clave_nueva"] = 1;
      },
    );
    expect(codigos(await motivos(e))).toContain("ESQUEMA");
  });
  it("manifiesto, grafo, ramas y lote fuera de esquema", async () => {
    const e = entradaSimulada();
    const ms = await motivos({
      ...e,
      casos: { formato: "otro" },
      corrida: { ...e.corrida, corrida: {}, grafo: {}, ramas: [] },
    });
    expect(
      ms.filter((m) => m.codigo === "ESQUEMA").length,
    ).toBeGreaterThanOrEqual(4);
  });
  it("traza declarada que no existe", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    delete (c.trazas as Record<string, unknown>)["trazas/AH-003.json"];
    expect(await motivos({ ...e, corrida: c })).toContainEqual(
      expect.objectContaining({
        codigo: "REFERENCIA_ROTA",
        archivo: "runs/demo-a/simulado-3casos/trazas/AH-003.json",
      }),
    );
  });
  it("versión de grafo, ramas y casos ejecutados que no cuadran con el manifiesto", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    const m = c.corrida as O;
    m["version_grafo"] = "0".repeat(64);
    (m["ramas_esperadas"] as O)["huella"] = "1".repeat(64);
    m["casos_ejecutados"] = ["AH-001", "AH-002"];
    const ms = await motivos({
      ...e,
      corrida: { ...c, corrida: await sellar(m) },
    });
    expect(
      ms.filter((x) => x.codigo === "REFERENCIA_ROTA").length,
    ).toBeGreaterThanOrEqual(3);
  });
  it("traza cuyo caso, variante o resultado no coinciden con el manifiesto", async () => {
    const e = await conTrazaMutada(
      entradaSimulada(),
      "trazas/AH-001.json",
      (t) => {
        t["variante"] = "agente_unico";
      },
    );
    expect(codigos(await motivos(e))).toContain("REFERENCIA_ROTA");
  });
  it("el grafo de otra variante", async () => {
    const e = entradaSimulada();
    const c = copia(e.corrida);
    const g = await sellar({ ...(c.grafo as O), variante: "agente_unico" });
    const m = await sellar({ ...(c.corrida as O), version_grafo: g.huella });
    expect(
      await motivos({ ...e, corrida: { ...c, grafo: g, corrida: m } }),
    ).toContainEqual(
      expect.objectContaining({
        codigo: "REFERENCIA_ROTA",
        detalle: expect.objectContaining({
          es: "el grafo es de otra variante",
        }),
      }),
    );
  });
});

describe("lector — trazas mal formadas", () => {
  it.each([
    [
      "nodos_visitados ≠ pasos",
      (t: O) => {
        t["nodos_visitados"] = [
          ...(t["nodos_visitados"] as string[]),
        ].reverse();
      },
    ],
    [
      "señal nodos_visitados ≠ pasos",
      (t: O) => {
        (t["senales"] as O)["nodos_visitados"] = ["enrutador"];
      },
    ],
    [
      "pasos no numerados 1..n",
      (t: O) => {
        ((t["pasos"] as O[])[0] as O)["orden"] = 7;
      },
    ],
    [
      "decisión en un paso que no es su nodo",
      (t: O) => {
        ((t["decisiones_de_arista"] as O[])[0] as O)["paso"] = 3;
      },
    ],
  ])("%s", async (_n, f) => {
    const e = await conTrazaMutada(entradaSimulada(), "trazas/AH-001.json", f);
    expect(await motivos(e)).toContainEqual(
      expect.objectContaining({
        codigo: "TRAZA_MALFORMADA",
        archivo: "runs/demo-a/simulado-3casos/trazas/AH-001.json",
      }),
    );
  });
});

describe("lector — corridas incompatibles", () => {
  it("repetición que es la misma corrida, línea base de la variante equivocada, caso fuera del lote", async () => {
    const e = entradaSimulada();
    const ms = await motivos({
      ...e,
      repeticiones: [e.corrida],
      base: e.corrida,
    });
    expect(ms.filter((m) => m.codigo === "CORRIDA_INCOMPATIBLE").length).toBe(
      2,
    );
    const real = entradaReal();
    expect(codigos(await motivos({ ...real, casos: e.casos }))).toEqual(
      expect.arrayContaining(["HUELLA_NO_COINCIDE", "REFERENCIA_ROTA"]),
    );
  });
  it("pass^k exige corridas distintas, del mismo grafo y sobre los mismos casos (M-3)", async () => {
    const e = entradaSimulada();
    const rep = async (f: (m: O) => void) => {
      const c = copia(e.corrida);
      const m = { ...(c.corrida as O), corrida_id: "simulado-3casos-r2" };
      f(m);
      return { ...c, ruta: "runs/demo-a/r2", corrida: await sellar(m) };
    };
    const buena = await rep(() => {});
    const detalles = async (reps: EntradaVerificador["corrida"][]) =>
      (await motivos({ ...e, repeticiones: reps }))
        .filter((m) => m.codigo === "CORRIDA_INCOMPATIBLE")
        .map((m) => m.detalle.es);
    expect(await detalles([buena, buena])).toEqual([
      "una repetición no puede ser la misma corrida ni repetirse",
    ]);
    const otroGrafo = await rep((m) => {
      m["version_grafo"] = "0".repeat(64);
    });
    expect(await detalles([otroGrafo])).toContain(
      "la repetición corrió otra versión del grafo",
    );
  });
  it("otro plan de beneficios, otro demo, otros umbrales en las ramas o errores mal declarados (M-2)", async () => {
    const e = entradaSimulada();
    const conManifiesto = async (f: (m: O) => void) => {
      const c = copia(e.corrida);
      const m = c.corrida as O;
      f(m);
      return motivos({ ...e, corrida: { ...c, corrida: await sellar(m) } });
    };
    const es = (ms: MotivoLectura[]) => ms.map((m) => m.detalle.es);
    expect(
      es(
        await conManifiesto((m) => {
          (m["plan_beneficios"] as O)["huella"] = "2".repeat(64);
        }),
      ),
    ).toContain(
      "la corrida usó otro plan de beneficios que el del lote de casos",
    );
    expect(
      es(
        await conManifiesto((m) => {
          m["demo_id"] = "demo-b";
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "el grafo es de otro demo",
        "la corrida es de otro demo que el lote de casos",
      ]),
    );
    expect(
      es(
        await conManifiesto((m) => {
          (m["plan"] as O)["version"] = "9.9.9";
        }),
      ),
    ).toContain("el manifiesto nombra otro plan (id o versión)");
    expect(
      es(
        await conManifiesto((m) => {
          (m["umbrales_aplicados"] as O)["U1"] = 0.8;
        }),
      ),
    ).toContain(
      "las ramas esperadas se calcularon con otros umbrales que los del manifiesto",
    );
    expect(
      es(
        await conManifiesto((m) => {
          m["casos_con_error"] = ["AH-001"];
        }),
      ),
    ).toContain(
      "los casos con error del manifiesto no son las trazas que terminaron en error",
    );
  });
  it("leerCorridaVerificada también rechaza", async () => {
    const e = entradaSimulada();
    await expect(
      leerCorridaVerificada(
        e.corrida,
        { ...(e.plan as O), version: "0.0.1" },
        e.casos,
      ),
    ).rejects.toBeInstanceOf(ErrorDeLectura);
    await expect(
      leerCorridaVerificada(e.corrida, e.plan, { formato: "x" }),
    ).rejects.toBeInstanceOf(ErrorDeLectura);
  });
});

describe("lector — lote generado con otro plan", () => {
  it("la corrida simulada (plan v1.2) usa el lote de la v1.1: se acepta porque da la misma verdad", async () => {
    const e = entradaSimulada();
    expect((e.casos as O)["plan"]).toMatchObject({ version: "1.1.0" });
    expect((e.plan as O)["version"]).toBe("1.2.0");
    await expect(leerEntrada(e)).resolves.toBeDefined();
  });
  it("sin el plan del lote, con otro plan en su lugar, o con otra verdad → rechazo", async () => {
    const e = entradaSimulada();
    expect(
      (await motivos({ ...e, planDelLote: undefined }))[0]?.detalle.es,
    ).toMatch(/no se entregó ese plan/);
    expect((await motivos({ ...e, planDelLote: e.plan }))[0]).toMatchObject({
      codigo: "HUELLA_NO_COINCIDE",
      archivo: "casos",
    });
    const plan = copia(e.plan) as O;
    (plan["umbrales"] as O[])[1]!["valor_en_plan"] = 900;
    const ms = await motivos({ ...e, plan: await sellar(plan) });
    expect(ms.map((m) => m.detalle.es).join()).toMatch(
      /otros umbrales u otro contrato de grafo/,
    );
    await expect(
      leerCorridaVerificada(e.corrida, e.plan, e.casos),
    ).rejects.toBeInstanceOf(ErrorDeLectura);
  });
});
