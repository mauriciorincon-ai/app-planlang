import type { Metadata } from "next";
import { metadatos } from "@/components/paginas/metadatos";
import { idsDeCasosDe, PaginaCaso } from "@/components/paginas/caso";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/caso";

type Props = { params: Promise<{ idioma: string; id: string }> };

export const dynamicParams = false;

/** Un caso por traza de la corrida que declara el manifiesto (n × 2 idiomas). */
export async function generateStaticParams() {
  return idsDeCasosDe("demo-b");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return metadatos(
    TITULO_PAGINA(id),
    DESCRIPCION_PAGINA,
    await idiomaDeRuta(params),
    "demo-b",
  );
}

export default async function Caso({ params }: Props) {
  const { id } = await params;
  return (
    <PaginaCaso idioma={await idiomaDeRuta(params)} demo="demo-b" id={id} />
  );
}
