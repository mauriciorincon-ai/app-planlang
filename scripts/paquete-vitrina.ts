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
 *  5. **Manifiesto** (`dist/paquete-hoja-de-vida/manifiesto.json`): cada archivo con su SHA-256, las corridas que
 *     alimentan la vitrina con sus huellas, los pasos de entrega y la huella del todo; y el paquete se comprueba
 *     contra él con el mismo lector que el usuario corre sobre hoja-de-vida (`pnpm paquete:verificar`).
 * Sale con 1 y nombra la falla. Uso: `pnpm paquete:vitrina [--hoja-de-vida <ruta>] [--permitir-arbol-sucio]`.
 *  - `--hoja-de-vida <ruta>`: lee (solo lee) el `data/fichas/planlang.yaml` de ese checkout y conserva su
 *    `roadmap:`, que administra la planeadora (AU-S2-7).
 *  - `--permitir-arbol-sucio`: arma el paquete aunque haya cambios sin commit (para probar; no se entrega así).
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
import { conHuella, jsonBonito } from "../core/formatos/huella";
import type { JsonValor } from "../core/formatos/jcs";
import {
  RUTA_COMPLEMENTO,
  RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA,
  RUTA_EXPORT,
  RUTA_EXPORT_EN_HOJA_DE_VIDA,
  RUTA_FICHA_AGENTE,
} from "../src/lib/fichas/rutas";
import { argumentos } from "./_io";
import { arbolEnDisco } from "./paquete/arbol-disco";
import { fusionarComplemento } from "./paquete/complemento";
import { MARCA_PAQUETE } from "./paquete/marca";
import {
  verificarContraManifiesto,
  type ManifiestoPaquete,
} from "./paquete/verificar";
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

/** Los pasos de entrega que el manifiesto lleva consigo (AU-S2-8): lo que hace el usuario, no planlang. */
const PASOS_DE_ENTREGA = [
  "Arma el paquete desde main limpio: pnpm paquete:vitrina (sale con 1 si el árbol tiene cambios sin commit).",
  "Comprueba el rastreo del paquete: pnpm test:e2e:paquete.",
  "En hoja-de-vida, borra public/piezas/planlang/ antes de copiar: los chunks se nombran por su contenido y una copia encima deja los viejos servidos.",
  "Copia dist/paquete-hoja-de-vida/ sobre hoja-de-vida; data/fichas/planlang.yaml conserva el roadmap: si ya existía (--hoja-de-vida <ruta> lo fusiona).",
  "Comprueba la copia: pnpm paquete:verificar --en <ruta de hoja-de-vida>, y adjunta este manifiesto al PR de contenido.",
];

async function main() {
  const a = argumentos(process.argv.slice(2));
  const hojaDeVida =
    typeof a["hoja-de-vida"] === "string" ? a["hoja-de-vida"] : null;
  // Regla 17-bis (b): dice contra qué árbol corre. Solo lee el repositorio (y, si se pide, el YAML de la ficha en
  // hoja-de-vida) y solo escribe en sus dos carpetas.
  console.log(
    `paquete-vitrina: lee ${RAIZ}${hojaDeVida ? ` y ${join(hojaDeVida, RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA)}` : ""} · compila en ${relative(RAIZ, BUILD)}/ · escribe en ${relative(RAIZ, DESTINO)}/`,
  );

  // AU-S2-B34: un paquete se entrega desde un commit. Un árbol sucio se rechaza salvo que se pida a sabiendas.
  const limpio =
    spawnSync("git", ["status", "--porcelain"], {
      encoding: "utf8",
    }).stdout.trim() === "";
  if (!limpio && a["permitir-arbol-sucio"] !== true) {
    console.error(
      "✗ paquete-vitrina: el árbol tiene cambios sin commit; el manifiesto no podría decir de qué commit sale. Comitea, o usa --permitir-arbol-sucio para probar (ese paquete no se entrega).",
    );
    process.exit(1);
  }

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
    PLANLANG_PAQUETE_MARCA: MARCA_PAQUETE,
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
  copiar(RUTA_FICHA_AGENTE, RUTA_FICHA_AGENTE);
  copiar(RUTA_EXPORT, RUTA_EXPORT_EN_HOJA_DE_VIDA);
  const complemento = JSON.parse(
    readFileSync(join(RAIZ, RUTA_COMPLEMENTO), "utf8"),
  ) as Record<string, unknown>;
  const yamlExistente = hojaDeVida
    ? join(hojaDeVida, RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA)
    : null;
  const fusion = fusionarComplemento(
    complemento,
    yamlExistente && existsSync(yamlExistente)
      ? readFileSync(yamlExistente, "utf8")
      : null,
  );
  mkdirSync(dirname(join(DESTINO, RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA)), {
    recursive: true,
  });
  writeFileSync(join(DESTINO, RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA), fusion.yaml, {
    flag: "w",
  });
  console.log(
    fusion.conservoRoadmap
      ? `✓ ${RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA}: conserva el roadmap: de hoja-de-vida`
      : `✓ ${RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA}: sin roadmap: que conservar${hojaDeVida ? "" : " (sin --hoja-de-vida no se leyó el de hoja-de-vida)"}`,
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
  const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")) as {
    version: string;
  };
  type RefCorrida = { ruta: string; huella: string };
  const vitrina = JSON.parse(
    readFileSync(join(RAIZ, "data/vitrina/manifiesto.json"), "utf8"),
  ) as {
    demos: Record<
      string,
      {
        corrida: RefCorrida;
        repeticiones: RefCorrida[];
        linea_base: RefCorrida | null;
      }
    >;
  };
  const manifiesto = await conHuella({
    formato: "planlang-paquete/v1",
    app: "planlang",
    version: pkg.version,
    base: BASE,
    commit,
    arbol_limpio: limpio,
    // Todas las corridas que alimentan la vitrina, con su huella (AU-S2-B38): la principal, sus repeticiones de
    // pass^k y la línea base.
    corridas: Object.values(vitrina.demos).flatMap((d) => [
      { papel: "principal", ...d.corrida },
      ...d.repeticiones.map((r) => ({ papel: "repeticion", ...r })),
      ...(d.linea_base ? [{ papel: "linea_base", ...d.linea_base }] : []),
    ]),
    copiar_a_hoja_de_vida: {
      "public/piezas/planlang/":
        "la vitrina (export estático, enlaces .html); borrar la carpeta en hoja-de-vida antes de copiar",
      [RUTA_FICHA_AGENTE]:
        "la ficha del agente A (contrato ficha técnica 1.3.1)",
      [RUTA_EXPORT_EN_HOJA_DE_VIDA]:
        "los hechos de la app (contrato brochure-export 1.0.0)",
      [RUTA_COMPLEMENTO_EN_HOJA_DE_VIDA]:
        "el complemento que planlang propone para su ficha (procedencia: app); conserva el roadmap: de la planeadora si ya existe",
    },
    pasos_de_entrega: PASOS_DE_ENTREGA,
    n_archivos: todos.length,
    bytes: todos.reduce((s, r) => s + statSync(join(DESTINO, r)).size, 0),
    archivos: Object.fromEntries(todos.map((r) => [r, sha(join(DESTINO, r))])),
  } as Record<string, JsonValor>);
  writeFileSync(join(DESTINO, "manifiesto.json"), jsonBonito(manifiesto));
  console.log(
    `✓ manifiesto.json: ${todos.length} archivos, huella ${String(manifiesto.huella).slice(0, 12)}…${limpio ? "" : " (árbol con cambios sin commit)"}`,
  );
  // El manifiesto se lee con el mismo lector que el usuario corre sobre hoja-de-vida tras copiar (AU-S2-8).
  const sobrePaquete = verificarContraManifiesto(
    manifiesto as unknown as ManifiestoPaquete,
    arbolEnDisco(DESTINO),
  );
  if (sobrePaquete.length || !existsSync(join(VITRINA, "index.html"))) {
    for (const p of sobrePaquete) console.error(`✗ ${p}`);
    console.error(
      "\n✗ paquete-vitrina: el paquete no coincide con su manifiesto.",
    );
    process.exit(1);
  }
  console.log(
    "✓ el paquete coincide con su manifiesto (pnpm paquete:verificar)",
  );
  console.log(`\npaquete-vitrina: verde → ${relative(RAIZ, DESTINO)}/`);
}

void main();
