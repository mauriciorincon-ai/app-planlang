import { notFound } from "next/navigation";
import { IDIOMAS, type Idioma } from "@core/formatos/bilingue";

export function esIdioma(x: string): x is Idioma {
  return (IDIOMAS as readonly string[]).includes(x);
}

/** El idioma de la ruta; cualquier otro segmento es una página que no existe. */
export async function idiomaDeRuta(
  params: Promise<{ idioma: string }>,
): Promise<Idioma> {
  const { idioma } = await params;
  if (!esIdioma(idioma)) notFound();
  return idioma;
}
