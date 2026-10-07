// Arnés de CAPTURAS de la maqueta (Etapa de Diseño · pasada de capturas antes de cada mirada).
//
// Recorre cada página de docs/diseno/ SERVIDA (kit v1.37.0: nunca por file://; se entra por el índice) en
// estado × tema × idioma × ancho, guarda la
// captura a tamaño real y MIDE lo que la orden y el contrato del diagramador exigen:
//   - sin desplazamiento horizontal de página (scrollWidth ≤ clientWidth) en cada ancho (380 px);
//   - cada <text> de un SVG marcado [data-lienzo] queda dentro de su viewBox (G11);
//   - cada <text> de un nodo (.d-nodo) queda dentro de su caja, con 4 px de aire (ronda 2 de la
//     mirada 1: con tres letras a elegir, un nombre largo puede caber en una y no en otra);
//   - las fuentes ACTIVAS (--letra y --mono del estado) cargaron — sin respaldo del sistema;
//   - con --reducido, la página corre bajo `prefers-reduced-motion: reduce` y no hay animaciones
//     (document.getAnimations() vacío) tras interactuar;
//   - con --simular, repite cada captura en deuteranopía, protanopía, tritanopía y acromatopsia (CDP).
//
// Regla 17-bis (b): declara el árbol que lee y ABORTA si una página está fuera de docs/diseno/.
// Las capturas van a un directorio FUERA del repo (--salida), nunca se versionan.
//
// Uso: node scripts/capturar-maqueta.mjs --salida <dir> [--paginas a,b] [--anchos 380,1280]
//      [--temas oscuro,claro] [--idiomas es,en] [--perfiles lider,experto] [--simular] [--reducido] [--solo-medir]
//   --perfiles pulsa «Leer como» (button[data-perfil-set]) en las páginas que lo tienen; en las demás no hace nada.
import { mkdirSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { escuchar, servidor } from "./servidor-estatico.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arbol = join(raiz, "docs", "diseno");
const arg = (n, def) => {
  const i = process.argv.indexOf(`--${n}`);
  return i < 0 ? def : process.argv[i + 1];
};
const bandera = (n) => process.argv.includes(`--${n}`);

const salida = arg("salida");
if (!salida && !bandera("solo-medir")) {
  console.error(
    "capturar-maqueta: falta --salida <dir> (temporal, fuera del repo)",
  );
  process.exit(1);
}
if (salida && resolve(salida).startsWith(raiz + "/")) {
  console.error(
    "capturar-maqueta: --salida dentro del repo; las capturas no se versionan. Aborto.",
  );
  process.exit(1);
}
const paginas = (
  arg("paginas") ??
  readdirSync(arbol)
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""))
    .join(",")
)
  .split(",")
  .map((p) => join(arbol, p.endsWith(".html") ? p : `${p}.html`));
for (const p of paginas) {
  if (!resolve(p).startsWith(arbol + "/")) {
    console.error(`capturar-maqueta: ${p} está fuera de ${arbol}. Aborto.`);
    process.exit(1);
  }
}
const anchos = arg("anchos", "380,1280").split(",").map(Number);
const temas = arg("temas", "oscuro,claro").split(",");
const idiomas = arg("idiomas", "es,en").split(",");
const perfiles = arg("perfiles", "lider").split(",");
const SIMULACIONES = [
  "deuteranopia",
  "protanopia",
  "tritanopia",
  "achromatopsia",
];

console.log(`capturar-maqueta: árbol ${arbol}`);
console.log(`  páginas ${paginas.map((p) => basename(p)).join(" ")}`);
if (salida) mkdirSync(salida, { recursive: true });

// La maqueta se sirve por HTTP desde su árbol, como la verá quien la recorre (kit v1.37.0, README de diseño).
const sMaqueta = servidor(arbol, "capturar-maqueta");
const Q = `http://127.0.0.1:${await escuchar(sMaqueta)}`;

const navegador = await chromium.launch();
const fallas = [];
let n = 0;

const marcosDeTelefono = (pagina) =>
  pagina.frames().some((m) => m.url().includes("marco=telefono"));

async function medir(pagina, clave) {
  const r = await pagina.evaluate(() => {
    const el = document.documentElement;
    const out = {
      desborde: el.scrollWidth - el.clientWidth,
      fuera: [],
      fuentes: [],
      animaciones: document.getAnimations().length,
    };
    for (const svg of document.querySelectorAll("svg[data-lienzo]")) {
      const vb = svg.viewBox.baseVal;
      for (const t of svg.querySelectorAll("text")) {
        const b = t.getBBox();
        if (
          b.x < vb.x - 0.5 ||
          b.y < vb.y - 0.5 ||
          b.x + b.width > vb.x + vb.width + 0.5 ||
          b.y + b.height > vb.y + vb.height + 0.5
        ) {
          out.fuera.push(
            `${svg.id || "svg"}: «${t.textContent.trim().slice(0, 30)}»`,
          );
        }
      }
    }
    for (const g of document.querySelectorAll("svg[data-lienzo] .d-nodo")) {
      const caja = g.querySelector(".caja");
      if (!caja) continue;
      const c = caja.getBBox();
      for (const t of g.querySelectorAll("text")) {
        if (t.getComputedTextLength() === 0) continue;
        const b = t.getBBox();
        if (b.x < c.x + 4 - 0.5 || b.x + b.width > c.x + c.width - 4 + 0.5) {
          out.fuera.push(
            `nodo «${t.textContent.trim().slice(0, 30)}» (${Math.round(b.x + b.width - (c.x + c.width - 4))} px de más)`,
          );
        }
      }
    }
    const raiz = getComputedStyle(document.documentElement);
    for (const v of ["--letra", "--mono"]) {
      const f = raiz
        .getPropertyValue(v)
        .split(",")[0]
        .trim()
        .replace(/^["']|["']$/g, "");
      if (f && !document.fonts.check(`16px "${f}"`)) out.fuentes.push(f);
    }
    return out;
  });
  if (r.desborde > 0)
    fallas.push(`${clave}: desplazamiento horizontal de ${r.desborde}px`);
  for (const f of r.fuera) fallas.push(`${clave}: texto fuera del lienzo ${f}`);
  for (const f of r.fuentes) fallas.push(`${clave}: fuente no cargada ${f}`);
  if (bandera("reducido") && r.animaciones > 0)
    fallas.push(
      `${clave}: ${r.animaciones} animaciones con movimiento reducido`,
    );
}

for (const ruta of paginas) {
  const nombre = basename(ruta, ".html");
  for (const ancho of anchos) {
    const contexto = await navegador.newContext({
      viewport: { width: ancho, height: ancho < 600 ? 780 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: bandera("reducido") ? "reduce" : "no-preference",
    });
    const pagina = await contexto.newPage();
    const cdp = await contexto.newCDPSession(pagina);
    // Se entra por el índice y se sigue SU enlace a la página (kit v1.37.0: nunca directo a una página interna);
    // si el índice no enlaza la página, la pasada falla, porque nadie llegaría a ella recorriendo la sala.
    await pagina.goto(`${Q}/`);
    if (basename(ruta) !== "index.html") {
      const enlace = pagina.locator(`a[href="${basename(ruta)}"]`).first();
      if (!(await enlace.count())) {
        console.error(
          `capturar-maqueta: el índice no enlaza ${basename(ruta)}. Aborto.`,
        );
        process.exit(1);
      }
      await Promise.all([
        pagina.waitForURL(`**/${basename(ruta)}`),
        enlace.click(),
      ]);
    }
    await pagina.evaluate(() => document.fonts.ready);
    const estados = await pagina.$$eval("button[data-estado]", (bs) =>
      bs.map((b) => b.getAttribute("data-estado")),
    );
    const lista = estados.length ? estados : ["unico"];
    const conPerfil = (await pagina.$$("button[data-perfil-set]")).length > 0;
    const listaPerfiles = conPerfil ? perfiles : ["lider"];
    for (const perfil of listaPerfiles) {
      for (const tema of temas) {
        for (const idioma of idiomas) {
          for (const estado of lista) {
            await pagina.evaluate(
              ({ tema, idioma, estado, perfil }) => {
                // Por los botones de sala cuando existen (así se sincronizan los teléfonos de sala y
                // el estado pulsado de la barra); si no, por atributo.
                const bt = document.querySelector(
                  `button[data-theme-set="${tema}"]`,
                );
                if (bt) bt.click();
                else document.documentElement.setAttribute("data-theme", tema);
                const bl = document.querySelector(
                  `button[data-lang-set="${idioma}"]`,
                );
                if (bl) bl.click();
                else {
                  document.documentElement.setAttribute("data-lang", idioma);
                  document.documentElement.lang = idioma;
                }
                const b = document.querySelector(`[data-estado="${estado}"]`);
                if (b) b.click();
                const bp = document.querySelector(
                  `button[data-perfil-set="${perfil}"]`,
                );
                if (
                  bp &&
                  document.documentElement.getAttribute("data-perfil") !==
                    perfil
                )
                  bp.click();
                window.scrollTo(0, 0);
              },
              { tema, idioma, estado, perfil },
            );
            // El cambio de perfil entra con un fundido corto; se espera a que termine (con movimiento
            // reducido no hay fundido y la medida exige 0 animaciones).
            if (conPerfil && !bandera("reducido"))
              await pagina.waitForTimeout(650);
            await pagina.evaluate(async () => {
              document.body.getBoundingClientRect();
              await document.fonts.ready;
            });
            // Teléfonos de sala (iframes): se espera cada marco por la API de Playwright (carga + fuentes).
            for (const marco of pagina.frames()) {
              if (
                marco === pagina.mainFrame() ||
                !marco.url().includes("marco=telefono")
              )
                continue;
              await marco.waitForLoadState("load").catch(() => {});
              await marco.evaluate(() => document.fonts.ready).catch(() => {});
            }
            await pagina.waitForTimeout(marcosDeTelefono(pagina) ? 400 : 80);
            const clave =
              `${nombre} · ${ancho}px · ${tema} · ${idioma} · ${estado}` +
              (conPerfil ? ` · ${perfil}` : "");
            await medir(pagina, clave);
            const vistas = bandera("simular")
              ? ["ninguna", ...SIMULACIONES]
              : ["ninguna"];
            for (const vista of vistas) {
              await cdp.send("Emulation.setEmulatedVisionDeficiency", {
                type: vista === "ninguna" ? "none" : vista,
              });
              if (salida && !bandera("solo-medir")) {
                const sufijo = vista === "ninguna" ? "" : `-${vista}`;
                const pf = conPerfil && perfil !== "lider" ? `-${perfil}` : "";
                await pagina.screenshot({
                  path: join(
                    salida,
                    `${nombre}-${ancho}-${tema}-${idioma}-${estado}${pf}${sufijo}.png`,
                  ),
                  fullPage: true,
                });
                n += 1;
              }
            }
            await cdp.send("Emulation.setEmulatedVisionDeficiency", {
              type: "none",
            });
          }
        }
      }
    }
    await contexto.close();
  }
}
await navegador.close();
sMaqueta.close();

console.log(`  capturas: ${n}${salida ? ` en ${salida}` : ""}`);
if (fallas.length) {
  console.error(`  FALLAS (${fallas.length}):`);
  for (const f of fallas) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(
  "  medidas: 0 desbordes · 0 textos fuera del lienzo · fuentes cargadas" +
    (bandera("reducido") ? " · 0 animaciones" : ""),
);
