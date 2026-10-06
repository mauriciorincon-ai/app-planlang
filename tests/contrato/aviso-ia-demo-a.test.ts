/**
 * F22, gate de contrato entre lenguajes (regla 19): el aviso que la vitrina reconoce como «el de las corridas hasta el
 * plan v1.5» es, byte a byte, el que escribió el serializador real de Python. La corrida simulada del v1.5 lo trae
 * escrito y pytest la regenera idéntica desde `AVISO_IA_HASTA_V15` (`test_v15_versionado.py`).
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AVISO_IA_HASTA_V15 } from "@/textos/caso";

const DIR = "runs/demo-a/simulado-v1.5-tope/trazas";

describe("el aviso de IA de las corridas hasta el v1.5", () => {
  it("es el que Python dejó escrito en la corrida simulada del v1.5", () => {
    const avisos = readdirSync(DIR).map(
      (f) =>
        (
          JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")) as {
            salida_final: { aviso_ia: { es: string; en: string } };
          }
        ).salida_final.aviso_ia,
    );
    const iguales = avisos.filter(
      (a) => a.es === AVISO_IA_HASTA_V15.es && a.en === AVISO_IA_HASTA_V15.en,
    );
    expect(iguales.length).toBeGreaterThan(0);
    // Los demás son el de la aprobación en parte sin persona, que no promete una persona.
    for (const a of avisos.filter((x) => !iguales.includes(x)))
      expect(a.es).toContain("sin revisión de una persona");
  });
});
