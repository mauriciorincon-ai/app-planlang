/**
 * La zona respaldada de la calibración (S8, ADR-018) como la lee la isla del playground en el navegador: dos tipos y una
 * pregunta, sin importar el cálculo exacto (`core/brecha/garantia.ts`, con `BigInt`), que vive en el servidor.
 */
export interface Zona {
  desde: number;
  hasta: number;
  umbrales: number[];
}

/** Dónde cae un valor del umbral frente a la zona de un nivel. */
export type Lugar = "dentro" | "debajo" | "encima" | "ninguna";

const cerca = (a: number, b: number) => Math.abs(a - b) < 1e-9;

export function dentroDeLaZona(zona: Zona | null, v: number): boolean {
  return zona !== null && zona.umbrales.some((x) => cerca(x, v));
}

/** Por debajo de la zona los datos no respaldan el error; por encima, se escalan más aciertos de los aceptados. */
export function lugarEnLaZona(zona: Zona | null, v: number): Lugar {
  if (zona === null) return "ninguna";
  if (dentroDeLaZona(zona, v)) return "dentro";
  return v < zona.desde ? "debajo" : "encima";
}
