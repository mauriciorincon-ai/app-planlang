import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";
import { Icono } from "./icono";

/** Baldosa: el ícono dentro de un cuadro de 36 px (28 la chica). Marca el inicio de un bloque; nunca decora. */
export function Baldosa({
  icono,
  chica = false,
}: {
  icono: LucideIcon;
  chica?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-grid flex-none place-items-center border border-linea bg-sup-2 text-tinta-1",
        chica ? "size-7 rounded-control" : "size-9 rounded-baldosa",
      )}
    >
      <Icono de={icono} tam={chica ? 15 : 18} />
    </span>
  );
}
