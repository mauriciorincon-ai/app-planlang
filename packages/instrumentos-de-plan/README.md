# instrumentos-de-plan — implementación del contrato v0.2.0

Reusable de la casa planeadora (contrato en `reusables/instrumentos-de-plan/CONTRATO.md`; copia fijada en
`CONTRATO.lock` con versión y huella SHA-256). Este paquete **no importa nada de la app** y no conoce
ningún dominio (garantía G6, vigilada por `tests/unit/guardias/neutralidad.test.ts`).

| Módulo                  | Qué hace                                                                                                                                                                                                                                    | Garantía       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `src/decisiones.ts`     | Orden de decisión por ondas (Kahn); ciclo detectado y MOSTRADO (DFS); decisiones de una vía primero                                                                                                                                         | G2, G3         |
| `src/modos-de-falla.ts` | Prioridad de acción por la tabla AIAG-VDA 2019 que viaja en `datos/prioridad-de-accion.json` (severidad primero); RPN solo secundario; `control_legal` ⇒ prioridad efectiva `alta` (la de tabla visible); bloqueo por `alta` sin mitigación | G4, G5, G7, G8 |
| `src/supuestos.ts`      | Supuesto de criticidad alta sin prueba barata ⇒ inválido                                                                                                                                                                                    | C05            |
| `src/informe.ts`        | Informe de validación determinista con bloqueantes bilingües                                                                                                                                                                                | G1             |
| `datos/escalas.json`    | Anclas 1–10 y reversibilidad, como dato                                                                                                                                                                                                     | G7             |
| `carnadas/*.json`       | C01–C06 del contrato + C03-bis                                                                                                                                                                                                              | § 4            |

**v0.2.0 (fijada en el S2 de planlang):** `control_legal` fija la prioridad efectiva en `alta` y exige mitigación, con
la prioridad de tabla visible al lado (G8, carnada C06); `pros`/`contras` opcionales y el informe señala las opciones
«sin argumentos» (F-002); C03 = S8·O6·D2 → `alta` y C03-bis = S8·O3·D4 → `baja`, las dos con RPN 96 (F-001). Las dos
enmiendas que el S1 propuso ya están en el contrato.
