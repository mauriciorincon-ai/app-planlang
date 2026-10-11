---
sprint: 005
app: planlang
hito: H-2
opened: 2026-10-11
closed: 2026-10-11
branch: sprint-005/plan-real-dominio-nuevo
pr:
---

# Sprint 005 · cierre — Un plan real en un dominio nuevo

- **Objetivo:** el entrevistador planifica los dos agentes de HackGuard sobre una plantilla `dom-seguridad-ia` que es solo datos; M1 valida; el plan aprobado se publica en la vitrina como «plan sin corrida».
- **Resultado:** cumplido con una salvedad: las 14 respuestas las delegó el usuario al constructor («si tiene que crear los datos que lo haga»); el plan vale, **el sprint no cuenta como uso real** (H-2 sigue sin su primer uso declarado).
- **Estado:** construido y auditado; PR listo para el squash del usuario.
- **Tiempo estimado / real:** 4 h / la salida de `horas-sprint` abajo (no ve la preparación ni la espera de la entrevista).

```
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
|---:|---:|---:|---|
| 11 | 2 | 1,9 h | 2026-10-11 11:16 → 2026-10-11 17:25 (6,2 h) |
| Fase | Commits | Horas activas |
|---|---:|---:|
| F1 | 3 | 0,7 h |
| F2 | 5 | 1,0 h |
| F3 | 3 | 0,2 h |
```

- **Entregables:** kit v2.1.0 (`CLAUDE.md` regla 18, job `un-pr-vivo`, Dependabot de acciones mensual) · `data/dominios/dom-seguridad-ia.json` 1.1.0 (5 fuentes verificadas por `curl` el 2026-10-11; ISO responde 403 y la plantilla lo dice) · `pnpm entrevistar` y `plan:aprobar --dominio <id> --plan <id>` (TS y Python; ids de demo rechazados) · gate de contrato `tests/contrato/entrevista-dominio-nuevo.test.ts` · `plans/hackguard-agentes/v1.json` (huella `bf05e61d…`, aprobado por Mauricio Rincón el 2026-10-11, M1 acepta, 0 contradicciones) · `/[idioma]/planes/<id>` + sección «Planes sin corrida» en la entrada · `lighthouse-urls.json` y presupuesto 2,5 s · e2e ES · mirada FORMA «no vista» en `docs/fidelidad/s5-planes/` (leída como imagen, 4 de 4) · manual ES/EN, guía (c6, 27 pruebas ⭐), fichas (21 funcionalidades).
- **No completado:** la ficha no muestra la fecha de la entrevista (solo la aprobación); la página no pinta prioridad de acción ni el contrato en detalle (3 conteos). Capturas y e2e en inglés: al hito.
- **Desviaciones:** (1) «un dominio nuevo no toca `core/`» casi: `core/plan/revision.ts` suponía `plan-demo-<x>` y ganó `objetivoDelPlan` (`core/plan/{revision,index}.ts`); ningún módulo nombra un dominio y `tests/unit/core/plan/dominio-nuevo.test.ts` lo vigila. (2) La página es nueva (`src/components/paginas/plan-sin-corrida.tsx`), no reutiliza `src/components/plan/*`: esos componentes leen la corrida. (3) Demo en rojo de `un-pr-vivo` con un `gh` de mentira (`tests/unit/un-pr-vivo.test.ts`) y `demo-rojo.sh`, sin abrir un segundo PR real. (4) Dependabot #16 cerrado con comentario: su Lighthouse fallaba por LCP en 5 rutas (2.500,5–3.092 ms); la regla 18 exigía un solo PR vivo. (5) Dos supuestos de la plantilla sin `medible_en_trazas` (sin corrida salían «no decidibles»). (6) `/*/plan` → `/*/plan$` en `perf-budget.json` para que no cubra `/planes/`.
- **Decisiones del usuario:** respuestas de la entrevista delegadas (registrado en `plans/hackguard-agentes/respuestas-por-delegacion.json` y en el manual); el #16 a decisión del constructor.
- **Deuda (al lote del hito):** `src/lib/vista/plan-sin-corrida.ts:99-118` prioridad de acción y `control_legal` sin pintar (M-1) · `src/lib/vista/plan-sin-corrida.ts:50-54` contrato del grafo en 3 conteos, sin nodos ni aristas (M-1) · `src/lib/vista/plan-sin-corrida.ts:62-67` ficha sin fecha de entrevista · `src/lib/datos/planes.ts` sin prueba de «un `v2.json` no aprobado detiene el build» · `scripts/entrevistar.ts:137` `--salida` sin validar (B-3, heredado) · `CLAUDE.md:3` «la app la adopta … en su próximo sprint» ya ocurrió (B-5, corregir en la planeadora) · LCP del #16: next 16.4 / sentry 11.5 suben el LCP 10–20 ms en 5 rutas.
- **Aprendizajes:** la entrevista exige al usuario en la terminal y eso trabó el sprint tres turnos; `--respuestas` desde el chat es el camino cuando delega. La suite unitaria no se corre a la vez que el e2e: 4 tiempos agotados falsos.
- **Recomendación:** el primer uso real de H-2 necesita una entrevista respondida por el usuario; proponer una sesión de 20 min con las preguntas en pantalla, no en la terminal.
- **Esfuerzo-beneficio:** alto: HackGuard tiene su contrato de agentes y planlang probó que un dominio nuevo es un archivo.
- **Auditoría (una pasada, auditor independiente, Sonnet 5.5 · high):** alcance completo con 2 parciales (contenido de la página, fecha de entrevista); calidad: 0 C/A; M-1 (parte: enums), M-2, M-3, M-4, M-5, M-6, B-1, B-4 **pagados** en `24070ef`; el resto arriba como deuda. Seguridad y privacidad: limpias (`.entrevistas/` 700/600, cero enlaces verde). Frases caducadas: M-5 y M-6 pagadas. **Veredicto: listo para cierre.**
- **Fase > 50 %:** ninguna por horas medidas; el span (6,2 h) lo explica la espera de la entrevista.
- **Modelo por fase y desvío:** F1 Sonnet 5.5 · medium (plan). F2 y F3 con Fable 5.1 (plan: Haiku 5.5): el usuario lo fijó con `/model fable` tras tres turnos en que Haiku no supo explicar la parada de contenido. Auditoría Sonnet 5.5 · high.
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint planlang`.
