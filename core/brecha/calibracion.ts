/**
 * Calibración de la confianza verbalizada (supuesto S1, E-5): ECE con 10 intervalos iguales, AUROC por
 * rangos con empates promediados (Mann-Whitney) y la curva riesgo-cobertura sobre el rango jugable del
 * umbral. Funciones puras sobre `{confianza, correcto}`; el orden de entrada no cambia el resultado.
 */
import type { Operador } from "../plan/esquema";
import { comparar } from "../playground/interprete";
import { redondear } from "./numeros";

export interface Muestra {
  caso_id: string;
  confianza: number;
  correcto: boolean;
}

export const INTERVALOS_ECE = 10;

/** Error de calibración esperado: Σ (n_b / N) · |acierto_b − confianza_b|. `null` sin muestras. */
export function ece(
  muestras: readonly Muestra[],
  intervalos = INTERVALOS_ECE,
): number | null {
  if (muestras.length === 0) return null;
  const n = new Array<number>(intervalos).fill(0);
  const aciertos = new Array<number>(intervalos).fill(0);
  const confianzas = new Array<number>(intervalos).fill(0);
  for (const m of muestras) {
    const b = Math.min(Math.floor(m.confianza * intervalos), intervalos - 1);
    n[b] = (n[b] as number) + 1;
    aciertos[b] = (aciertos[b] as number) + (m.correcto ? 1 : 0);
    confianzas[b] = (confianzas[b] as number) + m.confianza;
  }
  let total = 0;
  for (let b = 0; b < intervalos; b++) {
    const nb = n[b] as number;
    if (nb === 0) continue;
    total +=
      (nb / muestras.length) *
      Math.abs((aciertos[b] as number) / nb - (confianzas[b] as number) / nb);
  }
  return redondear(total);
}

/**
 * Área bajo la curva ROC de la confianza como predictor de acierto. `null` si no hay aciertos o no hay
 * fallos: sin las dos clases no hay nada que discriminar (y el informe lo dice).
 */
export function auroc(muestras: readonly Muestra[]): number | null {
  const positivos = muestras.filter((m) => m.correcto).length;
  const negativos = muestras.length - positivos;
  if (positivos === 0 || negativos === 0) return null;
  const orden = [...muestras].sort((a, b) => a.confianza - b.confianza);
  let sumaRangos = 0;
  let i = 0;
  while (i < orden.length) {
    let j = i;
    while (
      j + 1 < orden.length &&
      (orden[j + 1] as Muestra).confianza === (orden[i] as Muestra).confianza
    )
      j++;
    const rangoMedio = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++)
      if ((orden[k] as Muestra).correcto) sumaRangos += rangoMedio;
    i = j + 1;
  }
  return redondear(
    (sumaRangos - (positivos * (positivos + 1)) / 2) / (positivos * negativos),
  );
}

export interface PuntoRiesgoCobertura {
  umbral: number;
  /** Fracción de casos que el agente resuelve solo (no escala por confianza). */
  cobertura: number;
  /** Fracción de errores entre los que resuelve solo; `null` si no resuelve ninguno. */
  riesgo: number | null;
  aceptados: number;
}

/** Valores del rango jugable `min..max` en pasos, sin deriva de coma flotante. */
export function rejilla(rango: {
  min: number;
  max: number;
  paso: number;
}): number[] {
  const pasos = Math.round((rango.max - rango.min) / rango.paso);
  return Array.from({ length: pasos + 1 }, (_, i) =>
    redondear(rango.min + i * rango.paso, 6),
  );
}

/**
 * Para cada umbral de la rejilla: un caso escala si la arista del plan es verdadera
 * (`confianza <operador> umbral`), y el resto lo resuelve el agente solo.
 */
export function curvaRiesgoCobertura(
  muestras: readonly Muestra[],
  umbrales: readonly number[],
  operador: Operador,
  inclusivo: boolean,
): PuntoRiesgoCobertura[] {
  return umbrales.map((u) => {
    const aceptadas = muestras.filter(
      (m) => !comparar(m.confianza, operador, u, inclusivo),
    );
    const errores = aceptadas.filter((m) => !m.correcto).length;
    return {
      umbral: u,
      cobertura:
        muestras.length === 0
          ? 0
          : redondear(aceptadas.length / muestras.length),
      riesgo:
        aceptadas.length === 0 ? null : redondear(errores / aceptadas.length),
      aceptados: aceptadas.length,
    };
  });
}
