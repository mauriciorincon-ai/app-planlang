---
sprint: 008
app: planlang
hito: H-2
opened: 2026-11-02
closed: 2026-11-02
branch: sprint-008/umbral-respaldado
pr:
---

# Sprint 008 · cierre — El umbral que el dato respalda

- **Objetivo / resultado:** que el playground diga qué umbral de confianza tiene garantía estadística y cuál no, y que planlang entre a H-2 con su constitución al día. Cumplido: la garantía de S1 del demo A (Learn then Test, conformal y cobertura conjunta, exactos con `BigInt`), la zona respaldada en el playground y en la Brecha, el núcleo v2.3.0, la devolución 026 (6 puntos) y todo servidor en `127.0.0.1`.
- **Estado:** construido y auditado; PR listo para el squash. **Estimado / real:** 4 h / salida de `horas-sprint` antes de este cierre (el trabajo de leer y planear anterior al primer commit no cuenta). **Diferencia:** −1,7 h (−43 %).

```
| Commits | Sesiones | Horas activas | Span (primer → último commit) |
| 24 | 1 | 2,3 h | 2026-11-02 18:05 → 2026-11-02 19:54 (1,8 h) |
| Fase | Commits | Horas activas |
| F1 | 6 | 0,8 h |   (plan 1,25 h)
| F2 | 5 | 0,8 h |   (plan 1,5 h)
| F3 | 13 | 0,8 h |  (plan 1,25 h)
```

- **Entregables:** F1 `CLAUDE.md` = la orden, 29 reglas · fichas de la app con el copy 026, `ciclo "H-2"`, `redactado_el`, `proceso`, `complemento.yaml`, sin fichas de los demos · `pnpm capturas:cv-viva` (21 capturas, 194 nombres tapados) · puertos 3200/3201 con guardia. F2 `core/brecha/garantia.ts` en G2, golden TS = Python con `fractions` (8 casos, 78 colas, al bit), paridad en Chromium, Firefox y WebKit, verificador 1.4.0, ADR-018. F3 panel de la zona con selector de error (5 · 10 · 20 %, δ = 0,10 fijo) y trama/glifo/texto, S1 en la Brecha en los dos registros, `jerga.ts`, 2 pruebas ⭐ nuevas, manual ES/EN, capturas ES.
- **Demos en rojo (F2, vistas fallar y volver a verde):** `Math.pow` en la cola → G2 nombra `garantia.ts:90 Math inexacta`; `continue` por `break` → 16 pruebas del contrato («secuencia fija: tras el primer rechazo»); conformal sin el + 1 → 4 pruebas («conformal-justo»). F1: `start` vuelto a `serve out -l 3000` → la guardia de puertos.
- **Lo que dice el informe (α = 0,10, δ = 0,10):** umbral con garantía 0,50, conformal 0,90, zona 0,50–0,90 con el 0,75 de la corrida dentro; la cobertura conjunta **no se respalda con la secuencia fija** (en 0,95 la extracción falla en 3 de 134; harían falta 268 casos). Las corridas de 20 casos no alcanzan ningún nivel. El demo B queda «no observado» porque su plan no mide confianza (la bitácora lo atribuía a que su única corrida es `simulado-humo`; el manifiesto publica otra).
- **Desviaciones:** (1) la aclaración se mide sobre los casos que el agente decide solo en cada umbral (población común: Bonferroni lo exige). (2) «Cuántos casos harían falta» trae una segunda cifra, el múltiplo de los casos de hoy con la misma tasa; con errores, la de la orden engaña. (3) Se regeneraron los 8 informes de `data/vitrina/` y `runs/*/` (derivados; trazas y huellas de corrida intactas). (4) `pnpm fichas` escribe 7 archivos y el complemento va sin `roadmap`; la pantalla Fichas dice que las de los agentes ya no se entregan. (5) La Entrada saca «Calibración conformal» de «También en construcción». (6) El SVG de la curva no llevaba `id`: el golden de paridad nunca leyó su geometría; ahora sí, en los tres motores. (7) `pnpm maqueta` pasó a `127.0.0.1:3101`; el 3101 no está en la lista de puertos del núcleo. (8) `contratos-lock.test.ts` falla solo aquí (hoja-de-vida cambió `armar.ts` el 2026-11-01; en la CI se salta): la planeadora lo vuelve a fijar. (9) `next dev` reescribe `AGENTS.md` cada vez: se revierte.
- **Decisión que queda abierta (P9):** la secuencia fija parte del umbral más alto y su «no se respalda» depende de ese orden: a 0,75–0,80 cada etapa pasaría por separado (p = 0,0494 y 0,0161). Otro orden fijado de antemano (p. ej. desde el umbral del plan) lo decide el usuario; está en ADR-018 y a la vista en pantalla. Nada se descartó.
- **Auditoría (una pasada, auditor independiente Sonnet 5.5 · high, 9 min; 4 casillas):** 0 Críticos, 1 Alto, 7 Medios, 7 Bajos, y 7 campos de la garantía sin lector. Pagados: A1 (la guía decía que el paquete borra las fichas viejas; solo lo avisa) `a05cf6a`; M1 (el líder no veía la conjunta cuando sí se respalda), M2 (el orden de la secuencia), M3 (3 textos muertos), B1, B2 y los campos sin lector `77436ae`; M4 (miles en el informe) `7786b7f`; M5 (`maqueta` en todas las interfaces) y M6 (`--destino` de las capturas) `18560a4`; B3 y B4 `a05cf6a`. Frases caducadas: 4 halladas y pagadas; las dos líneas de `CLAUDE.md` (7 y 11: 4 funcionalidades faltantes, `decisions/001…017`) son del núcleo y las corrige la planeadora.
- **Deuda al lote del hito:** M7 `docs/brochure-export.json:31` (21 funcionalidades; sin la calibración con garantía, regla 13) · B5 `docs/BLUEPRINT.html:187` («sus fichas» tras la baja de las A y B) · B6 `scripts/capturas-cv-viva.mjs:233` (las «tomas con propósito» del 2026-10-31 no son reproducibles con el script) · B7 `core/brecha/render-md.ts:480` (el informe .md no publica los p por umbral) · `src/lib/vista/garantia.ts:134` (con una sola etapa medida, el líder calla la conjunta; el .md la lista) · `src/components/curva.tsx:201` (rótulos de la curva mini se pisan a 84–99 % de cobertura; anterior al sprint) · `data/vitrina/demo-a/suscripcion-planlang-a-001-20-v1.2/` (informe huérfano en 1.3.0, ni el manifiesto ni nada lo lee).
- **Fase > 50 %:** ninguna (0,8 h en cada una; los planes eran 1,25 · 1,5 · 1,25).
- **Modelo por fase y desvío:** F1 Sonnet 5.5 · medium, F2 Opus 5.5 · high, F3 Sonnet 5.5 · medium, como el plan; cada fase abrió con su línea de gate y coincidieron. Haiku no se usó. **Relevos:** ninguno.
- **Verificación:** `pnpm test` 4536 en verde salvo `contratos-lock` (local) · pytest 257, cobertura 96 % · typecheck, lint, ruff · e2e completo 290 pasan, 0 flaky, 3 omitidos por diseño · paridad en los 3 motores · paquete 216 archivos y su e2e en 3201 · Lighthouse local: presupuestos y categorías ≥ 0,9, LCP 2,607 s contra 2,8 s (ADR-017), sin costo del panel · `export:verificar` y cero enlaces en verde.
- **Aprendizajes:** una garantía honesta dice también el orden en que se probó; el campo de un contrato que nadie lee es el lugar donde se esconde lo que no se muestra; un golden que lee un selector que no existe nunca falla.
- **Recomendación:** que el usuario decida el orden de la secuencia antes de S10 (cambia lo que dice la conjunta, no lo que es verdad); S9 (plazos y beneficiario final) sin cambios.
- **Esfuerzo-beneficio:** alto: la pregunta «¿cómo sabes que tu evaluación es confiable?» tiene respuesta con su nivel y con lo que no alcanza, calculada exacta y vigilada por tres gates.
- **Servidores al STOP:** `lsof` LISTEN en este repo: 0 (queda el test-server de la extensión Playwright de VS Code, que no cuenta; el de `app-anonimizador` es de otra app y no se tocó).
- **Para mergear:** squash y borrar la rama; después `/cierre-sprint planlang`.
