/**
 * El reloj y la cola de un lote (S9, ADR-019). Núcleo determinista: sin reloj, sin azar fuera de `sfc32` y sin `Intl`.
 * No conoce ningún demo: las clases de solicitud, sus plazos y su prioridad llegan del bloque `simulacion_de_plazos` del
 * plan, y qué solicitudes esperan al auditor lo dice quien llama (el verificador sobre las trazas, el playground sobre
 * lo que cada umbral manda a una persona).
 *
 * El tiempo es de calendario, en minutos desde el lunes a las 00:00 de la semana simulada (0 = lunes 00:00). Las
 * llegadas caen en los primeros días hábiles de esa semana; el auditor trabaja de lunes a viernes dentro de la jornada
 * y, si la cola pasa del viernes, sigue el lunes de la semana siguiente.
 */

export const FORMATO_DE_LLEGADAS = "planlang-llegadas/v1";

/** Minutos de un día de calendario y días de una semana: el plazo corre también el fin de semana. */
export const MINUTOS_POR_DIA = 1440;
export const DIAS_POR_SEMANA = 7;
export const DIAS_HABILES_POR_SEMANA = 5;

/** Cuándo llega una solicitud: el día hábil (0 = lunes) y el minuto dentro de la jornada (0 = apertura). */
export interface Llegada {
  caso_id: string;
  dia: number;
  minuto: number;
}

/** La capa de llegadas de un lote: se publica aparte del lote, con su huella, y no toca los bytes de los casos. */
export interface CapaDeLlegadas {
  formato: typeof FORMATO_DE_LLEGADAS;
  lote: { id: string; huella: string; semilla: string };
  dias_habiles: number;
  minutos_de_jornada: number;
  llegadas: Llegada[];
  huella: string;
}

/** Una clase de solicitud tal como la cola la necesita: su prioridad (1 primero) y su plazo en minutos de calendario. */
export interface ClaseDeCola {
  valor: string;
  prioridad: number;
  plazo_min: number;
}

/** La jornada y las clases, ya en minutos. Sale del bloque del plan con `configDeCola`. */
export interface ConfigDeCola {
  /** Minuto del día en que abre la jornada (480 = 08:00). */
  inicio_min: number;
  /** Minutos que dura la jornada. */
  jornada_min: number;
  clases: readonly ClaseDeCola[];
}

/** Una solicitud para la cola: de qué clase es, cuándo llega y si necesita al auditor. */
export interface SolicitudDeCola {
  caso_id: string;
  /** El valor de la clase, o `null` si el caso no trae la señal de clase. */
  clase: string | null;
  llegada: Pick<Llegada, "dia" | "minuto">;
  /** `true` si el caso pausa para una persona; si no, se decide al llegar. */
  pausa: boolean;
}

/** Lo que pasó con una solicitud en el reloj simulado. Todos los tiempos, en minutos de calendario. */
export interface ResultadoDeCaso {
  caso_id: string;
  clase: string | null;
  pausa: boolean;
  llegada_min: number;
  decision_min: number;
  espera_min: number;
  /** El plazo de su clase; `null` si la clase no tiene plazo (la urgencia no espera). */
  plazo_min: number | null;
  /** `true` si se decidió dentro del plazo; `null` si la clase no tiene plazo. */
  en_plazo: boolean | null;
}

export interface ResumenDeClase {
  clase: string;
  /** Solicitudes de la clase. */
  n: number;
  /** Las que esperaron al auditor. */
  en_cola: number;
  /** Las que se decidieron fuera de plazo. */
  tardias: number;
  /** La espera mediana entre las que esperaron al auditor (rango más cercano; 0 si ninguna esperó). */
  espera_mediana_min: number;
  espera_max_min: number;
}
