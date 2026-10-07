import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { PaginaBrecha } from "@/components/paginas/brecha";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/brecha";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatos(
    TITULO_PAGINA,
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-a",
  );
}

export default async function Brecha({ params }: Props) {
  return <PaginaBrecha idioma={await idiomaDeRuta(params)} demo="demo-a" />;
}
