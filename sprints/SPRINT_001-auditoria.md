# Auditoría final — Sprint 001 planlang «El contrato y la corrida» (Fase 1, solo lectura)

> Fecha: 2026-09-27 · rama `sprint-001/contrato-y-corrida` · commit auditado `3555eec` · PR #7 (borrador; los 4 checks
> requeridos `success` sobre ese commit).
> **Método (kit v1.26.0):** tres auditores INDEPENDIENTES del constructor, en paralelo y en solo lectura, cada uno con el
> diff `main...HEAD` (356 archivos) delante y la bitácora solo como contraste: **(A) alcance, frases caducadas y
> cardinalidades** · **(T) núcleo TypeScript** (`core/`, `packages/`, `scripts/`, tests TS) · **(P) Python, seguridad,
> CI y costura Python ↔ TS**. El constructor consolidó (deduplicó, unificó severidades) y **verificó a mano** los
> hallazgos que cambian lo publicado (abajo). Los ids de origen (`A-n`, `T-n`, `P-n`) se conservan entre paréntesis.

## Veredicto: **requiere ajustes**

| Severidad | Cuántos (tras deduplicar) |
|---|---|
| Crítico | 0 |
| Alto | 10 |
| Medio | 26 |
| Bajo | 27 |

Ningún hallazgo obliga a repetir corridas reales: todos los ajustes Altos cambian código, documentos o informes (que se
regeneran de forma determinista). El único que cambiaría la forma de las trazas (M-8) se propone como deuda.

### Verificado por el constructor antes de consolidar

| Hallazgo | Comprobación | Resultado |
|---|---|---|
| AU-1 (T-1) | `tests/golden/demo-a/simulado-3casos/informe.es.md`, sección S1 | ECE = 0,1067 con `ece_max: 0.1` y el estado dice «◌ sin probar … No hay valor medido para auroc» → **confirmado** |
| AU-2 (A-1) | reintentos por traza en `…-v1.2`, `-r2`, `-r3` | v1.2: A-003 · r2: A-006 (2), A-017 · r3: A-016, A-017 (extractor y redactor); el informe lista solo A-003 → **confirmado** |
| AU-4 (P-2) | U4 en `plans/demo-a/v1.2.json` (`senal: modo_texas`) frente a `core/playground/interprete.ts:143-144` y `agents/src/app_agents/reglas_arista.py:112-113` | las entradas de la función salen de la traza, no del umbral → **confirmado** |
| M-1 (A-12) | salidas vacías / JSON / «placeholder» en `salida_final` | v1.1-base 4 casos · v1.2-base 9 campos en 7 casos · multiagente 0 en las 4 corridas → **confirmado** |
| M-4 (A-7) | `git show HEAD:.coverage` | base SQLite de coverage.py con rutas `/Users/henryrincon/Code/app-planlang/agents/…` versionada en un repo público → **confirmado** |
| B-1 (A-5/P-12) | `gh pr view 4` · `gh pr checks 4` | PR #4 `[DESECHABLE] demo en rojo del job python`, cerrado sin mergear 2026-09-27, `python fail` (los demás checks verdes) → **la demo existió; falta solo el registro** (baja a Bajo) |

### Lo que está bien (resumen de los tres auditores)

- `src/app/`, `src/components/`, `design-system.md`, `docs/diseno/`, `tests/e2e/` **intactos** (diff vacío).
- **Cero credenciales** en `runs/` (26 patrones barridos: `sk-ant`, `lsv2_`, `session_id`, `oauth`, `Bearer`, `/Users/`,
  correos…; solo aparece `"langsmith": "0.14.1"` como versión en `entorno.json`). Ningún `.sqlite` versionado; los
  locales en 600 y sin material de sesión. La CI jamás invoca el binario `claude`.
- Argv del adaptador idéntico a la regla 6, sin `--bare`, cwd temporal vacío fuera del repo, `session_id`/`uuid`
  descartados con test.
- JCS/huella correctos en los dos lados; determinismo sin `Date`/`Math.random`/`Intl`/`node:*` en `core/` ni en
  `packages/*/src`; intérpretes TS y Python **equivalentes operador por operador**; parser de condiciones con precedencia
  correcta; ECE/AUROC/curva correctos; pass^k conservador; el lector verifica la huella de toda entrada.
- Tabla AIAG-VDA celda a celda; `CONTRATO.lock` de los dos reusables = huellas de la planeadora; `packages/` no importa
  de la app. RF-09.2 en CI en los dos lenguajes con demo en rojo. Cobertura `core/brecha` 98,7 % · 93,4 %,
  `core/playground` 100 %, pytest 96 %. El S1 no añadió jobs de CI (la ruleset de 4 checks no cambia).
- Barrido de cero enlaces limpio sobre el árbol subido.

---

## 1. Cobertura de alcance (plan aprobado + orden + SPRINT_001.md)

| Ítem | Clasificación | Evidencia | Nota |
|---|---|---|---|
| Fase 0 · K1–K11, humo, ADR 001–003, adaptador, tests | Completo | `sprints/SPRINT_001-implementation-log.md:32-78` · `agents/src/app_agents/adaptador.py:87` · `decisions/003-pines-python.md:17` | ADR-001 con afirmaciones falsas (AU-9, M-17) |
| Paso 7 · demos en rojo de la fase 0 | Completo (registro incompleto) | log:70-73 · PR #4 | B-1 |
| Fase 1 · esquemas, JCS Python ↔ TS, instrumentos, validador (12 planes sembrados), plan v1, dominios | Completo | `core/plan/validador.ts:277` · `tests/contrato/jcs-python-ts.test.ts:1` · `packages/instrumentos-de-plan/CONTRATO.lock:5` | demos en rojo débiles (B-16) |
| Fase 2 · generador con semilla (lotes 3/20/200), E-11 con 3 carnadas, afirmación de privacidad | Completo | `core/sintetico/generador.ts:40-95` · `tests/unit/guardias/identificadores-en-datos.test.ts:33` | umbrales cableados (M-18) |
| Paso 17 · grafo LangGraph, `interrupt`, Texas, savers | Completo | `agents/src/app_agents/demo_a/nodos.py:277,372-407` · `grafo.py:48` | U4 inerte (AU-4) |
| Paso 18 · reglas deterministas y guardia | Con desviación | `agents/src/app_agents/demo_a/nodos.py:233-275` · `guardia.py:78` | sin `demo_a/reglas.py` (M-19); guardia no ve salidas malformadas (M-1) |
| Pasos 19–21 · documento adverso, `reglas_arista.py`, exportador | Completo / con desviación declarada | `agents/src/app_agents/exportador.py:33` | exportador lee del checkpoint (declarado, log:233) |
| Paso 22 · `lotes.py` y scripts `lote:*` | Parcial | `package.json:20-21` · `agents/src/app_agents/lotes.py:62,361` | lote y modelo cableados, sin pausa por defecto (AU-10); LangSmith nunca corrió (deuda declarada) |
| Pasos 23–25 · línea base, `simulado-3casos`, primera corrida real | Completo | `agents/src/app_agents/agente_unico.py:1` · `agents/tests/test_corrida_simulada_versionada.py:17` | |
| Paso 26 · lector con huellas | Completo | `core/brecha/lector.ts:406,463` | faltan cruces semánticos (AU-5, M-2, M-3) |
| Paso 27 · criterios, detectores, supuestos, contrato, brechas, veredicto | Con desviación | `core/brecha/criterios.ts:136` · `supuestos.ts:86` · `veredicto.ts:91` · `informe.ts:436,449` | AU-1, AU-2, AU-3, AU-6, AU-7 |
| Paso 28 · informe §12 ES/EN, golden en `core` y `core-jsdom` | Completo | `core/brecha/render-md.ts:650` · `tests/integration/informe-simulado.test.ts:1` | frase cableada (AU-4), valores ES en el EN (B-17) |
| Pasos 29–31 · RF-09.2 TS, M9 8/8, performance 57 ms | Completo | `tests/unit/core/playground/rf-09-2.test.ts:48` · `core/brecha/m9.ts:95` · `tests/unit/core/brecha/perf-200.test.ts:81` | siembras como código, no fixtures (M-19) |
| Paso 32 · manual, guía, kit, README | Completo con frases caducas | `docs/MANUAL-DE-USO.md:109` · `README.md:21-22` | B-13 a B-15 |
| Paso 33 · auditoría, deploy-check, summary, PR, gate ⭐, merge | Pendiente (en curso) | — | |
| Paso 34 · corridas 2–3 y avance hacia 200 | Parcial | `runs/demo-a/suscripcion-planlang-a-001-20-v1.2-r2/corrida.json:1` | r2/r3 hechas; avance hacia 200 = 0 y no declarado (M-19) |
| DoD Observabilidad · LangSmith | Deuda declarada | log:230 | la parada 3 del gate depende del aprovisionamiento: si se difiere, el summary declara «1 ⭐ al acumulado» (la orden dice «0 ⭐») — **decisión del usuario** |
| DoD IA embebida · checklist `ia-embebida`, re-lectura ADR-002 antes del release | Pendiente | — | va en `/deploy-check` y el summary |
| Outcome terciario (avance hacia 200) | Parcial | `hr01-develop-ai-apps/portafolio/planlang/sprints/SPRINT_001.md:24-25` | M-19 |

## 2. Frases caducadas (barrido por promesa aplazada)

Se revisaron todas las coincidencias de `todavía no · aún no · por ahora · de momento · mientras tanto · próximamente ·
llega después · en esta versión · más adelante · no (se) puede · sin embargo · podrás · permitirá` (+ EN) en README,
manual, guía, kit, ADRs, plantillas del informe e informes versionados. **Caducadas o falsas:**

| Ubicación | Frase | Por qué |
|---|---|---|
| `README.md:21` | «brochure y blueprint» | solo existen plantillas (B-14) |
| `README.md:22` | lista de 3 ADRs | hay 5 (B-14) |
| `docs/MANUAL-DE-USO.md:109-110` · `:208-209` | «¿Por qué «cumple con alertas» si nada falló? … un criterio que exige tres corridas y tiene menos» | premisa del informe v1.1; el vigente tiene S3 refutado (B-15) |
| `decisions/001-codigo-primero-demos.md:46-51` | fallback `proveedor_no_disponible` · «el lote para» | no existe (AU-9) |
| `decisions/001-codigo-primero-demos.md:20,23` | `agents/tests/test_reglas.py` · «medido en fase 2 … línea base de extracción» | archivo y medición inexistentes (M-17) |
| `decisions/002-proveedor-y-cumplimiento-suscripcion.md:73-76` | «con `--pausa-s` … ≈ 80 llamadas de ~1,5 mil tokens … ~10 min» | medido: 47–49 llamadas, ~4,7 mil tokens, ~5 min; sin pausa por defecto (AU-10) |
| `decisions/004-salida-estructurada-y-max-turns.md:32-33` | consecuencias sin el agotamiento de reintentos | v1.2-base A-012 los agotó (B-19) |
| `core/brecha/informe.ts:358-359` | «El modo Texas se recalcula porque sus dos entradas quedaron registradas» | constante, no derivada del dato; U4 no mueve nada (AU-4) |
| `sprints/SPRINT_001-implementation-log.md:73` | «se completa al llegar el resultado» | nunca se completó (B-1) |
| `sprints/SPRINT_001-implementation-log.md:318` | «lo que verifica (… credenciales) ya lo cubren vitest y pytest» | falso para las corridas reales (M-5) |
| `sprints/SPRINT_001-implementation-log.md:391,412` | «las corridas 2 y 3 se acumulan…» · «se corrige en el /deploy-check» | ya resueltas en la fase 5 (B-13) |

Vigentes (verificadas contra la app de hoy): las del manual sobre S2/demo B/entrevistador, las de «más tarde» del
reintento de lotes, las condicionales del verificador («no se puede decidir», «no puede fallar»), las del informe v1.1
(historia) y del golden (sin repeticiones), y «Sin corrida real de 200 todavía».

## 3. Cardinalidades cableadas

- **AU-10 (Alto):** tamaño de lote `--n 20` y alias `sonnet` cableados; el plan los declara en `lotes`.
- **M-18:** umbrales U1–U4 leídos por id y comparados a mano fuera del intérprete.
- **M-20:** reglas de medición del demo A dentro del verificador genérico.
- **B-18:** se asume una sola pausa humana declarada (`pausas_humanas[0]`).
- **Aceptables (constante declarada o falla ruidosa):** `IDIOMAS = ["es","en"]` (regla 20), 9 secciones (§12),
  `SEVERIDAD_BLOQUEANTE = 9`, ECE de 10 intervalos, registro `FUNCIONES` de una entrada (regla 2), `NODOS`/`ARISTAS_FIJAS`
  contrastados con el plan, `--demo choices=["a"]`. **k no está cableado** (sale del plan; las repeticiones se descubren).

## 4. Campos sin consumidor

| Tipo | Huérfanos | Juicio |
|---|---|---|
| `Informe` | `formato`, `version_verificador` (duplica `ficha.verificador.version`), `demo_id`; `resumen.riesgos_ocurridos` (el render lo recalcula: dos fuentes) | `demo_id` y anidados de playground justificados para el S2; quitar la duplicación (B-24) |
| `ResultadoRiesgo` | `no_evaluables`, `fuera_por_senal_nula`, `rpn`, `decision_id`, `mitigaciones_declaradas` | los dos primeros **deben verse ya** (M-24); el resto, S2 |
| `ResultadoEvaluador` · `BrechaNoPrevista` | `no_evaluables` · `categoria`, `evaluador` | deben verse (M-24) |
| `TrazaSchema` | `aclaraciones`, `cobertura`, `guardia_salida`, `DecisionDeArista.umbral_aplicado`, `PausaRegistrada.respuesta_simulada`, `Paso.inicio_ms` | justificados para el visor S2, **salvo `umbral_aplicado`** (AU-5) y `respuesta_simulada` (B-11) |
| `CorridaSchema` · `GrafoSchema` · `RamasEsperadasSchema` | `plan_beneficios`, `plan.id/version` · `demo_id` · `umbrales_aplicados` | deben cotejarse (M-2) |
| `entorno.json` | todo (sin esquema ni huella) | metadato de reproducibilidad; aceptable, declararlo (B-11) |

---

## 5. Hallazgos

### Altos — con ajuste ejecutable

#### AU-1 · Una refutación medida se esconde detrás de una métrica que no existe (T-1)
- **Ubicación:** `core/brecha/supuestos.ts:86-98`; se manifiesta en `tests/golden/demo-a/simulado-3casos/informe.es.md` (S1).
- **Evidencia:** el bucle sobre `Object.keys(umbral).sort()` devuelve `sin_probar` en cuanto encuentra una métrica nula
  (`auroc`), antes de evaluar `ece_max`. El golden muestra ECE 0,1067 > 0,10 y dice «sin probar». El informe real v1.2 no
  está afectado (ECE 0,0807).
- **Por qué importa:** regla 9 — un supuesto crítico refutado por la medida se presenta como «no se pudo decidir».
- **Ajuste:** reemplazar el bucle de `decidirConUmbral` por uno que **acumule**: `fallidas` (claves que no cumplen) y
  `sinValor` (métricas nulas), sin salir antes. Si `fallidas.length > 0` → `estado: "refutado"`, motivo
  `No cumple el umbral de confirmación: ${fallidas}.` + ` Sin valor medido: ${sinValor}.` si hay; EN equivalente. Si no hay
  fallidas pero sí `sinValor` → `sin_probar` con el texto de hoy (`No hay valor medido para ${sinValor.join(", ")}: …`).
  Si ninguna → `confirmado` con el texto de hoy. Test nuevo en `tests/unit/core/brecha/supuestos.test.ts`
  (`describe("calibración (S1)")`): dos muestras `confianza 0.55, correcto true` con `{auroc_min: 0.75, ece_max: 0.1}` →
  `refutado`, `motivo.es` coincide con `/ece_max/` y `/auroc/`. Demo en rojo: con el código viejo el test falla.
  Regenerar el golden (`pnpm brecha:informe --corrida runs/demo-a/simulado-3casos --salida tests/golden/demo-a/simulado-3casos`).
- **Verificación:** S1 del golden pasa a «✗ refutado» y la sección 1 lista «S1: supuesto refutado»; `pnpm test` verde;
  `pnpm brecha:informe --corrida runs/demo-a/suscripcion-planlang-a-001-20-v1.2 --verificar` sigue «al día» en S1.

#### AU-2 · Las repeticiones cierran C5, pero sus fallas no se reportan (A-1)
- **Ubicación:** `core/brecha/informe.ts:436,449`; `core/brecha/brechas-no-previstas.ts:88-95`; `core/brecha/veredicto.ts`.
- **Evidencia:** riesgos y brechas no previstas se calculan solo sobre la corrida principal; r2/r3 solo entran a
  `evaluarCriterios`. El informe v1.2 lista 1 brecha (A-003); en r2/r3 hubo 4 más (A-006 con 2 reintentos, A-017, A-016,
  A-017 en extractor y redactor).
- **Por qué importa:** regla 9 — se usan r2/r3 para certificar «cumple (k = 3)» sin mirar lo que falló en ellas.
- **Ajuste:** (1) `BrechaNoPrevista` gana `corrida_id: string`; `brechasNoPrevistas(plan, vistas, riesgos, corridaId)`
  lo pone en cada brecha. (2) En `generarInforme`, calcular para cada repetición `riesgos = evaluarRiesgos(plan, vs)` y
  sus `brechas`; `brechas_no_previstas` del informe = principal + repeticiones. (3) `veredicto(...)` recibe
  `repeticiones: {id, riesgos}[]`: cada riesgo `ocurrio` en una repetición añade la alerta
  `${r.id}: ocurrió en la repetición ${id}.` / `${r.id}: occurred in repetition ${id}.` y, con severidad ≥ 9, va a
  bloqueantes. (4) `render-md.ts` sección 5: si `b.corrida_id !== inf.corrida_id`, anteponer `` `(${b.corrida_id})` ``.
  (5) Tests: una repetición sembrada con un reintento aparece en la sección 5 con su corrida; un riesgo ocurrido solo en la
  repetición produce la alerta. Demo en rojo registrada.
- **Verificación:** la sección 5 del informe v1.2 tiene 5 entradas (A-003; r2: A-006, A-017; r3: A-016, A-017);
  `pnpm test` verde.

#### AU-3 · El veredicto y el resumen para quien decide callan lo que no se pudo medir (A-2 + T-6)
- **Ubicación:** `core/brecha/veredicto.ts:69-109`; `core/brecha/informe.ts:175-197` (recomendación).
- **Evidencia:** solo `refutado` genera alerta. En el informe v1.2, S1 (criticidad **alta**) queda «◌ sin probar» y no
  aparece en «Por qué este veredicto» ni en la recomendación. Tampoco generan alerta un riesgo `sin_poblacion` ni un
  hallazgo de contrato de severidad `alerta`: un plan con todo sin probar saldría «cumple».
- **Ajuste:** en `veredicto.ts`: (a) supuesto `sin_probar` con `criticidad === "alta"` → alerta
  `${s.id}: supuesto crítico sin probar.` / `${s.id}: critical assumption left untested.`; (b) riesgo `sin_poblacion` →
  alerta `${r.id}: ningún caso del lote puso a prueba su detector.` / EN; (c) hallazgos de contrato `alerta` → una alerta
  `Contrato de grafo: N alerta(s).` / EN. Actualizar la cabecera (l.2-8). En `informe.ts:195`, incluir en los ids de la
  recomendación los supuestos `sin_probar` de criticidad alta. Tests en `tests/unit/core/brecha/brechas-y-veredicto.test.ts`
  para los tres casos (demo en rojo). Presupuesto de líder (≤ 50 palabras) sigue verde.
- **Verificación:** el informe v1.2 dice «Alerta: S1: supuesto crítico sin probar.» y la recomendación nombra S1; `pnpm test` verde.

#### AU-4 · El modo Texas (U4) no mueve nada y el informe afirma que se recalcula (P-2 + A-11)
- **Ubicación:** `core/playground/interprete.ts:138-151,223`; `core/brecha/informe.ts:352-360`;
  `plans/demo-a/v1.2.json` (aristas 4 y 5 de `decision`, U4 `senal: modo_texas`).
- **Evidencia:** (1) las entradas de `texas_y_no_aprobar` se toman de la traza, así que mover U4 no cambia `modo_texas`;
  (2) aun corrigiéndolo, `propuesta ∈ {aprobar, negar}` y la arista 4 (`propuesta == negar → pausa_humana`) ya cubre todo
  lo que la 5 cubriría: **0 ramas distintas** en las 20 trazas. La frase del informe es una constante.
- **Por qué importa:** regla 4 (modo Texas como umbral jugable) y regla 9 (no publicar como explorable lo que no mueve nada).
- **Ajuste:** (1) `recalcular(trazas, grafo, umbrales, ligaduras = {})` en `interprete.ts`: `ligaduras` mapea
  `señal → id de umbral`; al armar las `entradas` de una función, si la entrada está en `ligaduras` se usa
  `umbrales[ligaduras[k]]`, si no la señal registrada. Sin `ligaduras` el comportamiento es idéntico (RF-09.2 y
  `ramas-esperadas` no cambian). (2) Helper `ligadurasDeUmbrales(plan)` en `core/plan/contrato-constructor.ts`: los
  umbrales con `rango_jugable.tipo === "booleano"` (su señal ES el interruptor; comentario que lo diga).
  (3) `informe.ts`: quitar el segundo ítem de `LIMITES_PLAYGROUND`; en `playground(...)` (recibe la corrida leída),
  para cada umbral booleano contar las visitas cuya `rama_tomada` cambia entre `recalcular(…, umbrales, lig)` y
  `recalcular(…, {...umbrales, [id]: !valor}, lig)`, y emitir
  `${id} (${nombre.es}): conmutarlo cambia ${n} de ${total} decisiones registradas en esta corrida.` / EN; y para cada
  arista con `funcion`, si todas sus entradas están en todas las trazas: `La regla ${nombre}(${entradas}) se puede
  recalcular: sus entradas están en todas las trazas.`, si no: `… no se puede mover: falta alguna entrada («no observado»).`
  (4) Tests: `interprete.test.ts` — con `{modo_texas: "U4"}` y U4 = true la entrada registrada es `true`, y sobre un grafo
  sin la arista 4 una negación cambia a `pausa_humana`; `informe.test.ts` — el informe v1.2 dice «U4 (Modo Texas):
  conmutarlo cambia 0 de». (5) Bitácora, `## Desviación del plan` 11: U4 inerte en el demo A v1.2 (arista 4 subsume a la
  5) + propuesta a la planeadora (dar a `propuesta` un valor adverso parcial o retirar U4 del plan A).
- **Verificación:** sección 8 del informe v1.2 con la cifra calculada; `pnpm test` y `pytest` verdes; RF-09.2 sin cambios.

#### AU-5 · Nadie compara los umbrales aplicados con los del plan (T-2)
- **Ubicación:** `core/brecha/contrato-grafo.ts:23-35,90,319`; `core/brecha/informe.ts:422`; `scripts/trazas-verificar.ts:62-70`;
  `tests/unit/core/playground/rf-09-2.test.ts:55,69,88,104`.
- **Evidencia:** RF-09.2, criterios y playground usan `manifiesto.umbrales_aplicados`; `umbrales_del_plan` solo se imprime.
  Si el agente aplicara U1 = 0,6, manifiesto, ramas y trazas serían coherentes y **ningún gate fallaría**.
- **Por qué importa:** regla 2 — «con el umbral en su valor del plan, el recálculo reproduce…»; hoy el gate no puede
  fallar en el caso para el que existe (tercera pregunta de la regla 15).
- **Ajuste:** (1) `CODIGOS_CONTRATO` + `"UMBRAL_DISTINTO_DEL_PLAN"`; antes del bucle de corridas, para principal,
  repeticiones y base: si `jcs(cr.manifiesto.umbrales_aplicados) !== jcs(umbralesAplicados(plan))` → hallazgo
  **bloqueante** con `corrida_id`, detalle ES/EN «La corrida aplicó umbrales distintos de los del plan: la prueba cruzada
  y los criterios no miden el plan.» (2) Mismo chequeo en `scripts/trazas-verificar.ts` (cargar el plan de cada corrida).
  (3) `rf-09-2.test.ts` usa `umbralesAplicados(plan)` en lugar de los del manifiesto. (4) M9: helper `mutarManifiesto` en
  `core/brecha/m9.ts` (copia, muta, resella con `conHuella(sinHuella(…))`) y siembra `umbral_distinto_del_plan`
  (U1 → 0.8); `pnpm m9:reporte`.
- **Verificación:** M9 «Detectadas: 9 de 9» (10 con AU-6); `pnpm trazas:verificar` ✓ en las 7 corridas; informes al día.

#### AU-6 · Un nodo que decide sin dejar registro escapa a RF-09.2; un registro a medias revienta el verificador (T-3)
- **Ubicación:** `core/brecha/contrato-grafo.ts:86-160`; `core/playground/interprete.ts:99-103`; `core/brecha/lector.ts:170-177`.
- **Evidencia (sondas en memoria):** borrar los 5 registros de `decision` de AH-002 y resellar → el informe no dice nada
  nuevo; borrar solo `orden_arista 2` → `ErrorArista: señal ausente…` crudo, sin caso ni paso.
- **Por qué importa:** reglas 2 y 3 — sin registro no hay prueba cruzada ni playground.
- **Ajuste:** `CODIGOS_CONTRATO` + `"DECISION_SIN_REGISTRO"`; función `decisionesIncompletas(t, porNodo, corridaId)`
  (número de aristas condicionales por nodo desde `c.grafo.aristas_condicionales`): por cada paso de un nodo con aristas,
  los `orden_arista` registrados deben ser exactamente `1..n`; excepción: el último paso de una traza `resultado: "error"`
  con `error_proveedor` (caso legítimo: v1.2-base A-012). Hallazgo **bloqueante** ES/EN con paso, nodo, n y registrados.
  En `rf092`, si hay hallazgos, no llamar a `discrepanciasDeRamas`/`ramasEsperadas` (devolver `coincide: false`).
  Tests en `contrato-grafo.test.ts` (visita sin registros; arista 2 ausente) — ninguno lanza. Siembra M9
  `decision_sin_registro` (AH-002).
- **Verificación:** M9 10/10; `informes-versionados` sin falsos positivos; `pnpm trazas:verificar` ✓.

#### AU-7 · Una regla «mal formada» se traga en silencio en evaluadores, supuestos y repeticiones (T-4)
- **Ubicación:** `core/brecha/brechas-no-previstas.ts:71-75,146-154`; `core/brecha/supuestos.ts:182,241`;
  `core/brecha/criterios.ts:137-140`; `core/brecha/render-md.ts:352-360`.
- **Evidencia (sonda):** una extracción sin una clave de `campos` hace que `exactitud_extraccion` salga «ejecutado · 0
  fallas» y S1 «sin probar · no hay valor para ece». Latente hoy (el extractor siempre emite las 4 claves).
- **Ajuste:** (1) evaluadores: si `ev.mal_formada` → `estado: "mal_formado"` (nuevo valor del tipo) + brecha
  `evaluador_no_ejecutado` con el motivo; render `⚠ no pudo medir` / `⚠ could not measure`. (2) supuestos (calibración y
  tasa): si `ev.mal_formada` → `sin_probar` con motivo `La regla del supuesto no pudo medir: …` / EN. (3) criterios: si una
  repetición da `mal_formada` → `estado: "mal_formado"` con nota `Repetición N: …`. Tests con la vista «sin clave» (demo en rojo).
- **Verificación:** tests nuevos rojos con el código viejo y verdes con el nuevo; informes versionados al día.

#### AU-8 · Un límite de uso que llega en el JSON del CLI se clasifica como `otro` (P-1)
- **Ubicación:** `agents/src/app_agents/adaptador.py:127-157` (`_es_limite`, `_clasificar_is_error`).
- **Evidencia:** el límite solo se reconoce en stderr; ADR-004 documenta que el CLI deja la causa en el JSON de stdout
  con stderr vacío. Un «usage limit reached» / `api_error_status: 429` termina en `otro`: el lote no se detiene y el caso
  queda exportado como error permanente (no se reintenta, `lotes.py:216`).
- **Por qué importa:** regla 6 y RF-05.5 — seguir disparando contra una cuota agotada y contaminar pass^k.
- **Ajuste:** ampliar la tupla de `_es_limite` con `"usage limit", "rate limit", "rate_limit", "limit reached",
  "hit your limit", "too many requests", "429"`; al inicio de `_clasificar_is_error`:
  `texto = str(data.get("result") or "")` y `if str(data.get("api_error_status")) == "429" or _es_limite(texto): return
  ErrorProveedor("limite_de_uso", f"{subtipo or 'is_error'}: {texto[:200]}", costo)`. Tres casos nuevos en el
  `parametrize` de `agents/tests/test_adaptador_flags.py` (límite en `result` con `rc=1`; `api_error_status=429` con
  `rc=1` y con `rc=0`) → `limite_de_uso`. Demo en rojo.
- **Verificación:** `cd agents && .venv/bin/pytest -q tests/test_adaptador_flags.py` verde con los 3 casos.

#### AU-9 · El ADR-001 §4 describe un respaldo que no existe (A-3 + P-11)
- **Ubicación:** `decisions/001-codigo-primero-demos.md:44-51`; código real `agents/src/app_agents/lotes.py:242-262`.
- **Evidencia:** «el nodo `decision` enruta a `pausa_humana` con motivo `proveedor_no_disponible` … y el lote para»;
  `git grep proveedor_no_disponible` solo lo encuentra en el ADR. En v1.2-base, A-012 terminó en error sin pausa.
- **Por qué importa:** es el documento de cumplimiento de la regla 14; afirma una salvaguarda humana inexistente.
- **Ajuste:** reemplazar §4 por: «Sin proveedor el caso no se inventa. `limite_de_uso`: la sesión se detiene, el caso no
  se exporta y se reintenta en la sesión siguiente (RF-05.5). Cualquier otro error (`timeout`, `esquema_invalido` tras
  2 reintentos, `otro`): se exporta una traza parcial con `resultado: error`, `error_proveedor` y el nodo que falló; el
  lote continúa y ese caso queda sin decisión (no pasa por `pausa_humana`); el verificador lo reporta como brecha no
  prevista y, en la línea base, como caso mal resuelto. En CI el proveedor es `ChatSimulado`. **Deuda (S2):** enrutar a
  `pausa_humana` con motivo `proveedor_no_disponible`.» + nota «enmendado 2026-09-27». Desviación en la bitácora y deuda
  en el summary.
- **Verificación:** `git grep -n proveedor_no_disponible -- decisions` solo en la línea de deuda.

#### AU-10 · Tamaño de lote y modelo cableados; el régimen «20 casos, espaciados» no está en el código (A-4 + P-8 + A-8)
- **Ubicación:** `package.json:20-21`; `agents/src/app_agents/lotes.py:62,171-182,359-361`;
  `decisions/002-proveedor-y-cumplimiento-suscripcion.md:73-76`.
- **Evidencia:** `lote:demo` = `… --n 20` sin `--pausa-s` (por defecto `0.0`); `MODELO_POR_PROVEEDOR["suscripcion"] =
  "sonnet"`; el plan declara `lotes.corridas_espaciadas_de: 20` y `modelo_alias: "sonnet"` y nadie los lee. Con
  `--casos …-200` y sin `--n` corren 200 seguidos.
- **Por qué importa:** literal donde el dato dice N (rúbrica: Alto); regla 6 (lotes de 20 espaciados; es la mitigación
  del caso ambiguo del ADR-002).
- **Ajuste:** (1) en `ejecutar_lote`, tras cargar el plan: `lotes_plan = plan.datos["lotes"]`; si `n is None`,
  `n = int(lotes_plan["corridas_espaciadas_de"])`; con `proveedor == "suscripcion"` y `n > corridas_espaciadas_de` →
  `ValueError` («regla 6: con la suscripción, a lo sumo N casos por sesión»); el alias del modelo con suscripción sale de
  `lotes_plan["modelo_alias"]` salvo `--modelo` explícito. (2) en `main`, con `--proveedor suscripcion` y
  `--pausa-s <= 0` → `p.error(...)`. (3) `package.json`: `lote:demo` y `lote:base` sin `--n 20` y con `--pausa-s 2` (lo
  usado en las corridas versionadas). (4) ADR-002 §73-76 con las cifras medidas (47–49 llamadas multiagente, ~23 agente
  único, contexto del extractor ≈ 4,7 mil tokens, ≈ 5 min con 2 s de pausa, 2026-09-27). (5) Tests en `test_lotes.py`:
  un plan con `corridas_espaciadas_de: 2` ejecuta 2 casos (simulado); suscripción con `--pausa-s 0` → `SystemExit` antes
  de invocar nada. Revisar que manual y guía no citen `--n 20`.
- **Verificación:** `grep -n -- "--n 20" package.json` vacío; `pytest` verde incluida la corrida simulada byte a byte.

### Medios

| Id | Hallazgo (origen) | Ubicación | Ajuste propuesto |
|---|---|---|---|
| M-1 | La línea base entregó al afiliado JSON crudo, «placeholder» o nada (v1.2-base: 7 casos) y ni la guardia ni el informe lo ven; S3 no lo dice (A-12) | `agents/src/app_agents/demo_a/guardia.py:78` · `agents/src/app_agents/agente_unico.py:130-134` · `runs/demo-a/suscripcion-planlang-a-001-20-v1.2-base/trazas/A-009.json:279` · `core/brecha/supuestos.ts` (`comparacion`) | guardia: salida vacía, JSON o «placeholder» → plantilla de la decisión + hallazgo `salida_malformada`; verificador: limitación en S3 que nombra las respuestas inservibles de cada lado |
| M-2 | La compatibilidad del lote no coteja el plan de beneficios (bypass de ADR-005); el lector no cruza `plan.id/version`, `demo_id`, `ramas.umbrales_aplicados`, `casos_con_error` (P-6 + T-13) | `agents/src/app_agents/lotes.py:172-200` · `core/brecha/lector.ts:201-252,313-359` | comparar `lote.plan_beneficios.huella` con la usada (Python antes de correr y al reanudar; TS en `compatible()`), más los cruces de T-13, con tests |
| M-3 | Repeticiones y línea base sin validar: duplicadas, de otro grafo o con otros casos cuentan para pass^k/S3 (T-7) | `core/brecha/lector.ts:432-444` · `core/brecha/supuestos.ts:348-358` | rechazo `CORRIDA_INCOMPATIBLE` en esos tres casos; limitación en S3 si la base no corrió los mismos casos |
| M-4 | `.coverage` (SQLite con `/Users/henryrincon/…`) versionado en la raíz de un repo público (A-7) | `.coverage` (commit `5f2056b`) · `.gitignore:30` | `git rm --cached .coverage`; añadir `.coverage` y `.coverage.*` al `.gitignore` |
| M-5 | El barrido de credenciales de las corridas REALES no corre en CI, y la bitácora dice que sí; no lee `.md` (P-10) | `scripts/trazas-verificar.ts:15-44` · `.github/workflows/ci.yml:28` · log:318 | paso `pnpm trazas:verificar` en el job `quality`; barrer también `.md`; más patrones (`CLAUDE_CODE_OAUTH_TOKEN`, `Bearer …`, rutas de usuario); corregir la bitácora |
| M-6 | S3 se decide con una regla por defecto (tolerancia cero) que ni el plan ni el informe muestran; con latencia nula confirma (A-10 + T-17) | `core/brecha/supuestos.ts:1-9,372-402` | el motivo lo dice («regla por defecto del verificador: exactitud ≥ y latencia mediana ≤ las de la línea base»); latencia nula → `sin_probar`; proponer tolerancia en una v1.3 sin reescribir el veredicto v1.2 |
| M-7 | «Ninguna negación sin pausa» vive solo en una arista configurable; el código no la asevera (P-3) | `agents/src/app_agents/demo_a/nodos.py:412` · `agents/src/app_agents/agente_unico.py:137` | aserción de arquitectura antes de redactar (`negar` sin `pausa_humana` → excepción) con test sobre un plan sin la arista |
| M-8 | El revisor humano no ve orden adjunta, aclaraciones ni cobertura (P-4) | `agents/src/app_agents/demo_a/nodos.py:378-386` | ampliar el payload (cambia trazas: regenerar la simulada; las reales rigen desde el S2) — **deuda S2** |
| M-9 | Una excepción no clasificada tumba la sesión y pierde las trazas ya obtenidas (P-5) | `agents/src/app_agents/lotes.py:229-344` · `adaptador.py:204-215` | persistir en `finally`; envolver `OSError` y errores del interruptor en `ErrorProveedor` |
| M-10 | La línea base no es «a igual presupuesto» (23 vs 47 llamadas) y no hay ADR (P-7) | `agents/src/app_agents/agente_unico.py:1-7` · `plans/demo-a/v1.2.json:172` | ADR-006 con la definición operativa («presupuesto ≤») y propuesta a la planeadora |
| M-11 | El entorno del hijo filtra nombres exactos (deja pasar `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_USE_BEDROCK`, `LANGSMITH_ENDPOINT`…); test tautológico (P-9) | `agents/src/app_agents/adaptador.py:43-53,116-119` · `agents/tests/test_adaptador_flags.py:101-108` | filtrar por prefijos `ANTHROPIC_`, `LANGSMITH_`, `LANGCHAIN_`, `CLAUDE_CODE_`; test literal; re-correr el humo real fuera de CI |
| M-12 | Sin lock de Python: `grafo.json` depende de una ruta interna de LangGraph (P-13) | `agents/pyproject.toml:11-19` · `.github/workflows/ci-python.yml:25` | `constraints.txt` desde el venv validado + adenda al ADR-003 |
| M-13 | Contrato JCS: el fixture llega prenormalizado y la NFC es asimétrica Python ↔ TS (P-14) | `agents/src/app_agents/canonico.py:57-66,157` · `core/formatos/jcs.ts:35` | casos crudos en el fixture; `normalize("NFC")` en `jcs.ts` |
| M-14 | R8 es inalcanzable: Python jamás emite `limite_de_uso` en una traza (P-15) | `agents/src/app_agents/lotes.py:243-247` · `plans/demo-a/v1.2.json:864` | desviación + enmienda de riesgos (medir sobre el manifiesto); mientras, marcar R8 «no medible por trazas» si hubo límites |
| M-15 | Documento adverso: regla RB-03 fija, servicio desde la extracción, `completo`/`idiomas` autodeclarados por el emisor (P-16) | `agents/src/app_agents/demo_a/nodos.py:414-437` · `documento_adverso.py:76-78` · `core/formatos/traza.ts:104-106` | regla según la causal, servicio desde la orden, idiomas calculados; el verificador recalcula la completitud |
| M-16 | La inyección puede mover el enrutamiento vía señales que declara el modelo (confianza, costo) (P-17) | `agents/src/app_agents/demo_a/nodos.py:186-192` · `guardia.py:73-108` | registrar el riesgo; señal determinista `carga_detectada` → `pausa_humana` en una v1.3 (cambia el contrato de grafo: nuevo lote) |
| M-17 | ADR-001 cita un test inexistente y una medición no hecha (A-6) | `decisions/001-codigo-primero-demos.md:20,23` | corregir la ruta a `agents/tests/test_grafo_demo_a.py`; declarar la línea base de extracción por patrones como deuda |
| M-18 | Umbrales leídos por id y comparados a mano fuera del intérprete; el `tope_alto_costo` del plan de beneficios se ignora (A-9) | `agents/src/app_agents/demo_a/nodos.py:253,344` · `estado.py:67` · `core/sintetico/generador.ts:104-126` | resolver el umbral por señal y comparar con `comparar()` del intérprete; aserción en el generador |
| M-19 | El avance hacia 200 (paso 34, outcome terciario) no se hizo ni se declaró; M9 como código y sin `demo_a/reglas.py`, sin declarar (A-13) | log `## Desviación del plan` | desviaciones 12 y 13 en la bitácora; outcome terciario «Parcial» en el summary |
| M-20 | Reglas de medición del demo A dentro del verificador genérico; `pausas_cumplidas` ignora «rechazar» (A-14 + T-12) | `core/brecha/brechas-no-previstas.ts:26-66` (l.49) · `supuestos.ts:34-37` · `contexto.ts:71` | hoy: `decision_final IN ['negar','rechazar']` con test; deuda S3 (demo B): mover las reglas al plan o a un registro por dominio |
| M-21 | Un riesgo cualquiera en el caso suprime sus errores de proveedor y reintentos (T-5 + A-21) | `core/brecha/brechas-no-previstas.ts:172-190` · `tests/unit/core/brecha/brechas-y-veredicto.test.ts:97-99` | solo los riesgos cuyo detector mira `error_proveedor` / `error_de_esquema_en_traspaso` cubren esas brechas |
| M-22 | `aprobarPlan` sella el borrador crudo y `cargarPlan` verifica el parseado: un plan aprobado puede no cargar (T-8) | `core/plan/cargar.ts:38-40,70-96` · `scripts/plan-validar.ts:56-61` | verificar sobre el crudo y sellar el canónico parseado; test con `depende_de` ausente |
| M-23 | El validador acepta señales no declaradas y funciones de arista no registradas (el v1 lo demuestra con `servicio_exento`) (T-9) | `core/plan/validador.ts:71-104,195-208` | advertencia `SENAL_NO_DECLARADA` (motivo al aprobar); función no registrada → `REFERENCIA_ROTA` |
| M-24 | No se muestran los casos no evaluables de riesgos y evaluadores, ni la categoría de la brecha (T-10) | `core/brecha/render-md.ts:244-293,377-403` | notas de medida también para riesgos; columna «No evaluables» en evaluadores |
| M-25 | El EN del informe pierde hechos del ES (D1, D2, D4) y hay campos monolingües en el esquema del plan (T-11) | `plans/demo-a/v1.2.json:395,423,455,488` · `core/plan/esquema.ts:23-29,57-63,93,191-193` · `core/brecha/detectores.ts:106-108` | test de hechos numéricos ES/EN con lista de deuda; plan v1.3 bilingüe y enmienda del esquema (deuda) |
| M-26 | Criterios con métrica: todo nulo → «sin población» (falso); pass^k/tasa con métrica ignora k (T-14) | `core/brecha/criterios.ts:94-131` · `core/plan/validador.ts:345-395` | validador rechaza combinaciones sin sentido; todo nulo → `indeterminado`; nota según el sentido del objetivo |

### Bajos

| Id | Hallazgo (origen) | Ubicación | Ajuste |
|---|---|---|---|
| B-1 | Demo en rojo del job `python` sin registro (existió: PR #4, `python fail`) (A-5 + P-12) | log:73 | anotar PR #4, fecha, test y cierre sin merge; borrar la rama `demo-rojo/s1-python` |
| B-2 | `ciclos_aclaracion` exportado ≠ el valor que vio la arista (P-18) | `agents/src/app_agents/exportador.py:65` · `nodos.py:208-211` | documentar la semántica (no cambiar: trazas reales) |
| B-3 | Guardia/enmascarado por coincidencia exacta; pregunta de aclaración sin filtro; delimitadores sin escapar (P-19) | `agents/src/app_agents/demo_a/nodos.py:58-62,168-173,222-228` · `guardia.py:88-91` | regex tolerante, filtrar la pregunta, escapar `<<<`/`>>>` |
| B-4 | Un `mkdtemp` huérfano por llamada (568 en `$TMPDIR`) (P-20) | `agents/src/app_agents/adaptador.py:122-124,188-191,257` | `TemporaryDirectory` por llamada; limpieza manual de los existentes |
| B-5 | `verificar_corrida` (Python) no comprueba que se siguió la rama registrada (P-21) | `agents/src/app_agents/exportador.py:199-221` | espejo de `RAMA_NO_SEGUIDA` de TS |
| B-6 | La ruta de error cae con nodo «desconocido» (P-22) | `agents/src/app_agents/lotes.py:250` · `exportador.py:50` | `tipo_nodo = None` ante `PlanInvalido` |
| B-7 | `checkpoints.sqlite` en 600 sin test; `-wal`/`-shm` nacen con la umask (P-23) | `agents/src/app_agents/lotes.py:206-212` | umask 077 al abrir + test, o declarar que no aplica (sintético) |
| B-8 | Hooks de gitleaks heredados: PreToolUse escanea lo staged, pre-commit falla abierto (P-24) | `.claude/settings.json:12` · `githooks/pre-commit:7-18` | enmienda del kit (planeadora); cambiar la config de Claude Code solo con aprobación del usuario |
| B-9 | El techo US$10 del interruptor a API no existe en código (P-25) | `decisions/002-…md:78` · `adaptador.py:424-431` | enmendar el ADR: techo por límite de gasto en la consola del proveedor + tope de `--n` |
| B-10 | ADRs 001–005 en español; la constitución pide ADRs en inglés (P-26) | `decisions/00*.md:1` · `CLAUDE.md` § Idioma | traducir o registrar la excepción aprobada por el usuario |
| B-11 | Huérfanos emitidos por Python (`respuesta_simulada`, `cobertura`, `aclaraciones`, `guardia_salida.hallazgos`, `detenida_por`, `entorno.json`) (P-27) | `agents/src/app_agents/exportador.py:90-96,179-180` · `nodos.py:400-403` | Python verifica `respuesta_simulada.decision == decision_final`; el resto al visor S2 |
| B-12 | Nada impide que un test local invoque el binario real (P-28) | `agents/tests/conftest.py:13` | fixture `autouse` que apunta `CLAUDE_BIN` a una ruta inexistente salvo humo real |
| B-13 | Frases y cifras caducas en la bitácora (l.291, 296, 367, 373, 391, 412) (A-15) | log | corregir (600 tests incluye ~30 locales de la Etapa de Diseño: usar la cifra de CI) |
| B-14 | README cita brochure/blueprint y solo 3 ADRs (A-16) | `README.md:21-22` | corregir |
| B-15 | FAQ del manual con la premisa del informe v1.1 (A-17) | `docs/MANUAL-DE-USO.md:109-110,208-209` | reescribir ES/EN nombrando S3 (redactado, no traducido) |
| B-16 | Demos en rojo débiles: planes sembrados, carnadas C01–C05 y frescura del schema (A-18) | log:118-119 | correr y registrar las tres demos |
| B-17 | El informe EN muestra enumeraciones en español («aprobar», «inyeccion», «exactitud =», «multiagente») (A-19 + T-22) | `core/brecha/informe.ts:292-346` · `render-md.ts:337,396,413-418` | mapas bilingües de decisión, detalle adversario, métrica, tipo de evaluador y variante |
| B-18 | Se asume una sola pausa humana (A-20) | `agents/src/app_agents/demo_a/nodos.py:389` · `lotes.py:332` · `core/brecha/contrato-grafo.ts:325` | buscar la pausa por nodo |
| B-19 | ADR-004 omite que los reintentos se agotaron en v1.2 (A-22) | `decisions/004-salida-estructurada-y-max-turns.md:32-33` | añadir A-012 (base) y A-006 (r2) |
| B-20 | Trazas con `resultado: error` entran a las poblaciones como completas (T-15) | `core/brecha/reglas.ts:114-128` | llevarlas a `no_evaluables` |
| B-21 | El detector de tasa redondea antes de comparar con «ocurre si» (T-16) | `core/brecha/detectores.ts:125-130` | comparar el valor bruto |
| B-22 | El resolver de contexto lee propiedades heredadas (`constructor`) (T-18) | `core/brecha/condiciones.ts:403-413` | `Object.hasOwn` |
| B-23 | Rutas del manifiesto sin confinar (path traversal en los CLI) (T-19) | `scripts/_corridas.ts:22,84-86` · `scripts/trazas-verificar.ts:58-61` | helper `dentro(base, rel)` |
| B-24 | Helpers duplicados con semánticas distintas (`umbral.U1 ` con espacio pasa el validador); `plan → brecha` (T-20) | `core/plan/contrato-constructor.ts:25-35` · `core/playground/interprete.ts:57-65` · `core/plan/validador.ts:14` | validar el prefijo `umbral.`; unificar helpers; mover `condiciones.ts` (deuda) |
| B-25 | Huecos de tests: presupuesto de líder solo sobre v1 y la simulada; sin guardia de imports de `packages/`; tabla de aristas escrita a mano (T-21) | `tests/unit/core/plan/dominios.test.ts:66-86` · `tests/unit/core/brecha/informe.test.ts:65-69` · `tests/unit/guardias/neutralidad.test.ts:65-79` | iterar planes aprobados e informes versionados; barrido de imports; fixture emitido por Python (deuda) |
| B-26 | El validador de identificadores no revisa números (`documento: 1023456789`) (T-23) | `core/sintetico/validador-identificadores.ts:229-268` | revisar enteros ≥ 1.000.000 y claves de identificador; carnada |
| B-27 | `primerPasoDe` devuelve el último paso (T-24) | `core/brecha/brechas-no-previstas.ts:97-101,166` | renombrar y documentar, o cambiar la semántica |

---

## 6. Plan propuesto para la Fase 2 (espera la aprobación del usuario)

**Opción recomendada — Altos + Medios baratos de honestidad y seguridad (sin corridas reales nuevas):**
AU-1 a AU-10 · M-1 · M-2 · M-3 · M-4 · M-5 · M-6 · M-7 · M-10 (ADR-006) · M-11 · M-17 · M-19 · M-20 (solo `rechazar`) ·
M-21 · B-1 · B-13 · B-14 · B-15 · B-17 · B-19. Orden de ejecución: primero los que cambian el informe (AU-1, AU-2, AU-3,
AU-4, AU-5, AU-6, AU-7, M-1, M-3, M-6, M-21, B-17) con **una sola regeneración** de los 3 informes y de M9 al final;
después Python (AU-8, AU-10, M-2, M-7, M-11); después documentos (AU-9, M-10, M-17, M-19, B-*). Cada gate nuevo con su
demo en rojo en la bitácora. Al terminar: repetir la casilla «¿qué frases caducaron?» sobre el diff de la Fase 2
(la guía y el manual describen el informe v1.2, que cambiará).

**Opción mínima — solo los 10 Altos**; todo lo demás, deuda.

**Deuda propuesta (con sprint de pago), para lo que quede fuera:**
- **S2 (vitrina, visor y playground):** M-8, M-9, M-12, M-13, M-14, M-15, M-18, M-22, M-23, M-24, M-26, B-2 a B-7, B-11,
  B-12, B-16, B-18, B-20 a B-27 (y los Medios de la opción recomendada si se elige la mínima).
- **S3 (demo B y entrevistador):** M-20 (reglas del demo al plan), M-25 (plan bilingüe + enmienda del esquema), M-16
  (señal `carga_detectada`, nuevo contrato de grafo).
- **Planeadora / kit (propuestas en el summary):** B-8 (hooks de gitleaks), B-10 (idioma de los ADRs), U4 del plan A
  (AU-4), R8 sobre el manifiesto (M-14), tolerancia de S3 (M-6), `--max-turns 2` con `--json-schema` (desviación 7),
  enmienda C03 (desviación 1).

---

## 7. Fase 2 — ajustes aplicados (2026-09-27)

**Aprobación del usuario:** «apruebo, opción recomendada». Se pagaron los 10 Altos (AU-1 a AU-10), los Medios
M-1, M-2, M-3, M-4, M-5, M-6, M-7, M-10, M-11, M-17, M-19, M-20 (solo «rechazar») y M-21, y los Bajos B-1, B-13,
B-14, B-15, B-17 y B-19. El detalle de cada pago (qué y dónde) y la tabla de **demos en rojo** de cada gate nuevo
están en la bitácora, sección «Auditoría final». Desviaciones declaradas durante la ejecución:

- **AU-5, siembra M9:** la mutación del plan (solo el manifiesto) la rechazaba antes el nuevo cruce ramas ↔
  manifiesto del lector (M-2); se hizo coherente (manifiesto **y** ramas con U1 = 0,8, un exportador honesto
  que de verdad aplicó otro umbral) para que la detecte el gate AU-5 y no otro.
- **AU-4:** el recuento de la sección 8 cuenta todas las decisiones registradas de la corrida (62), no solo las
  del nodo `decision`; la cifra sale igual de inerte («0 de 62»).
- **M-5:** la demo en rojo del barrido se hizo con el mismo comando sobre una copia en el scratchpad; el paso de
  CI corre por primera vez en el PR del cierre.

**Resultado:** vitest 612 (588 versionados) · pytest 137 (96,2 %) · `pnpm trazas:verificar` ✓ en las 7 corridas ·
M9 **10/10** con control limpio · informes versionados al día · humo real del adaptador 3/3 tras M-11 ·
cobertura `core/brecha` 98,4 % / 93,3 % y `core/playground` 100 %.

**Informes regenerados** (determinista, sin corridas nuevas): v1.2 `691e0e37…` (alertas: S1 crítico sin probar,
S3 refutado, 5 brechas no previstas —1 en la corrida y 4 en las repeticiones—; S3 con su regla por defecto, el
error de la base en A-012 y sus 5 respuestas inservibles; «U4: conmutarlo cambia 0 de las 62 decisiones») ·
v1.1 `efc638eb…` (historia: S1 pasa a alerta) · golden `6c560255…` (S1 **refutado**: ECE 0,1067 > 0,10).

**Casilla «¿qué frases caducaron?» repetida sobre el diff de la Fase 2:** las coincidencias nuevas son
condicionales del verificador o deuda declarada (vigentes). Encontró dos frases que la propia Fase 2 volvió
falsas —«M9: 8/8» en la guía (`d2`, `h3`) y «8 fallas plantadas» en el kit— y se corrigieron a 10.

**Veredicto tras la Fase 2: listo para cierre.** Lo no pagado queda como deuda con sprint asignado (sección 6).
