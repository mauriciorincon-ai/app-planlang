"""La entrevista como grafo de LangGraph: elegir pregunta → preguntar (`interrupt`) → incorporar → … →
cerrar.

Una pasada pregunta todas las preguntas guía en el orden fijo de la plantilla (RF-02.1: ninguna se omite).
Retomar una entrevista terminada abre otra pasada que solo pregunta lo pendiente (o las preguntas que se
fuercen). El estado vive en el checkpointer (`SqliteSaver` en la CLI): salir a mitad y volver con
`--retomar` sigue donde quedó.
"""

from __future__ import annotations

import operator
from dataclasses import dataclass, field
from typing import Annotated, Any, TypedDict

from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.runtime import Runtime
from langgraph.types import interrupt

from app_agents.adaptador import ErrorProveedor
from app_agents.entrevistador.borrador import MARCA_PENDIENTE, ensamblar
from app_agents.entrevistador.redactar import RedaccionFallida, redactar
from app_agents.entrevistador.respuestas import clasificar, pasos_literales
from app_agents.entrevistador.secciones import completa


def _fusionar(a: dict[str, Any] | None, b: dict[str, Any] | None) -> dict[str, Any]:
    return {**(a or {}), **(b or {})}


class EstadoEntrevista(TypedDict, total=False):
    idioma: str
    pasada: int
    forzadas: list[str]
    estados: Annotated[dict[str, str], _fusionar]
    vistas: Annotated[dict[str, int], _fusionar]
    secciones: Annotated[dict[str, Any], _fusionar]
    turnos: Annotated[list[dict[str, Any]], operator.add]
    actual: str | None
    respuesta: str | None
    aviso: str | None
    repetir: bool
    borrador: dict[str, Any] | None
    senales_derivadas: list[dict[str, Any]]


@dataclass
class ContextoEntrevista:
    plan_id: str
    plantilla: dict[str, Any]
    esquema_plan: dict[str, Any]
    modelo: BaseChatModel | None
    vocabulario: tuple[str, ...] = field(default_factory=tuple)


AVISOS = {
    "vacia": {"es": "La respuesta llegó vacía.", "en": "The answer was empty."},
    "incompleta": {
        "es": (
            "La propuesta todavía tiene huecos que solo tú puedes llenar: "
            "responde con tus palabras o «pendiente»."
        ),
        "en": "The proposal still has gaps only you can fill: answer in your own words or say “pending”.",
    },
}


def _otro(idioma: str) -> str:
    return "en" if idioma == "es" else "es"


def _pregunta(ctx: ContextoEntrevista, qid: str) -> tuple[int, dict[str, Any]]:
    for i, q in enumerate(ctx.plantilla["preguntas_guia"]):
        if q["id"] == qid:
            return i, q
    raise KeyError(qid)


def _ids(valor: Any) -> list[dict[str, str]]:
    if isinstance(valor, list):
        return [
            {"id": e["id"], "origen": e.get("origen", "")} for e in valor if isinstance(e, dict) and "id" in e
        ]
    return []


def contexto_del_plan(secciones: dict[str, Any], vocabulario: tuple[str, ...]) -> dict[str, Any]:
    """Lo que el modelo necesita ver de las otras secciones para no romper referencias."""

    def resumen(clave: str, campos: tuple[str, ...]) -> list[dict[str, Any]]:
        return [
            {c: e.get(c) for c in ("id", *campos)} for e in secciones.get(clave) or [] if isinstance(e, dict)
        ]

    contrato = secciones.get("contrato") or {}
    return {
        "decisiones": resumen("decisiones", ("pregunta", "estado")),
        "riesgos": resumen("riesgos", ("modo", "severidad")),
        "criterios": resumen("criterios", ("enunciado",)),
        "umbrales": resumen("umbrales", ("senal", "operador", "valor_en_plan", "consecuencia_si_verdadero")),
        "nodos": [n.get("id") for n in contrato.get("nodos_esperados") or []],
        "senales_del_contrato": list(contrato.get("senales_obligatorias_en_traza") or []),
        "claves_del_contexto": list(vocabulario),
    }


class NodosEntrevista:
    def elegir(self, estado: EstadoEntrevista, runtime: Runtime[ContextoEntrevista]) -> dict[str, Any]:
        pasada = estado.get("pasada", 1)
        forzadas = estado.get("forzadas") or []
        for q in runtime.context.plantilla["preguntas_guia"]:
            if (estado.get("vistas") or {}).get(q["id"], 0) >= pasada:
                continue
            if (
                pasada == 1
                or q["id"] in forzadas
                or (estado.get("estados") or {}).get(q["id"]) == "pendiente"
            ):
                return {"actual": q["id"], "aviso": None, "repetir": False}
        return {"actual": None}

    def preguntar(self, estado: EstadoEntrevista, runtime: Runtime[ContextoEntrevista]) -> dict[str, Any]:
        ctx = runtime.context
        i, q = _pregunta(ctx, estado["actual"] or "")
        payload = {
            "id": q["id"],
            "numero": i + 1,
            "total": len(ctx.plantilla["preguntas_guia"]),
            "pasada": estado.get("pasada", 1),
            "seccion": q["seccion"],
            "pregunta": {"es": q["es"], "en": q["en"]},
            "ejemplo": q["ejemplo"],
            "obligatoria": q["obligatoria"],
            "propuesta": (estado.get("secciones") or {}).get(q["seccion"]),
            "aviso": estado.get("aviso"),
        }
        respuesta = interrupt(payload)
        return {"respuesta": str(respuesta), "vistas": {q["id"]: estado.get("pasada", 1)}}

    def incorporar(self, estado: EstadoEntrevista, runtime: Runtime[ContextoEntrevista]) -> dict[str, Any]:
        ctx = runtime.context
        _, q = _pregunta(ctx, estado["actual"] or "")
        seccion, idioma = q["seccion"], estado.get("idioma", "es")
        texto = (estado.get("respuesta") or "").strip()
        secciones = estado.get("secciones") or {}
        actual = secciones.get(seccion)
        clase = clasificar(texto)
        turno: dict[str, Any] = {
            "pregunta": q["id"],
            "pasada": estado.get("pasada", 1),
            "respuesta": {"texto": texto, "idioma": idioma},
        }
        if clase in ("vacia", "salir"):
            return {"aviso": AVISOS["vacia"], "repetir": True}
        if clase == "pendiente":
            return {
                "repetir": False,
                "estados": {q["id"]: "pendiente"},
                "turnos": [{**turno, "resultado": "pendiente"}],
            }
        if clase == "aceptar":
            if q["obligatoria"] and not completa(seccion, actual):
                return {"aviso": AVISOS["incompleta"], "repetir": True}
            return {
                "repetir": False,
                "estados": {q["id"]: "aceptada"},
                "turnos": [{**turno, "resultado": "aceptada", "elementos": _ids(actual)}],
            }
        if ctx.modelo is not None:
            try:
                r = redactar(
                    ctx.modelo,
                    seccion=seccion,
                    pregunta=q[idioma],
                    idioma=idioma,
                    propuesta=actual,
                    contexto=contexto_del_plan(secciones, ctx.vocabulario),
                    respuesta=texto,
                    esquema_plan=ctx.esquema_plan,
                )
            except (ErrorProveedor, RedaccionFallida) as e:
                motivo = e.tipo if isinstance(e, ErrorProveedor) else "redaccion_invalida"
                return self._literal(turno, q, actual, texto, idioma, motivo)
            return {
                "secciones": {seccion: r.valor},
                "repetir": False,
                "estados": {q["id"]: "respondida"},
                "turnos": [
                    {
                        **turno,
                        "resultado": "redactada",
                        "elementos": _ids(r.valor),
                        "explicaciones": r.explicaciones,
                        **({"restaurados": r.restaurados} if r.restaurados else {}),
                        "redaccion": {idioma: "usuario", _otro(idioma): "entrevistador"},
                        "costo_nominal_usd": r.costo_nominal_usd,
                        "tokens_entrada": r.tokens_entrada,
                        "tokens_salida": r.tokens_salida,
                    }
                ],
            }
        return self._literal(turno, q, actual, texto, idioma, "sin_modelo")

    @staticmethod
    def _literal(
        turno: dict[str, Any], q: dict[str, Any], actual: Any, texto: str, idioma: str, motivo: str
    ) -> dict[str, Any]:
        """Sin redacción, la respuesta queda literal: los textos (problema, flujo) entran con el otro idioma
        pendiente; una sección estructurada conserva su propuesta y la pregunta queda pendiente."""
        seccion, otro = q["seccion"], _otro(idioma)
        base = {**turno, "motivo": motivo, "redaccion": {idioma: "usuario", otro: "pendiente"}}
        if seccion == "problema":
            valor = {**(actual or {}), "problema": {idioma: texto, otro: MARCA_PENDIENTE}}
            return {
                "secciones": {seccion: valor},
                "repetir": False,
                "estados": {q["id"]: "respondida"},
                "turnos": [{**base, "resultado": "literal"}],
            }
        if seccion == "flujo":
            valor = [{idioma: p, otro: MARCA_PENDIENTE} for p in pasos_literales(texto)]
            return {
                "secciones": {seccion: valor},
                "repetir": False,
                "estados": {q["id"]: "respondida"},
                "turnos": [{**base, "resultado": "literal"}],
            }
        return {
            "repetir": False,
            "estados": {q["id"]: "pendiente"},
            "turnos": [{**base, "resultado": "literal_sin_redactar"}],
        }

    def cerrar(self, estado: EstadoEntrevista, runtime: Runtime[ContextoEntrevista]) -> dict[str, Any]:
        ctx = runtime.context
        borrador, derivadas = ensamblar(
            plan_id=ctx.plan_id,
            plantilla=ctx.plantilla,
            secciones=estado.get("secciones") or {},
            vocabulario=ctx.vocabulario,
        )
        return {"borrador": borrador, "senales_derivadas": derivadas, "actual": None}


def construir_entrevista(*, checkpointer: Any) -> CompiledStateGraph:
    nodos = NodosEntrevista()
    g = StateGraph(EstadoEntrevista, context_schema=ContextoEntrevista)
    for n in ("elegir", "preguntar", "incorporar", "cerrar"):
        g.add_node(n, getattr(nodos, n))
    g.add_edge(START, "elegir")
    g.add_conditional_edges(
        "elegir",
        lambda e: "preguntar" if e.get("actual") else "cerrar",
        {"preguntar": "preguntar", "cerrar": "cerrar"},
    )
    g.add_edge("preguntar", "incorporar")
    g.add_conditional_edges(
        "incorporar",
        lambda e: "preguntar" if e.get("repetir") else "elegir",
        {"preguntar": "preguntar", "elegir": "elegir"},
    )
    g.add_edge("cerrar", END)
    return g.compile(checkpointer=checkpointer, name="entrevistador")
