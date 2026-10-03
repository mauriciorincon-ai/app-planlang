import { FlaskConical } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { ROTULO } from "@/textos/comun";
import { CONT, cx } from "../cx";
import { Icono } from "../icono";

/** Rótulo: primera franja de TODA pantalla (regla dura 14): simulación, no operativo, datos sintéticos. */
export function Rotulo({ idioma }: { idioma: Idioma }) {
  return (
    <section
      aria-label={ROTULO.region[idioma]}
      className="border-b border-linea text-dato text-tinta-2"
      data-rotulo
    >
      <div
        className={cx(
          CONT,
          "flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.75",
        )}
      >
        <span className="inline-flex items-center gap-1.5 font-medium text-tinta-1">
          <Icono de={FlaskConical} tam={14} />
          {ROTULO.simulacion[idioma]}
        </span>
        <span>{ROTULO.divulgacion[idioma]}</span>
      </div>
    </section>
  );
}

/**
 * El rótulo en los dos idiomas a la vez, cada texto con su `lang`: para las páginas que no saben el idioma de quien
 * llega (la raíz `/` que lo elige y la 404 global). Lleva lo mismo que `Rotulo`: simulación y divulgación
 * (AU-S2-13, AU-S2-B16).
 */
export function RotuloBilingue() {
  return (
    <section
      aria-label={`${ROTULO.region.es} / ${ROTULO.region.en}`}
      className="border-b border-linea text-dato text-tinta-2"
      data-rotulo
    >
      <div
        className={cx(
          CONT,
          "flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.75",
        )}
      >
        <span className="inline-flex flex-wrap items-center gap-1.5 font-medium text-tinta-1">
          <Icono de={FlaskConical} tam={14} />
          <span lang="es">{ROTULO.simulacion.es}</span>
          <span aria-hidden="true">/</span>
          <span lang="en">{ROTULO.simulacion.en}</span>
        </span>
        <span>
          <span lang="es">{ROTULO.divulgacion.es}</span>
          <span aria-hidden="true"> / </span>
          <span lang="en">{ROTULO.divulgacion.en}</span>
        </span>
      </div>
    </section>
  );
}
