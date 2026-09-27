"""Salidas estructuradas de los nodos de modelo (Pydantic ↔ `--json-schema`, E-16).

Los JSON Schema van SIN restricciones numéricas ni de longitud (la salida estructurada del proveedor
no las admite todas); los rangos se validan aquí, del lado del código. Los códigos del catálogo son
`enum`: el modelo no puede inventar un procedimiento que no existe.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, create_model, field_validator


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _confianza_en_rango(v: float) -> float:
    if not 0.0 <= v <= 1.0:
        raise ValueError("confianza fuera de [0, 1]")
    return v


def crear_modelo_extraccion(codigos_procedimiento: list[str], codigos_diagnostico: list[str]) -> type[_Base]:
    """`Extraccion`: procedimiento, diagnóstico, urgencia, costo estimado y confianza declarada."""
    Proc = Literal[tuple(codigos_procedimiento)]  # type: ignore[valid-type]
    Diag = Literal[tuple(codigos_diagnostico)]  # type: ignore[valid-type]
    campos: dict[str, Any] = {
        "procedimiento": (Proc | None, ...),
        "diagnostico": (Diag | None, ...),
        "urgencia": (bool, ...),
        "costo_estimado": (int | None, ...),
        "confianza": (float, ...),
    }
    return create_model(
        "Extraccion",
        __base__=_Base,
        __validators__={"_rango": field_validator("confianza")(_confianza_en_rango)},
        **campos,
    )


def crear_modelo_extraccion_y_carta(
    codigos_procedimiento: list[str], codigos_diagnostico: list[str]
) -> type[_Base]:
    """Línea base de agente único: extracción + propuesta + carta en UNA llamada."""
    base = crear_modelo_extraccion(codigos_procedimiento, codigos_diagnostico)
    return create_model(
        "ExtraccionYCarta",
        __base__=base,
        propuesta=(Literal["aprobar", "negar"], ...),
        carta_es=(str, ...),
        carta_en=(str, ...),
        acciones=(list[str], ...),
    )


class PreguntaAclaracion(_Base):
    pregunta: str


class Carta(_Base):
    es: str
    en: str
    acciones: list[str]
