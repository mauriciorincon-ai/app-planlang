# ADR-013 — El demo B usa IA generativa solo para leer los documentos y para investigar el contexto de un parecido: por qué el código no alcanza

**Summary (EN):** In demo B (customer due-diligence onboarding) everything that decides is code: the list match
(deterministic Jaro-Winkler, mirrored byte for byte in TypeScript and Python), the document inconsistencies, the risk
score (declared rules that never read the person's name, nationality or year of birth), the proposal, the routing
(the plan's edges), the file, the reply, the adverse-decision document and both guards. The model is called for two
things only: reading the three free-text documents into nine fields (one call per case), and, when the similarity
falls from the grey zone upwards, judging from context whether the applicant is the listed person or a namesake (zero
or one call). Neither call decides: a "same person" verdict sends the case to the officer. Without the model the case
is not decided; it is retried.

> Plantilla del kit v1.27.0 (regla dura «código primero», estándares § 7, G-Metodo 2026-07-12).
> **Cítese por tema:** «ADR código primero del demo B».

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S3 «Demo B y el cierre del ciclo» (fase 2)

## 1. La funcionalidad, en una frase de usuario

Un oficial de cumplimiento recibe, por cada solicitud de vinculación sintética, un expediente en español y en inglés
que dice con qué lista se cruzó el nombre (con la versión y la fecha de la lista), cuánto se parece, qué concluyó el
investigador si hizo falta, cuál es el puntaje de riesgo y de qué reglas sale, qué propone el agente y por qué. Ninguna
solicitud se rechaza sin él, y ninguna con riesgo alto se aprueba sin él.

## 2. Lo que se intentó con CÓDIGO primero (obligatorio, con evidencia)

| Intento determinista                                                                                                                                                                                | Qué resolvió                                                                                                                                                  | Dónde se quedó corto                                                                                                                                                                                                                                                                                                                                  | Evidencia                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Cruce con las listas** (RL-01 exacta, RL-02 Jaro-Winkler sobre nombres normalizados con tokens ordenados; plegado de tildes por tabla, redondeo con la misma operación IEEE en los dos lenguajes) | Toda la similitud y la entrada más parecida, incluido el orden «apellidos, nombre» y las transliteraciones cercanas                                           | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | `similitud.test.ts` (valores publicados de Jaro-Winkler), `test_python_reproduce_la_verdad_que_escribio_typescript` |
| **Inconsistencias documentales** (RI-01 dato exigido ausente · RI-02 otro documento citado · RI-03 otro titular citado)                                                                             | Todas                                                                                                                                                         | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | `reglas.test.ts`                                                                                                    |
| **Puntaje de riesgo** (RP-01 actividad 0/20/40 · RP-02 jurisdicción de los fondos 0/15/30 · RP-03 coherencia de ingresos 0/30; RP-04: el puntaje no recibe a la persona)                            | Todo (RF-04b.3 lo exige por reglas)                                                                                                                           | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | prueba de permutación en TS y en Python; la firma de `puntaje` solo admite tres datos                               |
| **Propuesta** (RD-01 investigador dice «misma persona» sobre una entrada vinculante · RD-02 identidad no verificable · RD-03 aprobar) y **ruteo** (las 7 aristas del plan B con el intérprete)      | Toda la decisión del agente                                                                                                                                   | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | `test_el_lote_de_20_simulado_decide_lo_que_dice_la_verdad…`, RF-09.2 en `trazas:verificar`                          |
| **Expediente, respuesta y documento de decisión adversa** por plantilla de código, con una cita por conclusión (`conclusiones_sin_cita`)                                                            | Todo (el plan B declara el redactor como nodo de tipo `regla`)                                                                                                | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | `test_el_expediente_cita_version_y_fecha…`                                                                          |
| **Guardias**: entrada por patrones (RG-01), minimización antes del modelo, salida por identificadores, frases inyectadas y lista blanca (RG-02, RG-03)                                              | Todas                                                                                                                                                         | No se quedó corto: **código**                                                                                                                                                                                                                                                                                                                         | `test_la_guardia_de_salida_filtra…`, `test_los_datos_de_terceros_no_llegan_al_modelo_ni_salen`                      |
| **Extracción por expresiones regulares** sobre los documentos                                                                                                                                       | Las etiquetas del documento de identidad sintético («Titular:», «Año de nacimiento:»)                                                                         | La declaración de actividad es prosa del solicitante: «compro y vendo oro y plata al por mayor» es SYN-ACT-08 «Comercio de metales preciosos» sin compartir una palabra; el origen de fondos nombra un lugar, no un código; en el mundo real los formatos varían por emisor. Una regex que lea NUESTRAS plantillas mediría el generador, no el agente | Los diccionarios de `core/sintetico/demo-b/diccionarios.ts` (descripción ≠ nombre de catálogo, a propósito)         |
| **Regla de contexto** para el homónimo: mismo año de nacimiento y misma nacionalidad ⇒ misma persona                                                                                                | **En este conjunto sintético acertaría todo**: los homónimos difieren de la entrada en 12–30 años y en nacionalidad, las transliteraciones coinciden en ambos | Fuera del conjunto, el contexto llega incompleto o en prosa (alias, fechas parciales, prensa adversa). Y el plan B lo pide como hipótesis a medir: RF-04b.2 exige el investigador y el supuesto S1 mide justamente si hace falta. Se declara aquí para que nadie lea el acierto del investigador como prueba de que el modelo era necesario           | Generador: `homonimo()` y `transliterado()`                                                                         |

## 3. Dónde entra el LLM y dónde NO

- **Entra en:** (1) el **extractor**, una llamada por caso: los tres documentos minimizados y entre delimitadores →
  nueve campos con `--json-schema` (actividades y jurisdicciones como `enum` del catálogo); (2) el **investigador de
  contexto**, cero o una llamada por caso, solo cuando la arista del verificador lo manda (similitud ≥ U4, el inicio de
  la zona gris): recibe datos estructurados del solicitante y de la entrada (nombre, año, nacionalidad, similitud),
  nunca el texto de los documentos, y devuelve `misma_persona` u `homonimo` con razones en los dos idiomas.
- **NO entra en:** la similitud, las inconsistencias, el puntaje, la propuesta, la decisión, la pausa, el expediente,
  la respuesta al solicitante, el documento adverso ni las guardias. El investigador no decide: «misma persona» sobre
  una entrada vinculante vuelve la propuesta «rechazar», y todo rechazo pasa por el oficial.
- **Separación control/datos (regla dura 5):** el contenido de un documento jamás cambia qué nodo corre ni qué regla
  se aplica; una instrucción escondida enciende `carga_detectada` y el caso va al oficial.
- **Arquitectura, no arista (RF-04b.6):** el redactor corta el caso si va a emitir un rechazo sin pausa o una
  aprobación con el puntaje en o sobre el umbral de escalamiento sin pausa, aunque un plan mal escrito omita la arista
  (dos carnadas en `test_demo_b.py`).

## 4. Fallback determinista (obligatorio)

El plan B v1 no declara aristas de respaldo por proveedor (las del A, AU-9, llegaron por enmienda). Sin modelo, o si
la llamada falla, **el caso no se decide**: queda con una traza parcial que nombra el nodo y el tipo de error; si fue
el límite de uso, la sesión se detiene y el caso se reintenta en la siguiente. Nada se aprueba ni se rechaza sin la
lectura. El proveedor simulado (`ChatSimulado` con las respuestas que declara el generador) corre todo el grafo en CI
sin una sola llamada real. Que el caso sin proveedor pase a una persona (como en el A) exige una enmienda del plan B
que aprueba el usuario; queda propuesta, no hecha.

## 5. Proveedor, costo y privacidad

- **Proveedor:** la suscripción de Claude Code del usuario por `ChatClaudeCode` (regla 6, estándar 7-S; ADR-002), con
  el interruptor por `PLANLANG_PROVEEDOR`. Lotes fuera de CI, de 20 casos (lo fija el plan B), espaciados.
- **Costo:** entre una y dos llamadas por caso en el multiagente (el lote de 20 versionado tiene 6 casos en la zona
  gris o por encima; el de 200, 44); la línea base de agente único hace exactamente una (ADR-006). Cada paso registra tokens y costo
  nominal.
- **Privacidad:** todo es sintético. Antes del modelo se quitan teléfonos, correos y los números de documento del
  origen de fondos (ninguno es del solicitante que haga falta extraer); los años de nacimiento van sin día ni mes; el
  expediente escribe la fecha de cada lista como mes y año (la completa viaja en la cita estructurada, fuera del texto).
- **Medición fuera del grafo:** `extraccion_correcta` (criterio C5) la calcula el arnés del lote al terminar el caso,
  comparando la extracción con la verdad conocida; el grafo jamás ve la verdad.

## Consecuencias

- El demo B se construye según el plan B v1 aprobado por el usuario: nueve nodos, siete aristas, una pausa con el rol
  de oficial y el payload completo que el plan pide (documentos, coincidencias, investigación, puntaje, evidencia y
  contraevidencia).
- Las listas de control son un archivo legible con huella (`data/listas/demo-b.json`) que el lote y la corrida citan,
  como el plan de beneficios del A; el plan B no las nombra y no se re-aprueba por eso.
- Riesgo aceptado: la similitud de Jaro-Winkler entre nombres sin relación de estos diccionarios ronda 0,65, cerca del
  inicio de la zona gris (0,70, valor estimado en la entrevista delegada). Los casos «limpios» se construyen por debajo;
  en datos reales más nombres caerían en la zona gris y llamarían al investigador. Es lo que S1 y el playground dejan
  ver.
