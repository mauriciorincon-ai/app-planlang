"""Gate de determinismo de AU-9 (CI): la corrida versionada `runs/demo-a/simulado-v1.4-respaldo` se
regenera y debe dar LOS MISMOS BYTES. Es el fixture que Python escribe con su exportador real para que
TypeScript lea una traza con respaldo (regla 19).
Regenerar: `agents/.venv/bin/python agents/tests/respaldo_simulado.py`."""

from __future__ import annotations

from pathlib import Path

from respaldo_simulado import CORRIDA, FALLAS, generar

from app_agents.canonico import leer_verificando
from app_agents.plan import RAIZ_REPO

VERSIONADA = RAIZ_REPO / "runs" / "demo-a" / CORRIDA


def test_la_corrida_con_respaldo_se_regenera_identica(tmp_path: Path) -> None:
    generar(tmp_path)
    nueva = tmp_path / CORRIDA
    archivos = sorted(
        p.relative_to(VERSIONADA) for p in VERSIONADA.rglob("*.json") if p.name != "informe.json"
    )
    assert archivos == sorted(p.relative_to(nueva) for p in nueva.rglob("*.json"))
    for f in archivos:
        assert (nueva / f).read_bytes() == (VERSIONADA / f).read_bytes(), f"difiere: {f}"


def test_cada_falla_paso_a_una_persona() -> None:
    for caso in FALLAS:
        t = leer_verificando(VERSIONADA / "trazas" / f"{caso}.json")
        assert t["resultado"] == "completo" and t["senales"]["proveedor_no_disponible"] is True
        assert "pausa_humana" in t["nodos_visitados"]
