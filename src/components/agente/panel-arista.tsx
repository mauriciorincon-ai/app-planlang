import { SlidersHorizontal } from "lucide-react";
import type { Idioma } from "@core/formatos/bilingue";
import type { PanelArista as Panel } from "@/lib/vista/agente";
import { decimal } from "@/lib/vista/formato";
import { ARISTA_U1 } from "@/textos/agente";
import { BotonEnlace } from "../boton";
import { Chip } from "../chip";
import { Icono } from "../icono";

/** Geometría de la distribución (unidades del viewBox): el eje va de 40 a 600 y los puntos se apilan cada 11. */
const ANCHO = 640;
const ALTO = 138;
const EJE = { x0: 40, x1: 600, y: 106 };
const APILA = 11;

const f1 = (x: number) => x.toFixed(1);

/**
 * La confianza de los casos que llegaron a la regla, sobre su eje, con el umbral del plan: ■ los que la regla
 * mandó a una persona (en el color de la pausa humana, con su id) y ○ los que siguieron. Se genera del dato.
 */
function Distribucion({ a, idioma }: { a: Panel; idioma: Idioma }) {
  const x = (v: number) =>
    EJE.x0 + ((v - a.eje.min) / (a.eje.max - a.eje.min)) * (EJE.x1 - EJE.x0);
  const pila = new Map<number, number>();
  const puntos = a.puntos.map((p) => {
    const k = pila.get(p.valor) ?? 0;
    pila.set(p.valor, k + 1);
    return { ...p, cx: x(p.valor), cy: 96 - k * APILA };
  });
  const marcas: number[] = [];
  for (let v = a.eje.min; v <= a.eje.max + 1e-9; v += 0.1)
    marcas.push(Math.round(v * 100) / 100);
  const u = decimal(a.umbral, 2, idioma);
  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      role="img"
      aria-label={`${a.etiqueta}; ${a.umbralId} = ${u}`}
      className="block h-auto w-full"
    >
      <path
        d={`M${EJE.x0},${EJE.y} H${EJE.x1}`}
        className="fill-none stroke-linea"
      />
      <path
        d={`M${f1(x(a.umbral))},12 V112`}
        className="stroke-tinta-1"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <text
        x={f1(x(a.umbral) + 6)}
        y={22}
        className="fill-tinta-1 font-mono text-[10.5px] font-medium"
      >
        {a.umbralId} = {u}
      </text>
      <text x={EJE.x0} y={22} className="fill-tinta-2 font-letra text-[11.5px]">
        {ARISTA_U1.aPersona[idioma]}
      </text>
      <text
        x={EJE.x1}
        y={22}
        textAnchor="end"
        className="fill-tinta-2 font-letra text-[11.5px]"
      >
        {ARISTA_U1.sigueSolo[idioma]}
      </text>
      {puntos.map((p) =>
        p.aPersona ? (
          <g key={p.id}>
            <rect
              x={f1(p.cx - 5)}
              y={p.cy - 5}
              width={10}
              height={10}
              className="fill-tipo-4"
            />
            <text
              x={f1(p.cx)}
              y={p.cy - 12}
              textAnchor="middle"
              className="fill-tinta-1 font-mono text-[10.5px] font-medium"
            >
              {p.id}
            </text>
          </g>
        ) : (
          <circle
            key={p.id}
            cx={f1(p.cx)}
            cy={p.cy}
            r={5}
            className="fill-none stroke-tinta-1"
            strokeWidth={1.4}
          />
        ),
      )}
      {marcas.map((v) => (
        <text
          key={v}
          x={f1(x(v))}
          y={128}
          textAnchor="middle"
          className="fill-tinta-2 font-mono text-[10.5px]"
        >
          {decimal(v, 2, idioma)}
        </text>
      ))}
    </svg>
  );
}

/** El detalle de la regla U1: dónde vive, su valor y su rango en el plan, y cómo cayeron los casos de la corrida. */
export function PanelArista({ a, idioma }: { a: Panel; idioma: Idioma }) {
  return (
    <div className="grid gap-4" data-tipo="enrutador">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <svg
          viewBox="0 0 30 12"
          width={30}
          height={12}
          aria-hidden="true"
          className="text-c"
        >
          <path
            d="M1,6 H29"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <rect
            x={11}
            y={2}
            width={8}
            height={8}
            fill="var(--fondo)"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>
        <h3 className="text-seccion">{a.titulo}</h3>
        <Chip procedencia="real">{a.chip}</Chip>
      </div>
      <p className="max-w-[70ch] text-guia leading-normal text-tinta-2">
        {a.rol}
      </p>
      <div className="grid grid-cols-1 gap-6 escritorio:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <dl className="m-0 grid max-w-[560px] grid-cols-[max-content_minmax(0,1fr)]">
            {a.filas.map((f) => (
              <div key={f.k} className="contents">
                <dt className="border-t border-linea py-1.75 pr-6 text-chico text-tinta-2">
                  {f.k}
                </dt>
                <dd className="border-t border-linea py-1.75 font-mono text-[12.5px] leading-normal">
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3">
            <BotonEnlace href={a.playground} chico>
              <Icono de={SlidersHorizontal} tam={15} />
              {ARISTA_U1.mover[idioma]}
            </BotonEnlace>
          </p>
        </div>
        <div className="self-start rounded-control border border-linea bg-sup-1 px-4 py-3">
          <Distribucion a={a} idioma={idioma} />
          <p className="mt-1.5 text-dato text-tinta-2">{a.nota}</p>
        </div>
      </div>
    </div>
  );
}
