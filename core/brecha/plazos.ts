/**
 * La medición de plazos del informe (S9, ADR-019): el reloj y la cola de `core/plazos/` corridos sobre las trazas que ya
 * existen. Nada se vuelve a ejecutar y ningún modelo interviene: cada caso trae su clase (la señal que nombra el plan),
 * si pausó para una persona (señal `pausa_humana`) y la llegada que le asignó la capa del lote. Con eso la cola dice
 * cuándo se decidió y si fue dentro del plazo de su clase.
 *
 * Es la pre-pasada de `generarInforme`: el resultado entra al contexto de cada caso como `en_plazo`, y de ahí C11 se mide
 * con el mismo motor de reglas que los demás criterios.
 */
import type { TextoBilingue } from "../formatos/bilingue";
import type { Traza } from "../formatos/traza";
import {
  capacidadMinima,
  configDeCola,
  resumirPorClase,
  simularCola,
  type CapacidadMinima,
} from "../plazos/cola";
import type {
  CapaDeLlegadas,
  ConfigDeCola,
  ResultadoDeCaso,
  SolicitudDeCola,
} from "../plazos/tipos";
import type { Plan, SimulacionDePlazos } from "../plan/esquema";
import type { EnPlazoPorCaso } from "./contexto";

export interface PlazosMedidos {
  config: ConfigDeCola;
  capacidad: number;
  resultados: ResultadoDeCaso[];
  enPlazo: EnPlazoPorCaso;
  /**
   * La menor capacidad entera con la que ninguna solicitud sale de su plazo, buscada de 1 hasta la medida; `null` si ni la
   * medida alcanza. Con una menos, cuántas salen: dónde se rompe el plazo, aunque quede fuera del rango jugable.
   */
  capacidadMinima: CapacidadMinima | null;
}

const tardiasDe = (rs: readonly ResultadoDeCaso[]): number =>
  rs.filter((r) => r.en_plazo === false).length;

/** La clase de una traza: el valor de la señal que el plan nombra, o `null` si no es un texto. */
function claseDe(t: Traza, senal: string): string | null {
  const v = t.senales[senal];
  return typeof v === "string" ? v : null;
}

/**
 * Corre la cola del plan sobre las trazas de la corrida, a la capacidad que el plan declara. `capacidad` permite
 * medir a otra (el playground lo hace con su propio estado; el informe usa la del plan).
 */
export function medirPlazos(
  sim: SimulacionDePlazos,
  capa: Pick<CapaDeLlegadas, "llegadas">,
  trazas: readonly Traza[],
  capacidad: number = sim.capacidad_del_auditor.valor,
): PlazosMedidos {
  const config = configDeCola(sim);
  const llegadas = new Map(capa.llegadas.map((l) => [l.caso_id, l]));
  const solicitudes: SolicitudDeCola[] = trazas.map((t) => {
    const l = llegadas.get(t.caso_id);
    if (!l)
      throw new RangeError(`el caso ${t.caso_id} no tiene llegada en la capa`);
    return {
      caso_id: t.caso_id,
      clase: claseDe(t, sim.senal_de_clase),
      llegada: { dia: l.dia, minuto: l.minuto },
      pausa: t.senales["pausa_humana"] === true,
    };
  });
  const resultados = simularCola(config, solicitudes, capacidad);
  const minima =
    tardiasDe(resultados) === 0
      ? capacidadMinima(config, solicitudes, capacidad)
      : null;
  return {
    config,
    capacidad,
    resultados,
    enPlazo: new Map(resultados.map((r) => [r.caso_id, r.en_plazo])),
    capacidadMinima: minima,
  };
}

/**
 * El costo humano por caso que el plan declara en sus umbrales: `null` si no declara ninguno (el playground no lo
 * inventa); si declara varios distintos, el playground no sabe a cuál atribuir y lo dice.
 */
export function minutosPorPersona(plan: Plan): number | null {
  const costos = [
    ...new Set(plan.umbrales.map((u) => u.costo_humano_por_caso_min)),
  ].filter((c): c is number => typeof c === "number");
  if (costos.length === 0) return null;
  if (costos.length > 1)
    throw new Error(
      `playground: el plan declara varios costos humanos por caso en sus umbrales (${costos.join(", ")}); el playground suma uno solo.`,
    );
  return costos[0] as number;
}

/**
 * `en_plazo` de cada caso de una corrida, o `undefined` si el plan no declara la simulación o el lote no trae llegadas
 * (entonces la regla de plazos queda «señal faltante», no cumplida). Lo usan el informe y la comparación, para que cada
 * lado —la corrida, sus repeticiones y la línea base— se mida con su propia cola.
 */
export function enPlazoDe(
  sim: SimulacionDePlazos | undefined,
  capa: Pick<CapaDeLlegadas, "llegadas"> | null,
  trazas: readonly Traza[],
): EnPlazoPorCaso | undefined {
  return sim && capa ? medirPlazos(sim, capa, trazas).enPlazo : undefined;
}

/** Una solicitud que se decidió fuera de plazo, con lo que le faltó. */
export interface SolicitudTardia {
  caso_id: string;
  clase: string;
  espera_min: number;
  plazo_min: number;
}

export interface ClaseMedida {
  valor: string;
  nombre: TextoBilingue;
  prioridad: number;
  plazo: { cantidad: number; unidad: "horas" | "dias_calendario" };
  /** Cómo se lee la clase frente a la norma (un supuesto de la simulación, rotulado). */
  equivale_a: TextoBilingue;
  n: number;
  en_cola: number;
  tardias: number;
  espera_mediana_min: number;
  espera_max_min: number;
}

/** La sección «Plazos» del informe: lo medido por clase, las tardías con su caso y lo que la simulación supone. */
export interface InformeDePlazos {
  senal_de_clase: string;
  capacidad: {
    valor: number;
    unidad: TextoBilingue;
    rango: { min: number; max: number; paso: number };
  };
  jornada: { inicio: string; fin: string };
  dias_habiles: number;
  clases: ClaseMedida[];
  /** Cuántas solicitudes (de cualquier clase) pasaron por el auditor. */
  pausas: number;
  /** Cuántas llegaron por día hábil, en promedio (un decimal). Frente a la capacidad dice qué tan holgado va el auditor. */
  carga_por_dia: number;
  /** Dónde se rompe el plazo: la menor capacidad que cumple y cuántas salen con una menos; `null` si ni la medida cumple. */
  capacidad_minima: {
    valor: number;
    tardias_con_una_menos: number | null;
  } | null;
  /** Las horas de auditor que eso cuesta con el costo humano por caso del plan; `null` si el plan no lo declara. */
  horas_de_auditor: number | null;
  tardias: SolicitudTardia[];
  /** Las clases del lote que el plan no declara (la urgencia no espera): se decidieron al llegar, sin plazo. */
  sin_plazo: { clase: string; n: number }[];
  supuestos: TextoBilingue[];
  fuente: { norma: TextoBilingue; consultada: string };
}

/** Escribe la sección del informe desde lo medido. `minutosPorPersona` sale de los umbrales del plan (o `null`). */
export function informeDePlazos(
  sim: SimulacionDePlazos,
  medidos: PlazosMedidos,
  minutosPorPersona: number | null,
): InformeDePlazos {
  const resumen = resumirPorClase(medidos.config, medidos.resultados);
  const declaradas = new Set(sim.clases.map((c) => c.valor));
  // Las que pasaron por el auditor: las que pausan y tienen un plazo que cumplir (la urgencia se decide al llegar).
  const pausas = resumen.reduce((n, r) => n + r.en_cola, 0);
  const sinPlazo = new Map<string, number>();
  for (const r of medidos.resultados) {
    const clave = r.clase ?? "";
    if (r.clase === null || !declaradas.has(r.clase))
      sinPlazo.set(clave, (sinPlazo.get(clave) ?? 0) + 1);
  }
  return {
    senal_de_clase: sim.senal_de_clase,
    capacidad: {
      valor: medidos.capacidad,
      unidad: sim.capacidad_del_auditor.unidad,
      rango: sim.capacidad_del_auditor.rango_jugable,
    },
    jornada: sim.jornada,
    dias_habiles: sim.dias_habiles,
    clases: sim.clases.map((c, i) => {
      const r = resumen[i]!;
      return {
        valor: c.valor,
        nombre: c.nombre,
        prioridad: c.prioridad,
        plazo: c.plazo,
        equivale_a: c.equivale_a,
        n: r.n,
        en_cola: r.en_cola,
        tardias: r.tardias,
        espera_mediana_min: r.espera_mediana_min,
        espera_max_min: r.espera_max_min,
      };
    }),
    pausas,
    carga_por_dia: Math.round((pausas / sim.dias_habiles) * 10) / 10,
    capacidad_minima: medidos.capacidadMinima,
    horas_de_auditor:
      minutosPorPersona === null
        ? null
        : Math.round(((pausas * minutosPorPersona) / 60) * 100) / 100,
    tardias: medidos.resultados
      .filter((r) => r.en_plazo === false)
      .map((r) => ({
        caso_id: r.caso_id,
        clase: r.clase as string,
        espera_min: r.espera_min,
        plazo_min: r.plazo_min as number,
      })),
    sin_plazo: [...sinPlazo.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([clase, n]) => ({ clase, n })),
    supuestos: sim.supuestos,
    fuente: sim.fuente,
  };
}
