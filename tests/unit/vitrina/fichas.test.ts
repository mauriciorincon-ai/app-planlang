/**
 * Las fichas que viajan a hoja-de-vida: los archivos versionados son exactamente los que generaría `pnpm fichas`
 * (nadie los edita a mano); cada uno pasa su contrato; las reglas que hoja-de-vida tiene solo en su Zod (el proceso
 * BPMN, el total del export, los enlaces) se cumplen y fallan cuando deben; y las cifras salen de los datos: las de
 * cada agente, de su demo, y las de la app, de los dos demos sumados.
 */
import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { hechosDelRepo, type HechosDelRepo } from "@/lib/datos/repo";
import {
  datosDeLosDemos,
  type DatosDeLosDemos,
  type DatosDemo,
} from "@/lib/datos/vitrina";
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
import { AGENTE_B } from "@/textos/demo-b/fichas";
import { AGENTE } from "@/textos/fichas";

let ds: DatosDeLosDemos;
/** El demo A: las reglas del proceso se ejercitan sobre su ficha. */
let d: DatosDemo;
let repo: HechosDelRepo;
beforeAll(async () => {
  ds = await datosDeLosDemos();
  d = ds["demo-a"];
  repo = hechosDelRepo();
});

describe("los archivos entregados son los que se generan", () => {
  it("cada archivo versionado es byte a byte el de `pnpm fichas`", () => {
    const archivos = archivosDeFichas(ds, repo);
    // Por idioma: la ficha de cada agente, el export, el complemento y la ficha de la app.
    expect(Object.keys(archivos)).toHaveLength(10);
    expect(Object.keys(archivos)).toContain(
      "content/agentes/planlang-demo-b.ficha-tecnica.json",
    );
    for (const [ruta, contenido] of Object.entries(archivos))
      expect(readFileSync(ruta, "utf8"), ruta).toBe(contenido);
  });
});

describe("cada ficha pasa su contrato, en los dos idiomas", () => {
  it.each(["es", "en"] as const)(
    "%s: los dos agentes, el export y la ficha de la app",
    (i) => {
      const exp = brochureExport(ds, repo, i);
      expect(problemasDeFicha(fichaAgente(ds["demo-a"], repo, i))).toEqual([]);
      expect(problemasDeFicha(fichaAgente(ds["demo-b"], repo, i))).toEqual([]);
      expect(problemasDeExport(exp)).toEqual([]);
      expect(
        problemasDeFicha(armarFichaApp(exp, complementoPropuesto(ds, i))),
      ).toEqual([]);
      expect(problemasDelComplemento(complementoPropuesto(ds, i))).toEqual([]);
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
    const exp = structuredClone(brochureExport(ds, repo, "es"));
    exp.funcionalidades.total += 1;
    expect(problemasDeExport(exp).join(" ")).toMatch(/total declarado 20 ≠ 19/);
    const conEnlace = structuredClone(
      brochureExport(ds, repo, "es"),
    ) as unknown as {
      enlaces: { produccion: string };
    };
    conEnlace.enlaces.produccion = "planlang";
    expect(problemasDeExport(conEnlace).join(" ")).toMatch(
      /\/enlaces\/produccion/,
    );
  });

  it("el complemento: una procedencia sin proceso sobra (hoja-de-vida lo rechaza)", () => {
    const comp = { ...complementoPropuesto(ds, "es"), procedencia: "app" };
    expect(problemasDelComplemento(comp)).toContain(
      "/procedencia: «procedencia» sin proceso: sobra",
    );
    expect(problemasDelComplemento({ ...comp, extra: 1 }).join(" ")).toMatch(
      /extra/,
    );
  });

  it("la ficha de la app no inventa una cifra: una destacada que el export no trae detiene el armado", () => {
    const comp = complementoPropuesto(ds, "es");
    comp.cifras_destacadas = [
      ...comp.cifras_destacadas.slice(0, 4),
      "inventada",
    ];
    expect(() => armarFichaApp(brochureExport(ds, repo, "es"), comp)).toThrow(
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
    // La corrida de 200 del plan v1.5: C5 medido con 1 de las 3 corridas que pide pass^3, y la etiqueta lo dice.
    expect(valor("exactitud_extraccion")).toBe(96.2);
    expect(
      f.cifras.find((c) => c.clave === "exactitud_extraccion")!.etiqueta,
    ).toBe("exactitud de extracción, 1 de 3 corridas (incompleto)");
    expect(valor("latencia_mediana")).toBe(8.1);
    expect(valor("negaciones_sin_persona")).toBe(0);
    expect(valor("costo_por_caso")).toBe(0.025);
    expect(f.cifras.every((c) => c.fuente)).toBe(true);
  });

  it("la exactitud dice cuántas corridas pide pass^k y cuántas se midieron; sin pass^k, no inventa «1 de 1»", () => {
    const etiqueta = (x: typeof d) =>
      fichaAgente(x, repo, "en").cifras.find(
        (c) => c.clave === "exactitud_extraccion",
      )!.etiqueta;
    expect(etiqueta(d)).toBe("extraction accuracy, 1 of 3 runs (incomplete)");
    const completo = structuredClone(d);
    completo.informe.criterios.find((c) => c.id === "C5")!.k = {
      requerido: 3,
      observado: 3,
      aplica_a: null,
    };
    expect(etiqueta(completo)).toBe("extraction accuracy, 3 of 3 runs");
    const sinK = structuredClone(d);
    sinK.informe.criterios.find((c) => c.id === "C5")!.k = null;
    expect(etiqueta(sinK)).toBe("extraction accuracy");
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

  it("las cifras del agente B son las de su informe, y no inventa una latencia que su plan no fija", () => {
    const b = ds["demo-b"];
    const f = fichaAgente(b, repo, "es");
    const valor = (k: string) => f.cifras.find((c) => c.clave === k)?.valor;
    expect(f.pieza.slug).toBe("planlang-demo-b");
    expect(valor("casos_con_persona")).toBe(
      b.informe.contrato_de_grafo.pausas.casos_con_pausa,
    );
    expect(valor("coincidencias_sin_persona")).toBe(0);
    expect(valor("rechazos_sin_persona")).toBe(0);
    expect(valor("costo_por_caso")).toBe(0.015);
    expect(valor("latencia_mediana")).toBeUndefined();
    const nodos = b.plan.contrato_de_grafo.nodos_esperados.map((n) => n.id);
    expect(f.bloques.map((x) => x.orden)).toEqual(nodos.map((_, k) => k + 1));
    const conPaso = new Set(AGENTE_B.proceso.pasos.map((p) => p.nodo));
    expect(nodos.filter((n) => !conPaso.has(n))).toEqual([]);
  });

  it("las cifras de la app suman los dos demos, y cada detalle dice cuánto puso cada uno", () => {
    const exp = brochureExport(ds, repo, "es");
    const m = (k: string) => exp.metricas.find((x) => x.clave === k)!;
    const a = ds["demo-a"].informe;
    const b = ds["demo-b"].informe;
    const visitas = (x: typeof a) =>
      x.contrato_de_grafo.rf_09_2.reduce((s, r) => s + r.visitas, 0);
    expect(m("criterios_cumplidos").valor).toBe(
      a.criterios.filter((c) => c.estado === "cumple").length +
        b.criterios.filter((c) => c.estado === "cumple").length,
    );
    expect(m("criterios_cumplidos").etiqueta).toBe(
      `criterios cumplidos en los planes de 2 demos, de ${a.criterios.length + b.criterios.length}`,
    );
    expect(m("decisiones_cruzadas").valor).toBe(visitas(a) + visitas(b));
    expect(m("casos_sinteticos").valor).toBe(
      a.ficha_reproducibilidad.corrida.casos_ejecutados +
        b.ficha_reproducibilidad.corrida.casos_ejecutados,
    );
    expect(m("costo_de_una_corrida").valor).toBe(5.2136);
    for (const k of [
      "criterios_cumplidos",
      "casos_sinteticos",
      "costo_de_una_corrida",
    ])
      expect(m(k).detalle, k).toMatch(/Demo A: .+ Demo B: /);
    expect(m("costo_de_una_corrida").detalle).toContain(
      "Demo A: US$ 4,9206 por 200 casos. Demo B: US$ 0,293 por 20 casos.",
    );
  });

  it("el export cuenta lo construido: 19 funcionalidades en 6 grupos, una cifra por ADR", () => {
    const exp = brochureExport(ds, repo, "es");
    // S3: el entrevistador (Planear), el demo B y el expediente (Correr).
    expect(exp.funcionalidades.grupos.map((g) => g.features.length)).toEqual([
      4, 6, 4, 1, 1, 3,
    ]);
    expect(exp.funcionalidades.total).toBe(19);
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
      const exp = brochureExport(ds, repo, i);
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
  it("el export no es anterior a ningún ADR que cuenta, ni a la corrida ni al plan de ningún demo", () => {
    const e = brochureExport(ds, repo, "es");
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
      ...Object.values(ds).flatMap((x) => [
        x.plan.aprobado_el,
        x.informe.ficha_reproducibilidad.corrida.fecha,
      ]),
    ])
      expect(e.actualizado >= f!, `${e.actualizado} frente a ${f}`).toBe(true);
  });

  it.each(["demo-a", "demo-b"] as const)(
    "la del agente de %s no es anterior a su corrida ni a la aprobación de su plan",
    (demo) => {
      const x = ds[demo];
      const f = fichaAgente(x, repo, "es");
      expect(f.actualizado >= x.plan.aprobado_el!).toBe(true);
      expect(
        f.actualizado >= x.informe.ficha_reproducibilidad.corrida.fecha,
      ).toBe(true);
    },
  );
});
