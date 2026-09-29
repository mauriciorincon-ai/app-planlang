import type { ReactNode } from "react";
import { Marca } from "./marcas";

export type Procedencia = "real" | "maqueta" | "fuente" | "declarado";

/**
 * Chip de procedencia (design-system § 5): toda cifra dice de dónde sale. «real» y «fuente» llevan el
 * punto lleno; «maqueta», el discontinuo (lo que no es real se dibuja discontinuo); «declarado», ninguno.
 */
export function Chip({
  procedencia,
  children,
}: {
  procedencia: Procedencia;
  children: ReactNode;
}) {
  return (
    <span
      data-procedencia={procedencia}
      className="inline-flex h-5 items-center gap-1.25 rounded-chip border border-tinta-3 px-1.75 text-dato leading-none font-medium whitespace-nowrap text-tinta-2"
    >
      {procedencia === "declarado" ? null : (
        <Marca tipo={procedencia === "maqueta" ? "maqueta" : "real"} tam={9} />
      )}
      {children}
    </span>
  );
}
