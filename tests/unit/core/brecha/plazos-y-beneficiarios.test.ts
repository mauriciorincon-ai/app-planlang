/**
 * El verificador 1.5.0 mide dos cosas nuevas (S9, ADR-019): C11, si cada autorización del demo A se decidió dentro de su
 * plazo en el reloj simulado del lote (la cola de `core/plazos/` sobre las trazas que ya existen), y C7, si el demo B
 * identificó a los beneficiarios finales de cada persona jurídica. Aquí se prueban sobre las corridas publicadas.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluarCriterios } from "../../../../core/brecha/criterios";
import { ErrorDeLectura } from "../../../../core/brecha/lector";
import { generarInforme } from "../../../../core/brecha/informe";
import { medirPlazos } from "../../../../core/brecha/plazos";
import { renderizarInforme } from "../../../../core/brecha/render-md";
import { conHuella } from "../../../../core/formatos/huella";
import type { JsonValor } from "../../../../core/formatos/jcs";
import type { Plan } from "../../../../core/plan";
import { entradaDesdeDisco } from "../../../../scripts/_corridas";
import { copia } from "../../../helpers/corridas";
import { vista } from "../../../helpers/vistas";

const A = "runs/demo-a/suscripcion-planlang-a-002-200-v1.5";
const B = "runs/demo-b/suscripcion-planlang-b-002-20";
const CAPA = "data/casos/demo-a/planlang-a-002-200.llegadas.json";
const leer = <T>(ruta: string): T =>
  JSON.parse(readFileSync(ruta, "utf8")) as T;

const entradaA = () => entradaDesdeDisco(A, { plan: "plans/demo-a/v1.6.json" });

describe("C7 del demo B: los beneficiarios finales de las personas jurídicas", () => {
  it("mide solo las 8 personas jurídicas: las 12 naturales quedan fuera de la población, no «no evaluables»", async () => {
    const i = await generarInforme(entradaDesdeDisco(B));
    const c7 = i.criterios.find((c) => c.id === "C7")!;
    expect(c7).toMatchObject({
      estado: "cumple",
      n_poblacion: 8,
      valor_medido: 1,
      casos_que_incumplen: [],
      no_evaluables: [],
    });
    expect(i.plazos).toBeNull();
    expect(i.ficha_reproducibilidad.llegadas).toBeNull();
  });

  it("una sociedad cuyos beneficiarios no coinciden con la verdad conocida baja la tasa y se nombra; la persona natural no entra", () => {
    const planB = JSON.parse(
      readFileSync("plans/demo-b/v1.2.json", "utf8"),
    ) as Plan;
    const c7 = planB.criterios_aceptacion.filter((c) => c.id === "C7");
    const juridica = (id: string, leidos: string[] | null) =>
      vista(id, {
        beneficiarios: leidos,
        verdad_conocida: {
          tipo_solicitante: "juridica",
          beneficiarios: ["SYN-ID-1", "SYN-ID-2"],
        },
      });
    const [r] = evaluarCriterios({ ...planB, criterios_aceptacion: c7 }, [
      juridica("B-1", ["SYN-ID-1", "SYN-ID-2"]),
      juridica("B-2", ["SYN-ID-1"]),
      juridica("B-3", null),
      vista("B-4", {
        beneficiarios: null,
        verdad_conocida: { tipo_solicitante: "natural" },
      }),
    ]);
    expect(r).toMatchObject({
      estado: "incumple",
      n_poblacion: 3,
      casos_que_incumplen: ["B-2", "B-3"],
    });
    expect(r!.valor_medido).toBeCloseTo(1 / 3, 4);
  });

  it("un caso del demo B sin `tipo_solicitante` en su verdad conocida cuenta como persona natural (los lotes del S3 no cambian)", async () => {
    const i = await generarInforme(
      entradaDesdeDisco("runs/demo-b/suscripcion-planlang-b-001-20"),
    );
    // El plan de esa corrida (v1.1) no tiene C7; lo que importa es que leer el lote viejo sigue funcionando.
    expect(i.criterios.some((c) => c.id === "C7")).toBe(false);
    expect(i.veredicto.valor).toBeDefined();
  });
});

describe("C11 del demo A: el plazo legal sobre el reloj simulado", () => {
  it("con la capa de llegadas mide a las 177 solicitudes hospitalarias y ambulatorias; la urgencia queda fuera", async () => {
    const i = await generarInforme(entradaA());
    const c11 = i.criterios.find((c) => c.id === "C11")!;
    expect(c11).toMatchObject({
      estado: "cumple",
      n_poblacion: 177,
      valor_medido: true,
      casos_que_incumplen: [],
    });
    const z = i.plazos!;
    expect(z.capacidad.valor).toBe(30);
    expect(z.clases.map((c) => [c.valor, c.n, c.en_cola, c.tardias])).toEqual([
      ["hospitalaria", 54, 30, 0],
      ["ambulatoria", 123, 40, 0],
    ]);
    expect(z.sin_plazo).toEqual([{ clase: "urgencia", n: 23 }]);
    expect(z.pausas).toBe(70);
    expect(z.carga_por_dia).toBe(14);
    expect(z.horas_de_auditor).toBe(14);
    expect(z.tardias).toEqual([]);
    expect(i.ficha_reproducibilidad.llegadas).toMatchObject({
      archivo: CAPA,
      lote_huella: leer<{ huella: string }>(
        "data/casos/demo-a/planlang-a-002-200.json",
      ).huella,
    });
  });

  it("sin la capa de llegadas, C11 no se mide y lo dice: «falta la señal en_plazo», no un cumplimiento", async () => {
    const { llegadas: _l, archivoLlegadas: _a, ...sinCapa } = entradaA();
    void _l;
    void _a;
    const i = await generarInforme(sinCapa);
    expect(i.plazos).toBeNull();
    const c11 = i.criterios.find((c) => c.id === "C11")!;
    expect(c11.estado).not.toBe("cumple");
    expect(c11.estado).not.toBe("incumple");
    expect(JSON.stringify(c11.no_evaluables)).toContain("en_plazo");
  });

  it("una capa de otro lote, con la huella rota o fuera de la jornada se rechaza con todos los motivos", async () => {
    const e = entradaA();
    const capa = copia(e.llegadas) as {
      lote: { huella: string };
      llegadas: { dia: number }[];
      dias_habiles: number;
    };
    // Otra huella de lote: la capa se sella de nuevo (la huella propia es válida) pero no es de este lote.
    capa.lote.huella = "0".repeat(64);
    const deOtroLote = await conHuella(
      capa as unknown as Record<string, JsonValor>,
    );
    const motivos = (r: unknown) => (r as ErrorDeLectura).motivos;
    const a = await generarInforme({ ...e, llegadas: deOtroLote }).catch(
      (x: unknown) => x,
    );
    expect(motivos(a).map((m) => m.codigo)).toContain("REFERENCIA_ROTA");
    // Sin re-sellar: la huella propia ya no coincide.
    const rota = {
      ...(copia(e.llegadas) as Record<string, unknown>),
      dias_habiles: 4,
    };
    const b = await generarInforme({ ...e, llegadas: rota }).catch(
      (x: unknown) => x,
    );
    expect(motivos(b).map((m) => m.codigo)).toContain("HUELLA_NO_COINCIDE");
  });

  it("una capa entregada a un plan sin `simulacion_de_plazos` se rechaza: no tiene con qué leerse", async () => {
    const e = entradaDesdeDisco(A);
    const v16 = entradaA();
    const r = await generarInforme({ ...e, llegadas: v16.llegadas }).catch(
      (x: unknown) => x,
    );
    expect((r as ErrorDeLectura).motivos.map((m) => m.codigo)).toContain(
      "PLAN_INVALIDO",
    );
  });

  it("el informe en Markdown trae la sección de plazos en los dos idiomas, con la fuente y los supuestos", async () => {
    const i = await generarInforme(entradaA());
    const es = renderizarInforme(i, "es");
    const en = renderizarInforme(i, "en");
    expect(es).toContain("### Plazos: el reloj simulado");
    expect(en).toContain("### Deadlines: the simulated clock");
    expect(es).toContain("| Hospitalaria | 72 horas | 54 | 30 | 0 |");
    expect(en).toContain("| Inpatient | 72 hours | 54 | 30 | 0 |");
    expect(en).toContain("the “emergency” class have no deadline");
    expect(en).not.toContain("urgencia");
    expect(es).toContain("CMS-0057-F");
    expect(es).toContain("Consultada el 2026-11-03");
    expect(en).toContain("Read on 2026-11-03");
  });
});

describe("la cola sobre las trazas, a otra capacidad", () => {
  it("el plazo se rompe por debajo del rango jugable: con 7 casos por día salen 14 ambulatorias, con 8 ninguna", async () => {
    const e = entradaA();
    const sim = (e.plan as Plan).simulacion_de_plazos!;
    const trazas = Object.entries(e.corrida.trazas as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, t]) => t) as Parameters<typeof medirPlazos>[2];
    const tardias = (c: number) =>
      medirPlazos(sim, e.llegadas as never, trazas, c).resultados.filter(
        (r) => r.en_plazo === false,
      );
    expect(tardias(60)).toHaveLength(0);
    expect(tardias(10)).toHaveLength(0);
    expect(tardias(8)).toHaveLength(0);
    const siete = tardias(7);
    expect(siete).toHaveLength(14);
    expect(new Set(siete.map((r) => r.clase))).toEqual(
      new Set(["ambulatoria"]),
    );
    // Con estos datos, más capacidad no suma solicitudes tardías (no es una ley de la cola: ver cola.test.ts).
    const cuentas = [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 30, 60].map(
      (c) => tardias(c).length,
    );
    expect([...cuentas].sort((a, b) => b - a)).toEqual(cuentas);
  });

  it("el informe dice dónde se rompe aunque quede fuera del rango que el plan deja mover", async () => {
    const i = await generarInforme(entradaA());
    expect(i.plazos!.capacidad_minima).toEqual({
      valor: 8,
      tardias_con_una_menos: 14,
    });
    expect(i.plazos!.capacidad.rango).toEqual({ min: 10, max: 60, paso: 5 });
    const es = renderizarInforme(i, "es");
    expect(es).toContain(
      "Con 8 casos por día, o más, todas se deciden en plazo; con 7, 14 salen de su plazo. El rango que el plan deja mover en el playground es 10–60.",
    );
    expect(renderizarInforme(i, "en")).toContain(
      "At 8 cases per day or more, every request is decided within its deadline; at 7, 14 go past their deadline.",
    );
  });
});
