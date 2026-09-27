"""Estado tipado del demo A y contexto por caso (LangGraph 1.x: `context_schema`).

Las señales del plan viven en el estado con el nombre declarado en el plan (regla dura 3): un nodo
escritor las deja ANTES de enrutar y la traza las exporta tal cual. `pasos` y `decisiones_de_arista`
se acumulan con `operator.add`.
"""

from __future__ import annotations

import operator
from dataclasses import dataclass
from typing import Annotated, Any, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel

from app_agents.demo_a.simulacion import EntornoSimulado
from app_agents.reloj import Reloj


class Estado(TypedDict, total=False):
    caso_id: str
    entrada: dict[str, Any]
    umbrales_aplicados: dict[str, Any]
    # Señales del plan (nombres del contrato de grafo).
    tipo_atencion: str
    servicio_exento: bool
    senal_confianza: float | None
    campos_faltantes_count: int | None
    ciclos_aclaracion: int
    costo_estimado: int | None
    contradiccion_orden_texto: bool | None
    propuesta: str | None
    modo_texas: bool
    decision_final: str | None
    pausa_humana: bool
    severidad_accion: int | None
    # Trabajo del grafo.
    aclaraciones_hechas: int
    aclaraciones: Annotated[list[dict[str, Any]], operator.add]
    extraccion: dict[str, Any] | None
    cobertura: dict[str, Any] | None
    pausas: Annotated[list[dict[str, Any]], operator.add]
    revision: dict[str, Any] | None
    borrador: dict[str, Any] | None
    salida_final: dict[str, Any] | None
    documento_adverso: dict[str, Any] | None
    guardia_salida: dict[str, Any] | None
    pasos: Annotated[list[dict[str, Any]], operator.add]
    decisiones_de_arista: Annotated[list[dict[str, Any]], operator.add]


@dataclass
class ContextoCaso:
    """Dependencias de UNA ejecución de caso (no se guardan en el checkpoint)."""

    caso_id: str
    modelo: BaseChatModel
    entorno: EntornoSimulado
    reloj: Reloj


def estado_inicial(caso: dict[str, Any], umbrales: dict[str, Any]) -> Estado:
    return {
        "caso_id": caso["id"],
        "entrada": caso["entrada"],
        "umbrales_aplicados": umbrales,
        "modo_texas": bool(umbrales["U4"]),
        "pausa_humana": False,
        "ciclos_aclaracion": 0,
        "aclaraciones_hechas": 0,
        "senal_confianza": None,
        "campos_faltantes_count": None,
        "costo_estimado": None,
        "contradiccion_orden_texto": None,
        "propuesta": None,
        "decision_final": None,
        "severidad_accion": None,
        "extraccion": None,
        "cobertura": None,
        "revision": None,
        "borrador": None,
        "salida_final": None,
        "documento_adverso": None,
        "guardia_salida": None,
        "aclaraciones": [],
        "pausas": [],
        "pasos": [],
        "decisiones_de_arista": [],
    }
