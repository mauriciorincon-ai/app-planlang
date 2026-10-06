/**
 * P7 Fichas: la vista ordena para leer las mismas fichas que escribe `pnpm fichas`. La ficha de reproducibilidad es
 * la de la sección 9 de Brecha más el entorno; cada ficha de la vitrina dice lo que pinta hoja-de-vida (estado, chips,
 * hitos con su traducción, la unidad que la etiqueta no dice); el proceso del agente se reparte por carril sin perder
 * un paso; y la tabla del experto mide cada campo contra el esquema fijado y dice «No cabe» cuando no cabe. La ficha
 * de la app es la misma en las páginas de los dos demos; la del agente y la de reproducibilidad son las del demo.
 */
import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { hermanas } from "../../../scripts/_corridas";
import { tb } from "@core/formatos/bilingue";
import { hechosDelRepo, type HechosDelRepo } from "@/lib/datos/repo";
import {
  datosDeLosDemos,
  type DatosDeLosDemos,
  type DatosDemo,
} from "@/lib/datos/vitrina";
import { fichaAgente } from "@/lib/fichas/armar";
import { vistaBrecha } from "@/lib/vista/brecha";
import {
  pasosDeRepro,
  vistaFichas,
  type VistaFichas,
} from "@/lib/vista/fichas";
import { AGENTE } from "@/textos/fichas";

let ds: DatosDeLosDemos;
let d: DatosDemo;
let repo: HechosDelRepo;
let es: VistaFichas;
let en: VistaFichas;
let esB: VistaFichas;
beforeAll(async () => {
  ds = await datosDeLosDemos();
  d = ds["demo-a"];
  repo = hechosDelRepo();
  es = vistaFichas(ds, "demo-a", repo, "es");
  en = vistaFichas(ds, "demo-a", repo, "en");
  esB = vistaFichas(ds, "demo-b", repo, "es");
});

describe("la ficha de reproducibilidad", () => {
  it("es la de la sección 9 de Brecha, con el entorno de la corrida y dos rótulos propios", () => {
    const brecha = vistaBrecha(d, "es").ficha.filas;
    const fichas = es.repro.filas;
    expect(brecha.map((f) => f.k)).not.toContain("Entorno");
    const entorno = fichas.find((f) => f.k === "Entorno")!;
    expect(entorno.v).toContain("Python 3.12.14");
    expect(entorno.v).toContain("langgraph 1.2.12");
    expect(entorno.v).toContain("Claude Code 2.1.282");
    // Los demás valores, idénticos: una sola fuente para las dos pantallas.
    expect(fichas.filter((f) => f.k !== "Entorno").map((f) => f.v)).toEqual(
      brecha.map((f) => f.v),
    );
    expect(fichas.map((f) => f.k)).toContain("Grafo compilado");
    expect(fichas.at(-1)!.k).toBe("Huella del informe");
    expect(brecha.at(-1)!.k).toBe("Huella de este informe");
  });

  it("los pasos para repetirla, con los archivos de su manifiesto, en los dos idiomas", () => {
    expect(es.repro.pasos.map((p) => p.comando)).toEqual([
      "pnpm plan:validar --verificar plans/demo-a/v1.5.1.json",
      "pnpm casos:generar --versionados",
      // El plan y los casos con que corrió la corrida publicada (no los de omisión del comando).
      "pnpm lote:demo --plan plans/demo-a/v1.5.json --casos data/casos/demo-a/planlang-a-002-200.json",
      "pnpm trazas:verificar",
      "pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-002-200-v1.5 --plan plans/demo-a/v1.5.1.json --salida data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5 --verificar",
    ]);
    expect(es.repro.pasos[2]!.texto).toContain(
      "el mismo comando 10 veces, de a 20 y espaciadas, hasta completar los 200 casos",
    );
    // La línea base del B no sigue la convención (`-base` es la primera, descartada): se nombra.
    expect(esB.repro.pasos.map((p) => p.comando)).toEqual([
      "pnpm plan:validar --verificar plans/demo-b/v1.1.json",
      "pnpm casos:generar --versionados --demo b",
      "pnpm lote:demo-b --plan plans/demo-b/v1.json --casos data/casos/demo-b/planlang-b-001-20.json",
      "pnpm trazas:verificar",
      "pnpm brecha:informe --corrida runs/demo-b/suscripcion-planlang-b-001-20 --plan plans/demo-b/v1.1.json --base runs/demo-b/suscripcion-planlang-b-001-20-base-v2 --salida data/vitrina/demo-b/suscripcion-planlang-b-001-20 --verificar",
    ]);
    expect(en.repro.pasos[4]!.texto).toBe(
      "redoes the report and compares it with the published one: it comes out identical byte for byte",
    );
  });

  it.each(["demo-a", "demo-b"] as const)(
    "%s: cada comando existe, cada archivo existe y el informe se rehace con las corridas que midió",
    (demo) => {
      const scripts = (
        JSON.parse(readFileSync("package.json", "utf8")) as {
          scripts: Record<string, string>;
        }
      ).scripts;
      const pasos = pasosDeRepro(ds[demo], "es");
      for (const { comando } of pasos) {
        const [pnpm, script, ...args] = comando.split(" ");
        expect(pnpm).toBe("pnpm");
        expect(scripts, comando).toHaveProperty(script!);
        for (const a of args.filter((x) => /^(plans|runs|data)\//.test(x)))
          expect(existsSync(a), a).toBe(true);
      }
      // `brecha:informe` toma por convención `<corrida>-base` y `<corrida>-rN`: con los argumentos del paso,
      // la línea base y las repeticiones son las que declara el manifiesto.
      const args = pasos.at(-1)!.comando.split(" ");
      const arg = (k: string) => {
        const n = args.indexOf(k);
        return n < 0 ? undefined : args[n + 1];
      };
      const m = ds[demo].manifiesto;
      const h = hermanas(arg("--corrida")!);
      const base = args.includes("--sin-base")
        ? null
        : (arg("--base") ?? h.base);
      const reps = arg("--repeticiones")?.split(",") ?? h.repeticiones;
      expect(base).toBe(m.linea_base?.ruta ?? null);
      expect(reps).toEqual(m.repeticiones.map((r) => r.ruta));
    },
  );
});

describe("lo que entrega P7", () => {
  it("la ficha de la app es la misma en las páginas de los dos demos; la del agente es la del demo", () => {
    expect(esB.app).toEqual(es.app);
    expect(esB.agente.marco.nombre).not.toBe(es.agente.marco.nombre);
    expect(esB.textos).toEqual({
      antetitulo: "Demo B · lo que viaja a la vitrina personal",
      cuadro: "Ficha de reproducibilidad · demo B",
      seccionApp: "La ficha de la app",
      seccionAgente: "La ficha del agente B",
    });
    expect(esB.mirada.entrega[2]).toEqual({
      titulo: "planlang-demo-b.ficha-tecnica.json",
      detalle: "la ficha del agente B, para el frente Agentes",
    });
    expect(esB.agente.tabla.entrega).toBe(
      "content/agentes/planlang-demo-b.ficha-tecnica.json",
    );
    expect(esB.agente.tabla.problemas).toEqual([]);
  });

  it("el export y la ficha del agente viajan; la de reproducibilidad se queda", () => {
    expect(es.mirada.entrega.map((x) => x.titulo)).toEqual([
      "La ficha de reproducibilidad",
      "brochure-export.json",
      "planlang-demo-a.ficha-tecnica.json",
      "Ningún enlace",
    ]);
    expect(es.app.tabla.entrega).toBe("docs/brochure-export.json");
    expect(es.agente.tabla.entrega).toBe(
      "content/agentes/planlang-demo-a.ficha-tecnica.json",
    );
  });
});

describe("cada ficha, como la pinta hoja-de-vida", () => {
  it("la de la app: estado, ciclo, sprints, versión y fecha; sin proceso, las secciones se renumeran", () => {
    expect(es.app.chips).toEqual([
      "Sin sellar",
      "H1",
      `${repo.sprintsCerrados} sprint${repo.sprintsCerrados === 1 ? "" : "s"}`,
      `v${repo.version}`,
      "Datos del 2026-10-05",
    ]);
    expect(es.app.proceso).toBeNull();
    expect(es.app.num).toEqual({
      paraQuien: "01",
      proceso: null,
      tiene: "02",
      limites: "03",
      donde: "04",
    });
    expect(es.app.tieneSub).toBe("6 grupos · 19 funcionalidades.");
    expect(es.app.hitos.map((h) => h.etiqueta)).toEqual([
      "ciclo",
      "sprints cerrados",
      "construcción cerrada",
      "versión del repo",
      "decisiones registradas",
    ]);
    expect(en.app.hitos.map((h) => h.etiqueta)).toContain("recorded decisions");
  });

  it("las cifras con coma o punto según el idioma, y la unidad solo si la etiqueta no la dice", () => {
    const cifra = (v: VistaFichas, f: "app" | "agente", k: string) =>
      v[f].cifras.find((c) => c.clave === k)!;
    expect(cifra(es, "app", "costo_de_una_corrida")).toMatchObject({
      valor: "5,214",
      unidad: "US$",
      fuenteTexto: "calculada",
    });
    expect(cifra(en, "app", "costo_de_una_corrida").valor).toBe("5.214");
    expect(cifra(en, "app", "costo_de_una_corrida").fuenteTexto).toBe(
      "computed",
    );
    // «criterios» ya está en la etiqueta: no se repite.
    expect(cifra(es, "app", "criterios_cumplidos").unidad).toBeNull();
    expect(cifra(es, "agente", "costo_por_caso").valor).toBe("0,025");
    expect(cifra(es, "agente", "latencia_mediana")).toMatchObject({
      valor: "8,1",
      unidad: "segundos",
    });
    expect(cifra(en, "agente", "latencia_mediana")).toMatchObject({
      valor: "8.1",
      unidad: "seconds",
    });
  });

  it("la del agente: el proceso por carril, numerado en su orden, sin perder un paso", () => {
    const p = es.agente.proceso!;
    expect(p.carriles.map((c) => c.nombre)).toEqual([
      "Médico",
      "El agente",
      "Auditor",
      "Afiliado",
    ]);
    const ficha = fichaAgente(d, repo, "es");
    const numeros = p.carriles.flatMap((c) => c.pasos.map((x) => x.n));
    expect([...numeros].sort((a, b) => a - b)).toEqual(
      ficha.proceso!.pasos.map((_, k) => k + 1),
    );
    // El fin no trae texto en la ficha: se nombra; las decisiones conservan su tipo.
    const afiliado = p.carriles.find((c) => c.id === "afiliado")!.pasos;
    expect(afiliado.at(-1)).toEqual({ n: 15, texto: "fin", tipo: "fin" });
    expect(
      p.carriles
        .flatMap((c) => c.pasos)
        .filter((x) => x.tipo === "decision")
        .map((x) => x.texto),
    ).toEqual(["¿Urgente o exento?", "¿Falta algo?", "¿Escala?"]);
    // Cada anotación apunta a un paso que existe.
    for (const a of p.anotaciones) expect(numeros).toContain(a.n);
    expect(es.agente.num).toMatchObject({ proceso: "02", donde: "05" });
    expect(es.agente.tieneSub).toBe("8 grupos.");
    expect(es.agente.bloques.every((b) => b.cuenta === null)).toBe(true);
  });
});

describe("la comprobación de cada campo", () => {
  it("las dos fichas caben en el contrato, en los dos idiomas", () => {
    for (const v of [es, en])
      for (const f of [v.app, v.agente]) {
        expect(f.tabla.problemas).toEqual([]);
        expect(f.tabla.filas.filter((x) => !x.cabe)).toEqual([]);
      }
    expect(es.agente.tabla.filas.map((x) => x.campo)).toEqual([
      "tagline (es · en)",
      "titular (es · en)",
      "para_quien (es · en)",
      "intro (es · en)",
      "stack[]",
      "cifras[] · fuente",
      "bloques[]",
      "limites[] · nunca[]",
      "hitos[]",
      "proceso.pasos[].texto",
      "proceso.carriles[]",
      "enlaces",
    ]);
    expect(es.app.tabla.filas.map((x) => x.campo)).not.toContain(
      "proceso.carriles[]",
    );
    const lema = es.agente.tabla.filas[0]!;
    expect(lema.limite).toBe("≤ 80");
    expect(es.agente.tabla.filas[4]!.limite).toBe("1–8");
  });

  it("un lema de 81 caracteres en inglés no cabe, y la ficha dice por qué (demo en rojo)", () => {
    const original = AGENTE.tagline;
    try {
      AGENTE.tagline = tb(original.es, "x".repeat(81));
      const v = vistaFichas(ds, "demo-a", repo, "es");
      const lema = v.agente.tabla.filas[0]!;
      expect(lema).toMatchObject({
        medida: `${original.es.length} · 81`,
        cabe: false,
      });
      expect(v.agente.tabla.problemas.join(" ")).toMatch(
        /^en \/promesa\/tagline/,
      );
    } finally {
      AGENTE.tagline = original;
    }
  });
});
