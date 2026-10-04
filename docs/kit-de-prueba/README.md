# Kit de prueba · Test kit — planlang S2

> Simulación · no operativo · Simulation · not operational. Todo es sintético · Everything is synthetic.

## Español

Lo que necesitas para probar los sprints 1 y 2 sin preparar nada: todo vive en el repo, con huella.

| Pieza | Dónde | Para qué |
|---|---|---|
| Planes del demo A | `plans/demo-a/v1.3.json` · `v1.4.json` | La v1.3 es la que publica la vitrina (mide la corrida de la v1.2 con la misma verdad, ADR-005); la v1.4 suma el respaldo «sin proveedor, a una persona» y es la del lote de 200. `v1.json` a `v1.2.json` quedan como historia |
| Lotes de casos | `data/casos/demo-a/planlang-a-001-20.json` · `planlang-a-001-200.json` | El de 20 es el de las corridas que publica la vitrina (12 normales, 3 de borde, 3 incompletos, 2 adversarios); el de 200, el de la corrida de fondo. También hay uno de 3 (humo) |
| Afirmación de privacidad | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Por qué ningún dato puede ser de una persona real |
| Informe que publica la vitrina | `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.es.md` · `.en.md` | El de la pantalla Brecha: la corrida multiagente de 20 casos medida con el plan v1.3, su línea base de agente único (`…-v1.2-base`) y dos repeticiones (`…-v1.2-r2`, `…-v1.2-r3`) |
| Informe del lote de 200 | `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/informe.es.md` · `.en.md` | La corrida de fondo con el plan v1.4: 200 casos en sesiones de 20 |
| Informe del respaldo sin proveedor | `runs/demo-a/simulado-v1.4-respaldo/informe.es.md` · `.en.md` | Corrida simulada de 8 casos con tres fallas del proveedor inyectadas (A-001, A-004, A-008): esos casos van a una persona, y el informe publica el riesgo R9 y el veredicto «no cumple» |
| Informe del plan v1.2 | `runs/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.es.md` · `.en.md` | La misma corrida medida con el plan con que corrió, conservada como historia |
| Informe del plan v1.1 | `runs/demo-a/suscripcion-planlang-a-001-20/informe.es.md` · `.en.md` | El primer informe real, conservado como historia: con él se encontraron los defectos de medición que corrigió la v1.2 |
| Informe de la corrida simulada | `tests/golden/demo-a/simulado-3casos/` | El que la CI regenera y compara byte a byte en cada cambio |
| Brechas sembradas (M9) | `M9-brechas-sembradas.md` (esta carpeta) | 10 fallas plantadas a propósito y quién las detecta |
| Planes con errores | `tests/fixtures/planes-sembrados/` | 12 planes que el validador debe rechazar, cada uno con su motivo en `manifiesto.json` |
| Carnadas de identificadores | `tests/fixtures/identificadores/carnadas.json` | Una cédula real, un NIT con dígito válido y un SSN: el validador debe ponerlos en rojo |

**Reproducir el informe de la vitrina:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2 --plan plans/demo-a/v1.3.json --salida <carpeta>`
(dos ejecuciones dan la misma huella, la que declara `data/vitrina/manifiesto.json`). **Verificar todo lo guardado:** `pnpm trazas:verificar`.

## English

What you need to test sprints 1 and 2 without preparing anything: it all lives in the repo, fingerprinted.

| Piece | Where | What for |
|---|---|---|
| Demo A's plans | `plans/demo-a/v1.3.json` · `v1.4.json` | v1.3 is the one the showcase publishes (it measures the v1.2 run with the same truth, ADR-005); v1.4 adds the “no provider, to a person” fallback and is the 200-case batch's. `v1.json` to `v1.2.json` stay as history |
| Case batches | `data/casos/demo-a/planlang-a-001-20.json` · `planlang-a-001-200.json` | The 20-case one is the batch of the runs the showcase publishes (12 normal, 3 edge, 3 incomplete, 2 adversarial); the 200-case one, the background run's. There is also a 3-case (smoke) batch |
| Privacy statement | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Why no piece of data can belong to a real person |
| Report the showcase publishes | `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.en.md` · `.es.md` | The Gap screen's: the 20-case multi-agent run measured with plan v1.3, its single-agent baseline (`…-v1.2-base`) and two repetitions (`…-v1.2-r2`, `…-v1.2-r3`) |
| 200-case batch report | `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/informe.en.md` · `.es.md` | The background run with plan v1.4: 200 cases in sessions of 20 |
| No-provider fallback report | `runs/demo-a/simulado-v1.4-respaldo/informe.en.md` · `.es.md` | A simulated 8-case run with three injected provider failures (A-001, A-004, A-008): those cases go to a person, and the report publishes risk R9 and the “not met” verdict |
| Plan v1.2 report | `runs/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.en.md` · `.es.md` | The same run measured with the plan it ran with, kept as history |
| Plan v1.1 report | `runs/demo-a/suscripcion-planlang-a-001-20/informe.en.md` · `.es.md` | The first real report, kept as history: it found the measurement defects that v1.2 fixed |
| Simulated run report | `tests/golden/demo-a/simulado-3casos/` | The one CI regenerates and compares byte for byte on every change |
| Seeded gaps (M9) | `M9-brechas-sembradas.md` (this folder) | 10 failures planted on purpose and who detects them |
| Plans with errors | `tests/fixtures/planes-sembrados/` | 12 plans the validator must reject, each with its reason in `manifiesto.json` |
| Identifier baits | `tests/fixtures/identificadores/carnadas.json` | A real-format national ID, a tax ID with a valid check digit and an SSN: the validator must flag them |

**Reproduce the showcase report:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2 --plan plans/demo-a/v1.3.json --salida <folder>`
(two runs give the same fingerprint, the one `data/vitrina/manifiesto.json` declares). **Check everything stored:** `pnpm trazas:verificar`.
