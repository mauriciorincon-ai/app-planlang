"""Registro de demos: lo que el corredor de lotes necesita saber de cada uno, en un solo lugar.

Cada demo declara su plan, su lote y su salida por defecto; su «mundo» (el archivo con que se derivó la verdad
conocida del lote: el plan de beneficios del A, las listas de control del B) y la clave con que el lote y la
corrida lo citan; cómo construir su grafo (multiagente o línea base); su estado inicial, su contexto y su
entorno simulado; la ficha de la corrida; y las señales de MEDICIÓN que calcula el arnés del lote fuera del
grafo con la verdad conocida (el grafo jamás la ve). Añadir un demo es añadir una entrada aquí.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app_agents.canonico import jcs_texto
from app_agents.plan import RAIZ_REPO, ContratoDeGrafo, PlanCargado


class CorridaIncompatible(ValueError):
    pass


@dataclass(frozen=True)
class Demo:
    clave: str
    demo_id: str
    plan_por_defecto: str
    casos_por_defecto: str
    salida_por_defecto: str
    clave_mundo: str
    directorio_mundo: str
    cargar_mundo: Callable[[Path], Any]
    construir: Callable[[str, PlanCargado, Any, Any], tuple[Any, ContratoDeGrafo]]
    estado_inicial: Callable[[dict[str, Any], dict[str, Any]], dict[str, Any]]
    contexto: Callable[[str, Any, Any, Any], Any]
    entorno: Callable[[dict[str, Any]], Any]
    respondedor: Callable[[Any], Any]
    nombre: dict[str, str]
    revisor: dict[str, str]
    medir: Callable[[dict[str, Any], dict[str, Any]], dict[str, Any]]
    extras_traza: tuple[str, ...]

    def mundo_del_lote(self, lote: dict[str, Any]) -> Path:
        """El mundo con que se generó el lote, buscado por su huella en su directorio. Sin uno que coincida,
        el lote no corre."""
        huella = lote[self.clave_mundo]["huella"]
        for ruta in sorted((RAIZ_REPO / self.directorio_mundo).glob("*.json")):
            if json.loads(ruta.read_text(encoding="utf-8")).get("huella") == huella:
                return ruta
        raise CorridaIncompatible(f"ningún archivo en {self.directorio_mundo}/ tiene la huella {huella}")


def _demo_a() -> Demo:
    from app_agents.agente_unico import construir_grafo_linea_base, contrato_linea_base
    from app_agents.demo_a.estado import ContextoCaso, estado_inicial
    from app_agents.demo_a.grafo import construir_grafo
    from app_agents.demo_a.plan_beneficios import cargar_plan_beneficios
    from app_agents.demo_a.simulacion import EntornoSimulado, RespondedorSimulado

    def construir(variante: str, plan: PlanCargado, mundo: Any, cp: Any) -> tuple[Any, ContratoDeGrafo]:
        if variante == "agente_unico":
            return construir_grafo_linea_base(plan, mundo, checkpointer=cp), contrato_linea_base(plan)
        return construir_grafo(plan, mundo, checkpointer=cp), plan.contrato_de_grafo()

    return Demo(
        clave="a",
        demo_id="demo-a",
        plan_por_defecto="plans/demo-a/v1.2.json",
        casos_por_defecto="data/casos/demo-a/planlang-a-001-20.json",
        salida_por_defecto="runs/demo-a",
        clave_mundo="plan_beneficios",
        directorio_mundo="data/plan-beneficios",
        cargar_mundo=cargar_plan_beneficios,
        construir=construir,
        estado_inicial=estado_inicial,  # type: ignore[arg-type]
        contexto=ContextoCaso,
        entorno=EntornoSimulado,
        respondedor=RespondedorSimulado,
        nombre={"es": "Demo A · autorizaciones médicas", "en": "Demo A · medical prior authorisation"},
        revisor={
            "es": "Las decisiones humanas se simularon en lote: el auditor sigue la verdad conocida del "
            "caso.",
            "en": "Human decisions were simulated in batch: the auditor follows the case's known truth.",
        },
        medir=lambda caso, estado: {},
        extras_traza=(),
    )


def _medir_b(caso: dict[str, Any], estado: dict[str, Any]) -> dict[str, Any]:
    """C5 del plan B: ¿la extracción es exactamente la verdad conocida? La calcula el ARNÉS al terminar el
    caso, fuera del grafo (que jamás ve la verdad); el verificador la recalcula desde la traza y el lote."""
    extraccion = estado.get("extraccion")
    if extraccion is None:
        return {"extraccion_correcta": None}
    correcta = jcs_texto(extraccion["campos"]) == jcs_texto(caso["verdad_conocida"]["campos"])
    return {"extraccion_correcta": correcta}


def _demo_b() -> Demo:
    from app_agents.demo_b.agente_unico import construir_grafo_linea_base, contrato_linea_base
    from app_agents.demo_b.estado import ContextoCasoB, estado_inicial
    from app_agents.demo_b.grafo import construir_grafo
    from app_agents.demo_b.mundo import cargar_listas
    from app_agents.demo_b.simulacion import EntornoSimulado, RespondedorSimulado

    def construir(variante: str, plan: PlanCargado, mundo: Any, cp: Any) -> tuple[Any, ContratoDeGrafo]:
        if variante == "agente_unico":
            return construir_grafo_linea_base(plan, mundo, checkpointer=cp), contrato_linea_base(plan)
        return construir_grafo(plan, mundo, checkpointer=cp), plan.contrato_de_grafo()

    return Demo(
        clave="b",
        demo_id="demo-b",
        plan_por_defecto="plans/demo-b/v1.json",
        casos_por_defecto="data/casos/demo-b/planlang-b-001-20.json",
        salida_por_defecto="runs/demo-b",
        clave_mundo="listas",
        directorio_mundo="data/listas",
        cargar_mundo=cargar_listas,
        construir=construir,
        estado_inicial=estado_inicial,  # type: ignore[arg-type]
        contexto=ContextoCasoB,
        entorno=EntornoSimulado,
        respondedor=RespondedorSimulado,
        nombre={
            "es": "Demo B · vinculación con debida diligencia",
            "en": "Demo B · customer due-diligence onboarding",
        },
        revisor={
            "es": "Las decisiones humanas se simularon en lote: el oficial de cumplimiento sigue la verdad "
            "conocida "
            "del caso.",
            "en": "Human decisions were simulated in batch: the compliance officer follows the case's known "
            "truth.",
        },
        medir=_medir_b,
        extras_traza=("coincidencias", "investigacion", "puntaje", "expediente"),
    )


FABRICAS: dict[str, Callable[[], Demo]] = {"a": _demo_a, "b": _demo_b}


def demo(clave: str) -> Demo:
    if clave not in FABRICAS:
        raise ValueError(f"demo desconocido: {clave}")
    return FABRICAS[clave]()
