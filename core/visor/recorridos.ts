/**
 * Los recorridos del mapa (contrato 0.5.0 § 3.5) desde las trazas de la corrida: UN recorrido por CAMINO distinto
 * (la sucesión de nodos que siguió un caso), con los casos que lo siguieron en su título. Veinte trazas dan unos
 * pocos caminos y doscientas, los que haya: el mapa no crece con el lote. El paso usa los textos del nodo (qué hace,
 * por qué importa y el registro experto); el camino es lineal, así que ningún paso bifurca (V12) y cada uno sigue al
 * anterior. Puro: sin reloj ni azar; el orden es por número de casos y, a igualdad, por el primer caso.
 */
import { idDeMapa } from "./ids";
import type { TextosDeNodo } from "./mapa";
import type { PasoRecorrido, Recorrido, TextoIdioma } from "./tipos";

export interface TrazaParaRecorrido {
  caso_id: string;
  /** Los nodos que visitó, en orden (ids del código; los de un mismo nodo pueden repetirse). */
  pasos: ReadonlyArray<{ nodo: string }>;
}

/** Cuántos casos nombra el título antes de resumir el resto. */
const CASOS_EN_TITULO = 4;

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function titulo(k: number, casos: readonly string[]): TextoIdioma {
  const n = casos.length;
  const vistos = casos.slice(0, CASOS_EN_TITULO).join(", ");
  const resto = n - CASOS_EN_TITULO;
  return {
    es: `Camino ${k} · ${n} ${n === 1 ? "caso" : "casos"}: ${vistos}${resto > 0 ? ` y ${resto} más` : ""}`,
    en: `Path ${k} · ${n} ${n === 1 ? "case" : "cases"}: ${vistos}${resto > 0 ? ` and ${resto} more` : ""}`,
  };
}

export function recorridosDeTrazas(
  trazas: readonly TrazaParaRecorrido[],
  textos: Readonly<Record<string, TextosDeNodo>>,
): Recorrido[] {
  const porCamino = new Map<string, { nodos: string[]; casos: string[] }>();
  for (const t of [...trazas].sort((a, b) => cmp(a.caso_id, b.caso_id))) {
    const nodos = t.pasos.map((p) => p.nodo);
    if (nodos.length < 2) continue;
    const clave = nodos.join(">");
    const c = porCamino.get(clave) ?? { nodos, casos: [] };
    c.casos.push(t.caso_id);
    porCamino.set(clave, c);
  }
  const caminos = [...porCamino.values()].sort(
    (a, b) => b.casos.length - a.casos.length || cmp(a.casos[0]!, b.casos[0]!),
  );
  return caminos.map((c, k) => ({
    id: `camino-${k + 1}`,
    titulo: titulo(k + 1, c.casos),
    pasos: c.nodos.map((nodo, j): PasoRecorrido => {
      const t = textos[nodo];
      if (!t)
        throw new Error(
          `visor: el recorrido pasa por «${nodo}», que no tiene textos`,
        );
      return {
        id: `p${j + 1}`,
        nodo_id: idDeMapa(nodo),
        que_pasa: t.lider,
        lider: t.por_que_importa,
        experto: t.experto,
      };
    }),
  }));
}
