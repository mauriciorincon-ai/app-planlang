# Bitácora — Sprint 002 «La vitrina»

> Orden: `portafolio/planlang/ordenes/SPRINT_002-orden.md` (planeadora, RO) · plan aprobado 2026-09-27 ·
> «construye» 2026-09-28. Checkout principal, sin worktrees, rama `sprint-002/la-vitrina` desde `main`
> (`b17eaef`). Primer sprint con UI: gate de FIDELIDAD de P1 indiferible; ⭐ del sprint diferido al
> acumulado del ciclo con sus dos contrapesos. Contrato de fases (kit v1.8.0): cada fase termina con su
> resumen y espera el «continúa».

## Progreso por fase

| Fase | Estado | Cierre |
|---|---|---|
| 0 · Setup, deltas, plan v1.3 y ⭐ del S1 | ✅ cerrada · paradas del S1 diferidas con nombre | «continúa» 2026-09-28 |
| 1 · Fundación de UI + P1 → gate de FIDELIDAD | ✅ cerrada · **fidelidad aprobada** (`docs/fidelidad/p1/index.html`) | «lo abrí y lo apruebo» + «avancemos» 2026-09-29 |
| 2 · P2 Plan · P3 Agente (visor) · P6 Caso | ✅ construida · **mirada 2 aprobada** (`docs/fidelidad/p2/index.html`) · ⏸ esperando el «continúa» de fase | «lo abrí y apruebo» 2026-09-30 |
| 3 · P4 Brecha · P5 Playground | ✅ cerrada · **mirada 3 aprobada** (`docs/fidelidad/p3/index.html`) | «Esta bien continua» + «lo abrí y apruebo» 2026-10-01 |
| 4 · P7 Fichas · paquete · corridas de fondo · deuda | 🔨 en construcción | «continúa» 2026-10-01 |
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

### CI del PR borrador #8 (2026-09-28, commit `5e6097d`)

`quality`, `python`, `e2e` y `lighthouse`: `SUCCESS` con conclusión propia. **Primera corrida** del paso «Regla 18 —
ningún paquete por debajo de main» (`success`, no `skipped`): sin histórico no puede afirmarse regresión ni
no-regresión. Vercel desplegó la rama (`Deployment has completed`); que `/es` y `/en` respondan en el preview protegido
lo confirma el usuario con su sesión. Local: `pnpm test` 648 (52 archivos, umbrales de cobertura verdes) · `pytest` 137
(96,2 %) · humo real 3/3 · `pnpm lint`, `pnpm typecheck`, `pnpm trazas:verificar` limpios.

### Las 3 paradas del ⭐ del S1 — diferidas otra vez (excepción con nombre)

Ofrecidas en el gate de la fase 0 (lote real de 3 mirando la cuota · «¿reconoces tu plan?» sobre el informe v1.3 ES/EN ·
LangSmith). El usuario respondió «continúa» sin correrlas (2026-09-28). Quedan como **excepción nombrada
«paradas-S1-diferidas-S2»** en el acumulado ⭐ del ciclo: la guía acumulativa del cierre las lista como pendientes con
origen S1, y la de LangSmith conserva su fecha límite (antes de las corridas de fondo de la fase 4). El preview de
`/es` y `/en` tampoco recibió confirmación explícita: la CI de Vercel desplegó la rama y el e2e local del export
responde; la mirada del preview viaja a la fidelidad de P1.

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

## Fase 1 — Fundación de UI + P1 Entrada (2026-09-28)

### Qué se construyó

- **Rutas (ADR-008):** `src/app/[idioma]/` es la raíz de la vitrina (es/en, `dynamicParams = false`); `/` elige
  idioma (memoria > `navigator.languages` > español; `?elegir` no redirige); 404 global bilingüe
  (`global-not-found.tsx`, `experimental.globalNotFound`); las seis pestañas que llegan en las fases 2–4 existen y
  dicen «en construcción» (sin simular nada). Se borró el `favicon.ico` del scaffold: `src/app/icon.svg` es la marca.
- **Preferencias:** `src/lib/preferencias/script-previo.ts` (tema y perfil antes de pintar: URL > guardado >
  sistema/líder; recuerda el idioma solo en páginas de un idioma), `script-idioma.ts` (la raíz), `cliente.ts`
  (`useSyncExternalStore` con instantánea de servidor `null`; `fijarPreferencia` con el fundido de 0,45 s).
- **Tokens y estilos:** el generador emite además `src/styles/tokens.css` (con el tema claro sin JS por
  `prefers-color-scheme`); `src/styles/tema.css` restringe Tailwind v4 al sistema (sin paleta, sombras, radios ni
  tamaños por defecto; cortes 721/861); `src/styles/base.css` (perfil por atributo, movimiento reducido, `data-v` /
  `data-tipo`).
- **Fuentes e íconos:** Inter y JetBrains Mono byte a byte con la maqueta vía `next/font/local` (`swap` con
  respaldo ajustado); licencias OFL e ISC en `public/licencias/`; `lucide-react` 1.48.0 exacto; glifos y marcas
  dibujados con geometría calculada (`src/components/marcas.tsx`, hexágono para `regla`).
- **Datos:** `src/lib/datos/vitrina.ts` (`server-only`) verifica en build la huella de plan, informe y corrida
  contra `data/vitrina/manifiesto.json` (que suma `sprint: 1` en la corrida); `src/lib/vista/entrada.ts` arma P1 sin
  una cifra escrita a mano (partes del plan, piezas del agente, cuadros de criterios, lo que falló nombrado,
  capacidad, veredicto, corrida, pila).
- **Textos:** `src/textos/comun.ts` y `src/textos/entrada.ts`, `{ es, en }` redactados; la copia es la aprobada en
  la mirada 4; las lecturas cortas de los supuestos y el nombre de cada categoría de brecha, ligados por id.
- **Componentes canon** (`src/components/`): rótulo, barra (pestañas, idioma por enlaces, tema), pie, baldosa, chip
  de procedencia, veredicto dibujado, botón, control segmentado, «Leer como», aviso de perfil (el foco pasa al botón
  del otro lado), bloque del experto, sección, cadena de nodos y las secciones de P1 (portada con gancho, cómo
  funciona con sus tres miniaturas y la capacidad, lo que ninguna herramienta muestra, los demos, la pregunta).
- **P1 Entrada** completa en `/es` y `/en`.
- **Sentry solo con DSN:** `instrumentation-client.ts` lo importa de forma dinámica; `/es` pasó de 253 KB a 177 KB de
  JavaScript comprimido (148 KB de Sentry que se bajaban sin DSN).
- **Calidad:** `lighthouse-urls.json` → `/es`; `perf-budget.json` con LCP ≤ 2 500 ms; proyectos de Playwright
  `telefono` (380×800) y `escritorio` (1280×800); `scripts/verificar-export.mjs` en el job `quality`;
  cobertura de `src/components/**` (≥ 50 %).
- **Arnés de fidelidad** `scripts/capturar-vitrina.mjs` (`pnpm capturas:vitrina`): sirve `out/` y la maqueta, entra
  por el índice, captura 10 pares lado a lado (380 px y escritorio × oscuro/claro × es/en + 2 como experto), mide
  (sin desplazamiento lateral, fuentes cargadas, consola limpia) y hace la pasada de interacción (7 controles). Salida:
  `docs/fidelidad/p1/index.html` con la matriz al pie.

### Pruebas

`pnpm test` 951 (60 archivos, umbrales de cobertura verdes; `src/components` 97 % de líneas) · `pnpm test:e2e` 19 +
1 saltada (la de pestañas deslizables solo corre en el teléfono) · `pnpm lint`, `pnpm typecheck` limpios ·
`node scripts/verificar-export.mjs` verde (17 HTML, 14 pantallas) · arnés de capturas verde (7/7 interacciones).

### Demos en rojo de la fase 1 (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| deriva de `src/styles/tokens.css` | `--tinta-1: #ffffff` a mano | rojo: «src/styles/tokens.css (vitrina, S2) es lo que el generador produce» y «mismos colores por tema» → verde al revertir |
| tintas vetadas (ESLint) | `text-tinta-3` en el chip | rojo: `no-restricted-syntax` en `chip.tsx:20` → verde al revertir |
| tintas vetadas (barrido) | ídem | rojo: «src/components/chip.tsx no pinta texto con tinta-3 ni linea» → verde |
| variables CSS declaradas | `var(--tinta-4)` en la cadena | rojo: «cadena.tsx solo lee variables que existen» → verde |
| presupuesto de líder | «medi» con «JSON» y «LLM» | rojo: «párrafo de líder «medi»» → verde |
| fuentes = maqueta | un byte de más en `inter.woff2` | rojo: «inter.woff2: los mismos bytes que la maqueta aprobada» → verde |
| huellas en build | plan alterado · huella del informe cambiada · corrida con otra huella | rojo en `datos.test.ts` (tres casos, en la misma prueba) nombrando el archivo |
| forma invariante (5-a) | «Leer como» quita su rótulo si el perfil es experto | rojo: «líder y experto tienen el mismo árbol» → verde |
| export sin `localhost` | `openGraph.images` sin `metadataBase` | rojo: `es.html` y `en.html` «hornea localhost» → verde al revertir. (Con solo `openGraph.url` Next deja la URL relativa: el gate no lo ve porque no hay nada que ver.) |
| export: enlaces, rótulo, maqueta | copia de `out/` con `/es/nada`, sin rótulo en `es/fichas.html` y `diseno/01-entrada.html` | rojo con las tres fallas nombradas |
| movimiento reducido | la animación de perfil sin su guarda | rojo en los dos proyectos («sin animación») → verde |
| 380 px sin desplazamiento lateral | un bloque de 400×4 px en el pie | rojo en `telefono` (tres pruebas) → verde. **La primera demo salió verde por error mío**: el bloque no tenía alto y un bloque de área cero no cuenta como desbordamiento; el gate estaba bien |
| pasada de interacción (22 b) | el botón «Claro» no hace nada | rojo: «tema → Claro» y «tema → Oscuro» «no cambió nada» → verde |

### CI del commit `8c7ae2d` y el LCP de la Entrada

`quality`, `python` y `e2e` en `success`; **`lighthouse` en rojo**: LCP de `/es` 2,72 s (mediana de 3; presupuesto
2,5 s, que esta fase bajó desde 3 s). Primera corrida del paso «Export de la vitrina» en `quality`: `success`.
Diagnóstico local con Lighthouse móvil (3 corridas, mediana 2,61 s): el LCP es el párrafo de la entradilla, que se
pinta con la fuente de respaldo; el estimador suma todo lo que empezó a bajar antes del primer pintado observado.
Sin los scripts de Next el LCP simulado baja a 1,5 s (el runtime de React y Next, 137 KB comprimidos, no se puede
quitar en el App Router); sin la mono de datos, a 2,31 s. Arreglo: la mono no se precarga y se activa después de la
carga (`html[data-mono]`, ADR-008): LCP 2,31 s, CLS 0, rendimiento 98 y 100 en las otras tres categorías. Probados y
descartados: quitar solo la precarga de la mono (sin efecto) y `experimental.inlineCss` (sin efecto en el LCP).
Mis dos primeras mediciones con copias alteradas de `out/` quedaron contaminadas por un `serve` viejo en `:3000`
(el `pkill` no casaba con la línea de comando real); se repitieron sobre el build real con el proceso verificado.

Al repetir el e2e apareció un rojo de contraste que no era de color: axe medía los botones de tema y perfil a mitad
de la transición de 150 ms con que pasaban a «pulsado» al hidratar. Arreglo de raíz: la opción elegida se pinta desde
el atributo del `<html>` (lo fija el script previo antes de pintar), sin destello; y el e2e espera a que no haya
animaciones antes de axe. `--repeat-each 2`: 38/38.

**CI del commit `d20d1e1`:** `quality`, `python`, `e2e` y `lighthouse` en `success` con conclusión propia (Lighthouse:
presupuestos con LCP ≤ 2,5 s y categorías ≥ 90, mediana de 3 corridas sobre `/es`); 950 pruebas + 2 saltadas (las que
comparan con la planeadora, ausente en el runner) y 19 e2e.

**CI del commit `c04c1bd`** (marcas discontinuas con punta recta y capturas regeneradas): `quality`, `python`, `e2e`
y `lighthouse` en `success` con conclusión propia, más el preview de Vercel.

### Gate de FIDELIDAD — aprobado (2026-09-29)

`docs/fidelidad/p1/index.html` (doble clic): 10 pares maqueta | vitrina y la matriz de qué mirar. Diferencias
deliberadas, anotadas en la matriz: la fila del demo dice «plan v1.3 · corrida con v1.2» (la maqueta decía «plan
v1.2»: el informe que se publica es el del plan v1.3) y en inglés los porcentajes van pegados («89%»).

**Veredicto del usuario, textual (2026-09-29):** «Avancemos lo abri y lo apruebo». Es la fórmula «lo abrí y apruebo»
de la regla 10: pasa el gate de MIRADA y, con «avancemos», el de FASE. Sobre las capturas de `c04c1bd`. Desde aquí
se construyen P2–P7.

## Fase 2 — P2 Plan · P3 Agente (visor) · P6 Caso (desde 2026-09-29)

### Orden de construcción

1. Métricas de letra (G15): tabla de avances de Inter y JetBrains Mono leída de los woff2 del repo (con HVAR:
   las dos son variables) → `core/visor/metricas.json`, con prueba de deriva.
2. `core/visor`: ids · mapa 0.3.0 (grafo compilado + plan + textos) · validación · geometría (disposición y
   ruteo) · SVG · lista por capa. Golden ES/EN. ADR-010.
3. `agents/src/app_agents/exportar_grafo.py` → `data/vitrina/demo-a/grafo-codigo.json` (nodo → archivo, líneas,
   claves que escribe) + pytest de frescura.
4. Gate «diagrama = grafo» (`scripts/diagrama-igual-grafo.ts` + prueba) con su rojo.
5. P3 Agente → P2 Plan → P6 Caso (índice + 20 × 2).
6. e2e, axe, 380 px, pasada de interacción y capturas de la mirada 2 con su matriz.

### Decisiones de la fase (se consolidan en el ADR-010)

- **Cabeceras de banda con el texto de la gramática `agentes-ia` 1.1.0** («Agentes especializados», «¿Quién razona
  y con qué modelo?»), partidas en líneas con la tabla de métricas; la maqueta, dibujada a mano, usaba versiones
  cortas. El mapa no declara bandas (G4): el texto es de la gramática.
- **Geometría de la maqueta** (columna 160 u, paso 172, nodo 160 × 56, filas cada 140 u) y no la de § 5.3: el
  lienzo cabe en 1040 px como el aprobado. Filas por «serpiente»: el camino principal (ramas por defecto y
  secuencias) avanza de izquierda a derecha y abre fila nueva cuando vuelve atrás; los nodos fuera del camino van
  en la fila intermedia. Ruteo ortogonal por el camino más corto sobre una rejilla dispersa de líneas candidatas
  (bordes de caja, canales, calles), con penalización por codo, cruce y solape; D11 (cruces con cajas = 0) es prueba.
- **`__start__` y `__end__` son terminales del dibujo, no nodos del mapa** (el mapa 0.3.0 no tiene tipo
  terminal): enmienda propuesta `terminal`.
- **Código por nodo desde el repo en el build** (`grafo-codigo.json`); la nota lo dice y cita la huella del grafo
  compilado de la corrida (el código de los nodos puede cambiar con la deuda de la fase 4).
- **Grafo del spike** (sección «Antes: el spike»): copia fijada del `grafo.json` del spike de la F1 (planeadora,
  solo lectura) en `data/vitrina/demo-a/spike-2026-09-26/`, con su huella en el manifiesto de la vitrina.

### Punto de retoma (2026-09-29, compactación pedida por el usuario)

**Hecho y comiteado entonces (`54ddfca`, CI verde: quality, python, e2e, lighthouse y Vercel):** `core/visor`
completo · `exportar_grafo.py` → `grafo-codigo.json` con frescura · capa de datos con la corrida verificada entera,
lote, código por nodo y plan de beneficios · textos y vista de P3 con sus cifras probadas.

### P3 Agente — componentes y página (2026-09-29)

- **`src/components/agente/`**: ficha líder/experto con el «Leer como» global (el rótulo queda para el lector de
  pantalla, como en la maqueta) · «Lo que corrió, frente a su plan» (`contrato.tsx`, lo reusa el spike) · lienzo
  (`lienzo.tsx`, isla de cliente: el SVG del núcleo tal cual, desplazamiento lateral, índice de capas que se oculta
  por atributo cuando cabe, flechas del teclado, selección por `data-sel-id` con `data-sel` y `aria-pressed`) ·
  lista por capa con cada nodo como botón que elige su detalle · leyenda · paneles por nodo (`panel-nodo.tsx`) con
  pestañas Líder · Experto = perfil de la página y Código · Trazas del panel (`pestanas-panel.tsx`) · tabla de
  trazas con «Ver N más», barra de confianza con la marca de U1 y nota por nodo sacada de la corrida · panel de la
  arista U1 con su distribución generada · anuncio `aria-live` de la selección.
- **Piezas comunes nuevas:** `con-codigo.tsx` (lo que va entre acentos graves se pinta en la mono, como la
  maqueta), `vistas.tsx` (vistas alternas por atributo `hidden`), `ver-mas.tsx`. `Pie` y `Marco` aceptan la corrida
  de la pantalla. Cortes `chico` (561 px) y `amplio` (1001 px) en el tema: los secundarios de la maqueta de P3.
- **Textos:** el grupo propio de cada nodo reproduce el de la maqueta (configuración del modelo, reglas del plan
  de beneficios, las 5 reglas de `decision` generadas del plan, revisor simulado, qué revisa la guardia), con el
  alias del modelo, la política del revisor y la lista blanca sacados de las trazas.
- **Página** `src/app/[idioma]/agente/page.tsx`; abre con `enrutador` seleccionado (lo mismo sin JS).
- **Pruebas:** `tests/unit/vitrina/agente-componentes.test.tsx` (12: selección desde el lienzo, el teclado y la
  lista; pestañas; «Ver más»; enlaces a los 20 casos; inglés sin residuo; forma invariante) y
  `tests/e2e/agente.spec.ts` (6 × 2 proyectos: axe en 2 idiomas × 2 temas × 2 perfiles sin desplazamiento lateral,
  pasada de interacción, índice de capas en el teléfono, movimiento reducido). Ayudas de e2e en `tests/e2e/_comun.ts`.
- **Lighthouse local de `/es/agente`** (3 corridas, mediana): rendimiento 96–99, las otras tres 100; TBT 4–10 ms;
  LCP 2,1 s (presupuesto 2,5 s). Se añade a `lighthouse-urls.json`. El HTML pesa 1,7 MB (143 KB comprimido): los 8
  paneles con sus 4 pestañas y 20 trazas se pintan todos (regla 5-a); el DOM tiene 7 308 nodos.

El CI de `6093384` salió **rojo en `quality`** por el gate de enlaces del export (`verificar-export.mjs`): la tabla
de trazas enlaza a `/es/caso/A-001…A-020`, que aún no existían. El gate hizo su trabajo; P6 se adelantó dentro de la
fase (la mirada 2 sigue agrupando P2 · P3 · P6) y desde aquí el job `quality` entero corre en local antes de cada push.

### Spike, gate «diagrama = grafo» publicado y P6 Caso (2026-09-29)

- **El spike frente al mismo contrato:** copia fijada de su `grafo.json` (SHA-256 `bfabad3e…`) y la lectura del autor
  (`lectura.json`: tipos, la regla `senal_confianza < 0,75`, rama por defecto `aprobar` y la pausa, cada una con la
  línea de `spike.py`), las dos por SHA-256 en el manifiesto. `grafoDelSpike` falla si la lectura no cubre el grafo.
  Cifras calculadas: 3 de 8 nodos, 1 de 9 reglas («la de U1, pero en enrutador y no en decision»), `aprobar` fuera
  del contrato. Nodo fuera del contrato con sus textos (`NODOS_FUERA_DEL_CONTRATO`).
- **Núcleo del visor:** los valores de regla llevan coma decimal en español (`valorDeRegla`); los terminales no se
  conectan por abajo (`sinLado`: ahí va su rótulo) y el aviso D11 cuenta también las líneas que tachan el rótulo de
  un terminal. Golden del demo A sin cambios.
- **`scripts/diagrama-igual-grafo.ts`** (`pnpm diagrama:verificar`, paso nuevo del job `quality` tras el build): el
  lienzo de `out/{es,en}/agente.html` dibuja los nodos, las aristas y las reglas del grafo de la corrida frente al
  contrato. Prueba en `tests/unit/visor/diagrama-igual-grafo.test.ts`.
- **`PLAN_POR_NODO` probado contra el plan** (`agente.test.ts`): fila por nodo, cada id existe, ningún elemento sin
  nodo, y el umbral de cada regla en la fila del nodo donde vive.
- **P6 Caso:** `src/textos/caso.ts` (copia aprobada; lo de cada caso se ARMA con plantillas: relato, qué hizo cada
  nodo, por qué tomó cada rama) · `src/lib/vista/caso.ts` · `src/components/caso/{cabecera,caso}.tsx` · páginas
  `/[idioma]/caso` (índice con los 20) y `/[idioma]/caso/[id]` (20 × 2). Pruebas en `tests/unit/vitrina/caso.test.ts`.
  Piezas movidas a `agente/piezas.tsx` (`ColumnaIpo`, `FlechaIpo`); `BloqueExperto` con variante `sutil`.
- Local antes del push: `pnpm lint` · `pnpm typecheck` · `pnpm test` (1111 + 1 omitida, umbrales verdes) ·
  `pnpm trazas:verificar` · `pnpm build` · `verificar-export.mjs` (57 HTML) · `pnpm diagrama:verificar` · `pnpm audit`.

### Punto de retoma (2026-09-29, segunda compactación pedida por el usuario) — cumplido, ver «P6 cerrado, ADR-010 y P2 Plan»

**Sigue (en orden):** e2e de P6 (`tests/e2e/caso.spec.ts`: axe en 2 idiomas × 2 temas × 2 perfiles, 380 px, enlaces
del selector, un caso con pausa y uno sin ella) y pruebas de componentes de P6 con forma invariante → mirar P6 en
teléfono y en los casos A-006 (marca de inyección) y A-008 (diálogo) → ADR-010 → P2 Plan (maqueta `02-plan.html`) →
capturas de la mirada 2 (P2 · P3 · P6) con matriz en `docs/fidelidad/p2/` (el arnés `capturar-vitrina.mjs` necesita
la entrada `p2`) → DETENERSE para la mirada 2.

### P6 cerrado, ADR-010 y P2 Plan (2026-09-29)

- **P6, pruebas:** `tests/e2e/caso.spec.ts` (9 × 2 proyectos: del índice a un caso por la pestaña, el selector con 20
  enlaces y solo el actual marcado, el cambio de idioma conserva el caso; A-004 en 2 temas × 2 perfiles con axe y sin
  desplazamiento lateral; A-001 sin pausa ni documento; la marca de A-006 y el diálogo de A-008; movimiento reducido) y
  `tests/unit/vitrina/caso-componentes.test.tsx` (7: pausa y documento en A-004, ausentes en A-001, marca y diálogo,
  selector, inglés sin residuo y forma invariante).
- **P6 mirado en el teléfono y en A-006 / A-008** (capturas leídas como imagen): marca de inyección con borde
  discontinuo y ⚠, pausa, guardia y documento caben a 380 px; el diálogo de A-008 con sus citas en `lang="es"`.
  Dos correcciones salieron de mirar: (1) en inglés la columna «Observado» traducía `ambulatoria` → «outpatient»
  junto a la regla `= urgencia`, y las 16 señales traducían `negar`/`aprobar`: los valores de código quedan como los
  escribió el código en los dos idiomas, como la maqueta (prueba nueva); (2) el relato de A-006 no decía nada de la
  instrucción escondida: la frase sale de `guardia_salida.carga_detectada_en_entrada` y su severidad (plantilla
  `RELATO.inyeccion`; solo A-006 la activa en la corrida, y la prueba lo exige).
- **ADR-010** (`decisions/010-conversion-grafo-a-mapa.md`): conversión grafo → mapa 0.3.0, convenciones donde la app
  no cabe en el contrato (terminales, función nombrada, rama por defecto, ids con guion, fuentes, glifo), geometría de
  la maqueta, métricas G15, ruteo, SVG y los dos gates. Precisión frente a la desviación 5: la ubicación del código
  NO viaja en `refs_externas` del mapa; la exporta `exportar_grafo.py` a `grafo-codigo.json` y la muestra la pestaña
  Código (`refs_externas` queda solo para `planlang:fuera-del-contrato`).
- **P2 Plan** (maqueta `02-plan.html`): `src/textos/plan.ts` (copia aprobada; frases llanas de los criterios por id,
  con prueba de que cada criterio del plan tiene la suya) · `src/lib/vista/plan.ts` (cifras contadas en plan e informe,
  riesgos por prioridad de acción efectiva, 5 renglones a la vista y el resto tras «Ver N más» —`VISIBLES`, parámetro
  de lectura—, contrato con las 9 reglas y su «si no»; un plan sin lo de un plan aprobado hace fallar el build nombrando
  el campo) · `src/lib/vista/plan-comun.ts` (prioridad, control legal y estados; P3 Agente lo usa también: salió de su
  vista) · `src/components/plan/{fila,secciones}.tsx` · `src/app/[idioma]/plan/page.tsx`. `Fila.nota` (la mitigación
  con su efecto esperado) y `pieDeCorrida` compartido con Casos. La etiqueta «Una vía» va en tinta 1 con la marca a
  13 px, como la maqueta (P3 también la usa).
- **P2, pruebas:** `tests/unit/vitrina/plan.test.ts` (15), `tests/unit/vitrina/plan-componentes.test.tsx` (6: cifras e
  índice llevan a secciones que existen, «Ver N más», «Moverlo», forma invariante con perfil, «Ver más» y un renglón
  abierto, inglés), `tests/e2e/plan.spec.ts` (5 × 2 proyectos) y los textos de Plan en `textos.test.ts`.
- **Lighthouse local** (3 corridas): `/es/plan` rendimiento 98–100, las otras tres 100, LCP 1,8–2,3 s, TBT ≤ 8 ms,
  268 KB; `/es/caso/A-004` 98 / 100 / 100 / 100, LCP 2,3 s. Presupuestos verdes. Las dos rutas entran a
  `lighthouse-urls.json`.
- **Mirada 2:** `scripts/capturar-vitrina.mjs` admite varias pantallas por mirada (`pantallas`, pasada de interacción
  por mirada, filtros por pantalla y por ancho, matriz de cuatro columnas) → `docs/fidelidad/p2/index.html` con 30
  pares (P2, P3 y P6 × 380/1280 × temas × idiomas + 2 de experto por pantalla), 16 filas de matriz y 7/7
  interacciones. La mirada 1 se volvió a medir con el arnés nuevo: 10 pares, 7/7, verde.
- Local antes del push: `pnpm peers check` · `verificar-dependencias` · `pnpm typecheck` · `pnpm lint` · `pnpm test`
  (1267 + 1 omitida, umbrales verdes) · `pnpm trazas:verificar` · `pnpm build` · `verificar-export.mjs` (57 HTML) ·
  `pnpm diagrama:verificar` · `pnpm audit` · `pnpm test:e2e` (58, sin reintentos).

### Demos en rojo de la fase 2 (regla 15; el rojo nace con el gate)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| G2 del visor (`determinismo.test.ts`) | `Math.cos(0)` en `core/visor/geometria.ts` | rojo con archivo:línea → verde al revertir |
| Deriva de la tabla de métricas (`medida.test.ts`) | `unidades_por_em` 2048 → 2049 en `metricas.json` | rojo → verde |
| Huella de la tabla en `CONTRATO.lock` (`contratos-lock.test.ts`) | el mismo byte | rojo → verde |
| Golden SVG ES/EN (`svg.test.ts`, Node y jsdom) | radio del terminal 9 → 10 | rojo en 4 pruebas (2 idiomas × 2 proyectos) → verde |
| D11 (`geometria.test.ts`) | el ruteo deja de ver las cajas como obstáculo | rojo en 2 (avisos D11 y cruces medidos) → verde |
| Esquema del contrato, fase 1 (`mapa.test.ts`, Ajv 2020) | el mapa sin `estado` | rojo → verde |
| Forma invariante de P3 (`agente-componentes.test.tsx`) | `PanelSeleccion` pinta sus hijos solo si está seleccionado | rojo solo en «no cambia la forma» (las demás siguen viendo el panel correcto) → verde |
| D11 con rótulos de terminal (`geometria.ts` + `agente.test.ts`) | sin `sinLado` para los terminales | la vista del spike no se dibuja: «D11: l-pausa-humana-a-fin atraviesa el rótulo de fin» → verde |
| `PLAN_POR_NODO` contra el plan (`agente.test.ts`) | quitar D5 de `aclaracion` | «D5 no toca ningún nodo» → verde |
| Diagrama = grafo publicado (`diagrama-igual-grafo.ts`) | quitar `data-nodo-id="guardia-salida"` del lienzo de `out/es/agente.html` | `✗ demo-a/es: nodo del grafo sin dibujar: guardia-salida`, salida 1 → verde al restaurar; en la prueba, además, las dos aristas de `guardia_salida` |
| Forma invariante de P6 (`caso-componentes.test.tsx`) | `Caso` pinta las 16 señales solo si `html[data-perfil]` es experto | rojo en «el servidor pinta lo mismo sea cual sea el perfil» y en A-004 → verde |
| Valores de código crudos (`caso.test.ts`) | `valorLeido` vuelve a traducir las cadenas | `Expected "ambulatoria"`, `Received "outpatient"` → verde |
| Relato de la inyección (`caso.test.ts`) | quitar la frase de `carga_detectada_en_entrada` | rojo en A-006 → verde |
| «Ver N más» sin cambiar la forma, P2 (`plan-componentes.test.tsx`) | `VerMas` pinta el resto solo si está abierto | rojo en 3 («Ver N más», forma en el servidor y en el cliente) → verde |
| Estado de sala de la maqueta (`capturar-vitrina.mjs`) | la configuración con que nació la mirada 2 (`estado=real` para Plan y Casos) | `✕ maqueta diseno/02-plan.html: no tiene el estado de sala «real»` (y 06-caso), en rojo → verde con `plan` y `a006` |

## Fase 3 — P4 Brecha · P5 Playground (desde 2026-09-30)

### Núcleo del playground

- **`core/playground/aristas.ts`** (nuevo): la evaluación pura de las aristas, que antes vivía en `interprete.ts`
  (`comparar`, `evaluarArista`, `decidir`, `senalesDeVisita`), más **`recalcularVisita()`**, extraída de `recalcular()`.
  Solo importa tipos, así que el navegador no carga Zod para mover un umbral. `interprete.ts` la re-exporta y
  `recalcular()` (RF-09.2) la usa: es la misma función en los dos lados, no dos copias que coinciden.
- **`core/playground/compacto.ts`** (tipos) y **`compactar.ts`** (build): de la corrida verificada sale lo único que
  viaja al navegador:
  - las visitas a los nodos escritores, con sus señales observadas y la rama registrada;
  - el desenlace de cada rama posible (persona · solo · no observado), calculado sobre el grafo compilado;
  - `debe_escalar` de la verdad conocida;
  - por criterio y caso, la evaluación en lo registrado y en cada camino posible (`"i:desenlace"`).

  Qué se sabe de un camino que el agente no tomó:
  - si cambia en la **última** visita escritora, todo lo observado antes de decidir (las señales que leen las aristas,
    más la extracción);
  - si cambia **antes**, solo lo que observaron las visitas hasta ahí;
  - del desenlace, solo lo que fija el plan: con persona, pausa y decisión de la verdad conocida (DA-04); solo,
    sin pausa y con la propuesta.

  Lo demás del desenlace (respuesta, documento, payload, latencia) **no se inventa**: la regla que lo lee queda «no
  evaluable» en ese caso. Toda clave del contexto debe estar clasificada (caso · previa · desenlace); una suelta
  hace fallar el build, nombrándola.
- **`core/playground/consecuencias.ts`** (navegador): rehace cada visita jugable con `recalcularVisita` y entrega:
  - el desvío, el desenlace y el efecto (error introducido o evitado, revisión de más o ahorrada, mismo destino,
    no observado);
  - la arista que decide ahora o la que ya no decide;
  - las visitas ahorradas y los minutos (`costo_humano_por_caso_min` × personas; si el plan declarara costos
    distintos, el compacto falla en vez de elegir uno);
  - los criterios vueltos a medir con la misma agregación que `brecha/criterios.ts`; pass^k vale lo del informe
    si ningún caso cambia su resultado, si no, «indeterminado»;
  - los observados y los casos justo en el umbral, para el valor actual.
- **`tests/unit/core/playground/paridad.test.ts`** (16 pruebas, en `core` y en `core-jsdom`):
  - con los umbrales del plan: 0 cambios y 96 min (8 pausas × 12), cada visita con la rama de
    `ramas-esperadas.json`, observados y casos en el umbral iguales al informe, y cada criterio en su estado y su
    valor del informe;
  - conmutar U4 cambia exactamente lo que dice el límite del informe («0 de las 62»);
  - en 200 combinaciones de umbrales, cada criterio que no es pass^k coincide con `evaluarCriterios` sobre el mismo
    camino;
  - los ejemplos de la maqueta, medidos: U1 0,90 → A-008 a persona, +12 min; U2 1600 → A-010 solo, error, C3
    incumple; U3 3 → A-007 no observado; U3 1 → A-007 con una aclaración menos; Texas → 0 cambios;
  - 200 casos en menos de 100 ms y cada movimiento en menos de 16 ms (medianas).

### Deuda pagada: M-24 y M-26 (verificador 1.2.0)

- **M-24:**
  - cada brecha no prevista trae `reintentos` (antes la cifra vivía solo dentro de la frase del detalle);
  - el informe en Markdown dice la categoría de cada brecha y sus reintentos;
  - la tabla de evaluadores suma «No evaluables»;
  - los riesgos muestran sus no evaluables y los casos fuera por señal nula, como los criterios.
- **M-26:**
  - un criterio con métrica cuya población tiene casos pero ningún valor queda `indeterminado` (antes
    `sin_poblacion`, que es falso), y su nota dice el sentido del objetivo;
  - el validador rechaza una métrica en `todos_cumplen`/`tasa`/`pass^k` y una condición en
    `mediana`/`promedio`/`maximo`, que se ignorarían en silencio.
- **Versión e informes:** el verificador sube a **1.2.0**. Se regeneraron los informes de `runs/` (20 y v1.2), el
  golden de `simulado-3casos` y el informe de la vitrina; el manifiesto declara la huella nueva (`ca000282…`).
- **Refactor sin cambio de semántica:** `core/brecha/contexto.ts` suma `contextoDeObjeto()`.

### Demos en rojo de la fase 3 (regla 15; el rojo nace con el gate)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| Paridad del playground (`paridad.test.ts`) | la confianza de A-008 en `decision` pasa a 0,70 dentro del compacto | 6 rojos: `A-008\|8\|decision: expected 'pausa_humana' to be 'redactor'`, cambios ≠ [], C2 indeterminado… → verde al revertir |
| Criterios del compacto = verificador (`paridad.test.ts`) | `medirCriterio` deja de contar los «no evaluables» | `C2 con {"U1":0.5,"U2":200,"U3":0,"U4":false}: expected 'cumple' to be 'indeterminado'` y C9 con A-008 → verde |
| Claves clasificadas (`compactar.ts`) | quitar `tokens` de `CLAVES_DEL_DESENLACE` | 14 rojos: `playground: A-001 trae tokens, que el playground no sabe si se conoce antes de decidir…` → verde |
| M-26 en criterios (`criterios.test.ts`) | volver a «sin población» cuando no hay valores | `expected 'sin_poblacion' to be 'indeterminado'` → verde |
| M-26 en el validador (`validador.test.ts`) | apagar el rechazo de métrica en `pass^k` | `expected [[CRITERIO_SIN_REGLA, C7]] to deep equally contain [CRITERIO_SIN_REGLA, C5]` → verde |
| M-24 en el informe (`render-md.test.ts`) | quitar la categoría de la línea de cada brecha | rojo en «M-24: cada brecha dice su categoría…» → verde |
| Hidratación de la isla (`playground-componentes`) | el U1 inicial del cliente sale de un `useSyncExternalStore` (0,80) distinto del del servidor | `expected '<section aria-labelledby="s-juego-t" …' to be …` → verde |
| Forma invariante por perfil (`playground-componentes`) | la tabla de las 20 decisiones solo se pinta si el perfil es experto | rojo en «cambiar a experto y volver no cambia la forma» (el servidor no lo vio: por eso existe la prueba del clic) → verde |
| Deslizador y Texas por teclado (e2e) | sin manejadores en el deslizador y en el interruptor | 4 rojos: `toHaveValue("0.9")` recibió `0.75`; `aria-checked` `true` recibió `false` → verde |
| Nombre llano de cada señal (`playground.test.ts`) | `nombreLlano` vuelve a poner el código en silencio | rojo en «una señal que decide sin nombre llano detiene el build» → verde |
| Informe que no cumple, al frente (`brecha*.test.*`) | los criterios incumplidos no entran a «Lo que falló» | 2 rojos (vista y componentes) → verde |
| Presupuesto de Lighthouse (heredado, primera vez que P4/P5 dependen de él) | LCP y FCP de 100 ms | `largest-contentful-paint failure … found: 2499.99` → el gate puede fallar |

### Punto de retoma (2026-09-30, compactación pedida por el usuario) — cumplido, ver «P5 Playground, pruebas y cierre de la fase»

Hecho y comiteado en local (sin push: falta correr el job de calidad completo con build y e2e):
- núcleo del playground + paridad (arriba);
- M-24 y M-26, con el verificador en 1.2.0 y los informes regenerados;
- **P4 Brecha completa:**
  - `src/textos/brecha.ts`;
  - `src/lib/vista/brecha.ts`: falla nombrando la lectura editorial que falte y calcula con el playground el umbral
    que rompe un criterio con nota (C3 → U2 1500);
  - `src/components/brecha/{mirada,secciones}.tsx`, `src/components/{curva,tabla-f}.tsx`, la página;
  - revisada como imagen en escritorio y teléfono, líder y experto.
- **P5, a medio armar:**
  - `src/textos/playground.ts`, `src/lib/vista/playground.ts` y la isla `src/components/playground/juego.tsx`
    (deslizadores, Texas, cifras, frase, regla viva, cambios, tabla de decisiones, curva);
  - **la página `src/app/[idioma]/playground/page.tsx` sigue siendo el «en construcción».**

Siguiente, en orden:
1. **Página de P5:**
   - portada y `Oraculo`;
   - «El playground en una mirada»: LeerComo, AvisoPerfil, objetivo, recibe → hace → entrega, el ejemplo llano solo
     para el líder y la ficha técnica en BloqueExperto;
   - `<Juego datos={v.isla} />`;
   - «Lo que el playground no puede saber», con los límites y el aparte del núcleo (`LIMITES.nucleo` /
     `nucleoDetalle`).
2. **Build y capturas** de P5 (ES/EN, 380/1280, líder/experto; mover U2 a 1600 y encender Texas). Brecha también en
   EN; verificar R8 «0 de 1 sesión» y las etiquetas de la curva en miniatura (corregidas, sin volver a capturar).
3. **Pruebas unitarias:** `tests/unit/vitrina/{brecha,playground}.test.ts` (vistas) y `*-componentes.test.tsx`:
   - forma invariante por perfil;
   - la isla con los valores del plan da el mismo HTML en el servidor y en el cliente.

   Además: sumar `brecha` y `playground` a `textos.test.ts`.
4. **e2e** `tests/e2e/{brecha,playground}.spec.ts`:
   - deslizador por teclado, el interruptor y axe en temas y perfiles;
   - sin desbordamiento a 380 px y `reduced-motion`;
   - cada gate con su rojo.
5. **Cierre de la fase:**
   - `lighthouse-urls.json` + `/es/brecha`, `/es/playground`;
   - arnés `capturar-vitrina.mjs` mirada `p3`: maqueta 04 `real` y 05 `plan`; interacciones Ver como experto,
     «1 · S3», U2 → 1600, Texas;
   - `docs/fidelidad/p3`;
   - job de calidad completo, push, `gh pr checks`;
   - **DETENERSE para la mirada 3** con pregunta simple + ruta + matriz.

### P5 Playground, pruebas y cierre de la fase (2026-09-30)

**La página** (`src/app/[idioma]/playground/page.tsx`): portada, `Oraculo`, «El playground en una mirada»
(`src/components/playground/mirada.tsx`: Leer como, aviso de perfil, objetivo, recibe → hace → entrega, el ejemplo
medido solo para el líder y la ficha técnica en el bloque del experto), la isla `<Juego>` y «Lo que el playground no
puede saber» con el aparte del núcleo. La lectura de la curva pasó a los datos de la isla (`isla.curva.lectura`): la
maqueta la trae y la isla no la pintaba.

**Lo que salió de mirar las capturas como imagen** (escritorio, teléfono, ES/EN, líder/experto, U2 en 1600, Texas):
- la marca de la consecuencia («error: debía ir a una persona») se salía de la tarjeta en escritorio → se parte en dos
  líneas dentro de la tabla de cambios, como en la maqueta, con sus proporciones de columna;
- a 380 px, «Escalamiento» pisaba «Riesgo» en la tabla de la curva → la columna del umbral queda fija (60 px) y la de
  escalamiento más ancha;
- el ejemplo decía «Si subes confianza mínima…» → «Si subes el umbral de confianza mínima de extracción (U1)…», que
  vale para cualquier umbral (desviación 38);
- el orden de evaluación salía alfabético (aclaracion, decision, enrutador, extractor) → sigue el grafo del plan
  (`nodos_esperados`), en la ficha técnica y en la regla del experto;
- la tabla de la curva con un decimal fijo en cobertura y escalamiento («100,0 %», como la maqueta;
  `porcentajeFijo`);
- «Movido» llevaba el triángulo de alerta → la marca «parcial» de la maqueta (círculo a medio llenar), nueva en
  `marcas.tsx`;
- Brecha decía «Cumplió» (el mapa compartido con Plan y Agente) → «Cumple» / «Meets», como su maqueta
  (`ESTADO_CRITERIO_INFORME`); Plan y Agente siguen con «Cumplió», como las suyas.

**Zod viajaba a la isla.** Lighthouse local dejó el LCP mediano del Playground en 2.499,99 ms contra un presupuesto
de 2.500 (corridas: 2,50 · 2,53 · 3,01 s; 395 KB). El chunk propio de la página pesaba 527 KB (132 KB comprimido) y
traía Zod por dos caminos: (1) la isla importaba `SinProbar` de `brecha/mirada.tsx`, que importa valores de la vista
de Brecha (compactador, analizador de reglas, esquemas); (2) los diccionarios importan `tb` de
`core/formatos/bilingue.ts`, que definía sus esquemas Zod en el nivel superior (efecto que el empaquetador no puede
descartar). Arreglo: `SinProbar` en su propio archivo (`src/components/sin-probar.tsx`) y los esquemas en
`core/formatos/bilingue-esquema.ts` (`satisfies` los ata al tipo); `bilingue.ts` queda sin Zod. Resultado: chunk
propio 17 KB comprimido, JS de la página 195 KB (Brecha 177, Agente 180), peso total 282 KB.

**Lighthouse local** (3 corridas, mediana; `lhci assert` de presupuestos y de categorías en verde):

| Ruta | Rendimiento · A11y · BP · SEO | LCP | TBT | Peso |
|---|---|---|---|---|
| `/es/brecha` | 92–98 · 100 · 100 · 100 | 1,87–2,41 s | 150–268 ms | 284 KB |
| `/es/playground` | 97–99 · 100 · 100 · 100 | 1,96–2,67 s | 53–67 ms | 282 KB |

Se añaden a `lighthouse-urls.json`. Antes de confiar en el presupuesto se comprobó que **puede fallar**: con un LCP
imposible (100 ms) `lhci assert --budgetsFile` sale en rojo con los valores de cada corrida.

**Pruebas nuevas:**
- `tests/unit/vitrina/brecha.test.ts` (12): veredicto y balance; lo que falló y lo sin probar; C3 con nota y el umbral
  que lo rompe medido por el playground (U2 1500, y 1400 todavía cumple); C4 sin nota inventada; R8 en sesiones; las
  9 secciones; un supuesto o una categoría de brecha sin lectura detienen el build; y **un informe que no cumple**
  (`_brecha-no-cumple.ts`: C7 con objetivo de 10 s, R2 ocurrido en A-015, C6 sin población, R5 indeterminado) se
  publica con sus fallas al frente, en los dos idiomas.
- `tests/unit/vitrina/playground.test.ts` (13): portada y recibe contados en la corrida; el ejemplo es una medida (U1
  0,80 y 0,85 no mueven nada; 0,90 mueve A-008); ficha técnica; orden por grafo; límites del informe; la isla con sus
  umbrales, columnas, casos y curva; la isla sobrevive a JSON (datos puros); sin ejemplo si ningún valor mueve un
  caso; la lectura de la curva con riesgo; y una señal que decide sin nombre llano detiene el build.
- `*-componentes.test.tsx` de Brecha (7) y Playground (7): la isla hidrata sobre el HTML del servidor sin errores y sin
  cambiar una coma; U1 0,90 y «Volver al plan»; U2 1600 con C3; Texas; inglés sin residuo; forma invariante por
  perfil; el informe que no cumple pintado entero.
- `paridad.test.ts` (+13): 8 reglas de medición distintas (promedio, máximo, métrica a superar, objetivo no numérico,
  población vacía en métrica y en condición, tasa, regla mal formada) miden igual en el playground que en el
  verificador en 6 posiciones de los umbrales; los cuatro efectos según la verdad conocida (DA-04); y las entradas
  que el compacto rechaza nombrándolas (dos costos humanos, ningún costo, informe sin un criterio, traza sin su caso,
  camino sin evaluación).
- `textos.test.ts`: `brecha` y `playground` entran al barrido de los dos idiomas, y seis párrafos de líder de P4/P5 al
  presupuesto de líder.
- e2e `tests/e2e/{brecha,playground}.spec.ts` (30 por proyecto): llegar por la pestaña; cada tema × perfil por
  separado con axe, sin desplazamiento lateral y consola limpia (juntos pasaban de 30 s); el balance lleva a S3 y S1;
  U1 y U2 con el teclado; Texas con la barra espaciadora; el enlace de A-010 a su traza; movimiento reducido.

**Cobertura:** `core/playground` 96,4 % de ramas (umbral 90) y `src/lib` 80,0 % (umbral 80); la primera corrida dio
86 % y 77,4 % — las agregaciones que el demo no usa y los estados de un informe que no cumple no tenían prueba. El
proyecto `vitrina` de Vitest pasa a 30 s por prueba y por gancho: con cobertura y todo en paralelo, el primer render de
una página entera pasaba de los 5 s (no colgaba: Agente y Caso también cayeron).

**Job de calidad local completo, verde:** `pnpm peers check` · `typecheck` · `lint` · `pnpm test` (1735 pasan, 1
omitida) · `trazas:verificar` · `build` · `verificar-export` (57 HTML) · `diagrama:verificar` · `pnpm audit` · e2e
(118 pasan, 2 omitidas, 0 inestables).

**Mirada 3** (`node scripts/capturar-vitrina.mjs --mirada p3 --calidad 30`): 23 pares — Brecha y Playground en 380 px
y escritorio × 2 temas × 2 idiomas + 2 de experto cada una, y 3 del Playground con U2 en 1600 contra el estado «u2» de
la maqueta — y 6/6 interacciones que cambian algo. El arnés gana `pares` (un estado movido no necesita toda la
matriz), `accion` (llegar al estado con el control, como quien lee) y 120 s por captura de página entera (Brecha a
380 px pasa de 20.000 px).

## Fase 4 — P7 Fichas · paquete · corridas de fondo · deuda (desde 2026-10-01)

### Fichas y export (commit `1d4351e`)

- **Contratos fijados** en `docs/contratos/hoja-de-vida/` con `CONTRATO.lock`:
  - de hoja-de-vida: ficha técnica v1.3.1 (esquema, clave visual, plantilla);
  - de la planeadora: el contrato del `brochure-export` 1.0.0.
  - El lock guarda además la huella del código de hoja-de-vida cuyas reglas se reescriben en
    `src/lib/fichas/contrato.ts`: el proceso BPMN, el total = suma de grupos, los enlaces en `null` y cero enlaces.
  - `contratos-lock.test.ts` compara las copias con el origen cuando está en la máquina; rojo con un byte de más.
- **`src/lib/fichas/`:**
  - `armar.ts`: la ficha del agente A, el export, el complemento que planlang propone a la planeadora y la ficha de
    la app tal como la armaría `armar.py` (réplica);
  - `archivos.ts`: los 8 archivos, cada uno validado antes de escribirse;
  - `src/lib/datos/repo.ts`: sprints cerrados, ADR, versión y el `_schema` del contrato.
- **`pnpm fichas`** (`scripts/fichas.ts`, `--verificar` sale con 1 si algo cambiaría) escribe:
  - `content/agentes/planlang-demo-a.ficha-tecnica.json` (ES, la que se copia a hoja-de-vida);
  - `docs/brochure-export.json` (ES, lo lee la planeadora);
  - `docs/fichas/` (las versiones EN, el complemento propuesto y la ficha de la app armada, ES/EN).
- **Comprobación cruzada:** las 6 fichas y exports validan también con el propio Zod de hoja-de-vida (`tsx` desde su
  repo, solo lectura; su `git status` quedó vacío).
- **Pruebas:** `tests/unit/vitrina/fichas.test.ts` (11): frescura byte a byte; contratos ES/EN; reglas BPMN; límite del
  esquema; cero enlaces; total del export; cifra destacada inexistente; cifras desde los datos; un bloque y un paso
  por nodo del contrato. `textos.test.ts` suma `fichas` (850 textos).
- **Rojos:** un byte alterado en la ficha entregada (test y `--verificar` → 1) · apagar la regla de etiqueta de las
  decisiones · un byte de más en la copia fijada → los tres en rojo y verdes al revertir.

### Punto de retoma (2026-10-01, compactación pedida por el usuario) — P7 cumplido, ver «P7 Fichas»

Árbol limpio en `1d4351e` (sin push). Siguiente, en orden:
1. **P7 Fichas** (`src/app/[idioma]/fichas/page.tsx`, hoy «en construcción»; maqueta `07-fichas.html`):
   - portada; «Las fichas en una mirada» (Leer como, aviso, recibe → hace → entrega);
   - § 1 reproducibilidad: extraer las filas de `vistaBrecha().ficha` a un módulo común + «Cómo repetirla»
     (`REPRO.pasos`, experto);
   - § 2 ficha de la app y § 3 ficha del agente en el marco CV Viva: Fraunces solo aquí, ya en
     `src/app/fuentes/`; el proceso BPMN como lista por carril, sin dibujarlo;
   - bajo cada ficha, la tabla campo · medida (es · en) · límite (de `limiteDe`) · estado (experto);
   - vista, componentes, pruebas (forma invariante, inglés sin residuo), e2e y Lighthouse.
2. **Paquete (ADR-009)**: `PLANLANG_PAQUETE=1` → `basePath /piezas/planlang`, `distDir` propio, build id
   determinista. `scripts/paquete-vitrina.ts`:
   - gate de publicación: M9 · RF-09.2 · diagrama = grafo · paridad · fichas al día;
   - build sin DSN → `dist/paquete-hoja-de-vida/planlang/`;
   - barridos y `manifiesto.json` SHA-256.

   Además, el proyecto Playwright `paquete`.
3. **Deuda S1:** AU-9, M-9, M-12, M-13, M-22, M-23.
4. **Corridas de fondo:** preguntar al usuario antes de gastar cuota; comprobar `LANGSMITH_API_KEY` sin imprimirla.
5. **Mirada 4** (arnés `p4`: maqueta 07 estado `fichas`) → job de calidad → push → `gh pr checks` → DETENERSE.

### P7 Fichas (2026-10-01)

- **Antes de la página, el armado de la ficha de la app se corrigió contra el consumidor real.** La ficha de una app
  no la arma la planeadora (`armar.py`, 09-06), sino hoja-de-vida en su build (`armarFichaTecnica`, 09-09) con el
  export de `content/vitrina/` y el complemento de su `data/fichas/<slug>.yaml`. `armarFichaApp` replica ahora ese
  código:
  - `schema_version` «1.3.1», no «1.1.0»;
  - el hito `decisiones` es una clave que su componente traduce, no «decisiones registradas»;
  - su huella entra al `CONTRATO.lock` (`reglas_en_codigo`).

  Leer su componente destapó dos defectos de la ficha del agente, que allá se habrían visto:
  - `pieza.version` «plan v1.3» se pintaba «vplan v1.3» (allá es `v{version}`): ahora «1.3.0»;
  - `bloques[].cuenta` contaba las reglas del plan por nodo y allá se lee «N funcionalidades»: ahora 0, que allá se
    calla.

  Y la unidad de la latencia pasa a «segundos»/«seconds»: su componente calla la unidad que la etiqueta contiene, y
  «s» está en casi toda etiqueta. Las seis fichas y exports validan otra vez con su Zod (solo lectura).
- **Módulo común de la ficha de reproducibilidad** (`src/lib/vista/reproducibilidad.ts` + `src/textos/reproducibilidad.ts`):
  Brecha § 9 y Fichas § 1 leen las mismas filas; Fichas suma «Entorno» (Python, paquetes, CLI, sistema) y dos rótulos
  propios («Grafo compilado», «Huella del informe»). `numeroDato` pasa a `formato.ts`; `TituloNumerado` deja de estar
  repetido en Plan y Brecha (`src/components/titulo-numerado.tsx`).
- **La página** (`src/app/[idioma]/fichas/page.tsx`, vista `src/lib/vista/fichas.ts`, componentes
  `src/components/fichas/{mirada,ficha-cv}.tsx`):
  - portada; «Las fichas en una mirada» (Leer como, aviso, recibe → hace → entrega);
  - § 1 la ficha de reproducibilidad y, para el experto, «Cómo repetirla, en orden» (5 comandos);
  - § 2 y § 3 la ficha de la app y la del agente en el marco de CV Viva: los rótulos son los del componente real de
    hoja-de-vida (desviación 46); el proceso del agente, por carril, con los 15 pasos numerados y la palabra del tipo
    para el lector de pantalla;
  - bajo cada ficha, para el experto: el archivo que se entrega, de dónde sale cada cifra (el `detalle` que allá va
    en un `title`) y la tabla campo · medida (es · en) · límite (del esquema fijado, `limiteDe`) · estado.
  - `EnConstruccion` se retira: ninguna página la usa y su comentario («llegan en las fases 2–4») caducó.
- **La piel de CV Viva** (`src/styles/cv-viva.css`): la paleta de hoja-de-vida (sus tokens), papel claro en los dos
  temas, sin su tinta 3 (no alcanza AA sobre el papel). **Fraunces** se declara en esa hoja con `@font-face`, no
  con next/font, y entra después de la carga como la mono (`html[data-mono]`; antes, Georgia). Se probaron dos
  caminos peores, medidos:
  - con next/font importado solo en Fichas, su CSS venía en una hoja propia: +450 ms de FCP;
  - con la tercera letra en `src/app/fuentes.ts`, Next separa las `@font-face` en otra hoja para todas las páginas.
- **Pruebas:**
  - `fichas-vista.test.ts` (8): la reproducibilidad = Brecha + entorno; lo que viaja; chips, hitos y
    renumeración; cifras por idioma; carriles sin perder un paso; tabla; un lema de 81 caracteres en inglés → «No
    cabe»;
  - `fichas-componentes.test.tsx` (7): las dos fichas en su idioma; la letra de la piel solo dentro del marco;
    fuente en palabra y color; carriles con la palabra del tipo; lo del experto en el árbol; inglés sin residuo;
    forma invariante por perfil;
  - `fuentes.test.ts`: Fraunces = los bytes de la maqueta, con su OFL, solo en `cv-viva.css` y solo `.cv-letra` en
    `ficha-cv.tsx`;
  - `tests/e2e/fichas.spec.ts` (26 en los dos proyectos): pestaña, 2 idiomas × 2 temas × 2 perfiles con axe, sin
    desborde ni errores de consola; papel claro en el tema oscuro y Fraunces solo en el marco; movimiento reducido;
  - `lighthouse-urls.json` suma `/es/fichas`.
- **Lighthouse local** (mediana de 3, con la máquina cargada: promedio 4,6–5,3):
  - `/es/fichas`: FCP 0,91 s, LCP 2,31 s, rendimiento 98;
  - `/es/playground`: 2,61 s en la misma sesión; en la fase 3 midió 1,97 s y la CI lo pasó. El LCP simulado cuenta
    los scripts cuando el trazo real pinta tarde, y con la máquina cargada pinta tarde. Decide el job `lighthouse`.
- **Arnés:** mirada `p4` en `scripts/capturar-vitrina.mjs` (10 pares, 3/3 interacciones: experto → tabla, líder → se
  oculta, English → `/en/fichas` con la ficha en inglés); `docs/fidelidad/p4/` (11 MB). Las capturas se leyeron
  como imagen por tramos frente a la maqueta. Ajustes que salieron de esa lectura:
  - nombres de archivo en texto plano;
  - nombre y lema sin cortar;
  - título del proceso como rótulo;
  - hitos repartidos;
  - el `detalle` de cada cifra fuera de la tarjeta, como hoja-de-vida.

#### Demos en rojo de P7 (regla 15)

| Gate | Cambio deliberado | Rojo | Al revertir |
|---|---|---|---|
| Tabla de campos contra el esquema | `cabe()` devuelve siempre verdadero | `fichas-vista.test.ts`: 1 falla (el lema de 81) | 8/8 |
| Fraunces solo en la piel | `cv-letra` en el título de «Las fichas en una mirada» | `fuentes.test.ts` + `fichas-componentes.test.tsx`: 2 fallan | 16/16 |
| Código de hoja-de-vida que se replica | una cifra de la huella de su `armar.ts` en el lock | `contratos-lock.test.ts`: 1 falla | 10/10 |
| Contrato del diagramador adelantado en la planeadora | la versión declarada en `planeadora_adelante` pasa a 0.4.1 | `contratos-lock.test.ts`: 1 falla | 10/10 |

La primera alarma fue real: el diagramador v0.4.0 se publicó en la planeadora a las 19:57 de hoy, y la guarda «la
copia es la vigente» salió en rojo en el job de calidad (desviación 45).

### Paquete (ADR-009, 2026-10-01)

- **`next.config.ts`** con `PLANLANG_PAQUETE=1` fija:
  - `basePath: "/piezas/planlang"`;
  - `distDir: ".next-paquete"`: Next 16 exporta ahí y `out/` no se toca;
  - el id de build fijo;
  - el alias de `@sentry/nextjs` a `src/lib/sin-sentry.ts`. Sin él, el chunk del `import()` viajaba aunque nunca se
    pidiera.
- **`src/lib/ruta.ts`:** `BASE_RUTA` + `SUFIJO_RUTA` (`.html`) en el paquete. Los usan:
  - la raíz;
  - el 404 global (antes `href="/es"` a mano);
  - el script que elige idioma.

  `rutas.test.ts` prueba los dos modos.
- **`pnpm paquete:vitrina`** (`scripts/paquete-vitrina.ts`), en orden:
  - gate: M9, trazas y RF-09.2, fichas al día, paridad;
  - build y diagrama = grafo sobre `.next-paquete/`;
  - copia a `dist/paquete-hoja-de-vida/` con el árbol de hoja-de-vida, sin las 224 cargas RSC;
  - barridos (`scripts/paquete/barridos.ts` + `tests/unit/guardias/paquete-barridos.test.ts`, 8);
  - manifiesto SHA-256.

  Resultado: 57 páginas, 85 archivos, 14 MB.
- **Determinismo medido:** dos builds seguidos del mismo árbol → los 85 archivos con la misma huella.
- **Proyecto Playwright `paquete`** (`playwright.paquete.config.ts`, `pnpm test:e2e:paquete`):
  - `serve` sin URL limpias ni listado;
  - rastreo desde `index.html?elegir` de las 54 páginas: mismo origen, todo 2xx, consola limpia;
  - la raíz en inglés lleva a `en.html` bajo la base.

  En la CI va en el job `e2e`, después del e2e de la vitrina.
- **Dos hallazgos al armarlo:**
  - un chunk del runtime de Next trae la palabra «localhost» (su analizador de URL). La regla se afinó: en las
    páginas, cualquier mención; en el código, una URL completa;
  - **el complemento propuesto llevaba `procedencia` sin proceso**, y el `complementoSchema` de hoja-de-vida lo
    rechaza («sobra»). Se vio al validar el YAML con su propio esquema (solo lectura). Arreglo:
    `complementoPropuesto` ya no la emite, y `contrato.ts` gana `EsquemaComplemento`, un espejo de su Zod, que
    `pnpm fichas` exige antes de escribir.
  - Las 6 fichas y el complemento validan con el Zod de hoja-de-vida; su `git status` quedó vacío.

#### Demos en rojo del paquete (regla 15)

| Gate | Cambio deliberado | Rojo | Al revertir |
|---|---|---|---|
| Rastreo del paquete | un `href` a `es/plan` sin `.html` en `es/fichas.html` del paquete servido | 1 falla, nombra el enlace | 2/2 |
| Mismo origen | `<img src="https://example.invalid/x.png">` en la misma página | «sale del origen: https://example.invalid/x.png» | 2/2 |
| Gate de publicación | un espacio de más en `docs/fichas/planlang.ficha-tecnica.json` | `paquete:vitrina` sale con 1 en «las fichas están al día», antes del build | — |
| Espejo del complemento | `procedencia: "app"` de vuelta en `complementoPropuesto` | `fichas.test.ts` 3 fallan; `pnpm fichas` lanza «no cumple su contrato» | 12/12 |
| Barridos | cada regla con su caso en rojo dentro de la prueba | 8 casos | — |

### Deuda del S1 (2026-10-01)

- **M-13 · NFC simétrica en JCS:**
  - el fixture del contrato (`canonico.py`, `texto_fixture`) trae ahora cada valor `crudo`, tal como entró a Python
    (claves y cadenas en NFD, `-0.0`), y un caso nuevo `cadena_nfd`;
  - `core/formatos/jcs.ts` normaliza cadenas y claves a NFC; si dos claves coinciden, gana la última, como en el
    `dict`;
  - ninguna huella existente cambió (7 corridas verificadas, golden y planes intactos).
- **M-22 · sellar el plan canónico:** `aprobarPlan` sella lo que el esquema parsea (`depende_de: []` incluido) y
  `cargarPlan` verifica la huella sobre la entrada tal cual. Los planes aprobados v1–v1.3 verifican igual.
- **M-23 · lo que leen las condiciones y las aristas:**
  - una raíz que no es señal declarada ni clave del contexto (`VOCABULARIO`, `CLAVES_DE_SESION`) → advertencia
    `SENAL_NO_DECLARADA`, y al aprobar, motivo;
  - una función de condición sin registrar (`FUNCIONES_DE_CONDICION`) o una función de arista sin registrar o con
    otras entradas que su registro (`FUNCIONES`) → `REFERENCIA_ROTA`;
  - el v1 lo demuestra: lee `servicio_exento` en C4 y R6 sin declararla. El borrador base de las pruebas
    (`v0-migrado`) tenía el mismo defecto, y la base de `contrato-y-carga.test.ts` ahora la declara.
- **M-9 · las trazas a salvo:**
  - `lotes.py` escribe la corrida en el camino normal y ante cualquier excepción: la sesión queda «detenida por
    excepción», el caso en curso pendiente, y luego relanza;
  - el adaptador convierte un `OSError` del CLI en `ErrorProveedor("otro")`;
  - `InterruptorClasificado` envuelve los modelos de Anthropic y Groq: límite → `limite_de_uso`, tiempo →
    `timeout`, lo demás → `otro`, con solo la clase y el código HTTP, nunca el mensaje.
- **Pruebas:** `jcs-python-ts.test.ts` (desde el crudo, en los dos proyectos) · `test_canonico.py` (el crudo llega
  sin normalizar) · `contrato-y-carga.test.ts` (2 de M-22) · `validador.test.ts` (5 de M-23) · `test_lotes.py`
  (excepción no clasificada) · `test_adaptador_simulado.py` (interruptor y CLI ausente). Vitest 2092 · pytest 145
  (96 % de cobertura) · ruff limpio.

#### Demos en rojo de la deuda (regla 15)

| Gate | Cambio deliberado | Rojo | Al revertir |
|---|---|---|---|
| M-13 contrato JCS desde el crudo | el fixture nuevo contra el `jcs.ts` sin NFC | 4 fallan (2 casos × 2 proyectos) | 110/110 |
| M-22 sellar y verificar | las pruebas nuevas contra el `cargar.ts` anterior | 2 fallan | 9/9 |
| M-23 señales no declaradas | las pruebas nuevas destaparon el mismo defecto en la base de las viejas | 5 fallan hasta declarar la señal | 64/64 |
| M-9 trazas a salvo | sin `escribir()` en el `except` de `lotes.py` | 1 falla | 1/1 |

### Punto de retoma (2026-10-01, compactación pedida por el usuario)

Commit de la deuda hecho (ver `git log`), sin push. La rama lleva `239ebdf` (P7), `d283c0e` (paquete) y el de la
deuda sin subir; el último push fue `defb8a7`. Siguiente, en orden:
1. **M-12** (`constraints.txt` desde el venv validado + adenda al ADR-003 + la CI de Python instala con él).
2. **AU-9:** no se construye sin decisión del usuario (desviación 50).
3. **Corridas de fondo:** preguntar antes de gastar cuota; comprobar `LANGSMITH_API_KEY` sin imprimirla.
4. **Mirada 4:** reconstruir y regenerar `docs/fidelidad/p4/`, porque las capturas son de antes del ADR-009 y dicen
   «9 decisiones registradas» (ahora 10).
5. **Job de calidad completo:**
   - `pnpm test`, `typecheck`, `lint`, `build`, `verificar-export`, `diagrama:verificar` y `audit`;
   - `test:e2e`, `paquete:vitrina` y `test:e2e:paquete`;
   - `pytest`, ruff y `pip-audit`.
6. Barrido de enlaces después del último `git add` → push → `gh pr checks 8` → DETENERSE con el gate de la fase 4.
   Llevar al gate:
   - la mirada 4 (primera línea: pregunta + ruta);
   - las decisiones: AU-9 en el S2 o en el S3 (desviación 50), diagramador v0.4.0 ahora o en el S3
     (desviación 45), y las corridas de fondo.

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
11. **Lista de degradaciones a propósito para `verificar-dependencias`** (`scripts/degradaciones-permitidas.json`):
    este mismo PR baja `@types/node` 26 → 22 por orden; la copia del kit no admite una bajada deliberada. Coincidencia
    exacta de versiones; una entrada que no se usa avisa.
12. **Los `informe.*` de `runs/` se regeneran** con el verificador 1.1.0 (como en el S1): son derivados; trazas,
    manifiestos, grafos y ramas no se tocan (append-only).
13. **La unidad de U2 queda solo en español** en la v1.3: cambiarla rompería `mismaVerdad(v1.2, v1.3)` (ADR-005) e
    invalidaría el lote de 20.
14. **Los componentes canon nacen con su primer consumidor:** nodo, arista, deslizador, tabla de casos y curva
    llegan en las fases 2–3 con P3/P5/P6, no en la fase 1; igual `core/playground/compactar.ts` y `senales.json`
    (fase 3, con la prueba de paridad que los consume). Un componente sin pantalla no se puede mirar ni medir.
15. **Tamaños de apoyo y la interlínea que la maqueta usa fuera del § 2.3** (14 · 22 · 11 px; 1,6 en «secundario» y
    «dato»): la vitrina reproduce la maqueta aprobada y el ADR-008 lo registra; se proponen al `design-system.md` al
    cierre del ciclo.
16. **`font-display: swap`** (con respaldo ajustado) en lugar de `block` como la maqueta: la primera pintura no
    espera a la fuente (LCP). ADR-008.
17. **El script previo no queda «primer hijo del `<head>`»:** React 19 sube los `<meta>` y `<link>` por encima.
    Sigue síncrono y anterior al `<body>`: ningún píxel sale con el tema equivocado.
18. **Las capturas de fidelidad pesan 3,8 MB** (el plan decía ≤ 2 MB): 20 capturas de página entera a calidad 45;
    bajar más rompe la lectura del texto.
19. **Porcentajes en inglés pegados** («89%») frente a la maqueta («89 %»): gana el formato del design system § 3.
20. **La fila del demo A dice «plan v1.3 · corrida con v1.2»** donde la maqueta decía «plan v1.2»: la vitrina publica
    el informe del plan v1.3 sobre el lote de la v1.2 (ADR-005) y lo dice.
21. **`sprint` en el manifiesto de la vitrina** (`corrida.sprint: 1`): «el agente del sprint 1» y el chip «real ·
    sprint 1» salen del dato, no de la copia.
22. **Sentry solo con DSN** (importación dinámica): no estaba en el plan; ahorra 148 KB comprimidos por página.
23. **La mono de datos entra después de la carga** (no estaba en el plan; la pidió el presupuesto de LCP): hasta el
    `load` los datos van en la mono del sistema. Las capturas y el arnés esperan a `html[data-mono]`.

24. **Tokens por caso «7.084»** donde la maqueta decía «7.083»: la mediana de 20 valores es 7 083,5 y se redondea.
25. **«Participan» con los nombres de actor del plan** («Afiliado (sintético)», «Auditor médico humano»…) en lugar de
    los cortos de la maqueta: salen del dato.
26. **«Llamada» de los nodos con modelo sin «1 turno»**: desde el ADR-004 enmendado el código va con 2 turnos cuando
    lleva esquema, y la pestaña Código muestra el código de este build.
27. **La matriz «qué del plan toca a cada nodo» lleva el chip «declarado»** (lectura del autor comprobada por prueba)
    donde la maqueta decía «maqueta · en el producto la calcula el núcleo»: el núcleo no la calcula (ver
    `PLAN_POR_NODO`).
28. **Los nodos de la lista por capa son botones** que eligen su detalle (la maqueta los pintaba inertes): sin el
    lienzo, el teclado llega igual a cada panel.
29. **El pie de Agente conserva la frase de marcas** tras la de la corrida (la maqueta la quitaba).
30. **P2: «5 con prioridad alta, 2 por control legal»** donde la maqueta decía «3 con prioridad alta», y R1 y R6
    suben al grupo alto con la línea «control legal (tabla: baja)»: el plan v1.3 declara su control legal
    (instrumentos-de-plan 0.2.0, desviación 7).
31. **P2: «Las 9 reglas del plan deciden…»** donde la maqueta escribía «Nueve reglas deciden…»: la cifra sale del
    dato y una frase no empieza con dígito.
32. **P2: «Quién participa» con los nombres de actor del plan** (como la desviación 25).
33. **Las capturas de la mirada 2 pesan 17 MB** (calidad 30; 30 pares de páginas largas, P3 pasa de 5.000 px): sigue
    la desviación 18. Se probó calidad 35 (19 MB con las tres maquetas completas) y 30 se lee igual.
34. **P6 en inglés:** los valores de código (`ambulatoria`, `negar`) ya no se traducen en la tabla de reglas, las
    señales, lo que leyó el extractor ni la respuesta del auditor: así los muestra la maqueta y así se comparan con la
    regla del plan. La prosa (relato, «qué hizo») sigue redactada en cada idioma.
35. **El compacto del playground viaja como props de la isla, no como `senales.json`:** se calcula en el build desde la
    corrida verificada (huellas, esquema, RF-09.2), así que no hay un archivo derivado cuya frescura vigilar; la
    paridad se prueba sobre `compactar(corrida)`. El plan decía `scripts/senales-compactas.ts` + test de frescura.
36. **Los criterios del playground no son «C1 y C3; los otros 7 no cambian»** (ficha técnica de la maqueta): el
    playground vuelve a medir los nueve con la regla del plan y dice cuáles cambian. Los que leen lo que pasa
    después de un cambio (respuesta, documento, payload, latencia: C2, C7, C9…) quedan **indeterminados en el
    caso que cambia**, porque la traza no lo registró. Con U1 0,90, por ejemplo: «6 de 9 cumplen, 3 sin poder
    medirse en A-008» donde la maqueta decía «9 de 9». Es la regla 15 de la app: jamás se simula lo que no corrió.
37. **Verificador 1.2.0 (M-24):** `reintentos` es un campo nuevo de cada brecha no prevista, porque la pantalla
    Brecha muestra la columna «Reintentos» y no debía leerla de una frase.
38. **P5, el ejemplo del líder:** «Si subes el umbral de confianza mínima de extracción (U1)…» donde la maqueta decía
    «Si subes la confianza mínima (U1)…»: el ejemplo se mide y se escribe para el primer umbral que mueva un caso, y
    «el umbral de» concuerda con cualquiera.
39. **P5, la ficha técnica del experto:** el orden de evaluación se escribe con las reglas del plan en código
    (`enrutador (tipo_atencion = urgencia ∨ servicio_exento = true → redactor) · …`) donde la maqueta lo resumía en
    palabras: sale del grafo, no de una copia.
40. **Las capturas de la mirada 3 pesan 20 MB** (calidad 30; Brecha a 380 px pasa de 20.000 px): sigue las
    desviaciones 18 y 33.
41. **Slug de la ficha del agente: `planlang-demo-a`** (el de `SPRINT_002.md` de la planeadora). La maqueta de P7
    decía `planlang-agente-a`; se sigue al plan autoritativo y al nombre «demo A» de todo el producto.
42. **Conteo de funcionalidades: 16 construidas** (3 · 4 · 4 · 1 · 1 · 3 en los seis grupos). La VISION dice «14 del
    corte» pero lista 16 con la marca `[MVP]`; la maqueta contaba 25, porque sumaba las 9 del roadmap. Se cuenta lo
    construido y se avisa a la planeadora de la cifra de la VISION.
43. **El export nace antes del brochure:** la orden lo pide en el S2 y el brochure es del cierre del ciclo (S3), así
    que `brochure_archivo` y `brochure_ruta_local` dicen «pendiente: … nace al cierre del ciclo H1 (sprint 3)» en vez
    de una ruta que no existe (la regla del contrato pide producirlos juntos).
44. **La ficha de la app la arma hoja-de-vida**, no planlang (corregido el 2026-10-01 en la fase 4: decía «la
    planeadora», por su `armar.py`; el consumidor real es `armarFichaTecnica` de hoja-de-vida, posterior):
    - planlang entrega el export y **propone** su complemento (`docs/fichas/planlang.complemento-propuesto.json`:
      titular, cifras destacadas, límites, nunca), que allá vive en `data/fichas/planlang.yaml`;
    - P7 la pinta armada con esa propuesta, con `schema_version` «1.3.1» y los hitos como claves, como allá.
45. **El contrato del diagramador v0.4.0** se publicó en la planeadora el 2026-10-01 (cierre del S1 de big-d: 44
    enmiendas; «MINOR de datos»: ningún mapa 0.3.0 válido deja de serlo). La orden del S2 fija la 0.3.0 y el visor se
    construyó y validó contra ella, así que la copia fijada sigue en 0.3.0 y el lock declara
    `planeadora_adelante` con la versión y la huella vigentes allá. Un cambio sin declarar sigue en rojo. **Decisión
    del usuario en el gate de la fase 4:** adoptarla en el S2 o en el S3. Con ella llegaron el kit v1.33.0, el
    método v1.36.0 y los estándares v2.17.0 (LCP ≤ 3,0 s por ADR cuando G15 impone `display: block`; planlang sirve
    Inter con `swap` y no lo necesita hoy); sus deltas entran con la orden del S3.
46. **La piel de CV Viva usa los rótulos del componente real de hoja-de-vida, no los de la maqueta:** «Sin sellar»
    (no «En construcción»), «Datos del …» (no «Anclada a la corrida del …»), migas «La vitrina · Ficha técnica» (sin
    el frente) y el `detalle` de cada cifra fuera de la tarjeta (allá va en un `title`; aquí, en la lista del
    experto). En vez del botón «Avísame cuando abra», una nota dice que allá va la lista de espera: un botón sin
    acción rompería la regla 22. El hito `construccion` se lee «en construcción» y no «construcción cerrada», que
    solo será cierto al cerrar la construcción del ciclo.
47. **Bloques de la ficha del agente sin cuenta** (`cuenta: 0`): hoja-de-vida pinta `cuenta` como «N
    funcionalidades» y un nodo del grafo no las tiene (la maqueta tampoco las mostraba). Y `pieza.version` va en
    semver («1.3.0»): allá se pinta «v{version}».
48. **Fraunces entra después de la carga** (`html[data-mono]`, como la mono): en la primera pintura de Fichas competía
    con Inter. Hasta que entra, los titulares de la piel van en Georgia. La maqueta la servía con `block`.
49. **El paquete se arma con el árbol de hoja-de-vida** (`dist/paquete-hoja-de-vida/public/piezas/planlang/` +
    `content/agentes/`, `content/vitrina/`, `data/fichas/planlang.yaml`), no en `dist/paquete-hoja-de-vida/planlang/`
    como decía el plan: así el PR de contenido es una copia directa y el proyecto Playwright sirve `public/` igual que
    hoja-de-vida. El manifiesto va en la raíz del paquete. Las cargas RSC (`.txt`) no viajan (20 de 35 MB): la
    vitrina navega con `<a>` y el rastreo comprueba que ninguna página las pide.
50. **AU-9 (sin proveedor, el caso va a una persona) no cabe sin cambiar el plan:** hoy un error del proveedor sale
    del grafo (`_llamar` relanza) y el caso queda con traza parcial, sin decisión. Para que vaya a `pausa_humana` con
    motivo `proveedor_no_disponible`, el grafo necesita una arista nueva, y por la regla 2 toda arista condicional se
    declara en el plan: plan v1.4 (una regla sobre `error_proveedor`), nodos que atrapen el error y escriban la
    señal, y el grafo compilado, el mapa y «diagrama = grafo» con otra forma. RF-09.2 sobre las corridas viejas no
    cambiaría (la regla es falsa donde no hubo error). Es el mismo tipo de cambio que M-18, que se pasó al S3. Se
    deja para la decisión del usuario en el gate de la fase 4: hacerlo en el S2, antes de las corridas de fondo, o
    en el S3.

## Registro de miradas

| Fecha | Mirada | Artefacto | Veredicto del usuario (textual) | Qué se construyó encima |
|---|---|---|---|---|
| 2026-09-29 | Fidelidad P1 (indiferible; presentada el 2026-09-28) | `docs/fidelidad/p1/index.html` (capturas de `c04c1bd`) | «Avancemos lo abri y lo apruebo» | fase 2: P2 Plan · P3 Agente · P6 Caso |
| 2026-09-30 | Mirada 2: P2 Plan · P3 Agente · P6 Caso (presentada el 2026-09-29; matriz de 16 filas) | `docs/fidelidad/p2/index.html` (capturas de `c8db3b3`: 30 pares, 7/7 interacciones) | «lo abrí y apruebo» | fase 3: P4 Brecha · P5 Playground (arranca con el «continúa» de fase) |
| 2026-10-01 | Mirada 3: P4 Brecha · P5 Playground (presentada el 2026-09-30; matriz de 13 filas) | `docs/fidelidad/p3/index.html` (capturas de `defb8a7`: 23 pares, 6/6 interacciones; CI del PR #8 en verde) | «continúa» → se repreguntó «¿qué viste al abrirlo?» → «Esta bien continua» → se pidió la constancia → «lo abrí y apruebo» | fase 4: P7 Fichas · paquete · corridas de fondo · deuda |

## Bugs y fricciones

| Fecha | Qué | Causa | Resolución |
|---|---|---|---|
| 2026-09-28 | El e2e no arrancaba: `:3000` ocupado | un `serve out -l 3000` de una sesión anterior (26-09) seguía vivo | se detuvo (servía este mismo `out/`); el e2e levanta el suyo |
| 2026-09-28 | Sentry se descargaba sin DSN | importación estática del kit en `instrumentation-client.ts` | importación dinámica detrás del `if` (desviación 22) |
| 2026-09-28 | Demo de desbordamiento verde por error | bloque de 400 px sin alto (área cero no desborda) | demo repetida con 400×4 px: rojo |
| 2026-09-28 | `lighthouse` rojo: LCP 2,72 s > 2,5 s | el runtime de Next y la mono de datos bajaban antes del primer pintado | mono diferida al `load` (LCP local 2,31 s); ver «CI del commit `8c7ae2d`» |
| 2026-09-30 | LCP del Playground en el borde (2.499,99 ms) | Zod en la isla: `SinProbar` importado de `brecha/mirada.tsx` y esquemas Zod en `core/formatos/bilingue.ts` | `sin-probar.tsx` y `bilingue-esquema.ts`; JS propio 132 → 17 KB comprimido (ver «P5 Playground, pruebas y cierre») |
| 2026-10-01 | El complemento propuesto llevaba `procedencia` sin proceso | se copió del formato de `armar.py`, que la pone siempre; el Zod de hoja-de-vida la rechaza si no hay proceso | `complementoPropuesto` ya no la emite; espejo `EsquemaComplemento` en `contrato.ts` con su prueba |
| 2026-10-01 | La ficha del agente se habría visto «vplan v1.3» y «5 funcionalidades» en Decisión | `pieza.version` con prefijo y `cuenta` con las reglas del plan; hoja-de-vida pinta `v{version}` y «N funcionalidades» | versión semver y `cuenta: 0` (desviación 47) |
| 2026-10-01 | FCP de Fichas +450 ms | la `@font-face` de Fraunces en una hoja propia de la ruta (next/font importado solo en Fichas) | Fraunces declarada en `cv-viva.css` y activada tras la carga (desviación 48) |
| 2026-09-30 | Pruebas de componentes por tiempo bajo cobertura | 5 s por omisión; el primer render de páginas enteras en paralelo los pasa | `testTimeout`/`hookTimeout` de 30 s en el proyecto `vitrina` |
| 2026-09-30 | La captura de la mirada 3 cayó a mitad | 30 s por omisión para una captura de página entera de 20.000 px | 120 s por captura en el arnés |
| 2026-09-30 | `out/` quedó con el build de un rojo a propósito | el e2e de la demo en rojo recompila; revertir la fuente no recompila | se recompila antes de capturar; las capturas salen siempre de un build posterior al último cambio |
| 2026-09-28 | Contraste rojo intermitente en axe | los botones de tema y perfil pasaban a «pulsado» con transición al hidratar | la opción elegida se pinta desde el atributo del `<html>`; axe espera a que no haya animaciones |
| 2026-09-28 | «Sin probar» se veía como anillo continuo | las marcas discontinuas llevaban punta redonda y cerraban los huecos | punta recta en `falta`, `maqueta` y `beta` + prueba; capturas regeneradas |
| 2026-09-28 | Prettier reformateó `src/lib/observability.ts` sin cambios de fondo | `prettier --write` sobre `src/**` | revertido; el diff solo lleva lo del sprint |
| 2026-09-29 | En el teléfono el índice marcaba la capa 05 al llegar al final del lienzo | la última capa nunca alcanza el borde izquierdo (lógica heredada de la maqueta) | al final del recorrido la activa es la última; lo cubre el e2e del índice |
| 2026-09-29 | `estilos.test.ts` rojo con `--cols` | la variable la fija el propio componente en `style` | el barrido acepta las variables que el archivo declara en su `style` |
| 2026-09-29 | CI rojo en `quality` (`6093384`) | enlaces a `/[idioma]/caso/*` antes de que existiera P6 | P6 adelantado; el job `quality` corre entero en local antes de cada push |
| 2026-09-29 | En el spike, la línea a «fin» tachaba su rótulo | el ruteo dejaba entrar a un terminal por abajo | `sinLado` para terminales + D11 sobre los rótulos |
| 2026-09-29 | «0.75» en el lienzo en español | el núcleo escribía el valor de la regla con `String` | `valorDeRegla` (coma en español, sin `Intl`) |
| 2026-09-29 | Arnés: la pestaña «Código» de Agente salió «no cambió nada» | la huella de la pasada de interacción era la LONGITUD del HTML; cambiar de pestaña intercambia atributos del mismo largo | la huella es un hash de todo el HTML; 7/7. (El e2e ya veía la pestaña funcionar: falso rojo del arnés, no del producto) |
| 2026-09-29 | Arnés: las maquetas de Plan y Casos salieron vacías (900 px) | el arnés pedía `estado=real`, que esas maquetas no tienen (sus estados son `plan` y `a006`); la de Agente, sin nodo elegido | estado de sala por pantalla + control nuevo que pone el arnés en rojo si la maqueta no tiene el estado pedido; lo cazó la lectura de las capturas, no una medición |
| 2026-09-29 | P6 en inglés: «Observado: outpatient» junto a `= urgencia` | `valorLeido` traducía las cadenas con el mapa de valores de Agente | los valores de código quedan crudos (desviación 34) |
| 2026-09-29 | Relato de A-006 sin la instrucción escondida | la plantilla del relato no leía la guardia de entrada | `RELATO.inyeccion` desde `carga_detectada_en_entrada` y su severidad |
| 2026-09-29 | Plan en el teléfono: «enrutad/or» en la tabla de reglas | una `<table>` con `overflow-wrap:anywhere` en columnas estrechas | una tarjeta por regla en el teléfono, como la maqueta y la tabla de reglas de Casos |
