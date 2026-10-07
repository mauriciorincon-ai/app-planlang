# ADR-016 — La aprobación parcial por tope de servicio hace jugable el modo Texas (plan v1.5 del demo A)

**Summary (EN):** Plan v1.5 makes U4 (Texas mode) move cases. Each diagnostic service in benefit plan v2 has a coverage
cap; when the cost exceeds the cap (and not U2), the agent proposes `aprobar_parcial`: approve up to the cap and deny the
excess (RB-08). With Texas mode off it goes out on its own, as D2 now says; with it on, `texas_y_no_aprobar` sends it to
a person. A full denial still always goes to a person. The same amendment adds the deterministic `carga_detectada`
signal (M-16), widens the human pause payload (M-8), rebuilds the adverse document (M-15) and resolves thresholds by
signal (M-18).

**Estado:** aceptado · **Fecha:** 2026-10-04 · **Sprint:** S3 «Demo B y el cierre del ciclo» (fase 0)
**Cítese por tema:** «ADR de la aprobación parcial».
**Origen:** G-Plan del S3 (2026-10-04: «plan v1.5 del A con U4 activo, M-16 y lote nuevo de 200»). El mismo día, el
usuario eligió «Tope por servicio» para la aprobación parcial.

## Contexto

En el plan v1.4, el modo Texas (U4, «ninguna determinación adversa automática, ni parcial») no movía ningún caso. El
agente solo proponía `aprobar` o `negar`, y toda negación ya pasaba por una persona. El G-Plan pidió que U4 fuera
jugable con una propuesta adversa parcial.

La primera lectura fue «parcial cuando el costo supera el `tope_alto_costo` del plan de beneficios», y no funcionaba:
ese tope es `umbral.U2`. La arista 2 de `decision` (RB-04: `costo_estimado > U2 → pausa_humana`) ya manda a una persona
todo caso caro, antes de que se evalúe la función de Texas. Una parcial así habría pasado siempre por una persona, y U4
habría seguido inerte. El builder lo detectó antes de construir y lo llevó al usuario, que eligió el tope por servicio.

## Decisión

1. **Plan de beneficios v2.0.0** (`data/plan-beneficios/demo-a-v2.json`, enmienda en
   `scripts/enmienda-plan-beneficios-demo-a.ts`; el v1.0.0 queda intacto):
   - tope de cobertura por servicio con una **regla fija**, no a mano: los servicios de imagen, diagnóstico y
     rehabilitación que requieren autorización y cuestan entre 300 y U2 cubren el 70 % de su costo, redondeado hacia
     abajo a decenas. Salen 6 servicios. El tope es un dato sintético del plan de beneficios, no un umbral del agente;
   - **RB-08**: sobre el tope, se aprueba hasta el tope y se niega el excedente.
2. **Plan v1.5** (`enmendarAV15`):
   - **D2**, opción elegida: «aprobar y aprobar en parte; negar y escalar exigen pausa humana; con el modo Texas,
     también la aprobación en parte». Es la regla dura 4 de la constitución: la negación completa siempre pasa por una
     persona, y el modo Texas extiende la pausa a lo parcial.
   - **R10** (con Texas, una negación parcial sin humano) y **C10** (con Texas, ninguna negación ni parcial sin pausa).
     Las calificaciones S9 · O2 · D3 de R10 copian las de R1 (mismo daño, parcial); las propone el builder.
   - **C8** suma `aprobar_parcial` a su población: toda decisión adversa lleva su documento.
   - **M-16:** `carga_detectada · igual_a · true → pausa_humana` es la arista 1 de `decision`. La escribe el enrutador
     con la guardia de entrada (reglas fijas, sin modelo). Va en `decision` y no en el enrutador para que el modelo siga
     leyendo los casos adversarios (el criterio de inyección los mide) mientras la ruta queda protegida: lo que el
     modelo declare sobre un caso con carga ya no decide solo.
   - **M-8:** `payload_minimo` de la pausa suma `orden_adjunta`, `aclaraciones` y `cobertura`.
   - U2 trae su unidad en los dos idiomas (M-25).
3. **Agente A** (`agents/src/app_agents/demo_a/`):
   - el verificador de cobertura propone `aprobar_parcial` cuando el costo pasa el tope (RB-08);
   - **M-18:** los umbrales se resuelven por su señal (`umbral_de_senal`) y el tope de alto costo por su referencia
     (`umbral_de_referencia`), y se comparan con `comparar()` del intérprete; `modo_texas` lo resuelve el enrutador.
     Del lado TS, el generador exige que el tope de alto costo sea el umbral del costo (`exigirTopeAltoCosto`);
   - **M-15:** el documento adverso dice la decisión, la regla según la causal (RB-03 para una exclusión, RB-08 para el
     tope), el servicio de la orden y, si es parcial, el monto aprobado y el negado. `idiomas` se calcula, y el
     verificador recalcula `completo` e `idiomas` en vez de creerle al emisor;
   - la arquitectura corta una parcial sin pausa con el modo Texas, como ya cortaba una negación sin pausa;
   - **aviso honesto:** si la parte negada sale sin una persona, ni la salida ni el documento dicen que una persona la
     revisó (`AVISO_IA_SIN_PERSONA`, `DECIDIDO_POR_REGLA`).
   - Las reglas nuevas del prompt (redactor y línea base) se suman **solo con un plan de beneficios con topes**. Así las
     corridas versionadas con el v1 conservan sus bytes (el proveedor simulado cuenta el prompt) y `runs/` sigue siendo
     solo de agregar.
4. **Playground:** las opciones del demo pueden declarar una propuesta `parcial` que no es adversa mientras su señal
   (el modo Texas jugado) esté apagada. Sin esa declaración, el compacto conserva sus bytes. La regla
   `pausas_cumplidas` del verificador suma la cláusula de Texas.
5. **Lote nuevo** `planlang-a-002-200` (plan v1.5 y plan de beneficios v2, generador 1.1.0): 9 aprobaciones parciales,
   ninguna escala con el modo Texas apagado. La corrida simulada `runs/demo-a/simulado-v1.5-tope` (20 casos) es el gate
   de contrato entre lenguajes de la v1.5.

## Consecuencias

- El modo Texas mueve 9 de los 200 casos del lote nuevo. En el playground, encenderlo los lleva a una persona.
- La vitrina sigue publicando las corridas del S1 y el S2 hasta que corra el lote real de la v1.5. Cuando la publique,
  necesita su vocabulario: la categoría de la regla `carga_detectada` en `src/lib/vista/motivo-pausa.ts`, la etiqueta
  de `aprobar_parcial`, los textos de R10 y C10, y `parcial` en el manifiesto. Va a la fase 3.
- Correr el lote real de 200 de la v1.5 gasta cuota de la suscripción: se le pregunta al usuario antes, con un humo
  real de 3 casos.
