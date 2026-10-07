# Auditoría del Sprint 003 — planlang (Fase 1, solo lectura)

> `/audita-sprint`, kit v1.37.0. Dos auditores independientes que no construyeron el sprint (subagentes en solo
> lectura), sobre el diff `origin/main...HEAD` (HEAD `a1b1bbe`) y el export construido desde ese HEAD:
>
> - **Auditor 1:** alcance, calidad de código, herramientas y casillas 5–8 (29 hallazgos: 3 Alto, 11 Medio, 15 Bajo).
> - **Auditor 2:** casilla 4, «¿qué frases caducaron?», por promesa aplazada, en todas las superficies y en `out/` (23
>   hallazgos: 9 Alto, 7 Medio, 7 Bajo).
>
> **Recomendación de los dos: requiere ajustes.** Hay solapes (F10 = AU-S3-09; F13 ⊃ AU-S3-22; F11/F12 ⊃
> AU-S3-02/03): en la Fase 2 se pagan una vez.
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

- **Auditor:** subagente independiente que no construyó el sprint, en solo lectura.
- **Fecha:** 2026-10-05. **Base:** `origin/main` (`0190a62`). **Cabeza:** `9b90079`; la auditoría empezó sobre `a1b1bbe` y el
  único commit posterior toca solo la bitácora.
- **Apoyo:** dos subagentes de solo lectura para las casillas 5 y 6; cada hallazgo suyo que se reporta aquí lo
  verificó contra el código.

**Recomendación: requiere ajustes.** Hay 3 hallazgos Altos:

- un contrato Python → TypeScript roto en un camino que ya ocurrió en una corrida real;
- dos bloques ⭐ de la guía heredada que no pueden pasar contra el producto de hoy.

Hay además 11 Medios (la mayoría, afirmaciones falsas o fallas silenciosas en la vitrina y en las fichas) y 15 Bajos.
Todo se puede pagar en este sprint.

### 1. Cobertura de alcance

Pendientes por diseño en la fase 4, sin clasificar como faltantes:

- el lote de 200 del B (corre en fondo, sin comitear);
- `/deploy-check --python` y el summary;
- el paquete regenerado al final;
- el ⭐⭐ del Acto 2.

El LCP a 2,5 s es deuda declarada por decisión del usuario (adenda del ADR-011).

| Ítem (orden + plan)                                                     | Clasificación                                        | Evidencia                                                                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **F0** · Constitución v1.37.0                                           | Completo                                             | `CLAUDE.md:6`, `:569`; centinelas 1·1·1·2                                                              |
| F0 · `deploy-check`, `audita-sprint`, `diseno-ui` § 5, `demo-rojo.sh`   | Completo                                             | `.claude/commands/*.md`, `scripts/demo-rojo.sh`, `.gitignore`                                          |
| F0 · `plan-sprint` (f) mezclado                                         | Con desviación (desv. 2)                             | `.claude/commands/plan-sprint.md`                                                                      |
| F0 · `beforeSend` metadata-only                                         | Completo                                             | `instrumentation-client.ts:13-27`, `src/lib/sentry-evento.ts`                                          |
| F0 · `verificar-dependencias` falla cerrado                             | Con desviación (desv. 4)                             | `scripts/verificar-dependencias.mjs:121-131`                                                           |
| F0 · `lighthouse-margen` en CI                                          | Con desviación (desv. 3, parche local)               | `scripts/lighthouse-margen.mjs`, `scripts/lighthouse/patron.mjs`, `ci.yml:96`                          |
| F0 · Capturas sobre la maqueta servida                                  | Completo                                             | `docs/diseno/README.md:129-133`, `scripts/servidor-estatico.mjs` (ver AU-S3-15)                        |
| F0 · ADR de la excepción `braces`                                       | Completo                                             | `decisions/015-aviso-braces-ignorado.md`                                                               |
| F0 · Matriz de envejecimiento                                           | Completo                                             | bitácora `:109-113`                                                                                    |
| F0 · README de comandos (kit v1.35.0)                                   | **No implementado**, sin desviación declarada        | bitácora `:116` (AU-S3-23)                                                                             |
| F0 · Diagramador 0.5.0: copia, lock y huellas                           | Completo con desviación (desv. 11 y 23)              | `packages/diagramador/CONTRATO.lock`; las 4 huellas coinciden con la orden                             |
| F0 · `core/visor` 0.5.0                                                 | Completo                                             | `core/visor/condicion.ts`, `recorridos.ts`, `validar.ts`; Ajv en `src/lib/vista/visor.ts:105-110`      |
| F0 · Plan v1.5 del A y su agente (M-8, M-15, M-16, M-17, M-18, parcial) | Completo                                             | `plans/demo-a/v1.5.json`, `agents/src/app_agents/demo_a/nodos.py`, `decisions/016-…`                   |
| F0 · Playground reconoce `aprobar_parcial`                              | **Parcial**                                          | núcleo listo; el manifiesto nunca lo declara (AU-S3-11)                                                |
| F0 · Lote de 200 v1.5 y su base                                         | Completo                                             | `runs/demo-a/suscripcion-planlang-a-002-200-v1.5{,-base}`                                              |
| **F1** · Plantilla `dom-financiero`                                     | Con desviación (desv. 12)                            | `data/dominios/dom-financiero.json`                                                                    |
| F1 · Entrevistador                                                      | Completo con defecto                                 | `agents/src/app_agents/entrevistador/grafo.py:124-140`, `cli.py:86-97` (AU-S3-01, AU-S3-10)            |
| F1 · Contradicciones RF-02.5                                            | Completo, más códigos (desv. 14)                     | `core/plan/contradicciones.ts:24-34`                                                                   |
| F1 · CLI `entrevistar` y `plan:aprobar`                                 | Completo con defecto                                 | `scripts/entrevistar.ts`, `scripts/plan-aprobar.ts`                                                    |
| F1 · ADR-012 y pruebas                                                  | Completo                                             | `agents/tests/test_entrevistador.py:63`, `tests/unit/core/plan/contradicciones.test.ts:23`             |
| F1 · Parada de DECISIÓN                                                 | Con desviación (entrevista por delegación explícita) | bitácora `:566-601`; frase «apruebo el plan B» `:597`; `plans/demo-b/v1.json`                          |
| **F2** · Generalización a N demos                                       | Completo con defectos                                | `agents/src/app_agents/demos.py`, `lotes.py`, `core/sintetico/de-demo.ts` (AU-S3-12, AU-S3-14)         |
| F2 · Sintético B, listas, adversarios, identificadores                  | Completo                                             | `core/sintetico/demo-b/*`, `data/listas/demo-b.json`                                                   |
| F2 · Agente B: 9 nodos y guardias                                       | Con desviación (desv. 18 y 19)                       | `agents/src/app_agents/demo_b/nodos.py:134-165`, `:331-384`                                            |
| F2 · Puntaje y permutación de nombres                                   | Completo                                             | `demo_b/reglas.py:52-98`, `agents/tests/test_demo_b.py:337`                                            |
| F2 · Expediente ES/EN por código                                        | Completo con defectos                                | `demo_b/expediente.py:102-309` (AU-S3-07, AU-S3-14)                                                    |
| F2 · Línea base, ADR-013, lote de 20, RF-09.2 B                         | Completo                                             | `runs/demo-b/suscripcion-planlang-b-001-20{,-base-v2}`, `test_demo_b.py:319`                           |
| F2 · LangSmith                                                          | No aplica (sin aprovisionar; opcional)               | bitácora `:713`                                                                                        |
| **F3** · M-20, M-25, lector por demo                                    | Completo                                             | `core/brecha/evaluadores.ts:99-115`, `plans/demo-b/v1.1.json`                                          |
| F3 · Informe sin fragmentos e informe B                                 | Completo                                             | `core/brecha/textos-informe.ts`, `data/vitrina/demo-b/suscripcion-planlang-b-001-20/`                  |
| F3 · ADR-014 y vitrina B                                                | Con desviación                                       | `src/app/[idioma]/demo-b/*`, `src/lib/vista/entrada.ts:78` (AU-S3-12)                                  |
| F3 · Playground B en 3 motores, visor B, «diagrama = grafo» B           | Completo (4 umbrales, desv. 25)                      | `tests/e2e/_paridad.ts`, `scripts/diagrama-igual-grafo.ts:221-236`                                     |
| F3 · Ficha del agente B y export con dos demos                          | Completo con defectos                                | `content/agentes/planlang-demo-b.ficha-tecnica.json`, `docs/brochure-export.json` (AU-S3-08, AU-S3-09) |
| F3 · Lighthouse con el B; capturas con techo; mirada de FORMA           | Completo                                             | `lighthouse-urls.json:10-16`, `scripts/capturas-demo-b.mjs`, bitácora `:1617`                          |
| **F4** · BLUEPRINT                                                      | Completo con defecto                                 | `docs/BLUEPRINT.html` (AU-S3-18)                                                                       |
| F4 · Corrida de 200 del A en la vitrina                                 | Completo                                             | `data/vitrina/manifiesto.json`, `src/lib/vista/paginas-caso.ts`                                        |
| F4 · LCP a 2,5 s                                                        | No cumplido: deuda por decisión del usuario          | `decisions/011-…:71-91`                                                                                |
| F4 · Guía acumulativa con ⭐⭐                                          | Con defectos                                         | `docs/GUIA-DE-PRUEBA.html` (AU-S3-02 a 05, 20, 21)                                                     |
| F4 · Manual ES/EN                                                       | Completo con defectos                                | `docs/MANUAL-DE-USO.md` (AU-S3-05, 08, 22)                                                             |
| F4 · `design-sync/` sin publicar                                        | Con desviación (desv. 27)                            | `design-sync/project.json`: `lastPublished` null                                                       |
| F4 · Auditoría 2-bis del `CLAUDE.md`                                    | Completo; dos archivos de la app sin corregir        | bitácora `:1290-1329` (AU-S3-17)                                                                       |

### 2. Hallazgos

Todo el texto que se propone va en presente, sin promesa aplazada.

#### Altos

**AU-S3-01 · Alto · El contrato de la transcripción entre Python y TypeScript se rompe cuando el modelo omite elementos.**

- **Qué pasa:** `agents/src/app_agents/entrevistador/grafo.py:196` escribe `restaurados` en el turno, y
  `core/plan/revision.ts:23-50` (`TurnoSchema`, `.strict()`) no declara esa clave. `TranscripcionSchema.parse` lanza en
  `scripts/entrevistar.ts:29` y en `scripts/plan-aprobar.ts:34` (vía `revisarDirectorio`).
- **Por qué importa:**
  - El camino ya ocurrió: en la corrida real 2 el modelo devolvió solo D4 (bitácora `:586-590`). Con un turno así no
    sale la revisión y `plan:aprobar` no puede aprobar.
  - El fixture de contrato no trae el campo: falta una carnada por campo (regla 19).
- **Ajuste:**
  1. En `TurnoSchema`, después de `explicaciones`: `restaurados: z.array(z.string().min(1)).min(1).optional(),`.
  2. Darle un lector:
     - `Revision` gana `restaurados_por_el_codigo: { pregunta: string; elementos: string[] }[]`, que llena `revisarBorrador`;
     - `textoDeRevision` escribe una línea por cada uno. ES: «P07: el modelo omitió D1, D2; el código los devolvió desde
       la propuesta.» EN: «P07: the model left out D1, D2; the code put them back from the proposal.»
  3. Carnada:
     - en `agents/tests/test_entrevistador.py`, una prueba con el modelo falso que descarta elementos;
     - la prueba arma `transcripcion(...)` y escribe o compara el fixture
       `tests/contrato/entrevista-demo-b/transcripcion-con-restaurados.json`;
     - en `tests/contrato/entrevista-borrador.test.ts`, `it("una transcripción con elementos restaurados valida y la
revisión los nombra")`.
- **Verificado cuando:** `pnpm test` y `pytest` quedan verdes. Demo en rojo con `scripts/demo-rojo.sh`: se borra la línea
  `restaurados` del esquema → rojo «Unrecognized key» → verde al restaurar.

**AU-S3-02 · Alto · La guía heredada (bloque B, b1, ⭐) mide un informe archivado del S2.**

- **Qué pasa:**
  - `docs/GUIA-DE-PRUEBA.html:262` empieza en `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.es.md` y
    dice «Es el informe que publica la pantalla Brecha»; la tabla de `:268-277` espera los valores del S2.
  - `:183` justifica dejarla fuera del ⭐⭐ con «la CI lo compara», y es falso.
- **Ajuste:**
  - `:262` → `data/vitrina/demo-a/suscripcion-planlang-a-002-200-v1.5/informe.es.md`.
  - b1 → «Mejorado en S3».
  - La tabla, con los valores de ese informe:
    - encabezado: corrida `…-002-200-v1.5`, 2026-10-04, plan 1.5.0;
    - § 1: cumple con alertas, 9 cumplidos y 1 sin cerrar de 10 (C5), ningún riesgo ocurrido, y cuatro alertas: C5,
      S2, S3 y 3 brechas;
    - § 4: R1 y R6 alta por control legal; R8 sobre 10 sesiones;
    - § 5: 3 brechas (A-022, A-126, A-139), del extractor; el evaluador de exactitud marca 6;
    - § 6: S1 confirmado; S2 refutado (24 casos, 83,3 %); S3 refutado por latencia (98 % frente a 90 %; 8,117 s frente a
      4,964 s);
    - § 8: «conmutarlo cambia 9 de las 624 decisiones»;
    - § 9: huellas, «generado con el plan 1.5.0» y la base `…-v1.5-base`.
  - `:183` → «…es el mismo informe de la pantalla Brecha, y `tests/integration/manifiesto-vitrina.test.ts` comprueba
    que el publicado es el que declara el manifiesto…».
- **Verificado cuando:** `grep -n "a-001-20-v1.2" docs/GUIA-DE-PRUEBA.html` no da nada en el bloque B y los contadores
  siguen cuadrando.

**AU-S3-03 · Alto · Bloque D de la guía (v1 mejorada; v2 y v3 heredadas, las tres ⭐): preview del S2 y valores viejos.**

- **Qué pasa:**
  - `:296` dice «Empieza en: preview del PR #8», que es el S2; el S3 es el PR #14.
  - `:311` espera «9 de 9, S1 sin probar…».
  - `:304` (v3) dice «tres casos reales», y el panel muestra 5 con «Ver N más».
- **Ajuste:**
  - `:296` → «preview del PR #14 · tu teléfono».
  - `:311` → «cumple con alertas: 9 de 10 criterios cumplidos y C5 incompleto, ningún riesgo ocurrido, S1 confirmado, S2 y
    S3 refutados y 3 brechas no previstas, todo a la vista».
  - `:304` → «…se abre su ficha con líder, experto, código y trazas: los primeros cinco casos del bloque de 20 que pasaron
    por ahí, con «Ver N más»…».
  - v2 y v3 → «Mejorado en S3». Todo en los dos idiomas.
- **Verificado cuando:** `grep -n "PR #8\|tres casos reales\|9 de 9 criterios" docs/GUIA-DE-PRUEBA.html` no da nada.

#### Medios

**AU-S3-04 · Medio · Razón falsa para dejar A y C fuera del ⭐⭐** (`docs/GUIA-DE-PRUEBA.html:183`).

- **Qué pasa:** dice «el lote de 20 del A y su espejo en LangSmith (A, C) ya los corriste en el S1», y el summary del S1
  dice «Ninguna parada corrió».
- **Ajuste:**
  - ES: «el lote de 20 del A (A) lo cubre la parada 1, que corre un caso con tu suscripción y mira la cuota; el espejo
    en LangSmith (C) queda fuera porque LangSmith no está aprovisionado».
  - EN: «demo A's 20-case batch (A) is covered by stop 1, which runs one case on your subscription and checks the quota;
    the LangSmith mirror (C) stays out because LangSmith is not set up».
- **Verificado cuando:** `grep -n "ya los corriste en el S1"` da 0.

**AU-S3-05 · Medio · El manual y la parada 2 mandan a un conmutador «A · B» que solo existe en las pantallas del B.**

- **Qué pasa:** `src/components/marco/barra.tsx:59`. Las frases están en `docs/MANUAL-DE-USO.md:177`, `:213`, `:489` y
  `:525`, y en `docs/GUIA-DE-PRUEBA.html:214`.
- **Ajuste:**
  - «entra al demo B desde su fila en la entrada y abre «Casos»»;
  - «La entrada tiene una fila por demo y desde ella se entra a cada uno. En las pantallas del B, el conmutador «A · B»
    de la barra lleva a la misma pantalla del A»;
  - en la guía: «Entra al demo B desde su fila y abre Brecha».
  - Todo en los dos idiomas.
- **Verificado cuando:** el grep del conmutador solo devuelve la frase que lo sitúa en el B.

**AU-S3-06 · Medio · La vitrina publica el motivo técnico de la pausa con formato de Python.**

- **Qué pasa:** `src/lib/vista/caso-a.ts:314` y `caso-b.ts:309` pasan `payload.motivo` tal cual, y
  `src/components/caso/caso.tsx:438` lo pinta. Sale «carga_detectada (True) igual a True (True)» en A-009, A-016 y B-019.
- **Ajuste:**
  - `motivoTecnico(d: DecisionDeArista)` en `src/lib/vista/caso-comun.ts`, con plantillas en `src/textos/caso.ts`
    (`MOTIVO_TECNICO`):
    - tripleta → `Arista {orden} de {desde}: {senal} ({obs}) {operador} {valor_declarado} ({umbral_aplicado}).`;
    - función → `{funcion}(k=v, …)`;
    - booleanos → `true`/`false`; null → `null`; número → `decimal`.
  - Usarla en `caso-a.ts:314` y `caso-b.ts:309`.
  - Prueba en `tests/unit/vitrina/caso.test.ts`: ningún caso con página de los dos demos casa
    `/\bTrue\b|\bFalse\b|\bNone\b|\d\.\d/`, y A-016 en ES es «Arista 1 de decision: carga_detectada (true) igual a true
    (true).».
  - El `_motivo` de Python del A queda como deuda para el próximo lote.
- **Verificado cuando:** la prueba queda verde, y se pone roja con `demo-rojo.sh` nombrando A-016.

**AU-S3-07 · Medio · B-005, B-006 y B-014 (corrida de 20) publican su documento de rechazo sin aviso de IA, y callan la falla (regla dura 12).**

- **Qué pasa:** `src/lib/vista/caso-b.ts:352-354` pone `aviso: null`.
- **Ajuste:**
  - si falta `doc.aviso_ia`, poner `avisoFalta` con texto en `src/textos/demo-b/caso.ts`:
    - ES: «Este documento no trae su aviso de IA: la corrida es anterior al arreglo que lo añadió (bitácora del S3, D54);
      las corridas nuevas lo traen.»
    - EN: «This document carries no AI notice: the run predates the fix that added it (S3 log, D54); new runs carry it.»
  - `caso.tsx` lo pinta como falla nombrada;
  - prueba en `caso-componentes.test.tsx` con B-005, en ES y EN.
- **Verificado cuando:** la prueba queda verde y se pone roja si `avisoFalta` vuelve a `null`.

**AU-S3-08 · Medio · «el investigador solo en la zona gris», y el código lo corre desde U4 hacia arriba (desv. 19).**

- **Dónde:**
  - `src/textos/fichas.ts:1081-1082`;
  - `src/textos/demo-b/fichas.ts:25-26`, más su bloque «Investigador de contexto» y el paso «¿Zona gris?»;
  - `src/textos/demo-b/agente.ts:460-461`;
  - `docs/MANUAL-DE-USO.md:150`, `:463`;
  - y los generados.
- **Ajuste:**
  - manual: «un investigador mira el contexto cuando el parecido llega al inicio de la zona gris del plan (U4) o lo pasa;
    por encima del umbral de coincidencia (U1) el caso va igual al oficial y la conclusión del investigador es evidencia
    para él»;
  - fichas: «…investiga el contexto desde el inicio de la zona gris…», «Desde el inicio de la zona gris: ¿homónimo o la
    misma persona? Concluye, no decide.» y «¿Parecido desde la zona gris?»;
  - D2: «el investigador entra desde el inicio de la zona gris y se puede retirar»;
  - todo en los dos idiomas, y luego `pnpm fichas`.
- **Verificado cuando:** `grep -rniE "solo.{0,40}zona gris|only.{0,40}gr[ae]y zone" src/textos docs content` da 0.

**AU-S3-09 · Medio · El export dice «las del roadmap no cuentan», y cuenta tres del roadmap** (`src/textos/fichas.ts:893-894`).

- **Ajuste:**
  - ES: «Las funcionalidades construidas, cada una con su sección en docs/MANUAL-DE-USO.md; incluye las del roadmap que
    se construyeron en el sprint 3 (el entrevistador, el demo B y su expediente).»
  - EN: «The features built, each with its section in docs/MANUAL-DE-USO.md; it includes the roadmap ones built in
    sprint 3 (the interviewer, demo B and its case file).»
  - Después, `pnpm fichas`. (Coincide con la F10 del auditor 2.)

**AU-S3-10 · Medio · `pnpm entrevistar --demo b` sobrescribe en silencio el registro del plan B aprobado, y nada ata `v1.json` a su borrador.**

- **Dónde:** `agents/src/app_agents/entrevistador/cli.py:179-187` y `scripts/entrevistar.ts:94-95`.
- **Ajuste:**
  1. Si `plans/demo-<x>/v1.json` existe y no hay `--salida`, el CLI lanza `PlanYaAprobado`: «plans/demo-b/v1.json ya
     está aprobado: la entrevista nueva va a la carpeta que indiques con --salida» y sale con 2. Añadir `--salida` en
     `__main__.py` y en `entrevistar.ts`.
  2. Nueva `tests/unit/guardias/procedencia-plan-b.test.ts`:
     - (a) `aprobarPlan(v0-borrador, {por, el})` reproduce exactamente `plans/demo-b/v1.json`; si no, se detiene y se
       reporta;
     - (b) las huellas de `contradicciones.json` coinciden con las del borrador y la transcripción.
  3. Una prueba en pytest para el paso 1.
  4. Una línea en el manual (ES/EN).
  5. No regenerar los `revision.*.md` aprobados.
- **Verificado cuando:** las pruebas quedan verdes, y un byte cambiado en `v0-borrador.json` las pone rojas.

**AU-S3-11 · Medio · El playground del A nunca recibe la declaración de aprobación parcial.**

- **Qué pasa:** `data/vitrina/manifiesto.json` (`demos.demo-a.playground`) no lleva `parcial`, y
  `core/playground/consecuencias.ts:184-198` trata `aprobar_parcial` siempre como adversa. El efecto está latente: hoy
  las 9 ya salen solas.
- **Ajuste:**
  - añadir `"parcial": {"valor": "aprobar_parcial", "senal_que_exige_persona": "modo_texas"}`;
  - regenerar el golden de la isla A;
  - prueba en `playground.test.ts`: el compacto publicado trae `propuesta.parcial`.
- **Verificado cuando:** la paridad en 3 motores queda verde y quitar la entrada pone roja la prueba.

**AU-S3-12 · Medio · El ADR-014 afirma despachos exhaustivos por demo, y quedan binarios y valores por omisión «demo-a» (casilla 7).**

- **Dónde:**
  - `src/lib/datos/vitrina.ts:333` y `:427-435`;
  - `src/lib/vista/plan.ts:177`, `:186`, `:194`;
  - `src/lib/vista/brecha.ts:2448`;
  - `src/lib/vista/caso.ts:167`;
  - `src/components/marco/barra.tsx:59`;
  - `src/lib/vista/motivo-pausa.ts:109`, `:188`;
  - `core/sintetico/de-demo.ts:15`, `:25`;
  - `scripts/verificar-export.mjs:190`.
- **Ajuste:**
  - quitar los `= "demo-a"` por omisión;
  - `switch` exhaustivos con `never`;
  - `DatosDeLosDemos` mapeado sobre `IdDemo`;
  - `Record<IdDemo, …>` donde hoy hay una comparación binaria, con su razón;
  - recorrer `DEMOS` en los scripts;
  - corregir la frase del ADR-014.
- **Verificado cuando:** `grep -rnE '(id|demo)\s*(===|!==)\s*"demo-[ab]"' src core scripts` da 0, y la demo en rojo
  (añadir `"demo-c"` a `DEMOS`) hace que `pnpm typecheck` nombre cada sitio.

**AU-S3-13 · Medio · La revisión que el usuario lee para aprobar no muestra su respuesta literal ni las explicaciones del modelo.**

- **Qué pasa:** de la transcripción se leen 15 de 45 campos (`core/plan/revision.ts`, `textoDeRevision`), y
  `m1.advertencias` solo la lee una prueba.
- **Ajuste:**
  - sección «La entrevista, pregunta por pregunta»: respuesta literal con su idioma, resultado, elementos con su
    origen, explicaciones y motivo;
  - cabecera con plantilla, proveedor, modelo, fecha, pasadas y tokens;
  - las advertencias de M1;
  - todo bilingüe, y sin regenerar los `revision.*.md` aprobados.
- **Verificado cuando:** `tests/contrato/entrevista-borrador.test.ts` exige la sección en los dos idiomas.

**AU-S3-14 · Medio · Campos del expediente y del documento B sin lector, entre ellos lo que pide D3 y la carta al solicitante.**

- **Dónde:** `listas_consultadas` (`core/formatos/traza.ts:115-124`, `:195`), `decision.*` (`:187-193`), `caso_id`,
  `plan`, `datos_usados`, `conclusiones[].tema`, `cita.regla`, y el `texto` del documento (`src/lib/datos/esquemas.ts:343`).
- **Ajuste**, en `src/lib/vista/caso-b.ts` con textos en `src/textos/demo-b/caso.ts`:
  - fila «Listas consultadas» (id · versión · fecha · vinculante);
  - «Decidió» con `revisada_por_persona` y `rol`;
  - `tema` como rótulo de cada conclusión;
  - `cita.regla` junto a su referencia;
  - `datos_usados` y `plan` al pie;
  - comprobación de build `expediente.caso_id === traza.caso_id`;
  - la carta como primera fila del documento.
- **Verificado cuando:** la casilla 5 del expediente da 23 de 23 en ES y EN.

#### Bajos

**AU-S3-15 · Bajo · `scripts/servidor-estatico.mjs:25` compara la ruta por prefijo sin separador.**

- **Ajuste:** `if (pedido !== base && !pedido.startsWith(base + sep))`.
- **Verificado cuando:** una prueba pide `/../out-x` y recibe 403.

**AU-S3-16 · Bajo · `src/lib/vista/visor.ts:118-121` (`TITULO_CODIGO`) es copia bilingüe dentro de `src/lib`.**

- **Ajuste:** moverla a `src/textos/agente.ts`.

**AU-S3-17 · Bajo · `packages/diagramador/README.md:4-6` y `core/brecha/lector.ts:6` quedaron caducados.**

- **Qué pasa:** el README dice 0.3.0 y cita una ruta de prueba que no existe; el lector dice «IndexedDB».
- **Ajuste:** 0.5.0, 1.2.0 y `tests/unit/guardias/contratos-lock.test.ts`; y «(los scripts leen el disco; la vitrina, al
  compilar: ADR-008)».

**AU-S3-18 · Bajo · `docs/BLUEPRINT.html:210` («LangSmith Developer US$0, 0 % usado») contradice `:206` («sin aprovisionar»).**

- **Ajuste:** «LangSmith: sin cuenta, US$0».

**AU-S3-19 · Bajo · `src/lib/vista/agente-b.ts:447` (`S2`) y `:676` (`cumple("C6")`) buscan por id literal y siguen en silencio si falta.**

- **Ajuste:** elegir el supuesto de línea base por `medible_en_trazas.comparacion === COMPARACION_LINEA_BASE`, y
  `exigirCriterio(id)` que detiene el build nombrándolo.

**AU-S3-20 · Bajo · La guía `:431` (h2) cita `rf-09-2.test.ts` para la señal nula.**

- **Ajuste:** citar `tests/unit/core/playground/interprete.test.ts` y `agents/tests/test_reglas_arista.py`.

**AU-S3-21 · Bajo · La guía `:366` (j1) no nombra lo que el paquete trae del B ni el borrado previo.**

- **Ajuste:** «Mejorado en S3», con «borra `public/piezas/planlang/` antes de copiar» y
  «/piezas/planlang/es/demo-b/brecha.html y la ficha del agente B en el frente Agentes».

**AU-S3-22 · Bajo · El manual (`:301`, `:614-615`) dice que el design system publica «las vistas de los dos demos».**

- **Ajuste:** «(colores, tipografía y componentes canon; las pantallas no viajan en el paquete)» y EN. (Coincide con la
  F13 del auditor 2.)

**AU-S3-23 · Bajo · El delta «README de comandos» (kit v1.35.0) no se aplicó ni figura en «Desviación del plan».**

- **Ajuste:** desviación 29: el estampado excluye `README.md` y el kit lo movió a `.claude/COMANDOS.md`.

**AU-S3-24 · Bajo · Literales del demo B y de la entrevista en el núcleo y los scripts.**

- **Dónde:** `core/plan/contradicciones.ts:281-282`, `core/plan/revision.ts:193`, `:247`, `scripts/entrevistar.ts:62`,
  `scripts/plan-aprobar.ts:17`, `agents/src/app_agents/lotes.py:420`, `scripts/paquete-vitrina.ts:295-298`.
- **Ajuste:**
  - derivar el demo de `plan_id`;
  - `comandoRetomar` como parámetro;
  - `choices=sorted(FABRICAS)`;
  - `DEMOS_ENTREVISTABLES` con su razón;
  - recorrer `DEMOS`.
- **Verificado cuando:** `grep -rn -- "--demo b" core` da 0.

**AU-S3-25 · Bajo · `agents/src/app_agents/lotes.py` tiene código muerto.**

- **Qué pasa:** `:92-95` (`_grafo_y_contrato`) y `:62` (`SALIDA_POR_DEFECTO`) no se usan; `:59-61` duplican `demos.py`.
- **Ajuste:** borrar las dos primeras y comentar `:59-61` como alias del A.

**AU-S3-26 · Bajo · El informe publicado del A dice «No cumple el umbral de confirmación: tasa_min.» para S2** (`core/brecha/supuestos.ts:118`).

- **Qué pasa:** D71 solo lo arregló en la vitrina.
- **Ajuste:** que la razón diga la medida contra el umbral; regenerar los informes y declararlo en la ficha de
  reproducibilidad, porque cambia el JSON del verificador.

**AU-S3-27 · Bajo · El payload de la pausa del B solo se comprueba por presencia** (`src/lib/datos/esquemas.ts:321-328`).

- **Ajuste:** comprobación de build en `caso-b.ts`: lo que vio el oficial (`payload.*`) es igual a la traza y al lote,
  o el build se detiene nombrando caso y clave.

**AU-S3-28 · Bajo · Otros huérfanos.**

- **Cuáles:**
  - `Corrida.listas.{id,version}`;
  - `verdad_conocida` del B (`similitud_max`, `puntaje_riesgo`, `inconsistencias`, `motivos_escalamiento`);
  - `adversario.intenta` y `version_generador`;
  - los metadatos del lote B;
  - los textos de `ListasSchema`;
  - `topes_de_cobertura` del plan;
  - `cobertura.causal` en el payload del A.
- **Ajuste:**
  - `esLaListaDeLaCorrida` en `vitrina.ts`;
  - la verdad del caso B en su ficha;
  - receta, composición, política del revisor y versión del generador en la ficha de reproducibilidad;
  - nombres y fuente de las listas, y los topes, en «el mundo» del Plan;
  - una fila «causal» en la pausa del A;
  - lo que no se pinte se declara «registro del generador», con una prueba que lo lista.

**AU-S3-29 · Bajo · El binario `claude` lee su credencial del Llavero de macOS, y no hay matriz previa (casilla 8, regla 24).**

- **Qué pasa:** no sale ningún aviso y hubo un «sí» por lote, pero no una matriz «qué · para qué · aviso · cómo se
  deshace». Pasa desde el S1.
- **Ajuste:**
  - sección «Protecciones del sistema» en el ADR-002 con esa fila: qué (`claude -p` lee su credencial del Llavero) ·
    para qué (autenticar la suscripción) · aviso (ninguno) · cómo se deshace (`claude logout` o borrar el ítem «Claude
    Code-credentials»);
  - el «sí» del usuario registrado antes del próximo lote.

### 3. Campos sin consumidor (casilla 5)

| Tipo                                                                                                    | Con lector | Huérfanos                                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `coincidencias`                                                                                         | 7/12       | `listas_consultadas[].{fecha,id,version,vinculante}`                                              |
| `expediente`                                                                                            | 12/23      | `caso_id`, `tema`, `cita.regla`, `datos_usados`, `decision.*` (5), `listas_consultadas`, `plan`   |
| documento de rechazo B                                                                                  | 9/10       | `texto`                                                                                           |
| `CorridaSchema`                                                                                         | 8/10       | `listas.id`, `listas.version`                                                                     |
| Payload de pausa A (M-8)                                                                                | 9/10       | `cobertura.causal`                                                                                |
| Payload de pausa B                                                                                      | 11/16      | `extraccion.campos_faltantes`, `documentos`, `coincidencias`, `investigacion`, `puntaje`          |
| Transcripción                                                                                           | 15/45      | cabecera (8), `pregunta`, `ejemplo`, `obligatoria`, turnos (9); falta `restaurados` en el esquema |
| `contradicciones.json`                                                                                  | 0/12       | el archivo entero                                                                                 |
| `Revision`                                                                                              | 9/10       | `m1.advertencias`                                                                                 |
| Lote B: `verdad_conocida`                                                                               | 8/12       | `motivos_escalamiento`, `similitud_max`, `puntaje_riesgo`, `inconsistencias`                      |
| Lote B: nivel de lote                                                                                   | 11/22      | 11 campos de metadatos                                                                            |
| `ListasSchema`                                                                                          | —          | `nombre`, `aviso`, `listas[].nombre`, `fuente_simulada`, `entradas[].motivo`, `reglas_verdad`     |
| Esquema del plan                                                                                        | 8/9        | `topes_de_cobertura`                                                                              |
| Manifiesto de la vitrina                                                                                | 3/3        | `parcial` tiene lector, pero nunca se declara                                                     |
| `extraccion`, `investigacion`, `puntaje`, `guardia_salida` B, documento adverso A, plantilla de dominio | completos  | —                                                                                                 |

### 4. Guía heredada (casilla 6)

- 30 heredadas revisadas, idénticas al S2; 26 pueden pasar.
- No pueden pasar: b1 (AU-S3-02); v2, v3 y la fila de Brecha del bloque D (AU-S3-03).
- Con cita errónea: h2 (AU-S3-20) y j1 (AU-S3-21).
- El encabezado da una razón falsa (AU-S3-04).
- Conteos verificados: 59 pruebas (13 nuevas, 16 mejoradas, 30 heredadas) · ⭐ 23 · ⭐⭐ 4.

### 5. Entidades cableadas (casilla 7)

- **Hallazgos:** AU-S3-12 y AU-S3-24.
- **Aceptables, declaradas con su razón:** `DEMOS` y `SEGMENTO_DEMO` (ADR-014), `CATEGORIAS` por demo,
  `PRIMEROS_CON_PAGINA = 20` (decisión del usuario) y `CASOS_EN_TITULO`.
- Umbrales y nodos salen del plan.

### 6. Protecciones del sistema (casilla 8) y regla 25

- El código, los scripts y las pruebas no tocan Llavero, TCC, launchd, Touch ID, Automatización, cuentas ni
  certificados.
- El único caso es el binario `claude` (AU-S3-29).
- Regla 25 cumplida: el humo real solo corre con `PLANLANG_HUMO_REAL=1`; las pruebas usan el proveedor simulado.

### 7. Herramientas y dependencias (casilla 3)

Ninguna dependencia nueva y ninguna alternativa claramente superior que proponer.

### 8. Anotado de paso para la casilla 4

- AU-S3-08 y AU-S3-09.
- El manual en `:221`: «el veredicto del demo A», cuando la entrada ya tiene dos filas.
- `nunca[3]` de la ficha B («Deja que un documento cambie lo que hace») sobrepromete: el documento sí cambia la
  extracción y, con ella, la ruta.
