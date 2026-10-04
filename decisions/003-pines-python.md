# ADR-003 — Pines de Python para `agents/` (LangChain 1.x, LangGraph 1.x, LangSmith SDK, canonicalización)

**Summary (EN):** Python pins for `agents/`: langchain >=1.4,<2 · langgraph >=1.2,<1.3 · langchain-core <2 · langsmith <1 · langgraph-checkpoint-sqlite >=3.1,<4 · pydantic >=2,<3 · rfc8785 >=0.1,<1. Pins move only by ADR inside a sprint (there is no Dependabot for pip). Addendum 2026-10-01 (S2, M-12): `agents/constraints.txt` locks the exact versions of the validated venv; CI installs with `-c constraints.txt` and a test checks the installed environment is the lock. Addendum 2026-10-02 (S2, AU-S2-B9): the JCS NFC step stays; a test requires every versioned JSON string to be NFC already and free of lone surrogates, so the engine's Unicode version cannot move a fingerprint.

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 «El contrato y la corrida»
**Cítese por tema:** «ADR de pines de Python».

## Contexto

El estampado del kit (perfil `--python`, v1.30.1) deja `agents/pyproject.toml` sin dependencias a
propósito: las librerías de agentes y el proveedor de modelo entran por ADR en el sprint que los
activa (regla 16 de la constitución; paridad con `ai`/`@ai-sdk` del perfil web). No hay Dependabot
`pip` (regla 18: techo de dos PRs), así que **los pines suben solo por ADR en sprint**.

La investigación técnica de la F1 (`investigacion/2026-09-26-tecnica.md` § 1, verificada con curl
el 2026-09-26) fijó las versiones vigentes y el intérprete: LangGraph declara hasta 3.13, el spike
corrió en 3.14 sin fallas, y la casa pide 3.12 en CI.

## Decisión

| Paquete                       | Pin          | Por qué                                                                                                                      |
| ----------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `langchain`                   | `>=1.4,<2`   | API 1.x estable (`create_agent`, `@tool`, salida estructurada); el 2.x cambiaría contratos                                   |
| `langgraph`                   | `>=1.2,<1.3` | pin transitivo de `langchain` 1.4; `add_conditional_edges` con `path_map`, `interrupt`, `Command`                            |
| `langchain-core`              | `<2`         | `BaseChatModel` 1.6.x: `_generate` + `_llm_type` obligatorios; `with_structured_output` sobrescribible                       |
| `langsmith`                   | `<1`         | SDK 0.14.x del espejo de observabilidad (solo activo con `LANGSMITH_API_KEY` en el entorno)                                  |
| `langgraph-checkpoint-sqlite` | `>=3.1,<4`   | `SqliteSaver` para corridas; `InMemorySaver` en tests                                                                        |
| `pydantic`                    | `>=2,<3`     | esquemas de salida estructurada (`--json-schema` ↔ `model_json_schema()`)                                                    |
| `rfc8785`                     | `>=0.1,<1`   | JSON Canonicalization Scheme puro Python (Trail of Bits) para que la huella que emite Python sea la que recalcula TypeScript |

Extras opcionales (no se instalan en CI): `anthropic = ["langchain-anthropic>=1,<2"]`,
`groq = ["langchain-groq>=1,<2"]` — el interruptor del ADR de proveedor y cumplimiento.

Versiones instaladas el 2026-09-27 (Python 3.12.14): langchain 1.4.2 · langgraph 1.2.12 ·
langchain-core 1.6.x · langsmith 0.14.1 · pydantic 2.13.5 · rfc8785 0.1.4. `pip-audit --skip-editable`
limpio.

## Consecuencias

- **Python 3.12** en CI y en el venv local (K1 del S1: el venv del estampado había quedado en 3.14 y se
  reconstruyó). `requires-python = ">=3.12,<3.15"` se mantiene para no bloquear el local.
- Subir cualquier pin exige un ADR nuevo en sprint con la re-lectura del CHANGELOG de la librería.
- `pip-audit` corre en cada PR con `--skip-editable` (kit v1.30.1; con `--strict` el paquete editable
  hace caer el job — la constitución regla 16 todavía dice `--strict`: fricción de documentación K4).

## Adenda 2026-10-01 (S2, deuda M-12 de la auditoría del S1)

**Problema.** Los rangos del `pyproject.toml` dicen qué se admite, no qué se instala: la CI resolvía en cada
corrida lo último dentro de los rangos, y `grafo.json` depende de la forma interna de `get_graph().to_json()`
(P-13). Dos corridas con el mismo código podían dar grafos distintos sin que nada lo dijera.

**Decisión.**
- `agents/constraints.txt` fija las versiones exactas del venv validado (Python 3.12.14), sacadas con
  `pip freeze --exclude-editable`. Las seis corridas reales del S1 registraron en su `entorno.json` las mismas
  langchain 1.4.2, langchain-core 1.6.5, langgraph 1.2.12, langsmith 0.14.1 y pydantic 2.13.5.
- La CI instala con `pip install -e ".[dev]" -c constraints.txt`, y el lock entra en la llave de la caché.
- `agents/tests/test_constraints.py` comprueba dos cosas: que cada dependencia directa del `pyproject` (con las
  de `dev`) está en el lock dentro de su rango, y que el entorno instalado es el lock, paquete por paquete. Si
  alguien quita el `-c` de la CI, o sube un paquete sin regenerar el lock, la prueba nombra la diferencia.
- Los extras `anthropic` y `groq` (el interruptor) no entran al lock porque no se instalan en CI. Si se activan,
  se instalan sobre el venv del lock y el ADR que los active fija su versión.

**Para subir algo:** ADR en sprint, venv nuevo validado (pytest y corrida simulada) y el `pip freeze` pegado
debajo del encabezado del lock, sin tocarlo a mano. Demo en rojo en la bitácora del S2 («M-12»).

## Adenda 2026-10-02 (S2, AU-S2-B9 de la auditoría del S2): el NFC del JCS entre motores

**Problema.** `core/formatos/jcs.ts` normaliza cada cadena y cada clave a NFC antes de serializar (M-13, igual que
`canonico.py`). `String.prototype.normalize` depende de la versión de Unicode que trae el motor: en teoría, un
carácter nuevo podría normalizarse distinto en un navegador viejo y cambiar una huella. Y una cadena con un
sustituto suelto (`\uD800` sin pareja) pasa en TypeScript, mientras Python la rechaza al codificarla.

**Decisión.** Se mantiene la normalización (la semántica coincide con `canonico.py:57-67`) y se cierra el riesgo por
el lado de los datos: `tests/unit/guardias/texto-canonico.test.ts` recorre cada JSON versionado y exige que todo
texto ya esté en NFC y sin sustitutos sueltos. Así la normalización no cambia nada en lo publicado y la versión de
Unicode del motor no puede mover una huella. La única excepción es la carnada del contrato
(`tests/contrato/jcs-valores-tramposos.json`), que lleva texto sin normalizar a propósito para probar que las dos
orillas lo normalizan igual. Al cierre del S2 había 0 cadenas fuera de NFC en los JSON versionados.
