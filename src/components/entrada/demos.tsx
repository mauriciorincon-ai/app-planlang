import {
  ArrowRight,
  Landmark,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma, TextoBilingue } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { ruta } from "@/lib/ruta";
import type { FilaDemo } from "@/lib/vista/entrada";
import { PESTANAS, VEREDICTOS } from "@/textos/comun";
import { DEMOS, EN_CONSTRUCCION, LIDER } from "@/textos/entrada";
import { Baldosa } from "../baldosa";
import { BotonEnlace } from "../boton";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { Seccion } from "../seccion";
import { claseDeVeredicto, Veredicto } from "../veredicto";

const FILA =
  "grid grid-cols-1 items-start gap-3 border-t border-linea py-4 escritorio:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,2.4fr)] escritorio:gap-6";

/** Celda de la tabla de filas: en teléfono cada celda lleva su etiqueta (design-system § 5). */
function Celda({
  etiqueta,
  children,
}: {
  etiqueta?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="cell"
      className="grid min-w-0 content-start justify-items-start gap-1.5"
    >
      {etiqueta ? (
        <span
          className="text-dato text-tinta-2 escritorio:hidden"
          aria-hidden="true"
        >
          {etiqueta}
        </span>
      ) : null}
      {children}
    </div>
  );
}

function NombreDemo({
  icono,
  nombre,
  texto,
}: {
  icono: LucideIcon;
  nombre: string;
  texto: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Baldosa icono={icono} />
      <div className="min-w-0">
        <h3 className="text-sub font-semibold">{nombre}</h3>
        <p className="mt-1 text-apoyo text-tinta-2">{texto}</p>
      </div>
    </div>
  );
}

/** Lo que la fila de cada demo dice de él: su nombre, qué hace y su ícono. */
const IDENTIDAD: Readonly<
  Record<
    IdDemo,
    { nombre: TextoBilingue; texto: TextoBilingue; icono: LucideIcon }
  >
> = {
  "demo-a": { nombre: DEMOS.demoA, texto: LIDER.demoA, icono: Stethoscope },
  "demo-b": { nombre: DEMOS.demoB, texto: LIDER.demoB, icono: Landmark },
};

/**
 * «Los demos»: cada demo con su veredicto y su corrida reales, y lo que sigue del roadmap, en construcción, sin nada
 * simulado.
 */
export function Demos({
  filas,
  idioma,
}: {
  filas: readonly FilaDemo[];
  idioma: Idioma;
}) {
  const c = DEMOS.columnas;
  return (
    <Seccion
      id="s-demos"
      titulo={DEMOS.titulo[idioma]}
      nota={DEMOS.nota[idioma]}
    >
      <div role="table" aria-labelledby="s-demos">
        <div
          role="row"
          className={cx(
            FILA,
            "hidden border-t-0 pt-0 pb-2 text-dato text-tinta-2 escritorio:grid",
          )}
        >
          <span role="columnheader">{c.demo[idioma]}</span>
          <span role="columnheader">{c.veredicto[idioma]}</span>
          <span role="columnheader">{c.corrida[idioma]}</span>
          <span role="columnheader">{c.abrir[idioma]}</span>
        </div>
        {filas.map((f) => {
          const quien = IDENTIDAD[f.id];
          const valor = f.veredicto.valor;
          return (
            <div key={f.id} role="row" data-demo={f.id} className={FILA}>
              <Celda>
                <NombreDemo
                  icono={quien.icono}
                  nombre={quien.nombre[idioma]}
                  texto={quien.texto[idioma]}
                />
              </Celda>
              <Celda etiqueta={c.veredicto[idioma]}>
                <div className="grid justify-items-start gap-1.5">
                  <Veredicto clase={claseDeVeredicto(valor)}>
                    {VEREDICTOS[valor][idioma]}
                  </Veredicto>
                  <span className="text-chico text-tinta-2">
                    {f.veredicto.detalle}
                  </span>
                  <Chip procedencia="real">{DEMOS.chipInforme[idioma]}</Chip>
                </div>
              </Celda>
              <Celda etiqueta={c.corrida[idioma]}>
                <span className="font-mono text-dato leading-normal text-tinta-1">
                  {f.corrida.texto}
                </span>
                <Chip procedencia="real">{f.corrida.chip}</Chip>
              </Celda>
              <Celda etiqueta={c.abrir[idioma]}>
                <BotonEnlace
                  href={ruta(idioma, "brecha", undefined, f.id)}
                  principal
                  chico
                >
                  {DEMOS.brecha[idioma]}
                  <Icono de={ArrowRight} tam={15} />
                </BotonEnlace>
                <span className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-chico">
                  <a
                    className="text-tinta-2 hover:text-tinta-1"
                    href={ruta(idioma, "plan", undefined, f.id)}
                  >
                    {PESTANAS.plan[idioma]}
                  </a>
                  <a
                    className="text-tinta-2 hover:text-tinta-1"
                    href={ruta(idioma, "agente", undefined, f.id)}
                  >
                    {DEMOS.agente[idioma]}
                  </a>
                  <a
                    className="text-tinta-2 hover:text-tinta-1"
                    href={ruta(idioma, "playground", undefined, f.id)}
                  >
                    {PESTANAS.playground[idioma]}
                  </a>
                  <a
                    className="text-tinta-2 hover:text-tinta-1"
                    href={ruta(idioma, "caso", undefined, f.id)}
                  >
                    {DEMOS.unCaso[idioma]}
                  </a>
                </span>
              </Celda>
            </div>
          );
        })}
      </div>
      <div className="mt-2 border-t border-linea pt-4">
        <h3 className="text-sub font-semibold text-tinta-2">
          {EN_CONSTRUCCION.titulo[idioma]}
        </h3>
        <p className="mt-1 text-apoyo text-tinta-2">
          {EN_CONSTRUCCION.nota[idioma]}
        </p>
        <ul className="mt-3 grid gap-2">
          {EN_CONSTRUCCION.items.map((x) => (
            <li
              key={x.id}
              data-roadmap={x.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
            >
              <Veredicto clase="beta" chico>
                {VEREDICTOS.en_construccion[idioma]}
              </Veredicto>
              <span className="text-apoyo text-tinta-2">
                {x.titulo[idioma]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Seccion>
  );
}
