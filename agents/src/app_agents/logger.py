"""Logger estructurado de los agentes (DoD Observabilidad del S1).

Una línea JSON por evento con un vocabulario CERRADO: caso, nodo, señal, latencia, tokens, costo
nominal y error del proveedor. Jamás prompts, jamás texto del caso, jamás variables de entorno:
el logger es superficie (regla 17-bis del kit) y lo que no entra aquí no puede fugarse por aquí.
Solo stdlib: sin structlog ni dependencias extra (superficie mínima para `pip-audit`).
"""

from __future__ import annotations

import json
import logging
import sys
from typing import Any

NOMBRE = "planlang.agents"

CAMPOS_PERMITIDOS: frozenset[str] = frozenset(
    {
        "evento",
        "corrida_id",
        "caso_id",
        "nodo",
        "senal",
        "valor",
        "umbral",
        "rama",
        "latencia_ms",
        "tokens_entrada",
        "tokens_salida",
        "costo_nominal_usd",
        "error_proveedor",
        "proveedor",
        "modelo",
        "n",
        "detalle",
    }
)


class _FormateadorJson(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:  # noqa: A003 - nombre de la API de logging
        base: dict[str, Any] = {
            "nivel": record.levelname,
            "logger": record.name,
            "mensaje": record.getMessage(),
        }
        extra = getattr(record, "campos", None)
        if isinstance(extra, dict):
            base.update(extra)
        return json.dumps(base, ensure_ascii=False, sort_keys=True)


class _StderrVigente(logging.StreamHandler):  # type: ignore[type-arg]
    """Escribe en el `sys.stderr` VIGENTE en cada emisión (no en el que había al crear el logger)."""

    @property  # type: ignore[override]
    def stream(self):  # noqa: ANN201 - la API de logging no tipa `stream`
        return sys.stderr

    @stream.setter
    def stream(self, _valor) -> None:  # noqa: ANN001
        pass


def obtener_logger(nivel: int = logging.INFO) -> logging.Logger:
    log = logging.getLogger(NOMBRE)
    if not log.handlers:
        h = _StderrVigente()
        h.setFormatter(_FormateadorJson())
        log.addHandler(h)
        log.propagate = False
    log.setLevel(nivel)
    return log


def registrar(evento: str, **campos: Any) -> dict[str, Any]:
    """Emite un evento. Un campo fuera del vocabulario es un error de programación, no un log."""
    desconocidos = set(campos) - CAMPOS_PERMITIDOS
    if desconocidos:
        raise ValueError(f"campos fuera del vocabulario del logger: {sorted(desconocidos)}")
    payload = {"evento": evento, **campos}
    obtener_logger().info(evento, extra={"campos": payload})
    return payload
