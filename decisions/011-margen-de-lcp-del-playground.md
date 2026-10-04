# ADR-011 — Margen de LCP para el playground: 2,8 s por ruta, con pago en el S3

**Summary (EN):** Lighthouse's simulated LCP for the playground (`/*/playground`) is bimodal on the CI's localhost
server: about 1.96 s when React boots after the first paint and about 2.65 s when it boots before it, with the same
bytes. The rest of the code cannot decide that race, and the cuts within reach save at most ~0.13 s. The playground
alone gets a 2.8 s LCP budget; every other route keeps 2.5 s, and every other metric keeps its budget on every
route. A test checks that each measured URL falls under exactly one LCP budget and that no route exceeds 2.5 s
without being listed here. Paid back in S3.

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S2 «La vitrina» (cierre)
**Cítese por tema:** «ADR del margen de LCP del playground».
**Origen:** el job `lighthouse` del PR #8 en rojo sobre `edf146f` (LCP de `/en/playground` 2.646 ms; corridas
2.646 · 2.647 · 2.649) y la decisión del usuario del 2026-10-04 («Margen por ruta»), que concreta la deuda del S3
que ya había aceptado para este borde.

## Contexto

- `perf-budget.json` fija el LCP en 2,5 s. El job corre `lhci collect` (3 corridas) contra `serve` en localhost y
  asevera sobre la mediana. El LCP que mide es el **simulado** (lantern), no el observado.
- El elemento LCP del playground es el párrafo de la entradilla, que se pinta en la primera pintura (entre 57 y
  163 ms observados). Lantern estima el LCP con lo que la página necesitó **antes** de esa pintura observada: un
  script cuenta si su evaluación empezó antes de ella.
- Con las trazas de depuración de lantern (`LANTERN_DEBUG=1`) sobre el mismo build:
  - **modo bajo (~1.955 ms):** el chunk de React (70 KB comprimidos) se evaluó después de la pintura y queda fuera;
    el LCP lo marcan la fuente Inter precargada y el runtime de Next, que terminan a 1.955 ms;
  - **modo alto (~2.664 ms):** React se evaluó antes de la pintura. Su descarga comparte el ancho de banda simulado
    (1,6 Mb/s) con la fuente, el runtime, el CSS y los demás chunks, termina a 2.561 ms, y su evaluación y el
    arranque de la app suman ~100 ms.
- Qué modo sale depende de una carrera en localhost: los scripts llegan en milisegundos y el navegador los evalúa
  antes o después de pintar. Con los mismos bytes, la CI pasó el LCP en `11115e5` y lo falló en `8048989` y en
  `edf146f`. En local, intercalando el build de HEAD con otro, salieron 1.850, 1.956, 1.962, 2.646 y 2.666 ms.
- Las demás pantallas tienen el mismo modo alto, pero más bajo (~2.340 ms): no cargan el chunk de la isla
  (17 KB comprimidos) y su HTML pesa menos. `/en/playground` entró a `lighthouse-urls.json` en este sprint
  (AU-S2-B14), así que no hay histórico previo.

## Alternativas medidas y descartadas

| Alternativa                                                            | Resultado                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quitar la precarga de Inter                                            | el LCP del playground baja a ~2,5 s en el modo alto, pero el FCP sube ~0,3 s en todas las pantallas y `/es/agente` cae por FCP (1.509 ms contra 1.500): la fuente pasa a pedirse con prioridad máxima y lantern la cuenta en la primera pintura |
| Dibujar los íconos de la isla en el servidor (lucide fuera de la isla) | el chunk de la isla baja ~1,3 KB y la distribución no cambia (A/B intercalado: los dos builds dan los dos modos)                                                                                                                                |
| Sacar el chunk de la isla de la primera carga                          | ~130 ms en el modo alto (copia alterada del export): no alcanza                                                                                                                                                                                 |
| Recortar los chunks compartidos                                        | son React y el runtime de Next, sin código de la app                                                                                                                                                                                            |
| Una fuente más liviana                                                 | rompe la igualdad byte a byte con la maqueta aprobada (`tests/unit/vitrina/fuentes.test.ts`)                                                                                                                                                    |
| Medir con la red frenada de verdad (`devtools`) en vez de simular      | cambia el método para todas las pantallas y se aparta del CI del kit                                                                                                                                                                            |
| Reintentar la CI hasta que salga el modo bajo                          | es azar: una corrida no es una medición                                                                                                                                                                                                         |

## Decisión

- `perf-budget.json` deja FCP, TBT, CLS y los pesos en `/*` (todas las URL) y pasa el LCP a una entrada por ruta:
  2,5 s para `/es$`, `/en$`, `/*/plan`, `/*/agente`, `/*/caso/`, `/*/brecha` y `/*/fichas`, y **2,8 s solo para
  `/*/playground`**. Hace falta la partición porque LHCI aplica todas las entradas que casan con una URL: un LCP en
  `/*` seguiría valiendo para el playground. El margen cubre el modo alto medido: 2.666 ms en local y 2.649 ms en
  la CI.
- `tests/unit/guardias/lighthouse-urls.test.ts` cuida el reparto con la misma conversión de ruta a patrón que
  `@lhci/utils`:
  - cada URL de `lighthouse-urls.json` cae en exactamente un presupuesto de LCP: una pantalla nueva no queda sin él;
  - ninguna ruta pasa de 2,5 s salvo las listadas con su ADR (hoy solo `/*/playground`, en este archivo);
  - FCP, TBT, CLS y los pesos siguen valiendo para todas las URL.

## Consecuencias

- El playground puede publicarse con un LCP simulado de hasta 2,8 s en localhost. El LCP real no cambia: la
  entradilla se pinta cuando llegan el HTML y el CSS, y los scripts son `async`.
- Es deuda declarada (`sprints/SPRINT_002-summary.md`), con pago en el S3: que el modo alto del playground baje
  de 2,5 s, partiendo los textos de la isla por idioma, aligerando su DOM o difiriendo su chunk hasta después de la
  primera pintura, y volver la entrada a 2.500. Si el S3 mide el playground con el demo B, la entrada se revisa con
  él.
- Una ruta nueva en `lighthouse-urls.json` exige su entrada de LCP en el mismo PR (la prueba lo pide).
