"""Construcción del grafo del demo A desde el contrato del plan (RF-04.1, RF-04.10).

Los nodos son los `nodos_esperados` del plan; cada nodo escritor recibe `add_conditional_edges` con un
`path_map` EXPLÍCITO cuyos destinos salen de sus aristas y su rama por defecto. Las aristas fijas son
las que el plan no condiciona. El grafo se compila una vez por corrida; el modelo, el entorno simulado
y el reloj de cada caso viajan en el contexto de la invocación.
"""

from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app_agents.demo_a.estado import ContextoCaso, Estado
from app_agents.demo_a.nodos import NodosDemoA
from app_agents.demo_a.plan_beneficios import PlanBeneficios
from app_agents.plan import PlanCargado, PlanInvalido

NODOS = (
    "enrutador",
    "extractor",
    "aclaracion",
    "verificador_cobertura",
    "decision",
    "pausa_humana",
    "redactor",
    "guardia_salida",
)
ARISTAS_FIJAS = (
    ("verificador_cobertura", "decision"),
    ("pausa_humana", "redactor"),
    ("redactor", "guardia_salida"),
)


def construir_grafo(plan: PlanCargado, pb: PlanBeneficios, *, checkpointer: Any) -> CompiledStateGraph:
    declarados = {n["id"] for n in plan.contrato["nodos_esperados"]}
    if declarados != set(NODOS):
        raise PlanInvalido(f"el grafo implementa {sorted(NODOS)} y el plan declara {sorted(declarados)}")
    nodos = NodosDemoA(plan, pb)
    g = StateGraph(Estado, context_schema=ContextoCaso)
    for n in NODOS:
        g.add_node(n, getattr(nodos, n))
    g.add_edge(START, "enrutador")
    cg = plan.contrato_de_grafo()
    for escritor in cg.nodos_escritores():
        g.add_conditional_edges(escritor, nodos.ruta(escritor), {d: d for d in cg.destinos(escritor)})
    for desde, hacia in ARISTAS_FIJAS:
        g.add_edge(desde, hacia)
    g.add_edge("guardia_salida", END)
    return g.compile(checkpointer=checkpointer, name="demo_a")
