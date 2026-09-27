# ADR-003 — Pines de Python para `agents/` (LangChain 1.x, LangGraph 1.x, LangSmith SDK, canonicalización)

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
