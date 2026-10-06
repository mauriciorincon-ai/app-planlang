// Registro de la PASADA DE CAPTURAS DE CIERRE del sprint (contrapeso del ⭐ diferido, AU-S2-12) y MIRADA de los
// cambios de forma de la auditoría. Dos partes, en `docs/fidelidad/cierre/` (autocontenido, sin CDN):
//   1. Los cambios de forma: cada uno recortado de la vitrina en el estado que lo muestra (con el teclado, un umbral
//      movido, el perfil experto), con la matriz de qué mirar.
//   2. El registro de la pasada completa que dejó `scripts/capturar-vitrina.mjs --destino <pasada>` para p1–p4:
//      cada encuadre con su huella SHA-256 y una miniatura de su parte de arriba, las mediciones y la pasada de
//      interacción. Las capturas enteras (unos 60 MB) no se versionan: la huella dice cuál se leyó.
//
// Regla 17-bis (b): declara al arrancar los árboles que lee (`out/` y la carpeta de la pasada) y ABORTA si una ruta
// pedida sale de `out/`. Solo hay datos sintéticos precompilados.
//
// Uso: node scripts/registro-cierre.mjs --pasada <carpeta con p1…p4> [--destino docs/fidelidad/cierre]
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
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(raiz, "out");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const pasada = arg("pasada", null);
const destino = resolve(raiz, arg("destino", "docs/fidelidad/cierre"));
if (!pasada || !existsSync(pasada)) {
  console.error(
    "registro-cierre: falta --pasada <carpeta> con p1…p4 de `capturar-vitrina.mjs --destino`. Aborto.",
  );
  process.exit(1);
}
if (!existsSync(join(OUT, "index.html"))) {
  console.error(
    "registro-cierre: falta out/index.html — corre `pnpm build`. Aborto.",
  );
  process.exit(1);
}
console.log(
  `registro-cierre: árboles leídos → vitrina ${OUT} · pasada ${resolve(pasada)}`,
);
console.log(`registro-cierre: salida → ${destino}`);

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
    console.error(`registro-cierre: ${ruta} sale de ${OUT}. Aborto.`);
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
  // Las pantallas de la vitrina cargan la mono tras la carga (`html[data-mono]`); la raíz y la 404 no la llevan.
  if (/^\/(es|en)(\/|$)/.test(new URL(page.url()).pathname))
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-mono"),
    );
  // Una isla hidratada antes de tocar sus controles (un valor puesto antes se perdería).
  await page.waitForFunction(() => {
    const r = document.querySelector('input[type="range"]');
    return !r || Object.keys(r).some((k) => k.startsWith("__reactFiber"));
  });
  await page.evaluate(async () => {
    void document.body.offsetHeight;
    await document.fonts.ready;
  });
  await page.waitForTimeout(400);
}

/** El rectángulo de un elemento con un margen, dentro de la página. */
async function marco(loc, margen = 16) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("registro-cierre: el elemento no está en la página");
  return {
    x: Math.max(0, b.x - margen),
    y: Math.max(0, b.y - margen),
    width: b.width + 2 * margen,
    height: b.height + 2 * margen,
  };
}

/**
 * Los cambios de forma de la auditoría, cada uno en el estado que lo muestra. `recorte` devuelve el rectángulo a
 * capturar (en coordenadas de la ventana, después de llevar el elemento a la vista).
 */
const CAMBIOS = [
  {
    clave: "entrada-en-construccion",
    titulo: "Entrada: «También en construcción»",
    ruta: "/es",
    ancho: 1280,
    tema: "oscuro",
    recorte: async (page) => {
      const t = page.getByText("También en construcción", { exact: true });
      const caja = t.locator("xpath=..");
      await caja.scrollIntoViewIfNeeded();
      return marco(caja);
    },
    donde: "Entrada, bajo la tabla de los demos",
    ver: "Una lista corta con lo que sigue del roadmap, marcada «en construcción» (no se simula nada); el demo B sigue en su fila de la tabla.",
  },
  {
    clave: "raiz-rotulo",
    titulo: "La raíz «/»: rótulo bilingüe",
    ruta: "/?elegir",
    ancho: 380,
    tema: "oscuro",
    recorte: async () => ({ x: 0, y: 0, width: 380, height: 420 }),
    donde: "La página que elige el idioma",
    ver: "El rótulo «Simulación · no operativo» arriba, en español y en inglés a la vez, y los dos enlaces de idioma.",
  },
  {
    clave: "404-rotulo",
    titulo: "La 404: rótulo bilingüe",
    ruta: "/no-existe",
    ancho: 380,
    tema: "oscuro",
    recorte: async () => ({ x: 0, y: 0, width: 380, height: 520 }),
    donde: "Una dirección que no existe",
    ver: "El mismo rótulo bilingüe arriba y el mensaje en los dos idiomas, con el camino de vuelta.",
  },
  {
    clave: "saltar-al-contenido",
    titulo: "«Saltar al contenido», al pulsar Tab",
    ruta: "/es",
    ancho: 1280,
    tema: "oscuro",
    accion: async (page) => page.keyboard.press("Tab"),
    recorte: async () => ({ x: 0, y: 0, width: 1280, height: 160 }),
    donde: "Arriba a la izquierda, con el primer Tab",
    ver: "Aparece el enlace «Saltar al contenido» con su anillo de foco; con el ratón no se ve. Mientras tiene el foco tapa el principio del rótulo «Simulación · no operativo» (el patrón habitual de este enlace); al seguir con Tab, el rótulo vuelve entero. Dime si prefieres que baje por debajo del rótulo.",
  },
  ...["oscuro", "claro"].map((tema) => ({
    clave: `lienzo-foco-${tema}`,
    titulo: `Agente: anillo de foco del lienzo (${tema})`,
    ruta: "/es/agente",
    ancho: 1280,
    tema,
    accion: async (page) => {
      await page.keyboard.press("Tab");
      await page.locator('[data-sel-id="decision"]').focus();
    },
    recorte: async (page) => {
      const n = page.locator('[data-sel-id="decision"]');
      await n.scrollIntoViewIfNeeded();
      return marco(n, 48);
    },
    donde: "El lienzo del grafo, con el teclado sobre «decision»",
    ver: "Un anillo de foco visible alrededor del nodo, distinto del relleno de la selección (que sigue en «extractor»).",
  })),
  {
    clave: "capa-activa",
    titulo: "Agente en el teléfono: la capa activa subrayada",
    ruta: "/es/agente",
    ancho: 380,
    tema: "oscuro",
    recorte: async (page) => {
      const b = page.locator("button[aria-current=true]").first();
      const fila = b.locator("xpath=..");
      await fila.scrollIntoViewIfNeeded();
      return marco(fila, 12);
    },
    donde: "El índice de capas sobre el lienzo, en 380 px",
    ver: "La capa activa con borde claro y subrayada; las demás sin subrayado. No depende solo del color.",
  },
  ...["oscuro", "claro"].flatMap((tema) =>
    [false, true].map((movido) => ({
      clave: `volver-${movido ? "activo" : "deshabilitado"}-${tema}`,
      titulo: `Playground: «Volver al plan» ${movido ? "habilitado" : "deshabilitado"} (${tema})`,
      ruta: "/es/playground",
      ancho: 1280,
      tema,
      accion: movido
        ? async (page) =>
            page.getByRole("slider", { name: /Confianza mínima/ }).fill("0.9")
        : undefined,
      recorte: async (page) => {
        const b = page.getByRole("button", { name: /Volver al plan/ });
        await b.scrollIntoViewIfNeeded();
        return marco(b.locator("xpath=.."), 12);
      },
      donde: "Al pie del juego, junto a la línea de estado",
      ver: movido
        ? "Con un umbral movido: borde continuo."
        : "En los valores del plan: borde punteado, además de más tenue.",
    })),
  ),
  {
    clave: "spike-citas",
    titulo:
      "Agente, experto: de qué línea del código sale la lectura del spike",
    ruta: "/es/agente?perfil=experto",
    ancho: 1280,
    tema: "oscuro",
    recorte: async (page) => {
      const p = page.getByText("Leído del código del spike", { exact: false });
      await p.scrollIntoViewIfNeeded();
      return marco(p, 16);
    },
    donde: "Bajo el lienzo del spike, solo como experto",
    ver: "Una línea: «Leído del código del spike: umbral spike.py:44 · regla spike.py:198 · …», cada referencia en mono, sin enlace.",
  },
  {
    clave: "caso-en-su-paso",
    titulo: "Playground → caso: abre en el paso donde el camino se separa",
    ruta: "/es/playground",
    ancho: 1280,
    tema: "oscuro",
    accion: async (page) => {
      await page.getByRole("slider", { name: /Alto costo/ }).fill("1600");
      // Corrida de 200 (S3): A-007 es el primero de los doce que U2 en 1600 deja salir sin persona.
      await page.locator('#cambios [data-caso="A-007"] a').click();
      await page.waitForURL(/caso\/A-007#paso-\d+$/);
    },
    recorte: async () => ({ x: 0, y: 0, width: 1280, height: 900 }),
    donde: "U2 en 1600, «ver su traza» de A-007",
    ver: "El caso A-007 abierto con su paso de decisión arriba de la ventana (no al principio de la página).",
  },
];

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
const navegador = await chromium.launch();
const recortes = [];
for (const c of CAMBIOS) {
  const ctx = await navegador.newContext({
    viewport: { width: c.ancho, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const sep = c.ruta.includes("?") ? "&" : "?";
  await page.goto(`${V}${c.ruta}${sep}tema=${c.tema}`);
  await asentar(page);
  if (c.accion) {
    await c.accion(page);
    await asentar(page);
  }
  const clip = await c.recorte(page);
  const archivo = `cambio-${c.clave}.jpg`;
  await page.screenshot({
    path: join(destino, archivo),
    clip,
    type: "jpeg",
    quality: 70,
  });
  recortes.push({
    ...c,
    archivo,
    url: new URL(page.url()).pathname + new URL(page.url()).hash,
  });
  await ctx.close();
}

// ── el registro de la pasada completa ──────────────────────────────────────────────────────────────────
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
const miradas = readdirSync(pasada)
  .filter((d) => existsSync(join(pasada, d, "registro.json")))
  .sort();
const registro = miradas.map((m) => {
  const r = JSON.parse(readFileSync(join(pasada, m, "registro.json"), "utf8"));
  return {
    ...r,
    pares: r.pares.map((p) => ({
      ...p,
      sha256_vitrina: sha(join(pasada, m, p.vitrina)),
      sha256_maqueta: sha(join(pasada, m, p.maqueta)),
    })),
  };
});
// Miniatura de la parte de arriba de cada encuadre de la vitrina (240 px de ancho, los primeros 1.200 px de alto).
const mini = await navegador.newContext({
  viewport: { width: 240, height: 400 },
});
const pm = await mini.newPage();
for (const r of registro)
  for (const p of r.pares) {
    const datos = readFileSync(join(pasada, r.mirada, p.vitrina)).toString(
      "base64",
    );
    await pm.setContent(
      `<body style="margin:0;background:#000"><img id="i" style="display:block;width:240px" src="data:image/jpeg;base64,${datos}"></body>`,
    );
    await pm.waitForFunction(() => document.getElementById("i").complete);
    const alto = await pm.evaluate(
      () => document.getElementById("i").getBoundingClientRect().height,
    );
    p.miniatura = `mini-${r.mirada}-${p.vitrina}`;
    await pm.screenshot({
      path: join(destino, p.miniatura),
      clip: {
        x: 0,
        y: 0,
        width: 240,
        height: Math.min(alto, Math.round((1200 * 240) / p.ancho)),
      },
      type: "jpeg",
      quality: 55,
    });
  }
await mini.close();
await navegador.close();
servidor.close();

writeFileSync(
  join(destino, "registro.json"),
  `${JSON.stringify(
    {
      nota: "Pasada de capturas de cierre del S2 (AU-S2-12): cada encuadre con su huella; las capturas enteras viven fuera del repo. Lo genera scripts/registro-cierre.mjs.",
      miradas: registro,
      cambios: recortes.map(({ clave, titulo, url, archivo }) => ({
        clave,
        titulo,
        url,
        archivo,
      })),
    },
    null,
    2,
  )}\n`,
);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pares = registro.flatMap((r) =>
  r.pares.map((p) => ({ ...p, mirada: r.mirada })),
);
const mediciones = registro.flatMap((r) => r.mediciones);
const interacciones = registro.flatMap((r) => r.interacciones);
const fallas = registro.flatMap((r) => r.fallas);
const filasMatriz = recortes
  .map(
    (c, i) =>
      `<tr><td>${i + 1}</td><td><a href="#${c.clave}">${esc(c.titulo)}</a></td><td>${esc(c.donde)}</td><td>${esc(c.ver)}</td></tr>`,
  )
  .join("\n");
const figuras = recortes
  .map(
    (c) =>
      `<section class="cambio" id="${c.clave}"><h3>${esc(c.titulo)}</h3><p><code>${esc(c.url)}</code> · ${c.ancho} px · ${c.tema}</p><p>${esc(c.ver)}</p><img loading="lazy" src="${c.archivo}" alt="${esc(c.titulo)}"></section>`,
  )
  .join("\n");
const minis = pares
  .map(
    (p) =>
      `<figure><img loading="lazy" src="${p.miniatura}" alt="${esc(`${p.pantalla} ${p.ancho} px ${p.tema} ${p.idioma} ${p.perfil}`)}"><figcaption>${esc(p.pantalla)} · ${p.ancho} · ${p.tema} · ${p.idioma}${p.perfil === "experto" ? " · experto" : ""}<br><code title="SHA-256 de la captura entera">${p.sha256_vitrina.slice(0, 12)}…</code></figcaption></figure>`,
  )
  .join("\n");
const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cierre del S2 · capturas</title>
<style>
:root{color-scheme:dark;--fondo:#0b0c0f;--sup:#191b1d;--linea:#2c2e31;--t1:#eceff3;--t2:#b8bbbe}
body{margin:0;background:var(--fondo);color:var(--t1);font:15px/1.6 system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:24px;margin:0 0 8px}h2{font-size:20px;margin:48px 0 8px;padding-top:16px;border-top:1px solid var(--linea)}h3{font-size:16px;margin:32px 0 4px}
p{color:var(--t2);max-width:80ch;margin:4px 0}code{font:12px ui-monospace,monospace}a{color:var(--t1)}
.cambio img{max-width:100%;height:auto;border:1px solid var(--linea);border-radius:6px;display:block;margin-top:8px}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:8px}th,td{border-top:1px solid var(--linea);padding:8px;text-align:left;vertical-align:top}th{color:var(--t2);font-weight:500}
.minis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:12px}
.minis figure{margin:0}.minis img{width:100%;height:auto;border:1px solid var(--linea);border-radius:4px;display:block}.minis figcaption{font-size:11px;color:var(--t2);margin-top:4px;line-height:1.4}
ul{padding-left:20px;font-size:13px;color:var(--t2)}
</style>
</head>
<body>
<main>
<h1>¿Apruebas cómo se ven los cambios de la auditoría? Cada uno está recortado abajo, con lo que deberías ver.</h1>
<p>Cambios de forma que dejó la Fase 2 de la auditoría del sprint 2, recortados de la vitrina construida (export estático, ${recortes.length} recortes a doble densidad). Debajo, el registro de la pasada de capturas de cierre: ${pares.length} pares de las 7 pantallas contra su maqueta, cada encuadre con su huella.</p>
<h2 id="matriz">Qué mirar y qué deberías ver</h2>
<table><thead><tr><th>#</th><th>Cambio</th><th>Dónde</th><th>Qué debe verse</th></tr></thead><tbody>
${filasMatriz}
</tbody></table>
${figuras}
<h2>Registro de la pasada de cierre (AU-S2-12)</h2>
<p>${pares.length} pares (${pares.length * 2} encuadres) de las miradas ${registro.map((r) => r.mirada).join(", ")}: 380 px y escritorio, oscuro y claro, español e inglés, y el perfil experto. Las capturas enteras viven fuera del repo; <code>registro.json</code> guarda la huella SHA-256 de cada una. Aquí, la parte de arriba de cada encuadre de la vitrina.</p>
<p>Mediciones: ${mediciones.filter((x) => !x.desbordaDeLado && x.fuentes && !x.errores).length} de ${mediciones.length} sin desplazamiento lateral, con las fuentes cargadas y la consola limpia. Interacciones: ${interacciones.filter((x) => x.ok).length} de ${interacciones.length} cambian algo. Fallas del arnés: ${fallas.length}.</p>
<ul>${interacciones.map((x) => `<li>${x.ok ? "✓" : "✕"} ${esc(x.nombre)}</li>`).join("")}</ul>
<div class="minis">
${minis}
</div>
<p>Generado por <code>node scripts/registro-cierre.mjs --pasada &lt;carpeta&gt;</code> sobre el export de <code>pnpm build</code>. Se regenera; no se edita a mano.</p>
</main>
</body>
</html>
`;
writeFileSync(join(destino, "index.html"), html);
console.log(
  `registro-cierre: ${recortes.length} cambios · ${pares.length} pares · ${mediciones.length} mediciones · ${interacciones.filter((x) => x.ok).length}/${interacciones.length} interacciones · ${fallas.length} fallas`,
);
if (fallas.length) {
  for (const f of fallas) console.error(`  - ${f}`);
  process.exit(1);
}
