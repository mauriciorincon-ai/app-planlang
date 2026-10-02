import type { Metadata } from "next";
import { CONT } from "@/components/cx";
import { SeccionFicha } from "@/components/fichas/ficha-cv";
import { MiradaFichas, Reproducibilidad } from "@/components/fichas/mirada";
import { Marco } from "@/components/marco/marco";
import { hechosDelRepo } from "@/lib/datos/repo";
import { datosDemo } from "@/lib/datos/vitrina";
import { idiomaDeRuta } from "@/lib/idioma";
import { vistaFichas } from "@/lib/vista/fichas";
import {
  DESCRIPCION_PAGINA,
  PORTADA,
  TITULO_PAGINA,
} from "@/textos/fichas";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const idioma = await idiomaDeRuta(params);
  return {
    title: TITULO_PAGINA[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

/**
 * P7 Fichas (maqueta `07-fichas.html`): la ficha de reproducibilidad, que se queda en planlang, y las dos que viajan
 * a hoja-de-vida por copia —la de la app y la del agente A—, pintadas como las pinta allá y comprobadas contra el
 * contrato fijado. Son las mismas que escribe `pnpm fichas`, en el idioma de la ruta.
 */
export default async function Fichas({ params }: Props) {
  const idioma = await idiomaDeRuta(params);
  const v = vistaFichas(await datosDemo(), hechosDelRepo(), idioma);
  return (
    <Marco idioma={idioma} pagina="fichas" corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="p7-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {PORTADA.antetitulo[idioma]}
            </p>
            <h1 id="p7-t" className="text-titulo text-balance">
              {PORTADA.titulo[idioma]}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[idioma]}
            </p>
          </div>
        </section>
        <MiradaFichas v={v} idioma={idioma} />
        <Reproducibilidad v={v} idioma={idioma} />
        <SeccionFicha n={2} f={v.app} idioma={idioma} />
        <SeccionFicha n={3} f={v.agente} idioma={idioma} className="pb-14" />
      </div>
    </Marco>
  );
}
