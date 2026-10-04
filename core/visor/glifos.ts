/**
 * Rutas de los glifos de tipo, como datos (D13: toda marca es un path): las de la tabla del contrato del
 * diagramador 0.5.0 § 5.4, copiadas una sola vez (una prueba las lee del contrato fijado y compara). La FORMA de cada
 * tipo la dice la gramática (`tipos_de_nodo[].glifo`): `agentes-ia` 1.2.0 declara el hexágono para `regla`, el que
 * selló el usuario en el design system 1.0.0 (antes del 0.5.0, una desviación).
 */
import type { Gramatica } from "./tipos";

export type FormaDeGlifo =
  "estrella" | "triangulo" | "hexagono" | "cuadrado" | "rombo";

/** Caja de 16 × 16 centrada en (0, 0). */
export const RUTA_GLIFO: Record<FormaDeGlifo, string> = {
  estrella:
    "M0.0,-8.2 L2.1,-2.8 L7.8,-2.5 L3.3,1.1 L4.8,6.6 L0.0,3.5 L-4.8,6.6 L-3.3,1.1 L-7.8,-2.5 L-2.1,-2.8 Z",
  triangulo: "M0,-7.5 L7.5,6 L-7.5,6 Z",
  hexagono: "M0,-8 L6.9,-4 L6.9,4 L0,8 L-6.9,4 L-6.9,-4 Z",
  cuadrado: "M-6.5,-6.5 H6.5 V6.5 H-6.5 Z",
  rombo: "M0,-8 L8,0 L0,8 L-8,0 Z",
};

const esForma = (x: string): x is FormaDeGlifo => x in RUTA_GLIFO;

/** La forma del glifo de un tipo del mapa, leída de la gramática; un glifo sin ruta detiene el dibujo. */
export function formaDeGlifo(g: Gramatica, tipo: string): FormaDeGlifo {
  const t = g.tipos_de_nodo.find((x) => x.id === tipo);
  if (!t) throw new Error(`visor: el tipo «${tipo}» no está en la gramática`);
  if (!esForma(t.glifo))
    throw new Error(
      `visor: el glifo «${t.glifo}» del tipo «${tipo}» no tiene ruta en glifos.ts`,
    );
  return t.glifo;
}
