"""`ChatSimulado` es un proveedor de primera clase: mismo camino que los reales, determinista, sin red."""

from __future__ import annotations

from typing import Any

import pytest
from pydantic import BaseModel, ConfigDict

from app_agents import adaptador
from app_agents.adaptador import ChatClaudeCode, ChatSimulado, crear_modelo, proveedor_activo


class Extraccion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    procedimiento: str
    confianza: float


def respondedor(peticion: dict[str, Any]) -> Any:
    if peticion["json_schema"] is None:
        return "OK"
    return {"procedimiento": "SYN-P-001", "confianza": 0.9 if "claro" in peticion["prompt"] else 0.4}


def test_es_determinista_y_sigue_al_respondedor() -> None:
    llm = ChatSimulado(respondedor=respondedor)
    a = llm.with_structured_output(Extraccion).invoke("texto claro")
    b = llm.with_structured_output(Extraccion).invoke("texto claro")
    c = llm.with_structured_output(Extraccion).invoke("texto dudoso")
    assert a == b == Extraccion(procedimiento="SYN-P-001", confianza=0.9)
    assert c.confianza == 0.4


def test_texto_libre_y_metadatos_con_el_mismo_vocabulario_que_el_real() -> None:
    msg = ChatSimulado(respondedor=respondedor).invoke("hola")
    assert msg.content == "OK"
    meta = msg.response_metadata
    assert meta["proveedor"] == "simulado" and meta["total_cost_usd"] == 0.0 and meta["is_error"] is False
    assert set(meta["usage"]) == {
        "input_tokens",
        "output_tokens",
        "cache_creation_input_tokens",
        "cache_read_input_tokens",
    }


def test_crear_modelo_conmuta_por_variable_de_entorno(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(adaptador.VARIABLE_PROVEEDOR, "simulado")
    assert proveedor_activo() == "simulado"
    assert isinstance(crear_modelo(), ChatSimulado)
    monkeypatch.setenv(adaptador.VARIABLE_PROVEEDOR, "suscripcion")
    m = crear_modelo()
    assert isinstance(m, ChatClaudeCode) and m.modelo == "sonnet"
    monkeypatch.setenv(adaptador.VARIABLE_PROVEEDOR, "inventado")
    with pytest.raises(ValueError):
        proveedor_activo()
