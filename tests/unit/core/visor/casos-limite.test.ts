/**
 * Casos límite del visor: el grafo del SPIKE frente al mismo contrato (5 nodos exigidos y ausentes, uno fuera
 * del contrato — la sección «Antes: el spike» de P3), un lienzo sin terminales y las entradas inválidas.
 */
import { describe, expect, it } from "vitest";
import { ESTILOS } from "@core/visor/estilos";
import { disponer } from "@core/visor/disposicion";
import { geometria } from "@core/visor/geometria";
import { terminales, type GrafoParaMapa } from "@core/visor/mapa";
import { ancho } from "@core/visor/medida";
import { aSvg } from "@core/visor/svg";
import { GRAMATICA, LIMITE_RUTEO, OPCIONES, mapaDemo } from "./_demo";

// La forma del spike del 2026-09-26: inicio → extractor → enrutador → {pausa_humana | aprobar} → fin.
const SPIKE: GrafoParaMapa = {
  nodos: [
    { id: "extractor", tipo: "modelo" },
    { id: "enrutador", tipo: "enrutador" },
    { id: "pausa_humana", tipo: "pausa_humana" },
    { id: "aprobar", tipo: "regla" },
  ],
  aristas: [
    { source: "__start__", target: "extractor" },
    { source: "extractor", target: "enrutador" },
    { source: "enrutador", target: "aprobar", conditional: true },
    { source: "enrutador", target: "pausa_humana", conditional: true },
    { source: "aprobar", target: "__end__" },
    { source: "pausa_humana", target: "__end__" },
  ],
  aristas_condicionales: [
    {
      desde: "enrutador",
      orden: 1,
      senal: "senal_confianza",
      operador: "menor_que",
      valor: "umbral.U1",
      inclusivo: false,
      si_verdadero: "pausa_humana",
    },
  ],
  ramas_por_defecto: { enrutador: "aprobar" },
  pausas_humanas: [],
};

describe("el grafo del spike frente al contrato", () => {
  const mapa = mapaDemo(SPIKE);
  const geo = geometria(mapa, GRAMATICA, {
    ...OPCIONES,
    terminales: terminales(SPIKE),
    detalleNodo: {},
    reglasCortas: {},
  });

  it("5 nodos exigidos y ausentes, 1 fuera del contrato, todos dibujados sin encimarse", () => {
    expect(
      geo.nodos
        .filter((n) => n.madurez === "exigido-por-el-plan")
        .map((n) => n.id)
        .sort(),
    ).toEqual([
      "aclaracion",
      "decision",
      "guardia-salida",
      "redactor",
      "verificador-cobertura",
    ]);
    expect(
      geo.nodos.filter((n) => n.fueraDelContrato).map((n) => n.id),
    ).toEqual(["aprobar"]);
    expect(geo.avisos).toEqual([]);
    const celdas = geo.nodos.map((n) => `${n.fila},${n.columna}`);
    expect(new Set(celdas).size).toBe(celdas.length);
  });

  it("el SVG marca «exigido» y «sin contrato»; los exigidos no son botones", () => {
    for (const [i, exigido, extra] of [
      ["es", "exigido", "sin contrato"],
      ["en", "required", "unplanned"],
    ] as const) {
      const svg = aSvg(geo, GRAMATICA, {
        idioma: i,
        ns: "spike",
        titulo: { es: "Spike", en: "Spike" },
        descripcion: { es: "d", en: "d" },
        seleccionables: true,
      });
      expect(svg.match(new RegExp(`>${exigido}<`, "g"))).toHaveLength(5);
      expect(svg).toContain(`>${extra}<`);
      expect(svg.match(/data-madurez="exigido"[^>]*role="img"/g)).toHaveLength(
        5,
      );
    }
  });

  it("sin `seleccionables` nada es un botón", () => {
    const svg = aSvg(geo, GRAMATICA, {
      idioma: "es",
      ns: "s",
      titulo: { es: "t", en: "t" },
      descripcion: { es: "d", en: "d" },
    });
    expect(svg).not.toContain('role="button"');
    expect(svg).not.toContain("data-sel-id");
  });
});

describe("entradas límite", () => {
  it(
    "sin terminales: el lienzo se dibuja sin inicio ni fin",
    { timeout: LIMITE_RUTEO },
    () => {
      const geo = geometria(mapaDemo(), GRAMATICA, {
        ...OPCIONES,
        terminales: { inicio: [], fin: [] },
      });
      expect(geo.terminales).toEqual([]);
      expect(
        geo.lineas.some((l) => l.origen === "inicio" || l.destino === "fin"),
      ).toBe(false);
    },
  );

  it("un nodo en una banda transversal no cabe en las columnas", () => {
    const mapa = mapaDemo();
    mapa.nodos[0] = { ...mapa.nodos[0]!, banda_id: "guardarrailes" };
    expect(() => disponer(mapa, GRAMATICA, ["enrutador"])).toThrow(
      /banda de capa/,
    );
  });

  it("un peso que la tabla no trae es un error", () => {
    expect(() =>
      ancho("x", { ...ESTILOS.nodoNombre, peso: 300 as 400 }),
    ).toThrow(/no trae/);
  });
});

describe("AU-S2-B46: un auto-lazo se dibuja (antes tumbaba el build)", () => {
  it("un nodo que se reintenta a sí mismo da una línea propia a la derecha de su caja", () => {
    const g: GrafoParaMapa = {
      ...SPIKE,
      aristas: [
        ...SPIKE.aristas,
        { source: "extractor", target: "extractor", conditional: true },
      ],
      aristas_condicionales: [
        ...SPIKE.aristas_condicionales,
        {
          desde: "extractor",
          orden: 1,
          senal: "campos_faltantes_count",
          operador: "mayor_que",
          valor: 0,
          inclusivo: false,
          si_verdadero: "extractor",
        },
      ],
    };
    const geo = geometria(mapaDemo(g), GRAMATICA, {
      ...OPCIONES,
      terminales: terminales(g),
      detalleNodo: {},
      reglasCortas: {},
    });
    const lazo = geo.lineas.find(
      (l) => l.origen === "extractor" && l.destino === "extractor",
    );
    expect(lazo).toBeDefined();
    const caja = geo.nodos.find((n) => n.id === "extractor")!;
    expect(lazo!.puntos[0]![0]).toBe(caja.caja.x + caja.caja.w);
    expect(lazo!.puntos.length).toBeGreaterThanOrEqual(3);
  });
});

describe("AU-S2-B47: ids compuestos únicos y terminales reservados", () => {
  it("un nodo no puede llamarse como un terminal del lienzo", async () => {
    const { idDeMapa } = await import("@core/visor/ids");
    expect(() => idDeMapa("inicio")).toThrow(/reservado/);
    expect(() => idDeMapa("fin")).toThrow(/reservado/);
    expect(idDeMapa("fin_de_caso")).toBe("fin-de-caso");
  });

  it("`x_a → y` y `x → a_y` darían la misma línea: el lienzo se niega a dibujar una encima de otra", () => {
    const g: GrafoParaMapa = {
      nodos: [
        { id: "x_a", tipo: "regla" },
        { id: "y", tipo: "regla" },
        { id: "x", tipo: "regla" },
        { id: "a_y", tipo: "regla" },
      ],
      aristas: [
        { source: "__start__", target: "x" },
        { source: "x", target: "x_a" },
        { source: "x_a", target: "y" },
        { source: "x", target: "a_y" },
        { source: "y", target: "__end__" },
        { source: "a_y", target: "__end__" },
      ],
      aristas_condicionales: [],
      ramas_por_defecto: {},
      pausas_humanas: [],
    };
    expect(() =>
      geometria(mapaDemo(g), GRAMATICA, {
        ...OPCIONES,
        terminales: terminales(g),
        detalleNodo: {},
        reglasCortas: {},
      }),
    ).toThrow(/dos líneas del lienzo dan el mismo id «x-a-a-y»/);
  });
});
