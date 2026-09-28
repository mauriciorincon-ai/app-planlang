# Bitácora — Sprint 002 «La vitrina»

> Orden: `portafolio/planlang/ordenes/SPRINT_002-orden.md` (planeadora, RO) · plan aprobado 2026-09-27 ·
> «construye» 2026-09-28. Checkout principal, sin worktrees, rama `sprint-002/la-vitrina` desde `main`
> (`b17eaef`). Primer sprint con UI: gate de FIDELIDAD de P1 indiferible; ⭐ del sprint diferido al
> acumulado del ciclo con sus dos contrapesos. Contrato de fases (kit v1.8.0): cada fase termina con su
> resumen y espera el «continúa».

## Progreso por fase

| Fase | Estado | Cierre |
|---|---|---|
| 0 · Setup, deltas, plan v1.3 y ⭐ del S1 | 🔄 en curso | |
| 1 · Fundación de UI + P1 → gate de FIDELIDAD | ⏳ | |
| 2 · P2 Plan · P3 Agente (visor) · P6 Caso | ⏳ | |
| 3 · P4 Brecha · P5 Playground | ⏳ | |
| 4 · P7 Fichas · paquete · corridas de fondo · deuda | ⏳ | |
| 5 · Cierre | ⏳ | |

## Decisiones previas a construir

- **U4 (modo Texas) queda en la v1.3 y se explica** — decisión del usuario en el plan (2026-09-27): el
  playground dice, como la maqueta aprobada, que conmutarlo cambia 0 de 62 decisiones y por qué.
- **Glifo de `regla` = hexágono** (sellado por el usuario en la mirada 1, pedido por `SPRINT_002.md`), contra
  `escudo` de la gramática `agentes-ia` v1.1.0 (contrato diagramador 0.3.0). Se re-mira en la fidelidad de P3.
- **Datos en build, sin IndexedDB** (ADR-008); **derivados de la vitrina en `data/vitrina/`**, fuera de
  `runs/` (append-only); `data/vitrina/manifiesto.json` declara la corrida que la vitrina muestra.
- **Navegación multipágina** con `<a>` y `ruta()`; `.html` explícitos en el paquete (el proxy next-intl de
  hoja-de-vida intercepta toda ruta sin punto).
- **Tema y perfil** por `<script>` crudo al inicio del `<head>` y atributos en `<html>`; ningún componente
  decide qué pinta por estado de cliente.
- **Ficha del agente y `brochure-export.json` en español**: los contratos del consumidor son monolingües; la
  fuente queda bilingüe y se genera también la versión EN (no entregada).

## Fase 0 — Setup, deltas, plan v1.3 y ⭐ del S1 (2026-09-28)

### `@types/node` de vuelta a 22 (primer commit)

`pnpm add -D @types/node@^22.20.4`: el lockfile es el inverso exacto del PR #6 (`@types/node` 26.6.2 → 22.20.4,
`undici-types` 8.9.0 → 6.21.0), nada más. `pnpm peers check` sin problemas; `pnpm typecheck` limpio.
`dependabot.yml` gana el `ignore` de mayores de `@types/node` del kit v1.32.1, y
`tests/unit/dependabot-config.test.ts` suma una prueba que cruza el `ignore`, el mayor de `@types/node` en
`package.json` y el `node-version` de la CI (el `ignore` solo no se ve operar).

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| `@types/node` sigue al Node de la CI | `package.json` con `^26.6.2` | rojo: «@types/node sigue al Node de la CI…» (1 de 4) → verde al revertir |
| ídem | `ignore` con `semver-minor` en vez de `semver-major` | rojo, misma prueba → verde al revertir |

## Desviación del plan

1. **El centinela «Worktrees prohibidos» no existe** en `ordenes/CLAUDE-md-para-app.md` (vive en el batch
   G-Metodo de la Etapa de Diseño, pendiente de aprobación): se añade al `CLAUDE.md` como párrafo local para
   cumplir el check de la orden.
2. **La constitución de la planeadora está atrasada respecto al kit v1.32.1** (reglas 10 · 15 · 17 · 18 y la 22,
   que no existe): se sincroniza con la planeadora y se aplican encima los deltas del kit.
3. **«Modo Texas mueve casos»** (acceptance de P5): U4 queda inerte y explicado, por decisión del usuario;
   propuesta para el S3: dar a `propuesta` un valor adverso parcial.
4. **Hexágono (design-system 1.0.0) contra escudo (`agentes-ia` v1.1.0)** para `regla`: gana lo sellado por el
   usuario; enmienda propuesta al contrato.
5. **Contrato diagramador 0.3.0 frente a la app:** fuentes `https` obligatorias por nodo (doc oficial de
   LangGraph del primitivo; el código va en `refs_externas`), arista función y ramas por defecto sin tripleta
   (convención `condicion {senal: "texas-y-no-aprobar" | "rama-por-defecto", operador: "=", valor: true}`),
   `__start__`/`__end__` como terminales, ids con guion, geometría de la maqueta (paso 172) y relleno tintado del
   nodo seleccionado. Enmiendas en el summary.
6. **El bloque `roadmap` de `SPRINT_002.md` no trae `descripcion`**, que exige `roadmapFeatureSchema`, y vive en el
   complemento de la planeadora: se avisa en el summary.
7. **`control_legal` (instrumentos-de-plan 0.2.0)** cambia la prioridad efectiva de R1/R6 en el informe: es
   semántica del reusable, no del verificador.
8. **Campos del plan solo en español** (M-25, S3 en la deuda): la ruta `/en` los mostraría en español, así que la
   v1.3 adelanta la parte de esquema que P2 necesita. Los textos del modelo en las trazas quedan en su idioma
   original, marcados `lang="es"`.
9. **Triaje de la deuda del S1 marcada «S2»:** entran AU-9, M-9, M-12, M-13, M-14 (R8 en la v1.3), M-22, M-23,
   M-24, M-26 y la parte de M-25; pasan al S3 M-8 (cambia la forma de la traza a mitad de acumulación), M-15,
   M-17, M-18 (refactor del grafo con riesgo sobre RF-09.2) y los Bajos que la auditoría no suba.
10. **Regla 22: los generadores de las páginas de la maqueta no están en el repo** (solo el de tokens). La etapa
    está cerrada y la maqueta congelada: vacío declarado, no se reconstruye.

## Registro de miradas

| Fecha | Mirada | Artefacto | Veredicto del usuario (textual) | Qué se construyó encima |
|---|---|---|---|---|

## Bugs y fricciones

| Fecha | Qué | Causa | Resolución |
|---|---|---|---|
