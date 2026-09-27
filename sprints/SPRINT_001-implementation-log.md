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
| 3 · Demo A en LangGraph                      | ✅ construida, pendiente de «continúa» | 2026-09-27 |
| 4 · Verificador y validación del instrumento | ⏳                                     |            |
| 5 · Cierre                                   | ⏳                                     |            |

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
| Job `python` de CI (gate heredado, primera dependencia de este sprint) | PR desechable `demo-rojo/s1-python` con `test_demo_rojo.py` (`assert 1 == 2`) | ver tabla de CI abajo (se completa al llegar el resultado)                                                         |
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

## Desviación del plan

1. **Carnada C03 del contrato `instrumentos-de-plan` v0.1.0** (se aplica en la fase 1): la tabla de prioridad de acción AIAG-VDA 2019 da `baja` para S8·O3·D4, no `alta`. Enmienda propuesta en el summary: C03 → S8·O6·D2 (`alta`, RPN 96) y C03-bis → S8·O3·D4 (`baja`, RPN 96). Fuente secundaria verificada 2026-09-26 (Relyence, tabla AP); la primaria (handbook) no es accesible por curl.
2. **`pass^3` de C5** con una sola corrida real en este sprint: el informe declara `k_observado = 1 de 3 · incompleto`; las corridas 2 y 3 se acumulan en background.
3. **Arista «modo Texas»** del plan v0 no cabe en la tripleta: se declara como función nombrada `texas_y_no_aprobar(modo_texas, propuesta)` (regla 2).
4. **Aristas del nodo `decision`** necesitan `orden` y `rama_por_defecto`; el plan v0 no lo declara.
5. Otras correcciones del plan v0 que el validador exija: se anotan en la fase 1 (10 correcciones; confirmadas por el usuario con el «continúa» de la fase 1).
6. **Hallazgos de coherencia del plan v1** (fase 2): exentos contra C4/R6, semántica de U3 y medida de S2, población de C3 en urgencias. **Resuelto el primero con el plan v1.1** (aprobado por el usuario, fase 3); U3 implementado como «hasta U3 aclaraciones usando todas las respuestas»; S2 y C3 van al verificador (fase 4).
7. **Regla 6 (`--max-turns 1`) y `--json-schema`** (fase 3): `error_max_turns` en 3/46 llamadas del multiagente y 9/16 de la línea base; se reintenta (ADR-004). Propuesta a la planeadora: `--max-turns 2` solo con `--json-schema`.

## Registro de miradas

No aplica en este sprint (sin artefacto visual). La guía de prueba nace en la fase 5 como archivo del repo.

## Bugs y fricciones

| Fecha      | Qué                                                         | Causa                                                                           | Resolución                    |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| 2026-09-27 | `.gitignore` no ignoraba el egg-info tras K2                | comentario en la misma línea que el patrón                                      | comentario en su propia línea |
| 2026-09-27 | gitleaks bloqueó el commit de la fase 0                     | falso positivo `generic-api-key` sobre un id de modelo junto a la palabra «API» | constantes renombradas (K12)  |
| 2026-09-27 | GitHub API `i/o timeout` intermitente al mergear Dependabot | red                                                                             | reintento                     |
| 2026-09-27 | El barrido de cero enlaces encuentra `CHANGELOG.md:211` | el changelog del kit estampado cita el literal del dominio de Pages al narrar el patrón (regla 17: los documentos que narran el barrido escriben el patrón sin el literal) | se corrige en el `/deploy-check` de la fase 5 (K13, fricción del kit) |
