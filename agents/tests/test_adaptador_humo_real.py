"""Humo REAL del adaptador (spike P1, P2, P6 + tamaño de contexto). Solo con PLANLANG_HUMO_REAL=1.

Es la prueba que exige el estándar 7-S: se corre en la máquina del usuario con su suscripción,
jamás en CI. Su resultado se registra en la bitácora del sprint con fecha, tokens y costo nominal.
"""

from __future__ import annotations

import os

import pytest
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict

from app_agents.adaptador import ChatClaudeCode, tokens_de_contexto

humo_real = pytest.mark.skipif(
    os.environ.get("PLANLANG_HUMO_REAL") != "1",
    reason="humo real solo con PLANLANG_HUMO_REAL=1 (fuera de CI, suscripción del usuario)",
)

TECHO_TOKENS_CONTEXTO = 2500  # orden S1: con MCP vacío, --tools "" y system prompt propio, ~1,3–1,6 mil
SISTEMA = "Eres un asistente mínimo de una prueba de humo. Responde solo lo pedido. No uses herramientas."


class Sonda(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ok: bool
    n: int


@humo_real
def test_p1_autenticacion_por_suscripcion_sin_clave_de_api() -> None:
    assert "ANTHROPIC_API_KEY" not in os.environ, "la prueba debe correr SIN clave de API en el shell"
    msg = ChatClaudeCode(timeout_s=120).invoke(
        [SystemMessage(SISTEMA), HumanMessage("Responde exactamente: OK")]
    )
    assert msg.content.strip() == "OK"
    assert msg.response_metadata["is_error"] is False
    assert msg.response_metadata["total_cost_usd"] is not None  # nominal: consume cuota, no factura


@humo_real
def test_p2_salida_estructurada_nativa_y_contexto_bajo_techo() -> None:
    llm = ChatClaudeCode(timeout_s=120)
    salida = llm.with_structured_output(Sonda, include_raw=True).invoke(
        [SystemMessage(SISTEMA), HumanMessage("Responde con ok=true y n=7")]
    )
    assert salida["parsed"] == Sonda(ok=True, n=7)
    msg = salida["raw"]
    assert msg.additional_kwargs.get("structured_output") == {"ok": True, "n": 7}
    contexto = tokens_de_contexto(msg)
    assert 0 < contexto <= TECHO_TOKENS_CONTEXTO, f"contexto por llamada: {contexto} tokens"


@humo_real
def test_p6_invocacion_anidada_desde_una_sesion_de_claude_code() -> None:
    # Cuando corre DENTRO de una sesión de Claude Code, CLAUDECODE=1 está en el entorno del padre;
    # el adaptador lo quita del hijo (variante B del spike) y la llamada debe seguir funcionando.
    msg = ChatClaudeCode(timeout_s=120).invoke(
        [SystemMessage(SISTEMA), HumanMessage("Responde exactamente: OK")]
    )
    assert msg.content.strip() == "OK"
