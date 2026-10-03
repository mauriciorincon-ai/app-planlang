import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiradaCaso, Oraculo, PortadaCaso } from "@/components/caso/cabecera";
import { Caso } from "@/components/caso/caso";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDemo } from "@/lib/datos/vitrina";
import { idiomaDeRuta } from "@/lib/idioma";
import { chipsDeCasos, idsDeCasos, portadaCasos, vistaCaso } from "@/lib/vista/caso";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/caso";

type Props = { params: Promise<{ idioma: string; id: string }> };

export const dynamicParams = false;

/** Un caso por traza de la corrida que declara el manifiesto (20 × 2 idiomas). */
export async function generateStaticParams() {
  return idsDeCasos(await datosDemo()).map((id) => ({ id }));
}

async function caso(params: Props["params"]) {
  const idioma = await idiomaDeRuta(params);
  const { id } = await params;
  const d = await datosDemo();
  if (!idsDeCasos(d).includes(id)) notFound();
  return { idioma, id, d };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma, id } = await caso(params);
  return {
    title: TITULO_PAGINA(id)[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

/** P6 Caso (maqueta `06-caso.html`): una traza real de punta a punta, armada desde la corrida. */
export default async function PaginaCaso({ params }: Props) {
  const { idioma, id, d } = await caso(params);
  const portada = portadaCasos(d, idioma);
  return (
    <Marco idioma={idioma} pagina="caso" id={id} corrida={portada.pie}>
      <div className={CONT}>
        <PortadaCaso antetitulo={portada.antetitulo} idioma={idioma} />
        <Oraculo idioma={idioma} />
        <MiradaCaso chips={chipsDeCasos(d, idioma)} actual={id} idioma={idioma} />
        <Caso v={vistaCaso(d, id, idioma)} idioma={idioma} />
      </div>
    </Marco>
  );
}
