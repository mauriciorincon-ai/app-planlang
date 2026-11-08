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

/**
 * La zona respaldada (S8): los umbrales de la rejilla que los datos respaldan. Se dibuja como una banda con trama
 * diagonal y tinte de «cumple» entre la menor y la mayor cobertura de esos umbrales; el color nunca va solo, la leyenda
 * y la tabla la nombran. Sin lógica: el cálculo viene del informe.
 */
export interface ZonaDeLaCurva {
  umbrales: readonly number[];
  /** Lo que lee el lector de pantalla: «zona respaldada de 0,50 a 0,90». */
  titulo: string;
}

const ANCHO_CARACTER = 6.6;
const FILAS_ROTULO = [186, 172, 158];
const FILAS_ROTULO_BORDE = [140, 126, 112];

/**
 * Dónde va el rótulo de cada grupo de la curva mini. Con la cobertura entre 84 y 99 % los grupos quedan a pocos
 * píxeles unos de otros y sus rótulos se pisaban: cada uno toma la primera fila en la que no toca al anterior (los
 * del borde derecho, alineados a su final, tienen sus propias filas). Si ninguna cabe, va a la última.
 */
export function rotulosDeGrupos(
  grupos: ReadonlyArray<{
    umbrales: number[];
    cobertura: number;
    riesgo: number | null;
  }>,
  rotulo: (umbrales: number[]) => string,
  fy: (riesgo: number) => number,
) {
  const ultimo = new Map<string, number>();
  return [...grupos]
    .sort((a, b) => a.cobertura - b.cobertura)
    .map((g) => {
      const x = fx(g.cobertura);
      const y = g.riesgo === null ? Y0 : fy(g.riesgo);
      const texto = rotulo(g.umbrales);
      const borde = x > X1 - 40;
      const ancho = texto.length * ANCHO_CARACTER + 6;
      const desde = borde ? x - ancho : x - ancho / 2;
      const hasta = borde ? x : x + ancho / 2;
      const filas = borde ? FILAS_ROTULO_BORDE : FILAS_ROTULO;
      const fila =
        filas.find(
          (f) => desde > (ultimo.get(`${borde}${f}`) ?? -Infinity) + 4,
        ) ?? (filas[filas.length - 1] as number);
      ultimo.set(`${borde}${fila}`, hasta);
      return { g, x, y, texto, borde, fila };
    });
}

export function Curva({
  puntos,
  plan,
  actual,
  textos,
  mini = false,
  id,
  zona,
}: {
  puntos: readonly PuntoCurva[];
  plan: number;
  actual?: number;
  textos: TextosCurva;
  mini?: boolean;
  id: string;
  zona?: ZonaDeLaCurva | null;
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
  const cobZona = zona
    ? puntos
        .filter((p) => zona.umbrales.some((u) => Math.abs(u - p.umbral) < 1e-9))
        .map((p) => p.cobertura)
    : [];
  const banda =
    cobZona.length > 0
      ? {
          x: fx(Math.min(...cobZona)) - 6,
          ancho: fx(Math.max(...cobZona)) - fx(Math.min(...cobZona)) + 12,
        }
      : null;
  return (
    <svg
      id={id}
      viewBox="0 0 480 250"
      role="img"
      aria-labelledby={`${id}-t`}
      aria-describedby={banda ? `${id}-d` : undefined}
      className={cx(
        "block h-auto w-full overflow-visible [&_text]:fill-tinta-2 [&_text]:font-mono [&_text]:text-[11px]",
        mini ? "max-w-[480px]" : "",
      )}
    >
      <title id={`${id}-t`}>{textos.titulo}</title>
      {banda && zona ? (
        <>
          <desc id={`${id}-d`}>{zona.titulo}</desc>
          <defs>
            <pattern
              id={`${id}-trama`}
              width={6}
              height={6}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={6}
                strokeWidth={1.5}
                strokeOpacity={0.5}
                style={{ stroke: "var(--cumple)" }}
              />
            </pattern>
          </defs>
          <g data-zona="respaldada">
            <rect
              x={banda.x}
              y={12}
              width={banda.ancho}
              height={Y0 - 12}
              style={{ fill: "var(--cumple-tinte)" }}
            />
            <rect
              x={banda.x}
              y={12}
              width={banda.ancho}
              height={Y0 - 12}
              fill={`url(#${id}-trama)`}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              style={{ stroke: "var(--cumple)" }}
            />
          </g>
        </>
      ) : null}
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
        ? rotulosDeGrupos(
            grupos.filter((g) => g !== gPlan),
            textos.grupo,
            fy,
          ).map(({ g, x, y, texto, borde, fila }) => (
            <g key={g.umbrales.join("-")}>
              <line
                x1={x}
                y1={y - 5}
                x2={x}
                y2={y + 5}
                className="stroke-tinta-2"
              />
              <text x={x} y={fila} textAnchor={borde ? "end" : "middle"}>
                {texto}
              </text>
              {borde ? (
                <path
                  d={`M${x - 2},${fila + 4} L${x - 1},${y - 8}`}
                  className="fill-none stroke-tinta-2"
                />
              ) : null}
            </g>
          ))
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
