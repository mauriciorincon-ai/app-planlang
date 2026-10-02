/**
 * Barridos del paquete de la vitrina para hoja-de-vida (ADR-009), sobre el árbol que se copia. Funciones puras: reciben
 * el contenido y la lista de archivos, devuelven las fallas nombradas. Las corre `scripts/paquete-vitrina.ts` y las
 * prueba `tests/unit/paquete/barridos.test.ts` (cada regla con su caso en rojo).
 *
 * Bajo `/piezas/planlang` en hoja-de-vida, un recurso sin la base pide a su raíz (otro sitio), un enlace sin `.html` lo
 * intercepta su proxy de idioma, y cualquier dirección de afuera rompe la regla de cero enlaces y la de que ningún
 * visitante sale del origen. Lo que la vitrina no puede llevar: `localhost` horneado, Sentry, dominios de despliegue,
 * la maqueta, ni las cargas RSC (`.txt`) que solo pediría una navegación con `next/link`.
 */

export const BASE = "/piezas/planlang";

const DOMINIOS = /vercel[.]app|workers[.]dev|pages[.]dev/;
const EXTERNO = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
const ROTULO = {
  es: "Simulación · no operativo",
  en: "Simulation · not operational",
} as const;

export interface Archivo {
  /** Ruta dentro del paquete, sin barra inicial (`es/plan.html`). */
  ruta: string;
  texto: string;
}

/** Los valores de los atributos que piden algo: `href`, `src`, `srcset` (cada candidato), `action`, `poster`. */
export function direcciones(
  html: string,
): { atributo: string; valor: string; etiqueta: string }[] {
  const out: { atributo: string; valor: string; etiqueta: string }[] = [];
  for (const [, etiqueta, attrs] of html.matchAll(
    /<([a-zA-Z][\w-]*)\b([^>]*)>/g,
  ))
    for (const [, atributo, valor] of (attrs ?? "").matchAll(
      /\s(href|src|srcset|action|poster)="([^"]*)"/g,
    )) {
      const valores =
        atributo === "srcset"
          ? valor!.split(",").map((c) => c.trim().split(/\s+/)[0]!)
          : [valor!];
      for (const v of valores)
        out.push({
          atributo: atributo!,
          valor: v,
          etiqueta: etiqueta!.toLowerCase(),
        });
    }
  return out;
}

/** El archivo del paquete que sirve una dirección interna (`/piezas/planlang/es/plan.html#x` → `es/plan.html`). */
export function archivoDe(valor: string): string {
  return decodeURIComponent(valor.split(/[?#]/)[0]!.slice(BASE.length + 1));
}

/** Reglas sobre el HTML de una página. `existe` dice si una ruta del paquete existe. */
export function barrerHtml(
  a: Archivo,
  existe: (ruta: string) => boolean,
): string[] {
  const fallas: string[] = [];
  for (const d of direcciones(a.texto)) {
    const v = d.valor;
    if (v === "" || v.startsWith("#") || v.startsWith("data:")) continue;
    if (EXTERNO.test(v) || /^(mailto|tel|javascript):/i.test(v)) {
      fallas.push(
        `${a.ruta}: ${d.etiqueta}[${d.atributo}] sale del paquete («${v}»)`,
      );
      continue;
    }
    if (!v.startsWith("/")) {
      fallas.push(
        `${a.ruta}: ${d.etiqueta}[${d.atributo}] relativo («${v}»): bajo hoja-de-vida no se resuelve igual`,
      );
      continue;
    }
    if (!v.startsWith(`${BASE}/`)) {
      fallas.push(
        `${a.ruta}: ${d.etiqueta}[${d.atributo}] sin la base ${BASE} («${v}»)`,
      );
      continue;
    }
    const destino = archivoDe(v);
    const ultimo = destino.split("/").at(-1) ?? "";
    if (d.etiqueta === "a" && !ultimo.includes(".")) {
      fallas.push(
        `${a.ruta}: enlace sin extensión («${v}»): el proxy de idioma de hoja-de-vida lo intercepta`,
      );
      continue;
    }
    if (!existe(destino))
      fallas.push(
        `${a.ruta}: ${d.etiqueta}[${d.atributo}] pide «${v}», que no está en el paquete`,
      );
  }
  // El rótulo de la simulación, en el idioma de la página (la raíz los lleva los dos).
  const idioma = a.ruta.startsWith("en")
    ? "en"
    : a.ruta.startsWith("es")
      ? "es"
      : null;
  const pagina = !a.ruta.startsWith("_") && !/^(404|_not-found)/.test(a.ruta);
  if (pagina) {
    const faltan = (idioma ? [ROTULO[idioma]] : [ROTULO.es, ROTULO.en]).filter(
      (r) => !a.texto.includes(r),
    );
    for (const r of faltan) fallas.push(`${a.ruta}: falta el rótulo «${r}»`);
  }
  return fallas;
}

/** `url()` de una hoja de estilos: relativo a la hoja, `data:`, o bajo la base. */
export function barrerCss(a: Archivo): string[] {
  const fallas: string[] = [];
  for (const [, crudo] of a.texto.matchAll(/url\(\s*([^)]*?)\s*\)/g)) {
    const v = crudo!.replace(/^["']|["']$/g, "");
    if (v.startsWith("data:") || v.startsWith("#")) continue;
    if (EXTERNO.test(v))
      fallas.push(`${a.ruta}: url() sale del paquete («${v}»)`);
    else if (v.startsWith("/") && !v.startsWith(`${BASE}/`))
      fallas.push(`${a.ruta}: url() sin la base ${BASE} («${v}»)`);
  }
  return fallas;
}

/** Lo que ningún archivo de texto del paquete puede llevar. */
export function barrerTexto(a: Archivo): string[] {
  const fallas: string[] = [];
  // En una página, cualquier mención (metadata con URL absoluta sin base); en el código, una URL completa: el
  // analizador de URL del runtime de Next compara con la palabra «localhost» y no apunta a ninguna parte.
  const local = a.ruta.endsWith(".html")
    ? /localhost|127\.0\.0\.1/
    : /\/\/(?:localhost|127\.0\.0\.1)\b/;
  if (local.test(a.texto)) fallas.push(`${a.ruta}: hornea localhost`);
  if (/sentry/i.test(a.texto)) fallas.push(`${a.ruta}: lleva Sentry`);
  if (DOMINIOS.test(a.texto))
    fallas.push(`${a.ruta}: publica un dominio de despliegue (regla 17)`);
  if (/(^|["'/])diseno\//.test(a.texto))
    fallas.push(`${a.ruta}: nombra la maqueta (diseno/)`);
  return fallas;
}

/** Lo que no viaja: la maqueta, documentos, mapas de fuente y las cargas RSC (`.txt` fuera de las licencias). */
export function barrerLista(rutas: readonly string[]): string[] {
  const fallas: string[] = [];
  for (const r of rutas) {
    if (r.startsWith("diseno/") || r.endsWith(".md"))
      fallas.push(`${r}: la maqueta y los documentos no viajan`);
    if (r.endsWith(".map")) fallas.push(`${r}: un mapa de fuente no viaja`);
    if (r.endsWith(".txt") && !r.startsWith("licencias/"))
      fallas.push(`${r}: carga RSC (solo la pediría next/link)`);
  }
  return fallas;
}
