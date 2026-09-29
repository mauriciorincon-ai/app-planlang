import type { ReactNode } from "react";
import { IDIOMAS } from "@core/formatos/bilingue";
import { idiomaDeRuta } from "@/lib/idioma";
import { ATRIBUTO_IDIOMA } from "@/lib/preferencias/claves";
import { SCRIPT_PREVIO } from "@/lib/preferencias/script-previo";
import { inter, mono } from "../fuentes";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return IDIOMAS.map((idioma) => ({ idioma }));
}

/**
 * Raíz de la vitrina por idioma (ADR-008): `<html lang>` sale de la ruta. El tema y el perfil los fija el
 * script previo, primer hijo del `<head>`, antes de pintar; por eso `<html>` suprime el aviso de
 * hidratación (sus atributos cambian antes de que React llegue) y el árbol no depende de ellos.
 */
export default async function IdiomaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ idioma: string }>;
}) {
  const idioma = await idiomaDeRuta(params);
  return (
    <html
      lang={idioma}
      {...{ [ATRIBUTO_IDIOMA]: idioma }}
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
