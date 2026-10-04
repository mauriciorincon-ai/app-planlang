"use client";

import { Code, ListChecks, Microscope, UserRound } from "lucide-react";
import { fijarPreferencia, usePreferencia } from "@/lib/preferencias/cliente";
import type { Perfil } from "@/lib/preferencias/claves";
import { Icono } from "../icono";
import { SEG, SEG_OPCION } from "../segmentado";
import { useVistas } from "../vistas";

/**
 * Las pestañas de un panel del detalle: Líder · Experto · Código · Trazas. Líder y Experto son el perfil de la
 * página entera (el mismo de «Leer como»): elegirlos cambia `html[data-perfil]` y vuelve el panel a su vista de
 * perfil. Código y Trazas son del panel. Antes de hidratar, la pestaña del perfil se pinta desde el atributo del
 * `<html>` (base.css), sin destello.
 */
export function PestanasPanel({
  rotulo,
  lider,
  experto,
  codigo,
  trazas,
}: {
  rotulo: string;
  lider: string;
  experto: string;
  codigo: string;
  trazas: string;
}) {
  const { vista, fijar } = useVistas();
  const perfil = usePreferencia("perfil");
  const aPerfil = (p: Perfil) => {
    fijarPreferencia("perfil", p);
    fijar("perfil");
  };
  const enPerfil = vista === "perfil";
  return (
    <div
      className={`${SEG} flex-wrap justify-self-start`}
      role="group"
      aria-label={rotulo}
      data-vista-actual={vista}
    >
      <button
        type="button"
        className={SEG_OPCION}
        data-pref="perfil"
        data-valor="lider"
        aria-pressed={enPerfil && perfil === "lider"}
        onClick={() => aPerfil("lider")}
      >
        <Icono de={UserRound} tam={13} />
        {lider}
      </button>
      <button
        type="button"
        className={SEG_OPCION}
        data-pref="perfil"
        data-valor="experto"
        aria-pressed={enPerfil && perfil === "experto"}
        onClick={() => aPerfil("experto")}
      >
        <Icono de={Microscope} tam={13} />
        {experto}
      </button>
      <button
        type="button"
        className={SEG_OPCION}
        aria-pressed={vista === "codigo"}
        onClick={() => fijar("codigo")}
      >
        <Icono de={Code} tam={13} />
        {codigo}
      </button>
      <button
        type="button"
        className={SEG_OPCION}
        aria-pressed={vista === "trazas"}
        onClick={() => fijar("trazas")}
      >
        <Icono de={ListChecks} tam={13} />
        {trazas}
      </button>
    </div>
  );
}
