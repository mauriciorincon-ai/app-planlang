/**
 * Lo que el verificador necesita distinguir al evaluar reglas del plan: señal nula (no aplica / no
 * evaluable), señal faltante (brecha) y comparación de estructuras distintas (regla mal formada).
 */
import { describe, expect, it } from "vitest";
import {
  contextoDesdeObjeto,
  ErrorComparacionSospechosa,
  ErrorIdentificador,
  ErrorNulo,
  evaluar,
  evaluarBooleano,
  parsear,
} from "../../../../core/brecha/condiciones";

const ctx = contextoDesdeObjeto({
  extraccion: null,
  confianza: null,
  campos: { a: 1, b: 2 },
  otros: { a: 1, c: 2 },
  salida: null,
  lista: null,
  flag: null,
});

describe("señales nulas", () => {
  it("una ruta que atraviesa null vale null (no «desconocida»)", () => {
    expect(evaluar(parsear("extraccion.costo_estimado"), ctx)).toBeNull();
    expect(evaluarBooleano("extraccion.costo_estimado == null", ctx)).toBe(
      true,
    );
  });
  it("ordenar, negar, buscar o pertenecer sobre null lanza ErrorNulo", () => {
    expect(() => evaluarBooleano("confianza > 0.5", ctx)).toThrow(ErrorNulo);
    expect(() => evaluarBooleano("NOT flag", ctx)).toThrow(ErrorNulo);
    expect(() => evaluarBooleano("flag AND true", ctx)).toThrow(ErrorNulo);
    expect(() => evaluarBooleano("salida CONTIENE 'x'", ctx)).toThrow(
      ErrorNulo,
    );
    expect(() => evaluarBooleano("'x' CONTIENE salida", ctx)).toThrow(
      ErrorNulo,
    );
    expect(() => evaluarBooleano("1 IN lista", ctx)).toThrow(ErrorNulo);
  });
  it("igualdad con null es legítima", () => {
    expect(evaluarBooleano("confianza == null AND salida != 'x'", ctx)).toBe(
      true,
    );
  });
});

describe("señal faltante y comparación sospechosa", () => {
  it("un identificador inexistente lanza ErrorIdentificador con su ruta", () => {
    try {
      evaluar(parsear("no_existe == 1"), ctx);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorIdentificador);
      expect((e as ErrorIdentificador).ruta).toBe("no_existe");
    }
  });
  it("objetos con claves distintas u objeto contra escalar → ErrorComparacionSospechosa", () => {
    expect(() => evaluarBooleano("campos != otros", ctx)).toThrow(
      ErrorComparacionSospechosa,
    );
    try {
      evaluarBooleano("campos == 3", ctx);
      expect.unreachable();
    } catch (e) {
      expect((e as ErrorComparacionSospechosa).clavesIzq).toBe("a, b");
      expect((e as ErrorComparacionSospechosa).clavesDer).toBe("");
    }
  });
  it("objetos con las mismas claves se comparan por contenido", () => {
    const c = contextoDesdeObjeto({
      x: { a: 1, b: 2 },
      y: { b: 2, a: 1 },
      z: { a: 1, b: 3 },
    });
    expect(evaluarBooleano("x == y", c)).toBe(true);
    expect(evaluarBooleano("x != z", c)).toBe(true);
  });
});
