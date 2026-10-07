"""Construcción del grafo del demo B desde el contrato del plan B (RF-04.1, RF-04.10).

Los nodos son los `nodos_esperados` del plan; cada nodo escritor recibe `add_conditional_edges` con un
`path_map` EXPLÍCITO cuyos destinos salen de sus aristas y su rama por defecto. Las aristas fijas son las que
el plan no condiciona. El modelo, el entorno simulado y el reloj de cada caso viajan en el contexto.
"""

from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app_agents.demo_b.estado import ContextoCasoB, EstadoB
from app_agents.demo_b.mundo import Listas
from app_agents.demo_b.nodos import NodosDemoB
from app_agents.plan import PlanCargado, PlanInvalido

NODOS = (
    "enrutador",
    "extractor",
    "verificador_listas",
    "investigador",
    "puntaje",
    "decision",
    "pausa_humana",
    "redactor",
    "guardia_salida",
)
ARISTAS_FIJAS = (
    ("enrutador", "extractor"),
    ("extractor", "verificador_listas"),
    ("investigador", "puntaje"),
    ("puntaje", "decision"),
    ("pausa_humana", "redactor"),
    ("redactor", "guardia_salida"),
)


def construir_grafo(plan: PlanCargado, listas: Listas, *, checkpointer: Any) -> CompiledStateGraph:
    declarados = {n["id"] for n in plan.contrato["nodos_esperados"]}
    if declarados != set(NODOS):
        raise PlanInvalido(f"el grafo implementa {sorted(NODOS)} y el plan declara {sorted(declarados)}")
    nodos = NodosDemoB(plan, listas)
    g = StateGraph(EstadoB, context_schema=ContextoCasoB)
    for n in NODOS:
        g.add_node(n, getattr(nodos, n))
    g.add_edge(START, "enrutador")
    cg = plan.contrato_de_grafo()
    for escritor in cg.nodos_escritores():
        g.add_conditional_edges(escritor, nodos.ruta(escritor), {d: d for d in cg.destinos(escritor)})
    for desde, hacia in ARISTAS_FIJAS:
        g.add_edge(desde, hacia)
    g.add_edge("guardia_salida", END)
    return g.compile(checkpointer=checkpointer, name="demo_b")
