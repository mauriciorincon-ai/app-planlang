/**
 * Disposición del lienzo del visor (ADR-010): columnas = bandas de clase capa en el orden de la gramática (D1),
 * con la geometría de la maqueta aprobada (columna 160 u, paso 172, nodo 160 × 56, filas cada 140 u).
 *
 * Filas por «serpiente»: el camino principal (desde el inicio, siguiendo la rama por defecto o la única
 * secuencia de cada nodo) avanza de izquierda a derecha en su fila y abre fila nueva —dejando una intermedia—
 * cuando vuelve atrás. Los nodos fuera del camino se colocan en la fila intermedia, en profundidad desde el
 * nodo del camino que los alcanza primero (el orden de los flujos decide). Sin azar ni fuerzas (D3).
 */
import { esPorDefecto } from "./condicion";
import type { Gramatica, Mapa } from "./tipos";

export const MARGEN = 10;
export const COL_ANCHO = 160;
export const PASO_COLUMNA = 172;
export const NODO_ALTO = 56;
export const PASO_FILA = 140;

export interface Celda {
  columna: number;
  fila: number;
}

export interface Disposicion {
  /** Bandas de clase capa, en orden. */
  columnas: string[];
  celdas: Map<string, Celda>;
  /** Nodos del camino principal, en orden. */
  camino: string[];
  filas: number;
}

export function xColumna(i: number): number {
  return MARGEN + i * PASO_COLUMNA;
}

export function columnasDe(g: Gramatica): string[] {
  return g.bandas
    .filter((b) => b.clase === "capa")
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((b) => b.id);
}

export function disponer(
  mapa: Mapa,
  g: Gramatica,
  inicio: readonly string[],
): Disposicion {
  const columnas = columnasDe(g);
  const colDe = (id: string) => {
    const n = mapa.nodos.find((x) => x.id === id);
    const c = n ? columnas.indexOf(n.banda_id) : -1;
    if (c < 0)
      throw new Error(`visor: el nodo «${id}» no está en una banda de capa`);
    return c;
  };
  const salientes = (id: string) => mapa.flujos.filter((f) => f.origen === id);
  const siguiente = (id: string): string | undefined => {
    const s = salientes(id);
    const defecto = s.find((f) => esPorDefecto(f.condicion));
    if (defecto) return defecto.destino;
    const secuencias = [
      ...new Set(
        s.filter((f) => f.modo_id === "secuencia").map((f) => f.destino),
      ),
    ];
    return secuencias.length === 1 ? secuencias[0] : undefined;
  };

  const celdas = new Map<string, Celda>();
  const ocupada = (c: Celda) =>
    [...celdas.values()].some(
      (o) => o.columna === c.columna && o.fila === c.fila,
    );
  const camino: string[] = [];
  let actual = inicio.find((id) => mapa.nodos.some((n) => n.id === id));
  let fila = 0;
  while (actual !== undefined && !celdas.has(actual)) {
    const columna = colDe(actual);
    const previo = camino[camino.length - 1];
    if (previo !== undefined) {
      const p = celdas.get(previo) as Celda;
      if (columna <= p.columna || ocupada({ columna, fila })) fila += 2;
    }
    celdas.set(actual, { columna, fila });
    camino.push(actual);
    actual = siguiente(actual);
  }

  const libreDesde = (columna: number, desde: number): Celda => {
    for (let f = desde; ; f++)
      if (!ocupada({ columna, fila: f })) return { columna, fila: f };
  };
  const enCamino = new Set(camino);
  const visitar = (id: string) => {
    const base = celdas.get(id) as Celda;
    for (const f of salientes(id)) {
      if (celdas.has(f.destino)) continue;
      const fila0 = enCamino.has(id) ? base.fila + 1 : base.fila;
      celdas.set(f.destino, libreDesde(colDe(f.destino), fila0));
      visitar(f.destino);
    }
  };
  for (const id of camino) visitar(id);
  // Lo que ningún flujo alcanza (p. ej. nodos exigidos por el plan y ausentes del grafo) va, en el orden
  // del mapa, a la primera fila libre de su columna.
  for (const n of mapa.nodos)
    if (!celdas.has(n.id)) celdas.set(n.id, libreDesde(colDe(n.id), 0));

  const filas = Math.max(0, ...[...celdas.values()].map((c) => c.fila)) + 1;
  return { columnas, celdas, camino, filas };
}
