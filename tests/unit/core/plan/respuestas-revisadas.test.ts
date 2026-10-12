/**
 * El primer uso real (S6): las 14 respuestas de la entrevista de la v2 son las que el usuario revisó y confirmó en la
 * planeadora (2026-10-11, «todo como sugieres»), sin cambiar ninguna. `respuestas-revisadas.json` es la copia del
 * archivo de la planeadora; la transcripción de la v2 trae, pregunta por pregunta, el texto exacto de ese archivo; y
 * la huella de la copia está fijada: si alguien la edita, esta prueba lo dice.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TranscripcionSchema } from "../../../../core/plan";

const CARPETA = "plans/hackguard-agentes/v2";
/** SHA-256 de la copia, tal como la dejó la planeadora al corregir `cambiadas` (2026-10-12, S7). */
const HUELLA_DE_LA_COPIA =
  "060226af34088ef29c9594ccf9ff24bc3847e607912fd2e29701ccc991c966f8";

const crudo = readFileSync(`${CARPETA}/respuestas-revisadas.json`);
const respuestas = JSON.parse(crudo.toString("utf8")) as Record<
  string,
  unknown
>;
const transcripcion = TranscripcionSchema.parse(
  JSON.parse(readFileSync(`${CARPETA}/transcripcion.json`, "utf8")),
);

describe("las respuestas de la v2 son las que el usuario revisó", () => {
  it("la copia no se ha tocado y dice de quién es", () => {
    expect(createHash("sha256").update(crudo).digest("hex")).toBe(
      HUELLA_DE_LA_COPIA,
    );
    const origen = respuestas._origen as {
      fecha: string;
      frase_del_usuario: string;
      cambiadas: string[];
    };
    expect(origen.fecha).toBe("2026-10-11");
    expect(origen.frase_del_usuario).toBe("todo como sugieres");
    expect(origen.cambiadas).toEqual(["P03", "P08", "P09"]);
  });

  it("la transcripción trae las 14 respuestas, palabra por palabra", () => {
    const ids = Object.keys(respuestas).filter((k) => /^P\d{2}$/.test(k));
    expect(ids).toHaveLength(14);
    expect(transcripcion.preguntas.map((q) => q.id)).toEqual(ids);
    for (const q of transcripcion.preguntas) {
      const ultimo = q.turnos.at(-1);
      expect(ultimo?.respuesta?.texto.trim(), q.id).toBe(
        String(respuestas[q.id]).trim(),
      );
    }
  });

  it("la entrevista usó la plantilla de siempre y terminó sin pendientes", () => {
    expect(transcripcion.plantilla.id).toBe("dom-seguridad-ia");
    expect(
      transcripcion.preguntas.filter((q) => q.estado === "pendiente"),
    ).toEqual([]);
  });
});
