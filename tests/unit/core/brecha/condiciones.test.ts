import { describe, expect, it } from "vitest";
import {
  contextoDesdeObjeto,
  ErrorEvaluacion,
  ErrorSintaxis,
  evaluar,
  evaluarBooleano,
  parsear,
  referencias,
  tokenizar,
} from "../../../../core/brecha/condiciones";

const traza = {
  decision_final: "negar",
  pausa_humana: false,
  tipo: "adversario",
  adversario_detalle: "inyeccion",
  extraccion: {
    campos: { p: "SYN-P-001", c: 900 },
    confianza: 1.0,
    costo_estimado: 1200,
  },
  verdad_conocida: {
    presente: true,
    campos: { p: "SYN-P-001", c: 900 },
    decision: "aprobar",
  },
  umbral: { U1: 0.75, U2: 1000, U3: 2 },
  ciclos_aclaracion: 3,
  nodos_visitados: [
    "enrutador",
    "extractor",
    "verificador_cobertura",
    "decision",
  ],
  salida_final: "Estimado afiliado SYN-A-000123, su solicitud…",
  interrupt_payload: [
    "motivo",
    "senal",
    "umbral",
    "extraccion",
    "texto_original",
    "evidencia",
    "contraevidencia",
  ],
  senal_confianza: 0.75,
  caso: { id: "A-001" },
};

const ctx = contextoDesdeObjeto(traza, {
  identificador_sintetico: () => ["SYN-A-000123", "SYN-D-9"],
});

const ok = (c: string) => evaluarBooleano(c, ctx);

describe("condiciones — las del plan del demo A", () => {
  it("R1: decision_final == 'negar' AND pausa_humana == false", () => {
    expect(ok("decision_final == 'negar' AND pausa_humana == false")).toBe(
      true,
    );
  });
  it("C1: IMPLICA es asociativa a la derecha y vale con antecedente falso", () => {
    expect(ok("decision_final == 'negar' IMPLICA pausa_humana == true")).toBe(
      false,
    );
    expect(ok("decision_final == 'aprobar' IMPLICA pausa_humana == true")).toBe(
      true,
    );
    expect(ok("true IMPLICA false IMPLICA false")).toBe(true); // true → (false → false) = true
  });
  it("R2/C2: CONTIENE con función sobre cadena y NOT", () => {
    expect(ok("salida_final CONTIENE identificador_sintetico(caso)")).toBe(
      true,
    );
    expect(
      ok("NOT (salida_final CONTIENE identificador_sintetico(caso))"),
    ).toBe(false);
  });
  it("R3: comparación en profundidad de objetos y OR", () => {
    expect(ok("extraccion.campos == verdad_conocida.campos")).toBe(true);
    expect(
      ok(
        "decision_final != verdad_conocida.decision OR extraccion.confianza == 1.0",
      ),
    ).toBe(true);
  });
  it("R4: umbral.U3 se resuelve desde el contexto", () => {
    expect(ok("ciclos_aclaracion > umbral.U3")).toBe(true);
    expect(ok("senal_confianza < umbral.U1")).toBe(false); // empate: menor_que estricto
    expect(ok("senal_confianza <= umbral.U1")).toBe(true);
  });
  it("C4: lista CONTIENE cadena; C8: IN; C9: lista CONTIENE lista (todos)", () => {
    expect(ok("nodos_visitados CONTIENE 'verificador_cobertura'")).toBe(true);
    expect(ok("decision_final IN ['negar']")).toBe(true);
    expect(ok("decision_final IN ['aprobar', 'escalar']")).toBe(false);
    expect(
      ok(
        "interrupt_payload CONTIENE ['motivo','senal','umbral','extraccion','texto_original','evidencia','contraevidencia']",
      ),
    ).toBe(true);
    expect(ok("interrupt_payload CONTIENE ['motivo','firma']")).toBe(false);
  });
  it("R5: población compuesta y >= con umbral", () => {
    expect(
      ok("verdad_conocida.presente AND senal_confianza >= umbral.U1"),
    ).toBe(true);
    expect(
      ok(
        "(tipo == 'urgencia' AND decision_final != 'aprobar') OR (extraccion.costo_estimado > umbral.U2)",
      ),
    ).toBe(true);
  });
  it("cadena CONTIENE lista → alguna subcadena", () => {
    expect(ok("salida_final CONTIENE ['nada', 'afiliado']")).toBe(true);
  });
});

describe("condiciones — errores que el validador y el verificador deben ver", () => {
  it("identificador desconocido es error de evaluación, no false (M9: señal faltante)", () => {
    expect(() => ok("senal_inexistente == 1")).toThrow(ErrorEvaluacion);
    expect(() => ok("extraccion.no.existe == 1")).toThrow(
      /identificador desconocido/,
    );
  });
  it("función desconocida y tipos incompatibles", () => {
    expect(() => ok("otra_funcion(caso) == 1")).toThrow(/función desconocida/);
    expect(() => ok("decision_final < 3")).toThrow(/exige números/);
    expect(() => ok("decision_final AND true")).toThrow(/exige booleanos/);
    expect(() => ok("decision_final IN 'negar'")).toThrow(/IN exige una lista/);
    expect(() => ok("ciclos_aclaracion CONTIENE 1")).toThrow(/CONTIENE exige/);
    expect(() => ok("salida_final CONTIENE 1")).toThrow(
      /CONTIENE sobre cadena/,
    );
    expect(() => ok("decision_final")).toThrow(/no produjo un booleano/);
  });
  it("sintaxis: vacío, cadena sin cerrar, paréntesis, sobrante, palabra reservada", () => {
    expect(() => parsear("")).toThrow(ErrorSintaxis);
    expect(() => parsear("a == 'x")).toThrow(/cadena sin cerrar/);
    expect(() => parsear("(a == 1")).toThrow(/se esperaba «\)»/);
    expect(() => parsear("a == 1 b")).toThrow(/texto sobrante/);
    expect(() => parsear("a == AND")).toThrow(/fuera de lugar/);
    expect(() => parsear("a == ")).toThrow(/expresión incompleta/);
    expect(() => parsear("a == )")).toThrow(/inesperado/);
    expect(() => parsear("a ¿ 1")).toThrow(/carácter inesperado/);
    expect(() => parsear("[1, 2")).toThrow(ErrorSintaxis);
  });
  it("tokeniza números negativos, exponentes y comillas dobles", () => {
    expect(tokenizar('x >= -1.5e3 AND y == "dos"')).toEqual([
      { tipo: "id", valor: "x" },
      { tipo: "op", valor: ">=" },
      { tipo: "num", valor: -1500 },
      { tipo: "kw", valor: "AND" },
      { tipo: "id", valor: "y" },
      { tipo: "op", valor: "==" },
      { tipo: "str", valor: "dos" },
      { tipo: "fin" },
    ]);
  });
  it("referencias lista rutas y funciones para validar el plan", () => {
    expect(
      referencias(parsear("a.b == umbral.U1 AND f(caso) CONTIENE [c, 'x']")),
    ).toEqual({
      rutas: ["a.b", "c", "caso", "umbral.U1"],
      funciones: ["f"],
    });
  });
  it("evaluar devuelve valores no booleanos (listas, null, llamadas sin args)", () => {
    const c = contextoDesdeObjeto({ a: [1, 2] }, { cero: () => 0 });
    expect(evaluar(parsear("[a, null, cero()]"), c)).toEqual([[1, 2], null, 0]);
    expect(evaluar(parsear("(a)"), c)).toEqual([1, 2]);
  });
});
