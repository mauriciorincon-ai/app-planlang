/**
 * Gate «diagrama = grafo» (S2, orden § fase 2): lo que dibuja el visor es exactamente lo que dicen el grafo
 * compilado y el contrato de grafo del plan. Biyección de:
 *
 * - NODOS: todo nodo del plan está en el mapa (implementado si está en el grafo; «exigido por el plan» si no) y
 *   todo nodo del grafo está en el mapa (con la marca «fuera del contrato» si el plan no lo declara);
 * - REGLAS: cada arista condicional del plan cuyo nodo existe es un flujo del mapa con su condición y su ORDEN
 *   (la precedencia: el flujo `…-r<orden>`), y ningún flujo condicional del mapa es una regla que el plan no
 *   declara (AU-S2-B49);
 * - RAMAS POR DEFECTO: cada «si no» del grafo (o el `si_falso` de una regla) es un flujo `…-defecto`, y no hay
 *   otro;
 * - ARISTAS: cada arista de LangGraph entre nodos es al menos un flujo del mapa y cada flujo del mapa es una
 *   arista de LangGraph;
 * - TERMINALES (0.5.0): los nodos con `papel` inicio/fin son exactamente los que siguen a `__start__` y los que
 *   llegan a `__end__`.
 *
 * Las ausencias se reportan por nombre; nada se completa por inferencia (G14). Desde el 0.5.0 la condición viaja en
 * su forma (tripleta, función con sus entradas o rama por defecto) y se compara entera, entradas incluidas.
 */
import type { ContratoDeGrafo } from "../plan/esquema";
import { idDeMapa } from "./ids";
import { condicionEnTexto, esPorDefecto, esRegla } from "./condicion";
import {
  FIN,
  FUERA_DEL_CONTRATO,
  INICIO,
  condicionDeRegla,
  terminales,
  type GrafoParaMapa,
} from "./mapa";
import type { Mapa } from "./tipos";

export interface ComparacionDiagrama {
  ok: boolean;
  nodos: {
    contrato: number;
    enGrafo: number;
    /** Del plan y del grafo: el «8 de 8». */
    coinciden: number;
    exigidosAusentes: string[];
    fueraDelContrato: string[];
  };
  reglas: {
    contrato: number;
    /** Reglas del plan dibujadas con su condición: el «9 de 9». */
    dibujadas: number;
    exigidasAusentes: string[];
  };
  aristas: { grafo: number; dibujadas: number };
  /** Lo que rompe la igualdad: vacío si `ok`. */
  fallas: string[];
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function diagramaIgualGrafo(
  mapa: Mapa,
  grafo: GrafoParaMapa,
  contrato: ContratoDeGrafo,
): ComparacionDiagrama {
  const fallas: string[] = [];
  const enMapa = new Map(mapa.nodos.map((n) => [n.id, n] as const));
  const plan = new Set(contrato.nodos_esperados.map((n) => idDeMapa(n.id)));
  const enGrafo = new Set(grafo.nodos.map((n) => idDeMapa(n.id)));

  for (const id of [...plan].sort(cmp)) {
    const n = enMapa.get(id);
    if (!n) fallas.push(`nodo del plan ausente del dibujo: ${id}`);
    else if (!enGrafo.has(id) && n.madurez !== "exigido-por-el-plan")
      fallas.push(
        `nodo exigido y ausente del grafo sin la marca «exigido»: ${id}`,
      );
    else if (enGrafo.has(id) && n.madurez !== "implementado")
      fallas.push(`nodo del grafo dibujado como no implementado: ${id}`);
  }
  for (const id of [...enGrafo].sort(cmp)) {
    const n = enMapa.get(id);
    if (!n) fallas.push(`nodo del grafo ausente del dibujo: ${id}`);
    else if (
      !plan.has(id) &&
      !(n.refs_externas ?? []).includes(FUERA_DEL_CONTRATO)
    )
      fallas.push(`nodo fuera del contrato sin su marca: ${id}`);
  }
  for (const id of [...enMapa.keys()].sort(cmp))
    if (!plan.has(id) && !enGrafo.has(id))
      fallas.push(
        `nodo dibujado que no está ni en el plan ni en el grafo: ${id}`,
      );

  // Reglas del plan ↔ flujos condicionales con condición (sin contar el «si no»).
  const reglasMapa = mapa.flujos.filter((f) => esRegla(f.condicion));
  const usados = new Set<string>();
  const exigidasAusentes: string[] = [];
  let dibujadas = 0;
  for (const r of contrato.aristas_condicionales) {
    const desde = idDeMapa(r.desde);
    const hacia = idDeMapa(r.si_verdadero);
    const nombre = `${r.desde}#${r.orden}`;
    if (!enGrafo.has(desde) || !enGrafo.has(hacia)) {
      exigidasAusentes.push(nombre);
      continue;
    }
    const c = condicionEnTexto(condicionDeRegla(r));
    const f = reglasMapa.find(
      (x) =>
        !usados.has(x.id) &&
        x.id === `${desde}-a-${hacia}-r${r.orden}` &&
        x.origen === desde &&
        x.destino === hacia &&
        condicionEnTexto(x.condicion!) === c,
    );
    if (!f) fallas.push(`regla del plan sin su flujo en el dibujo: ${nombre}`);
    else {
      usados.add(f.id);
      dibujadas++;
    }
  }
  for (const f of reglasMapa)
    if (!usados.has(f.id))
      fallas.push(`flujo con una regla que el plan no declara: ${f.id}`);

  // Ramas por defecto del grafo ↔ flujos «si no».
  const defectosMapa = new Set(
    mapa.flujos.filter((f) => esPorDefecto(f.condicion)).map((f) => f.id),
  );
  const defectosGrafo = new Set<string>();
  for (const o of new Set([
    ...contrato.aristas_condicionales.map((r) => r.desde),
    ...Object.keys(grafo.ramas_por_defecto),
  ])) {
    const d =
      grafo.ramas_por_defecto[o] ??
      contrato.aristas_condicionales.find(
        (r) => r.desde === o && r.si_falso !== undefined,
      )?.si_falso;
    if (d && enGrafo.has(idDeMapa(o)) && enGrafo.has(idDeMapa(d)))
      defectosGrafo.add(`${idDeMapa(o)}-a-${idDeMapa(d)}-defecto`);
  }
  for (const id of [...defectosGrafo].sort(cmp))
    if (!defectosMapa.has(id))
      fallas.push(`rama por defecto sin su flujo en el dibujo: ${id}`);
  for (const id of [...defectosMapa].sort(cmp))
    if (!defectosGrafo.has(id))
      fallas.push(`flujo «si no» que el grafo no tiene: ${id}`);

  // Aristas de LangGraph ↔ pares de flujos.
  const pares = new Set(mapa.flujos.map((f) => `${f.origen}>${f.destino}`));
  const aristas = grafo.aristas.filter(
    (a) => a.source !== INICIO && a.target !== FIN,
  );
  const paresGrafo = new Set(
    aristas.map((a) => `${idDeMapa(a.source)}>${idDeMapa(a.target)}`),
  );
  for (const p of [...paresGrafo].sort(cmp))
    if (!pares.has(p))
      fallas.push(`arista del grafo sin flujo en el dibujo: ${p}`);
  for (const p of [...pares].sort(cmp))
    if (!paresGrafo.has(p)) fallas.push(`flujo sin arista en el grafo: ${p}`);

  // Terminales: el `papel` de los nodos ↔ las aristas de `__start__` y `__end__`.
  const t = terminales(grafo);
  for (const papel of ["inicio", "fin"] as const) {
    const esperado = [...new Set(t[papel])].sort(cmp).join(", ");
    const dibujado = mapa.nodos
      .filter((n) => n.papel === papel)
      .map((n) => n.id)
      .sort(cmp)
      .join(", ");
    if (esperado !== dibujado)
      fallas.push(
        `papel «${papel}» en el dibujo (${dibujado || "ninguno"}) distinto del grafo (${esperado || "ninguno"})`,
      );
  }

  const fuera = [...enGrafo].filter((id) => !plan.has(id)).sort(cmp);
  return {
    ok: fallas.length === 0,
    nodos: {
      contrato: plan.size,
      enGrafo: enGrafo.size,
      coinciden: [...plan].filter((id) => enGrafo.has(id)).length,
      exigidosAusentes: [...plan].filter((id) => !enGrafo.has(id)).sort(cmp),
      fueraDelContrato: fuera,
    },
    reglas: {
      contrato: contrato.aristas_condicionales.length,
      dibujadas,
      exigidasAusentes: exigidasAusentes.sort(cmp),
    },
    aristas: { grafo: grafo.aristas.length, dibujadas: paresGrafo.size },
    fallas,
  };
}
