import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SCRIPT_PREVIO } from "@/lib/preferencias/script-previo";
import { inter, mono } from "../fuentes";
import "../globals.css";

export const metadata: Metadata = {
  title: "planlang",
  description:
    "Planeé, construí y medí la brecha · I planned, I built, and I measured the gap",
};

/** Raíz de `/`: la elección de idioma. Las páginas de la vitrina tienen su propia raíz en `[idioma]/`. */
export default function RaizLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PREVIO }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
