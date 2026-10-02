import type { Metadata } from "next";
import { CONT, cx } from "@/components/cx";
import { MarcaPlanlang } from "@/components/marcas";
import { SCRIPT_PREVIO } from "@/lib/preferencias/script-previo";
import { NO_ENCONTRADA } from "@/textos/comun";
import { inter, mono } from "./fuentes";
import "./globals.css";
import { ruta } from "@/lib/ruta";

export const metadata: Metadata = {
  title: "planlang · 404",
};

/**
 * 404 de toda la vitrina (la app tiene dos raíces, `(raiz)` y `[idioma]`: Next lo exige global). No sabe el
 * idioma de quien llega, así que dice lo mismo en los dos, cada texto con su `lang`.
 */
export default function NoEncontrada() {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PREVIO }} />
      </head>
      <body>
        <main className={cx(CONT, "grid justify-items-start gap-4 py-14")}>
          <p className="inline-flex items-center gap-2 text-sub font-semibold tracking-apretado">
            <MarcaPlanlang />
            planlang
          </p>
          <h1 className="grid gap-1 text-titulo">
            <span lang="es">{NO_ENCONTRADA.titulo.es}</span>
            <span lang="en" className="text-tinta-2">
              {NO_ENCONTRADA.titulo.en}
            </span>
          </h1>
          <p className="text-tinta-2">
            <span lang="es">{NO_ENCONTRADA.texto.es}</span>{" "}
            <span lang="en">{NO_ENCONTRADA.texto.en}</span>
          </p>
          <p className="flex gap-4">
            <a href={ruta("es", "entrada")} hrefLang="es" lang="es">
              {NO_ENCONTRADA.volver.es}
            </a>
            <a href={ruta("en", "entrada")} hrefLang="en" lang="en">
              {NO_ENCONTRADA.volver.en}
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
