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
   (`basePath: "/piezas/planlang"`), una carpeta propia para el export (`distDir: ".next-paquete"`: el export del
   paquete va ahí y `out/` no se toca), un id de build fijo y un alias de `@sentry/nextjs` a `src/lib/sin-sentry.ts`.
   El modo llega al código por `env` (también al cliente).
   - **Corrección de la auditoría (AU-S2-B35):** los dos builds no se pisan *a medias*. Con export personalizado,
     Next 16 compila en `.next/` en los dos modos (caché común); solo el export va a `.next-paquete/`. Por eso no se
     corren a la vez y `paquete-vitrina` borra su carpeta antes de compilar.
   - **La variable sola no basta (AU-S2-B36):** `next.config.ts` exige además `PLANLANG_PAQUETE_MARCA`, que solo pone
     `pnpm paquete:vitrina`. Si `PLANLANG_PAQUETE=1` quedara olvidada en el entorno, `pnpm build` exportaría a
     `.next-paquete/` y `pnpm start` y el e2e servirían un `out/` viejo, en verde; ahora el build se detiene y dice
     cómo quitarla.
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
     SHA-256, el commit, si el árbol estaba limpio, todas las corridas que alimentan la vitrina con su huella (la
     principal, las repeticiones y la línea base), a dónde se copia cada parte, los pasos de entrega y la huella JCS
     del todo. El script lo comprueba al final con el mismo lector que corre el usuario (`pnpm paquete:verificar`).
   - **árbol limpio:** el script sale con 1 si hay cambios sin commit (el manifiesto diría un commit que no es el
     del paquete); `--permitir-arbol-sucio` lo arma para probar, y ese paquete no se entrega (AU-S2-B34).
4. **Proyecto Playwright `paquete`** (`playwright.paquete.config.ts`, `pnpm test:e2e:paquete`). `serve` sirve
   `dist/paquete-hoja-de-vida/public` **sin URL limpias** ni listado de carpetas: un enlace sin `.html` da 404, como
   allá. Desde `index.html?elegir` se rastrean todos los enlaces (54 páginas); cada solicitud debe ser del mismo
   origen y responder 2xx, sin errores en la consola. La raíz, con el navegador en inglés, lleva a `en.html` bajo la
   base.
5. **CI:** el job `e2e` arma el paquete y corre su rastreo después del e2e de la vitrina.
6. **Lo que hace el usuario, no planlang** (el manifiesto lleva estos pasos en `pasos_de_entrega`; AU-S2-8):
   1. armar el paquete desde `main` limpio con `pnpm paquete:vitrina`;
   2. correr `pnpm test:e2e:paquete` (el rastreo que hizo la CI se descarta con su máquina: el que se copia es el
      local);
   3. en hoja-de-vida, **borrar `public/piezas/planlang/` antes de copiar**: los chunks se nombran por su contenido y
      una copia encima de una entrega vieja deja los anteriores servidos;
   4. copiar `dist/paquete-hoja-de-vida/` sobre hoja-de-vida en un PR de contenido;
   5. comprobar la copia con `pnpm paquete:verificar --en <checkout de hoja-de-vida>` (cada archivo con su huella y
      nada de más en la carpeta de la vitrina) y adjuntar el manifiesto al PR.

   planlang jamás escribe en hoja-de-vida.
7. **El `roadmap:` de la ficha es de la planeadora (AU-S2-7).** En hoja-de-vida el roadmap votable vive en
   `data/fichas/planlang.yaml` con procedencia cv-viva: lo administra la planeadora y llega por copia aparte; sus ids
   son la clave de los votos. El complemento que propone planlang no lo trae (y el generador rechaza uno que lo
   traiga). Con `pnpm paquete:vitrina --hoja-de-vida <ruta>` el script **lee** ese YAML y conserva su `roadmap:` en
   el que entrega; sin la opción, el YAML del paquete no trae roadmap y el paso 4 lo pisaría: la cabecera del archivo
   y el manifiesto lo advierten. Las `descripcion` que exige el `roadmapFeatureSchema` de hoja-de-vida para los cinco
   ids del bloque de `SPRINT_002.md` se piden a la planeadora en el summary del S2.

## Consecuencias

- El paquete pesa 14 MB sin las cargas RSC (35 MB con ellas): la mayor parte son las 54 páginas, cada una con su
  propio HTML.
- Cada build del mismo árbol da los mismos archivos: el id de build es fijo y Turbopack nombra los chunks por su
  contenido. El manifiesto lleva además el commit, así que su huella cambia con él.
- Una página nueva o un enlace nuevo no necesitan nada del paquete si pasan por `ruta()`; uno escrito a mano lo
  detienen los barridos o el rastreo.
- Si hoja-de-vida cambia su proxy o su carpeta de piezas, cambia `BASE_RUTA` y la configuración de `serve` del
  proyecto `paquete`: la decisión no depende de ningún otro supuesto de su código.
- La página de planlang en hoja-de-vida sale sin roadmap votable hasta que la planeadora entregue el bloque con sus
  descripciones; desde entonces, cada entrega debe hacerse con `--hoja-de-vida` para no pisarlo.

## Demos en rojo (regla 15)

En la bitácora del S2, fase 4, «Paquete (ADR-009)»: un enlace sin `.html` y una imagen de afuera en el paquete
servido (rastreo en rojo); una ficha desactualizada (el gate de publicación detiene el script antes del build); una
`procedencia` sin proceso en el complemento (el espejo del esquema de hoja-de-vida lo rechaza); cada regla de los
barridos con su caso en `tests/unit/guardias/paquete-barridos.test.ts`. Tras la auditoría (fase 5):
`tests/unit/guardias/paquete-entrega.test.ts` (un archivo cambiado, uno que falta, uno que sobra; un roadmap que se
conserva y uno propuesto que se rechaza) y `tests/unit/guardias/next-config-paquete.test.ts` (la variable sin la
marca se rechaza).
