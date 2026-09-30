/**
 * Métricas de texto (G15): la tabla sale de los woff2 de la vitrina (prueba de deriva), cubre lo que dibuja el
 * lienzo, y medir y partir son deterministas.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ESTILOS } from "@core/visor/estilos";
import { ancho, fueraDeCobertura, partir } from "@core/visor/medida";
import {
  RUTA_METRICAS,
  generarMetricas,
} from "../../../../scripts/visor/metricas";

describe("tabla de métricas", () => {
  it("regenerarla desde los woff2 da los mismos bytes (sin deriva)", () => {
    expect(generarMetricas()).toBe(readFileSync(RUTA_METRICAS, "utf8"));
  });

  it("declara la huella de cada fuente, que es la del archivo que sirve la vitrina", () => {
    const t = JSON.parse(readFileSync(RUTA_METRICAS, "utf8"));
    for (const f of Object.values(t.fuentes) as Array<{
      archivo: string;
      sha256: string;
    }>)
      expect(
        createHash("sha256").update(readFileSync(f.archivo)).digest("hex"),
      ).toBe(f.sha256);
  });
});

describe("medir y partir", () => {
  it("la mono mide 0,6 em por carácter; Inter depende del peso", () => {
    expect(ancho("abc", ESTILOS.flujoRegla)).toBeCloseTo(3 * 0.6 * 12, 6);
    expect(
      ancho("Agentes", { ...ESTILOS.bandaNombre, peso: 700 }),
    ).toBeGreaterThan(ancho("Agentes", { ...ESTILOS.bandaNombre, peso: 400 }));
  });

  it("parte por espacios y, si una palabra no cabe, después de un guion bajo", () => {
    const e = ESTILOS.bandaPregunta;
    const l = partir(
      "¿Qué verifica el código sin preguntarle a un modelo?",
      e,
      160,
    );
    expect(l.length).toBe(2);
    expect(l.every((x) => ancho(x, e) <= 160)).toBe(true);
    expect(partir("campos_faltantes_count", ESTILOS.nodoNombre, 90)).toEqual([
      "campos_",
      "faltantes_",
      "count",
    ]);
  });

  it("un carácter fuera de la tabla es un error (V15), no un ancho inventado", () => {
    expect(fueraDeCobertura("ok ✓ ✓", "letra")).toEqual(["✓"]);
    expect(() => ancho("✓", ESTILOS.nodoNombre)).toThrow(/V15/);
  });
});
