/**
 * Lo que NO es un ícono de Lucide se dibuja (design-system § 2.5): los glifos de tipo de la gramática
 * `agentes-ia`, las marcas de veredicto y de procedencia, y la marca de planlang. La geometría se calcula
 * aquí (polígonos regulares y una estrella de cinco puntas); ninguna ruta se copia de la maqueta.
 */
import type { FormaDeGlifo } from "@/lib/vista/nodos";

const r2 = (x: number) => Math.round(x * 100) / 100;

function poligono(radios: number[], giro = -90): string {
  const n = radios.length;
  return (
    radios
      .map((r, i) => {
        const a = ((giro + (360 / n) * i) * Math.PI) / 180;
        return `${i === 0 ? "M" : "L"}${r2(r * Math.cos(a))},${r2(r * Math.sin(a))}`;
      })
      .join(" ") + " Z"
  );
}

/** Rutas de los cinco glifos en una caja de −9 a 9. */
export const RUTA_GLIFO: Record<FormaDeGlifo, string> = {
  estrella: poligono(Array.from({ length: 10 }, (_, i) => (i % 2 ? 3.5 : 8.2))),
  triangulo: "M0,-7.5 L7.5,6 L-7.5,6 Z",
  hexagono: poligono([8, 8, 8, 8, 8, 8]),
  cuadrado: "M-6.5,-6.5 H6.5 V6.5 H-6.5 Z",
  rombo: poligono([8, 8, 8, 8]),
};

/** Glifo de tipo de nodo, relleno con el color que le da quien lo usa (`fill`). Hueco si es «exigido y ausente». */
export function Glifo({
  forma,
  tam = 10,
  hueco = false,
  className,
}: {
  forma: FormaDeGlifo;
  tam?: number;
  hueco?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="-9 -9 18 18"
      width={tam}
      height={tam}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d={RUTA_GLIFO[forma]}
        fill={hueco ? "none" : "currentColor"}
        stroke={hueco ? "currentColor" : "none"}
        strokeWidth={hueco ? 1.6 : undefined}
      />
    </svg>
  );
}

export type TipoDeMarca =
  "cumple" | "alerta" | "no-cumple" | "beta" | "falta" | "real" | "maqueta";

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function dibujo(tipo: TipoDeMarca) {
  switch (tipo) {
    case "cumple":
      // ✓ en círculo relleno: el visto se recorta con el color del fondo.
      return (
        <>
          <circle r={7.5} fill="currentColor" />
          <path
            d="M-3.6,0.3 L-1.2,2.8 L3.8,-2.5"
            {...TRAZO}
            stroke="var(--fondo)"
            strokeWidth={1.9}
          />
        </>
      );
    case "alerta":
      return (
        <>
          <path d="M0,-7 L7.2,6 H-7.2 Z" {...TRAZO} strokeWidth={1.6} />
          <path d="M0,-2.2 V2 M0,4 V4.4" {...TRAZO} strokeWidth={1.8} />
        </>
      );
    case "no-cumple":
      return (
        <>
          <circle r={7.5} {...TRAZO} strokeWidth={1.6} />
          <path
            d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4"
            {...TRAZO}
            strokeWidth={1.9}
          />
        </>
      );
    case "beta":
      // En construcción: círculo discontinuo con dos barras (pausa).
      return (
        <>
          <circle
            r={7.5}
            {...TRAZO}
            strokeWidth={1.4}
            strokeDasharray="3 2.5"
          />
          <path
            d="M-2.5,-3.5 V3.5 M2.5,-3.5 V3.5"
            {...TRAZO}
            strokeWidth={1.8}
          />
        </>
      );
    case "falta":
      return (
        <circle
          r={6.3}
          {...TRAZO}
          strokeWidth={1.5}
          strokeDasharray="2.6 2.1"
        />
      );
    case "real":
      return <circle r={5.5} fill="currentColor" />;
    case "maqueta":
      return (
        <circle r={5.5} {...TRAZO} strokeWidth={1.8} strokeDasharray="2.5 2" />
      );
  }
}

/** Marca dibujada (veredicto, procedencia, «sin probar»). Toma el color de `currentColor`. */
export function Marca({
  tipo,
  tam = 14,
  className,
}: {
  tipo: TipoDeMarca;
  tam?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="-8 -8 16 16"
      width={tam}
      height={tam}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {dibujo(tipo)}
    </svg>
  );
}

/** Flecha corta entre dos piezas de una cadena. */
export function Flecha({
  tam = 10,
  trazo = "currentColor",
  className,
}: {
  tam?: number;
  /** Las flechas son guías gráficas: pueden ir en `var(--tinta-3)`, vetada como texto. */
  trazo?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="-6 -6 12 12"
      width={tam}
      height={tam}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M-4,0 H4 M1,-3 L4,0 L1,3"
        {...TRAZO}
        stroke={trazo}
        strokeWidth={1.6}
      />
    </svg>
  );
}

/** La marca de planlang: el plan (círculo), la brecha (trazo discontinuo) y lo construido (caja). */
export function MarcaPlanlang({ tam = 18 }: { tam?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={tam}
      height={tam}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={5} cy={10} r={3} {...TRAZO} strokeWidth={1.6} />
      <path
        d="M8 10 H12"
        {...TRAZO}
        strokeLinecap="butt"
        strokeWidth={1.6}
        strokeDasharray="1.6 1.6"
      />
      <rect
        x={12}
        y={6}
        width={7}
        height={8}
        rx={1.5}
        {...TRAZO}
        strokeWidth={1.6}
      />
    </svg>
  );
}
