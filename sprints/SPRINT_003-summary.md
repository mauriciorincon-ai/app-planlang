---
sprint: 003
app: planlang
status: closed
opened: 2026-10-04
closed: 2026-10-05
branch: sprint-003/demo-b-y-cierre
pr: https://github.com/mauriciorincon-ai/app-planlang/pull/14
---

# Sprint 003 Summary — planlang «Demo B y el cierre del ciclo»

> Estado de este documento: **BORRADOR** (condición de merge: viaja dentro del PR #14). Las marcas «[POR COMPLETAR: …]»
> dependen de corridas que faltan: conteos finales, CI del commit final, `/deploy-check --python` y la segunda pasada de
> la casilla 4.
> **Acto de ciclo: el Acto 1 (de construcción) ocurre con este merge.** El S3 es el sprint 3 de 3 del ciclo H1 y lo
> cierra. **El Acto 2 queda pendiente y lo corre el usuario cuando decida:** el gate ⭐⭐ de 4 paradas, el sello del
> brochure (en planlang, la vitrina y sus fichas: excepción del G-Plan, sin `docs/BROCHURE.html` ni `/conoce`) y
> `/design-sync`. **Nada se publicó en Claude Design** (`design-sync/project.json`: `lastPublished` null). El merge lo
> hace el usuario con squash y después corre `/cierre-sprint planlang` en la planeadora.

## Outcome

- **Principal — Sí, con la entrevista respondida por delegación (excepción nombrada, abajo).** El entrevistador M2
  propuso el plan B; M1 lo validó y el usuario lo aprobó el 2026-10-04 («apruebo el plan B»; `plans/demo-b/v1.json`,
  huella `0cd6590c…`). El agente B corrió su lote de 20 por suscripción: 20/20 decisiones y extracciones iguales a la
  verdad conocida, 11 pausas, 0 conclusiones sin cita. El informe B ES/EN (plan v1.1) dice «cumple con alertas», con S2
  refutado porque la línea base no corrió a igual presupuesto. La vitrina muestra el B en sus siete pantallas bajo
  `/[idioma]/demo-b/` (ADR-014), con una fila real por demo en la entrada, y nace la ficha del agente B. Tres cambios de
  forma frente al SPRINT_003: 4 umbrales en el playground B (desv. 25), el investigador desde U4 hacia arriba (desv. 19)
  y el redactor del B de tipo `regla` (desv. 18).
- **Secundario — Sí, salvo el LCP.**
  - **Cierres del ciclo:** `docs/BLUEPRINT.html`; guía acumulativa con el ⭐⭐ final; `design-sync/` al día y sin
    publicar (sin «vistas del B», desv. 27); el A en la vitrina sobre la corrida de 200 del plan v1.5, con su línea
    base de 200; constitución v1.37.0 y deltas del kit (falta el README de comandos, desv. 29); diagramador 0.5.0 con
    `recorridos`; auditoría 2-bis del `CLAUDE.md`.
  - **Deuda del S2 pagada:** informe sin fragmentos; evaluadores por dominio (M-20); `recorridos`; M-8 · M-15 · M-16 ·
    M-17 · M-18 · M-25; U4 mueve casos (el modo Texas pasa a una persona las 9 aprobaciones en parte); U2 bilingüe;
    capturas con techo de 2 MB por mirada.
  - **No cumplido: LCP ≤ 2,5 s en el playground.** Los recortes del plan se midieron y ninguno alcanza; el usuario
    decidió mantener 2,8 s y dejarlo como deuda (adenda del ADR-011).
- **Terciario — Sí.** El lote de 200 del B (200/200, sin errores del proveedor) queda como registro y publica su falla,
  B-180. La ficha de la app cuenta los dos demos y está la del agente B; el paquete para hoja-de-vida lleva los dos
  (195 archivos con su manifiesto; `paquete:verificar` y su e2e 3/3 en verde sobre `909227d`). El PR de contenido
  (roadmap de 3 ids) es del usuario.

## Qué se construyó

- **Fase 0 — setup y el A en el plan v1.5.** Constitución v1.37.0 y deltas del kit v1.33.0–v1.37.0 (`beforeSend` que
  solo envía metadatos, en `src/lib/sentry-evento.ts` detrás de la DSN; `verificar-dependencias` que falla cerrado;
  `lighthouse-margen` con parche local, desv. 3; `scripts/demo-rojo.sh`; capturas sobre la maqueta servida; ADR-015;
  matriz de envejecimiento). Diagramador 0.5.0 (lock con 4 huellas, `core/visor/condicion.ts` y `recorridos.ts`,
  `papel`, fuente `codigo`, Ajv antes de dibujar). Plan de beneficios v2 con topes por servicio y RB-08; **plan v1.5**
  con la aprobación en parte (R10, C10), M-16, M-8 y U2 bilingüe; el agente A con M-8, M-15, M-16 y M-18 (ADR-016);
  M-17 medido: los patrones aciertan 14/15 y 152/153 (adenda del ADR-001).
- **Fase 1 — el entrevistador.** Plantillas de dominio 1.1.0 selladas (`dom-financiero.json`, 14 preguntas con ejemplo
  del otro dominio); `core/plan/contradicciones.ts` (6 códigos, más 3 en la fase 3) y `core/plan/revision.ts`;
  `agents/src/app_agents/entrevistador/` (el modelo solo redacta la respuesta libre con `--json-schema`; hilo en
  SQLite con permisos 700/600); `pnpm entrevistar` y `pnpm plan:aprobar`; ADR-012; plan B v1 y v1.1 (desv. 24).
- **Fase 2 — el demo B.** Sintético en `core/sintetico/demo-b/` (Jaro-Winkler con los mismos bytes en TS y Python,
  reglas RI/RP, listas con versión y fecha, 17 subtipos con sus adversarios; E-11 lee los nombres del B). Agente en
  `agents/src/app_agents/demo_b/` (9 nodos, expediente K1…Kn con su cita, línea base de agente único) y registro de N
  demos (`demos.py`) sin mover un byte del A; ADR-013. Lote de 20, su línea base y la corregida `-base-v2`.
- **Fase 3 — la brecha del B y la vitrina con dos demos.** Verificador por demo (M-20); informe Markdown escrito entero
  en cada idioma (salieron 99 ternarios; los informes publicados del A, idénticos); rutas por demo (ADR-014); Agente y
  Caso en esqueleto común más perfil por demo; el **expediente**; fichas por demo; la entrada con dos filas; regla 7 de
  `verificar-export` (vocabulario por demo) y `enlaces-por-demo.test.ts`; Lighthouse, e2e (34/34), paridad del
  playground B en tres motores (12/12, 187 huellas por idioma) y «diagrama = grafo» del B.
- **Fase 4 — los cierres del ciclo.** El A sobre la corrida de 200, con página de caso solo para los que se nombran (48,
  decisión del usuario) y `ChipCaso` sin enlace para el resto; reanclar las pruebas destapó 18 defectos (D57–D74). Los
  cinco defectos del agente B (D51–D55) y `lotes --caso` para la parada 1. `docs/BLUEPRINT.html`, manual ES/EN con
  cuatro secciones nuevas, kit de prueba por demo, fichas y guía. El LCP medido con STOP; la 2-bis; `/audita-sprint`.
- **ADR:** 012, 013, 014, 015 y 016 nuevos; adendas al 001, al 011 y al 014; sección «Protecciones del sistema» en el 002.

## DoD — checklist

| Estándar              | Estado                      | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Testing               | ✓                           | vitest **4.098** + 1 saltada (134 archivos) con los umbrales de cobertura: total 97,1 % sentencias · 88,3 % ramas · 97,6 % líneas; `core/brecha` 98,4 % · 93,6 % ramas, `core/playground` 99,7 % · 96,8 %, `core/visor` 97,4 % · 91,8 % · pytest **226** + 3 saltadas (96,6 %) · Playwright **193** + 3 saltadas en local, sin reintentos (teléfono, escritorio, `paridad-firefox`, `paridad-webkit`) · e2e del paquete 3/3 · cada gate nuevo con su demo en rojo en la bitácora (tablas de la fase 0, D1–D56, D57–D60 y F2-D1…F2-D21)                                                                                                             |
| CI/CD                 | [POR COMPLETAR]             | `quality · e2e · lighthouse · python` con conclusión propia `success` en `8a9c00b`, `07bd876` y `f47a665`. Rojos leídos y pagados: `lighthouse` en `be317ef`/`f5280ff` (importación estática de Sentry, `9c1c5a6`), avisos nuevos del calendario en `525f5d1` (`31ee86c`), `python` en `d44a2ad`, `quality` en `d44a2ad`–`97f9b43` (`d30e5b0`) y **e2e en `785bd0c`, `5ffb8e4` y `9f3c5ac`, sin leer** (`6a8b962`). [POR COMPLETAR: `gh pr checks 14` sobre el commit final]                                                                                       |
| Observabilidad        | ✓ con deuda                 | sin runtime en la vitrina; `limpiarEvento` (solo el tipo de cada excepción), importado detrás de `if (dsn)`; `pnpm trazas:verificar` sobre todas las corridas, con RF-09.2 cruzado en los 200 casos reales del A y en los 200 del B (0 discrepancias en 400 visitas); **LangSmith sin aprovisionar**: las corridas no tienen espejo                                                                                                                                                                                                                                |
| Seguridad             | ✓ con un aviso aceptado     | gitleaks en cada commit (el único `--no-verify`, `03788b9`, se revisó a mano: «no leaks found»); `braces` ignorado por id (ADR-015); `source-map-js` y `compression` subidos; el servidor de los arneses ya no sirve la carpeta hermana (AU-S3-15); `.entrevistas/` 700/600 (17-bis); BLUEPRINT sin URL; matriz del Llavero en el ADR-002 (regla 24); barrido de cero enlaces después del último `git add` con 0 coincidencias (el comando, abajo en «Cómo probar»); `pnpm audit --audit-level high` sale con 0 (1 alto, el ignorado); `pip-audit --skip-editable` sin vulnerabilidades |
| Performance           | ✗ en un criterio, con deuda | LCP ≤ 2,5 s en todas las rutas salvo `/*/playground` (2,8 s, ADR-011 y su adenda); `/*/brecha` también es bimodal y queda a menos del 2 % de su presupuesto; `lighthouse-margen` avisa sin rojo [POR COMPLETAR: avisos del commit final]                                                                                                                                                                                                                                                                                                                           |
| UX/A11y (+6-B)        | ✓ (miradas pendientes)      | las vistas del B usan los componentes canon del 1.0.0; axe sin violaciones en las siete pantallas del B, en los dos idiomas y temas; 380 px sin desplazamiento (D49: la fila de pestañas del B); vocabulario y enlaces por demo; `reduced-motion` con visibilidad real; las miradas de FORMA siguen «no vistas» y van al ⭐⭐/⭐                                                                                                                                                                                                                                   |
| IA embebida (7 + 7-S) | ✓                           | ADR-012 y ADR-013 de código primero; humo real 3/3 antes de cada lote; lotes fuera de CI, de 20 en 20 y espaciados (A: 200 + 200 de base; B: 20 + 20 + 20 de base + 200); 459 llamadas en el A de 200 con 0 reintentos de esquema; regla 25: el humo real solo corre con `PLANLANG_HUMO_REAL=1`                                                                                                                                                                                                                                                                    |
| Manual de uso         | ✓                           | `docs/MANUAL-DE-USO.md` ES/EN: «Entrevistar un plan», «Correr el demo B», «Leer un expediente» y «Publicar el design system», y seis secciones al día; fila S3 en el historial; barrido de promesas aplazadas                                                                                                                                                                                                                                                                                                                                                      |
| Guía de prueba        | ✓                           | `docs/GUIA-DE-PRUEBA.html` (prefijo `guia-planlang:s3:`): 59 pruebas (13 nuevas, 21 mejoradas, 25 heredadas, ninguna eliminada); ⭐ 23 (~1 h 30 min); ⭐⭐ 4 paradas (~20 min) en el bloque ★, que declaran las 19 ⭐ que dejan fuera                                                                                                                                                                                                                                                                                                                              |
| Reusables             | ✓                           | diagramador 0.5.0 (`c8598a1a…`): lock multiarchivo con 3 enmiendas propuestas y el 0.6.0 declarado `planeadora_adelante` (desv. 23); instrumentos-de-plan 0.2.0 sin cambio                                                                                                                                                                                                                                                                                                                                                                                         |
| Design system         | ✓                           | `design-sync/` al día y regenerado byte a byte por su prueba; **sin publicar**; `design-system.md` 1.0.0 sin cambios; tres piezas propuestas para un 1.1 (desv. 27)                                                                                                                                                                                                                                                                                                                                                                                                |
| Cierres de ciclo      | ✓                           | `docs/BLUEPRINT.html` sin red ni URL, con SVG embebido y «qué ve quién sin sesión: nadie», comprobado con peticiones anónimas; 2-bis registrada (abajo)                                                                                                                                                                                                                                                                                                                                                                                                            |

## Métricas técnicas (acceptance criteria del SPRINT_003)

| Criterio                                                                                                                         | Resultado                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrevista por CLI con ejemplo por pregunta, origen por elemento y contradicciones; `estado_aprobacion` nunca sale de `borrador` | ✓ carnada «nunca aprueba» (D2); la entrevista se respondió por delegación (abajo)                                                                                                      |
| `plans/demo-b/v1.json` aprobado antes de la fase 2 (fecha, huella, M1)                                                           | ✓ 2026-10-04, «apruebo el plan B», `0cd6590c…`, `pnpm plan:validar --verificar`                                                                                                        |
| Lote de 20 del B: 0 errores de traza, criterios absolutos, permutación de nombres                                                | ✓ 20/20; 0 rechazos sin pausa y 0 aprobaciones automáticas con riesgo alto; permutación en TS (D18) y en Python (D29)                                                                  |
| Vitrina con dos demos; axe; paridad del playground B en 3 motores; «diagrama = grafo» A y B con demo en rojo                     | ✓ e2e del B 34/34; paridad 12/12; D48                                                                                                                                                  |
| Lock del diagramador 0.5.0; mapas válidos por Ajv; `recorridos`                                                                  | ✓ Ajv en el build; 6 recorridos desde las trazas                                                                                                                                       |
| `docs/BLUEPRINT.html` autocontenido, sin red ni URL                                                                              | ✓                                                                                                                                                                                      |
| Guía: ⭐⭐ final de 4 paradas; ⭐ acumulado ofrecido; las 46 del S2 heredadas                                                    | ✓ 46 + 13 = 59; ⭐ 23 (S1: 5 · S2: 10 · S3: 8)                                                                                                                                         |
| LCP ≤ 2,5 s, o ADR-011 enmendado con medición y decisión del usuario; `lighthouse-margen` sin rojo                               | ✗ en 2,5 s · ✓ por la vía alternativa: adenda del ADR-011 con mediciones y «Mantener 2,8 s y deuda»                                                                                    |
| Ficha del agente B válida (v1.3.1); `brochure-export.json` con los dos demos; paquete regenerado                                 | ✓ `tests/unit/vitrina/fichas.test.ts` › «cada ficha pasa su contrato, en los dos idiomas» · paquete de 195 archivos con su manifiesto, `paquete:verificar` y e2e 3/3 sobre `909227d` |
| 4 checks `success` propios; primeras corridas anotadas; 2-bis; ⭐⭐ pendiente del Acto 2                                         | [POR COMPLETAR: checks del commit final] · ✓ el resto                                                                                                                                  |

**Corridas reales del sprint** (fuera de CI, con trazas verificadas):

| Corrida                                            | Resultado                                                                                                         | Informe                                                                                                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A, 200 casos, plan v1.5                            | 200/200 decisiones = verdad (169 aprobar · 22 negar · 9 en parte); 70 pausas; US$4,92 nominales; 8,2 s de mediana | cumple con alertas: 10/10 criterios desde el verificador 1.3.0; S1 confirmado; S2 refutado (83,3 % frente a ≥ 95 %); S3 refutado (98 % frente a 90 %, pero 8,1 s frente a 5,0 s); 3 brechas (A-022, A-126, A-139) |
| B, 20 casos, plan v1.1 (la que publica la vitrina) | 20/20 decisiones y extracciones; 26 llamadas, US$0,293                                                            | cumple con alertas: 6/6; S1 confirmado; S2 refutado (la línea base gastó más: US$0,454)                                                                                                                           |
| B, 200 casos, plan v1.1 (registro)                 | 200/200, sin errores del proveedor; 4,0 s de mediana; US$2,89 nominales (con el humo previo)                      | cumple con alertas: 6/6 (C5 99,5 %); 99 pausas; S2 sin probar; 5 brechas, entre ellas **B-180**                                                                                                                   |

**Primera ejecución en este PR** (sin histórico, no se afirma regresión ni no-regresión): `lighthouse-margen` en la CI
(`be317ef`: 6 avisos de LCP con menos del 10 % de margen, ninguno rojo); las siete URL del B en Lighthouse, el e2e del
B y la paridad del playground B en Firefox y WebKit (`07bd876`, cuyo push `5dd76fb..07bd876` trajo también la regla 7
de `verificar-export`).

## Parada de DECISIÓN — el plan del demo B

- **Fecha y frase:** 2026-10-04, «apruebo el plan B», escrita después de recibir el resumen del borrador y la ruta de
  `plans/demo-b/revision.es.md`.
- **Lo que dijo el usuario de la entrevista** (textual): primero «No la verdad estimalo no importa cual sea que sea un
  buen proceso ya eso es todo, es un demo no hay que darle tanta importancia»; ante la pregunta de permiso, «corre la
  entrevista con tus respuestas».
- **Qué excepción es:** **no es la de las 48 h de la orden**, sino una **delegación explícita de las RESPUESTAS**; la
  aprobación siguió siendo del usuario. La orden pedía que la corriera el usuario y que el builder no respondiera por
  él: queda como excepción nombrada.
- **Cómo se corrió:** las respuestas están versionadas en `plans/demo-b/respuestas-por-delegacion.json`. Lo que trae
  el § 10.3 de la especificación va tal cual. Lo que no trae, el builder lo estimó y lo marcó «(estimado)» en el plan:
  puntaje para escalar 60, zona gris desde 0,70, pesos 40/30/30, conservación de cinco años y C6, el criterio que
  controla la inyección.
- **Tres corridas, 27 llamadas, US$1,28 nominales.** M1 rechazó las dos primeras, y cada rechazo destapó un hueco del
  entrevistador que se cerró por código (D14–D16): el modelo borraba con `null`, descartaba elementos y escribía prosa
  en las condiciones. La tercera pasó con 0 contradicciones y 0 pendientes.

## Registro de miradas

El plan aprobado tenía 3 miradas: una de DECISIÓN y dos de FORMA «no vistas». En la fase 4, antes de construirlos, el
usuario aprobó sumar a la mirada 3 los cambios de forma del A («Sumarlos a la mirada 3», 2026-10-04).

| #   | Clase                       | Archivo                                                                                                                                                                                                                                              | Estado                                                                                                                                                                                                                                                                                  |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | DECISIÓN                    | `plans/demo-b/revision.es.md`                                                                                                                                                                                                                        | **vista y aprobada:** «apruebo el plan B» (2026-10-04)                                                                                                                                                                                                                                  |
| 2   | FORMA, **no vista**         | `docs/fidelidad/s3-demo-b/index.html` (matriz de 9 filas: entrada con dos filas, barra del B, trazas del verificador de listas, «Recibe» y expediente de B-019, Playground, Umbrales del Plan, ficha del agente B, pie)                              | sin respuesta; viaja al ⭐⭐ (parada 2) con su matriz                                                                                                                                                                                                                                   |
| 3   | FORMA y TEXTO, **no vista** | `docs/fidelidad/s3-mirada-3/index.html` (matriz de **10 filas** desde la segunda vuelta: BLUEPRINT, expediente de B-010, informe del B, «Medí la brecha» del A con 10 de 10, modo Texas, «Lo que falló» del A, documento de A-006, la marca «Aviso inexacto» de A-017, nodo `decision` en los 200 casos, textos del entrevistador) | sin respuesta; viaja al ⭐ del ciclo con su matriz, y las paradas 2 a 4 del ⭐⭐ la recorren en parte. Segunda vuelta el 2026-10-05, después de los pagos, sin parada |

Ninguna de las miradas 2 y 3 se dio por aprobada. Los cambios de forma de la Fase 2 sobre artefactos de la mirada 3 son
segundas vueltas sin parada, y se ven al cierre: el expediente completo (AU-S3-14), la marca «Aviso inexacto» (F22) y
el chip «Sin aviso de IA» (AU-S3-07).

## Auditoría final (`/audita-sprint`)

Dos auditores independientes en solo lectura sobre `origin/main...a1b1bbe` y su export
(`sprints/SPRINT_003-auditoria.md`): el **auditor 1** (alcance, código y casillas 5–8), **3 Altos · 11 Medios · 15
Bajos** (AU-S3-01…29); el **auditor 2** (casilla 4, frases caducadas), **9 Altos · 7 Medios · 7 Bajos** (F1…F23). En
total, **0 Críticos · 12 Altos · 18 Medios · 22 Bajos = 52**, con solapes que se pagan una vez (F10 = AU-S3-09; F13 ⊃
AU-S3-22; F11/F12 ⊃ AU-S3-02/03). Recomendación de los dos: «requiere ajustes».

**Decisiones del usuario** (2026-10-05, textuales): Fase 1 y plan de pagos, «Sí, paga todo (Recomendado)»; C5 y su
`k_aplica_a`, «Respetar el plan (Recomendado)»; textos en archivos con huella (F8), «Corregir los dos (Recomendado)»;
matriz del Llavero, «Sí, regístrala».

**Pagados: todos.**

| Commit                | Qué paga                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `31ee86c`             | CI roja por el calendario: `source-map-js` y `compression`, dos avisos altos con parche                                                                                                                 |
| `d44a2ad` · `f370a26` | AU-S3-01 (`restaurados` en el contrato, con carnada escrita por Python), AU-S3-13 (la revisión trae la entrevista) y AU-S3-10 (la consola no pisa el registro del plan aprobado; guarda de procedencia) |
| `97f9b43`             | AU-S3-06 (motivo de la pausa desde la arista registrada), AU-S3-07 («Sin aviso de IA» en B-005, B-006 y B-014), AU-S3-11 (`parcial` declarado)                                                          |
| `d30e5b0`             | AU-S3-12 (despachos exhaustivos por demo; adenda al ADR-014); dos pruebas que rompió el builder; las ramas de `src/lib` vuelven a pasar el 80 %                                                         |
| `911a00e`             | AU-S3-14 (el expediente lee cada campo), AU-S3-19, AU-S3-27 (el payload, contra la traza) y AU-S3-15                                                                                                    |
| `408900b`             | AU-S3-28 (cada campo huérfano gana un lector o una razón; registro del generador con 24 campos)                                                                                                         |
| `785bd0c`             | las decisiones: verificador 1.3.0 (`k_aplica_a`; C5 cumple y el A pasa a 10/10) y plan v1.5.1 de solo redacción (F8); AU-S3-26, F7, F19 y AU-S3-29                                                      |
| `9f3c5ac`             | textos: F1–F6, F9–F21 y F23; AU-S3-02 a 05, 08, 09, 18 y 22                                                                                                                                             |
| `374728d`             | AU-S3-16, 17, 20, 21, 23 (desviación 29), 24, 25 y F22                                                                                                                                                  |
| `6a8b962`             | la medida de C5 que desbordaba 45 px a 380 px (los tres rojos de e2e sin leer)                                                                                                                          |

**Demos en rojo F2-D1…F2-D21** (`scripts/demo-rojo.sh`, todas restauradas y en verde). Las primeras mutaciones de F2-D8
(`estado` también exigía el criterio) y de F2-D14 (la prueba solo llamaba a la función) pasaron en verde: la tercera
pregunta de la regla 15 las cazó, y se repitieron con un fallo real.

**Lo que destapó y vale contar:** unas 18 frases publicadas decían «ninguna negación sin persona» cuando 9 aprobaciones
en parte salieron solas; el contrato de la transcripción se rompía justo en el camino que ya había ocurrido en la
entrevista real; `pnpm entrevistar` sobrescribía en silencio el registro del plan aprobado; el servidor de los arneses
servía con 200 una carpeta hermana; y la lectura de C5 sobre el lote de 200 contradecía el `k_aplica_a` del plan.

Segunda pasada de la casilla 4 (otro auditor): [PENDIENTE — la corre el builder].
Veredicto tras la Fase 2: [POR COMPLETAR: «listo para cierre» o lo que quede tras la segunda pasada].

## B-180: la falla del lote de 200 del B y un riesgo nuevo propuesto para el plan B

- **Qué pasó:** B-180 es un caso de riesgo alto que debía pasar por el oficial y salió **aprobado solo**. El extractor
  leyó `jurisdiccion_fondos` como SYN-J-01 cuando el documento decía SYN-J-07, la jurisdicción de alto riesgo. El
  puntaje por reglas, determinista, calculó 30 sobre ese dato en vez de 60: el caso quedó bajo U2 (60) y la arista de
  riesgo no se cumplió.
- **Por qué los criterios no lo ven:** C2 («ninguna aprobación automática con riesgo alto») cumple por su propia medida,
  que lee el puntaje del agente; C5 lo lista como su único caso fuera (99,5 %). Lo destapó el evaluador
  `pausas_cumplidas` contra la verdad conocida, y por eso figura como brecha no prevista.
- **Dónde está publicada** (regla dura 9): en el informe del lote
  (`runs/demo-b/suscripcion-planlang-b-001-200-v1.1/informe.{es,en}.md`), en el kit de prueba y aquí. La vitrina del B
  sigue sobre la corrida de 20 por decisión del usuario; este lote es registro.
- **Propuesta para la planeadora (el builder no enmienda el plan):** un riesgo nuevo para el plan B, _un error de
  extracción del modelo en un campo que alimenta el puntaje por reglas (aquí, la jurisdicción de los fondos), que la
  cadena determinista no puede ver_. El FMEA del plan B no tiene ese modo de falla. Su calificación S/O/D, su detector
  en trazas y su mitigación los decide el autor del plan.

## F22: el aviso de IA del demo A

- **El problema:** el `AVISO_IA` del documento adverso del A decía «Ninguna negación se emite sin la revisión de una
  persona». Era exacto hasta el v1.4 y dejó de serlo con el v1.5, donde la aprobación en parte sale sin persona cuando
  el modo Texas está apagado.
- **El arreglo, por versión del plan:** desde el plan **v1.5.1** dice «Ninguna negación completa…» / «No full
  denial…». `AVISO_IA_HASTA_V15` conserva el texto que escribieron las corridas hasta el v1.5, y así las corridas
  versionadas siguen regenerándose byte a byte (F2-D19…D21).
- **En la vitrina:** las respuestas de la corrida publicada del A con el aviso viejo (191; los documentos de las
  negaciones con persona) llevan al lado la marca **«Aviso inexacto»**: «promete de más: con el modo Texas apagado, 9
  aprobaciones en parte de esta corrida salieron sin una persona». Las 9 aprobaciones en parte traen su propio aviso,
  que es exacto, y no la llevan. Es texto en un artefacto de la mirada 3 y va «no visto» a su matriz.

## Gate ⭐ — diferimiento y contrapesos

**⭐⭐ pendiente del Acto 2: 4 paradas (~20 min), en el bloque ★ de la guía y en este orden:** (1) B-010 con la
suscripción (`pnpm lote:demo-b --caso B-010 …`, con la cuota antes y después); (2) la entrada y la Brecha del B en el
teléfono; (3) el modo Texas del A y un umbral del B en el Playground; (4) el expediente de B-010. Reemplazan a las del
S2, que siguen en el ⭐. Las 3 paradas del S1, diferidas dos veces, viven dentro de la parada 1; LangSmith queda
declarado fuera porque no está aprovisionado.

**⭐ acumulado del ciclo, ofrecido: 23 pruebas (S1: 5 · S2: 10 · S3: 8), ~1 h 30 min.** El encabezado de la guía dice
cuáles 19 deja fuera el ⭐⭐ y por qué.

| Contrapeso                     | Evidencia (archivo, cuenta medida, corrida)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pasada de capturas del builder | **Mirada 2** (2026-10-04, `scripts/capturas-demo-b.mjs`): 48 capturas enteras por huella SHA-256 fuera del repo; 9 recortes y 2 miniaturas de teléfono leídos como imagen; pasada de interacción; 1,97 MB (techo 2 MB). Encontró y se arreglaron la pestaña «Fichas» cortada en la barra del B (D49), el subtipo crudo del Playground del B y «1 repeticiones». **Mirada 3** (2026-10-05): 48 capturas por huella; 9 recortes leídos como imagen; 2.042 KB. Encontró «Cerrado (Acto 1)» en el BLUEPRINT, «parada 1 del ⭐⭐» para LangSmith y «causal de ley» en una aprobación en parte. **Mirada 3, segunda vuelta** (2026-10-05, después de la Fase 2): 48 capturas por huella; los 9 recortes con imagen leídos uno por uno después de la corrida, cada uno igual a su fila; 2.039 KB (recortes a calidad 52 y miniaturas a 45 en este conjunto) |
| e2e de `reduced-motion`        | 8 pruebas «movimiento reducido» (7 pantallas del A y la Brecha del B, `tests/e2e/demo-b.spec.ts:119`) × teléfono y escritorio = 16 ejecuciones con `reducedMotion: "reduce"`: visibilidad real de lo del experto, 0 animaciones y axe. [POR COMPLETAR: corrida en la CI del commit final]                                                                                                                                                                                                                                                                                                                                                                                           |

## Decisiones no anticipadas

- **ADR:** **012** y **013** (código primero del entrevistador y del demo B); **014** (rutas por demo, con adenda por
  AU-S3-12); **015** (`braces` ignorado por id); **016** (aprobación en parte y modo Texas); adendas al **001** (M-17
  medido) y al **011** (LCP); **002**, sección «Protecciones del sistema» con el Llavero.
- **Del usuario durante el sprint** (AskUserQuestion, textuales): «Tope por servicio» (la aprobación en parte nace de
  un tope de cobertura); «v1.1 con los tres» (plan B v1.1); «Correrla» (la línea base del B corregida); «Sí, correr la
  base» (línea base de 200 del A); «Arreglar y correr» (lote de 200 del B); «Sigue en la de 20» (vitrina del B); «Solo
  los que se nombran» (páginas de caso del A); «Sumarlos a la mirada 3»; «Mantener 2,8 s y deuda». Todas llevaban
  «(Recomendado)», salvo «Tope por servicio».
- **Verificador 1.3.0 y plan v1.5.1 del A**, por las decisiones de la auditoría, con la misma verdad (ADR-005). En F22,
  el aviso se elige por la versión del plan y la vitrina marca el inexacto, en lugar de declararlo deuda.

## Desviaciones del plan

Detalle en la bitácora (`sprints/SPRINT_003-implementation-log.md`, «Desviación del plan»):

1. La orden ubica `audita-sprint` y `plan-sprint` en `skills/`; viven en `commands/`.
2. Regresión del kit v1.36.0 en `plan-sprint.md` (paso 10, «`gh pr checks` tras CADA push», columnas de la matriz);
   se mezcló a mano.
3. `lighthouse-margen.mjs` del kit no entiende los presupuestos por ruta y su chequeo no puede fallar: parche local.
4. `verificar-dependencias`: el `rev-parse` del kit, más el rojo en CI cuando la base no trae lockfile.
5. Constitución v1.37.0: la regla 26 sin número; `lighthouse-margen`, el hook y las degradaciones solo en la cabecera.
6. El diagramador 0.5.0 trae erratas y dos choques con la geometría aprobada (V5, V7).
7. La plantilla `dom-financiero.json` no alcanzaba para entrevistar; se completó.
8. RF-02.5 pide dos contradicciones que M1 no tiene: módulo nuevo.
9. La zona gris del investigador sale de la entrevista; el builder no la fija.
10. `capturar-maqueta.mjs` deja `file://` y captura la maqueta servida.
11. El lock propone 3 enmiendas (la orden pedía `[]`).
12. La plantilla propone umbrales y contrato, además de preguntas.
13. El origen por elemento es un campo opcional del plan; el del problema y el flujo vive en la transcripción.
14. Dos códigos de contradicción más: `UMBRAL_SIN_ARISTA` y `PENDIENTE`.
15. `plan:aprobar --con-contradicciones` exige la aceptación explícita del usuario.
16. Los ejemplos de cada plantilla vienen del otro dominio.
17. El plan B v1 no nombra las listas; las citan el lote y la corrida.
18. El redactor del B no usa modelo: el plan lo declara `regla`.
19. El investigador corre desde U4 hacia arriba, no solo en la franja U4–U1.
20. El B no tiene respaldo por proveedor (AU-9): queda propuesto en el ADR-013.
21. El `grafo-codigo.json` del B se generó en la fase 3.
22. Los niveles medios del puntaje (20 y 15) los estimó el builder y van marcados «estimado».
23. La planeadora publicó el diagramador 0.6.0 a mitad del sprint; planlang sigue en 0.5.0 y lo declara.
24. El plan B v1.1 se hizo dentro de la fase 3, por decisión del usuario.
25. El playground del B mueve 4 umbrales, no 3.
26. El plan B no declara costo humano: la isla cuenta casos, no minutos.
27. `design-sync/` sin «las vistas del B»: el bundle publica fundamentos y componentes, no pantallas.
28. El ⭐⭐ vive en un bloque nuevo (★) al principio de la guía.
29. El delta «README de comandos» (kit v1.35.0) no se aplicó y no se dijo a tiempo (AU-S3-23).

## Bugs + resoluciones

Detalle en la tabla «Bugs y fricciones» y en D57–D74 de la bitácora. Los de producto:

- **Vitrina con dos demos:** frases del A en las páginas del B (oráculo, pie, «minutos de auditor», el spike); enlaces
  del B a casos inexistentes o al A, por el demo A por omisión de `ruta()` (D44); «diagrama = grafo» comparaba el grafo
  del B con el dibujo del A (D48); el build se detenía en `/en/demo-b/agente`; la barra del B cortaba «Fichas» (D49);
  el subtipo crudo en el Playground del B; «Cómo repetirla» con comandos que no corren (venía del S2).
- **El A sobre la corrida de 200 (D57–D74):** plantillas sin resolver en la Brecha, subtipos sin nombre, un desglose
  que sumaba 51 de 60, C5 incompleto leído como «no se cumplió», concordancias y decimales, el ejemplo del Playground
  que desaparecía, el modo Texas como «revisión de más»; cada uno con su prueba.
- **Agente B y entrevistador:** documento de rechazo sin aviso de IA, «True» y «0.6988» en el texto, concordancia y
  huecos en los ids (D51–D55); la guardia de salida marcaba severidad 2 en todo; el expediente escribía fechas
  completas (E-11); la línea base del B extrajo 1 de 20 por un prompt del builder (D33, vuelta a correr: 20/20); M1
  aceptaba texto con la marca de pendiente (D13); `pnpm entrevistar` salía con 1 sin decir nada; `KeyError: anyOf`.
- **CI:** Lighthouse rojo en `/es/agente` por la importación estática de Sentry (`9c1c5a6`); `python` rojo en `d44a2ad`
  (ruff con `-q` se tragó la salida); `quality` rojo por dos pruebas que rompió el builder; **tres rojos de e2e sin
  leer** (`785bd0c`, `5ffb8e4`, `9f3c5ac`) por los 45 px de la medida de C5.
- **Gates que no podían fallar, vistos al exigirles el rojo:** las enmiendas de planes comparaban huellas y no
  contenido (`huellas-de-planes.test.ts`); D6, D12 y D19; el «aviso sin ADR» de la fase 0; F2-D8 y F2-D14. Y el commit
  `03788b9` se hizo con `--no-verify`: gitleaks a mano dio «no leaks found» y no hubo otro.

## Qué salió bien / qué generó fricción

- **Bien:** la verdad conocida destapó lo que los criterios no ven (B-180 cumple C2 por su propia medida y
  `pausas_cumplidas` lo nombró); la generalización a dos demos no movió el A (entre 51 y 53 de 57 páginas idénticas al
  build anterior; el resto, por razones declaradas); los rechazos de M1 en la entrevista real destaparon huecos que el
  humo no tocaba; los lotes corrieron sin errores ni límites de uso; `demo-rojo.sh` atrapó demos que no podían fallar.
- **Fricción:** tres e2e en rojo sin leer porque «pending» se leyó como verde, y pushes tras suites sueltas en lugar de
  `pnpm test`; el LCP sigue bimodal, también en `/*/brecha`; la base de 200 del A murió con la sesión y se retomó; la
  corrida de 20 que publica la vitrina del B es anterior a los arreglos de su agente.

## Sugerencias de mejora al método

1. **Antes de cada push, el comando del CI entero** (`pnpm test`, no suites sueltas) y ruff sin `-q`: la salida es el
   gate (`d44a2ad`, `d30e5b0`).
2. **«Un pendiente no es verde»:** antes de empujar se lee la conclusión de la corrida anterior, y si se tocó la
   vitrina, el e2e completo corre en local. Tres rojos de e2e (`785bd0c`, `5ffb8e4`, `9f3c5ac`) pasaron sin mirar porque
   `gh pr checks` decía «pending».
3. **Kit, regresiones y enmiendas:** restaurar en `plan-sprint.md` el paso 10, «`gh pr checks` tras CADA push» y la
   matriz de una fila (desv. 2); `lighthouse-margen.mjs` con la semántica de LHCI, todas las entradas que casan y LCP
   por URL medida (desv. 3, parche en `scripts/lighthouse/patron.mjs`); `verificar-dependencias` en rojo en CI con una
   base sin lockfile (desv. 4); numerar la regla 26 (desv. 5); el README de comandos llega como `.claude/COMANDOS.md` en
   la próxima sincronización (desv. 29).
4. **Diagramador 0.5.0** (en `packages/diagramador/CONTRATO.lock`, `enmiendas_propuestas`): `V5-papel` (inicio y fin
   por `papel` cuando no hay nodos en las bandas), `V7-sin-bloques` y `erratas-0.5.0` (los títulos dicen 0.4.0, falta
   V17 en el § 7, V3 solo nombra `https`, `lineas` es opcional). El 0.6.0 llegó a mitad del sprint (desv. 23): la
   migración la ordena la planeadora.
5. **Para la planeadora:** en el plan B, el riesgo nuevo de B-180 (arriba), el respaldo por proveedor AU-9 (desv. 20)
   y el costo humano por caso si se quiere en el playground (desv. 26); la plantilla `dom-financiero.json` completada
   (desv. 7 y 12); las rutas de los comandos en la orden (desv. 1).
6. **Método — el humo del entrevistador debe tocar cada sección del plan**, decisiones y supuestos incluidos: el de 3
   llamadas pasó y la entrevista real falló dos veces en M1.
7. **Método — un conjunto con texto realmente libre:** en el sintético los patrones alcanzan al modelo campo a campo
   (M-17: 152/153 frente a 150/153) porque las notas salen de plantillas. El modelo se sostiene por la confianza
   calibrada y la resistencia a la inyección, no por una exactitud mayor medida.
8. **Design system 1.1** (mirada de FORMA del usuario, desv. 27): el conmutador de demo, el caso sin página con borde
   punteado y el expediente; siguen pendientes los tamaños 14 · 22 · 11 px y la interlínea 1,6 del S2.

## Correcciones propuestas al `CLAUDE.md`

La constitución la regenera la planeadora; el builder solo propone. Auditoría 2-bis (subagente en solo lectura sobre
`f47a665`): unas 75 afirmaciones revisadas, **17 derivas** (5 menores), **14 incompletas** y unas 45 verificadas.

- **Derivas:** D1 «la app la sincroniza en la fase 0» (ya se hizo, `be317ef`) · D2 demo B y entrevistador «en
  construcción» (se publican; en el roadmap quedan 3) · D3 `agentes-ia` v1.0.0 (es la 1.2.0) · D4 «SVG cuando exista el
  piloto de big-d, si no mermaid» (es `core/visor/svg.ts`) · D5 `packages/diagramador` solo guarda el contrato (la
  implementación vive en `core/visor`) · D6 shadcn/ui no existe · D7 «Pino + Sentry + PostHog» (sin PostHog; Pino sin
  uso) · D8 «solo `_io.ts` y `_corridas.ts` leen el disco» (también muchos CLI y `src/lib/datos` al compilar) · D9 la
  curva riesgo-cobertura vive en `core/brecha/calibracion.ts` · D10 `core/formatos` no tiene informe ni mapa · D11
  `src/types/` no existe (sí `textos/` y `styles/`) · D12 `docs/BROCHURE.html` no existe (excepción del G-Plan) · D13
  idioma: código, nombres y comentarios en español, ADR en español con Summary EN · D14 la línea literal de la regla 6
  combina `--max-turns 1` con `--json-schema` · D15 los lotes son `<semilla>-<n>.json` · D16 `engine/` no existe
  (`vitest.config.ts:87` conserva `src/engine/**`) · D17 v1.30.1 frente a v1.30.0 del commit de estampado (dudosa).
- **Incompletas:** I1 la regla 6 omite que el entrevistador y el demo B usan modelo · I2 ADR de código primero 001, 012
  y 013 · I3 la IA del Stack sin el entrevistador · I4 en la regla 14 viaja también la ficha del agente B · I5 la
  ruleset exige también `python` · I6 el árbol de `agents/` · I7 el 90 % de cobertura rige también en `plan/` y
  `visor/` · I8 las pantallas de `src/app` · I9 `data/`, `plans/demo-b` y `tests/` · I10 `scripts/`, `content/agentes`,
  `githooks` y `docs/*` · I11 ADR 001…016 · I12 pines de `pydantic` y `rfc8785`, y `constraints.txt` · I13 Sentry
  dinámico y `reportError` sin llamadores · I14 Pydantic al emitir y Zod al leer.
- **De la sincronización (desv. 5):** numerar la regla 26 (worktrees) y llevar `lighthouse-margen`, el hook que falla
  cerrado y las degradaciones declaradas al cuerpo, no solo a la cabecera.
- **Fuera del `CLAUDE.md`, ya corregidos en este PR** (AU-S3-17): `core/brecha/lector.ts` («IndexedDB») y
  `packages/diagramador/README.md` (0.3.0).

## Deuda técnica aceptada

| Qué                                                                                                                                                                                                              | Por qué                                                                                                                                                                                                                   | Sprint de pago                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ⭐⭐ de 4 paradas y ⭐ acumulado de 23 (S1: 5 · S2: 10 · S3: 8)                                                                                                                                                  | cierre en dos actos; lo corre el usuario                                                                                                                                                                                  | Acto 2 del cierre del ciclo                                                              |
| LCP del playground en 2,8 s (ADR-011 y su adenda)                                                                                                                                                                | la simulación de Lighthouse es bimodal en localhost; diferir el chunk de la isla no movió el LCP (1.960 · 2.610 · 2.621 ms) y el playground del B, más liviano, da lo mismo (2.609 · 2.610 · 2.649); decisión del usuario | próximo ciclo, frente de performance (menos JavaScript compartido o hidratación parcial) |
| `/*/brecha` bimodal, a menos del 2 % de su presupuesto                                                                                                                                                           | la misma carrera de React; un rojo ahí no sería una regresión                                                                                                                                                             | con el LCP                                                                               |
| La corrida de 20 del B que publica la vitrina es anterior a los arreglos de su agente: B-005, B-006 y B-014 sin aviso de IA (con el chip «Sin aviso de IA»), K2 con «0.814» y la numeración que salta de K5 a K7 | `runs/` es solo de agregar y la vitrina del B se queda en la de 20 (decisión del usuario); la guía y la mirada 3 lo declaran                                                                                              | cuando la vitrina del B publique una corrida posterior (la de 200 ya trae los arreglos)  |
| El `_motivo` de Python del A escribe «(True)»                                                                                                                                                                    | la base de 200 corrió con ese código; la vitrina arma el motivo desde la arista registrada (AU-S3-06)                                                                                                                     | con el próximo lote del A                                                                |
| Las corridas del A hasta el v1.5 llevan el aviso de IA viejo (F22), marcado «Aviso inexacto»                                                                                                                     | `runs/` es solo de agregar                                                                                                                                                                                                | con la próxima corrida del A bajo el v1.5.1                                              |
| LangSmith sin aprovisionar                                                                                                                                                                                       | la clave no está en el entorno; el espejo queda declarado fuera de la parada 1                                                                                                                                            | cuando el usuario lo configure                                                           |
| README de comandos del kit (`.claude/COMANDOS.md`)                                                                                                                                                               | este S3 se sincronizó con el v1.37.0 (desv. 29)                                                                                                                                                                           | próxima puesta al día del kit (v1.38.0 o posterior)                                      |
| Diagramador 0.6.0 declarado `planeadora_adelante`                                                                                                                                                                | la orden fijó el 0.5.0                                                                                                                                                                                                    | cuando la planeadora ordene la migración                                                 |
| `design-system.md` 1.1 con las tres piezas del S3                                                                                                                                                                | es una mirada de FORMA del usuario                                                                                                                                                                                        | el próximo ciclo con UI                                                                  |
| Riesgo de B-180, respaldo AU-9 y costo humano en el plan B                                                                                                                                                       | son enmiendas del autor del plan, no del builder                                                                                                                                                                          | a decisión de la planeadora y del usuario                                                |
| Aviso `braces` (ADR-015)                                                                                                                                                                                         | no hay versión con parche                                                                                                                                                                                                 | revisar antes del 2026-11-02 (la prueba falla al vencer)                                 |
| Un conjunto sintético con texto libre real (M-17)                                                                                                                                                                | con plantillas, los patrones igualan al modelo                                                                                                                                                                            | deuda del método                                                                         |

## Archivos clave

1. `agents/src/app_agents/entrevistador/` — el entrevistador M2 (ADR-012).
2. `core/plan/contradicciones.ts` y `core/plan/revision.ts` — las contradicciones y la revisión que se lee para aprobar.
3. `plans/demo-b/` — `v1.json` aprobado, `v1.1.json`, la transcripción y las respuestas por delegación.
4. `core/sintetico/demo-b/` — el conjunto sintético del B con su verdad conocida.
5. `agents/src/app_agents/demo_b/` — el agente B y su expediente (ADR-013).
6. `core/brecha/evaluadores.ts` y `core/brecha/textos-informe.ts` — el verificador por demo y el informe sin
   fragmentos.
7. `src/lib/vista/` (`agente-b.ts`, `caso-b.ts`) y `src/app/[idioma]/demo-b/` — la vitrina del B (ADR-014).
8. `runs/demo-b/suscripcion-planlang-b-001-200-v1.1/informe.es.md` — el lote de 200 del B y B-180.
9. `docs/BLUEPRINT.html` — la infraestructura as-built del ciclo.
10. `sprints/SPRINT_003-auditoria.md` — la auditoría final.

## Cómo probar

`docs/GUIA-DE-PRUEBA.html` (doble clic): ⭐⭐ 4 paradas (~20 min, bloque ★) · ⭐ 23 (~1 h 30 min) · el resto lo cubre la
CI. La vitrina: `pnpm build && pnpm start` y abrir `/` → la entrada con dos filas → las siete pestañas del A →
`/es/demo-b/brecha` → `/es/demo-b/caso/B-010` (el expediente) → `/en`. En terminal: `pnpm test`, `pnpm test:e2e`,
`pnpm trazas:verificar`, `pnpm diagrama:verificar`, `pnpm export:verificar`,
`pnpm paquete:vitrina && pnpm test:e2e:paquete` y `cd agents && .venv/bin/pytest`. La entrevista sin modelo:
`pnpm entrevistar --demo b --sin-modelo --salida <carpeta temporal>` (sin `--salida` se niega: el plan B ya está
aprobado).

El barrido de cero enlaces, copiado tal cual: `git grep -nE "vercel[.]app|workers[.]dev|pages[.]dev" -- ':!pnpm-lock.yaml'`
(después del último `git add`; debe dar 0 líneas).

Este summary cuenta como sprint cerrado en las fichas: con él, `pnpm fichas` dio `sprints_cerrados` 3 y las fichas y el
export se regeneraron en el mismo commit.
