"""Código por nodo del grafo de cada demo para la vitrina (S2, P3 pestaña «Código»; el B desde el S3).

Por cada nodo del grafo: el archivo (relativo al repo, sin URL: regla 17), las líneas y el código de su
función, y las claves del estado que escribe (las del `dict` que devuelve, leídas del AST). Además, la clase
del estado y la función de la arista (el enrutamiento lee la rama que el nodo dejó escrita, regla dura 3). La
vitrina lee `data/vitrina/<demo>/grafo-codigo.json` en el build; `tests/test_exportar_grafo.py` lo regenera y
compara byte a byte (frescura): si cambia el código de un nodo, el archivo se regenera con este módulo.

    python -m app_agents.exportar_grafo [--demo a|b]            # escribe el archivo
    python -m app_agents.exportar_grafo [--demo a|b] --verificar # sale con 1 si está desactualizado
"""

from __future__ import annotations

import argparse
import ast
import inspect
import json
import sys
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app_agents.canonico import con_huella
from app_agents.demo_a import estado as estado_mod
from app_agents.demo_a.grafo import NODOS
from app_agents.demo_a.nodos import NodosDemoA
from app_agents.demo_b.estado import EstadoB
from app_agents.demo_b.grafo import NODOS as NODOS_B
from app_agents.demo_b.nodos import NodosDemoB
from app_agents.plan import RAIZ_REPO

FORMATO = "planlang-grafo-codigo/v1"
SALIDA = RAIZ_REPO / "data" / "vitrina" / "demo-a" / "grafo-codigo.json"
SALIDA_B = RAIZ_REPO / "data" / "vitrina" / "demo-b" / "grafo-codigo.json"


@dataclass(frozen=True)
class GrafoDeDemo:
    demo_id: str
    nodos: tuple[str, ...]
    clase: type
    estado: type


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


GRAFOS = {
    "a": GrafoDeDemo("demo-a", tuple(NODOS), NodosDemoA, estado_mod.Estado),
    "b": GrafoDeDemo("demo-b", tuple(NODOS_B), NodosDemoB, EstadoB),
}


def salida(demo: str = "a") -> Path:
    # `SALIDA` se lee al llamar (no al importar) para que las pruebas puedan apuntarla a otro archivo.
    return SALIDA if demo == "a" else SALIDA_B


def exportar(demo: str = "a") -> dict[str, Any]:
    g = GRAFOS[demo]
    nodos = {}
    for n in g.nodos:
        funcion = getattr(g.clase, n)
        nodos[n] = {**_bloque(funcion), "escribe": claves_que_escribe(funcion)}
    return con_huella(
        {
            "formato": FORMATO,
            "demo_id": g.demo_id,
            "nodos": nodos,
            "ruta": _bloque(g.clase.ruta),
            "estado": _bloque(g.estado),
        }
    )


def texto(demo: str = "a") -> str:
    return json.dumps(exportar(demo), ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _rel(p: Path) -> str:
    try:
        return p.relative_to(RAIZ_REPO).as_posix()
    except ValueError:
        return str(p)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--demo", default="a", choices=sorted(GRAFOS))
    p.add_argument(
        "--verificar", action="store_true", help="no escribe: sale con 1 si el archivo no está al día"
    )
    a = p.parse_args(argv)
    nuevo = texto(a.demo)
    destino = salida(a.demo)
    if a.verificar:
        actual = destino.read_text(encoding="utf-8") if destino.exists() else ""
        if actual != nuevo:
            print(f"{_rel(destino)} está desactualizado: python -m app_agents.exportar_grafo --demo {a.demo}")
            return 1
        return 0
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(nuevo, encoding="utf-8")
    print(f"escrito {_rel(destino)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
