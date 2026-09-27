/**
 * Orden de decisión por ondas (Kahn) con detección de ciclos que MUESTRA el ciclo (DFS), y decisiones
 * de una vía destacadas (G2, G3 del contrato). Determinista: dentro de una onda, primero las de una vía
 * y luego el resto, ambas en orden alfabético de id.
 */
import type { DecisionMinima } from "./tipos";

export type ResultadoOrden =
  | { ok: true; ondas: string[][]; una_via: string[] }
  | { ok: false; motivo: "ciclo"; ciclo: string[] }
  | {
      ok: false;
      motivo: "dependencia_desconocida";
      decision: string;
      dependencia: string;
    };

function ordenarIds(
  ids: Iterable<string>,
  unaVia: ReadonlySet<string>,
): string[] {
  const lista = [...ids].sort();
  return [
    ...lista.filter((i) => unaVia.has(i)),
    ...lista.filter((i) => !unaVia.has(i)),
  ];
}

/** Encuentra un ciclo en el grafo de dependencias restante y lo devuelve como camino `A → … → A`. */
function encontrarCiclo(
  grafo: ReadonlyMap<string, readonly string[]>,
): string[] {
  const estado = new Map<string, "visitando" | "listo">();
  const pila: string[] = [];
  const buscar = (n: string): string[] | null => {
    estado.set(n, "visitando");
    pila.push(n);
    for (const dep of [...(grafo.get(n) ?? [])].sort()) {
      const e = estado.get(dep);
      if (e === "visitando") {
        const inicio = pila.indexOf(dep);
        return [...pila.slice(inicio), dep];
      }
      if (e === undefined) {
        const c = buscar(dep);
        if (c) return c;
      }
    }
    pila.pop();
    estado.set(n, "listo");
    return null;
  };
  for (const n of [...grafo.keys()].sort()) {
    if (!estado.has(n)) {
      const c = buscar(n);
      if (c) return c;
    }
  }
  return [];
}

export function ordenarDecisiones(
  decisiones: readonly DecisionMinima[],
): ResultadoOrden {
  const ids = new Set(decisiones.map((d) => d.id));
  const unaVia = new Set(
    decisiones.filter((d) => d.reversibilidad === "una_via").map((d) => d.id),
  );
  const deps = new Map<string, readonly string[]>();
  for (const d of decisiones) {
    for (const dep of d.depende_de ?? []) {
      if (!ids.has(dep))
        return {
          ok: false,
          motivo: "dependencia_desconocida",
          decision: d.id,
          dependencia: dep,
        };
    }
    deps.set(d.id, d.depende_de ?? []);
  }

  const pendientes = new Set(ids);
  const ondas: string[][] = [];
  while (pendientes.size > 0) {
    const libres = [...pendientes].filter((id) =>
      (deps.get(id) ?? []).every((dep) => !pendientes.has(dep)),
    );
    if (libres.length === 0) {
      const restante = new Map<string, readonly string[]>();
      for (const id of pendientes)
        restante.set(
          id,
          (deps.get(id) ?? []).filter((dep) => pendientes.has(dep)),
        );
      return { ok: false, motivo: "ciclo", ciclo: encontrarCiclo(restante) };
    }
    const onda = ordenarIds(libres, unaVia);
    ondas.push(onda);
    for (const id of onda) pendientes.delete(id);
  }
  return { ok: true, ondas, una_via: [...unaVia].sort() };
}
