/**
 * Lote y caso de CUALQUIER demo: el `demo_id` elige el esquema. Lo que el verificador, el playground y la vitrina
 * leen de un caso (id, tipo, subtipo, adversario, verdad conocida, identificadores sintéticos) es común a los dos; lo
 * propio de cada demo (la entrada, el mundo que cita el lote) se distingue por `demo_id`.
 */
import { DEMO_B, LoteBSchema, type CasoB, type LoteB } from "./demo-b/esquema";
import { LoteSchema, type Caso, type Lote } from "./esquema";

export type LoteDeDemo = Lote | LoteB;
export type CasoDeDemo = Caso | CasoB;

/** Valida un lote con el esquema de SU demo. */
export function esquemaDeLote(bruto: unknown) {
  const demo = (bruto as { demo_id?: unknown } | null)?.demo_id;
  return demo === DEMO_B
    ? LoteBSchema.safeParse(bruto)
    : LoteSchema.safeParse(bruto);
}

/** El mundo que cita el lote (plan de beneficios del A, listas del B) y la clave del manifiesto que lo cita. */
export function mundoDe(lote: LoteDeDemo): {
  clave: "plan_beneficios" | "listas";
  huella: string;
} {
  return lote.demo_id === DEMO_B
    ? { clave: "listas", huella: lote.listas.huella }
    : { clave: "plan_beneficios", huella: lote.plan_beneficios.huella };
}

/** Los casos de un lote por id. */
export function casosPorId(lote: LoteDeDemo): Map<string, CasoDeDemo> {
  return new Map<string, CasoDeDemo>(
    lote.casos.map((c: CasoDeDemo) => [c.id, c]),
  );
}
