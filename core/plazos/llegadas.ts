/**
 * Las llegadas simuladas de un lote: cada caso llega en un día hábil y un minuto de la jornada, sorteados con `sfc32`
 * desde la semilla del lote. La semilla de cada caso lleva su id, así que añadir o quitar casos no mueve las llegadas
 * de los demás. Mismos bytes en Node y en los tres motores del navegador.
 */
import { crearAzar } from "../sintetico/sfc32";
import {
  FORMATO_DE_LLEGADAS,
  type CapaDeLlegadas,
  type Llegada,
} from "./tipos";

export interface EntradaDeLlegadas {
  lote: { id: string; huella: string; semilla: string };
  /** Los ids de los casos del lote, en el orden del lote. */
  ids: readonly string[];
  dias_habiles: number;
  minutos_de_jornada: number;
}

/** La llegada de un caso: dos sorteos de su propia semilla, el día y luego el minuto. */
export function llegadaDe(
  semilla: string,
  id: string,
  diasHabiles: number,
  minutosDeJornada: number,
): Llegada {
  const azar = crearAzar(`${semilla}/llegada/${id}`);
  const dia = azar.entero(0, diasHabiles - 1);
  const minuto = azar.entero(0, minutosDeJornada - 1);
  return { caso_id: id, dia, minuto };
}

/** La capa sin su huella (la calcula quien la escribe: la huella es asíncrona y el núcleo de la cola, no). */
export function llegadasDelLote(
  e: EntradaDeLlegadas,
): Omit<CapaDeLlegadas, "huella"> {
  if (!Number.isInteger(e.dias_habiles) || e.dias_habiles < 1)
    throw new RangeError(`dias_habiles ${e.dias_habiles}: debe ser ≥ 1`);
  if (!Number.isInteger(e.minutos_de_jornada) || e.minutos_de_jornada < 1)
    throw new RangeError(
      `minutos_de_jornada ${e.minutos_de_jornada}: debe ser ≥ 1`,
    );
  return {
    formato: FORMATO_DE_LLEGADAS,
    lote: e.lote,
    dias_habiles: e.dias_habiles,
    minutos_de_jornada: e.minutos_de_jornada,
    llegadas: e.ids.map((id) =>
      llegadaDe(e.lote.semilla, id, e.dias_habiles, e.minutos_de_jornada),
    ),
  };
}

/**
 * Lo que una capa tiene que cumplir para servir a un lote: cada caso, una sola vez, con un día y un minuto dentro de la
 * jornada del plan. Devuelve los problemas (vacío si sirve).
 */
export function problemasDeLaCapa(
  capa: Omit<CapaDeLlegadas, "huella">,
  ids: readonly string[],
  diasHabiles: number,
  minutosDeJornada: number,
): string[] {
  const problemas: string[] = [];
  if (capa.dias_habiles !== diasHabiles)
    problemas.push(
      `la capa reparte las llegadas en ${capa.dias_habiles} días hábiles y el plan declara ${diasHabiles}`,
    );
  if (capa.minutos_de_jornada !== minutosDeJornada)
    problemas.push(
      `la capa usa una jornada de ${capa.minutos_de_jornada} minutos y el plan declara ${minutosDeJornada}`,
    );
  const vistos = new Set<string>();
  for (const l of capa.llegadas) {
    if (vistos.has(l.caso_id))
      problemas.push(`el caso ${l.caso_id} llega dos veces`);
    vistos.add(l.caso_id);
    if (!Number.isInteger(l.dia) || l.dia < 0 || l.dia >= diasHabiles)
      problemas.push(
        `el caso ${l.caso_id} llega el día ${l.dia}, fuera de 0–${diasHabiles - 1}`,
      );
    if (
      !Number.isInteger(l.minuto) ||
      l.minuto < 0 ||
      l.minuto >= minutosDeJornada
    )
      problemas.push(
        `el caso ${l.caso_id} llega al minuto ${l.minuto}, fuera de la jornada (0–${minutosDeJornada - 1})`,
      );
  }
  for (const id of ids)
    if (!vistos.has(id)) problemas.push(`el caso ${id} no tiene llegada`);
  const delLote = new Set(ids);
  for (const l of capa.llegadas)
    if (!delLote.has(l.caso_id))
      problemas.push(
        `la llegada de ${l.caso_id} no es de ningún caso del lote`,
      );
  return problemas;
}
