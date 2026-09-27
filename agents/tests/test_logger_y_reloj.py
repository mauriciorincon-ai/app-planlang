"""El logger tiene vocabulario cerrado (jamás prompts ni env) y el reloj fijo es determinista."""

from __future__ import annotations

import json
import logging

import pytest

from app_agents.logger import CAMPOS_PERMITIDOS, obtener_logger, registrar
from app_agents.reloj import RelojFijo, RelojReal


def test_registrar_emite_json_con_vocabulario_cerrado(capsys: pytest.CaptureFixture[str]) -> None:
    obtener_logger(logging.INFO)
    payload = registrar("nodo_fin", caso_id="A-001", nodo="extractor", latencia_ms=12, tokens_entrada=3)
    assert payload["evento"] == "nodo_fin"
    linea = capsys.readouterr().err.strip().splitlines()[-1]
    d = json.loads(linea)
    assert d["caso_id"] == "A-001" and d["nodo"] == "extractor" and d["latencia_ms"] == 12
    assert set(d) - {"nivel", "logger", "mensaje"} <= CAMPOS_PERMITIDOS


def test_un_campo_fuera_del_vocabulario_es_error() -> None:
    with pytest.raises(ValueError):
        registrar("nodo_fin", prompt="texto que jamás debe loguearse")


def test_reloj_fijo_avanza_un_paso_por_lectura_y_el_real_no_retrocede() -> None:
    fijo = RelojFijo(paso_ms=5)
    assert [fijo.ahora_ms() for _ in range(3)] == [0, 5, 10]
    real = RelojReal()
    a, b = real.ahora_ms(), real.ahora_ms()
    assert 0 <= a <= b
