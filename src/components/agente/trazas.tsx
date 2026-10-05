import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { Idioma } from "@core/formatos/bilingue";
import type { IdDemo } from "@/lib/demos";
import type { FilaTraza, PanelNodo } from "@/lib/vista/agente";
import { decimal } from "@/lib/vista/formato";
import { PANEL } from "@/textos/agente";
import { Chip } from "../chip";
import { CODIGO_EN_LINEA } from "../con-codigo";
import { cx } from "../cx";
import { Icono } from "../icono";
import { VerMas } from "../ver-mas";
import { Definiciones, RefNodo } from "./piezas";
import { delVocabulario } from "@/lib/vista/vocabulario";

/**
 * Cómo se reparte el ancho entre las tres columnas de cada nodo y cuáles van en la mono (tiempos, costos,
 * reglas, acciones): la presentación que aprobó la maqueta. Caso y tipo van siempre a 60 y 110 px.
 */
type Presentacion = { cols: string; mono: number[] };

/** Por demo: un mismo nombre de nodo (`enrutador`, `decision`) lleva otras columnas en cada uno. */
const PRESENTACION: Readonly<
  Record<IdDemo, Readonly<Record<string, Presentacion>>>
> = {
  "demo-a": {
    enrutador: {
      cols: "minmax(0,1fr) minmax(0,0.6fr) minmax(0,1.2fr)",
      mono: [],
    },
    extractor: {
      cols: "minmax(0,1.3fr) minmax(0,0.5fr) minmax(0,1.4fr)",
      mono: [1, 2],
    },
    aclaracion: {
      cols: "minmax(0,0.5fr) minmax(0,1fr) minmax(0,1.4fr)",
      mono: [0, 2],
    },
    verificador_cobertura: {
      cols: "minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,0.9fr)",
      mono: [2],
    },
    decision: {
      cols: "minmax(0,1.3fr) minmax(0,0.6fr) minmax(0,1fr)",
      mono: [0],
    },
    pausa_humana: {
      cols: "minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,0.8fr)",
      mono: [],
    },
    redactor: {
      cols: "minmax(0,0.6fr) minmax(0,0.5fr) minmax(0,1.4fr)",
      mono: [2],
    },
    guardia_salida: {
      cols: "minmax(0,1.2fr) minmax(0,0.6fr) minmax(0,0.7fr)",
      mono: [0, 2],
    },
  },
  // El B, mirada de FORMA «no vista» (S3): la cifra con barra y los textos más largos se llevan el ancho.
  "demo-b": {
    enrutador: {
      cols: "minmax(0,0.8fr) minmax(0,0.6fr) minmax(0,1.2fr)",
      mono: [1],
    },
    extractor: {
      cols: "minmax(0,0.8fr) minmax(0,0.5fr) minmax(0,1.4fr)",
      mono: [1, 2],
    },
    verificador_listas: {
      cols: "minmax(0,1.3fr) minmax(0,0.6fr) minmax(0,0.9fr)",
      mono: [1],
    },
    investigador: {
      cols: "minmax(0,0.9fr) minmax(0,0.6fr) minmax(0,1.4fr)",
      mono: [1, 2],
    },
    puntaje: {
      cols: "minmax(0,0.6fr) minmax(0,0.7fr) minmax(0,1fr)",
      mono: [0, 1],
    },
    decision: {
      cols: "minmax(0,1.3fr) minmax(0,0.6fr) minmax(0,1fr)",
      mono: [0],
    },
    pausa_humana: {
      cols: "minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,0.8fr)",
      mono: [],
    },
    redactor: {
      cols: "minmax(0,0.7fr) minmax(0,0.6fr) minmax(0,1.2fr)",
      mono: [2],
    },
    guardia_salida: {
      cols: "minmax(0,1.2fr) minmax(0,0.6fr) minmax(0,0.7fr)",
      mono: [0, 2],
    },
  },
};

const PRESENTACION_DONDE = "PRESENTACION (src/components/agente/trazas.tsx)";

const MONO = "font-mono text-dato leading-[1.4] text-tinta-2";

/** Un valor de la traza: un nodo (o un camino de nodos) con su glifo, una señal en mono, o texto. */
function Valor({
  v,
  tipoDe,
}: {
  v: string;
  tipoDe: Readonly<Record<string, string>>;
}) {
  const partes = v.split(" → ");
  if (partes.every((p) => tipoDe[p]))
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1.5">
        {partes.map((p, k) => (
          <span key={`${p}-${k}`} className="inline-flex items-center gap-1.5">
            {k > 0 ? "→" : null}
            <RefNodo nombre={p} tipo={tipoDe[p]!} />
          </span>
        ))}
      </span>
    );
  if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(v))
    return <code className={CODIGO_EN_LINEA}>{v}</code>;
  return <>{v}</>;
}

/** La confianza que dijo el extractor: la cifra y su barra, con la marca del umbral del plan. */
function Senal({
  texto,
  valor,
  umbral,
}: {
  texto: string;
  valor: number;
  umbral: number;
}) {
  const pct = (x: number) =>
    `${decimal(Math.max(0, Math.min(1, x)) * 100, 1, "en")}%`;
  return (
    <span className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5">
      <b className="text-chico font-semibold tabular-nums">{texto}</b>
      <span
        aria-hidden="true"
        className="relative block h-1.5 rounded-[3px] bg-linea"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-l-[3px] bg-tinta-2"
          style={{ width: pct(valor) }}
        />
        <span
          className="absolute -inset-y-1.25 -ml-px w-0.5 bg-tinta-1"
          style={{ left: pct(umbral) }}
        />
      </span>
    </span>
  );
}

function Fila({
  f,
  p,
  tipoDe,
  idioma,
  columnas,
}: {
  f: FilaTraza;
  p: Presentacion;
  tipoDe: Readonly<Record<string, string>>;
  idioma: Idioma;
  /** Los nombres de las columnas (caso, tipo y las del nodo): el lector los oye en cada celda (AU-S2-15). */
  columnas: readonly string[];
}) {
  // La fila es un `<summary>` desplegable: no admite roles de tabla, así que cada celda dice su columna al lector.
  const col = (k: number) => <span className="sr-only">{columnas[k]}: </span>;
  return (
    <details className="group border-t border-linea">
      <summary className="grid cursor-pointer list-none grid-cols-[16px_52px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 py-2.5 text-chico hover:bg-sup-1 focus-visible:rounded-chip escritorio:grid-cols-[16px_var(--cols)] escritorio:gap-3.5 [&::-webkit-details-marker]:hidden [&>:nth-child(n+4)]:col-start-3 escritorio:[&>:nth-child(n+4)]:col-start-auto">
        <Icono
          de={ArrowRight}
          tam={14}
          className="text-tinta-2 transition-transform group-open:rotate-90"
        />
        <span className="font-mono text-dato font-medium">
          {col(0)}
          {f.id}
        </span>
        <span className="justify-self-start">
          {col(1)}
          <Chip procedencia="declarado">{f.tipo}</Chip>
        </span>
        {f.celdas.map((c, k) =>
          k === 0 && f.barra ? (
            <span key={k} className="min-w-0">
              {col(k + 2)}
              <Senal texto={c} valor={f.barra.valor} umbral={f.barra.umbral} />
            </span>
          ) : (
            <span key={k} className={cx("min-w-0", p.mono.includes(k) && MONO)}>
              {col(k + 2)}
              {p.mono.includes(k) ? c : <Valor v={c} tipoDe={tipoDe} />}
            </span>
          ),
        )}
      </summary>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 pt-0.5 pb-4.5 escritorio:grid-cols-2 escritorio:pl-7.5">
        <div className="grid min-w-0 content-start gap-1.5">
          <span className="text-dato text-tinta-2">
            {PANEL.trazas_.solicitud[idioma]}
          </span>
          <p className="border-l-2 border-linea pl-3 text-apoyo leading-normal">
            «{f.solicitud}»
          </p>
          <p className="mt-2">
            <a
              href={f.enlace}
              className="inline-flex items-center gap-1.5 text-dato text-tinta-1"
            >
              {PANEL.trazas_.verCaso[idioma]} →
              <span className="sr-only"> {f.id}</span>
            </a>
          </p>
        </div>
        <div className="min-w-0">
          <Definiciones
            filas={f.pares.map((x) => ({ k: x.k, v: x.v }))}
            valor={(v) => <Valor v={v} tipoDe={tipoDe} />}
          />
        </div>
      </div>
    </details>
  );
}

/** Las trazas reales de un nodo: 5 a la vista, el resto tras «Ver N más», y la nota de la corrida. */
export function TablaTrazas({
  panel,
  demo,
  tipoDe,
  idioma,
  chip,
}: {
  panel: PanelNodo;
  demo: IdDemo;
  tipoDe: Readonly<Record<string, string>>;
  idioma: Idioma;
  chip: ReactNode;
}) {
  const t = panel.trazas;
  const p = delVocabulario(
    PRESENTACION[demo],
    panel.nombre,
    PRESENTACION_DONDE,
  );
  const vistas = t.filas.slice(0, t.visibles);
  const resto = t.filas.slice(t.visibles);
  const fila = (f: FilaTraza) => (
    <Fila
      key={f.id}
      f={f}
      p={p}
      tipoDe={tipoDe}
      idioma={idioma}
      columnas={[
        PANEL.trazas_.caso[idioma],
        PANEL.trazas_.tipo[idioma],
        ...t.columnas,
      ]}
    />
  );
  const rango =
    resto.length <= 3
      ? resto.map((f) => f.id).join(", ")
      : `${resto[0]!.id} … ${resto.at(-1)!.id}`;
  return (
    <div>
      <div
        className="grid"
        style={{ "--cols": `60px 110px ${p.cols}` } as CSSProperties}
      >
        <div
          aria-hidden="true"
          className="hidden gap-3.5 pb-1.5 text-dato text-tinta-2 escritorio:grid escritorio:grid-cols-[16px_var(--cols)]"
        >
          <span />
          <span>{PANEL.trazas_.caso[idioma]}</span>
          <span>{PANEL.trazas_.tipo[idioma]}</span>
          {t.columnas.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {vistas.map(fila)}
        {resto.length ? (
          <VerMas
            id={`mas-tr-${panel.id}`}
            mas={
              PANEL.trazas_.verMas({ n: resto.length, casos: rango })[idioma]
            }
            menos={PANEL.trazas_.verMenos[idioma]}
          >
            {resto.map(fila)}
          </VerMas>
        ) : null}
      </div>
      <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-dato text-tinta-2">
        {t.nota} {chip}
      </p>
    </div>
  );
}
