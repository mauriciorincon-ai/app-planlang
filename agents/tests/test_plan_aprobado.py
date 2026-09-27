"""Gate de contrato sobre un artefacto REAL: la huella del plan aprobado (calculada por TypeScript) se
verifica desde Python con `rfc8785` + `hashlib`. Si los dos canónicos divergen, este test lo dice."""

from __future__ import annotations

from pathlib import Path

import pytest

from app_agents.canonico import HuellaInvalida, leer_verificando
from app_agents.plan import misma_verdad, plan_por_huella

RAIZ = Path(__file__).resolve().parents[2]
PLAN_V1 = RAIZ / "plans" / "demo-a" / "v1.json"


def test_plan_v1_tiene_huella_verificable_desde_python() -> None:
    plan = leer_verificando(PLAN_V1)
    assert plan["estado_aprobacion"] == "aprobado"
    assert plan["id"] == "plan-demo-a" and plan["version"] == "1.0.0"
    assert len(plan["contrato_de_grafo"]["senales_obligatorias_en_traza"]) == 15


def test_plan_v1_1_verifica_y_declara_la_senal_de_exentos() -> None:
    plan = leer_verificando(RAIZ / "plans" / "demo-a" / "v1.1.json")
    assert plan["version"] == "1.1.0" and plan["estado_aprobacion"] == "aprobado"
    senales = plan["contrato_de_grafo"]["senales_obligatorias_en_traza"]
    assert "servicio_exento" in senales and len(senales) == 16


def test_un_plan_alterado_no_pasa(tmp_path: Path) -> None:
    texto = PLAN_V1.read_text(encoding="utf-8").replace('"version": "1.0.0"', '"version": "1.0.1"')
    (tmp_path / "alterado.json").write_text(texto, encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_verificando(tmp_path / "alterado.json")


def test_plan_v1_2_es_una_enmienda_de_solo_medicion() -> None:
    v11 = leer_verificando(RAIZ / "plans" / "demo-a" / "v1.1.json")
    v12 = leer_verificando(RAIZ / "plans" / "demo-a" / "v1.2.json")
    assert v12["version"] == "1.2.0" and v12["estado_aprobacion"] == "aprobado"
    assert misma_verdad(v11, v12)
    assert not misma_verdad(leer_verificando(PLAN_V1), v11)  # v1.1 sí cambió el contrato de grafo
    r5 = next(r for r in v12["riesgos"] if r["id"] == "R5")
    assert r5["detector_en_trazas"]["condicion"] == "extraccion.campos != verdad_conocida.campos"


def test_plan_por_huella_encuentra_el_plan_con_que_se_genero_un_lote() -> None:
    v11 = leer_verificando(RAIZ / "plans" / "demo-a" / "v1.1.json")
    encontrado = plan_por_huella(RAIZ / "plans" / "demo-a", v11["huella"])
    assert encontrado is not None and encontrado.version == "1.1.0"
    assert plan_por_huella(RAIZ / "plans" / "demo-a", "0" * 64) is None
    assert not misma_verdad({"umbrales": []}, {"contrato_de_grafo": {}})
