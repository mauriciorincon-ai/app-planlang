# ADR-004 — Salida estructurada con `--max-turns 1`: `error_max_turns` se clasifica y se reintenta

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 «El contrato y la corrida»
**Cítese por tema:** «ADR de salida estructurada y max-turns».

## Contexto

La regla 6 de la constitución fija la invocación exacta del binario (`claude -p … --max-turns 1 …
--json-schema <esquema>`), y un test la compara literalmente. En la primera corrida real del lote de 20
(fase 3) aparecieron fallas que el adaptador clasificó como `otro`: 1 de 20 casos en el multiagente y
9 de 20 en la línea base de agente único. Al reproducirlas, el CLI salía con **código 1, stderr vacío
y la causa solo en el JSON de stdout**: `subtype: "error_max_turns"`, `num_turns: 2`. Con
`--json-schema`, el modelo a veces necesita un segundo turno para entregar la salida estructurada y
`--max-turns 1` lo corta. El adaptador solo leía stderr cuando el código de salida no era 0.

La frecuencia depende del tamaño del esquema: 3 de 46 llamadas en el multiagente (esquemas pequeños)
y 9 de 16 en la línea base (un esquema con extracción, propuesta y dos cartas).

## Decisión

1. Con código de salida ≠ 0, el adaptador lee también el JSON de stdout y clasifica por `subtype`.
2. `error_max_turns` **con** `--json-schema` es una salida estructurada que no llegó: se clasifica
   `esquema_invalido` y se reintenta dentro del tope de § 9.1 de la especificación (1 intento + 2
   reintentos). Sin esquema sigue siendo `otro`. El límite de uso en stderr sigue teniendo prioridad.
3. Los reintentos NO se esconden: cada paso de la traza lleva `reintentos_esquema`, y el costo nominal
   de los intentos fallidos se suma a su `costo_nominal_usd` (`costo_reintentos_usd` en los metadatos).
   Los tokens de los intentos fallidos no se suman (el CLI solo informa su costo): límite declarado.
4. `--max-turns 1` NO cambia: cambiarlo es cambiar la regla 6 (planeadora, G-Metodo).

## Consecuencias

- Resultado tras el arreglo, mismo lote: multiagente 20/20 sin errores (3 reintentos); línea base 20/20
  sin errores (9 reintentos). Las corridas hechas con el adaptador defectuoso se descartaron; sus
  cifras y su causa quedan en la bitácora del S1.
- **Propuesta a la planeadora (summary):** evaluar `--max-turns 2` solo cuando va `--json-schema`,
  medido contra el costo de los reintentos. Hasta entonces, el reintento es el mecanismo.
- Tests: `test_adaptador_flags.py` (rc = 1 con `error_max_turns` en stdout, reintento declarado, tres
  fallas seguidas con su costo, «otro» sin reintento). Demo en rojo: volver ciego el adaptador al JSON
  de stdout pone tres tests en rojo.
