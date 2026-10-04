import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { PaginaCasos } from "@/components/paginas/caso";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_INDICE } from "@/textos/caso";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatos(
    TITULO_INDICE,
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-a",
  );
}

export default async function Casos({ params }: Props) {
  return <PaginaCasos idioma={await idiomaDeRuta(params)} demo="demo-a" />;
}
