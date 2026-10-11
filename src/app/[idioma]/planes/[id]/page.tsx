import type { Metadata } from "next";
import { IDIOMAS } from "@core/formatos/bilingue";
import { PaginaPlanSinCorrida } from "@/components/paginas/plan-sin-corrida";
import { planesSinCorrida } from "@/lib/datos/planes";
import { idiomaDeRuta } from "@/lib/idioma";
import { DESCRIPCION_PAGINA, TITULO_PAGINA } from "@/textos/plan-sin-corrida";

type Props = { params: Promise<{ idioma: string; id: string }> };

export const dynamicParams = false;

/** Una página por plan aprobado sin corrida (S5), en los dos idiomas. */
export async function generateStaticParams() {
  const planes = await planesSinCorrida();
  return IDIOMAS.flatMap((idioma) => planes.map((p) => ({ idioma, id: p.id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idioma = await idiomaDeRuta(params);
  return {
    title: TITULO_PAGINA(id)[idioma],
    description: DESCRIPCION_PAGINA[idioma],
  };
}

export default async function PlanSinCorrida({ params }: Props) {
  const { id } = await params;
  return <PaginaPlanSinCorrida idioma={await idiomaDeRuta(params)} id={id} />;
}
