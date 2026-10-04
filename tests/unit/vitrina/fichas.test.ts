/**
 * Las fichas que viajan a hoja-de-vida: los archivos versionados son exactamente los que generaría `pnpm fichas`
 * (nadie los edita a mano); cada uno pasa su contrato; las reglas que hoja-de-vida tiene solo en su Zod (el proceso
 * BPMN, el total del export, los enlaces) se cumplen y fallan cuando deben; y las cifras salen de los datos.
 */
import { readdirSync, readFileSync } from "node:fs";
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
  problemasDelComplemento,
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
      expect(problemasDelComplemento(complementoPropuesto(d, i))).toEqual([]);
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

  it("el complemento: una procedencia sin proceso sobra (hoja-de-vida lo rechaza)", () => {
    const comp = { ...complementoPropuesto(d, "es"), procedencia: "app" };
    expect(problemasDelComplemento(comp)).toContain(
      "/procedencia: «procedencia» sin proceso: sobra",
    );
    expect(problemasDelComplemento({ ...comp, extra: 1 }).join(" ")).toMatch(
      /extra/,
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

  it("un bloque por nodo del contrato, en su orden, sin cuenta de funcionalidades, y cada nodo hace un paso del proceso", () => {
    const nodos = d.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
    const f = fichaAgente(d, repo, "en");
    expect(f.bloques.map((b) => b.orden)).toEqual(nodos.map((_, k) => k + 1));
    // hoja-de-vida pinta `cuenta` como «N funcionalidades»: un nodo no las tiene.
    expect(f.bloques.every((b) => b.cuenta === 0)).toBe(true);
    // Y pinta la versión como «v{version}»: semver, sin prefijo.
    expect(f.pieza.version).toMatch(/^\d+\.\d+\.\d+$/);
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

/** Los encabezados `###` de una mitad del manual (ES o EN), sin el «· desde el sprint N» de su historia. */
function seccionesDelManual(i: "es" | "en"): string[] {
  const manual = readFileSync("docs/MANUAL-DE-USO.md", "utf8");
  const [es, resto] = manual.split(/^## English$/m);
  const en = resto!.split(/^## Historial/m)[0]!;
  return [...(i === "es" ? es! : en).matchAll(/^### (.+)$/gm)].map((m) =>
    m[1]!.split(" · ")[0]!.trim(),
  );
}

describe("AU-S2-4: cada funcionalidad del export apunta a una sección real del manual", () => {
  it("toda `seccion_manual` es un encabezado de su mitad del manual, en los dos idiomas", () => {
    for (const i of ["es", "en"] as const) {
      const secciones = seccionesDelManual(i);
      const exp = brochureExport(d, repo, i);
      expect(exp.funcionalidades.fuente_del_conteo).toBe(
        "docs/MANUAL-DE-USO.md",
      );
      for (const g of exp.funcionalidades.grupos)
        for (const f of g.features)
          expect(secciones, `${i} ${f.id}: «${f.seccion_manual}»`).toContain(
            f.seccion_manual,
          );
    }
  });

  it("el gate nombra la funcionalidad cuyo rótulo no existe (demo en rojo)", () => {
    const secciones = seccionesDelManual("es");
    expect(secciones).not.toContain("Correr un lote de 20");
    expect(secciones).toContain("Correr un lote");
  });
});

describe("«actualizado» es la fecha más reciente de lo que la ficha cuenta (AU-S2-B41)", () => {
  it("el export no es anterior a ningún ADR que cuenta, ni a la corrida, ni al plan", () => {
    const e = brochureExport(d, repo, "es");
    const adrs = readdirSync("decisions")
      .filter((f) => /^\d{3}-.+\.md$/.test(f))
      .map(
        (f) =>
          /\*\*Fecha:\*\*\s*(\d{4}-\d{2}-\d{2})/.exec(
            readFileSync(`decisions/${f}`, "utf8"),
          )?.[1],
      )
      .filter((x): x is string => !!x);
    expect(adrs.length).toBe(repo.adrs);
    for (const f of [
      ...adrs,
      d.plan.aprobado_el,
      d.informe.ficha_reproducibilidad.corrida.fecha,
    ])
      expect(e.actualizado >= f!, `${e.actualizado} frente a ${f}`).toBe(true);
  });

  it("la del agente no es anterior a la corrida ni a la aprobación del plan", () => {
    const f = fichaAgente(d, repo, "es");
    expect(f.actualizado >= d.plan.aprobado_el!).toBe(true);
    expect(
      f.actualizado >= d.informe.ficha_reproducibilidad.corrida.fecha,
    ).toBe(true);
  });
});
