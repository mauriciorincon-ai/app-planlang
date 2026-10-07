"""Salidas estructuradas de los nodos de modelo del demo B (Pydantic ↔ `--json-schema`).

Como en el A: los JSON Schema van sin restricciones numéricas ni de longitud; los códigos del catálogo son
`enum` (el modelo no puede inventar una actividad ni una jurisdicción) y el resto se valida en código.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, create_model


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _campos_extraccion(codigos_actividad: list[str], codigos_jurisdiccion: list[str]) -> dict[str, Any]:
    Act = Literal[tuple(codigos_actividad)]  # type: ignore[valid-type]
    Jur = Literal[tuple(codigos_jurisdiccion)]  # type: ignore[valid-type]
    return {
        "nombre": (str | None, ...),
        "documento": (str | None, ...),
        "nacimiento": (int | None, ...),
        "nacionalidad": (Jur | None, ...),
        "actividad": (Act | None, ...),
        "ingresos_mensuales": (int | None, ...),
        "jurisdiccion_fondos": (Jur | None, ...),
        "titular_actividad": (str | None, ...),
        "titular_fondos": (str | None, ...),
    }


def crear_modelo_extraccion(codigos_actividad: list[str], codigos_jurisdiccion: list[str]) -> type[_Base]:
    """`ExtraccionB`: los nueve campos de los tres documentos de la solicitud."""
    return create_model(
        "ExtraccionB", __base__=_Base, **_campos_extraccion(codigos_actividad, codigos_jurisdiccion)
    )


class Investigacion(_Base):
    conclusion: Literal["misma_persona", "homonimo"]
    razones_es: str
    razones_en: str


def crear_modelo_extraccion_e_identidad(
    codigos_actividad: list[str], codigos_jurisdiccion: list[str]
) -> type[_Base]:
    """Línea base de agente único: extracción + juicio sobre las listas en UNA llamada."""
    return create_model(
        "ExtraccionEIdentidad",
        __base__=_Base,
        **_campos_extraccion(codigos_actividad, codigos_jurisdiccion),
        conclusion_lista=(Literal["misma_persona", "homonimo", "sin_parecido"], ...),
        entrada_lista=(str | None, ...),
        razones_es=(str, ...),
        razones_en=(str, ...),
    )
