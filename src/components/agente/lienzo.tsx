"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { cx } from "../cx";
import { useSeleccionOpcional } from "./seleccion";

/** Cuánto avanza una flecha del teclado: un paso de columna del lienzo (172) más un margen. */
const PASO_TECLADO = 202;

/**
 * El lienzo del visor: el SVG que genera `core/visor` (se inserta tal cual; el visual se genera, no se dibuja),
 * dentro de un marco que se desliza de lado (horizontal, nunca transpuesto), con índice de capas cuando no cabe y
 * flechas del teclado. Tocar un nodo o la regla seleccionable cambia la selección compartida con el detalle; la
 * marca `data-sel` y `aria-pressed` se ponen en el SVG. El índice siempre se pinta: si el lienzo cabe, el CSS lo
 * oculta por atributo (regla 5-a).
 */
export function Lienzo({
  svg,
  columnas,
  region,
  indice,
  irACapa,
  seleccionable = true,
  conIndice = true,
}: {
  svg: string;
  columnas: ReadonlyArray<{ numero: string; x: number }>;
  region: string;
  indice: string;
  irACapa: string;
  seleccionable?: boolean;
  /** El del spike, como en la maqueta, va sin índice de capas. */
  conIndice?: boolean;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const [cabe, setCabe] = useState<boolean | null>(null);
  const [activa, setActiva] = useState(0);
  const seleccion = useSeleccionOpcional();
  const actual = seleccion?.actual;

  const medir = useCallback(() => {
    const s = scroll.current;
    if (!s) return;
    setCabe(s.scrollWidth <= s.clientWidth + 2);
    let a = 0;
    columnas.forEach((c, k) => {
      if (c.x - 8 <= s.scrollLeft + 24) a = k;
    });
    // Al final del recorrido la última capa ya no puede llegar al borde izquierdo: es la que se ve.
    if (s.scrollLeft + s.clientWidth >= s.scrollWidth - 4)
      a = columnas.length - 1;
    setActiva(a);
  }, [columnas]);

  useEffect(() => {
    const s = scroll.current;
    if (!s) return;
    medir();
    s.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      s.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  useEffect(() => {
    if (!seleccionable) return;
    for (const el of scroll.current?.querySelectorAll("[data-sel-id]") ?? []) {
      const si = el.getAttribute("data-sel-id") === actual;
      if (si) el.setAttribute("data-sel", "true");
      else el.removeAttribute("data-sel");
      el.setAttribute("aria-pressed", si ? "true" : "false");
    }
  }, [actual, seleccionable]);

  const tocar = (e: MouseEvent<HTMLDivElement>) => {
    const el = (e.target as Element).closest("[data-sel-id]");
    const id = el?.getAttribute("data-sel-id");
    if (seleccionable && id) seleccion?.elegir(id);
  };
  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const s = scroll.current;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      s?.scrollBy({
        left: e.key === "ArrowRight" ? PASO_TECLADO : -PASO_TECLADO,
        behavior: "auto",
      });
      e.preventDefault();
      return;
    }
    if (!seleccionable || (e.key !== "Enter" && e.key !== " ")) return;
    const id = (e.target as Element)
      .closest("[data-sel-id]")
      ?.getAttribute("data-sel-id");
    if (id) {
      e.preventDefault();
      seleccion?.elegir(id);
    }
  };

  return (
    <div
      className="group relative min-w-0"
      data-cabe={cabe === null ? undefined : String(cabe)}
    >
      <div
        ref={scroll}
        role="region"
        aria-label={region}
        tabIndex={0}
        onClick={tocar}
        onKeyDown={tecla}
        className="overflow-x-auto overscroll-x-contain scroll-smooth rounded-control border border-linea bg-sup-1 motion-reduce:scroll-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div
        hidden={!conIndice}
        className="mt-2 flex flex-wrap items-center gap-1 text-dato text-tinta-2 group-data-[cabe=true]:hidden"
        role="group"
        aria-label={irACapa}
      >
        <span className="mr-1">{indice}</span>
        {columnas.map((c, k) => (
          <button
            key={c.numero}
            type="button"
            aria-label={`${irACapa} ${c.numero}`}
            aria-current={k === activa ? "true" : undefined}
            onClick={() =>
              scroll.current?.scrollTo({ left: c.x - 8, behavior: "auto" })
            }
            className={cx(
              "h-7 min-w-7.5 cursor-pointer rounded-chip border bg-transparent font-mono text-dato leading-none font-medium",
              // La capa activa no se distingue solo por la luminancia: lleva subrayado, como la pestaña actual
              // (AU-S2-B27, regla 13).
              k === activa
                ? "border-tinta-1 text-tinta-1 underline decoration-2 underline-offset-[3px]"
                : "border-tinta-3 text-tinta-2",
            )}
          >
            {c.numero}
          </button>
        ))}
      </div>
    </div>
  );
}
