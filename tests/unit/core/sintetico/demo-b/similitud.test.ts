/**
 * Similitud de nombres del demo B (RL-01, RL-02). Los valores de referencia de Jaro-Winkler son los publicados
 * (Winkler 1990; MARTHA/MARHTA, DWAYNE/DUANE, DIXON/DICKSONX): si alguien cambia la ventana, el prefijo o el peso,
 * esto lo nombra antes que el lote. El espejo en Python se prueba contra la verdad que escribe el generador.
 */
import { describe, expect, it } from "vitest";
import {
  jaro,
  jaroWinkler,
  mejorCoincidencia,
  normalizarNombre,
  redondear4,
  similitud,
} from "../../../../../core/sintetico/demo-b/similitud";
import type { ListasB } from "../../../../../core/sintetico/demo-b/esquema";

describe("Jaro-Winkler", () => {
  it.each([
    ["martha", "marhta", 0.9611],
    ["dwayne", "duane", 0.84],
    ["dixon", "dicksonx", 0.8133],
  ])("%s / %s ≈ %s (valores publicados)", (a, b, esperado) => {
    expect(redondear4(jaroWinkler(a, b))).toBe(esperado);
  });

  it("es 1 con cadenas iguales y 0 sin letras en común", () => {
    expect(jaro("abc", "abc")).toBe(1);
    expect(jaro("abc", "xyz")).toBe(0);
    expect(jaro("", "abc")).toBe(0);
  });

  it("es simétrica", () => {
    expect(jaroWinkler("karvane yusuf", "karvane youssef")).toBe(
      jaroWinkler("karvane youssef", "karvane yusuf"),
    );
  });
});

describe("normalizar", () => {
  it("pliega tildes, quita signos y ordena las palabras", () => {
    expect(normalizarNombre("Óscar  Nazrovi-Torvask")).toBe(
      "nazrovi oscar torvask",
    );
    expect(normalizarNombre("Karvane Delmor, Yusuf")).toBe(
      normalizarNombre("Yusuf Karvane Delmor"),
    );
    expect(normalizarNombre("MIJAÍL")).toBe("mijail");
  });

  it("el orden «apellidos, nombre» da similitud 1", () => {
    expect(similitud("Karvane Delmor, Yusuf", "Yusuf Karvane Delmor")).toBe(1);
  });
});

const mundo: Pick<ListasB, "listas"> = {
  listas: [
    {
      id: "LV-01",
      nombre: { es: "v", en: "v" },
      vinculante: true,
      version: "1",
      fecha: "2026-01-01",
      fuente_simulada: { es: "f", en: "f" },
      entradas: [
        {
          id: "LV-01-001",
          nombre: "Yusuf Karvane Delmor",
          alias: ["Yusuf Karvane"],
          nacimiento: 1970,
          nacionalidad: "SYN-J-01",
          motivo: { es: "m", en: "m" },
        },
      ],
    },
    {
      id: "LC-01",
      nombre: { es: "c", en: "c" },
      vinculante: false,
      version: "1",
      fecha: "2026-01-01",
      fuente_simulada: { es: "f", en: "f" },
      entradas: [
        {
          id: "LC-01-001",
          nombre: "Ana Torvask Imrahel",
          alias: [],
          nacimiento: 1960,
          nacionalidad: "SYN-J-02",
          motivo: { es: "m", en: "m" },
        },
      ],
    },
  ],
};

describe("mejor coincidencia", () => {
  it("encuentra la exacta por alias", () => {
    const c = mejorCoincidencia("yusuf KARVANE", mundo);
    expect(c).toMatchObject({
      entrada_id: "LV-01-001",
      similitud: 1,
      exacta: true,
      vinculante: true,
    });
  });

  it("una transliteración queda alta pero no exacta", () => {
    const c = mejorCoincidencia("Youssef Karvane Delmor", mundo);
    expect(c?.entrada_id).toBe("LV-01-001");
    expect(c?.exacta).toBe(false);
    expect(c?.similitud).toBeGreaterThan(0.85);
    expect(c?.similitud).toBeLessThan(1);
  });

  it("sin nombre no hay coincidencia", () => {
    expect(mejorCoincidencia(null, mundo)).toBeNull();
    expect(mejorCoincidencia(" , ", mundo)).toBeNull();
  });
});
