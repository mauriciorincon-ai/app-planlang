"""`canonico.py`: perfil del emisor, huella y frescura del fixture del gate de contrato."""

from __future__ import annotations

import math
from pathlib import Path

import pytest

from app_agents.canonico import (
    HuellaInvalida,
    ValorNoCanonico,
    con_huella,
    escribir_con_huella,
    fixture_tramposo,
    huella,
    jcs_texto,
    leer_verificando,
    main,
    normalizar,
    texto_bonito,
)

RAIZ = Path(__file__).resolve().parents[2]
FIXTURE = RAIZ / "tests" / "contrato" / "jcs-valores-tramposos.json"


def test_jcs_sigue_rfc8785_en_los_casos_que_importan() -> None:
    assert jcs_texto({"b": 1, "a": [True, None, "x"], "Z": 2}) == '{"Z":2,"a":[true,null,"x"],"b":1}'
    assert jcs_texto(-0.0) == "0"
    assert jcs_texto(1.0) == "1"
    assert jcs_texto(1e21) == "1e+21"
    assert jcs_texto(1e-7) == "1e-7"
    assert jcs_texto(0.1 + 0.2) == "0.30000000000000004"
    assert jcs_texto("é") == '"é"'  # NFC


def test_normalizar_rechaza_lo_no_representable() -> None:
    with pytest.raises(ValorNoCanonico):
        normalizar(math.nan)
    with pytest.raises(ValorNoCanonico):
        normalizar({"a": math.inf})
    with pytest.raises(ValorNoCanonico):
        normalizar(2**53)
    with pytest.raises(ValorNoCanonico):
        normalizar({1: "clave no textual"})
    with pytest.raises(ValorNoCanonico):
        normalizar(object())


def test_huella_ignora_su_propia_clave_y_verifica(tmp_path: Path) -> None:
    obj = {"nombre": "x", "n": 1}
    escrito = escribir_con_huella(tmp_path / "x.json", obj)
    assert escrito["huella"] == huella(obj) == con_huella(obj)["huella"]
    assert leer_verificando(tmp_path / "x.json")["huella"] == escrito["huella"]
    (tmp_path / "x.json").write_text(texto_bonito({**escrito, "n": 2}), encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_verificando(tmp_path / "x.json")
    (tmp_path / "lista.json").write_text("[1]", encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_verificando(tmp_path / "lista.json")


def test_fixture_comprometido_es_fresco() -> None:
    """El fixture versionado debe ser EXACTAMENTE lo que produce el serializador real de hoy."""
    assert FIXTURE.exists(), (
        "genera el fixture: python -m app_agents.canonico --escribir-fixture tests/contrato/…"
    )
    assert FIXTURE.read_text(encoding="utf-8") == texto_bonito(fixture_tramposo())


def test_cli(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    ruta = tmp_path / "f.json"
    assert main(["--escribir-fixture", str(ruta)]) == 0
    assert ruta.exists()
    escribir_con_huella(tmp_path / "h.json", {"a": 1})
    assert main(["--verificar", str(tmp_path / "h.json"), "--huella", str(tmp_path / "h.json")]) == 0
    (tmp_path / "h.json").write_text('{"a": 2, "huella": "mala"}', encoding="utf-8")
    assert main(["--verificar", str(tmp_path / "h.json")]) == 1
    assert "huella declarada" in capsys.readouterr().err
