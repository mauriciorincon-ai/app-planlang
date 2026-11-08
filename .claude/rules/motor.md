---
paths:
  - "core/**"
  - "agents/**"
  - "plans/**"
  - "runs/**"
  - "data/**"
  - "scripts/**"
  - "tests/contrato/**"
  - "tests/unit/**"
---

# Patrones de dominio de planlang (motor, agentes, planes y corridas)

- **La arista se interpreta dos veces** (`core/playground/interprete.ts` · `agents/src/app_agents/reglas_arista.py`) y RF-09.2 las cruza sobre cada corrida versionada.
- **Huella dentro del archivo:** `huella = SHA-256(JCS(objeto sin "huella"))`, igual en Python y TS.
- **Corridas `planlang-trace/v1`** en `runs/<demo>/<corrida>/`, append-only; la vitrina muestra solo los derivados de `data/vitrina/` que declara `data/vitrina/manifiesto.json` (plan, corrida, línea base, informe, comparación, playground), verificados en build.
- **Proveedor de modelo** por `crear_modelo()` en `agents/src/app_agents/adaptador.py` (`ChatClaudeCode`; `ChatSimulado` en CI); **ningún modelo en la CI ni en la vitrina**.
- **Reloj inyectable** (`agents/src/app_agents/reloj.py`): el grafo mide latencias con él, nunca con `time`; `RelojFijo` en CI para que el exportador produzca los mismos bytes.
- **Reloj simulado y cola del auditor** (`core/plazos`, ADR-019): las llegadas salen de `sfc32` con la semilla del lote y son una capa con su huella; los casos y sus huellas no cambian. La capacidad vive en `simulacion_de_plazos`, fuera de `umbrales`, para no cambiar `mismaVerdad` ni invalidar la corrida de 200.
- **Beneficiarios finales** (nodo `beneficiarios` del B, ADR-019): suma por camino del producto de porcentajes, `BigInt` en TS y `Fraction` en Python, 25 % inclusivo; el gate de `tests/contrato/` lleva bordes con nombre y los textos hostiles de cada lado.
- **Plantillas de dominio como datos** (`data/dominios/*.json` 1.1.0: preguntas con ejemplo, umbrales y contrato; salud, financiero y seguridad de IA); el entrevistador M2 las recorre con `interrupt` por pregunta y **nunca aprueba** (`pnpm plan:aprobar` lo hace el usuario; las enmiendas `v1.x` del A van por el CLI de enmienda, como en el S9).
