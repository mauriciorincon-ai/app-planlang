"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { claseBoton } from "./boton";
import { cx } from "./cx";
import { Icono } from "./icono";

/**
 * «Ver N más»: lo que no se ve de entrada ya viene pintado y oculto con `hidden`; el botón lo abre y lo cierra
 * (la forma del árbol no cambia, regla 5-a). Sin JS queda cerrado, como en la maqueta.
 */
export function VerMas({
  id,
  mas,
  menos,
  children,
}: {
  id: string;
  mas: string;
  menos: string;
  children: ReactNode;
}) {
  const [abierto, fijar] = useState(false);
  return (
    <>
      <div id={id} hidden={!abierto}>
        {children}
      </div>
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => fijar(!abierto)}
        className={cx(claseBoton({ chico: true }), "mt-3 justify-self-start")}
      >
        <Icono
          de={ChevronDown}
          tam={14}
          className={cx("transition-transform", abierto && "rotate-180")}
        />
        {abierto ? menos : mas}
      </button>
    </>
  );
}
