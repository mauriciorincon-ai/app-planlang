# Bitácora — Sprint 003 «Demo B y el cierre del ciclo»

> Orden: `portafolio/planlang/ordenes/SPRINT_003-orden.md` (planeadora, RO) · plan aprobado 2026-10-04 ·
> «construye» 2026-10-04. Checkout principal, sin worktrees, rama `sprint-003/demo-b-y-cierre` desde `main`
> (`0190a62`: S2 + PRs #10–#13). Sprint 3 de 3, cierre del ciclo H1: ⭐⭐ corto obligatorio en el Acto 2 (lo corre
> el usuario); este sprint lo deja caminable. Contrato de fases (kit v1.8.0): cada fase termina con su resumen y
> espera el «continúa».

## Progreso por fase

| Fase | Estado | Cierre |
|---|---|---|
| 0 · Setup, constitución, deltas, diagramador 0.5.0 y plan v1.5 del A | aprobada («continúa»); lote v1.5 de 200 terminado y versionado | 2026-10-04 |
| 1 · Entrevistador M2 → parada de DECISIÓN (plan B) | cerrada: plan B aprobado («apruebo el plan B») | 2026-10-04 |
| 2 · Demo B: sintético, agente y lote de 20 | aprobada («continúa»); la línea base se volvió a correr con el prompt corregido (decisión del usuario: «Correrla») | 2026-10-04 |
| 3 · Brecha B y la vitrina con dos demos | en construcción | — |
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
  - **Corrección del 2026-10-04, decidida por el usuario («Tope por servicio»):** tal como estaba escrita, la regla
    no movía ningún caso. El `tope_alto_costo` del plan de beneficios es `umbral.U2`, y la arista 2 de `decision`
    (RB-04, `costo_estimado > U2 → pausa_humana`) atrapa todo caso caro antes de que se evalúe la de Texas.
    `aprobar_parcial` nace ahora de un **tope de cobertura por servicio**:
    - cada servicio que requiere autorización declara hasta cuánto cubre, un dato sintético con semilla del plan de
      beneficios v2 (no es un umbral del agente);
    - si el costo supera ese tope pero no U2, se aprueba hasta el tope y el excedente se niega con una regla nueva,
      RB-08;
    - lo que pasa de U2 sigue con RB-04.
    Esto cambia el plan de beneficios (v2 con huella), el generador (un subtipo nuevo), el plan v1.5 y el lote de 200.
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

### CI del PR #14 y LCP de `/es/agente`: diagnóstico y arreglo

Sobre `be317ef` y sobre `f5280ff`, `quality`, `e2e` y `python` quedaron en `success`, y **`lighthouse` en rojo**:
- en las tres corridas de cada push, `/es/agente` dio 2.627–2.634 ms de LCP contra 2.500;
- no era bimodal: las tres corridas coinciden.

**Diagnóstico:**
1. **A/B local**, con la importación y sin ella, 12 corridas alternadas por variante en el puerto 3007: medianas de
   2.176 y 2.182 ms. Las corridas altas salen en las dos variantes (2.611 · 2.471 y 3.139), así que en local no se
   distinguen. La diferencia entre los dos builds es de 106 bytes (33 comprimidos) en un pedazo compartido.
2. **Se relanzó solo el job `lighthouse` de `main` (`0190a62`): pasó.** Con el mismo runner del día, `main` cumple y
   la rama no. Lo único de la rama que llega a todas las páginas es la importación **estática** de
   `src/lib/sentry-evento.ts` en `instrumentation-client.ts`. El plan aprobado decía ponerla dentro de la importación
   dinámica; la fase 0 la dejó estática por error.
3. **Arreglo** (`9c1c5a6`):
   - la limpieza llega con Sentry, detrás de `if (dsn)` (`Promise.all` de las dos importaciones);
   - sin DSN, el pedazo de 335 bytes de `sentry-evento` ya no lo carga ninguna página;
   - **resultado: los 4 checks en `success`, `lighthouse` incluido.**
   - Guarda nueva en `sentry-evento.test.ts`: `instrumentation-client.ts` no lleva importaciones estáticas. Demo en
     rojo con `demo-rojo.sh`: se reinserta `import { limpiarEvento } …` arriba → «expected '// Sentry client-only…'
     not to match /^\s*import\s/m» → restaurado, 3/3.

**Primera corrida de `lighthouse-margen` en CI** (no hay histórico con qué comparar). 6 avisos de LCP con margen menor
al 10 %:

| URL | Mediana | Presupuesto | Margen |
|---|---|---|---|
| `/es/agente` | 2.484 | 2.500 | 0,6 % |
| `/es` | 2.393 | 2.500 | 4,3 % |
| `/en` | 2.312 | 2.500 | 7,5 % |
| `/es/fichas` | 2.314 | 2.500 | 7,5 % |
| `/es/caso/A-004` | 2.309 | 2.500 | 7,6 % |
| `/es/plan` | 2.294 | 2.500 | 8,2 % |

Es la medición de partida de la deuda de LCP de la fase 4: ahí se mide y, si no alcanza, STOP con las cifras. No se
cambió ningún presupuesto.

### Plan v1.5 del A y su agente (paso 5)

#### 5.1 · Plan de beneficios v2 y generador 1.1.0 (aprobación parcial)

- **Plan de beneficios v2.0.0** (`data/plan-beneficios/demo-a-v2.json`, huella `aea5fe3a…`), con la enmienda
  `scripts/enmienda-plan-beneficios-demo-a.ts` y su CLI `scripts/enmendar-plan-beneficios-demo-a.ts`. El v1.0.0 queda
  intacto. El v2 trae:
  - **topes por regla fija**: los servicios de imagen, diagnóstico y rehabilitación que requieren autorización y
    cuestan entre 300 y U2 cubren el 70 % de su costo, redondeado hacia abajo a decenas;
  - 6 servicios con tope: `SYN-P-001` 850→590, `-003` 600→420, `-016` 520→360, `-017` 350→240, `-019` 700→490 y
    `-028` 480→330;
  - **RB-08** («se aprueba hasta el tope y el excedente se niega; con el modo Texas, decide una persona»), y RB-07 ya
    no dice «ninguna condición anterior».
- **Esquema:**
  - `tope_cobertura` opcional, solo en servicios que requieren autorización y siempre menor que el costo;
  - `aprobar_parcial` entra a `DECISIONES`, `modo_texas` a los motivos y `normal_sobre_tope` a los subtipos.
- **Generador 1.1.0:**
  - con un plan de beneficios que trae topes, el subtipo `normal_sobre_tope` entra a la bolsa y a la garantía del
    primer bloque;
  - la verdad conocida decide `aprobar_parcial` cuando el costo pasa el tope;
  - el motivo `modo_texas` se suma si U4 está encendido y la decisión no es `aprobar`;
  - un «aprobable» nunca cae en un servicio con tope.
  - **Sin topes, los bytes son los de la 1.0.0**: los tres lotes versionados se regeneran idénticos, y la prueba de
    frescura sigue en verde.
- **M-18 (lado TS):** `exigirTopeAltoCosto` lee el `tope_alto_costo` del plan de beneficios y exige que nombre el
  umbral del costo estimado (U2). Si no, el lote no se genera.
- **Pruebas:** `plan-beneficios-v2.test.ts` (6) y el ajuste de `generador.test.ts`. Hay 2.597 en verde.

| Gate | Mutación | Rojo (a quién nombró) | Verde al restaurar |
|---|---|---|---|
| Deriva del plan de beneficios v2 | un tope 590 → 600 en el archivo | «es la enmienda del v1.0.0, sellada…» y «6 topes por la regla fija…» | 6/6 |
| M-18, tope de alto costo leído | la condición de `exigirTopeAltoCosto` pasa a `if (false)` | «M-18: el tope de alto costo… tiene que ser el umbral del costo (U2)» | 6/6 |
| Motivo `modo_texas` | `if (false && umbrales.U4)` | «siembra aprobaciones parciales que solo escalan con el modo Texas» | 6/6 |

#### 5.2 · Plan v1.5 del A y su lote de 200

- **`plans/demo-a/v1.5.json`** (huella `e1dc89c7…`, aprobada por Mauricio Rincón el 2026-10-04 en el G-Plan).
  Sale de `enmendarAV15` (`scripts/enmienda-plan-demo-a.ts`; CLI `--a 1.5`) y M1 la valida. Trae:
  - **la aprobación parcial**:
    - D2 refina su opción elegida («aprobar y aprobar en parte; negar y escalar exigen pausa humana; con el modo
      Texas, también la aprobación en parte»), con una justificación que cita TX SB 815;
    - **R10** (con Texas, una negación parcial sin humano; S9 · O2 · D3, control legal) y **C10** (con Texas,
      ninguna negación ni parcial sin pausa) la vigilan;
    - **C8** suma `aprobar_parcial` a su población: toda decisión adversa lleva documento;
    - la nota de la función `texas_y_no_aprobar` nombra «negar o aprobar en parte»;
    - C1 queda igual: la negación completa siempre pasa por una persona;
  - **M-16:** `carga_detectada → pausa_humana` es la arista 1 de `decision`, y las demás bajan un lugar (Texas queda
    en la 6). La señal es obligatoria en la traza y es una mitigación nueva de R3;
  - **M-8:** `payload_minimo` de la pausa suma `orden_adjunta`, `aclaraciones` y `cobertura`;
  - **U2 con su unidad en ES y EN**; los demás umbrales no cambian;
  - el flujo objetivo cuenta la guardia de entrada, el tope y la decisión de cuatro salidas;
    `plan_beneficios_sintetico.topes_de_cobertura: 6`.
- Las calificaciones S/O/D de R10 las propone el builder, copiando las de R1 (mismo daño, parcial), y se declaran
  aquí: son del FMEA, no umbrales de comportamiento.
- **Lote `planlang-a-002-200`** (`data/casos/demo-a/`): plan v1.5 y plan de beneficios v2, generador 1.1.0, huella
  `5e76ef4c…`. Trae 169 aprobar, 22 negar y **9 aprobar en parte**; con el modo Texas apagado (el valor del plan)
  ninguna de las 9 escala. La semilla es otra (`002`) porque el subtipo nuevo cambia la mezcla.
  `lotes-versionados.ts` lleva el plan de beneficios de cada lote, y la afirmación de privacidad suma su fila.
- `core/plan/esquema.ts`: `topes_de_cobertura` es opcional, y `plan.schema.json` se regeneró.

**Demo que no podía fallar.** La primera demo en rojo de la v1.5 cambió un dato del archivo y dejó la huella vieja,
y **pasó en verde**. Las pruebas de enmienda (de la v1.1 a la v1.4) comparaban huellas, no contenido, y ninguna
verificaba la huella de un plan. Se reparó de dos formas:
- `enmienda-v1-5.test.ts` compara el archivo entero;
- la guarda nueva `huellas-de-planes.test.ts` verifica la huella de todo plan versionado (los 7).

| Gate | Mutación | Rojo (a quién nombró) | Verde al restaurar |
|---|---|---|---|
| Plan v1.5 = su enmienda | `"topes_de_cobertura": 6` → `7` en el archivo | primero **verde** (demo fallida); con la guarda: «plans/demo-a/v1.5.json: si lleva huella, es la de su contenido» y «se reproduce desde el v1.4…» | 82/82 |
| Huellas de los planes (`huellas-de-planes.test.ts`) | U2 `1000` → `1100` en la v1.2 | «plans/demo-a/v1.2.json: si lleva huella, es la de su contenido» | 9/9 |

#### 5.3 · El agente A en Python (M-8 · M-15 · M-16 · M-18 · aprobación parcial)

- **Aprobación parcial:** `verificador_cobertura` propone `aprobar_parcial` y dispara RB-08 cuando el costo pasa el
  tope del servicio. Con plan de beneficios v2, la cobertura registra `tope_cobertura`.
- **M-18:** `PlanCargado.umbral_de_senal` y `umbral_de_referencia`. Confianza, alto costo y modo Texas se resuelven
  por su señal; el tope de alto costo, por su referencia. Todo se compara con `comparar()`. El `modo_texas` lo deja el
  enrutador, y `estado_inicial` ya no lee `U4`.
- **M-16:** el enrutador escribe `carga_detectada` (`carga_en_entrada`, sin modelo), solo si el plan la declara. El
  exportador la saca a la traza, y la pausa recibe la evidencia «instrucciones escondidas».
- **M-8:** el payload suma lo que pide `payload_minimo` (orden adjunta, aclaraciones y cobertura).
- **M-15:** el documento adverso trae:
  - `decision`, y la regla según la causal (RB-03 o RB-08);
  - el servicio de la orden;
  - `monto` (solicitado, aprobado y negado) si es parcial;
  - `idiomas` calculado de sus textos.
  Si la parte negada sale sin persona, el aviso y «decidido por» lo dicen (`AVISO_IA_SIN_PERSONA`,
  `DECIDIDO_POR_REGLA`). La arquitectura corta una parcial sin pausa con el modo Texas encendido.
- **Prompts:**
  - las reglas nuevas del redactor y de la línea base (`REDACTOR_TOPE`, `AGENTE_UNICO_TOPE`) se suman solo con un plan
    de beneficios con topes;
  - la primera versión las ponía siempre, y `simulado-3casos` y `simulado-v1.4-respaldo` cambiaban de bytes: el
    proveedor simulado cuenta el prompt y daba +47 tokens en el redactor;
  - esas corridas no se regeneraron, porque `runs/` es solo de agregar.
- **`lotes.py`:** sin `--beneficios`, usa el plan de beneficios cuya huella es la del lote (`beneficios_del_lote`).
- **Corrida simulada `runs/demo-a/simulado-v1.5-tope`** (plan v1.5, lote 002, 20 casos; generador
  `agents/tests/v15_simulado.py`), el gate de contrato entre lenguajes de la v1.5:
  - A-006 y A-018 aprueban en parte sin pausa, con documento completo en ES/EN;
  - A-016, una inyección, dispara la arista 1 (`carga_detectada`);
  - `trazas:verificar` la lee entera, con RF-09.2 recalculado en TS y coincidente.
- `grafo-codigo.json` se regeneró: el código se movió y el enrutador ahora escribe `carga_detectada` y `modo_texas`.
- **Pruebas:** `test_v15_versionado.py` (8). pytest da 169 en verde (96,7 %) y ruff está limpio.

#### 5.4 · Lado TS: verificador, playground e informe

- **M-15 (verificador):** `documentoVerificado` recalcula `completo` (los campos requeridos, más `monto` si es
  parcial) e `idiomas` (todo texto bilingüe no vacío). Lo que declara el emisor no entra a C8. Los informes
  publicados no cambiaron: los documentos de las corridas reales ya eran completos.
- **`pausas_cumplidas`** suma «con el modo Texas, una aprobación parcial pasa por una persona».
- **Informe:** `aprobar_parcial` se nombra «aprobar en parte» / «approve in part».
- **Playground:** `propuestaAdversa`. Con la declaración `parcial` del demo, aprobar en parte solo es adversa si el
  modo Texas jugado está encendido; si no, sigue la regla del S2. El manifiesto no la declara todavía (fase 3), así
  que el compacto no cambió.
- **Hallazgo de proceso:** la guarda «el núcleo no conoce ningún demo» atrapó un literal `"propuesta"` en un tipo
  `Pick<…>`, y se reescribió.

#### 5.5 · M-17: la línea base de extracción por patrones, medida

`scripts/linea-base-patrones.ts` (nombres del catálogo, expresión del costo, palabra clave de urgencia). La prueba
`tests/unit/guardias/linea-base-patrones.test.ts` fija las cifras y exige que el ADR-001 las cite.

| Lote | Patrones (4 campos exactos) | Modelo (corrida real) |
|---|---|---|
| 20 | **14 de 15** | 15 de 15 |
| 200 | **152 de 153** | 150 de 153 |

**Hallazgo para el usuario:** en el conjunto sintético, los patrones alcanzan al modelo campo a campo, porque las notas
salen de plantillas. El ADR-001 lo dice en una adenda: el modelo se sostiene por la confianza calibrada y por la
resistencia a la inyección (A-006 hace que la palabra clave marque urgencia), no por una exactitud mayor, que no está
medida aquí. Un conjunto con texto realmente libre queda como deuda del método.

**ADR-016** («aprobación parcial y modo Texas»): registra todo lo anterior. Las fichas se regeneraron (13 ADR).

| Gate | Mutación | Rojo (a quién nombró) | Verde al restaurar |
|---|---|---|---|
| M-16 `carga_detectada` (Python) | el enrutador escribe `False` | «test_la_corrida_v15_se_regenera_identica» | 8/8 |
| RB-08 parcial (Python) | la propuesta vuelve a `aprobar` | regeneración idéntica y «…con_texas_pasa_por_una_persona» | 8/8 |
| Texas corta una parcial sin pausa | `if False and …` | «test_con_texas_la_arquitectura_corta_una_parcial_sin_pausa» | 8/8 |
| M-8 payload | `payload.update({})` | regeneración idéntica | 8/8 |
| M-18 referencia | la comprobación de la referencia pasa a `if False:` | «test_m18_umbrales_por_senal_y_tope_por_referencia» | 8/8 |
| Aviso sin persona | `aviso_ia` devuelve siempre `AVISO_IA` | regeneración idéntica | 8/8 |
| `pausas_cumplidas` con Texas (TS) | se quita la cláusula de Texas | «con el modo Texas, una aprobación en parte sin pausa falla…» | 16/16 |
| M-15 `completo` recalculado (TS) | `completo: doc.completo` | «M-15: el verificador recalcula completo e idiomas…» | 16/16 |
| Playground parcial (TS) | `propuestaAdversa` devuelve `true` | «aprobar en parte es adversa solo con el modo Texas jugado encendido» | 16/16 |
| Línea base por patrones | la urgencia solo en plural | «lote de 20: 14 de 15…» y «lote de 200: 152 de 153…» | 3/3 |

En M-16, M-8 y el aviso, quien atrapa la mutación es la regeneración byte a byte de la corrida versionada (como el
respaldo del S2): las pruebas de comportamiento leen los archivos versionados.

#### 5.6 · Lote real de 200 de la v1.5 (en fondo)

- **El usuario lo aprobó** el 2026-10-04 con la opción «Sí: humo y lote», después de saber que LangSmith no está
  configurado y que la vitrina publica la de 200 de la v1.4 si este no termina antes del merge.
- **Humo real del adaptador: 3/3** (`PLANLANG_HUMO_REAL=1`, CLI 2.1.282, 6,9 s).
- **LangSmith no está aprovisionado:** no hay `LANGSMITH_API_KEY` en `.env.local` ni en el entorno (comprobado sin
  imprimirla). La corrida va sin espejo.
- **Corrida `suscripcion-planlang-a-002-200-v1.5`:**
  - plan v1.5, lote 002, plan de beneficios v2 (elegido por la huella del lote), `sonnet`;
  - 10 sesiones de 20 casos, 2 s entre casos y 10 min entre sesiones, fuera de CI;
  - el ciclo se detiene ante un límite de uso o un error;
  - **arrancó el 2026-10-04 a las 12:36**. Su resultado, `trazas:verificar` y el informe van a la bitácora cuando
    termine.
- **Sesión 1** (12:36–12:40, 20 casos, 0 errores):
  - **20 de 20 decisiones iguales a la verdad conocida**;
  - A-006 y A-018 aprueban en parte **sin pausa**, con documento completo en ES/EN (RB-08, monto) y el aviso «sin
    revisión de una persona»;
  - A-016 (inyección) dispara `carga_detectada` y pasa a una persona;
  - `trazas:verificar` ✓ sobre la corrida parcial (RF-09.2 TS = Python con el modelo real).
- **CI del PR #14 sobre `8a9c00b`:** quality, python, e2e y lighthouse en `success` propio.
- **Terminó el 2026-10-04 a las 14:50:** 10 sesiones (12:36–14:50), **200 de 200 casos, 0 errores del proveedor, 0
  límites de uso**.
  - **200 de 200 decisiones iguales a la verdad conocida:** 169 aprobar, 22 negar y 9 aprobar en parte.
  - Las 9 parciales salen **sin pausa** (modo Texas apagado, valor del plan), con su documento completo.
  - 70 casos con pausa humana, entre ellos las 9 cargas que detectó la guardia de entrada (M-16).
  - 459 llamadas al modelo con **0 reintentos de esquema** (`--max-turns 2`, ADR-004); costo nominal US$ 4,92
    (la suscripción no cobra por llamada); latencia mediana 8,2 s por caso.
  - `pnpm trazas:verificar` ✓ sobre las 11 corridas: RF-09.2 cruza TS y Python en los 200 casos reales.
- **Informe de brecha** (`brecha:informe`, sin línea base, como la de 200 de la v1.4): **⚠ cumple con alertas**.
  - **Criterios: 9 cumplidos, 0 fallidos, 1 sin cerrar.** C5 (exactitud de extracción) mide 96,2 %, pero exige
    pass^3 y esta es una sola corrida.
  - **Riesgos ocurridos: ninguno.**
  - **Supuestos:** S1 confirmado; S2 refutado (2 ciclos de aclaración resuelven el 83,3 % de 24 casos incompletos,
    no el 95 %); S3 sin probar (no hay línea base de 200).
  - **Brechas no previstas:** las extracciones de A-022, A-126 y A-139 no coinciden con la verdad conocida; el
    evaluador de exactitud marca 6 en total.
  - `--verificar` ✓ (el informe está al día).
- **La vitrina sigue publicando la de 200 de la v1.4** hasta la fase 4, que decide el cambio (plan, paso 4 de los
  cierres).

## Fase 1 — Entrevistador M2 → parada de DECISIÓN (desde 2026-10-04)

### Qué se construyó

- **Plantillas de dominio 1.1.0, selladas** (las dos traían `huella: null`):
  - `PlantillaDominioSchema` gana preguntas con `id`, `seccion`, `ejemplo` ES/EN (RF-02.2) y `obligatoria`, y dos
    propuestas opcionales: `umbrales_sugeridos` (sin valor: `valor_en_plan: null`) y `contrato_sugerido`.
  - `dom-financiero.json`:
    - 14 preguntas en el orden de las secciones (problema · actores · flujo · decisiones · riesgos · supuestos ·
      criterios · umbrales · contrato · lotes);
    - las 5 preguntas de la v1.0.0 se conservan textuales (§ 9.2: no se omite ninguna);
    - la decisión típica DT4 (umbral de escalamiento, § 10.1);
    - la desviación 7 corregida: CT2 sin `umbral.UR`, la población de CT4 posible, claves de RT1/RT3/CT1–CT3 que
      el plan puede declarar;
    - `riesgos_controlados` en los criterios;
    - cuatro umbrales sin valor (similitud, puntaje, inconsistencias, inicio de la zona gris), con los rangos del
      § 10.3;
    - un contrato de grafo para RF-04b.2 (nueve nodos, la pausa del oficial, aristas por umbral y «nunca rechazo sin
      persona»).
  - **Los ejemplos vienen del otro dominio** (salud en la financiera y al revés), para que ningún ejemplo sea la
    respuesta del plan B.
- **Esquema del plan:**
  - `origen` opcional en decisiones, riesgos, supuestos, umbrales, actores, contrato y lotes (RF-02.4; los criterios
    ya lo traían);
  - `riesgos_controlados` opcional en los criterios, y su referencia rota es `REFERENCIA_ROTA` en M1.
  - Los planes del A no cambian un byte ni de huella: son campos opcionales.
- **`core/plan/contradicciones.ts`** (RF-02.5), sobre un borrador que puede no pasar el esquema:
  - `SEVERIDAD_SIN_CRITERIO` (≥ 9);
  - `PAUSA_SIN_UMBRAL`;
  - `UMBRAL_SIN_SENAL`;
  - `UMBRAL_SIN_ARISTA`;
  - `CRITERIO_SIN_REGLA`;
  - `PENDIENTE`.
- **`core/plan/revision.ts`:**
  - la transcripción declarada en Zod (gate de contrato);
  - `revisarBorrador`: M1, las señales no declaradas que bloquearían la aprobación (M-23), contradicciones,
    pendientes y textos redactados por el entrevistador;
  - `impideAprobar`;
  - el documento `revision.{es,en}.md`.
- **`agents/src/app_agents/entrevistador/`** (LangGraph):
  - `grafo.py`: elegir → preguntar (`interrupt`) → incorporar → cerrar; otra pasada solo con lo pendiente o lo
    forzado;
  - `plantilla.py`: propuestas e ids DT1 → D1, `umbral.UT1` → `umbral.U1`;
  - `respuestas.py`: «acepto», «pendiente» y «salir» sin modelo;
  - `redactar.py`: la única llamada al modelo, con `--json-schema` sacado de `plan.schema.json`;
  - `origen.py`: el origen lo decide el código, y quita las claves de aprobación;
  - `borrador.py`: siempre `borrador`, `huella: null`, y las señales derivadas (RF-02.3);
  - `transcripcion.py`, `vista.py` (consola ES/EN), `cli.py` y `__main__.py`.
  - El hilo vive en `.entrevistas/demo-b.sqlite`: carpeta 700, archivo 600 (regla 17-bis) y en `.gitignore`.
- **Comandos:**
  - `pnpm entrevistar --demo b [--retomar] [--nueva] [--pregunta P13] [--respuestas archivo] [--idioma es|en]
    [--sin-modelo]`: corre Python con la consola heredada y después la revisión TS. Escribe `plans/demo-b/`:
    `v0-borrador.json`, `transcripcion.json` (con huella), `contradicciones.json` (con huella) y
    `revision.{es,en}.md`.
  - `pnpm plan:aprobar --demo b --por --el [--con-contradicciones]`:
    - nunca aprueba lo pendiente;
    - una contradicción solo pasa si el usuario la acepta de forma explícita;
    - no reescribe un `v1.json` existente;
    - aprueba con `aprobarPlan` de M1.
- **ADR-012** «código primero del entrevistador».
- **Fichas:** se regeneraron (14 ADR).

### Pruebas y resultados

- **pytest `test_entrevistador.py` (20):**
  - el golden de la entrevista simulada, con los mismos bytes;
  - el fixture cubre cada pregunta y sección;
  - la carnada «nunca aprueba»;
  - «acepto» no llama al modelo (un modelo que falla la prueba si se le llama), y lo obligatorio con huecos se
    repregunta;
  - fallback literal y fallo del proveedor;
  - el origen por código;
  - retomar desde SQLite (permisos 600/700, pasada 2, `--pregunta`);
  - la respuesta como dato;
  - el esquema de salida;
  - el mapeo de la plantilla;
  - las señales derivadas;
  - el lector de consola;
  - el vocabulario igual al del verificador;
  - los códigos de salida de la consola.
  - Suite completa: **187 passed, 3 skipped, cobertura 96,68 %**.
- **vitest:**
  - `contradicciones.test.ts` (7, un rojo por código; el plan v1.5 del A solo marca R1, R2, R3 y R10, porque nació
    antes de `riesgos_controlados`);
  - `revision.test.ts` (5);
  - `tests/contrato/entrevista-borrador.test.ts` (6 × node y jsdom: esquema, M1, contradicciones, aprobación y la
    marca de pendiente igual en los dos lados);
  - `dominios.test.ts` (+7) y `validador.test.ts` (+1).
  - Suite completa: **117 archivos, 2.823 passed**; `core/plan` 99,6 % líneas · 94,7 % ramas.
- **La entrevista simulada pasa M1 y la aprobación de prueba.** Su única contradicción es real y viene de la
  plantilla: **R4 (inyección, severidad 9) no tiene criterio que lo controle** (el § 10.3 no trae uno).
- **Humo de la CLI, sin modelo** (`--sin-modelo --respuestas`):
  - corre de punta a punta;
  - `--retomar` hace la pasada 2 solo con lo pendiente;
  - sin `--retomar` se niega con la entrevista guardada;
  - `plan:aprobar` se niega con pendientes y no escribe `v1.json`.
  - Lo generado (`plans/demo-b/`, `.entrevistas/`) se borró: `plans/demo-b/` es la salida de la entrevista del
    usuario.
- `pnpm typecheck` ✓ · `pnpm lint` ✓ · `ruff check` / `ruff format --check` ✓.

#### Demos en rojo de la fase 1 (con `scripts/demo-rojo.sh`; todas restauradas y en verde después)

| # | Gate | Mutación | A quién nombró el rojo |
|---|---|---|---|
| D1 | golden de la entrevista simulada | `VERSION_DEL_PLAN` 1.0.0 → 1.0.1 | `…regenera_con_los_mismos_bytes`: `v0-borrador.json` |
| D2 | carnada «nunca aprueba» | `CLAVES_DE_APROBACION` → solo `huella` | `test_carnada_nunca_aprueba`: `aprobado_por` |
| D3 | origen por código | aceptar «plantilla» declarada | `test_el_origen_lo_decide_el_codigo` |
| D4 | hilo privado (17-bis) | `chmod 0o600` → `0o644` | `test_se_retoma…`: `420 == 384` |
| D5 | «acepto» con huecos se repregunta | la condición → `if False:` | `test_aceptar_no_llama…`: `0 == 8` |
| D6 | señales derivadas (RF-02.3) | `if True:` en la derivación | **no se puso rojo**: `fixture_cubre` lee el fixture comiteado. Tercera pregunta: se agregó `test_rf_02_3_…`, que corre el código |
| D6b | señales derivadas, prueba directa | igual | `test_rf_02_3_…`: `[] == [...]` |
| D7 | `SEVERIDAD_SIN_CRITERIO` | 9 → 10 | `contradicciones.test.ts` (3 pruebas) |
| D8 | `PAUSA_SIN_UMBRAL` | quitar «ligada a un umbral» | `rojo: una pausa que solo activan aristas sin umbral` |
| D9 | contrato Python ↔ TS de la marca | la marca de Python cambia | `entrevista-borrador.test.ts` (node y jsdom) |
| D10 | plantilla sellada | «jamás» → «nunca» sin resellar | `dominios.test.ts`: huella |
| D11 | M1: `riesgos_controlados` rotos | el bucle no recorre nada | `validador.test.ts`: `[] == [[REFERENCIA_ROTA, C1]]` |
| D12 | lo pendiente impide aprobar | quitar `hayPendientes` | `revision.test.ts`: «una sola pregunta pendiente basta». Antes de la demo, la prueba que había no podía fallar (su borrador ya lo rechazaba M1): se agregó la que aísla la regla |
| D13 | M1 rechaza un texto pendiente (`TEXTO_PENDIENTE`) | el bucle no recorre nada | `validador.test.ts`: «un texto que el entrevistador dejó sin redactar no pasa M1» |
| D14 | de la prosa no se derivan señales | quitar `es_condicion` | `test_la_prosa_en_una_condicion_no_deriva_senales`: `[{'senal': 'p…` |
| D15 | el modelo no borra con `null` | quitar la restauración de campos | `test_el_modelo_no_borra_con_null…`: `(None, None, 'entrevistador')` |
| D16 | el modelo no descarta elementos | `if True:` en la restauración | `test_el_modelo_no_descarta_elementos…`: `['D4'] == ['D1', 'D2', 'D3', 'D4']` |

### Humo real del entrevistador (aprobado por el usuario: «Sí, 3 llamadas», 2026-10-04)

- **3 de 3 redacciones** con la suscripción (`sonnet`), en 42 s, sin reintentos de esquema ni errores. Respuestas del
  fixture de prueba (valores distintos del § 10.3) a criterios, umbrales y un cambio al contrato; las demás preguntas
  en «acepto» o «pendiente». Nada se escribió en `plans/demo-b/`; el resultado quedó en el scratchpad.
- **Lo que hizo el modelo:**
  - criterios: C1–C4 sin cambios (origen «plantilla», confirmado por código) y C5 nuevo («usuario»), con su
    explicación de qué registra el agente;
  - umbrales: los cuatro valores dichos (0,9 · 70 · 1 · 0,75), sin inventar ninguno;
  - contrato: la arista nueva `coincidencia_exacta_vinculante == true → pausa_humana` como la primera de
    `verificador_listas`, con el orden renumerado y la señal nueva declarada; origen «usuario».
  - El código sumó la señal `extraccion_correcta` que lee C5 (RF-02.3).
- **Costo nominal:** US$ 0,04 · 0,05 · 0,10 por llamada (la suscripción no cobra por llamada).
- **El borrador del humo pasa M1** y su única contradicción no pendiente es la de R4.
- **Dos arreglos que salieron del humo:**
  - **M1 aceptaba un texto con la marca de pendiente** (una cadena pasa el esquema). Solo `plan:aprobar` lo frenaba;
    `pnpm plan:validar --aprobar` lo habría aprobado. Ahora M1 lo rechaza con `TEXTO_PENDIENTE`, sea cual sea el
    camino (D13).
  - **La transcripción contaba 2 tokens de entrada:** solo `input_tokens`. Ahora registra el tamaño de contexto
    (entrada + creación + lectura de caché, estándar 7-S).

### Parada de DECISIÓN — la entrevista, por delegación explícita (excepción nombrada)

- **Qué dijo el usuario** (2026-10-04, textual): primero «No la verdad estimalo no importa cual sea que sea un buen
  proceso ya eso es todo, es un demo no hay que darle tanta importancia», y después, ante la pregunta de permiso,
  «corre la entrevista con tus respuestas». No es la excepción de las 48 h de la orden: es una delegación
  explícita de las RESPUESTAS. La aprobación sigue siendo suya.
- **Cómo se respondió:** las respuestas están en `plans/demo-b/respuestas-por-delegacion.json` (versionado). Lo que
  trae el § 10.3 de la especificación va tal cual (similitud 0,85; 0 inconsistencias; criterios y riesgos de la
  plantilla; el supuesto del investigador). Lo que el § 10.3 no trae lo estimó el constructor y queda marcado
  «(estimado)» en el plan: **puntaje para escalar 60**, **zona gris desde 0,70**, pesos del puntaje 40/30/30,
  conservación de cinco años y **C6**, el criterio que controla el riesgo de inyección (sin él, el borrador traía
  una contradicción).
- **Tres corridas, 27 llamadas, US$ 1,28 nominal.** Las dos primeras las rechazó M1, y cada rechazo destapó un
  hueco del entrevistador que el humo de 3 llamadas no había visto:
  1. (corrida 1) al redactar D4, el modelo devolvió D1–D3 «decididas» con `opcion_elegida` y `justificacion` en
     `null`, y dejó D4 abierta; y en S1 escribió prosa como población («Coincidencias por similitud de nombre en
     el lote de 20 casos.»), de donde el código derivó «por», «de», «el»… como señales obligatorias.
     **Cierres:** el modelo no borra con `null` lo que la propuesta traía (se restaura); una decisión «decidida»
     sin opción es redacción inválida (queda literal y pendiente); de la prosa no se deriva ninguna señal
     (`es_condicion`, un filtro de forma: el parser sigue en TS). Regla 9 del prompt y «nunca prosa» en la 7.
  2. (corrida 2) al redactar D4, el modelo devolvió SOLO D4: U1 y U4 quedaron apuntando a D1 y D2, que ya no
     existían; y en S1 escribió la lista con paréntesis (`IN ('a','b')`). **Cierres:** el modelo no descarta
     elementos de la propuesta: los que faltan se restauran en su lugar y el turno lo registra (`restaurados`);
     «devuelves la sección COMPLETA» y «listas entre corchetes» en el prompt. Y dos respuestas del constructor se
     hicieron explícitas (P07 «elijo la segunda opción»; P10 con la medición como expresión).
  3. (corrida 3) **M1 acepta, 0 contradicciones, 0 pendientes, nada restaurado.** 4 decisiones decididas, 4
     umbrales con valor, 6 criterios (C5 exactitud ≥ 90 %, C6 inyección 100 % controlando R4), S1 medible con
     umbral de confirmación 0,8, contrato de 9 nodos; el código sumó `extraccion_correcta` e
     `inyeccion_neutralizada` a las señales obligatorias.
- **Salida:** `plans/demo-b/{v0-borrador.json, transcripcion.json, contradicciones.json, revision.es.md,
  revision.en.md}` (versionados).
- **Aprobado.** El usuario escribió «apruebo el plan B» el 2026-10-04, después de recibir el resumen del borrador y
  la ruta de `revision.es.md`. `pnpm plan:aprobar --demo b --por "Mauricio Rincón" --el 2026-10-04` volvió a
  validar (M1 acepta, 0 contradicciones, 0 pendientes) y escribió **`plans/demo-b/v1.json`**: `plan-demo-b`
  v1.0.0, huella `0cd6590ccbbb611091bf7acbd369874aa33fc7df95474c8c16f0f0beb9bb86dd`. `pnpm plan:validar
  --verificar` ✓. Desde aquí existe el agente B (fase 2).

## Fase 2 — Demo B: sintético, agente y lote de 20 (desde 2026-10-04, tras «continúa»)

### Qué se construyó

**Conjunto sintético del B** (`core/sintetico/demo-b/`, TypeScript puro, mismos bytes en Node y jsdom):
- `esquema.ts`: listas `planlang-listas/v1` (vinculantes LV y de consulta LC, cada lista con versión y fecha),
  actividades y jurisdicciones inventadas con nivel de riesgo, pesos del puntaje y seis familias de reglas legibles
  (RL coincidencia · RI inconsistencias · RP puntaje · RD propuesta · RG guardias · RV verdad); el caso B (solicitud
  con tres documentos de texto libre bilingües: identidad, actividad económica, origen de fondos; verdad conocida con
  `en_lista`, `en_lista_vinculante`, `similitud_max`, `conclusion_investigador`, `puntaje_riesgo`, `inconsistencias`,
  `decision`, `debe_escalar` y sus motivos); el lote B.
- `similitud.ts`: normalización (tildes por TABLA, no `normalize`, para que Python dé los mismos bytes; tokens
  ordenados) + Jaro-Winkler clásico + redondeo `floor(x·10⁴+½)/10⁴`; `mejorCoincidencia` sobre nombres y alias.
- `reglas.ts`: RI-01–03, RP-01–03 con los pesos del archivo (40/30/30 de D4; los niveles medios 20 y 15 son
  **estimados**, marcados así en el texto de RP-01/RP-02) y `identidadVerificable`.
- `listas.ts`: genera `data/listas/demo-b.json` con semilla (12 entradas vinculantes, 10 de consulta; las 8 primeras
  vinculantes llevan nombres de pila transliterables).
- `generador.ts`: bloques de 20 con 60/15/15/10 (el de 20 es el primer bloque del de 200); 17 subtipos (normal ·
  borde · faltante · adversario: homónimo en la zona gris, homónimo idéntico, transliteración, inyección en el
  documento de fondos, documentos contradictorios, dato sensible de un tercero); garantías por bloque (el lote de 20
  trae un homónimo en la zona gris y una inyección); verdad derivada de las reglas RV y de los umbrales del plan B
  **leídos desde sus aristas** (`umbralDeArista`: el plan B tiene dos umbrales sobre `similitud_max`, U4 y U1, y la
  arista que sale de `verificador_listas` nombra uno y la de `decision` el otro — lección M-18).
- Diccionarios cerrados con apellidos inventados (los de las listas y los de los solicitantes no se cruzan, salvo
  donde el generador construye la coincidencia); años de nacimiento sin día ni mes.
- `validador-identificadores.ts` revisa también los nombres del B (entradas de listas, campos extraídos y titulares)
  sin distinguir mayúsculas; el gate E-11 recorre `data/listas/`.
- Versionados: `data/listas/demo-b.json`, `data/casos/demo-b/{planlang-b-001-20, planlang-b-001-200,
  planlang-b-humo-4}.json` y su `AFIRMACION-DE-PRIVACIDAD.md` (`pnpm casos:generar --versionados --demo b`).

**Agente B** (`agents/src/app_agents/demo_b/`, construido sobre el plan B v1 aprobado):
- Nueve nodos del contrato: `enrutador` (guardia de entrada → `carga_detectada`), `extractor` (modelo,
  `--json-schema`, documentos minimizados entre delimitadores), `verificador_listas` (escritor: `similitud_max`,
  determinista), `investigador` (modelo, solo si la arista ≥ U4 lo manda; recibe datos estructurados, nunca el texto),
  `puntaje` (RI/RP/RD → `puntaje_riesgo`, `inconsistencias`, `propuesta`), `decision` (escritor: las 6 aristas del
  plan), `pausa_humana` (`interrupt` con los 10 campos de `payload_minimo`, evidencia y contraevidencia),
  `redactor` (tipo `regla`: expediente, respuesta y documento adverso POR CÓDIGO; `conclusiones_sin_cita`) y
  `guardia_salida` (identificadores, frases inyectadas, lista blanca → `inyeccion_neutralizada`).
- RF-04b.6 como arquitectura: el redactor corta el caso si va a emitir un rechazo sin pausa o una aprobación con el
  puntaje en o sobre U2 sin pausa (comparado con el intérprete, M-18).
- Espejos de Python: `similitud.py`, `reglas.py` (la firma de `puntaje` solo admite actividad, jurisdicción e
  ingresos), `mundo.py` (las listas con huella verificada).
- `expediente.py`: K1–K9, cada conclusión con su cita (documento, coincidencia con versión y fecha de la lista,
  regla, arista que abrió la pausa, decisión D3).
- Línea base de agente único (`agente_unico.py`, ADR-006): una llamada que extrae y juzga las listas; la arista del
  verificador hacia el investigador se reasigna a `puntaje`.
- Simulación (`simulacion.py`): el oficial sigue la verdad conocida (DA-04); el proveedor simulado responde lo que
  declaró el generador.

**Generalización a N demos sin mover un byte del A:**
- `app_agents/demos.py` (registro: plan, lote y salida por defecto, «mundo» y su clave, grafo, estado, entorno,
  ficha, señales de MEDICIÓN y campos propios de la traza) y `app_agents/nodos_base.py` (utilidades de nodo que usa
  el B; el A conserva las suyas para no mover `data/vitrina/demo-a/grafo-codigo.json`).
- `lotes.py --demo a|b` (`--mundo`, alias `--beneficios`); `exportador.traza_de_estado` toma toda señal declarada del
  estado y escribe los campos propios del B (`coincidencias`, `investigacion`, `puntaje`, `expediente`).
- `extraccion_correcta` (C5) la calcula el ARNÉS al terminar el caso con la verdad conocida, fuera del grafo.
- TypeScript: `CorridaSchema` cita un solo mundo (`plan_beneficios` o `listas`); `TrazaSchema` acepta la extracción
  del B y sus cuatro campos (opcionales: ausentes en el A); el lector elige el esquema del lote por `demo_id` y compara
  el mundo de la corrida con el del lote. `extraccionA()` estrecha el tipo en las dos vistas del A que leen la
  confianza (sin cambio de lo que pintan).
- Corridas simuladas versionadas: `runs/demo-b/simulado-humo` y `-base` (4 casos, reloj fijo).

**ADR-013** «código primero del demo B», con la confesión de que en este conjunto una regla de contexto (mismo año y
nacionalidad) acertaría lo que hace el investigador.

### Pruebas y resultados

- vitest: **124 archivos, 3.007 pruebas en verde** al cerrar la fase (cobertura del núcleo 97,6 %; la cifra de 2.955
  era la del primer commit de la fase). Nuevos: `similitud.test.ts`
  (valores publicados de Jaro-Winkler), `reglas.test.ts` (permutación de nombres), `generador.test.ts` (regenera el
  lote), `casos-versionados-b.test.ts` (frescura), `traza-demo-b.test.ts` (contrato Python → TS), carnada B del gate
  de identificadores.
- pytest: **212 pruebas en verde al cerrar la fase (211 en el primer commit), cobertura 96,5 %** (venía de 74 % con el B sin pruebas). `test_demo_b.py` (21):
  contrato del grafo, corrida versionada idéntica, investigador solo desde U4, el lote de 20 decide lo que dice la
  verdad, expediente con versión y fecha de cada lista, homónimo resuelto sin persona, el oficial corrige al
  investigador, las dos carnadas de arquitectura, inyección, datos de terceros, respuesta sin identificadores, guardia,
  gate TS↔Python, permutación, línea base de una llamada, medición del arnés, lote sin sus listas, CLI.
- `pnpm trazas:verificar`: 15 corridas ✓ al cerrar la fase (las 11 del A y las 4 del B: huellas, esquema, umbrales del
  plan, RF-09.2).
- Job `quality` completo en local: typecheck, lint, test, trazas, build, `verificar-export`, `diagrama:verificar`,
  `pnpm audit` (1 alta ignorada: `braces`, ADR-015), `verificar-dependencias`, `pnpm peers check`; ruff, pytest y
  `pip-audit --skip-editable` en `agents/`.

#### Demos en rojo de la fase 2 (con `scripts/demo-rojo.sh`; todas restauradas y en verde después)

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D17 | Jaro-Winkler (TS) | peso del prefijo 0,1 → 0,2 | `similitud.test.ts`: los tres valores publicados |
| D18 | permutación de nombres (TS) | +5 puntos si la nacionalidad es SYN-J-06 | `reglas.test.ts › PERMUTACIÓN…` |
| D19 | bandas del generador | quitar el tope U1 de la banda del homónimo | **no se puso rojo**: la prueba leía el lote del disco. Corregida para regenerar (D19b). Con eso, quitar el tope U1 (D19b) o el piso U4 (D19e) tampoco cambia nada: con estos diccionarios ningún candidato llega a 0,85 ni baja de 0,70. El filtro de banda que sí se ejerce es el de candidatos (D19f) |
| D19f | bandas del generador | el filtro de candidatos ignora la banda | `generador.test.ts › cada subtipo cae en su banda` (el borde «casi en la zona gris» queda en 0,8686) |
| D20 | frescura de listas y lotes B | una frase de un diccionario | `casos-versionados-b.test.ts`: los lotes |
| D21 | gate E-11 con nombres del B | un nombre de lista fuera del diccionario | **la restauración siguió en rojo**: el gate encontró fechas completas en el TEXTO del expediente (ver bugs). Arreglado y repetido: D21b → `identificadores-en-datos.test.ts` (1 rojo, la lista) |
| D22 | contrato TS ↔ Python | prefijo 0,1 → 0,11 en Python | `test_python_reproduce_la_verdad_que_escribio_typescript` |
| D23 | carnada: rechazo sin pausa | el chequeo → `if False:` | `test_carnada_nunca_un_rechazo_sin_pausa` |
| D24 | carnada: aprobación automática con riesgo alto | el chequeo de U2 → `False` | `test_carnada_nunca_una_aprobacion_automatica…` |
| D25 | corrida simulada versionada del B | una frase del expediente | `test_la_corrida_simulada_versionada…` (las dos) |
| D26 | investigador solo desde U4 | `similitud_max` → 1,0 | `test_el_investigador_corre_solo_desde…` |
| D27 | minimización | el extractor recibe el texto crudo | `test_los_datos_de_terceros_no_llegan_al_modelo…` |
| D28 | guardia de salida | el patrón ya no ve `SYN-ID-` | `test_la_guardia_de_salida_filtra…` |
| D29 | permutación (Python) | la nacionalidad borra la jurisdicción | `test_permutacion_el_puntaje_no_lee_a_la_persona` |
| D30 | RF-09.2 cruzado TS ↔ Python | `igual_a` invertido en el intérprete TS | `pnpm trazas:verificar`: las 13 corridas ✗, incluidas `runs/demo-b/simulado-humo` y `-base` |
| D31 | medición del arnés (C5) | `extraccion_correcta = True` | `test_el_arnes_mide_la_extraccion…` |
| D32 | contrato Python → TS de la traza B | `"expediente"` → `"expedient"` en una traza | `traza-demo-b.test.ts` (Zod: clave no reconocida) y el lector |
| D21c | nombres del B sin tildes ni caja | el vocabulario sin normalizar | `identificadores-en-datos.test.ts › demo B`: «Lucia Varnesa Quindral» |
| D21e | un nombre del diccionario en un campo de documento (B) | la excepción acepta cualquier valor | `identificadores-en-datos.test.ts › demo B`: «Pedro Ramírez» en `documento` deja de marcarse |
| D33 | la línea base recibe las mismas instrucciones | las reglas de extracción → una frase | `test_la_linea_base_recibe_las_mismas_instrucciones…` |

### Humo real y lote real de 20 (aprobado por el usuario: «Humo + 20 + base», 2026-10-04)

LangSmith: sin clave en el entorno (comprobado sin imprimirla): el espejo queda **declarado fuera**. Estimación dada
antes de pedir permiso, con la corrida de 200 del A: ~50 llamadas, 4,1 s de mediana y US$0,0105 nominales por
llamada.

- **Humo de 2 casos** (fuera de `runs/`, en el scratchpad: B-010 homónimo en la zona gris y B-019 inyección; 3
  llamadas, US$0,049): extracción idéntica a la verdad en los dos; el investigador concluyó «homónimo» por la
  diferencia de 16 años y la otra nacionalidad; la inyección se detectó, fue al oficial y quedó neutralizada.
- **`runs/demo-b/suscripcion-planlang-b-001-20`** (multiagente, una sesión, sin errores ni límites): **20/20
  decisiones = verdad**, **20/20 extracciones exactas** (C5), el investigador vio 6 casos y acertó los 6 (el homónimo
  de la zona gris y cinco personas listadas), 11 pausas, 0 conclusiones sin cita, severidad 0 en los 20. **26
  llamadas, US$0,293.**
- **`runs/demo-b/suscripcion-planlang-b-001-20-base`** (línea base de agente único, una sesión, sin errores):
  **20/20 decisiones = verdad**, pero **1/20 extracciones exactas**. 20 llamadas, US$0,550. **Defecto del builder,
  no del agente único:** su prompt resumía las reglas de campo y no decía qué es `titular_actividad` (el número con
  que se firma la declaración de actividad): quedó vacía en 16 casos y con un NOMBRE en 3 (B-001, B-009, B-020).
  En esos 3, RI-02 volvió «no verificable» la identidad, la propuesta fue rechazar y el oficial corrigió. La corrida
  se versiona tal cual (append-only: es lo que corrió) y la comparación multiagente ↔ línea base de esta corrida
  **no mide la arquitectura**: lo dirá el informe B. Corrección: el prompt de la línea base ahora trae, palabra por
  palabra, las reglas del extractor y las del investigador, con su prueba (D33). Volver a correr la línea base con
  el prompt corregido cuesta 20 llamadas más: **se pregunta al usuario** al cerrar la fase.
- El gate E-11 se puso en rojo sobre la línea base: el modelo escribió nombres del diccionario en
  `titular_actividad`, un campo de documento que exige `SYN-`. No son identificadores reales: en los campos del B
  se acepta un nombre entero del diccionario cerrado; uno de fuera sigue en rojo (carnada y D21e).
- `pnpm trazas:verificar` ✓ sobre las cuatro corridas del B.

## Fase 3 — Brecha B y la vitrina con dos demos (desde 2026-10-04, tras «continúa»)

### Línea base corregida (decisión del usuario: «Correrla (Recomendado)», 2026-10-04)

`runs/demo-b/suscripcion-planlang-b-001-20-base-v2` (una sesión, 2 s entre casos, sin errores ni límites; LangSmith sin
clave): **20/20 decisiones = verdad, 20/20 extracciones exactas (C5)**, 11 pausas, 20 llamadas, US$0,454 nominales. Con
el prompt corregido (D33) el agente único extrae igual que el multiagente: el 1/20 de la primera línea base era el
defecto del builder, no de la arquitectura. La primera (`-base`) queda versionada tal como corrió.

### Verificador para el B (M-20) y plan B v1.1 (M-25)

- **Lector por demo:** `core/sintetico/de-demo.ts` (`LoteDeDemo`, `CasoDeDemo`, `esquemaDeLote`, `mundoDe`,
  `casosPorId`); `leerEntrada` valida el lote con el esquema de su demo; el contexto de las reglas usa el caso común.
- **M-20, registro de evaluadores por dominio** (`core/brecha/evaluadores.ts`): las reglas del A salen de
  `brechas-no-previstas.ts` sin cambiar un carácter; el B declara `pausas_cumplidas` (escalar ⇒ pausa; `rechazar` ⇒
  pausa), `expediente_con_cita` (`conclusiones_sin_cita == 0`, atribuida al redactor) e `inyeccion_neutralizada`
  (atribuida al enrutador, la guardia de entrada). Un dominio sin registro deja sus evaluadores «sin implementación».
  Antes del registro, el informe B medía `pausas_cumplidas` con la regla del A (20 casos no evaluables: no existe
  `modo_texas`) y decía «sin implementación» para `expediente_con_cita`.
- **Casos ejemplares:** la severidad de acción se lee de la señal (A) o del registro de la guardia de salida (B); el
  informe nombra los ataques del B (transliteración, documentos contradictorios).
- **Tres huecos del plan B v1, encontrados al medirlo** (el v1 se aprobó con ellos y M1 no los ve):
  1. 24 textos solo en español (opciones de D1, D3 y D4; mitigaciones de R1–R4), heredados de la plantilla;
  2. S1 declara su mínimo con una clave que el verificador no decide (`proporcion_homonimos_resueltos_bien`): queda
     «sin probar» aunque se midió 1 de 1;
  3. ningún supuesto compara el multiagente con la línea base que el contrato exige (regla dura 10).
  **Decisión del usuario (2026-10-04, AskUserQuestion): «v1.1 con los tres (Recomendado)»** → `plans/demo-b/v1.1.json`
  (huella `30728d94…`), por `scripts/enmendar-plan-demo-b.ts` (función pura `enmendarBV11`, reproducida por test):
  inglés de los 24 textos (el español del v1, palabra por palabra), S1 con `tasa_min: 0.8` (mismo mínimo, misma
  condición), S2 nuevo con la regla estricta que el usuario eligió para el A (no peor en exactitud ni en latencia, a un
  presupuesto no mayor). `mismaVerdad(v1, v1.1)`: umbrales, contrato de grafo y criterios intactos, así que las
  corridas del B valen (ADR-005). **La redacción en inglés la revisa el usuario al cierre de la fase; si la objeta, se
  rehace.**
- **El origen se corrige también** (para que la próxima entrevista no repita los huecos):
  - tres contradicciones nuevas en `core/plan/contradicciones.ts`, que impiden aprobar sin `--con-contradicciones`:
    `SOLO_UN_IDIOMA` (por elemento, con las rutas), `SUPUESTO_NO_DECIDIBLE` (claves de `umbral_confirmacion` que el
    verificador no decide, o ninguna fuera de la línea base) y `SIN_LINEA_BASE` (el contrato exige línea base y ningún
    supuesto la compara). Las familias y claves decidibles viven en `core/plan/supuesto-medible.ts`, que el verificador
    también usa;
  - `data/dominios/dom-financiero.json` (huella `0af3185f…`): opciones y mitigaciones bilingües y
    `supuestos_sugeridos` con la línea base (ST1); el esquema de plantilla suma `supuestos_sugeridos` y el entrevistador
    los propone en la sección de supuestos;
  - regla 10 del prompt de redacción: las tres formas de `medible_en_trazas` que el verificador decide;
  - entrevista simulada regenerada: la respuesta a P10 conserva la línea base y suma la hipótesis del investigador; la
    opción elegida va en los dos idiomas. Sigue con una sola contradicción real (R4 sin criterio).
- **Informe B (borrador, en el scratchpad hasta la vitrina):** con la v1.1 y la línea base corregida, **cumple con
  alertas**: 6/6 criterios, ningún riesgo ocurrido, 3 evaluadores sin fallas; **S1 confirmado** (1 de 1, muestra
  pequeña) y **S2 refutado**: misma exactitud (100 % y 100 %), latencia mediana 6,005 s frente a 5,868 s, y la línea base
  gastó MÁS (US$0,454 frente a 0,293): la comparación no fue a igual presupuesto, y el informe lo dice.

### Informe sin fragmentos (deuda del S2: `render-md.ts` 73 ternarios, `m9.ts` 5, más 20 en `core/plan/revision.ts`)

- `core/brecha/textos-informe.ts`: cada frase del informe Markdown escrita entera en cada idioma, con sus datos
  dentro (`TEXTOS_INFORME[i]`); `render-md.ts` solo elige el idioma y pone los datos. Igual en `m9.ts`
  (`TEXTOS_M9`), en `informe.ts` («sin decisión») y en la revisión del borrador (`revision.ts`: cabeceras de tabla,
  nodos, ramas por defecto, señales y el nombre de cada idioma dicho en cada idioma).
- **Bytes:** el JSON del verificador no cambia (solo se tocó el render) y el Markdown tampoco: los seis informes
  publicados del A (cinco corridas y la vitrina) y el reporte M9 salen idénticos (`brecha:informe --verificar`,
  `manifiesto-vitrina.test.ts`, `m9.test.ts`). **No hubo que regenerar nada publicado**, y por eso la ficha de
  reproducibilidad no declara regeneración.
- Dos arreglos de redacción que solo tocan lo que no estaba publicado: la opción elegida que ya termina en punto no
  recibe otro («… sin excepción..» en el informe B), y la revisión del borrador en inglés decía «tipo» y
  «reversibilidad» en sus cabeceras.
- **Guardia extendida** (`tests/unit/guardias/bilingue-fuente.test.ts`): ningún ternario de idioma elige palabras
  en `core/` tampoco. Al extenderla encontró los 99 de arriba; ninguno queda.

#### Demos en rojo (con `scripts/demo-rojo.sh`; todas restauradas y en verde)

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D34 | `SOLO_UN_IDIOMA` | el filtro busca números en vez de cadenas | `contradicciones.test.ts › rojo: textos en un solo idioma…` y `enmienda-b-v1-1.test.ts › el v1 trae los tres huecos…` |
| D35 | `SUPUESTO_NO_DECIDIBLE` | ninguna clave es ajena | `contradicciones.test.ts › rojo: un supuesto que el verificador no sabe decidir…` y la de la v1.1 |
| D36 | `SIN_LINEA_BASE` | la condición `&& false` | `contradicciones.test.ts › rojo: el contrato exige línea base…` y la de la v1.1 |
| D37 | registro del B (M-20) | quitar `dom-financiero` del registro | `evaluadores.test.ts` (las tres) |
| D38 | atribución por dominio | `expediente_con_cita` atribuida al extractor | `evaluadores.test.ts › una falla del B se atribuye a un nodo del B…` |
| D39 | el dominio sale del plan | el registro se consulta siempre con `dom-salud` | `evaluadores.test.ts` (dos) |
| D40 | regla 20 en `core/` | el título del informe vuelve a ser un ternario de idioma | `bilingue-fuente.test.ts › core/ tampoco…`: «core/brecha/render-md.ts:612: «Informe de brecha» / «Gap report»» |

### Vitrina con dos demos — EN CURSO (punto de control antes de compactar, 2026-10-04)

Estado del árbol en el commit local `wip(vitrina)` (no se empujó; la CI no lo ha visto). Lo hecho:

- **Datos:** `DatosDemo` = `DatosDemoA | DatosDemoB` (el B trae `lote: LoteB` y `listas`); el manifiesto declara
  `demo-b` (plan v1.1, corrida real de 20, línea base `-base-v2`, informe en
  `data/vitrina/demo-b/suscripcion-planlang-b-001-20/`, playground con `claves_del_desenlace`); el freno AU-S2-19 pasa
  a «un demo que la vitrina no sabe pintar se detiene con su nombre». `exportar_grafo --demo b` →
  `data/vitrina/demo-b/grafo-codigo.json`.
- **Rutas (ADR-014, por escribir):** `src/lib/demos.ts`; `ruta(idioma, pantalla, id?, demo)` (el A sin prefijo, el B
  bajo `/demo-b/`); `Marco`/`Barra` con `demo` y conmutador A·B solo en las pantallas del B; el cuerpo de cada
  pantalla vive en `src/components/paginas/*.tsx` y las rutas del A y del B (`src/app/[idioma]/demo-b/…`) lo envuelven;
  `metadatos()` antepone «Demo B ·» al título.
- **Núcleo del playground:** `minutos_por_persona: number | null` (el plan B no declara costo humano: la isla cuenta
  casos, no inventa minutos), `personas_plan` en las consecuencias, `claves_del_desenlace` por demo en el manifiesto.
- **Vistas que ya corren con el B** (sonda `tests/unit/vitrina/_sonda-demo-b.test.ts`, TEMPORAL, sin comitear):
  Brecha, Plan, Playground, Entrada (esta todavía pinta solo el A). Categorías de regla por demo y por nodo en
  `motivo-pausa.ts` (B: carga, zonaGris, coincidencia, mismaPersona, riesgo, inconsistencias, rechazar). Textos por
  demo: `src/textos/demo.ts` (`DEMO_TEXTO`), `DESCRIPCION_PAGINA` por demo, y la copia propia del B en
  `src/textos/demo-b/{brecha,plan}.ts` (para que la guardia «copia contra plan» la lea contra el plan B).

Pendiente, en este orden:
1. Vista de **Agente** (`agente.ts`: `CATEGORIAS[d.id]`, `planBeneficios` solo del A, copia B de nodos, ficha, pausas
   del oficial) y de **Caso** (`caso.ts`: la entrada del B son tres documentos, campos, expediente); typecheck hoy:
   10 errores en `agente.ts` y 16 en `caso.ts`.
2. **Entrada** con las dos filas reales; **Fichas** (ficha del agente B, reproducibilidad B).
3. Pruebas: `copia-contra-plan` por demo (top-level contra el plan A, `src/textos/demo-b/` contra el plan B;
   `LECTURA_NOTA["demo-a"]`, `PASO_FUERA["demo-a"]`), `plan.test` (`CRITERIO.lider["demo-a"]`), `agente*.test`,
   `motivo-pausa.test`, `mapa-publicado` (caen por `CATEGORIAS`), pytest de `exportar_grafo` con el B; guardia nueva:
   ninguna página del B lleva vocabulario del A (afiliado, auditor, Texas…) ni al revés; demos en rojo.
4. ADR-014, `lighthouse-urls.json`/`perf-budget.json` con rutas del B, e2e del B, capturas con techo, matriz de la
   mirada de FORMA «no vista», fichas y `brochure-export.json`; borrar la sonda.

### Vitrina con dos demos — Agente y Caso del B (tras compactar, 2026-10-04)

**Vista de Agente partida en esqueleto + perfil por demo.**
- `src/lib/vista/agente.ts`: los tipos y el esqueleto común (experto, contrato, lienzo, paneles, arista, spike).
- `agente-comun.ts`: el contexto de la corrida y la interfaz `PerfilAgente`.
- `agente-a.ts`: lo propio del A, movido sin cambiar una salida.
- `agente-b.ts`: lo propio del B, con su copia en `src/textos/demo-b/agente.ts`: ficha, nueve nodos, tablas de trazas,
  la arista U1 (regla 2 de `decision`, elegida por su categoría «coincidencia», no por id) y la arquitectura.

**Vista de Caso igual:**
- `caso.ts` esqueleto, `caso-comun.ts`, `caso-a.ts` y `caso-b.ts`;
- copia en `src/textos/demo-b/caso.ts`;
- «Recibe» pasa a `documentos` + `datos`: el B trae sus tres documentos, con la instrucción plantada marcada en el
  documento que la trae;
- sección nueva **Expediente**: cada conclusión con su cita (documento, regla, coincidencia con lista, versión y fecha,
  arista, decisión del plan);
- los rótulos de pausa, salida y documento salen de la vista por demo.

**El visor y las plantillas del plan, por demo:**
- `EntradaLienzo.demo`: los textos de nodo, el nombre corto de regla y quién responde la pausa salen del demo;
- `conPlan(texto, plan, i, demo)`: `{plan:lista.<nodo>}` y `{plan:destinos.<nodo>}` nombran las reglas con el
  vocabulario de su demo (`NOMBRE_DE_REGLA_B`, `NODO_DESTINO_B` en `src/textos/demo-b/plan.ts`).

**Frases del A que salían en páginas del B (arregladas):**
- la franja del oráculo («un auditor simulado… afiliados y plan de beneficios») en Brecha, Playground y Casos del B;
- los avisos de «El caso en una mirada»;
- «El spike tenía 3 de 8» en el contrato del Agente (el B no tiene spike: `nodosDetalleSinSpike`).

Además, `GRAFO.nota` decía «contrato 0.3.0»: frase caducada desde el 0.5.0, corregida.

**El A no se movió.** Instantánea del commit `3b494b5` (antes del WIP, exportado con `git archive` al scratchpad,
sin worktree) contra el árbol nuevo:
- `vistaAgente` del A en los dos idiomas: idéntica salvo el campo nuevo `arista.etiqueta`, que lleva el mismo texto
  que antes ponía el componente; el SVG del lienzo, idéntico;
- el HTML de `Caso` para los 20 casos × 2 idiomas, la franja del oráculo y «El caso en una mirada»: 44 de 44 idénticos.

`valorLeido` muestra ahora los decimales que trae el valor (entre 2 y 4): redondear a 2 una similitud de 0,6988 la
pintaba igual que el umbral 0,70 que no alcanzó (B-019). Los valores del A tienen 2 decimales: su HTML no cambió.

**Guardias:**
- `copia-contra-plan` por demo: cada literal se lee contra el plan de su demo (los de `src/textos/demo-b/` y los que
  van bajo una clave `"demo-b"` de un diccionario común, contra el plan B). Se suman la cobertura de
  `PLAN_POR_NODO{,_B}` contra el plan y las vistas del B sin plantillas sin resolver (20 casos × 2 idiomas);
- `textos.test.ts` lee también `src/textos/demo-b/*` (los dos idiomas llenos, el inglés no repite el español; los ids
  de regla y el código puro quedan exentos).

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D41 | `copia-contra-plan` por demo | «(C9)» plantado en `RAMA_B.decision.riesgo` (el plan A tiene C9; el B, no) | `copia-contra-plan.test.ts › ningún texto del demo-b cita…`: «src/textos/demo-b/caso.ts:263 C9»; con la guardia anterior (todo contra el plan A) habría pasado |

**Hallazgos de leer el B (van al summary; las trazas versionadas no se reescriben):**
- el documento de rechazo del B no trae `aviso_ia` propio (el del A sí; regla 12). La respuesta que lo acompaña sí
  lo trae. La vista no lo inventa (`documento.aviso: null`) y el arreglo va al agente B con su próxima corrida;
- el motivo de la pausa que escribe Python pinta los booleanos como `True` (`carga_detectada (True) equal to True`);
- una línea de evidencia del B dice «La nacionalidad (…) es el de la entrada» (concordancia).

### Punto de control antes de compactar (2), 2026-10-04

Commits locales sin empujar desde `5dd76fb`: `9744fc1`, `3b494b5`, `03788b9` (WIP con `--no-verify`, ver bugs),
`e5f2aa9`, `f5cba62` (Agente y Caso del B) y el de este punto de control.

Estado del árbol:
- `pnpm typecheck`, `pnpm lint` y vitest verdes (3.519 pruebas antes de este commit; fichas 31/31);
- **`pnpm build` NO pasa:** se detiene en `/es/demo-b/fichas`, porque la vista de Fichas aún llama
  `fichaAgente`/`brochureExport` con un solo demo.

Hecho en este tramo:
- `src/textos/demo-b/fichas.ts` (`AGENTE_B`: textos de la ficha del agente B);
- `src/lib/fichas/armar.ts`: `fichaAgente` toma textos y cifras de su demo. Cifras del B: exactitud C5, casos con el
  oficial, coincidencias sin persona (C1), rechazos sin persona (C2) y costo por caso; el B no fija latencia. La ficha
  del A sale idéntica (prueba byte a byte de `fichas.test.ts`).

Pendiente, en este orden:
1. **Fichas del B:**
   - `rutas.ts` con ruta por demo (`content/agentes/planlang-demo-b.ficha-tecnica.json` y su `.en.json` en
     `docs/fichas/`);
   - `archivosDeFichas(ds, repo)` con las dos fichas de agente;
   - `brochureExport` con los dos demos: criterios cumplidos y decisiones cruzadas sumados, detalle con las dos
     corridas, costo de una corrida de cada demo;
   - `APP.limites` (frase caducada: «El demo B y el entrevistador llegan después»), `APP.nunca` y `APP.privacidad`
     con solicitante y listas;
   - `vistaFichas(ds, demo, repo, i)`: la ficha de la app es la misma en las dos páginas;
   - `scripts/fichas.ts` y `scripts/paquete-vitrina.ts` (copiar la ficha B);
   - pruebas de fichas por demo, `pnpm fichas`, y verificar el build.
   - Las funcionalidades de la app (`APP.grupos`) suman el demo B y el entrevistador con el manual de la fase 4.
2. **Guardia nueva de vocabulario por demo** como regla 7 de `scripts/verificar-export.mjs` (sobre `out/`):
   - ninguna página bajo `<idioma>/demo-b/` dice palabras solo del A: afiliado, auditor, médico, Texas, plan de
     beneficios / member, auditor, physician, benefits plan;
   - ninguna del A dice las del B: solicitante, oficial de cumplimiento, lista vinculante, homónimo, vinculación /
     applicant, compliance officer, binding list, namesake, onboarding;
   - la entrada queda fuera (lleva las dos filas); decidir si las fichas también (la de la app habla de los dos);
   - con su demo en rojo.
3. **Entrada** con las dos filas reales; el entrevistador sale de «También en construcción».
4. Pytest de `exportar_grafo` con el B; ADR-014; `lighthouse-urls.json` y `perf-budget.json` con las rutas del B;
   e2e del B; paridad del playground B en tres motores; visor B con «diagrama = grafo»; capturas con techo; matriz de
   la mirada de FORMA «no vista».
5. Borrar las sondas temporales sin comitear (`tests/unit/vitrina/_sonda-demo-b.test.ts`, `_volcado-b.test.ts`),
   correr el job de calidad completo, empujar y `gh pr checks`.

Instantáneas del A para repetir la comparación (en el scratchpad de la sesión, no en el repo):
`instantanea-a-antes.json`, `caso-html-antes.json` y las pruebas que las generan (`_instantanea-a.test.ts`,
`_instantanea-caso-html.test.tsx`). Se sacan del commit `3b494b5` exportado con `git archive` en `scratchpad/base/`.

### Vitrina con dos demos — Fichas del B (tras compactar, 2026-10-04)

**Fichas por demo.**
- `src/lib/fichas/rutas.ts`: slug y ruta de la ficha de cada agente (`content/agentes/planlang-demo-{a,b}.ficha-tecnica.json`
  y su `.en.json` en `docs/fichas/`); `archivosDeFichas(ds, repo)` escribe las dos y exige que el slug de cada ficha
  sea el de su ruta;
- `datosDeLosDemos()` en `src/lib/datos/vitrina.ts`: lo que cuenta la app entera;
- `scripts/fichas.ts` y `scripts/paquete-vitrina.ts` (copia y manifiesto) con las dos fichas de agente.

**La ficha de la app cuenta los dos demos** (`brochureExport(ds, …)`, `complementoPropuesto(ds, …)`):
- criterios cumplidos 15 de 15 (9 del A, 6 del B), decisiones cruzadas 313 en 6 corridas, 40 casos sintéticos con
  respuesta conocida y el costo nominal de correr una vez cada demo (US$ 0,9634); cada detalle dice cuánto puso cada
  demo, y ninguna etiqueta asume que los dos tienen el mismo número de casos (la cifra `casos_por_corrida` pasa a
  `casos_sinteticos`, que suma: la corrida de 200 del A no la rompería);
- frases caducadas arregladas: «El demo B y el entrevistador llegan después» (límites), «todo caso, afiliado y médico»
  (nunca: suma solicitante y lista de control), «Niega un caso» (→ «Niega o rechaza»), la privacidad, «el agente del
  demo A» (stack), «la del agente A» (funcionalidad de fichas) y los dos `brochure_*` que prometían `BROCHURE.html` y
  `/conoce` en el sprint 3 (el G-Plan decidió que la vitrina y sus fichas hacen de brochure);
- los grupos de funcionalidades (`APP.grupos`, la línea «el demo A y las corridas por lotes» incluida) se mueven en la
  fase 4 con el manual: cada funcionalidad apunta a una sección real del manual (AU-S2-4).

**La página de Fichas, por demo** (`vistaFichas(ds, demo, repo, i)`): antetítulo, cuadro de reproducibilidad, título de
la sección del agente y lo que se entrega salen del demo; la ficha de la app es la misma en las dos páginas (prueba).

**«Cómo repetirla» con los comandos de verdad.** Los pasos del S2 decían `pnpm plan:validar`, `pnpm casos:generar` y
`pnpm brecha:informe` sin argumentos: el primero y el último salen con «uso:» y código 2 sin hacer nada. Ahora
`pasosDeRepro(d, i)` los arma con los archivos del manifiesto (plan con que se mide, corrida, salida) y nombra la línea
base y las repeticiones solo si no siguen la convención de `brecha:informe` (la del B es `-base-v2`; `-base` es la
primera, descartada). El último paso rehace el informe y lo compara con el publicado (`--verificar`). Se corrieron los
cinco pasos de los dos demos (salvo el lote) y pasan; una prueba exige que cada script exista, cada archivo exista y que
línea base y repeticiones resueltas sean las del manifiesto. `package.json` gana `lote:demo-b`.

**El pie, por demo.** «Todo caso, afiliado, médico y plan de beneficios… las tomaría un auditor médico» salía en las
seis páginas del B. `PIE.sintetico` es por demo; la entrada (sin demo) dice los dos. Con prueba.

**El reparto de columnas de las trazas, por demo.** `PRESENTACION` (`src/components/agente/trazas.tsx`) estaba por
nombre de nodo: el B comparte `enrutador`, `decision`… con otras columnas, y `verificador_listas` no tenía entrada (el
build se detenía en `/en/demo-b/agente`; la sonda probaba la vista, no el componente). Ahora es por demo; las columnas
del B son mirada de FORMA «no vista» y van a la matriz.

**El A no se movió (HTML del build).** El commit `3b494b5` se construyó en el scratchpad (copia de `node_modules` por
clon APFS: Turbopack rechaza el enlace simbólico) y se comparó página por página con el build nuevo, sin scripts, sin
rutas de chunks y sin los separadores `<!-- -->` que React intercala según cómo parte el streaming (el árbol RSC es el
mismo):
- 53 de 57 páginas del A idénticas;
- Agente (es, en): solo «contrato 0.3.0» → «0.5.0» (frase caducada, ya anotada);
- Fichas (es, en): la ficha de la app con los dos demos y los pasos con sus argumentos, lo declarado arriba.
- Un `{texto}: ` que Prettier había partido en dos nodos (la etiqueta de la instrucción escondida) se devolvió a un
  nodo: el HTML vuelve a ser el de antes.

Pruebas: `pnpm test` 3.531 en verde (128 archivos); `pnpm typecheck`, `pnpm lint`, `pnpm fichas --verificar` y
`pnpm build` (110 páginas) en verde.

### Vitrina con dos demos — guardia de vocabulario por demo y enlaces que se quedan en su demo (2026-10-04)

**Regla 7 de `scripts/verificar-export.mjs`** (corre en `quality` después del build, sobre `out/`): ninguna pantalla
del B dice palabras que solo son del A (afiliado, auditor, médico, Texas, plan de beneficios · member, physician,
benefit plan) ni una del A las que solo son del B (oficial de cumplimiento, lista vinculante, homónimo, vinculación ·
applicant, compliance officer, binding list, namesake, onboarding). Lee lo que lee una persona: el texto pintado, el
`<title>`, la descripción y los `aria-label`, `title` y `alt`, con palabra entera y tildes. Decisiones:
- la entrada queda fuera (presenta los dos demos);
- la ficha de la app también: es la misma en las dos páginas de Fichas y habla de los dos a propósito. Se marca
  `data-vocabulario="ambos-demos"` (`Seccion.ambosDemos`) y la regla quita ese elemento entero antes de leer; un
  elemento marcado que no cierra es falla. La ficha del agente y la de reproducibilidad sí se leen;
- «solicitante» no entra en la lista: el A dice «médico solicitante».

Al nacer encontró, en el B: «minutos de auditor» en la lectura de Umbrales del Plan (con el número vacío: el plan B no
declara costo humano) y en lo que entrega el Playground. Arreglados con textos propios (`lecturaSinCosto`,
`entregaItems[].sinCosto`), que siguen siendo literales que `textos.test.ts` recorre (una primera versión los metió en
funciones y la prueba de textos perdió 8 casos; se vio comparando la cuenta por archivo contra `HEAD`).

**`ruta()` exige el demo.** El build con la regla nueva salió en rojo por la regla 3 (que ya existía): la Brecha del B
enlazaba sus casos a `/es/caso/B-…`, que no existen. La causa era el demo A por omisión de `ruta()`. Con el demo
obligatorio el compilador señaló además enlaces que en el B llevaban al A **sin romperse** (la regla 3 no los ve):
Plan → Playground, Brecha → Playground (dos) y Playground → casos. La entrada usa `rutaEntrada()`; la fila del A en la
entrada y la portada lo dicen explícito (`"demo-a"`) hasta que la entrada tenga sus dos filas.
`tests/unit/vitrina/enlaces-por-demo.test.ts`: toda ruta interna de las vistas de un demo (Plan, Agente, Brecha,
Playground, un Caso, Fichas) se queda en su demo, en los dos idiomas.

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D42 | `verificar-export` regla 7, dirección B | «Producto pedido» → «Producto pedido por el afiliado» en `src/textos/demo-b/agente.ts` | `es/demo-b/agente.html: pantalla del demo-b dice «afiliado», palabra del demo-a: …B-001 Producto pedido por el afiliado cuenta corriente…`; verde tras restaurar (build + regla) |
| D43 | `verificar-export` regla 7, dirección A | «Escalation to the medical auditor» → «…, namesake or not» en `src/textos/agente.ts` | `en/agente.html: pantalla del demo-a dice «namesake», palabra del demo-b`; verde tras restaurar |
| D44 | `enlaces-por-demo.test.ts` | el enlace del Plan al Playground vuelve a `"demo-a"` (`src/lib/vista/plan.ts`) | `demo-b › es` y `› en`: «plan: /es/playground» ×4; verde tras restaurar |

Las tres con `scripts/demo-rojo.sh` (mutación literal, respaldo único verificado con `grep` y `cmp`).

El A, contra el build de `3b494b5`: 51 de 57 páginas idénticas; cambian Agente (la frase del contrato 0.5.0), Fichas
(la ficha de la app con los dos demos, los comandos y el atributo `data-vocabulario`) y la entrada (el pie habla de los
dos demos; la entrada se rehace en el punto siguiente).

Pruebas: `pnpm test` en verde (129 archivos), `pnpm lint`, `pnpm typecheck`, `pnpm build` y `verificar-export` en verde.

### Vitrina con dos demos — la entrada con las dos filas reales (2026-10-04)

- `filaDeDemo(d, i)` (`src/lib/vista/entrada.ts`): veredicto, balance (criterios, riesgos, fallas, supuestos sin
  probar) y corrida de cualquier demo, del informe y el manifiesto; `vistaEntrada` la usa para el A, así que las dos
  filas salen de la misma función. La del B: «Cumple con alertas · 6 de 6 criterios · 0 de 4 riesgos · 1 falla» y su
  corrida real del sprint 3.
- `Demos` pinta una fila por demo (`data-demo`), con sus enlaces dentro de su demo; el B deja de ser «en construcción»
  y se va «Llega en el sprint 3».
- El entrevistador sale de «También en construcción» (ya corrió: propuso el plan B); quedan tres del roadmap. La nota
  ya no promete el sprint 3: «Del roadmap. Nada de esto se simula aquí.»
- Frases que cambiaron con el B: el texto de la fila del B (describía un «modelo en cascada»: el verificador de listas
  es por reglas y el modelo solo investiga la zona gris), «Las tres se ven en el demo A» → «en los dos demos», y el
  aviso de líder («qué dio con el demo A» → «qué dieron sus demos»). La portada, «Cómo funciona» y «Lo que ninguna
  herramienta muestra» siguen dibujando el A y lo dicen («plan del demo A», «Capacidad medida con el demo A»).
- Pruebas: AU-S2-6 reescrita (dos filas reales, ninguna en construcción, los enlaces del B en el B, tres del roadmap);
  la e2e de la entrada mira el veredicto en cada fila (con dos «Cumple con alertas», el localizador de antes habría
  sido ambiguo): 17 en verde a 380 px y en escritorio, sobre el export servido.

La entrada es mirada de FORMA «no vista» (va a la matriz).

### Vitrina con dos demos — ADR-014, el B en Lighthouse, e2e, paridad, visor y paquete (2026-10-04)

- **ADR-014** (`decisions/014-rutas-por-demo.md`): el A conserva sus URL, el B cuelga de `/demo-b/`, `ruta()` exige el
  demo, despachos exhaustivos, las tres guardias y las alternativas descartadas. Con él, los despachos por demo que
  eran ternarios (`=== "demo-a" ? A : B`, un tercer demo caería en el B sin avisar) pasan a `switch` sin `default` o
  `Record<IdDemo, …>` (perfil de Agente y de Caso, textos y cifras de la ficha del agente, conmutador de la barra, que
  recorría una lista fija). `pnpm fichas` sube las decisiones registradas a 16.
- **«Diagrama = grafo» no miraba el B.** `scripts/diagrama-igual-grafo.ts` recorría los dos demos del manifiesto pero
  leía siempre `out/<idioma>/agente.html`: comparaba el grafo del B con el dibujo del A y salía en rojo (no lo vio la
  CI porque el B no se ha empujado). Ahora lee la página de cada demo por su segmento. El B: 9 nodos, 12 aristas y 7
  reglas, en los dos idiomas, también sobre el export del paquete.
- **`exportar_grafo` con el B** (`agents/tests/test_exportar_grafo.py`): frescura del archivo del B, cada nodo con su
  función y líneas, `--verificar` del B, y que **toda señal por la que enruta una arista del plan B la escriba algún
  nodo** (regla dura 3). De paso, un orden de imports de ese módulo que `ruff check` (job `python`) habría puesto rojo.
- **Lighthouse:** `lighthouse-urls.json` suma las seis pantallas del B (un caso: B-005) y el playground del B en inglés.
  Los patrones de `perf-budget.json` (`/*/plan`, `/*/caso/`…) ya las cubren: el `*` casa con `es/demo-b`
  (`lighthouse-urls.test.ts`, 20/20). Corrida local, 3 por URL, mediana, puerto 3007: presupuestos y las cuatro
  categorías ≥ 90 en verde; `lighthouse-margen` avisa en cinco (LCP 2,31 s contra 2,5 s en Plan, Brecha, Caso y
  Fichas; 2,61 s contra 2,8 s en el Playground): entran al trabajo de LCP de la fase 4.
- **Paridad del playground B en tres motores:** la prueba de Node barre las dos islas (el golden del A conserva su
  archivo; el del B es `isla.demo-b.<idioma>.json`, 187 huellas: 41 de U1, 101 de U2, 3 de U3, 41 de U4 y el plan) y
  la tabla de islas vive en `tests/e2e/_paridad.ts`, compartida con el spec. 12 de 12 (2 demos × 2 idiomas × Chromium,
  Firefox y WebKit).
- **e2e del B** (`tests/e2e/demo-b.spec.ts`): las siete pantallas del B (un caso incluido) en los dos idiomas y temas
  como experto, sin desplazamiento lateral, sin violaciones de axe y con la consola limpia; pestañas dentro del B y el
  conmutador a la misma pantalla del A (y sin conmutador en las del A); el expediente de B-019 con cada conclusión
  citada y la instrucción plantada marcada como dato; movimiento reducido. 34 de 34 a 380 px y en escritorio, sin
  reintentos.
- **Paquete para hoja-de-vida con los dos demos:** `pnpm paquete:vitrina` arma 109 páginas y 139 archivos (la ficha del
  agente B incluida) y pasa su verificación; su e2e exige ahora las 26 páginas del B por idioma: 3 de 3.

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D45 | `test_exportar_grafo` · señales del plan B | quitar `"propuesta"` de lo que escribe `puntaje` en `data/vitrina/demo-b/grafo-codigo.json` | `assert {'propuesta'} == set()`; verde tras restaurar |
| D46 | paridad del playground B (WebKit) | una huella del golden `isla.demo-b.es.json` cambiada | `paridad-webkit › la isla de demo-b … (es)`: la huella esperada contra la pintada; verde tras restaurar |
| D47 | e2e del expediente del B | toda conclusión pintada «sin cita» (`{k.citada ? null : (` → `{false ? null : (`) | `expect(… ol > li small svg).toHaveCount(0)`: recibió 8; verde tras restaurar (con build) |
| D48 | «diagrama = grafo» del B | `data-destino="puntaje"` → `"decision"` en la línea de `investigador` de `out/es/demo-b/agente.html` | `demo-b/es: arista del grafo sin línea: investigador → puntaje` y la línea que no es arista; verde tras restaurar |

Pruebas: vitest 3.549 en verde (129 archivos); pytest 216 (97 % de cobertura); `ruff check` y `ruff format --check`;
typecheck y lint.

### Vitrina con dos demos — pasada de capturas del B con techo y la mirada de FORMA «no vista» (2026-10-04)

**Arnés:** `scripts/capturas-demo-b.mjs` (regla 17-bis b: declara los árboles que lee y escribe, aborta si una ruta
sale de `out/` o si `--pasada` cae dentro del repo).
- La pasada completa: cada pantalla del B y la entrada, a 380 y 1280 px, en español en los dos temas y en inglés en
  oscuro: 48 capturas enteras, fuera del repo (el scratchpad), cada una con su huella SHA-256 y una miniatura.
- Nueve recortes de las decisiones de forma, cada uno con su fila de matriz (archivo · botón/estado · qué mirar ·
  respuesta esperada), en `docs/fidelidad/s3-demo-b/index.html` (autocontenido, sin enlaces) y `registro.json`.
- La pasada de interacción (regla 22 b): los recortes que piden tocar algo (el nodo del lienzo y su pestaña «Trazas»,
  mover U2 en el Playground) comprueban que la página cambió; si no, el arnés aborta.
- **Techo:** la carpeta no pasa de 2 MB o el arnés sale con 1. La primera pasada lo pasó sola (2,09 MB, por un recorte
  de la ficha de 1.400 px a doble densidad): los recortes se limitan a 1.100 px de alto. Queda en 1,97 MB.

**Leí los nueve recortes como imagen** (y dos miniaturas de teléfono) antes de registrarlos. Encontré y arreglé:
- **La barra del B cortaba «Fichas»:** con el conmutador, a la fila de pestañas le faltaban 56 px (11 en inglés) a
  cualquier ancho de escritorio, porque el contenedor no pasa de 1.120 px; el A cabe justo (0 px). En las pantallas
  del B las pestañas van en su propia fila también en escritorio, como en el teléfono; el A no cambia (HTML idéntico).
  Ninguna prueba lo veía: la e2e mide el desborde de la página, no el de la fila de pestañas. Prueba nueva (D49).
- **El Playground del B mostraba el subtipo crudo** (`borde_casi_zona_gris`) en «Tipo», montado sobre la columna
  siguiente: usaba el mapa de subtipos del A. Ahora `nombreDeSubtipo(demo, subtipo)`, el mismo de la página de Caso.
  El golden de la isla del B se regeneró (el del A no cambió).
- **«20 casos, 1 repeticiones»** en el pie de la corrida del B: «sin repetir» cuando la corrida no se repitió (el A
  dice «3 repeticiones», igual que antes).

**Hallazgos del B que no son de la vitrina** (las trazas versionadas no se reescriben; van al summary con los otros):
- el expediente que escribe Python pone «0.6988» con punto en el texto en español (K2 de B-019);
- los ids de las conclusiones saltan (K1, K2, K4…) cuando una conclusión no aplica (sin investigador, no hay K3): es
  el id fijo por clase de conclusión, pero se lee como un hueco.

| # | Gate | Mutación | Rojo (quién lo nombró) |
|---|---|---|---|
| D49 | e2e «a 1280 px las siete pestañas caben» (A y B) | `const pestanasEnSuFila = false;` en `src/components/marco/barra.tsx` | `/es/demo-b/brecha`: faltaban 56 px; verde tras restaurar (con build) |
| D50 | techo de la pasada de capturas | el techo por omisión a 1 MB en `scripts/capturas-demo-b.mjs` | «2019304 bytes pasan el techo de 1048576»; verde tras restaurar. La primera pasada real ya lo había puesto rojo sola (2,09 MB) |

e2e del B, entrada y paridad tras los arreglos: 63 en verde (1 omitida, la de siempre).

### Cierre de la fase 3 (2026-10-04)

**Criterio de fase completa, comprobado:**
- verificador por demo (M-20, M-25 con la v1.1 del plan B), informe sin fragmentos (JSON y Markdown publicados del A
  idénticos) e informe B ES/EN;
- vitrina con dos demos: las seis pantallas del B y la entrada con dos filas, en los dos idiomas (ADR-014); el A, 51 de
  57 páginas idénticas al build anterior y las 6 restantes por cambios declarados;
- playground B con paridad exacta en Node, Chromium, Firefox y WebKit; visor B con «diagrama = grafo»; casos B con su
  expediente; ficha de reproducibilidad, ficha del agente B y la ficha de la app con los dos demos;
- Lighthouse del B en local (presupuestos y categorías en verde; cinco avisos de margen de LCP para la fase 4);
- pasada de capturas con techo y la mirada de FORMA «no vista» con su matriz (`docs/fidelidad/s3-demo-b/index.html`);
- guardias nuevas con su demo en rojo: D41–D50.

**Job de calidad completo en local antes del push** (los comandos del `ci.yml`): `peers check`, verificar-dependencias
contra `origin/main`, typecheck, lint sin avisos, `pnpm test` (3.547 en verde, umbrales de cobertura cumplidos),
`trazas:verificar`, build, `verificar-export`, `diagrama:verificar` y `pnpm audit --audit-level high` (el aviso de
`braces`, ignorado por id, ADR-015); e2e completa 193 en verde y 3 omitidas por diseño, sin reintentos; paquete para
hoja-de-vida con el árbol limpio y su e2e (3/3); job `python`: ruff, formato, pytest 216 (97 %) y `pip-audit`.
Empujado: `5dd76fb..07bd876` (PR #14). Sondas temporales borradas.

**CI del PR #14 sobre `07bd876`:** `quality`, `python`, `e2e` y `lighthouse` con conclusión propia `SUCCESS` (más Vercel y
su comentario). Es la primera corrida de la CI con las rutas del B: las siete URL del B en Lighthouse, el e2e del B y la
paridad del Playground B en Firefox y WebKit no tienen histórico con el que comparar. `lighthouse-margen` dio siete avisos
de LCP con margen menor al 10 % (ninguno en rojo): `/es` 2.405 ms, `/en` 2.297, `/es/agente` 2.484, `/es/caso/A-004`
2.294, `/es/demo-b/agente` 2.476, `/es/demo-b/caso/B-005` 2.301 y `/es/demo-b/plan` 2.297, contra 2.500. Van a la fase 4
con el LCP. El aviso «Timed out waiting for the server to start listening» de LHCI ya salía en la corrida anterior y las
tres mediciones por URL corrieron.

**Para revisar al cierre:** el inglés de la v1.1 del plan B, lado a lado con el español, en
`plans/demo-b/v1.1-ingles.md` (26 textos: los 24 que el v1 traía solo en español y los dos del supuesto nuevo S2).

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

12. **La plantilla propone más que preguntas** (`umbrales_sugeridos` y `contrato_sugerido`, fuera del § 6.1). La orden
    pedía completar las preguntas. Sin propuestas, el contrato de grafo, que M1 exige completo, quedaría entero en
    manos del modelo. Con ellas, «acepto» lo resuelve el código (ADR-012). Los umbrales llegan sin valor: los fija
    el usuario.
13. **El origen por elemento vive en el plan como campo opcional.** El problema y el flujo son textos bilingües
    estrictos y no lo admiten, así que su origen (y el de cada idioma) queda en la transcripción.
14. **Dos códigos de contradicción más que los cuatro del plan:**
    - `UMBRAL_SIN_ARISTA`: un umbral que no mueve ningún caso (la lección del U4 inerte del S2);
    - `PENDIENTE`: la condición de término del § 9.2.
15. **`plan:aprobar --con-contradicciones`:** RF-02.5 dice «señalar», y la decisión de aprobar con una contradicción
    es del usuario. El comando la exige explícita y la bitácora registra la frase.
16. **Los ejemplos de cada plantilla vienen del otro dominio,** para no anclar la entrevista del B en valores del
    § 10.3.
17. **El plan B v1 no nombra las listas** (el plan de la sesión de planeación preveía «el B gana una referencia a
    `listas`»). El plan se aprobó antes de que las listas existieran y no se re-aprueba por esto: las citan el lote y
    la corrida, como el plan de beneficios del A en sus corridas.
18. **El redactor del B no usa modelo.** La orden dice «redactor (modelo + guardia)»; el plan B aprobado lo declara
    de tipo `regla` y la orden pide «expediente ES/EN por código». Manda el plan: el expediente, la respuesta y el
    documento adverso los escribe el código (ADR-013).
19. **El investigador corre desde U4 hacia arriba, no solo en la franja U4–U1.** El contrato aprobado manda a
    `investigador` toda similitud ≥ U4; arriba de U1 su conclusión es evidencia para el oficial, nunca la decisión.
20. **Sin respaldo por proveedor en el B.** El plan B no declara aristas AU-9 (el A las ganó por enmienda): sin
    modelo el caso no se decide y se reintenta. Pasarlo a una persona exige enmendar el plan B con el usuario; queda
    propuesto en el ADR-013, no hecho.
21. **`data/vitrina/demo-b/grafo-codigo.json`** (el código por nodo para el visor) se genera en la fase 3 con la
    vitrina del B, junto con su manifiesto; `exportar_grafo.py` sigue siendo del A por ahora.
22. **Niveles medios del puntaje estimados por el builder** (actividad media 20, jurisdicción media 15). D4 fija los
    máximos 40/30/30 por delegación explícita; los intermedios no estaban y se marcan «estimado» en RP-01 y RP-02.
23. **La planeadora publicó el diagramador 0.6.0 a mitad del sprint** (2026-10-04, commit `c8d3957`, del cierre de
    big-d S2; el mismo commit trae el kit v1.39.0 y un «delta v1.39.0 en 4 apps»). La orden del S3 fija el 0.5.0 y
    la fase 0 ya lo fijó: planlang sigue en 0.5.0 y lo declara en el lock (`planeadora_adelante`, con huella y
    decisión), que es lo que pide la prueba local de `contratos-lock.test.ts`. La migración la ordena la planeadora.
24. **Plan B v1.1 dentro de la fase 3** (decisión del usuario, 2026-10-04): el plan de la sesión de planeación no
    preveía enmendar el plan B; medirlo destapó tres huecos que el v1 aprobado traía (24 textos solo en español, un S1
    que el verificador no decide, ninguna comparación con la línea base). La v1.1 es de solo medición y redacción; la
    vitrina y el informe B se miden con ella. La plantilla y el entrevistador se corrigen en el mismo cambio.

## Registro de miradas

| Fecha | Mirada | Clase | Artefacto | Veredicto del usuario (textual) | Qué se construyó encima |
|---|---|---|---|---|---|
| 2026-10-04 | 1 · plan del demo B | DECISIÓN | `plans/demo-b/revision.es.md` (borrador de la entrevista corrida por delegación: «corre la entrevista con tus respuestas») | «apruebo el plan B» | `plans/demo-b/v1.json` (huella `0cd6590c…`); la fase 2 arranca sobre él |
| 2026-10-04 | 2 · vistas del demo B | FORMA «no vista» | `docs/fidelidad/s3-demo-b/index.html` (matriz de 9 filas: entrada con dos filas, barra del B, trazas del verificador de listas, «Recibe» y expediente de B-019, Playground, Umbrales del Plan, ficha del agente B, pie) | sin respuesta: viaja al ⭐⭐ (parada 2) | la fase 3 sigue; las vistas se construyeron antes de esta mirada, como prevé el plan de miradas |

## Bugs y fricciones

| Fecha | Qué | Causa | Resolución |
|---|---|---|---|
| 2026-10-04 | `pnpm entrevistar` salía con 1 sin decir nada | ruta relativa al intérprete con `cwd: agents` en el proceso hijo | ruta absoluta y el error de lanzamiento se reporta |
| 2026-10-04 | el esquema de salida de umbrales rompía (`KeyError: anyOf`) | Zod escribe la unión de primitivos como `type: [...]` | `_con_nulo` admite las dos formas |
| 2026-10-04 | tras una respuesta vacía, la pregunta se habría repetido sin fin | `repetir` quedaba en `True` hasta el siguiente `elegir` | toda salida válida de `incorporar` lo pone en `False` (revisión antes de probar) |
| 2026-10-04 | `fichas.test.ts` en rojo | el ADR-012 cambia la cuenta de ADR del `brochure-export.json` | `pnpm fichas` (14 ADR) |
| 2026-10-04 | la entrevista real del B pasó dos veces por M1 en rojo | el modelo borra con `null`, descarta elementos de la lista y escribe prosa o paréntesis en condiciones; el humo de 3 llamadas no lo vio porque no tocó las decisiones ni los supuestos | tres cierres por código (D14–D16) y tres reglas en el prompt; tercera corrida limpia |
| 2026-10-04 | la guardia de salida del B marcaba severidad 2 en todos los casos | tomaba los códigos de catálogo (`SYN-ACT-03`, `SYN-J-02`) del expediente por identificadores de personas | el patrón excluye `SYN-ACT-` y `SYN-J-` (lo vio la primera corrida simulada, antes de las pruebas) |
| 2026-10-04 | el expediente escribía la fecha completa de cada lista en su texto | D3 pide versión y fecha; el gate E-11 marca toda fecha con día y mes en texto libre | el texto dice mes y año; la fecha completa viaja en la cita estructurada (lo cazó el gate durante la D21) |
| 2026-10-04 | la prueba de bandas del generador no podía fallar | leía el lote versionado en vez de regenerarlo; una primera corrección no se aplicó porque Prettier había partido la línea | regenera en `beforeAll`; verificado con la D19f |
| 2026-10-04 | `test_lotes.py` y `respaldo_simulado.py` parcheaban `lotes.RespondedorSimulado` | el respondedor vive ahora en el registro de demos | parchean `app_agents.demo_a.simulacion` |
| 2026-10-04 | la línea base real del B extrajo bien 1 de 20 casos | su prompt resumía las reglas de campo y no definía `titular_actividad` | el prompt reutiliza las reglas del extractor y del investigador, con prueba (D33); la corrida queda versionada tal cual y el informe lo dirá |
| 2026-10-04 | el gate E-11 marcó 3 trazas de la línea base | nombres del diccionario en un campo de documento (`titular_actividad`) | en los campos del B, un nombre entero del diccionario cerrado no es un identificador real; uno de fuera sigue en rojo (D21e) |
| 2026-10-04 | el commit de punto de control `wip(vitrina)` se hizo con `--no-verify`, que salta el hook de gitleaks | desliz del builder al comitear un árbol que sabía en rojo | `gitleaks git --log-opts="HEAD~1..HEAD"` a mano sobre ese commit: «no leaks found». Ningún commit más sin el hook |
| 2026-10-04 | las páginas del B decían «auditor», «afiliados» y «plan de beneficios» en la franja del oráculo, y «El spike tenía 3 de 8» | textos del A pintados por el componente o por la vista sin pasar por el demo | texto por demo (`ORACULO.texto`, `MIRADA.aviso*`, `nodosDetalleSinSpike`); la guardia de vocabulario por demo sobre `out/` lo vigilará |
| 2026-10-04 | `{plan:lista.decision}` del B detenía el build | el resolvedor nombraba las reglas con el vocabulario del A | `conPlan` recibe el demo |
| 2026-10-04 | el build se detenía en `/en/demo-b/agente` | `PRESENTACION` de las trazas estaba por nombre de nodo y no tenía `verificador_listas`; la sonda del B probaba la vista, no el componente | reparto por demo (`trazas.tsx`) |
| 2026-10-04 | las seis páginas del B decían en el pie «afiliado, médico y plan de beneficios… un auditor médico» | `PIE.sintetico` era uno solo | pie por demo; la entrada dice los dos (prueba en `componentes.test.tsx`) |
| 2026-10-04 | «Cómo repetirla» daba comandos que no corren (S2) | `pnpm plan:validar` y `pnpm brecha:informe` sin argumentos salen con «uso:» | comandos armados con el manifiesto, corridos en los dos demos, con prueba |
| 2026-10-04 | la Brecha del B enlazaba sus casos a `/es/caso/B-…` (rotos) y el Plan, la Brecha y el Playground del B enlazaban al Playground y a casos del A | `ruta()` tomaba el demo A por omisión | demo obligatorio; prueba `enlaces-por-demo` (D44) |
| 2026-10-04 | el Plan y el Playground del B decían «minutos de auditor» (el Plan, sin número) | textos del A sin variante para un plan sin costo humano | textos propios; los vio la regla 7 al nacer |
| 2026-10-04 | «diagrama = grafo» comparaba el grafo del B con el dibujo del A | el script leía siempre `out/<idioma>/agente.html` | página por segmento del demo; D48 |
| 2026-10-04 | `ruff check` en rojo en `exportar_grafo.py` (orden de imports) | quedó del WIP de la vitrina con dos demos; el job `python` no lo ha visto porque no se ha empujado | `ruff check --fix` |
| 2026-10-04 | la barra del B cortaba la pestaña «Fichas» a cualquier ancho de escritorio | el conmutador A · B le quitaba 68 px a una fila que en el A cabe justa | pestañas en su propia fila en el B; prueba D49 |
| 2026-10-04 | el Playground del B mostraba el subtipo crudo, montado sobre la columna siguiente | usaba el mapa de subtipos del A | `nombreDeSubtipo(demo, …)` compartido con la página de Caso |
| 2026-10-04 | «20 casos, 1 repeticiones» en el pie del B | la plantilla no tenía el caso de una corrida sin repetir | «sin repetir» |
