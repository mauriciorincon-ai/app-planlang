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


class _Caido:
    """El modelo de un interruptor que falla como fallaría su API (con o sin código HTTP)."""

    _llm_type = "caido"

    def __init__(self, error: Exception) -> None:
        self.error = error

    def _generate(self, *a: Any, **kw: Any) -> Any:
        raise self.error

    def with_structured_output(self, schema: Any, **kwargs: Any) -> Any:
        def _falla(_: Any) -> Any:
            raise self.error

        from langchain_core.runnables import RunnableLambda

        return RunnableLambda(_falla)


class RateLimitError(Exception):
    status_code = 429


class APITimeoutError(Exception):
    pass


def test_el_interruptor_clasifica_sus_errores_sin_copiar_el_mensaje() -> None:
    """M-9: un fallo de la API del interruptor llega al lote como `ErrorProveedor`, no suelto."""
    casos = [
        (RateLimitError("cuota del caso A-001"), "limite_de_uso"),
        (APITimeoutError("tardó"), "timeout"),
        (ConnectionError("texto del médico"), "otro"),
    ]
    for error, tipo in casos:
        m = adaptador.InterruptorClasificado(interno=_Caido(error))
        for estructurado in (False, True):
            with pytest.raises(adaptador.ErrorProveedor) as e:
                (m.with_structured_output(Extraccion) if estructurado else m).invoke("hola")
            assert e.value.tipo == tipo
            # Solo la clase (y el código HTTP): el mensaje del proveedor puede traer el contenido del caso.
            assert "A-001" not in str(e.value) and "médico" not in str(e.value)


def test_sin_el_binario_del_cli_el_caso_falla_clasificado() -> None:
    """M-9: un OSError al lanzar `claude` es `ErrorProveedor("otro")`, no algo que tumba la sesión."""

    def sin_binario(*a: Any, **kw: Any) -> Any:
        raise FileNotFoundError("claude")

    m = ChatClaudeCode(ejecutar=sin_binario)
    with pytest.raises(adaptador.ErrorProveedor) as e:
        m.invoke("hola")
    assert e.value.tipo == "otro" and "FileNotFoundError" in str(e.value)
