"""Salidas estructuradas de los nodos de modelo del demo B (Pydantic ↔ `--json-schema`).

Como en el A: los JSON Schema van sin restricciones numéricas ni de longitud; los códigos del catálogo son
`enum` (el modelo no puede inventar una actividad ni una jurisdicción) y el resto se valida en código.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, create_model

from .beneficiarios import TOPE_ENTIDADES, TOPE_PARTICIPACIONES, TOPE_PERSONAS


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


# ── S9 (plan B v1.2): la persona jurídica y su estructura societaria ────────────────────────────────

# : Quién controla una sociedad, del catálogo de la norma (31 CFR § 1010.230(d)(2)(i)); el modelo no inventa
# un cargo.
ROLES_DE_CONTROL = (
    "representante_legal",
    "gerente_general",
    "presidente",
    "director_financiero",
    "socio_administrador",
)


class EntidadEstructura(_Base):
    nit: str
    nombre: str


class PersonaEstructura(_Base):
    documento: str
    nombre: str


class Participacion(_Base):
    titular: str
    participada: str
    # Texto con dos decimales a lo sumo («60.00»): el código lo lee en centésimas exactas y rechaza lo que
    # no cierre.
    porcentaje: str


class Control(_Base):
    documento: str
    rol: Literal[ROLES_DE_CONTROL]  # type: ignore[valid-type]


class Estructura(_Base):
    entidad: str | None
    # Dos veces el tope que el nodo calcula: el esquema acota lo que el modelo puede escribir; pasar el
    # tope del nodo (pero no este) llega a RB-03 y decide una persona.
    entidades: list[EntidadEstructura] = Field(max_length=2 * TOPE_ENTIDADES)
    personas: list[PersonaEstructura] = Field(max_length=2 * TOPE_PERSONAS)
    participaciones: list[Participacion] = Field(max_length=2 * TOPE_PARTICIPACIONES)
    controla: Control | None


def _campos_de_solicitante() -> dict[str, Any]:
    return {
        "tipo_solicitante": (Literal["natural", "juridica"], ...),
        "estructura": (Estructura | None, ...),
    }


def crear_modelo_extraccion_con_estructura(
    codigos_actividad: list[str], codigos_jurisdiccion: list[str]
) -> type[_Base]:
    """`ExtraccionBEstructura` (plan B v1.2): los nueve campos, quién solicita y, si es una sociedad, su
    estructura."""
    return create_model(
        "ExtraccionBEstructura",
        __base__=_Base,
        **_campos_extraccion(codigos_actividad, codigos_jurisdiccion),
        **_campos_de_solicitante(),
    )


def crear_modelo_extraccion_e_identidad_con_estructura(
    codigos_actividad: list[str], codigos_jurisdiccion: list[str]
) -> type[_Base]:
    """Línea base de agente único con la v1.2: lo mismo que su llamada de siempre, más la estructura
    societaria."""
    return create_model(
        "ExtraccionEIdentidadEstructura",
        __base__=_Base,
        **_campos_extraccion(codigos_actividad, codigos_jurisdiccion),
        conclusion_lista=(Literal["misma_persona", "homonimo", "sin_parecido"], ...),
        entrada_lista=(str | None, ...),
        razones_es=(str, ...),
        razones_en=(str, ...),
        **_campos_de_solicitante(),
    )
