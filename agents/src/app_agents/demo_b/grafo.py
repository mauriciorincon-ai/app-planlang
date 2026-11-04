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
# : S9 (plan B v1.2): el nodo de los beneficiarios finales, si el plan lo declara, y su salida fija hacia
# las listas.
NODOS_OPCIONALES = ("beneficiarios",)
ARISTAS_FIJAS_OPCIONALES = {"beneficiarios": (("beneficiarios", "verificador_listas"),)}


def nodos_del_plan(declarados: set[str], base: tuple[str, ...]) -> tuple[str, ...]:
    """Los nodos que el grafo construye: los de siempre, más los opcionales que el plan declare. Un plan que
    omite uno de siempre o declara uno que el grafo no implementa no se construye."""
    extra = declarados - set(base)
    if not set(base) <= declarados or not extra <= set(NODOS_OPCIONALES):
        raise PlanInvalido(
            f"el grafo implementa {sorted(base)} (y, si el plan los declara, {sorted(NODOS_OPCIONALES)}) "
            f"y el plan declara {sorted(declarados)}"
        )
    return (*base, *sorted(extra))


def aristas_fijas(
    nodos: tuple[str, ...], base: tuple[tuple[str, str], ...], escritores: list[str]
) -> list[tuple[str, str]]:
    """Las aristas que el plan no condiciona: las de siempre y las de los nodos opcionales presentes, salvo
    las que salen de un nodo que el plan ya enruta (la v1.2 enruta el extractor hacia los beneficiarios)."""
    fijas = [*base, *(a for n in nodos for a in ARISTAS_FIJAS_OPCIONALES.get(n, ()))]
    return [(d, h) for d, h in fijas if d not in escritores]


def construir_grafo(plan: PlanCargado, listas: Listas, *, checkpointer: Any) -> CompiledStateGraph:
    declarados = {n["id"] for n in plan.contrato["nodos_esperados"]}
    nodos_grafo = nodos_del_plan(declarados, NODOS)
    nodos = NodosDemoB(plan, listas)
    g = StateGraph(EstadoB, context_schema=ContextoCasoB)
    for n in nodos_grafo:
        g.add_node(n, getattr(nodos, n))
    g.add_edge(START, "enrutador")
    cg = plan.contrato_de_grafo()
    for escritor in cg.nodos_escritores():
        g.add_conditional_edges(escritor, nodos.ruta(escritor), {d: d for d in cg.destinos(escritor)})
    for desde, hacia in aristas_fijas(nodos_grafo, ARISTAS_FIJAS, cg.nodos_escritores()):
        g.add_edge(desde, hacia)
    g.add_edge("guardia_salida", END)
    return g.compile(checkpointer=checkpointer, name="demo_b")
