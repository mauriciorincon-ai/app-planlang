import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { CONT } from "@/components/cx";
import { SeccionFicha } from "@/components/fichas/ficha-cv";
import { MiradaFichas, Reproducibilidad } from "@/components/fichas/mirada";
import { Marco } from "@/components/marco/marco";
import { hechosDelRepo } from "@/lib/datos/repo";
import { datosDeLosDemos } from "@/lib/datos/vitrina";
import { vistaFichas } from "@/lib/vista/fichas";
import { PORTADA } from "@/textos/fichas";

/**
 * P7 Fichas (maqueta `07-fichas.html`): la ficha de reproducibilidad, que se queda en planlang, y las dos que viajan
 * a hoja-de-vida por copia —la de la app, igual en las páginas de los dos demos, y la del agente del demo—, pintadas
 * como las pinta allá y comprobadas contra el contrato fijado. Son las mismas que escribe `pnpm fichas`, en el idioma de la ruta.
 */
export async function PaginaFichas({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const v = vistaFichas(await datosDeLosDemos(), demo, hechosDelRepo(), idioma);
  return (
    <Marco idioma={idioma} pagina="fichas" demo={demo} corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="p7-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {v.textos.antetitulo}
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
        <SeccionFicha
          n={2}
          f={v.app}
          titulo={v.textos.seccionApp}
          idioma={idioma}
        />
        <SeccionFicha
          n={3}
          f={v.agente}
          titulo={v.textos.seccionAgente}
          idioma={idioma}
          className="pb-14"
        />
      </div>
    </Marco>
  );
}
