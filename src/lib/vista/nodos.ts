/**
 * Los cinco tipos de nodo de la gramática `agentes-ia` (design-system § 2.2): color + glifo + etiqueta,
 * nunca el color solo (regla dura 13). El glifo de `regla` es el HEXÁGONO que selló el usuario (desviación
 * 4 del S2 frente al `escudo` del contrato diagramador 0.3.0; enmienda propuesta en el summary).
 */
import type { FormaDeGlifo } from "@core/visor/glifos";

export const TIPOS_DE_NODO = [
  "modelo",
  "herramienta",
  "regla",
  "pausa_humana",
  "enrutador",
] as const;
export type TipoDeNodo = (typeof TIPOS_DE_NODO)[number];

export type { FormaDeGlifo };

export const GLIFO_DE_TIPO: Record<TipoDeNodo, FormaDeGlifo> = {
  modelo: "estrella",
  herramienta: "triangulo",
  regla: "hexagono",
  pausa_humana: "cuadrado",
  enrutador: "rombo",
};

/** La variable de color de cada tipo (tokens.css): `--tipo-1` … `--tipo-5`. */
export const COLOR_DE_TIPO: Record<TipoDeNodo, string> = {
  modelo: "var(--tipo-1)",
  herramienta: "var(--tipo-2)",
  regla: "var(--tipo-3)",
  pausa_humana: "var(--tipo-4)",
  enrutador: "var(--tipo-5)",
};

export function tipoDeNodo(tipo: string): TipoDeNodo {
  if ((TIPOS_DE_NODO as readonly string[]).includes(tipo))
    return tipo as TipoDeNodo;
  throw new Error(
    `vitrina: tipo de nodo «${tipo}» fuera de la gramática agentes-ia`,
  );
}

/** El glifo de un tipo escrito como en el plan (`pausa_humana`) o como en el mapa (`pausa-humana`). */
export function formaDeTipo(tipo: string): FormaDeGlifo {
  return GLIFO_DE_TIPO[tipoDeNodo(tipo.replaceAll("-", "_"))];
}
