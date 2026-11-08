"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { claseBoton } from "../boton";
import { Icono } from "../icono";

/** Cuánto dura cada paso al reproducir (solo sin movimiento reducido: con él, reproducir avanza un paso). */
const MS_POR_PASO = 1400;

/**
 * El controlador del recorrido (contrato 0.5.0 § 4.3, nivel 3): cambia el atributo `data-paso` del contenedor y nada
 * más; el CSS generado del recorrido decide qué nodo está activo, visitado o pendiente y qué panel se ve. Anterior,
 * siguiente y reproducir son botones, y ← → hacen lo mismo con el foco en el recorrido (salvo dentro del lienzo, cuyas
 * flechas lo deslizan). El árbol del DOM no depende de la preferencia de movimiento (G12): con movimiento reducido,
 * reproducir avanza un paso sin temporizador.
 */
export function ControlRecorrido({
  contenedor,
  ns,
  nodos,
  posiciones,
  textos,
  children,
}: {
  contenedor: string;
  ns: string;
  /** El id del mapa del nodo de cada paso (1…N). */
  nodos: readonly string[];
  /** «Paso k de N: nodo», por paso. */
  posiciones: readonly string[];
  textos: {
    controles: string;
    anterior: string;
    siguiente: string;
    reproducir: string;
    pausar: string;
    teclado: string;
  };
  children: ReactNode;
}) {
  const n = nodos.length;
  const [k, setK] = useState(1);
  const [corre, setCorre] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const movido = useRef(false);

  // Al llegar al último paso la reproducción se detiene sola: corre mientras quede un paso por delante.
  const corriendo = corre && k < n;
  useEffect(() => {
    if (!corriendo) return;
    const t = setTimeout(() => setK((x) => Math.min(n, x + 1)), MS_POR_PASO);
    return () => clearTimeout(t);
  }, [corriendo, k, n]);

  // Al cambiar de paso (no al cargar), el nodo activo se trae a la vista dentro del lienzo, sin animar el desplazamiento.
  useEffect(() => {
    if (!movido.current) return;
    raiz.current
      ?.querySelector(`#${ns}-n-${nodos[k - 1]}`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [k, ns, nodos]);

  const ir = (x: number) => {
    movido.current = true;
    setK(Math.max(1, Math.min(n, x)));
  };
  const reproducir = () => {
    movido.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCorre(false);
      setK((x) => Math.min(n, x + 1));
      return;
    }
    if (corriendo) {
      setCorre(false);
      return;
    }
    if (k >= n) setK(1);
    setCorre(true);
  };
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    // Las flechas dentro del lienzo lo deslizan (el lienzo marca el evento); fuera de él, cambian de paso.
    if (e.defaultPrevented) return;
    if (e.key === "ArrowRight") ir(k + 1);
    else if (e.key === "ArrowLeft") ir(k - 1);
    else return;
    setCorre(false);
    e.preventDefault();
  };

  return (
    <div
      ref={raiz}
      id={contenedor}
      data-paso={k}
      data-reproduce={corriendo ? "true" : "false"}
      onKeyDown={tecla}
      className="grid gap-4"
    >
      <div
        role="group"
        aria-label={textos.controles}
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          aria-disabled={k <= 1 ? "true" : undefined}
          onClick={() => {
            setCorre(false);
            ir(k - 1);
          }}
          className={claseBoton({ chico: true })}
        >
          <Icono de={ChevronLeft} tam={14} />
          {textos.anterior}
        </button>
        <button
          type="button"
          onClick={reproducir}
          className={claseBoton({ chico: true })}
        >
          <Icono de={corriendo ? Pause : Play} tam={14} />
          {corriendo ? textos.pausar : textos.reproducir}
        </button>
        <button
          type="button"
          aria-disabled={k >= n ? "true" : undefined}
          onClick={() => {
            setCorre(false);
            ir(k + 1);
          }}
          className={claseBoton({ chico: true })}
        >
          {textos.siguiente}
          <Icono de={ChevronRight} tam={14} />
        </button>
        <p
          role="status"
          data-posicion
          className="ml-1 font-mono text-dato text-tinta-1"
        >
          {posiciones[k - 1]}
        </p>
        <p className="w-full text-dato text-tinta-2">{textos.teclado}</p>
      </div>
      {children}
    </div>
  );
}
