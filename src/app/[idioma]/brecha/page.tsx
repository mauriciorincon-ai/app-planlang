import type { Metadata } from "next";
import {
  EnConstruccion,
  metadatosEnConstruccion,
} from "@/components/en-construccion";
import { idiomaDeRuta } from "@/lib/idioma";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return metadatosEnConstruccion(await idiomaDeRuta(params), "brecha");
}

/** Llega en una fase siguiente del sprint 2; mientras, dice que se está construyendo. */
export default async function Pagina({ params }: Props) {
  return <EnConstruccion idioma={await idiomaDeRuta(params)} pagina="brecha" />;
}
