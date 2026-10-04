"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SEG, SEG_OPCION } from "./segmentado";

/**
 * Vistas alternas de un bloque (lienzo · lista, las pestañas de un panel): una sola a la vista y las demás con
 * `hidden`. Todas se pintan en el servidor y el estado cambia un ATRIBUTO, nunca la forma del árbol (regla de
 * desarrollo 5-a). Sin JS se ve la inicial.
 */
interface EstadoVistas {
  vista: string;
  fijar: (v: string) => void;
}

const Contexto = createContext<EstadoVistas | null>(null);

export function useVistas(): EstadoVistas {
  const e = useContext(Contexto);
  if (!e) throw new Error("vitrina: useVistas fuera de <Vistas>");
  return e;
}

export function Vistas({
  inicial,
  parametro,
  children,
}: {
  inicial: string;
  /** Si la URL trae `?vista=<id>` con una de `parametro`, se abre esa (el arnés de capturas y el teléfono de sala). */
  parametro?: readonly string[];
  children: ReactNode;
}) {
  const [vista, fijar] = useState(inicial);
  useEffect(() => {
    if (!parametro) return;
    const pedida = new URLSearchParams(window.location.search).get("vista");
    // Leer la URL solo es posible en el navegador: el primer render ya coincidió con el servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pedida && parametro.includes(pedida)) fijar(pedida);
  }, [parametro]);
  return (
    <Contexto.Provider value={{ vista, fijar }}>{children}</Contexto.Provider>
  );
}

/** Lo que se ve con una vista; con las demás, `hidden` (fuera del árbol de accesibilidad). */
export function PanelVista({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { vista } = useVistas();
  return (
    <div data-vista-panel={id} hidden={vista !== id} className={className}>
      {children}
    </div>
  );
}

/** El conmutador: un control segmentado con una opción por vista (`aria-pressed`). */
export function BotonesVista({
  rotulo,
  opciones,
}: {
  rotulo: string;
  opciones: ReadonlyArray<{ id: string; etiqueta: ReactNode }>;
}) {
  const { vista, fijar } = useVistas();
  return (
    <div className={SEG} role="group" aria-label={rotulo}>
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          className={SEG_OPCION}
          aria-pressed={vista === o.id}
          onClick={() => fijar(o.id)}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}
