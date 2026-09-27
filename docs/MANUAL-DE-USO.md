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

En este primer sprint todo se usa desde la terminal, en la raíz del repositorio. La vitrina con
pantallas llega en el sprint 2.

### Primeros pasos

1. Abre una terminal en la carpeta del repositorio.
2. Corre `pnpm install` (una vez). Instala las dependencias y activa la protección contra secretos.
3. Para el agente de Python: `cd agents && python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]"`.
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
- **El plan vigente del demo A** es `plans/demo-a/v1.2.json`. Las versiones 1 y 1.1 se conservan como
  historia; la 1.2 solo corrigió cómo se miden un riesgo y dos supuestos.
- **Limitaciones:** el plan se escribe a mano como archivo; el entrevistador que lo construye
  conversando llega en un sprint posterior. Las opciones de cada decisión todavía se escriben en un
  solo idioma.

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
- **Limitaciones:** solo existe el dominio del demo A (autorizaciones médicas); el demo B llega después.

### Correr un lote de 20 · desde el sprint 1

- **Qué hace:** el agente del demo A decide cada caso: aprobar, negar o pasar a un auditor humano.
  Toda negación pasa por una persona; en el lote, esa persona se simula siguiendo la respuesta correcta
  del caso. Cada caso deja una traza con cada decisión, su señal y el umbral aplicado.
- **Cómo se usa:**
  1. Revisa en tu cuenta de Claude cuánta cuota te queda.
  2. `pnpm lote:demo --corrida <nombre-nuevo> --fecha <AAAA-MM-DD>`: corre los 20 casos con tu
     suscripción de Claude Code, con 2 segundos entre caso y caso. Tarda unos 5 minutos. Con la
     suscripción, el comando se niega a correr más casos por sesión de los que fija el plan (20) o a
     correr sin pausa.
  3. `pnpm lote:base --corrida <nombre-nuevo>-base --fecha <AAAA-MM-DD>`: la misma prueba con un solo
     agente, para comparar.
  4. Si se corta por límite de uso, vuelve a correr el mismo comando más tarde: retoma donde quedó, sin
     repetir casos.
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

### Preguntas frecuentes

- **¿Por qué el informe dice «cumple con alertas» si se cumplieron todos los criterios?** Porque el
  veredicto no mira solo los criterios: también los supuestos, los riesgos y las fallas que el plan no
  previó. En el informe vigente, el supuesto S3 quedó refutado, el supuesto S1 no se pudo probar y
  aparecieron fallas no previstas. Lo que no se pudo medir también es una alerta, nunca un silencio.
- **¿Puedo cambiar un umbral y ver qué habría pasado?** Desde el sprint 2, en el playground de la
  vitrina. El informe ya lista qué umbrales se podrán mover y qué casos quedaron justo en el límite.

---

## English

### What planlang is

planlang turns the plan of an AI-agent project into a **contract that can be checked**. The plan
states what the agent decides, what can go wrong, what is assumed and how success is measured. An
agent built from that plan then runs on made-up cases whose right answer is already known, and a
verifier compares what was planned with what happened: **the gap**. The report also publishes what
failed.

In this first sprint everything is used from the terminal, at the repository root. The showcase with
screens arrives in sprint 2.

### Getting started

1. Open a terminal in the repository folder.
2. Run `pnpm install` (once). It installs the dependencies and turns on the secret guard.
3. For the Python agent: `cd agents && python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]"`.
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
- **Demo A's current plan** is `plans/demo-a/v1.2.json`. Versions 1 and 1.1 are kept as history; 1.2
  only fixed how one risk and two assumptions are measured.
- **Limitations:** the plan is written by hand as a file; the interviewer that builds it through a
  conversation comes in a later sprint. Each decision's options are still written in one language.

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
- **Limitations:** only demo A's domain exists (medical prior authorizations); demo B comes later.

### Run a 20-case batch · since sprint 1

- **What it does:** demo A's agent decides each case: approve, deny or hand it to a human auditor. Every
  denial goes to a person; in a batch, that person is simulated and follows the case's right answer.
  Each case leaves a trace with every decision, its signal and the threshold applied.
- **How to use it:**
  1. Check how much quota you have left in your Claude account.
  2. `pnpm lote:demo --corrida <new-name> --fecha <YYYY-MM-DD>`: runs the 20 cases with your Claude
     Code subscription, leaving 2 seconds between cases. It takes about 5 minutes. With the
     subscription, the command refuses to run more cases per session than the plan allows (20) or to
     run them back to back.
  3. `pnpm lote:base --corrida <new-name>-base --fecha <YYYY-MM-DD>`: the same test with a single agent,
     to compare.
  4. If it stops at a usage limit, run the same command later: it resumes where it stopped, without
     repeating cases.
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

### Frequently asked questions

- **Why does the report say “met with alerts” when every criterion was met?** Because the verdict
  looks beyond the criteria: at the assumptions, the risks and the failures the plan did not foresee. In
  the current report, assumption S3 was refuted, assumption S1 could not be tested and unforeseen
  failures showed up. Whatever could not be measured is an alert too, never a silence.
- **Can I change a threshold and see what would have happened?** From sprint 2, in the showcase
  playground. The report already lists which thresholds can be moved and which cases sat right at the
  limit.

---

## Historial · History

| Sprint          | Features añadidas a este manual · Features added to this manual                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| S1 · 2026-09-27 | Validar un plan · generar casos sintéticos · correr un lote de 20 · leer el informe de brecha · verificar corridas e instrumento |
