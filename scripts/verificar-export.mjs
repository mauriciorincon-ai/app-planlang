// Gate del EXPORT de la vitrina (S2): corre después de `pnpm build` (job `quality`) sobre `out/`, el árbol que
// se publica. Cada regla nació con su demo en rojo (bitácora del S2):
//   1. Ningún HTML hornea `localhost` (metadata con URL absoluta sin base: el export la resuelve a localhost).
//   2. Todo `<script src>` y `<link href>` propio existe en `out/` (regla 22 a, endurecida al export: un
//      control sin su script no hace nada).
//   3. Todo enlace interno `<a href>` resuelve a una página del export (como `serve` y `cleanUrls`).
//   4. Toda pantalla de la vitrina lleva el rótulo «Simulación · no operativo» en su idioma (regla dura 14).
//   5. La maqueta no viaja (ADR-007): ni `diseno/` ni documentos `.md`.
//   6. Cero enlaces (regla 17): ningún dominio de despliegue en el export.
// Uso: node scripts/verificar-export.mjs [dir]   (por defecto out/)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const OUT = resolve(process.argv[2] ?? "out");
if (!existsSync(join(OUT, "index.html"))) {
  console.error(
    `verificar-export: ${OUT} no tiene index.html — corre \`pnpm build\` antes.`,
  );
  process.exit(1);
}

function archivos(dir) {
  return readdirSync(dir).flatMap((f) => {
    const r = join(dir, f);
    return statSync(r).isDirectory() ? archivos(r) : [r];
  });
}
const todos = archivos(OUT);
const htmls = todos.filter((f) => f.endsWith(".html"));
const fallas = [];
const rel = (f) => relative(OUT, f);

/** Resuelve una ruta del sitio como `serve` con URL limpias: /es → es.html, /x/ → x/index.html. */
function existe(ruta) {
  const limpia = decodeURIComponent(ruta.split(/[?#]/)[0]);
  const base = join(OUT, limpia);
  return [base, `${base}.html`, join(base, "index.html")].some(
    (c) => existsSync(c) && statSync(c).isFile(),
  );
}

const ROTULO = {
  es: "Simulación · no operativo",
  en: "Simulation · not operational",
};
const DOMINIOS = /vercel[.]app|workers[.]dev|pages[.]dev/;

for (const f of htmls) {
  const html = readFileSync(f, "utf8");
  if (/localhost|127\.0\.0\.1/.test(html))
    fallas.push(`${rel(f)}: hornea localhost (¿metadata con URL absoluta?)`);
  if (DOMINIOS.test(html))
    fallas.push(`${rel(f)}: publica un dominio de despliegue (regla 17)`);
  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g))
    if (src.startsWith("/") && !existe(src))
      fallas.push(`${rel(f)}: falta el script ${src}`);
  for (const [, href] of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g))
    if (href.startsWith("/") && !existe(href))
      fallas.push(`${rel(f)}: falta el recurso ${href}`);
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (!href.startsWith("/"))
      fallas.push(
        `${rel(f)}: enlace relativo ${href} (la vitrina usa rutas desde la raíz, ADR-007)`,
      );
    else if (!existe(href)) fallas.push(`${rel(f)}: enlace roto ${href}`);
  }
  // Las pantallas de la vitrina: out/es.html, out/en.html y todo lo que cuelga de out/es/ y out/en/.
  const m = rel(f).match(/^(es|en)(\.html|\/)/);
  if (m && !html.includes(ROTULO[m[1]]))
    fallas.push(`${rel(f)}: sin el rótulo «${ROTULO[m[1]]}»`);
}

for (const f of todos) {
  const r = rel(f);
  if (r.startsWith("diseno/") || r.includes("/diseno/"))
    fallas.push(`${r}: la maqueta viaja en el export (ADR-007)`);
  if (r.endsWith(".md")) fallas.push(`${r}: un documento viaja en el export`);
}

const pantallas = htmls.filter((f) =>
  /^(es|en)(\.html|\/)/.test(rel(f)),
).length;
if (pantallas === 0) fallas.push("no hay pantallas de la vitrina en el export");

if (fallas.length) {
  console.error(`verificar-export: EN ROJO (${fallas.length})`);
  for (const x of fallas) console.error(`  - ${x}`);
  process.exit(1);
}
console.log(
  `verificar-export: verde — ${htmls.length} HTML (${pantallas} pantallas de la vitrina), ${todos.length} archivos.`,
);
