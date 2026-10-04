"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { TarjetaNodo } from "./piezas";

/**
 * Qué nodo o regla del lienzo está seleccionado: lo comparten el lienzo, la lista por capa y el detalle. Todos
 * los paneles del detalle se pintan en el servidor y solo el seleccionado queda sin `hidden` (regla 5-a); sin JS
 * se ve el inicial, como en la maqueta.
 */
interface EstadoSeleccion {
  actual: string;
  /** Si alguien eligió (el anuncio solo habla después de un cambio). */
  cambiada: boolean;
  elegir: (id: string) => void;
}

const Contexto = createContext<EstadoSeleccion | null>(null);

export function useSeleccion(): EstadoSeleccion {
  const s = useContext(Contexto);
  if (!s) throw new Error("vitrina: useSeleccion fuera de <Seleccion>");
  return s;
}

/** Para un lienzo que puede no ser seleccionable (el del spike): sin proveedor, nada está seleccionado. */
export function useSeleccionOpcional(): EstadoSeleccion | null {
  return useContext(Contexto);
}

export function Seleccion({
  inicial,
  children,
}: {
  inicial: string;
  children: ReactNode;
}) {
  const [estado, fijar] = useState({ actual: inicial, cambiada: false });
  const elegir = (id: string) => fijar({ actual: id, cambiada: true });
  return (
    <Contexto.Provider value={{ ...estado, elegir }}>
      {children}
    </Contexto.Provider>
  );
}

/** Un panel del detalle: a la vista solo si es el seleccionado. */
export function PanelSeleccion({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { actual } = useSeleccion();
  return (
    <div
      id={`detalle-${id}`}
      data-detalle={id}
      hidden={actual !== id}
      className={className}
    >
      {children}
    </div>
  );
}

/** Dice a los lectores de pantalla qué detalle apareció, después de cada cambio de selección. */
export function AnuncioSeleccion({
  anuncios,
}: {
  anuncios: Readonly<Record<string, string>>;
}) {
  const { actual, cambiada } = useSeleccion();
  return (
    <p aria-live="polite" className="sr-only">
      {cambiada ? (anuncios[actual] ?? "") : ""}
    </p>
  );
}

/**
 * Un nodo de la lista por capa: la tarjeta del lienzo como botón, para elegir su detalle sin el lienzo (la lista
 * es la versión en texto del diagrama). Los que no tienen detalle se pintan igual, sin botón.
 */
export function NodoDeLista({
  id,
  tipo,
  codigo,
  nombre,
  seleccionable,
  exigido = null,
}: {
  id: string;
  tipo: string;
  codigo: string;
  nombre: string;
  seleccionable: boolean;
  exigido?: { marca: string; lector: string } | null;
}) {
  const s = useSeleccionOpcional();
  const tarjeta = (
    <TarjetaNodo
      tipo={tipo}
      codigo={codigo}
      nombre={nombre}
      exigido={exigido}
      seleccionada={seleccionable && s?.actual === id}
    />
  );
  if (!seleccionable || !s) return tarjeta;
  return (
    <button
      type="button"
      aria-pressed={s.actual === id}
      aria-controls={`detalle-${id}`}
      onClick={() => s.elegir(id)}
      className="block w-full cursor-pointer rounded-control border-0 bg-transparent p-0 text-left text-tinta-1"
    >
      {tarjeta}
    </button>
  );
}
