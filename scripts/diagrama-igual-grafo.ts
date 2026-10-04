/**
 * Gate «diagrama = grafo» sobre lo PUBLICADO: el SVG que lleva `out/<idioma>/agente.html` dibuja exactamente el
 * grafo compilado de la corrida que declara el manifiesto frente al contrato del plan. `core/visor/igualdad.ts`
 * prueba el mapa; esto prueba que la página construida lleva ese dibujo y no otro (un build viejo, un filtro en la
 * vista, un SVG cambiado a mano). En los dos sentidos (AU-S2-23):
 *  - nodos: biyección (los del contrato ausentes del grafo, con la marca «exigido»);
 *  - líneas: cada arista de LangGraph tiene su línea y cada línea dibujada es una arista (por `data-origen` y
 *    `data-destino`, no por el id compuesto: AU-S2-B47);
 *  - flujos: cada regla del plan, rama por defecto y arista incondicional tiene su flujo, cada flujo dibujado es uno
 *    de ellos, y la condición publicada (`data-condiciones`) es la de la regla.
 *
 * Uso (después de `pnpm build`): `pnpm diagrama:verificar [carpeta]` (por omisión `out/`; el paquete para
 * hoja-de-vida lo corre sobre su propio export). Sale con 1 y nombra cada falla; también si no verificó ningún demo.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { IDIOMAS } from "../core/formatos/bilingue";
import type { AristaCondicional } from "../core/plan/esquema";
import { condicionEnTexto } from "../core/visor/geometria";
import { idDeMapa } from "../core/visor/ids";
import { condicionDeRegla, SENAL_POR_DEFECTO } from "../core/visor/mapa";

export interface GrafoPublicable {
  nodos: ReadonlyArray<{ id: string }>;
  aristas: ReadonlyArray<{
    source: string;
    target: string;
    conditional?: boolean;
  }>;
  ramas_por_defecto: Readonly<Record<string, string>>;
  /** Los nodos con pausa humana: su arista incondicional de salida es una reanudación. */
  pausas_humanas?: ReadonlyArray<{ nodo: string }>;
}

export interface ContratoPublicable {
  nodos_esperados: ReadonlyArray<{ id: string }>;
  aristas_condicionales: ReadonlyArray<AristaCondicional>;
}

const TERMINAL: Readonly<Record<string, string>> = {
  __start__: "inicio",
  __end__: "fin",
};
const id = (x: string) => TERMINAL[x] ?? idDeMapa(x);

interface LineaLeida {
  origen: string;
  destino: string;
  /** Flujo → condición publicada (vacía si el flujo no tiene). */
  flujos: Map<string, string>;
}

/** Lo que dice el SVG: nodos (con su marca), líneas con su origen y destino, y los flujos de cada línea. */
export function leerSvg(svg: string) {
  const ns = /data-visor="([^"]+)"/.exec(svg)?.[1];
  if (!ns) throw new Error("diagrama=grafo: el SVG no dice de qué visor es");
  const nodos = new Map<string, boolean>();
  for (const m of svg.matchAll(/<g class="d-nodo"([^>]*)>/g)) {
    const nodo = /data-nodo-id="([^"]+)"/.exec(m[1]!)?.[1];
    if (nodo) nodos.set(nodo, /data-madurez="exigido"/.test(m[1]!));
  }
  const lineas = new Map<string, LineaLeida>();
  const atributo = (a: string, k: string) =>
    new RegExp(`\\b${k}="([^"]*)"`).exec(a)?.[1];
  for (const m of svg.matchAll(/<g class="d-flujo"([^>]*)>/g)) {
    const a = m[1]!;
    const l = new RegExp(`id="${ns}-l-([^"]+)"`).exec(a)?.[1];
    if (!l) continue;
    const ids = atributo(a, "data-flujos")?.split(" ").filter(Boolean) ?? [];
    const conds = atributo(a, "data-condiciones")?.split("|") ?? [];
    lineas.set(l, {
      origen: atributo(a, "data-origen") ?? "",
      destino: atributo(a, "data-destino") ?? "",
      flujos: new Map(ids.map((f, k) => [f, desescapar(conds[k] ?? "")])),
    });
  }
  const flujos = new Map<string, string>();
  for (const l of lineas.values())
    for (const [f, c] of l.flujos) flujos.set(f, c);
  return { ns, nodos, lineas, flujos };
}

function desescapar(t: string): string {
  return t
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
}

/** Los flujos que el grafo y el plan exigen, con su condición (la misma conversión que arma el mapa). */
export function flujosEsperados(
  grafo: GrafoPublicable,
  contrato: ContratoPublicable,
): Map<string, string> {
  const out = new Map<string, string>();
  const reglasDe = (desde: string) =>
    contrato.aristas_condicionales
      .filter((a) => a.desde === desde)
      .slice()
      .sort((a, b) => a.orden - b.orden);
  for (const a of grafo.aristas) {
    if (a.source === "__start__" || a.target === "__end__") continue;
    const par = `${id(a.source)}-a-${id(a.target)}`;
    if (!a.conditional) {
      out.set(par, "");
      continue;
    }
    for (const r of reglasDe(a.source).filter(
      (r) => r.si_verdadero === a.target,
    ))
      out.set(`${par}-r${r.orden}`, condicionEnTexto(condicionDeRegla(r)));
    const porDefecto =
      grafo.ramas_por_defecto[a.source] ??
      reglasDe(a.source).find((r) => r.si_falso !== undefined)?.si_falso;
    if (porDefecto === a.target)
      out.set(
        `${par}-defecto`,
        condicionEnTexto({
          senal: SENAL_POR_DEFECTO,
          operador: "=",
          valor: true,
        }),
      );
  }
  return out;
}

/** Las fallas del SVG publicado frente al grafo y al contrato; vacío si coinciden. */
export function compararPagina(
  svg: string,
  grafo: GrafoPublicable,
  contrato: ContratoPublicable,
): string[] {
  const { nodos, lineas, flujos } = leerSvg(svg);
  const fallas: string[] = [];
  const enGrafo = new Set(grafo.nodos.map((n) => id(n.id)));
  const enPlan = new Set(contrato.nodos_esperados.map((n) => id(n.id)));
  for (const n of enGrafo) {
    if (!nodos.has(n)) fallas.push(`nodo del grafo sin dibujar: ${n}`);
    else if (nodos.get(n))
      fallas.push(`nodo del grafo marcado «exigido»: ${n}`);
  }
  for (const n of enPlan)
    if (!enGrafo.has(n)) {
      if (!nodos.has(n))
        fallas.push(`nodo exigido por el plan sin dibujar: ${n}`);
      else if (!nodos.get(n))
        fallas.push(`nodo ausente del grafo sin la marca «exigido»: ${n}`);
    }
  for (const n of nodos.keys())
    if (!enGrafo.has(n) && !enPlan.has(n))
      fallas.push(`nodo dibujado que no está en el grafo ni en el plan: ${n}`);

  // Líneas, en los dos sentidos, por su origen y su destino.
  const paresGrafo = new Map(
    grafo.aristas.map((a) => [`${id(a.source)}→${id(a.target)}`, a] as const),
  );
  const paresDibujados = new Set(
    [...lineas.values()].map((l) => `${l.origen}→${l.destino}`),
  );
  for (const [par, a] of paresGrafo)
    if (!paresDibujados.has(par))
      fallas.push(`arista del grafo sin línea: ${a.source} → ${a.target}`);
  for (const [lid, l] of lineas)
    if (!paresGrafo.has(`${l.origen}→${l.destino}`))
      fallas.push(
        `línea dibujada que no es una arista del grafo: ${lid} (${l.origen || "?"} → ${l.destino || "?"})`,
      );

  // Flujos, en los dos sentidos, con su condición.
  const esperados = flujosEsperados(grafo, contrato);
  for (const [f, c] of esperados) {
    if (!flujos.has(f)) {
      const r = /^(.+)-a-.+-r(\d+)$/.exec(f);
      fallas.push(
        r
          ? `regla del plan sin su flujo: ${r[1]!.replaceAll("-", "_")}#${r[2]}`
          : f.endsWith("-defecto")
            ? `rama por defecto sin su flujo: ${f.replace(/-defecto$/, "").replace("-a-", " → ")}`
            : `arista incondicional sin su flujo: ${f.replace("-a-", " → ")}`,
      );
    } else if (flujos.get(f) !== c)
      fallas.push(
        `condición distinta en ${f}: el dibujo dice «${flujos.get(f)}» y el plan «${c}»`,
      );
  }
  for (const f of flujos.keys())
    if (!esperados.has(f))
      fallas.push(`flujo dibujado que el grafo y el plan no tienen: ${f}`);
  return fallas;
}

/** El SVG del lienzo principal de P3 dentro de la página construida. */
export function svgDeLaPagina(html: string, ns = "agente"): string {
  const m = new RegExp(`<svg[^>]*data-visor="${ns}"[\\s\\S]*?</svg>`).exec(
    html,
  );
  if (!m)
    throw new Error(`diagrama=grafo: la página no lleva el lienzo «${ns}»`);
  return m[0];
}

export function principal(carpeta = "out"): number {
  const raiz = process.cwd();
  const leer = (r: string): unknown =>
    JSON.parse(readFileSync(join(raiz, r), "utf8"));
  const manifiesto = leer("data/vitrina/manifiesto.json") as {
    demos: Record<
      string,
      { plan: { archivo: string }; corrida: { ruta: string } }
    >;
  };
  let fallas = 0;
  let verificados = 0;
  for (const [demo, m] of Object.entries(manifiesto.demos)) {
    const g = leer(join(m.corrida.ruta, "grafo.json")) as GrafoPublicable & {
      langgraph: { edges: GrafoPublicable["aristas"] };
    };
    const grafo = { ...g, aristas: g.langgraph.edges };
    const contrato = (
      leer(m.plan.archivo) as { contrato_de_grafo: ContratoPublicable }
    ).contrato_de_grafo;
    for (const idioma of IDIOMAS) {
      const pagina = join(raiz, carpeta, idioma, "agente.html");
      if (!existsSync(pagina)) {
        console.error(
          `✗ ${demo}/${idioma}: falta ${pagina} (¿corrió pnpm build?)`,
        );
        fallas++;
        continue;
      }
      const f = compararPagina(
        svgDeLaPagina(readFileSync(pagina, "utf8")),
        grafo,
        contrato,
      );
      verificados++;
      if (f.length) {
        fallas += f.length;
        for (const x of f) console.error(`✗ ${demo}/${idioma}: ${x}`);
      } else
        console.log(
          `✓ ${demo}/${idioma}: el lienzo publicado dibuja los ${grafo.nodos.length} nodos, las ${grafo.aristas.length} aristas y las ${contrato.aristas_condicionales.length} reglas`,
        );
    }
  }
  if (verificados === 0) {
    console.error(
      "✗ diagrama=grafo: no verificó ningún demo; un gate que no compara nada no está en verde.",
    );
    return 1;
  }
  return fallas ? 1 : 0;
}

/** ¿Se corre este archivo como programa? Con la ruta real de los dos lados (espacios, enlaces): AU-S2-B55. */
export function esElPrograma(url: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    return realpathSync(fileURLToPath(url)) === realpathSync(argv1);
  } catch {
    return false;
  }
}

if (esElPrograma(import.meta.url, process.argv[1]))
  process.exit(principal(process.argv[2]));
