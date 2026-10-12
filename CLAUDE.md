# planlang — constitución de la app (núcleo, kit v2.0.0)

> Auto-cargado en cada sesión de este repo. Núcleo regenerado por la planeadora el 2026-10-10 (método v2.0.0, modo regenerar) para el S4 — **regla 18 actualizada el 2026-10-11 al kit v2.1.0 (un PR vivo por app; adoptada en el S5, 2026-10-11, con el job `un-pr-vivo`)**, primer sprint de planlang en el hito H-2; sustituye a la constitución v1.37.0 de 762 líneas. Las reglas en detalle viven en `docs/REGLAS-ANEXO.md` (anexo del kit + § P1–P16 de planlang, texto íntegro de la constitución anterior) y se leen solo cuando una regla se cita, nunca al abrir la sesión. Estampada 2026-09-26 con kit v1.30.1 `--estatico --python`.

## Identidad y las dos casas (regla dura)

- **planlang** — *«Planeé, construí y medí la brecha»*: planeador de proyectos de agentes de IA donde cada demo prueba su propio plan. Plan como contrato ejecutable (M1) → agente multiagente en LangGraph (demo A autorizaciones médicas · demo B vinculación con debida diligencia, ambos publicados) → verificador determinista de la brecha publicada con sus fallas → playground de umbrales sobre trazas reales → visor del grafo real → vitrina estática bilingüe dentro de hoja-de-vida, rotulada «Simulación · no operativo». Entrevistador M2 en consola. Alcance: `portafolio/planlang/VISION.md` v1.0.0 (planeadora). Hito vigente: **H-2 Uso real** (H-1 construido; su gate humano está diferido por el usuario).
- **Planeadora** (`~/Code/hr01-develop-ai-apps/`, privada): brief, visión, el archivo del sprint (inicio ejecutivo + plan + prompt), método, estándares y los contratos de los dos reusables. La **lees** (`.claude/settings.local.json` o path absoluto); **nunca escribes ahí**.
- **Esta app** (este repo, público): código, tests, ADRs, `sprints/SPRINT_NNN-cierre.md`. Escritor único: **tú**. Si el plan necesita cambio, lo declaras en el cierre ejecutivo («desviaciones») y avisas al usuario.
- **Stack real:** Next.js 16 **exportado estático** (`output: "export"`, `pnpm start` sirve `out/` con `serve`; `vercel.json cleanUrls`, ADR-007) + TypeScript strict + Tailwind (sin shadcn/ui) · datos precomputados y verificados en build, sin IndexedDB (ADR-008) · `core/` TypeScript determinista que corre igual en Node y en los tres motores · `agents/` Python 3.12 · LangChain 1.4 · LangGraph 1.2 · `ChatClaudeCode` · sin backend, sin Supabase, sin PostHog · Sentry client-only y metadata-only (`src/lib/sentry-evento.ts`, `beforeSend` vacía el mensaje) · Pino sin uso · Vercel con protección en todos los despliegues. `captura_terceros: false`.
- **Estructura real:** `core/{plan,sintetico,brecha,playground,visor,formatos}` · `agents/src/app_agents/{adaptador,demo_a,demo_b,entrevistador,lotes,exportador,reglas_arista}` · `packages/{diagramador,instrumentos-de-plan}` (copia fijada + `CONTRATO.lock`; la implementación del visor vive en `core/visor`) · `data/{dominios,casos,listas,vitrina}` · `plans/<demo>/vN.json` · `runs/<demo>/<corrida>/` (append-only) · `src/app/[idioma]/{page,plan,agente,brecha,playground,caso,fichas,demo-b/**}` · `src/{components,lib/{datos,vista},textos,styles}` · `content/agentes/` (fichas A y B) · `scripts/` · `tests/{unit,integration,contrato,e2e}` · `docs/{diseno,fidelidad,kit-de-prueba,MANUAL-DE-USO.md,GUIA-DE-PRUEBA.html,BLUEPRINT.html,brochure-export.json}` · `design-system.md` 1.0.0 · `design-sync/` · `decisions/001…016` (en español con «Summary (EN)», excepción B-10).

## Reglas duras de planlang (16; producto, no estilo — detalle íntegro en `docs/REGLAS-ANEXO.md § P1–P16`)

P1. **El núcleo es determinista y jamás invoca un modelo:** `core/` produce los mismos bytes en Node, Chromium, Firefox y WebKit (JCS RFC 8785 + SHA-256, semilla sfc32, sin reloj, azar ni `Intl`; `tests/unit/guardias/determinismo.test.ts`); golden en CI; cobertura ≥ 90 % en `brecha/`, `playground/`, `plan/` y `visor/`.
P2. **El plan es el código de la arista:** toda arista condicional se declara `señal · operador · valor · inclusivo` (o función nombrada con entradas, o rama por defecto); grafo (Python) y playground (TS) la evalúan con intérpretes gemelos y **RF-09.2 cruza ambos en CI** sobre cada corrida versionada.
P3. **Toda decisión del agente deja su señal** en el estado, con el nombre del plan, antes de enrutar; sin señal no hay playground.
P4. **Ninguna negación completa ni rechazo sin pausa humana** (ley de los dos dominios, no umbral): `negar`/`rechazar` pasan por `interrupt` con revisor de rol declarado que ve el caso completo; en lote el revisor simulado sigue la verdad conocida y la vitrina lo divulga; urgencia ⇒ sin autorización; el **modo Texas** (ni siquiera la aprobación en parte sin persona) es umbral jugable del plan A.
P5. **La guardia determinista es arquitectura:** lista blanca de acciones, filtro de salida por reglas, cortafuegos de herramientas, separación control/datos; el criterio de inyección mide tasa **y** severidad.
P6. **IA de construcción por suscripción (7-S):** extractor, redactor, investigador de contexto y entrevistador usan `ChatClaudeCode` con `claude -p --output-format json --model <alias> --max-turns 2 --json-schema <esquema> --no-session-persistence --strict-mcp-config --mcp-config '{"mcpServers":{}}' --setting-sources "" --tools "" --system-prompt <propio>` (`--max-turns 2` solo con `--json-schema`, ADR-004; sin esquema, 1 turno), cwd temporal limpio, nunca `--bare`; token jamás en env, trazas ni repo; lotes de 20 fuera de CI; ADR-002 con relectura de términos por release; ADR «código primero» 001, 012 y 013.
P7. **Cero datos reales:** todo caso, afiliado, cliente, médico, lista de control y plan de beneficios es sintético con semilla; validador de identificadores en CI (E-11); afirmación de privacidad con modelo de amenaza.
P8. **Las trazas son propias (`planlang-trace/v1`)**, versionadas con huella en `runs/`, única entrada del verificador y del playground; LangSmith es espejo opcional, clave solo en el entorno del builder.
P9. **La brecha se publica con sus fallas:** criterios fallidos, riesgos ocurridos, brechas no previstas y supuestos refutados a la vista; ocultar un resultado desfavorable es hallazgo Alto; juez LLM solo selectivo y nunca fuente única.
P10. **Multiagente reversible:** el enrutador es decisión `dos_vias` con **línea base de agente único a igual presupuesto** medida en el informe; sin `langgraph-supervisor`.
P11. **Los dos reusables son de la casa:** `packages/diagramador` (gramática `agentes-ia` 1.2.0, contrato 0.5.0; conversor y SVG propio en `core/visor`) y `packages/instrumentos-de-plan` (0.2.0); copia fijada + lock con huellas; fallas y enmiendas al cierre ejecutivo; **el visual se genera, no se dibuja**.
P12. **Rigor de experto, lenguaje de líder, en dos idiomas:** dos registros por nodo y por elemento del plan; textos de líder con presupuesto por código; aviso de IA en toda salida al afiliado o cliente; expediente y documento adverso generados por código en ES y EN.
P13. **Daltonismo leve del usuario:** el color nunca va solo (tipo = color + glifo + etiqueta; veredicto = símbolo + texto + color); tema oscuro primario y claro igual de cuidado.
P14. **Cero enlaces con la excepción acotada (F0 #12):** la app privada no se publica; la vitrina viaja a hoja-de-vida **por copia** (paquete con manifiesto, `pnpm paquete:vitrina`) con las fichas de la app y de los agentes A y B; ningún visitante lanza llamadas a modelos. **planlang no tiene `docs/BROCHURE.html` ni `/conoce`:** la vitrina y sus fichas hacen de brochure (decisión del G-Plan del S3).
P15. **Corte honesto:** jamás se simula lo que no corrió; cada corrida publicada declara plan, huella, modelo, fecha y lo que dejó fuera (ficha de reproducibilidad); lo pendiente se dice en pantalla.
P16. **Python 3.12 y pines por ADR** (`langchain>=1.4,<2`, `langgraph>=1.2,<1.3`, `langchain-core<2`, `langsmith<1`, `langgraph-checkpoint-sqlite>=3.1,<4`, `pydantic`, `rfc8785`; `constraints.txt`); `SqliteSaver` en corridas, `InMemorySaver` en tests; `pip-audit --skip-editable`; sin Dependabot `pip`; la ruleset exige **quality · e2e · lighthouse · python**.

## Workflow del sprint (5 pasos)

1. **Plan.** El usuario trae `portafolio/planlang/sprints/SPRINT_NNN.md` de la planeadora. En **plan mode** corres `/plan-sprint`: estado real del código, riesgos, plan en ≤ 3 fases con criterio observable y horas por fase, modelo por fase. La aprobación del plan NO arranca nada: esperas el **«construye»**. Branch `sprint-NNN/<tema>`, en el checkout principal.
2. **Construcción.** ≤ 3 fases; commits convencionales con `[F1]` / `[F2]` / `[F3]` en el subject. **Un solo STOP al final de la construcción**, más como máximo **1 mirada de DECISIÓN** si el sprint cambia una decisión del usuario, la promesa o su máquina. FORMA y TEXTO se maquetan «no vistas» (registro de una línea) y van al gate humano del hito.
3. **Auditoría de una pasada + checklist.** `/audita-sprint` (un auditor independiente en solo lectura, 4 casillas; **críticos y altos se pagan en el sprint, medios y bajos van al lote del hito**) y `/deploy-check --python` (≤ 10 casillas; la CI es el gate).
4. **Cierre ejecutivo.** `sprints/SPRINT_NNN-cierre.md` ≤ 40 líneas con la salida de `node scripts/horas-sprint.mjs` pegada. Reemplaza al summary, la bitácora y la auditoría como archivos aparte.
5. **PR normal** con el cierre dentro; checks requeridos con conclusión propia `success` leídos al final. **El merge squash lo hace el usuario**; después corre `/cierre-sprint planlang` en la planeadora.

- **Por hito, no por sprint:** gate humano único (≈ 20 min con la página abierta: ⭐⭐ de la guía, FORMA y TEXTO pendientes) · lote de medios y bajos · `design-sync/` y `/design-sync` (lo invoca el usuario) · `docs/BLUEPRINT.html` · pruebas y capturas en el segundo idioma · adopción del kit y de esta constitución.
- **Solo por cambio:** aprovisionamiento · demo en rojo (gates propios nuevos, `scripts/demo-rojo.sh`) · `CONTRATO.lock` (solo si el contrato cambia) · roadmap de CV Viva (solo si el sprint toca una feature votada) · ADR (solo decisiones irreversibles) · guía de prueba (solo si cambia un flujo visible).
- **Tamaño:** ≈ 4 h activas por defecto; ≤ 12 h con una línea de justificación; si el real supera el estimado en más del 50 %, el cierre explica la causa y propone una medida.
- **Modelo y esfuerzo por fase** (default configurable): construcción con alcance claro **Sonnet 5.5 · medium** · construcción simple **Haiku 5.5 · medium** (en prueba, `claude-haiku-5-5`) · depuración difícil o seguridad **Opus 5.5 · high** · auditoría **Sonnet 5.5 · high** · cierre ejecutivo y documentación corta **Haiku 5.5 · low** · subagentes de lectura **Haiku 5.5**. Cada fase abre con «Fase N · modelo requerido: X · esfuerzo: Y» y verifica `/status`; el cambio va en el mensaje de fin de fase, sin parada nueva; si el modelo no corresponde a la tarea, te detienes y recomiendas en una línea (actual · recomendado · por qué · comando). Si Haiku falla dos veces en lo mismo, sube a Sonnet y el cierre lo registra.

## Reglas del kit (28, una línea cada una — detalle en `docs/REGLAS-ANEXO.md § N`)

Frecuencia: `[sprint]` cuesta en cada sprint · `[hito]` al abrir o cerrar un hito · `[cambio]` solo cuando el sprint toca lo que cubre · `[siempre]` pasiva. 🔒 = privacidad o seguridad.

1. `[siempre]` **TypeScript strict.** Sin `any` ni `@ts-ignore` sin justificación.
2. `[sprint]` **Tests de lo que cambia.** `core/` ≥ 90 %, UI > 50 %, ≥ 1 e2e por feature core; `--coverage` en `test`.
3. `[siempre]` **Motor separado de UI.** Lógica en `core/` y `src/lib`; componentes sin lógica de negocio.
4. `[siempre]` **Toda salida de modelo que se persista pasa por esquema** (Pydantic al emitir, Zod al leer).
5. `[siempre]` **A11y desde el inicio:** foco visible, aria, contraste AA; `prefers-reduced-motion` cambia propiedades, jamás la forma del árbol; el color nunca solo.
6. `[siempre]` **Commits convencionales**; branch `sprint-NNN/<tema>`; jamás push directo a `main`; ruleset `main-protegida` con los 4 checks.
7. `[siempre]` 🔒 **Secrets solo en el entorno;** gitleaks a doble cinturón (hook PreToolUse que falla cerrado + `githooks/pre-commit`); carnada canónica.
8. `[sprint]` **Presupuesto medido:** horas con `scripts/horas-sprint.mjs`; si lo excedes, simplifica o consulta.
9. `[sprint]` **Manual de uso vivo** (`docs/MANUAL-DE-USO.md`, ES/EN): toda feature que llega a `main` tiene su sección en el mismo sprint.
10. `[hito]` **El diseño va antes del código:** G-Diseño hecho (2026-09-27, `design-system.md` 1.0.0); FIDELIDAD cumplida (2026-09-29); solo **DECISIÓN** abre parada (máx. 1 por sprint); FORMA y TEXTO al gate humano del hito.
11. `[cambio]` **Guía de prueba viva** (`docs/GUIA-DE-PRUEBA.html`): se toca solo si cambia un flujo visible; ⭐/⭐⭐ se corren en el gate humano del hito, sin acumulados ni contrapesos.
12. `[siempre]` **Prohibido entregar por artifacts o plataformas externas:** todo entregable es un archivo del repo.
13. `[hito]` **Brochure:** en planlang lo hacen la vitrina y las fichas (P14); `docs/brochure-export.json` se ajusta al cierre de cada hito.
14. `[siempre]` **Código primero, IA generativa después:** feature LLM ⇒ ADR «código primero»; la IA es acento con fallback determinista.
15. `[cambio]` **Un gate se demuestra fallando** (`scripts/demo-rojo.sh`, solo gates propios nuevos); un check `skipped` no es verde; **un «pending» tampoco**: antes de empujar, `pnpm test` entero y ruff sin `-q`, y la conclusión de la corrida anterior leída.
16. `[hito]` **`design-sync/` es artefacto del repo** y se actualiza al cierre del hito; `/design-sync` lo invoca el usuario, tú lo ejecutas.
17. `[siempre]` 🔒 **Cero enlaces:** ningún archivo versionado ni campo de GitHub publica producción o previews; barrido en `quality` (`scripts/cero-enlaces.mjs`, hosts en `cero-enlaces.json`); homepage del repo = el propio repo.
17-bis. `[siempre]` **Lo que la app escribe también es superficie:** derivados con permisos 700/600 (hilos SQLite del entrevistador, trazas).
18. `[siempre]` **UN SOLO PR VIVO POR APP** (regla dura del usuario 2026-10-11, kit v2.1.0; Dependabot cuenta): `gh pr list --state open` antes de abrir cualquier PR; un segundo solo complementario, con «complementa #N: <por qué no cabe en #N>» como primera línea del cuerpo; job `un-pr-vivo` en la CI. Dependencias: `scripts/verificar-dependencias.mjs` con `degradaciones-permitidas.json`; excepción de auditoría solo por id, sin parche y con ADR (`braces`, ADR-015, revisar antes del 2026-11-02); `lucide-react` fijo en la versión del design system.
19. `[cambio]` **Todo puente entre dos lenguajes exige su gate de contrato** (`tests/contrato/`: huellas, JCS, reglas de arista, Jaro-Winkler) en el sprint que lo cruza.
20. `[siempre]` **Bilingüe ES/EN en el dato** (`{ es, en }`, redactado, test de paridad de claves); e2e y capturas en UN idioma por sprint, el otro al cierre del hito; conversación y cierres en español; código y commits en inglés; ADR en español con «Summary (EN)».
21. `[cambio]` **IA de construcción por suscripción (7-S):** ver P6.
22. `[cambio]` **Todo control dibujado tiene su script cargado** (`tests/unit/controladores-maqueta`); pasada de interacción si el sprint toca una pantalla.
23. `[cambio]` **Matriz de envejecimiento:** todo dato con fecha de cambio de estado trae un gate que construye la página en cada fecha (hoy: `avisos-aceptados.json`).
24. `[cambio]` 🔒 **Las protecciones del sistema del usuario se enseñan antes de tocarlas** (matriz por acción y un «sí»); planlang no las toca.
25. `[siempre]` **El comando de pruebas por defecto no toca hardware ni permisos.**
26. `[siempre]` **Worktrees prohibidos:** todo ocurre en `~/Code/app-planlang`; nada de `git worktree` ni `git stash` a secas.
27. `[siempre]` **La evidencia se escribe después del hecho** («leído como imagen», «N de N», «en verde») con la cuenta tomada del resultado.
28. `[cambio]` **Parejas de versiones entre ecosistemas** (npm ↔ Python: `constraints.txt`, `agents/pyproject.toml`) se vigilan con un test entre lockfiles.

## Cierre ejecutivo (`sprints/SPRINT_NNN-cierre.md`, ≤ 40 líneas)

Frontmatter `sprint · app · hito · opened · closed · branch · pr`; campos en una línea cada uno: nombre · objetivo planeado · resultado · estado · tiempo estimado · tiempo real (salida de `scripts/horas-sprint.mjs`) · diferencia · fases planeadas y reales · horas por fase · entregables · no completado · desviaciones · causas · decisiones · deuda (medios y bajos con `archivo:línea`, al lote del hito) · aprendizajes · recomendación para el siguiente · esfuerzo-beneficio · **auditoría** (4 casillas; C/A con `pagado · <commit>`) · fase que se pasó > 50 %: causa y medida · **modelo por fase y desvío** (si Haiku bastó o no) · «Para mergear: squash y borrar la rama; después `/cierre-sprint planlang`».

## Comandos

`/plan-sprint` · `/audita-sprint` · `/deploy-check --python` · `/design-sync` (hito; lo invoca el usuario) · opcionales `/self-review`, `/run-tests`, `/security-audit`. Scripts: `scripts/horas-sprint.mjs` · `scripts/demo-rojo.sh` · `scripts/verificar-dependencias.mjs` · `scripts/cero-enlaces.mjs` · `scripts/lighthouse-margen.mjs` (con el parche de presupuesto por ruta) · `pnpm plan:validar` · `pnpm entrevistar` · `pnpm lote:demo` / `lote:demo-b` · `pnpm trazas:verificar` · `pnpm diagrama:verificar` · `pnpm paquete:vitrina` · `pnpm fichas`.

## Estándares (los 6+1, gates en CI)

Testing · CI/CD · Observabilidad · Seguridad · Performance (`perf-budget.json` por ruta; `/*/playground` en 2,8 s por ADR-011, el resto 2,5 s; Lighthouse una corrida; categorías ≥ 0,9) · UX+A11y · IA embebida responsable. Detalle canónico: `estandares/estandares.md` v3 de la planeadora. Ítem rojo ⇒ deuda explícita en el cierre o el sprint no cierra.

## Patrones de dominio de esta app

- **La arista se interpreta dos veces** (`core/playground/interprete.ts` · `agents/src/app_agents/reglas_arista.py`) y RF-09.2 las cruza sobre cada corrida versionada.
- **Huella dentro del archivo:** `huella = SHA-256(JCS(objeto sin "huella"))`, igual en Python y TS.
- **Corridas `planlang-trace/v1`** en `runs/<demo>/<corrida>/`, append-only; la vitrina muestra solo los derivados de `data/vitrina/` que declara `data/vitrina/manifiesto.json` (plan, corrida, línea base, informe, playground), verificados en build.
- **Proveedor de modelo** por `crear_modelo()` en `agents/src/app_agents/adaptador.py` (`ChatClaudeCode`; `ChatSimulado` en CI); **ningún modelo en la CI ni en la vitrina**.
- **Plantillas de dominio como datos** (`data/dominios/*.json` 1.1.0: preguntas con ejemplo, umbrales y contrato); el entrevistador M2 las recorre con `interrupt` por pregunta y **nunca aprueba** (`pnpm plan:aprobar` lo hace el usuario).

Constitución núcleo kit v2.0.0 · planlang · regenerada 2026-10-10 — las reglas en detalle viven en `docs/REGLAS-ANEXO.md` y se leen solo cuando una regla se cita.
