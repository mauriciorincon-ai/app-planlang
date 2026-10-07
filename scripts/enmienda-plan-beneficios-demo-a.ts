/**
 * Plan de beneficios del demo A, v1.0.0 → v2.0.0 (S3, decisión del usuario «Tope por servicio», 2026-10-04): la
 * aprobación PARCIAL que hace jugable el modo Texas (U4) en el plan v1.5.
 *   1. Topes de cobertura por servicio, con una regla fija (no a mano y no un umbral del agente): los servicios de
 *      diagnóstico (`imagen`, `diagnostico`, `rehabilitacion`) que requieren autorización y cuestan entre 300 y U2
 *      (sin llegar) cubren hasta el 70 % de su costo, redondeado hacia abajo a decenas.
 *   2. RB-08: si el costo supera el tope del servicio, se aprueba hasta el tope y el excedente se niega; es una
 *      determinación adversa parcial (con el modo Texas, la decide una persona). RB-07 ya no dice «ninguna condición
 *      anterior», porque RB-08 va después.
 * El v1.0.0 queda intacto: sus lotes y corridas lo citan por huella.
 */
import type { PlanBeneficios, Procedimiento } from "../core/sintetico/esquema";

export const CATEGORIAS_CON_TOPE = [
  "imagen",
  "diagnostico",
  "rehabilitacion",
] as const;
export const COSTO_MINIMO_CON_TOPE = 300;
export const FRACCION_CUBIERTA_PCT = 70;

/** El tope de un servicio según la regla, o `null` si la regla no le pone tope. */
export function topeDe(p: Procedimiento, U2: number): number | null {
  if (
    p.estado !== "requiere_autorizacion" ||
    !(CATEGORIAS_CON_TOPE as readonly string[]).includes(p.categoria) ||
    p.costo < COSTO_MINIMO_CON_TOPE ||
    p.costo >= U2
  )
    return null;
  return Math.floor((p.costo * FRACCION_CUBIERTA_PCT) / 1000) * 10;
}

const RB07 = {
  id: "RB-07",
  texto: {
    es: "Servicio del plan que requiere autorización, con información completa y sin ninguna otra condición de este plan: se aprueba.",
    en: "A plan service that needs authorisation, with complete information and no other condition of this plan: it is approved.",
  },
};

const RB08 = {
  id: "RB-08",
  texto: {
    es: "Tope de cobertura: si el costo estimado supera lo que el plan cubre para ese servicio, se aprueba hasta el tope y el excedente se niega. Es una negación parcial: con el modo Texas encendido, la decide una persona.",
    en: "Coverage cap: if the estimated cost exceeds what the plan covers for that service, it is approved up to the cap and the excess is denied. It is a partial denial: with Texas mode on, a person decides it.",
  },
};

/** El v2.0.0 sin huella (el CLI la sella). `U2` es el valor del umbral de alto costo del plan con que se usa. */
export function enmendarPlanBeneficiosV2(
  v1: PlanBeneficios,
  U2: number,
): Omit<PlanBeneficios, "huella"> & { huella: null } {
  if (v1.version !== "1.0.0")
    throw new Error(`se enmienda el v1.0.0, no el ${v1.version}`);
  if (v1.reglas.some((r) => r.id === "RB-08"))
    throw new Error("el v1.0.0 ya trae RB-08");
  return {
    ...v1,
    version: "2.0.0",
    reglas: [...v1.reglas.map((r) => (r.id === "RB-07" ? RB07 : r)), RB08],
    procedimientos: v1.procedimientos.map((p) => ({
      ...p,
      tope_cobertura: topeDe(p, U2),
    })),
    huella: null,
  };
}
