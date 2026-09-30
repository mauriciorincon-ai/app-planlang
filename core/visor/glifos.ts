/**
 * Rutas de los glifos de tipo y de las marcas del lienzo, como datos (D13: toda marca es un path). Sin
 * trigonometría en el núcleo (G2): la estrella y los polígonos son los de `src/components/marcas.tsx` en la
 * Entrada aprobada, escritos aquí una sola vez; una prueba los recalcula con coseno y seno y compara.
 * El glifo de `regla` es el HEXÁGONO que selló el usuario (desviación 4; el contrato 0.3.0 dice `escudo`).
 */
export type FormaDeGlifo =
  "estrella" | "triangulo" | "hexagono" | "cuadrado" | "rombo";

/** Caja de −9 a 9. */
export const RUTA_GLIFO: Record<FormaDeGlifo, string> = {
  estrella:
    "M0,-8.2 L2.06,-2.83 L7.8,-2.53 L3.33,1.08 L4.82,6.63 L0,3.5 L-4.82,6.63 L-3.33,1.08 L-7.8,-2.53 L-2.06,-2.83 Z",
  triangulo: "M0,-7.5 L7.5,6 L-7.5,6 Z",
  hexagono: "M0,-8 L6.93,-4 L6.93,4 L0,8 L-6.93,4 L-6.93,-4 Z",
  cuadrado: "M-6.5,-6.5 H6.5 V6.5 H-6.5 Z",
  rombo: "M0,-8 L8,0 L0,8 L-8,0 Z",
};

/** Glifo de cada tipo de la gramática `agentes-ia` (ids del mapa). */
export const GLIFO_DE_TIPO_MAPA: Record<string, FormaDeGlifo> = {
  modelo: "estrella",
  herramienta: "triangulo",
  regla: "hexagono",
  "pausa-humana": "cuadrado",
  enrutador: "rombo",
};
