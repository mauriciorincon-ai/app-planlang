/**
 * La curva riesgo-cobertura (P4 § 6 en miniatura, P5 entera): cobertura en x (los casos que el agente resuelve solo),
 * riesgo en y (los errores entre esos casos), un punto por valor de U1. El círculo es el plan; el cuadro, el valor que
 * eligió el visitante. SVG generado desde los datos del informe, sin lógica: el eje de riesgo crece si algún punto
 * pasa del 10 %. Sin estado propio: la isla del playground la vuelve a pintar con el U1 actual.
 */
import type { PuntoCurva } from "@/lib/vista/brecha";
import { cx } from "./cx";

const X0 = 48;
const X1 = 468;
const Y0 = 204;
const ALTO = 192;

export interface TextosCurva {
  titulo: string;
  ejeCobertura: string;
  ejeRiesgo: string;
  pct: (x: number) => string;
  /** «plan · U1 0,75» o, agrupado, «plan · U1 0,75–0,85 · 93 %». */
  plan: (umbrales: number[], cobertura: number) => string;
  /** «U1 0,90» o «U1 0,50–0,70». */
  grupo: (umbrales: number[]) => string;
  actual?: (umbral: number, cobertura: number) => string;
}

function tope(puntos: readonly PuntoCurva[]): number {
  const max = Math.max(0, ...puntos.map((p) => p.riesgo ?? 0));
  return max <= 0.1 ? 0.1 : Math.ceil(max / 0.05) * 0.05;
}

const fx = (c: number) => X0 + c * (X1 - X0);

/** Los puntos con la misma cobertura y el mismo riesgo se agrupan: un solo trazo y una sola etiqueta. */
export function agrupar(puntos: readonly PuntoCurva[]) {
  const grupos: {
    cobertura: number;
    riesgo: number | null;
    umbrales: number[];
  }[] = [];
  for (const p of [...puntos].sort((a, b) => a.umbral - b.umbral)) {
    const g = grupos[grupos.length - 1];
    if (g && g.cobertura === p.cobertura && g.riesgo === p.riesgo)
      g.umbrales.push(p.umbral);
    else
      grupos.push({
        cobertura: p.cobertura,
        riesgo: p.riesgo,
        umbrales: [p.umbral],
      });
  }
  return grupos;
}

export function Curva({
  puntos,
  plan,
  actual,
  textos,
  mini = false,
  id,
}: {
  puntos: readonly PuntoCurva[];
  plan: number;
  actual?: number;
  textos: TextosCurva;
  mini?: boolean;
  id: string;
}) {
  const t = tope(puntos);
  const fy = (r: number) => Y0 - (r / t) * ALTO;
  const grupos = agrupar(puntos);
  const conValor = grupos.filter((g) => g.riesgo !== null);
  const trazo = [...conValor]
    .sort((a, b) => a.cobertura - b.cobertura)
    .map(
      (g, k) =>
        `${k === 0 ? "M" : "L"}${fx(g.cobertura).toFixed(1)},${fy(g.riesgo as number).toFixed(1)}`,
    )
    .join(" ");
  const gPlan = grupos.find((g) =>
    g.umbrales.some((u) => Math.abs(u - plan) < 1e-9),
  );
  const pActual =
    actual === undefined
      ? null
      : grupos.find((g) => g.umbrales.some((u) => Math.abs(u - actual) < 1e-9));
  const enPlan = actual === undefined || Math.abs(actual - plan) < 1e-9;
  return (
    <svg
      viewBox="0 0 480 250"
      role="img"
      aria-labelledby={`${id}-t`}
      className={cx(
        "block h-auto w-full overflow-visible [&_text]:fill-tinta-2 [&_text]:font-mono [&_text]:text-[11px]",
        mini ? "max-w-[480px]" : "",
      )}
    >
      <title id={`${id}-t`}>{textos.titulo}</title>
      <g className="fill-none stroke-tinta-3" strokeWidth={1}>
        <path d={`M${X0},12 V${Y0} H${X1}`} />
        <line x1={X0} y1={108} x2={X1} y2={108} strokeDasharray="2 4" />
        <line x1={X0} y1={12} x2={X1} y2={12} strokeDasharray="2 4" />
      </g>
      <g>
        <text x={40} y={208} textAnchor="end">
          {textos.pct(0)}
        </text>
        <text x={40} y={112} textAnchor="end">
          {textos.pct(t / 2)}
        </text>
        <text x={40} y={16} textAnchor="end">
          {textos.pct(t)}
        </text>
        <text x={X0} y={222} textAnchor="middle">
          0
        </text>
        <text x={(X0 + X1) / 2} y={222} textAnchor="middle">
          50
        </text>
        <text x={X1} y={222} textAnchor="end">
          {textos.pct(1)}
        </text>
        <text x={X1} y={242} textAnchor="end">
          {textos.ejeCobertura}
        </text>
        <text x={X0 + 4} y={30}>
          {textos.ejeRiesgo}
        </text>
      </g>
      {mini
        ? grupos.map((g) => {
            if (g === gPlan) return null;
            const x = fx(g.cobertura);
            const y = g.riesgo === null ? Y0 : fy(g.riesgo);
            const alto = 186;
            const borde = x > X1 - 40;
            return (
              <g key={g.umbrales.join("-")}>
                <line
                  x1={x}
                  y1={y - 5}
                  x2={x}
                  y2={y + 5}
                  className="stroke-tinta-2"
                />
                <text
                  x={x}
                  y={borde ? 140 : alto}
                  textAnchor={borde ? "end" : "middle"}
                >
                  {textos.grupo(g.umbrales)}
                </text>
                {borde ? (
                  <path
                    d={`M${x - 2},144 L${x - 1},${y - 8}`}
                    className="fill-none stroke-tinta-2"
                  />
                ) : null}
              </g>
            );
          })
        : null}
      {trazo ? (
        <path
          d={trazo}
          className="fill-none stroke-tinta-1"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
      {gPlan && gPlan.riesgo !== null ? (
        <g>
          <circle
            cx={fx(gPlan.cobertura)}
            cy={fy(gPlan.riesgo)}
            r={6}
            className="fill-fondo stroke-tinta-1"
            strokeWidth={2}
          />
          <text
            x={fx(gPlan.cobertura) - 8}
            y={mini ? 160 : 170}
            textAnchor="end"
            className={mini ? "font-semibold [fill:var(--tinta-1)]" : ""}
          >
            {mini
              ? textos.plan(gPlan.umbrales, gPlan.cobertura)
              : textos.plan([plan], gPlan.cobertura)}
          </text>
          <path
            d={`M${fx(gPlan.cobertura) - 6},${mini ? 164 : 174} L${fx(gPlan.cobertura) - 2},${fy(gPlan.riesgo) - 8}`}
            className="fill-none stroke-tinta-2"
          />
        </g>
      ) : null}
      {pActual && pActual.riesgo !== null && actual !== undefined ? (
        <g data-actual={actual}>
          <rect
            x={fx(pActual.cobertura) - 5}
            y={fy(pActual.riesgo) - 5}
            width={10}
            height={10}
            className="fill-tinta-1"
          />
          {!enPlan && textos.actual ? (
            <text
              x={Math.min(fx(pActual.cobertura) + 6, X1)}
              y={140}
              textAnchor="end"
              className="font-semibold [fill:var(--tinta-1)]"
            >
              {textos.actual(actual, pActual.cobertura)}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}
