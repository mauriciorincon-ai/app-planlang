/**
 * Huella SHA-256 de un objeto = SHA-256( JCS( objeto sin la clave "huella" ) ), en hexadecimal minúscula.
 *
 * Ni Node ni el navegador hashean los bytes del archivo: hashean el objeto canónico. Así el archivo
 * en disco puede estar «bonito» (indentado, para diffs) y la huella no cambia. Python calcula lo mismo
 * con `rfc8785` + `hashlib` (gate de contrato en `tests/contrato/`).
 */
import { jcs, type JsonValor } from "./jcs";

export const CLAVE_HUELLA = "huella";

function bytesAHex(bytes: ArrayBuffer): string {
  const vista = new Uint8Array(bytes);
  let hex = "";
  for (const b of vista) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/** SHA-256 de una cadena UTF-8, en hex. Usa la Web Crypto del entorno (Node ≥ 19 y navegadores). */
export async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await globalThis.crypto.subtle.digest("SHA-256", datos);
  return bytesAHex(resumen);
}

/** Devuelve una copia superficial sin la clave `huella` (si el valor es un objeto). */
export function sinHuella<T extends JsonValor>(valor: T): T {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor))
    return valor;
  const copia: Record<string, JsonValor> = {
    ...(valor as Record<string, JsonValor>),
  };
  delete copia[CLAVE_HUELLA];
  return copia as T;
}

/** La huella de `valor` (ignorando su propia clave `huella`). */
export async function huella(valor: JsonValor): Promise<string> {
  return sha256Hex(jcs(sinHuella(valor)));
}

/** Copia del objeto con su `huella` recalculada. */
export async function conHuella<T extends Record<string, JsonValor>>(
  valor: T,
): Promise<T & { huella: string }> {
  const h = await huella(valor);
  return { ...sinHuella(valor), huella: h };
}

export type VerificacionDeHuella =
  | { ok: true; huella: string }
  | {
      ok: false;
      declarada: string | null;
      calculada: string;
      motivo: "ausente" | "no_coincide";
    };

/** Verifica que la `huella` declarada en el objeto coincide con la calculada (RF-06.1). */
export async function verificarHuella(
  valor: Record<string, JsonValor>,
): Promise<VerificacionDeHuella> {
  const calculada = await huella(valor);
  const declarada = valor[CLAVE_HUELLA];
  if (typeof declarada !== "string" || declarada.length === 0) {
    return { ok: false, declarada: null, calculada, motivo: "ausente" };
  }
  if (declarada !== calculada)
    return { ok: false, declarada, calculada, motivo: "no_coincide" };
  return { ok: true, huella: calculada };
}

/** Texto «bonito» y estable para archivos versionados: claves ordenadas, indentación 2, salto final. */
export function jsonBonito(valor: JsonValor): string {
  return JSON.stringify(JSON.parse(jcs(valor)), null, 2) + "\n";
}
