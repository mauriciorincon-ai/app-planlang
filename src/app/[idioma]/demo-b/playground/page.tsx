import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { PaginaPlayground } from "@/components/paginas/playground";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/playground";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatos(
    TITULO_PAGINA,
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-b",
  );
}

export default async function Playground({ params }: Props) {
  return <PaginaPlayground idioma={await idiomaDeRuta(params)} demo="demo-b" />;
}
