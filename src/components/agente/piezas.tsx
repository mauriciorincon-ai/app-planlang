/**
 * Piezas de P3 Agente (maqueta `03-agente.html`): la lista con marca de estado, el grupo técnico con su lista de
 * definiciones, la tarjeta de nodo, la referencia a un nodo, la etiqueta de reversibilidad y la prioridad de
 * acción en barras. Sin lógica: pintan lo que calcula `src/lib/vista/agente.ts`.
 */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Fila } from "@/lib/vista/agente";
import { formaDeTipo } from "@/lib/vista/nodos";
import { ConCodigo } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Glifo, Marca } from "../marcas";

/** ✓ en círculo lleno, en tinta: el paso corrió en la corrida. Su palabra va para los lectores de pantalla. */
export function MarcaCorrio({ texto }: { texto: string }) {
  return (
    <span className="mt-0.5 inline-flex">
      <Marca tipo="cumple" tam={15} className="text-tinta-1" />
      <span className="sr-only">{texto}</span>
    </span>
  );
}

/** Lista con una marca o un ícono por fila, filetes entre filas y la primera sin filete. */
export function ListaEst({
  numerada = false,
  children,
}: {
  numerada?: boolean;
  children: ReactNode;
}) {
  const Tag = numerada ? "ol" : "ul";
  return <Tag className="grid list-none p-0">{children}</Tag>;
}

export function ItemEst({
  inicio,
  fin,
  titulo,
  detalle,
}: {
  inicio: ReactNode;
  fin?: ReactNode;
  titulo: ReactNode;
  detalle?: ReactNode;
}) {
  return (
    <li
      className={cx(
        "grid items-start gap-2.5 border-t border-linea py-2.25 text-apoyo leading-[1.45] first:border-t-0 first:pt-0",
        fin
          ? "grid-cols-[18px_minmax(0,1fr)_16px]"
          : "grid-cols-[16px_minmax(0,1fr)]",
      )}
    >
      {inicio}
      <div className="min-w-0">
        {titulo}
        {detalle ? (
          <small className="mt-0.75 block text-dato leading-normal text-tinta-2">
            {detalle}
          </small>
        ) : null}
      </div>
      {fin}
    </li>
  );
}

/** Ícono de fila (Nunca, Participan): en tinta 2, alineado con la primera línea. */
export function IconoFila({ de }: { de: LucideIcon }) {
  return <Icono de={de} tam={15} className="mt-0.5 text-tinta-2" />;
}

/** Grupo técnico (perfil experto): título con ícono y lo que contiene. */
export function GrupoT({
  icono,
  titulo,
  nivel = "h3",
  className,
  children,
}: {
  icono: LucideIcon;
  titulo: ReactNode;
  nivel?: "h3" | "h4";
  className?: string;
  children: ReactNode;
}) {
  const H = nivel;
  return (
    <div className={cx("grid min-w-0 content-start gap-2", className)}>
      <H className="flex items-center gap-2 text-sub font-semibold">
        <Icono de={icono} className="text-tinta-2" />
        {titulo}
      </H>
      {children}
    </div>
  );
}

/** Códigos como fichas de dato (claves del estado, señales): mono, borde y superficie 1. */
export function ChipsDato({ codigos }: { codigos: readonly string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {codigos.map((c) => (
        <code
          key={c}
          className="rounded-chip border border-linea bg-sup-1 px-1.5 py-px font-mono text-dato leading-normal"
        >
          {c}
        </code>
      ))}
    </span>
  );
}

/** Lista de definiciones del experto: rótulo a la izquierda (132 px) y valor; en teléfono, apilados. */
export function Definiciones({
  filas,
  valor,
  className,
}: {
  filas: readonly Fila[];
  /** Cómo se pinta cada valor (por omisión, texto con código en línea). */
  valor?: (v: string) => ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        "m-0 grid grid-cols-1 chico:grid-cols-[minmax(0,132px)_minmax(0,1fr)]",
        className,
      )}
    >
      {filas.map((f) => (
        <div key={f.k} className="contents">
          <dt className="border-t border-linea py-1.75 pr-3 text-chico leading-normal text-tinta-2">
            {f.k}
          </dt>
          <dd className="border-linea pb-1.75 text-chico leading-normal [overflow-wrap:anywhere] chico:border-t chico:pt-1.75">
            {f.codigos ? (
              <ChipsDato codigos={f.codigos} />
            ) : valor ? (
              valor(f.v)
            ) : (
              <ConCodigo texto={f.v} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Referencia a un nodo en una línea de texto: su glifo de tipo (en el color del tipo) y su nombre en mono. */
export function RefNodo({ nombre, tipo }: { nombre: string; tipo: string }) {
  return (
    <span
      data-tipo={tipo}
      className="inline-flex items-center gap-1 font-mono text-dato leading-[1.4] whitespace-nowrap text-tinta-1"
    >
      <Glifo forma={formaDeTipo(tipo)} className="text-c" />
      {nombre}
    </span>
  );
}

/**
 * Tarjeta de nodo (la del lienzo, en HTML): filete del color del tipo, glifo, etiqueta corta y nombre. La
 * seleccionada lleva el tinte del tipo y su borde.
 */
export function TarjetaNodo({
  tipo,
  codigo,
  nombre,
  seleccionada = false,
}: {
  tipo: string;
  codigo: string;
  nombre: string;
  seleccionada?: boolean;
}) {
  return (
    <div
      data-tipo={tipo}
      className={cx(
        "relative grid min-h-12.5 grid-cols-[14px_minmax(0,1fr)] grid-rows-[auto_auto] items-center gap-x-2.5 rounded-control border py-1.75 pr-2.5 pl-3.25",
        "before:absolute before:inset-y-[-1px] before:left-[-1px] before:w-0.75 before:rounded-l-control before:bg-c before:content-['']",
        seleccionada
          ? "border-c bg-ct shadow-[0_0_0_1px_var(--c)]"
          : "border-linea bg-sup-1",
      )}
    >
      <Glifo
        forma={formaDeTipo(tipo)}
        tam={14}
        className="row-span-2 text-c"
      />
      <span className="font-mono text-micro leading-[1.3] font-medium tracking-[0.02em] text-tinta-2">
        {codigo}
      </span>
      <span className="text-chico leading-[1.35] font-medium [overflow-wrap:anywhere]">
        {nombre}
      </span>
    </div>
  );
}

/** Reversibilidad de una decisión del plan; la de una vía lleva la marca de alerta. */
export function Etiqueta({
  unaVia,
  children,
}: {
  unaVia: boolean;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex h-5 items-center gap-1.25 rounded-chip border border-tinta-3 px-1.75 text-dato leading-none font-medium whitespace-nowrap text-tinta-2">
      {unaVia ? <Marca tipo="alerta" tam={9} /> : null}
      {children}
    </span>
  );
}

/** Prioridad de acción AIAG-VDA en barras (una, dos o tres llenas) y en palabras. */
export function PrioridadAccion({
  barras,
  texto,
}: {
  barras: number;
  texto: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-chico font-medium">
      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
        {["h-1.5", "h-2.25", "h-3"].map((alto, k) => (
          <i
            key={alto}
            className={cx(
              "w-1 rounded-[1px]",
              alto,
              k < barras
                ? "bg-tinta-1"
                : "shadow-[inset_0_0_0_1px_var(--tinta-3)]",
            )}
          />
        ))}
      </span>
      {texto}
    </span>
  );
}
