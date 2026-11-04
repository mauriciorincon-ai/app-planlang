/**
 * Lo que comparten los CLI de enmienda de plan (`enmendar-plan-demo-a.ts`, `enmendar-plan-demo-b.ts`): elegir la
 * enmienda por su `--a` y no escribir sobre un plan que ya está aprobado.
 *
 * Antes el CLI del A caía en silencio a la v1.1 ante un `--a` que no conocía y escribía sin mirar si el destino existía:
 * `--a 1.6` sin la enmienda registrada habría reescrito `plans/demo-a/v1.1.json`, que es historia aprobada.
 */
import { existsSync } from "node:fs";

export type Eleccion<K extends string> =
  { ok: true; clave: K } | { ok: false; motivo: string };

/** La enmienda que pide `--a` (o la de por defecto si no lo trae). Un valor desconocido es un error con las opciones. */
export function elegirEnmienda<K extends string>(
  tabla: Readonly<Record<K, unknown>>,
  a: string | true | undefined,
  porDefecto: K,
): Eleccion<K> {
  if (a === undefined) return { ok: true, clave: porDefecto };
  const claves = Object.keys(tabla) as K[];
  if (typeof a === "string" && Object.hasOwn(tabla, a))
    return { ok: true, clave: a as K };
  return {
    ok: false,
    motivo: `--a ${String(a)} no es una enmienda registrada (las hay: ${claves.join(", ")}).`,
  };
}

/** Si el destino ya existe, por qué no se escribe; `null` si está libre. */
export function motivoDeDestinoOcupado(destino: string): string | null {
  return existsSync(destino)
    ? `${destino} ya existe: un plan aprobado no se reescribe (sube la versión).`
    : null;
}
