/**
 * Aritmética y formato deterministas del informe: sin `Intl` ni `toLocale*` (regla dura 1). `toFixed`
 * está especificado con exactitud por ECMAScript, así que da los mismos bytes en Node y en el navegador.
 */
import type { Idioma } from "../formatos/bilingue";

export function redondear(x: number, decimales = 4): number {
  // Potencia de diez multiplicando, no con `**`: el playground corre esto en el navegador y G2 veta `**`, cuya
  // exactitud no garantiza la especificación entre motores (AU-S2-B8). Hasta 10^22 cada producto es exacto.
  let f = 1;
  for (let k = 0; k < decimales; k++) f *= 10;
  const r = Math.round(x * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const o = [...valores].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 === 1
    ? (o[m] as number)
    : ((o[m - 1] as number) + (o[m] as number)) / 2;
}

export function promedio(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  let s = 0;
  for (const v of valores) s += v;
  return s / valores.length;
}

export function maximo(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => (b > a ? b : a));
}

export function minimo(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => (b < a ? b : a));
}

/** Número con `decimales` fijos; coma decimal en español, punto en inglés. */
export function num(x: number, idioma: Idioma, decimales = 2): string {
  const s = x.toFixed(decimales);
  return idioma === "es" ? s.replace(".", ",") : s;
}

/** Número sin ceros sobrantes (0,75 · 1000 · 11,2). */
export function numCorto(x: number, idioma: Idioma, maxDecimales = 3): string {
  let s = x.toFixed(maxDecimales);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return idioma === "es" ? s.replace(".", ",") : s;
}

/** Porcentaje con un decimal: 93,3 % (es) · 93.3% (en). */
export function pct(x: number, idioma: Idioma): string {
  const s = numCorto(x * 100, idioma, 1);
  return idioma === "es" ? `${s} %` : `${s}%`;
}
