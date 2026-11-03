// Capturas de planlang para el brochure de CV Viva (S8, devolución 026 punto 6): la próxima tanda ya no depende de la
// planeadora. Toma los estados de `docs/cv-viva/capturas.yaml` sobre `out/` (el export ya construido: `pnpm build`
// antes), servido en 127.0.0.1:3201 y cerrado al terminar. Cada captura: viewport 1024×640 a DPR 1,5 (archivo de
// 1536×960), tema claro, español, WebP de hasta 80 KB.
//
// Convenciones del arnés de la app (`scripts/capturar-vitrina.mjs`): entra por el índice (`/?elegir`), tema y perfil en
// la URL, espera `html[data-mono]` y las fuentes, y U2 se mueve con el teclado. Antes de cada toma:
//   - tapa en el DOM todo nombre de persona (el de quien aprobó un plan y los solicitantes inventados de los casos del
//     B) con un punto por letra: ninguna imagen muestra el nombre de una persona, ni siquiera inventado;
//   - mide: sin desplazamiento de lado, consola sin errores, y el texto de la página sin correo, enlace, `localhost`
//     ni los nombres de arriba. Una falla detiene el arnés nombrando la captura.
// Escribe en `dist/cv-viva/` (no se versiona): los WebP, una copia de `capturas.yaml` y `registro.json` con el peso y la
// huella de cada uno. Regla de la casa (2026-11-02): el servidor escucha solo en 127.0.0.1 y se cierra siempre.
//
// Uso: node scripts/capturas-cv-viva.mjs [--solo id,id] [--destino dist/cv-viva]
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { parse } from "yaml";
import { escuchar, servidor } from "./servidor-estatico.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(raiz, "out");
const FUENTE = join(raiz, "docs", "cv-viva", "capturas.yaml");
const PUERTO = 3201;
const VIEWPORT = { width: 1024, height: 640 };
const ESCALA = 1.5;
const MAX_BYTES = 80 * 1024;
const CALIDADES = [0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const destino = resolve(raiz, arg("destino", "dist/cv-viva"));
// Regla 17-bis (b): solo escribe bajo `dist/` (no se versiona); un `--destino` que salga de ahí aborta.
if (
  relative(join(raiz, "dist"), destino).startsWith("..") ||
  isAbsolute(relative(join(raiz, "dist"), destino))
) {
  console.error(
    `capturas-cv-viva: --destino ${destino} sale de dist/; solo escribe ahí. Aborto.`,
  );
  process.exit(1);
}
const solo = arg("solo", "").split(",").filter(Boolean);

if (!existsSync(join(OUT, "es.html"))) {
  console.error("capturas-cv-viva: falta out/ — corre `pnpm build` antes.");
  process.exit(1);
}
const config = parse(readFileSync(FUENTE, "utf8"));
const estados = [
  { id: "portada", ...config.portada },
  ...config.capturas.map((c) => ({ id: c.funcionalidad, ...c })),
].filter((e) => solo.length === 0 || solo.includes(e.id));
if (estados.length === 0) {
  console.error(`capturas-cv-viva: ningún estado coincide con --solo ${solo}.`);
  process.exit(1);
}

/** Un nombre de persona: dos o más palabras con mayúscula inicial, sin cifras («Sergei Karvane Sarkento»). */
const esNombre = (v) =>
  typeof v === "string" && /^\p{Lu}[\p{L}'’-]+( \p{Lu}[\p{L}'’-]+)+$/u.test(v);

/** Recoge, bajo las claves que guardan personas, los nombres de un dato (casos y listas de control). */
function recolectar(o, nombres) {
  if (Array.isArray(o)) {
    for (const x of o) recolectar(x, nombres);
    return;
  }
  if (!o || typeof o !== "object") return;
  for (const [k, v] of Object.entries(o)) {
    if (/^(nombre|titular_\w+)$/.test(k) && esNombre(v)) nombres.add(v);
    else if (k === "alias" && Array.isArray(v)) {
      for (const a of v) if (esNombre(a)) nombres.add(a);
    } else recolectar(v, nombres);
  }
}

/**
 * Los nombres de persona que ninguna imagen puede mostrar, ni siquiera inventados: quien aprobó un plan, los
 * solicitantes y titulares de los casos del B y las personas de sus listas de control.
 */
function nombresDePersona() {
  const nombres = new Set();
  const planes = join(raiz, "plans");
  for (const d of readdirSync(planes, { withFileTypes: true }))
    if (d.isDirectory())
      for (const f of readdirSync(join(planes, d.name)))
        if (/^v[\d.]+\.json$/.test(f)) {
          const p = JSON.parse(readFileSync(join(planes, d.name, f), "utf8"));
          if (typeof p.aprobado_por === "string") nombres.add(p.aprobado_por);
        }
  for (const dir of ["casos/demo-b", "listas"])
    for (const f of readdirSync(join(raiz, "data", dir)))
      if (f.endsWith(".json"))
        recolectar(
          JSON.parse(readFileSync(join(raiz, "data", dir, f), "utf8")),
          nombres,
        );
  return [...nombres];
}
const NOMBRES = nombresDePersona();
console.log(
  `capturas-cv-viva: ${NOMBRES.length} nombres de persona que se tapan en el DOM antes de cada toma`,
);

const s = servidor(OUT, "capturas-cv-viva");
await escuchar(s, PUERTO);
const V = `http://127.0.0.1:${PUERTO}`;
console.log(
  `capturas-cv-viva: lee ${OUT} y escribe ${destino} · sirve en 127.0.0.1:${PUERTO} (se cierra al terminar) · ${estados.length} estado(s)`,
);

const navegador = await chromium.launch();
const registro = [];
const fallas = [];
let cerrado = false;
async function cerrar() {
  if (cerrado) return;
  cerrado = true;
  await navegador.close().catch(() => {});
  await new Promise((ok) => s.close(ok));
}
process.on("SIGINT", async () => {
  await cerrar();
  process.exit(130);
});

/** Un PNG a WebP con el `canvas` de Chromium (sin dependencias nuevas): la calidad baja hasta que cabe en 80 KB. */
async function aWebp(paginaVacia, png) {
  for (const q of CALIDADES) {
    const b64 = await paginaVacia.evaluate(
      async ([datos, calidad]) => {
        const img = new Image();
        img.src = `data:image/png;base64,${datos}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        return c.toDataURL("image/webp", calidad).split(",")[1];
      },
      [png.toString("base64"), q],
    );
    const buf = Buffer.from(b64, "base64");
    if (buf.length <= MAX_BYTES) return { buf, calidad: q };
  }
  return null;
}

try {
  const vacia = await (await navegador.newContext()).newPage();
  mkdirSync(destino, { recursive: true });
  for (const e of estados) {
    const ctx = await navegador.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: ESCALA,
      reducedMotion: "reduce",
      locale: "es-CO",
    });
    const page = await ctx.newPage();
    const errores = [];
    page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
    page.on("pageerror", (x) => errores.push(String(x)));
    // Entra por el índice y de ahí a la pantalla, con el tema y el perfil en la URL.
    await page.goto(`${V}/?elegir`);
    await page.goto(`${V}${e.ruta}?tema=claro&perfil=${e.perfil}`);
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-mono"),
    );
    await page.evaluate(() => document.fonts.ready);
    if (e.accion === "u2-a-1600") {
      await page.locator("#w-U2 input[type=range]").focus();
      for (let k = 0; k < 6; k++) await page.keyboard.press("ArrowRight");
    }
    // Tapa los nombres de persona: un punto por letra, el espacio se queda.
    await page.evaluate((nombres) => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode())
        for (const nombre of nombres)
          if (n.nodeValue.includes(nombre))
            n.nodeValue = n.nodeValue
              .split(nombre)
              .join(nombre.replace(/\S/g, "•"));
    }, NOMBRES);
    // El ancla: el encabezado (h2–h4) cuyo texto cumple la expresión; arriba si no hay.
    if (e.ancla) {
      const hallado = await page.evaluate((ancla) => {
        const re = new RegExp(ancla);
        const h = [...document.querySelectorAll("h2, h3, h4")].find((x) =>
          re.test((x.textContent ?? "").replace(/\s+/g, " ").trim()),
        );
        if (!h) return false;
        window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 24);
        return true;
      }, e.ancla);
      if (!hallado) fallas.push(`${e.id}: no hay un encabezado /${e.ancla}/`);
    }
    await page.waitForTimeout(400);
    const medidas = await page.evaluate(
      ({ nombres }) => {
        const d = document.documentElement;
        const texto = document.body.innerText;
        return {
          desborda: d.scrollWidth > d.clientWidth,
          correo: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(texto),
          enlace: /https?:\/\//.test(texto),
          local: /localhost|127\.0\.0\.1/.test(texto),
          nombre: nombres.find((n) => texto.includes(n)) ?? null,
        };
      },
      { nombres: NOMBRES },
    );
    if (medidas.desborda) fallas.push(`${e.id}: la página se desplaza de lado`);
    if (medidas.correo) fallas.push(`${e.id}: el texto trae un correo`);
    if (medidas.enlace) fallas.push(`${e.id}: el texto trae un enlace`);
    if (medidas.local) fallas.push(`${e.id}: el texto trae localhost`);
    if (medidas.nombre)
      fallas.push(`${e.id}: el texto trae un nombre de persona`);
    if (errores.length)
      fallas.push(`${e.id}: consola con errores: ${errores[0]}`);
    const png = await page.screenshot({ type: "png" });
    await ctx.close();
    const w = await aWebp(vacia, png);
    if (!w) {
      fallas.push(`${e.id}: no cabe en 80 KB sin bajar de la calidad 0,5`);
      continue;
    }
    writeFileSync(join(destino, e.archivo), w.buf);
    registro.push({
      id: e.id,
      archivo: e.archivo,
      ruta: e.ruta,
      perfil: e.perfil,
      ancho: VIEWPORT.width * ESCALA,
      alto: VIEWPORT.height * ESCALA,
      calidad: w.calidad,
      bytes: w.buf.length,
      sha256: createHash("sha256").update(w.buf).digest("hex"),
    });
    console.log(
      `✓ ${e.archivo}: ${(w.buf.length / 1024).toFixed(1)} KB · calidad ${w.calidad}`,
    );
  }
} finally {
  await cerrar();
}
if (fallas.length) {
  console.error(
    `capturas-cv-viva: ${fallas.length} falla(s):\n  - ${fallas.join("\n  - ")}`,
  );
  process.exit(1);
}
copyFileSync(FUENTE, join(destino, "capturas.yaml"));
writeFileSync(
  join(destino, "registro.json"),
  `${JSON.stringify({ formato: "planlang-capturas-cv-viva/v1", capturas: registro }, null, 2)}\n`,
);
console.log(
  `capturas-cv-viva: ${registro.length} captura(s) de ${VIEWPORT.width * ESCALA}×${VIEWPORT.height * ESCALA} en ${destino}; servidor cerrado.`,
);
