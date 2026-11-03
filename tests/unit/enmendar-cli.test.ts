/**
 * Lo que comparten los CLI de enmienda (`scripts/_enmendar.ts`). Antes, un `--a` desconocido caía en silencio a la v1.1
 * del A y se escribía sin mirar si el destino existía: pedir `--a 1.6` sin la enmienda registrada habría reescrito un
 * plan aprobado.
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  elegirEnmienda,
  motivoDeDestinoOcupado,
} from "../../scripts/_enmendar";

const TABLA = { "1.1": 1, "1.2": 2 } as const;

describe("elegirEnmienda", () => {
  it("sin --a toma la de por defecto", () => {
    expect(elegirEnmienda(TABLA, undefined, "1.1")).toEqual({
      ok: true,
      clave: "1.1",
    });
  });

  it("toma la que --a pide si está registrada", () => {
    expect(elegirEnmienda(TABLA, "1.2", "1.1")).toEqual({
      ok: true,
      clave: "1.2",
    });
  });

  it("un --a desconocido es un error que lista las opciones, no la v1.1 en silencio", () => {
    const r = elegirEnmienda(TABLA, "1.7", "1.1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.motivo).toContain("1.7");
      expect(r.motivo).toContain("1.1, 1.2");
    }
  });

  it("--a sin valor y los nombres heredados de Object (toString) tampoco pasan", () => {
    expect(elegirEnmienda(TABLA, true, "1.1").ok).toBe(false);
    expect(elegirEnmienda(TABLA, "toString", "1.1").ok).toBe(false);
  });
});

describe("motivoDeDestinoOcupado", () => {
  it("un destino que existe no se reescribe, y uno libre sí se escribe", () => {
    const dir = mkdtempSync(join(tmpdir(), "enmendar-"));
    const ocupado = join(dir, "v1.1.json");
    writeFileSync(ocupado, "{}");
    expect(motivoDeDestinoOcupado(ocupado)).toContain("no se reescribe");
    expect(motivoDeDestinoOcupado(join(dir, "v9.json"))).toBeNull();
  });
});
