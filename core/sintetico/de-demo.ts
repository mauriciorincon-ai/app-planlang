/**
 * Lote y caso de CUALQUIER demo: el `demo_id` elige el esquema. Lo que el verificador, el playground y la vitrina
 * leen de un caso (id, tipo, subtipo, adversario, verdad conocida, identificadores sintéticos) es común a los dos; lo
 * propio de cada demo (la entrada, el mundo que cita el lote) se distingue por `demo_id`.
 */
import { DEMO_B, LoteBSchema, type CasoB, type LoteB } from "./demo-b/esquema";
import {
  DEMO_DEL_GENERADOR,
  LoteSchema,
  type Caso,
  type Lote,
} from "./esquema";

export type LoteDeDemo = Lote | LoteB;
export type CasoDeDemo = Caso | CasoB;

/** El esquema del lote de cada demo, por su `demo_id` (un demo nuevo en `LoteDeDemo` sin su esquema no compila). */
const ESQUEMA_DE_LOTE: {
  readonly [K in LoteDeDemo["demo_id"]]: typeof LoteSchema | typeof LoteBSchema;
} = { [DEMO_DEL_GENERADOR]: LoteSchema, [DEMO_B]: LoteBSchema };

/** Valida un lote con el esquema de SU demo; un `demo_id` desconocido se valida como el A y su esquema lo rechaza. */
export function esquemaDeLote(bruto: unknown) {
  const demo = (bruto as { demo_id?: unknown } | null)?.demo_id;
  const esquema =
    typeof demo === "string" && Object.hasOwn(ESQUEMA_DE_LOTE, demo)
      ? ESQUEMA_DE_LOTE[demo as LoteDeDemo["demo_id"]]
      : LoteSchema;
  return esquema.safeParse(bruto);
}

/** El mundo que cita el lote (plan de beneficios del A, listas del B) y la clave del manifiesto que lo cita. */
export function mundoDe(lote: LoteDeDemo): {
  clave: "plan_beneficios" | "listas";
  huella: string;
} {
  switch (lote.demo_id) {
    case DEMO_B:
      return { clave: "listas", huella: lote.listas.huella };
    case DEMO_DEL_GENERADOR:
      return { clave: "plan_beneficios", huella: lote.plan_beneficios.huella };
    default: {
      const nadie: never = lote;
      throw new Error(
        `mundoDe: lote de un demo sin mundo (${JSON.stringify(nadie)})`,
      );
    }
  }
}

/**
 * Lo que la verdad conocida de un demo trae «por omisión» cuando el dato no lo escribe: en el B, `tipo_solicitante` es
 * opcional (los lotes anteriores al S9 no lo traen, y sus bytes no cambian) y su ausencia significa «persona natural».
 * Vive aquí, junto al esquema de cada demo, para que el resto del núcleo no nombre ningún demo.
 */
const VERDAD_POR_OMISION: {
  readonly [K in LoteDeDemo["demo_id"]]: { readonly [campo: string]: string };
} = { [DEMO_DEL_GENERADOR]: {}, [DEMO_B]: { tipo_solicitante: "natural" } };

/** La verdad conocida de un caso con los valores por omisión de su demo donde el dato no trae el campo. */
export function verdadConOmisiones(caso: CasoDeDemo): {
  [campo: string]: unknown;
} {
  const v = caso.verdad_conocida as unknown as { [campo: string]: unknown };
  const porOmision = Object.hasOwn(VERDAD_POR_OMISION, caso.demo_id)
    ? VERDAD_POR_OMISION[caso.demo_id as LoteDeDemo["demo_id"]]
    : {};
  const completa = { ...v };
  for (const [campo, valor] of Object.entries(porOmision))
    if (completa[campo] === undefined) completa[campo] = valor;
  return completa;
}

/** Los casos de un lote por id. */
export function casosPorId(lote: LoteDeDemo): Map<string, CasoDeDemo> {
  return new Map<string, CasoDeDemo>(
    lote.casos.map((c: CasoDeDemo) => [c.id, c]),
  );
}
