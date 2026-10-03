import type { Metadata } from "next";
import { MiradaCaso, Oraculo, PortadaCaso } from "@/components/caso/cabecera";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDemo } from "@/lib/datos/vitrina";
import { idiomaDeRuta } from "@/lib/idioma";
import { chipsDeCasos, portadaCasos } from "@/lib/vista/caso";
import { DESCRIPCION_PAGINA, TITULO_INDICE } from "@/textos/caso";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const idioma = await idiomaDeRuta(params);
  return {
    title: TITULO_INDICE[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

/** P6 Casos, índice: los casos de la corrida, cada uno abre su traza de punta a punta. */
export default async function Casos({ params }: Props) {
  const idioma = await idiomaDeRuta(params);
  const d = await datosDemo();
  const portada = portadaCasos(d, idioma);
  return (
    <Marco idioma={idioma} pagina="caso" corrida={portada.pie}>
      <div className={`${CONT} pb-14`}>
        <PortadaCaso antetitulo={portada.antetituloIndice} idioma={idioma} />
        <Oraculo idioma={idioma} />
        <MiradaCaso chips={chipsDeCasos(d, idioma)} actual={null} idioma={idioma} />
      </div>
    </Marco>
  );
}
