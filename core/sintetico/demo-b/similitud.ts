/**
 * Similitud de nombres contra las listas de control (reglas RL-01 y RL-02 del archivo de listas). Determinista y
 * sin dependencias del entorno: el plegado de tildes es una tabla escrita aquí (no `String.prototype.normalize`,
 * cuyo resultado depende de la versión de Unicode del motor), así que Node, los navegadores y el espejo en Python
 * (`agents/src/app_agents/demo_b/similitud.py`) dan exactamente los mismos números. El generador escribe la
 * similitud verdadera en cada caso y la suite de Python la recalcula: es el gate de contrato entre los dos lados.
 *
 * - Normalizar: minúsculas, tildes plegadas, todo lo que no sea a–z pasa a espacio, tokens ordenados (el orden
 *   «apellidos, nombre» no cambia el resultado).
 * - Jaro-Winkler clásico (ventana ⌊max/2⌋−1, prefijo de hasta 4, p = 0,1) sobre las cadenas normalizadas.
 * - Redondeo a 4 decimales con `floor(x·10⁴ + ½) / 10⁴` (la misma operación IEEE en los dos lenguajes).
 */
import type { ListasB } from "./esquema";

const PLIEGUE: Readonly<Record<string, string>> = {
  á: "a",
  à: "a",
  â: "a",
  ä: "a",
  ã: "a",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  í: "i",
  ì: "i",
  î: "i",
  ï: "i",
  ó: "o",
  ò: "o",
  ô: "o",
  ö: "o",
  õ: "o",
  ú: "u",
  ù: "u",
  û: "u",
  ü: "u",
  ñ: "n",
  ç: "c",
};

export function normalizarNombre(nombre: string): string {
  let s = "";
  for (const ch of nombre.toLowerCase()) {
    const p = PLIEGUE[ch] ?? ch;
    s += p >= "a" && p <= "z" && p.length === 1 ? p : " ";
  }
  return s
    .split(" ")
    .filter((t) => t.length > 0)
    .sort()
    .join(" ");
}

export function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (la === 0 || lb === 0) return 0;
  const ventana = Math.max(Math.floor(Math.max(la, lb) / 2) - 1, 0);
  const enA: boolean[] = new Array<boolean>(la).fill(false);
  const enB: boolean[] = new Array<boolean>(lb).fill(false);
  let m = 0;
  for (let i = 0; i < la; i++) {
    const desde = Math.max(0, i - ventana);
    const hasta = Math.min(i + ventana + 1, lb);
    for (let j = desde; j < hasta; j++) {
      if (enB[j] || a[i] !== b[j]) continue;
      enA[i] = true;
      enB[j] = true;
      m++;
      break;
    }
  }
  if (m === 0) return 0;
  let k = 0;
  let transpuestos = 0;
  for (let i = 0; i < la; i++) {
    if (!enA[i]) continue;
    while (!enB[k]) k++;
    if (a[i] !== b[k]) transpuestos++;
    k++;
  }
  const t = transpuestos / 2;
  return (m / la + m / lb + (m - t) / m) / 3;
}

export function jaroWinkler(a: string, b: string): number {
  const j = jaro(a, b);
  const tope = Math.min(4, a.length, b.length);
  let l = 0;
  while (l < tope && a[l] === b[l]) l++;
  return j + l * 0.1 * (1 - j);
}

export const redondear4 = (x: number): number =>
  Math.floor(x * 10000 + 0.5) / 10000;

/** Similitud entre dos nombres escritos de cualquier forma (RL-02), redondeada a 4 decimales. */
export function similitud(a: string, b: string): number {
  return redondear4(jaroWinkler(normalizarNombre(a), normalizarNombre(b)));
}

export interface Coincidencia {
  lista_id: string;
  entrada_id: string;
  nombre_listado: string;
  similitud: number;
  vinculante: boolean;
  exacta: boolean;
}

/**
 * La entrada más parecida de todas las listas (nombre y alias), en el orden del archivo; un empate lo gana la
 * primera. `exacta` = mismo nombre normalizado (RL-01). `null` solo si no hay nombre que comparar.
 */
export function mejorCoincidencia(
  nombre: string | null,
  mundo: Pick<ListasB, "listas">,
): Coincidencia | null {
  if (nombre === null || normalizarNombre(nombre) === "") return null;
  const propio = normalizarNombre(nombre);
  let mejor: Coincidencia | null = null;
  for (const l of mundo.listas)
    for (const e of l.entradas)
      for (const n of [e.nombre, ...e.alias]) {
        const s = redondear4(jaroWinkler(propio, normalizarNombre(n)));
        if (mejor === null || s > mejor.similitud)
          mejor = {
            lista_id: l.id,
            entrada_id: e.id,
            nombre_listado: n,
            similitud: s,
            vinculante: l.vinculante,
            exacta: normalizarNombre(n) === propio,
          };
      }
  return mejor;
}
