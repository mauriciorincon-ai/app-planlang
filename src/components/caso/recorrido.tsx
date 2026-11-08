import { ArrowRight, FlaskConical } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { PasoCaso } from "@/lib/vista/caso";
import type { VistaRecorrido } from "@/lib/vista/recorrido";
import { PERFIL } from "@/textos/comun";
import { CAMINA } from "@/textos/recorrido";
import { Lienzo } from "../agente/lienzo";
import { RefNodo } from "../agente/piezas";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";
import { BloqueExperto } from "../perfil/bloque-experto";
import { Seccion } from "../seccion";
import { TablaReglas } from "./caso";
import { ControlRecorrido } from "./control-recorrido";

export const SALTO =
  "sr-only focus:not-sr-only focus:inline-block focus:rounded-control focus:border focus:border-tinta-1 focus:bg-fondo focus:px-3 focus:py-2 focus:text-chico focus:text-tinta-1 focus:outline-2 focus:outline-offset-2 focus:outline-tinta-1";

/**
 * El caso camina (S10): el lienzo del agente con el nodo de cada paso encendido, los controles, el panel del paso
 * (los dos registros, P12) con el contrafactual de cada umbral, y el recorrido en texto (G10) al que lleva «Saltar el
 * diagrama». El estado de cada nodo lo decide el CSS generado por `data-paso`; la transición vive en una hoja aparte
 * con `media="(prefers-reduced-motion: no-preference)"` (G12): con movimiento reducido no hay ninguna animación.
 */
export function RecorridoCaso({
  r,
  pasos,
  idioma: i,
}: {
  r: VistaRecorrido;
  /** Los pasos del recorrido estático del caso, por su orden en la traza: el panel dice lo mismo que ellos. */
  pasos: readonly PasoCaso[];
  idioma: Idioma;
}) {
  const delPaso = new Map(pasos.map((p) => [p.n, p] as const));
  const texto = `${r.contenedor}-texto`;
  return (
    <Seccion
      id="c-camina"
      titulo={CAMINA.titulo[i]}
      cabecera={<Chip procedencia="real">{CAMINA.chip[i]}</Chip>}
    >
      <p className="mb-6 max-w-[72ch] text-texto">{CAMINA.lectura[i]}</p>
      <style>{r.css}</style>
      <style media="(prefers-reduced-motion: no-preference)">
        {r.movimiento}
      </style>
      <ControlRecorrido
        contenedor={r.contenedor}
        ns={r.ns}
        nodos={r.pasos.map((p) => p.nodoMapa)}
        posiciones={r.pasos.map((p) => p.posicion)}
        textos={{
          controles: CAMINA.controles[i],
          anterior: CAMINA.anterior[i],
          siguiente: CAMINA.siguiente[i],
          reproducir: CAMINA.reproducir[i],
          pausar: CAMINA.pausar[i],
          teclado: CAMINA.teclado[i],
        }}
      >
        <a href={`#${texto}`} className={SALTO}>
          {CAMINA.saltar[i]}
        </a>
        <Lienzo
          svg={r.lienzo.svg}
          columnas={r.lienzo.columnas}
          region={CAMINA.region[i]}
          indice={CAMINA.indice[i]}
          irACapa={CAMINA.irACapa[i]}
          seleccionable={false}
        />
        <p className="flex flex-wrap gap-x-5 gap-y-1 text-dato text-tinta-2">
          <span>{CAMINA.leyenda.activo[i]}</span>
          <span>{CAMINA.leyenda.visitado[i]}</span>
          <span>{CAMINA.leyenda.pendiente[i]}</span>
        </p>
        {r.pasos.map((p) => {
          const c = delPaso.get(p.orden);
          return (
            <article
              key={p.k}
              data-panel={p.k}
              aria-label={p.posicion}
              className="gap-3 rounded-control border border-linea bg-sup-1 px-4 py-3.5 text-chico leading-relaxed"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-dato text-tinta-2">
                    {CAMINA.paso({ k: p.k })[i]}
                  </span>
                  <RefNodo nombre={p.nodo} tipo={c?.tipo ?? ""} />
                </span>
                {c ? (
                  <span className="font-mono text-dato text-tinta-2">
                    {c.medida}
                  </span>
                ) : null}
              </div>
              {c ? <p>{c.hizo}</p> : null}
              {c?.rama ? (
                <p className="flex items-start gap-2 text-tinta-1">
                  <Icono de={ArrowRight} tam={14} className="mt-0.75" />
                  {c.rama}
                </p>
              ) : null}
              {p.pausa ? <p className="text-tinta-1">{p.pausa}</p> : null}
              {p.contrafactuales.length ? (
                <div className="grid gap-2 border-l-2 border-tinta-3 pl-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <Icono de={FlaskConical} tam={14} />
                    {CAMINA.contrafactual[i]}
                  </p>
                  {p.contrafactuales.map((x) => (
                    <p key={x.umbral} data-contrafactual={x.umbral}>
                      {x.texto}{" "}
                      {x.enlace ? (
                        <a
                          href={x.enlace}
                          className="font-medium text-tinta-1 underline underline-offset-3"
                        >
                          {x.probar} →
                        </a>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}
              {p.sinUmbral ? (
                <p className="solo-experto text-tinta-2">{p.sinUmbral}</p>
              ) : null}
              {c?.reglas.length ? (
                <BloqueExperto rotulo={PERFIL.experto[i]} sutil>
                  <TablaReglas reglas={c.reglas} idioma={i} />
                </BloqueExperto>
              ) : null}
            </article>
          );
        })}
      </ControlRecorrido>
      <h3 id={texto} className="mt-8 mb-2 text-sub font-semibold">
        {CAMINA.equivalente[i]}
      </h3>
      <ol data-equivalente className="grid list-none gap-0 p-0">
        {r.pasos.map((p) => {
          const c = delPaso.get(p.orden);
          return (
            <li
              key={p.k}
              data-paso-texto={p.k}
              className={cx(
                "grid grid-cols-[28px_minmax(0,1fr)] gap-x-3.5 border-t border-linea py-2.5 text-chico leading-[1.55]",
              )}
            >
              <span className="font-mono text-dato text-tinta-2">{p.k}</span>
              <span>
                <RefNodo nombre={p.nodo} tipo={c?.tipo ?? ""} />{" "}
                {c ? c.hizo : null}
                {c?.rama ? ` ${c.rama}` : null}
              </span>
            </li>
          );
        })}
      </ol>
    </Seccion>
  );
}
