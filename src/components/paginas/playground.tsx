import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { Oraculo } from "@/components/caso/cabecera";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { Juego } from "@/components/playground/juego";
import { Limites, MiradaPlayground } from "@/components/playground/mirada";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaPlayground } from "@/lib/vista/playground";
import { PORTADA } from "@/textos/playground";

/**
 * P5 Playground (maqueta `05-playground.html`): los umbrales del plan sobre las decisiones que el agente ya tomó.
 * Primero el playground en una mirada (objetivo, recibe → hace → entrega, el ejemplo medido, la ficha técnica);
 * después la isla que recalcula en el navegador con el núcleo, y lo que el playground no puede saber.
 */
export async function PaginaPlayground({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const v = vistaPlayground(await datosDemo(demo), idioma);
  return (
    <Marco idioma={idioma} pagina="playground" demo={demo} corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="p5-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {v.portada.antetitulo}
            </p>
            <h1 id="p5-t" className="text-titulo text-balance">
              {PORTADA.titulo[idioma]}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[idioma]}
            </p>
          </div>
        </section>
        <Oraculo idioma={idioma} />
        <div className="mt-8">
          <MiradaPlayground v={v} idioma={idioma} />
        </div>
        <Juego datos={v.isla} />
        <Limites v={v} idioma={idioma} />
      </div>
    </Marco>
  );
}
