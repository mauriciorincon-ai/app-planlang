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

Hay dos demos, cada uno con su plan, su agente y su informe:

- el **A** autoriza servicios de salud;
- el **B** vincula clientes con debida diligencia, y su plan salió del **entrevistador**.

Se usa de dos maneras:

- La **vitrina** es un sitio que se lee en el navegador, con siete pantallas por demo. No tiene servidor ni llama a
  ningún modelo: todo lo que muestra se calculó antes y se comprobó al construirla.
- La **terminal**, en la raíz del repositorio, sirve para entrevistar y validar planes, generar casos, correr lotes y
  producir informes.

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
  - la **v1.5** es la que publica la vitrina desde el sprint 3. Añade la **aprobación en parte**: si el costo supera
    el tope que el plan de beneficios cubre para ese servicio, se aprueba hasta el tope y el excedente se niega. Además,
    el caso con una instrucción escondida pasa a una persona. Con ella corrió el lote de 200 que publica la vitrina;
  - la **v1.4** añadió el respaldo «sin modelo, el caso va a una persona» (ver «Correr un lote»);
  - las versiones 1 a 1.3 se conservan como historia.
- **El plan del demo B** se construyó con el entrevistador (abajo): la **v1** es la aprobada y la **v1.1** solo cambia
  cómo se mide y redacta en inglés lo que faltaba. La vitrina del B se mide con la v1.1.
- **Limitaciones:** el plan del A se escribió a mano como archivo; el del B, conversando.

### Entrevistar un plan · desde el sprint 3

- **Qué hace:**
  - El entrevistador te hace, en orden fijo, las preguntas de la plantilla del dominio: quién participa, el flujo,
    las decisiones que no se pueden deshacer, los riesgos con su severidad, los supuestos, los criterios con su
    forma de medirse, los umbrales con su señal (la zona gris incluida), el contrato del grafo y los lotes. Cada
    pregunta trae un ejemplo.
  - Con tus respuestas redacta un **borrador** del plan en español y en inglés.
  - Al terminar, lo revisa: lo que le falta para aprobarse y las **contradicciones**. Por ejemplo, un riesgo grave
    sin criterio que lo controle, o una pausa humana sin umbral que la dispare.
  - **Nunca aprueba por ti.**
- **Cómo se usa:**
  1. `pnpm entrevistar --demo b`: las preguntas aparecen en la terminal y respondes escribiendo. Si lo dejas a
     medias, `pnpm entrevistar --demo b --retomar` vuelve a las preguntas pendientes.
  2. Al terminar quedan, en `plans/demo-b/`, el borrador (`v0-borrador.json`), las contradicciones
     (`contradicciones.json`) y una revisión para leer (`revision.es.md` y `revision.en.md`).
  3. Lee la revisión. Si estás de acuerdo, apruébalo:
     `pnpm plan:aprobar --demo b --por "<tu nombre>" --el <AAAA-MM-DD>`. Escribe `plans/demo-b/v1.json` sellado
     con su huella.
  4. Si quedan contradicciones, el comando se niega a aprobar. Aceptarlas es tu decisión: se hace con
     `--con-contradicciones` y queda registrado.
  5. Si el plan ya está aprobado (`v1.json` existe), la entrevista no escribe en `plans/demo-b/`: esa carpeta es el
     registro de lo que aprobaste. Indícale otra con `--salida <carpeta>` y allí quedan el borrador, las
     contradicciones y la revisión. `plan:aprobar` no la convierte en `v1.json`, que ya existe.
- **Los idiomas:** tu respuesta queda tal cual, en el idioma en que la escribiste. El otro idioma lo redacta el
  modelo y queda marcado como suyo, para que lo revises antes de aprobar. Sin modelo (`--sin-modelo`), el otro
  idioma queda pendiente.
- **Limitaciones:** solo existen las plantillas de los dos dominios de los demos. La entrevista del plan B de este
  repositorio se corrió por delegación: las respuestas las escribió el constructor y el autor aprobó el plan con
  su frase, registrada en la bitácora del sprint 3.

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
- **Lotes guardados en el repositorio:**
  - demo A: el de 20 y el de prueba rápida se generaron con el plan v1.1, y el de 200 que publica la vitrina
    (`planlang-a-002-200`) con el v1.5, que siembra también casos sobre el tope de cobertura;
  - demo B: el de 20 y el de 200 (`planlang-b-001-20` y `planlang-b-001-200`), con las listas sintéticas de
    `data/listas/demo-b.json`. `pnpm casos:generar --versionados --demo b` los regenera y comprueba que salen
    idénticos.
- **Limitaciones:** los nombres de las listas del B son composiciones inventadas con semilla; el validador de
  identificadores también las revisa.

### Correr un lote · desde el sprint 1 (mejorado en el sprint 3)

- **Qué hace:** el agente del demo A decide cada caso: aprobar, negar o pasar a un auditor humano.
  Toda negación pasa por una persona; en el lote, esa persona se simula siguiendo la respuesta correcta
  del caso. Cada caso deja una traza con cada decisión, su señal y el umbral aplicado.
- **Cómo se usa:**
  1. Revisa en tu cuenta de Claude cuánta cuota te queda.
  2. `pnpm lote:demo --corrida <nombre-nuevo> --fecha <AAAA-MM-DD>`: corre los 20 casos con tu
     suscripción de Claude Code, con 2 segundos entre caso y caso. Sin `--plan`, usa el plan
     `plans/demo-a/v1.2.json` y el lote `data/casos/demo-a/planlang-a-001-20.json`, los de la primera corrida
     del demo; para la que publica la vitrina, el paso 5. Tarda unos 5 minutos. Con la
     suscripción, el comando se niega a correr más casos por sesión de los que fija el plan (20) o a
     correr sin pausa.
  3. `pnpm lote:base --corrida <nombre-nuevo>-base --fecha <AAAA-MM-DD>`: la misma prueba con un solo
     agente, para comparar.
  4. Si se corta por límite de uso, vuelve a correr el mismo comando más tarde: retoma donde quedó, sin
     repetir casos.
  5. Para el lote de 200 con el plan v1.5 (con el que corrió la corrida que publica la vitrina; la vitrina la mide con
     el v1.5.1, que solo corrige la redacción), añade `--plan plans/demo-a/v1.5.json --casos
data/casos/demo-a/planlang-a-002-200.json` y repite el comando hasta completar los 200, de 20 en 20. Deja unos
     minutos entre una sesión y la siguiente.
  6. Para ver un solo caso de punta a punta en un par de minutos, añade `--caso <id>` (por ejemplo `--caso A-016`).
- **Si el modelo no responde** (desde el plan v1.4): cuando falla al extraer los datos o al preparar una
  aclaración, el caso no se inventa ni queda sin decisión, sino que pasa a una persona con todo lo que haya.
  La traza guarda qué falló y cuánto costó. Si lo que falla es la carta final, la decisión ya está tomada y
  el caso queda sin carta. Si se acaba la cuota, la sesión se detiene y el caso se reintenta después.
- **Dónde queda:** `runs/demo-a/<nombre>/`. Nunca se guardan claves ni identificadores de sesión.
- **Limitaciones:** los lotes se corren fuera de la integración continua, de a 20 y espaciados. El
  espejo en LangSmith solo se llena si su clave está en tu terminal (nunca en el repositorio).

### Correr el demo B · desde el sprint 3

- **Qué hace:** el agente del demo B decide si un cliente se vincula. Recibe la solicitud con sus documentos:
  - un extractor lee los documentos;
  - el verificador de listas busca el nombre en listas vinculantes y de consulta, por coincidencia exacta y por
    parecido;
  - un investigador mira el contexto, pero solo cuando el parecido cae en la zona gris del plan;
  - un puntaje de riesgo se calcula por reglas, sin leer atributos protegidos;
  - con eso propone aprobar, revisar o rechazar.

  Todo rechazo y todo riesgo alto pasan por una persona (el oficial de cumplimiento, simulado en los lotes).

- **Cómo se usa:**
  1. `pnpm lote:demo-b --corrida <nombre-nuevo> --fecha <AAAA-MM-DD>` corre los 20 casos de
     `data/casos/demo-b/planlang-b-001-20.json` con el plan `plans/demo-b/v1.json`, con tu suscripción y con pausa
     entre casos.
  2. `pnpm lote:demo-b --caso B-010 --corrida <nombre-nuevo> --fecha <AAAA-MM-DD>` corre un solo caso.
  3. `pnpm brecha:informe --corrida runs/demo-b/<nombre> --plan plans/demo-b/v1.1.json` escribe su informe, medido
     con la v1.1.
- **Limitaciones:**
  - las listas son sintéticas;
  - el plan B no declara respaldo por proveedor: si el modelo no responde, el caso no se decide y se reintenta;
  - el plan B no declara costo humano por caso, así que su playground cuenta casos, no minutos;
  - la vitrina del B publica su corrida de 20.

### Leer un expediente · desde el sprint 3

- **Qué hace:** cada caso del demo B termina en un **expediente** que escribe el código, no el modelo, en español y
  en inglés. Trae:
  - las conclusiones, numeradas: cada una cita la regla del plan o la coincidencia en una lista, con su versión y su
    fecha;
  - la decisión;
  - si fue un rechazo, el documento con su aviso de IA y cómo contradecirlo.
- **Cómo se lee:** en la vitrina, abre el demo B (el conmutador «A · B» de la barra) y luego «Casos». Por ejemplo,
  `/es/demo-b/caso/B-010`. «Recibe» muestra los documentos tal como llegaron, con la instrucción escondida marcada
  aparte si la hay. El expediente va al final del recorrido.
- **Limitaciones:** el texto del investigador lo escribió el modelo y se muestra en el idioma en que lo escribió.

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
- **Cómo leer los estados:** ✓ cumple · ✗ incumple · ◐ incompleto (faltan corridas: un criterio que pide varias
  corridas seguidas y se midió con menos queda incompleto, y se dice. Si el plan limita esas corridas a un tamaño de
  lote, rigen solo ahí: la C5 del A pide tres solo en los lotes de 20, así que en el de 200 se mide en una corrida y la
  nota del informe lo explica) · ? indeterminado
  (hubo casos que no se pudieron evaluar) · — sin casos que lo prueben · ⚠ regla mal formada (el
  problema está en el plan, no en el agente).
- **Las decisiones que no se pueden deshacer** dicen en el informe qué se eligió, si el plan escribió la opción en
  los dos idiomas (los planes v1.1 y v1.2 la escribieron solo en español: ahí el informe no la inventa en inglés).
- **Limitaciones:** el informe solo lee trazas cuyas huellas coinciden; si algo se alteró, se niega a
  medir y dice qué archivo falla.

### Verificar las corridas y el instrumento · desde el sprint 1

- `pnpm trazas:verificar`: revisa todas las corridas guardadas (huellas, que cada decisión se pueda
  reproducir desde el plan, que no haya credenciales).
- `pnpm m9:reporte`: siembra fallas a propósito en una corrida limpia y comprueba que el verificador las
  detecta todas. El resultado queda en `docs/kit-de-prueba/M9-brechas-sembradas.md`.

### Abrir la vitrina · desde el sprint 2 (mejorado en el sprint 3)

- **Qué hace:** muestra los dos demos de punta a punta, siete pantallas cada uno, en español y en inglés, con tema
  oscuro y claro y en el teléfono o el escritorio. Toda pantalla lleva el rótulo «Simulación · no operativo ·
  datos sintéticos». La entrada tiene una fila por demo. Dentro de un demo, el conmutador «A · B» de la barra cambia
  de demo: el A vive en `/es/plan`, `/es/agente`…, y el B en `/es/demo-b/plan`, `/es/demo-b/agente`…
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
  - **Casos:** uno por página, con su recorrido, las señales en cada flecha, la pausa con la persona, la carta y el
    documento de decisión adversa cuando lo hay (en el B, el expediente). En el A, que publica 200 casos, tienen
    página los 20 primeros y los que el informe nombra. Los demás aparecen sin enlace, con borde punteado, en la
    Brecha y en el Playground.
  - **Fichas:** la ficha para repetir la corrida y las dos fichas que viajan a hoja-de-vida.
- **Limitaciones:**
  - El demo A publica la corrida de 200 del plan v1.5, con su línea base de un solo agente. El Agente lista las
    trazas de los 20 primeros casos y cuenta los demás.
  - El demo B publica su corrida de 20.
  - Las aclaraciones y cartas que escribió el modelo se muestran en el idioma en que se escribieron (español).

### Mover umbrales en el playground · desde el sprint 2

- **Qué hace:** te deja cambiar los umbrales del plan sobre las señales reales de la corrida y ver qué habría
  pasado: qué casos cambian de camino, cuántos errores se evitan o se introducen, cuántos minutos más o menos
  de revisión humana y qué criterios pasarían o fallarían. Con los valores del plan reproduce exactamente el
  informe. El cálculo corre en tu navegador, sin llamar a ningún modelo, y da el mismo resultado en los motores
  de Chrome, Firefox y Safari.
- **Cómo se usa:**
  1. Abre «Playground».
  2. Mueve la confianza mínima de extracción (U1, de 0,50 a 0,95), el umbral de alto costo (U2, de 200 a
     5.000) o el máximo de aclaraciones (U3, de 0 a 4).
  3. Lee los casos que cambian y abre cualquiera con «ver su traza»: el caso se abre en el paso donde su camino
     se separa del que tomó el agente. La curva riesgo-cobertura marca dónde está el plan.
- **El modo Texas (U4)** obliga a que ninguna determinación adversa sea automática, ni siquiera la parcial. En la
  corrida de 200, encenderlo manda a una persona las nueve aprobaciones en parte. La pantalla dice que es la
  revisión que el modo Texas exige, no una de más.
- **En el demo B** se mueven cuatro umbrales: la similitud con una lista, el inicio de la zona gris del investigador,
  el puntaje de riesgo y las inconsistencias. No hay modo Texas, y se cuentan casos, no minutos.
- **Limitaciones:** fuera del rango que se observó en la corrida, el resultado se marca «no observado». Los
  criterios que dependen de lo que pasó después de un cambio quedan sin poder medirse en el caso que cambia:
  la traza no registró lo que no ocurrió.

### Las fichas · desde el sprint 2

- **Qué hace:** produce una ficha de reproducibilidad por demo y tres fichas que viajan.
  - La **de reproducibilidad** tiene versiones, huellas, semilla, modelo, fecha y los pasos para repetir la
    corrida.
  - La **de la app** sale de `docs/brochure-export.json` y suma los dos demos; hoja-de-vida la arma con su propio
    diseño.
  - La **del agente A** y la **del agente B** están en `content/agentes/planlang-demo-a.ficha-tecnica.json` y
    `content/agentes/planlang-demo-b.ficha-tecnica.json`.

  Las que viajan se validan contra el contrato de hoja-de-vida antes de escribirse.

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

### Publicar el design system · desde el sprint 3

- **Qué hace:** publica en Claude Design el sistema de diseño consolidado de la app (colores, tipografía,
  componentes y las vistas de los dos demos), como activo estable entre ciclos.
- **Cómo se usa:**
  1. Se hace **después** del gate corto ⭐⭐ del cierre: no se publica un sistema que el autor no ha juzgado.
  2. En Claude Code, el autor escribe `/design-sync`; el constructor arma y publica.
  3. El destino está en `design-sync/project.json`. Antes de publicar se ve la lista exacta de archivos.
- **De dónde sale:** `design-system.md` es la fuente; `design-sync/` es el paquete que se publica, al día en cada
  sprint con pantallas. El proyecto remoto nunca se edita allá.
- **Limitaciones:** solo lo dispara el autor; si decide no publicarlo, el resumen del sprint lo registra.

### Preguntas frecuentes

- **¿Por qué el informe dice «cumple con alertas»?** Porque el veredicto no mira solo los criterios: también los
  supuestos, los riesgos y las fallas que el plan no previó. En el informe que publica la vitrina del A:
  - los supuestos S2 y S3 quedaron refutados;
  - aparecieron fallas que vio un evaluador y ningún riesgo del plan cubría.

  Lo que no se pudo medir también es una alerta, nunca un silencio.

- **¿Por qué algunos casos no tienen página?** Una página por caso de la corrida de 200 llevaría el paquete de la
  vitrina de unos 30 MB a más de 100. Tienen página los 20 primeros y los que el informe nombra. Los demás siguen en
  la corrida, con su traza y su huella.
- **¿Puedo cambiar un umbral y ver qué habría pasado?** Sí, en el playground de la vitrina (arriba).

---

## English

### What planlang is

planlang turns the plan of an AI-agent project into a **contract that can be checked**. The plan
states what the agent decides, what can go wrong, what is assumed and how success is measured. An
agent built from that plan then runs on made-up cases whose right answer is already known, and a
verifier compares what was planned with what happened: **the gap**. The report also publishes what
failed.

There are two demos, each with its own plan, agent and report:

- **A** authorizes health services;
- **B** onboards customers with due diligence, and its plan came out of the **interviewer**.

There are two ways to use it:

- The **showcase** is a site read in the browser, with seven screens per demo. It has no server and calls no model:
  everything it shows was computed beforehand and checked when it was built.
- The **terminal**, at the repository root, is for interviewing and validating plans, generating cases, running
  batches and producing reports.

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
  - **v1.5** is the one the showcase publishes since sprint 3. It adds **partial approval**: when the cost is above
    the cap the benefits plan covers for that service, the service is approved up to the cap and the excess is
    denied. A case carrying a hidden instruction also goes to a person. The 200-case batch the showcase publishes
    ran with it;
  - **v1.4** added the fallback "no model, the case goes to a person" (see "Run a batch");
  - versions 1 to 1.3 are kept as history.
- **Demo B's plan** was built with the interviewer (below): **v1** is the approved one, and **v1.1** only changes how
  things are measured and writes in English what was missing. Demo B's showcase is measured with v1.1.
- **Limitations:** demo A's plan was written by hand as a file; demo B's, through a conversation.

### Interview a plan · since sprint 3

- **What it does:**
  - The interviewer asks you, in a fixed order, the questions in the domain template: who takes part, the flow,
    the decisions that cannot be undone, the risks with their severity, the assumptions, the criteria with how they
    are measured, the thresholds with their signal (the gray zone included), the graph contract and the batches.
    Each question comes with an example.
  - From your answers it drafts the plan in Spanish and English.
  - When it is done, it reviews the draft: what is still missing for approval, and the **contradictions**. For
    example, a serious risk with no criterion to control it, or a human pause with no threshold to trigger it.
  - **It never approves for you.**
- **How to use it:**
  1. `pnpm entrevistar --demo b`: the questions show up in the terminal and you answer by typing. If you stop
     halfway, `pnpm entrevistar --demo b --retomar` goes back to the pending questions.
  2. When it finishes, `plans/demo-b/` holds the draft (`v0-borrador.json`), the contradictions
     (`contradicciones.json`) and a review to read (`revision.es.md` and `revision.en.md`).
  3. Read the review. If you agree, approve it:
     `pnpm plan:aprobar --demo b --por "<your name>" --el <YYYY-MM-DD>`. It writes `plans/demo-b/v1.json`, sealed
     with its fingerprint.
  4. If contradictions remain, the command refuses to approve. Accepting them is your call: you do it with
     `--con-contradicciones`, and it gets recorded.
  5. If the plan is already approved (`v1.json` exists), the interview does not write to `plans/demo-b/`: that
     folder is the record of what you approved. Give it another one with `--salida <folder>` and the draft, the
     contradictions and the review land there. `plan:aprobar` does not turn it into `v1.json`, which already exists.
- **Languages:** your answer stays as you wrote it, in your language. The model drafts the other language and it is
  marked as the model's, so you review it before approving. Without a model (`--sin-modelo`), the other language
  stays pending.
- **Limitations:** only the templates of the two demo domains exist. The interview for this repository's plan B was
  run by delegation: the builder wrote the answers and the author approved the plan with their own sentence, recorded
  in the sprint 3 log.

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
- **Batches stored in the repository:**
  - demo A: the 20-case and the quick-test batches were generated with plan v1.1, and the 200-case batch the
    showcase publishes (`planlang-a-002-200`) with v1.5, which also seeds cases above the coverage cap;
  - demo B: the 20 and the 200-case batches (`planlang-b-001-20` and `planlang-b-001-200`), with the synthetic lists
    in `data/listas/demo-b.json`. `pnpm casos:generar --versionados --demo b` regenerates them and checks they come
    out identical.
- **Limitations:** the names on demo B's lists are seeded made-up combinations; the identifier validator checks them
  too.

### Run a batch · since sprint 1 (improved in sprint 3)

- **What it does:** demo A's agent decides each case: approve, deny or hand it to a human auditor. Every
  denial goes to a person; in a batch, that person is simulated and follows the case's right answer.
  Each case leaves a trace with every decision, its signal and the threshold applied.
- **How to use it:**
  1. Check how much quota you have left in your Claude account.
  2. `pnpm lote:demo --corrida <new-name> --fecha <YYYY-MM-DD>`: runs the 20 cases with your Claude
     Code subscription, leaving 2 seconds between cases. Without `--plan`, it uses the plan
     `plans/demo-a/v1.2.json` and the batch `data/casos/demo-a/planlang-a-001-20.json`, those of the demo's first
     run; for the one the showcase publishes, step 5. It takes about 5 minutes. With the
     subscription, the command refuses to run more cases per session than the plan allows (20) or to
     run them back to back.
  3. `pnpm lote:base --corrida <new-name>-base --fecha <YYYY-MM-DD>`: the same test with a single agent,
     to compare.
  4. If it stops at a usage limit, run the same command later: it resumes where it stopped, without
     repeating cases.
  5. For the 200-case batch with plan v1.5 (the one the showcase's published run ran with; the showcase measures it
     with v1.5.1, which only fixes the wording), add `--plan plans/demo-a/v1.5.json
--casos data/casos/demo-a/planlang-a-002-200.json` and repeat the command until all 200 are done, 20 at a time.
     Leave a few minutes between one session and the next.
  6. To watch a single case end to end in a couple of minutes, add `--caso <id>` (for example `--caso A-016`).
- **If the model does not respond** (since plan v1.4): when it fails while extracting the details or
  preparing a clarification, the case is not made up or left without a decision; it goes to a person with
  whatever there is. The trace keeps what failed and what it cost. If it is the final letter that fails, the
  decision is already made and the case is left without a letter. If the quota runs out, the session stops
  and the case is retried later.
- **Where it goes:** `runs/demo-a/<name>/`. Keys and session identifiers are never stored.
- **Limitations:** batches run outside continuous integration, 20 at a time and spaced out. The
  LangSmith mirror only fills if its key is in your terminal (never in the repository).

### Run demo B · since sprint 3

- **What it does:** demo B's agent decides whether a customer is onboarded. It receives the application with its
  documents:
  - an extractor reads the documents;
  - the list checker looks the name up in binding and reference lists, by exact match and by similarity;
  - an investigator looks at the context, but only when the similarity falls in the plan's gray zone;
  - a risk score is computed by rules, without reading protected attributes;
  - with all that, it proposes to approve, review or reject.

  Every rejection and every high risk goes to a person (the compliance officer, simulated in batches).

- **How to use it:**
  1. `pnpm lote:demo-b --corrida <new-name> --fecha <YYYY-MM-DD>` runs the 20 cases of
     `data/casos/demo-b/planlang-b-001-20.json` with plan `plans/demo-b/v1.json`, on your subscription and with a
     pause between cases.
  2. `pnpm lote:demo-b --caso B-010 --corrida <new-name> --fecha <YYYY-MM-DD>` runs a single case.
  3. `pnpm brecha:informe --corrida runs/demo-b/<name> --plan plans/demo-b/v1.1.json` writes its report, measured
     with v1.1.
- **Limitations:**
  - the lists are synthetic;
  - plan B declares no provider fallback: if the model does not respond, the case is not decided and is retried;
  - plan B declares no human cost per case, so its playground counts cases, not minutes;
  - demo B's showcase publishes its 20-case run.

### Read a case file · since sprint 3

- **What it does:** every demo B case ends in a **case file** written by code, not by the model, in Spanish and
  English. It holds:
  - the conclusions, numbered: each one cites the plan rule or the list match, with its version and date;
  - the decision;
  - if it was a rejection, the document with its AI notice and how to appeal it.
- **How to read it:** in the showcase, open demo B (the "A · B" switch in the bar), then "Cases". For example,
  `/en/demo-b/caso/B-010`. "Receives" shows the documents as they arrived, with any hidden instruction marked
  apart. The case file comes at the end of the path.
- **Limitations:** the investigator's text was written by the model and is shown in the language it was written in.

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
- **How to read the statuses:** ✓ met · ✗ not met · ◐ incomplete (runs missing: a criterion that asks for several
  runs in a row and was measured with fewer is left incomplete, and says so. If the plan limits those runs to one batch
  size, they only apply there: demo A's C5 asks for three only in 20-case batches, so the 200-case batch measures it in
  one run and the report's note explains why) · ? undetermined (some
  cases could not be evaluated) · — no case tests it · ⚠ malformed rule (the problem is in the plan,
  not in the agent).
- **One-way decisions** state in the report what was chosen, if the plan wrote the option in both languages
  (plans v1.1 and v1.2 wrote it only in Spanish: there the report does not make up an English one).
- **Limitations:** the report only reads traces whose fingerprints match; if something was altered, it
  refuses to measure and names the failing file.

### Check the runs and the instrument · since sprint 1

- `pnpm trazas:verificar`: checks every stored run (fingerprints, that each decision can be reproduced
  from the plan, that there are no credentials).
- `pnpm m9:reporte`: plants failures on purpose in a clean run and checks the verifier catches all of
  them. The result goes to `docs/kit-de-prueba/M9-brechas-sembradas.md`.

### Open the showcase · since sprint 2 (improved in sprint 3)

- **What it does:** shows both demos end to end, seven screens each, in Spanish and English, in dark and light
  themes, on a phone or a desktop. Every screen carries the label "Simulation · not operational · synthetic data".
  The home page has one row per demo. Inside a demo, the "A · B" switch in the bar changes demo: A lives at
  `/en/plan`, `/en/agente`…, and B at `/en/demo-b/plan`, `/en/demo-b/agente`…
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
  - **Cases:** one per page, with their path, the signals on each arrow, the pause with the person, the letter and
    the adverse-decision document when there is one (in B, the case file). In A, which publishes 200 cases, the
    first 20 and the ones the report names have a page. The rest show up without a link, with a dotted border, in
    the Gap and the Playground.
  - **Records:** the record to repeat the run and the two records that travel to hoja-de-vida.
- **Limitations:**
  - Demo A publishes plan v1.5's 200-case run, with its single-agent baseline. The Agent screen lists the traces of
    the first 20 cases and counts the rest.
  - Demo B publishes its 20-case run.
  - The clarifications and letters the model wrote are shown in the language they were written in (Spanish).

### Move thresholds in the playground · since sprint 2

- **What it does:** lets you change the plan's thresholds over the run's real signals and see what would
  have happened: which cases change path, how many errors are avoided or introduced, how many minutes more
  or less of human review and which criteria would pass or fail. With the plan's values it reproduces the
  report exactly. The calculation runs in your browser, without calling any model, and gives the same result in
  the Chrome, Firefox and Safari engines.
- **How to use it:**
  1. Open "Playground".
  2. Move the minimum extraction confidence (U1, 0.50 to 0.95), the high-cost threshold (U2, 200 to 5,000)
     or the clarification limit (U3, 0 to 4).
  3. Read the cases that change and open any of them with "see its trace": the case opens at the step where its
     path splits from the one the agent took. The risk-coverage curve marks where the plan sits.
- **Texas mode (U4)** makes sure no adverse determination is automatic, not even a partial one. In the 200-case
  run, turning it on sends the nine partial approvals to a person. The screen says it is the review Texas mode
  requires, not an extra one.
- **In demo B** four thresholds move: the similarity to a list, the start of the investigator's gray zone, the risk
  score and the inconsistencies. There is no Texas mode, and it counts cases, not minutes.
- **Limitations:** outside the range seen in the run, the result is marked "not observed". Criteria that
  depend on what happened after a change cannot be measured in the case that changes: the trace did not
  record what did not happen.

### The records · since sprint 2

- **What it does:** produces one reproducibility record per demo and three records that travel.
  - The **reproducibility** record has versions, fingerprints, seed, model, date and the steps to repeat
    the run.
  - The **app** record comes from `docs/brochure-export.json` and adds up both demos; hoja-de-vida builds it with
    its own design.
  - The **agent A** and **agent B** records are in `content/agentes/planlang-demo-a.ficha-tecnica.json` and
    `content/agentes/planlang-demo-b.ficha-tecnica.json`.

  The ones that travel are checked against hoja-de-vida's contract before they are written.

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

### Publish the design system · since sprint 3

- **What it does:** publishes the app's consolidated design system to Claude Design (colors, type, components and
  the screens of both demos), as an asset that stays stable between cycles.
- **How to use it:**
  1. It happens **after** the short ⭐⭐ gate at closing: a system the author has not judged is never published.
  2. In Claude Code, the author types `/design-sync`; the builder assembles and publishes it.
  3. The destination is in `design-sync/project.json`. The exact list of files is shown before publishing.
- **Where it comes from:** `design-system.md` is the source; `design-sync/` is the bundle that gets published, kept
  up to date in every sprint with screens. The remote project is never edited over there.
- **Limitations:** only the author triggers it; if they decide not to publish, the sprint summary records it.

### Frequently asked questions

- **Why does the report say “met with alerts”?** Because the verdict looks beyond the criteria: at the assumptions,
  the risks and the failures the plan did not foresee. In demo A's published report:
  - assumptions S2 and S3 were refuted;
  - an evaluator saw failures that no risk in the plan covered.

  Whatever could not be measured is an alert too, never a silence.

- **Why do some cases have no page?** One page per case of the 200-case run would take the showcase package from
  about 30 MB to over 100. The first 20 and the ones the report names have a page. The rest stay in the run, with
  their trace and fingerprint.
- **Can I change a threshold and see what would have happened?** Yes, in the showcase playground (above).

---

## Historial · History

| Sprint          | Features añadidas a este manual · Features added to this manual                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1 · 2026-09-27 | Validar un plan · generar casos sintéticos · correr un lote de 20 · leer el informe de brecha · verificar corridas e instrumento                                                                       |
| S2 · 2026-10-02 | Abrir la vitrina (7 pantallas) · mover umbrales en el playground · las fichas · entregar el paquete a hoja-de-vida · lote de 200 y respaldo sin modelo (mejorado) · plan v1.3 y v1.4                   |
| S3 · 2026-10-05 | Entrevistar un plan · correr el demo B · leer un expediente · publicar el design system · la vitrina con dos demos y la corrida de 200 del A (mejorado) · `--caso` en los lotes (mejorado) · plan v1.5 |
