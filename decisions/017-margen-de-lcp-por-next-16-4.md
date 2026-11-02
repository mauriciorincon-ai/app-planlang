# ADR-017 — LCP a 2,8 s en todas las rutas mientras dura next 16.4: el parche de los RCE no se detiene por 150 ms simulados

**Summary (EN):** Next.js 16.4 is the only line that patches two critical unauthenticated RCEs (GHSA-673q-mjm6-r5xr,
GHSA-2464-fhr4-w9xw; vulnerable 16.0.0–16.4.0). On this static export it adds about 150 ms to Lighthouse's simulated
LCP on every screen, with the same requests and 2 KB more JavaScript. Several routes were already within 0–7 % of their
2.5 s budget on `main`, so the patch fails the required `lighthouse` check. Every route's LCP budget moves to 2.8 s, as
the playground already had (ADR-011). The H-3 performance front owns bringing them back to 2.5 s. Every other metric
keeps its budget.

**Estado:** aceptado · **Fecha:** 2026-11-02 · **Sprint:** parche de seguridad fuera de la ola (decisión del dueño «1a»,
2026-11-01), PR #23
**Cítese por tema:** «ADR del LCP de next 16.4».
**Origen:** el job `lighthouse` del PR #23 en rojo, y la decisión del dueño del 2026-11-02, tomada con
AskUserQuestion: «LCP a 2,8 s en toda ruta, con ADR».

## Contexto

- El parche sube `next` de 16.3.8 a 16.4.3. Es la única línea con el arreglo: el rango vulnerable es ≤ 16.4.0.
- La CI de `main` (`269a68e`, 2026-10-12) ya medía el LCP simulado al límite (mediana de 3 corridas, `lighthouse-margen`):
  `/*/agente` 2.493 y 2.485 ms (margen de 0,3 % y 0,6 %), `/*/planes/` 2.412, `/es` 2.331, `/en` 2.306, el resto
  entre 2.293 y 2.306 ms. El ADR-011 ya había avisado del riesgo de `/*/brecha`, bimodal y a menos del 2 %.
- La CI del PR #23 cae en `/es` (2.560; corridas 2.919 · 2.564 · 2.560), `/es/agente` (2.632) y
  `/es/demo-b/agente` (2.630). En local cae `/es/brecha`: 2.604 en la rama contra 2.455 en `main`.

## Qué se midió

- **Es next, no el resto del grupo de Dependabot.** En una rama local con `main` y solo `next`/`eslint-config-next`
  16.4.3 (sentry 11.1.0 y react 19.3.0, como en `main`), `/es/brecha` da 2.608 · 2.608 · 2.610 ms: lo mismo que la
  rama completa (2.606 · 2.607 · 2.615) y +150 ms sobre `main` (2.454 · 2.455 · 2.464). `/es/demo-b/brecha` sube
  igual: de 2.306 a 2.459.
- **No es la red ni el peso.** Las 12 peticiones de `/es/brecha` son las mismas, con los mismos tamaños y prioridades.
  El JS pasa de 137 a 139 KB comprimidos. FCP (1.055 ms), TBT (5 ms) y el arranque de los scripts no cambian.
- **Es la fase de render del LCP simulado.** TTFB 453 → 452 ms; _render delay_ 2.012 → 2.162 ms. El elemento LCP es
  un párrafo de texto que lantern encadena a la evaluación de los scripts, la misma carrera que describe el ADR-011.
  Next 16.4 la corre ~150 ms más tarde: el RTT simulado de un salto.

## Alternativas

| Alternativa                                                                  | Por qué no                                                                                                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Quedarse en 16.3.8                                                           | deja abiertos los dos RCE críticos                                                                                                           |
| 16.4.4                                                                       | se publicó hace horas, la edad mínima de publicación de pnpm 11 la rechaza, y no hay nada que diga que corrige esto                          |
| 2,8 s solo en las rutas que cayeron (`/es`, `/en`, `/*/agente`, `/*/brecha`) | `/*/planes/` (2.412 + ~150) y las que estaban al 7 % quedan a 1–3 % de caer: el próximo rojo sería cuestión de corridas                      |
| Optimizar el LCP en el parche                                                | horas de trabajo de rendimiento (hidratación de lo que pinta el LCP) que retrasan el parche de seguridad; es el frente de rendimiento de H-3 |

## Decisión

- `perf-budget.json`: el LCP de cada entrada por ruta pasa de 2.500 a **2.800 ms**: `/es$`, `/en$`, `/*/plan$`,
  `/*/agente`, `/*/caso/`, `/*/brecha`, `/*/comparar`, `/*/planes/` y `/*/fichas`. `/*/playground` ya estaba en 2.800
  (ADR-011). Se conserva la partición por ruta: es la que permite volver una ruta a 2,5 s sin tocar las demás.
- `tests/unit/guardias/lighthouse-urls.test.ts` declara cada ruta en `MARGENES`, con este ADR (y el playground con el
  011). La guardia sigue exigiendo que ninguna ruta pase de 2,5 s sin un margen declarado, y que cada URL medida caiga
  en exactamente un presupuesto de LCP.
- FCP (1,5 s), TBT, CLS y los pesos no cambian.

## Consecuencias

- La vitrina puede publicarse con un LCP simulado de hasta 2,8 s en localhost. El LCP real no cambia: el texto se pinta
  cuando llegan el HTML y el CSS.
- **Deuda para el frente de rendimiento de H-3:** volver cada ruta a 2.500, cada una con su medición. La entrada de
  `MARGENES` de una ruta que vuelve se borra en el mismo PR. `lighthouse-margen` sigue avisando de cada ruta con menos
  del 10 % de margen.
- La línea de Estándares de `CLAUDE.md` («`/*/playground` en 2,8 s por ADR-011, el resto 2,5 s») es copia del núcleo de
  la planeadora y no se edita aquí; queda desactualizada hasta que la planeadora la regenere.
