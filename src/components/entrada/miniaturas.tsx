import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaEntrada } from "@/lib/vista/entrada";
import { PROCEDENCIA } from "@/textos/comun";
import { COMO_FUNCIONA } from "@/textos/entrada";
import { Cadena } from "../cadena";
import { Chip } from "../chip";
import { Marca } from "../marcas";

/**
 * Miniatura (design-system § 5): un gráfico pequeño con su pie de procedencia. `seguida` pinta el contenido
 * y el pie como un solo bloque, sin el hueco de la rejilla (así lo lleva «Medí la brecha» en la maqueta).
 */
function Mini({
  children,
  pie,
  seguida = false,
}: {
  children: ReactNode;
  pie: ReactNode;
  seguida?: boolean;
}) {
  const piePintado = (
    <div className="flex flex-wrap items-center justify-between gap-1.5 text-dato text-tinta-2">
      {pie}
    </div>
  );
  return (
    <div className="grid min-w-0 content-start gap-2.5 rounded-baldosa border border-linea bg-sup-1 px-4 py-3.5">
      {seguida ? (
        <div>
          {children}
          {piePintado}
        </div>
      ) : (
        <>
          {children}
          {piePintado}
        </>
      )}
    </div>
  );
}

/** Planeé: las cinco partes del plan con su cuenta. */
export function MiniPlan({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  return (
    <Mini
      pie={
        <>
          <span>{COMO_FUNCIONA.pieDelPlan[idioma]}</span>
          <Chip procedencia="real">{PROCEDENCIA.real[idioma]}</Chip>
        </>
      }
    >
      <ul className="grid gap-1.75">
        {vista.plan.partes.map((p) => (
          <li
            key={p.clave}
            className="grid grid-cols-[18px_88px_minmax(0,1fr)_18px] items-center gap-2 text-chico"
          >
            <span className="font-mono text-micro font-medium text-tinta-2">
              {p.codigo}
            </span>
            <span>{COMO_FUNCIONA.partesDelPlan[p.clave][idioma]}</span>
            <span
              className="h-1 overflow-hidden rounded-barra bg-linea"
              aria-hidden="true"
            >
              <i
                className="block h-full bg-tinta-2"
                style={{ width: `${Math.round(p.fraccion * 100)}%` }}
              />
            </span>
            <b className="text-right text-chico leading-none font-semibold tabular-nums">
              {p.n}
            </b>
          </li>
        ))}
      </ul>
    </Mini>
  );
}

/** Construí: las piezas del agente, en su orden, con el glifo de su tipo. */
export function MiniAgente({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  return (
    <Mini
      pie={
        <>
          <span>{vista.agente.pie}</span>
          <Chip procedencia="real">{PROCEDENCIA.real[idioma]}</Chip>
        </>
      }
    >
      <div className="pt-1.5 pb-0.5">
        <Cadena nodos={vista.agente.nodos} etiqueta={vista.agente.pie} />
      </div>
    </Mini>
  );
}

/** Medí la brecha: un cuadro por criterio, la leyenda y lo que falló, nombrado. */
export function MiniBrecha({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  const b = vista.brecha;
  return (
    <Mini
      seguida
      pie={
        <>
          <span>{b.pie}</span>
          <Chip procedencia="real">{PROCEDENCIA.real[idioma]}</Chip>
        </>
      }
    >
      <div
        className="flex flex-wrap gap-1"
        role="img"
        aria-label={b.etiquetaCuadros}
      >
        {b.cuadros.map((c) => (
          <span
            key={c.id}
            data-v={c.estado === "sin-probar" ? "neutro" : c.estado}
            className="grid size-6.5 place-items-center rounded-chip border border-v bg-vt"
          >
            <Marca
              tipo={
                c.estado === "cumple"
                  ? "cumple"
                  : c.estado === "no-cumple"
                    ? "no-cumple"
                    : "falta"
              }
              tam={12}
              className="text-v"
            />
          </span>
        ))}
      </div>
      <p className="text-chico text-tinta-2">
        <Destacado texto={b.leyenda.criteriosCumplen} /> ·{" "}
        <Destacado texto={b.leyenda.riesgosOcurren} />
      </p>
      {b.fallas.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-dato leading-normal">
          {b.fallas.map((f) => (
            <li
              key={f.texto}
              className="grid grid-cols-[14px_minmax(0,1fr)] gap-1.5"
            >
              <Marca
                tipo={f.tipo === "fallo" ? "no-cumple" : "falta"}
                tam={12}
                className="mt-0.5"
              />
              <span>{f.texto}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Mini>
  );
}

/** «9 de 9 criterios cumplen»: la cifra inicial en tinta-1, el resto en tinta-2. */
function Destacado({ texto }: { texto: string }) {
  const m = texto.match(/^(\d+)(\s\S+\s)(\d+)(.*)$/u);
  if (!m) return <>{texto}</>;
  return (
    <>
      <b className="font-semibold text-tinta-1">{m[1]}</b>
      {m[2]}
      {m[3]}
      {m[4]}
    </>
  );
}
