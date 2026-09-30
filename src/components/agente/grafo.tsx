import type { Idioma } from "@core/formatos/bilingue";
import type { CapaDeLista, Lienzo as DatosLienzo } from "@/lib/vista/visor";
import { GRAFO } from "@/textos/agente";
import { Seccion } from "../seccion";
import { BotonesVista, PanelVista, Vistas } from "../vistas";
import { Lienzo } from "./lienzo";
import { NodoDeLista } from "./seleccion";

/** Muestras de línea de la leyenda: los mismos trazos que `visor.css` da a cada modo de flujo. */
function Muestra({
  modo,
}: {
  modo: "secuencia" | "condicional" | "reanudacion" | "salto";
}) {
  return (
    <svg
      viewBox="0 0 30 12"
      width={30}
      height={12}
      aria-hidden="true"
      className="text-tinta-2"
    >
      {modo === "salto" ? (
        <path
          d="M1,8 H11 A4,4 0 0 1 19,8 H29"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ) : (
        <path
          d="M1,6 H29"
          stroke="currentColor"
          strokeWidth={modo === "reanudacion" ? 2.2 : 1.5}
          strokeDasharray={
            modo === "condicional"
              ? "6 4"
              : modo === "reanudacion"
                ? "0.1 4.5"
                : undefined
          }
          strokeLinecap={modo === "reanudacion" ? "round" : "butt"}
        />
      )}
      {modo === "condicional" ? (
        <rect
          x={11}
          y={2}
          width={8}
          height={8}
          fill="var(--fondo)"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ) : null}
    </svg>
  );
}

export function Leyenda({ idioma }: { idioma: Idioma }) {
  const l = GRAFO.leyenda;
  return (
    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-dato text-tinta-2">
      {(["secuencia", "condicional", "reanudacion", "salto"] as const).map(
        (m) => (
          <span key={m} className="inline-flex items-center gap-2">
            <Muestra modo={m} />
            {l[m][idioma]}
          </span>
        ),
      )}
    </p>
  );
}

/** La lista por capa: el diagrama en texto (G10), capa por capa, con sus nodos y sus flujos. */
export function ListaPorCapa({
  capas,
  seleccionables,
}: {
  capas: readonly CapaDeLista[];
  /** Ids de los nodos que tienen panel de detalle. */
  seleccionables: ReadonlySet<string>;
}) {
  const FLUJO = "mt-1 font-mono text-dato leading-normal text-tinta-2";
  return (
    <ol className="list-none p-0">
      {capas.map((c) => (
        <li
          key={c.numero}
          className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-linea py-3 tableta:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
        >
          <div className="grid content-start gap-0.5">
            <span className="font-mono text-[10.5px] leading-[1.4] font-medium text-tinta-2">
              {c.numero}
            </span>
            <b className="text-apoyo font-semibold">{c.nombre}</b>
            <span className="text-chico text-tinta-2">{c.pregunta}</span>
          </div>
          <div>
            {c.notas.map((n) =>
              n.includes("→") ? (
                <p key={n} className={FLUJO}>
                  {n}
                </p>
              ) : (
                <p key={n} className="text-chico text-tinta-2">
                  {n}
                </p>
              ),
            )}
            {c.nodos.length ? (
              <ol className="grid list-none gap-2 p-0">
                {c.nodos.map((n) => (
                  <li key={n.id}>
                    <NodoDeLista
                      id={n.id}
                      tipo={n.tipo}
                      codigo={n.codigo}
                      nombre={n.nombre}
                      seleccionable={seleccionables.has(n.id)}
                    />
                    {n.flujos.map((f) => (
                      <p key={f} className={FLUJO}>
                        {f}
                      </p>
                    ))}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** «El grafo»: el lienzo generado (con índice de capas y leyenda) o la lista por capa, a elección. */
export function SeccionGrafo({
  lienzo,
  svg,
  seleccionables,
  idioma,
}: {
  lienzo: DatosLienzo;
  /** El SVG del lienzo con la selección inicial ya marcada. */
  svg: string;
  seleccionables: ReadonlySet<string>;
  idioma: Idioma;
}) {
  return (
    <Vistas inicial="lienzo" parametro={["lienzo", "lista"]}>
      <Seccion
        id="s-grafo"
        titulo={GRAFO.titulo[idioma]}
        className="mt-8"
        cabecera={
          <BotonesVista
            rotulo={GRAFO.vista[idioma]}
            opciones={[
              { id: "lienzo", etiqueta: GRAFO.lienzo[idioma] },
              { id: "lista", etiqueta: GRAFO.lista[idioma] },
            ]}
          />
        }
      >
        <p className="-mt-1 mb-4 text-chico text-tinta-2">
          {GRAFO.nota[idioma]}
        </p>
        <PanelVista id="lienzo">
          <Lienzo
            svg={svg}
            columnas={lienzo.columnas}
            region={GRAFO.region[idioma]}
            indice={GRAFO.indice[idioma]}
            irACapa={GRAFO.irACapa[idioma]}
          />
          <Leyenda idioma={idioma} />
        </PanelVista>
        <PanelVista id="lista">
          <ListaPorCapa capas={lienzo.lista} seleccionables={seleccionables} />
        </PanelVista>
      </Seccion>
    </Vistas>
  );
}
