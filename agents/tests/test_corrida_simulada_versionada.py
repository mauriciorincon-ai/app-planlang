"""Gate de determinismo del exportador (CI): la corrida simulada versionada `runs/demo-a/simulado-3casos`
se regenera y debe dar LOS MISMOS BYTES. Si alguien cambia el grafo, un nodo, el exportador, el lote de
humo o una respuesta del proveedor simulado sin regenerarla, este test lo nombra.
Regenerar: `agents/.venv/bin/python -m app_agents.lotes --proveedor simulado \
  --casos data/casos/demo-a/planlang-a-humo-3.json --corrida simulado-3casos --fecha 2026-09-27`."""

from __future__ import annotations

from pathlib import Path

from app_agents.lotes import ejecutar_lote
from app_agents.plan import RAIZ_REPO

VERSIONADA = RAIZ_REPO / "runs" / "demo-a" / "simulado-3casos"


def test_la_corrida_simulada_versionada_se_regenera_identica(tmp_path: Path) -> None:
    ejecutar_lote(
        corrida_id="simulado-3casos",
        fecha="2026-09-27",
        proveedor="simulado",
        casos_ruta="data/casos/demo-a/planlang-a-humo-3.json",
        salida=tmp_path,
        reloj="fijo",
    )
    nueva = tmp_path / "simulado-3casos"
    archivos = sorted(p.relative_to(VERSIONADA) for p in VERSIONADA.rglob("*.json"))
    assert archivos == sorted(p.relative_to(nueva) for p in nueva.rglob("*.json"))
    for f in archivos:
        assert (nueva / f).read_bytes() == (VERSIONADA / f).read_bytes(), f"difiere: {f}"
