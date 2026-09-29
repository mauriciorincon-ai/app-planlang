"use client";

import { Microscope, UserRound } from "lucide-react";
import { useRef } from "react";
import { fijarPreferencia } from "@/lib/preferencias/cliente";
import type { Perfil } from "@/lib/preferencias/claves";
import { claseBoton } from "../boton";
import { cx } from "../cx";
import { Icono } from "../icono";

interface Lado {
  titulo: string;
  texto: string;
  boton: string;
}

const CAJA =
  "cambia-perfil grid grid-cols-[18px_minmax(0,1fr)] items-center gap-3 rounded-control border border-linea px-3.5 py-2.5 text-chico leading-normal text-tinta-2 escritorio:grid-cols-[18px_minmax(0,1fr)_auto]";

/**
 * Aviso de perfil (design-system § 5, 0.3.1): dice qué ve quien lee y ofrece el cambio. Los dos lados se
 * pintan siempre y el atributo del `<html>` oculta uno; al cambiar, el foco pasa al botón del otro lado
 * (el pulsado desaparece y el foco no debe perderse).
 */
export function AvisoPerfil({
  lider,
  experto,
}: {
  lider: Lado;
  experto: Lado;
}) {
  const aLider = useRef<HTMLButtonElement>(null);
  const aExperto = useRef<HTMLButtonElement>(null);
  const cambiar = (p: Perfil) => {
    fijarPreferencia("perfil", p);
    (p === "experto" ? aLider : aExperto).current?.focus();
  };
  return (
    <div role="status">
      <div className={cx("solo-lider", CAJA)}>
        <Icono de={UserRound} tam={18} className="text-tinta-1" />
        <p>
          <b className="font-medium text-tinta-1">{lider.titulo}</b>{" "}
          {lider.texto}
        </p>
        <button
          ref={aExperto}
          type="button"
          className={cx(
            claseBoton({ chico: true }),
            "col-start-2 justify-self-start escritorio:col-start-auto",
          )}
          onClick={() => cambiar("experto")}
        >
          <Icono de={Microscope} tam={15} />
          {lider.boton}
        </button>
      </div>
      <div
        className={cx(
          "solo-experto border-l-2 border-l-tinta-2 bg-sup-2",
          CAJA,
        )}
      >
        <Icono de={Microscope} tam={18} className="text-tinta-1" />
        <p>
          <b className="font-medium text-tinta-1">{experto.titulo}</b>{" "}
          {experto.texto}
        </p>
        <button
          ref={aLider}
          type="button"
          className={cx(
            claseBoton({ chico: true }),
            "col-start-2 justify-self-start escritorio:col-start-auto",
          )}
          onClick={() => cambiar("lider")}
        >
          <Icono de={UserRound} tam={15} />
          {experto.boton}
        </button>
      </div>
    </div>
  );
}
