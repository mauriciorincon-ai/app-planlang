import type { Metadata } from "next";
import { ComoFunciona } from "@/components/entrada/como-funciona";
import { Demos } from "@/components/entrada/demos";
import { LoQueNinguna } from "@/components/entrada/lo-que-ninguna";
import { Portada } from "@/components/entrada/portada";
import { Pregunta } from "@/components/entrada/pregunta";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDemo } from "@/lib/datos/vitrina";
import { idiomaDeRuta } from "@/lib/idioma";
import { vistaEntrada } from "@/lib/vista/entrada";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/entrada";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const idioma = await idiomaDeRuta(params);
  return {
    title: TITULO_PAGINA[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

/** P1 Entrada (maqueta `01-entrada.html`): la tesis, cómo funciona, lo que ninguna herramienta muestra y los demos. */
export default async function Entrada({ params }: Props) {
  const idioma = await idiomaDeRuta(params);
  const vista = vistaEntrada(await datosDemo(), idioma);
  return (
    <Marco idioma={idioma} pagina="entrada">
      <div className={CONT}>
        <Portada idioma={idioma} />
        <ComoFunciona vista={vista} idioma={idioma} />
        <LoQueNinguna vista={vista} idioma={idioma} />
        <Demos vista={vista} idioma={idioma} />
        <Pregunta idioma={idioma} />
      </div>
    </Marco>
  );
}
