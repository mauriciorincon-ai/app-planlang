import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import {
  Brechas,
  Criterios,
  Ejemplares,
  Ficha,
  PlanEnBreve,
  Playground,
  Resumen,
  Riesgos,
  Supuestos,
} from "@/components/brecha/secciones";
import { MiradaBrecha } from "@/components/brecha/mirada";
import { Oraculo } from "@/components/caso/cabecera";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaBrecha } from "@/lib/vista/brecha";
import { PORTADA } from "@/textos/brecha";

/**
 * P4 Brecha (maqueta `04-brecha.html`): el informe de brecha de la corrida que declara el manifiesto, con sus fallas a
 * la vista. Primero el informe en una mirada (veredicto, balance, lo que falló, lo cumplido); después las nueve
 * secciones del informe en su orden.
 */
export async function PaginaBrecha({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const v = vistaBrecha(await datosDemo(demo), idioma);
  return (
    <Marco idioma={idioma} pagina="brecha" demo={demo} corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="p4-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {v.portada.antetitulo}
            </p>
            <h1 id="p4-t" className="text-titulo text-balance">
              {PORTADA.titulo[idioma]}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[idioma]}
            </p>
          </div>
        </section>
        <Oraculo idioma={idioma} demo={demo} />
        <div className="mt-8">
          <MiradaBrecha v={v} idioma={idioma} />
        </div>
        <Resumen v={v} idioma={idioma} />
        <PlanEnBreve v={v} idioma={idioma} />
        <Criterios v={v} idioma={idioma} />
        <Riesgos v={v} idioma={idioma} />
        <Brechas v={v} idioma={idioma} />
        <Supuestos v={v} idioma={idioma} />
        <Ejemplares v={v} idioma={idioma} />
        <Playground v={v} idioma={idioma} />
        <Ficha v={v} idioma={idioma} />
      </div>
    </Marco>
  );
}
