"""AU-9 con el proveedor simulado: falla en los casos y esquemas que se le digan, en todos sus intentos.

Sirve a `test_lotes.py` y genera la corrida versionada `runs/demo-a/simulado-v1.4-respaldo` (plan v1.4,
lote de 200, 8 casos): el gate de contrato entre lenguajes de AU-9 (regla 19), porque Python la escribe con
su exportador real y TypeScript la lee entera (RF-09.2, `trazas:verificar`, el informe versionado).
`test_respaldo_versionado.py` la regenera y exige los mismos bytes.
Regenerar: `agents/.venv/bin/python agents/tests/respaldo_simulado.py`.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app_agents import lotes
from app_agents.adaptador import ErrorProveedor
from app_agents.demo_a.simulacion import RespondedorSimulado
from app_agents.plan import RAIZ_REPO

PLAN_V14 = "plans/demo-a/v1.4.json"
LOTE_200 = "data/casos/demo-a/planlang-a-001-200.json"
CORRIDA = "simulado-v1.4-respaldo"
# Caso → (esquema que falla, tipo de error). A-001 aprueba, A-004 niega (la persona lo decide con su causal)
# y A-008 pide aclaraciones: falla la pregunta, no la extracción.
FALLAS: dict[str, tuple[str, str]] = {
    "A-001": ("Extraccion", "otro"),
    "A-004": ("Extraccion", "timeout"),
    "A-008": ("PreguntaAclaracion", "esquema_invalido"),
}


def con_fallas(fallas: dict[str, tuple[str, str]]) -> type[RespondedorSimulado]:
    class RespondedorConFallas(RespondedorSimulado):
        def __call__(self, peticion: dict[str, Any]) -> Any:
            titulo = (peticion.get("json_schema") or {}).get("title")
            falla = fallas.get(self.caso["id"])
            if falla is not None and titulo == falla[0]:
                raise ErrorProveedor(falla[1], "simulado", 0.01)
            return super().__call__(peticion)

    return RespondedorConFallas


def generar(salida: Path, fallas: dict[str, tuple[str, str]] = FALLAS, n: int = 8) -> lotes.ResumenSesion:
    previo = lotes.RespondedorSimulado
    lotes.RespondedorSimulado = con_fallas(fallas)  # type: ignore[misc]
    try:
        return lotes.ejecutar_lote(
            corrida_id=CORRIDA,
            fecha="2026-10-01",
            proveedor="simulado",
            plan_ruta=PLAN_V14,
            casos_ruta=LOTE_200,
            salida=salida,
            n=n,
            reloj="fijo",
        )
    finally:
        lotes.RespondedorSimulado = previo  # type: ignore[misc]


if __name__ == "__main__":
    r = generar(RAIZ_REPO / "runs" / "demo-a")
    print(f"{CORRIDA}: {len(r.ejecutados)} casos, {len(r.con_error)} con error → {r.directorio}")
