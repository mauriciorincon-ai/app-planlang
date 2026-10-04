/**
 * Prioridad de acción de un modo de falla por la tabla AIAG-VDA (2019) que viaja en DATOS
 * (`datos/prioridad-de-accion.json`): severidad primero (G4, G7). El RPN (S×O×D) es solo orden
 * secundario y jamás criterio de acción. Un modo con `control_legal` tiene prioridad EFECTIVA `alta`
 * sea cual sea la tabla, y la de tabla se muestra al lado (G8, v0.2.0). Un modo con prioridad
 * efectiva `alta` sin mitigación es bloqueante (G5).
 */
import tabla from "../datos/prioridad-de-accion.json";
import type { ModoDeFallaMinimo, PrioridadDeAccion } from "./tipos";

type Bandas = Record<string, [number, number]>;
export interface TablaDePrioridad {
  bandas: { severidad: Bandas; ocurrencia: Bandas; deteccion: Bandas };
  tabla: Record<string, Record<string, Record<string, PrioridadDeAccion>>>;
}

export const TABLA_AIAG_VDA: TablaDePrioridad =
  tabla as unknown as TablaDePrioridad;

function banda(valor: number, bandas: Bandas, nombre: string): string {
  if (!Number.isInteger(valor) || valor < 1 || valor > 10)
    throw new RangeError(`${nombre}=${valor}: fuera de la escala 1–10`);
  for (const [etiqueta, [min, max]] of Object.entries(bandas)) {
    if (valor >= min && valor <= max) return etiqueta;
  }
  throw new RangeError(`${nombre}=${valor}: sin banda en la tabla`);
}

export function prioridadDeAccion(
  severidad: number,
  ocurrencia: number,
  deteccion: number,
  t: TablaDePrioridad = TABLA_AIAG_VDA,
): PrioridadDeAccion {
  const s = banda(severidad, t.bandas.severidad, "severidad");
  const o = banda(ocurrencia, t.bandas.ocurrencia, "ocurrencia");
  const d = banda(deteccion, t.bandas.deteccion, "deteccion");
  const p = t.tabla[s]?.[o]?.[d];
  if (!p)
    throw new RangeError(
      `sin entrada en la tabla para S ${s} · O ${o} · D ${d}`,
    );
  return p;
}

export function rpn(m: ModoDeFallaMinimo): number {
  return m.severidad * m.ocurrencia * m.deteccion;
}

export interface Prioridades {
  /** La que manda la acción: `alta` si hay control legal; si no, la de la tabla. */
  prioridad_de_accion: PrioridadDeAccion;
  /** La que da la tabla AIAG-VDA por S·O·D; se muestra siempre, nunca se oculta (G8). */
  prioridad_de_tabla: PrioridadDeAccion;
  control_legal: boolean;
}

export function prioridades(
  m: ModoDeFallaMinimo,
  t: TablaDePrioridad = TABLA_AIAG_VDA,
): Prioridades {
  const deTabla = prioridadDeAccion(m.severidad, m.ocurrencia, m.deteccion, t);
  const legal = m.control_legal === true;
  return {
    prioridad_de_accion: legal ? "alta" : deTabla,
    prioridad_de_tabla: deTabla,
    control_legal: legal,
  };
}

export interface ModoEvaluado extends Prioridades {
  id: string;
  rpn: number;
  bloqueante: boolean;
}

const ORDEN_PRIORIDAD: Record<PrioridadDeAccion, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

/** Evalúa cada modo y devuelve la lista ordenada: prioridad efectiva (alta primero), luego RPN descendente, luego id. */
export function evaluarModosDeFalla(
  modos: readonly ModoDeFallaMinimo[],
  t: TablaDePrioridad = TABLA_AIAG_VDA,
): ModoEvaluado[] {
  return modos
    .map((m) => {
      const p = prioridades(m, t);
      return {
        id: m.id,
        ...p,
        rpn: rpn(m),
        bloqueante:
          p.prioridad_de_accion === "alta" &&
          (m.mitigaciones ?? []).length === 0,
      };
    })
    .sort(
      (a, b) =>
        ORDEN_PRIORIDAD[a.prioridad_de_accion] -
          ORDEN_PRIORIDAD[b.prioridad_de_accion] ||
        b.rpn - a.rpn ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
