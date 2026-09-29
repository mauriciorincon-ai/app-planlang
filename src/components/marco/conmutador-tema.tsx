"use client";

import { Moon, Sun } from "lucide-react";
import { fijarPreferencia, usePreferencia } from "@/lib/preferencias/cliente";
import { Icono } from "../icono";
import { SEG, SEG_OPCION } from "../segmentado";

/** Tema oscuro / claro. Antes de hidratar ninguno aparece pulsado; el script previo ya pintó el tema correcto. */
export function ConmutadorTema({
  etiqueta,
  oscuro,
  claro,
}: {
  etiqueta: string;
  oscuro: string;
  claro: string;
}) {
  const tema = usePreferencia("tema");
  return (
    <div className={SEG} role="group" aria-label={etiqueta}>
      <button
        type="button"
        className={SEG_OPCION}
        aria-pressed={tema === "oscuro"}
        onClick={() => fijarPreferencia("tema", "oscuro")}
      >
        <Icono de={Moon} tam={13} />
        {oscuro}
      </button>
      <button
        type="button"
        className={SEG_OPCION}
        aria-pressed={tema === "claro"}
        onClick={() => fijarPreferencia("tema", "claro")}
      >
        <Icono de={Sun} tam={13} />
        {claro}
      </button>
    </div>
  );
}
