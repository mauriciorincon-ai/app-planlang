/**
 * `pnpm paquete:vitrina` — el paquete de la vitrina para hoja-de-vida (ADR-009, regla dura 14: viaja por copia, en un
 * PR de contenido, sin un solo enlace). En orden, y cada paso detiene todo si falla:
 *  1. **Gate de publicación:** el instrumento (M9) detecta lo sembrado; las corridas versionadas pasan sus huellas,
 *     umbrales y RF-09.2; las fichas están al día; el playground reproduce el informe (paridad).
 *  2. **Build del paquete** (`PLANLANG_PAQUETE=1`, sin DSN de Sentry): base `/piezas/planlang`, enlaces `.html`, su
 *     propia carpeta (`.next-paquete/`), id de build fijo. Y el diagrama = grafo sobre ese export.
 *  3. **Copia** a `dist/paquete-hoja-de-vida/`, con el árbol de hoja-de-vida: `public/piezas/planlang/` (la vitrina,
 *     sin las cargas RSC), `content/agentes/` (la ficha del agente A), `content/vitrina/` (el export de la app) y
 *     `data/fichas/planlang.yaml` (el complemento que planlang propone).
 *  4. **Barridos** (`scripts/paquete/barridos.ts`): toda dirección bajo la base y con archivo, enlaces con `.html`,
 *     nada externo, sin localhost, Sentry, dominios de despliegue ni maqueta, y el rótulo en cada página.
 *  5. **Manifiesto** (`dist/paquete-hoja-de-vida/manifiesto.json`): cada archivo con su SHA-256 y la huella del todo.
 * Sale con 1 y nombra la falla. Uso: `pnpm paquete:vitrina`.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { stringify } from "yaml";
import { conHuella, jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import {
  BASE,
  barrerCss,
  barrerHtml,
  barrerLista,
  barrerTexto,
  type Archivo,
} from "./paquete/barridos";

const RAIZ = process.cwd();
const BUILD = join(RAIZ, ".next-paquete");
const DESTINO = join(RAIZ, "dist", "paquete-hoja-de-vida");
const VITRINA = join(DESTINO, "public", ...BASE.split("/").filter(Boolean));

function paso(titulo: string) {
  console.log(`\n▸ ${titulo}`);
}

function correr(
  titulo: string,
  comando: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
) {
  const r = spawnSync(comando, args, { stdio: "inherit", env, cwd: RAIZ });
  if (r.status !== 0) {
    console.error(
      `\n✗ paquete-vitrina: falló «${titulo}» (${comando} ${args.join(" ")}). No se arma el paquete.`,
    );
    process.exit(1);
  }
  console.log(`✓ ${titulo}`);
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const r = join(dir, f);
    return statSync(r).isDirectory() ? archivos(r) : [r];
  });
}

const sha = (ruta: string) =>
  createHash("sha256").update(readFileSync(ruta)).digest("hex");

async function main() {
  // Regla 17-bis (b): dice contra qué árbol corre. Solo lee el repositorio y solo escribe en sus dos carpetas.
  console.log(
    `paquete-vitrina: lee ${RAIZ} · compila en ${relative(RAIZ, BUILD)}/ · escribe en ${relative(RAIZ, DESTINO)}/`,
  );

  paso("1. Gate de publicación");
  correr("M9: el instrumento detecta lo sembrado", "pnpm", [
    "-s",
    "m9:reporte",
    "--verificar",
  ]);
  correr("RF-09.2 y huellas de las corridas", "pnpm", [
    "-s",
    "trazas:verificar",
  ]);
  correr("las fichas están al día", "pnpm", ["-s", "fichas", "--verificar"]);
  correr("paridad playground ↔ informe", "pnpm", [
    "-s",
    "exec",
    "vitest",
    "run",
    "tests/unit/core/playground/paridad.test.ts",
    "--project",
    "core",
  ]);

  paso("2. Build del paquete");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PLANLANG_PAQUETE: "1",
    NEXT_PUBLIC_SENTRY_DSN: "",
  };
  for (const k of Object.keys(env))
    if (/^SENTRY_|^NEXT_PUBLIC_VERCEL/.test(k)) delete env[k];
  rmSync(BUILD, { recursive: true, force: true });
  correr(
    "next build con PLANLANG_PAQUETE=1",
    "pnpm",
    ["-s", "exec", "next", "build"],
    env,
  );
  correr("diagrama = grafo sobre el export del paquete", "pnpm", [
    "-s",
    "diagrama:verificar",
    ".next-paquete",
  ]);

  paso("3. Copia al árbol de hoja-de-vida");
  rmSync(DESTINO, { recursive: true, force: true });
  mkdirSync(VITRINA, { recursive: true });
  const rsc = (r: string) => r.endsWith(".txt") && !r.startsWith("licencias/");
  let omitidos = 0;
  for (const f of archivos(BUILD)) {
    const r = relative(BUILD, f);
    if (rsc(r)) {
      omitidos++;
      continue;
    }
    mkdirSync(dirname(join(VITRINA, r)), { recursive: true });
    cpSync(f, join(VITRINA, r));
  }
  const copiar = (de: string, a: string) => {
    mkdirSync(dirname(join(DESTINO, a)), { recursive: true });
    cpSync(join(RAIZ, de), join(DESTINO, a));
  };
  copiar(
    "content/agentes/planlang-demo-a.ficha-tecnica.json",
    "content/agentes/planlang-demo-a.ficha-tecnica.json",
  );
  copiar(
    "docs/brochure-export.json",
    "content/vitrina/planlang.brochure-export.json",
  );
  const complemento = JSON.parse(
    readFileSync(
      join(RAIZ, "docs/fichas/planlang.complemento-propuesto.json"),
      "utf8",
    ),
  );
  mkdirSync(join(DESTINO, "data", "fichas"), { recursive: true });
  writeFileSync(
    join(DESTINO, "data", "fichas", "planlang.yaml"),
    `# Complemento de la ficha técnica de planlang, propuesto por la app (procedencia: app).\n# Lo genera \`pnpm fichas\` en planlang (docs/fichas/planlang.complemento-propuesto.json); no se edita aquí.\n${stringify(complemento, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE", defaultKeyType: "PLAIN" })}`,
    { flag: "w" },
  );
  console.log(
    `✓ ${archivos(VITRINA).length} archivos de la vitrina (${omitidos} cargas RSC fuera) y las fichas`,
  );

  paso("4. Barridos");
  const rutas = archivos(VITRINA).map((f) => relative(VITRINA, f));
  const presentes = new Set(rutas);
  const leer = (r: string): Archivo => ({
    ruta: r,
    texto: readFileSync(join(VITRINA, r), "utf8"),
  });
  const fallas = [...barrerLista(rutas)];
  for (const r of rutas) {
    if (!/\.(html|css|js|json|svg|txt)$/.test(r)) continue;
    const a = leer(r);
    fallas.push(...barrerTexto(a));
    if (r.endsWith(".html"))
      fallas.push(...barrerHtml(a, (x) => presentes.has(x)));
    if (r.endsWith(".css")) fallas.push(...barrerCss(a));
  }
  for (const r of archivos(DESTINO)
    .map((f) => relative(DESTINO, f))
    .filter((r) => !r.startsWith("public/")))
    fallas.push(
      ...barrerTexto({
        ruta: r,
        texto: readFileSync(join(DESTINO, r), "utf8"),
      }),
    );
  if (fallas.length) {
    for (const f of fallas) console.error(`✗ ${f}`);
    console.error(
      `\n✗ paquete-vitrina: ${fallas.length} falla(s) en los barridos. El paquete no se entrega.`,
    );
    process.exit(1);
  }
  console.log(
    `✓ ${rutas.filter((r) => r.endsWith(".html")).length} páginas y ${rutas.length} archivos barridos: nada fuera de ${BASE}`,
  );

  paso("5. Manifiesto");
  const todos = archivos(DESTINO)
    .map((f) => relative(DESTINO, f))
    .filter((r) => r !== "manifiesto.json")
    .sort();
  const commit = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout.trim();
  const limpio =
    spawnSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
    }).stdout.trim() === "";
  const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")) as {
    version: string;
  };
  const vitrina = JSON.parse(
    readFileSync(join(RAIZ, "data/vitrina/manifiesto.json"), "utf8"),
  ) as {
    demos: Record<string, { corrida: { ruta: string } }>;
  };
  const manifiesto = await conHuella({
    formato: "planlang-paquete/v1",
    app: "planlang",
    version: pkg.version,
    base: BASE,
    commit,
    arbol_limpio: limpio,
    corridas: Object.values(vitrina.demos).map((d) => d.corrida.ruta),
    copiar_a_hoja_de_vida: {
      "public/piezas/planlang/": "la vitrina (export estático, enlaces .html)",
      "content/agentes/planlang-demo-a.ficha-tecnica.json":
        "la ficha del agente A (contrato ficha técnica 1.3.1)",
      "content/vitrina/planlang.brochure-export.json":
        "los hechos de la app (contrato brochure-export 1.0.0)",
      "data/fichas/planlang.yaml":
        "el complemento que planlang propone para su ficha (procedencia: app)",
    },
    n_archivos: todos.length,
    bytes: todos.reduce((s, r) => s + statSync(join(DESTINO, r)).size, 0),
    archivos: Object.fromEntries(todos.map((r) => [r, sha(join(DESTINO, r))])),
  } as Record<string, JsonValor>);
  writeFileSync(join(DESTINO, "manifiesto.json"), jsonBonito(manifiesto));
  console.log(
    `✓ manifiesto.json: ${todos.length} archivos, huella ${String(manifiesto.huella).slice(0, 12)}…${limpio ? "" : " (árbol con cambios sin commit)"}`,
  );
  if (!existsSync(join(VITRINA, "index.html"))) process.exit(1);
  console.log(`\npaquete-vitrina: verde → ${relative(RAIZ, DESTINO)}/`);
}

void main();
