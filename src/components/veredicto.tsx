import type { ReactNode } from "react";
import { cx } from "./cx";
import { Marca, type TipoDeMarca } from "./marcas";

export type ClaseDeVeredicto = "cumple" | "alerta" | "no-cumple" | "beta";

const MARCA: Record<ClaseDeVeredicto, TipoDeMarca> = {
  cumple: "cumple",
  alerta: "alerta",
  "no-cumple": "no-cumple",
  beta: "beta",
};

/** El valor del informe → la clase dibujada. */
export function claseDeVeredicto(
  valor: "cumple" | "cumple_con_alertas" | "no_cumple",
): ClaseDeVeredicto {
  return valor === "cumple"
    ? "cumple"
    : valor === "no_cumple"
      ? "no-cumple"
      : "alerta";
}

/**
 * Veredicto: símbolo dibujado + texto + color, nunca el color solo (regla dura 13). El positivo lleva
 * tinte y borde sólido; «en construcción», borde discontinuo (lo que falta se dibuja discontinuo).
 */
export function Veredicto({
  clase,
  chico = false,
  children,
}: {
  clase: ClaseDeVeredicto;
  chico?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      data-v={clase}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-chip border font-medium leading-none whitespace-nowrap text-tinta-1",
        clase === "beta" ? "border-dashed border-tinta-3" : "border-v bg-vt",
        chico
          ? "h-5.5 pr-2 pl-1.25 text-dato"
          : "h-6.5 pr-2.5 pl-1.75 text-chico",
      )}
    >
      <Marca tipo={MARCA[clase]} tam={chico ? 12 : 14} className="text-v" />
      {children}
    </span>
  );
}
