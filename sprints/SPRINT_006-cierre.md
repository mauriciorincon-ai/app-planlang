---
sprint: 006
app: planlang
hito: H-2
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-006/primer-uso-real
pr:
---

# Sprint 006 · cierre — Primer uso real

- **Objetivo:** aprobar la v2 de `hackguard-agentes` con las respuestas que el usuario revisó, y decir de quién son en la vitrina.
- **Resultado:** cumplido. Plan v2.0.0 aprobado por Mauricio Rincón el 2026-10-11, huella `3021ab88…`. La página muestra el origen, la fecha, la prioridad por riesgo y la v1 como historia.
- **Estado:** construido y auditado; PR listo para el squash del usuario.
- **Tiempo estimado / real:** 2 h / la salida de `horas-sprint` abajo (no mide las esperas de la aprobación ni la carga de la máquina).

```
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
|---:|---:|---:|---|
| 16 | 1 | 1,5 h | 2026-10-11 18:16 → 2026-10-11 19:19 (1,0 h) |
| Fase | Commits | Horas activas |
| F1 | 5 | 0,7 h |
| F2 | 3 | 0,3 h |
| F3 | 8 | 0,6 h |
```

- **Entregables:** `plan:aprobar --version N` con cadena de versiones · `plans/hackguard-agentes/v2.json` (2.0.0) · cargador que cruza cada respuesta con la transcripción · página con origen, fecha, versiones anteriores y prioridad por riesgo · registro FORMA «no vista» en `docs/fidelidad/s6-planes/` (leído como imagen) · manual ES/EN y guía c6.
- **No completado:** contrato del grafo en detalle (sigue en tres conteos) · inglés en e2e y capturas (cierre del hito) · LCP y Dependabot (frente de performance).
- **Desviaciones:** (1) la v2 se aprobó dos veces. La primera tenía dos justificaciones que decían «pendiente» sobre U2 y U3, con valor ya fijado; el usuario aceptó las frases corregidas y el `v2.json` anterior (`793a2f82…`) queda en el historial. (2) La mitigación de R5 la redactó el constructor desde la frase del usuario en P03 y P08: es de proceso, no una reducción medida. (3) La ocurrencia 4 y la detección 7 de R5 son del entrevistador, como dice P08.
- **Decisiones del usuario:** las 14 respuestas revisadas («todo como sugieres»); «apruebo el plan v2»; «Acepto» y «Apruebo» para la corrección.
- **Deuda (al lote del hito):** `src/lib/datos/planes.ts:171` el registro de quién respondió usa `_origen.cambiadas` si no hay delegación; el archivo de la planeadora lista P03 y P08, y la comparación da P03, P08 y P09 (la vitrina ya usa la comparación; el archivo lo corrige la planeadora) · `src/lib/datos/planes.ts:37-38` y `:48-50` `archivo` y `huella` de `PlanSinCorrida` solo los leen las pruebas · `src/lib/vista/plan-sin-corrida.ts:69` contrato del grafo en tres conteos · PR #18 de Dependabot cerrado: LCP en rojo, deuda de performance.
- **Aprendizajes:** el entrevistador escribió «pendiente» en texto libre y M1 no lo detecta: lo vio la auditoría. Con la máquina a carga 30–49, las pruebas de paridad y dos especificaciones e2e agotaron su tiempo; una corrida con carga por debajo de 10 pasó limpia.
- **Recomendación:** antes de aprobar un plan, leer en el chat las justificaciones que redacta el entrevistador, no solo las respuestas del usuario.
- **Esfuerzo-beneficio:** alto: H-2 tiene su primer uso real con una línea del usuario y dos horas de constructor.
- **Auditoría (una pasada, auditor independiente, Sonnet 5.5 · high):** alcance completo; 1 Alto, 4 Medios, 8 Bajos. A1 pagado · `1580401`. Pagados: M1 `8a99380` · M2 en código `8a99380` · M3 nota en manual `4b96fd4` · M4 `4b96fd4` · B1 `4b96fd4` · B2 `35e34f1` · B3 `4b96fd4` · B4 `8a99380` · B5 `cceaf1c` · B6 `cceaf1c` · B7 `8a99380`. Deuda declarada: B8 (este cierre) y campos sin consumidor (arriba). Seguridad y privacidad: `.entrevistas/` 700/600; cero enlaces verde. Veredicto del auditor: requiere ajustes; cerrados.
- **Fase > 50 %:** ninguna.
- **Modelo por fase y desvío:** F1 Sonnet 5.5 · medium (plan). F2 Sonnet 5.5 · medium (plan: Haiku 5.5; no se cambió de modelo). F3 Haiku 5.5 (plan: low; las correcciones de la auditoría fueron más que documentación). Auditoría Sonnet 5.5 · high.
- **Uso real: 1 — plan hackguard-agentes v2, respuestas del usuario.**
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint planlang`.
