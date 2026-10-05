// Pasada de capturas del demo B (S3, fase 3) y su mirada de FORMA «no vista» con matriz, en `docs/fidelidad/s3-demo-b/`
// (autocontenido, sin CDN). Tres partes:
//   1. La pasada completa: cada pantalla del B (y la entrada con sus dos filas) a 380 y 1280 px, en los dos temas en
//      español y en oscuro en inglés. Las capturas enteras van a `--pasada` (fuera del repo); aquí queda su huella
//      SHA-256 y una miniatura de la parte de arriba.
//   2. Las decisiones de forma del B, cada una recortada en el estado que la muestra, con su fila de la matriz
//      (archivo · botón/estado · qué mirar · respuesta esperada).
//   3. La pasada de interacción (regla 22 b): cada recorte que pide tocar algo comprueba que el DOM cambió.
// Techo (plan del S3, «capturas con techo»): la carpeta no pasa de `--techo` bytes (2 MB); si pasa, sale con 1.
//
// Regla 17-bis (b): declara al arrancar los árboles que lee (`out/`) y escribe, y ABORTA si una ruta pedida sale de
// `out/` o si `--pasada` cae dentro del repo. Solo hay datos sintéticos precompilados.
//
// Uso: pnpm build && node scripts/capturas-demo-b.mjs --pasada <carpeta fuera del repo>
//        [--destino docs/fidelidad/s3-demo-b] [--techo 2097152]
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import {
  dirname,
  extname,
  join,
  normalize,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(raiz, "out");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const pasada = arg("pasada", null) ? resolve(arg("pasada", null)) : null;
const destino = resolve(raiz, arg("destino", "docs/fidelidad/s3-demo-b"));
const TECHO = Number(arg("techo", String(2 * 1024 * 1024)));
if (!pasada) {
  console.error(
    "capturas-demo-b: falta --pasada <carpeta fuera del repo> para las capturas enteras. Aborto.",
  );
  process.exit(1);
}
if (!relative(raiz, pasada).startsWith("..")) {
  console.error(
    `capturas-demo-b: --pasada ${pasada} está dentro del repo; las capturas enteras no se versionan. Aborto.`,
  );
  process.exit(1);
}
if (!existsSync(join(OUT, "es", "demo-b", "agente.html"))) {
  console.error(
    "capturas-demo-b: falta out/es/demo-b/agente.html — corre `pnpm build`. Aborto.",
  );
  process.exit(1);
}
console.log(`capturas-demo-b: lee la vitrina ${OUT}`);
console.log(
  `capturas-demo-b: escribe ${destino} (versionado) y ${pasada} (no)`,
);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};
/** Servidor estático con URL limpias (como `serve`): /es → es.html; lo que no existe, la 404 del export. */
const servidor = createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const pedido = normalize(join(OUT, ruta));
  if (!pedido.startsWith(OUT)) {
    res.writeHead(403).end();
    console.error(`capturas-demo-b: ${ruta} sale de ${OUT}. Aborto.`);
    process.exit(1);
  }
  const archivo = [pedido, `${pedido}.html`, join(pedido, "index.html")].find(
    (c) => existsSync(c) && statSync(c).isFile(),
  );
  if (!archivo) {
    res.writeHead(404, { "content-type": TIPOS[".html"] });
    return createReadStream(join(OUT, "404.html")).pipe(res);
  }
  res.writeHead(200, {
    "content-type": TIPOS[extname(archivo)] ?? "application/octet-stream",
  });
  createReadStream(archivo).pipe(res);
});
const puerto = await new Promise((ok) =>
  servidor.listen(0, "127.0.0.1", () => ok(servidor.address().port)),
);
const V = `http://127.0.0.1:${puerto}`;

async function asentar(page) {
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute("data-mono"),
  );
  await page.waitForFunction(() => {
    const r = document.querySelector('input[type="range"]');
    return !r || Object.keys(r).some((k) => k.startsWith("__reactFiber"));
  });
  await page.evaluate(async () => {
    void document.body.offsetHeight;
    await document.fonts.ready;
  });
  await page.waitForTimeout(300);
}

/** El rectángulo de un elemento con un margen, en coordenadas de la página entera. */
async function marco(loc, margen = 16) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (!b) throw new Error("capturas-demo-b: el elemento no está en la página");
  const scroll = await loc.page().evaluate(() => window.scrollY);
  return {
    x: Math.max(0, b.x - margen),
    y: Math.max(0, b.y + scroll - margen),
    width: b.width + 2 * margen,
    height: b.height + 2 * margen,
  };
}

// ── 1. la pasada completa ──────────────────────────────────────────────────────────────────────────────
const PANTALLAS = [
  { clave: "entrada", ruta: "" },
  { clave: "plan", ruta: "/demo-b/plan" },
  { clave: "agente", ruta: "/demo-b/agente" },
  { clave: "brecha", ruta: "/demo-b/brecha" },
  { clave: "playground", ruta: "/demo-b/playground" },
  { clave: "casos", ruta: "/demo-b/caso" },
  { clave: "caso-B-019", ruta: "/demo-b/caso/B-019" },
  { clave: "fichas", ruta: "/demo-b/fichas" },
];
const COMBINACIONES = [
  { idioma: "es", tema: "oscuro" },
  { idioma: "es", tema: "claro" },
  { idioma: "en", tema: "oscuro" },
];
const ANCHOS = [380, 1280];

// ── 2. las decisiones de forma, con su fila de la matriz ───────────────────────────────────────────────
const DECISIONES = [
  {
    clave: "entrada-dos-filas",
    archivo: "Entrada (/es), sección «Los demos»",
    estado: "tal como abre",
    ruta: "/es",
    ancho: 1280,
    tema: "oscuro",
    recorte: (page) =>
      marco(page.locator('section[aria-labelledby="s-demos"]')),
    mirar: "Las dos filas de la tabla y la lista de abajo.",
    esperada:
      "Cada demo con su veredicto real y su corrida; la fila del B ya no dice «en construcción»; abajo quedan tres funciones del roadmap.",
  },
  {
    clave: "barra-conmutador",
    archivo: "Cualquier pantalla del B (/es/demo-b/brecha), barra de arriba",
    estado: "tal como abre",
    ruta: "/es/demo-b/brecha",
    ancho: 1280,
    tema: "oscuro",
    recorte: (page) => marco(page.locator("header").first(), 0),
    mirar:
      "La barra del B: la marca y los controles arriba, las siete pestañas en su propia fila (en el A siguen en una sola fila).",
    esperada:
      "La B marcada; las siete pestañas completas (con el conmutador ya no cabían en una fila a ningún ancho de escritorio); tocar A lleva a la misma pantalla del A. En el teléfono, los controles bajan bajo la marca.",
  },
  {
    clave: "agente-trazas-listas",
    archivo: "Agente del B (/es/demo-b/agente), detalle del nodo",
    estado: "tocar «verificador_listas» en el lienzo → pestaña «Trazas»",
    ruta: "/es/demo-b/agente",
    ancho: 1280,
    tema: "oscuro",
    accion: async (page) => {
      // El lienzo elige con un clic en su región: antes de hidratar no hay quien lo escuche.
      await page.waitForFunction(() => {
        const r = document
          .querySelector('[data-visor="agente"]')
          ?.closest('[role="region"]');
        return !!r && Object.keys(r).some((k) => k.startsWith("__reactProps"));
      });
      await page
        .locator('[data-visor="agente"] [data-sel-id="verificador-listas"]')
        .first()
        .click();
      await page
        .locator("#detalle-verificador-listas")
        .getByRole("button", { name: /^Trazas/ })
        .click();
    },
    cambio: (page) =>
      page
        .locator('#detalle-verificador-listas [data-vista-panel="trazas"]')
        .isVisible(),
    recorte: (page) =>
      marco(
        page.locator('#detalle-verificador-listas [data-vista-panel="trazas"]'),
      ),
    mirar:
      "Las columnas de la tabla de trazas del verificador de listas (el reparto de ancho es nuevo en el B).",
    esperada:
      "La similitud con su barra y la marca del umbral U4; la entrada de la lista en mono; el camino con el glifo del nodo; nada se corta ni se monta.",
  },
  {
    clave: "caso-recibe-carga",
    archivo: "Caso B-019 (/es/demo-b/caso/B-019), columna «Recibe»",
    estado: "tal como abre",
    ruta: "/es/demo-b/caso/B-019",
    ancho: 1280,
    tema: "oscuro",
    recorte: (page) =>
      marco(page.locator("mark").first().locator("xpath=ancestor::ul[1]")),
    mirar: "Los tres documentos de la solicitud y la instrucción plantada.",
    esperada:
      "Identidad, actividad y origen de fondos; la instrucción escondida va marcada (borde discontinuo y ⚠) como dato del caso: el agente no la siguió.",
  },
  {
    clave: "caso-expediente",
    archivo: "Caso B-019, sección «Expediente»",
    estado: "tal como abre",
    ruta: "/es/demo-b/caso/B-019",
    ancho: 1280,
    tema: "oscuro",
    recorte: (page) => marco(page.locator('section[aria-labelledby="c-exp"]')),
    mirar: "Las conclusiones numeradas y la cita bajo cada una.",
    esperada:
      "Cada conclusión con su cita en mono debajo (documento, regla o coincidencia con versión de la lista); ninguna con ⚠; la cuenta al pie.",
  },
  {
    clave: "playground-umbrales",
    archivo: "Playground del B (/es/demo-b/playground), el juego",
    estado: "mover U2 (puntaje de riesgo) a 40",
    ruta: "/es/demo-b/playground",
    ancho: 1280,
    tema: "oscuro",
    accion: async (page) => {
      await page.locator('#w-U2 input[type="range"]').fill("40");
    },
    antes: (page) => page.locator("#k-cambian").textContent(),
    recorte: (page) =>
      marco(page.locator('section[aria-labelledby="s-juego-t"]')),
    mirar: "Los cuatro deslizadores y las cifras de arriba.",
    esperada:
      "U1 a U4 con su rango; al mover U2 cambian los casos que cambian de camino; la cifra de personas cuenta casos, no minutos (el plan B no declara costo humano).",
  },
  {
    clave: "plan-umbrales",
    archivo: "Plan del B (/es/demo-b/plan), sección «Umbrales»",
    estado: "tal como abre",
    ruta: "/es/demo-b/plan",
    ancho: 1280,
    tema: "oscuro",
    recorte: (page) => marco(page.locator('section[aria-labelledby="p-umb"]')),
    mirar: "La lectura de la sección y las cuatro filas.",
    esperada:
      "La lectura dice que el plan no declara cuánto le cuesta a la persona cada caso; U1–U4 con señal, operador y valor.",
  },
  {
    clave: "fichas-agente-b",
    archivo: "Fichas del B (/es/demo-b/fichas), la ficha del agente B",
    estado: "tal como abre",
    ruta: "/es/demo-b/fichas",
    ancho: 1280,
    tema: "oscuro",
    recorte: async (page) => {
      const r = await marco(
        page.locator('section[aria-labelledby="f-agente"]'),
      );
      return { ...r, height: Math.min(r.height, 900) };
    },
    mirar:
      "La parte de arriba de la ficha del agente B: nombre, lema, stack y cifras.",
    esperada:
      "«Agente B · vinculación con debida diligencia»; cinco cifras (exactitud, casos con el oficial, coincidencias y rechazos sin persona, costo por caso), sin latencia.",
  },
  {
    clave: "pie-b",
    archivo: "Cualquier pantalla del B, el pie (teléfono, claro)",
    estado: "tal como abre",
    ruta: "/es/demo-b/plan",
    ancho: 380,
    tema: "claro",
    recorte: (page) => marco(page.locator("footer"), 0),
    mirar: "El aviso de simulación del pie.",
    esperada:
      "Solicitantes, documentos y listas de control sintéticos; en producción decidiría un oficial de cumplimiento (no un auditor médico).",
  },
];

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
mkdirSync(pasada, { recursive: true });
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const navegador = await chromium.launch();

const capturas = [];
for (const p of PANTALLAS)
  for (const c of COMBINACIONES)
    for (const ancho of ANCHOS) {
      const ctx = await navegador.newContext({
        viewport: { width: ancho, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await ctx.newPage();
      await page.goto(`${V}/${c.idioma}${p.ruta}?tema=${c.tema}`);
      await asentar(page);
      const nombre = `${p.clave}-${ancho}-${c.tema}-${c.idioma}`;
      const entera = join(pasada, `${nombre}.png`);
      await page.screenshot({ path: entera, fullPage: true });
      const alto = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      capturas.push({
        pantalla: p.clave,
        url: `/${c.idioma}${p.ruta}`,
        ancho,
        ...c,
        alto,
        sha256: sha(entera),
        entera: `${nombre}.png`,
      });
      await ctx.close();
    }

// Miniaturas: la parte de arriba de cada captura entera, a 240 px de ancho.
const mini = await navegador.newContext({
  viewport: { width: 240, height: 400 },
});
const pm = await mini.newPage();
for (const c of capturas) {
  const datos = readFileSync(join(pasada, c.entera)).toString("base64");
  await pm.setContent(
    `<body style="margin:0;background:#000"><img id="i" style="display:block;width:240px" src="data:image/png;base64,${datos}"></body>`,
  );
  await pm.waitForFunction(() => document.getElementById("i").complete);
  c.miniatura = `mini-${c.entera.replace(/\.png$/, ".jpg")}`;
  await pm.screenshot({
    path: join(destino, c.miniatura),
    clip: { x: 0, y: 0, width: 240, height: 400 },
    type: "jpeg",
    quality: 55,
  });
}
await mini.close();

// ── 2 y 3. los recortes de las decisiones, con la pasada de interacción ─────────────────────────────────
const recortes = [];
for (const d of DECISIONES) {
  const ctx = await navegador.newContext({
    viewport: { width: d.ancho, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${V}${d.ruta}?tema=${d.tema}`);
  await asentar(page);
  let cambio = null;
  if (d.accion) {
    const antes = d.antes ? await d.antes(page) : null;
    await d.accion(page);
    await asentar(page);
    cambio = d.cambio ? await d.cambio(page) : antes !== (await d.antes(page));
    if (!cambio) {
      console.error(
        `capturas-demo-b: «${d.estado}» no cambió nada en ${d.ruta} (regla 22 b). Aborto.`,
      );
      process.exit(1);
    }
  }
  // Un recorte muestra la decisión, no la página: hasta 1.100 px de alto (el techo de la carpeta lo agradece).
  const r = await d.recorte(page);
  const clip = { ...r, height: Math.min(r.height, 1100) };
  const archivo = `forma-${d.clave}.jpg`;
  await page.screenshot({
    path: join(destino, archivo),
    clip,
    fullPage: true,
    type: "jpeg",
    quality: 70,
  });
  recortes.push({
    clave: d.clave,
    archivo: d.archivo,
    estado: d.estado,
    mirar: d.mirar,
    esperada: d.esperada,
    ruta: d.ruta,
    ancho: d.ancho,
    tema: d.tema,
    interaccion: cambio === null ? null : "cambió",
    imagen: archivo,
  });
  await ctx.close();
}
await navegador.close();
servidor.close();

// ── la página ─────────────────────────────────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const filas = recortes
  .map(
    (r, k) =>
      `<tr><td>${k + 1}</td><td>${esc(r.archivo)}</td><td>${esc(r.estado)}</td><td>${esc(r.mirar)}</td><td>${esc(r.esperada)}</td><td>sin respuesta</td></tr>`,
  )
  .join("\n");
const figuras = recortes
  .map(
    (r, k) =>
      `<section class="forma" id="${r.clave}"><h3>${k + 1}. ${esc(r.archivo)}</h3><p>${esc(r.estado)} · ${r.ancho} px · ${r.tema}${r.interaccion ? " · la interacción cambió la página" : ""}</p><img loading="lazy" src="${r.imagen}" alt="${esc(r.mirar)}"></section>`,
  )
  .join("\n");
const minis = capturas
  .map(
    (c) =>
      `<figure><img loading="lazy" src="${c.miniatura}" alt="${esc(`${c.pantalla} ${c.ancho} px ${c.tema} ${c.idioma}`)}"><figcaption>${esc(c.pantalla)} · ${c.ancho} · ${c.tema} · ${c.idioma}<br><code title="SHA-256 de la captura entera">${c.sha256.slice(0, 12)}…</code></figcaption></figure>`,
  )
  .join("\n");
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo B · mirada de forma (S3)</title>
<style>
:root{--fondo:#0f1115;--sup:#171a21;--t1:#eceef2;--t2:#a9afbb;--linea:#2a2f3a}
@media (prefers-color-scheme: light){:root{--fondo:#f7f7f5;--sup:#fff;--t1:#16181d;--t2:#4a505c;--linea:#d9dbe0}}
body{margin:0;background:var(--fondo);color:var(--t1);font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:24px;margin:0 0 8px}h2{font-size:19px;margin:40px 0 8px}h3{font-size:16px;margin:0}
p{color:var(--t2);max-width:80ch;margin:4px 0}code{font:12px ui-monospace,monospace}
.pregunta{color:var(--t1);font-size:17px;font-weight:600}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}th,td{border-top:1px solid var(--linea);padding:8px;text-align:left;vertical-align:top}th{color:var(--t2);font-weight:500}
.forma{margin-top:28px}.forma img{max-width:100%;height:auto;border:1px solid var(--linea);border-radius:6px;display:block;margin-top:8px}
.minis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px}
.minis figure{margin:0}.minis img{width:100%;height:auto;border:1px solid var(--linea);border-radius:4px;display:block}.minis figcaption{font-size:11px;color:var(--t2);margin-top:4px;line-height:1.4}
</style>
</head>
<body><main>
<p class="pregunta">¿Las pantallas del demo B tienen la forma que esperas? Mira cada fila de la tabla con su recorte.</p>
<h1>Demo B · mirada de forma «no vista» (S3, fase 3)</h1>
<p>Vitrina construida con el commit en curso, servida desde <code>out/</code>. Clase de mirada: FORMA, registrada «no vista»; su veredicto viaja al gate ⭐⭐ (parada 2). Las capturas enteras no se versionan: cada una se identifica por su huella SHA-256.</p>
<h2>La matriz</h2>
<table><thead><tr><th>#</th><th>Archivo / pantalla</th><th>Botón o estado</th><th>Qué mirar</th><th>Respuesta esperada</th><th>Tu respuesta</th></tr></thead>
<tbody>
${filas}
</tbody></table>
<h2>Los recortes</h2>
${figuras}
<h2>La pasada completa (${capturas.length} capturas)</h2>
<p>Cada pantalla del B y la entrada, a 380 y 1280 px: en español en los dos temas, en inglés en oscuro. La miniatura es la parte de arriba; la huella identifica la captura entera que se leyó.</p>
<div class="minis">
${minis}
</div>
</main></body>
</html>
`;
writeFileSync(join(destino, "index.html"), html);
writeFileSync(
  join(destino, "registro.json"),
  `${JSON.stringify({ formato: "planlang-capturas/v1", capturas, recortes }, null, 2)}\n`,
);

const peso = readdirSync(destino).reduce(
  (s, f) => s + statSync(join(destino, f)).size,
  0,
);
console.log(
  `capturas-demo-b: ${capturas.length} capturas enteras (en ${pasada}), ${recortes.length} recortes de forma, ${(peso / 1024).toFixed(0)} KB en ${relative(raiz, destino)}`,
);
if (peso > TECHO) {
  console.error(
    `capturas-demo-b: ${peso} bytes pasan el techo de ${TECHO}; baja la calidad o el número de miniaturas.`,
  );
  process.exit(1);
}
