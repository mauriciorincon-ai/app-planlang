# ADR-019 — El reloj y los dueños: el plazo se simula por código sobre las trazas, y los beneficiarios finales los decide el código con la norma; el modelo solo copia la estructura

**Summary (EN):** Two measurements the VISION promises. (1) **Deadlines (demo A, C11):** a simulated clock and a single
auditor queue, pure code in `core/plazos/`, run over the existing 200-case traces. Nothing is re-run and no model is
called. Arrivals are drawn with `sfc32` from the batch seed. The queue is non-preemptive, by class priority and then by
arrival, with ties broken by id. Time is integer and the deadline runs on calendar minutes. The plan's new optional
block `simulacion_de_plazos` sits outside `umbrales` and outside the graph contract, so plan A v1.6 keeps the v1.5 truth
(ADR-005). C11 is absolute. (2) **Beneficial owners (demo B, C7):** the extractor, in the same single call per case,
also copies the ownership structure from the certificate of existence. Code then decides who the beneficial owners are
under 31 CFR § 1010.230(d), read on 2026-11-03: 25 % or more of effective ownership, inclusive, plus the person who
controls. Effective ownership multiplies along each path and adds up the paths. It is exact: `BigInt` in TypeScript and
`Fraction` in Python, held bit for bit by a contract gate. A structure that does not add up is never guessed: it gives
no owners, raises rule RB-03 and sends the case to a person. Each owner is checked against the lists, and the pause edge
reuses U1. This amends ADR-013.

**Estado:** aceptado · **Fecha:** 2026-11-03 · **Sprint:** S9 «El reloj y los dueños» (H-2), fase 2
**Cítese por tema:** «ADR código primero de plazos y beneficiarios».
**Origen:** la orden del S9 (`portafolio/planlang/sprints/SPRINT_009.md`) y el G-Plan del 2026-11-02, que aprobó los planes
A v1.6 y B v1.2 en el chat de la planeadora. Los dos llevan «Mauricio Rincón, 2026-11-02» y los escribió el CLI de
enmienda (`scripts/enmendar-plan-demo-{a,b}.ts`, con M1 dentro). `pnpm plan:aprobar` no admite el A ni nombres `v1.x`.
**Enmienda:** ADR-013 (código primero del demo B). Vea «Enmienda de ADR-013».

## 1. La funcionalidad, en una frase de usuario

- **Plazos:** el informe del demo A dice si cada autorización hospitalaria y ambulatoria se decidió dentro de su plazo
  legal. El playground deja mover la capacidad del auditor y muestra cuántas solicitudes salen de plazo.
- **Dueños:** el expediente de una sociedad dice quiénes son sus beneficiarios finales, con su participación efectiva y
  la regla que los hace beneficiarios, y si alguno se parece a un nombre de las listas. El informe dice en cuántas
  sociedades el conjunto coincide con la verdad conocida.

## 2. Lo que se intentó con CÓDIGO primero (obligatorio, con evidencia)

| Intento determinista                                                                                                                  | Qué resolvió                                                           | Dónde se quedó corto                                                                                                                                                                                                                                                      | Evidencia                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Reloj y cola** (`core/plazos/`): llegadas con `sfc32`, cola de un auditor, plazos en minutos de calendario                          | Todo el plazo                                                          | No se quedó corto: **código**                                                                                                                                                                                                                                             | `tests/unit/core/plazos/*`, paridad en Node, Chromium, Firefox y WebKit, G2                                   |
| **Participación efectiva** (producto por camino, suma de caminos, fracción exacta)                                                    | Toda                                                                   | No se quedó corto: **código**                                                                                                                                                                                                                                             | `tests/contrato/beneficiarios.test.ts`: 22 casos, 8 del lote y 14 bordes con nombre                           |
| **Umbral del 25 % inclusivo y persona que controla** (RB-01, RB-02)                                                                   | Todo                                                                   | No se quedó corto: **código**                                                                                                                                                                                                                                             | bordes `borde-25-exacto-por-dos-vias`, `borde-24-99`, `borde-24-995-se-muestra-25-y-no-llega`, `solo-control` |
| **Estructura que no cierra**: ciclo, suma de más del 100 %, porcentaje mal escrito, referencia rota, id repetido, sin entidad (RB-03) | Toda                                                                   | No se quedó corto: **código**                                                                                                                                                                                                                                             | `test_una_estructura_que_no_cierra_no_se_adivina_y_decide_una_persona`                                        |
| **Cruce de cada beneficiario con las listas** (el Jaro-Winkler de siempre) y las dos aristas nuevas (operadores que ya existían)      | Todo; los dos intérpretes no cambian                                   | No se quedó corto: **código**                                                                                                                                                                                                                                             | RF-09.2 en TS y en Python sobre `simulado-b-002-20`                                                           |
| **Leer la estructura del certificado de existencia con expresiones regulares**                                                        | Las plantillas de nuestro generador                                    | El certificado es prosa: «Agroindustrial Pradolargo SAS es titular del 40,00 %…», en ES o en EN, con sociedades intermedias nombradas en frases. Una regex sobre NUESTRAS plantillas mediría el generador, no el agente (el mismo argumento de ADR-013 para la actividad) | `core/sintetico/demo-b/juridicas.ts` (`PLANTILLAS`)                                                           |
| **Decidir persona natural o jurídica por la presencia del certificado**                                                               | **En este conjunto acertaría todo**: toda sociedad trae su certificado | Fuera del conjunto, una sociedad puede llegar sin certificado o con otro documento. Por eso C7 mide sobre la verdad conocida y no sobre lo que leyó el extractor: una sociedad que el modelo lea como persona cuenta como falla y no sale de la medida                    | ver «C7» abajo                                                                                                |

## 3. Dónde entra el LLM y dónde NO

- **Entra en:** el **extractor**, la misma llamada única por caso que en ADR-013. Con el plan v1.2 lee cuatro documentos
  en lugar de tres y devuelve además `tipo_solicitante` y `estructura`: sociedades, personas, participaciones (cada
  porcentaje como texto con dos decimales a lo sumo) y quién controla, con el rol como `enum`. La línea base de agente
  único devuelve lo mismo en su llamada única (ADR-006, P10).
- **NO entra en:** la aritmética de la participación, el umbral, la persona que controla, la validez de la estructura,
  el cruce con las listas, el ruteo, la pausa, el expediente, el reloj, la cola ni el plazo.
- **Entrada al modelo:** el certificado se minimiza y viaja entre delimitadores, como los otros documentos. La guardia
  de salida cuenta como propios los NIT y documentos de la estructura.
- **Salida del modelo:** Pydantic `ExtraccionBEstructura` con `extra="forbid"`. El código lee cada porcentaje en
  centésimas enteras y rechaza lo que no cierre. En TypeScript la lee `EstructuraExtraidaSchema` (Zod).

## 4. Fallback determinista (obligatorio)

- **Dueños:** sin modelo, el caso no se decide y se reintenta, como en ADR-013. Una estructura ausente o que no cierra
  da cero beneficiarios, la inconsistencia RB-03 y, con U3 = 0, la pausa con el oficial. El oficial ve en el payload la
  estructura, la participación efectiva de cada persona y su cruce con las listas. El proveedor simulado recorre el grafo
  completo en CI con `runs/demo-b/simulado-b-002-20` y su línea base, que se regeneran byte a byte.
- **Plazos:** no hay modelo que pueda faltar. Sin capa de llegadas, C11 no se calcula y el informe lo dice; no inventa
  horas.

## 5. Proveedor, costo y privacidad

- **Proveedor:** la suscripción por `ChatClaudeCode` (P6, ADR-002), fuera de CI y con los casos espaciados.
- **Costo medido:** el humo real de 3 casos del 2026-11-03 (B-013, B-014 y B-002) costó en nominal US$ 0,0247, 0,0178
  y 0,0098 por caso. Las dos sociedades llevaron 4,5 y 4,8 mil tokens de entrada. La estructura no añade llamadas: añade
  un documento y unos campos a la que ya había. El lote `suscripcion-planlang-b-002-20` (Sonnet, 2026-11-03, 20 de 20
  sin error) hizo 23 llamadas: 20 del extractor y 3 del investigador. Costó US$ 0,2465 nominal. Su línea base hizo 20
  llamadas por US$ 0,3803.
- **Privacidad:** todo es sintético. NIT `SYN-NIT-`, documentos `SYN-ID-`, razones sociales de diccionario con el sufijo
  «SAS»; el validador de identificadores (E-11) los conoce.

## Decisiones

1. **La norma de los dueños.** Es 31 CFR § 1010.230(d), leída en su fuente el 2026-11-03:
   - (d)(1): cada persona que, directa o indirectamente, tiene el 25 % o más de la participación («25 percent or more»).
   - (d)(2): una persona con responsabilidad significativa de controlar la sociedad.

   La norma no dice cómo se calcula la participación indirecta. Aquí se multiplica el porcentaje de cada eslabón de un
   camino y se suman los caminos que llegan a la misma persona. La comparación con el 25 % es exacta, sobre la fracción y
   nunca sobre el redondeo: un 24,995 % se muestra «25,00» y no llega. El umbral colombiano del RUB queda fuera del
   sprint.

2. **C7** es una tasa ≥ 0,9 sobre la población `verdad_conocida.tipo_solicitante == 'juridica'`.
   - **Corrección de codificación:** la primera aprobación del v1.2 medía sobre la señal del extractor, y eso habría
     escondido las sociedades mal clasificadas.
   - Se corrigió antes de cualquier uso para que diga lo que dice su enunciado. M1 dio verde y la huella pasó de
     `21a1fc93…` a `6450d5c5…`.
3. **La arista del dueño reusa U1:** `similitud_beneficiarios_max ≥ U1` lleva a la pausa (decisión, orden 7). Un
   parecido de un dueño pesa lo mismo que uno del solicitante, y mover U1 en el playground mueve los dos.
4. **El nodo es opcional en el grafo:** se construye solo si el plan lo declara. Los planes B v1 y v1.1 siguen armando
   sus nueve nodos y exportan los mismos bytes. Las corridas `b-001-*` quedan como historia: el v1.2 cambia el contrato
   de grafo (ADR-005).
5. **El bloque `simulacion_de_plazos`** es opcional y va fuera de `umbrales` y del contrato de grafo, para que la
   corrida de 200 del v1.5 siga valiendo con el v1.6 (`mismaVerdad`). Sus valores por defecto:
   - Un auditor, con capacidad de 30 casos por día hábil, jugable de 10 a 60 de 5 en 5.
   - Jornada de lunes a viernes, de 08:00 a 17:00.
   - Hospitalaria: prioridad 1, 72 horas.
   - Ambulatoria: prioridad 2, 7 días calendario.
   - La urgencia no entra: se decide al llegar y su `en_plazo` es nulo; C4 la cubre.
6. **La cola.**
   - La capacidad es un caudal: cada solicitud toma `jornada / capacidad` minutos del auditor, en aritmética entera, en
     unidades de 1/capacidad de minuto.
   - La decisión pasa a minutos de calendario redondeando hacia arriba.
   - Lo automático se decide al llegar; lo que pausa, cuando la cola lo alcanza.
   - El plazo corre en minutos de calendario: el fin de semana cuenta, aunque el auditor no trabaja.
   - Las horas de auditor siguen siendo 12 minutos por pausa, como ya calcula el playground. Mover la capacidad cambia la
     espera, no el costo.
7. **C11 es `absoluto` (`todos_cumplen`):** es un plazo legal, como C4 y C10.
8. **La norma de los plazos.** Es CMS-0057-F (89 FR 8758, 8 de febrero de 2024; documento 2024-00895), consultada el
   2026-11-03:
   - 72 horas para la solicitud expedita y 7 días calendario para la estándar, desde el 1 de enero de 2026.
   - Alcanza a Medicare Advantage, Medicaid y CHIP por pago por servicio y a sus planes administrados.
   - Los planes de salud calificados de los mercados federales quedan fuera de esta disposición.
   - 42 CFR 438.210(d) admite una prórroga de hasta 14 días calendario. No se modela, y el plan lo dice.

   «Hospitalaria = expedita» y «ambulatoria = estándar» son supuestos de la simulación, rotulados en el plan: la norma
   llama expedita a la solicitud que podría poner en grave riesgo la salud del afiliado, no a la hospitalaria.

## Enmienda de ADR-013

- **§ 3, «Entra en» (1):** con el plan B v1.2, el extractor lee cuatro documentos (más el certificado de existencia) y
  devuelve nueve campos más quién solicita y la estructura. Sigue siendo una llamada por caso.
- **§ 3, «NO entra en»:** se suman la participación efectiva, los beneficiarios finales y la validez de la estructura.
- **Consecuencias:** con el v1.2 el grafo tiene diez nodos y nueve aristas, y el payload de la pausa incluye
  `beneficiarios`. Con el v1 siguen siendo nueve nodos y siete aristas.

## Consecuencias

- El informe del A gana C11 sin correr de nuevo un solo caso; el del B gana C7 sobre `planlang-b-002-20` (8 sociedades,
  12 personas) y su línea base. Si una cifra no alcanza, se publica tal cual (P9).
- Riesgo aceptado: a 30 casos por día C11 puede salir en el 100 %. El playground muestra a qué capacidad se rompe.
- Gates nuevos, vistos en rojo:
  - G2 sobre `core/plazos/`: un `Date.now` en una llegada.
  - El contrato de beneficiarios con la participación indirecta sumada: caen 22 de 50 pruebas, nombrando
    `cadena-de-cuatro-niveles`.
  - El contrato con el 25,00 % tratado como «menos de»: caen 4 de 50, nombrando `borde-25-exacto-por-dos-vias` y
    `lote:B-012`.
  - El lector Zod: rechazaba las 40 trazas del v1.2 antes de ampliarse.
