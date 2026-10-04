# Bitácora — Sprint 003 «Demo B y el cierre del ciclo»

> Orden: `portafolio/planlang/ordenes/SPRINT_003-orden.md` (planeadora, RO) · plan aprobado 2026-10-04 ·
> «construye» 2026-10-04. Checkout principal, sin worktrees, rama `sprint-003/demo-b-y-cierre` desde `main`
> (`0190a62`: S2 + PRs #10–#13). Sprint 3 de 3, cierre del ciclo H1: ⭐⭐ corto obligatorio en el Acto 2 (lo corre
> el usuario); este sprint lo deja caminable. Contrato de fases (kit v1.8.0): cada fase termina con su resumen y
> espera el «continúa».

## Progreso por fase

| Fase | Estado | Cierre |
|---|---|---|
| 0 · Setup, constitución, deltas, diagramador 0.5.0 y plan v1.5 del A | en curso | — |
| 1 · Entrevistador M2 → parada de DECISIÓN (plan B) | pendiente | — |
| 2 · Demo B: sintético, agente y lote de 20 | pendiente | — |
| 3 · Brecha B y la vitrina con dos demos | pendiente | — |
| 4 · Cierres de ciclo | pendiente | — |

## Decisiones previas a construir

- **G-Plan (defaults aceptados por el usuario, 2026-10-04):**
  - plan **v1.5** del A con U4 activo, M-16 y un lote nuevo de 200 en fondo;
  - la entrevista del plan B **la corre el usuario**;
  - LangSmith opcional;
  - la vitrina y la ficha hacen de brochure.
- **U4 que mueve casos (v1.5):** la propuesta del agente gana el valor `aprobar_parcial`, una determinación adversa
  parcial: el costo supera el `tope_alto_costo` del plan de beneficios (paga M-18, que hoy lo ignora).
  - Sin Texas, sale automática.
  - Con Texas, `texas_y_no_aprobar` la manda a `pausa_humana`.
  - Más M-16 (`carga_detectada → pausa_humana`) y la unidad de U2 en los dos idiomas.
  - Cambia el contrato de grafo, así que hay lote nuevo (ADR-005).
- **Orden en el A:** primero el agente (M-8 · M-15 · M-16 · M-18 · `aprobar_parcial`) y después el lote de 200
  v1.5. Mientras no termine, la vitrina publica la de 200 v1.4, que ya existe completa desde el S2, y lo dice.
- **Diagramador 0.5.0:**
  - `papel` marca los nodos reales donde empieza y termina el grafo (`enrutador` inicio, `guardia_salida` fin);
  - un `recorrido` por camino distinto de las trazas.
- **Ruta por demo (ADR-014):** el A conserva sus URL; el B vive en `/[idioma]/demo-b/<pantalla>`.
- **Contradicciones de RF-02.5 en TS** (`core/plan/contradicciones.ts`). El CLI `scripts/entrevistar.ts` lanza la
  entrevista Python y al terminar corre M1 y las contradicciones.
- **Bilingüe en la entrevista:**
  - la respuesta del usuario queda literal;
  - el modelo redacta el elemento en ES y EN, y el idioma que el usuario no escribió lleva origen `entrevistador`;
  - sin modelo, ese idioma queda «pendiente»;
  - lo declara el ADR-012.
- **Ningún umbral de comportamiento lo fija el builder:** los del B (incluida la zona gris del investigador) salen de
  la entrevista. El LCP sigue el camino «medición + STOP».
- **Excepción `braces`:** ADR-015.

## Fase 0 — Setup, constitución, deltas, diagramador 0.5.0 y plan v1.5 del A (desde 2026-10-04)

### Humo antes de tocar nada (`main` = `0190a62`)

- `pnpm build` en verde; `serve out` → `/es` 200; `agents/.venv` con Python 3.12.14.
- `pytest`: 159 + 3 saltadas, cobertura 96,39 %.
- **`pnpm test`: 2555 + 1 saltada, 1 en rojo:**
  - la prueba: `contratos-lock.test.ts` → «la copia es byte a byte la versión vigente de la planeadora, o la
    diferencia está declarada»;
  - el rojo: «expected 'c8598a1a…' to be '9b28d9ff…'»;
  - la causa: la casa publicó el diagramador **0.5.0** (`c8598a1a…`) y el lock local todavía declara
    `planeadora_adelante` 0.4.0 (`9b28d9ff…`).
  - Es el gate haciendo su trabajo. Solo corre con la planeadora en la máquina, así que la CI no la ve. La arregla
    el paso 4 de esta fase (lock 0.5.0).

### Constitución y deltas del kit v1.33.0–v1.37.0

- **Constitución:** `CLAUDE.md` ← `ordenes/CLAUDE-md-para-app.md` (regenerada 2026-10-04). El diff solo agrega: 3
  líneas viejas reciben texto al final y nada se borra. Centinelas: «kit v1.37.0» 1 · «Matriz de envejecimiento» 1 ·
  `lighthouse-margen` 1 · `ignoreGhsas` 2. Siguen los propios del repo: «Worktrees prohibidos», «Patrones de
  dominio de esta app» y la excepción B-10.
- **Copiados del kit tal cual** (no tenían texto propio):
  - `.claude/commands/deploy-check.md`: casillas 7-S y matriz de envejecimiento, reparar el homepage;
  - `.claude/commands/audita-sprint.md`: copy por la casilla 4, pagos que crean gates primero, casillas 7 y 8,
    decisiones en llano, segunda casilla 4 por otro auditor;
  - `.claude/skills/diseno-ui.md` § 5;
  - `scripts/demo-rojo.sh` (su carpeta de respaldo `.demo-rojo/` pasa al `.gitignore`).
  `release-check.md` no se copia: es del perfil de escritorio.
- **Mezclados a mano:**
  - **`plan-sprint.md`:** entra el (f) de tres clases de mirada; se conservan la matriz de una fila, las segundas
    vueltas sin parada y `gh pr checks` tras cada push, que el kit v1.36.0 borró (desviación 2). El paso 10
    (`/audita-sprint`) sigue.
  - **`instrumentation-client.ts`:** el `beforeSend` pasa a `src/lib/sentry-evento.ts` (`limpiarEvento`, función
    pura y con prueba) y de cada excepción viaja solo el tipo (`v.value = v.type`, kit v1.33.0). La importación
    dinámica del ADR-008 no cambia.
  - **`scripts/verificar-dependencias.mjs`:** la base que no se puede leer (`git rev-parse`) falla en local y en CI,
    como en el kit. La base que existe sin lockfile falla en CI y pasa con aviso fuera de CI (planlang, sobre el
    kit). La prueba cubre los dos casos con un repositorio temporal.
  - **`scripts/lighthouse-margen.mjs` (parche local, desviación 3):** lee los presupuestos con la semántica de LHCI
    (`scripts/lighthouse/patron.mjs`, compartido con `lighthouse-urls.test.ts`), aplica TODAS las entradas que casan
    y exige un presupuesto de LCP por URL medida. Corre en `ci.yml` después de los dos `lhci assert`. Sobre la
    colección local del S2 da **8 avisos**: todas las rutas medidas tienen menos del 10 % de margen en LCP, salvo
    `/es/agente`, y `/es/plan` es la peor (4,7 %). El script del kit no habría dicho nada: el dato llega a la fase 4.
  - **Arneses de capturas:** el servidor estático sale a `scripts/servidor-estatico.mjs`. `capturar-maqueta.mjs`
    deja `file://`, sirve `docs/diseno`, abre el índice y sigue su enlace a cada página (desviación 10). La pasada
    completa con `--solo-medir` da 0 desbordes, 0 textos fuera del lienzo y las fuentes cargadas en las 10 páginas.
    El README de diseño registra la regla.
- **ADR-015** (kit v1.34.0): el aviso de `braces` (GHSA-vfj7-8cjw-p6xm) se ignora por id hasta que exista un parche.
  El 2026-10-04 la última versión sigue siendo 3.0.3, así que no hay parche. `avisos-aceptados.test.ts` exige además
  que cada id ignorado esté citado en un ADR.
- **Matriz de envejecimiento (regla 23), qué cambia de estado con una fecha en esta app:**
  - la vitrina no: no lee el reloj (regla dura 1) y su fecha es una entrada del build;
  - el aviso de `braces` pasa a vencido el **2026-11-02** (`avisos-aceptados.test.ts` falla ese día);
  - la relectura de los términos de la suscripción (ADR-002, «Registro de re-lecturas») vence en cada release; la
    casilla 7-S de `/deploy-check` la pide.
- **Ya coincidían con el kit:** el hook PreToolUse que falla cerrado (`hook-secretos.test.ts` 3/3) y
  `githooks/pre-commit` (idéntico, con `KIT_SIN_GITLEAKS`).
- **README de comandos del kit:** es interno del kit (el estampado excluye todo `README.md`), así que no se copia.

#### Demos en rojo (regla 15, con `scripts/demo-rojo.sh`: mutación → rojo → restauración verificada → verde)

| Gate | Mutación | Rojo (a quién nombró) | Verde al restaurar |
|---|---|---|---|
| `beforeSend` metadata-only (`sentry-evento.test.ts`) | se borra `v.value = v.type` | «expected [ …(2) ] to deeply equal [ 'TypeError', 'Error' ]» | 2/2 |
| Base ilegible (`verificar-dependencias.test.ts`) | `rev-parse` contra `HEAD` en vez de la base | «expected '✗ verificar-dependencias: no-existe/r…' to contain 'no puedo leer la rama base…'» | 5/5 |
| URL medida sin LCP (`node scripts/lighthouse-margen.mjs`) | el `path` de Fichas pasa a `/*/fichas-que-no-existe` | «la URL medida /es/fichas no tiene presupuesto de LCP en perf-budget.json», exit 1 | 8 avisos, exit 0 |
| Aviso ignorado sin ADR (`avisos-aceptados.test.ts`) | un id nuevo en `ignoreGhsas` | «GHSA-nuev-o0id-xxxx se ignora sin un ADR en decisions/ que lo cite» (y sin entrada en el registro) | 3/3 |
| Capturas servidas (`capturas-servidas.test.ts`) | `capturar-maqueta.mjs` vuelve a `pathToFileURL(ruta)` | «capturar-maqueta.mjs sirve su árbol y no abre file://» | 3/3 |

`demo-rojo.sh` también atrapó una demo que no podía fallar. Para «aviso sin ADR», cambiar el id en el ADR-015 dejó el
gate en verde: el ADR cita el id tres veces y la mutación solo cambia la primera aparición. Se repitió con el fallo
real (un id nuevo en el workspace).

### Diagramador 0.5.0 (paso 4)

**Copia fijada y lock.**
- La copia está en `packages/diagramador/contrato/` (el contrato, los dos esquemas y `agentes-ia` 1.2.0), con las 4
  huellas de la casa verificadas (`c8598a1a…`, `264c929c…`, `2fd7f762…`, `62557dca…`).
- `CONTRATO.lock` 0.5.0 lleva `fuente_metricas: "Inter"` con la huella de `core/visor/metricas.json` y no trae
  `planeadora_adelante`.
- `contratos-lock.test.ts`: las 6 enmiendas del S2 están en el contrato y ya no se proponen; cada propuesta nueva dice
  qué y de dónde sale.

**`core/visor`.**
- `Condicion` en sus tres formas (`condicion.ts`, nuevo):
  - la función va como `{funcion: "texas_y_no_aprobar", entradas: ["modo-texas","propuesta"]}`;
  - el «si no» va como `{por_defecto: true}`;
  - se retiró `SENAL_POR_DEFECTO`.
- `papel` inicio/fin en `enrutador` y `guardia-salida`, desde las aristas de `__start__`/`__end__`.
- Fuente `codigo` (`ruta` + `lineas`) desde `grafo-codigo.json`.
- Glifos desde la gramática, con los trazos del § 5.4.
- `recorridos` desde las trazas (`recorridos.ts`, nuevo): un recorrido por camino distinto; con la corrida actual
  salen 6.
- Versión semver: `1.4` pasa a `1.4.0` y el spike va como `0.1.0`.
- Validación V3 por tipo de fuente, más V4, V5, V6 de recorridos, V7, V12, V14/V15 de recorridos y V17.
  `EXCEPCIONES_PLANLANG` (`V5-papel`, V7 como alerta) lleva su razón.

**Vitrina.**
- `src/lib/vista/visor.ts` valida el mapa que se dibuja (el del demo A y el del spike) contra `mapa.schema.json` con
  Ajv antes de dibujarlo (fase 1 en el build), además de V1–V17 (fase 2).
- Prueba nueva: `tests/unit/vitrina/mapa-publicado.test.ts`.

**Golden del visor regenerados contra la corrida ACTUAL** (v1.2, plan v1.4; antes de la v1.5 y de la de 200). El diff de
`tests/golden/visor/demo-a.{es,en}.svg` es de 10 líneas por idioma, y nada más se movió:
- `data-condiciones`: las 4 ramas `rama-por-defecto = true` pasan a `por_defecto`, y `texas-y-no-aprobar = true` pasa
  a `texas_y_no_aprobar(modo-texas,propuesta)`;
- trazos de los glifos: la estrella a 1 decimal (`M0.0,-8.2 L2.1,-2.8 …`) y el hexágono con 6,9 en vez de 6,93, como
  en la tabla del § 5.4.

**Lo que queda fuera, con nombre:**
- el semáforo de vigencia (§ 4.8 y § 5.6) es un **vacío conocido**: el visor no dibuja insignias de vigencia y su
  fecha es una entrada del build (ADR-010, adenda § 3);
- las enmiendas nuevas van al lock (desviación 11).

**Verificación:**
- `pnpm typecheck` · `pnpm lint` · `pnpm test` (108 archivos, 2.589 pruebas, cobertura sin umbrales en rojo);
- `pnpm build`: el mapa A y el del spike pasan Ajv y V1–V17;
- `pnpm diagrama:verificar` (ES y EN: 8 nodos, 13 aristas, 9 reglas) · `pnpm trazas:verificar`;
- `verificar-export` (57 HTML) · `pnpm audit --audit-level high` (1 alta ignorada: `braces`, ADR-015) ·
  `verificar-dependencias` (683 paquetes).

#### Demos en rojo del paso 4 (con `scripts/demo-rojo.sh`)

| Gate | Mutación | Rojo (a quién nombró) | Verde al restaurar |
|---|---|---|---|
| V17 (`validar.test.ts`) | `if (k > 1)` → `if (k > 99)` | «V17: dos ramas por defecto desde el mismo origen» | 14/14 |
| V5, inicio y llegada (`validar.test.ts`) | la condición de llegada pasa a `if (false)` | «V5: un recorrido que empieza o termina lejos del inicio y el fin» | 14/14 |
| `papel` en «diagrama = grafo» (`igualdad.test.ts`) | `if (esperado !== dibujado)` → `if (false && …)` | «rojo si el papel de inicio o fin no es el del grafo» y «rojo si el dibujo pierde un nodo» | 9/9 |
| Ajv del mapa publicado (`mapa-publicado.test.ts`) | `if (esquema.length)` → `if (false && esquema.length)` | «rojo en el build si el mapa del spike no pasa el esquema (fecha sin formato)» | 3/3 |
| Lock multiarchivo (`contratos-lock.test.ts`) | `"minLength": 1` → `2` en la copia de `mapa.schema.json` | «esquema/mapa.schema.json: expected '78769051…' to be '2fd7f762…'» | 13/13 |
| «Diagrama = grafo» sobre la página (`diagrama-igual-grafo.test.ts`) | la rama por defecto vuelve a `"rama-por-defecto = true"` | el golden, la línea inventada y la condición cambiada (3 pruebas) | 8/8 |

La tercera pregunta (¿puede fallar siquiera?):
- la de Ajv solo podía ponerse roja con un dato que las reglas V no ven antes. Se eligió la fecha del spike sin
  formato: ninguna regla V mira el formato de la fecha, y el esquema sí;
- la de V5 necesitaba una prueba propia (un recorrido sin su último o su primer paso). La carnada de «pasos sin
  unión» no la cubría.

### CI del PR #14 sobre `be317ef` y LCP de `/es/agente` (por medir antes de cerrar la fase 0)

`quality`, `e2e` y `python` quedaron en `success`. **`lighthouse` quedó en rojo:**
- `/es/agente` dio un LCP de 2.631 ms contra 2.500 (`lhci assert` de presupuestos);
- `lighthouse-margen` no llegó a correr, porque el paso se cortó antes;
- en la colección local del S2, `/es/agente` daba 2.105 ms. Parece el mismo modo alto bimodal del ADR-011, ahora
  en otra página.

Lo único de `be317ef` que viaja a todas las páginas es `src/lib/sentry-evento.ts`. **Antes de cerrar la fase 0:**
- medir en local `/es/agente` con y sin esa importación (`lhci collect` en el puerto 3007, 3 corridas, luego
  `lhci assert` + `lighthouse-margen`);
- si no es la importación, es la deuda del LCP de la fase 4: se le reporta al usuario con las cifras, sin cambiar
  presupuestos.

## Desviación del plan

1. **Rutas de la orden** (`SPRINT_003-orden.md:65`): `audita-sprint` y `plan-sprint` viven en
   `kit-app/.claude/commands/`, no en `kit-app/.claude/skills/`.
2. **Regresión del kit en `plan-sprint.md` (v1.36.0):** al reemplazar el §9-bis(f), el kit borró sin decirlo en el
   CHANGELOG:
   - el paso 10 («corre `/audita-sprint`»);
   - «`gh pr checks` tras CADA push»;
   - las columnas de la matriz de una fila.
   Aquí se mezcla a mano (el (f) nuevo + lo que se perdió) y se avisa a la casa en el summary.
3. **`lighthouse-margen.mjs` del kit no entiende los presupuestos por ruta del ADR-011:**
   - su comparador conoce `/*`, prefijo `/*` o ruta exacta, y toma la PRIMERA entrada que casa;
   - con el `perf-budget.json` de este repo todo cae en `/*`, así que el script nunca mira el LCP;
   - y su chequeo de cobertura no puede fallar.
   Va con un parche local:
   - la semántica de LHCI (`budgets-converter.js`), compartida con `lighthouse-urls.test.ts`;
   - todas las entradas que casan;
   - LCP exigido por URL.
   Se propone como enmienda al kit.
4. **`verificar-dependencias.mjs`, kit contra app:** el kit decide la base ilegible con `git rev-parse` (falla también
   en local) y deja pasar una base sin lockfile; la app decidía por `CI`. Se adopta el `rev-parse` del kit y se
   conserva el rojo en CI cuando la base no trae lockfile. La prueba se actualiza.
5. **Constitución v1.37.0** (`ordenes/CLAUDE-md-para-app.md`):
   - la regla 26 (worktrees) no lleva número;
   - `lighthouse-margen`, el hook que falla cerrado y las degradaciones declaradas solo aparecen en la cabecera.
   Se sincroniza tal cual (es superset del `CLAUDE.md` actual) y se anota para la casa.
6. **Inconsistencias del diagramador 0.5.0:**
   - el título del contrato dice v0.4.0, y los títulos de los esquemas también;
   - V17 falta en la tabla del § 7;
   - V3 todavía exige una fuente `https`;
   - `lineas` es opcional en el esquema para `codigo`.
   Contra la geometría aprobada:
   - **V5:** un recorrido empieza en `desde_bandas` (`entrada`) y termina en `hasta_bandas` (`salida`), y planlang
     no pone nodos en esas bandas: sus trazas empiezan en `enrutador` (orquestación) y terminan en `guardia_salida`
     (reglas). Se propone que V5 acepte `papel` inicio/fin.
   - **V7:** `bloques_min: 1` frente a un mapa sin bloques.
   Las dos van como desviación con enmienda; la geometría aprobada no se toca.
7. **La plantilla `dom-financiero.json` no alcanza para entrevistar:**
   - 5 preguntas guía sin ejemplo;
   - CT2 cita `umbral.UR`, que no existe;
   - la población de CT4 es imposible con la regla de `adversario_detalle` del A;
   - las claves de RT1/RT3/CT1–CT3 no están en el vocabulario de condiciones.
   Se completa y corrige en la fase 1.
8. **RF-02.5 pide dos contradicciones que M1 no tiene** (severidad ≥ 9 sin criterio que la controle; pausa sin umbral
   que la dispare): módulo nuevo `core/plan/contradicciones.ts`.
9. **La zona gris del investigador no está en el § 10.3 de la especificación:** sale de la entrevista; el builder no
   la fija.
10. **`scripts/capturar-maqueta.mjs` abre la maqueta por `file://`**, y el README de diseño del kit v1.37.0 pide
    capturar sobre la maqueta servida: pasa a servir `docs/diseno`.
11. **`enmiendas_propuestas` del lock del diagramador** (la orden pide `[]`): el lock sí propone tres enmiendas
    (`V5-papel`, `V7-sin-bloques` y `erratas-0.5.0`, cada una con qué y de dónde sale). Son las que el 0.5.0 deja
    abiertas frente a la geometría aprobada (desviación 6), y el lock es donde la casa las lee.

## Registro de miradas

| Fecha | Mirada | Clase | Artefacto | Veredicto del usuario (textual) | Qué se construyó encima |
|---|---|---|---|---|---|

## Bugs y fricciones

| Fecha | Qué | Causa | Resolución |
|---|---|---|---|
