import type { ReactNode } from "react";
import { Marca } from "./marcas";

/**
 * Chip de «sin probar»: borde discontinuo y la marca de lo que falta (lo que no se midió se dibuja discontinuo). Vive
 * aparte para que la isla del playground lo use sin arrastrar la vista de Brecha al navegador.
 */
export function SinProbar({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5.5 items-center gap-1.5 rounded-chip border border-dashed border-tinta-3 pr-2 pl-1.25 text-dato leading-none font-medium whitespace-nowrap text-tinta-1">
      <Marca tipo="falta" tam={12} className="text-tinta-2" />
      {children}
    </span>
  );
}
