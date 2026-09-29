import { FlaskConical } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { ROTULO } from "@/textos/comun";
import { CONT, cx } from "../cx";
import { Icono } from "../icono";

/** Rótulo: primera franja de TODA pantalla (regla dura 14): simulación, no operativo, datos sintéticos. */
export function Rotulo({ idioma }: { idioma: Idioma }) {
  return (
    <div className="border-b border-linea text-dato text-tinta-2" data-rotulo>
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
    </div>
  );
}
