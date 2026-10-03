import { ArrowRight, SlidersHorizontal } from "lucide-react";
import type { FilaPlan as Fila } from "@/lib/vista/plan";
import { Etiqueta, Definiciones, PrioridadAccion } from "../agente/piezas";
import { claseBoton } from "../boton";
import { ConCodigo } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { BloqueExperto } from "../perfil/bloque-experto";
import { Veredicto } from "../veredicto";

const RELIGUITA =
  "font-mono text-dato leading-normal text-tinta-2 [overflow-wrap:anywhere]";

/** Lo que se abre bajo un renglón (`<details>` nativo: abrirlo no cambia la forma del árbol). */
function Abrir({ a }: { a: NonNullable<Fila["abrir"]> }) {
  return (
    <details className="group/abrir">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-chico text-tinta-2 hover:text-tinta-1 [&::-webkit-details-marker]:hidden">
        <Icono
          de={ArrowRight}
          tam={13}
          className="transition-transform group-open/abrir:rotate-90"
        />
        {a.rotulo}
      </summary>
      <div className="mt-2 border-l-2 border-linea px-3 py-1">
        <Definiciones filas={a.filas} />
        {a.tecnica ? (
          <p className={cx("solo-experto mt-1.5", RELIGUITA)}>{a.tecnica}</p>
        ) : null}
      </div>
    </details>
  );
}

/** La columna de la derecha: reversibilidad, prioridad y estado, lo que midió la corrida o el enlace al playground. */
function Lado({ f }: { f: Fila }) {
  const l = f.lado;
  // En el teléfono va bajo el cuerpo, en fila; en escritorio es la tercera columna, apilada.
  const CAJA =
    "col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 escritorio:col-start-auto escritorio:grid escritorio:content-start escritorio:justify-items-start";
  switch (l.tipo) {
    case "decision":
      return (
        <div className={CAJA}>
          <Etiqueta unaVia={l.unaVia}>{l.texto}</Etiqueta>
        </div>
      );
    case "riesgo":
      return (
        <div className={CAJA}>
          <PrioridadAccion barras={l.ap.barras} texto={l.ap.texto} />
          <span className="font-mono text-dato leading-[1.4] text-tinta-2">
            {l.factores}
            <span className="solo-experto"> · {l.rpn}</span>
          </span>
          {l.legal ? (
            <span className="text-dato leading-[1.4] text-tinta-2">
              {l.legal}
            </span>
          ) : null}
          <Veredicto clase={l.estado.clase} chico>
            {l.estado.texto}
          </Veredicto>
        </div>
      );
    case "supuesto":
      return (
        <div className={CAJA}>
          <span className="text-chico text-tinta-2">{l.enPlan}</span>
          <Veredicto clase={l.estado.clase} chico>
            {l.estado.texto}
          </Veredicto>
        </div>
      );
    case "criterio":
      return (
        <div className={CAJA}>
          <Veredicto clase={l.estado.clase} chico>
            {l.estado.texto}
          </Veredicto>
        </div>
      );
    case "umbral":
      return (
        <div className={CAJA}>
          <a
            href={l.href}
            aria-label={l.etiqueta}
            className={claseBoton({ chico: true })}
          >
            <Icono de={SlidersHorizontal} tam={15} />
            {l.texto}
          </a>
        </div>
      );
  }
}

/**
 * Un renglón del plan (maqueta `.fila-plan`): el id, lo que dice el plan en palabras, su línea técnica para el
 * experto, lo que se abre y, a la derecha (debajo en el teléfono), lo que midió la corrida.
 */
export function FilaPlan({ f, experto }: { f: Fila; experto: string }) {
  return (
    <div
      id={`fila-${f.id}`}
      className={cx(
        "grid scroll-mt-6 grid-cols-[34px_minmax(0,1fr)] items-start gap-x-4.5 gap-y-1.5 border-t border-linea py-3.5 escritorio:grid-cols-[40px_minmax(0,1fr)_minmax(0,190px)]",
        f.unaVia && "border-l-2 border-l-tinta-1 pl-2.5",
      )}
    >
      <span className="font-mono text-dato leading-[1.9] font-medium text-tinta-2">
        {f.id}
      </span>
      <div className="grid min-w-0 gap-1.5">
        <p className="text-texto leading-[1.45] font-medium">
          {f.titulo}
          {f.valor ? (
            <>
              {" · "}
              <b className="font-mono text-texto leading-none font-semibold">
                {f.valor}
              </b>
            </>
          ) : null}
        </p>
        {f.resumen ? (
          <p className="text-chico leading-[1.55]">
            <ConCodigo texto={f.resumen} />
          </p>
        ) : null}
        {f.chips?.length ? (
          <p className="flex flex-wrap gap-1.5">
            {f.chips.map((c) => (
              <span
                key={c}
                className="inline-flex h-5 items-center rounded-chip border border-tinta-3 px-1.75 text-dato leading-none font-medium text-tinta-2"
              >
                {c}
              </span>
            ))}
          </p>
        ) : null}
        {f.tecnica ? (
          <BloqueExperto rotulo={experto} sutil>
            <p className={RELIGUITA}>{f.tecnica}</p>
          </BloqueExperto>
        ) : null}
        {f.abrir ? <Abrir a={f.abrir} /> : null}
      </div>
      <Lado f={f} />
    </div>
  );
}
