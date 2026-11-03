# ADR-018 — La calibración con garantía: Learn then Test, conformal y Bonferroni, exactos, sobre la rejilla que el plan ya declara

**Summary (EN):** Assumption S1 (calibrated verbalized confidence) gains a guarantee, computed exactly in `core/brecha/garantia.ts`
over the same samples and grid as the risk-coverage curve. (a) Learn then Test with a fixed sequence gives the lowest
confidence threshold whose error among what the agent decides alone is ≤ α with probability ≥ 1 − δ. (b) A conformal
threshold lets at least 1 − α of the correct cases through without a person (marginal, under exchangeability). (c) A
Bonferroni joint coverage bounds the chance that any model stage measured against ground truth fails. The backed zone is
the grid thresholds that have (a) and (b). α ∈ {0.05, 0.10, 0.20} with δ = 0.10; the report declares α = 0.10. Tails
are exact binomial sums in `BigInt`. Python with `fractions` checks the core bit for bit, and so do the three browser
engines. When the data does not reach a guarantee, the report says so and says how many cases it would take. The plan is
not versioned.

**Estado:** aceptado · **Fecha:** 2026-11-02 · **Sprint:** S8 «El umbral que el dato respalda» (H-2), fase 2
**Cítese por tema:** «ADR de la garantía de la calibración».
**Origen:** la orden del S8 (`portafolio/planlang/sprints/SPRINT_008.md`, F2) y los defaults del G-Plan aprobado el
2026-11-02 («planlang: apruebo»): α ∈ {0,05 · 0,10 · 0,20}, 0,10 en el informe, δ = 0,10, sin versionar el plan.

## Contexto

- S1 ya mide ECE, AUROC y la curva riesgo-cobertura de la confianza verbalizada sobre los 159 casos con verdad conocida de
  la corrida publicada del demo A (153 aciertos, rejilla de U1 de 0,50 a 0,95 cada 0,05). Una curva dice qué pasa en estos
  datos; no dice cuánto se puede confiar en un umbral para los casos que vienen.
- La garantía se publica (P9). Un error de cálculo sería una promesa falsa, y un `Math.pow` daría bytes distintos según
  el motor (P1).

## Decisión

1. **Las tres cifras** (`garantiaDeCalibracion`), por cada α:
   - **(a) Learn then Test** (Angelopoulos, Bates, Candès, Jordan y Lei, arXiv 2110.01052), secuencia fija. Va de lo más
     conservador a lo menos: con `menor_que`, de 0,95 hacia abajo. En cada umbral prueba H₀ «error > α entre lo que el
     agente decide solo» con p = P(Bin(n_τ, α) ≤ errores_τ), la cola binomial exacta, que es válida para una pérdida 0/1.
     Acepta mientras p ≤ δ y se para en el primer rechazo. τ* es el menor aceptado, y la familia entera queda controlada a δ.
   - **(b) Conformal** (Angelopoulos y Bates, arXiv 2107.07511). Sobre los aciertos, τ_c es el ⌊(n_c + 1)·α⌋-ésimo menor
     valor de confianza; si el índice es 0, no hay cota. Se rotula «marginal, bajo intercambiabilidad».
   - **Zona respaldada:** los umbrales de la rejilla aceptados por (a) en los que todo acierto con confianza ≥ τ_c se
     decide solo. La condición se evalúa con el mismo `comparar` de la arista del plan.
   - **(c) Cobertura conjunta (Bonferroni).** Entran las etapas con modelo medidas contra la verdad, k en total. Cada una
     se prueba con α/k y δ/k, sobre **la misma población**: los casos que el agente decide solo en cada umbral y que traen
     todas esas etapas medidas. La cota de unión suma probabilidades sobre una misma población; medir la aclaración sobre
     todos los casos, como decía el plan del sprint, no la sostendría. Al lado va el error conjunto observado.
2. **La tabla de etapas es un dato** (`VERDAD_DE_ETAPA` en `core/brecha/supuestos.ts`), indexada por el id del nodo
   `tipo: "modelo"` del plan:
   - **Extractor:** `extraccion.campos == verdad_conocida.campos`, sobre `verdad_conocida.presente`. Es la regla de S1 y de
     C5, y una prueba exige que coincida caso por caso.
   - **Aclaración:** `ciclos_aclaracion == verdad_conocida.ciclos_aclaracion_necesarios`, donde esa verdad no es nula.
   - **Redactor:** el caso no trae verdad para él, así que queda «no observado» y el informe lo dice.
   - En la corrida publicada, k = 2.
3. **Cuántos casos harían falta**, cuando (a) o (c) no alcanzan, en el punto más conservador:
   - **Sin errores:** el menor n con (1 − α)ⁿ ≤ δ, la cifra de la orden.
   - **Con una tasa bajo α:** el menor múltiplo de los casos de hoy, con la misma tasa, que respaldaría el umbral, hasta
     20 veces. Con errores, la cifra de cero errores engaña: la corrida ya tiene 134 casos en 0,95, más que los 59 que pide.
   - **Con una tasa que no baja de α:** ninguna cantidad la respalda, y se dice así.
4. **Exactitud:** α y δ son racionales y las colas se suman con `BigInt`, sin `Math.pow`, `log`, `exp` ni `**`. El p de
   cada prueba se publica con 4 decimales (redondeo a la mitad hacia arriba, en `BigInt`). La decisión sale de la fracción
   exacta, nunca del redondeo. Tres gates lo vigilan:
   - `garantia.ts` entra al cierre de G2 (`tests/unit/guardias/determinismo.test.ts`);
   - `tests/contrato/garantia.test.ts` exige lo mismo que `tests/contrato/garantia_fracciones.py` con `fractions`;
   - `tests/e2e/garantia.paridad.spec.ts` lo corre en Chromium, Firefox y WebKit.
5. **Niveles:** α ∈ {0,05 · 0,10 · 0,20} con δ = 0,10; el informe declara α = 0,10 (`NIVELES_DE_ALFA`, `ALFA_DEL_INFORME`,
   `DELTA`). El playground elige entre los tres, precalculados en el informe: nada se calcula al pintar (ADR-017).
6. **No se versiona el plan.** La garantía se mide sobre la rejilla que S1 ya declara. Escribir α y δ en el plan pide una
   versión nueva y su `pnpm plan:aprobar`, que es del usuario. El verificador sube a 1.4.0: cada supuesto trae `garantia`,
   y los que no son de calibración la traen `null`.
7. **El demo B queda «no observado»** porque su plan no tiene supuesto de calibración ni señal de confianza: ninguna
   arista suya escala por confianza. No es por falta de corridas, porque el manifiesto publica `suscripcion-planlang-b-001-20`.
   Una arista que escala por confianza alta tampoco tiene garantía: la función da `null`.

## Alternativas

| Alternativa                                                         | Por qué no                                                                                                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Cotas de Hoeffding o de Hoeffding-Bentkus (las del artículo de LTT) | valen para pérdidas acotadas en general; con pérdida 0/1, la cola binomial exacta es válida y más ajustada                                     |
| Una cota superior por umbral (Clopper-Pearson) y elegir el mejor    | elegir mirando diez pruebas sin corregir infla el error de tipo I; la secuencia fija controla la familia sin pagar Bonferroni sobre la rejilla |
| Coma flotante con `Math.log` y `Math.exp`                           | sus bytes no los garantiza la especificación entre motores (P1, G2)                                                                            |
| Holm en vez de Bonferroni para las etapas                           | con k = 2, la ganancia es marginal y la lectura se complica                                                                                    |
| Calcular en el navegador al mover el selector                       | el LCP de 2,8 s no tiene margen (ADR-017); los tres niveles van precalculados                                                                  |
| Versionar el plan con α y δ                                         | pide `plan:aprobar` del usuario y no cambia ninguna cifra                                                                                      |

## Consecuencias

- **La corrida publicada a α = 0,10:** τ* = 0,50 (cobertura 99,4 %, error observado 3,2 %), τ_c = 0,90 y zona respaldada
  0,50–0,90. El umbral de la corrida (0,75) cae dentro. La cobertura conjunta **no alcanza**: en 0,95 el extractor falla
  en 3 de 134 casos y p = 0,0931 > 0,05; con la misma tasa harían falta 268 casos.
- **Los otros niveles:**
  - a α = 0,05, la zona es 0,75–0,85 y la conjunta no alcanza (harían falta más de 20 veces los casos);
  - a α = 0,20, la zona es 0,50–0,95 y la conjunta respalda desde 0,50.
- **Las corridas de 20 casos** no alcanzan ningún nivel, y el informe dice el n que haría falta en cada uno.
- **El alcance de la garantía:** vale para casos intercambiables con los 159 medidos. Son casos sintéticos, con el revisor
  simulado que sigue la verdad conocida (P4 y P7), y no dicen nada del tráfico real. Un lote nuevo pide recalcular.
- **Los informes se regeneran.** Los de `data/vitrina/` y los de `runs/*/` son derivados del verificador; las trazas no
  se tocan. El manifiesto actualiza las huellas del informe y de la comparación.
