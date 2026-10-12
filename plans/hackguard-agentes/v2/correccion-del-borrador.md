# Corrección del borrador v2 (S6)

La entrevista corrió con las 14 respuestas revisadas por el usuario (`respuestas-revisadas.json`, SHA-256 `79814efb8954fb0b94928da954590520deb151579c2270afdc72920505f0d4bd`, copia byte a byte del archivo de la planeadora). Ninguna respuesta se cambió.

M1 rechazó el borrador que salió de la entrevista:

- `PRIORIDAD_ALTA_SIN_MITIGACION` · R5 (severidad 8, ocurrencia 4, detección 7 → prioridad de acción alta, sin ninguna mitigación).

Lo que se corrigió, y solo esto, en `v0-borrador.json`:

- **R5.mitigaciones:** una mitigación tomada de la frase del usuario en P03 («en los dos casos, una persona confirma o corrige antes de que nada quede como evidencia») y de su P08 (la corrección de la persona es la señal que detecta el riesgo). No lleva cifras: no se inventó ninguna reducción de ocurrencia ni de detección.

Lo que no se tocó: la gravedad 8 (la dio el usuario), la ocurrencia 4 y la detección 7 (las propuso el entrevistador, como dice P08), el detector, el origen del elemento (`usuario`) y los demás 13 elementos del plan.

La señal `veredicto_corregido_por_persona`, que R5 lee, la sumó el código del entrevistador al contrato; no hizo falta tocar el contrato a mano.

## Segunda corrección: el texto de D1 y D4 (auditoría S6, A1)

La auditoría del sprint encontró que las justificaciones de D1 y D4 decían que los umbrales U2 y U3 estaban pendientes, cuando ya tenían valor: 2 fuentes verificadas (P12) y 180 días (P12). Lo redactó el entrevistador y M1 no lo detecta, porque es texto libre.

El usuario aceptó las cuatro frases corregidas («Acepto» y «Apruebo», 2026-10-11). Solo cambiaron esas cuatro cadenas, en español e inglés, dentro de `decisiones[D1].justificacion` y `decisiones[D4].justificacion`. El `v2.json` anterior (huella 793a2f82…) se retiró y el plan se volvió a aprobar como v2.0.0; la nueva huella es `3021ab88…`. Ambas versiones quedan en el historial de git.
