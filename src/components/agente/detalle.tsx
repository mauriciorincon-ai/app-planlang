import type { Idioma } from "@core/formatos/bilingue";
import type { VistaAgente } from "@/lib/vista/agente";
import { GRAFO } from "@/textos/agente";
import { PanelArista } from "./panel-arista";
import { PanelNodo } from "./panel-nodo";
import { AnuncioSeleccion, PanelSeleccion } from "./seleccion";

/** «Detalle de la selección»: todos los paneles se pintan; se ve el del nodo o la regla elegidos en el lienzo. */
export function Detalle({
  vista,
  idioma,
}: {
  vista: VistaAgente;
  idioma: Idioma;
}) {
  const anuncios = Object.fromEntries([
    ...vista.paneles.map((p) => [p.id, GRAFO.anuncio(p.nombre)[idioma]]),
    [vista.arista.id, GRAFO.anuncio(vista.arista.titulo)[idioma]],
  ]);
  return (
    <section
      aria-labelledby="s-det"
      className="border-t border-linea pt-10 pb-14"
    >
      <h2 id="s-det" className="sr-only">
        {GRAFO.detalle[idioma]}
      </h2>
      <AnuncioSeleccion anuncios={anuncios} />
      {vista.paneles.map((p) => (
        <PanelSeleccion key={p.id} id={p.id}>
          <PanelNodo
            p={p}
            demo={vista.demo}
            tipoDe={vista.tipoDe}
            idioma={idioma}
          />
        </PanelSeleccion>
      ))}
      <PanelSeleccion id={vista.arista.id}>
        <PanelArista a={vista.arista} idioma={idioma} />
      </PanelSeleccion>
    </section>
  );
}
