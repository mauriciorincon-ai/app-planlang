"""Utilidades compartidas por los tests del demo A (no es un conftest: se importa explícitamente)."""

from __future__ import annotations

from typing import Any

from langgraph.checkpoint.memory import InMemorySaver

from app_agents.adaptador import ChatSimulado
from app_agents.canonico import leer_verificando
from app_agents.demo_a.estado import ContextoCaso
from app_agents.demo_a.grafo import construir_grafo
from app_agents.demo_a.plan_beneficios import cargar_plan_beneficios
from app_agents.demo_a.simulacion import EntornoSimulado, RespondedorSimulado
from app_agents.lotes import ejecutar_caso
from app_agents.plan import RAIZ_REPO, cargar_plan
from app_agents.reloj import RelojFijo

PLAN = cargar_plan(RAIZ_REPO / "plans" / "demo-a" / "v1.1.json")
PB = cargar_plan_beneficios(RAIZ_REPO / "data" / "plan-beneficios" / "demo-a.json")
LOTE_20 = leer_verificando(RAIZ_REPO / "data" / "casos" / "demo-a" / "planlang-a-001-20.json")
LOTE_200 = leer_verificando(RAIZ_REPO / "data" / "casos" / "demo-a" / "planlang-a-001-200.json")
HUMO = leer_verificando(RAIZ_REPO / "data" / "casos" / "demo-a" / "planlang-a-humo-3.json")


def correr(
    caso: dict[str, Any],
    umbrales: dict[str, Any] | None = None,
    respondedor: Any = None,
    app: Any = None,
) -> dict[str, Any]:
    app = app or construir_grafo(PLAN, PB, checkpointer=InMemorySaver())
    entorno = EntornoSimulado(caso)
    llm = ChatSimulado(respondedor=respondedor or RespondedorSimulado(entorno))
    if respondedor is not None and hasattr(respondedor, "enlazar"):
        respondedor.enlazar(entorno)
    ctx = ContextoCaso(caso["id"], llm, entorno, RelojFijo())
    config = {"configurable": {"thread_id": f"t:{caso['id']}"}}
    return dict(ejecutar_caso(app, caso, ctx, config, umbrales or PLAN.umbrales()))


def de_subtipo(lote: dict[str, Any], subtipo: str) -> dict[str, Any]:
    return next(c for c in lote["casos"] if c["subtipo"] == subtipo)
