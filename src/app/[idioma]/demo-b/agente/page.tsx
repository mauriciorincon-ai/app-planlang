import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { PaginaAgente } from "@/components/paginas/agente";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/agente";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatos(
    TITULO_PAGINA,
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-b",
  );
}

export default async function Agente({ params }: Props) {
  return <PaginaAgente idioma={await idiomaDeRuta(params)} demo="demo-b" />;
}
