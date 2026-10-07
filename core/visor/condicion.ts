/**
 * Las tres formas de la condición de un flujo (contrato 0.5.0 § 3.4): la tripleta del plan, una función nombrada
 * con sus entradas y la rama por defecto. Antes del 0.5.0, planlang disfrazaba las dos últimas de tripleta
 * (`texas-y-no-aprobar = true`, `rama-por-defecto = true`); el contrato las aceptó como formas propias.
 */
import type { Idioma } from "../formatos/bilingue";
import { idDeCodigo } from "./ids";
import type {
  Condicion,
  CondicionFuncion,
  CondicionPorDefecto,
  CondicionTripleta,
} from "./tipos";

export const esPorDefecto = (c?: Condicion): c is CondicionPorDefecto =>
  !!c && "por_defecto" in c;
export const esFuncion = (c?: Condicion): c is CondicionFuncion =>
  !!c && "funcion" in c;
export const esTripleta = (c?: Condicion): c is CondicionTripleta =>
  !!c && "senal" in c;

/** Una regla de verdad: tripleta o función (la rama por defecto no lo es: es la ausencia de regla). */
export const esRegla = (
  c?: Condicion,
): c is CondicionTripleta | CondicionFuncion => esTripleta(c) || esFuncion(c);

/**
 * Una condición como texto estable, sin formato de idioma (el SVG lo publica en `data-condiciones` para el gate
 * «diagrama = grafo»): `señal operador valor` · `funcion(entrada,entrada)` · `por_defecto`.
 */
export function condicionEnTexto(c: Condicion): string {
  if (esPorDefecto(c)) return "por_defecto";
  if (esFuncion(c)) return `${c.funcion}(${c.entradas.join(",")})`;
  return `${c.senal} ${c.operador} ${String(c.valor)}`;
}

const SIMBOLO: Record<string, string> = {
  "<": "<",
  "<=": "≤",
  "=": "=",
  "!=": "≠",
  ">=": "≥",
  ">": ">",
};

/** Un valor de regla como se lee en cada idioma: en español, decimales con coma (design-system § 3); sin `Intl`. */
export function valorDeRegla(v: CondicionTripleta["valor"], i: Idioma): string {
  return typeof v === "number" && i === "es"
    ? String(v).replace(".", ",")
    : String(v);
}

/** La regla como se lee en el lienzo: `señal ≤ 0,75` o, para una función, `f(entradas)` (§ 3.4). */
export function textoDeRegla(
  c: CondicionTripleta | CondicionFuncion,
  i: Idioma,
): string {
  if (esFuncion(c))
    return `${c.funcion}(${c.entradas.map(idDeCodigo).join(", ")})`;
  return `${idDeCodigo(c.senal)} ${SIMBOLO[c.operador]} ${valorDeRegla(c.valor, i)}`;
}

/** El nombre corto de una regla cuando la etiqueta las agrupa (sin texto propio): su señal o su función. */
export function nombreDeRegla(c: CondicionTripleta | CondicionFuncion): string {
  return esFuncion(c) ? c.funcion : idDeCodigo(c.senal);
}
