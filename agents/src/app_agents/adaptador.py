"""Adaptador de modelo de chat para LangChain 1.x (planlang, regla 6 de la constitución · estándar 7-S).

Tres proveedores detrás de una sola interfaz (`crear_modelo`):

- ``ChatClaudeCode``: la SUSCRIPCIÓN de Claude Code del usuario, invocando el binario oficial sin
  modificar en modo no interactivo (``claude -p``). Flags exactos de la regla 6; cwd = directorio
  temporal limpio (la constitución de la app jamás entra al prompt); ``env`` del hijo sin claves de
  API ni de LangSmith; ``--json-schema`` como salida estructurada nativa; ``usage`` y
  ``total_cost_usd`` en ``response_metadata``. Nunca ``--bare`` (desactiva la suscripción).
- ``ChatSimulado``: proveedor determinista de primera clase para tests y CI (RNF-07). La CI solo
  conoce este proveedor: el binario jamás se invoca en un job.
- ``anthropic`` / ``groq``: el interruptor a proveedor por clave (ADR 002), con extras opcionales.

Lo que este módulo NO hace: no lee ni escribe credenciales, no persiste ``session_id`` ni ``uuid``
del CLI, no conoce el dominio del demo.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import time
from collections.abc import Callable, Sequence
from typing import Any

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import Runnable, RunnableLambda
from pydantic import BaseModel, Field, ValidationError

CLAUDE_BIN: str = shutil.which("claude") or "claude"
MODELO_POR_DEFECTO = "sonnet"  # plan del demo A, decisión D6

# El token de la suscripción jamás sale del binario (7-S). Estas variables NO viajan al subproceso:
# las de clave por si el usuario las tiene en su shell (con ANTHROPIC_API_KEY presente, `claude -p`
# la usaría SIEMPRE en vez de la suscripción), las de LangSmith (el hijo no traza nada) y las de
# anidamiento (P6 del spike: el hijo no debe creerse sesión anidada).
VARIABLES_PROHIBIDAS_EN_HIJO: tuple[str, ...] = (
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "CLAUDE_CODE_OAUTH_TOKEN",
    "LANGSMITH_API_KEY",
    "LANGCHAIN_API_KEY",
    "LANGSMITH_TRACING",
    "LANGCHAIN_TRACING_V2",
    "CLAUDECODE",
    "CLAUDE_CODE_CHILD_SESSION",
)

TIPOS_ERROR_PROVEEDOR: tuple[str, ...] = ("limite_de_uso", "timeout", "esquema_invalido", "otro")
REINTENTOS_ESQUEMA = 2  # § 9.1 de la especificación: una salida inválida se reintenta máximo dos veces

# Claves del JSON del CLI que SÍ se conservan en response_metadata. Todo lo demás (session_id,
# uuid, permission_denials, …) se descarta: ni identificadores de sesión ni nada que huela a
# credencial entra a trazas, LangSmith o el repo.
CLAVES_CLI_CONSERVADAS: tuple[str, ...] = (
    "total_cost_usd",
    "duration_ms",
    "duration_api_ms",
    "num_turns",
    "subtype",
    "is_error",
)


class ErrorProveedor(RuntimeError):
    """Falla del proveedor, clasificada con el vocabulario que la traza registra (`error_proveedor`).

    `costo_usd`: costo nominal que el intento fallido igual consumió (lo reporta el CLI), para que los
    reintentos no desaparezcan del costo de la corrida.
    """

    def __init__(self, tipo: str, detalle: str = "", costo_usd: float = 0.0) -> None:
        if tipo not in TIPOS_ERROR_PROVEEDOR:
            raise ValueError(f"tipo de error desconocido: {tipo}")
        self.tipo = tipo
        self.detalle = detalle
        self.costo_usd = costo_usd
        super().__init__(f"{tipo}: {detalle}" if detalle else tipo)


def argv_claude(
    modelo: str, system_prompt: str, json_schema: dict[str, Any] | None = None, max_turns: int = 1
) -> list[str]:
    """La línea de comando EXACTA de la regla 6. Un test la compara literalmente (gate 7-S)."""
    cmd = [
        CLAUDE_BIN,
        "-p",
        "--output-format",
        "json",
        "--model",
        modelo,
        "--max-turns",
        str(max_turns),
        "--no-session-persistence",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--setting-sources",
        "",
        "--tools",
        "",
        "--system-prompt",
        system_prompt,
    ]
    if json_schema is not None:
        cmd += ["--json-schema", json.dumps(json_schema, ensure_ascii=False, separators=(",", ":"))]
    return cmd


def entorno_hijo(base: dict[str, str] | None = None) -> dict[str, str]:
    """Copia del entorno sin ninguna variable prohibida (7-S: el token jamás entra a `env`)."""
    origen = os.environ if base is None else base
    return {k: v for k, v in origen.items() if k not in VARIABLES_PROHIBIDAS_EN_HIJO}


def cwd_limpio() -> str:
    """Directorio temporal vacío, fuera de todo repo: sin CLAUDE.md, sin .claude/, sin settings."""
    return tempfile.mkdtemp(prefix="planlang-claude-")


def _es_limite(texto: str) -> bool:
    t = texto.lower()
    return any(p in t for p in ("usage limit", "rate limit", "limit reached", "too many requests", "429"))


def _clasificar_is_error(data: dict[str, Any], con_esquema: bool) -> ErrorProveedor:
    """El CLI reporta el fallo en su JSON (`is_error` + `subtype`), a veces con rc = 1 y stderr vacío.

    Con `--json-schema` y `--max-turns 1`, el modelo a veces necesita un segundo turno para entregar la
    salida estructurada y el CLI corta con `error_max_turns` (hallazgo de la corrida real del S1): es una
    salida estructurada que no llegó, así que cuenta como `esquema_invalido` y se reintenta (§ 9.1).
    """
    subtipo = str(data.get("subtype") or "")
    costo = float(data.get("total_cost_usd") or 0.0)
    if "structured_output" in subtipo or (con_esquema and "max_turns" in subtipo):
        return ErrorProveedor("esquema_invalido", subtipo, costo)
    if "budget" in subtipo or "limit" in subtipo:
        return ErrorProveedor("limite_de_uso", subtipo, costo)
    return ErrorProveedor("otro", subtipo or "is_error", costo)


def _clasificar_fallo(rc: int, stderr: str, stdout: str = "", con_esquema: bool = False) -> ErrorProveedor:
    if _es_limite(stderr):
        return ErrorProveedor("limite_de_uso", stderr[-400:])
    try:
        data = json.loads(stdout) if stdout.strip() else None
    except json.JSONDecodeError:
        data = None
    if isinstance(data, dict) and data.get("is_error"):
        return _clasificar_is_error(data, con_esquema)
    return ErrorProveedor("otro", f"rc={rc}: {stderr[-400:]}")


def _usage_limpio(usage: dict[str, Any]) -> dict[str, int]:
    """Solo conteos enteros de tokens; nada de sub-objetos del proveedor."""
    claves = ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")
    return {k: int(usage.get(k) or 0) for k in claves}


class ChatClaudeCode(BaseChatModel):
    """Claude por la suscripción de Claude Code del usuario (binario oficial, `claude -p`)."""

    modelo: str = MODELO_POR_DEFECTO
    json_schema: dict[str, Any] | None = None
    max_turns: int = 1
    timeout_s: int = 180
    cwd: str | None = None  # se crea perezosamente; siempre temporal y limpio
    ejecutar: Callable[..., subprocess.CompletedProcess[str]] = Field(default=subprocess.run, exclude=True)

    @property
    def _llm_type(self) -> str:
        return "claude-code-suscripcion"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {
            "modelo": self.modelo,
            "max_turns": self.max_turns,
            "json_schema": self.json_schema is not None,
        }

    def _directorio(self) -> str:
        if self.cwd is None or not os.path.isdir(self.cwd):
            self.cwd = cwd_limpio()
        return self.cwd

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        system = "\n".join(str(m.content) for m in messages if isinstance(m, SystemMessage))
        prompt = "\n\n".join(str(m.content) for m in messages if not isinstance(m, SystemMessage))
        cmd = argv_claude(self.modelo, system, self.json_schema, self.max_turns)
        t0 = time.monotonic()
        try:
            proc = self.ejecutar(
                cmd,
                input=prompt,
                capture_output=True,
                text=True,
                timeout=self.timeout_s,
                env=entorno_hijo(),
                cwd=self._directorio(),
            )
        except subprocess.TimeoutExpired as e:
            raise ErrorProveedor("timeout", f"{self.timeout_s}s") from e
        latencia_ms = int((time.monotonic() - t0) * 1000)
        con_esquema = self.json_schema is not None
        if proc.returncode != 0:
            raise _clasificar_fallo(proc.returncode, proc.stderr or "", proc.stdout or "", con_esquema)
        try:
            data = json.loads(proc.stdout)
        except json.JSONDecodeError as e:
            raise ErrorProveedor("otro", "el CLI no devolvió JSON") from e
        if data.get("is_error"):
            raise _clasificar_is_error(data, con_esquema)

        texto = data.get("result") or ""
        usage = _usage_limpio(data.get("usage") or {})
        meta: dict[str, Any] = {
            "proveedor": "suscripcion-claude-code",
            "modelo_pedido": self.modelo,
            "usage": usage,
            "latencia_ms": latencia_ms,
            **{k: data.get(k) for k in CLAVES_CLI_CONSERVADAS},
        }
        msg = AIMessage(
            content=texto if isinstance(texto, str) else json.dumps(texto, ensure_ascii=False),
            additional_kwargs={"structured_output": data.get("structured_output")},
            response_metadata=meta,
            usage_metadata={
                "input_tokens": usage["input_tokens"]
                + usage["cache_creation_input_tokens"]
                + usage["cache_read_input_tokens"],
                "output_tokens": usage["output_tokens"],
                "total_tokens": sum(usage.values()),
            },
        )
        return ChatResult(generations=[ChatGeneration(message=msg)])

    def with_structured_output(self, schema: Any, *, include_raw: bool = False, **kwargs: Any) -> Runnable:
        """Salida estructurada NATIVA vía `--json-schema` (E-16). No usa tool calling.

        Devuelve el objeto Pydantic validado (o el dict, si `schema` es un JSON Schema). Una salida
        que no valide se reintenta hasta REINTENTOS_ESQUEMA veces y luego es `esquema_invalido`.
        """
        json_schema, modelo_pydantic = _esquema_y_modelo(schema)
        llm = self.model_copy(update={"json_schema": json_schema})
        return RunnableLambda(
            lambda entrada: _invocar_estructurado(llm, entrada, modelo_pydantic, include_raw)
        )


def _esquema_y_modelo(schema: Any) -> tuple[dict[str, Any], type[BaseModel] | None]:
    if isinstance(schema, type) and issubclass(schema, BaseModel):
        return schema.model_json_schema(), schema
    if isinstance(schema, dict):
        return schema, None
    raise TypeError("schema debe ser un modelo Pydantic o un JSON Schema (dict)")


def _extraer_estructurado(msg: AIMessage) -> Any:
    estructurado = msg.additional_kwargs.get("structured_output")
    if estructurado is not None:
        return estructurado
    return json.loads(str(msg.content))  # fallback: el CLI devolvió el JSON en `result`


def _invocar_estructurado(
    llm: BaseChatModel, entrada: Any, modelo: type[BaseModel] | None, include_raw: bool
) -> Any:
    """Hasta 1 + REINTENTOS_ESQUEMA intentos. El mensaje devuelto declara cuántos reintentos hubo y el
    costo nominal de los intentos fallidos: la traza no esconde la inestabilidad del proveedor."""
    ultimo: Exception | None = None
    costo_fallidos = 0.0
    for intento in range(REINTENTOS_ESQUEMA + 1):
        try:
            msg = llm.invoke(entrada)
        except ErrorProveedor as e:
            if e.tipo != "esquema_invalido":
                raise
            ultimo, costo_fallidos = e, costo_fallidos + e.costo_usd
            continue
        try:
            crudo = _extraer_estructurado(msg)
            parsed = modelo.model_validate(crudo) if modelo is not None else crudo
        except (ValidationError, json.JSONDecodeError, TypeError) as e:
            ultimo = e
            costo_fallidos += float((msg.response_metadata or {}).get("total_cost_usd") or 0.0)
            continue
        msg.response_metadata["reintentos_esquema"] = intento
        msg.response_metadata["costo_reintentos_usd"] = round(costo_fallidos, 6)
        return {"raw": msg, "parsed": parsed, "parsing_error": None} if include_raw else parsed
    raise ErrorProveedor("esquema_invalido", str(ultimo)[:300], costo_fallidos)


# --------------------------------------------------------------------------------------------------
# Proveedor simulado (primera clase: mismo camino de código, cero red)
# --------------------------------------------------------------------------------------------------

Respondedor = Callable[[dict[str, Any]], Any]


def _respondedor_eco(peticion: dict[str, Any]) -> Any:
    """Por defecto: sin esquema devuelve 'OK'; con esquema, un objeto vacío (los tests inyectan el suyo)."""
    return {} if peticion.get("json_schema") else "OK"


class ChatSimulado(BaseChatModel):
    """Proveedor determinista: responde con `respondedor(peticion)` y usage fijo por tamaño de texto.

    `peticion` = {"system": str, "prompt": str, "json_schema": dict | None}. El demo A inyecta un
    respondedor que sigue la verdad conocida del caso con ruido determinista por semilla.
    """

    modelo: str = "simulado"
    json_schema: dict[str, Any] | None = None
    respondedor: Respondedor = Field(default=_respondedor_eco, exclude=True)
    latencia_ms_fija: int = 0

    @property
    def _llm_type(self) -> str:
        return "simulado"

    @property
    def _identifying_params(self) -> dict[str, Any]:
        return {"modelo": self.modelo}

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: CallbackManagerForLLMRun | None = None,
        **kwargs: Any,
    ) -> ChatResult:
        system = "\n".join(str(m.content) for m in messages if isinstance(m, SystemMessage))
        prompt = "\n\n".join(str(m.content) for m in messages if not isinstance(m, SystemMessage))
        respuesta = self.respondedor({"system": system, "prompt": prompt, "json_schema": self.json_schema})
        if isinstance(respuesta, BaseModel):
            respuesta = respuesta.model_dump(mode="json")
        estructurado = respuesta if isinstance(respuesta, dict | list) else None
        texto = respuesta if isinstance(respuesta, str) else json.dumps(respuesta, ensure_ascii=False)
        entrada = (len(system) + len(prompt)) // 4
        salida = len(texto) // 4
        usage = {
            "input_tokens": entrada,
            "output_tokens": salida,
            "cache_creation_input_tokens": 0,
            "cache_read_input_tokens": 0,
        }
        msg = AIMessage(
            content=texto,
            additional_kwargs={"structured_output": estructurado},
            response_metadata={
                "proveedor": "simulado",
                "modelo_pedido": self.modelo,
                "usage": usage,
                "latencia_ms": self.latencia_ms_fija,
                "total_cost_usd": 0.0,
                "duration_ms": self.latencia_ms_fija,
                "duration_api_ms": self.latencia_ms_fija,
                "num_turns": 1,
                "subtype": "success",
                "is_error": False,
            },
            usage_metadata={
                "input_tokens": entrada,
                "output_tokens": salida,
                "total_tokens": entrada + salida,
            },
        )
        return ChatResult(generations=[ChatGeneration(message=msg)])

    def with_structured_output(self, schema: Any, *, include_raw: bool = False, **kwargs: Any) -> Runnable:
        json_schema, modelo_pydantic = _esquema_y_modelo(schema)
        llm = self.model_copy(update={"json_schema": json_schema})
        return RunnableLambda(
            lambda entrada: _invocar_estructurado(llm, entrada, modelo_pydantic, include_raw)
        )


# --------------------------------------------------------------------------------------------------
# Interruptor de proveedor (un solo lugar; cambiar de proveedor no cambia el grafo — RF-04.8)
# --------------------------------------------------------------------------------------------------

PROVEEDORES: tuple[str, ...] = ("suscripcion", "simulado", "anthropic", "groq")
VARIABLE_PROVEEDOR = "PLANLANG_PROVEEDOR"
VARIABLE_MODELO_INTERRUPTOR = "PLANLANG_MODELO_INTERRUPTOR"
# ADR 002: interruptor a proveedor por clave, con techo declarado. (El nombre evita la palabra «api»:
# gitleaks marca un literal con entropía junto a ella como clave — falso positivo cazado en el S1.)
MODELO_ANTHROPIC_POR_DEFECTO = "claude-haiku-4-5-20251001"
MODELO_GROQ_POR_DEFECTO = "openai/gpt-oss-120b"


def proveedor_activo() -> str:
    valor = os.environ.get(VARIABLE_PROVEEDOR, "suscripcion")
    if valor not in PROVEEDORES:
        raise ValueError(f"{VARIABLE_PROVEEDOR}={valor!r}; válidos: {', '.join(PROVEEDORES)}")
    return valor


def crear_modelo(
    proveedor: str | None = None,
    *,
    modelo: str | None = None,
    respondedor: Respondedor | None = None,
    timeout_s: int = 180,
) -> BaseChatModel:
    """Único punto de creación del modelo. `proveedor` por defecto sale de PLANLANG_PROVEEDOR."""
    p = proveedor or proveedor_activo()
    if p == "suscripcion":
        return ChatClaudeCode(modelo=modelo or MODELO_POR_DEFECTO, timeout_s=timeout_s)
    if p == "simulado":
        return ChatSimulado(respondedor=respondedor or _respondedor_eco)
    if p == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic  # extra opcional
        except ImportError as e:  # pragma: no cover - depende del entorno
            raise RuntimeError("instala el extra: pip install -e '.[anthropic]'") from e
        return ChatAnthropic(
            model=modelo or os.environ.get(VARIABLE_MODELO_INTERRUPTOR, MODELO_ANTHROPIC_POR_DEFECTO)
        )
    if p == "groq":
        try:
            from langchain_groq import ChatGroq  # extra opcional
        except ImportError as e:  # pragma: no cover - depende del entorno
            raise RuntimeError("instala el extra: pip install -e '.[groq]'") from e
        return ChatGroq(model=modelo or os.environ.get(VARIABLE_MODELO_INTERRUPTOR, MODELO_GROQ_POR_DEFECTO))
    raise ValueError(p)  # pragma: no cover - proveedor_activo ya valida


def tokens_de_contexto(msg: AIMessage) -> int:
    """Tamaño de contexto de una llamada = entrada + creación de caché + lectura de caché (7-S)."""
    u: dict[str, int] = (msg.response_metadata or {}).get("usage") or {}
    return (
        int(u.get("input_tokens", 0))
        + int(u.get("cache_creation_input_tokens", 0))
        + int(u.get("cache_read_input_tokens", 0))
    )


__all__: Sequence[str] = (
    "ChatClaudeCode",
    "ChatSimulado",
    "ErrorProveedor",
    "PROVEEDORES",
    "VARIABLES_PROHIBIDAS_EN_HIJO",
    "argv_claude",
    "crear_modelo",
    "cwd_limpio",
    "entorno_hijo",
    "proveedor_activo",
    "tokens_de_contexto",
)
