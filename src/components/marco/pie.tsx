import { Info, ShieldCheck } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { PIE } from "@/textos/comun";
import { CONT, cx } from "../cx";
import { Icono } from "../icono";

/**
 * Pie de toda pantalla: la divulgación completa (datos sintéticos, decisiones simuladas, modelo, marcas). Una
 * pantalla que muestra una corrida dice cuál en `corrida`, en lugar de la frase general del modelo. Lo sintético y
 * quién decidiría en producción son del demo de la pantalla; sin demo (la entrada), se dicen los dos.
 */
export function Pie({
  idioma,
  demo,
  corrida,
}: {
  idioma: Idioma;
  demo?: IdDemo;
  corrida?: string;
}) {
  return (
    <footer className="border-t border-linea pt-6 pb-10 text-chico text-tinta-2">
      <div className={cx(CONT, "grid gap-3 tableta:grid-cols-2 tableta:gap-6")}>
        <p className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5">
          <Icono de={ShieldCheck} className="mt-0.5" />
          <span>
            <b className="font-medium text-tinta-1">{PIE.simulacion[idioma]}</b>{" "}
            {PIE.sintetico[demo ?? "ambos"][idioma]}
          </span>
        </p>
        <p className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5">
          <Icono de={Info} className="mt-0.5" />
          <span>
            {corrida ? `${corrida} ${PIE.marcas[idioma]}` : PIE.modelo[idioma]}
          </span>
        </p>
      </div>
    </footer>
  );
}
