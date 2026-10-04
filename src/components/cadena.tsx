import { GLIFO_DE_TIPO, type TipoDeNodo } from "@/lib/vista/nodos";
import { Flecha, Glifo } from "./marcas";

/** Referencia a un nodo: su glifo en el color del tipo y su id en mono (hueco si el grafo no lo tiene). */
export function RefNodo({
  id,
  tipo,
  enGrafo = true,
}: {
  id: string;
  tipo: TipoDeNodo;
  enGrafo?: boolean;
}) {
  return (
    <span
      data-tipo={tipo}
      className="inline-flex items-center gap-1 font-mono text-dato leading-snug whitespace-nowrap text-tinta-1"
    >
      <Glifo forma={GLIFO_DE_TIPO[tipo]} hueco={!enGrafo} className="text-c" />
      {id}
    </span>
  );
}

/**
 * Cadena de nodos (design-system § 5, 0.3): glifos unidos por flechas, que se envuelve en teléfono. Cada
 * flecha es una pieza aparte (puede bajar de línea sola, como en la maqueta) y queda fuera del árbol de
 * accesibilidad: la lista la leen sus nodos, en orden.
 */
export function Cadena({
  nodos,
  etiqueta,
}: {
  nodos: { id: string; tipo: TipoDeNodo; enGrafo?: boolean }[];
  etiqueta: string;
}) {
  return (
    <span
      role="list"
      aria-label={etiqueta}
      className="inline-flex flex-wrap items-center gap-1.5"
    >
      {nodos.flatMap((n, i) => [
        ...(i > 0 ? [<Flecha key={`f-${n.id}`} trazo="var(--tinta-3)" />] : []),
        <span key={n.id} role="listitem" className="inline-flex">
          <RefNodo id={n.id} tipo={n.tipo} enGrafo={n.enGrafo} />
        </span>,
      ])}
    </span>
  );
}
