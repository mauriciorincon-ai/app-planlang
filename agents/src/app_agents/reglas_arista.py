"""Intérprete mínimo de las aristas del plan — el lado Python de RF-09.2 (regla dura 2).

Una arista condicional es una tripleta `señal · operador · valor · inclusivo` o una función nombrada
con sus entradas. Por nodo escritor se evalúan TODAS sus aristas en `orden` (quedan todas registradas
para que el playground recalcule con otros umbrales); la primera verdadera gana; si ninguna, la rama
por defecto. El grafo enruta con `decidir` y la traza guarda lo mismo que `decidir` vio, así que
`recalcular` debe reproducir exactamente las ramas tomadas. El intérprete TypeScript
(`core/playground/interprete.ts`) implementa la misma semántica y la CI compara ambos.

Semántica (idéntica en TS):
- `igual_a` / `distinto_de`: igualdad ESTRICTA de tipo (`True` no es `1`, como en `===`); ignoran `inclusivo`.
- `menor_que` / `mayor_que`: estrictos; con `inclusivo: true` pasan a `<=` / `>=`.
- `menor_o_igual_que` / `mayor_o_igual_que`: siempre inclusivos.
- Orden solo entre números; una señal nula (no observada: el nodo no pudo medirla, AU-9) no cumple ninguna
  comparación de orden; una señal ausente es error, jamás `false`.
- `valor` literal o `umbral.Ux`, resuelto con los umbrales aplicados de la corrida.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from typing import Any

OPERADORES: tuple[str, ...] = (
    "igual_a",
    "distinto_de",
    "menor_que",
    "mayor_que",
    "menor_o_igual_que",
    "mayor_o_igual_que",
)


class ErrorArista(ValueError):
    pass


def _texas_y_no_aprobar(modo_texas: Any, propuesta: Any) -> bool:
    return modo_texas is True and propuesta != "aprobar"


# Funciones nombradas del plan: nombre → (entradas en orden, implementación). Registro cerrado.
FUNCIONES: dict[str, tuple[tuple[str, ...], Callable[..., bool]]] = {
    "texas_y_no_aprobar": (("modo_texas", "propuesta"), _texas_y_no_aprobar),
}


def resolver_valor(valor: Any, umbrales: Mapping[str, Any]) -> Any:
    if isinstance(valor, str) and valor.startswith("umbral."):
        clave = valor.removeprefix("umbral.")
        if clave not in umbrales:
            raise ErrorArista(f"umbral desconocido: {valor}")
        return umbrales[clave]
    return valor


def _es_numero(x: Any) -> bool:
    return isinstance(x, int | float) and not isinstance(x, bool)


def _igual(a: Any, b: Any) -> bool:
    if _es_numero(a) and _es_numero(b):
        return a == b
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    return type(a) is type(b) and a == b


def comparar(observado: Any, operador: str, declarado: Any, inclusivo: bool) -> bool:
    if operador == "igual_a":
        return _igual(observado, declarado)
    if operador == "distinto_de":
        return not _igual(observado, declarado)
    if operador not in OPERADORES:
        raise ErrorArista(f"operador desconocido: {operador}")
    if observado is None and _es_numero(declarado):
        return False
    if not (_es_numero(observado) and _es_numero(declarado)):
        raise ErrorArista(f"{operador} exige números: {observado!r} vs {declarado!r}")
    if operador == "menor_que":
        return observado <= declarado if inclusivo else observado < declarado
    if operador == "mayor_que":
        return observado >= declarado if inclusivo else observado > declarado
    if operador == "menor_o_igual_que":
        return observado <= declarado
    return observado >= declarado  # mayor_o_igual_que


def _senal(senales: Mapping[str, Any], nombre: str) -> Any:
    if nombre not in senales:
        raise ErrorArista(f"señal ausente en el estado: {nombre}")
    return senales[nombre]


def evaluar_arista(
    arista: Mapping[str, Any], senales: Mapping[str, Any], umbrales: Mapping[str, Any]
) -> dict[str, Any]:
    """Un registro de `decisiones_de_arista` (sin `paso` ni `rama_tomada`)."""
    base = {
        "desde": arista["desde"],
        "orden_arista": arista["orden"],
        "entradas": None,
        "funcion": None,
        "inclusivo": None,
        "operador": None,
        "senal": None,
        "umbral_aplicado": None,
        "valor_declarado": None,
        "valor_observado": None,
    }
    if "funcion" in arista:
        nombre = arista["funcion"]["nombre"]
        if nombre not in FUNCIONES:
            raise ErrorArista(f"función de arista no registrada: {nombre}")
        orden_entradas, fn = FUNCIONES[nombre]
        entradas = {k: _senal(senales, k) for k in orden_entradas}
        return {
            **base,
            "tipo": "funcion",
            "funcion": nombre,
            "entradas": entradas,
            "resultado": fn(**entradas),
        }
    observado = _senal(senales, arista["senal"])
    aplicado = resolver_valor(arista["valor"], umbrales)
    return {
        **base,
        "tipo": "tripleta",
        "senal": arista["senal"],
        "valor_observado": observado,
        "operador": arista["operador"],
        "valor_declarado": arista["valor"],
        "umbral_aplicado": aplicado,
        "inclusivo": bool(arista.get("inclusivo", False)),
        "resultado": comparar(observado, arista["operador"], aplicado, bool(arista.get("inclusivo", False))),
    }


def decidir(
    aristas: Sequence[Mapping[str, Any]],
    rama_por_defecto: str,
    senales: Mapping[str, Any],
    umbrales: Mapping[str, Any],
    paso: int,
) -> tuple[str, list[dict[str, Any]]]:
    """Evalúa todas las aristas de un nodo escritor en orden → (rama, registros)."""
    registros = [evaluar_arista(a, senales, umbrales) for a in sorted(aristas, key=lambda a: a["orden"])]
    rama = rama_por_defecto
    for a, r in zip(sorted(aristas, key=lambda a: a["orden"]), registros, strict=True):
        if r["resultado"]:
            rama = str(a["si_verdadero"])
            break
    for r in registros:
        r["paso"] = paso
        r["rama_tomada"] = rama
    return rama, registros


def senales_de_visita(registros: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """Las señales tal como se observaron en una visita, reconstruidas desde sus registros."""
    senales: dict[str, Any] = {}
    for r in registros:
        if r["tipo"] == "funcion":
            senales.update(r["entradas"])
        else:
            senales[r["senal"]] = r["valor_observado"]
    return senales


def recalcular(
    decisiones: Sequence[Mapping[str, Any]],
    aristas: Sequence[Mapping[str, Any]],
    ramas_por_defecto: Mapping[str, str],
    umbrales: Mapping[str, Any],
) -> list[dict[str, Any]]:
    """Recalcula cada visita de nodo escritor desde lo observado.

    Devuelve `[{paso, desde, resultados, rama_tomada}]` en orden de paso.
    """
    visitas: dict[tuple[int, str], list[Mapping[str, Any]]] = {}
    for d in decisiones:
        visitas.setdefault((int(d["paso"]), str(d["desde"])), []).append(d)
    salida: list[dict[str, Any]] = []
    for (paso, desde), registros in sorted(visitas.items()):
        propias = [a for a in aristas if a["desde"] == desde]
        rama, nuevos = decidir(
            propias, ramas_por_defecto[desde], senales_de_visita(registros), umbrales, paso
        )
        salida.append(
            {
                "desde": desde,
                "paso": paso,
                "rama_tomada": rama,
                "resultados": [r["resultado"] for r in nuevos],
            }
        )
    return salida
