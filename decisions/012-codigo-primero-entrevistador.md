# ADR-012 — El entrevistador usa IA generativa solo para redactar una respuesta libre como elemento del plan: por qué el código no alcanza

**Summary (EN):** The M2 interviewer is a LangGraph state machine whose questions, order, examples, template
proposals, element origin, derived trace signals, contradictions and the "never approves" rule are all code. The model
is called only when the user answers in free text, to turn that answer into the plan section it belongs to, written in
Spanish and English under the section's JSON Schema (taken from the same `plan.schema.json` that Zod generates). With
no model, or when it fails, the answer stays literal and its section is marked pending; the interview still finishes
and the draft says so.

> Plantilla del kit v1.27.0 (regla dura «código primero», estándares § 7, G-Metodo 2026-07-12).
> **Cítese por tema:** «ADR código primero del entrevistador».

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S3 «Demo B y el cierre del ciclo» (fase 1)

## 1. La funcionalidad, en una frase de usuario

La persona que planea un proyecto de agentes corre `pnpm entrevistar --demo b`, responde en su terminal catorce
preguntas guiadas por la plantilla de su dominio, cada una con un ejemplo y con la propuesta actual a la vista, y
recibe un **borrador** del plan con el origen de cada elemento, las contradicciones que el código encontró y un
documento de revisión en español y en inglés. El borrador no se aprueba solo: lo aprueba ella.

## 2. Lo que se intentó con CÓDIGO primero (obligatorio, con evidencia)

| Intento determinista                                                                                                                                                                                                    | Qué resolvió                                                                                                      | Dónde se quedó corto                                                                                                                                   | Evidencia                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Máquina de estados** (LangGraph: elegir → preguntar con `interrupt` → incorporar → cerrar), orden fijo de la plantilla, `SqliteSaver`                                                                                 | Todo el recorrido: ninguna pregunta se omite (§ 9.2), se sale y se retoma, otra pasada pregunta solo lo pendiente | No se quedó corto: **código**                                                                                                                          | `agents/tests/test_entrevistador.py` (golden, retomar desde SQLite)                                   |
| **Propuestas de la plantilla** (`data/dominios/dom-financiero.json` 1.1.0: actores, decisiones, riesgos, criterios, umbrales SIN valor y contrato de grafo)                                                             | La mayoría de las secciones se aceptan con «acepto», sin modelo: en la entrevista simulada, 5 de 14 preguntas     | Las decisiones, los valores de los umbrales, el problema, el flujo y los supuestos solo los puede dar la persona                                       | `dominios.test.ts`, `test_aceptar_no_llama_al_modelo…` (un modelo que falla la prueba si se le llama) |
| **Clasificación de la respuesta** por palabras normalizadas: «acepto», «pendiente», «salir»                                                                                                                             | Las respuestas que no son texto libre no llegan al modelo; «acepto» sobre una propuesta con huecos se repregunta  | Una frase libre («acepto los cuatro y agrego…») no es una palabra clave                                                                                | `test_respuestas_y_completitud`                                                                       |
| **Origen por código** (RF-02.4): idéntico a la propuesta ⇒ el origen de la propuesta; marcado «plantilla» sin serlo ⇒ «entrevistador»                                                                                   | El modelo no puede atribuir a la plantilla un cambio                                                              | No sabe, sin el modelo, si un elemento nuevo lo dijo la persona                                                                                        | `test_el_origen_lo_decide_el_codigo`                                                                  |
| **Señales derivadas** (RF-02.3): toda señal que lee un umbral, una arista o una condición y nadie declaró entra a `senales_obligatorias_en_traza`, con quién la lee                                                     | El agente sabe qué registrar; la aprobación no se detiene por una señal olvidada (M-23)                           | No se quedó corto: **código**                                                                                                                          | `test_rf_02_3_…`                                                                                      |
| **Contradicciones** (RF-02.5) en `core/plan/contradicciones.ts`: severidad ≥ 9 sin criterio, pausa sin umbral, umbral sin señal, umbral sin arista, criterio sin regla, pendiente                                       | Todas                                                                                                             | No se quedó corto: **código**                                                                                                                          | `contradicciones.test.ts` (un rojo por código)                                                        |
| **«Nunca aprueba»** (RF-02.6): las claves de aprobación se quitan de toda redacción y `estado_aprobacion: "borrador"` es lo último que se escribe; aprobar es otro comando (`plan:aprobar`) que exige M1 sin pendientes | Todo                                                                                                              | No se quedó corto: **código**                                                                                                                          | `test_carnada_nunca_aprueba`                                                                          |
| **Respuesta literal** como elemento (sin modelo)                                                                                                                                                                        | El problema y el flujo entran con el texto de la persona en su idioma (el flujo, una línea o frase por paso)      | No convierte «riesgo de aprobar a alguien en lista, severidad 10» en un modo de falla con efecto, causa, escalas y detector; no escribe el otro idioma | `test_sin_modelo_la_respuesta_queda_literal…`                                                         |

## 3. Dónde entra el LLM y dónde NO

- **Entra en:** una sola llamada por respuesta libre (`redactar.py`): con la sección tal como está, la pregunta, el
  contexto del plan (ids, señales, claves del verificador) y la respuesta, el modelo devuelve la sección completa
  redactada en español y en inglés. En la entrevista simulada fueron 9 llamadas de 14 preguntas.
- **NO entra en:** el orden de las preguntas, sus ejemplos, las propuestas, aceptar o dejar pendiente, el origen final
  de cada elemento, las señales obligatorias, las contradicciones, M1, la aprobación ni la escritura de archivos.
- **Entrada al modelo:** la respuesta de la persona va como DATO entre delimitadores (la palabra delimitadora se borra
  de la respuesta); el prompt de sistema prohíbe aprobar, tocar otra sección e inventar requisitos no dichos. El
  contenido es texto de planeación de la propia persona: no hay datos de terceros.
- **Salida del modelo:** `--json-schema` con el esquema de la sección sacado de `core/plan/plan.schema.json` (el que
  genera Zod), más el origen obligatorio por elemento y un valor de umbral que puede quedar en null. Al final, M1 y
  el esquema del plan validan el borrador entero del lado TypeScript (gate de contrato
  `tests/contrato/entrevista-borrador.test.ts`).
- **Bilingüe (regla 20):** el modelo redacta los dos idiomas; el que la persona no escribió queda registrado en la
  transcripción como redactado por el entrevistador, y la revisión lo lista para que la persona lo lea antes de
  aprobar. No es traducción automática de contenido publicado: es un borrador que la persona revisa.

## 4. Fallback determinista (obligatorio)

`--sin-modelo` corre la entrevista entera sin una sola llamada. Sin modelo, o si la llamada falla (límite de uso,
timeout, salida que no tiene la forma de la sección), la respuesta queda **literal**: el problema y el flujo entran en
el idioma de la persona con el otro idioma marcado `⟨pendiente · pending⟩`; una sección estructurada conserva su
propuesta y la pregunta queda **pendiente** con la respuesta guardada y el motivo (`sin_modelo`, `limite_de_uso`,
`redaccion_invalida`). La entrevista termina igual, la revisión nombra cada pendiente y `pnpm entrevistar --demo b
--retomar` vuelve solo a esas preguntas. Un borrador con pendientes no se aprueba.

## 5. Proveedor, costo y privacidad

- **Proveedor:** la suscripción de Claude Code del usuario por `ChatClaudeCode` (regla 6, estándar 7-S; ADR-002), con
  el interruptor por `PLANLANG_PROVEEDOR` y el simulado en CI. Corre fuera de CI y solo cuando la persona entrevista.
- **Costo:** una llamada por respuesta libre, unas diez por entrevista; la transcripción registra tokens y costo
  nominal de cada una (la suscripción no cobra por llamada).
- **Privacidad:** las respuestas son la planeación de la propia persona; viven en `plans/demo-<x>/transcripcion.json`
  y en el hilo `.entrevistas/demo-<x>.sqlite` (fuera del repo, carpeta 700 y archivo 600: regla 17-bis). Nada va a
  LangSmith. El logger no registra respuestas.
- **HITL:** el entrevistador nunca aprueba (RF-02.6). La persona revisa `revision.es.md` y dice «apruebo»; el
  constructor corre `pnpm plan:aprobar`, que vuelve a validar.

## Consecuencias

- El demo B nace de un plan propuesto por la entrevista y aprobado por una persona, con el origen de cada elemento a
  la vista.
- La plantilla de dominio crece: preguntas con id, sección, ejemplo y obligatoriedad; umbrales sugeridos sin valor y
  un contrato de grafo sugerido. La de salud migró sus preguntas al mismo formato.
- Riesgo aceptado: la redacción del otro idioma puede decir algo distinto de lo que la persona quiso. Lo contiene la
  revisión (lista cada texto redactado por el entrevistador) y la aprobación humana. El ⭐ largo del ciclo trae la
  lectura de los textos del entrevistador.
