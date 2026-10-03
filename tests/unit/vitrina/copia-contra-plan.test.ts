// @vitest-environment node
/**
 * AU-S2-3: la copia de la vitrina no afirma nada del plan que el plan no tenga. Tres gates:
 *
 * 1. todo id de plan (`U`, `C`, `R`, `S`, `D` + número) que aparece en un texto de `src/textos/*.ts` existe en el
 *    plan publicado, en su sección (los sprints se escriben «sprint N», nunca «S2»);
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
import { LECTURA_NOTA, PASO_FUERA } from "@/textos/brecha";

const DIR = "src/textos";

interface Literal {
  archivo: string;
  linea: number;
  texto: string;
}

/** Los literales de texto de un archivo (cadenas y trozos de plantilla), con su línea. */
export function literales(archivo: string, fuente: string): Literal[] {
  const sf = ts.createSourceFile(archivo, fuente, ts.ScriptTarget.Latest, true);
  const out: Literal[] = [];
  const visitar = (n: ts.Node) => {
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
      });
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return out;
}

function todosLosLiterales(): Literal[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort()
    .flatMap((f) =>
      literales(join(DIR, f), readFileSync(join(DIR, f), "utf8")),
    );
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
let ls: Literal[];
beforeAll(async () => {
  d = await datosDemo();
  ls = todosLosLiterales();
}, 60_000);

describe("1 · los ids que cita la copia existen en el plan", () => {
  it("se leen literales de todos los diccionarios", () => {
    expect(ls.length).toBeGreaterThan(1000);
    expect(new Set(ls.map((l) => l.archivo)).size).toBeGreaterThanOrEqual(10);
  });

  it("ningún texto cita un umbral, criterio, riesgo, supuesto o decisión que el plan no tenga", () => {
    expect(idsSinPlan(ls, d.plan)).toEqual([]);
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
  it("cada plantilla de los diccionarios resuelve en los dos idiomas", () => {
    const conRef = ls.filter((l) => l.texto.includes("{plan:"));
    expect(conRef.length).toBeGreaterThanOrEqual(10);
    for (const l of conRef)
      for (const i of ["es", "en"] as const) {
        const r = conPlan(l.texto, d.plan, i);
        expect(r, `${l.archivo}:${l.linea}`).not.toMatch(REFERENCIA_PLAN);
      }
  });

  it("una referencia que el plan no tiene detiene el build nombrándola", () => {
    expect(() => conPlan("tras {plan:U9} preguntas", d.plan, "es")).toThrow(
      /\{plan:U9\}/,
    );
    expect(() => conPlan("{plan:reglas.inexistente}", d.plan, "en")).toThrow(
      /reglas\.inexistente/,
    );
  });

  it("los valores se leen del plan: con U3 = 3, la aclaración dice 3", () => {
    const p = structuredClone(d.plan);
    p.umbrales.find((u) => u.id === "U3")!.valor_en_plan = 3;
    expect(conPlan("tras {plan:U3} preguntas", p, "es")).toBe(
      "tras 3 preguntas",
    );
    expect(conPlan("{plan:reglas.decision|Palabra} reglas", d.plan, "es")).toBe(
      "Cinco reglas",
    );
  });

  it("ninguna vista sale con una plantilla sin resolver", () => {
    for (const i of ["es", "en"] as const) {
      expect(JSON.stringify(vistaAgente(d, i))).not.toContain("{plan:");
      expect(JSON.stringify(vistaPlan(d, i))).not.toContain("{plan:");
      for (const id of idsDeCasos(d))
        expect(JSON.stringify(vistaCaso(d, id, i)), id).not.toContain("{plan:");
    }
  });
});

describe("3 · los mapas editoriales citan criterios que existen y miden lo que dicen", () => {
  const criterio = (id: string) =>
    d.plan.criterios_aceptacion.find((c) => c.id === id);

  it("«En la corrida» de cada nodo cuenta criterios del plan que ese nodo toca", () => {
    for (const [nodo, ids] of Object.entries(CRITERIOS_EN_LA_CORRIDA)) {
      expect(PLAN_POR_NODO[nodo], nodo).toBeDefined();
      for (const id of ids) {
        expect(criterio(id), `${nodo}: ${id}`).toBeDefined();
        expect(PLAN_POR_NODO[nodo]!.criterios, `${nodo}: ${id}`).toContain(id);
      }
    }
  });

  it("las garantías «Nunca» se apoyan en criterios absolutos que la ficha cita", () => {
    const refs = FICHA.nunca.items.map((x) => x.refs.es).join(" · ");
    for (const id of CRITERIOS_NUNCA) {
      expect(criterio(id)?.tipo, id).toBe("absoluto");
      expect(refs, id).toMatch(new RegExp(`\\b${id}\\b`));
    }
  });

  it("las anclas de la ficha y del informe miden lo que su texto dice", () => {
    // La ficha técnica (src/lib/fichas/armar.ts) rotula C1 «ninguna negación sin persona», C5 la exactitud con
    // pass^k y C7 la latencia mediana.
    expect(criterio("C1")?.regla_de_medicion.agregacion).toBe("todos_cumplen");
    expect(criterio("C5")?.regla_de_medicion.agregacion).toBe("pass^k");
    expect(criterio("C7")?.tipo).toBe("latencia");
    // LECTURA_NOTA.C7 dice «la regla mira la mediana»; PASO_FUERA.C3 habla de los casos de alto costo.
    expect(Object.keys(LECTURA_NOTA).sort()).toEqual(["C3", "C7"]);
    expect(criterio("C7")?.regla_de_medicion.agregacion).toBe("mediana");
    expect(Object.keys(PASO_FUERA)).toEqual(["C3"]);
    expect(String(criterio("C3")?.regla_de_medicion.poblacion)).toMatch(
      /costo_estimado/,
    );
  });
});
