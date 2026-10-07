/**
 * Qué casos tienen su propia página (S3, decisión del usuario del 2026-10-04: «Solo los que se nombran»). Con la
 * corrida de 200 del A, una página por caso llevaría el paquete de hoja-de-vida de 32 MB a unos 110 MB. Llevan página
 * los primeros `PRIMEROS_CON_PAGINA` casos del lote y los que el informe señala uno por uno: los casos ejemplares, los
 * que incumplen un criterio, los de un riesgo ocurrido, los de una brecha no prevista y los que están justo en un
 * umbral. La lista de casos en que la línea base difiere (S3) no entra: puede ser casi toda la corrida. El Playground,
 * la Brecha, el Agente y la portada de Casos miden y cuentan sobre la corrida entera; un caso sin página se lista sin
 * enlace. Una corrida de 20, como la del B, tiene página para todos.
 */
import type { Idioma } from "@core/formatos/bilingue";
import type { DatosDemo } from "@/lib/datos/vitrina";
import { ruta } from "@/lib/ruta";

/** Los primeros del lote que llevan página aunque el informe no los señale: un bloque de lote completo. */
export const PRIMEROS_CON_PAGINA = 20;

const cache = new WeakMap<DatosDemo, ReadonlySet<string>>();

/** Los casos que el informe señala uno por uno (no la lista de diferencias con la línea base). */
function senaladosPorElInforme(d: DatosDemo): Set<string> {
  const inf = d.informe;
  const ids = new Set<string>();
  for (const e of Object.values(inf.casos_ejemplares))
    if (e?.caso_id) ids.add(e.caso_id);
  for (const c of inf.criterios)
    c.casos_que_incumplen.forEach((x) => ids.add(x));
  for (const r of inf.riesgos) r.casos.forEach((x) => ids.add(x));
  for (const b of inf.brechas_no_previstas.brechas)
    if (b.caso_id && b.corrida_id === d.corrida.manifiesto.corrida_id)
      ids.add(b.caso_id);
  for (const e of inf.brechas_no_previstas.evaluadores)
    e.fallas.forEach((x) => ids.add(x));
  for (const u of inf.playground.umbrales)
    u.casos_en_el_umbral.forEach((x) => ids.add(x));
  return ids;
}

/** Los casos con página, en el orden de la corrida. */
export function casosConPagina(d: DatosDemo): ReadonlySet<string> {
  const hecho = cache.get(d);
  if (hecho) return hecho;
  const primeros = primerosDelLote(d);
  const senalados = senaladosPorElInforme(d);
  const con = new Set(
    d.corrida.trazas
      .map((t) => t.caso_id)
      .filter((id) => primeros.has(id) || senalados.has(id)),
  );
  cache.set(d, con);
  return con;
}

/** El primer bloque del lote (`PRIMEROS_CON_PAGINA` casos): lo que listan las tablas de trazas del Agente. */
export function primerosDelLote(d: DatosDemo): ReadonlySet<string> {
  return new Set(d.lote.casos.slice(0, PRIMEROS_CON_PAGINA).map((c) => c.id));
}

/** La ruta de la página del caso, o `null` si el caso no tiene página: se lista sin enlace. */
export function enlaceACaso(
  d: DatosDemo,
  id: string,
  i: Idioma,
): string | null {
  return casosConPagina(d).has(id) ? ruta(i, "caso", id, d.id) : null;
}
