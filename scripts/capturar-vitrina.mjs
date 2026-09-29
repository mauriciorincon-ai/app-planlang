// Arnés de CAPTURAS de la vitrina (S2): gate de FIDELIDAD de cada pantalla contra su maqueta y pasada de
// INTERACCIÓN (regla 22 b). Sirve `out/` (el export ya construido: `pnpm build` antes) y `docs/diseno/` con
// un servidor estático propio en puertos libres, entra por el ÍNDICE (`/?elegir`) y desde ahí a la pantalla,
// y para cada ancho × tema × idioma (× perfil) captura la pantalla de la vitrina y la de la maqueta sin el
// cromo de sala. Después:
//   - mide: sin desplazamiento horizontal de página, fuentes activas cargadas, consola sin errores;
//   - pasada de interacción: pulsa cada control (tema, perfil, «Ver como experto», idioma, una pestaña) y
//     comprueba que ALGO cambió en el DOM; un control que no cambia nada pone el arnés en rojo;
//   - arma `docs/fidelidad/<mirada>/index.html` (autocontenido, sin CDN) con los pares lado a lado, la
//     matriz de qué mirar y el resultado de las mediciones.
//
// Regla 17-bis (b): declara al arrancar los dos árboles que lee (`out/`, `docs/diseno/`) y ABORTA si una ruta
// pedida sale de ellos. No toca datos: la vitrina solo tiene datos sintéticos precompilados.
//
// Uso: node scripts/capturar-vitrina.mjs [--mirada p1] [--anchos 380,1280] [--temas oscuro,claro]
//      [--idiomas es,en] [--calidad 55] [--solo-medir]
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(raiz, "out");
const MAQUETA = join(raiz, "docs");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const bandera = (n) => process.argv.includes(`--${n}`);

/** Las miradas que el arnés sabe capturar: ruta de la vitrina, página de la maqueta y la matriz de qué mirar. */
const MIRADAS = {
  p1: {
    titulo: {
      es: "P1 Entrada frente a su maqueta",
      en: "P1 Home against its mock-up",
    },
    ruta: (idioma) => `/${idioma}`,
    maqueta: "diseno/01-entrada.html",
    extra: [
      { ancho: 1280, tema: "oscuro", idioma: "es", perfil: "experto" },
      { ancho: 380, tema: "oscuro", idioma: "es", perfil: "experto" },
    ],
    matriz: [
      [
        "Arriba: la tesis y el gancho",
        "Lee el titular y la columna de la derecha.",
        "«Planeé, construí y medí la brecha» y los datos con su fuente: 89 % observan, 52 % evalúan, nadie pregunta si se planeó qué evaluar.",
      ],
      [
        "«Cómo funciona»",
        "Lee el objetivo y los tres pasos.",
        "El objetivo en una frase; «Construí» con las 8 piezas del agente real; «Medí la brecha» con 9 de 9 criterios y lo que falló, nombrado.",
      ],
      [
        "«Capacidad medida», bajo los tres pasos",
        "Mira las cuatro cifras.",
        "20 × 3 casos, 233 decisiones con 0 diferencias, 9 de 9 · 0 de 8 y 0 llamadas a modelos, cada una con su procedencia.",
      ],
      [
        "«Los demos», fila A",
        "Compara la columna «Corrida» con la maqueta.",
        "Demo A «Cumple con alertas». La corrida dice «plan v1.3 · corrida con v1.2»: el informe es el del plan v1.3 sobre el lote que corrió con la v1.2 (la maqueta decía «plan v1.2»).",
      ],
      [
        "Botón «Ver como experto»",
        "Mira el par «experto».",
        "Aparece «Cómo se sostiene cada afirmación» con el rótulo «Experto»: núcleo sin IA, trazas, prueba cruzada, modelo, decisiones simuladas, pila y fuente.",
      ],
      [
        "Barra de arriba, en el teléfono",
        "Mira los pares de 380 px.",
        "Las pestañas bajan a su propia fila y se deslizan de lado; la página no se desplaza de lado.",
      ],
      [
        "Toda la página, tema claro",
        "Mira los pares «claro».",
        "Los mismos colores que la maqueta en claro; ningún texto en gris tenue sobre blanco.",
      ],
      [
        "Toda la página, en inglés",
        "Mira los pares «en».",
        "Todo redactado en inglés, sin español residual; decimales con punto y porcentajes pegados («89%», como pide el design system para el inglés; la maqueta los dejaba con espacio).",
      ],
    ],
  },
};

const mirada = arg("mirada", "p1");
const M = MIRADAS[mirada];
if (!M) {
  console.error(
    `capturar-vitrina: no sé capturar la mirada «${mirada}» (conozco: ${Object.keys(MIRADAS).join(", ")}).`,
  );
  process.exit(1);
}
if (!existsSync(join(OUT, "index.html"))) {
  console.error(
    "capturar-vitrina: falta out/index.html — corre `pnpm build` antes. Aborto.",
  );
  process.exit(1);
}
const anchos = arg("anchos", "380,1280").split(",").map(Number);
const temas = arg("temas", "oscuro,claro").split(",");
const idiomas = arg("idiomas", "es,en").split(",");
const calidad = Number(arg("calidad", "55"));
const soloMedir = bandera("solo-medir");
const destino = join(raiz, "docs", "fidelidad", mirada);

console.log(
  `capturar-vitrina: árboles leídos → vitrina ${OUT} · maqueta ${join(MAQUETA, "diseno")}`,
);
console.log(
  `capturar-vitrina: salida → ${soloMedir ? "(solo medir, sin archivos)" : destino}`,
);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".md": "text/plain; charset=utf-8",
};

/** Servidor estático con URL limpias (como `serve` y `cleanUrls` de Vercel): /es → es.html. */
function servidor(base) {
  return createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const pedido = normalize(join(base, ruta));
    if (!pedido.startsWith(base)) {
      res.writeHead(403).end();
      console.error(`capturar-vitrina: ${ruta} sale de ${base}. Aborto.`);
      process.exit(1);
    }
    const candidatos = [pedido, `${pedido}.html`, join(pedido, "index.html")];
    const archivo = candidatos.find(
      (c) => existsSync(c) && statSync(c).isFile(),
    );
    if (!archivo) {
      const nf = join(base, "404.html");
      res.writeHead(404, { "content-type": TIPOS[".html"] });
      return existsSync(nf) ? createReadStream(nf).pipe(res) : res.end("404");
    }
    res.writeHead(200, {
      "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream",
    });
    createReadStream(archivo).pipe(res);
  });
}
const escuchar = (s) =>
  new Promise((ok) => s.listen(0, "127.0.0.1", () => ok(s.address().port)));
const sVitrina = servidor(OUT);
const sMaqueta = servidor(MAQUETA);
const pV = await escuchar(sVitrina);
const pM = await escuchar(sMaqueta);
const V = `http://127.0.0.1:${pV}`;
const Q = `http://127.0.0.1:${pM}`;

const CROMO_SALA =
  ".mq-bar,.mq-nota,.mq-solo-sala,.mq-cierre{display:none!important}";
const combinaciones = [];
for (const ancho of anchos)
  for (const tema of temas)
    for (const idioma of idiomas)
      combinaciones.push({ ancho, tema, idioma, perfil: "lider" });
for (const e of M.extra)
  if (
    anchos.includes(e.ancho) &&
    temas.includes(e.tema) &&
    idiomas.includes(e.idioma)
  )
    combinaciones.push(e);

const navegador = await chromium.launch();
const pares = [];
const mediciones = [];
const fallas = [];

async function asentar(page) {
  // La mono de datos de la vitrina entra tras la carga (`html[data-mono]`, ADR-008): se espera a que esté.
  if (page.url().startsWith(V))
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-mono"),
    );
  await page.evaluate(async () => {
    void document.body.offsetHeight;
    await document.fonts.ready;
  });
  // Las transiciones de color duran 150 ms: se deja que terminen antes de capturar.
  await page.waitForTimeout(400);
}

async function medir(page, que) {
  return page.evaluate((que) => {
    const d = document.documentElement;
    const cs = getComputedStyle(document.body);
    return {
      que,
      desbordaDeLado: d.scrollWidth > d.clientWidth,
      // La primera familia del cuerpo y la de un dato en mono (next/font las renombra) deben estar CARGADAS.
      fuentes: [
        ["letra", document.body],
        ["mono", document.querySelector(".font-mono")],
      ].map(([nombre, el]) => {
        const familia = el
          ? getComputedStyle(el)
              .fontFamily.split(",")[0]
              .trim()
              .replace(/["']/g, "")
          : "";
        return [
          `${nombre} (${familia})`,
          [...document.fonts].some(
            (x) =>
              x.family.replace(/["']/g, "") === familia &&
              x.status === "loaded",
          ),
        ];
      }),
      letra: cs.fontFamily.slice(0, 60),
    };
  }, que);
}

for (const c of combinaciones) {
  const ctx = await navegador.newContext({
    viewport: { width: c.ancho, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(String(e)));
  // Entra por el índice (sin redirección) y de ahí a la pantalla, con el tema y el perfil en la URL.
  await page.goto(`${V}/?elegir`);
  await page.click(`a[hreflang="${c.idioma}"]`);
  await page.goto(`${V}${M.ruta(c.idioma)}?tema=${c.tema}&perfil=${c.perfil}`);
  await asentar(page);
  const m = await medir(
    page,
    `vitrina ${c.ancho} ${c.tema} ${c.idioma} ${c.perfil}`,
  );
  m.errores = errores.slice();
  mediciones.push(m);
  if (m.desbordaDeLado) fallas.push(`${m.que}: la página se desplaza de lado`);
  if (m.fuentes.some(([, ok]) => !ok))
    fallas.push(`${m.que}: una fuente no cargó (${JSON.stringify(m.fuentes)})`);
  if (errores.length)
    fallas.push(`${m.que}: errores de consola ${JSON.stringify(errores)}`);
  const base = `${c.ancho}-${c.tema}-${c.idioma}${c.perfil === "experto" ? "-experto" : ""}`;
  const archivoV = `vitrina-${base}.jpg`;
  const archivoM = `maqueta-${base}.jpg`;
  if (!soloMedir) {
    mkdirSync(destino, { recursive: true });
    await page.screenshot({
      path: join(destino, archivoV),
      fullPage: true,
      type: "jpeg",
      quality: calidad,
    });
  }
  await page.goto(
    `${Q}/${M.maqueta}?tema=${c.tema}&lang=${c.idioma}&estado=real&perfil=${c.perfil}`,
  );
  await page.addStyleTag({ content: CROMO_SALA });
  await asentar(page);
  if (!soloMedir)
    await page.screenshot({
      path: join(destino, archivoM),
      fullPage: true,
      type: "jpeg",
      quality: calidad,
    });
  pares.push({ ...c, archivoV, archivoM });
  await ctx.close();
}

// Pasada de INTERACCIÓN (regla 22 b): cada control cambia algo, o el arnés queda en rojo.
const interacciones = [];
{
  const ctx = await navegador.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const huella = () =>
    page.evaluate(() =>
      [
        document.documentElement.outerHTML.length,
        document.documentElement.getAttribute("data-theme"),
        document.documentElement.getAttribute("data-perfil"),
        location.pathname,
        document.documentElement.lang,
      ].join("|"),
    );
  const probar = async (nombre, accion, espera) => {
    const antes = await huella();
    await accion();
    await page.waitForTimeout(300);
    const despues = await huella();
    const ok = antes !== despues && (espera ? await espera() : true);
    interacciones.push({ nombre, ok, antes, despues });
    if (!ok) fallas.push(`interacción «${nombre}»: no cambió nada`);
  };
  await page.goto(`${V}/es?tema=oscuro&perfil=lider`);
  await asentar(page);
  await probar(
    "tema → Claro",
    () => page.getByRole("button", { name: "Claro" }).click(),
    () =>
      page.evaluate(
        () =>
          document.documentElement.dataset.theme === "claro" &&
          getComputedStyle(document.body).backgroundColor !== "rgb(11, 12, 15)",
      ),
  );
  await probar(
    "tema → Oscuro",
    () => page.getByRole("button", { name: "Oscuro" }).click(),
    () =>
      page.evaluate(() => document.documentElement.dataset.theme === "oscuro"),
  );
  await probar(
    "Leer como → Experto",
    () => page.getByRole("button", { name: "Experto", exact: true }).click(),
    () =>
      page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible(),
  );
  await probar(
    "Volver a líder",
    () => page.getByRole("button", { name: "Volver a líder" }).click(),
    async () =>
      !(await page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible()),
  );
  await probar(
    "Ver como experto",
    () => page.getByRole("button", { name: "Ver como experto" }).click(),
    () =>
      page
        .getByRole("heading", { name: "Cómo se sostiene cada afirmación" })
        .isVisible(),
  );
  await probar(
    "idioma → EN",
    () => page.getByRole("link", { name: "English" }).click(),
    () =>
      page.evaluate(
        () =>
          document.documentElement.lang === "en" && location.pathname === "/en",
      ),
  );
  await probar(
    "pestaña → Plan",
    () =>
      page
        .getByRole("navigation", { name: "Sections" })
        .getByRole("link", { name: "Plan" })
        .click(),
    () => page.evaluate(() => location.pathname === "/en/plan"),
  );
  await ctx.close();
}

await navegador.close();
sVitrina.close();
sMaqueta.close();

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
if (!soloMedir) {
  const TEMA = { oscuro: "oscuro", claro: "claro" };
  const bloques = pares
    .map(
      (p) =>
        `<section class="par" data-ancho="${p.ancho}"><h2>${p.ancho} px · ${TEMA[p.tema]} · ${p.idioma.toUpperCase()} · ${p.perfil === "experto" ? "experto" : "líder"}</h2><div class="lado"><figure><figcaption>Maqueta aprobada · <code>docs/${M.maqueta}</code></figcaption><img loading="lazy" src="${p.archivoM}" alt="Maqueta ${p.ancho} px ${p.tema} ${p.idioma} ${p.perfil}"></figure><figure><figcaption>Vitrina construida · <code>out${M.ruta(p.idioma)}.html</code></figcaption><img loading="lazy" src="${p.archivoV}" alt="Vitrina ${p.ancho} px ${p.tema} ${p.idioma} ${p.perfil}"></figure></div></section>`,
    )
    .join("\n");
  const matriz = M.matriz
    .map(
      ([donde, hacer, ver], i) =>
        `<tr><td>${i + 1}</td><td>${esc(M.titulo.es.split(" frente")[0])}</td><td>${esc(donde)}</td><td>${esc(hacer)}</td><td>${esc(ver)}</td></tr>`,
    )
    .join("\n");
  const inter = interacciones
    .map((x) => `<li>${x.ok ? "✓" : "✕"} ${esc(x.nombre)}</li>`)
    .join("");
  const med = mediciones
    .map(
      (x) =>
        `<li>${x.desbordaDeLado || x.errores.length ? "✕" : "✓"} ${esc(x.que)} — ${x.desbordaDeLado ? "se desplaza de lado" : "sin desplazamiento lateral"} · fuentes ${x.fuentes.every(([, ok]) => ok) ? "cargadas" : "FALTAN"} · consola ${x.errores.length ? "con errores" : "limpia"}</li>`,
    )
    .join("");
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fidelidad · ${esc(M.titulo.es)}</title>
<style>
:root{color-scheme:dark;--fondo:#0b0c0f;--sup:#191b1d;--linea:#2c2e31;--t1:#eceff3;--t2:#b8bbbe}
body{margin:0;background:var(--fondo);color:var(--t1);font:15px/1.6 system-ui,sans-serif}
main{max-width:1500px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:24px;margin:0 0 4px} h2{font-size:15px;margin:32px 0 8px;color:var(--t2);font-weight:600}
p{color:var(--t2);max-width:80ch} code{font:12px ui-monospace,monospace}
.filtros{display:flex;gap:8px;margin:16px 0}.filtros button{font:inherit;font-size:13px;color:var(--t1);background:transparent;border:1px solid #75777b;border-radius:6px;padding:4px 10px;cursor:pointer}.filtros button[aria-pressed=true]{background:var(--t1);color:var(--fondo)}
.lado{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.par[data-ancho="380"] .lado{grid-template-columns:repeat(2,minmax(0,400px));justify-content:start}
figure{margin:0}figcaption{font-size:12px;color:var(--t2);margin-bottom:6px}img{width:100%;height:auto;border:1px solid var(--linea);border-radius:6px;display:block}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}th,td{border-top:1px solid var(--linea);padding:8px;text-align:left;vertical-align:top}th{color:var(--t2);font-weight:500}
ul{padding-left:20px;font-size:13px;color:var(--t2)}
@media (max-width:860px){.lado{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>¿La Entrada construida se ve como la maqueta que aprobaste?</h1>
<p>${esc(M.titulo.es)}. A la izquierda, la maqueta aprobada (sin el cromo de la sala de diseño); a la derecha, la vitrina que se construyó en el sprint 2, capturada del export estático entrando por el índice. ${pares.length} pares: 380 px y escritorio × oscuro y claro × español e inglés, más dos como experto. La matriz de qué mirar está al pie.</p>
<div class="filtros" role="group" aria-label="Filtrar por ancho"><button type="button" aria-pressed="true" data-f="todos">Todos</button><button type="button" aria-pressed="false" data-f="1280">Escritorio</button><button type="button" aria-pressed="false" data-f="380">Teléfono (380 px)</button></div>
${bloques}
<h2 id="matriz">Qué mirar y qué deberías ver</h2>
<table><thead><tr><th>#</th><th>Pantalla</th><th>Dónde</th><th>Qué hacer</th><th>Qué debe verse</th></tr></thead><tbody>
${matriz}
</tbody></table>
<h2>Mediciones del arnés</h2>
<ul>${med}</ul>
<h2>Pasada de interacción (regla 22)</h2>
<ul>${inter}</ul>
<p>Generado por <code>node scripts/capturar-vitrina.mjs --mirada ${mirada}</code> sobre el export de <code>pnpm build</code>. Las capturas se regeneran; no se editan a mano.</p>
</main>
<script>
document.querySelector(".filtros").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var f=b.dataset.f;document.querySelectorAll(".filtros button").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});document.querySelectorAll(".par").forEach(function(s){s.hidden=f!=="todos"&&s.dataset.ancho!==f})});
</script>
</body>
</html>
`;
  writeFileSync(join(destino, "index.html"), html);
}

console.log(
  `capturar-vitrina: ${pares.length} pares · ${mediciones.length} mediciones · ${interacciones.filter((x) => x.ok).length}/${interacciones.length} interacciones`,
);
for (const x of interacciones) console.log(`  ${x.ok ? "✓" : "✕"} ${x.nombre}`);
if (fallas.length) {
  console.error("capturar-vitrina: EN ROJO");
  for (const f of fallas) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("capturar-vitrina: verde");
