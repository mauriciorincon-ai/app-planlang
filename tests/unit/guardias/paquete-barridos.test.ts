/**
 * Barridos del paquete de la vitrina para hoja-de-vida (ADR-009, `scripts/paquete/barridos.ts`). Cada regla con su
 * caso en rojo: un recurso sin la base, un enlace sin `.html` (el proxy de idioma de hoja-de-vida lo intercepta), una
 * dirección de afuera, un archivo que falta, una página sin rótulo, un `url()` sin base, localhost horneado, Sentry,
 * un dominio de despliegue, la maqueta y las cargas RSC.
 */
import { describe, expect, it } from "vitest";
import {
  archivoDe,
  barrerCss,
  barrerHtml,
  barrerJs,
  barrerLista,
  barrerTexto,
  direcciones,
} from "../../../scripts/paquete/barridos";

const B = "/piezas/planlang";
const ROT_ES = "Simulación · no operativo";
const presentes = new Set([
  "es/plan.html",
  "_next/static/chunks/a.js",
  "_next/static/chunks/a.css",
  "icon.svg",
  "licencias/OFL-inter.txt",
]);
const existe = (r: string) => presentes.has(r);
const pagina = (cuerpo: string, ruta = "es/brecha.html") => ({
  ruta,
  texto: `<html><head><link rel="stylesheet" href="${B}/_next/static/chunks/a.css"><script src="${B}/_next/static/chunks/a.js"></script></head><body><p>${ROT_ES}</p>${cuerpo}</body></html>`,
});

describe("las direcciones de una página", () => {
  it("lee href, src y cada candidato de srcset, con su etiqueta", () => {
    expect(
      direcciones(
        `<a href="/x.html">x</a><img src="/a.png" srcset="/a1.png 1x, /a2.png 2x">`,
      ).map((d) => [d.etiqueta, d.atributo, d.valor]),
    ).toEqual([
      ["a", "href", "/x.html"],
      ["img", "src", "/a.png"],
      ["img", "srcset", "/a1.png"],
      ["img", "srcset", "/a2.png"],
    ]);
    expect(archivoDe(`${B}/es/plan.html#b3`)).toBe("es/plan.html");
  });
});

describe("barrerHtml", () => {
  it("una página bien hecha no tiene fallas: base, .html, archivos presentes, anclas y licencias", () => {
    expect(
      barrerHtml(
        pagina(
          `<a href="${B}/es/plan.html#b3">Plan</a><a href="#b1">1</a><a href="${B}/licencias/OFL-inter.txt">OFL</a><link rel="icon" href="${B}/icon.svg?v=1">`,
        ),
        existe,
      ),
    ).toEqual([]);
  });

  it("rojo: un enlace sin .html, una dirección sin la base, una de afuera, una relativa y un archivo que falta", () => {
    const f = barrerHtml(
      pagina(
        `<a href="${B}/es/plan">a</a><a href="/es/plan.html">b</a><a href="https://ejemplo.invalid/">c</a><img src="//cdn.invalid/x.png"><a href="es/plan.html">d</a><script src="${B}/_next/static/chunks/z.js"></script>`,
      ),
      existe,
    ).join("\n");
    expect(f).toMatch(/enlace sin extensión/);
    expect(f).toMatch(/sin la base \/piezas\/planlang/);
    expect(f).toMatch(/a\[href\] sale del paquete/);
    expect(f).toMatch(/img\[src\] sale del paquete/);
    expect(f).toMatch(/relativo/);
    expect(f).toMatch(/z\.js», que no está en el paquete/);
  });

  it("rojo: una página sin su rótulo; la raíz necesita los dos idiomas", () => {
    expect(
      barrerHtml({ ruta: "en/plan.html", texto: "<p>hola</p>" }, existe),
    ).toEqual(["en/plan.html: falta el rótulo «Simulation · not operational»"]);
    expect(
      barrerHtml({ ruta: "index.html", texto: `<p>${ROT_ES}</p>` }, existe),
    ).toEqual(["index.html: falta el rótulo «Simulation · not operational»"]);
  });

  it("rojo: la 404 también lleva el rótulo, en los dos idiomas (AU-S2-13; antes estaba exenta)", () => {
    expect(
      barrerHtml({ ruta: "404.html", texto: "<p>no existe</p>" }, existe),
    ).toEqual([
      "404.html: falta el rótulo «Simulación · no operativo»",
      "404.html: falta el rótulo «Simulation · not operational»",
    ]);
    expect(
      barrerHtml({ ruta: "_not-found.html", texto: "<p>x</p>" }, existe),
    ).toEqual([]);
  });
});

describe("barrerCss, barrerTexto y barrerLista", () => {
  it("url() relativo, data: o bajo la base pasa; de afuera o sin base, no", () => {
    expect(
      barrerCss({
        ruta: "a.css",
        texto: `@font-face{src:url(../media/x.woff2)}.y{background:url("data:image/png;base64,AA")}.z{background:url(${B}/a.png)}`,
      }),
    ).toEqual([]);
    expect(
      barrerCss({
        ruta: "a.css",
        texto: `.a{background:url(/a.png)}.b{background:url("https://cdn.invalid/b.png")}`,
      }),
    ).toEqual([
      "a.css: url() sin la base /piezas/planlang («/a.png»)",
      "a.css: url() sale del paquete («https://cdn.invalid/b.png»)",
    ]);
  });

  it("localhost horneado en una página o como URL en el código; la palabra sola en el código no", () => {
    expect(
      barrerTexto({ ruta: "es.html", texto: '<meta content="localhost">' }),
    ).toEqual(["es.html: hornea localhost"]);
    expect(
      barrerTexto({ ruta: "a.js", texto: 'fetch("http://localhost:3000/x")' }),
    ).toEqual(["a.js: hornea localhost"]);
    // El analizador de URL del runtime de Next compara con la palabra: no apunta a ninguna parte.
    expect(
      barrerTexto({ ruta: "a.js", texto: '"localhost"===s.host&&(s.host="")' }),
    ).toEqual([]);
  });

  it("rojo: Sentry, un dominio de despliegue y la maqueta", () => {
    expect(barrerTexto({ ruta: "a.js", texto: "Sentry.init({})" })).toEqual([
      "a.js: lleva Sentry",
    ]);
    expect(
      barrerTexto({
        ruta: "a.html",
        texto: "https://x.vercel" + ".app",
      }).join(),
    ).toMatch(/dominio de despliegue/);
    expect(
      barrerTexto({ ruta: "a.html", texto: '<a href="/diseno/01.html">' }),
    ).toEqual(["a.html: nombra la maqueta (diseno/)"]);
  });

  it("rojo: la maqueta, documentos, mapas de fuente y cargas RSC no viajan; las licencias sí", () => {
    expect(
      barrerLista([
        "es.html",
        "licencias/OFL-inter.txt",
        "es.txt",
        "__next._tree.txt",
        "diseno/01.html",
        "LEEME.md",
        "_next/a.js.map",
      ]),
    ).toEqual([
      "es.txt: carga RSC (solo la pediría next/link)",
      "__next._tree.txt: carga RSC (solo la pediría next/link)",
      "diseno/01.html: la maqueta y los documentos no viajan",
      "LEEME.md: la maqueta y los documentos no viajan",
      "_next/a.js.map: un mapa de fuente no viaja",
    ]);
  });
});

describe("los huecos que la auditoría encontró (AU-S2-B32)", () => {
  it("rojo: imagesrcset, xlink:href y meta refresh que salen del paquete", () => {
    const f = barrerHtml(
      pagina(
        `<link rel="preload" as="image" imagesrcset="https://cdn.invalid/a.png 1x, ${B}/icon.svg 2x"><svg><use xlink:href="//otro.invalid/s.svg#i"></use></svg><meta http-equiv="refresh" content="0; url=https://fuera.invalid/">`,
      ),
      existe,
    ).join("\n");
    expect(f).toMatch(/link\[imagesrcset\] sale del paquete/);
    expect(f).toMatch(/use\[xlink:href\] sale del paquete/);
    expect(f).toMatch(/meta\[refresh\] sale del paquete/);
  });

  it('rojo: url() de afuera o sin base dentro de <style> y de style=""', () => {
    const f = barrerHtml(
      pagina(
        `<style>.x{background:url(https://fuera.invalid/f.png)}</style><div style="background:url(&quot;/sin-base.png&quot;)"></div><div style="background:url(${B}/icon.svg)"></div>`,
      ),
      existe,
    ).join("\n");
    expect(f).toMatch(/url\(\) sale del paquete/);
    expect(f).toMatch(/url\(\) sin la base/);
    expect(f.split("\n")).toHaveLength(2);
  });

  it("el JavaScript solo nombra hosts de la lista blanca del framework", () => {
    expect(
      barrerJs({
        ruta: "_next/static/chunks/a.js",
        texto:
          'x="http://www.w3.org/2000/svg";y="https://react.dev/errors/418";new URL("https://a@b")',
      }),
    ).toEqual([]);
    expect(
      barrerJs({
        ruta: "_next/static/chunks/a.js",
        texto:
          'fetch("https://telemetria.invalid/x");fetch("https://telemetria.invalid/y")',
      }),
    ).toEqual([
      "_next/static/chunks/a.js: el JavaScript nombra el host «telemetria.invalid», fuera de la lista blanca",
    ]);
  });
});
