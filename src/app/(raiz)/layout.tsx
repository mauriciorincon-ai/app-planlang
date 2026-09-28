import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = {
  title: "planlang",
  description:
    "Planeé, construí y medí la brecha · I planned, built and measured the gap",
};

/** Raíz de `/`: la elección de idioma. Las páginas de la vitrina tienen su propia raíz en `[idioma]/`. */
export default function RaizLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
