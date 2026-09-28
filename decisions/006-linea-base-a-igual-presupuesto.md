# ADR-006 — Línea base de agente único: qué significa «a igual presupuesto»

**Summary (EN):** "Same budget" for the single-agent baseline means a budget no larger than the multi-agent's, in model calls (retries included) and nominal cost; the verifier computes it and the report shows both columns. The S3 verdict (refuted on latency) is published as is; wording proposals go to the planning house.

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 «El contrato y la corrida»
**Cítese por tema:** «ADR de la línea base».
**Origen:** auditoría final del S1 (hallazgo M-10, `sprints/SPRINT_001-auditoria.md`).

## Contexto

La regla dura 10 exige que el enrutador multiagente sea una decisión `dos_vias` del plan con **línea base
de agente único a igual presupuesto**, medida en el informe. El supuesto S3 del plan del demo A lo declara
con `comparacion: "linea_base_agente_unico"` y `mismo_presupuesto: true`.

La línea base del S1 (`agents/src/app_agents/agente_unico.py`) hace **una** llamada al modelo por caso
(extrae y propone a la vez), seguida de las mismas reglas deterministas y la misma guardia; no tiene ciclo
de aclaración (un caso con campos faltantes va directo a la pausa humana). En las corridas reales:

| Corrida | Llamadas al modelo (con reintentos) | Costo nominal |
|---|---|---|
| v1.1 multiagente / línea base | 49 / 25 | US$ 0,69 / 0,59 |
| v1.2 multiagente / línea base | 47 / 23 | US$ 0,67 / 0,62 |

La línea base gasta **menos**, no lo mismo. La bitácora lo había reinterpretado como «a igual o menor
presupuesto» sin dejarlo decidido en ningún lado.

## Decisión

1. **Definición operativa:** «a igual presupuesto» significa que la línea base **no gasta más** que el
   multiagente sobre el mismo lote, medido en llamadas al modelo (contando reintentos) y en costo nominal.
   El verificador lo calcula (`presupuesto_respetado` en `core/brecha/supuestos.ts`) y el informe muestra
   las dos columnas; si la base gastara más, el informe lo dice como limitación de S3.
2. **Lo que esa definición implica, dicho en voz alta:** con menos presupuesto y sin ciclo de aclaración,
   la línea base tiene menos capacidad en los casos con faltantes (A-008 y A-020 difieren en v1.1 y v1.2).
   La comparación de exactitud favorece al multiagente por diseño en esos casos; la de latencia, a la línea
   base. El informe publica ambas y los casos que difieren.
3. **No se reescribe S3 a posteriori.** El veredicto v1.2 (S3 refutado por latencia) se publica tal cual.

## Propuestas (a la planeadora, vía el summary)

- **A (texto del plan):** que S3 diga «a igual o menor presupuesto» o declare una tolerancia explícita
  (p. ej. latencia mediana ≤ la de la base + X s), en una v1.3 del plan con gate del usuario.
- **B (S2, código):** dar a la línea base un ciclo de re-extracción hasta U3 con su nodo único, para que
  la comparación sea a capacidad igual y no solo a presupuesto no mayor.

## Consecuencias

- El informe sigue calculando y mostrando el presupuesto de las dos variantes y los casos que difieren.
- La regla por defecto con que el verificador decide S3 («no peor» en exactitud y latencia mediana,
  tolerancia cero) queda escrita en el motivo del informe (auditoría S1, M-6).
