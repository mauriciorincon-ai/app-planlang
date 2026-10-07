// Gate del EXPORT de la vitrina (S2): corre después de `pnpm build` (job `quality`) sobre `out/`, el árbol que
// se publica. Cada regla nació con su demo en rojo (bitácora del S2):
//   1. Ningún HTML hornea `localhost` (metadata con URL absoluta sin base: el export la resuelve a localhost).
//   2. Todo `<script src>`, `<link href>` e `<img src>` es propio (nada de `https:` ni `//`) y existe en `out/`
//      (regla 22 a, endurecida al export: un control sin su script no hace nada; AU-S2-B31).
//   3. Todo enlace interno `<a href>` resuelve a una página del export (como `serve` y `cleanUrls`).
//   4. Toda página lleva el rótulo «Simulación · no operativo» PINTADO: un elemento `data-rotulo` con el texto en
//      su idioma (la raíz y la 404, en los dos). Buscar el texto en el HTML crudo no basta: la carga RSC también lo
//      trae (AU-S2-B30), y la 404 ya no está exenta (AU-S2-13).
//   5. La maqueta no viaja (ADR-007): ni `diseno/` ni documentos `.md`.
//   6. Cero enlaces (regla 17): ningún dominio de despliegue en el export.
//   7. Vocabulario por demo (S3, ADR-014): ninguna pantalla del B dice palabras que solo son del A (afiliado,
//      auditor, médico, Texas, plan de beneficios · member, physician, benefit plan) ni una del A las que solo son
//      del B (oficial de cumplimiento, lista vinculante, homónimo, vinculación · applicant, compliance officer,
//      binding list, namesake, onboarding). Lee el texto pintado, el `<title>`, la descripción y los `aria-label`,
//      `title` y `alt`. Quedan fuera la entrada (presenta los dos demos) y lo marcado `data-vocabulario="ambos-demos"`
//      (la ficha de la app, igual en las dos páginas de Fichas). Nació porque las páginas del B heredaban textos del A
//      (la franja del oráculo, el pie, «minutos de auditor») sin que ninguna prueba de vista los viera.
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
const EXTERNO = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

/** El texto visible del elemento `data-rotulo` (fuera de los `<script>`), o null si la página no lo pinta. */
function textoDelRotulo(html) {
  const sinScripts = html.replace(/<script\b[\s\S]*?<\/script>/g, "");
  const i = sinScripts.search(/<[a-z]+\b[^>]*\bdata-rotulo(?:="[^"]*")?[\s>]/);
  if (i < 0) return null;
  const fin = sinScripts.indexOf("<main", i);
  const ventana = sinScripts.slice(i, fin > i ? fin : i + 3000);
  return ventana.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

/** Palabras que solo dice cada demo: una pantalla del otro demo no las dice (regla 7). */
const SOLO_DE = {
  "demo-a": [
    "afiliad[oa]s?",
    "auditor(?:es|as?)?",
    "médic[oa]s?",
    "texas",
    "planes? de beneficios",
    "members?",
    "physicians?",
    "benefits? plans?",
  ],
  "demo-b": [
    "oficial(?:es)? de cumplimiento",
    "listas? vinculantes?",
    "homónim[oa]s?",
    "vinculación",
    "applicants?",
    "compliance officers?",
    "binding lists?",
    "namesakes?",
    "onboarding",
  ],
};
/** Una palabra entera (sin letras ni dígitos pegados, con tildes incluidas), sin mayúsculas que importen. */
const comoPalabra = (p) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${p})(?![\\p{L}\\p{N}])`, "iu");

/** El demo de una pantalla por su ruta (ADR-014): `<idioma>/demo-b/…` es del B; la entrada, de ninguno. */
function demoDePantalla(r) {
  if (/^(es|en)\/demo-b(\.html|\/)/.test(r)) return "demo-b";
  if (/^(es|en)\//.test(r)) return "demo-a";
  return null;
}

/** Quita los elementos marcados `data-vocabulario="ambos-demos"` con todo su contenido; null si uno no cierra. */
function sinLoDeAmbos(html) {
  let s = html;
  for (;;) {
    const m =
      /<([a-z][a-z0-9]*)\b[^>]*\bdata-vocabulario="ambos-demos"[^>]*>/i.exec(s);
    if (!m) return s;
    const etiqueta = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, "gi");
    etiqueta.lastIndex = m.index + m[0].length;
    let nivel = 1;
    let x;
    while (nivel > 0 && (x = etiqueta.exec(s))) nivel += x[1] ? -1 : 1;
    if (nivel > 0) return null;
    s = s.slice(0, m.index) + s.slice(etiqueta.lastIndex);
  }
}

/** Lo que lee una persona de la página: el texto pintado, el título, la descripción y las etiquetas accesibles. */
function textoLeido(html) {
  const atributos = [
    ...html.matchAll(/\b(?:aria-label|title|alt)="([^"]*)"/g),
    ...html.matchAll(
      /<meta\b[^>]*\bname="description"[^>]*\bcontent="([^"]*)"/g,
    ),
  ].map((m) => m[1]);
  const pintado = html
    .replace(/<script\b[\s\S]*?<\/script>/g, " ")
    .replace(/<style\b[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  return [pintado, ...atributos]
    .join(" ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

for (const f of htmls) {
  const html = readFileSync(f, "utf8");
  if (/localhost|127\.0\.0\.1/.test(html))
    fallas.push(`${rel(f)}: hornea localhost (¿metadata con URL absoluta?)`);
  if (DOMINIOS.test(html))
    fallas.push(`${rel(f)}: publica un dominio de despliegue (regla 17)`);
  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g))
    if (EXTERNO.test(src)) fallas.push(`${rel(f)}: script de afuera ${src}`);
    else if (src.startsWith("/") && !existe(src))
      fallas.push(`${rel(f)}: falta el script ${src}`);
  for (const [, href] of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g))
    if (EXTERNO.test(href)) fallas.push(`${rel(f)}: recurso de afuera ${href}`);
    else if (href.startsWith("/") && !existe(href))
      fallas.push(`${rel(f)}: falta el recurso ${href}`);
  for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g))
    if (EXTERNO.test(src)) fallas.push(`${rel(f)}: imagen de afuera ${src}`);
    else if (src.startsWith("/") && !existe(src))
      fallas.push(`${rel(f)}: falta la imagen ${src}`);
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (!href.startsWith("/"))
      fallas.push(
        `${rel(f)}: enlace relativo ${href} (la vitrina usa rutas desde la raíz, ADR-007)`,
      );
    else if (!existe(href)) fallas.push(`${rel(f)}: enlace roto ${href}`);
  }
  // Toda página (no los fragmentos `_…` de Next): las de la vitrina en su idioma; la raíz y la 404, en los dos.
  if (!rel(f).startsWith("_")) {
    const m = rel(f).match(/^(es|en)(\.html|\/)/);
    const pintado = textoDelRotulo(html);
    for (const i of m ? [m[1]] : ["es", "en"])
      if (pintado === null || !pintado.includes(ROTULO[i]))
        fallas.push(`${rel(f)}: sin el rótulo pintado «${ROTULO[i]}»`);
  }
}

// 7. Vocabulario por demo.
for (const f of htmls) {
  const demo = demoDePantalla(rel(f));
  if (!demo) continue;
  const html = sinLoDeAmbos(readFileSync(f, "utf8"));
  if (html === null) {
    fallas.push(
      `${rel(f)}: un elemento data-vocabulario="ambos-demos" no cierra`,
    );
    continue;
  }
  const texto = textoLeido(html);
  // Las palabras de cada uno de los OTROS demos (todos los que declara `SOLO_DE`, no un binario).
  for (const otro of Object.keys(SOLO_DE).filter((x) => x !== demo))
    for (const p of SOLO_DE[otro]) {
      const m = comoPalabra(p).exec(texto);
      if (m)
        fallas.push(
          `${rel(f)}: pantalla del ${demo} dice «${m[0]}», palabra del ${otro}: …${texto.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40).trim()}…`,
        );
    }
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
