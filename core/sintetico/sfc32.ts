/**
 * Azar con semilla declarada (regla dura 1): sfc32 (Chris Doty-Humphrey, PractRand) sembrado con
 * cyrb128 sobre la cadena de semilla. Solo aritmética entera de 32 bits (`Math.imul`, `|0`, `>>>`),
 * así que produce la misma secuencia en Node y en cualquier navegador. Prohibido `Math.random`.
 */

/** cyrb128: cuatro palabras de 32 bits a partir de una cadena (siembra de sfc32). */
export function cyrb128(texto: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < texto.length; i++) {
    const k = texto.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** sfc32 crudo: devuelve el siguiente entero sin signo de 32 bits. */
export function sfc32(
  a0: number,
  b0: number,
  c0: number,
  d0: number,
): () => number {
  let a = a0 | 0;
  let b = b0 | 0;
  let c = c0 | 0;
  let d = d0 | 0;
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
}

export interface Azar {
  /** Real en [0, 1) con 32 bits de resolución. */
  real(): number;
  /** Entero uniforme en [min, max] (ambos incluidos). */
  entero(min: number, max: number): number;
  /** Verdadero con probabilidad `p`. */
  probabilidad(p: number): boolean;
  elegir<T>(lista: readonly T[]): T;
  /** Elige según pesos positivos; el orden de la lista fija el desempate. */
  elegirPonderado<T>(opciones: readonly (readonly [T, number])[]): T;
  /** Copia barajada (Fisher–Yates). */
  barajar<T>(lista: readonly T[]): T[];
}

const DESCARTE_INICIAL = 15;

/** Crea el generador a partir de la cadena de semilla declarada. */
export function crearAzar(semilla: string): Azar {
  const siguiente = sfc32(...cyrb128(semilla));
  for (let i = 0; i < DESCARTE_INICIAL; i++) siguiente();
  const real = (): number => siguiente() / 4294967296;
  const entero = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min)
      throw new RangeError(`entero(${min}, ${max}): rango inválido`);
    return min + Math.floor(real() * (max - min + 1));
  };
  const elegir = <T>(lista: readonly T[]): T => {
    if (lista.length === 0) throw new RangeError("elegir: lista vacía");
    return lista[entero(0, lista.length - 1)] as T;
  };
  return {
    real,
    entero,
    probabilidad: (p) => real() < p,
    elegir,
    elegirPonderado: <T>(opciones: readonly (readonly [T, number])[]): T => {
      const total = opciones.reduce((s, [, w]) => s + w, 0);
      if (opciones.length === 0 || !(total > 0))
        throw new RangeError("elegirPonderado: sin pesos positivos");
      let r = real() * total;
      for (const [valor, peso] of opciones) {
        if (r < peso) return valor;
        r -= peso;
      }
      return (opciones[opciones.length - 1] as readonly [T, number])[0];
    },
    barajar: <T>(lista: readonly T[]): T[] => {
      const copia = [...lista];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = entero(0, i);
        [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
      }
      return copia;
    },
  };
}
