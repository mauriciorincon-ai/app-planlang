# ADR-009 — El paquete de la vitrina para hoja-de-vida

**Summary (EN):** The showcase travels to hoja-de-vida as a static package copied in a content PR (hard rule 14):
the same export, built with `PLANLANG_PAQUETE=1` under `/piezas/planlang`, with explicit `.html` links (hoja-de-vida's
language proxy intercepts every path without a dot), in its own build folder, with a fixed build id and no Sentry.
`pnpm paquete:vitrina` runs a publication gate (M9, RF-09.2 and run fingerprints, records up to date, playground
parity), builds, checks diagram = graph on that export, lays the files out in hoja-de-vida's tree (vitrina without RSC
payloads, agent record, app export, proposed complement), sweeps every address and writes a SHA-256 manifest. A
Playwright project serves it the way hoja-de-vida would (no clean URLs) and crawls every link.

**Estado:** aceptado · **Fecha:** 2026-10-01 · **Sprint:** S2 «La vitrina»
**Cítese por tema:** «ADR del paquete para hoja-de-vida».
**Origen:** regla dura 14 del `CLAUDE.md` (cero enlaces con excepción acotada: la vitrina viaja por copia), orden
del S2, plan aprobado (fase 4).

## Contexto

- planlang no se publica (Vercel Authentication en todos los despliegues). Lo que el visitante ve es la **vitrina**,
  dentro de hoja-de-vida, como página de un proyecto: un paquete estático que llega por copia, en un PR de contenido
  que hace el usuario, junto con la ficha del agente A, los hechos de la app y el complemento de su ficha.
- hoja-de-vida es un sitio Next con next-intl: su proxy de idioma intercepta **toda ruta sin punto** (verificado al
  planear el S2). Una URL limpia (`/piezas/planlang/es/plan`) no llegaría nunca al archivo.
- La vitrina ya es un export de varias páginas con `<a>` absolutos desde la raíz (ADR-007, ADR-008); no usa
  `next/link`, así que no pide las cargas RSC (`.txt`) de la navegación del cliente.
- La vitrina normal carga Sentry solo con DSN (`instrumentation-client.ts`), pero el `import()` deja un chunk en el
  export aunque nunca se pida.

## Decisión

1. **Un solo código, dos builds.** Con `PLANLANG_PAQUETE=1`, `next.config.ts` fija la base
   (`basePath: "/piezas/planlang"`), una carpeta propia (`distDir: ".next-paquete"`: Next 16 exporta ahí, así que
   `out/` no se toca y los dos builds no se pisan), un id de build fijo y un alias de `@sentry/nextjs` a
   `src/lib/sin-sentry.ts`. El modo llega al código por `env` (también al cliente).
2. **Las rutas saben del modo.** `src/lib/ruta.ts` antepone `BASE_RUTA` y añade `SUFIJO_RUTA` (`.html`) en el paquete;
   la raíz (`(raiz)/page.tsx`), el 404 global y el script que elige idioma usan esas mismas piezas. Ningún enlace
   interno se escribe a mano.
3. **`pnpm paquete:vitrina`** (`scripts/paquete-vitrina.ts`), en orden y deteniéndose en la primera falla:
   - **gate de publicación:** `m9:reporte --verificar` · `trazas:verificar` (huellas, umbrales, RF-09.2) ·
     `fichas --verificar` · la paridad del playground con el informe;
   - **build** sin DSN ni variables de Sentry o Vercel, y **diagrama = grafo** sobre `.next-paquete/`;
   - **copia** a `dist/paquete-hoja-de-vida/` con el árbol de hoja-de-vida:
     - `public/piezas/planlang/`: la vitrina, sin las cargas RSC;
     - `content/agentes/planlang-demo-a.ficha-tecnica.json`;
     - `content/vitrina/planlang.brochure-export.json`;
     - `data/fichas/planlang.yaml`: el complemento propuesto, validado antes contra el espejo del
       `complementoSchema` de hoja-de-vida;
   - **barridos** (`scripts/paquete/barridos.ts`, funciones puras con su prueba en rojo). Toda dirección
     `href|src|srcset|action|poster` queda bajo la base y apunta a un archivo que existe; todo `<a>` lleva extensión.
     Nada de afuera ni relativo. `url()` de CSS relativo, `data:` o bajo la base. Sin localhost horneado, Sentry,
     dominios de despliegue ni maqueta. El rótulo «Simulación · no operativo» en cada página, en su idioma;
   - **manifiesto** `dist/paquete-hoja-de-vida/manifiesto.json` (`planlang-paquete/v1`): cada archivo con su
     SHA-256, el commit, si el árbol estaba limpio, las corridas, a dónde se copia cada parte y la huella JCS del
     todo.
4. **Proyecto Playwright `paquete`** (`playwright.paquete.config.ts`, `pnpm test:e2e:paquete`). `serve` sirve
   `dist/paquete-hoja-de-vida/public` **sin URL limpias** ni listado de carpetas: un enlace sin `.html` da 404, como
   allá. Desde `index.html?elegir` se rastrean todos los enlaces (54 páginas); cada solicitud debe ser del mismo
   origen y responder 2xx, sin errores en la consola. La raíz, con el navegador en inglés, lleva a `en.html` bajo la
   base.
5. **CI:** el job `e2e` arma el paquete y corre su rastreo después del e2e de la vitrina.
6. **Lo que hace el usuario, no planlang:** copiar `dist/paquete-hoja-de-vida/` sobre hoja-de-vida en un PR de
   contenido. planlang jamás escribe en hoja-de-vida.

## Consecuencias

- El paquete pesa 14 MB sin las cargas RSC (35 MB con ellas): la mayor parte son las 54 páginas, cada una con su
  propio HTML.
- Cada build del mismo árbol da los mismos archivos: el id de build es fijo y Turbopack nombra los chunks por su
  contenido. El manifiesto lleva además el commit, así que su huella cambia con él.
- Una página nueva o un enlace nuevo no necesitan nada del paquete si pasan por `ruta()`; uno escrito a mano lo
  detienen los barridos o el rastreo.
- Si hoja-de-vida cambia su proxy o su carpeta de piezas, cambia `BASE_RUTA` y la configuración de `serve` del
  proyecto `paquete`: la decisión no depende de ningún otro supuesto de su código.

## Demos en rojo (regla 15)

En la bitácora del S2, fase 4, «Paquete (ADR-009)»: un enlace sin `.html` y una imagen de afuera en el paquete
servido (rastreo en rojo); una ficha desactualizada (el gate de publicación detiene el script antes del build); una
`procedencia` sin proceso en el complemento (el espejo del esquema de hoja-de-vida lo rechaza); cada regla de los
barridos con su caso en `tests/unit/guardias/paquete-barridos.test.ts`.
