"use client";

import { Microscope, UserRound } from "lucide-react";
import { fijarPreferencia, usePreferencia } from "@/lib/preferencias/cliente";
import { Icono } from "../icono";
import { SEG, SEG_OPCION } from "../segmentado";

/** «Leer como» líder · experto (design-system § 5): cambia `html[data-perfil]` para la página entera. */
export function LeerComo({
  rotulo,
  lider,
  experto,
  rotuloVisible = true,
}: {
  rotulo: string;
  lider: string;
  experto: string;
  /** En la ficha del agente la maqueta muestra solo los dos botones; el rótulo queda para el lector de pantalla. */
  rotuloVisible?: boolean;
}) {
  const perfil = usePreferencia("perfil");
  return (
    <div className="flex items-center gap-2.5 text-chico text-tinta-2">
      <span id="leer-como-rotulo" className={rotuloVisible ? undefined : "sr-only"}>
        {rotulo}
      </span>
      <div className={SEG} role="group" aria-labelledby="leer-como-rotulo">
        <button
          type="button"
          className={SEG_OPCION}
          data-pref="perfil"
          data-valor="lider"
          aria-pressed={perfil === "lider"}
          onClick={() => fijarPreferencia("perfil", "lider")}
        >
          <Icono de={UserRound} tam={13} />
          {lider}
        </button>
        <button
          type="button"
          className={SEG_OPCION}
          data-pref="perfil"
          data-valor="experto"
          aria-pressed={perfil === "experto"}
          onClick={() => fijarPreferencia("perfil", "experto")}
        >
          <Icono de={Microscope} tam={13} />
          {experto}
        </button>
      </div>
    </div>
  );
}
