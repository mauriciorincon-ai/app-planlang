"""Código por nodo del grafo del demo A para la vitrina (S2, P3 pestaña «Código»).

Por cada nodo del grafo: el archivo (relativo al repo, sin URL: regla 17), las líneas y el código de su
función, y las claves del estado que escribe (las del `dict` que devuelve, leídas del AST). Además, la clase
del estado y la función de la arista (el enrutamiento lee la rama que el nodo dejó escrita, regla dura 3). La
vitrina lee `data/vitrina/demo-a/grafo-codigo.json` en el build; `tests/test_exportar_grafo.py` lo regenera y
compara byte a byte (frescura): si cambia el código de un nodo, el archivo se regenera con este módulo.

    python -m app_agents.exportar_grafo            # escribe el archivo
    python -m app_agents.exportar_grafo --verificar # sale con 1 si está desactualizado
"""

from __future__ import annotations

import argparse
import ast
import inspect
import json
import sys
import textwrap
from pathlib import Path
from typing import Any

from app_agents.canonico import con_huella
from app_agents.demo_a import estado as estado_mod
from app_agents.demo_a.grafo import NODOS
from app_agents.demo_a.nodos import NodosDemoA
from app_agents.plan import RAIZ_REPO

FORMATO = "planlang-grafo-codigo/v1"
SALIDA = RAIZ_REPO / "data" / "vitrina" / "demo-a" / "grafo-codigo.json"


def _bloque(objeto: Any) -> dict[str, Any]:
    lineas, desde = inspect.getsourcelines(objeto)
    archivo = Path(inspect.getsourcefile(objeto) or "").resolve().relative_to(RAIZ_REPO).as_posix()
    return {
        "archivo": archivo,
        "desde": desde,
        "hasta": desde + len(lineas) - 1,
        "codigo": textwrap.dedent("".join(lineas)).rstrip("\n"),
    }


def claves_que_escribe(funcion: Any) -> list[str]:
    """Claves que el nodo escribe en el estado: las del `dict` que devuelve, leídas del AST. Sigue los nombres
    locales (`return salida`, `{**senales, …}`) y las asignaciones `salida["clave"] = …`."""
    arbol = ast.parse(textwrap.dedent(inspect.getsource(funcion)))
    locales: dict[str, set[str]] = {}

    def literales(d: ast.Dict) -> set[str]:
        ks: set[str] = set()
        for k, v in zip(d.keys, d.values, strict=True):
            if isinstance(k, ast.Constant) and isinstance(k.value, str):
                ks.add(k.value)
            elif k is None and isinstance(v, ast.Name):
                ks |= locales.get(v.id, set())
        return ks

    for nodo in ast.walk(arbol):
        if isinstance(nodo, (ast.Assign, ast.AnnAssign)) and isinstance(nodo.value, ast.Dict):
            for t in nodo.targets if isinstance(nodo, ast.Assign) else [nodo.target]:
                if isinstance(t, ast.Name):
                    locales.setdefault(t.id, set()).update(literales(nodo.value))
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Assign):
            for t in nodo.targets:
                if (
                    isinstance(t, ast.Subscript)
                    and isinstance(t.value, ast.Name)
                    and isinstance(t.slice, ast.Constant)
                    and isinstance(t.slice.value, str)
                ):
                    locales.setdefault(t.value.id, set()).add(t.slice.value)
    claves: set[str] = set()
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Return) and isinstance(nodo.value, ast.Dict):
            claves |= literales(nodo.value)
        elif isinstance(nodo, ast.Return) and isinstance(nodo.value, ast.Name):
            claves |= locales.get(nodo.value.id, set())
    return sorted(claves)


def exportar() -> dict[str, Any]:
    nodos = {}
    for n in NODOS:
        funcion = getattr(NodosDemoA, n)
        nodos[n] = {**_bloque(funcion), "escribe": claves_que_escribe(funcion)}
    return con_huella(
        {
            "formato": FORMATO,
            "demo_id": "demo-a",
            "nodos": nodos,
            "ruta": _bloque(NodosDemoA.ruta),
            "estado": _bloque(estado_mod.Estado),
        }
    )


def texto() -> str:
    return json.dumps(exportar(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _rel(p: Path) -> str:
    try:
        return p.relative_to(RAIZ_REPO).as_posix()
    except ValueError:
        return str(p)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument(
        "--verificar", action="store_true", help="no escribe: sale con 1 si el archivo no está al día"
    )
    a = p.parse_args(argv)
    nuevo = texto()
    if a.verificar:
        actual = SALIDA.read_text(encoding="utf-8") if SALIDA.exists() else ""
        if actual != nuevo:
            print(f"{_rel(SALIDA)} está desactualizado: python -m app_agents.exportar_grafo")
            return 1
        return 0
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(nuevo, encoding="utf-8")
    print(f"escrito {_rel(SALIDA)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
