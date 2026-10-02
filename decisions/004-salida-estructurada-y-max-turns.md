# ADR-004 — Salida estructurada con `--max-turns 1`: `error_max_turns` se clasifica y se reintenta

**Summary (EN):** With `--json-schema` the CLI may stop with `error_max_turns`; the adapter classifies it as `esquema_invalido` and retries within §9.1 (one try plus two retries), declaring the retries and their cost in the trace. Amended in S2: rule 6 now gives `--max-turns 2` only when `--json-schema` is present, and 1 otherwise; measured over 466 calls of the S2 200-case run, 0 schema retries.

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
4. `--max-turns 1` NO cambia: cambiarlo es cambiar la regla 6 (planeadora, G-Metodo). *(Superado por la enmienda del S2, abajo.)*

## Consecuencias

- Resultado tras el arreglo, mismo lote: multiagente 20/20 sin errores (3 reintentos); línea base 20/20
  sin errores (9 reintentos). Las corridas hechas con el adaptador defectuoso se descartaron; sus
  cifras y su causa quedan en la bitácora del S1.
- **Con el plan v1.2 el reintento no bastó siempre** (adenda 2026-09-27, auditoría S1): la línea base
  agotó los 2 reintentos en A-012 (`esquema_invalido`, el caso quedó sin decisión) y la repetición r2
  usó los dos en A-006. El reintento mitiga el modo de falla, no lo elimina; el informe v1.2 lo reporta
  (§ 5 brechas no previstas, § 6 S3).
- **Propuesta a la planeadora (summary):** evaluar `--max-turns 2` solo cuando va `--json-schema`,
  medido contra el costo de los reintentos. Hasta entonces, el reintento es el mecanismo.
- Tests: `test_adaptador_flags.py` (rc = 1 con `error_max_turns` en stdout, reintento declarado, tres
  fallas seguidas con su costo, «otro» sin reintento). Demo en rojo: volver ciego el adaptador al JSON
  de stdout pone tres tests en rojo.

## Enmienda S2 (2026-09-28) — `--max-turns 2` únicamente con `--json-schema`

- **Origen:** la planeadora cambió la regla 6 al cerrar el S1 (estándar 7-S v2.16.0), a partir de la medición de
  este ADR: con un solo turno el CLI cortaba entre el 6 % y el 56 % de las llamadas estructuradas. La constitución
  se sincronizó en la fase 0 del S2.
- **Implementación:** `turnos_maximos(json_schema)` en `agents/src/app_agents/adaptador.py` devuelve 2 con esquema y
  1 sin él. No es un parámetro: la regla fija el número, no quien llama. `test_adaptador_flags.py` compara la línea
  de comando literal en los dos casos (demo en rojo: devolver siempre 1).
- **Humo real 3/3** con la suscripción el 2026-09-28, ya con 2 turnos.
- **Clasificación y reintentos:** sin cambios. Un `error_max_turns` con esquema sigue siendo `esquema_invalido`
  y se reintenta; con 2 turnos se espera que sea raro.
- **Medido (2026-10-01/02, corridas de fondo de la fase 4 del S2):** en `runs/demo-a/suscripcion-planlang-a-001-200-v1.4`
  (plan v1.4, 200 casos, 10 sesiones, CLI 2.1.282, `sonnet`) hubo **466 llamadas al modelo y 0 reintentos de esquema**:
  ningún `error_max_turns` ni otra salida inválida, y ningún paso con error del proveedor. Con un turno el S1 había
  medido entre el 6 % y el 56 %. La parada 1 del ⭐ del S1 no se corrió (sigue diferida).
