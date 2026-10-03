import type { ReactNode } from "react";
import { cx } from "./cx";

/** Botón (design-system § 5): principal (tinta-1 llena, uno por vista), secundario (borde) y chico. */
export function claseBoton({
  principal = false,
  chico = false,
}: {
  principal?: boolean;
  chico?: boolean;
}) {
  return cx(
    "inline-flex items-center gap-2 rounded-control border font-medium leading-none whitespace-nowrap no-underline transition-colors",
    principal
      ? "border-tinta-1 bg-tinta-1 text-fondo"
      : "border-tinta-3 bg-transparent text-tinta-1 hover:border-tinta-2",
    chico ? "h-8 px-3 text-chico" : "h-9 px-3.5 text-apoyo",
    // Deshabilitado (design-system § 5): borde punteado, tinta secundaria y sin relleno, para que no se lea igual
    // que el habilitado sin depender del color (AU-S2-B23).
    "disabled:cursor-not-allowed disabled:border-dashed disabled:border-tinta-2 disabled:bg-transparent disabled:text-tinta-2",
  );
}

/** Enlace con forma de botón: la vitrina navega entre páginas con `<a>` (ADR-008). */
export function BotonEnlace({
  href,
  principal,
  chico,
  children,
}: {
  href: string;
  principal?: boolean;
  chico?: boolean;
  children: ReactNode;
}) {
  return (
    <a href={href} className={claseBoton({ principal, chico })}>
      {children}
    </a>
  );
}
