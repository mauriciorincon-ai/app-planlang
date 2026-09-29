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

### Constitución sincronizada

`CLAUDE.md` = parte propia de la app tomada de `ordenes/CLAUDE-md-para-app.md` (regla 6 `--max-turns 2` solo con
`--json-schema`, regla 16 `pip-audit --skip-editable`, excepción B-10) + la sección «Reglas de desarrollo» del kit
v1.32.1 (la de la planeadora difería SOLO en los deltas v1.31.0–v1.32.1: reglas 10, 15, 17, 18 y la 22 nueva) +
ajustes locales: «Worktrees prohibidos» (desviación 1), cabecera (estampado v1.30.1, deltas hasta v1.32.1),
excepción F1 cumplida (G-Diseño ✓) y «Patrones de dominio» lleno. Centinelas: `únicamente cuando va
\`--json-schema\`` 1 · `Excepción registrada B-10` 1 · `Worktrees prohibidos` 1. **Para la planeadora:** su
`CLAUDE-md-para-app.md` tiene la cabecera en v1.30.0, el marcador `[DOMAIN …]` y le faltan los deltas del kit.

### Deltas del kit v1.30.1 → v1.32.1

- `.claude/settings.json`: hook PreToolUse que escanea el CONTENIDO a escribir (`jq` + `gitleaks --pipe`) además de
  lo staged (B-8). **Los hooks se cargan al iniciar la sesión de Claude Code:** el nuevo rige desde la próxima.
- `githooks/pre-commit` falla cerrado sin gitleaks (`KIT_SIN_GITLEAKS=1` para saltarlo a sabiendas).
- `.claude/commands/{audita-sprint,deploy-check,plan-sprint}.md` y `.claude/skills/ia-embebida.md` del kit (la app
  nunca los había personalizado: lo que solo tenía la app era la redacción vieja). `release-check` no aplica.
- `scripts/verificar-dependencias.mjs` + paso solo-PR en `quality` (sin copiar el `ci.yml` del kit, que va atrás en
  versiones de actions). **Ampliación local:** `scripts/degradaciones-permitidas.json` declara una degradación a
  propósito con `{nombre, de, a, razon}` (coincidencia exacta; una entrada que ya no aplica se avisa): este mismo PR
  baja `@types/node` 26.6.2 → 22.20.4 y `undici-types` 8.9.0 → 6.21.0. La plantilla del kit no contempla ese caso
  (sugerencia al método).
- `tests/unit/controladores-maqueta.test.ts` (plantilla del kit) sobre `docs/diseno/*.html`: 10 páginas.
- README de diseño: «Cómo abrir la maqueta» reescrito, «Fase 0» retroactiva, «Tokens de reusables consumidos» y el
  registro de G-Diseño con «preview del PR #5».

### La maqueta fuera del export (ADR-007)

`public/diseno/` → `docs/diseno/` (carpeta real; se retiró el enlace) · `eslint.config.mjs` sin la ruta vieja ·
`pnpm maqueta` la sirve en `localhost:3101/diseno/` · `tests/unit/export-sin-maqueta.test.ts` · se retiraron los
`public/*.svg` del scaffold. **Esqueleto de rutas** para que el preview abra `/es` desde el primer día:
`src/app/(raiz)/{layout,page}.tsx` (`/` elige idioma) y `src/app/[idioma]/{layout,page}.tsx` (`generateStaticParams`
es/en, `dynamicParams = false`, `<html lang>` desde la ruta). El export da `out/index.html`, `out/es.html` (`lang="es"`)
y `out/en.html` (`lang="en"`), sin `diseno/`. La regla `@next/next/no-html-link-for-pages` se apaga con su razón
(navegación multipágina con `<a>`, ADR-008). Tailwind escanea solo `src/` (`source("..")`).

### Adaptador: `--max-turns 2` únicamente con `--json-schema` (ADR-004 enmendado)

`turnos_maximos(json_schema)` en `agents/src/app_agents/adaptador.py` (no configurable); `test_adaptador_flags.py`
compara la línea literal con y sin esquema. Humo real 3/3 con la suscripción (2026-09-28). ADR-002 alineado. B-10:
los ADR 001–006 llevan su «Summary (EN)».

### Reusables: instrumentos-de-plan 0.2.0 y diagramador 0.3.0

- **instrumentos-de-plan 0.2.0:** `control_legal` (prioridad EFECTIVA `alta`, la de TABLA al lado; `prioridades()`),
  carnada C06, opciones «sin argumentos» en el informe (F-002, aviso, no bloquea), `version_contrato` 0.2.0, README.
- **Copia fijada** de lo que se consume en `packages/<objeto>/contrato/` (instrumentos: `CONTRATO.md`; diagramador:
  `CONTRATO.md`, `esquema/{mapa,gramatica}.schema.json`, `gramaticas/agentes-ia.json` 1.1.0) y `CONTRATO.lock` con
  la huella de cada archivo. `tests/unit/guardias/contratos-lock.test.ts` las recalcula en la CI y, con la planeadora
  en la máquina, compara byte a byte.
- **Esquema del plan:** `control_legal`; campos de texto que eran monolingües (`opciones`, `opcion_elegida`,
  mitigaciones, `no_detectable_en_trazas`, `unidad`) aceptan texto o `{es, en}` (`TextoLibreSchema`: los planes
  v1–v1.2, con los que corrieron las corridas versionadas, siguen cargando); detector con `ambito: caso | sesion`.

### Verificador 1.1.0

- Cada riesgo trae `prioridad_de_tabla` y `control_legal` junto a la efectiva, y su `ambito`; el informe muestra
  «alta · control legal (tabla: baja)» (G8).
- **Detectores de ámbito sesión (M-14):** miden sobre las sesiones del manifiesto (`limites_alcanzados`,
  `detenida_por`, `casos_ejecutados`); los casos se leen «sesión N».
- **Tolerancia declarada de S3:** `exactitud_dif_min` y `latencia_mediana_razon_max` en `umbral_confirmacion`; el
  motivo dice «Tolerancia declarada en el plan» en vez de «Regla por defecto»; una clave desconocida se declara como
  limitación.
- **Corridas de otro plan con la misma verdad (ADR-005):** `planDeLaCorrida` en la entrada del verificador (y `--plan`
  en `pnpm brecha:informe`): el plan de las corridas debe ser el de su manifiesto y dar la misma verdad; la ficha dice
  «ejecutada con el plan 1.2.0 (misma verdad…)».
- `opcion_elegida` bilingüe. Informes de referencia y versionados regenerados; el diff es exactamente los campos nuevos.
- **Aclaración sobre `runs/` append-only:** trazas, manifiestos, grafos y ramas no se tocan; los `informe.*` junto a
  cada corrida son derivados del verificador vigente y se regeneran (test de frescura del S1), como en el S1.

### Plan v1.3 (`plans/demo-a/v1.3.json`, huella `bbe1b9c4…`)

`pnpm tsx scripts/enmendar-plan-demo-a.ts --a 1.3 --por "Mauricio Rincón" --el 2026-09-28` (función pura
`enmendarAV13`, reproducible por test). Decisiones del usuario en el plan del S2: **U4 queda** y **tolerancia de S3
estricta** («no peor en nada»; rescatar S3 con una tolerancia elegida después de ver el resultado sería maquillarlo).
Cambios: R8 sobre las sesiones · R1 y R6 `control_legal` · S3 con tolerancia declarada y «a un presupuesto no mayor»
· decisiones y mitigaciones bilingües, y el EN de D1, D2 y D4 con los hechos del ES. **Umbrales y contrato de grafo
idénticos** (`mismaVerdad(v1.2, v1.3)`): por eso U4 y la unidad de U2 («unidades sintéticas», único texto que queda
solo en español) no se tocan — cambiarlos invalidaría el lote. **Si el usuario objeta la redacción, se regenera.**

**Informe v1.3 sobre la corrida v1.2** en `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/` (huella
`70c1cb23…`): mismo veredicto «cumple con alertas» (S1 sin probar, S3 refutado, 5 brechas), R1/R6 «alta · control
legal (tabla: baja)», R8 «1 sesión · no ocurrió». `data/vitrina/manifiesto.json` declara plan, corrida, repeticiones,
línea base e informe con sus huellas; `tests/integration/manifiesto-vitrina.test.ts` las verifica y regenera el
informe.

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| `@types/node` sigue al Node de la CI | `package.json` con `^26.6.2` | rojo: «@types/node sigue al Node de la CI…» (1 de 4) → verde al revertir |
| ídem | `ignore` con `semver-minor` en vez de `semver-major` | rojo, misma prueba → verde al revertir |
| pre-commit falla cerrado | `PATH=/usr/bin:/bin` (sin gitleaks) | viejo: exit 0 (dejaba pasar) · nuevo: exit 1 «commit BLOQUEADO» · con `KIT_SIN_GITLEAKS=1`: exit 0 con aviso |
| hook sobre el contenido a escribir (B-8) | JSON de la herramienta con la carnada canónica en `content` | viejo: exit 0 (solo miraba lo staged) · nuevo: exit 2 «SECRET DETECTADO en el contenido a escribir» · contenido limpio: exit 0 |
| `verificar-dependencias` | este mismo árbol sin `degradaciones-permitidas.json` | rojo: nombra `@types/node` y `undici-types` → con la lista, verde |
| ídem | entrada con `"a": "22.0.0"` (versión que no coincide) | rojo: 1 paquete por debajo → verde al revertir |
| controladores de la maqueta | `01-entrada.html` con `assets/maqueta-no-existe.js` | rojo: «falta el script» (1 de 10) → verde al revertir |
| la maqueta no viaja al export | `public/diseno/MIRADAS.md` | rojo: «documentos en public/» → verde al borrarlo |
| `--max-turns 2` con esquema | `turnos_maximos` devuelve siempre 1 | rojo: `test_argv_es_exactamente_el_de_la_regla_6` → verde al revertir |
| C06 control legal | `prioridades()` ignora `control_legal` | rojo: «C06 — control legal…» → verde al revertir |
| copia fijada de los contratos | un byte cambiado en `packages/diagramador/contrato/gramaticas/agentes-ia.json` | rojo: «cada archivo de la copia está en el lock con su huella» → verde al revertir |
| detector de ámbito sesión | el detector evalúa siempre sobre las trazas | rojo: 2 pruebas «detector de ámbito sesión» → verde al revertir |
| tolerancia declarada de S3 | la latencia ignora `latencia_mediana_razon_max` | rojo: «tolerancia declarada en el plan…» → verde al revertir |
| corridas de otro plan (ADR-005) | el lector no exige la misma verdad | rojo: «un plan de la corrida que no es el del manifiesto, o que da otra verdad» → verde al revertir |

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
