# planlang — constitución de la app (núcleo, kit v2.3.0)

> Auto-cargado en cada sesión de este repo. Núcleo regenerado por la planeadora el 2026-11-02 (método v2.3.0, modo regenerar) para el S8, primer sprint de planlang en la ola H-2 «Producto completo» (F0 2026-11-01); sustituye al núcleo kit v2.0.0 del 2026-10-10 (regla 18 al v2.1.0 en el S5) y corrige los cuatro desajustes que dejó el cierre del S7. Las reglas en detalle viven en `docs/REGLAS-ANEXO.md` (anexo del kit + § P1–P16 de planlang, texto íntegro de la constitución v1.37.0) y se leen solo cuando una regla se cita, nunca al abrir la sesión. Estampada 2026-09-26 con kit v1.30.1 `--estatico --python`.

> Ajustada el 2026-11-08 para el S10 (cierre del H-2 y piloto de tokens): «faltan 2» y `decisions/001…019`, `core/plazos`, el gate de fase con el esfuerzo y su `/effort`, construcción en esfuerzo `high` (decisión del usuario, 2026-11-07), patrones de dominio en `.claude/rules/motor.md` y `# Compact instructions`.

## Identidad y las dos casas (regla dura)

- **planlang** — *«Planeé, construí y medí la brecha»*: planeador de proyectos de agentes de IA donde cada demo prueba su propio plan. Plan como contrato ejecutable (M1) → agente multiagente en LangGraph (demo A autorizaciones médicas · demo B vinculación con debida diligencia, ambos publicados) → verificador determinista de la brecha publicada con sus fallas → playground de umbrales sobre trazas reales → visor del grafo real → vitrina estática bilingüe dentro de hoja-de-vida, rotulada «Simulación · no operativo». Entrevistador M2 en consola; comparar corridas y versiones del plan en la vitrina. Alcance: `portafolio/planlang/VISION.md` v1.1.0 (planeadora; las fichas de agente A y B, retiradas el 2026-10-25). **Hito vigente: H-2 «Producto completo»** (método v2.3.0): faltan 2 funcionalidades de la VISION —recorrido animado de un caso · diseño de despliegue documentado— (la calibración con garantía entró en el S8, ADR-018; plazos y beneficiario final, en el S9, ADR-019); el gate del H-1 y el bloque G del S7 se funden en el **ensayo general del H-2** (F0 2026-11-01, «1a»).
- **Planeadora** (`~/Code/hr01-develop-ai-apps/`, privada): brief, visión, el archivo del sprint (inicio ejecutivo + plan + prompt), método, estándares y los contratos de los dos reusables. La **lees** (`.claude/settings.local.json` o path absoluto); **nunca escribes ahí**.
- **Esta app** (este repo, público): código, tests, ADRs, `sprints/SPRINT_NNN-cierre.md`. Escritor único: **tú**. El avance vive solo aquí; la planeadora te lee. Si el plan necesita cambio, lo declaras en el cierre ejecutivo («desviaciones») y avisas al usuario.
- **Stack real:** Next.js 16 **exportado estático** (`output: "export"`, `pnpm start` sirve `out/` con `serve` en `127.0.0.1:3200`; `vercel.json cleanUrls`, ADR-007) + TypeScript strict + Tailwind (sin shadcn/ui) · datos precomputados y verificados en build, sin IndexedDB (ADR-008) · `core/` TypeScript determinista que corre igual en Node y en los tres motores · `agents/` Python 3.12 · LangChain 1.4 · LangGraph 1.2 · `ChatClaudeCode` · sin backend, sin Supabase, sin PostHog · Sentry client-only y metadata-only (`src/lib/sentry-evento.ts`, `beforeSend` vacía el mensaje) · Pino sin uso · Vercel con protección en todos los despliegues. `captura_terceros: false`.
- **Estructura real:** `core/{plan,sintetico,brecha,playground,visor,comparar,formatos,plazos}` · `agents/src/app_agents/{adaptador,demo_a,demo_b,entrevistador,lotes,exportador,exportar_grafo,reglas_arista,reloj,agente_unico}` · `packages/{diagramador,instrumentos-de-plan}` (copia fijada + `CONTRATO.lock`; la implementación del visor vive en `core/visor`) · `data/{dominios,casos,listas,plan-beneficios,vitrina}` · `plans/<demo>/vN.json` (`demo-a`, `demo-b`, `hackguard-agentes`) · `runs/<demo>/<corrida>/` (append-only) · `src/app/[idioma]/{page,plan,agente,brecha,playground,caso,comparar,planes,fichas,demo-b/**}` · `src/{components,lib/{datos,fichas,vista,preferencias},textos,styles}` · `scripts/` · `tests/{unit,integration,contrato,e2e,e2e-paquete}` · `docs/{diseno,fidelidad,kit-de-prueba,fichas,MANUAL-DE-USO.md,GUIA-DE-PRUEBA.html,BLUEPRINT.html,brochure-export.json}` · `design-system.md` 1.0.0 · `design-sync/` · `decisions/001…019` (en español con «Summary (EN)», excepción B-10).

## Reglas duras de planlang (16; producto, no estilo — detalle íntegro en `docs/REGLAS-ANEXO.md § P1–P16`)

P1. **El núcleo es determinista y jamás invoca un modelo:** `core/` produce los mismos bytes en Node, Chromium, Firefox y WebKit (JCS RFC 8785 + SHA-256, semilla sfc32, sin reloj, azar ni `Intl`; `tests/unit/guardias/determinismo.test.ts`); golden en CI; cobertura ≥ 90 % en `brecha/`, `playground/`, `plan/` y `visor/`.
P2. **El plan es el código de la arista:** toda arista condicional se declara `señal · operador · valor · inclusivo` (o función nombrada con entradas, o rama por defecto); grafo (Python) y playground (TS) la evalúan con intérpretes gemelos y **RF-09.2 cruza ambos en CI** sobre cada corrida versionada.
P3. **Toda decisión del agente deja su señal** en el estado, con el nombre del plan, antes de enrutar; sin señal no hay playground.
P4. **Ninguna negación completa ni rechazo sin pausa humana** (ley de los dos dominios, no umbral): `negar`/`rechazar` pasan por `interrupt` con revisor de rol declarado que ve el caso completo; en lote el revisor simulado sigue la verdad conocida y la vitrina lo divulga; urgencia ⇒ sin autorización; el **modo Texas** (ni siquiera la aprobación en parte sin persona) es umbral jugable del plan A.
P5. **La guardia determinista es arquitectura:** lista blanca de acciones, filtro de salida por reglas, cortafuegos de herramientas, separación control/datos; el criterio de inyección mide tasa **y** severidad.
P6. **IA de construcción por suscripción (7-S):** extractor, redactor, investigador de contexto y entrevistador usan `ChatClaudeCode` con `claude -p --output-format json --model <alias> --max-turns 2 --json-schema <esquema> --no-session-persistence --strict-mcp-config --mcp-config '{"mcpServers":{}}' --setting-sources "" --tools "" --system-prompt <propio>` (`--max-turns 2` solo con `--json-schema`, ADR-004; sin esquema, 1 turno), cwd temporal limpio, nunca `--bare`; token jamás en env, trazas ni repo; lotes de 20 fuera de CI; ADR-002 con relectura de términos por release; ADR «código primero» 001, 012 y 013.
P7. **Cero datos reales:** todo caso, afiliado, cliente, médico, lista de control y plan de beneficios es sintético con semilla; validador de identificadores en CI (E-11); afirmación de privacidad con modelo de amenaza.
P8. **Las trazas son propias (`planlang-trace/v1`)**, versionadas con huella en `runs/`, única entrada del verificador y del playground; LangSmith es espejo opcional, clave solo en el entorno del builder.
P9. **La brecha se publica con sus fallas:** criterios fallidos, riesgos ocurridos, brechas no previstas, supuestos refutados y garantías que los datos no alcanzan, a la vista; ocultar un resultado desfavorable es hallazgo Alto; juez LLM solo selectivo y nunca fuente única.
P10. **Multiagente reversible:** el enrutador es decisión `dos_vias` con **línea base de agente único a igual presupuesto** medida en el informe; sin `langgraph-supervisor`.
P11. **Los dos reusables son de la casa:** `packages/diagramador` (gramática `agentes-ia` 1.2.0, contrato 0.5.0; conversor y SVG propio en `core/visor`) y `packages/instrumentos-de-plan` (0.2.0); copia fijada + lock con huellas; fallas y enmiendas al cierre ejecutivo; **el visual se genera, no se dibuja**.
P12. **Rigor de experto, lenguaje de líder, en dos idiomas:** dos registros por nodo y por elemento del plan; textos de líder con presupuesto por código; aviso de IA en toda salida al afiliado o cliente; expediente y documento adverso generados por código en ES y EN.
P13. **Daltonismo leve del usuario:** el color nunca va solo (tipo = color + glifo + etiqueta; veredicto = símbolo + texto + color); tema oscuro primario y claro igual de cuidado.
P14. **Cero enlaces con la excepción acotada (F0 #12):** la app privada no se publica; la vitrina viaja a hoja-de-vida **por copia** (paquete con manifiesto, `pnpm paquete:vitrina`) con la ficha de la app (las de los demos A y B ya no se producen: decisión del usuario, 2026-10-25); ningún visitante lanza llamadas a modelos. **planlang no tiene `docs/BROCHURE.html` ni `/conoce`:** en CV Viva su brochure se arma desde `docs/brochure-export.json` y el complemento.
P15. **Corte honesto:** jamás se simula lo que no corrió; cada corrida publicada declara plan, huella, modelo, fecha y lo que dejó fuera (ficha de reproducibilidad); lo pendiente se dice en pantalla.
P16. **Python 3.12 y pines por ADR** (`langchain>=1.4,<2`, `langgraph>=1.2,<1.3`, `langchain-core<2`, `langsmith<1`, `langgraph-checkpoint-sqlite>=3.1,<4`, `pydantic`, `rfc8785`; `constraints.txt`); `SqliteSaver` en corridas, `InMemorySaver` en tests; `pip-audit --skip-editable`; sin Dependabot `pip`; la ruleset exige **quality · e2e · lighthouse · python · un-pr-vivo**.

## Workflow del sprint (5 pasos)

1. **Plan.** El usuario trae `portafolio/planlang/sprints/SPRINT_NNN.md` de la planeadora. En **plan mode** corres `/plan-sprint`: estado real del código, riesgos, plan en ≤ 3 fases con criterio observable y horas por fase, modelo por fase. La aprobación del plan NO arranca nada: esperas el **«construye»**. Branch `sprint-NNN/<tema>`, en el checkout principal.
2. **Construcción.** ≤ 3 fases; commits convencionales con `[F1]` / `[F2]` / `[F3]` en el subject. **Un solo STOP al final de la construcción**, más como máximo **1 mirada de DECISIÓN** si el sprint cambia una decisión del usuario, la promesa o su máquina. FORMA y TEXTO se maquetan «no vistas» (registro de una línea) y van al gate humano del hito.
3. **Auditoría de una pasada + checklist.** `/audita-sprint` (un auditor independiente en solo lectura, 4 casillas; **críticos y altos se pagan en el sprint, medios y bajos van al lote del hito**) y `/deploy-check --python` (≤ 10 casillas; la CI es el gate).
4. **Cierre ejecutivo.** `sprints/SPRINT_NNN-cierre.md` ≤ 40 líneas con la salida de `node scripts/horas-sprint.mjs` pegada. Reemplaza al summary, la bitácora y la auditoría como archivos aparte.
5. **PR normal** con el cierre dentro; checks requeridos con conclusión propia `success` leídos al final. **Antes de abrirlo, `gh pr list --state open` (regla 18).** Al pedir el merge entregas la lista de PRs abiertos, que debe ser ese uno. **El merge squash lo hace el usuario**; después corre `/cierre-sprint planlang` en la planeadora.

- **Por hito, no por sprint:** gate humano único = **ensayo general del H-2** (la guía se rehace para él en el sprint de cierre; el bloque G del S7 queda dentro) · lote de medios y bajos · `design-sync/` y `/design-sync` (lo invoca el usuario) · `docs/BLUEPRINT.html` · pruebas y capturas en el segundo idioma · adopción del kit y de esta constitución.
- **Lo que ya no se necesita se cierra** (el usuario, 2026-11-02): todo servidor que abras (`dev`, `start`, `serve`, el del paquete) escucha en `127.0.0.1`, nunca en todas las interfaces, y lo cierras antes de terminar la fase; los del `webServer` de Playwright los cierra Playwright. Puertos de planlang: **3200** (app, e2e y Lighthouse), **3201** (paquete) y **3101** (`pnpm maqueta`); el 3000 y el 3100 son de otras apps. Al STOP, `lsof -nP -iTCP -sTCP:LISTEN` no muestra procesos con cwd en este repo (el test-server de la extensión Playwright de VS Code no cuenta) y el cierre ejecutivo lo dice en una línea. Un servidor de otra app no lo cierras: lo reportas.
- **Matriz de hitos (método v2.3.0; 4 hitos, ninguno más).** Un hito = los sprints que su objetivo necesite; el gate humano es uno por hito.

  | Hito | Objetivo | Sale cuando (gate humano) |
  |---|---|---|
  | **H-1 Vitrina funcional** (= MVP) | diseño, propuesta de valor y funciones esenciales, demostrables | flujo principal de punta a punta con datos sintéticos · manual · deuda registrada · ficha en CV Viva · arquitectura al día |
  | **H-2 Producto completo** (ensayo general; no robusto) | todo lo que el visitante verá y usará, de punta a punta como en producción | VISION 100 % construida o descartada con nombre · bilingüe completo · **ensayo general del usuario** (lo no visto no cuenta) · arquitectura al día |
  | **H-3 Robustez** | calidad, mantenibilidad, datos y conectividad proporcionales | lote de medios y bajos pagado · integraciones definitivas · arquitectura al día |
  | **H-4 Producción** (= G-Release) | seguridad, privacidad, despliegue, operación y legal proporcionales | checklist de release · observabilidad mínima · legal · smoke |

  H-2 se cierra antes de H-3 y H-4; que el usuario use la app en su vida no es un hito. El sprint de cierre del hito trae lote, guía, manual, BLUEPRINT, `design-sync` y la auditoría de esta constitución contra el código.
- **Solo por cambio:** aprovisionamiento · demo en rojo (gates propios nuevos, `scripts/demo-rojo.sh`) · `CONTRATO.lock` (solo si el contrato cambia) · roadmap de CV Viva (solo si el sprint toca una feature votada) · ADR (solo decisiones irreversibles) · guía de prueba (solo si cambia un flujo visible).
- **Tamaño:** ≈ 4 h activas por defecto; ≤ 12 h con una línea de justificación; si el real supera el estimado en más del 50 %, el cierre explica la causa y propone una medida.
- **Modelo por DECISIÓN, nunca por descuido (regla dura del usuario, 2026-10-11; kit v2.2.0).** Cada fase declara modelo requerido y esfuerzo **sugerido**; el tope ordinario es **Opus 5.5**; **Fable 5.1 solo en emergencia declarada por el usuario**, jamás por iniciativa tuya, de una skill ni de un subagente.

  | Actividad | Modelo requerido | Esfuerzo (sugerido) |
  |---|---|---|
  | Planear sprint (`/plan-sprint`), preguntas de la planeadora | Opus 5.5 | medium |
  | Decisión irreversible | Opus 5.5 | high |
  | Construcción con alcance claro (interfaz, lógica, pruebas) | Sonnet 5.5 | high |
  | Construcción simple: ajustes de interfaz, textos, cambios pequeños | Haiku 5.5 (en prueba, `claude-haiku-5-5`) | high |
  | Depuración difícil, estadística con garantía, concurrencia, seguridad | Opus 5.5 | high |
  | Auditoría de una pasada | Sonnet 5.5 | high |
  | Cierre ejecutivo, script de horas, documentación corta | Haiku 5.5 | low |
  | Subagentes de búsqueda o lectura | `Explore` de usuario (Haiku 5.5, `~/.claude/agents/Explore.md`) | medium (en su archivo) |

  - **Gate de modelo al abrir cada fase:** tu primera línea es «Fase N · modelo requerido: X · esfuerzo sugerido: E (`/effort E` si tu encabezado muestra otro) · modelo activo: Y» (Y lo lees de tu encabezado; pedido del usuario, 2026-11-07). **Si no coinciden, NO construyes nada** hasta que el usuario escriba «vamos con Y» (queda en el cierre como decisión) o cambie con `/model X`. Es un renglón, no una parada.
  - **El esfuerzo es sugerido:** va en el gate con su comando, pero no detiene nada ni se reporta como desvío. `/model`, `/effort`, `/compact` y `/advisor` los escribe el usuario: cuando el sprint los pida, se los pides en una línea con el comando exacto. Haiku en construcción simple está en prueba: su relevo es Sonnet y el cierre dice si bastó.
  - Los subagentes declaran su modelo (lectura: Haiku 5.5; auditor: Sonnet 5.5); ninguno hereda Opus o Fable por omisión.

## Reglas del kit (29, una línea cada una — detalle en `docs/REGLAS-ANEXO.md § N`)

Frecuencia: `[sprint]` cuesta en cada sprint · `[hito]` al abrir o cerrar un hito · `[cambio]` solo cuando el sprint toca lo que cubre · `[siempre]` pasiva. 🔒 = privacidad o seguridad.

1. `[siempre]` **TypeScript strict.** Sin `any` ni `@ts-ignore` sin justificación.
2. `[sprint]` **Tests de lo que cambia.** `core/` ≥ 90 %, UI > 50 %, ≥ 1 e2e por feature core; `--coverage` en `test`.
3. `[siempre]` **Motor separado de UI.** Lógica en `core/` y `src/lib`; componentes sin lógica de negocio.
4. `[siempre]` **Toda salida de modelo que se persista pasa por esquema** (Pydantic al emitir, Zod al leer).
5. `[siempre]` **A11y desde el inicio:** foco visible, aria, contraste AA; `prefers-reduced-motion` cambia propiedades, jamás la forma del árbol; el color nunca solo.
6. `[siempre]` **Commits convencionales**; branch `sprint-NNN/<tema>`; jamás push directo a `main`; ruleset `main-protegida` con los 5 checks de P16; un job de CI nuevo entra a la ruleset en el mismo sprint.
7. `[siempre]` 🔒 **Secrets solo en el entorno;** gitleaks a doble cinturón (hook PreToolUse que falla cerrado + `githooks/pre-commit`); carnada canónica.
8. `[sprint]` **Presupuesto medido:** horas con `scripts/horas-sprint.mjs`; si lo excedes, simplifica o consulta.
9. `[sprint]` **Manual de uso vivo** (`docs/MANUAL-DE-USO.md`, ES/EN): toda feature que llega a `main` tiene su sección en el mismo sprint.
10. `[hito]` **El diseño va antes del código:** G-Diseño hecho (2026-09-27, `design-system.md` 1.0.0); FIDELIDAD cumplida (2026-09-29); solo **DECISIÓN** abre parada (máx. 1 por sprint); FORMA y TEXTO al gate humano del hito.
11. `[cambio]` **Guía de prueba viva** (`docs/GUIA-DE-PRUEBA.html`): se toca solo si cambia un flujo visible; lo que no se automatiza se corre en el ensayo general del hito, sin acumulados ni contrapesos.
12. `[siempre]` **Prohibido entregar por artifacts o plataformas externas:** todo entregable es un archivo del repo.
13. `[hito]` **Brochure:** en planlang lo arma CV Viva desde el export y el complemento (P14); `docs/brochure-export.json` se ajusta al cierre de cada hito.
14. `[siempre]` **Código primero, IA generativa después:** feature LLM ⇒ ADR «código primero»; la IA es acento con fallback determinista.
15. `[cambio]` **Un gate se demuestra fallando** (`scripts/demo-rojo.sh`, solo gates propios nuevos); un check `skipped` no es verde; **un «pending» tampoco**: antes de empujar, `pnpm test` entero y ruff sin `-q`, y la conclusión de la corrida anterior leída; todo modo de arranque que se distribuye corrió en vivo al menos una vez.
16. `[hito]` **`design-sync/` es artefacto del repo** y se actualiza al cierre del hito; `/design-sync` lo invoca el usuario, tú lo ejecutas.
17. `[siempre]` 🔒 **Cero enlaces:** ningún archivo versionado ni campo de GitHub publica producción o previews; barrido en `quality` (`scripts/cero-enlaces.mjs`, hosts en `cero-enlaces.json`); homepage del repo = el propio repo.
17-bis. `[siempre]` **Lo que la app escribe también es superficie:** derivados con permisos 700/600 (hilos SQLite del entrevistador, trazas).
18. `[siempre]` **UN SOLO PR VIVO POR APP** (regla dura del usuario 2026-10-11, kit v2.1.0; Dependabot cuenta): `gh pr list --state open` antes de abrir cualquier PR; un segundo solo complementario, con «complementa #N: <por qué no cabe en #N>» como primera línea del cuerpo; job `un-pr-vivo` en la CI. Dependencias: `scripts/verificar-dependencias.mjs` con `degradaciones-permitidas.json`; excepción de auditoría solo por id, sin parche y con ADR (`braces`, ADR-015, revisar antes del 2026-12-01); `lucide-react` fijo en la versión del design system.
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
29. `[siempre]` **Relevo, nunca loop (regla dura del usuario, 2026-10-11; kit v2.2.0).** Segundo intento fallido sobre el mismo problema, o 20 min sin avance verificable ⇒ paras, escribes qué intentaste y pides relevo en una línea con el `/model` del escalón siguiente (Haiku → Sonnet → Opus; de Opus decide el usuario). Jamás un tercer intento por el mismo camino con el mismo modelo.

## Cierre ejecutivo (`sprints/SPRINT_NNN-cierre.md`, ≤ 40 líneas)

Frontmatter `sprint · app · hito · opened · closed · branch · pr`; campos en una línea cada uno: nombre · objetivo planeado · resultado · estado · tiempo estimado (el de la orden) · tiempo real (salida de `scripts/horas-sprint.mjs`) · diferencia · fases planeadas y reales · horas por fase · entregables · no completado · desviaciones · causas · decisiones · deuda (medios y bajos con `archivo:línea`, al lote del hito) · aprendizajes · recomendación para el siguiente · esfuerzo-beneficio · **auditoría** (4 casillas; C/A con `pagado · <commit>`) · fase que se pasó > 50 %: causa y medida · **modelo por fase y desvío** (si Haiku bastó o no) · **relevos** (cuántos · de qué modelo a cuál · por qué; o «ninguno») · servidores al STOP («`lsof` LISTEN en este repo: 0») · «Para mergear: squash y borrar la rama; después `/cierre-sprint planlang`».

## Comandos

`/plan-sprint` · `/audita-sprint` · `/deploy-check --python` · `/design-sync` (hito; lo invoca el usuario) · opcionales `/self-review`, `/run-tests`, `/security-audit`. Scripts: `scripts/horas-sprint.mjs` · `scripts/demo-rojo.sh` · `scripts/verificar-dependencias.mjs` · `scripts/cero-enlaces.mjs` · `scripts/lighthouse-margen.mjs` (con el parche de presupuesto por ruta) · `pnpm plan:validar` · `pnpm plan:aprobar` (solo el usuario) · `pnpm entrevistar` · `pnpm lote:demo` / `lote:demo-b` · `pnpm comparacion` · `pnpm trazas:verificar` · `pnpm diagrama:verificar` · `pnpm paquete:vitrina` · `pnpm test:e2e:paquete` · `pnpm fichas`.

## Estándares (los 6+1, gates en CI)

Testing · CI/CD · Observabilidad · Seguridad · Performance (`perf-budget.json` por ruta: LCP 2,8 s en todas mientras dure Next 16.4, ADR-017, sobre el 2,8 s del playground de ADR-011; Lighthouse en CI con tres corridas y la mediana; categorías ≥ 0,9) · UX+A11y · IA embebida responsable. Detalle canónico: `estandares/estandares.md` v3 de la planeadora. Ítem rojo ⇒ deuda explícita en el cierre o el sprint no cierra.

# Compact instructions

Al compactar conserva: el archivo del sprint (`SPRINT_NNN.md`) como manifiesto, la fase en curso con su modelo y su esfuerzo, las
rutas tocadas con su último commit, las decisiones del dueño y los defaults que rigen, las huellas de planes y corridas que el
sprint creó, los gates en rojo con su causa y lo que falta para el STOP. Descarta salidas de herramientas, contenidos de archivos
ya leídos, trazas y diffs: se releen si hacen falta. Los patrones de dominio viven en `.claude/rules/motor.md` y se cargan solos
al tocar sus rutas.

Constitución núcleo kit v2.3.0 · planlang · regenerada 2026-11-02 — las reglas en detalle viven en `docs/REGLAS-ANEXO.md` y se leen solo cuando una regla se cita.
