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
| 0 · Setup y precondiciones                   | ✅ construida, pendiente de «continúa» | 2026-09-27 |
| 1 · El plan como contrato                    | ⏳                                     |            |
| 2 · Casos sintéticos                         | ⏳                                     |            |
| 3 · Demo A en LangGraph                      | ⏳                                     |            |
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

## Desviación del plan

1. **Carnada C03 del contrato `instrumentos-de-plan` v0.1.0** (se aplica en la fase 1): la tabla de prioridad de acción AIAG-VDA 2019 da `baja` para S8·O3·D4, no `alta`. Enmienda propuesta en el summary: C03 → S8·O6·D2 (`alta`, RPN 96) y C03-bis → S8·O3·D4 (`baja`, RPN 96). Fuente secundaria verificada 2026-09-26 (Relyence, tabla AP); la primaria (handbook) no es accesible por curl.
2. **`pass^3` de C5** con una sola corrida real en este sprint: el informe declara `k_observado = 1 de 3 · incompleto`; las corridas 2 y 3 se acumulan en background.
3. **Arista «modo Texas»** del plan v0 no cabe en la tripleta: se declara como función nombrada `texas_y_no_aprobar(modo_texas, propuesta)` (regla 2).
4. **Aristas del nodo `decision`** necesitan `orden` y `rama_por_defecto`; el plan v0 no lo declara.
5. Otras correcciones del plan v0 que el validador exija: se anotan en la fase 1.

## Registro de miradas

No aplica en este sprint (sin artefacto visual). La guía de prueba nace en la fase 5 como archivo del repo.

## Bugs y fricciones

| Fecha      | Qué                                                         | Causa                                                                           | Resolución                    |
| ---------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| 2026-09-27 | `.gitignore` no ignoraba el egg-info tras K2                | comentario en la misma línea que el patrón                                      | comentario en su propia línea |
| 2026-09-27 | gitleaks bloqueó el commit de la fase 0                     | falso positivo `generic-api-key` sobre un id de modelo junto a la palabra «API» | constantes renombradas (K12)  |
| 2026-09-27 | GitHub API `i/o timeout` intermitente al mergear Dependabot | red                                                                             | reintento                     |
