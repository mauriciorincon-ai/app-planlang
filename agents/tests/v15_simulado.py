"""Plan v1.5 del demo A con el proveedor simulado: la corrida versionada `runs/demo-a/simulado-v1.5-tope`
(lote `planlang-a-002-200`, plan de beneficios v2, 20 casos: el primer bloque, con su aprobación parcial y sus
inyecciones).

Es el gate de contrato entre lenguajes del plan v1.5 (regla 19): Python la escribe con su exportador real
y TypeScript la lee entera (RF-09.2 con la arista `carga_detectada` y la aprobación parcial,
`trazas:verificar`).
`test_v15_versionado.py` la regenera y exige los mismos bytes.
Regenerar: `agents/.venv/bin/python agents/tests/v15_simulado.py`.
"""

from __future__ import annotations

from pathlib import Path

from app_agents import lotes
from app_agents.plan import RAIZ_REPO

PLAN_V15 = "plans/demo-a/v1.5.json"
LOTE_002 = "data/casos/demo-a/planlang-a-002-200.json"
CORRIDA = "simulado-v1.5-tope"


def generar(salida: Path, n: int = 20) -> lotes.ResumenSesion:
    return lotes.ejecutar_lote(
        corrida_id=CORRIDA,
        fecha="2026-10-04",
        proveedor="simulado",
        plan_ruta=PLAN_V15,
        casos_ruta=LOTE_002,
        salida=salida,
        n=n,
        reloj="fijo",
    )


if __name__ == "__main__":
    r = generar(RAIZ_REPO / "runs" / "demo-a")
    print(f"{CORRIDA}: {len(r.ejecutados)} casos, {len(r.con_error)} con error → {r.directorio}")
