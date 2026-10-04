import { CircleAlert, Route, Workflow } from "lucide-react";
import { Fragment } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { VistaSpike } from "@/lib/vista/agente";
import { GRAFO, SPIKE } from "@/textos/agente";
import { Chip } from "../chip";
import { CODIGO_EN_LINEA } from "../con-codigo";
import { Seccion } from "../seccion";
import { CifrasContrato } from "./contrato";
import { ListaPorCapa } from "./grafo";
import { Lienzo } from "./lienzo";

/**
 * «Antes: el spike, frente al mismo contrato»: el grafo del spike de la F1 dibujado por el mismo visor contra el
 * contrato del plan, con lo exigido y ausente discontinuo y lo que sobraba marcado «sin contrato».
 */
export function SeccionSpike({
  spike,
  idioma,
}: {
  spike: VistaSpike;
  idioma: Idioma;
}) {
  return (
    <Seccion
      id="s-spike"
      titulo={SPIKE.titulo[idioma]}
      cabecera={<Chip procedencia="real">{spike.chip}</Chip>}
    >
      <p className="mb-6 max-w-objetivo text-texto">{spike.lectura}</p>
      <CifrasContrato
        cifras={spike.cifras}
        iconos={[Workflow, Route, CircleAlert]}
        rotulo={SPIKE.titulo[idioma]}
      />
      <div className="mt-4">
        <Lienzo
          svg={spike.lienzo.svg}
          columnas={spike.lienzo.columnas}
          region={spike.region}
          indice=""
          irACapa=""
          seleccionable={false}
          conIndice={false}
        />
        {/* El lienzo del spike también tiene su texto: la lista por capa, con lo exigido y ausente dicho, para el
            lector de pantalla (AU-S2-P-1; en P3 la lista es la otra vista del grafo). */}
        <section
          aria-label={`${SPIKE.titulo[idioma]} · ${GRAFO.lista[idioma]}`}
          className="sr-only"
        >
          <ListaPorCapa capas={spike.lienzo.lista} seleccionables={new Set()} />
        </section>
        <p className="solo-experto cambia-perfil mt-3 text-dato leading-normal text-tinta-2">
          {spike.citas.rotulo}:{" "}
          {spike.citas.refs.map((c, k) => (
            <Fragment key={c.que}>
              {k > 0 ? " · " : null}
              {c.que} <code className={CODIGO_EN_LINEA}>{c.donde}</code>
            </Fragment>
          ))}
        </p>
      </div>
    </Seccion>
  );
}
