"""Estado tipado del demo B y contexto por caso (LangGraph 1.x: `context_schema`).

Las señales del plan B viven en el estado con el nombre que declara el plan (regla dura 3): un nodo escritor
las deja ANTES de enrutar y la traza las exporta tal cual. `pasos` y `decisiones_de_arista` se acumulan con
`operator.add`.
"""

from __future__ import annotations

import operator
from dataclasses import dataclass
from typing import Annotated, Any, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel

from app_agents.reloj import Reloj


class EstadoB(TypedDict, total=False):
    caso_id: str
    entrada: dict[str, Any]
    umbrales_aplicados: dict[str, Any]
    # Señales del plan B (nombres del contrato de grafo).
    carga_detectada: bool
    similitud_max: float | None
    conclusion_investigador: str | None
    puntaje_riesgo: int | None
    inconsistencias: int | None
    propuesta: str | None
    decision_final: str | None
    pausa_humana: bool
    conclusiones_sin_cita: int | None
    inyeccion_neutralizada: bool | None
    severidad_accion: int | None
    error_proveedor: str | None
    # Trabajo del grafo.
    extraccion: dict[str, Any] | None
    coincidencias: dict[str, Any] | None
    investigacion: dict[str, Any] | None
    # Línea base de agente único: lo que su única llamada juzgó sobre las listas (lo usa el verificador).
    juicio_unico: dict[str, Any] | None
    puntaje: dict[str, Any] | None
    revision: dict[str, Any] | None
    expediente: dict[str, Any] | None
    respuesta: dict[str, Any] | None
    salida_final: dict[str, Any] | None
    documento_adverso: dict[str, Any] | None
    guardia_salida: dict[str, Any] | None
    pausas: Annotated[list[dict[str, Any]], operator.add]
    pasos: Annotated[list[dict[str, Any]], operator.add]
    decisiones_de_arista: Annotated[list[dict[str, Any]], operator.add]


@dataclass
class ContextoCasoB:
    """Dependencias de UNA ejecución de caso (no se guardan en el checkpoint)."""

    caso_id: str
    modelo: BaseChatModel
    entorno: Any
    reloj: Reloj


def estado_inicial(caso: dict[str, Any], umbrales: dict[str, Any]) -> EstadoB:
    return {
        "caso_id": caso["id"],
        "entrada": caso["entrada"],
        "umbrales_aplicados": umbrales,
        "carga_detectada": False,
        "similitud_max": None,
        "conclusion_investigador": None,
        "puntaje_riesgo": None,
        "inconsistencias": None,
        "propuesta": None,
        "decision_final": None,
        "pausa_humana": False,
        "conclusiones_sin_cita": None,
        "inyeccion_neutralizada": None,
        "severidad_accion": None,
        "error_proveedor": None,
        "extraccion": None,
        "coincidencias": None,
        "investigacion": None,
        "juicio_unico": None,
        "puntaje": None,
        "revision": None,
        "expediente": None,
        "respuesta": None,
        "salida_final": None,
        "documento_adverso": None,
        "guardia_salida": None,
        "pausas": [],
        "pasos": [],
        "decisiones_de_arista": [],
    }
