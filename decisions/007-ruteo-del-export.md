# ADR-007 — Ruteo del export: la maqueta fuera de `out/`, URLs limpias y el índice como puerta

**Summary (EN):** The design mock-up moves to a real `docs/diseno/` folder and no longer ships in the static export
(it used to publish the design room, including notes quoting the user). The export keeps Next's default file naming
(`out/es.html`, `out/es/plan.html`) and is served with clean URLs both on Vercel (`vercel.json` `cleanUrls`) and
locally with `serve` (clean URLs by default), so both behave the same. Every end-to-end test and capture pass enters
through the served index and navigates by clicking, never through `file://`. Internal links are root-absolute.

**Estado:** aceptado · **Fecha:** 2026-09-28 · **Sprint:** S2 «La vitrina»
**Cítese por tema:** «ADR del ruteo del export».
**Origen:** retro de la Etapa de Diseño (`sprints/ETAPA-DISENO.md` de la planeadora, desvíos 1 y 2) y orden del S2.

## Contexto

- Durante la Etapa de Diseño la maqueta vivió en `public/diseno/` con `docs/diseno` como enlace simbólico: el
  preview del PR #5 daba 404 en `/diseno/…` y la solución fue que Next la copiara a `out/`. Efecto lateral: la
  producción publicaba la sala de diseño entera, incluidos `README.md` y `MIRADAS.md`, que citan textualmente al
  usuario.
- `vercel.json` ganó `cleanUrls: true` en esa etapa: el builder de Vercel para `next export` sirve cada HTML por su
  nombre limpio, y sin la bandera los enlaces con `.html` daban 404.
- El índice de la maqueta resolvía sus enlaces relativos contra la raíz cuando se servía sin barra final; hubo que
  fijar su base de forma explícita.
- La vitrina del S2 es un sitio exportado con rutas por idioma (ADR-008) que recorren el usuario, el e2e y el arnés
  de capturas.

## Decisión

1. **La maqueta vive en `docs/diseno/` como carpeta real** y no viaja al export. `tests/unit/export-sin-maqueta.test.ts`
   exige que `docs/diseno` no sea un enlace y que `public/` no traiga la maqueta ni documentos HTML o Markdown
   (`out/` = `public/` + las páginas de `src/app/`). Se abre con doble clic o servida en local con `pnpm maqueta`
   (`localhost:3101/diseno/`).
2. **Nombres de archivo por defecto de Next** (`trailingSlash: false`): `out/index.html`, `out/es.html`,
   `out/es/plan.html`, `out/es/caso/A-001.html`.
3. **URLs limpias en todos los servidores:** `vercel.json` conserva `cleanUrls: true` y `serve` las activa por
   defecto, así que `/es/plan` sirve `es/plan.html` y una petición a `…/plan.html` redirige (301) a la limpia en los
   dos. El e2e y Lighthouse corren sobre `serve out` con el mismo comportamiento que producción.
4. **El índice es la puerta:** el e2e y el arnés de capturas entran por `/` y navegan con clics; ninguna prueba abre la
   vitrina por `file://`, y al menos un recorrido por pantalla llega desde el índice (no solo por URL profunda).
5. **Enlaces internos absolutos desde la raíz**, generados por un único helper (`ruta()`, ADR-008); jamás relativos.
6. **El paquete para hoja-de-vida es la excepción declarada** (ADR-009): allí los enlaces llevan `.html` explícito bajo
   `/piezas/planlang`, porque el proxy de hoja-de-vida intercepta toda ruta sin punto.

## Consecuencias

- El preview y la producción ya no sirven `/diseno`: la maqueta se recorre en local (la etapa está cerrada y el
  registro de G-Diseño identifica el preview por su número de PR).
- `scripts/capturar-maqueta.mjs` y `scripts/paleta/generar-tokens.mjs` ya leían `docs/diseno/`: no cambian.
- Si Vercel dejara de honrar `cleanUrls`, el e2e sobre `serve` no lo vería: la verificación de la preview (`/es`
  responde) queda en `/deploy-check`.
