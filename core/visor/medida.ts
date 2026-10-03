/**
 * Medición de texto con la tabla de métricas (G15): jamás se mide en el navegador para disponer. El ancho es
 * la suma de avances sin kerning (cota superior). `partir` corta en espacios y, si una palabra no cabe sola,
 * después de un guion bajo (los nombres de nodo son identificadores del código).
 */
import metricas from "./metricas.json";
import type { EstiloDeTexto, Familia } from "./estilos";

interface TablaDeFuente {
  unidades_por_em: number;
  pesos: Record<string, Record<string, number>>;
}

const FUENTES = (metricas as { fuentes: Record<Familia, TablaDeFuente> })
  .fuentes;

function avances(estilo: EstiloDeTexto): Record<string, number> {
  const t = FUENTES[estilo.familia].pesos[String(estilo.peso)];
  if (!t)
    throw new Error(
      `visor: la tabla de métricas no trae ${estilo.familia} ${estilo.peso}`,
    );
  return t;
}

/** Caracteres de `texto` que la tabla de la familia no cubre (V15). */
export function fueraDeCobertura(texto: string, familia: Familia): string[] {
  const t = FUENTES[familia].pesos["400"] as Record<string, number>;
  const fuera: string[] = [];
  for (const ch of texto) {
    const cp = ch.codePointAt(0) as number;
    if (t[String(cp)] === undefined && !fuera.includes(ch)) fuera.push(ch);
  }
  return fuera;
}

/** Ancho de una línea de texto en unidades del SVG. Un carácter fuera de la tabla es un error (V15). */
export function ancho(texto: string, estilo: EstiloDeTexto): number {
  const t = avances(estilo);
  let suma = 0;
  for (const ch of texto) {
    const a = t[String(ch.codePointAt(0))];
    if (a === undefined)
      throw new Error(
        `visor: «${ch}» (en «${texto}») está fuera de la tabla de ${estilo.familia} (V15)`,
      );
    suma += a;
  }
  return (suma * estilo.tam) / FUENTES[estilo.familia].unidades_por_em;
}

function cortarPalabra(
  palabra: string,
  estilo: EstiloDeTexto,
  max: number,
): string[] {
  const trozos = palabra.split(/(?<=_)/);
  const lineas: string[] = [];
  let actual = "";
  for (const t of trozos) {
    if (actual && ancho(actual + t, estilo) > max) {
      lineas.push(actual);
      actual = t;
    } else actual += t;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Parte `texto` en líneas que caben en `max` unidades. */
export function partir(
  texto: string,
  estilo: EstiloDeTexto,
  max: number,
): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (ancho(candidata, estilo) <= max) {
      actual = candidata;
      continue;
    }
    if (actual) lineas.push(actual);
    if (ancho(palabra, estilo) <= max) actual = palabra;
    else {
      const trozos = cortarPalabra(palabra, estilo, max);
      lineas.push(...trozos.slice(0, -1));
      actual = trozos[trozos.length - 1] as string;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}
