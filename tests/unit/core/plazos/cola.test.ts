/**
 * La cola del auditor (S9, ADR-019), con valores calculados a mano. La jornada es de 08:00 a 17:00 (540 minutos) y la
 * capacidad de 30 por día: cada solicitud toma 18 minutos del auditor. Los plazos son los del plan A v1.6 (72 horas la
 * hospitalaria, 7 días calendario la ambulatoria), salvo donde el caso pide uno propio.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { crearAzar } from "../../../../core/sintetico/sfc32";
import {
  configDeCola,
  resumirPorClase,
  simularCola,
  type ConfigDeCola,
  type SolicitudDeCola,
} from "../../../../core/plazos";
import type { Plan } from "../../../../core/plan";

const v16 = JSON.parse(readFileSync("plans/demo-a/v1.6.json", "utf8")) as Plan;
const CONFIG = configDeCola(v16.simulacion_de_plazos!);

const sol = (
  caso_id: string,
  clase: string | null,
  dia: number,
  minuto: number,
  pausa = true,
): SolicitudDeCola => ({ caso_id, clase, llegada: { dia, minuto }, pausa });

const porId = (rs: ReturnType<typeof simularCola>) =>
  Object.fromEntries(rs.map((r) => [r.caso_id, r]));

describe("configDeCola", () => {
  it("pasa el bloque del plan a minutos: la jornada y el plazo de cada clase", () => {
    expect(CONFIG).toEqual({
      inicio_min: 480,
      jornada_min: 540,
      clases: [
        { valor: "hospitalaria", prioridad: 1, plazo_min: 4320 },
        { valor: "ambulatoria", prioridad: 2, plazo_min: 10080 },
      ],
    });
  });
});

describe("simularCola", () => {
  it("lo que no pausa se decide al llegar, dentro de plazo", () => {
    const [r] = simularCola(
      CONFIG,
      [sol("A", "ambulatoria", 2, 100, false)],
      30,
    );
    // Miércoles (día 2) a las 08:00 + 100 minutos = 2×1440 + 480 + 100.
    expect(r).toMatchObject({
      llegada_min: 3460,
      decision_min: 3460,
      espera_min: 0,
      plazo_min: 10080,
      en_plazo: true,
    });
  });

  it("lo que pausa y llega a un auditor libre espera solo su turno de 18 minutos", () => {
    const [r] = simularCola(CONFIG, [sol("A", "hospitalaria", 0, 0)], 30);
    expect(r).toMatchObject({
      llegada_min: 480,
      decision_min: 498,
      espera_min: 18,
      en_plazo: true,
    });
  });

  it("dos que llegan juntas se atienden por id", () => {
    const rs = porId(
      simularCola(
        CONFIG,
        [sol("B", "ambulatoria", 0, 0), sol("A", "ambulatoria", 0, 0)],
        30,
      ),
    );
    expect(rs.A!.decision_min).toBe(498);
    expect(rs.B!.decision_min).toBe(516);
  });

  it("la hospitalaria pasa delante de la ambulatoria que ya espera, pero no interrumpe al que atiende", () => {
    const rs = porId(
      simularCola(
        CONFIG,
        [
          sol("AMB", "ambulatoria", 0, 0),
          sol("HOSP", "hospitalaria", 0, 5),
          sol("AMB2", "ambulatoria", 0, 6),
        ],
        30,
      ),
    );
    // AMB ya estaba en turno (0–18 min): termina a las 08:18. HOSP, que llegó a los 5 min, es la siguiente (36 min
    // en la jornada) aunque AMB2 llegó casi a la vez; AMB2 va al final (54 min).
    expect(rs.AMB!.decision_min).toBe(498);
    expect(rs.HOSP!.decision_min).toBe(516);
    expect(rs.HOSP!.espera_min).toBe(516 - 485);
    expect(rs.AMB2!.decision_min).toBe(534);
  });

  it("el auditor ocioso espera a la siguiente llegada y no acumula turnos", () => {
    const rs = porId(
      simularCola(
        CONFIG,
        [sol("A", "ambulatoria", 0, 0), sol("B", "ambulatoria", 0, 200)],
        30,
      ),
    );
    expect(rs.A!.decision_min).toBe(498);
    expect(rs.B!.decision_min).toBe(480 + 200 + 18);
  });

  it("una llegada el viernes casi al cierre termina el lunes: el fin de semana corre en el plazo", () => {
    // Viernes (día 4) a las 16:59: el turno de 18 minutos toma 1 minuto del viernes y 17 del lunes siguiente.
    const [r] = simularCola(CONFIG, [sol("A", "hospitalaria", 4, 539)], 30);
    expect(r!.llegada_min).toBe(4 * 1440 + 480 + 539);
    expect(r!.decision_min).toBe(7 * 1440 + 480 + 17);
    expect(r!.espera_min).toBe(3798);
    expect(r!.en_plazo).toBe(true);
  });

  it("el plazo se cumple justo en el límite y se pierde un minuto después", () => {
    const con = (plazo_min: number): ConfigDeCola => ({
      ...CONFIG,
      clases: [{ valor: "hospitalaria", prioridad: 1, plazo_min }],
    });
    const caso = [sol("A", "hospitalaria", 0, 0)];
    expect(simularCola(con(18), caso, 30)[0]!.en_plazo).toBe(true);
    expect(simularCola(con(17), caso, 30)[0]!.en_plazo).toBe(false);
  });

  it("la capacidad cambia la espera: 10 por día toma 54 minutos por solicitud, 60 por día toma 9", () => {
    const caso = [sol("A", "hospitalaria", 0, 0)];
    expect(simularCola(CONFIG, caso, 10)[0]!.espera_min).toBe(54);
    expect(simularCola(CONFIG, caso, 60)[0]!.espera_min).toBe(9);
  });

  it("con una capacidad que no divide la jornada, la decisión se redondea hacia arriba", () => {
    // 540 / 25 = 21,6 minutos: la decisión llega al minuto 22.
    const [r] = simularCola(CONFIG, [sol("A", "hospitalaria", 0, 0)], 25);
    expect(r!.espera_min).toBe(22);
  });

  it("la urgencia no espera: se decide al llegar y no tiene plazo, aunque pause", () => {
    const rs = porId(
      simularCola(
        CONFIG,
        [sol("U", "urgencia", 0, 0, true), sol("S", null, 0, 0, true)],
        30,
      ),
    );
    for (const id of ["U", "S"])
      expect(rs[id]).toMatchObject({
        espera_min: 0,
        plazo_min: null,
        en_plazo: null,
      });
  });

  it("un lote vacío da una cola vacía", () => {
    expect(simularCola(CONFIG, [], 30)).toEqual([]);
  });

  it("el resultado no depende del orden en que llegan las solicitudes a la función", () => {
    const azar = crearAzar("cola/orden");
    const lote = Array.from({ length: 60 }, (_, i) =>
      sol(
        `C-${String(i).padStart(3, "0")}`,
        azar.elegir(["hospitalaria", "ambulatoria", "urgencia"]),
        azar.entero(0, 4),
        azar.entero(0, 539),
        azar.probabilidad(0.5),
      ),
    );
    const a = porId(simularCola(CONFIG, lote, 20));
    const b = porId(simularCola(CONFIG, azar.barajar(lote), 20));
    expect(b).toEqual(a);
  });

  it("rechaza lo que no puede simular, con su motivo", () => {
    const caso = sol("A", "hospitalaria", 0, 0);
    expect(() => simularCola(CONFIG, [caso], 0)).toThrow(/capacidad/);
    expect(() => simularCola(CONFIG, [caso], 2.5)).toThrow(/capacidad/);
    expect(() =>
      simularCola(CONFIG, [sol("A", "hospitalaria", 5, 0)], 30),
    ).toThrow(/día 5/);
    expect(() =>
      simularCola(CONFIG, [sol("A", "hospitalaria", 0, 540)], 30),
    ).toThrow(/jornada/);
    expect(() => simularCola(CONFIG, [caso, caso], 30)).toThrow(/dos veces/);
    expect(() =>
      simularCola({ ...CONFIG, jornada_min: 0 }, [caso], 30),
    ).toThrow(/jornada/);
  });
});

describe("lo que más capacidad NO garantiza", () => {
  it("puede dejar a UNA solicitud más tarde (prioridad sin interrupción), aunque el fin del lote no se atrase", () => {
    // Con 10 por día cada solicitud toma 54 minutos; con 12, 45. A los 45 minutos la ambulatoria L2 ya espera y la
    // hospitalaria H todavía no llegó: con 12 el auditor empieza L2 y H espera detrás; con 10 sigue con L1 y, al
    // terminar, H ya está y pasa primero.
    const lote = [
      sol("L1", "ambulatoria", 0, 0),
      sol("L2", "ambulatoria", 0, 40),
      sol("H", "hospitalaria", 0, 50),
    ];
    const con = (c: number) => porId(simularCola(CONFIG, lote, c));
    expect(con(10)["H"]!.espera_min).toBe(58);
    expect(con(12)["H"]!.espera_min).toBe(85);
    const fin = (c: number) =>
      Math.max(...Object.values(con(c)).map((r) => r.decision_min));
    expect(fin(12)).toBeLessThanOrEqual(fin(10));
  });
});

describe("la cola con más capacidad", () => {
  const azar = crearAzar("cola/capacidad");
  const lote = Array.from({ length: 200 }, (_, i) =>
    sol(
      `C-${String(i).padStart(3, "0")}`,
      azar.elegir(["hospitalaria", "ambulatoria"]),
      azar.entero(0, 4),
      azar.entero(0, 539),
      azar.probabilidad(0.4),
    ),
  );
  const capacidades = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  it("termina el lote cada vez antes o a la vez (el auditor no se queda ocioso con trabajo esperando)", () => {
    const fin = capacidades.map((c) =>
      simularCola(CONFIG, lote, c).reduce(
        (m, r) => Math.max(m, r.decision_min),
        0,
      ),
    );
    for (let i = 1; i < fin.length; i++)
      expect(fin[i]!, `capacidad ${capacidades[i]}`).toBeLessThanOrEqual(
        fin[i - 1]!,
      );
  });

  it("a 10 por día hay solicitudes fuera de plazo con un plazo de un día, y a 60 por día ninguna", () => {
    const corto: ConfigDeCola = {
      ...CONFIG,
      clases: [
        { valor: "hospitalaria", prioridad: 1, plazo_min: 1440 },
        { valor: "ambulatoria", prioridad: 2, plazo_min: 1440 },
      ],
    };
    const tardias = (c: number) =>
      resumirPorClase(corto, simularCola(corto, lote, c)).reduce(
        (s, x) => s + x.tardias,
        0,
      );
    expect(tardias(10)).toBeGreaterThan(0);
    expect(tardias(60)).toBe(0);
  });

  it("resume por clase, en el orden del plan: cuántas hubo, cuántas esperaron, cuántas salieron de plazo y la mayor espera", () => {
    const rs = simularCola(
      CONFIG,
      [
        sol("A", "hospitalaria", 0, 0),
        sol("B", "hospitalaria", 0, 0, false),
        sol("C", "ambulatoria", 0, 0),
        sol("U", "urgencia", 0, 0),
      ],
      30,
    );
    expect(resumirPorClase(CONFIG, rs)).toEqual([
      {
        clase: "hospitalaria",
        n: 2,
        en_cola: 1,
        tardias: 0,
        espera_mediana_min: 18,
        espera_max_min: 18,
      },
      {
        clase: "ambulatoria",
        n: 1,
        en_cola: 1,
        tardias: 0,
        espera_mediana_min: 36,
        espera_max_min: 36,
      },
    ]);
  });

  it("la mediana es el rango más cercano de las que esperaron (entera, sin promediar) y 0 si ninguna esperó", () => {
    // Cinco ambulatorias que pausan, todas llegan a la apertura: esperan 18, 36, 54, 72 y 90 minutos → mediana 54.
    const cinco = ["a", "b", "c", "d", "e"].map((id) =>
      sol(id, "ambulatoria", 0, 0),
    );
    const [, amb] = resumirPorClase(CONFIG, simularCola(CONFIG, cinco, 30));
    expect(amb).toMatchObject({ espera_mediana_min: 54, espera_max_min: 90 });
    // Cuatro: 18, 36, 54, 72 → posición ⌈4/2⌉ = 2 → 36 (el menor de los dos del medio).
    const [, amb4] = resumirPorClase(
      CONFIG,
      simularCola(CONFIG, cinco.slice(0, 4), 30),
    );
    expect(amb4!.espera_mediana_min).toBe(36);
    const sinPausa = cinco.map((x) => ({ ...x, pausa: false }));
    const [, ninguna] = resumirPorClase(
      CONFIG,
      simularCola(CONFIG, sinPausa, 30),
    );
    expect(ninguna).toMatchObject({ en_cola: 0, espera_mediana_min: 0 });
  });
});
