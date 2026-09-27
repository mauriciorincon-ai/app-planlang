# planlang

> **Planeé, construí y medí la brecha.** El planeador de agentes de IA donde cada demo es la prueba de
> su propio plan.
>
> _I planned, I built, I measured the gap. The AI-agent planner where every demo is the test of its own plan._

**Simulación · no operativo · datos sintéticos.** Nada de lo que hay aquí opera casos reales ni toca
datos de personas: todo caso, afiliado, médico, plan de beneficios y lista es sintético con semilla, y
un validador en CI lo comprueba.

## Qué hay en este repositorio

| Carpeta                      | Qué es                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`                      | Núcleo determinista en TypeScript (planeador, generador sintético, verificador de brecha, intérprete de aristas, formatos). Jamás invoca un modelo de lenguaje. Corre en Node y en el navegador con los mismos bytes |
| `agents/`                    | Agentes en Python 3.12 con LangGraph 1.x: el demo A (autorizaciones médicas simuladas), el adaptador de modelo y el exportador de trazas `planlang-trace/v1`                                                         |
| `packages/`                  | Implementaciones de los dos reusables de la casa (instrumentos de plan · diagramador), con su contrato fijado                                                                                                        |
| `plans/` · `data/` · `runs/` | El plan aprobado con huella, las plantillas de dominio, los casos sintéticos y las corridas exportadas                                                                                                               |
| `src/`                       | La vitrina estática bilingüe (Next.js exportado). Llega en el S2, tras la Etapa de Diseño                                                                                                                            |
| `docs/`                      | Manual de uso, guía de prueba, kit de prueba, brochure y blueprint                                                                                                                                                   |
| `decisions/`                 | ADRs: código primero · proveedor y cumplimiento · pines de Python                                                                                                                                                    |
| `sprints/`                   | Bitácora y summary de cada sprint                                                                                                                                                                                    |

## Cómo se usa (S1, sin pantalla)

```bash
pnpm install                                          # también re-aplica el hook de git (gitleaks)
pnpm plan:validar --verificar plans/demo-a/v1.2.json  # el plan vigente del demo A, con su huella
pnpm casos:generar --versionados                      # regenera los lotes sintéticos versionados (misma semilla, mismos bytes)
pnpm lote:demo --corrida <id> --fecha <AAAA-MM-DD>    # lote de 20 con la suscripción de Claude Code (fuera de CI)
pnpm brecha:informe --corrida runs/demo-a/<id>        # informe de brecha ES/EN, idéntico byte a byte
pnpm trazas:verificar && pnpm m9:reporte --verificar  # corridas verificadas · brechas sembradas detectadas
pnpm test && pnpm typecheck && pnpm lint
cd agents && .venv/bin/pytest                         # el mismo comando del job `python` de la CI
```

El detalle para usuarios está en `docs/MANUAL-DE-USO.md`; las pruebas manuales, en
`docs/GUIA-DE-PRUEBA.html`.

## Principios (constitución en `CLAUDE.md`)

El núcleo es determinista y jamás llama a un modelo · el plan es el código de la arista · toda decisión
del agente deja su señal · ninguna negación sin pausa humana · la guardia determinista es arquitectura ·
cero datos reales · la brecha se publica con sus fallas · bilingüe español/inglés en todo.
