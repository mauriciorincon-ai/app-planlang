---
sprint: 004
app: planlang
hito: H-2
opened: 2026-10-10
closed: 2026-10-11
branch: sprint-004/comparar-dos-corridas
pr:
---
# Sprint 004 · cierre — Comparar dos corridas

- **Objetivo:** la vitrina compara, criterio por criterio y riesgo por riesgo, las dos corridas de 200 casos del A, con los casos que difieren enlazados a su página.
- **Resultado:** cumplido. `/es/comparar` y `/en/comparar` existen; el e2e (209 pasadas) y el paquete están verdes; LCP local mediano 2,16 s.
- **Estado:** construido y auditado; PR listo para el squash del usuario.
- **Tiempo estimado / real:** 5 h / la salida de `horas-sprint` abajo (solo desde el primer commit; no ve la preparación previa).

```
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
|---:|---:|---:|---|
| 5 | 1 | 1,1 h | 2026-10-11 01:02 → 2026-10-11 01:38 (0,6 h) |

| Fase | Commits | Horas activas |
|---|---:|---:|
| F1 | 1 | 0,5 h |
| F2 | 1 | 0,5 h |
| F3 | 3 | 0,1 h |
```

- **Entregables:** `CLAUDE.md` (núcleo 99 líneas) y `docs/REGLAS-ANEXO.md` (anexo + P1–P16) · `horas-sprint` y `cero-enlaces` en `quality` · `core/comparar/` · `comparacion.json` en el manifiesto · `/[idioma]/comparar` con enlaces desde la entrada y la Brecha del A · 18 casos con página (tope 40) · manual, guía (c5 nueva, s6 mejorada) y fichas.
- **No completado:** capturas y e2e en inglés (hito); la pasada visual de FORMA queda «no vista» en `docs/fidelidad/s4-comparar/`.
- **Desviaciones:** (1) dominios de `cero-enlaces.json` en texto plano; (2) Lighthouse: el núcleo dice una corrida, `ci.yml` tiene tres y la mediana; (3) el anexo dice que la regla 18 cambió a «UN SOLO PR VIVO POR APP» (2026-10-11) y el núcleo del 10-10 aún dice «máximo DOS»: se copió el núcleo, el conflicto va a la planeadora; (4) `/deploy-check --python` no existe en el comando v2.
- **Auditoría (una pasada, auditor independiente, Sonnet 5.5 · high):** alcance completo con dos parciales; calidad: 2 altos (A-1 frase de líder fija y falsa; A-2 nota de alcance sin mostrar) **pagados** en `a9d7c1b`; medios M-1…M-4 pagados salvo M-1 (documentado) y M-3 (cubierto); bajos: B-5 (el conmutador de demo, latente, el A no lo recibe) y el caso «sin página» de la prueba de vista (B-3, parcial) → **deuda al lote del hito**; B-6 (isla del playground) verificado: solo cambian huellas, cifras intactas. Seguridad y frases caducadas: limpias. **Veredicto tras pagos: listo para cierre.**
- **Modelo por fase:** F1 y F2 con Haiku 5.5 (plan: Sonnet en F2 — desvío); auditoría Sonnet 5.5 · high.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint planlang`.
