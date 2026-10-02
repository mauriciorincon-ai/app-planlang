/**
 * Gate «diagrama = grafo» sobre lo PUBLICADO: el SVG que lleva `out/<idioma>/agente.html` dibuja exactamente el
 * grafo compilado de la corrida que declara el manifiesto frente al contrato del plan. `core/visor/igualdad.ts`
 * prueba el mapa; esto prueba que la página construida lleva ese dibujo y no otro (un build viejo, un filtro en la
 * vista, un SVG cambiado a mano). Biyección de nodos (los del contrato ausentes del grafo, con la marca «exigido»),
 * una línea por cada arista de LangGraph y un flujo por cada regla y rama por defecto.
 *
 * Uso (después de `pnpm build`): `pnpm diagrama:verificar [carpeta]` (por omisión `out/`; el paquete para
 * hoja-de-vida lo corre sobre su propio export). Sale con 1 y nombra cada falla.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { idDeMapa } from "../core/visor/ids";

export interface GrafoPublicable {
  nodos: ReadonlyArray<{ id: string }>;
  aristas: ReadonlyArray<{ source: string; target: string }>;
  aristas_condicionales: ReadonlyArray<{
    desde: string;
    orden: number;
    si_verdadero: string;
  }>;
  ramas_por_defecto: Readonly<Record<string, string>>;
}

export interface ContratoPublicable {
  nodos_esperados: ReadonlyArray<{ id: string }>;
  aristas_condicionales: ReadonlyArray<{
    desde: string;
    orden: number;
    si_verdadero: string;
  }>;
}

const TERMINAL: Readonly<Record<string, string>> = {
  __start__: "inicio",
  __end__: "fin",
};
const id = (x: string) => TERMINAL[x] ?? idDeMapa(x);

/** Lo que dice el SVG: nodos (con su marca), líneas y los flujos de cada línea. */
export function leerSvg(svg: string) {
  const ns = /data-visor="([^"]+)"/.exec(svg)?.[1];
  if (!ns) throw new Error("diagrama=grafo: el SVG no dice de qué visor es");
  const nodos = new Map<string, boolean>();
  for (const m of svg.matchAll(/<g class="d-nodo"([^>]*)>/g)) {
    const nodo = /data-nodo-id="([^"]+)"/.exec(m[1]!)?.[1];
    if (nodo) nodos.set(nodo, /data-madurez="exigido"/.test(m[1]!));
  }
  const lineas = new Set<string>();
  const flujos = new Set<string>();
  for (const m of svg.matchAll(/<g class="d-flujo"([^>]*)>/g)) {
    const l = new RegExp(`id="${ns}-l-([^"]+)"`).exec(m[1]!)?.[1];
    if (l) lineas.add(l);
    for (const f of /data-flujos="([^"]*)"/.exec(m[1]!)?.[1]?.split(" ") ?? [])
      if (f) flujos.add(f);
  }
  return { ns, nodos, lineas, flujos };
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
  for (const a of grafo.aristas) {
    const par = `${id(a.source)}-a-${id(a.target)}`;
    if (!lineas.has(par) && !lineas.has(`${par}-defecto`))
      fallas.push(`arista del grafo sin línea: ${a.source} → ${a.target}`);
  }
  for (const r of contrato.aristas_condicionales) {
    const f = `${id(r.desde)}-a-${id(r.si_verdadero)}-r${r.orden}`;
    if (!flujos.has(f))
      fallas.push(`regla del plan sin su flujo: ${r.desde}#${r.orden}`);
  }
  for (const [o, d] of Object.entries(grafo.ramas_por_defecto))
    if (!flujos.has(`${id(o)}-a-${id(d)}-defecto`))
      fallas.push(`rama por defecto sin su flujo: ${o} → ${d}`);
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
  for (const [demo, m] of Object.entries(manifiesto.demos)) {
    const g = leer(join(m.corrida.ruta, "grafo.json")) as GrafoPublicable & {
      langgraph: { edges: GrafoPublicable["aristas"] };
    };
    const grafo = { ...g, aristas: g.langgraph.edges };
    const contrato = (
      leer(m.plan.archivo) as { contrato_de_grafo: ContratoPublicable }
    ).contrato_de_grafo;
    for (const idioma of ["es", "en"]) {
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
      if (f.length) {
        fallas += f.length;
        for (const x of f) console.error(`✗ ${demo}/${idioma}: ${x}`);
      } else
        console.log(
          `✓ ${demo}/${idioma}: el lienzo publicado dibuja los ${grafo.nodos.length} nodos, las ${grafo.aristas.length} aristas y las ${contrato.aristas_condicionales.length} reglas`,
        );
    }
  }
  return fallas ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exit(principal(process.argv[2]));
