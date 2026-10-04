import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * Bloque del experto (design-system § 5, 0.3.1): lo que solo ve el experto, con fondo elevado, filete y el
 * rótulo «Experto» en Inter. Entra con un fundido (nada con movimiento reducido).
 */
export function BloqueExperto({
  rotulo,
  sutil = false,
  className,
  children,
}: {
  rotulo: string;
  /** Dentro de un bloque que ya es del experto (la tabla de un paso): sin rótulo y con menos aire. */
  sutil?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "solo-experto cambia-perfil rounded-r-control border-l-2 border-l-tinta-2 bg-sup-2",
        sutil ? "mt-1.5 px-2 py-1" : "px-3 py-2.5",
        className,
      )}
    >
      {sutil ? null : (
        <p className="mb-1.5 text-dato leading-snug font-medium text-tinta-2">
          {rotulo}
        </p>
      )}
      {children}
    </div>
  );
}
