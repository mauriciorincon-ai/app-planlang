# ADR-014 — Cada demo tiene sus rutas: el A conserva las suyas y el B cuelga de `/demo-b/`

**Summary (EN):** The showcase now carries two demos. Demo A keeps every URL it had in S2 (`/es/plan`,
`/es/caso/A-001`…), so the hoja-de-vida package and anything that already points at it do not move. Demo B lives under
its own segment (`/es/demo-b/plan`…), with one thin route file per screen wrapping the same page component. The entry
page is shared and shows one real row per demo. `ruta()` requires the demo (no default), every per-demo dispatch is an
exhaustive `switch` or an `IdDemo` record, and three guards keep each demo's words and links inside its own pages.

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S3 «Demo B y el cierre del ciclo» (fase 3)
**Cítese por tema:** «ADR de las rutas por demo».
**Origen:** el plan del S3 (fase 3, «Ruta por demo (ADR-014)») y la orden del sprint, que piden el demo B en la vitrina
sin romper lo publicado del A.

## Contexto

- La vitrina del S2 tenía un solo demo y siete pantallas por idioma (ADR-007, ADR-008). El paquete para hoja-de-vida
  (ADR-009) las publica como `.html` explícitos bajo `/piezas/planlang/<idioma>/…`.
- El export es estático (`output: "export"`): una página por ruta, sin parámetros de consulta que cambien el contenido.
- El B necesita las mismas seis pantallas con otros datos, otros textos y otro vocabulario (solicitante, listas,
  oficial de cumplimiento), y su propia ficha de agente.

## Decisión

- **Rutas.** `src/lib/demos.ts` declara los demos (`DEMOS`) y el segmento de cada uno (`SEGMENTO_DEMO`: vacío para el
  A, `demo-b` para el B). `ruta(idioma, pantalla, id, demo)` arma el camino; el demo es **obligatorio** desde que un
  valor por omisión hizo que la Brecha del B enlazara casos del A (bitácora del S3). La entrada, una para los dos, se
  pide con `rutaEntrada(idioma)`.
- **Páginas.** El cuerpo de cada pantalla vive en `src/components/paginas/*.tsx` y recibe el demo. Las rutas del A
  (`src/app/[idioma]/<pantalla>`) y las del B (`src/app/[idioma]/demo-b/<pantalla>`) son envoltorios de una línea con
  sus metadatos; el título del B antepone «Demo B ·» (`metadatos()`).
- **Datos.** `datosDemo(id)` lee y verifica el demo que declara el manifiesto; un demo del manifiesto que la vitrina no
  sabe pintar detiene el build con su nombre. `datosDeLosDemos()` da los dos, para lo que cuenta la app entera (la
  ficha de la app, la entrada).
- **Vistas.** Un esqueleto común por pantalla y un perfil por demo donde el dominio cambia (Agente, Caso). Todo
  despacho por demo es un `switch` sin `default` o un `Record<IdDemo, …>`: un demo nuevo no compila hasta tener lo suyo.
- **Textos.** La copia propia del B vive en `src/textos/demo-b/`; un texto común que cambia por demo es un
  `Record<IdDemo, TextoBilingue>`. El pie dice lo sintético y quién decidiría en producción según el demo.
- **Barra.** En las pantallas del B, las pestañas enlazan dentro del B y un conmutador A · B lleva a la misma pantalla
  del otro demo. En las del A la barra no cambia.
- **Entrada.** Una fila real por demo (veredicto, balance y corrida del informe de cada uno, con la misma función);
  la portada y «Cómo funciona» siguen dibujando el A y lo dicen.
- **Paquete.** Las pantallas del B viajan como `.html` explícitos bajo `/piezas/planlang/<idioma>/demo-b/…`, junto con
  la ficha del agente B (`content/agentes/planlang-demo-b.ficha-tecnica.json`).

## Guardias

- `copia-contra-plan` por demo: cada literal se lee contra el plan de su demo.
- `scripts/verificar-export.mjs` regla 7: ninguna pantalla del B dice palabras que solo son del A, ni al revés (la
  entrada y la ficha de la app, que hablan de los dos, quedan fuera por marca explícita).
- `tests/unit/vitrina/enlaces-por-demo.test.ts`: toda ruta interna de las vistas de un demo se queda en su demo. La
  regla 3 del export ve un enlace roto; esta prueba ve el que lleva al otro demo, que existe y no se rompe.

Las tres nacieron con su demo en rojo (bitácora del S3: D41, D42–D44).

## Consecuencias

- Las URL del A no cambian. Contra el build anterior al trabajo de dos demos, 51 de 57 páginas del A salen idénticas;
  las demás cambian por lo declarado (la entrada con dos filas, las fichas con los dos demos, una frase caducada).
- `lighthouse-urls.json` y `perf-budget.json` suman las rutas del B; el e2e y la paridad del playground corren también
  sobre el B.
- Siete archivos de ruta más por idioma, todos de una línea. Un tercer demo cuesta su segmento, sus envoltorios, su
  perfil en cada `switch` y su copia: el compilador señala cada sitio.

## Alternativas descartadas

- **Prefijo para los dos (`/es/demo-a/plan`, `/es/demo-b/plan`).** Simétrico, pero mueve todas las URL del A ya
  publicadas en el paquete de hoja-de-vida y en las capturas aprobadas del S2.
- **Un parámetro de consulta (`/es/plan?demo=b`).** El export estático genera una página por ruta: el contenido no
  puede depender de la consulta sin pintarse en el cliente, y la vitrina no hace llamadas ni lee datos en el navegador.
- **Una sola pantalla con los dos demos lado a lado.** Duplica la densidad de cada pantalla (ya al límite en un
  teléfono de 380 px) y mezcla vocabularios que la regla 7 separa a propósito.
