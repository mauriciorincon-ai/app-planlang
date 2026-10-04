// @vitest-environment node
/**
 * AU-S2-3: la copia de la vitrina no afirma nada del plan que el plan no tenga. Tres gates:
 *
 * 1. todo id de plan (`U`, `C`, `R`, `S`, `D` + número) que aparece en un texto de `src/textos/` existe en el
 *    plan publicado DE SU DEMO, en su sección (los sprints se escriben «sprint N», nunca «S2»). Un texto es del B si
 *    vive en `src/textos/demo-b/` o bajo una clave `"demo-b"` de un diccionario común; si no, es del A (S3, ADR-014);
 * 2. toda plantilla `{plan:…}` de esos textos se resuelve contra el plan, en los dos idiomas, y ninguna vista sale
 *    con una sin resolver;
 * 3. los mapas editoriales que nombran criterios (por nodo, garantías «Nunca», anclas de la ficha y del informe)
 *    citan criterios que existen y que miden lo que el texto dice.
 *
 * Solo se leen los literales de texto (con el analizador de TypeScript), no los comentarios.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";
import { datosDemo, type DatosDemo } from "@/lib/datos/vitrina";
import type { IdDemo } from "@/lib/demos";
import { vistaAgente } from "@/lib/vista/agente";
import { idsDeCasos, vistaCaso } from "@/lib/vista/caso";
import { conPlan, REFERENCIA_PLAN } from "@/lib/vista/plan-en-texto";
import { vistaPlan } from "@/lib/vista/plan";
import {
  CRITERIOS_EN_LA_CORRIDA,
  CRITERIOS_NUNCA,
  FICHA,
  PLAN_POR_NODO,
} from "@/textos/agente";
import {
  CRITERIOS_EN_LA_CORRIDA_B,
  CRITERIOS_NUNCA_B,
  FICHA_B,
  PLAN_POR_NODO_B,
} from "@/textos/demo-b/agente";
import * as TEXTOS_BRECHA from "@/textos/brecha";
import { LECTURA_NOTA, PASO_FUERA, RESUMEN, SECCIONES } from "@/textos/brecha";
import { APP } from "@/textos/fichas";
import { NUMERO_EN_PALABRAS } from "@/textos/plan-comun";
import { PANTALLAS } from "@/lib/ruta";

const DIR = "src/textos";

interface Literal {
  archivo: string;
  linea: number;
  texto: string;
  /** El demo cuyo plan rige el texto: el de su carpeta, o el de la clave `"demo-a"`/`"demo-b"` que lo contiene. */
  demo: IdDemo;
}

const CLAVES_DE_DEMO = new Set<string>(["demo-a", "demo-b"]);

/** Los literales de texto de un archivo (cadenas y trozos de plantilla), con su línea y su demo. */
export function literales(
  archivo: string,
  fuente: string,
  demo: IdDemo = "demo-a",
): Literal[] {
  const sf = ts.createSourceFile(archivo, fuente, ts.ScriptTarget.Latest, true);
  const out: Literal[] = [];
  const visitar = (n: ts.Node, de: IdDemo) => {
    if (
      ts.isPropertyAssignment(n) &&
      (ts.isStringLiteral(n.name) || ts.isIdentifier(n.name)) &&
      CLAVES_DE_DEMO.has(n.name.text)
    ) {
      visitar(n.initializer, n.name.text as IdDemo);
      return;
    }
    if (
      ts.isStringLiteral(n) ||
      ts.isNoSubstitutionTemplateLiteral(n) ||
      ts.isTemplateHead(n) ||
      ts.isTemplateMiddle(n) ||
      ts.isTemplateTail(n)
    )
      out.push({
        archivo,
        linea: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1,
        texto: n.text,
        demo: de,
      });
    ts.forEachChild(n, (h) => visitar(h, de));
  };
  visitar(sf, demo);
  return out;
}

function literalesDe(dir: string, demo: IdDemo): Literal[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .flatMap((f) =>
      literales(join(dir, f), readFileSync(join(dir, f), "utf8"), demo),
    );
}

function todosLosLiterales(): Literal[] {
  return [
    ...literalesDe(DIR, "demo-a"),
    ...literalesDe(join(DIR, "demo-b"), "demo-b"),
  ];
}

const SECCION = {
  U: "umbrales",
  C: "criterios_aceptacion",
  R: "riesgos",
  S: "supuestos",
  D: "decisiones",
} as const;

/** Los ids de plan que cita un texto y no existen en el plan, como `archivo:línea id`. */
export function idsSinPlan(
  ls: readonly Literal[],
  plan: DatosDemo["plan"],
): string[] {
  const existen = new Set<string>(
    Object.values(SECCION).flatMap((s) =>
      (plan[s] as ReadonlyArray<{ id: string }>).map((x) => x.id),
    ),
  );
  const fuera: string[] = [];
  for (const l of ls)
    for (const m of l.texto.matchAll(/\b([UCRSD])(\d+)\b/g))
      if (!existen.has(m[0])) fuera.push(`${l.archivo}:${l.linea} ${m[0]}`);
  return fuera;
}

let d: DatosDemo;
let ds: Record<IdDemo, DatosDemo>;
let ls: Literal[];
beforeAll(async () => {
  d = await datosDemo();
  ds = { "demo-a": d, "demo-b": await datosDemo("demo-b") };
  ls = todosLosLiterales();
}, 60_000);

describe("1 · los ids que cita la copia existen en el plan", () => {
  it("se leen literales de todos los diccionarios, de los dos demos", () => {
    expect(ls.length).toBeGreaterThan(1000);
    expect(new Set(ls.map((l) => l.archivo)).size).toBeGreaterThanOrEqual(10);
    expect(ls.filter((l) => l.demo === "demo-b").length).toBeGreaterThan(300);
  });

  it.each(["demo-a", "demo-b"] as const)(
    "ningún texto del %s cita un umbral, criterio, riesgo, supuesto o decisión que su plan no tenga",
    (demo) => {
      expect(
        idsSinPlan(
          ls.filter((l) => l.demo === demo),
          ds[demo].plan,
        ),
      ).toEqual([]);
    },
  );

  it("un texto del B bajo una clave «demo-b» de un diccionario común se lee contra el plan B", () => {
    const comun = literales(
      "src/textos/falso.ts",
      'export const X = { "demo-a": tb("C9 ok", "C9 ok"), "demo-b": tb("C9 no", "C9 no") };\n',
    );
    expect(comun.map((l) => l.demo)).toEqual([
      "demo-a",
      "demo-a",
      "demo-b",
      "demo-b",
    ]);
    // El plan A tiene C9; el B, no: el gate nombra solo los del B.
    expect(
      idsSinPlan(
        comun.filter((l) => l.demo === "demo-b"),
        ds["demo-b"].plan,
      ),
    ).toEqual(["src/textos/falso.ts:1 C9", "src/textos/falso.ts:1 C9"]);
  });

  it("el gate nombra archivo, línea e id (demo en rojo con un «U9»)", () => {
    const falso = literales(
      "src/textos/falso.ts",
      'export const X = { a: tb("si U9 sube", "if U9 rises") };\n',
    );
    expect(idsSinPlan(falso, d.plan)).toEqual([
      "src/textos/falso.ts:1 U9",
      "src/textos/falso.ts:1 U9",
    ]);
  });
});

describe("2 · las plantillas {plan:…} se resuelven contra el plan", () => {
  it("cada plantilla de los diccionarios resuelve contra el plan de su demo, en los dos idiomas", () => {
    const conRef = ls.filter((l) => l.texto.includes("{plan:"));
    expect(conRef.length).toBeGreaterThanOrEqual(10);
    expect(conRef.some((l) => l.demo === "demo-b")).toBe(true);
    for (const l of conRef)
      for (const i of ["es", "en"] as const) {
        const r = conPlan(l.texto, ds[l.demo].plan, i, l.demo);
        expect(r, `${l.archivo}:${l.linea}`).not.toMatch(REFERENCIA_PLAN);
      }
  });

  it("una referencia que el plan no tiene detiene el build nombrándola", () => {
    expect(() =>
      conPlan("tras {plan:U9} preguntas", d.plan, "es", "demo-a"),
    ).toThrow(/\{plan:U9\}/);
    expect(() =>
      conPlan("{plan:reglas.inexistente}", d.plan, "en", "demo-a"),
    ).toThrow(/reglas\.inexistente/);
  });

  it("los valores se leen del plan: con U3 = 3, la aclaración dice 3", () => {
    const p = structuredClone(d.plan);
    p.umbrales.find((u) => u.id === "U3")!.valor_en_plan = 3;
    expect(conPlan("tras {plan:U3} preguntas", p, "es", "demo-a")).toBe(
      "tras 3 preguntas",
    );
    expect(
      conPlan("{plan:reglas.decision|Palabra} reglas", d.plan, "es", "demo-a"),
    ).toBe("Cinco reglas");
  });

  it("las reglas del B se nombran con su vocabulario, no con el del A", () => {
    const b = ds["demo-b"].plan;
    expect(conPlan("{plan:lista.decision}", b, "es", "demo-b")).toBe(
      "instrucción escondida, similitud desde U1, el investigador concluye «misma persona», riesgo desde U2, inconsistencias sobre U3 y propuesta de rechazar",
    );
    // Leído con el vocabulario del A, el plan B detiene el build nombrando la regla que no conoce.
    expect(() => conPlan("{plan:lista.decision}", b, "es", "demo-a")).toThrow(
      /carga_detectada/,
    );
  });

  it.each(["demo-a", "demo-b"] as const)(
    "ninguna vista del %s sale con una plantilla sin resolver",
    (demo) => {
      const x = ds[demo];
      for (const i of ["es", "en"] as const) {
        expect(JSON.stringify(vistaAgente(x, i))).not.toContain("{plan:");
        expect(JSON.stringify(vistaPlan(x, i))).not.toContain("{plan:");
        for (const id of idsDeCasos(x))
          expect(JSON.stringify(vistaCaso(x, id, i)), id).not.toContain(
            "{plan:",
          );
      }
    },
  );
});

describe("3 · los mapas editoriales citan criterios que existen y miden lo que dicen", () => {
  const criterio = (id: string) =>
    d.plan.criterios_aceptacion.find((c) => c.id === id);

  /** Los mapas editoriales de P3 de cada demo, que se leen contra su plan. */
  const MAPAS = {
    "demo-a": {
      enLaCorrida: CRITERIOS_EN_LA_CORRIDA,
      porNodo: PLAN_POR_NODO,
      nunca: CRITERIOS_NUNCA as readonly string[],
      refsNunca: FICHA.nunca.items.map((x) => x.refs.es),
    },
    "demo-b": {
      enLaCorrida: CRITERIOS_EN_LA_CORRIDA_B,
      porNodo: PLAN_POR_NODO_B,
      nunca: CRITERIOS_NUNCA_B as readonly string[],
      refsNunca: FICHA_B.nunca.map((x) => x.refs.es),
    },
  };

  it.each(["demo-a", "demo-b"] as const)(
    "%s: «En la corrida» de cada nodo cuenta criterios del plan que ese nodo toca",
    (demo) => {
      const m = MAPAS[demo];
      const plan = ds[demo].plan;
      for (const [nodo, ids] of Object.entries(m.enLaCorrida)) {
        expect(m.porNodo[nodo], nodo).toBeDefined();
        for (const id of ids) {
          expect(
            plan.criterios_aceptacion.find((c) => c.id === id),
            `${nodo}: ${id}`,
          ).toBeDefined();
          expect(m.porNodo[nodo]!.criterios, `${nodo}: ${id}`).toContain(id);
        }
      }
    },
  );

  it.each(["demo-a", "demo-b"] as const)(
    "%s: la lectura del plan por nodo cubre el contrato y todo el plan, y cada id existe",
    (demo) => {
      const m = MAPAS[demo];
      const plan = ds[demo].plan;
      expect(Object.keys(m.porNodo).sort()).toEqual(
        plan.contrato_de_grafo.nodos_esperados.map((n) => n.id).sort(),
      );
      const citados = new Set(
        Object.values(m.porNodo).flatMap((x) => [
          ...x.decisiones,
          ...x.riesgos,
          ...x.supuestos,
          ...x.criterios,
          ...x.umbrales,
          ...(x.senal ?? []),
        ]),
      );
      const delPlan = [
        ...plan.decisiones,
        ...plan.riesgos,
        ...plan.supuestos,
        ...plan.criterios_aceptacion,
        ...plan.umbrales,
      ].map((x) => x.id);
      expect([...citados].filter((x) => !delPlan.includes(x))).toEqual([]);
      expect(delPlan.filter((x) => !citados.has(x))).toEqual([]);
    },
  );

  it.each(["demo-a", "demo-b"] as const)(
    "%s: las garantías «Nunca» se apoyan en criterios absolutos que la ficha cita",
    (demo) => {
      const m = MAPAS[demo];
      const refs = m.refsNunca.join(" · ");
      for (const id of m.nunca) {
        expect(
          ds[demo].plan.criterios_aceptacion.find((c) => c.id === id)?.tipo,
          id,
        ).toBe("absoluto");
        expect(refs, id).toMatch(new RegExp(`\\b${id}\\b`));
      }
    },
  );

  it("las anclas de la ficha y del informe miden lo que su texto dice", () => {
    // La ficha técnica (src/lib/fichas/armar.ts) rotula C1 «ninguna negación sin persona», C5 la exactitud con
    // pass^k y C7 la latencia mediana.
    expect(criterio("C1")?.regla_de_medicion.agregacion).toBe("todos_cumplen");
    expect(criterio("C5")?.regla_de_medicion.agregacion).toBe("pass^k");
    expect(criterio("C7")?.tipo).toBe("latencia");
    // LECTURA_NOTA.C7 dice «la regla mira la mediana»; PASO_FUERA.C3 habla de los casos de alto costo.
    expect(Object.keys(LECTURA_NOTA["demo-a"]).sort()).toEqual(["C3", "C7"]);
    expect(criterio("C7")?.regla_de_medicion.agregacion).toBe("mediana");
    expect(Object.keys(PASO_FUERA["demo-a"])).toEqual(["C3"]);
    expect(String(criterio("C3")?.regla_de_medicion.poblacion)).toMatch(
      /costo_estimado/,
    );
  });
});

describe("4 · lo que la copia dice de la corrida de 200 es cierto (AU-S2-5)", () => {
  const RUTA = "runs/demo-a/suscripcion-planlang-a-001-200-v1.4";

  it("los textos que la citan dicen lo que la corrida y el manifiesto sostienen", () => {
    const citan = ls.filter((l) => /corrida de 200|200-case run/.test(l.texto));
    expect(citan.length).toBeGreaterThanOrEqual(6);
    for (const l of citan) {
      // Ninguna la anuncia en futuro: la corrida existe.
      expect(l.texto, `${l.archivo}:${l.linea}`).not.toMatch(
        /tomará forma|will take shape|antes del lote|before the 200/,
      );
      expect(l.texto, `${l.archivo}:${l.linea}`).toMatch(/v1\.4/);
    }
    const corrida = JSON.parse(
      readFileSync(join(RUTA, "corrida.json"), "utf8"),
    ) as { plan: { archivo: string }; trazas: unknown[] };
    expect(corrida.trazas).toHaveLength(200);
    expect(corrida.plan.archivo).toBe("plans/demo-a/v1.4.json");
    // «confirmó S1»
    const inf = JSON.parse(
      readFileSync(join(RUTA, "informe.json"), "utf8"),
    ) as { supuestos: Array<{ id: string; estado: string }> };
    expect(inf.supuestos.find((s) => s.id === "S1")?.estado).toBe("confirmado");
    // «entra a la vitrina en el sprint 3»: la vitrina publica otra corrida.
    expect(d.manifiesto.corrida.ruta).not.toBe(RUTA);
  });
});

describe("5 · los conteos que la copia escribe en palabras son los del dato (C-10)", () => {
  it("«siete pantallas»: las pantallas de la vitrina", () => {
    const papel = APP.stack.find((x) =>
      x.nombre.es.startsWith("Next.js"),
    )!.papel;
    const n = NUMERO_EN_PALABRAS[PANTALLAS.length]!;
    expect(papel.es).toContain(`${n.es} pantallas`);
    expect(papel.en).toContain(`${n.en} screens`);
  });

  it("«las 9 secciones»: las secciones del informe que la página numera", () => {
    const n = Object.keys(SECCIONES).length;
    const citados = [
      ...JSON.stringify(TEXTOS_BRECHA).matchAll(
        /(?:las|the|report’s) (\d+) (?:secciones|sections)/gi,
      ),
    ].map((m) => Number(m[1]));
    expect(citados.length).toBeGreaterThan(0);
    for (const c of citados) expect(c).toBe(n);
  });

  it("«los tres criterios más relevantes»: los que el informe destaca", () => {
    const w =
      NUMERO_EN_PALABRAS[d.informe.resumen.criterios_destacados.length]!;
    expect(RESUMEN.destacados.es).toContain(`Los ${w.es} criterios`);
    expect(RESUMEN.destacados.en).toContain(`The ${w.en} most relevant`);
  });
});
