import { ArrowRight, Compass, Eye, ListChecks } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { ruta } from "@/lib/ruta";
import { porcentaje } from "@/lib/vista/formato";
import { PROCEDENCIA } from "@/textos/comun";
import { GANCHO, LIDER, PORTADA } from "@/textos/entrada";
import { BotonEnlace } from "../boton";
import { Chip } from "../chip";
import { cx } from "../cx";
import { Icono } from "../icono";

const ICONOS_GANCHO = [Eye, ListChecks];

const FILA =
  "grid grid-cols-[76px_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5 border-t border-linea py-3";
const CIFRA = "text-cifra font-semibold tracking-cifra tabular-nums";
const BARRA = "col-start-2 h-1 overflow-hidden rounded-barra";

/** La portada: la tesis a la izquierda y, a la derecha, el gancho con su fuente. */
export function Portada({ idioma }: { idioma: Idioma }) {
  return (
    <section
      aria-labelledby="p1-titulo"
      className="grid grid-cols-1 items-start gap-6 py-8 escritorio:grid-cols-12 escritorio:pt-14 escritorio:pb-12"
    >
      <div className="escritorio:col-span-7">
        <p className="mb-3 text-chico text-tinta-2">
          {PORTADA.antetitulo[idioma]}
        </p>
        <h1 id="p1-titulo" className="text-titulo text-balance">
          {PORTADA.titulo[idioma]}
        </h1>
        <p className="mt-4 max-w-guia text-guia text-tinta-2">
          {LIDER.guia[idioma]}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <BotonEnlace href={ruta(idioma, "brecha")} principal>
            {PORTADA.verBrecha[idioma]}
            <Icono de={ArrowRight} tam={15} />
          </BotonEnlace>
          <BotonEnlace href={ruta(idioma, "plan")}>
            {PORTADA.recorrerPlan[idioma]}
          </BotonEnlace>
        </div>
      </div>
      <aside
        aria-labelledby="gancho-t"
        className="mt-3 escritorio:col-span-4 escritorio:col-start-9 escritorio:mt-0 escritorio:border-l escritorio:border-linea escritorio:pl-6"
      >
        <p id="gancho-t" className="mb-2 text-chico text-tinta-2">
          {GANCHO.titulo[idioma]}
        </p>
        {GANCHO.filas.map((f, i) => (
          <div key={f.texto.es} className={FILA}>
            <b className={CIFRA}>{porcentaje(f.cifra, idioma)}</b>
            <span className="inline-flex items-center gap-1.75 text-apoyo leading-snug">
              <Icono
                de={ICONOS_GANCHO[i] ?? Eye}
                tam={15}
                className="text-tinta-2"
              />
              <span>{f.texto[idioma]}</span>
            </span>
            <span className={cx(BARRA, "bg-linea")} aria-hidden="true">
              <i
                className="block h-full bg-tinta-2"
                style={{ width: `${Math.round(f.cifra * 100)}%` }}
              />
            </span>
          </div>
        ))}
        <div className={FILA}>
          <b className={cx(CIFRA, "text-tinta-2")}>—</b>
          <span className="text-apoyo leading-snug">
            <span className="inline-flex items-center gap-1.75">
              <Icono de={Compass} tam={15} className="text-tinta-2" />
              <span>{GANCHO.nadie[idioma]}</span>
            </span>
            <small className="block pl-5.5 text-dato text-tinta-2">
              {GANCHO.nadieNota[idioma]}
            </small>
          </span>
          <span
            className={cx(BARRA, "border border-dashed border-tinta-3")}
            aria-hidden="true"
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
          <span>{GANCHO.fuente[idioma]}</span>
          <Chip procedencia="fuente">{PROCEDENCIA.fuente[idioma]}</Chip>
        </p>
      </aside>
    </section>
  );
}
