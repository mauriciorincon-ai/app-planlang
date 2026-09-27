# ADR-002 — Proveedor de modelo por suscripción de Claude Code: lectura de los términos, régimen de lotes e interruptor

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 · **Estándar:** 7-S (estándares v2.15.0)
**Cítese por tema:** «ADR de proveedor y cumplimiento».
**Re-lectura obligatoria antes de cada release** (tabla al final).

## Contexto

El usuario fijó en la F0 #12 y confirmó en la F1 (Q2, 2026-09-26): «Claude a través de su
suscripción de Claude Code, no Groq ni una clave de API pagada». El spike de la planeadora
(`investigacion/spike-adaptador-claude-code/`) probó que `claude -p` responde con la sesión de la
suscripción, que `--json-schema` es salida estructurada nativa y que un adaptador `BaseChatModel`
queda trazado en LangSmith. La investigación técnica (§ 5) leyó los términos **por caso**.

## Fuentes leídas (todas verificadas con curl el 2026-09-26 por la planeadora; re-leídas aquí el 2026-09-27)

| #   | Fuente                                                       | URL                                                                                            | Vigencia declarada                 |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | Consumer Terms of Service                                    | https://www.anthropic.com/legal/consumer-terms                                                 | efectiva 2025-10-08                |
| 2   | Usage Policy                                                 | https://www.anthropic.com/legal/aup                                                            | efectiva 2025-09-15                |
| 3   | Commercial Terms                                             | https://www.anthropic.com/legal/commercial-terms                                               | efectiva 2025-06-17                |
| 4   | Claude Code › Legal and compliance                           | https://code.claude.com/docs/en/legal-and-compliance.md                                        | sin fecha en la página             |
| 5   | Help Center › Use the Claude Agent SDK with your Claude plan | https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan | 2026-06-16 («pausing the changes») |
| 6   | Claude Code › Authentication / Headless / CLI reference      | https://code.claude.com/docs/en/authentication.md · headless.md · cli-reference.md             | sin fecha                          |

## Citas que gobiernan el caso (textuales)

1. Consumer Terms, uso aceptable: «Except when you are accessing our Services via an Anthropic API Key
   **or where we otherwise explicitly permit it**, to access the Services through automated or
   non-human means…».
2. Consumer Terms, cuenta: «You may not share your Account login information, Anthropic API key, or
   Account credentials with anyone else. You also may not make your Account available to anyone else.»
3. Claude Code legal: «Your use of Claude Code is subject to: … Consumer Terms of Service — for Free,
   Pro, and Max users.» «Advertised usage limits for Pro and Max plans assume ordinary, individual
   usage of Claude Code and the Agent SDK.»
4. Claude Code legal, credenciales: «OAuth authentication is intended exclusively for purchasers of
   Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary
   use of Claude Code and other native Anthropic applications.» «Anthropic does not permit third-party
   developers to offer Claude.ai login into their own applications, or to route requests through Free,
   Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store,
   or intermediate Claude.ai credentials or session tokens.» «Nor does it prevent an end user from
   signing in to the unmodified Claude Code binary with their own Claude subscription.» «Anthropic
   reserves the right to take measures to enforce these restrictions and may do so without prior notice.»
5. Help Center 2026-06-16: «For now, nothing has changed: Claude Agent SDK, `claude -p`, and
   third-party app usage still draw from your subscription's usage limits. … When we have an update,
   we'll share it before anything takes effect.»
6. Headless: `--bare` «doesn't use your subscription login» ⇒ el adaptador **nunca** usa `--bare`.

## Veredicto por caso (técnica § 5)

| Caso                                                                   | Veredicto                                                | Cómo lo cumple planlang                                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| (a) `claude -p` en la máquina del propio suscriptor, proyecto personal | **Permitido** (citas 1, 4, 5)                            | Es exactamente lo que hace `ChatClaudeCode`: binario oficial sin modificar, sesión propia, en el Mac del usuario |
| (b) Agent SDK con login de suscripción, uso propio                     | Ambiguo                                                  | **No se usa** el SDK: subproceso `claude -p` (caso a)                                                            |
| (c) Envolver la salida como modelo de LangChain para lotes de 200      | **Ambiguo, con derecho de Anthropic a actuar sin aviso** | Mitigaciones de abajo: lotes de 20, espaciados, fuera de CI, «uso ordinario e individual»                        |
| Terceros autenticándose con la suscripción del autor                   | **Prohibido** (cita 4)                                   | La app privada no se publica; la vitrina no llama a modelos (RF-10.1); para terceros la vía es clave de API      |

## Decisión

1. **Proveedor por defecto = suscripción de Claude Code** vía `ChatClaudeCode(BaseChatModel)`
   (`agents/src/app_agents/adaptador.py`): `claude -p --output-format json --model sonnet
--max-turns 1 --no-session-persistence --strict-mcp-config --mcp-config '{"mcpServers":{}}'
--setting-sources "" --tools "" --system-prompt <propio> --json-schema <esquema>`, **nunca `--bare`**,
   cwd = directorio temporal limpio (esta constitución no entra al prompt), `env` del hijo sin
   `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `LANGSMITH_API_KEY`,
   `LANGCHAIN_API_KEY`, `CLAUDECODE` **y sin ninguna variable con prefijo `ANTHROPIC_`, `LANGSMITH_`,
   `LANGCHAIN_` o `CLAUDE_CODE_`** (enmienda 2026-09-27, auditoría S1: `ANTHROPIC_BASE_URL` mandaría el
   token a un proxy y `CLAUDE_CODE_USE_BEDROCK` cambiaría el proveedor en silencio; humo real 3/3 tras
   el cambio). Test literal de la línea de comando y del `env`
   (`agents/tests/test_adaptador_flags.py`); humo real (`test_adaptador_humo_real.py`) con
   `PLANLANG_HUMO_REAL=1` antes de cada lote.
2. **El token jamás sale del binario:** el adaptador no lee ni escribe credenciales; `session_id` y
   `uuid` del CLI se descartan; a `response_metadata`, al logger y a las trazas viajan solo `usage`,
   `total_cost_usd`, `duration_ms`, `subtype`, `is_error`. Doble cinturón gitleaks (hook de git + hook
   de Claude Code) y test de ausencia de patrones de clave en `runs/`.
3. **Lotes fuera de CI, de 20 casos, espaciados, acumulables sin duplicar** (RF-05.5): `pnpm lote:demo`
   y `pnpm lote:base` pasan `--pausa-s 2`; con la suscripción, `lotes.py` **rechaza** una sesión sin
   pausa o de más casos que `lotes.corridas_espaciadas_de` del plan, y toma el alias del modelo de
   `lotes.modelo_alias` (enmienda 2026-09-27, auditoría S1, AU-10). Ante `limite_de_uso` —en stderr o
   solo en el JSON del CLI— el lote para y registra el límite en la ficha de la corrida. La CI conoce
   solo el proveedor `simulado`. Uso «ordinario e individual» (cita 3), **medido el 2026-09-27**: un
   lote de 20 ≈ 47–49 llamadas en el multiagente y ≈ 23 en el agente único, contexto del extractor
   ≈ 4,7 mil tokens, ≈ 5 min con 2 s de pausa entre casos (bitácora S1, fase 5).
4. **Interruptor a proveedor por clave** sin tocar el grafo: `PLANLANG_PROVEEDOR=anthropic`
   (`claude-haiku-4-5-20251001`, extra `langchain-anthropic`, **techo US$10 por ciclo**) o
   `PLANLANG_PROVEEDOR=groq` (`openai/gpt-oss-120b`). Se activa solo por decisión del usuario, y la
   ficha de la corrida registra el proveedor.
5. **Prohibido para terceros:** ningún visitante ni usuario externo se autentica con la suscripción del
   autor. La vitrina es estática y no invoca modelos.

## Riesgo aceptado

Anthropic puede endurecer el caso (c) sin aviso (cita 4). Si ocurre: el lote registra el error, el
interruptor a API entra por configuración (techo declarado) y este ADR se marca «superado». Ninguna
funcionalidad del producto depende de que la suscripción siga sirviendo: el núcleo y la vitrina
corren sin modelo.

## Registro de re-lecturas (antes de cada release — casilla de `/deploy-check`)

| Fecha      | Quién                        | Fuentes                                                            | Cambio detectado | Acción                                              |
| ---------- | ---------------------------- | ------------------------------------------------------------------ | ---------------- | --------------------------------------------------- |
| 2026-09-26 | planeadora (F1, técnica § 5) | 1–6                                                                | — (línea base)   | Decisión Q2 del usuario: suscripción en lotes de 20 |
| 2026-09-27 | builder (S1, este ADR)       | 1–6 (re-leídas desde la técnica; sin cambio de vigencia declarado) | ninguno          | ADR aceptado                                        |
