import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";

export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const dynamicParams = false;

export function generateStaticParams() {
  return IDIOMAS.map((idioma) => ({ idioma }));
}

export const metadata: Metadata = { title: "planlang" };

/** Raíz de la vitrina por idioma (ADR-008): `<html lang>` sale de la ruta, no del navegador. */
export default async function IdiomaLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ idioma: string }>;
}) {
  const { idioma } = await params;
  if (!(IDIOMAS as readonly string[]).includes(idioma)) notFound();
  return (
    <html lang={idioma}>
      <body>{children}</body>
    </html>
  );
}
