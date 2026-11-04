/**
 * La cola de un auditor (S9, ADR-019). Lo que el agente decide solo se decide al llegar; lo que pausa espera su turno:
 * el auditor atiende por prioridad de clase y, dentro de ella, por orden de llegada (desempate por id), de uno en uno y
 * sin interrumpir al que atiende. Trabaja de lunes a viernes dentro de la jornada, a `capacidad` solicitudes por día
 * hábil: cada una le toma `jornada / capacidad` minutos.
 *
 * Aritmética entera. El tiempo del auditor se cuenta en unidades de 1/capacidad de minuto: así la jornada mide
 * `jornada_min × capacidad` unidades, cada solicitud toma `jornada_min` unidades y nada se redondea hasta el final, cuando
 * la decisión se pasa a minutos de calendario hacia arriba (la decisión nunca llega antes de lo que tardó). Sin `Math.pow`,
 * `Intl` ni `Date`: los mismos bytes en Node y en los tres motores del navegador.
 */
import type { SimulacionDePlazos } from "../plan/esquema";
import {
  DIAS_HABILES_POR_SEMANA,
  DIAS_POR_SEMANA,
  MINUTOS_POR_DIA,
  type ClaseDeCola,
  type ConfigDeCola,
  type ResultadoDeCaso,
  type ResumenDeClase,
  type SolicitudDeCola,
} from "./tipos";

const aMinutos = (hora: string): number =>
  Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

/** El bloque del plan, en minutos: la jornada y el plazo de cada clase (horas o días de calendario). */
export function configDeCola(sim: SimulacionDePlazos): ConfigDeCola {
  const inicio = aMinutos(sim.jornada.inicio);
  return {
    inicio_min: inicio,
    jornada_min: aMinutos(sim.jornada.fin) - inicio,
    clases: sim.clases.map((c) => ({
      valor: c.valor,
      prioridad: c.prioridad,
      plazo_min:
        c.plazo.unidad === "horas"
          ? c.plazo.cantidad * 60
          : c.plazo.cantidad * MINUTOS_POR_DIA,
    })),
  };
}

/** Los minutos de calendario de un día hábil (0 = lunes de la primera semana) y un minuto dentro de la jornada. */
function minutoDeCalendario(
  diaHabil: number,
  minutoDeJornada: number,
  inicio: number,
): number {
  const semana = Math.floor(diaHabil / DIAS_HABILES_POR_SEMANA);
  const dia = semana * DIAS_POR_SEMANA + (diaHabil % DIAS_HABILES_POR_SEMANA);
  return dia * MINUTOS_POR_DIA + inicio + minutoDeJornada;
}

const antes = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

interface Pendiente {
  indice: number;
  caso_id: string;
  /** Cuándo llega, en unidades de auditor desde la apertura del primer día. */
  llega: number;
  clase: ClaseDeCola;
}

/**
 * Simula el lote con `capacidad` solicitudes por día hábil y devuelve, por solicitud y en el orden de entrada, cuándo
 * llegó, cuándo se decidió y si fue dentro del plazo de su clase.
 *
 * Una solicitud sin clase, o de una clase que el plan no declara (la urgencia no espera), se decide al llegar y no tiene
 * plazo: `en_plazo` es `null`.
 */
export function simularCola(
  config: ConfigDeCola,
  solicitudes: readonly SolicitudDeCola[],
  capacidad: number,
): ResultadoDeCaso[] {
  if (!Number.isInteger(capacidad) || capacidad < 1)
    throw new RangeError(`capacidad ${capacidad}: debe ser un entero ≥ 1`);
  const { inicio_min: inicio, jornada_min: jornada } = config;
  if (!Number.isInteger(jornada) || jornada < 1)
    throw new RangeError(`jornada de ${jornada} minutos: debe ser ≥ 1`);
  const clases = new Map(config.clases.map((c) => [c.valor, c]));
  const unidadesPorDia = jornada * capacidad;
  const vistos = new Set<string>();
  const resultados: ResultadoDeCaso[] = [];
  const pendientes: Pendiente[] = [];

  solicitudes.forEach((s, indice) => {
    if (vistos.has(s.caso_id))
      throw new RangeError(`el caso ${s.caso_id} está dos veces`);
    vistos.add(s.caso_id);
    const { dia, minuto } = s.llegada;
    if (!Number.isInteger(dia) || dia < 0 || dia >= DIAS_HABILES_POR_SEMANA)
      throw new RangeError(`${s.caso_id}: día ${dia} fuera de 0–4`);
    if (!Number.isInteger(minuto) || minuto < 0 || minuto >= jornada)
      throw new RangeError(
        `${s.caso_id}: minuto ${minuto} fuera de la jornada (0–${jornada - 1})`,
      );
    const llegada = minutoDeCalendario(dia, minuto, inicio);
    const clase = s.clase === null ? undefined : clases.get(s.clase);
    resultados.push({
      caso_id: s.caso_id,
      clase: s.clase,
      pausa: s.pausa,
      llegada_min: llegada,
      decision_min: llegada,
      espera_min: 0,
      plazo_min: clase?.plazo_min ?? null,
      en_plazo: clase ? true : null,
    });
    if (s.pausa && clase)
      pendientes.push({
        indice,
        caso_id: s.caso_id,
        llega: dia * unidadesPorDia + minuto * capacidad,
        clase,
      });
  });

  pendientes.sort((a, b) => a.llega - b.llega || antes(a.caso_id, b.caso_id));
  const porPrioridad = new Map<number, Pendiente[]>();
  const prioridades = [...new Set(config.clases.map((c) => c.prioridad))].sort(
    (a, b) => a - b,
  );
  for (const p of prioridades) porPrioridad.set(p, []);
  const cabeza = new Map(prioridades.map((p) => [p, 0]));

  let siguiente = 0;
  let enEspera = 0;
  let libre = 0;
  let atendidos = 0;
  while (atendidos < pendientes.length) {
    if (enEspera === 0 && siguiente < pendientes.length)
      libre = Math.max(libre, pendientes[siguiente]!.llega);
    while (
      siguiente < pendientes.length &&
      pendientes[siguiente]!.llega <= libre
    ) {
      const p = pendientes[siguiente]!;
      porPrioridad.get(p.clase.prioridad)!.push(p);
      enEspera++;
      siguiente++;
    }
    const prioridad = prioridades.find(
      (p) => cabeza.get(p)! < porPrioridad.get(p)!.length,
    )!;
    const cola = porPrioridad.get(prioridad)!;
    const elegido = cola[cabeza.get(prioridad)!]!;
    cabeza.set(prioridad, cabeza.get(prioridad)! + 1);
    enEspera--;
    libre += jornada;
    atendidos++;
    // La decisión llega al final del turno: se ubica en su día hábil y se redondea el minuto hacia arriba.
    const diaHabil = Math.floor((libre - 1) / unidadesPorDia);
    const enLaJornada = libre - diaHabil * unidadesPorDia;
    const minutos = Math.floor((enLaJornada + capacidad - 1) / capacidad);
    const r = resultados[elegido.indice]!;
    r.decision_min = minutoDeCalendario(diaHabil, minutos, inicio);
    r.espera_min = r.decision_min - r.llegada_min;
    r.en_plazo = r.espera_min <= elegido.clase.plazo_min;
  }
  return resultados;
}

/** La mediana por rango más cercano: el valor en la posición ⌈n/2⌉ del orden ascendente. Entera, sin promediar. */
function medianaEntera(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const orden = [...xs].sort((a, b) => a - b);
  return orden[Math.ceil(orden.length / 2) - 1]!;
}

/**
 * Por clase del plan, en su orden: cuántas solicitudes hubo, cuántas esperaron, cuántas salieron de plazo, la espera
 * mediana de las que esperaron y la mayor espera.
 */
export function resumirPorClase(
  config: ConfigDeCola,
  resultados: readonly ResultadoDeCaso[],
): ResumenDeClase[] {
  return config.clases.map((c) => {
    const delaClase = resultados.filter((r) => r.clase === c.valor);
    return {
      clase: c.valor,
      n: delaClase.length,
      en_cola: delaClase.filter((r) => r.pausa).length,
      tardias: delaClase.filter((r) => r.en_plazo === false).length,
      espera_mediana_min: medianaEntera(
        delaClase.filter((r) => r.pausa).map((r) => r.espera_min),
      ),
      espera_max_min: delaClase.reduce((m, r) => Math.max(m, r.espera_min), 0),
    };
  });
}

const tardiasDe = (rs: readonly ResultadoDeCaso[]): number =>
  rs.filter((r) => r.en_plazo === false).length;

/** Dónde se rompe el plazo: la menor capacidad con la que nadie sale de su plazo y cuántos salen con una menos. */
export interface CapacidadMinima {
  valor: number;
  /** Cuántas salen de su plazo con `valor - 1`; `null` si `valor` es 1 (no hay una menos). */
  tardias_con_una_menos: number | null;
}

/**
 * La menor capacidad entera, de 1 hasta `tope`, con la que ninguna solicitud sale de su plazo; `null` si ni `tope` lo
 * logra. Más capacidad nunca deja a nadie más tarde (propiedad de la cola, probada), así que la primera que cumple es la
 * mínima.
 */
export function capacidadMinima(
  config: ConfigDeCola,
  solicitudes: readonly SolicitudDeCola[],
  tope: number,
): CapacidadMinima | null {
  if (tardiasDe(simularCola(config, solicitudes, tope)) > 0) return null;
  let c = 1;
  while (c < tope && tardiasDe(simularCola(config, solicitudes, c)) > 0) c++;
  return {
    valor: c,
    tardias_con_una_menos:
      c > 1 ? tardiasDe(simularCola(config, solicitudes, c - 1)) : null,
  };
}
