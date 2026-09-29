import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * Bloque del experto (design-system § 5, 0.3.1): lo que solo ve el experto, con fondo elevado, filete y el
 * rótulo «Experto» en Inter. Entra con un fundido (nada con movimiento reducido).
 */
export function BloqueExperto({
  rotulo,
  className,
  children,
}: {
  rotulo: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "solo-experto cambia-perfil rounded-r-control border-l-2 border-l-tinta-2 bg-sup-2 px-3 py-2.5",
        className,
      )}
    >
      <p className="mb-1.5 text-dato leading-snug font-medium text-tinta-2">
        {rotulo}
      </p>
      {children}
    </div>
  );
}
