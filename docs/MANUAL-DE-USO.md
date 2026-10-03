# planlang — Manual de uso · User manual

> **Simulación · no operativo.** Todo lo que planlang procesa es sintético: casos, afiliados, médicos
> y planes de beneficios salen de un generador con semilla. Nada aquí opera casos reales.
>
> **Simulation · not operational.** Everything planlang processes is synthetic: cases, members,
> physicians and benefit plans come from a seeded generator. Nothing here runs real cases.

- [Español](#español)
- [English](#english)

---

## Español

### Qué es planlang

planlang convierte el plan de un proyecto de agentes de IA en un **contrato que se puede verificar**.
El plan dice qué decide el agente, qué puede salir mal, qué se supone y cómo se mide el éxito. Después,
un agente construido según ese plan corre sobre casos inventados cuya respuesta correcta ya se conoce, y
un verificador compara lo planeado con lo que pasó: **la brecha**. El informe publica también lo que
falló.

Se usa de dos maneras. La **vitrina** es un sitio de siete pantallas que se lee en el navegador: no tiene
servidor ni llama a ningún modelo, y todo lo que muestra se calculó antes y se comprobó al construirla. La
**terminal**, en la raíz del repositorio, sirve para validar planes, generar casos, correr lotes y producir
informes.

### Primeros pasos

1. Abre una terminal en la carpeta del repositorio.
2. Corre `pnpm install` (una vez). Instala las dependencias y activa la protección contra secretos.
3. Para el agente de Python: `cd agents && python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]" -c constraints.txt`
   (el `-c` instala exactamente las versiones con que se probó todo).
4. Para correr lotes reales necesitas Claude Code instalado y con tu sesión iniciada. **Nunca** pongas
   una clave de API en el repositorio.

### Validar un plan · desde el sprint 1

- **Qué hace:** revisa que el plan esté completo antes de construir nada. Rechaza, con el motivo, un
  criterio sin forma de medirse, un umbral sin señal, un riesgo grave sin mitigación, una regla que no
  se puede interpretar o una decisión que depende de sí misma. Un plan aprobado queda sellado con una
  huella: si alguien lo cambia después, se nota.
- **Cómo se usa:**
  1. `pnpm plan:validar --entrada <ruta-del-plan.json>`: lista los motivos de rechazo, si los hay.
  2. `pnpm plan:validar --entrada <plan> --aprobar --por "<tu nombre>" --el <AAAA-MM-DD> --salida plans/demo-a/vN.json`:
     aprueba y sella el plan.
  3. `pnpm plan:validar --verificar plans/demo-a/v1.2.json`: comprueba que un plan aprobado no cambió.
- **Las versiones del plan del demo A:**
  - la **v1.3** es la que publica la vitrina: solo cambió cómo se miden algunas cosas y escribió todo el plan
    en los dos idiomas, así que se lee sobre la corrida de la v1.2;
  - la **v1.4** añadió el respaldo «sin modelo, el caso va a una persona» (ver «Correr un lote») y con ella
    corrió el lote de 200;
  - las versiones 1, 1.1 y 1.2 se conservan como historia.
- **Limitaciones:** el plan se escribe a mano como archivo. El entrevistador que lo construye conversando
  llega en un sprint posterior.

### Generar casos sintéticos · desde el sprint 1

- **Qué hace:** crea casos de prueba inventados con su respuesta correcta conocida: casos normales, de
  borde, con datos faltantes y adversarios (instrucciones escondidas en el texto, datos sensibles,
  nombres parecidos). La misma semilla produce siempre los mismos casos.
- **Cómo se usa:**
  1. `pnpm casos:generar --semilla <texto> --n 20`: genera un lote de 20 (proporción 60/15/15/10).
  2. `pnpm casos:generar --versionados`: regenera los lotes del repositorio y comprueba que salen
     idénticos.
- **Privacidad:** antes de escribir, un validador comprueba que ningún identificador tenga formato real
  (cédulas, NIT, teléfonos, correos…). La afirmación de privacidad está en
  `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md`.
- **Lotes guardados en el repositorio:** el de 20 y el de prueba rápida se generaron con el plan v1.1, y el de
  200 con el v1.4. El de 20 es exactamente el primer bloque del de 200.
- **Limitaciones:** solo existe el dominio del demo A (autorizaciones médicas); el demo B llega después.

### Correr un lote · desde el sprint 1 (mejorado en el sprint 2)

- **Qué hace:** el agente del demo A decide cada caso: aprobar, negar o pasar a un auditor humano.
  Toda negación pasa por una persona; en el lote, esa persona se simula siguiendo la respuesta correcta
  del caso. Cada caso deja una traza con cada decisión, su señal y el umbral aplicado.
- **Cómo se usa:**
  1. Revisa en tu cuenta de Claude cuánta cuota te queda.
  2. `pnpm lote:demo --corrida <nombre-nuevo> --fecha <AAAA-MM-DD>`: corre los 20 casos con tu
     suscripción de Claude Code, con 2 segundos entre caso y caso. Sin `--plan`, usa el plan
     `plans/demo-a/v1.2.json` y el lote `data/casos/demo-a/planlang-a-001-20.json`: los de la corrida que
     publica la vitrina (para el plan v1.4, el paso 5). Tarda unos 5 minutos. Con la
     suscripción, el comando se niega a correr más casos por sesión de los que fija el plan (20) o a
     correr sin pausa.
  3. `pnpm lote:base --corrida <nombre-nuevo>-base --fecha <AAAA-MM-DD>`: la misma prueba con un solo
     agente, para comparar.
  4. Si se corta por límite de uso, vuelve a correr el mismo comando más tarde: retoma donde quedó, sin
     repetir casos.
  5. Para el lote de 200 con el plan v1.4, añade `--plan plans/demo-a/v1.4.json --casos
data/casos/demo-a/planlang-a-001-200.json` y repite el comando hasta completar los 200, de 20 en 20.
     Deja unos minutos entre una sesión y la siguiente.
- **Si el modelo no responde** (con el plan v1.4): cuando falla al extraer los datos o al preparar una
  aclaración, el caso no se inventa ni queda sin decisión, sino que pasa a una persona con todo lo que haya.
  La traza guarda qué falló y cuánto costó. Si lo que falla es la carta final, la decisión ya está tomada y
  el caso queda sin carta. Si se acaba la cuota, la sesión se detiene y el caso se reintenta después.
- **Dónde queda:** `runs/demo-a/<nombre>/`. Nunca se guardan claves ni identificadores de sesión.
- **Limitaciones:** los lotes se corren fuera de la integración continua, de a 20 y espaciados. El
  espejo en LangSmith solo se llena si su clave está en tu terminal (nunca en el repositorio).

### Leer el informe de brecha · desde el sprint 1

- **Qué hace:** compara el plan con lo que pasó en la corrida y escribe un informe en español y en
  inglés con nueve secciones: resumen para quien decide, el plan en breve, criterios, riesgos, brechas
  no previstas, supuestos, casos ejemplares, qué se puede explorar después y la ficha para
  reproducirlo. Dos ejecuciones sobre los mismos archivos dan exactamente el mismo informe.
- **Cómo se usa:**
  1. `pnpm brecha:informe --corrida runs/demo-a/<nombre>`: escribe `informe.json`, `informe.es.md` e
     `informe.en.md` dentro de la corrida. Si existen `<nombre>-base` o `<nombre>-r2`, `-r3`, las usa
     como línea base y como repeticiones.
  2. Abre `informe.es.md` (en VS Code: `Cmd+Shift+V` para verlo formateado).
- **Cómo leer los estados:** ✓ cumple · ✗ incumple · ◐ incompleto (faltan corridas) · ? indeterminado
  (hubo casos que no se pudieron evaluar) · — sin casos que lo prueben · ⚠ regla mal formada (el
  problema está en el plan, no en el agente).
- **Limitaciones:** el informe solo lee trazas cuyas huellas coinciden; si algo se alteró, se niega a
  medir y dice qué archivo falla.

### Verificar las corridas y el instrumento · desde el sprint 1

- `pnpm trazas:verificar`: revisa todas las corridas guardadas (huellas, que cada decisión se pueda
  reproducir desde el plan, que no haya credenciales).
- `pnpm m9:reporte`: siembra fallas a propósito en una corrida limpia y comprueba que el verificador las
  detecta todas. El resultado queda en `docs/kit-de-prueba/M9-brechas-sembradas.md`.

### Abrir la vitrina · desde el sprint 2

- **Qué hace:** muestra el demo A de punta a punta en siete pantallas, en español y en inglés, con tema
  oscuro y claro y en el teléfono o el escritorio. Toda pantalla lleva el rótulo «Simulación · no operativo ·
  datos sintéticos».
- **Cómo se abre:**
  1. `pnpm build` y después `pnpm start`. Abre en el navegador la dirección local que imprime.
  2. La portada elige el idioma de tu navegador. Puedes cambiarlo arriba a la derecha, igual que el tema.
  3. «Ver como líder» y «Ver como experto» cambian el nivel de detalle sin cambiar la pantalla: el líder lee
     frases cortas y el experto ve además las reglas, las señales y de dónde sale cada cifra.
- **Las siete pantallas:**
  - **Entrada:** qué es planlang, el veredicto del demo A y la capacidad medida, cada cifra con su origen.
  - **Plan:** las decisiones, los riesgos con su prioridad (y cuáles son control legal), los supuestos con su
    estado, los criterios con su regla, los umbrales con su señal y el contrato del grafo.
  - **Agente:** primero la ficha del agente y después el diagrama dibujado desde el grafo que corrió. Al tocar
    un nodo o una flecha ves qué hace, su código y los casos reales que pasaron por ahí.
  - **Brecha:** el informe completo, con lo que falló a la vista.
  - **Playground:** mover umbrales (abajo).
  - **Casos:** los 20 casos, uno por página, con su recorrido, las señales en cada flecha, la pausa con la
    persona, la carta y el documento de decisión adversa cuando lo hay.
  - **Fichas:** la ficha para repetir la corrida y las dos fichas que viajan a hoja-de-vida.
- **Limitaciones:**
  - La vitrina muestra la corrida de 20 casos (tres veces) con el plan v1.3. La corrida de 200 del plan v1.4
    queda guardada como dato y entra en la vitrina en un sprint posterior.
  - Las aclaraciones y cartas que escribió el modelo se muestran en el idioma en que se escribieron (español).

### Mover umbrales en el playground · desde el sprint 2

- **Qué hace:** te deja cambiar los umbrales del plan sobre las señales reales de la corrida y ver qué habría
  pasado: qué casos cambian de camino, cuántos errores se evitan o se introducen, cuántos minutos más o menos
  de revisión humana y qué criterios pasarían o fallarían. Con los valores del plan reproduce exactamente el
  informe.
- **Cómo se usa:**
  1. Abre «Playground».
  2. Mueve la confianza mínima de extracción (U1, de 0,50 a 0,95), el umbral de alto costo (U2, de 200 a
     5.000) o el máximo de aclaraciones (U3, de 0 a 4).
  3. Lee los casos que cambian y abre cualquiera para ver su recorrido. La curva riesgo-cobertura marca dónde
     está el plan.
- **El modo Texas (U4)** obliga a que ninguna determinación adversa sea automática. En esta corrida
  encenderlo no cambia ningún caso, porque toda propuesta adversa ya pasaba por una persona, y la pantalla
  lo explica.
- **Limitaciones:** fuera del rango que se observó en la corrida, el resultado se marca «no observado». Los
  criterios que dependen de lo que pasó después de un cambio quedan sin poder medirse en el caso que cambia:
  la traza no registró lo que no ocurrió.

### Las fichas · desde el sprint 2

- **Qué hace:** produce tres fichas.
  - La **de reproducibilidad** tiene versiones, huellas, semilla, modelo, fecha y los pasos para repetir la
    corrida.
  - La **de la app** sale de `docs/brochure-export.json`; hoja-de-vida la arma con su propio diseño.
  - La **del agente A** está en `content/agentes/planlang-demo-a.ficha-tecnica.json`.

  Las dos que viajan se validan contra el contrato de hoja-de-vida antes de escribirse.

- **Cómo se usa:** `pnpm fichas` las regenera; `pnpm fichas --verificar` solo dice si alguna está desactualizada.
- **Limitaciones:** las fichas que viajan van en español, porque así lo pide el contrato de hoja-de-vida. En
  planlang también existen en inglés.

### Entregar el paquete a hoja-de-vida · desde el sprint 2

- **Qué hace:** `pnpm paquete:vitrina` arma la vitrina como paquete estático para tu hoja de vida.
  1. Primero comprueba que se puede publicar: el instrumento detecta las fallas sembradas, las corridas
     verifican, el diagrama es el grafo y el playground reproduce el informe.
  2. Luego la construye bajo `/piezas/planlang`, sin Sentry y sin enlaces a otro sitio.
  3. Por último barre cada dirección y escribe un manifiesto con la huella de cada archivo.
- **Cómo se usa:**
  1. Desde `main`, sin cambios sin commit, corre `pnpm paquete:vitrina --hoja-de-vida <ruta de tu hoja-de-vida>`.
     El resultado queda en `dist/paquete-hoja-de-vida/`, con la misma forma que el repositorio de hoja-de-vida
     (`public/piezas/planlang/`, `content/`, `data/fichas/`). Con `--hoja-de-vida` el script lee (solo lee) la ficha
     que ya tienes allá y conserva su roadmap.
  2. Corre `pnpm test:e2e:paquete`: recorre todas las páginas del paquete como las serviría hoja-de-vida.
  3. En hoja-de-vida, **borra `public/piezas/planlang/`** y luego copia las carpetas del paquete. Copiar encima de
     una entrega anterior dejaría archivos viejos publicados.
  4. Corre `pnpm paquete:verificar --en <ruta de tu hoja-de-vida>`: comprueba que cada archivo llegó con su huella y
     que no sobra ninguno. Adjunta `dist/paquete-hoja-de-vida/manifiesto.json` a tu PR de contenido.
- **Limitaciones:** hoja-de-vida decide en qué página se muestra; planlang no publica ninguna dirección de
  producción. El script se niega a armar el paquete con cambios sin commit (`--permitir-arbol-sucio` lo arma para
  probar, pero ese no se entrega).

### Preguntas frecuentes

- **¿Por qué el informe dice «cumple con alertas» si se cumplieron todos los criterios?** Porque el
  veredicto no mira solo los criterios: también los supuestos, los riesgos y las fallas que el plan no
  previó. En el informe que publica la vitrina, el supuesto S3 quedó refutado, el S1 no se pudo probar y
  aparecieron 5 fallas no previstas. Lo que no se pudo medir también es una alerta, nunca un silencio.
- **¿Puedo cambiar un umbral y ver qué habría pasado?** Sí, en el playground de la vitrina (arriba).
- **¿Y con 200 casos?** El informe de la corrida de 200 del plan v1.4 está en
  `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/informe.es.md`: con más casos el supuesto S1 quedó
  confirmado y el S2 refutado.

---

## English

### What planlang is

planlang turns the plan of an AI-agent project into a **contract that can be checked**. The plan
states what the agent decides, what can go wrong, what is assumed and how success is measured. An
agent built from that plan then runs on made-up cases whose right answer is already known, and a
verifier compares what was planned with what happened: **the gap**. The report also publishes what
failed.

There are two ways to use it. The **showcase** is a seven-screen site read in the browser: it has no server
and calls no model, and everything it shows was computed beforehand and checked when it was built. The
**terminal**, at the repository root, is for validating plans, generating cases, running batches and
producing reports.

### Getting started

1. Open a terminal in the repository folder.
2. Run `pnpm install` (once). It installs the dependencies and turns on the secret guard.
3. For the Python agent: `cd agents && python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]" -c constraints.txt`
   (the `-c` installs exactly the versions everything was tested with).
4. Real batches need Claude Code installed and signed in. **Never** put an API key in the repository.

### Validate a plan · since sprint 1

- **What it does:** checks the plan is complete before anything is built. It rejects, with the reason,
  a criterion with no way to be measured, a threshold with no signal, a serious risk with no
  mitigation, a rule that cannot be read or a decision that depends on itself. An approved plan is
  sealed with a fingerprint: any later change shows.
- **How to use it:**
  1. `pnpm plan:validar --entrada <plan-path.json>`: lists the rejection reasons, if any.
  2. `pnpm plan:validar --entrada <plan> --aprobar --por "<your name>" --el <YYYY-MM-DD> --salida plans/demo-a/vN.json`:
     approves and seals the plan.
  3. `pnpm plan:validar --verificar plans/demo-a/v1.2.json`: checks an approved plan did not change.
- **Demo A's plan versions:**
  - **v1.3** is the one the showcase publishes: it only changed how some things are measured and wrote the
    whole plan in both languages, so it is read over the v1.2 run;
  - **v1.4** added the fallback "no model, the case goes to a person" (see "Run a batch"), and the 200-case
    batch ran with it;
  - versions 1, 1.1 and 1.2 are kept as history.
- **Limitations:** the plan is written by hand as a file. The interviewer that builds it through a
  conversation comes in a later sprint.

### Generate synthetic cases · since sprint 1

- **What it does:** creates made-up test cases with a known right answer: normal cases, edge cases,
  cases with missing data and adversarial ones (instructions hidden in the text, sensitive data,
  look-alike names). The same seed always produces the same cases.
- **How to use it:**
  1. `pnpm casos:generar --semilla <text> --n 20`: generates a batch of 20 (60/15/15/10 mix).
  2. `pnpm casos:generar --versionados`: regenerates the repository's batches and checks they come out
     identical.
- **Privacy:** before writing, a validator checks that no identifier looks real (national IDs, tax IDs,
  phone numbers, emails…). The privacy statement is in `data/casos/demo-a/AFIRMACION-DE-PRIVACIDAD.md`.
- **Batches stored in the repository:** the 20-case and the quick-test batches were generated with plan
  v1.1, and the 200-case batch with v1.4. The 20-case batch is exactly the first block of the 200.
- **Limitations:** only demo A's domain exists (medical prior authorizations); demo B comes later.

### Run a batch · since sprint 1 (improved in sprint 2)

- **What it does:** demo A's agent decides each case: approve, deny or hand it to a human auditor. Every
  denial goes to a person; in a batch, that person is simulated and follows the case's right answer.
  Each case leaves a trace with every decision, its signal and the threshold applied.
- **How to use it:**
  1. Check how much quota you have left in your Claude account.
  2. `pnpm lote:demo --corrida <new-name> --fecha <YYYY-MM-DD>`: runs the 20 cases with your Claude
     Code subscription, leaving 2 seconds between cases. Without `--plan`, it uses the plan
     `plans/demo-a/v1.2.json` and the batch `data/casos/demo-a/planlang-a-001-20.json`: those of the run the
     showcase publishes (for plan v1.4, step 5). It takes about 5 minutes. With the
     subscription, the command refuses to run more cases per session than the plan allows (20) or to
     run them back to back.
  3. `pnpm lote:base --corrida <new-name>-base --fecha <YYYY-MM-DD>`: the same test with a single agent,
     to compare.
  4. If it stops at a usage limit, run the same command later: it resumes where it stopped, without
     repeating cases.
  5. For the 200-case batch with plan v1.4, add `--plan plans/demo-a/v1.4.json --casos
data/casos/demo-a/planlang-a-001-200.json` and repeat the command until all 200 are done, 20 at a time.
     Leave a few minutes between one session and the next.
- **If the model does not respond** (with plan v1.4): when it fails while extracting the details or
  preparing a clarification, the case is not made up or left without a decision; it goes to a person with
  whatever there is. The trace keeps what failed and what it cost. If it is the final letter that fails, the
  decision is already made and the case is left without a letter. If the quota runs out, the session stops
  and the case is retried later.
- **Where it goes:** `runs/demo-a/<name>/`. Keys and session identifiers are never stored.
- **Limitations:** batches run outside continuous integration, 20 at a time and spaced out. The
  LangSmith mirror only fills if its key is in your terminal (never in the repository).

### Read the gap report · since sprint 1

- **What it does:** compares the plan with what happened in the run and writes a report in Spanish and
  English with nine sections: summary for the decision-maker, the plan in brief, criteria, risks,
  unforeseen gaps, assumptions, example cases, what can be explored later and the record to reproduce
  it. Two runs over the same files give exactly the same report.
- **How to use it:**
  1. `pnpm brecha:informe --corrida runs/demo-a/<name>`: writes `informe.json`, `informe.es.md` and
     `informe.en.md` inside the run. If `<name>-base` or `<name>-r2`, `-r3` exist, it uses them as the
     baseline and as repetitions.
  2. Open `informe.en.md` (in VS Code: `Cmd+Shift+V` to see it formatted).
- **How to read the statuses:** ✓ met · ✗ not met · ◐ incomplete (runs missing) · ? undetermined (some
  cases could not be evaluated) · — no case tests it · ⚠ malformed rule (the problem is in the plan,
  not in the agent).
- **Limitations:** the report only reads traces whose fingerprints match; if something was altered, it
  refuses to measure and names the failing file.

### Check the runs and the instrument · since sprint 1

- `pnpm trazas:verificar`: checks every stored run (fingerprints, that each decision can be reproduced
  from the plan, that there are no credentials).
- `pnpm m9:reporte`: plants failures on purpose in a clean run and checks the verifier catches all of
  them. The result goes to `docs/kit-de-prueba/M9-brechas-sembradas.md`.

### Open the showcase · since sprint 2

- **What it does:** shows demo A end to end in seven screens, in Spanish and English, in dark and light
  themes, on a phone or a desktop. Every screen carries the label "Simulation · not operational · synthetic
  data".
- **How to open it:**
  1. `pnpm build`, then `pnpm start`. Open the local address it prints in your browser.
  2. The home page picks your browser's language. You can switch it at the top right, like the theme.
  3. "View as lead" and "View as expert" change the level of detail without changing the screen: the lead
     reads short sentences and the expert also sees the rules, the signals and where each figure comes from.
- **The seven screens:**
  - **Home:** what planlang is, demo A's verdict and its measured capability, each figure with its source.
  - **Plan:** the decisions, the risks with their priority (and which ones are legal controls), the
    assumptions with their status, the criteria with their rule, the thresholds with their signal and the
    graph contract.
  - **Agent:** first the agent's record, then the diagram drawn from the graph that ran. Tap a node or an
    arrow to see what it does, its code and the real cases that went through it.
  - **Gap:** the full report, with what failed in plain sight.
  - **Playground:** move thresholds (below).
  - **Cases:** the 20 cases, one per page, with their path, the signals on each arrow, the pause with the
    person, the letter and the adverse-decision document when there is one.
  - **Records:** the record to repeat the run and the two records that travel to hoja-de-vida.
- **Limitations:**
  - The showcase shows the 20-case run (three times over) with plan v1.3. The 200-case run of plan v1.4 is
    stored as data and comes into the showcase in a later sprint.
  - The clarifications and letters the model wrote are shown in the language they were written in (Spanish).

### Move thresholds in the playground · since sprint 2

- **What it does:** lets you change the plan's thresholds over the run's real signals and see what would
  have happened: which cases change path, how many errors are avoided or introduced, how many minutes more
  or less of human review and which criteria would pass or fail. With the plan's values it reproduces the
  report exactly.
- **How to use it:**
  1. Open "Playground".
  2. Move the minimum extraction confidence (U1, 0.50 to 0.95), the high-cost threshold (U2, 200 to 5,000)
     or the clarification limit (U3, 0 to 4).
  3. Read the cases that change and open any of them to see its path. The risk-coverage curve marks where the
     plan sits.
- **Texas mode (U4)** makes sure no adverse determination is automatic. In this run, turning it on changes no
  case, because every adverse proposal already went to a person, and the screen explains it.
- **Limitations:** outside the range seen in the run, the result is marked "not observed". Criteria that
  depend on what happened after a change cannot be measured in the case that changes: the trace did not
  record what did not happen.

### The records · since sprint 2

- **What it does:** produces three records.
  - The **reproducibility** record has versions, fingerprints, seed, model, date and the steps to repeat
    the run.
  - The **app** record comes from `docs/brochure-export.json`; hoja-de-vida builds it with its own design.
  - The **agent A** record is in `content/agentes/planlang-demo-a.ficha-tecnica.json`.

  The two that travel are checked against hoja-de-vida's contract before they are written.

- **How to use it:** `pnpm fichas` regenerates them; `pnpm fichas --verificar` only says whether one is out
  of date.
- **Limitations:** the records that travel are in Spanish, because hoja-de-vida's contract asks for that.
  In planlang they also exist in English.

### Hand the package to hoja-de-vida · since sprint 2

- **What it does:** `pnpm paquete:vitrina` builds the showcase as a static package for your CV site.
  1. First it checks it can be published: the instrument catches the planted failures, the runs verify,
     the diagram is the graph and the playground reproduces the report.
  2. Then it builds it under `/piezas/planlang`, without Sentry and without links to any other site.
  3. Finally it sweeps every address and writes a manifest with each file's fingerprint.
- **How to use it:**
  1. From `main`, with nothing uncommitted, run `pnpm paquete:vitrina --hoja-de-vida <path to your hoja-de-vida>`.
     The result goes to `dist/paquete-hoja-de-vida/`, shaped like the hoja-de-vida repository
     (`public/piezas/planlang/`, `content/`, `data/fichas/`). With `--hoja-de-vida` the script reads (only reads)
     the record you already have there and keeps its roadmap.
  2. Run `pnpm test:e2e:paquete`: it walks every page of the package the way hoja-de-vida would serve it.
  3. In hoja-de-vida, **delete `public/piezas/planlang/`** and then copy the package folders. Copying over an
     earlier delivery would leave old files published.
  4. Run `pnpm paquete:verificar --en <path to your hoja-de-vida>`: it checks every file arrived with its
     fingerprint and none is left over. Attach `dist/paquete-hoja-de-vida/manifiesto.json` to your content PR.
- **Limitations:** hoja-de-vida decides which page shows it; planlang publishes no production address. The script
  refuses to build the package with uncommitted changes (`--permitir-arbol-sucio` builds it for testing, but that one
  is not delivered).

### Frequently asked questions

- **Why does the report say “met with alerts” when every criterion was met?** Because the verdict
  looks beyond the criteria: at the assumptions, the risks and the failures the plan did not foresee. In
  the report the showcase publishes, assumption S3 was refuted, S1 could not be tested and 5 unforeseen
  failures showed up. Whatever could not be measured is an alert too, never a silence.
- **Can I change a threshold and see what would have happened?** Yes, in the showcase playground (above).
- **And with 200 cases?** The report of plan v1.4's 200-case run is in
  `runs/demo-a/suscripcion-planlang-a-001-200-v1.4/informe.en.md`: with more cases, assumption S1 was
  confirmed and S2 was refuted.

---

## Historial · History

| Sprint          | Features añadidas a este manual · Features added to this manual                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1 · 2026-09-27 | Validar un plan · generar casos sintéticos · correr un lote de 20 · leer el informe de brecha · verificar corridas e instrumento                                                     |
| S2 · 2026-10-02 | Abrir la vitrina (7 pantallas) · mover umbrales en el playground · las fichas · entregar el paquete a hoja-de-vida · lote de 200 y respaldo sin modelo (mejorado) · plan v1.3 y v1.4 |
