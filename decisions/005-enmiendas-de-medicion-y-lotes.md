# ADR-005 — Enmiendas de solo medición: el lote vale si el plan conserva su verdad

**Summary (EN):** A batch generated with plan A is valid for plan B when B keeps exactly the same thresholds, graph contract and benefits plan (compared as canonical JSON), because each case's known truth derives from them. Measurement-only amendments (criteria, risks, assumptions) do not invalidate the cases; both the runner and the verifier enforce it.

**Estado:** aceptado · **Fecha:** 2026-09-27 · **Sprint:** S1 «El contrato y la corrida»
**Cítese por tema:** «ADR de enmiendas de medición y lotes».

## Contexto

El primer informe de brecha real (fase 4, plan v1.1) encontró tres defectos del plan en cómo MIDE, no en
cómo decide: el detector de R5 comparaba la extracción entera con sus campos (siempre «distinto»), S1 y
S2 no declaraban umbral numérico de confirmación, y S2 no podía fallar con U3 = 2. El usuario aprobó el
plan v1.2 con las correcciones y rehacer las corridas (gate de la fase 4).

Pero el runner de Python exigía que el lote de casos se hubiera generado con **el mismo** plan
(`lote.plan.huella == plan.huella`). Regenerar los lotes para la v1.2 cambiaba sus huellas y dejaba sin
verificar las corridas v1.1, que se conservan como historia (su manifiesto declara la huella del lote).

## Decisión

1. **Un lote generado con el plan A vale para correr y verificar el plan B si B conserva EXACTAMENTE los
   `umbrales` y el `contrato_de_grafo` de A** (comparados por JSON canónico, tal como están en disco): la
   verdad conocida de cada caso se deriva de ellos y del plan de beneficios (que tiene su propia huella).
   Una enmienda de solo medición (criterios, riesgos, supuestos) no invalida los casos.
2. La regla vive a los dos lados con la misma semántica: `app_agents.plan.misma_verdad` (el runner rechaza
   con `CorridaIncompatible` si el plan del lote no está o no da la misma verdad) y
   `core/plan/compatibilidad.ts` → `mismaVerdad` (el lector del verificador exige que se le entregue el
   plan del lote, verifica su huella y lo compara; si no, rechaza la corrida).
3. Los lotes versionados siguen generados con la v1.1 (`scripts/lotes-versionados.ts`); el informe dice en
   su ficha con qué plan se generó el lote («generado con el plan 1.1.0»).
4. El plan por defecto de los lotes pasa a `plans/demo-a/v1.2.json`; la corrida simulada versionada se
   regeneró con él (el gate de determinismo lo exigió en rojo).

## Consecuencias

- Las corridas v1.1 siguen verificando y su informe se regenera idéntico (solo ganó el dato del plan de
  generación). La historia se conserva completa.
- Una enmienda que toque umbrales o el contrato de grafo sí obliga a regenerar lotes: el runner y el
  verificador lo rechazan (tests en rojo con un U2 cambiado).
- `pass^k` sigue exigiendo el MISMO plan en todas las repeticiones: las 3 corridas del plan v1.2 se
  hicieron de nuevo, con su línea base.

## Alternativas descartadas

- **Regenerar los lotes con la v1.2 en el mismo archivo:** rompe la verificación de las corridas v1.1.
- **Lotes duplicados por versión del plan:** 700 KB más de casos idénticos salvo una referencia.
- **Que el verificador mida con la v1.2 las corridas hechas con la v1.1:** cambiar la vara después de ver
  el resultado; el lector lo prohíbe (la corrida declara la huella del plan con que corrió).

## Adenda (2026-09-27, auditoría S1, M-2)

La verdad conocida del lote también se deriva del **plan de beneficios**, y hasta la auditoría nadie lo
cotejaba. Desde el cierre del S1 los dos lados lo exigen: `lotes.py` rechaza con `CorridaIncompatible` un
plan de beneficios distinto del que declara el lote (y al reanudar una corrida), y el lector del
verificador rechaza con `HUELLA_NO_COINCIDE` una corrida cuyo plan de beneficios no es el del lote.

## Adenda (2026-10-02, auditoría S2, AU-S2-B40)

El punto 3 dejó de valer para un lote: el plan v1.4 (AU-9) cambia el contrato de grafo, así que el lote de 200
se regeneró con la v1.4 (los mismos casos y la misma verdad; `scripts/lotes-versionados.ts` declara el plan de
cada lote). El de 20 y el de humo siguen con la v1.1. El plan por defecto de `pnpm lote:demo` sigue siendo la
v1.2 (punto 4), y el manual lo dice en los dos idiomas (AU-S2-B10).
