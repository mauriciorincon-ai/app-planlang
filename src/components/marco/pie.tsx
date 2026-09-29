import { Info, ShieldCheck } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import { PIE } from "@/textos/comun";
import { CONT, cx } from "../cx";
import { Icono } from "../icono";

/** Pie de toda pantalla: la divulgación completa (datos sintéticos, decisiones simuladas, modelo, marcas). */
export function Pie({ idioma }: { idioma: Idioma }) {
  return (
    <footer className="border-t border-linea pt-6 pb-10 text-chico text-tinta-2">
      <div className={cx(CONT, "grid gap-3 tableta:grid-cols-2 tableta:gap-6")}>
        <p className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5">
          <Icono de={ShieldCheck} className="mt-0.5" />
          <span>
            <b className="font-medium text-tinta-1">{PIE.simulacion[idioma]}</b>{" "}
            {PIE.sintetico[idioma]}
          </span>
        </p>
        <p className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5">
          <Icono de={Info} className="mt-0.5" />
          <span>{PIE.modelo[idioma]}</span>
        </p>
      </div>
    </footer>
  );
}
