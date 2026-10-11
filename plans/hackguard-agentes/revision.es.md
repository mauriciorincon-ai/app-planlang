# Revisión del borrador — hackguard-agentes

Lo propuso el entrevistador con tus respuestas. Nada está aprobado: el plan pasa a v1 solo cuando dices «apruebo el plan hackguard-agentes».

## Estado

M1 lo acepta: se puede aprobar si estás de acuerdo con lo de abajo.

8 llamadas al modelo · costo nominal US$ 0.3406 (la suscripción no cobra por llamada).

Plantilla dom-seguridad-ia 1.1.0 · suscripcion / sonnet · 2026-10-11 · 1 pasada · 56528 tokens de entrada y 14589 de salida.

## Lo que M1 rechaza

Ninguna.

## Advertencias de M1 (no impiden aprobar)

Ninguna.

## Contradicciones que señala el entrevistador

Ninguna.

## Textos que redactó el entrevistador (léelos)

- P01: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P03: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P04: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P05: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P06: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P07: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P10: el texto en inglés lo redactó el entrevistador desde tu respuesta.
- P12: el texto en inglés lo redactó el entrevistador desde tu respuesta.

## Señales que el agente tendrá que registrar y que sumó el código

Ninguna.

## Elementos que el modelo omitió y el código devolvió

Ninguna.

## La entrevista, pregunta por pregunta

### P01 · problema · respondida

> ¿Qué problema resuelven los agentes, para quién, y qué no deben hacer jamás?

- Tu respuesta: «HackGuard planea y valida pruebas de seguridad para software y sistemas de IA. Sus dos agentes son skills de Claude Code: el investigador propone pruebas nuevas, versiones nuevas de marcos y retiros; el extractor asocia un resultado pegado a una prueba del plan con citas literales. Sirven al operador que valida la seguridad de sus apps y al auditor de gobierno de IA que pide evidencia por control. Jamás ejecutan pruebas, jamás generan ni guardan cargas de explotación, jamás cierran un hallazgo ni fijan una severidad por su cuenta: la IA propone y una persona aprueba.» (español)
- Resultado: `redactada`

### P02 · actores · aceptada

> ¿Quiénes participan, personas y sistemas? Revisa los de la plantilla: ¿falta o sobra alguno?

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`
- Elementos: analista (plantilla), propietario (plantilla), auditor (plantilla), revisor (plantilla), catalogo (plantilla), investigador_pruebas (plantilla), extractor_resultados (plantilla)

### P03 · flujo · respondida

> ¿Qué recorrido sigue cada tarea, paso a paso, desde que llega hasta la decisión de una persona? Cubre los dos agentes.

- Tu respuesta: «Llega la tarea: investigar una prueba o extraer un resultado. Si es investigar, el investigador busca solo en fuentes de la lista blanca y el código verifica que cada fuente existe y dice lo que se cita; la propuesta entra al catálogo como borrador. Si es extraer, el texto pegado pasa primero por el filtro de instrucciones, que marca y nunca rechaza; el extractor propone la prueba candidata y los campos con cita literal; el código verifica que cada cita es subcadena de la fuente y calcula el veredicto con la regla del catálogo. En los dos casos, una persona confirma o corrige antes de que nada quede como evidencia.» (español)
- Resultado: `redactada`

### P04 · decisiones · respondida

> ¿Qué fuentes puede consultar el investigador de pruebas, y qué pasa con una propuesta que tiene pocas fuentes verificadas?

- Tu respuesta: «Solo fuentes de una lista blanca, cada una comprobada por código: que exista y que diga lo que se cita. Búsqueda y redacción van en etapas separadas. Una propuesta con menos fuentes verificadas que el mínimo del plan llega a la persona marcada como no verificada; no se descarta sola.» (español)
- Resultado: `redactada`
- Elementos: D1 (usuario), D2 (plantilla), D3 (plantilla), D4 (plantilla)

### P05 · decisiones · respondida

> ¿Quién calcula el veredicto sugerido, y qué tan de cerca debe coincidir una cita con su fuente?

- Tu respuesta: «El veredicto lo calcula la regla del catálogo sobre los campos cuyas citas verificó el código; el modelo no emite el veredicto. Una cita vale solo si es subcadena literal exacta del texto pegado tras normalizar espacios: por debajo de eso la cita no cuenta y decide una persona.» (español)
- Resultado: `redactada`
- Elementos: D1 (usuario), D2 (usuario), D3 (plantilla), D4 (plantilla)

### P06 · decisiones · respondida

> ¿Quién fija la severidad de un hallazgo?

- Tu respuesta: «La severidad la fija siempre una persona, con la calculadora de referencia de CVSS 4.0 para software y la tabla de prioridad para IA. Los agentes nunca sugieren ni precargan un valor.» (español)
- Resultado: `redactada`
- Elementos: D1 (usuario), D2 (usuario), D3 (usuario), D4 (plantilla)

### P07 · decisiones · respondida

> ¿Qué pasa con una prueba propuesta, y qué tan vieja puede ser la versión de su marco antes de que una persona deba mirarla?

- Tu respuesta: «Toda prueba nueva entra al catálogo como borrador y se activa solo cuando una persona la aprueba. Toda prueba lleva la versión de su marco con fecha; si la versión supera la antigüedad tolerada del plan, una persona la mira antes de usarla.» (español)
- Resultado: `redactada`
- Elementos: D1 (usuario), D2 (usuario), D3 (usuario), D4 (usuario)

### P08 · riesgos · aceptada

> ¿Qué puede salir mal, qué tan grave sería (1 a 10) y qué tan probable? Revisa los de la plantilla.

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`
- Elementos: R1 (plantilla), R2 (plantilla), R3 (plantilla), R4 (plantilla)

### P09 · riesgos · aceptada

> ¿Cómo se sabe en las trazas que un riesgo ocurrió?

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`
- Elementos: R1 (plantilla), R2 (plantilla), R3 (plantilla), R4 (plantilla)

### P10 · supuestos · respondida

> ¿Qué das por cierto que, si resultara falso, cambiaría el diseño? ¿Cómo lo probarías barato?

- Tu respuesta: «Doy por cierto que comprobar que una cita es subcadena literal de su fuente basta para detectar una cita inventada; lo pruebo sembrando 20 citas, 10 inventadas, y el verificador debe marcar las 10. Y doy por cierto que una skill sin herramientas ni red solo puede sesgar su propia salida; lo pruebo pegando texto con instrucciones sembradas y comprobando que el veredicto de la regla no cambia.» (español)
- Resultado: `redactada`
- Elementos: S1 (usuario), S2 (usuario), S3 (plantilla)

### P11 · criterios · aceptada

> ¿Qué tiene que cumplirse siempre, y qué tasa mínima aceptas? El entrevistador propone cómo medir cada uno.

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`
- Elementos: C1 (plantilla), C2 (plantilla), C3 (plantilla), C4 (plantilla), C5 (plantilla)

### P12 · umbrales · respondida

> ¿Con qué valor se detiene el agente en cada umbral propuesto? Si hay zona gris, ¿dónde empieza y dónde termina?

- Tu respuesta: «Similitud mínima de cita 1,0: la cita es literal o no vale. Al menos 2 fuentes verificadas por propuesta. Un marco con más de 180 días desde su versión pasa a una persona, el mismo plazo que HackGuard usa para evidencia antigua.» (español)
- Resultado: `redactada`
- Elementos: U1 (usuario), U2 (usuario), U3 (usuario)
- Lo que explicó el entrevistador:
  - U1: El agente debe registrar en la traza, por cada cita literal, el valor de similitud_cita frente a la fuente (1,0 es idéntica); con menos de 1,0 debe registrar la pausa_humana.
  - U2: El agente debe registrar en la traza cuántas fuentes verificadas tiene cada propuesta (fuentes_verificadas); con menos de 2 debe registrar la pausa_humana.
  - U3: El agente debe registrar en la traza la antiguedad_marco_dias de la versión del marco de cada prueba; con más de 180 días debe registrar la pausa_humana.

### P13 · contrato · aceptada

> ¿Qué pasos siguen los agentes y en cuáles se detienen para una persona? Revisa la propuesta: nodos, ramas y pausa.

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`

### P14 · lotes · aceptada

> ¿Cuántos casos tendría un lote de prueba y uno completo, de a cuántos se correrían y con qué modelo?

- Tu respuesta: «acepto» (español)
- Resultado: `aceptada`

## El plan, sección por sección

### Problema

**Seguridad de IA · planeación de pruebas y evidencia de resultados**

HackGuard planea y valida pruebas de seguridad para software y sistemas de IA. Sus dos agentes son skills de Claude Code: el investigador propone pruebas nuevas, versiones nuevas de marcos y retiros; el extractor asocia un resultado pegado a una prueba del plan con citas literales. Sirven al operador que valida la seguridad de sus apps y al auditor de gobierno de IA que pide evidencia por control. Jamás ejecutan pruebas, jamás generan ni guardan cargas de explotación, jamás cierran un hallazgo ni fijan una severidad por su cuenta: la IA propone y una persona aprueba.

### Actores

| id | actor | tipo | origen |
|---|---|---|---|
| analista | Analista de seguridad | humano | plantilla |
| propietario | Propietario del activo | humano | plantilla |
| auditor | Auditor ISO/IEC 42001 | humano | plantilla |
| revisor | Revisor humano | humano | plantilla |
| catalogo | Catálogo de pruebas con versión | sistema | plantilla |
| investigador_pruebas | Investigador de pruebas (skill) | sistema | plantilla |
| extractor_resultados | Extractor de resultados (skill) | sistema | plantilla |

### Flujo

1. Llega la tarea y el enrutador decide si es investigar una prueba o extraer un resultado.
2. Si es investigar: el investigador busca solo en fuentes de la lista blanca.
3. El código verifica que cada fuente existe y que dice lo que se cita.
4. La propuesta entra al catálogo como borrador.
5. Si es extraer: el texto pegado pasa primero por el filtro de instrucciones, que marca y nunca rechaza.
6. El extractor propone la prueba candidata y los campos, cada uno con cita literal.
7. El código verifica que cada cita es subcadena de la fuente.
8. El código calcula el veredicto con la regla del catálogo.
9. En los dos casos, una persona confirma o corrige antes de que nada quede como evidencia.

### Decisiones

| id | pregunta | elegida | reversibilidad | origen |
|---|---|---|---|---|
| D1 | ¿Qué fuentes puede consultar el investigador de pruebas, y cuántas verificadas necesita una propuesta? | solo fuentes de una lista blanca, cada una comprobada por código: que exista y diga lo que se cita | dos_vias | usuario |
| D2 | ¿Quién calcula el veredicto sugerido de un resultado pegado, y qué tan parecida a la fuente debe ser una cita para valer? | la regla del catálogo calcula el veredicto sobre campos cuyas citas se verificaron | costosa | usuario |
| D3 | ¿Quién fija la severidad de un hallazgo? | la severidad la fija siempre una persona, con la calculadora de referencia de CVSS 4.0 para software y la tabla de prioridad para IA; los agentes nunca sugieren ni precargan un valor | dos_vias | usuario |
| D4 | ¿Qué pasa con una prueba propuesta, y qué tan vieja puede ser la versión de su marco antes de que una persona deba mirarla? | toda prueba nueva entra como borrador y se activa solo cuando una persona la aprueba | costosa | usuario |

### Riesgos

| id | modo de falla | S·O·D | detector | origen |
|---|---|---|---|---|
| R1 | Una cita o fuente inventada llega a una persona sin marca | 9·5·3 | `citas_sin_verificar > 0 AND pausa_humana == false` | plantilla |
| R2 | Una skill secuestrada por el texto que analiza | 9·4·4 | `veredicto_por_regla == false` | plantilla |
| R3 | Prueba obsoleta porque cambió la versión del marco | 7·6·4 | `antiguedad_marco_dias > umbral.U3 AND pausa_humana == false` | plantilla |
| R4 | Hallazgo cerrado sin re-prueba | 10·3·3 | `reprueba_hecha == false` | plantilla |

### Supuestos

| id | supuesto | prueba barata | origen |
|---|---|---|---|
| S1 | Comprobar que una cita es subcadena literal de su fuente basta para detectar una cita inventada. | Sembrar 20 citas, 10 inventadas y 10 reales; el verificador debe marcar las 10 inventadas. | usuario |
| S2 | Una skill sin herramientas ni red solo puede sesgar su propia salida; no puede actuar sobre el sistema. | Pegar texto con instrucciones sembradas y comprobar que el veredicto de la regla no cambia. | usuario |
| S3 | El veredicto que calcula la regla coincide con el de una persona en al menos el 90 % de los resultados pegados. | Una persona califica 20 resultados pegados y se compara el veredicto de la regla con el suyo. | plantilla |

### Criterios de aceptación

| id | enunciado | objetivo | regla | controla | origen |
|---|---|---|---|---|---|
| C1 | Toda cita que llega a una persona sin marca fue verificada por código (100 %). | absoluto · true | `todos` → `citas_sin_verificar > 0 IMPLICA pausa_humana == true` (todos_cumplen) | R1 | plantilla |
| C2 | Ningún veredicto sugerido sin regla: cero veredictos emitidos por el modelo. | absoluto · true | `tarea == 'extraer'` → `veredicto_por_regla == true` (todos_cumplen) | R2 | plantilla |
| C3 | Al menos el 80 % de las pruebas nuevas llega atado a un control de la norma, o marcado como pendiente. | tasa · 0.8 | `prueba_nueva == true` → `control_asociado == true` (tasa) |  | plantilla |
| C4 | Ningún hallazgo se cierra sin re-prueba. | absoluto · true | `hallazgo_cerrado == true` → `reprueba_hecha == true` (todos_cumplen) | R4 | plantilla |
| C5 | Toda prueba cuyo marco supera la antigüedad tolerada pasa por una persona. | absoluto · true | `antiguedad_marco_dias > umbral.U3` → `pausa_humana == true` (todos_cumplen) | R3 | plantilla |

### Umbrales

| id | nombre | señal · operador · valor | rango | si se cumple | origen |
|---|---|---|---|---|---|
| U1 | Similitud mínima de una cita literal | `similitud_cita` · menor_que · 1 | 0.8–1 (0.01) | pausa_humana | usuario |
| U2 | Número mínimo de fuentes verificadas | `fuentes_verificadas` · menor_que · 2 | 1–5 (1) | pausa_humana | usuario |
| U3 | Antigüedad tolerada de la versión del marco | `antiguedad_marco_dias` · mayor_que · 180 | 30–365 (5) | pausa_humana | usuario |

### Contrato de grafo

- Nodos: `enrutador` (enrutador), `investigador` (modelo), `verificador_fuentes` (regla), `catalogo_borrador` (herramienta), `filtro_instrucciones` (regla), `extractor` (modelo), `verificador_citas` (regla), `calculo_veredicto` (regla), `pausa_humana` (pausa_humana)
- `enrutador` #1: `tarea igual_a "investigar"` → `investigador`
- `verificador_fuentes` #1: `fuentes_verificadas menor_que "umbral.U2"` → `pausa_humana`
- `verificador_fuentes` #2: `antiguedad_marco_dias mayor_que "umbral.U3"` → `pausa_humana`
- `verificador_citas` #1: `similitud_cita menor_que "umbral.U1"` → `pausa_humana`
- `enrutador` por defecto → `filtro_instrucciones`
- `verificador_citas` por defecto → `calculo_veredicto`
- `verificador_fuentes` por defecto → `catalogo_borrador`
- ⏸ `pausa_humana` · revisor · motivo, senal, umbral, fuentes, citas, marca_instruccion, veredicto_sugerido, evidencia
- Señales obligatorias: `tarea`, `fuentes_verificadas`, `antiguedad_marco_dias`, `citas_sin_verificar`, `marca_instruccion`, `similitud_cita`, `veredicto_por_regla`, `prueba_nueva`, `control_asociado`, `hallazgo_cerrado`, `reprueba_hecha`, `pausa_humana`, `nodos_visitados`, `latencia_total_s`, `tokens`, `error_proveedor`
- origen: plantilla

### Lotes

20 / 200 · 20 · suscripcion-claude-code · sonnet · origen: entrevistador

## Cómo se aprueba

Si estás de acuerdo, dile al constructor «apruebo el plan hackguard-agentes». Él corre `pnpm plan:aprobar --dominio dom-seguridad-ia --plan hackguard-agentes --por "<tu nombre>" --el <fecha>`, que vuelve a validar y escribe `plans/hackguard-agentes/v1.json` con su huella.
