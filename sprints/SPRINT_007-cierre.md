---
sprint: 007
app: planlang
hito: H-2
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-007/un-solo-gate
pr:
---

# Sprint 007 · cierre — Un solo gate (cierre de H-2)

- **Objetivo / resultado:** dejar H-1 y H-2 listos para UN gate humano. Cumplido: el lote del hito en 0, la guía abre con G1 a G8 (8 preguntas de sí o no, ~30 min, desde el teléfono, ninguna en la terminal), inglés al día y los cierres del hito hechos. **El gate no ocurrió; lo corre el usuario cuando quiera, en el chat de la planeadora.**
- **Estado:** construido y auditado; PR listo para el squash. **Tiempo estimado / real:** 2,5 h / salida de `horas-sprint` (antes de este cierre):

```
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
| 18 | 1 | 1,2 h | 2026-10-11 20:49 → 2026-10-11 21:33 (0,7 h) |
| Fase | Commits | Horas activas |
| F1 | 9 | 0,7 h |
| F2 | 5 | 0,2 h |
| F3 | 4 | 0,4 h |
```

- **Entregables:** F1 conmutador de demo solo donde existe la página · caso «sin página» probado · `--salida` acotada (hijo del plan, `.entrevistas/` o fuera del repo; sigue enlaces) · `vN.json` en borrador detiene el build · cambiadas siempre por comparación · contrato del grafo en detalle (nodos, aristas en orden con el operador real, ramas, pausa) · M1 `UMBRAL_DICHO_PENDIENTE` con demo en rojo · `braces` renovado al 2026-12-01 · `CLAUDE.md` copiado del núcleo. F2 bloque G de la guía (ES/EN) · e2e y capturas en inglés (4 conjuntos, leídos como imagen) · B-010 corrido por el builder. F3 BLUEPRINT, manual ES/EN, `design-sync/` (sin publicar), paquete 218 archivos verde.
- **B-010 (parada 1 del ⭐⭐ del S3, con la suscripción):** corrida `gate-s7`, 1 caso, 0 errores, 7,4 s; rama «aprobar», investigador con homónimo (1975 frente a 1959), similitud 0,814 con LV-01-011, conclusiones K1 a K8 sin saltos, US$ 0,0254 nominal.
- **Desviaciones:** (1) `CLAUDE.md` trae 4 desajustes con el código que la planeadora corrige en el núcleo: estructura sin `src/app/[idioma]/{comparar,planes}` ni `core/comparar` · regla 18 con `braces` al 2026-11-02 (hoy 2026-12-01) · «hito vigente» sin el gate único · «⭐⭐ de la guía» (hoy bloque G). (2) `un-pr-vivo` es un flujo aparte y NO un check requerido (el ruleset exige quality · e2e · lighthouse · python). (3) Las ⭐ mínimas son 25, no 27 como decía la guía: se corrigió y una prueba compara lo declarado con lo medido. (4) `ciclo: "H1"` en las fichas y en `brochure-export.json` es una etiqueta del esquema del kit: no se cambió, la decide la planeadora. (5) S6 y S7 no suman funcionalidades al brochure: versionar un plan extiende «Planear un proyecto real» y el gate es proceso, no producto; solo `sprints_cerrados` sube a 7.
- **Decisiones del usuario:** gate único de H-1 y H-2 en una sentada, en el chat de la planeadora, una pregunta por mensaje; plan B (B-180, AU-9, costo humano) fuera de este sprint.
- **Auditoría (una pasada, auditor independiente, Sonnet 5.5 · high):** alcance completo; 0 Críticos, 0 Altos, 6 Medios, 10 Bajos, todos pagados porque este es el lote del hito. M-1 y B-10 `0dc3608`; M-2 a M-4, M-6 y B-1 a B-8 `c4a73a8`; M-5 y B-9 en este cierre. Con la máquina cargada, las pruebas de paridad dieron tiempos falsos; se repitieron con carga < 10.
- **Fase > 50 %:** ninguna (F1 0,7 h de 1 h; F2 0,2 h; F3 0,4 h de 0,5 h).
- **Modelo por fase y desvío:** F1 y F2 Sonnet 5.5 · medium (plan); F3 Sonnet 5.5 en lugar de Haiku 5.5 · low: los pagos de la auditoría pedían código con pruebas, no solo documentación. Haiku no se probó.
- **Cierre del hito (gate pendiente: H-1 y H-2, una sentada).** H-1 S1 a S3: 12,5 + 20,8 + 15,8 = 49,1 h reales (git-hours; el S1 incluye la etapa de diseño; plan v1 sin estimado). H-2 S4 a S7: 5 + 4 + 2 + 2,5 = 13,5 h estimadas, 1,1 + 1,9 + 1,5 + 1,2 = 5,7 h reales (S7 antes de este cierre). **Uso real: 1** (plan `hackguard-agentes` v2, respuestas del usuario, 2026-10-11).
- **Deuda que pasa a H-3:** frente de performance (LCP del playground 2,8 s, `/*/brecha` bimodal, Lighthouse 1 contra 3 corridas; los PR de Dependabot #16 y #18 se cerraron por eso) · `braces` (ADR-015, revisar antes del 2026-12-01) · `build-como-proveedor` y `verificar-salida-publicada` del kit, sin copiar · diagramador 0.6.0 · LangSmith · plan B · 96 citas «regla dura N» en 79 archivos (ahora son PN) · D13, D17 e I13 del 2-bis del S4.
- **Aprendizajes:** una prueba pasada por `grep` enmascaró el código de salida y dejó un test en rojo en un commit; el código real se lee siempre. Un conteo hecho a mano (27 ⭐) era 25; ahora se mide.
- **Recomendación:** correr el gate en una sola sentada antes de abrir H-3, y que la planeadora fije el `ciclo` y los 4 desajustes de `CLAUDE.md`.
- **Esfuerzo-beneficio:** alto: dos hitos quedan a una sentada de cerrarse y la deuda de hito, en cero.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint planlang`.
