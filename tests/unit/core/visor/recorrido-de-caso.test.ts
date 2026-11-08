/**
 * El recorrido de UN caso (S10, contrato 0.5.0 § 3.5 y § 4.3): la forma del contrato desde una traza real, la unión de
 * cada paso con sus reglas, su rama y su pausa, la validación del mapa (V5 y V12, la misma de `validarMapa`) con sus
 * carnadas, y el CSS por `data-paso`, que nunca anima (G12: la transición vive en una hoja aparte).
 */
import { describe, expect, it } from "vitest";
import {
  cssDeRecorrido,
  estadosEnPaso,
  recorridoDeCaso,
  type TrazaParaCaso,
} from "@core/visor/recorrido-de-caso";
import type { Mapa, Recorrido } from "@core/visor/tipos";
import {
  EXCEPCIONES_PLANLANG,
  erroresDe,
  validarMapa,
} from "@core/visor/validar";
import {
  CONTRATO,
  GRAFO,
  GRAMATICA,
  TRAZAS,
  mapaDemo,
  textosDeRelleno,
} from "./_demo";

const TEXTOS = textosDeRelleno([
  ...CONTRATO.nodos_esperados.map((n) => n.id),
  ...GRAFO.nodos.map((n) => n.id),
]);
const TITULO = { es: "Caso", en: "Case" };
const traza = (id: string) =>
  TRAZAS.find((t) => t.caso_id === id) as unknown as TrazaParaCaso;
/** Un caso con aclaraciones, pausa humana y respuesta: A-002 (10 pasos). */
const A002 = recorridoDeCaso(traza("A-002"), TEXTOS, TITULO);

const op = { cobertura: "letra" as const, excepciones: EXCEPCIONES_PLANLANG };
const conRecorrido = (r: Recorrido): Mapa => ({
  ...(JSON.parse(JSON.stringify(mapaDemo())) as Mapa),
  recorridos: [r],
});
const reglas = (r: Recorrido) =>
  erroresDe(validarMapa(conRecorrido(r), GRAMATICA, op)).map(
    (e) => `${e.regla}:${e.id}`,
  );

describe("recorrido de un caso", () => {
  it("tiene la forma del contrato: un paso por nodo visitado, en orden, cada uno siguiendo al anterior", () => {
    const r = A002.recorrido;
    expect(r.id).toBe("caso-a-002");
    expect(r.pasos.map((p) => p.nodo_id)).toEqual([
      "enrutador",
      "extractor",
      "aclaracion",
      "extractor",
      "aclaracion",
      "extractor",
      "aclaracion",
      "pausa-humana",
      "redactor",
      "guardia-salida",
    ]);
    expect(r.pasos[0]!.sigue_de).toBeUndefined();
    r.pasos.slice(1).forEach((p, j) => expect(p.sigue_de).toBe(`p${j + 1}`));
    expect(r.pasos.some((p) => p.bifurca)).toBe(false);
  });

  it("cada paso trae sus reglas, la rama que tomó, la pausa y lo que tardó, de la traza", () => {
    const [p1, , p3, , , , p7, p8] = A002.pasos;
    expect(p1!.reglas.map((x) => [x.senal, x.resultado])).toEqual([
      ["tipo_atencion", false],
      ["servicio_exento", false],
    ]);
    expect(p1!.rama).toBe("extractor");
    expect(p3!.reglas[1]).toMatchObject({
      senal: "ciclos_aclaracion",
      umbral: "U3",
      observado: 0,
      resultado: false,
    });
    expect(p3!.reglas[0]!.umbral).toBeNull();
    expect(p7!.rama).toBe("pausa_humana");
    expect(p8!.rama).toBeNull();
    expect(p8!.pausa?.rol).toBeTruthy();
    expect(p8!.pausa?.decision).toBeTruthy();
    expect(A002.pasos.every((p) => p.duracion_ms >= 0)).toBe(true);
  });

  it("pasa V5 y V12 dentro del mapa real, igual que todos los casos de la corrida", () => {
    expect(reglas(A002.recorrido)).toEqual([]);
    for (const t of TRAZAS.slice(0, 20))
      expect(
        reglas(
          recorridoDeCaso(t as unknown as TrazaParaCaso, TEXTOS, TITULO)
            .recorrido,
        ),
      ).toEqual([]);
  });

  it("rojo V5: un paso que se sigue a sí mismo, o a uno posterior, no pasa", () => {
    const r = structuredClone(A002.recorrido);
    r.pasos[3]!.sigue_de = "p4";
    expect(reglas(r)).toEqual(["V5:p4"]);
    const r2 = structuredClone(A002.recorrido);
    r2.pasos[2]!.sigue_de = "p5";
    expect(reglas(r2)).toContain("V5:p3");
  });

  it("rojo V12: un paso lineal que declara una bifurcación que no tiene", () => {
    const r = structuredClone(A002.recorrido);
    r.pasos[0]!.bifurca = "alternativa";
    expect(reglas(r)).toEqual(["V12:p1"]);
  });

  it("falla con nombre: sin pasos, con dos ramas en un paso o con un nodo sin textos", () => {
    const t = traza("A-002");
    expect(() => recorridoDeCaso({ ...t, pasos: [] }, TEXTOS, TITULO)).toThrow(
      /no tiene pasos/,
    );
    const dos = {
      ...t,
      decisiones_de_arista: t.decisiones_de_arista.map((d, k) =>
        k === 0 ? { ...d, rama_tomada: "otra" } : d,
      ),
    };
    expect(() => recorridoDeCaso(dos, TEXTOS, TITULO)).toThrow(/dos ramas/);
    const sin = { ...TEXTOS };
    delete sin.redactor;
    expect(() => recorridoDeCaso(t, sin, TITULO)).toThrow(/redactor/);
  });
});

describe("estados y CSS del recorrido (§ 4.3)", () => {
  it("en el paso k: el nodo del paso activo, los anteriores visitados (aunque se repitan), el resto pendiente", () => {
    expect(estadosEnPaso(A002, 1)).toEqual({ enrutador: "activo" });
    expect(estadosEnPaso(A002, 4)).toEqual({
      enrutador: "visitado",
      extractor: "activo",
      aclaracion: "visitado",
    });
    expect(estadosEnPaso(A002, 0)).toEqual({});
  });

  it("una regla por paso con `data-paso`, activo con filete grueso y visitado discontinuo (no solo color, P13)", () => {
    const css = cssDeRecorrido(A002, "recorrido", "#camina");
    for (let k = 1; k <= A002.pasos.length; k++)
      expect(css).toContain(`#camina[data-paso="${k}"]`);
    expect(css).toContain(
      '#camina[data-paso="3"] #recorrido-n-aclaracion .caja { fill: var(--t); stroke: var(--c); stroke-width: 3; }',
    );
    expect(css).toMatch(
      /#camina\[data-paso="3"\] #recorrido-n-enrutador .caja, #camina\[data-paso="3"\] #recorrido-n-extractor .caja \{[^}]*stroke-dasharray/,
    );
    expect(css).toContain(
      '#camina[data-paso] svg[data-visor="recorrido"] .d-nodo { opacity: 0.45; }',
    );
  });

  it("G12: el CSS del recorrido no anima nada (rojo: con una transición, la guardia lo detecta)", () => {
    const sinMovimiento = (css: string) =>
      !/transition|animation|@keyframes/.test(css);
    const css = cssDeRecorrido(A002, "recorrido", "#camina");
    expect(sinMovimiento(css)).toBe(true);
    expect(
      sinMovimiento(`${css}#camina .d-nodo { transition: opacity 0.3s; }`),
    ).toBe(false);
  });
});
