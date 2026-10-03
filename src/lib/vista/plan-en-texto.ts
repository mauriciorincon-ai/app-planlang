/**
 * Plantillas del plan dentro de los textos de la vitrina (AU-S2-3). Un texto que cita un valor del plan lo escribe
 * como referencia y no como literal, para que la página no contradiga al plan si el plan cambia:
 *
 * - `{plan:U3}`: el valor del umbral en el plan;
 * - `{plan:C5.objetivo}` (`|%` lo da en porcentaje) y `{plan:C5.k}`: el objetivo y las repeticiones de un criterio;
 * - `{plan:S2.enunciado}`: el enunciado de un supuesto, tal como lo declara el plan;
 * - `{plan:reglas.<nodo>}`: cuántas reglas (aristas condicionales) salen del nodo;
 * - `{plan:lista.<nodo>}`: sus nombres en orden; `{plan:destinos.<nodo>}`: «nombre → destino; …».
 *
 * `|palabra` y `|Palabra` escriben un número pequeño en palabras; `|minuscula` baja la inicial de un enunciado. Una referencia que el plan no tiene detiene el
 * build nombrándola; `tests/unit/vitrina/copia-contra-plan.test.ts` las resuelve todas contra el plan publicado.
 */
import type { Idioma } from "@core/formatos/bilingue";
import { esAristaTripleta, type Plan } from "@core/plan/esquema";
import {
  NODO_EN_FRASE,
  NOMBRE_DE_REGLA,
  NUMERO_EN_PALABRAS,
} from "@/textos/plan-comun";
import { decimal, entero, enumerar } from "./formato";
import {
  categoriaDeRegla,
  reglaDelPlan,
  textoDeCategoria,
} from "./motivo-pausa";

/** Lo que una plantilla puede leer del plan: el contrato de grafo siempre; umbrales y criterios si los hay. */
export type FuentePlan = Pick<Plan, "contrato_de_grafo"> &
  Partial<Pick<Plan, "umbrales" | "criterios_aceptacion" | "supuestos">>;

export const REFERENCIA_PLAN =
  /\{plan:([^}|]+)(?:\|(palabra|Palabra|%|minuscula))?\}/g;

function falta(ref: string): never {
  throw new Error(
    `vitrina: un texto cita {plan:${ref}}, que el plan no tiene (src/lib/vista/plan-en-texto.ts).`,
  );
}

function numero(v: number, mod: string | undefined, i: Idioma): string {
  if (mod === "%") return entero(Math.round(v * 100), i);
  if (mod === "palabra" || mod === "Palabra") {
    const w = NUMERO_EN_PALABRAS[v]?.[i];
    if (w === undefined) return entero(v, i);
    return mod === "Palabra" ? `${w.charAt(0).toUpperCase()}${w.slice(1)}` : w;
  }
  return Number.isInteger(v) ? entero(v, i) : decimal(v, 2, i);
}

function nombreDeRegla(
  a: Plan["contrato_de_grafo"]["aristas_condicionales"][number],
  i: Idioma,
): string {
  const t = textoDeCategoria(
    NOMBRE_DE_REGLA,
    categoriaDeRegla(reglaDelPlan(a)),
    "NOMBRE_DE_REGLA (src/textos/plan-comun.ts)",
  )[i];
  const u =
    esAristaTripleta(a) &&
    typeof a.valor === "string" &&
    a.valor.startsWith("umbral.")
      ? a.valor.slice("umbral.".length)
      : "";
  return t.replace("{u}", u).trim();
}

function resolver(
  ref: string,
  mod: string | undefined,
  plan: FuentePlan,
  i: Idioma,
): string {
  const aristas = plan.contrato_de_grafo.aristas_condicionales;
  const [cabeza, cola] = ref.split(".", 2) as [string, string | undefined];
  if (cabeza === "reglas" || cabeza === "lista" || cabeza === "destinos") {
    const delNodo = aristas
      .filter((a) => a.desde === cola)
      .sort((a, b) => a.orden - b.orden);
    if (delNodo.length === 0) falta(ref);
    if (cabeza === "reglas") return numero(delNodo.length, mod, i);
    if (cabeza === "lista")
      return enumerar(
        delNodo.map((a) => nombreDeRegla(a, i)),
        i,
      );
    return delNodo
      .map(
        (a) =>
          `${nombreDeRegla(a, i)} → ${textoDeCategoria(NODO_EN_FRASE, a.si_verdadero, "NODO_EN_FRASE (src/textos/plan-comun.ts)")[i]}`,
      )
      .join("; ");
  }
  if (/^U\d+$/.test(cabeza) && cola === undefined) {
    const u = plan.umbrales?.find((x) => x.id === cabeza);
    if (!u || typeof u.valor_en_plan !== "number") return falta(ref);
    return numero(u.valor_en_plan, mod, i);
  }
  if (/^S\d+$/.test(cabeza) && cola === "enunciado") {
    const e = plan.supuestos?.find((x) => x.id === cabeza)?.enunciado[i];
    if (e === undefined) return falta(ref);
    return mod === "minuscula"
      ? `${e.charAt(0).toLowerCase()}${e.slice(1)}`
      : e;
  }
  if (/^C\d+$/.test(cabeza)) {
    const c = plan.criterios_aceptacion?.find((x) => x.id === cabeza);
    if (!c) return falta(ref);
    const v =
      cola === "objetivo"
        ? c.valor_objetivo
        : cola === "k"
          ? (c.regla_de_medicion as { k?: unknown }).k
          : undefined;
    if (typeof v !== "number") return falta(ref);
    return numero(v, mod, i);
  }
  return falta(ref);
}

/** El texto con sus referencias al plan resueltas en el idioma pedido. */
export function conPlan(texto: string, plan: FuentePlan, i: Idioma): string {
  return texto.replace(REFERENCIA_PLAN, (_m, ref: string, mod?: string) =>
    resolver(ref, mod, plan, i),
  );
}
