import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import {
  IndicePlan,
  MiradaPlan,
  SeccionContrato,
  SeccionDelPlan,
} from "@/components/plan/secciones";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaPlan } from "@/lib/vista/plan";
import { PORTADA } from "@/textos/plan";

/**
 * P2 Plan (maqueta `02-plan.html`): el plan que declara el manifiesto, escrito como contrato. La mirada general
 * (parte de → hace → entrega, cifras y ficha técnica), las cinco partes del plan con lo que midió la corrida y el
 * contrato del grafo.
 */
export async function PaginaPlan({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const v = vistaPlan(await datosDemo(demo), idioma);
  return (
    <Marco idioma={idioma} pagina="plan" demo={demo} corrida={v.pie}>
      <div className={CONT}>
        <section aria-labelledby="p2-t" className="pt-8 pb-7 escritorio:pt-14">
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {v.portada.antetitulo}
            </p>
            <h1 id="p2-t" className="text-titulo text-balance">
              {PORTADA.titulo[idioma]}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {PORTADA.guia[idioma]}
            </p>
          </div>
        </section>
        <MiradaPlan v={v} idioma={idioma} />
        <IndicePlan v={v} idioma={idioma} />
        {v.secciones.map((s) => (
          <SeccionDelPlan key={s.id} s={s} idioma={idioma} />
        ))}
        <SeccionContrato v={v} idioma={idioma} />
      </div>
    </Marco>
  );
}
