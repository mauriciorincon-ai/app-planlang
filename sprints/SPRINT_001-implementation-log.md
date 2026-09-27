---
sprint: 001
app: planlang
status: open
opened: 2026-09-26
branch: sprint-001/contrato-y-corrida
orden: portafolio/planlang/ordenes/SPRINT_001-orden.md (planeadora, RO)
modelo: Fable 5.1 (todo el sprint, decisión del usuario 2026-09-27)
---

# Bitácora — Sprint 001 «El contrato y la corrida»

> Plan aprobado el 2026-09-27 (`~/.claude/plans/buzzing-cuddling-swan.md`). Arranque autorizado por el
> usuario («vamos con Fable. continúa»). Contrato de fases: al terminar cada fase, resumen y espera de
> «continúa».

## Progreso por fase

| Fase                                         | Estado                                 | Cierre     |
| -------------------------------------------- | -------------------------------------- | ---------- |
| 0 · Setup y precondiciones                   | ✅ aprobada («continúa»)               | 2026-09-27 |
| 1 · El plan como contrato                    | ✅ aprobada («continúa», v1 confirmado) | 2026-09-27 |
| 2 · Casos sintéticos                         | ✅ aprobada («continúa»)               | 2026-09-27 |
| 3 · Demo A en LangGraph                      | ✅ aprobada («continúa»)               | 2026-09-27 |
| 4 · Verificador y validación del instrumento | ✅ aprobada («continúa», v1.2 elegida) | 2026-09-27 |
| 5 · Cierre                                   | 🔄 en curso                            |            |

## Fase 0 — Setup y precondiciones (2026-09-27)

### Verificación de supuestos del kit (v1.30.1) — fricciones K#

| #   | Hallazgo                                                                                                                                                                               | Resolución                                                                                                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K1  | `agents/.venv` estaba en Python **3.14.7** (CI y `.python-version` en 3.12)                                                                                                            | Venv reconstruido con `python3.12` (3.12.14); pytest verde con el comando del CI                                                                                                                                                                                                                       |
| K2  | `agents/src/app_agents.egg-info/` **versionado**: la regla `agents/*.egg-info/` no cubre `src/`                                                                                        | `git rm --cached` + regla `agents/src/*.egg-info/`. Segunda lección: **`.gitignore` no admite comentarios en la misma línea** — la primera versión de la regla llevaba un `# K2…` al final y no ignoraba nada                                                                                          |
| K3  | `test` sin `--coverage`; include solo `src/lib`, `src/engine`                                                                                                                          | `vitest run --coverage`; `test.projects` (`core` node · `core-jsdom` · `vitrina`); include `core/**`, `packages/*/src/**`, `src/lib/**`; umbral 90 en `core/plan`, `core/brecha`, `core/playground`; test nuevo para `src/lib/observability.ts` (sin él, el 80 % de `src/lib` quedaba rojo al activar) |
| K4  | `ci-python.yml` usa `pip-audit --skip-editable` (kit v1.30.1); `CLAUDE.md` regla 16 y el CHANGELOG dicen `--strict`                                                                    | Se deja el yml (con `--strict` el editable tumba el job). **Fricción de documentación del kit** para el summary                                                                                                                                                                                        |
| K5  | `eslint` no ignoraba `agents/.venv/**` ni `coverage/**`                                                                                                                                | `globalIgnores` + `agents/**`, `runs/**`                                                                                                                                                                                                                                                               |
| K6  | Dependabot: 2 PRs abiertos (#1 actions · #2 npm: react 19.3.0)                                                                                                                         | Mergeados **de a uno** (#1 `0afd405`, luego #2), `pnpm install --frozen-lockfile` limpio tras el merge a la rama                                                                                                                                                                                       |
| K7  | El hook PostToolUse corre prettier sobre `.json`/`.md` → reformatearía JSON canónico y golden files                                                                                    | `.prettierignore` (`runs/`, `plans/`, `data/`, `tests/golden                                                                                                                                                                                                                                           | contrato | fixtures/`, `docs/kit-de-prueba/`, `packages/*/carnadas | datos`, `plan.schema.json`). Regla del sprint: **todo artefacto canónico se escribe por script, nunca con Write/Edit** |
| K8  | jsdom 30 no trae `crypto.subtle`                                                                                                                                                       | Proyecto `core-jsdom` con shim de `node:crypto.webcrypto` solo en el setup del test; los tests que producen bytes corren en `core` y en `core-jsdom`                                                                                                                                                   |
| K9  | Node 24 local · Node 22 CI · sin runner TS                                                                                                                                             | `tsx` 4.23.15 como devDependency                                                                                                                                                                                                                                                                       |
| K10 | Aprovisionamiento                                                                                                                                                                      | `claude` 2.1.282 ✓ (humo abajo) · `python3.12` ✓ · **LangSmith pendiente [TÚ]** (aplazable a la fase 3; sin variables ⇒ tracing apagado, nunca error)                                                                                                                                                  |
| K11 | `README.md` de create-next-app                                                                                                                                                         | Reescrito, sin ninguna URL (regla 17)                                                                                                                                                                                                                                                                  |
| K12 | **gitleaks (falso positivo útil):** una constante llamada `MODELO_API_…` con el id del modelo Haiku 4.5 como literal disparó `generic-api-key` (nombre con «API» + literal con entropía) y **bloqueó el commit**; al citar la línea tal cual en esta bitácora volvió a bloquearlo (regla: los documentos que narran el barrido escriben el patrón sin el literal) | Constantes renombradas sin la palabra «api». Prueba de vida del cinturón: el hook bloquea de verdad                                                                                                                                                                                                    |

### Humo de credenciales

| Servicio                                           | Resultado                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude -p` (suscripción, sin `ANTHROPIC_API_KEY`) | `result: "OK"`, `is_error: false`. Sin `--system-prompt` propio el contexto fue **9.280 tokens** (system prompt del CLI); con el adaptador (MCP vacío, `--tools ""`, system prompt propio, cwd temporal) **1.587 tokens**                                             |
| Humo real del adaptador (`PLANLANG_HUMO_REAL=1`)   | P1 ✓ · P2 ✓ (`structured_output` = `{ok: true, n: 7}`, contexto 1.587 ≤ 2.500) · P6 ✓ (anidado desde esta sesión). Costo nominal por llamada US$0,0081 (no facturado: cuota de la suscripción); `duration_ms` 1.827; latencia de subproceso 3.643 ms; modelo `sonnet` |
| Python 3.12                                        | 3.12.14                                                                                                                                                                                                                                                               |
| LangSmith                                          | **pendiente [TÚ]**: crear cuenta Developer y exportar `LANGSMITH_API_KEY`, `LANGSMITH_TRACING=true`, `LANGSMITH_PROJECT=planlang-demo-a` antes de la fase 3                                                                                                           |

### ADRs

- `decisions/001-codigo-primero-demos.md` — aceptado (tabla de intentos deterministas; el LLM solo en extractor, aclaración y redactor).
- `decisions/002-proveedor-y-cumplimiento-suscripcion.md` — aceptado (citas 1–7 con URL; caso (a) permitido, (c) ambiguo; lotes de 20 fuera de CI; interruptor con techo US$10; registro de re-lecturas).
- `decisions/003-pines-python.md` — aceptado (`langchain 1.4.2 · langgraph 1.2.12 · langsmith 0.14.1 · pydantic 2.13.5 · rfc8785 0.1.4`; `pip-audit --skip-editable` limpio).

### Adaptador y tests (`agents/`)

`adaptador.py` (`ChatClaudeCode`, `ChatSimulado`, `crear_modelo`, `argv_claude`, `entorno_hijo`, `cwd_limpio`, `ErrorProveedor`), `logger.py` (JSON, vocabulario cerrado), `reloj.py` (`RelojReal`/`RelojFijo`). Tests: `test_adaptador_flags.py` (12, siempre), `test_adaptador_simulado.py` (3), `test_logger_y_reloj.py` (3), `test_adaptador_humo_real.py` (3, solo local). **19 passed, 3 skipped**; cobertura de `agents/` 87 %.

### Demos en rojo (regla 15 del kit)

| Gate                                                                   | Cambio deliberado                                                             | Resultado                                                                                                          |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Flags exactos del adaptador                                            | quitar `"--strict-mcp-config"` de `argv_claude`                               | 🔴 `test_argv_es_exactamente_el_de_la_regla_6` (AssertionError en la lista) → 🟢 al revertir                       |
| `env` limpio del subproceso                                            | quitar `ANTHROPIC_API_KEY` de `VARIABLES_PROHIBIDAS_EN_HIJO`                  | 🔴 `test_invoke_usa_cwd_temporal_vacio_fuera_del_repo_y_env_limpio` → 🟢 al revertir                               |
| Cobertura (`--coverage`, 90 en `core/plan`)                            | `core/plan/sin-test.ts` sin test                                              | 🔴 `ERROR: Coverage for lines (0%) does not meet "core/plan/**/*.ts" threshold (90%)` (+ global 70) → 🟢 al borrar |
| Job `python` de CI (gate heredado, primera dependencia de este sprint) | PR desechable `demo-rojo/s1-python` con `test_demo_rojo.py` (`assert 1 == 2`) | 🔴 `python` en `failure` nombrando `test_demo_rojo.py` (PR #4 `[DESECHABLE]`, cerrado sin mergear el 2026-09-27; los otros checks verdes) → 🟢 en el PR #7 — registro completado en la auditoría final (B-1)                                                         |
| gitleaks (hook de commit, heredado)                                    | sin cambio deliberado: K12 lo disparó de verdad                               | 🔴 commit bloqueado → 🟢 tras renombrar                                                                            |

### Gates locales al cerrar la fase

`pnpm lint` ✓ · `pnpm typecheck` ✓ · `pnpm test` (cobertura activa) ✓ 5 tests · `pnpm build` ✓ · `ruff check/format` ✓ · `pytest` ✓ · `pip-audit --skip-editable` ✓ · `pnpm install --frozen-lockfile` ✓ tras el merge de `main`.

## Fase 1 — El plan como contrato (2026-09-27)

### Qué se construyó

| Pieza | Archivos | Notas |
|---|---|---|
| JCS (RFC 8785) + huella SHA-256, TS y Python | `core/formatos/{jcs,huella,bilingue}.ts` · `agents/src/app_agents/canonico.py` | huella = SHA-256(JCS(objeto sin `huella`)); archivos «bonitos» en disco; `rfc8785` 0.1.4 rechaza 2^53 exacto → límite 2^53 − 1 |
| **Gate de contrato JCS Python → TS** (regla 19) | `tests/contrato/jcs-valores-tramposos.json` (17 casos, emitido por Python) · `tests/contrato/jcs-python-ts.test.ts` (corre en `core` y `core-jsdom`) · `agents/tests/test_canonico.py` (frescura) | paridad de string y de huella en los 17 casos |
| Mini-lenguaje de condiciones | `core/brecha/condiciones.ts` (tokenizador, parser de precedencia, evaluador; `==,!=,<,<=,>,>=,IN,CONTIENE,IMPLICA,AND,OR,NOT`, rutas con punto, funciones) | identificador desconocido = error (no `false`): base de M9 «señal faltante» |
| Esquemas Zod del plan + JSON Schema | `core/plan/esquema.ts` · `core/plan/plan.schema.json` (generado, test de frescura) | strict; `{es,en}` en todo texto; `orden`, `ramas_por_defecto`, aristas con función nombrada, `riesgos_cubiertos` |
| Validador RF-01.2–01.5 | `core/plan/validador.ts` (16 códigos de motivo, ES/EN, con elemento) | usa el reusable para ciclos/prioridad/supuestos y el parser para toda condición |
| Contrato para el constructor · carga con huella | `core/plan/{contrato-constructor,cargar}.ts` | umbrales resueltos; `aprobarPlan` calcula la huella; `cargarPlan` rechaza huella alterada |
| Reusable `instrumentos-de-plan` v0.1.0 | `packages/instrumentos-de-plan/{src,datos,carnadas,tests,CONTRATO.lock,README.md}` | Kahn por ondas + DFS con ciclo mostrado; tabla AIAG-VDA en datos con fuente y gap declarado; RPN secundario; C01–C05 + C03-bis |
| `diagramador` | `packages/diagramador/{CONTRATO.lock,README.md}` | solo la copia fijada (v0.2.0) |
| Guardias | `tests/unit/guardias/{determinismo,neutralidad}.test.ts` + carnada | 11 tokens prohibidos; términos de dominio en `packages/` |
| Detector de jerga y presupuesto de líder | `core/formatos/jerga.ts` | ≤ 50 palabras, ≤ 1 término vigilado, ES y EN |
| Plantillas de dominio | `data/dominios/{dom-salud,dom-financiero}.json` | actores, decisiones, riesgos, criterios, restricciones (legal F1–F15 con URL, fecha, vigencia, `{es,en}`), preguntas guía, etiqueta de riesgo (F14) |
| Plan v1 aprobado | `plans/demo-a/v0-migrado.json` (borrador migrado, base de fixtures) · `plans/demo-a/v1.json` | `pnpm plan:validar --aprobar` → huella `c8b92541…2cd2f2`; **Python verifica la misma huella** (`test_plan_aprobado.py`) |
| Scripts | `scripts/{_io,plan-validar,migrar-plan-demo-a,sembrar-planes,plan-schema}.ts` | solo los scripts tocan disco |

### Correcciones al plan v0 (registradas por `scripts/migrar-plan-demo-a.ts`, reproducibles)

1. `_nota` eliminada (esquema estricto). 2. `version` → `1.0.0`. 3. `opciones` de cadenas → `{nombre}` (pros/contras opcionales: enmienda propuesta al contrato). 4. `ocurre_si` normalizado. 5. `orden` explícito por nodo escritor e `inclusivo` explícito en toda arista (true solo en ≥/≤; el resto estricto, como el v0). 6. Arista «modo Texas» → función nombrada `texas_y_no_aprobar(modo_texas, propuesta)` (desviación 3). 7. `ramas_por_defecto: {decision: redactor}` (desviación 4). 8. `politica_simulada` bilingüe. 9. `evaluadores_requeridos[].riesgos_cubiertos` (exactitud→R5,R7 · datos sensibles→R2 · pausas→R1,R6 · inyección→R3). 10. `etiqueta_riesgo` (F14). **Ningún cambio de contenido de decisiones, riesgos, criterios ni umbrales.** Aprobado en el chat con el «continúa» tras el gate de la fase 1 (si el usuario objeta, se regenera).

Dato de la tabla AIAG-VDA sobre el plan real: R5, R3 y R2 salen `alta`; **R1 (negación indebida, S9·O3·D3) y R6 (S8·O3·D2) salen `baja`** por la tabla (ocurrencia 2-3 y detección 2-4). El validador no bloquea porque tienen mitigación; el summary lo lleva como observación para la planeadora (¿ocurrencia 3 es honesta para R1 antes de la mitigación?).

### Tests

`pnpm test`: **178 tests, 17 archivos**, cobertura `core/plan` 99,2 % · `core/brecha` 97,8 % · `core/formatos` 97,5 % · `packages/instrumentos-de-plan` (en umbral 80). `pytest`: 26 passed, 3 skipped, 95 %. `typecheck` ✓ · `lint` ✓ (2 warnings en `docs/diseno/assets/maqueta.js`, archivo de la Etapa de Diseño, no de este sprint).

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| Contrato JCS Python → TS | `"jcs": "1e-7"` → `"1e-07"` en el fixture | 🔴 `reproduce el string JCS de Python: exponente_pequeno` → 🟢 al restaurar |
| Lint determinista | `export const marca = Date.now();` en `core/formatos/huella.ts` | 🔴 nombra `core/formatos/huella.ts:78 Date.now` → 🟢 |
| Neutralidad G6 | `// reglas de autorizaciones` en `packages/instrumentos-de-plan/src/tipos.ts` | 🔴 nombra `tipos.ts:43 «autorizacion»` → 🟢 |
| Huella del plan (RF-06.1) | `version` 1.0.0 → 1.0.1 en una copia de `v1.json` | 🔴 `plan:validar --verificar` rc=1 con las dos huellas; Python `HuellaInvalida` (test) |
| Planes sembrados (RF-09.4) | 12 fixtures generados (`tests/fixtures/planes-sembrados/`) | 🔴 los 12 rechazados con código y elemento esperados (test) |
| Carnadas C01–C05 (+C03-bis) | datos en `packages/instrumentos-de-plan/carnadas/` | 🔴/🟢 por test (C03 en su forma enmendada) |
| Presupuesto de líder / jerga | 51 palabras · «LLM» + «JSON» | 🔴 por test |

### Fricciones

| Qué | Causa | Resolución |
|---|---|---|
| `rfc8785` rechaza `2**53` | dominio seguro de JSON es < 2^53 | límite 2^53 − 1 en el perfil del emisor |
| Un comentario `/** … packages/*/src … */` cerró el bloque | `*/` dentro del comentario | reescrito |
| `sanción` en `escalas.json` disparó la neutralidad | término genérico de la escala | quitado de la lista; `medico` → `medic` |
| **La Etapa de Diseño escribe en el MISMO árbol de trabajo** (`docs/diseno/` sin versionar aquí; rama `diseno/fundacion` existe) | dos sesiones, una carpeta | este sprint hace `git add` por rutas explícitas y jamás toca `docs/diseno/` ni `design-system.md` |

## Fase 2 — Casos sintéticos con verdad conocida (2026-09-27)

### Qué se construyó

| Pieza | Archivos | Notas |
|---|---|---|
| Plan de beneficios sintético legible | `data/plan-beneficios/demo-a.json` (sellado con `scripts/sellar.ts`) | 40 procedimientos `SYN-P-###` · 5 exentos (control crónico, análogo de la Circular 019/2025) · 6 excluidos, **uno por causal del art. 15 de la Ley 1751** (a–f) · 39 diagnósticos `SYN-D-##` · 7 reglas RB-01…07 en `{es,en}` · tope de alto costo = `umbral.U2` · un servicio con costo **exactamente** U2 (RM de rodilla, 1000) · par homónimo rinoplastia funcional (cubierta) / estética (excluida) · aviso «no es el PBS» |
| Azar con semilla | `core/sintetico/sfc32.ts` | sfc32 sembrado con cyrb128; solo aritmética de 32 bits; vector de referencia calculado con una implementación independiente en Python |
| Esquemas | `core/sintetico/esquema.ts` | plan de beneficios (integridad referencial), caso (spec § 6.8 + `subtipo`, `adversario{vector,carga,intenta}`, `esperado`, `identificadores_sinteticos`, `simulacion`), lote |
| Generador | `core/sintetico/{generador,diccionarios}.ts` | 18 subtipos; **bloques de 20** con 60/15/15/10 por bloque (mayor resto con enteros) → el lote de 20 es exactamente el primer bloque del de 200 y todo prefijo de k·20 conserva proporciones; garantías por bloque (bloque 0: los 13 subtipos del lote de 20; bloque 1: texto ambiguo, tres ciclos, inyección en orden adjunta, homónimo); sub-semilla por caso; verdad conocida derivada de U1–U4 **y del contrato de grafo** del plan; textos redactados en ES y EN; `simulacion` = lo que responderá `ChatSimulado` (ruido determinista) |
| Validador de identificadores (E-11) | `core/sintetico/validador-identificadores.ts` | cédula en rango real (1–99.999.999 y NUIP 1.000.000.000–1.999.999.999) · NIT con DV válido (módulo 11) · HIPAA con formato realista (SSN, teléfono salvo 555-01XX, correo/URL salvo dominios reservados, IP salvo documentación, fechas día+mes, edad > 89, direcciones, placas) · identificador sin prefijo `SYN-` · nombre fuera de los diccionarios |
| CLI | `scripts/{casos-generar,lotes-versionados,sellar}.ts` | `pnpm casos:generar --versionados`; solo escribe si el validador no encuentra nada |
| Lotes versionados | `data/casos/demo-a/planlang-a-001-20.json` (66 KB) · `planlang-a-001-200.json` (620 KB) · `planlang-a-humo-3.json` · `AFIRMACION-DE-PRIVACIDAD.md` (generado) | 20 = 12/3/3/2 · 200 = 120/30/30/20 · humo = normal · empate en U1 **y** U2 · inyección con negación (para la corrida simulada de CI de la fase 3) |

Verdad conocida por caso: `decision` (aprobar/negar), `campos` (procedimiento, diagnóstico, urgencia, costo), `debe_escalar` y `motivos_escalamiento` (en el orden de las aristas), `urgencia`, `servicio_exento`, `contradiccion_orden_texto`, `causal`, `ciclos_aclaracion_necesarios` y `presente` (= el caso pasa por el extractor según el contrato de grafo y su verdad de campos es alcanzable). Faltantes: el médico simulado entrega los campos ciclo a ciclo según un guion (`aclaraciones_simuladas`); «duda a favor del afiliado» (art. 8) ⇒ los que agotan las aclaraciones se aprueban tras la pausa.

### Tests

`pnpm test` (sin el test de paleta de la Etapa de Diseño, que vive sin versionar en este árbol): **257 tests, 24 archivos**, cobertura `core/sintetico` 98 %. Nuevos: `tests/unit/core/sintetico/{sfc32,plan-beneficios,generador,validador-identificadores}.test.ts`, `tests/unit/guardias/identificadores-en-datos.test.ts` (gate sobre `data/casos`, `data/plan-beneficios` y `runs/`), `tests/integration/casos-versionados.test.ts` (**frescura byte a byte en `core` y `core-jsdom`** = paridad Node/jsdom del generador). `pytest`: 32 passed, 3 skipped, 95 % — nuevo `agents/tests/test_casos_versionados.py`: **Python recalcula la huella de los tres lotes emitidos por TypeScript** (gate de contrato TS → Python de la regla 19 sobre texto bilingüe real: tildes, «», ñ). `typecheck` ✓ · `lint` 0 errores.

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| Identificadores en datos (E-11) | `C.C. 1.023.456.789` inyectada en `planlang-a-001-20.json` | 🔴 `[cedula_rango_real] $.casos[2].entrada.texto_medico.es` → 🟢 al restaurar |
| Carnada HIPAA | regla SSN apagada (`juzgar: () => null`) | 🔴 `carnada-hipaa: expected [] to include 'hipaa_ssn'` → 🟢 |
| Frescura byte a byte (proyecto `core-jsdom`) | «Sin antecedentes relevantes» → «…de importancia» en el diccionario | 🔴 `planlang-a-001-20`, `planlang-a-001-200` y la afirmación Markdown (el lote de humo no usa esa frase: no se enciende, correcto) → 🟢 |
| Vector de sfc32 | `b >>> 9` → `b >>> 8` | 🔴 vector de referencia + los 3 lotes + afirmación → 🟢 |
| Huella del lote desde Python | «Gracias.» → «Gracias!» en una copia | 🔴 `HuellaInvalida` (test) |

¿Pueden fallar? Sí, las cinco: cada una se vio en rojo con un estado alcanzable del repo.

### Hallazgos de coherencia del plan v1 (los encontró el constructor al derivar la verdad conocida)

1. **Exentos contra C4/R6.** C4 exige que un servicio exento se apruebe **sin pasar por `verificador_cobertura`** y R6 cuenta como riesgo ocurrido que lo visite; pero el contrato de grafo v1 solo saca del flujo las urgencias (`enrutador · tipo_atencion == urgencia → redactor`). Con el grafo v1 todo exento pasa por el extractor y el verificador: **C4 falla y R6 «ocurre» por diseño**, no por el agente. Propuesta: plan **v1.1** con la arista `enrutador · servicio_exento · igual_a · true → redactor` (orden 2; el enrutador lo decide por regla con el código de la orden y el plan de beneficios) y `servicio_exento` entre las señales obligatorias. El generador ya lee el contrato: con v1.1, los exentos quedan `presente: false` al regenerar (probado en test).
2. **Límite de aclaraciones (U3) y el supuesto S2.** La arista `aclaracion · ciclos_aclaracion ≥ U3 → pausa_humana` se evalúa al salir del nodo: si la señal cuenta la aclaración recién pedida, con U3 = 2 la respuesta a la segunda aclaración nunca se usa («máximo 2» sería en la práctica 1). La verdad conocida asume la lectura del plan: se pueden pedir hasta U3 aclaraciones y usar todas sus respuestas (la fase 3 escribe la señal como «aclaraciones ya hechas» y pregunta solo si está por debajo de U3). Además, S2 medido como `ciclos_aclaracion <= 2` sobre los faltantes es **tautológico con U3 = 2** (el ciclo no puede pasar de 2), y la proporción de faltantes que el médico completa en ≤ 2 respuestas la fija el diseño del sintético, no el mundo (pesos del generador: 75 % de los faltantes sorteados se completan en ≤ 2 respuestas; en el lote de 200 salieron 19 de 30): el informe tiene que decirlo así.
3. **C3 y las urgencias de alto costo.** La población de C3 es `extraccion.costo_estimado > umbral.U2`; las urgencias no pasan por el extractor. El verificador (fase 4) trata «sin extracción» como fuera de la población, no como error.

## Fase 3 — Demo A en LangGraph y primera corrida real (2026-09-27)

### Plan v1.1 (aprobado por el usuario en el chat, antes de construir el grafo)

Respuesta del usuario a la pregunta del builder: **«Sí, apruebo v1.1»**. `scripts/enmendar-plan-demo-a.ts` parte del v1 aprobado (queda como historia) y produce `plans/demo-a/v1.1.json` (huella `2e376384…4cf6f3`): arista `enrutador · servicio_exento · igual_a · true → redactor` (orden 2), rama por defecto del enrutador `extractor` (su primera arista pierde `si_falso`: el validador prohíbe ambas cosas), `servicio_exento` como señal obligatoria (16) y el paso 2 del flujo objetivo en ES/EN. Decisiones, riesgos, criterios, supuestos y umbrales intactos (test). Lotes regenerados sobre v1.1 (los exentos ya no esperan extracción). Python verifica la huella del v1.1.

### Qué se construyó (`agents/`)

| Pieza | Archivos | Notas |
|---|---|---|
| Plan como contrato del constructor | `app_agents/plan.py` | carga con huella; `ContratoDeGrafo` (aristas, ramas por defecto, tipos) del plan o de la variante |
| Intérprete Python de aristas (RF-09.2) | `app_agents/reglas_arista.py` | tripleta + función nombrada `texas_y_no_aprobar`; igualdad estricta de tipo; todas las aristas se evalúan y registran, gana la primera verdadera; `recalcular` desde lo observado |
| Grafo del demo A | `app_agents/demo_a/{estado,nodos,grafo}.py` | `StateGraph` con `context_schema` (modelo, entorno y reloj por caso); 8 nodos del plan; nodos escritores con `add_conditional_edges` y `path_map` explícito salidos del plan; el enrutamiento vuelve a llamar al intérprete y exige la rama registrada |
| Aclaración con límite U3 | `nodos.aclaracion` | la señal = aclaraciones ya hechas; pide otra solo si la arista lo permite → con U3 = 2 se usan las dos respuestas (hallazgo 2 de la fase 2) |
| Pausa humana | `nodos.pausa_humana` | `interrupt` con las 7 claves (motivo con la arista que disparó, señal, umbral declarado y aplicado, extracción, texto original, evidencia, contraevidencia) y `Command(resume=…)` del auditor simulado (sigue la verdad conocida, DA-04) |
| Separación control/datos y D1 | `nodos.enmascarar`, prompts | el enrutador decide con la orden estructurada; al modelo llegan edad, sexo y texto con identificadores enmascarados; el redactor jamás ve el texto libre; catálogo como `enum` en el esquema |
| Guardia determinista | `demo_a/guardia.py` | identificadores del afiliado, frases con instrucción inyectada, lista blanca de acciones, extracción alterada por una carga; severidad 0–3 declarada como dato |
| Documento de decisión adversa | `demo_a/documento_adverso.py` | por código, ES/EN: servicio, causal tasada con norma, regla RB-03, datos usados, versión del plan y del plan de beneficios, quién decidió, vía de contradicción, aviso de IA; `completo` calculado |
| Entorno simulado | `demo_a/simulacion.py` | médico que responde según el guion del caso; auditor que sigue la verdad; `RespondedorSimulado` para `ChatSimulado` (lo declarado en `caso.simulacion`) |
| Línea base de agente único | `app_agents/agente_unico.py` | una llamada (extracción + propuesta + carta) con las mismas reglas, decisión, pausa y guardia; aristas del plan con reasignación declarada; sin ciclo de aclaración |
| Exportador `planlang-trace/v1` | `app_agents/exportador.py` | `corrida.json` (manifiesto con huellas), `grafo.json` (`get_graph().to_json()` ⊕ aristas), `trazas/<caso>.json`, `ramas-esperadas.json`, `entorno.json` (solo reales); `verificar_corrida` |
| Ejecutor de lotes | `app_agents/lotes.py` | `pnpm lote:demo` / `pnpm lote:base`; sesiones acumulables sin duplicar; límite de uso detiene la sesión sin exportar el caso; otro error deja traza parcial con el nodo; `SqliteSaver` (600) en reales; espejo LangSmith si hay clave |
| Adaptador | `adaptador.py` | clasificación de `error_max_turns` desde stdout y reintento dentro de § 9.1 (ADR-004); reintentos y su costo en la traza |

Corrida simulada versionada: `runs/demo-a/simulado-3casos/` (humo: normal · empate en U1 y U2 · inyección con negación), idéntica byte a byte en cada regeneración (gate en pytest).

### Primera corrida real — lote de 20 (suscripción, alias `sonnet`, sin espejo LangSmith)

**Intento 1 (descartado por defecto del adaptador):** multiagente 19/20 con 1 error `otro` (A-009 en el extractor); línea base 11/20 con 9 errores `otro`. Causa (reproducida): `rc = 1`, stderr vacío y `subtype: error_max_turns` solo en stdout; el adaptador leía solo stderr. Arreglo y decisión en ADR-004. Las corridas defectuosas no se versionan; sus logs quedaron en el scratchpad de la sesión.

**Intento 2 (versionado):**

| | `suscripcion-planlang-a-001-20` (multiagente) | `…-20-base` (agente único) |
|---|---|---|
| Decisión y pausa iguales a la verdad conocida | **20/20** | 18/20 (A-008 y A-020: sin ciclo de aclaración, los faltantes van a pausa) |
| Extracción exacta (casos con `presente`) | **15/15** | 13/15 |
| Errores de proveedor | 0 | 0 |
| Latencia mediana por caso | 11,2 s (C7 pide ≤ 30 s) | 11,4 s |
| Llamadas al modelo · reintentos por `error_max_turns` | 46 · 3 | 16 · 9 |
| Tokens (entrada + salida) · costo nominal | 156.466 · US$ 0,69 | 92.475 · US$ 0,59 |
| Duración de la sesión (pausa 2 s entre casos) | 4 min 59 s | 4 min 47 s |

Humo real previo (3 casos, fuera del repo): 3/3; en el caso con inyección el modelo **bajó su confianza a 0,4** en vez de obedecer la carga. Contexto por llamada del extractor ≈ 4.650 tokens (catálogo de 40 procedimientos + 39 diagnósticos).

### Tests

`pytest`: **122 passed, 3 skipped, cobertura 95,9 %** (nuevos: `test_reglas_arista`, `test_grafo_demo_a`, `test_guardia`, `test_documento_adverso`, `test_exportador`, `test_lotes`, `test_corrida_simulada_versionada`, y 4 del adaptador). Vitest: el gate E-11 recorre también las corridas reales (sin hallazgos) — ajuste: las claves de metadato `fecha`, `aprobado_el`, `verificada`, `vigencia` no son fechas de una persona (test: una fecha dentro de un texto sigue disparando). `ruff check` y `ruff format --check` limpios. Fricción de orden de tests: el logger se quedaba con el `stderr` del primer test; ahora escribe en el `sys.stderr` vigente.

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| RF-09.2 lado Python | `menor_que` ignora `inclusivo` en `reglas_arista.comparar` | 🔴 tabla de operadores (0,75 < 0,75) + `rf_09_2…[simulado-3casos]` (AH-002, el empate) → 🟢. El lote real no tiene empate de confianza: por eso existe la corrida de humo |
| Determinismo del exportador | «fue aprobada» → «quedó aprobada» en la respuesta simulada | 🔴 `difiere: corrida.json` → 🟢 |
| Clasificación de `error_max_turns` | el adaptador vuelve a ignorar el JSON de stdout | 🔴 3 tests del adaptador → 🟢 |
| Guardia de salida | filtro de identificadores apagado | 🔴 `test_identificador_filtrado_severidad_2` y el test D1 del grafo → 🟢 |
| E-11 sobre corridas reales | «Llame al 310 555 1234» en la salida de A-001 | 🔴 vitest `[hipaa_telefono] $.salida_final.es` y pytest `rf_09_2…[suscripcion-planlang-a-001-20]` (huella) → 🟢 |
| Gate que puede fallar (dentro del propio test) | intérprete roto por `monkeypatch` | el test exige que `verificar_corrida` nombre `AH-002 paso 4 decision` |

### Desviaciones y deudas de la fase

- **LangSmith: sin espejo.** `LANGSMITH_API_KEY` y `LANGSMITH_TRACING` ausentes al correr (verificado sin imprimir valores). Las corridas se hicieron sin espejo, como prevé la orden; **deuda del gate ⭐ (parada 3)**: el espejo se llena en la corrida siguiente con la clave en el entorno.
- **`pass^3` de C5:** una corrida real (k = 1); las corridas 2 y 3 del mismo lote van en corridas separadas (`--corrida …-r2`, `…-r3`) en la fase 5.
- **Evaluaciones por caso:** no viajan en la traza; las calcula el verificador (fase 4) y van al informe (spec § 6.9 las pide en la corrida exportada: el informe es parte de ella).
- **El exportador lee el estado final del checkpoint**, no el stream: los nodos escriben pasos y decisiones en el estado, así que es equivalente y más simple.
- **Señales de nodos no visitados = `null`** (p. ej. `senal_confianza` en urgencias); `ciclos_aclaracion` final = aclaraciones pedidas. El verificador trata `null` como «no aplica» (fase 4).
- **Tokens de los intentos fallidos** no se cuentan (sí su costo): ADR-004.

### CI del PR borrador #7 (2026-09-27, commit `1b141f7`)

Abierto como borrador a pedido del usuario, para ver la CI antes de las fases 4 y 5. Los 4 checks requeridos con conclusión propia `success` (ninguno `skipped`):

| Check | Resultado | Evidencia en el log |
|---|---|---|
| `quality` | ✅ 52 s | vitest 25 archivos · 315 tests (los 30 de `tests/unit/diseno-tokens.test.ts` son de la Etapa de Diseño, no versionados aquí) |
| `e2e` | ✅ 54 s | smoke del estampado |
| `lighthouse` | ✅ 1 min 31 s | sin cambios de UI |
| `python` | ✅ 29 s | **primera ejecución con contenido del sprint:** ruff limpio · 122 passed, 3 skipped · cobertura 95,86 % (umbral 70) |

Dependabot abrió el #6 (`@types/node` 22 → 26) durante el sprint: se procesa después del PR del sprint (regla 18; salto de mayor con Node 22 en CI).

## Fase 4 — Verificador de brecha, intérprete TypeScript y validación del instrumento (2026-09-27)

### Qué se construyó (`core/`, TypeScript puro: Node y navegador)

- **`core/formatos/traza.ts`** — el lado lector del contrato Python → TypeScript (regla 19): Zod `strict` para `corrida.json`, `grafo.json`, `ramas-esperadas.json` y cada traza. Las tres corridas versionadas validan sin cambios del exportador.
- **`core/playground/interprete.ts`** — intérprete de aristas con la semántica exacta de `reglas_arista.py` (igualdad estricta de tipo, `inclusivo`, `umbral.Ux`, función nombrada `texas_y_no_aprobar`, primera verdadera gana). `ramasEsperadas` produce el mismo objeto que escribe Python; `discrepanciasDeRamas` compara contra lo que registró el agente.
- **`core/brecha/`** — el verificador determinista:
  - `lector.ts` (RF-06.1): huella de plan, lote, manifiesto, grafo, ramas y cada traza; referencias cruzadas; trazas mal formadas (`nodos_visitados` ≠ pasos, pasos no numerados, decisión en un paso que no es su nodo); corridas incompatibles (repetición = misma corrida, línea base de otra variante, otro plan u otro lote). Rechaza con TODOS los motivos juntos.
  - `contexto.ts` + `reglas.ts`: el vocabulario con que el plan escribe sus reglas, resuelto por caso (señales de la traza, `salida_final` ES+EN, `interrupt_payload`, `verdad_conocida`, `umbral.Ux`…), y un único motor población + condición para criterios, detectores, supuestos y evaluadores. Tres errores distintos en `condiciones.ts`: señal **nula** (en población = «no aplica», contada aparte; en condición = no evaluable), señal **faltante** (no evaluable, y el contrato la reporta) y **comparación sospechosa** (objetos con claves distintas: la regla del plan queda `mal_formado`).
  - `criterios.ts` (RF-06.2): `todos_cumplen`, `tasa`, `pass^k` con `k_observado` (si la tasa observada ya está bajo el objetivo es `incumple`; si no y faltan corridas, `incompleto`, nunca `cumple`), mediana/promedio/máximo por métrica. Estados `cumple · incumple · incompleto · indeterminado · sin_poblacion · mal_formado`.
  - `detectores.ts` (RF-06.3): detector de cada riesgo tal cual, con prioridad de acción AIAG-VDA del reusable y RPN secundario.
  - `calibracion.ts` + `supuestos.ts` (RF-06.4): ECE (10 intervalos), AUROC por rangos con empates promediados, curva riesgo-cobertura sobre el rango jugable de U1 con el operador de la arista; tasa; comparación con la línea base (exactitud = decisión y pausa correctas, latencia mediana, presupuesto: llamadas reales al modelo con reintentos, tokens, costo). Solo se confirma o refuta con `umbral_confirmacion` numérico; y se pregunta **«¿puede fallar?»**: una condición `señal <= n` que el grafo acota por construcción queda `sin_probar` y lo dice.
  - `contrato-grafo.ts` (RF-06.5 + RF-09.2): nodos, aristas, ramas por defecto y pausas del grafo contra el plan; por traza: señales obligatorias, nodos declarados, rama seguida, pausa registrada con rol y payload mínimo; recálculo de ramas en TypeScript contra lo registrado y contra la huella de Python, sobre la corrida principal, sus repeticiones y su línea base.
  - `brechas-no-previstas.ts` (RF-06.6): los 4 evaluadores `regla` del plan implementados como reglas del mismo lenguaje (registro cerrado); una falla que ningún riesgo cubierto detectó en ese caso es brecha no prevista, con **nodo y paso del primer error** (regla dura 10); también errores del proveedor sin riesgo que los cubra y **reintentos de salida estructurada** (el modo de ADR-004). El juez `calidad_redaccion` figura como «no corrió (opcional en este corte)».
  - `veredicto.ts` (RF-06.7), `informe.ts` (§ 6.10 + § 12, JSON canónico con huella) y `render-md.ts` (Markdown ES/EN redactado desde plantillas, 9 secciones, estado con símbolo + texto).
  - `m9.ts` (RF-09.1): 8 brechas sembradas sobre la corrida simulada limpia + control sin sembrar.
- **CLI:** `pnpm brecha:informe --corrida runs/demo-a/<id>` (toma `<id>-base` y `<id>-r2…` por convención; `--verificar` para frescura) · `pnpm trazas:verificar` (huellas + RF-09.2 + barrido de credenciales sobre `runs/`) · `pnpm m9:reporte`.
- **Artefactos:** `runs/demo-a/suscripcion-planlang-a-001-20/informe.{json,es.md,en.md}` (el primer informe de brecha real) · `tests/golden/demo-a/simulado-3casos/informe.{json,es.md,en.md}` · `docs/kit-de-prueba/M9-brechas-sembradas.md`.

### El primer informe de brecha real — `suscripcion-planlang-a-001-20` (huella `16e50e29…`)

**Veredicto: ⚠ cumple con alertas.** 8 de 9 criterios cumplidos, 0 fallidos, 1 sin cerrar; ningún riesgo ocurrió.

| Pieza | Resultado |
|---|---|
| C1 · C2 · C4 · C6 · C8 · C9 | ✓ cumplen (C4 sobre 4 casos: 2 urgencias + 2 exentos; C6 sobre 1 inyección) |
| C3 | ✓ cumple sobre 3 casos de alto costo; **5 fuera de la población por señal nula** (urgencias y exentos no pasan por el extractor; A-007 no recibió el costo) — el informe lo dice |
| C5 | ◐ **incompleto**: 100 % medido con k = 1 de 3 |
| C7 | ✓ mediana 11,215 s (≤ 30 s); A-008 supera 30 s por sí solo (35,2 s, dos ciclos de aclaración) |
| R1–R4, R6–R8 | ✓ no ocurrieron |
| R5 | ⚠ **detector mal formado** (ver desviación 8) — el riesgo NO se midió |
| S1 | ◌ sin probar: ECE 0,08; AUROC **no existe** (15 de 15 extracciones correctas: nada que discriminar); muestra pequeña; el plan no declara umbral numérico |
| S2 | ◌ sin probar: **no puede fallar** con U3 = 2 (ver desviación 9) |
| S3 | ✓ confirmado: multiagente 100 % vs agente único 90 % (A-008 y A-020 difieren), latencia mediana 11,215 s vs 11,36 s; la línea base gastó menos (25 llamadas vs 49; US$ 0,59 vs 0,69) → comparación a igual o menor presupuesto |
| Brechas no previstas | 3 reintentos de salida estructurada en el extractor (A-008 paso 4, A-013 paso 2, A-017 paso 2): el modo de falla de ADR-004 que el plan no anticipaba |
| Contrato de grafo | 8/8 nodos, 16/16 señales en las 20 trazas, 8 pausas registradas con rol `auditor`; RF-09.2: 62 visitas (multiagente) y 49 (línea base) sin discrepancias, misma huella que Python |

Casos ejemplares: exitoso A-001 · escalado correctamente A-004 · fallido: **ninguno** · adversario neutralizado A-006.

### Tests

- **vitest:** 490 tests locales (incluyen los de la Etapa de Diseño, que no se versionan; la cifra de referencia es la de la CI: 461 en 44 archivos sobre `0db4cd0`). Nuevos de la fase: `tests/unit/core/playground/{interprete,rf-09-2}.test.ts`, `tests/unit/core/brecha/{condiciones-nulos,lector,criterios,detectores,calibracion,supuestos,contrato-grafo,brechas-y-veredicto,informe,render-md,m9,numeros,perf-200}.test.ts`, `tests/integration/{informe-simulado,informes-versionados}.test.ts` (los de integración corren en `core` y `core-jsdom`: mismos bytes que el golden en Node y en jsdom).
- **Cobertura:** `core/brecha` 98,5 % líneas · 92,7 % ramas; `core/playground` 100 %; umbral 90 cumplido.
- **Performance (DoD):** informe de 200 casos en **57 ms** en Node (presupuesto 2 s). Sin corrida real de 200 todavía: las 20 trazas reales se replican sobre los casos A-021…A-200 del lote versionado, re-selladas y con sus ramas recalculadas, así que el verificador hace todo el trabajo (200 huellas, reglas por caso, contrato, RF-09.2).
- **M9:** 8/8 brechas sembradas detectadas; control sin sembrar limpio.
- **pytest:** 122 passed, 3 skipped (humo real), 95,9 % — sin cambios; ruff limpio. `pnpm trazas:verificar`: ✓ las 3 corridas.
- **CI del PR #7 sobre `0db4cd0`:** `quality` (44 archivos, 461 tests), `e2e`, `lighthouse` y `python` en `success` con conclusión propia.

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| RF-09.2 cruzada (TypeScript) | `menor_que` tratado como `<=` en `interprete.ts` | 🔴 3 tests nombran **AH-002 · paso 4 · decision** (registró `redactor`, recalcula `pausa_humana`) → 🟢. Las corridas reales NO se pusieron rojas: ninguna confianza real cayó justo en 0,75; el empate solo existe en el caso de borde del lote de humo, por eso ese caso está en el lote que corre la CI |
| Golden del informe (Node y jsdom) | título de la sección 1 cambiado en `render-md.ts` | 🔴 `informe.es.md` en `core` y en `core-jsdom` → 🟢 |
| M9 | detector de señal faltante apagado en `contrato-grafo.ts` | 🔴 `n/n detectadas` y frescura del reporte M9 → 🟢 |
| Lector (RF-06.1) | verificación de huella de las trazas quitada | 🔴 lector (`HUELLA_NO_COINCIDE`) y M9 (`huella_alterada`) → 🟢 |
| Regla mal formada | la comparación sospechosa desactivada en `condiciones.ts` | 🔴 tests de condiciones y criterios, y los 3 golden en ambos proyectos (R5 pasaría a «medido») → 🟢 |
| Frescura del informe versionado | un signo cambiado en `runs/…/informe.es.md` | 🔴 en `core` y `core-jsdom`, nombrando la corrida → 🟢 |
| Presupuesto de líder del informe | recomendación alargada a > 50 palabras | 🔴 2 tests (informe simulado y plantilla `cumple_con_alertas`) → 🟢 |
| Performance | presupuesto bajado a 10 ms | 🔴 → 🟢 |
| E-11 sobre el informe exportado | «Llame al 310 555 1234» en el resumen de `informe.json` | 🔴 `[hipaa_telefono] $.resumen.texto.es` (el gate existente ya recorre el informe nuevo) → 🟢 |
| `pnpm trazas:verificar` | `"session_id"` en una traza (copia en scratchpad) | 🔴 exit 1 con `ESQUEMA` y `CREDENCIAL` nombrando el archivo |

### Desviaciones y deudas de la fase

- **El informe de la corrida simulada vive en `tests/golden/`**, no junto a la corrida: el gate de determinismo de Python compara la lista exacta de `*.json` de `runs/demo-a/simulado-3casos/`.
- **Evaluaciones por caso (§ 6.9):** van en el informe (sección 5, tabla de evaluadores), no en la corrida exportada — como se anotó en la fase 3.
- **`opciones[].nombre` de las decisiones no es bilingüe** (esquema del plan desde la fase 1; `no_detectable_en_trazas` tampoco): el informe muestra pregunta + justificación, que sí lo son. Deuda de regla 20 para el esquema del plan (S2).
- ~~El comando `pnpm trazas:verificar` no corre en CI: lo que verifica ya lo cubren vitest y pytest.~~ **Falso para las credenciales de las corridas reales** (pytest solo barre simuladas recién generadas; vitest no busca patrones de credencial) — corregido en la auditoría final (M-5): el comando corre en el job `quality`, barre también los `.md` y busca rutas locales.

## Fase 5 — Cierre (2026-09-27)

### Plan v1.2 y ADR-005 (decisión del usuario en el gate de la fase 4: «v1.2 y 3 corridas»)

- **`plans/demo-a/v1.2.json`** (huella `9add6e5a…`), producido por `pnpm tsx scripts/enmendar-plan-demo-a.ts --a 1.2 --por … --el …` (`scripts/enmienda-plan-demo-a.ts · enmendarAV12`): cambia **solo la medición**. R5 → `extraccion.campos != verdad_conocida.campos` (desviación 8) · S1 → `umbral_confirmacion {auroc_min: 0.75, ece_max: 0.10}` · S2 → población «faltante con respuesta del médico», condición `campos_faltantes_count == 0`, `umbral_confirmacion {tasa_min: 0.95}` (ya puede fallar; desviación 9). Umbrales y contrato de grafo idénticos (JCS) a la v1.1.
- **ADR-005 «enmiendas de medición y lotes»**: un lote generado con el plan A vale para el plan B si ambos conservan exactamente `umbrales` y `contrato_de_grafo`. Se implementó en los dos lenguajes: `core/plan/compatibilidad.ts · mismaVerdad` (lo exige `leerEntrada` y `leerCorridaVerificada`) y `app_agents.plan · misma_verdad / plan_por_huella` (lo exige `lotes.py` antes de correr). El informe lo declara en la ficha: «generado con el plan 1.1.0». La historia v1.1 (corrida, línea base, informe) sigue verificándose tal cual.
- `lotes.py` corre por defecto con la v1.2; la corrida simulada `simulado-3casos` se regeneró con ella (y el golden, el informe v1.1 y el reporte M9).

### Corridas v1.2 — el mismo lote de 20 (suscripción, alias `sonnet`, pausa 2 s, 90 s entre corridas, sin espejo LangSmith)

| | `…-20-v1.2` | `…-v1.2-r2` | `…-v1.2-r3` | `…-v1.2-base` (agente único) |
|---|---|---|---|---|
| Decisión y pausa iguales a la verdad conocida | **20/20** | **20/20** | **20/20** | 17/20 (A-008, A-012, A-020) |
| Extracción exacta (C5, casos con `presente`) | 15/15 | 15/15 | 15/15 | 12/15 |
| Errores de proveedor | 0 | 0 | 0 | 1 (A-012 `esquema_invalido` tras 2 reintentos) |
| Latencia mediana por caso | 11,83 s | 11,04 s | 10,18 s | 9,26 s |
| Llamadas al modelo (con reintentos) · reintentos | 47 · 1 | 49 · 3 | 49 · 3 | 23 · 7 |
| Tokens · costo nominal | 157.146 · US$ 0,67 | 156.926 · US$ 0,70 | 156.511 · US$ 0,69 | 87.368 · US$ 0,62 |
| Sesión (inicio → fin) | 09:09 → 09:14 | 09:22 → 09:27 | 09:29 → 09:34 | 09:15 → 09:20 |

Ningún límite de uso alcanzado. Costo nominal total de las 4 corridas ≈ US$ 2,68 (con la suscripción no se factura: es la cifra que reporta el binario).

### El informe v1.2 — `suscripcion-planlang-a-001-20-v1.2` (huella `112c66a6…`)

**Veredicto: ⚠ cumple con alertas.** 9 de 9 criterios cumplidos; ningún riesgo ocurrió.

| Pieza | v1.1 (historia) | v1.2 |
|---|---|---|
| C5 · exactitud de extracción | ◐ incompleto (k = 1 de 3) | ✓ **cumple con k = 3 de 3** (100 % en las tres) |
| R5 · confianza mal calibrada | ⚠ detector mal formado | ✓ medido, no ocurrió (0 % sobre 14 casos; ocurre si > 10 %) |
| S1 · confianza calibrada | ◌ sin probar (sin umbral) | ◌ **sin probar**: ECE 0,081 (≤ 0,10 ✓) pero AUROC no existe (15/15 aciertos: nada que discriminar). El informe lo explica; hace falta un lote con errores de extracción para decidirlo |
| S2 · dos ciclos bastan | ◌ sin probar (no podía fallar) | ✓ **confirmado** con n = 2 (A-007 y A-008) — con la nota «muestra pequeña» |
| S3 · multiagente no peor que agente único | ✓ confirmado | ✗ **refutado por latencia**: 100 % vs 85 % en exactitud, pero 11,83 s vs 9,26 s de mediana. La línea base gastó menos (23 llamadas vs 47; US$ 0,62 vs 0,67). El informe declara el error de la base en A-012 |
| Brechas no previstas | 3 reintentos del extractor | 1 (A-003: reintento de salida estructurada en el extractor) |
| RF-09.2 | 2 corridas | **4 corridas** (62 · 62 · 62 · 47 visitas), 0 discrepancias, misma huella que Python |

S3 refutado es un resultado legítimo del plan: la tesis «multiagente no rinde peor» cae en latencia (≈ 2,6 s más por caso, del costo de la segunda llamada al modelo) aunque gana en exactitud. Queda para el S2/S3 del producto decidir si el plan cambia el supuesto (p. ej., latencia con tolerancia) — **no se cambia a posteriori para que confirme**.

### Ajustes al informe en esta fase (salieron al leer el informe v1.2)

- El disparador de un riesgo se imprimía con el literal del plan (`ocurre si > 0.10` también en español) → `partirDisparador` + formato del idioma y de la unidad: `0 % (ocurre si > 10 %)` / `0% (occurs if > 10%)`.
- La nota «muestra pequeña» solo existía para la calibración → ahora en todo supuesto medido con n < 30 (S2 con n = 2 decía «confirmado» sin advertencia).
- El error del proveedor en la línea base (A-012) solo se veía como «caso que difiere» → limitación explícita en S3: cuenta como mal resuelto y se nombra.

### Documentación

- `docs/MANUAL-DE-USO.md` (ES/EN): validar/enmendar un plan · generar casos · correr un lote · leer el informe · verificar las trazas · limitaciones.
- `docs/GUIA-DE-PRUEBA.html` nace (plantilla del kit, namespace `guia-planlang:s1:`): 21 pruebas, 5 ⭐, **3 ⭐⭐ (gate corto, ~15 min)** = parada 1 correr un lote real · parada 2 leer el informe v1.2 ES/EN · parada 3 LangSmith (si está aprovisionado); 16 automatizadas listadas con `Nuevo · S1`.
- `docs/kit-de-prueba/README.md` (ES/EN): mapa del kit (lotes, planes, corridas, informes, M9).
- `README.md`: bloque de comandos corregido. `CHANGELOG.md:211`: el literal del dominio de Pages pasa a clase de carácter (K13); el barrido de cero enlaces queda limpio.

### Tests

- **vitest:** 576 tests versionados en verde (600 locales con los 24 de la Etapa de Diseño, que no se versionan). Nuevos/ajustados de la fase: `tests/unit/core/plan/enmienda-v1-2.test.ts`, lector «lote generado con otro plan», informe v1.2 (C5 k = 3, R5 medido, S1/S2/S3), notas de supuestos, formato del disparador.
- **Cobertura:** `core/brecha` 98,7 % sentencias · 93,4 % ramas; `core/playground` 100 %; `core/plan` 99,2 · 96,2; `core/formatos` 98,0 · 100; `core/sintetico` 98,4 · 95,8.
- **pytest:** 129 passed, 3 skipped (humo real), cobertura 96,1 %; `ruff check` y `ruff format --check` limpios.
- `pnpm typecheck` limpio · `pnpm lint` 0 errores (2 avisos en `public/diseno/assets/maqueta.js`, archivo local de la Etapa de Diseño, no versionado en esta rama).
- `pnpm trazas:verificar`: ✓ las 7 corridas · `pnpm m9:reporte --verificar`: 8/8 y control limpio · `pnpm brecha:informe --verificar` al día en las 3 (golden, v1.1, v1.2).
- Auditorías de dependencias: `pnpm audit` sin vulnerabilidades; `pip-audit --skip-editable` limpio (K4).

### Demos en rojo (regla 15)

| Gate | Cambio deliberado | Resultado |
|---|---|---|
| Compatibilidad de lotes, TypeScript (ADR-005) | `mismaVerdad` devuelve siempre `true` | 🔴 2 tests: lector «con otra verdad → rechazo» y enmienda v1.2 «la v1.1 no tenía la misma verdad que el v1» → 🟢 |
| Compatibilidad de lotes, Python (ADR-005) | `misma_verdad` devuelve siempre `True` | 🔴 `test_un_lote_de_otro_plan_solo_vale_si_da_la_misma_verdad` y `test_plan_v1_2_es_una_enmienda_de_solo_medicion` → 🟢 |
| Nota del error de la línea base | nota suprimida en `supuestos.ts` | 🔴 4 tests: supuestos, informe v1.2 y frescura del informe versionado en `core` y `core-jsdom` → 🟢 |

### Auditoría final (`/audita-sprint`, 2026-09-27)

- **Fase 1 (solo lectura):** tres auditores independientes del constructor, en paralelo, con el diff `main...HEAD` (356 archivos) delante: alcance/frases/cardinalidades · núcleo TypeScript · Python/seguridad/CI/costura. El constructor consolidó y verificó a mano los hallazgos que cambian lo publicado. Reporte completo, con `archivo:línea` en cada hallazgo: `sprints/SPRINT_001-auditoria.md`. **Veredicto: requiere ajustes** — 0 Críticos · 10 Altos · 26 Medios · 27 Bajos.
- **Aprobación del usuario (2026-09-27):** «apruebo, opción recomendada» → Fase 2 = los 10 Altos + los Medios baratos de honestidad y seguridad (M-1, M-2, M-3, M-4, M-5, M-6, M-7, M-10, M-11, M-17, M-19, M-20 parcial, M-21) + los Bajos de texto (B-1, B-13, B-14, B-15, B-17, B-19). El resto, deuda con sprint de pago (sección 6 del reporte).

**Pagos de la Fase 2**

| Id | Qué se hizo | Dónde |
|---|---|---|
| AU-1 | Una métrica que no cumple refuta aunque otra no se haya podido medir (el golden: S1 pasa a «✗ refutado», ECE 0,1067 > 0,10) | `core/brecha/supuestos.ts` (`decidirConUmbral`) |
| AU-2 | Riesgos y brechas no previstas también en las repeticiones de pass^k; cada brecha dice su corrida (informe v1.2: 1 → 5 brechas) | `core/brecha/{informe,brechas-no-previstas,veredicto,render-md}.ts` |
| AU-3 | Alertan un supuesto crítico sin probar, un riesgo sin población, las alertas del contrato y los riesgos de las repeticiones; la recomendación nombra el supuesto crítico | `core/brecha/{veredicto,informe}.ts` |
| AU-4 | Ligaduras umbral → señal en el recálculo; la sección 8 CALCULA cuántas decisiones cambia conmutar cada umbral booleano («U4: 0 de 62») y si cada regla con nombre se puede recalcular; desviación 11 | `core/playground/interprete.ts` · `core/plan/contrato-constructor.ts` · `core/brecha/informe.ts` |
| AU-5 | Hallazgo bloqueante `UMBRAL_DISTINTO_DEL_PLAN` (informe y `trazas:verificar`); RF-09.2 prueba con los umbrales DEL PLAN; siembra M9 nueva | `core/brecha/contrato-grafo.ts` · `scripts/trazas-verificar.ts` · `tests/unit/core/playground/rf-09-2.test.ts` · `core/brecha/m9.ts` |
| AU-6 | Hallazgo bloqueante `DECISION_SIN_REGISTRO` (cada visita de un nodo que decide registra sus aristas 1..n); el verificador ya no revienta con un registro a medias; siembra M9 nueva | `core/brecha/contrato-grafo.ts` · `core/brecha/m9.ts` |
| AU-7 | Un evaluador, un supuesto o una repetición cuya regla no puede medir se reporta mal formado, no «ejecutado, sin fallas» | `core/brecha/{brechas-no-previstas,supuestos,criterios,render-md}.ts` |
| AU-8 | El límite de uso que llega SOLO en el JSON del CLI (`result` o `api_error_status: 429`) es `limite_de_uso` y detiene la sesión | `agents/src/app_agents/adaptador.py` |
| AU-9 | ADR-001 §4 enmendado con el comportamiento real; el respaldo a `pausa_humana` pasa a deuda del S2; desviación 14 | `decisions/001-codigo-primero-demos.md` |
| AU-10 | Tamaño de sesión y alias del modelo salen del plan (`lotes.*`); con la suscripción, `lotes.py` rechaza más casos que el plan o correr sin pausa; `lote:demo`/`lote:base` con `--pausa-s 2`; ADR-002 con las cifras medidas | `agents/src/app_agents/lotes.py` · `package.json` · `decisions/002-…md` |
| M-1 | La guardia sustituye salidas vacías, JSON crudo o «placeholder» y lo registra (`salida_malformada`); el informe nombra las 5 respuestas inservibles de la línea base v1.2 en S3 | `agents/src/app_agents/demo_a/guardia.py` · `core/brecha/supuestos.ts` |
| M-2 | Plan de beneficios cotejado en los dos lados (bypass de ADR-005 cerrado); el lector cruza además `plan.id/version`, `demo_id`, umbrales de las ramas y `casos_con_error` | `agents/src/app_agents/lotes.py` · `core/brecha/lector.ts` · `decisions/005-…md` (adenda) |
| M-3 | pass^k exige repeticiones distintas, del mismo grafo y sobre los mismos casos; S3 dice si la base corrió otros casos | `core/brecha/lector.ts` · `core/brecha/supuestos.ts` |
| M-4 | `.coverage` (con rutas locales) fuera del repo y en `.gitignore` | `.gitignore` |
| M-5 | `pnpm trazas:verificar` corre en el job `quality`; barre `.md` y busca rutas locales y más patrones de credencial; corregida la afirmación falsa de la fase 4 | `.github/workflows/ci.yml` · `scripts/trazas-verificar.ts` |
| M-6 | S3 dice la regla con que se decide («no peor», tolerancia cero); sin latencia, no decide | `core/brecha/supuestos.ts` |
| M-7 | Regla dura 4 como arquitectura: una negación o un rechazo sin pausa humana corta el caso en el redactor y en el cierre de la línea base | `agents/src/app_agents/demo_a/nodos.py` · `agents/src/app_agents/agente_unico.py` |
| M-10 | ADR-006: «a igual presupuesto» = presupuesto no mayor, dicho en voz alta, con dos propuestas | `decisions/006-linea-base-a-igual-presupuesto.md` |
| M-11 | Entorno del hijo filtrado también por prefijo (`ANTHROPIC_`, `LANGSMITH_`, `LANGCHAIN_`, `CLAUDE_CODE_`); test con las listas fijadas literalmente; **humo real 3/3** tras el cambio | `agents/src/app_agents/adaptador.py` · `agents/tests/test_adaptador_flags.py` |
| M-17 | ADR-001: ruta de test corregida; la línea base de extracción por patrones, declarada no medida (deuda S2) | `decisions/001-…md` |
| M-19 | Desviaciones 12 y 13 | esta bitácora |
| M-20 | `pausas_cumplidas` también exige pausa ante «rechazar» (lo demás de M-20, deuda S3) | `core/brecha/brechas-no-previstas.ts` |
| M-21 | Solo el riesgo cuyo detector mira la falla la cubre | `core/brecha/brechas-no-previstas.ts` |
| B-1 · B-13 · B-14 · B-15 · B-19 | Registro de la demo del job `python` (PR #4), cifras y frases caducas de la bitácora, README, FAQ del manual ES/EN, ADR-004 | bitácora · `README.md` · `docs/MANUAL-DE-USO.md` · `decisions/004-…md` |
| B-17 | El informe en inglés ya no lleva enumeraciones en español (decisiones, tipo de ataque, métricas, tipos de nodo y evaluador, variante) | `core/brecha/{informe,render-md}.ts` |

**Demos en rojo de la Fase 2 (regla 15; rojo → verde al revertir, en el mismo cambio)**

| Gate | Cambio deliberado | Quién lo nombró |
|---|---|---|
| AU-1 refutación con métrica nula | código viejo de `decidirConUmbral` | `supuestos.test.ts` «una métrica sin valor no esconde otra que refuta» |
| AU-2 brechas de las repeticiones | quitar las brechas de las repeticiones del informe | `informe.test.ts` (informe v1.2) |
| AU-3 supuesto crítico sin probar | quitar la alerta | `brechas-y-veredicto.test.ts` + `informe.test.ts` |
| AU-4 ligaduras | no reemplazar la señal ligada | `interprete.test.ts` (AU-4) |
| AU-5 umbrales del plan | el chequeo nunca dispara | `contrato-grafo.test.ts` + M9 (`umbral_distinto_del_plan` ✗) + frescura del reporte M9 |
| AU-6 decisión sin registro | el chequeo nunca dispara | `contrato-grafo.test.ts` + M9 (`decision_sin_registro` ✗) + frescura del reporte M9 |
| AU-7 regla que no puede medir | el evaluador ignora `mal_formada` | `brechas-y-veredicto.test.ts` (AU-7) |
| AU-8 límite en el JSON | quitar la detección | 3 casos de `test_clasificacion_de_fallos_del_proveedor` |
| AU-10 tamaño de sesión del plan · pausa obligatoria | `n = 20` cableado · sin la validación de `--pausa-s` | `test_el_tamano_de_sesion_y_el_modelo_salen_del_plan` · `test_la_cli_exige_espaciar_con_la_suscripcion` |
| M-1 guardia · M-1/M-3 verificador | la guardia no mira la forma · la limitación nunca se agrega | `test_una_salida_vacia_json_o_de_relleno_no_llega_al_afiliado` · `supuestos.test.ts` (S3) |
| M-2 plan de beneficios | sin la comparación (TS y Python) | `lector.test.ts` (M-2) · `test_un_lote_de_otro_plan_de_beneficios_se_rechaza` |
| M-3 repeticiones | sin la comparación de `version_grafo` | `lector.test.ts` (M-3) |
| M-5 barrido ampliado | una ruta `/Users/…` en un `.md` de una corrida (copia en el scratchpad) | `pnpm trazas:verificar --raiz <copia>` exit 1 nombrando el archivo y el patrón → exit 0 al quitarla. El paso de CI corre el mismo comando; su primera ejecución en CI se ve en el PR |
| M-7 negación sin pausa | sin la aserción | `test_ninguna_negacion_sin_pausa_aunque_el_plan_omita_la_arista` |
| M-11 prefijos del entorno | sin el filtro por prefijo | `test_env_del_hijo_no_lleva_claves_ni_anidamiento` |
| M-20 «rechazar» | la condición vieja | `brechas-y-veredicto.test.ts` (M-20) |
| M-21 cobertura por riesgo | cualquier riesgo cubre | `brechas-y-veredicto.test.ts` «errores del proveedor y reintentos…» |

## Desviación del plan

1. **Carnada C03 del contrato `instrumentos-de-plan` v0.1.0** (se aplica en la fase 1): la tabla de prioridad de acción AIAG-VDA 2019 da `baja` para S8·O3·D4, no `alta`. Enmienda propuesta en el summary: C03 → S8·O6·D2 (`alta`, RPN 96) y C03-bis → S8·O3·D4 (`baja`, RPN 96). Fuente secundaria verificada 2026-09-26 (Relyence, tabla AP); la primaria (handbook) no es accesible por curl.
2. **`pass^3` de C5** con una sola corrida real en este sprint: el informe declara `k_observado = 1 de 3 · incompleto`; las corridas 2 y 3 se acumulan en background. → **Resuelto en la fase 5:** plan v1.2 con r2/r3; C5 cumple con k = 3 de 3.
3. **Arista «modo Texas»** del plan v0 no cabe en la tripleta: se declara como función nombrada `texas_y_no_aprobar(modo_texas, propuesta)` (regla 2).
4. **Aristas del nodo `decision`** necesitan `orden` y `rama_por_defecto`; el plan v0 no lo declara.
5. Otras correcciones del plan v0 que el validador exija: se anotan en la fase 1 (10 correcciones; confirmadas por el usuario con el «continúa» de la fase 1).
6. **Hallazgos de coherencia del plan v1** (fase 2): exentos contra C4/R6, semántica de U3 y medida de S2, población de C3 en urgencias. **Resuelto el primero con el plan v1.1** (aprobado por el usuario, fase 3); U3 implementado como «hasta U3 aclaraciones usando todas las respuestas»; S2 y C3 van al verificador (fase 4).
7. **Regla 6 (`--max-turns 1`) y `--json-schema`** (fase 3): `error_max_turns` en 3/46 llamadas del multiagente y 9/16 de la línea base; se reintenta (ADR-004). Propuesta a la planeadora: `--max-turns 2` solo con `--json-schema`.
8. **R5 tiene el detector mal formado desde el plan v0** (fase 4): `extraccion != verdad_conocida.campos` compara la extracción ENTERA (campos, faltantes, confianza…) con sus campos → siempre «distinto»; medido tal cual, R5 «ocurriría» en el 100 % de su población. El verificador lo detecta de forma genérica (comparación de objetos con claves distintas) y lo reporta `mal_formado`, sin medirlo. Corrección propuesta: `extraccion.campos != verdad_conocida.campos`.
9. **S1 y S2 no declaran umbral numérico de confirmación** (ECE ≤ 0,10 · AUROC ≥ 0,75 · 95 % están solo en la prosa de `prueba_barata`), y **S2 no puede fallar** con U3 = 2: el grafo manda a una persona al llegar a 2 ciclos, así que `ciclos_aclaracion <= 2` se cumple por construcción (A-007, que se quedó sin respuesta y escaló, cuenta como «bastaron dos ciclos»). Propuesta: `umbral_confirmacion` `{ece_max: 0.10, auroc_min: 0.75}` en S1 y `{tasa_min: 0.95}` en S2, y S2 reformulado a «faltantes resueltos sin escalar» (`pausa_humana == false`).
10. **Un plan v1.2 con 8–9 cambia solo la medición** (criterios, riesgos, supuestos), no el grafo ni los umbrales; pero las corridas declaran la huella del plan con que corrieron y el lector exige la misma huella en las repeticiones de `pass^k`. **Decisión del usuario (gate de la fase 4, 2026-09-27): «v1.2 y 3 corridas»** — plan v1.2 aprobado y las corridas rehechas (fase 5). Para no romper la historia v1.1 se decidió ADR-005 (un lote vale si el plan conserva umbrales y contrato de grafo). La línea base también se rehízo con la v1.2 (S3 exige el mismo plan): 4 corridas en vez de 3.
11. **U4 (modo Texas) es inerte en el demo A v1.2** (auditoría final, AU-4): `propuesta` solo vale `aprobar` o `negar`, y la arista 4 de `decision` (`propuesta == negar → pausa_humana`) ya manda a una persona todo lo que la arista 5 (`texas_y_no_aprobar`) cubriría. Además el recálculo tomaba `modo_texas` de la traza y no del umbral. Arreglado lo segundo (ligaduras umbral → señal en el intérprete TS); lo primero es del plan: el informe ahora CALCULA «conmutarlo cambia 0 de las 62 decisiones». **Propuesta a la planeadora:** dar a `propuesta` un valor adverso parcial (p. ej. «aprobar con condiciones») o retirar U4 del plan A.
12. **Avance hacia 200 (paso 34, outcome terciario): 0 de 180 casos restantes.** Las corridas de la fase 5 se destinaron a pass^3 del mismo lote de 20 (decisión del usuario, gate de la fase 4). La acumulación sin duplicar está probada (`agents/tests/test_lotes.py`); el avance pasa al S2. Outcome terciario: **parcial**.
13. **Desviaciones menores sin declarar hasta la auditoría:** las siembras de M9 son código (`core/brecha/m9.ts`), no fixtures en `tests/fixtures/brechas-sembradas/`; las reglas deterministas del demo viven en `agents/src/app_agents/demo_a/nodos.py` (no hay `demo_a/reglas.py`).
14. **El ADR-001 §4 prometía un respaldo que no existía** (enrutar a `pausa_humana` con motivo `proveedor_no_disponible`): enmendado con el comportamiento real (auditoría final, AU-9); el respaldo pasa a deuda del S2. Y la línea base no es «a igual presupuesto» sino «a presupuesto no mayor»: ADR-006 lo decide y propone a la planeadora ajustar S3 (M-10).

## Registro de miradas

No aplica en este sprint (sin artefacto visual). La guía de prueba nace en la fase 5 como archivo del repo.

## Bugs y fricciones

| Fecha      | Qué                                                         | Causa                                                                           | Resolución                    |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| 2026-09-27 | `.gitignore` no ignoraba el egg-info tras K2                | comentario en la misma línea que el patrón                                      | comentario en su propia línea |
| 2026-09-27 | gitleaks bloqueó el commit de la fase 0                     | falso positivo `generic-api-key` sobre un id de modelo junto a la palabra «API» | constantes renombradas (K12)  |
| 2026-09-27 | GitHub API `i/o timeout` intermitente al mergear Dependabot | red                                                                             | reintento                     |
| 2026-09-27 | El barrido de cero enlaces encuentra `CHANGELOG.md:211` | el changelog del kit estampado cita el literal del dominio de Pages al narrar el patrón (regla 17: los documentos que narran el barrido escriben el patrón sin el literal) | corregido en la fase 5 (`CHANGELOG.md:211`, patrón con clase de carácter; K13, fricción del kit) |
