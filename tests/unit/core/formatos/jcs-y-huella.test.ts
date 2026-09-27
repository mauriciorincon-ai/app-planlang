import { describe, expect, it } from "vitest";
import {
  conHuella,
  huella,
  jsonBonito,
  sha256Hex,
  sinHuella,
  verificarHuella,
} from "../../../../core/formatos/huella";
import {
  ErrorNoCanonico,
  jcs,
  normalizar,
} from "../../../../core/formatos/jcs";

describe("jcs (RFC 8785)", () => {
  it("ordena claves por unidades UTF-16 y no mete espacios", () => {
    expect(jcs({ b: 1, a: [true, null, "x"], Z: 2 })).toBe(
      '{"Z":2,"a":[true,null,"x"],"b":1}',
    );
    // «𝄞» (U+1D11E, sustitutos D834 DD1E) va ANTES de U+FFFF en orden UTF-16, no en orden de code point
    expect(jcs({ "￿": 1, "\u{1d11e}": 2 })).toBe('{"\u{1d11e}":2,"￿":1}');
  });

  it("formatea números como ES6 y normaliza -0", () => {
    expect(jcs(-0)).toBe("0");
    expect(jcs(1e21)).toBe("1e+21");
    expect(jcs(1e-7)).toBe("1e-7");
    expect(jcs(0.1 + 0.2)).toBe("0.30000000000000004");
    expect(jcs(2 ** 53 - 1)).toBe("9007199254740991");
  });

  it("escapa controles en minúscula y no escapa la barra ni el unicode", () => {
    expect(jcs('a\u001fb/cé"\\')).toBe('"a\\u001fb/cé\\"\\\\"');
  });

  it("omite claves undefined y rechaza NaN, Infinity y funciones", () => {
    expect(jcs({ a: undefined, b: 1 })).toBe('{"b":1}');
    expect(() => jcs(Number.NaN)).toThrow(ErrorNoCanonico);
    expect(() => jcs({ a: Number.POSITIVE_INFINITY })).toThrow(
      /a: número no finito/,
    );
    expect(() =>
      jcs({ f: () => 1 } as unknown as Record<string, never>),
    ).toThrow(ErrorNoCanonico);
  });

  it("normalizar devuelve una copia canónica", () => {
    expect(normalizar({ b: -0, a: 1 })).toEqual({ a: 1, b: 0 });
  });
});

describe("huella", () => {
  it("sha256 de vacío y de 'abc' coinciden con los vectores conocidos", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("ignora la clave huella al calcular y verificar", async () => {
    const obj = { nombre: "x", n: 1 };
    const conH = await conHuella(obj);
    expect(conH.huella).toBe(await huella(obj));
    expect(await verificarHuella(conH)).toEqual({
      ok: true,
      huella: conH.huella,
    });
    expect(sinHuella(conH)).toEqual(obj);
    expect(sinHuella([1, 2])).toEqual([1, 2]);
  });

  it("rechaza huella ausente o alterada (RF-06.1)", async () => {
    const obj = { nombre: "x", n: 1 };
    const ausente = await verificarHuella(obj);
    expect(ausente.ok).toBe(false);
    if (!ausente.ok) expect(ausente.motivo).toBe("ausente");
    const alterada = await verificarHuella({ ...(await conHuella(obj)), n: 2 });
    expect(alterada.ok).toBe(false);
    if (!alterada.ok) expect(alterada.motivo).toBe("no_coincide");
  });

  it("jsonBonito es estable: claves ordenadas, indentación 2 y salto final", () => {
    expect(jsonBonito({ b: [1], a: "é" })).toBe(
      '{\n  "a": "é",\n  "b": [\n    1\n  ]\n}\n',
    );
  });
});
