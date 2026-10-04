import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import { Route, Split, Workflow } from "lucide-react";
import { CifrasContrato } from "@/components/agente/contrato";
import { Detalle } from "@/components/agente/detalle";
import { FichaAgente } from "@/components/agente/ficha";
import { SeccionGrafo } from "@/components/agente/grafo";
import { Seleccion } from "@/components/agente/seleccion";
import { SeccionSpike } from "@/components/agente/spike";
import { Chip } from "@/components/chip";
import { ConCodigo } from "@/components/con-codigo";
import { CONT } from "@/components/cx";
import { Marco } from "@/components/marco/marco";
import { Seccion } from "@/components/seccion";
import { datosDemo } from "@/lib/datos/vitrina";
import { vistaAgente } from "@/lib/vista/agente";
import { CONTRATO_CIFRAS } from "@/textos/agente";

/** Marca en el SVG generado la selección con que abre la página (la misma que se ve sin JS). */
function conSeleccion(svg: string, id: string): string {
  const atributo = `data-sel-id="${id}"`;
  if (!svg.includes(atributo))
    throw new Error(`vitrina: el lienzo no tiene «${id}» seleccionable`);
  return svg.replace(
    atributo,
    `${atributo} data-sel="true" aria-pressed="true"`,
  );
}

/**
 * P3 Agente (maqueta `03-agente.html`): la ficha del agente por perfil, lo que corrió frente a su plan, el grafo
 * generado desde el código con el detalle de cada nodo y de la regla U1, el spike frente al mismo contrato y el
 * pie con la corrida.
 */
export async function PaginaAgente({
  idioma,
  demo,
}: {
  idioma: Idioma;
  demo: IdDemo;
}) {
  const vista = vistaAgente(await datosDemo(demo), idioma);
  const inicial = vista.paneles[0]!.id;
  const seleccionables = new Set([
    ...vista.paneles.map((p) => p.id),
    vista.arista.id,
  ]);
  return (
    <Marco idioma={idioma} pagina="agente" demo={demo} corrida={vista.pie}>
      <div className={CONT}>
        <section
          aria-labelledby="p3-t"
          className="pt-8 pb-8 escritorio:pt-14 escritorio:pb-9"
        >
          <div className="escritorio:max-w-[calc(7/12*100%)]">
            <p className="mb-3 text-chico text-tinta-2">
              {vista.portada.antetitulo}
            </p>
            <h1 id="p3-t" className="text-titulo text-balance">
              {vista.portada.titulo}
            </h1>
            <p className="mt-4 max-w-guia text-guia text-tinta-2">
              {vista.portada.guia}
            </p>
          </div>
        </section>
        <FichaAgente vista={vista} idioma={idioma} />
        <Seccion
          id="s-hoy"
          titulo={CONTRATO_CIFRAS.titulo[idioma]}
          cabecera={<Chip procedencia="real">{vista.contrato.chip}</Chip>}
        >
          <CifrasContrato
            cifras={vista.contrato.cifras}
            iconos={[Workflow, Route, Split]}
            rotulo={CONTRATO_CIFRAS.titulo[idioma]}
          />
          <p className="mt-3 text-dato text-tinta-2">
            <ConCodigo texto={vista.contrato.fuente} />
          </p>
        </Seccion>
        <Seleccion inicial={inicial}>
          <SeccionGrafo
            lienzo={vista.lienzo}
            svg={conSeleccion(vista.lienzo.svg, inicial)}
            seleccionables={seleccionables}
            idioma={idioma}
          />
          <Detalle vista={vista} idioma={idioma} />
        </Seleccion>
        {vista.spike ? (
          <SeccionSpike spike={vista.spike} idioma={idioma} />
        ) : null}
      </div>
    </Marco>
  );
}
