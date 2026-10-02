/**
 * Las fichas que viajan a hoja-de-vida: los archivos versionados son exactamente los que generaría `pnpm fichas`
 * (nadie los edita a mano); cada uno pasa su contrato; las reglas que hoja-de-vida tiene solo en su Zod (el proceso
 * BPMN, el total del export, los enlaces) se cumplen y fallan cuando deben; y las cifras salen de los datos.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { hechosDelRepo, type HechosDelRepo } from "@/lib/datos/repo";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import {
  armarFichaApp,
  brochureExport,
  complementoPropuesto,
  fichaAgente,
} from "@/lib/fichas/armar";
import { archivosDeFichas } from "@/lib/fichas/archivos";
import {
  limiteDe,
  problemasDeExport,
  problemasDeFicha,
} from "@/lib/fichas/contrato";
import type { FichaTecnica } from "@/lib/fichas/tipos";
import { AGENTE } from "@/textos/fichas";

let d: DatosDemo;
let repo: HechosDelRepo;
beforeAll(async () => {
  d = await datosDemo();
  repo = hechosDelRepo();
});

describe("los archivos entregados son los que se generan", () => {
  it("cada archivo versionado es byte a byte el de `pnpm fichas`", () => {
    const archivos = archivosDeFichas(d, repo);
    expect(Object.keys(archivos)).toHaveLength(8);
    for (const [ruta, contenido] of Object.entries(archivos))
      expect(readFileSync(ruta, "utf8"), ruta).toBe(contenido);
  });
});

describe("cada ficha pasa su contrato, en los dos idiomas", () => {
  it.each(["es", "en"] as const)(
    "%s: agente, export y la ficha de la app",
    (i) => {
      const exp = brochureExport(d, repo, i);
      expect(problemasDeFicha(fichaAgente(d, repo, i))).toEqual([]);
      expect(problemasDeExport(exp)).toEqual([]);
      expect(
        problemasDeFicha(armarFichaApp(exp, complementoPropuesto(d, i))),
      ).toEqual([]);
    },
  );
});

describe("las reglas que el esquema no puede decir (el Zod de hoja-de-vida)", () => {
  const base = () =>
    structuredClone(fichaAgente(d, repo, "es")) as FichaTecnica;

  it("el proceso: un solo inicio, todo alcanzable y con salida, decisiones con dos caminos etiquetados", () => {
    const dosInicios = base();
    dosInicios.proceso!.pasos[1]!.tipo = "inicio";
    expect(problemasDeFicha(dosInicios)).toContain(
      "proceso: necesita exactamente un inicio (tiene 2)",
    );

    const sinCamino = base();
    sinCamino.proceso!.flujos = sinCamino.proceso!.flujos.filter(
      (f) => !(f.de === "escala" && f.a === "revisa"),
    );
    const p = problemasDeFicha(sinCamino);
    expect(p).toContain(
      "proceso: la decisión «escala» necesita al menos dos caminos",
    );
    expect(p).toContain("proceso: «revisa» no es alcanzable");

    const sinEtiqueta = base();
    delete sinEtiqueta.proceso!.flujos.find((f) => f.de === "falta")!.etiqueta;
    expect(problemasDeFicha(sinEtiqueta)).toContain(
      "proceso: cada camino de la decisión «falta» lleva su etiqueta",
    );

    const sinProcedencia = base();
    delete sinProcedencia.procedencia_proceso;
    expect(problemasDeFicha(sinProcedencia)).toContain(
      "procedencia_proceso: el proceso necesita su procedencia",
    );
  });

  it("el esquema fijado: un tagline de más de 80 caracteres no pasa", () => {
    const larga = base();
    larga.promesa.tagline = "x".repeat(81);
    expect(problemasDeFicha(larga).join(" ")).toMatch(/\/promesa\/tagline/);
    expect(limiteDe("promesa.tagline")).toEqual({
      min: 1,
      max: 80,
      tipo: "texto",
    });
  });

  it("cero enlaces: una URL en cualquier texto se nombra", () => {
    const f = base();
    f.limites[0] = "Más en https://ejemplo.invalid";
    expect(problemasDeFicha(f)).toContain(
      "/limites/0: trae un enlace (regla de cero enlaces)",
    );
  });

  it("el export: el total cuadra con los grupos y producción va en null", () => {
    const exp = structuredClone(brochureExport(d, repo, "es"));
    exp.funcionalidades.total += 1;
    expect(problemasDeExport(exp).join(" ")).toMatch(/total declarado 17 ≠ 16/);
    const conEnlace = structuredClone(
      brochureExport(d, repo, "es"),
    ) as unknown as {
      enlaces: { produccion: string };
    };
    conEnlace.enlaces.produccion = "planlang";
    expect(problemasDeExport(conEnlace).join(" ")).toMatch(
      /\/enlaces\/produccion/,
    );
  });

  it("la ficha de la app no inventa una cifra: una destacada que el export no trae detiene el armado", () => {
    const comp = complementoPropuesto(d, "es");
    comp.cifras_destacadas = [
      ...comp.cifras_destacadas.slice(0, 4),
      "inventada",
    ];
    expect(() => armarFichaApp(brochureExport(d, repo, "es"), comp)).toThrow(
      /la cifra destacada «inventada» no existe en el export/,
    );
  });
});

describe("lo que dicen las fichas sale de los datos", () => {
  it("las cifras del agente son las del informe", () => {
    const f = fichaAgente(d, repo, "es");
    const valor = (k: string) => f.cifras.find((c) => c.clave === k)!.valor;
    expect(valor("casos_con_persona")).toBe(
      d.informe.contrato_de_grafo.pausas.casos_con_pausa,
    );
    expect(valor("exactitud_extraccion")).toBe(100);
    expect(valor("latencia_mediana")).toBe(11.8);
    expect(valor("negaciones_sin_persona")).toBe(0);
    expect(valor("costo_por_caso")).toBe(0.034);
    expect(f.cifras.every((c) => c.fuente)).toBe(true);
  });

  it("un bloque por nodo del contrato, en su orden, y cada nodo hace un paso del proceso", () => {
    const nodos = d.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
    const f = fichaAgente(d, repo, "en");
    expect(f.bloques.map((b) => b.orden)).toEqual(nodos.map((_, k) => k + 1));
    expect(f.bloques.find((b) => b.nombre === "Decision")!.cuenta).toBe(5);
    const conPaso = new Set(AGENTE.proceso.pasos.map((p) => p.nodo));
    expect(nodos.filter((n) => !conPaso.has(n))).toEqual([]);
  });

  it("el export cuenta lo construido: 16 funcionalidades en 6 grupos, una cifra por ADR", () => {
    const exp = brochureExport(d, repo, "es");
    expect(exp.funcionalidades.grupos.map((g) => g.features.length)).toEqual([
      3, 4, 4, 1, 1, 3,
    ]);
    expect(exp.funcionalidades.total).toBe(16);
    expect(
      exp.metricas.find((m) => m.clave === "decisiones_registradas")!.valor,
    ).toBe(repo.adrs);
    expect(exp.enlaces.produccion).toBeNull();
    expect(Object.keys(exp._schema)).toContain("_lee_esto_primero");
  });
});
