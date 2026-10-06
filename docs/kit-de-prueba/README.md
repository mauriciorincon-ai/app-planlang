# Kit de prueba · Test kit — planlang S3

> Simulación · no operativo · Simulation · not operational. Todo es sintético · Everything is synthetic.

## Español

Lo que necesitas para probar los sprints 1 a 3 sin preparar nada: todo vive en el repo, con huella.

### Demo A · autorizaciones médicas

| Pieza | Dónde | Para qué |
|---|---|---|
| Planes | `plans/demo-a/v1.5.json` · `v1.5.1.json` | La corrida de 200 que publica la vitrina corrió con la v1.5: suma la aprobación en parte (el costo sobre el tope del plan de beneficios) y manda a una persona el caso con una instrucción escondida. La v1.5.1 solo corrige la redacción de S1, S3 y el problema, tiene la misma verdad y es con la que la vitrina la mide. `v1.json` a `v1.4.json` quedan como historia |
| Lotes de casos | `data/casos/demo-a/planlang-a-002-200.json` | El de la corrida que publica la vitrina (200 casos, con nueve sobre el tope). Quedan como historia los de 20 y 200 del lote `planlang-a-001` y uno de 3 (humo) |
| Plan de beneficios | `data/plan-beneficios/demo-a.json` | El mundo del A: 40 procedimientos, exentos, exclusiones con causal y topes de cobertura |
| Afirmación de privacidad | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Por qué ningún dato puede ser de una persona real |
| Informe que publica la vitrina | `data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5/informe.es.md` · `.en.md` | El de la pantalla Brecha: la corrida multiagente de 200 casos con el plan v1.5 y su línea base de agente único (`…-v1.5-base`) |
| Informes del S2 | `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/` · `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/` | La corrida de 20 que publicaba la vitrina del S2 y la de 200 del plan v1.4, conservadas como historia |
| Informe del respaldo sin proveedor | `runs/demo-a/simulado-v1.4-respaldo/informe.es.md` · `.en.md` | Corrida simulada de 8 casos con tres fallas del proveedor inyectadas: esos casos van a una persona y el informe publica el riesgo R9 |

### Demo B · vinculación con debida diligencia

| Pieza | Dónde | Para qué |
|---|---|---|
| La entrevista | `plans/demo-b/transcripcion.json` · `respuestas-por-delegacion.json` · `revision.es.md` | Lo que preguntó el entrevistador, lo que se respondió y la revisión del borrador (contradicciones y pendientes) |
| Planes | `plans/demo-b/v1.json` · `v1.1.json` | La v1 es la aprobada por el autor; la v1.1 solo cambia cómo se mide y redacta en inglés lo que faltaba (`v1.1-ingles.md`) |
| Listas sintéticas | `data/listas/demo-b.json` | Listas vinculantes y de consulta, con versión y fecha |
| Lotes de casos | `data/casos/demo-b/planlang-b-001-20.json` · `planlang-b-001-200.json` | El de 20 es el de la corrida que publica la vitrina; también hay uno de 4 (humo) |
| Afirmación de privacidad | `data/casos/demo-b/AFIRMACION-DE-PRIVACIDAD.md` | Lo mismo que el A, más los nombres de las listas |
| Informe que publica la vitrina | `data/vitrina/demo-b/suscripcion-planlang-b-001-20/informe.es.md` · `.en.md` | El de la pantalla Brecha del B, medido con la v1.1, con su línea base corregida (`…-base-v2`) |
| El lote de 200 | `runs/demo-b/suscripcion-planlang-b-001-200-v1.1/informe.es.md` · `.en.md` | Registro: la vitrina sigue sobre la corrida de 20. Cumple con alertas: 6 de 6 criterios y ningún riesgo. Publica su falla: B-180, un caso de riesgo alto, salió aprobado solo porque el extractor leyó mal la jurisdicción de los fondos y el puntaje se calculó sobre ese dato |
| Un caso para el ⭐⭐ | B-010 | Un homónimo en la zona gris: pasa por el investigador y termina en su expediente. `pnpm lote:demo-b --caso B-010 …` lo corre solo |

### Lo que comparten

| Pieza | Dónde | Para qué |
|---|---|---|
| Informe de la corrida simulada | `tests/golden/demo-a/simulado-3casos/` | El que la CI regenera y compara byte a byte en cada cambio |
| Brechas sembradas (M9) | `M9-brechas-sembradas.md` (esta carpeta) | 10 fallas plantadas a propósito y quién las detecta |
| Planes con errores | `tests/fixtures/planes-sembrados/` | 12 planes que el validador debe rechazar, cada uno con su motivo en `manifiesto.json` |
| Carnadas de identificadores | `tests/fixtures/identificadores/carnadas.json` | Una cédula real, un NIT con dígito válido y un SSN: el validador debe ponerlos en rojo |
| La infraestructura | `docs/BLUEPRINT.html` | Qué sostiene la app, cuánto cuesta y qué ve quién sin sesión |

**Reproducir el informe de la vitrina del A:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-002-200-v1.5 --plan plans/demo-a/v1.5.1.json --base runs/demo-a/suscripcion-planlang-a-002-200-v1.5-base --salida <carpeta>`
(dos ejecuciones dan la misma huella, la que declara `data/vitrina/manifiesto.json`). **Verificar todo lo guardado:** `pnpm trazas:verificar`.

## English

What you need to test sprints 1 to 3 without preparing anything: it all lives in the repo, fingerprinted.

### Demo A · medical prior authorizations

| Piece | Where | What for |
|---|---|---|
| Plans | `plans/demo-a/v1.5.json` · `v1.5.1.json` | The 200-case run the showcase publishes ran with v1.5: it adds partial approval (cost above the benefits plan's cap) and sends a case with a hidden instruction to a person. v1.5.1 only fixes the wording of S1, S3 and the problem, has the same truth and is the one the showcase measures it with. `v1.json` to `v1.4.json` stay as history |
| Case batches | `data/casos/demo-a/planlang-a-002-200.json` | The batch of the run the showcase publishes (200 cases, nine of them above the cap). The 20 and 200-case `planlang-a-001` batches and a 3-case (smoke) one stay as history |
| Benefits plan | `data/plan-beneficios/demo-a.json` | Demo A's world: 40 procedures, exempt services, exclusions with a ground and coverage caps |
| Privacy statement | `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md` | Why no piece of data can belong to a real person |
| Report the showcase publishes | `data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5/informe.en.md` · `.es.md` | The Gap screen's: the 200-case multi-agent run with plan v1.5 and its single-agent baseline (`…-v1.5-base`) |
| S2 reports | `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/` · `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/` | The 20-case run the S2 showcase published and plan v1.4's 200-case run, kept as history |
| No-provider fallback report | `runs/demo-a/simulado-v1.4-respaldo/informe.en.md` · `.es.md` | A simulated 8-case run with three injected provider failures: those cases go to a person and the report publishes risk R9 |

### Demo B · onboarding with due diligence

| Piece | Where | What for |
|---|---|---|
| The interview | `plans/demo-b/transcripcion.json` · `respuestas-por-delegacion.json` · `revision.en.md` | What the interviewer asked, what was answered and the review of the draft (contradictions and pending items) |
| Plans | `plans/demo-b/v1.json` · `v1.1.json` | v1 is the one the author approved; v1.1 only changes how things are measured and writes in English what was missing (`v1.1-ingles.md`) |
| Synthetic lists | `data/listas/demo-b.json` | Binding and reference lists, with version and date |
| Case batches | `data/casos/demo-b/planlang-b-001-20.json` · `planlang-b-001-200.json` | The 20-case one is the batch of the run the showcase publishes; there is also a 4-case (smoke) one |
| Privacy statement | `data/casos/demo-b/AFIRMACION-DE-PRIVACIDAD.md` | The same as demo A's, plus the names on the lists |
| Report the showcase publishes | `data/vitrina/demo-b/suscripcion-planlang-b-001-20/informe.en.md` · `.es.md` | Demo B's Gap screen, measured with v1.1, with its corrected baseline (`…-base-v2`) |
| The 200-case batch | `runs/demo-b/suscripcion-planlang-b-001-200-v1.1/informe.en.md` · `.es.md` | A record: the showcase stays on the 20-case run. Met with alerts: 6 of 6 criteria and no risk occurred. It publishes its failure: B-180, a high-risk case, went out approved on its own because the extractor misread the funds' jurisdiction and the score was computed on that value |
| A case for the ⭐⭐ | B-010 | A namesake in the gray zone: it goes through the investigator and ends in its case file. `pnpm lote:demo-b --caso B-010 …` runs it alone |

### Shared

| Piece | Where | What for |
|---|---|---|
| Simulated run report | `tests/golden/demo-a/simulado-3casos/` | The one CI regenerates and compares byte for byte on every change |
| Seeded gaps (M9) | `M9-brechas-sembradas.md` (this folder) | 10 failures planted on purpose and who detects them |
| Plans with errors | `tests/fixtures/planes-sembrados/` | 12 plans the validator must reject, each with its reason in `manifiesto.json` |
| Identifier baits | `tests/fixtures/identificadores/carnadas.json` | A real-format national ID, a tax ID with a valid check digit and an SSN: the validator must flag them |
| The infrastructure | `docs/BLUEPRINT.html` | What holds the app up, what it costs and what anyone sees without a session |

**Reproduce demo A's showcase report:** `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-002-200-v1.5 --plan plans/demo-a/v1.5.1.json --base runs/demo-a/suscripcion-planlang-a-002-200-v1.5-base --salida <folder>`
(two runs give the same fingerprint, the one `data/vitrina/manifiesto.json` declares). **Check everything stored:** `pnpm trazas:verificar`.
