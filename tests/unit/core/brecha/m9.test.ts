/**
 * M9 (RF-09.1) — validación del instrumento: toda brecha sembrada se detecta y la corrida limpia no
 * dispara ninguna. El reporte del kit de prueba está al día.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  renderizarM9,
  SIEMBRAS,
  validarInstrumento,
  type Siembra,
} from "../../../../core/brecha/m9";
import { entradaSimulada, SIMULADO } from "../../../helpers/corridas";

describe("M9 — brechas sembradas", () => {
  it("n/n detectadas y control limpio", async () => {
    const r = await validarInstrumento(entradaSimulada());
    expect(r.control_limpio).toBe(true);
    expect(r.siembras.filter((s) => !s.detectada).map((s) => s.id)).toEqual([]);
    expect(r.detectadas).toBe(SIEMBRAS.length);
    expect(r.sembradas).toBeGreaterThanOrEqual(8);
  });
  it("el reporte versionado en el kit de prueba está al día", async () => {
    const r = await validarInstrumento(entradaSimulada());
    expect(
      readFileSync("docs/kit-de-prueba/M9-brechas-sembradas.md", "utf8"),
    ).toBe(renderizarM9(r, SIMULADO));
  });
  it("el instrumento puede fallar: una siembra que nadie detecta y un control sucio se reportan", async () => {
    const ciega: Siembra = {
      ...SIEMBRAS[0]!,
      id: "ciega",
      detectada: () => false,
    };
    const siempre: Siembra = {
      ...SIEMBRAS[0]!,
      id: "siempre",
      detectada: () => true,
    };
    const r = await validarInstrumento(entradaSimulada(), [ciega, siempre]);
    expect(r).toMatchObject({
      control_limpio: false,
      detectadas: 1,
      sembradas: 2,
    });
    const md = renderizarM9(r, SIMULADO);
    expect(md).toMatch(/✗ NO detectada/);
    expect(md).toMatch(/THE CLEAN RUN TRIGGERED DETECTIONS/);
  });
  it("una siembra sobre un caso que no existe es un error del instrumento, no un «no detectado»", async () => {
    const mala: Siembra = {
      ...SIEMBRAS[0]!,
      aplicar: async (e) =>
        (await import("../../../../core/brecha/m9")).mutarTraza(
          e,
          "ZZ-999",
          () => {},
        ),
    };
    await expect(validarInstrumento(entradaSimulada(), [mala])).rejects.toThrow(
      /no tiene el caso ZZ-999/,
    );
  });
});
