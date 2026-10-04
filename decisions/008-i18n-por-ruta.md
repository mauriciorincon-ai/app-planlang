# ADR-008 — La base de la vitrina: idioma por ruta, datos en build, tema y perfil sin hidratación rota

**Summary (EN):** The showcase is a multi-page static site with one route per screen and language (`/es`, `/en`,
`/es/plan`, …), linked with plain `<a>` elements. All data is read and hash-checked at build time from what
`data/vitrina/manifiesto.json` declares; nothing is stored in IndexedDB. Theme and reading profile are
`<html>` attributes set by an inline pre-paint script (URL > stored > system/leader), both profiles are
rendered and hidden by attribute, so the tree never depends on client state. Tailwind v4 is restricted to the
design-system tokens; the approved fonts ship byte-for-byte; Sentry is loaded only when a DSN exists.

**Estado:** aceptado · **Fecha:** 2026-09-28 · **Sprint:** S2 «La vitrina» (fase 1)
**Cítese por tema:** «ADR de la base de la vitrina».
**Origen:** orden del S2 (fase 1: i18n por ruta, tema, tokens, perfil, capa de datos) y plan aprobado.

## Contexto

- La vitrina es un export estático (`output: "export"`, perfil `--estatico`) que viaja también como paquete a
  hoja-de-vida bajo `/piezas/planlang` (ADR-009, fase 4), donde un proxy de next-intl intercepta toda ruta sin
  punto: el paquete necesita enlaces `.html` explícitos y ningún payload de navegación del App Router.
- La línea de stack del `CLAUDE.md` decía «trazas precargadas en IndexedDB». Todo lo que la vitrina muestra es
  precomputado y versionado con huella; ningún visitante lanza cálculo que necesite persistir.
- La regla de desarrollo 5-a prohíbe que la FORMA del árbol dependa del estado del cliente (React #418). El tema y
  el perfil «Leer como» son del visitante, no del servidor.
- El design system 1.0.0 fija tokens, escala y cortes; Tailwind v4 trae su propia paleta, sombras, radios y
  tamaños, que el sistema prohíbe.

## Decisión

1. **Idioma por ruta.** `src/app/[idioma]/` es la raíz de la vitrina (`generateStaticParams` es/en,
   `dynamicParams = false`, `<html lang>` de la ruta). Cada pantalla es una página por idioma; el conmutador de
   idioma son ENLACES a la misma pantalla en el otro idioma. `/` (raíz propia en `src/app/(raiz)/`) lleva al último
   idioma usado o al primero de `navigator.languages` que sea español o inglés (español si ninguno); con `?elegir`,
   o sin JS, muestra los dos enlaces. Con dos raíces, el 404 es global (`global-not-found.tsx`,
   `experimental.globalNotFound`) y dice lo mismo en los dos idiomas.
2. **Datos en build, sin IndexedDB.** `src/lib/datos/vitrina.ts` (`server-only`) lee lo que declara el manifiesto,
   valida con Zod (el plan con su esquema completo; del informe, la forma que las pantallas leen) y verifica cada
   huella contra el manifiesto: una que no coincide hace fallar el build nombrando el archivo. Las vistas
   (`src/lib/vista/*`) son funciones puras que arman lo que se pinta; los textos viven en `src/textos/*` como
   `{ es, en }`. El cliente solo recibe HTML (y, desde la fase 3, el `senales.json` compacto del playground).
   **Enmienda** a la línea de stack del `CLAUDE.md`: «datos precomputados en build; sin IndexedDB».
3. **Navegación de sitio multipágina** con `<a>` y `ruta(idioma, pantalla, id?)`; sin `next/link` (la regla
   `@next/next/no-html-link-for-pages` va apagada con esta razón). El paquete (ADR-009) reescribe las rutas.
4. **Tema y perfil sin hidratación rota.** Un `<script>` en línea en el `<head>` de cada raíz fija
   `html[data-theme]` y `html[data-perfil]` antes de pintar: `?tema=`/`?perfil=` (y se recuerda) > lo guardado >
   `prefers-color-scheme` / «líder». No es `next/script beforeInteractive` (en el App Router corre tras los chunks
   y la página destellaría). React 19 sube los `<meta>` y `<link>` por encima del script; sigue siendo síncrono y
   anterior al `<body>`, así que ningún píxel se pinta con el tema equivocado. `<html suppressHydrationWarning>`
   (sus atributos cambian antes de que React llegue). Los dos perfiles se pintan en el servidor y el atributo oculta
   uno (`.solo-lider` / `.solo-experto`); los conmutadores leen el atributo con `useSyncExternalStore` (instantánea
   del servidor `null`) y solo cambian propiedades (`aria-pressed`). La opción ELEGIDA de tema y perfil se pinta
   desde el atributo del `<html>` (CSS), no desde `aria-pressed`: correcta desde el primer cuadro, sin destello al
   hidratar. Sin JS: el tema sigue al sistema (bloque
   `prefers-color-scheme` de `src/styles/tokens.css` para `:root` sin atributo) y se lee como líder.
5. **Tailwind v4 limitado al sistema.** `src/styles/tema.css` borra la paleta, sombras, radios, letras, tamaños,
   contenedores y cortes por defecto, y declara solo los del design system (`@theme inline` sobre las variables de
   `tokens.css`, que genera `scripts/paleta/generar-tokens.mjs` con prueba de deriva). Cortes: 721 px (tipografía y
   márgenes) y 861 px (rejillas); sin variantes `dark:`. **Extensiones que reproducen la maqueta aprobada** donde el
   § 2.3 del sistema no las nombra: tamaños de apoyo 14 px (pestañas, botones, párrafos de bloque), 22 px (cifra de
   capacidad, cita) y 11 px (códigos en miniaturas); y la interlínea 1,6 de «secundario» y «dato», que la maqueta
   hereda del cuerpo (la tabla del § 2.3 dice 1,5). Se proponen al `design-system.md` en el cierre del ciclo.
6. **Fuentes y íconos.** Inter y JetBrains Mono son los MISMOS archivos que la maqueta (prueba de huellas) vía
   `next/font/local`, con licencias OFL en `/licencias`. `display: "swap"` con respaldo ajustado a métricas, y no
   `block` como la maqueta: la primera pintura no espera a la fuente (LCP ≤ 2,5 s en `perf-budget.json`). **La
   mono de datos entra después de la carga:** no se precarga y su familia solo se activa con `html[data-mono]`, que
   el script previo pone en `load`; hasta entonces los datos van en la mono del sistema (nada de lo primero que se
   lee es mono). Medido con Lighthouse móvil (3 corridas, mediana): LCP 2,61 s → 2,31 s, CLS 0. Lucide
   `lucide-react` 1.48.0 exacto; los glifos de tipo, las marcas de veredicto y procedencia y la marca de planlang se
   dibujan con geometría calculada en `src/components/marcas.tsx` (el glifo de `regla` es el hexágono sellado).
7. **Sentry solo con DSN.** `instrumentation-client.ts` importa `@sentry/nextjs` de forma dinámica detrás del `if`
   del DSN: con la importación estática del kit, la vitrina descargaba 148 KB comprimidos sin DSN.

## Gates que nacen con esta decisión (con su demo en rojo en la bitácora del S2)

- `tests/unit/diseno-tokens.test.ts`: `src/styles/tokens.css` sin deriva y con los mismos colores que la maqueta.
- `tests/unit/vitrina/estilos.test.ts` + ESLint `no-restricted-syntax`: tintas vetadas como texto; toda variable CSS
  leída existe.
- `tests/unit/vitrina/fuentes.test.ts`: fuentes byte a byte con la maqueta, licencias, Lucide exacto.
- `tests/unit/vitrina/textos.test.ts`: dos idiomas llenos y redactados, presupuesto de líder, lecturas cortas.
- `tests/unit/vitrina/datos.test.ts`: la carga falla con una huella alterada.
- `tests/unit/vitrina/componentes.test.tsx`: la forma del árbol no cambia con el perfil (servidor y cliente).
- `scripts/verificar-export.mjs` (job `quality`): sin `localhost`, recursos y enlaces que existen, rótulo en cada
  pantalla, sin maqueta, sin dominios de despliegue.
- `tests/e2e/entrada.spec.ts`: entrada por el índice, controles que cambian algo, axe, 380 px sin desplazamiento
  lateral, movimiento reducido con visibilidad real, consola limpia, 404.
- `scripts/capturar-vitrina.mjs`: capturas lado a lado con la maqueta y pasada de interacción (regla 22 b).

## Alternativas descartadas

- **next-intl u otra capa de i18n con middleware:** no hay servidor en un export; y en hoja-de-vida ya hay un proxy
  de next-intl que intercepta rutas sin punto.
- **`next/link`:** pediría payloads RSC que el paquete no sirve bajo su base.
- **IndexedDB:** nada que persistir; todo se precalcula y se verifica en build.
- **Perfil o tema decididos en React (`useState` + ramas):** cambiarían la forma del árbol entre servidor y cliente.

## Consecuencias

- Toda pantalla nueva es una página por idioma bajo `[idioma]/`, con su vista pura y su diccionario; las pestañas
  que aún no existen dicen «en construcción» (sin simular nada) hasta su fase.
- El `CLAUDE.md` queda con la línea de stack enmendada; el `design-system.md` recibe las extensiones del punto 5 al
  cierre del ciclo.
