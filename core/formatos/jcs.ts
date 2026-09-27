/**
 * JSON Canonicalization Scheme (RFC 8785) — implementación propia, sin dependencias, Node + navegador.
 *
 * Reglas que importan para la huella (regla dura 1):
 *  - claves ordenadas por unidades de código UTF-16 (el `sort()` por defecto de JavaScript);
 *  - números en el formato ES6 `Number.prototype.toString` (lo que hace `JSON.stringify`); `-0` → `0`;
 *  - cadenas con el escape mínimo de JSON (control < 0x20 como `\u00xx` en minúscula, `"` y `\`);
 *  - sin espacios en blanco. `NaN`, `Infinity`, `undefined`, funciones y símbolos son errores:
 *    un valor no representable jamás entra a un artefacto con huella.
 *
 * El lado Python usa el paquete `rfc8785`; el gate de contrato (`tests/contrato/`) compara ambos
 * sobre un fixture de valores difíciles que escribe Python con su serializador real.
 */

export type JsonPrimitivo = string | number | boolean | null;
export type JsonValor =
  JsonPrimitivo | JsonValor[] | { [clave: string]: JsonValor };

export class ErrorNoCanonico extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorNoCanonico";
  }
}

/** Serializa `valor` como JCS. Lanza `ErrorNoCanonico` ante valores no representables. */
export function jcs(valor: unknown, ruta = "$"): string {
  if (valor === null) return "null";
  switch (typeof valor) {
    case "boolean":
      return valor ? "true" : "false";
    case "number":
      if (!Number.isFinite(valor))
        throw new ErrorNoCanonico(`${ruta}: número no finito`);
      return JSON.stringify(Object.is(valor, -0) ? 0 : valor);
    case "string":
      return JSON.stringify(valor);
    case "object":
      break;
    default:
      throw new ErrorNoCanonico(
        `${ruta}: tipo ${typeof valor} no representable`,
      );
  }
  if (Array.isArray(valor)) {
    return "[" + valor.map((v, i) => jcs(v, `${ruta}[${i}]`)).join(",") + "]";
  }
  const objeto = valor as Record<string, unknown>;
  const claves = Object.keys(objeto)
    .filter((k) => objeto[k] !== undefined)
    .sort();
  const partes: string[] = [];
  for (const k of claves) {
    partes.push(JSON.stringify(k) + ":" + jcs(objeto[k], `${ruta}.${k}`));
  }
  return "{" + partes.join(",") + "}";
}

/** Copia profunda pasando por JCS: normaliza `-0`, elimina `undefined` y ordena claves. */
export function normalizar<T extends JsonValor>(valor: T): T {
  return JSON.parse(jcs(valor)) as T;
}
