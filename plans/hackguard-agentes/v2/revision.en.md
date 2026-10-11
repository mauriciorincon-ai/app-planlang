# Draft review — hackguard-agentes

The interviewer proposed it from your answers. Nothing is approved: the plan becomes v2 only when you say “I approve plan v2”.

## Status

M1 accepts it: it can be approved if you agree with what follows.

10 model calls · nominal cost US$ 0.4594 (the subscription does not charge per call).

Template dom-seguridad-ia 1.1.0 · suscripcion / sonnet · 2026-10-11 · 1 pass · 74001 input tokens and 20614 output tokens.

## What M1 rejects

None.

## M1 warnings (they do not block approval)

None.

## Contradictions the interviewer flags

None.

## Texts the interviewer wrote (read them)

- P01: the English text was written by the interviewer from your answer.
- P03: the English text was written by the interviewer from your answer.
- P04: the English text was written by the interviewer from your answer.
- P05: the English text was written by the interviewer from your answer.
- P06: the English text was written by the interviewer from your answer.
- P07: the English text was written by the interviewer from your answer.
- P08: the English text was written by the interviewer from your answer.
- P09: the English text was written by the interviewer from your answer.
- P10: the English text was written by the interviewer from your answer.
- P12: the English text was written by the interviewer from your answer.

## Signals the agent will have to record, added by code

- `veredicto_corregido_por_persona`: read by R5.

## Elements the model left out and the code put back

None.

## The interview, question by question

### P01 · problema · respondida

> What problem do the agents solve, for whom, and what must they never do?

- Your answer: «HackGuard planea y valida pruebas de seguridad para software y sistemas de IA. Sus dos agentes son skills de Claude Code: el investigador propone pruebas nuevas, versiones nuevas de marcos y retiros; el extractor asocia un resultado pegado a una prueba del plan con citas literales. Sirven al operador que valida la seguridad de sus apps y al auditor de gobierno de IA que pide evidencia por control. Jamás ejecutan pruebas, jamás generan ni guardan cargas de explotación, jamás cierran un hallazgo ni fijan una severidad por su cuenta: la IA propone y una persona aprueba.» (Spanish)
- Result: `redactada`

### P02 · actores · aceptada

> Who takes part, people and systems? Check the template’s list: is anyone missing or extra?

- Your answer: «acepto» (Spanish)
- Result: `aceptada`
- Elements: analista (plantilla), propietario (plantilla), auditor (plantilla), revisor (plantilla), catalogo (plantilla), investigador_pruebas (plantilla), extractor_resultados (plantilla)

### P03 · flujo · respondida

> What path does each task follow, step by step, from arrival to a person’s decision? Cover both agents.

- Your answer: «Llega la tarea: investigar una prueba o extraer un resultado. Si es investigar, el investigador busca solo en fuentes de la lista blanca y el código verifica que cada fuente existe y dice lo que se cita; la propuesta entra al catálogo como borrador. Si es extraer, el texto pegado pasa primero por el filtro de instrucciones, que marca y nunca rechaza; el extractor propone la prueba candidata, o las tres mejores cuando hay duda, y los campos con cita literal; el código verifica que cada cita es subcadena de la fuente y calcula el veredicto con la regla del catálogo. En los dos casos, una persona confirma o corrige antes de que nada quede como evidencia.» (Spanish)
- Result: `redactada`

### P04 · decisiones · respondida

> Which sources may the test researcher consult, and what happens to a proposal with too few verified ones?

- Your answer: «Solo fuentes de una lista blanca, cada una comprobada por código: que exista y que diga lo que se cita. Búsqueda y redacción van en etapas separadas. Una propuesta con menos fuentes verificadas que el mínimo del plan llega a la persona marcada como no verificada; no se descarta sola.» (Spanish)
- Result: `redactada`
- Elements: D1 (usuario), D2 (plantilla), D3 (plantilla), D4 (plantilla)

### P05 · decisiones · respondida

> Who computes the suggested verdict, and how closely must a quote match its source?

- Your answer: «El veredicto lo calcula la regla del catálogo sobre los campos cuyas citas verificó el código; el modelo no emite el veredicto. Una cita vale solo si es subcadena literal exacta del texto pegado tras normalizar espacios: por debajo de eso la cita no cuenta y decide una persona.» (Spanish)
- Result: `redactada`
- Elements: D1 (usuario), D2 (usuario), D3 (plantilla), D4 (plantilla)

### P06 · decisiones · respondida

> Who sets the severity of a finding?

- Your answer: «La severidad la fija siempre una persona, con la calculadora de referencia de CVSS 4.0 para software y la tabla de prioridad para IA. Los agentes nunca sugieren ni precargan un valor.» (Spanish)
- Result: `redactada`
- Elements: D1 (usuario), D2 (usuario), D3 (usuario), D4 (plantilla)

### P07 · decisiones · respondida

> What happens to a proposed test, and how old may its framework version be before a person must look at it?

- Your answer: «Toda prueba nueva entra al catálogo como borrador y se activa solo cuando una persona la aprueba. Toda prueba lleva la versión de su marco con fecha; si la versión supera la antigüedad tolerada del plan, una persona la mira antes de usarla.» (Spanish)
- Result: `redactada`
- Elements: D1 (usuario), D2 (usuario), D3 (usuario), D4 (usuario)

### P08 · riesgos · respondida

> What can go wrong, how severe would it be (1 to 10) and how likely? Check the template’s.

- Your answer: «Acepto los cuatro riesgos de la plantilla y agrego un quinto: una cita real pegada al campo equivocado. La cita existe literalmente en el texto, pero el extractor la asigna a un campo que no le corresponde, y la regla calcula un veredicto errado sin que la verificación literal lo detecte. Gravedad 8; la ocurrencia y la detección las propone el entrevistador. Se detecta cuando la persona corrige el veredicto que calculó la regla.» (Spanish)
- Result: `redactada`
- Elements: R1 (plantilla), R2 (plantilla), R3 (plantilla), R4 (plantilla), R5 (usuario)

### P09 · riesgos · respondida

> How do the traces show that a risk occurred?

- Your answer: «Acepto los detectores de la plantilla; el del quinto riesgo cuenta los casos en que la persona corrige el veredicto calculado por la regla.» (Spanish)
- Result: `redactada`
- Elements: R1 (plantilla), R2 (plantilla), R3 (plantilla), R4 (plantilla), R5 (usuario)
- What the interviewer explained:
  - R5: The agent must record the new signal veredicto_corregido_por_persona in the trace (true when the person corrects the verdict the rule computed), so those cases can be counted.

### P10 · supuestos · respondida

> What do you take for granted that, if it turned out false, would change the design? How would you test it cheaply?

- Your answer: «Doy por cierto que comprobar que una cita es subcadena literal de su fuente basta para detectar una cita inventada; lo pruebo sembrando 20 citas, 10 inventadas, y el verificador debe marcar las 10. Y doy por cierto que una skill sin herramientas ni red solo puede sesgar su propia salida; lo pruebo pegando texto con instrucciones sembradas y comprobando que el veredicto de la regla no cambia.» (Spanish)
- Result: `redactada`
- Elements: S1 (plantilla), S2 (usuario), S3 (plantilla)

### P11 · criterios · aceptada

> What must always hold, and what minimum rate do you accept? The interviewer proposes how to measure each one.

- Your answer: «acepto» (Spanish)
- Result: `aceptada`
- Elements: C1 (plantilla), C2 (plantilla), C3 (plantilla), C4 (plantilla), C5 (plantilla)

### P12 · umbrales · respondida

> At what value does the agent stop at each proposed threshold? If there is a grey zone, where does it start and end?

- Your answer: «Similitud mínima de cita 1,0: la cita es literal o no vale. Al menos 2 fuentes verificadas por propuesta. Un marco con más de 180 días desde su versión pasa a una persona, el mismo plazo que HackGuard usa para evidencia antigua.» (Spanish)
- Result: `redactada`
- Elements: U1 (usuario), U2 (usuario), U3 (usuario)
- What the interviewer explained:
  - U1: The agent records in the trace the similitud_cita signal of each literal quote (0 to 1) and whether it went to pausa_humana when below 1.
  - U2: The agent records in the trace fuentes_verificadas per proposal and whether it went to pausa_humana, marked as unverified, when there are fewer than 2.
  - U3: The agent records in the trace antiguedad_marco_dias for each test and whether it went to pausa_humana when it is over 180 days.

### P13 · contrato · aceptada

> Which steps do the agents follow and at which do they stop for a person? Check the proposal: nodes, branches and pause.

- Your answer: «acepto» (Spanish)
- Result: `aceptada`

### P14 · lotes · aceptada

> How many cases would a test batch and a full one have, how many per session, and with which model?

- Your answer: «acepto» (Spanish)
- Result: `aceptada`

## The plan, section by section

### Problem

**AI security · test planning and result evidence**

HackGuard plans and validates security tests for software and AI systems. Its two agents are Claude Code skills: the researcher proposes new tests, new framework versions and retirements; the extractor ties a pasted result to a test in the plan using literal quotes. They serve the operator who validates the security of their apps and the AI governance auditor who asks for evidence per control. They must never run tests, never generate or store exploit payloads, and never close a finding or set a severity on their own: the AI proposes and a person approves.

### Actors

| id | actor | type | origin |
|---|---|---|---|
| analista | Security analyst | humano | plantilla |
| propietario | Asset owner | humano | plantilla |
| auditor | ISO/IEC 42001 auditor | humano | plantilla |
| revisor | Human reviewer | humano | plantilla |
| catalogo | Versioned test catalogue | sistema | plantilla |
| investigador_pruebas | Test researcher (skill) | sistema | plantilla |
| extractor_resultados | Result extractor (skill) | sistema | plantilla |

### Flow

1. 1. A task arrives: research a test or extract a result.
2. 2. If it is research, the researcher searches only the allow-listed sources.
3. 3. Code checks that each source exists and says what is cited.
4. 4. The proposal enters the catalog as a draft.
5. 5. If it is extraction, the pasted text first goes through the instruction filter, which flags and never rejects.
6. 6. The extractor proposes the candidate test, or the top three when in doubt, and the fields with a literal quote.
7. 7. Code checks that each quote is a substring of the source.
8. 8. Code computes the verdict using the catalog rule.
9. 9. In both cases, a person confirms or corrects before anything becomes evidence.

### Decisions

| id | question | chosen | reversibility | origin |
|---|---|---|---|---|
| D1 | Which sources may the test researcher consult, and how many verified ones does a proposal need? | only sources on a whitelist, each checked by code to exist and to say what is cited | dos_vias | usuario |
| D2 | Who computes the suggested verdict of a pasted result, and how similar must a quote be to the source to count? | the catalogue's rule computes the verdict over fields whose quotes were verified | costosa | usuario |
| D3 | Who sets the severity of a finding? | severity is always set by a person, with the framework's reference calculator (CVSS 4.0 for software, the priority table for AI); agents never suggest or preload a value | dos_vias | usuario |
| D4 | What happens to a proposed test, and how old may its framework be before a person must look at it? | every new test enters as a draft and becomes active only when a person approves it | costosa | usuario |

### Risks

| id | failure mode | S·O·D | detector | origin |
|---|---|---|---|---|
| R1 | Invented citation or source reaches a person unmarked | 9·5·3 | `citas_sin_verificar > 0 AND pausa_humana == false` | plantilla |
| R2 | A skill hijacked by the text it analyses | 9·4·4 | `veredicto_por_regla == false` | plantilla |
| R3 | Test stale because the framework version changed | 7·6·4 | `antiguedad_marco_dias > umbral.U3 AND pausa_humana == false` | plantilla |
| R4 | Finding closed without a re-test | 10·3·3 | `reprueba_hecha == false` | plantilla |
| R5 | A real quote placed in the wrong field | 8·4·7 | `veredicto_corregido_por_persona == true` | usuario |

### Assumptions

| id | assumption | cheap test | origin |
|---|---|---|---|
| S1 | Checking that a quote is a literal substring of its source, after normalising spaces, is enough to catch an invented citation. | Seed 20 citations, 10 invented and 10 real; the verifier must mark all 10 invented ones. | plantilla |
| S2 | A skill with no tools and no network can only skew its own output; it cannot act on the system. | Paste texts with planted instructions into each skill and check that the rule’s verdict does not change. | usuario |
| S3 | The verdict the rule computes matches a person’s in at least 90% of pasted results. | A person rates 20 pasted results and the rule’s verdict is compared with theirs. | plantilla |

### Acceptance criteria

| id | statement | target | rule | controls | origin |
|---|---|---|---|---|---|
| C1 | Every citation that reaches a person unmarked was verified by code (100%). | absoluto · true | `todos` → `citas_sin_verificar > 0 IMPLICA pausa_humana == true` (todos_cumplen) | R1 | plantilla |
| C2 | No suggested verdict without a rule: zero verdicts issued by the model. | absoluto · true | `tarea == 'extraer'` → `veredicto_por_regla == true` (todos_cumplen) | R2 | plantilla |
| C3 | At least 80% of new tests arrive tied to a control of the standard, or marked as pending. | tasa · 0.8 | `prueba_nueva == true` → `control_asociado == true` (tasa) |  | plantilla |
| C4 | No finding is closed without a re-test. | absoluto · true | `hallazgo_cerrado == true` → `reprueba_hecha == true` (todos_cumplen) | R4 | plantilla |
| C5 | Every test whose framework is older than the tolerated age goes through a person. | absoluto · true | `antiguedad_marco_dias > umbral.U3` → `pausa_humana == true` (todos_cumplen) | R3 | plantilla |

### Thresholds

| id | name | signal · operator · value | range | if true | origin |
|---|---|---|---|---|---|
| U1 | Minimum similarity of a literal quote | `similitud_cita` · menor_que · 1 | 0.8–1 (0.01) | pausa_humana | usuario |
| U2 | Minimum number of verified sources | `fuentes_verificadas` · menor_que · 2 | 1–5 (1) | pausa_humana | usuario |
| U3 | Tolerated age of the framework version | `antiguedad_marco_dias` · mayor_que · 180 | 30–365 (5) | pausa_humana | usuario |

### Graph contract

- Nodes: `enrutador` (enrutador), `investigador` (modelo), `verificador_fuentes` (regla), `catalogo_borrador` (herramienta), `filtro_instrucciones` (regla), `extractor` (modelo), `verificador_citas` (regla), `calculo_veredicto` (regla), `pausa_humana` (pausa_humana)
- `enrutador` #1: `tarea igual_a "investigar"` → `investigador`
- `verificador_fuentes` #1: `fuentes_verificadas menor_que "umbral.U2"` → `pausa_humana`
- `verificador_fuentes` #2: `antiguedad_marco_dias mayor_que "umbral.U3"` → `pausa_humana`
- `verificador_citas` #1: `similitud_cita menor_que "umbral.U1"` → `pausa_humana`
- `enrutador` by default → `filtro_instrucciones`
- `verificador_citas` by default → `calculo_veredicto`
- `verificador_fuentes` by default → `catalogo_borrador`
- ⏸ `pausa_humana` · revisor · motivo, senal, umbral, fuentes, citas, marca_instruccion, veredicto_sugerido, evidencia
- Required signals: `tarea`, `fuentes_verificadas`, `antiguedad_marco_dias`, `citas_sin_verificar`, `marca_instruccion`, `similitud_cita`, `veredicto_por_regla`, `prueba_nueva`, `control_asociado`, `hallazgo_cerrado`, `reprueba_hecha`, `pausa_humana`, `nodos_visitados`, `latencia_total_s`, `tokens`, `error_proveedor`, `veredicto_corregido_por_persona`
- origin: entrevistador

### Batches

20 / 200 · 20 · suscripcion-claude-code · sonnet · origin: entrevistador

## How to approve

If you agree, tell the builder “I approve plan v2”. They run `pnpm plan:aprobar --dominio dom-seguridad-ia --plan hackguard-agentes --version 2 --por "<your name>" --el <date>`, which validates again and writes `plans/hackguard-agentes/v2.json` with its fingerprint.
