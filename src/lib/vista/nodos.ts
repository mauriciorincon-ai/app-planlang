/**
 * Los cinco tipos de nodo de la gramática `agentes-ia` (design-system § 2.2): color + glifo + etiqueta,
 * nunca el color solo (regla dura 13). El glifo de cada tipo lo dice la gramática: la 1.2.0 (contrato 0.5.0) trae el
 * HEXÁGONO para `regla`, el que selló el usuario (antes, la desviación 4 del S2).
 */
import { formaDeGlifo, type FormaDeGlifo } from "@core/visor/glifos";
import type { Gramatica } from "@core/visor/tipos";
import gramaticaJson from "../../../packages/diagramador/contrato/gramaticas/agentes-ia.json";

const GRAMATICA_AGENTES = gramaticaJson as unknown as Gramatica;

export const TIPOS_DE_NODO = [
  "modelo",
  "herramienta",
  "regla",
  "pausa_humana",
  "enrutador",
] as const;
export type TipoDeNodo = (typeof TIPOS_DE_NODO)[number];

export type { FormaDeGlifo };

/** El glifo de cada tipo, leído de la gramática `agentes-ia` (la misma que dibuja el lienzo). */
export const GLIFO_DE_TIPO = Object.fromEntries(
  TIPOS_DE_NODO.map((t) => [
    t,
    formaDeGlifo(GRAMATICA_AGENTES, t.replaceAll("_", "-")),
  ]),
) as Record<TipoDeNodo, FormaDeGlifo>;

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
