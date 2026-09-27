# instrumentos-de-plan — implementación del contrato v0.1.0

Reusable de la casa planeadora (contrato en `reusables/instrumentos-de-plan/CONTRATO.md`; copia fijada en
`CONTRATO.lock` con versión y huella SHA-256). Este paquete **no importa nada de la app** y no conoce
ningún dominio (garantía G6, vigilada por `tests/unit/guardias/neutralidad.test.ts`).

| Módulo                  | Qué hace                                                                                                                                                                 | Garantía   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `src/decisiones.ts`     | Orden de decisión por ondas (Kahn); ciclo detectado y MOSTRADO (DFS); decisiones de una vía primero                                                                      | G2, G3     |
| `src/modos-de-falla.ts` | Prioridad de acción por la tabla AIAG-VDA 2019 que viaja en `datos/prioridad-de-accion.json` (severidad primero); RPN solo secundario; bloqueo por `alta` sin mitigación | G4, G5, G7 |
| `src/supuestos.ts`      | Supuesto de criticidad alta sin prueba barata ⇒ inválido                                                                                                                 | C05        |
| `src/informe.ts`        | Informe de validación determinista con bloqueantes bilingües                                                                                                             | G1         |
| `datos/escalas.json`    | Anclas 1–10 y reversibilidad, como dato                                                                                                                                  | G7         |
| `carnadas/*.json`       | C01–C05 del contrato + C03-bis                                                                                                                                           | § 4        |

**Enmiendas propuestas al contrato** (van al summary del S1; la planeadora las aplica por G-Metodo):

1. C03 pide `alta` para S8·O3·D4, pero la tabla AIAG-VDA da `baja` (S 7-8 · O 2-3 · D 2-4). Propuesta:
   C03 = S8·O6·D2 → `alta` con RPN 96 y C03-bis = S8·O3·D4 → `baja` con RPN 96.
2. `opciones[].pros` y `contras` opcionales en la decisión.
