# ADR-015 — El aviso de `braces` (GHSA-vfj7-8cjw-p6xm) se ignora por id hasta que exista un parche

**Summary (EN):** `pnpm audit --audit-level high` reports GHSA-vfj7-8cjw-p6xm on `braces` (≤ 3.0.3), which only
enters through the lint toolchain and has no patched release. The advisory is ignored by id in
`pnpm-workspace.yaml` (`auditConfig.ignoreGhsas`), never by lowering the audit level. It is recorded with its reason
and review date in `scripts/avisos-aceptados.json`, whose test fails when the date expires. It is removed as soon as
a patched `braces` is published.

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S3 «Demo B y el cierre del ciclo» (fase 0)
**Cítese por tema:** «ADR del aviso de braces».
**Origen:** kit v1.34.0 (regla 18 de la constitución: toda excepción de `pnpm audit` va por id con un ADR) y la orden
del S3 (fase 0, «v1.34.0»). La excepción nació en el S2 (2026-10-02) con su registro y su prueba, sin ADR.

## Contexto

- El 2026-10-02 apareció en el calendario el aviso **GHSA-vfj7-8cjw-p6xm** (severidad alta) sobre `braces` ≤ 3.0.3,
  sin ningún cambio de dependencias en el repo.
- Ruta de entrada: `eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > braces`. Solo la usa el
  lint: no viaja al export de la vitrina ni al paquete para hoja-de-vida.
- El aviso pide `braces` ≥ 3.0.4, que no existe: la última versión publicada es 3.0.3 (2024-05-21; verificado de
  nuevo el 2026-10-04 con `npm view braces version`).

## Decisión

- Se ignora **solo ese aviso, por id**, en `pnpm-workspace.yaml` → `auditConfig.ignoreGhsas`. El nivel del job sigue
  en `--audit-level high`: cualquier otro aviso alto pone la CI en rojo.
- El registro vive en `scripts/avisos-aceptados.json` (id · paquete · rango vulnerable · ruta · razón · aceptado ·
  `revisar_antes: 2026-11-02`). `tests/unit/guardias/avisos-aceptados.test.ts`:
  - exige que el registro y `ignoreGhsas` coincidan;
  - falla cuando la fecha de revisión vence (regla 23, matriz de envejecimiento);
  - y, desde este ADR, exige que cada id ignorado esté citado en un ADR de `decisions/`.

## Condición de retiro

El primer PR que traiga un `braces` corregido (o una ruta de `eslint-config-next` que ya no lo use) borra el id de
`ignoreGhsas` y su entrada del registro, y marca este ADR como cerrado. Si el 2026-11-02 sigue sin parche, la entrada
se renueva con una razón nueva y una fecha nueva, o el lint se cambia de forma que no lo arrastre.
