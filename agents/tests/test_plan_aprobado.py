"""Gate de contrato sobre un artefacto REAL: la huella del plan aprobado (calculada por TypeScript) se
verifica desde Python con `rfc8785` + `hashlib`. Si los dos canónicos divergen, este test lo dice."""

from __future__ import annotations

from pathlib import Path

import pytest

from app_agents.canonico import HuellaInvalida, leer_verificando

RAIZ = Path(__file__).resolve().parents[2]
PLAN_V1 = RAIZ / "plans" / "demo-a" / "v1.json"


def test_plan_v1_tiene_huella_verificable_desde_python() -> None:
    plan = leer_verificando(PLAN_V1)
    assert plan["estado_aprobacion"] == "aprobado"
    assert plan["id"] == "plan-demo-a" and plan["version"] == "1.0.0"
    assert len(plan["contrato_de_grafo"]["senales_obligatorias_en_traza"]) == 15


def test_un_plan_alterado_no_pasa(tmp_path: Path) -> None:
    texto = PLAN_V1.read_text(encoding="utf-8").replace('"version": "1.0.0"', '"version": "1.0.1"')
    (tmp_path / "alterado.json").write_text(texto, encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_verificando(tmp_path / "alterado.json")
