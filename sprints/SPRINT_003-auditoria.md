# Auditoría del Sprint 003 — planlang (Fase 1, solo lectura)

> `/audita-sprint`, kit v1.37.0. Dos auditores independientes que no construyeron el sprint (subagentes en solo
> lectura), sobre el diff `origin/main...HEAD` (HEAD `a1b1bbe`) y el export construido desde ese HEAD:
>
> - **Auditor 1:** alcance, calidad de código, herramientas y casillas 5–8. _(Pendiente al escribir esta versión.)_
> - **Auditor 2:** casilla 4, «¿qué frases caducaron?», por promesa aplazada, en todas las superficies y en `out/`.
>
> Fecha: 2026-10-05. Todos los hallazgos llevan `archivo:línea` y su ajuste ejecutable. La Fase 2 paga todos, incluso
> los bajos (memoria del usuario «auditoria-ajustar-todo»), solo tras la aprobación del usuario.

---

## Casilla 4 — «¿Qué frases caducaron?» (auditor 2)

**Veredicto: requiere ajustes.** 23 frases caducadas o falsas hoy: 9 Alto, 7 Medio y 7 Bajo.

La familia más grave es la F3. El S3 introdujo la **aprobación en parte**: el excedente se niega por regla (RB-08) y
sale **sin persona** cuando el modo Texas está apagado. La vitrina lo admite en A-006 («Decisión final: aprobar en
parte, sin persona»; «La parte no cubierta la decidió una regla del plan, sin revisión de una persona»). Sin embargo,
unas 18 frases publicadas siguen diciendo que «ninguna negación sale sin una persona», mientras el resto de la app usa
el criterio «toda negación, también la parcial».

### ALTO (lo lee un visitante en la vitrina o en lo que viaja a hoja-de-vida)

#### F1. Spike: «El sprint 3 las construyó todas»

- **Dónde:** `src/textos/agente.ts:2053-2054`. El parámetro `sprint` lo pasa `src/lib/vista/agente.ts:1088`. Se ve en
  `/es/agente` y `/en/agente`.
- **Texto actual:** «…las otras 5 aparecen con borde discontinuo y la marca «exigido». **El sprint 3 las construyó
  todas**: es el grafo de arriba.» / «…**Sprint 3 built them all**…»
- **Por qué es falso hoy:** `sprint` sale de `manifiesto.corrida.sprint`, que con la corrida de 200 vale 3, pero las 8
  piezas existen desde el S1 (la maqueta `docs/diseno/03-agente.html` dice «El sprint 1»). Además, «el grafo todavía no
  tiene» es una promesa aplazada sobre un grafo ya completo.
- **Ajuste:** quitar `sprint` de la plantilla y de la llamada de la línea 1088.
  - ES: `Así se ve lo que el plan exige y el grafo del spike no tenía. El spike del ${p.fecha} corrió con ${p.presentes} de las ${p.total} piezas y ${…} fuera del contrato; las otras ${p.ausentes} aparecen con borde discontinuo y la marca «exigido». El grafo de arriba, el de la corrida publicada, las tiene todas.`
  - EN: `This is what the plan requires and the spike's graph did not have. The ${p.fecha} spike ran with ${p.presentes} of the ${p.total} pieces and ${…} outside the contract; the other ${p.ausentes} appear with a dashed border and the “required” mark. The graph above, the published run's, has them all.`
- **Verificar:** tras `pnpm build`, `grep -c "las construyó todas" out/es/agente.html` y
  `grep -c "built them all" out/en/agente.html` dan 0.

#### F2. «las 16 señales de la traza» en las 48 páginas de caso del A y en el índice

- **Dónde:** `src/textos/caso.ts:71-72`.
- **Por qué es falso hoy:** el plan v1.5 exige 18 señales. La misma página A-006 lista «Las 18 señales que deja la
  traza», y la Brecha dice «18 señales obligatorias».
- **Ajuste:** quitar la cifra, como hace el B (`demo-b/caso.ts:23`).
  - ES: «…; al final, la ficha técnica y las señales de la traza.»
  - EN: «…; at the end, the technical record and the trace’s signals.»
- **Verificar:** `grep -rl "16 señales" out/es` y `grep -rl "16 signals" out/en` no devuelven nada.

#### F3. «Ninguna negación sin persona» frente a 9 negaciones parciales que salieron sin persona

- **Evidencia:**
  - en la corrida hay `('aprobar_parcial', pausa_humana=False): 9`;
  - la D2 del plan v1.5 dice «sin él sale sola»;
  - el aviso y el documento de A-006 y A-018 dicen «sin revisión de una persona».
- **Por qué es falso hoy:** la app define la aprobación en parte como negación parcial (C8: «Toda negación, también la
  parcial»), así que las frases sin calificar son falsas.
- **Canon del ajuste:** «negación completa» / «full denial», y nombrar la aprobación en parte donde se enumeran las
  salidas.

| #   | Archivo:línea (superficie)                                         | Reemplazo ES                                                                                                                                                                                                                                                                                                                                           | Reemplazo EN                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | `src/textos/entrada.ts:235-236` (Entrada, fila del A)              | «Un enrutador, un extractor, un verificador de cobertura por reglas y un redactor deciden aprobar, aprobar en parte, negar con causal o escalar a un auditor humano. Ninguna negación completa sale sin una persona.»                                                                                                                                  | «A router, an extractor, a rule-based coverage checker and a writer decide to approve, approve in part, deny with a stated ground, or escalate to a human auditor. No full denial goes out without a person.»                                                                                                                 |
| b   | `src/textos/fichas.ts:1069-1070` (export → funcionalidad demo-a)   | «…aprueban, aprueban en parte, niegan con causal o escalan a un auditor; ninguna negación completa sale sin una persona.»                                                                                                                                                                                                                              | «…approve, approve in part, deny with a stated cause or escalate to an auditor; no full denial goes out without a person.»                                                                                                                                                                                                    |
| c   | `fichas.ts:377-378` (tagline del agente A; ≤ 80)                   | «Aprueba del todo o en parte, niega o escala; nunca niega del todo solo.» (71)                                                                                                                                                                                                                                                                         | «Approves in full or in part, denies or escalates; never fully denies alone.» (75)                                                                                                                                                                                                                                            |
| d   | `fichas.ts:385-386` (intro del agente A)                           | «El agente lee la solicitud, pide lo que falta, aplica las reglas del plan de beneficios y aprueba lo que el plan permite, hasta el tope de cada servicio; toda negación completa y todo caso dudoso los pasa a un auditor con la evidencia y la contraevidencia, y responde al afiliado con un aviso de IA.» (299)                                    | «The agent reads the request, asks for what is missing, applies the benefit plan's rules and approves what the plan allows, up to each service's cap; every full denial and every doubtful case goes to an auditor with the evidence and the counter-evidence, and it answers the member with an AI notice.» (298)            |
| e   | `fichas.ts:389-390` (titular)                                      | «…y una persona revisa toda negación completa con el caso completo delante.»                                                                                                                                                                                                                                                                           | «…and a person reviews every full denial with the full case in front of them.»                                                                                                                                                                                                                                                |
| f   | `fichas.ts:485` y `488-489` (cifra «0 negaciones sin una persona») | etiqueta «negaciones completas sin una persona»; detalle «Criterio C1 del plan sobre ${n} casos: toda negación completa pasó por la pausa humana.»                                                                                                                                                                                                     | «full denials without a person»; «The plan's criterion C1 over ${n} cases: every full denial went through the human pause.»                                                                                                                                                                                                   |
| g   | `fichas.ts:541-542` (Pausa humana)                                 | «Un auditor ve el caso completo antes de negarlo del todo.»                                                                                                                                                                                                                                                                                            | «An auditor sees the full case before denying it outright.»                                                                                                                                                                                                                                                                   |
| h   | `fichas.ts:576-577` (Nunca)                                        | «Niega del todo sin que una persona lo revise.»                                                                                                                                                                                                                                                                                                        | «Fully denies without a person reviewing it.»                                                                                                                                                                                                                                                                                 |
| i   | `fichas.ts:763-764` (anotación del proceso)                        | «Ninguna negación completa sale sin el auditor; en esta demo, el auditor se simuló en lote.»                                                                                                                                                                                                                                                           | «No full denial goes out without the auditor; in this demo, the auditor was simulated in batch.»                                                                                                                                                                                                                              |
| j   | `src/textos/agente.ts:56-57` (Objetivo)                            | «Resolver solicitudes de autorización de procedimientos médicos: aprobar en segundos las que son claras, del todo o hasta el tope del servicio, y llevar a un auditor humano toda negación completa y todo caso dudoso. Nunca niega del todo por su cuenta, nunca revela datos del afiliado y nunca obedece instrucciones escondidas en la solicitud.» | «Resolve prior-authorization requests for medical procedures: approve the clear ones in seconds, in full or up to the service's cap, and bring every full denial and every doubtful case to a human auditor. It never fully denies on its own, never reveals member data and never obeys instructions hidden in the request.» |
| k   | `agente.ts:177-178` (Nunca)                                        | «Negar del todo sin que lo revise una persona»                                                                                                                                                                                                                                                                                                         | «Fully deny without a person reviewing it»                                                                                                                                                                                                                                                                                    |
| l   | `agente.ts:1516-1517` (decision · entrega)                         | «ninguna negación completa sale sin una persona»                                                                                                                                                                                                                                                                                                       | «no full denial goes out without a person»                                                                                                                                                                                                                                                                                    |
| m   | `agente.ts:1533-1534` (decision · se mide)                         | «Ninguna negación completa sin revisión humana (C1) y todo caso de alto costo pasa por una persona (C3).»                                                                                                                                                                                                                                              | «No full denial without human review (C1) and every high-cost case goes through a person (C3).»                                                                                                                                                                                                                               |
| n   | `agente.ts:1653-1654` (pausa_humana · se mide)                     | «Toda negación completa pasa por aquí (C1), también la parcial con el modo Texas (C10), y el auditor ve el caso completo, con evidencia y contraevidencia (C9).»                                                                                                                                                                                       | «Every full denial goes through here (C1), partial ones too with Texas mode on (C10), and the auditor sees the full case, with evidence and counter-evidence (C9).»                                                                                                                                                           |
| o   | `src/textos/plan.ts:69-70` (Parte de · El problema)                | «autorizar del todo o en parte, negar con causal o escalar; nunca negar del todo solo ni filtrar datos ni obedecer al texto»                                                                                                                                                                                                                           | «authorize in full or in part, deny with a ground or escalate; never fully deny alone, leak data or obey the text»                                                                                                                                                                                                            |
| p   | `plan.ts:407-408` (C1 en llano; su regla solo mide `negar`)        | «Ninguna negación completa sale sin que una persona la revise.»                                                                                                                                                                                                                                                                                        | «No full denial goes out without a person reviewing it.»                                                                                                                                                                                                                                                                      |
| q   | `src/textos/caso.ts:623-624` (sección de la pausa)                 | «Ninguna negación completa sale sin una persona. El agente se detiene…»                                                                                                                                                                                                                                                                                | «No full denial goes out without a person. The agent stops…»                                                                                                                                                                                                                                                                  |
| r   | `docs/MANUAL-DE-USO.md:117-118` y `429-430` (Medio)                | «…decide cada caso: aprobar, aprobar en parte (hasta el tope del servicio), negar o pasar a un auditor humano. Toda negación completa pasa por una persona, y la parcial también cuando el modo Texas está encendido; en el lote…»                                                                                                                     | «…decides each case: approve, approve in part (up to the service's cap), deny or hand it to a human auditor. Every full denial goes to a person, and a partial one too when Texas mode is on; in a batch…»                                                                                                                    |

- **Archivos generados que heredan la frase** (se arreglan con `pnpm fichas`):
  - `content/agentes/planlang-demo-a.ficha-tecnica.json:15,16,19,75,327`
  - `docs/fichas/planlang-demo-a.ficha-tecnica.en.json`
  - `docs/brochure-export.json:83` y `docs/fichas/brochure-export.en.json:83`
- **Se queda:** `fichas.ts:954` («Niega o rechaza **un caso**…»): un caso entero no se niega en parte.
- **Mirada:** es un cambio de copia frente a la maqueta aprobada, de clase TEXTO. No abre parada; se registra
  «maquetado, no visto».
- **Verificar:** tras `pnpm build`,
  - `grep -rlE "Ninguna negación sale sin una persona\.|nunca niega sin una persona|lo demás lo pasa a un auditor|Nunca niega por su cuenta|Toda negación pasa por aquí" out/es` no devuelve nada;
  - lo mismo en `out/en` con `No denial goes out without a person\.|never denies alone|the rest goes to an auditor|It never denies on its own|Every denial goes through here`;
  - `pnpm fichas --verificar` queda en verde.

#### F4. Agente A: «Entrega: tres respuestas» no incluye la aprobación en parte

- **Dónde:** `src/textos/agente.ts:109` y el bloque `entrega` (107-158), que arma `src/lib/vista/agente-a.ts`; y
  `agente.ts:1458-1459`, el resumen del verificador de cobertura.
- **Por qué es falso hoy:**
  - la pantalla lista Aprobación 169, Escalamiento 70 pausas y Negación 22, y omite las 9 aprobaciones en parte: son 4
    salidas, no 3;
  - el verificador dice «los demás, cubiertos» y mete los 9 casos sobre el tope entre los cubiertos.
- **Ajuste:**
  - `sub` → «cuatro respuestas y la traza» / «four answers and the trace».
  - Entrada nueva `aprobacionParcial`, contada con `decision_final == 'aprobar_parcial'` en `agente-a.ts`:
    - título «Aprobación en parte» / «Partial approval»;
    - detalle ES `Hasta el tope del servicio; el excedente lo niega una regla (RB-08), con su documento en ES y EN: ${n} de ${de}. Con el modo Texas, la decide una persona.`
    - detalle EN `Up to the service's cap; a rule (RB-08) denies the excess, with its document in ES and EN: ${n} of ${de}. With Texas mode on, a person decides it.`
  - Línea 1458: añadir `${c.sobreTope} sobre el tope del servicio` / `${c.sobreTope} above the service's cap` antes de
    las contradicciones.
- **Verificar:** `out/es/agente.html` contiene «Aprobación en parte» y «9 de 200», y las cuentas de Entrega suman 200.

#### F5. Entrada: «Las tres se ven en los dos demos»; el B no tiene modo Texas ni minutos

- **Dónde:** `src/textos/entrada.ts:107-108` (nota) y `231-232` (tarjeta «Mover un umbral»).
- **Por qué es falso hoy:** la tarjeta promete en los dos demos la confianza mínima, el modo Texas y los minutos de
  revisión humana. El B no tiene ninguno de los tres (desviación 26; manual 255).
- **Ajuste (línea 231):**
  - ES: «Mueve un umbral del plan —en el demo A, también el modo Texas— y mira, sobre las corridas reales, cuántos casos cambian de camino y cuántos pasan a una persona; en el A, también los minutos de revisión que cuesta.»
  - EN: «Move one of the plan's thresholds —in demo A, Texas mode too— and see, on the real runs, how many cases change path and how many go to a person; in demo A, also the minutes of review it costs.»
- **Verificar:** `grep -c "Sube la confianza mínima o enciende" out/es.html` da 0.

#### F6. «las decisiones humanas de **este** demo» en páginas que muestran dos demos

- **Dónde:** `src/textos/comun.ts:14-15`. Sale en la Entrada, `index.html`, `404.html` y Fichas, que cuenta los dos
  demos.
- **Relacionado:** el experto de la Entrada (`entrada.ts:317-318`) dice «el auditor sigue la verdad conocida», y el B
  tiene un oficial, no un auditor.
- **Ajuste:**
  - rótulo ES «Datos 100 % sintéticos · las decisiones humanas de los demos se simularon en lote» / EN «100% synthetic
    data · the demos’ human decisions were simulated in batch»;
  - experto ES «simuladas en lote: quien revisa —el auditor en el A, el oficial en el B— sigue la verdad conocida de
    cada caso (DA-04), y la vitrina lo dice en cada pantalla» / EN «simulated in batch: the reviewer —the auditor in A,
    the officer in B— follows each case’s known truth (DA-04), and the showcase says so on every screen».
- **Verificar:** `grep -rl "de este demo se simularon en lote" out` no devuelve nada, y la e2e a 380 px sigue sin
  desplazamiento lateral.

#### F7. Brecha A: «el más exigente… tenía que cumplirse en las 3 corridas seguidas»

- **Dónde:** `src/textos/brecha.ts:873-874`, usado en `src/lib/vista/brecha.ts:1155-1170`.
- **Por qué engaña hoy:** la frase calla que ese criterio, C5, es el que quedó incompleto con 1 corrida.
- **Ajuste:** pasar `incompleto` (el estado de `exigente`) y `corridas`.
  - ES: `; el más exigente, ${exigente}, pide ${k} corridas seguidas y aquí hubo ${corridas}: quedó incompleto`
  - EN: `; the most demanding, ${exigente}, asks for ${k} runs in a row and there ${corridas===1?"was":"were"} ${corridas} here: it was left incomplete`
- **Verificar:** `out/es/brecha.html` contiene «quedó incompleto» en la entradilla de Criterios.

#### F8. Datos del plan v1.5 que el S3 dejó falsos (Plan, Brecha § 2 e informe)

- **Dónde:** `plans/demo-a/v1.5.json`.
  - `supuestos.S1.prueba_barata`: «Sobre el lote de 20 con verdad conocida…», cuando se midió sobre 159 casos de 200.
  - `supuestos.S3.prueba_barata`: «…sobre el mismo lote de 20», cuando la línea base es de 200.
  - `problema`: «…sin negar jamás por su cuenta…», que contradice la D2 del mismo plan (F3).
- **Ajuste (requiere decisión del usuario):** una enmienda de solo redacción (ADR-005, como el B v1.1).
  - S1: «Sobre los casos con verdad conocida del lote medido: …» / «On the measured batch's ground-truth cases: …»
  - S3: «Línea base de agente único sobre el mismo lote; comparar exactitud y latencia.» / «Single-agent baseline on the same batch; compare accuracy and latency.»
  - Problema: «…aprobar (del todo o hasta el tope del servicio), negar con causal tasada o escalar a un auditor humano, sin negar jamás del todo por su cuenta…» / «…approve (in full or up to the service's cap), deny with an enumerated cause, or escalate to a human auditor — never fully denying on its own…»
  - Si no se enmienda, se declara como deuda.
- **Verificar:** `grep -c "lote de 20" out/es/plan.html` da 0.

#### F9. Fichas: «— en construcción» y «2 sprints cerrados» se vuelven falsos con el merge

- **Dónde:** `src/textos/fichas.ts:329` (`construccion: "en construcción"`) y `sprints_cerrados: 2` en
  `docs/brochure-export.json:22` y en las fichas.
- **Ajuste (en el mismo PR del summary):**
  - etiqueta → «construcción cerrada» / «build closed»;
  - opcional: que el valor sea la fecha `closed:` del summary (`armar.ts:667`);
  - `pnpm fichas`, que da 3 sprints al existir `SPRINT_003-summary.md`.
- **Verificar:** `pnpm fichas --verificar` en verde, y `out/es/fichas.html` muestra «3 sprints cerrados».

### MEDIO (documentos, guía, README y export)

- **F10. El export dice «las del roadmap no cuentan», pero cuenta 19 funcionalidades** que incluyen el entrevistador,
  el demo B y el expediente, marcados `[roadmap]` en VISION.
  - **Dónde:** `fichas.ts:893-894`, que sale en `docs/brochure-export.json:247` y `docs/fichas/brochure-export.en.json:247`.
  - **Ajuste ES:** «Las de la visión del producto que ya funcionan: las del corte de dos semanas y las del roadmap que se construyeron en el S3 (el entrevistador, el demo B y su expediente), contadas contra docs/MANUAL-DE-USO.md; lo que sigue en el roadmap no cuenta.»
  - **Ajuste EN:** «The product vision's features that work today: the two-week cut's and the roadmap ones built in S3 (the interviewer, demo B and its case file), counted against docs/MANUAL-DE-USO.md; what remains on the roadmap does not count.»
  - Después, `pnpm fichas`.
- **F11. Guía, bloque B (b1).**
  - **Dónde:** `docs/GUIA-DE-PRUEBA.html:262, 270-277`, más el encabezado `:183`.
  - **Por qué es falso hoy:** el bloque apunta al informe del S2 (`…a-001-20-v1.2`), con sus cifras del S2, y dice que
    es «el informe que publica la pantalla Brecha».
  - **Ajuste:** «Empieza en:» → `data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5/informe.es.md`, y b1 pasa a
    «Mejorado en S3», con estas filas:
    - Encabezado: «corrida suscripcion-planlang-a-002-200-v1.5 · 2026-10-04 · plan 1.5.0».
    - § 1: «cumple con alertas: 9 de 10 y C5 sin cerrar (1 de 3 corridas), ningún riesgo ocurrido».
    - § 4: «R1, R6 y R10 alta · control legal (tabla: baja); R8 sobre 10 sesiones».
    - § 5: «3 fallas que vio un evaluador: A-022, A-126, A-139».
    - § 6: «S1 confirmado (AUROC 0,7745 · ECE 0,0316, n = 159); S2 refutado (0,8333 frente a ≥ 0,95, n = 24); S3
      refutado por latencia (8,117 s frente a 4,964 s; acierta 98 % frente a 90 %)».
    - § 8: «conmutarlo cambia 9 de las 624 decisiones».
    - § 9: «casos planlang-a-002-200, generado con el plan 1.5.0».
  - Lo mismo en EN, y el historial del S3 pasa a 17 mejoradas.
- **F12. Guía, bloque D.**
  - `:296`: «preview del PR #8» → «preview del PR #14» (y EN).
  - `:311`, valor esperado de Brecha: «cumple con alertas: 9 de 10 criterios y C5 incompleto, ningún riesgo ocurrido,
    S1 confirmado, S2 y S3 refutados y 3 fallas no previstas, todo a la vista» (y EN).
- **F13. Manual.**
  - `:221` y `:533`, la Entrada: «qué es planlang, una fila por demo con su veredicto y su corrida, y la capacidad
    medida con el demo A, cada cifra con su origen.» (y EN).
  - `:300-301` y `:614-615`: «…componentes y las vistas de los dos demos» es falso (desviación 27; `design-sync/README.md`).
    Reemplazo: «(colores, tipografía, espacio, movimiento y los componentes canon que fijan su gramática visual), como
    activo estable entre ciclos. Las pantallas no viajan: viven en la vitrina.» (y EN).
- **F14. `README.md`, que el S3 no tocó (público en GitHub).**
  - `:29`: «(la vitrina publica el v1.3)» y «v1.4 = el último plan» → `pnpm plan:validar --verificar plans/demo-a/v1.5.json  # el plan del demo A que publica la vitrina, con su huella`.
  - `:21`: «(el brochure y el blueprint nacen al cierre del ciclo)» → «Manual de uso, guía de prueba, kit de prueba y el
    blueprint de infraestructura (`docs/BLUEPRINT.html`); la vitrina y sus fichas hacen de brochure».
  - `:17`: añadir el demo B y el entrevistador.
  - `:22`: añadir los ADR 011–016.
- **F15.** `docs/BLUEPRINT.html:210`: «US$4,92 por las 200 **corridas** de la v1.5» → «US$4,92 por los 200 casos de la
  corrida v1.5 del A».
- **F16. ADR-011** anuncia un pago que su propia adenda dice que no ocurrió.
  - `:1`: título → «Margen de LCP para el playground: 2,8 s por ruta; el pago no se alcanzó en el S3 (adenda)».
  - `:8`: «Paid back in S3.» → «Not paid back in S3: the user kept the margin and left it as declared debt (S3 addendum).»
  - `:65`: «con pago en el S3» → «con pago previsto para el S3, que no se alcanzó (ver la adenda)».

### BAJO (comentarios, ADR internos y frases que solo afectan corridas futuras)

- **F17.** `decisions/001-codigo-primero-demos.md:32`: «Más adelante: el entrevistador (S3), el demo B (S3) y un
  juez…» → «Desde el S3, también el entrevistador (ADR-012) y el demo B (ADR-013). El juez selectivo de «calidad de
  redacción» es opcional y no corrió en ninguna corrida publicada (nunca sería fuente única del veredicto, E-8).»
- **F18.** Comentarios:
  - `src/textos/agente.ts:1896`: «(propuesta para el S3)» → «(el plan v1.5 no declara esa relación: la lectura es del autor)».
  - `fichas.ts:986`: «(lo del roadmap no cuenta)» → «(lo que sigue en el roadmap no cuenta)».
- **F19.** «no corrió (opcional en este corte)»: `brecha.ts:1083-1084, 1491-1492` y `core/brecha/render-md.ts:361-362`,
  que se publica en `informe.*.md:129`.
  - Reemplazo: «no corrió (opcional; el plan no lo exige)» / «did not run (optional; the plan does not require it)».
  - Cambia los bytes de los informes, sus goldens y las huellas del manifiesto: es opcional, o se declara.
- **F20.** Concordancia rota por k=1: «200 casos × 1 corridas» (`brecha.ts:863-864`, también en el B) y «1 corridas · 4
  evaluadores» (`:1491-1492`). Reemplazo: `${k===1?"corrida":"corridas"}` / `${k===1?"run":"runs"}`.
- **F21.** Capacidad del A: «≈ 37 min · un lote de 200 casos · **estimación**» (`agente.ts:303-312`,
  `vista/agente-a.ts:452-460`), cuando la corrida ya es el lote de 200.
  - Si `n === loteCompleto`, pasar a `estimacion: false`.
  - Detalle ES «en serie, sumando los ${n} casos de esta corrida (${promedio} s por caso); ${usd} USD nominales».
  - Detalle EN «in series, adding up this run's ${n} cases (${promedio} s per case); ${usd} USD nominal».
- **F22.** `agents/src/app_agents/demo_a/documento_adverso.py:19-22`: el `AVISO_IA` dice «Ninguna negación se emite sin
  la revisión de una persona».
  - Reemplazo: «Ninguna negación completa se emite sin la revisión de una persona.» / «No full denial is issued without
    review by a person.»
  - Solo corrige las corridas nuevas: las publicadas son append-only y conservan el texto viejo, y eso se declara.
- **F23.** Guía `:410`: «toda negación con pausa humana» → «toda negación completa con pausa humana (y la parcial con
  el modo Texas)», y lo mismo en EN.

**Fuera de la casilla, una línea:** la C5 del plan v1.5 declara `k_aplica_a: "lote_demo_20"`, y la vitrina publica
«incompleto (1 de 3)» sobre el lote de 200. Conviene confirmar que esa lectura del verificador es la que quiere el plan.

**Revisado y no son hallazgos:**

- «Medido con 1 de 3 corridas… todavía no puede declararse cumplido»;
- «Lo que aún no hace: tener un auditor/oficial de verdad»;
- «También en construcción» (3 ítems reales de VISION);
- «Puede seguir, con cuidado: antes del lote de 200 casos, revise S2» (informe B);
- `design-sync/README.md` y `docs/kit-de-prueba/README.md`;
- la Entrada, la Brecha y el Playground del A con sus cifras de 200.

**Búsquedas hechas:**

1. Promesa aplazada en ES y EN sobre `src/textos/**`, `src/app`, `src/components`, `src/lib`, el manual, la guía, las
   fichas y el export, `design-sync`, `decisions/*.md`, los informes publicados, los comentarios de `core/`,
   `agents/src` y `scripts/`, y el texto renderizado de `out/es/**`, `out/en/**`, `es.html`, `en.html`, `index.html` y
   `404.html`.
2. Las cifras que cambió la corrida de 200.
3. Las consecuencias de la aprobación en parte.
4. Los encabezados y estados de los 16 ADR.
5. Lecturas completas del README, el kit, el BLUEPRINT, el manual y las pantallas principales del export.

Son unas 570 coincidencias revisadas; resultan 23 hallazgos.

---

## Alcance, calidad de código y casillas 5–8 (auditor 1)

_Pendiente al escribir esta versión._
