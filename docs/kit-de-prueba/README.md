# Kit de prueba · Test kit — planlang S1

> Simulación · no operativo · Simulation · not operational. Todo es sintético · Everything is synthetic.

## Español

Lo que necesitas para probar el sprint 1 sin preparar nada: todo vive en el repo, con huella.

| Pieza | Dónde | Para qué |
|---|---|---|
| Plan vigente del demo A | `plans/demo-a/v1.2.json` | El contrato que el agente cumple y el verificador mide. `v1.json` y `v1.1.json` quedan como historia |
| Lote de 20 casos | `data/casos/demo-a/planlang-a-001-20.json` | El lote de las corridas reales (12 normales, 3 de borde, 3 incompletos, 2 adversarios). También hay de 3 (humo) y de 200 |
| Afirmación de privacidad | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Por qué ningún dato puede ser de una persona real |
| Informe del plan v1.2 | `runs/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.es.md` · `.en.md` | El informe de brecha vigente: corrida multiagente, su línea base de agente único (`…-v1.2-base`) y dos repeticiones (`…-v1.2-r2`, `…-v1.2-r3`) |
| Informe del plan v1.1 | `runs/demo-a/suscripcion-planlang-a-001-20/informe.es.md` · `.en.md` | El primer informe real, conservado como historia: con él se encontraron los defectos de medición que corrigió la v1.2 |
| Informe de la corrida simulada | `tests/golden/demo-a/simulado-3casos/` | El que la CI regenera y compara byte a byte en cada cambio |
| Brechas sembradas (M9) | `M9-brechas-sembradas.md` (esta carpeta) | 10 fallas plantadas a propósito y quién las detecta |
| Planes con errores | `tests/fixtures/planes-sembrados/` | 12 planes que el validador debe rechazar, cada uno con su motivo en `manifiesto.json` |
| Carnadas de identificadores | `tests/fixtures/identificadores/carnadas.json` | Una cédula real, un NIT con dígito válido y un SSN: el validador debe ponerlos en rojo |

**Reproducir el informe vigente:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2`
(dos ejecuciones dan la misma huella). **Verificar todo lo guardado:** `pnpm trazas:verificar`.

## English

What you need to test sprint 1 without preparing anything: it all lives in the repo, fingerprinted.

| Piece | Where | What for |
|---|---|---|
| Demo A's current plan | `plans/demo-a/v1.2.json` | The contract the agent follows and the verifier measures. `v1.json` and `v1.1.json` stay as history |
| 20-case batch | `data/casos/demo-a/planlang-a-001-20.json` | The batch of the real runs (12 normal, 3 edge, 3 incomplete, 2 adversarial). There are also 3-case (smoke) and 200-case batches |
| Privacy statement | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Why no piece of data can belong to a real person |
| Plan v1.2 report | `runs/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.en.md` · `.es.md` | The current gap report: multi-agent run, its single-agent baseline (`…-v1.2-base`) and two repetitions (`…-v1.2-r2`, `…-v1.2-r3`) |
| Plan v1.1 report | `runs/demo-a/suscripcion-planlang-a-001-20/informe.en.md` · `.es.md` | The first real report, kept as history: it found the measurement defects that v1.2 fixed |
| Simulated run report | `tests/golden/demo-a/simulado-3casos/` | The one CI regenerates and compares byte for byte on every change |
| Seeded gaps (M9) | `M9-brechas-sembradas.md` (this folder) | 10 failures planted on purpose and who detects them |
| Plans with errors | `tests/fixtures/planes-sembrados/` | 12 plans the validator must reject, each with its reason in `manifiesto.json` |
| Identifier baits | `tests/fixtures/identificadores/carnadas.json` | A real-format national ID, a tax ID with a valid check digit and an SSN: the validator must flag them |

**Reproduce the current report:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2`
(two runs give the same fingerprint). **Check everything stored:** `pnpm trazas:verificar`.
