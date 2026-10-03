import { ArrowRight, Landmark, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import { ruta } from "@/lib/ruta";
import type { VistaEntrada } from "@/lib/vista/entrada";
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
  beta = false,
}: {
  icono: typeof Stethoscope;
  nombre: string;
  texto: string;
  beta?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Baldosa icono={icono} />
      <div className="min-w-0">
        <h3 className={cx("text-sub font-semibold", beta && "text-tinta-2")}>
          {nombre}
        </h3>
        <p className="mt-1 text-apoyo text-tinta-2">{texto}</p>
      </div>
    </div>
  );
}

/**
 * «Los demos»: el A con su veredicto y su corrida reales; el B, en construcción, sin nada simulado; y lo demás del
 * roadmap (el entrevistador primero), también en construcción.
 */
export function Demos({
  vista,
  idioma,
}: {
  vista: VistaEntrada;
  idioma: Idioma;
}) {
  const c = DEMOS.columnas;
  const valor = vista.veredicto.valor;
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
        <div role="row" className={FILA}>
          <Celda>
            <NombreDemo
              icono={Stethoscope}
              nombre={DEMOS.demoA[idioma]}
              texto={LIDER.demoA[idioma]}
            />
          </Celda>
          <Celda etiqueta={c.veredicto[idioma]}>
            <div className="grid justify-items-start gap-1.5">
              <Veredicto clase={claseDeVeredicto(valor)}>
                {VEREDICTOS[valor][idioma]}
              </Veredicto>
              <span className="text-chico text-tinta-2">
                {vista.veredicto.detalle}
              </span>
              <Chip procedencia="real">{DEMOS.chipInforme[idioma]}</Chip>
            </div>
          </Celda>
          <Celda etiqueta={c.corrida[idioma]}>
            <span className="font-mono text-dato leading-normal text-tinta-1">
              {vista.corrida.texto}
            </span>
            <Chip procedencia="real">{vista.corrida.chip}</Chip>
          </Celda>
          <Celda etiqueta={c.abrir[idioma]}>
            <BotonEnlace href={ruta(idioma, "brecha")} principal chico>
              {DEMOS.brecha[idioma]}
              <Icono de={ArrowRight} tam={15} />
            </BotonEnlace>
            <span className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-chico">
              <a
                className="text-tinta-2 hover:text-tinta-1"
                href={ruta(idioma, "plan")}
              >
                {PESTANAS.plan[idioma]}
              </a>
              <a
                className="text-tinta-2 hover:text-tinta-1"
                href={ruta(idioma, "agente")}
              >
                {DEMOS.agente[idioma]}
              </a>
              <a
                className="text-tinta-2 hover:text-tinta-1"
                href={ruta(idioma, "playground")}
              >
                {PESTANAS.playground[idioma]}
              </a>
              <a
                className="text-tinta-2 hover:text-tinta-1"
                href={ruta(idioma, "caso")}
              >
                {DEMOS.unCaso[idioma]}
              </a>
            </span>
          </Celda>
        </div>
        <div role="row" className={FILA}>
          <Celda>
            <NombreDemo
              icono={Landmark}
              nombre={DEMOS.demoB[idioma]}
              texto={LIDER.demoB[idioma]}
              beta
            />
          </Celda>
          <Celda etiqueta={c.veredicto[idioma]}>
            <Veredicto clase="beta">
              {VEREDICTOS.en_construccion[idioma]}
            </Veredicto>
          </Celda>
          <Celda etiqueta={c.corrida[idioma]}>
            <span className="text-chico text-tinta-2">
              {DEMOS.demoBLlega[idioma]}
            </span>
          </Celda>
          <Celda etiqueta={c.abrir[idioma]}>
            <span className="text-chico text-tinta-2">—</span>
          </Celda>
        </div>
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
