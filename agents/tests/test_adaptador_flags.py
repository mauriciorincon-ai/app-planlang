"""Gate 7-S sin red: el adaptador invoca el binario EXACTAMENTE como manda la regla 6 y con `env` limpio.

Corre siempre (CI incluida): `subprocess.run` se sustituye por un doble que captura argv, env y cwd.
Demo en rojo registrada en la bitácora del S1: quitar `--strict-mcp-config` de `argv_claude`.
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

import pytest
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict

from app_agents import adaptador
from app_agents.adaptador import (
    VARIABLES_PROHIBIDAS_EN_HIJO,
    ChatClaudeCode,
    ErrorProveedor,
    argv_claude,
    entorno_hijo,
    tokens_de_contexto,
)

RAIZ_REPO = Path(__file__).resolve().parents[2]

RESPUESTA_CLI: dict[str, Any] = {
    "type": "result",
    "subtype": "success",
    "is_error": False,
    "result": '{"ok": true, "n": 7}',
    "structured_output": {"ok": True, "n": 7},
    "session_id": "sesion-que-no-debe-persistir",
    "uuid": "uuid-que-no-debe-persistir",
    "total_cost_usd": 0.01,
    "duration_ms": 1234,
    "duration_api_ms": 1000,
    "num_turns": 1,
    "usage": {
        "input_tokens": 2,
        "cache_creation_input_tokens": 1100,
        "cache_read_input_tokens": 300,
        "output_tokens": 12,
        "service_tier": "standard",
    },
}


class Doble:
    """Captura la llamada al binario y devuelve un JSON del CLI."""

    def __init__(self, stdout: str | None = None, rc: int = 0, stderr: str = "", timeout: bool = False):
        self.llamadas: list[dict[str, Any]] = []
        self.stdout = json.dumps(RESPUESTA_CLI) if stdout is None else stdout
        self.rc, self.stderr, self.timeout = rc, stderr, timeout

    def __call__(self, cmd: list[str], **kw: Any) -> subprocess.CompletedProcess[str]:
        self.llamadas.append({"cmd": cmd, **kw})
        if self.timeout:
            raise subprocess.TimeoutExpired(cmd, kw.get("timeout", 0))
        return subprocess.CompletedProcess(cmd, self.rc, self.stdout, self.stderr)


class Salida(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ok: bool
    n: int


def test_argv_es_exactamente_el_de_la_regla_6() -> None:
    esperado = [
        adaptador.CLAUDE_BIN,
        "-p",
        "--output-format",
        "json",
        "--model",
        "sonnet",
        "--max-turns",
        "1",
        "--no-session-persistence",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--setting-sources",
        "",
        "--tools",
        "",
        "--system-prompt",
        "SP",
        "--json-schema",
        '{"type":"object"}',
    ]
    assert argv_claude("sonnet", "SP", {"type": "object"}) == esperado
    assert "--bare" not in argv_claude("sonnet", "SP")  # --bare desactiva la suscripción (spike, hallazgo 1)


def test_env_del_hijo_no_lleva_claves_ni_anidamiento(monkeypatch: pytest.MonkeyPatch) -> None:
    for v in VARIABLES_PROHIBIDAS_EN_HIJO:
        monkeypatch.setenv(v, "valor-que-no-debe-viajar")
    monkeypatch.setenv("PATH", os.environ.get("PATH", ""))
    env = entorno_hijo()
    assert not (set(env) & set(VARIABLES_PROHIBIDAS_EN_HIJO))
    assert "PATH" in env
    assert "valor-que-no-debe-viajar" not in json.dumps(env)


def test_invoke_usa_cwd_temporal_vacio_fuera_del_repo_y_env_limpio(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-falsa")
    monkeypatch.setenv("LANGSMITH_API_KEY", "lsv2_falsa")
    doble = Doble()
    llm = ChatClaudeCode(ejecutar=doble)
    msg = llm.invoke([SystemMessage("SP"), HumanMessage("hola")])

    llamada = doble.llamadas[0]
    cwd = Path(llamada["cwd"])
    assert cwd.is_dir() and list(cwd.iterdir()) == []  # vacío: sin CLAUDE.md ni .claude/
    assert RAIZ_REPO not in cwd.parents and cwd != RAIZ_REPO  # fuera del repo
    assert "ANTHROPIC_API_KEY" not in llamada["env"] and "LANGSMITH_API_KEY" not in llamada["env"]
    assert llamada["input"] == "hola"
    assert llamada["cmd"][-1] == "SP"  # el system prompt es el propio, no el del CLI

    # Metadatos: usage, costo y duración SÍ; session_id/uuid JAMÁS (ni en metadata ni en kwargs).
    meta = msg.response_metadata
    assert meta["usage"] == {
        "input_tokens": 2,
        "output_tokens": 12,
        "cache_creation_input_tokens": 1100,
        "cache_read_input_tokens": 300,
    }
    assert meta["total_cost_usd"] == 0.01 and meta["duration_ms"] == 1234 and meta["subtype"] == "success"
    serializado = json.dumps({"meta": meta, "kwargs": msg.additional_kwargs})
    assert "sesion-que-no-debe-persistir" not in serializado and "uuid-que-no-debe" not in serializado
    assert tokens_de_contexto(msg) == 1402
    assert msg.usage_metadata is not None and msg.usage_metadata["output_tokens"] == 12


def test_with_structured_output_delega_en_json_schema_y_valida() -> None:
    doble = Doble()
    llm = ChatClaudeCode(ejecutar=doble)
    salida = llm.with_structured_output(Salida).invoke([SystemMessage("SP"), HumanMessage("x")])
    assert salida == Salida(ok=True, n=7)
    cmd = doble.llamadas[0]["cmd"]
    assert "--json-schema" in cmd
    esquema = json.loads(cmd[cmd.index("--json-schema") + 1])
    assert esquema["additionalProperties"] is False and set(esquema["required"]) == {"ok", "n"}


def test_salida_invalida_se_reintenta_dos_veces_y_luego_es_esquema_invalido() -> None:
    malo = dict(RESPUESTA_CLI, structured_output={"ok": "no-es-bool"}, result="")
    doble = Doble(stdout=json.dumps(malo))
    llm = ChatClaudeCode(ejecutar=doble)
    with pytest.raises(ErrorProveedor) as e:
        llm.with_structured_output(Salida).invoke("x")
    assert e.value.tipo == "esquema_invalido"
    assert len(doble.llamadas) == 3  # 1 intento + 2 reintentos (§ 9.1)


@pytest.mark.parametrize(
    ("doble", "tipo"),
    [
        (Doble(rc=1, stderr="Error: usage limit reached, resets at 3pm"), "limite_de_uso"),
        (Doble(rc=1, stderr="algo raro"), "otro"),
        (Doble(timeout=True), "timeout"),
        (Doble(stdout="no es json"), "otro"),
        (
            Doble(
                stdout=json.dumps(
                    dict(RESPUESTA_CLI, is_error=True, subtype="error_max_structured_output_retries")
                )
            ),
            "esquema_invalido",
        ),
        (
            Doble(stdout=json.dumps(dict(RESPUESTA_CLI, is_error=True, subtype="error_max_budget_usd"))),
            "limite_de_uso",
        ),
    ],
)
def test_clasificacion_de_fallos_del_proveedor(doble: Doble, tipo: str) -> None:
    llm = ChatClaudeCode(ejecutar=doble, timeout_s=1)
    with pytest.raises(ErrorProveedor) as e:
        llm.invoke("x")
    assert e.value.tipo == tipo


def test_error_proveedor_solo_admite_el_vocabulario_de_la_traza() -> None:
    with pytest.raises(ValueError):
        ErrorProveedor("inventado")
