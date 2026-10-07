import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { PaginaFichas } from "@/components/paginas/fichas";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/fichas";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatos(
    TITULO_PAGINA,
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-a",
  );
}

export default async function Fichas({ params }: Props) {
  return <PaginaFichas idioma={await idiomaDeRuta(params)} demo="demo-a" />;
}
