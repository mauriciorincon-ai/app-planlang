---
sprint: 001
app: planlang
status: closed
opened: 2026-09-26
closed: 2026-09-27
branch: sprint-001/contrato-y-corrida
pr: https://github.com/mauriciorincon-ai/app-planlang/pull/7
---
# Sprint 001 Summary — planlang «El contrato y la corrida»

> Estado de este documento: **escrito antes del gate ⭐ corto** (condición de merge: viaja dentro del PR).
> La sección «Gate ⭐» se completa parada a parada durante el gate, antes del merge.
> Acto de ciclo: **ninguno** — el S1 es el sprint 1 de 3 del ciclo H1; no cierra ciclo.

## Outcome

- **Principal — Sí.** El plan-borrador del demo A se validó y se versionó con huella (v1 → v1.1 → v1.2, las tres
  aprobadas por el usuario); el generador produjo el lote de 20 con verdad conocida y adversarios; el agente
  LangGraph lo corrió con la suscripción de Claude Code (4 corridas reales con el plan v1.2, más 2 con la v1.1
  como historia) y exportó `planlang-trace/v1`; el verificador determinista produjo el informe de brecha ES/EN
  (misma huella en dos ejecuciones, mismos bytes en Node y jsdom) **midiendo honestamente lo desfavorable**: el
  informe v1.1 destapó un detector mal formado y dos supuestos que no podían decidirse; el v1.2 publica S3
  **refutado** (el multiagente acierta más pero tarda más) y S1 **sin probar**.
- **Secundario — Sí.** M9 **10/10** brechas sembradas detectadas con control limpio; 12 planes sembrados
  rechazados con su motivo; RF-09.2 cruzada Python ↔ TypeScript en CI sobre las 7 corridas versionadas.
- **Terciario — Parcial.** Los ADR de arranque existen (y cuatro más). El lote de 200 **no avanzó** (0 de 180
  casos restantes): las corridas de la fase 5 se destinaron a pass^3 del mismo lote de 20 por decisión del
  usuario (desviación 12). La acumulación sin duplicar está probada.

## Qué se construyó

- **`core/` (TypeScript determinista, Node y navegador):** esquemas Zod del plan con validador RF-01.2–01.5 y
  JSON Schema generado · JCS RFC 8785 + SHA-256 con gate de contrato Python ↔ TS · generador sintético con
  semilla (sfc32) y validador de identificadores E-11 · verificador de brecha completo (lector con huellas y
  cruces, criterios con pass^k, detectores AIAG-VDA, supuestos con ECE/AUROC/curva riesgo-cobertura,
  contrato de grafo, brechas no previstas, veredicto, informe §12 JSON + MD ES/EN) · intérprete de aristas
  (RF-09.2) · validación del instrumento M9 · regla de compatibilidad de lotes (ADR-005).
- **`packages/instrumentos-de-plan/`** (contrato v0.1.0: decisiones con Kahn/DFS, prioridad de acción
  AIAG-VDA en datos, supuestos; carnadas C01–C05 + C03-bis) · **`packages/diagramador/`** solo `CONTRATO.lock`.
- **`agents/` (Python 3.12, LangGraph 1.2):** `ChatClaudeCode` con los flags exactos de la regla 6 y
  `ChatSimulado` de primera clase · grafo del demo A (8 nodos, nodos escritores, `interrupt` con payload de
  7 claves, revisor simulado DA-04, modo Texas como función nombrada) · guardia determinista · documento de
  decisión adversa ES/EN · exportador `planlang-trace/v1` · ejecutor de lotes acumulable · línea base de agente
  único · intérprete Python de aristas.
- **Datos y corridas:** `plans/demo-a/v1{,.1,.2}.json`, dominios salud y financiero, plan de beneficios, lotes
  3/20/200, `runs/demo-a/` (simulada de CI + 6 corridas reales), informes v1.1 y v1.2, golden files.
- **Documentos:** manual ES/EN, guía de prueba (nace: 21 pruebas, 5 ⭐, 3 ⭐⭐), kit de prueba, ADR 001–006,
  bitácora, auditoría final.
- **Sin UI:** `src/app/`, `src/components/`, `design-system.md` y `docs/diseno/` intactos (verificado por la
  auditoría con el diff).

## DoD — checklist

| Estándar | Estado | Evidencia |
|---|---|---|
| Testing | ✓ | vitest **588** en CI (45 archivos; cobertura `core/brecha` 98,4 % · 93,3 % ramas, `core/playground` 100 %, `core/plan` 99,2 %); pytest **137** (96,2 %, umbral 70); e2e de punta a punta = corrida simulada de 3 casos → informe contra golden en `core` y `core-jsdom`; Playwright 2/2 sin flaky; cada gate nuevo con demo en rojo (bitácora, fases 0–5 y auditoría) |
| CI/CD | ✓ | `quality · e2e · lighthouse · python` con conclusión propia `success` sobre `daa8ac5`; ruleset de 4 checks sin cambios (ningún job nuevo; `trazas:verificar` es un paso nuevo dentro de `quality`) |
| Observabilidad | ✓ con deuda | logger JSON de vocabulario cerrado en `agents/`; cero credenciales en `runs/` (barrido en CI desde este sprint); **LangSmith sin aprovisionar** → espejo nunca corrió en vivo (deuda; parada 3 del gate) |
| Seguridad | ✓ con fricción | `pnpm audit` sin vulnerabilidades; `pip-audit --skip-editable` limpio (con `--strict` falla solo por el paquete editable: K4); gitleaks en cada commit; flags y `env` del hijo con test literal (y filtro por prefijo, M-11); humo real 3/3 |
| Performance | ✓ | informe de 200 casos en **62 ms** en Node (presupuesto 2 s; medido tras la auditoría) |
| UX/A11y | ✓ (sin UI) | textos de líder ≤ 50 palabras y detector de jerga ES/EN como test; axe del scaffold verde |
| IA embebida (7 + 7-S) | ✓ con desviación | ADR-001 (código primero, §4 enmendado) · ADR-002 (proveedor y cumplimiento, re-lectura antes de cada release) · salida estructurada Pydantic ↔ `--json-schema` · guardia determinista · checklist `ia-embebida` (reintentos automáticos de esquema ≤ 2 por la especificación §9.1, ADR-004) · flags exactos |
| Manual de uso | ✓ | `docs/MANUAL-DE-USO.md` ES/EN: validar un plan · generar casos · correr un lote · leer el informe · verificar |
| Guía de prueba | ✓ | `docs/GUIA-DE-PRUEBA.html` nace con 3 paradas ⭐⭐ y 16 automatizadas `Nuevo · S1`; kit en `docs/kit-de-prueba/` |
| Reusables | ✓ | `instrumentos-de-plan` con `CONTRATO.lock` (huella = contrato de la planeadora) y carnadas; `diagramador` solo lock |

## Métricas técnicas (acceptance criteria del SPRINT_001)

| Criterio | Resultado |
|---|---|
| `plans/demo-a/v1.json` con huella; ≥ 5 planes sembrados rechazados con motivo | ✓ 12 planes sembrados |
| Lotes 20 y 200 reproducibles byte a byte; 3 carnadas de identificadores en rojo | ✓ |
| Corrida real de 20 con las 15 señales, sin credenciales, con ficha | ✓ 16 señales en todas las trazas de las 6 corridas reales |
| Informe ES/EN con veredicto; misma huella en dos ejecuciones | ✓ v1.2 `691e0e37…` «cumple con alertas» |
| RF-09.2 verde en CI con demo en rojo | ✓ TS y Python, 7 corridas |
| M9 n/n | ✓ 10/10 (8 + 2 nuevas de la auditoría) |
| C1 medido | ✓ ninguna negación sin pausa (y desde la auditoría, además, prohibida por arquitectura) |
| 4 checks con conclusión propia; PR mergeado | ✓ checks · merge pendiente del gate ⭐ |

**Primera ejecución de checks en este PR (sin histórico, no puede afirmarse regresión ni no-regresión):** el job
`python` corrió por primera vez con contenido real; el paso `pnpm trazas:verificar` de `quality` corrió por
primera vez en `daa8ac5` (7/7 corridas).

## Auditoría final (`/audita-sprint`)

Tres auditores independientes del constructor, en solo lectura, con el diff delante:
**0 Críticos · 10 Altos · 26 Medios · 27 Bajos** (`sprints/SPRINT_001-auditoria.md`, cada hallazgo con
`archivo:línea`). El usuario aprobó la opción recomendada. **Pagados:** los 10 Altos, 13 Medios y 6 Bajos. Los
más importantes:
- una refutación medida que se escondía detrás de una métrica nula (el golden mostraba S1 «sin probar» con
  ECE 0,1067 > 0,10);
- las fallas de las repeticiones que cerraban C5 no se reportaban (4 brechas);
- el supuesto crítico S1 sin probar no llegaba al resumen para quien decide;
- el modo Texas se anunciaba recalculable y no movía nada;
- la prueba cruzada no podía fallar si la corrida aplicaba otros umbrales;
- el límite de uso que llega solo en el JSON del CLI no detenía el lote;
- el ADR-001 prometía un respaldo que no existía.

Demos en rojo de cada gate nuevo en la bitácora. Veredicto tras la Fase 2: **listo para cierre**.

## Gate ⭐ — diferimiento y contrapesos

**⭐ OBLIGATORIO — se corre parada a parada, sin diferimiento** (el S1 no tiene UI: los dos contrapesos mecánicos
no aplican, así que no hay derecho a diferir).

| Contrapeso | Evidencia |
|---|---|
| Pasada de capturas del builder | No aplica: sin UI en el S1 (excepción F1 registrada) |
| e2e de `reduced-motion` | No aplica: sin UI en el S1 |

| Parada | Resultado | Ajustes en caliente |
|---|---|---|
| 1 de 3 · correr el lote de 20 en tu Mac | _pendiente_ | |
| 2 de 3 · leer el informe v1.2 ES/EN | _pendiente_ | |
| 3 de 3 · LangSmith `planlang-demo-a` | _pendiente — depende de aprovisionar la clave; si se difiere, queda «1 ⭐ al acumulado» y contradice el «0 ⭐» de la orden: decisión del usuario_ | |

## Decisiones no anticipadas

- **ADR-003 — pines de Python** por ADR (regla 16).
- **ADR-004 — salida estructurada y `--max-turns 1`:** el CLI corta con `error_max_turns` y la causa llega
  solo en el JSON de stdout; se reintenta como `esquema_invalido` (§ 9.1).
- **ADR-005 — enmiendas de solo medición:** un lote vale para otro plan si conserva umbrales y contrato de
  grafo (adenda: y el plan de beneficios).
- **ADR-006 — línea base «a igual presupuesto»** = presupuesto no mayor, con dos propuestas.
- **Plan v1.1** (exentos por fuera del verificador de cobertura) y **plan v1.2** (R5, S1, S2: solo medición),
  aprobados por el usuario.

## Bugs + resoluciones

- **Adaptador ciego al JSON de stdout.** El CLI devuelve rc = 1 con stderr vacío (intento 1 de la primera
  corrida real: 1 error en el multiagente y 9 en la base).
  - Solución: leer el JSON de stdout y reintentar.
  - La corrida defectuosa se descartó.
  - Registrado en el ADR-004.
- **Reportes del informe con defectos de presentación**, corregidos en las fases 4 y 5:
  - la cuenta de llamadas al modelo estaba inflada;
  - una nota se duplicaba;
  - el disparador de riesgo aparecía en formato inglés dentro del informe en español.
- **Hallazgos de la auditoría (arriba), por categoría:**
  - honestidad del informe;
  - costura Python ↔ TS;
  - régimen de lotes;
  - seguridad del entorno del hijo;
  - `.coverage` versionado con rutas locales.
- **Fricciones K1–K13 del kit:**
  - venv en 3.14;
  - egg-info versionado;
  - `--coverage` ausente;
  - prettier sobre artefactos canónicos;
  - jsdom sin `crypto.subtle`;
  - falso positivo de gitleaks;
  - literal del dominio de Pages en el CHANGELOG del kit.

## Qué salió bien / qué generó fricción

- **Bien:**
  - El verificador encontró defectos **del plan** (R5, S1, S2, U4, R8), no solo del agente. Es la tesis del
    producto funcionando sobre sí misma.
  - La auditoría independiente cazó cosas que 600 tests verdes no veían. La más cara: una refutación
    escondida en el golden.
  - RF-09.2 cruzado dio confianza real en la costura Python ↔ TS.
- **Fricción:**
  - La suscripción obliga a correr lotes a mano, fuera de CI y espaciados. Rehacer 4 corridas costó unos
    25 min de reloj.
  - El hook de prettier contra los artefactos canónicos obligó a escribir todo por script.
  - La regla «un lote = un plan» chocó con la primera enmienda de medición, y de ahí salió el ADR-005.

## Sugerencias de mejora al método

1. **Enmienda al contrato `instrumentos-de-plan` (carnada C03):** la tabla AIAG-VDA da `baja` para S8·O3·D4,
   no `alta`. Propuesta:
   - C03 → S8·O6·D2 `alta`, con RPN 96;
   - C03-bis → S8·O3·D4 `baja`, con el mismo RPN 96.

   Juntas demuestran que el RPN no discrimina y la tabla sí. Síntoma: carnada imposible de pasar con la
   tabla citada. Causa: la tabla no se verificó al escribir el contrato.
2. **Observación AIAG-VDA para riesgos de ley:** R1 (negación sin humano, 9·3·3) y R6 (8·3·2) salen con
   prioridad `baja` por su ocurrencia y detección. Un riesgo que protege una obligación legal quizá no debería
   depender de la prioridad de acción. Propuesta: marca «control legal» que fije la prioridad `alta` o exija
   mitigación, aunque la tabla diga otra cosa.
3. **Regla 6:** evaluar `--max-turns 2` solo cuando va `--json-schema`. Con `--max-turns 1` el CLI corta
   entre el 6 % y el 56 % de las llamadas estructuradas; el reintento lo mitiga, pero lo agota en ocasiones.
4. **Hallazgos del plan del demo A para la planeadora:**
   - U4 inerte (la arista 4 subsume a la 5): dar a `propuesta` un valor adverso parcial o retirar U4.
   - R8 no se puede medir por trazas: medirlo sobre el manifiesto.
   - S3 sin tolerancia: declararla en una v1.3.
   - La línea base es «a presupuesto no mayor» (ADR-006).
   - El EN de D1, D2 y D4 pierde hechos del ES.
   - `opciones`, `mitigaciones` y otros campos del esquema son monolingües.
5. **Kit:**
   - K4: la regla 16 y el CHANGELOG dicen `pip-audit --strict`, pero el kit corre `--skip-editable`.
   - K13: los documentos del kit que narran el barrido citan el literal.
   - B-8: el hook PreToolUse de gitleaks escanea lo staged, no lo que se va a escribir, y el pre-commit
     falla abierto.
   - B-10: los ADR de esta app están en español y la constitución los pide en inglés. Aceptar la excepción
     o traducirlos.

## Deuda técnica aceptada

| Qué | Por qué | Sprint de pago |
|---|---|---|
| Espejo LangSmith sin aprovisionar | la clave no está en el entorno del builder | parada 3 del gate o S2 |
| Avance hacia 200 (0 de 180) | corridas destinadas a pass^3 | S2 (background) |
| Respaldo `proveedor_no_disponible` → `pausa_humana` (AU-9) | el ADR lo prometía y no existía | S2 |
| Payload del revisor sin orden adjunta, aclaraciones ni cobertura (M-8) | cambia la forma de las trazas | S2 |
| Sesión que se cae con una excepción no clasificada pierde las trazas (M-9) | robustez del runner | S2 |
| Lock de Python `constraints.txt` (M-12) · NFC simétrica en JCS (M-13) | reproducibilidad y costura | S2 |
| R8 no medible por trazas (M-14) · documento adverso autodeclarado (M-15) | enmienda del plan + verificador | S2 |
| Señal determinista `carga_detectada` (M-16) | cambia el contrato de grafo (lote nuevo) | S3 |
| Umbrales por id en el agente y el generador (M-18) | refactor del grafo | S2 |
| Reglas del demo A en el verificador genérico (M-20) | llegan al plan con el demo B | S3 |
| Hash de `aprobarPlan` vs `cargarPlan` (M-22) · señales no declaradas en el validador (M-23) | validador | S2 |
| No evaluables de riesgos y evaluadores visibles (M-24) · criterios con métrica (M-26) | render e informe | S2 |
| Plan bilingüe completo y enmienda del esquema (`opciones`, mitigaciones…) (M-25) | regla 20 | S3 |
| Guía de prueba solo en español | la guía es para el usuario; la app ya es bilingüe | S2 |
| Bajos B-2 a B-12, B-16, B-18, B-20 a B-27 (detalle en la auditoría) | menores | S2 |
| Línea base de extracción por patrones (ADR-001, M-17) | no medida | S2 |

## Archivos clave

1. `core/brecha/informe.ts` — el informe §12 y su resumen para quien decide.
2. `core/brecha/contrato-grafo.ts` — contrato de grafo, RF-09.2, umbrales del plan y decisiones sin registro.
3. `core/brecha/supuestos.ts` — ECE, AUROC, curva riesgo-cobertura y comparación con la línea base.
4. `core/playground/interprete.ts` — el intérprete TypeScript de aristas.
5. `agents/src/app_agents/adaptador.py` — `ChatClaudeCode` y `ChatSimulado`.
6. `agents/src/app_agents/demo_a/nodos.py` — el grafo del demo A.
7. `agents/src/app_agents/lotes.py` — el ejecutor de lotes.
8. `plans/demo-a/v1.2.json` — el plan vigente.
9. `runs/demo-a/suscripcion-planlang-a-001-20-v1.2/informe.es.md` — el informe vigente.
10. `sprints/SPRINT_001-auditoria.md` — la auditoría final.

## Cómo probar

`docs/GUIA-DE-PRUEBA.html` (doble clic): 3 paradas ⭐⭐ (~15 min) + 2 ⭐ de confianza + 16 automatizadas. En
terminal: `pnpm test`, `pnpm trazas:verificar`, `pnpm m9:reporte --verificar`,
`pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2 --verificar`,
`cd agents && .venv/bin/pytest`.
