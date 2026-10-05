import type { Metadata } from "next";
import { ComoFunciona } from "@/components/entrada/como-funciona";
import { Demos } from "@/components/entrada/demos";
import { LoQueNinguna } from "@/components/entrada/lo-que-ninguna";
import { Portada } from "@/components/entrada/portada";
import { Pregunta } from "@/components/entrada/pregunta";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDeLosDemos } from "@/lib/datos/vitrina";
import { DEMOS } from "@/lib/demos";
import { idiomaDeRuta } from "@/lib/idioma";
import { filaDeDemo, vistaEntrada } from "@/lib/vista/entrada";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/entrada";

type Props = { params: Promise<{ idioma: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const idioma = await idiomaDeRuta(params);
  return {
    title: TITULO_PAGINA[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

/**
 * P1 Entrada (maqueta `01-entrada.html`): la tesis, cómo funciona, lo que ninguna herramienta muestra y los demos (una
 * fila real por demo, ADR-014).
 */
export default async function Entrada({ params }: Props) {
  const idioma = await idiomaDeRuta(params);
  const ds = await datosDeLosDemos();
  // La portada, «Cómo funciona» y «Lo que ninguna herramienta muestra» dibujan el A; «Los demos», una fila por demo.
  const vista = vistaEntrada(ds["demo-a"], idioma);
  const filas = DEMOS.map((id) => filaDeDemo(ds[id], idioma));
  return (
    <Marco idioma={idioma} pagina="entrada">
      <div className={CONT}>
        <Portada idioma={idioma} />
        <ComoFunciona vista={vista} idioma={idioma} />
        <LoQueNinguna vista={vista} idioma={idioma} />
        <Demos filas={filas} idioma={idioma} />
        <Pregunta idioma={idioma} />
      </div>
    </Marco>
  );
}
