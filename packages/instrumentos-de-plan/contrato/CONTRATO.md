---
id: contrato-instrumentos-de-plan
titulo: Instrumentos de plan — contrato
arquetipo: harness
elemento_tipo: contrato
rigor: completo
capa: producto
version: 0.2.0
fecha: 2026-09-27
estado: borrador
objetivo: Fijar el modelo de datos, las garantías y las reglas de validación de decisiones, modos de falla y supuestos que comparten las apps de planeación
depende_de: [reusables/README.md, "corpus/raw/[APP AgentLang] - Requerimientos v1.0.md", "corpus/raw/[APP Bigdata Planeador] - Requerimientos v1.1.md"]
relacionado_with: [reusables/instrumentos-de-plan/REGISTRO-DE-FALLAS.md]
tags: [reusables, contrato, decisiones, fmea, supuestos, determinismo]
---

# Instrumentos de plan — contrato v0.1.0 (semilla)

> **v0.1.0, F0 #12 (2026-09-26).** Sale de dos fuentes: la especificación de AgentLang (§ 6.3, 6.4, 6.5,
> 11.1, 11.2) y las decisiones ya tomadas por Big-D en su F1 (E-3 prioridad de acción, E-15 tipo y estado
> de decisión, C16 Kahn por ondas + DFS que muestra el ciclo). Lo que la F1 de AgentLang debe cerrar está
> marcado **[F1]**. Editar este contrato = G-Metodo.

## 0. Qué es y qué no es

**Es** un modelo de datos con reglas de validación y ordenamiento para tres objetos de un plan:
**decisión**, **modo de falla** y **supuesto**. Produce: el orden de decisión (ondas), las decisiones de
una vía destacadas, la prioridad de acción de cada modo de falla, los elementos bloqueantes (sin
mitigación, sin regla) y el informe de validación.

**No es** un motor de dominio: no sabe de plataformas de datos ni de agentes. El vocabulario de cada
dominio (qué riesgos son típicos, qué severidad sugerir) viaja en **datos** de la app consumidora.

## 1. Modelo

### 1.1 Decisión

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id`, `pregunta` | texto | sí | id estable y legible |
| `opciones[]` | lista de {nombre, pros?, contras?} | sí | ≥ 2 opciones; **`pros`/`contras` opcionales (v0.2.0, F-002)**: la entrevista no siempre los produce y el consumidor no inventa contenido de plan; el informe marca la opción «sin argumentos» |
| `opcion_elegida`, `justificacion` | texto | sí cuando `estado = decidida` | |
| `reversibilidad` | `una_via` · `costosa` · `dos_vias` | sí | escala § 3.2 |
| `depende_de[]` | ids de decisión | no | define el orden |
| `tipo` | `explicita` · `implicita` | sí | Big-D E-15: las implícitas son las que nadie discutió |
| `estado` | `abierta` · `decidida` · `superada` | sí | |
| `referencias[]` | ids de otros objetos del plan (umbrales, riesgos) | no | la app consumidora define qué ids acepta |

### 1.2 Modo de falla

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id`, `modo`, `efecto`, `causa` | texto | sí | |
| `decision_id` | id | no | |
| `severidad`, `ocurrencia`, `deteccion` | entero 1–10 | sí | escala anclada § 3.1 |
| `prioridad_de_accion` | `alta` · `media` · `baja` | calculado | tabla AIAG-VDA 2019 en datos, severidad primero **[F1: fuente y tabla]** |
| `rpn` | entero | calculado | producto S×O×D; **solo orden secundario**, nunca criterio de acción |
| `mitigaciones[]` | lista de {accion, momento, efecto_esperado} | sí cuando la prioridad es `alta` | |
| `detector` | regla opcional | no | cómo se reconoce que ocurrió (AgentLang lo exige en trazas; Big-D no lo usa) |
| `control_legal` | booleano | no | **v0.2.0 (F-003):** `true` cuando el modo protege una obligación legal (p. ej. «ninguna negación sin humano»). Fija la **prioridad efectiva** en `alta` y exige mitigación (G5) sea cual sea la tabla; la prioridad de tabla se muestra al lado, nunca se oculta |

### 1.3 Supuesto

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `id`, `enunciado` | texto | sí | |
| `criticidad` | `alta` · `media` · `baja` | sí | |
| `prueba_barata` | texto | sí | experimento mínimo que lo confirma o refuta |
| `medible` | regla opcional | no | si se puede confirmar con datos |
| `estado` | `sin_probar` · `confirmado` · `refutado` | sí | |

## 2. Garantías

| # | Garantía | Cómo se verifica |
|---|---|---|
| **G1** | **Determinismo.** Mismo plan, mismo orden de ondas, mismas prioridades, mismo informe byte a byte. Sin reloj ni azar | Golden files; tres corridas idénticas |
| **G2** | **Ciclos detectados y mostrados.** Un ciclo en `depende_de` rechaza la carga e indica el ciclo completo (Kahn por ondas + DFS que devuelve el camino) | Carnada C01 |
| **G3** | **Una vía primero.** Las decisiones `una_via` se destacan y quedan en la primera onda en que sus dependencias lo permitan; el informe las lista aparte | Carnada C02 |
| **G4** | **Severidad primero.** La prioridad de acción sale de la tabla AIAG-VDA 2019, no del RPN: S8·O6·D2 → `alta` y S8·O3·D4 → `baja` **con el mismo RPN 96** (v0.2.0, F-001: la tabla se verificó celda a celda en planlang; la versión 0.1.0 pedía `alta` para S8·O3·D4 y la tabla no lo da) | Carnadas C03 + C03-bis |
| **G5** | **Bloqueo por falta de mitigación.** Un modo con prioridad `alta` sin mitigación bloquea la aprobación del plan | Carnada C04 |
| **G6** | **Neutralidad de dominio.** El paquete no contiene nombres de plataformas, agentes ni dominios | Lint como G3 del diagramador |
| **G8** | **Control legal.** Un modo con `control_legal: true` tiene prioridad efectiva `alta` y exige mitigación, aunque su S·O·D dé `baja` o `media`; el informe muestra ambas prioridades (v0.2.0, F-003: R1 «negación sin humano» 9·3·3 y R6 8·3·2 salían `baja` en planlang) | Carnada C06 |
| **G7** | **Escalas como dato.** Las anclas de severidad/ocurrencia/detección y la tabla de prioridad viajan en datos versionados; cambiar un ancla no cambia código | Esquema |

## 3. Escalas ancladas (datos de referencia)

### 3.1 Severidad · ocurrencia · detección (1–10)

Las anclas de la especificación de AgentLang § 11.1 se adoptan como referencia inicial (molestia menor →
daño a una persona / incidente de datos sensibles / sanción / fracaso del proyecto). Cada app puede
sustituir las anclas con las de su dominio en datos, no en código.

### 3.2 Reversibilidad

| Nivel | Definición | Tratamiento |
|---|---|---|
| `una_via` | Revertirla implica rehacer la arquitectura, cambiar qué datos ve un sistema o renegociar con áreas | Análisis de riesgos obligatorio; se decide primero |
| `costosa` | Reversible con esfuerzo acotado | Análisis recomendado |
| `dos_vias` | Se cambia con bajo costo (un umbral, un parámetro) | Se decide rápido y se ajusta con evidencia |

## 4. Carnadas

> **Regla (v0.2.0, F-001):** ninguna carnada sale en una versión consumible con marca «confirmar»: se verifica contra su fuente antes de publicarse. La app consumidora que no pueda hacerla pasar la reporta como falla en su summary.

| Id | Caso | Resultado esperado |
|---|---|---|
| C01 | `A depende_de B`, `B depende_de A` | Rechazo con el ciclo `A → B → A` |
| C02 | Tres decisiones, una `una_via` sin dependencias | Onda 1 contiene la de una vía y el informe la destaca |
| C03 | Modo con S8 · O6 · D2 | `prioridad_de_accion = alta` (RPN 96) |
| C03-bis | Modo con S8 · O3 · D4 | `prioridad_de_accion = baja` (RPN 96): junto a C03 prueba que el RPN no discrimina y la tabla sí |
| C04 | Modo con prioridad `alta` y `mitigaciones = []` | Plan no aprobable; informe nombra el modo |
| C05 | Supuesto con `criticidad = alta` y `prueba_barata` vacía | Rechazo por esquema |
| C06 | Modo 9 · 3 · 3 con `control_legal: true` y `mitigaciones = []` | Prioridad efectiva `alta` (tabla: `baja`, visible) y plan no aprobable por G5 |

## 5. Cómo lo consume una app

- Copia fijada del contrato en `packages/instrumentos-de-plan/CONTRATO.lock` (versión + SHA-256).
- El paquete no importa nada de la app; la app le pasa datos y lee el informe.
- Enmiendas: la app las propone en su summary; esta casa las aplica por G-Metodo.
