// Tipos mínimos para que el gate (tests/unit/diseno-tokens.test.ts) importe el generador.
export interface Cromatico {
  token: string;
  id: string;
  familia: string;
  matiz: number;
  croma: number;
  rango: { oscuro: [number, number]; claro: [number, number] };
}
export interface TokensTema {
  neutros: Record<"neutro", Record<string, string>>;
  cromaticos: Record<string, { id: string; familia: string; matiz: number; L: number; hex: string }>;
  tintes: Record<"neutro", Record<string, string>>;
}
export interface Tokens {
  _generado: string;
  tinte: number;
  umbrales: Record<string, number>;
  temas: Record<"oscuro" | "claro", TokensTema>;
  medidas: Record<
    "oscuro" | "claro",
    Record<string, { umbral: number | null; peor_par: [string, string] | null; distancia: number }>
  >;
}
export const CROMATICOS: Cromatico[];
export const UMBRALES: Record<string, number>;
export const TINTE: number;
export const RUTA_JSON: string;
export const RUTA_CSS: string;
export function generar(): Tokens;
export function aCss(tokens: Tokens): string;
