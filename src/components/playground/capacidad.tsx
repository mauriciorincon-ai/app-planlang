"use client";

/**
 * El control de la capacidad del auditor del P5 Playground (S9, ADR-019): cuántas solicitudes atiende el auditor por día
 * hábil. Los umbrales mueven cuántas van a una persona; la capacidad mueve cuánto esperan, y la espera decide si se
 * cumple el plazo legal. El cálculo es la cola de `core/plazos` sobre las llegadas simuladas del lote
 * (`consecuencias(...).plazos`): el mismo código que el informe, en el navegador, sin modelo. El color nunca va solo:
 * cada estado lleva su símbolo y su texto.
 */
import { useId } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { PlazosCompacto } from "@core/playground/compacto";
import type { ConsecuenciasDePlazos } from "@core/playground/consecuencias";
import { decimal, enumerar } from "@/lib/vista/formato";
import type { DatosPlazosIsla } from "@/lib/vista/playground";
import { JUEGO, PLAZOS } from "@/textos/playground";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Marca } from "../marcas";
import { Seccion } from "../seccion";

const MONO = "font-mono text-dato leading-normal [overflow-wrap:anywhere]";
const TARDIAS_A_LA_VISTA = 5;

export function CapacidadDelAuditor({
  plazos,
  config,
  valor,
  alCambiar,
  r,
  noObservados,
  i,
}: {
  plazos: DatosPlazosIsla;
  config: PlazosCompacto;
  valor: number;
  alCambiar: (x: number) => void;
  r: ConsecuenciasDePlazos;
  noObservados: number;
  i: Idioma;
}) {
  const id = useId();
  const cap = config.capacidad;
  const movido = valor !== cap.valor;
  const pct = ((cap.valor - cap.min) / (cap.max - cap.min)) * 100;
  const nota = `${id}-nota`;
  const unidad = plazos.unidad;
  const fmt = (x: number) => decimal(x, 0, i);
  const clase = new Map(plazos.clases.map((k) => [k.valor, k]));
  const tardias = r.tardias.length;
  const minima = r.capacidad_minima;
  return (
    <Seccion
      id="s-plazos-t"
      titulo={PLAZOS.titulo[i]}
      cabecera={<Chip procedencia="real">{PLAZOS.chip[i]}</Chip>}
    >
      <div className="grid grid-cols-1 items-start gap-6 amplio:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div
          id="w-capacidad"
          data-movido={movido}
          className={cx(
            "grid gap-2 rounded-baldosa border bg-sup-1 px-4 py-3.5",
            movido ? "border-tinta-2" : "border-linea",
          )}
        >
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={id} className="text-chico font-semibold">
              {PLAZOS.nombre[i]}
            </label>
            <output
              htmlFor={id}
              aria-live="off"
              className="text-cifra-chica font-semibold tabular-nums"
            >
              {fmt(valor)}
            </output>
          </div>
          <span className={cx(MONO, "text-tinta-2")}>
            {PLAZOS.valor({ v: fmt(valor), unidad })[i]}
          </span>
          <div className="relative pt-1 pb-5">
            <input
              id={id}
              type="range"
              min={cap.min}
              max={cap.max}
              step={cap.paso}
              value={valor}
              aria-valuetext={PLAZOS.valor({ v: fmt(valor), unidad })[i]}
              aria-describedby={nota}
              onChange={(e) => alCambiar(Number(e.target.value))}
              className={cx(
                "relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent",
                "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-barra [&::-webkit-slider-runnable-track]:bg-linea",
                "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:size-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-tinta-1 [&::-webkit-slider-thumb]:bg-fondo",
                "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-barra [&::-moz-range-track]:bg-linea",
                "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-tinta-1 [&::-moz-range-thumb]:bg-fondo",
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tinta-1",
              )}
            />
            <span
              aria-hidden="true"
              className="absolute top-7 -translate-x-1/2 text-center font-mono text-micro leading-none whitespace-nowrap text-tinta-2"
              style={{ left: `calc(${pct}% + ${9 - (pct / 100) * 18}px)` }}
            >
              <span className="mx-auto mb-0.5 block h-1.5 w-px bg-tinta-2" />
              {JUEGO.plan(fmt(cap.valor))[i]}
            </span>
          </div>
          <div className="flex justify-between font-mono text-dato text-tinta-2">
            <span>{fmt(cap.min)}</span>
            <span>{fmt(cap.max)}</span>
          </div>
          <p id={nota} className="text-chico text-tinta-2">
            {plazos.descripcion}
          </p>
          <span
            className={cx(
              "solo-experto cambia-perfil rounded-r-control border-l-2 border-l-tinta-2 bg-sup-2 px-2.5 py-1.5",
              MONO,
              "text-tinta-2",
            )}
          >
            {plazos.experto}
          </span>
          <span hidden={!movido} className="justify-self-start">
            <Chip procedencia="declarado">
              {JUEGO.movido(fmt(cap.valor))[i]}
            </Chip>
          </span>
        </div>

        <div
          id="k-plazos"
          className="grid gap-3 rounded-baldosa border border-linea bg-sup-1 p-4"
        >
          <p
            role="status"
            aria-live="polite"
            data-v={tardias === 0 ? "cumple" : "no-cumple"}
            className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 text-texto leading-[1.5] font-semibold"
          >
            <Marca
              tipo={tardias === 0 ? "cumple" : "no-cumple"}
              tam={15}
              className="mt-1 text-v"
            />
            <span id="k-plazos-frase">
              {
                (tardias === 0
                  ? PLAZOS.todasEnPlazo({ cap: fmt(valor), unidad })
                  : PLAZOS.salenDePlazo({
                      n: tardias,
                      cap: fmt(valor),
                      unidad,
                    }))[i]
              }
            </span>
          </p>
          {r.en_cola === 0 ? (
            <p className="text-chico text-tinta-2">{PLAZOS.sinCola[i]}</p>
          ) : null}
          {/* En el teléfono, una tarjeta por clase (como las tablas de la Brecha): seis columnas no caben en 380 px. */}
          <div className="grid gap-2 escritorio:hidden" data-vista="tarjetas">
            {r.clases.map((k) => {
              const c = clase.get(k.clase)!;
              return (
                <dl
                  key={k.clase}
                  data-clase={k.clase}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 rounded-control border border-linea p-3 text-chico"
                >
                  <dt className="col-span-2 font-semibold">{c.nombre}</dt>
                  <dt className="text-tinta-2">{PLAZOS.cabecera[1]![i]}</dt>
                  <dd>{c.plazo}</dd>
                  <dt className="text-tinta-2">{PLAZOS.cabecera[2]![i]}</dt>
                  <dd className="tabular-nums">
                    {fmt(k.en_cola)} / {fmt(k.n)}
                  </dd>
                  <dt className="text-tinta-2">{PLAZOS.cabecera[3]![i]}</dt>
                  <dd
                    className="tabular-nums"
                    data-v={k.tardias === 0 ? "cumple" : "no-cumple"}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Marca
                        tipo={k.tardias === 0 ? "cumple" : "no-cumple"}
                        tam={13}
                        className="text-v"
                      />
                      {fmt(k.tardias)} ·{" "}
                      {(k.tardias === 0 ? PLAZOS.enPlazo : PLAZOS.fuera)[i]}
                    </span>
                  </dd>
                  <dt className="text-tinta-2">{PLAZOS.cabecera[4]![i]}</dt>
                  <dd className="tabular-nums">
                    {PLAZOS.duracion(k.espera_mediana_min)[i]}
                  </dd>
                  <dt className="text-tinta-2">{PLAZOS.cabecera[5]![i]}</dt>
                  <dd className="tabular-nums">
                    {PLAZOS.duracion(k.espera_max_min)[i]}
                  </dd>
                </dl>
              );
            })}
          </div>
          <div
            className="hidden overflow-x-auto escritorio:block"
            role="region"
            tabIndex={0}
            aria-label={PLAZOS.tablaEtiqueta[i]}
          >
            <table className="w-full min-w-[34rem] border-collapse text-chico">
              <caption className="sr-only">{PLAZOS.titulo[i]}</caption>
              <thead>
                <tr className="text-left text-dato text-tinta-2">
                  {PLAZOS.cabecera.map((h) => (
                    <th
                      key={h.es}
                      scope="col"
                      className="py-1.5 pr-3 font-semibold"
                    >
                      {h[i]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.clases.map((k) => {
                  const c = clase.get(k.clase)!;
                  return (
                    <tr
                      key={k.clase}
                      data-clase={k.clase}
                      className="border-t border-linea"
                    >
                      <th
                        scope="row"
                        className="py-1.5 pr-3 text-left font-semibold"
                      >
                        {c.nombre}
                      </th>
                      <td className="py-1.5 pr-3">{c.plazo}</td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {fmt(k.en_cola)} / {fmt(k.n)}
                      </td>
                      <td
                        className="py-1.5 pr-3 tabular-nums"
                        data-v={k.tardias === 0 ? "cumple" : "no-cumple"}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Marca
                            tipo={k.tardias === 0 ? "cumple" : "no-cumple"}
                            tam={13}
                            className="text-v"
                          />
                          {fmt(k.tardias)} ·{" "}
                          <span className="text-tinta-2">
                            {
                              (k.tardias === 0 ? PLAZOS.enPlazo : PLAZOS.fuera)[
                                i
                              ]
                            }
                          </span>
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 tabular-nums">
                        {PLAZOS.duracion(k.espera_mediana_min)[i]}
                      </td>
                      <td className="py-1.5 tabular-nums">
                        {PLAZOS.duracion(k.espera_max_min)[i]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tardias > 0 ? (
            <ul className="solo-experto grid gap-0.5 text-dato text-tinta-2">
              {r.tardias.slice(0, TARDIAS_A_LA_VISTA).map((x) => (
                <li key={x.caso_id} className={MONO}>
                  {
                    PLAZOS.tardia({
                      id: x.caso_id,
                      espera: PLAZOS.duracion(x.espera_min)[i],
                      plazo: PLAZOS.duracion(x.plazo_min)[i],
                    })[i]
                  }
                </li>
              ))}
              {tardias > TARDIAS_A_LA_VISTA ? (
                <li>{PLAZOS.masTardias(tardias - TARDIAS_A_LA_VISTA)[i]}</li>
              ) : null}
            </ul>
          ) : null}
          <p id="k-plazos-rompe" className="text-chico">
            {
              (minima
                ? PLAZOS.rompe({
                    minima: fmt(minima.valor),
                    unidad,
                    uno:
                      minima.tardias_con_una_menos === null
                        ? null
                        : String(minima.tardias_con_una_menos),
                    fuera: minima.valor < cap.min,
                    rango: `${fmt(cap.min)}–${fmt(cap.max)}`,
                  })
                : PLAZOS.noSeCumple({ max: fmt(cap.max), unidad }))[i]
            }
          </p>
          {noObservados > 0 ? (
            <p className="text-dato text-tinta-2">{PLAZOS.sinMedir[i]}</p>
          ) : null}
          <p className="solo-experto text-dato text-tinta-2">{plazos.fuente}</p>
          <span className="sr-only">
            {enumerar(
              plazos.clases.map((k) => k.nombre),
              i,
            )}
          </span>
        </div>
      </div>
    </Seccion>
  );
}
