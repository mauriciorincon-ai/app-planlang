/**
 * Gate de contrato Python ↔ TypeScript (regla 19): el lado que EMITE (Python, `canonico.py`) escribe
 * el fixture con su serializador real; el lado que LEE (TS, `core/formatos`) debe reproducir cada
 * cadena JCS y cada huella. Corre en los proyectos `core` (node) y `core-jsdom`.
 *
 * Demo en rojo (bitácora S1): editar un `jcs` del fixture (`1e-7` → `1e-07`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { huella } from "../../core/formatos/huella";
import { jcs, type JsonValor } from "../../core/formatos/jcs";

type Caso = { nombre: string; valor: JsonValor; jcs: string; huella: string };
const fixture = JSON.parse(readFileSync("tests/contrato/jcs-valores-tramposos.json", "utf8")) as {
  formato: string;
  casos: Caso[];
};

describe("contrato JCS Python → TS", () => {
  it("el fixture es el formato esperado y trae los casos difíciles", () => {
    expect(fixture.formato).toBe("planlang-contrato-jcs/v1");
    const nombres = fixture.casos.map((c) => c.nombre);
    for (const n of ["menos_cero", "exponente_pequeno", "orden_de_claves_utf16", "nfc_y_nfd_como_claves"]) {
      expect(nombres).toContain(n);
    }
  });

  it.each(fixture.casos.map((c) => [c.nombre, c] as const))(
    "reproduce el string JCS de Python: %s",
    (_nombre, caso) => {
      expect(jcs(caso.valor)).toBe(caso.jcs);
    },
  );

  it.each(fixture.casos.map((c) => [c.nombre, c] as const))(
    "reproduce la huella SHA-256 de Python: %s",
    async (_nombre, caso) => {
      expect(await huella(caso.valor)).toBe(caso.huella);
    },
  );
});
