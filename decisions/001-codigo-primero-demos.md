# ADR-001 — Los demos de planlang usan IA generativa solo para extraer y redactar texto libre: por qué el código no alcanza

**Summary (EN):** Demo agents use generative AI only where code cannot reach: extracting fields from free clinical text, asking one clarifying question and drafting the reply. Routing, coverage checks, the output guard and the adverse-decision document are deterministic code. §4 records the real fallback behaviour: since plan v1.4 (S2, AU-9) a provider failure while extracting or clarifying sends the case to the human pause.

> Plantilla del kit v1.27.0 (regla dura «código primero», estándares § 7, G-Metodo 2026-07-12).
> **Cítese por tema:** «ADR código primero de los demos».

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 «El contrato y la corrida»

## 1. La funcionalidad, en una frase de usuario

Un agente simulado de autorizaciones médicas recibe la solicitud de un médico (texto libre, orden
adjunta y datos sintéticos del afiliado), la convierte en campos, aplica el plan de beneficios y
responde aprobar, negar con causal o escalar a un auditor humano, dejando en la traza cada señal con
la que decidió.

## 2. Lo que se intentó con CÓDIGO primero (obligatorio, con evidencia)

| Intento determinista                                                                                                         | Qué resolvió                                                                                             | Dónde se quedó corto                                                                                                                                                                                                                                                                                                                                                       | Evidencia (test, métrica, kit de prueba)                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Enrutador por reglas** sobre la orden estructurada (`tipo_atencion`)                                                       | Todo: urgencia ⇒ sin cobertura; el texto libre jamás elige nodo (separación control/datos)               | No se quedó corto — **se queda como código**                                                                                                                                                                                                                                                                                                                               | `agents/tests/test_grafo_demo_a.py` (fase 3)                                                                                                                                                       |
| **Verificador de cobertura por reglas** (exentos, exclusiones con causal, alto costo, contradicción orden/texto)             | Todo: son reglas escritas en `data/plan-beneficios/demo-a.json`                                          | No se quedó corto — **código**                                                                                                                                                                                                                                                                                                                                             | `agents/tests/test_grafo_demo_a.py` (las reglas viven en `agents/src/app_agents/demo_a/nodos.py`; enmendado 2026-09-27, auditoría S1)                                                                          |
| **Guardia de salida por reglas** (identificadores del conjunto, patrones de instrucción inyectada, lista blanca de acciones) | Todo; única defensa con evidencia frente a atacantes adaptativos (científica I8, Nasr/Carlini 2025)      | No se quedó corto — **arquitectura**                                                                                                                                                                                                                                                                                                                                       | `agents/tests/test_guardia.py`                                                                                                                                                                     |
| **Documento de decisión adversa** por plantillas de código ES/EN                                                             | Todo: causal tasada, regla, datos usados, versión, vía de contradicción                                  | No se quedó corto — **código**                                                                                                                                                                                                                                                                                                                                             | `agents/tests/test_documento_adverso.py`                                                                                                                                                           |
| **Extracción por patrones** (expresiones regulares y diccionarios sobre el texto libre del médico)                           | Casos `normal` con vocabulario del diccionario                                                           | El texto del médico es libre por diseño del demo (RF-04a.1): sinónimos, abreviaturas, negaciones («no es urgente»), campos implícitos («como el mes pasado»), y los adversarios inyectan instrucciones que un patrón no distingue de datos. Una extracción por patrones no produce **confianza** — y el plan mide justo la calibración de esa confianza (supuesto S1, E-5) | **No medido en el S1** (enmendado 2026-09-27, auditoría S1): la evidencia hoy es cualitativa (variantes léxicas de `core/sintetico/diccionarios.ts`); la línea base de extracción por patrones sobre el lote de 20 queda como **deuda del S2** |
| **Redacción por plantilla** de la respuesta al afiliado                                                                      | La parte fija (aviso de IA, causal, vía de contradicción) — **se queda como código** (documento adverso) | El párrafo explicativo en lenguaje llano ES/EN por caso: una plantilla produce texto genérico que un lector no técnico no reconoce como respuesta a SU solicitud (gate ⭐ de lectura de la VISION)                                                                                                                                                                         | Juicio del gate ⭐ (parada 2); en la vitrina el redactor es la única salida «creativa»                                                                                                             |

## 3. Dónde entra el LLM y dónde NO

- **Entra en:** `extractor` (texto libre → campos + confianza verbalizada), `aclaracion` (formular la
  pregunta cuando faltan campos; ≤ U3 ciclos) y `redactor` (párrafo explicativo de la respuesta, ES/EN).
  Más adelante: el entrevistador (S3), el demo B (S3) y un juez selectivo para «calidad de redacción»
  (nunca fuente única del veredicto, E-8).
- **NO entra en:** enrutador, verificador de cobertura, decisión (nodo escritor de señales), pausa
  humana, guardia de salida, documento adverso, generador sintético, validador de identificadores,
  planeador, verificador de brecha, playground y visor. **El núcleo jamás invoca un modelo** (regla dura 1).
- **Entrada al modelo:** solo edad, sexo, procedimiento, diagnóstico y texto del médico; nombre e
  identificación **enmascarados antes del nodo** (decisión D1 del plan, mapa de datos F7). Todo es
  sintético con semilla; ningún dato del usuario entra al prompt. El texto del caso se marca como
  DATOS en el system prompt propio.
- **Salida del modelo:** esquema Pydantic con `extra="forbid"` ↔ `--json-schema` del CLI (salida
  estructurada nativa); una salida que no valide se reintenta ≤ 2 veces y luego es
  `error_proveedor = esquema_invalido` (§ 9.1 de la especificación). Nada de texto libre directo a la
  traza sin validar.

## 4. Fallback determinista (obligatorio)

> **Enmendado 2026-09-27 (auditoría S1, AU-9):** la versión anterior de esta sección describía un
> enrutamiento a `pausa_humana` con motivo `proveedor_no_disponible` que el código no implementaba.
> **Enmendado 2026-10-01 (S2, AU-9 pagado):** ese enrutamiento existe desde el plan v1.4. Este es el
> comportamiento real.

Sin proveedor el caso **no se inventa**:

- **`limite_de_uso`** (en stderr o en el JSON del CLI): la sesión se detiene, el caso no se exporta y
  se reintenta en la sesión siguiente, acumulable sin duplicar (RF-05.5).
- **Cualquier otro error** (`timeout`, `esquema_invalido` tras 2 reintentos, `otro`) **al extraer o al
  aclarar**, desde el plan v1.4 (S2, AU-9): el nodo deja `proveedor_no_disponible = true` y
  `error_proveedor`, y la arista de respaldo del plan (orden 1 de `extractor` y de `aclaracion`) lleva el
  caso a `pausa_humana`. Una persona ve el caso completo con lo que haya (motivo: la señal
  `proveedor_no_disponible`) y decide; la traza queda `completo`, con el paso que falló y su costo. R9 lo
  anticipa en el plan y el verificador lo cuenta como riesgo ocurrido, no como brecha no prevista.
- **Lo que queda fuera:** si falla el **redactor**, la decisión ya está tomada (y si es adversa, ya la vio
  una persona): se exporta una traza parcial con `resultado: error` y el caso queda sin carta. Con un plan
  anterior a la v1.4 (sin la arista de respaldo) todo error se comporta así, como en el S1 (informe v1.2:
  A-012 de la línea base).
- En CI el proveedor es `ChatSimulado` (primera clase dentro del adaptador), así que toda la cadena
  plan → casos → grafo → trazas → informe corre sin modelo; `runs/demo-a/simulado-v1.4-respaldo` es la
  corrida versionada con fallas inyectadas.

## 5. Proveedor, costo y privacidad

- **Orden de proveedores:** suscripción de Claude Code del usuario (`ChatClaudeCode`, alias `sonnet`,
  ADR de proveedor y cumplimiento) → API de Anthropic (Haiku 4.5, techo US$10) → Groq
  (`gpt-oss-120b`); `simulado` como proveedor de primera clase para tests y CI. Un solo punto de
  conmutación: `PLANLANG_PROVEEDOR`.
- **Costo medido:** costo nominal por llamada del JSON del CLI (`total_cost_usd`) y tokens
  (`usage`) en `response_metadata`, en el logger estructurado y en la ficha de cada corrida. Humo
  real del 2026-09-27: ver bitácora del S1. Techo declarado: US$0 marginal por suscripción; US$10 si
  se activa el interruptor a API.
- **Privacidad:** se loguean solo metadatos (vocabulario cerrado del logger); prompts sin PII por
  construcción (sintético + enmascarado); la retención del proveedor no aplica a datos personales
  porque no los hay; LangSmith recibe entradas/salidas sintéticas y jamás credenciales.
- **HITL:** toda salida `negar` o `escalar` pasa por `interrupt` con un revisor de rol `auditor` que
  ve el caso completo con evidencia y contraevidencia; en lotes el revisor es simulado y sigue la
  verdad conocida (DA-04), y la vitrina lo divulga.

## Consecuencias

Gana: un demo donde la IA propone y el código decide, medible contra verdad conocida. Acepta: la
exactitud de extracción (C5) y la calibración (S1) dependen del modelo y se publican **con sus
fallas** (regla dura 9). Lo que la CI no ve y verifica el gate ⭐: latencia y cuota real del lote
(parada 1) y si el texto del redactor se reconoce como respuesta al caso (parada 2).
