"""M-12: el entorno instalado es el lock (`constraints.txt`) y el lock cabe en los rangos del `pyproject`.

La CI instala con `-c constraints.txt`; si alguien lo quita, o sube un paquete sin regenerar el lock, el
entorno deja de ser el validado y esta prueba lo nombra. `grafo.json` depende de la forma interna de
`get_graph().to_json()` (P-13): sin lock, dos corridas con el mismo código podían dar grafos distintos.
"""

from __future__ import annotations

import importlib.metadata as md
import re
import tomllib
from pathlib import Path

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

AGENTS = Path(__file__).resolve().parents[1]
LINEA = re.compile(r"^([A-Za-z0-9._-]+)==([^\s;#]+)$")


def _lock() -> dict[str, str]:
    pines: dict[str, str] = {}
    for n, linea in enumerate((AGENTS / "constraints.txt").read_text(encoding="utf-8").splitlines(), 1):
        if not linea.strip() or linea.startswith("#"):
            continue
        m = LINEA.match(linea.strip())
        assert m, f"constraints.txt:{n} no es un pin exacto «paquete==versión»: {linea!r}"
        pines[canonicalize_name(m[1])] = m[2]
    return pines


def _requisitos() -> list[Requirement]:
    datos = tomllib.loads((AGENTS / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    return [Requirement(r) for r in [*datos["dependencies"], *datos["optional-dependencies"]["dev"]]]


def test_el_lock_fija_cada_dependencia_directa_dentro_de_su_rango() -> None:
    pines = _lock()
    for req in _requisitos():
        nombre = canonicalize_name(req.name)
        assert nombre in pines, f"{req.name} está en el pyproject y no en constraints.txt"
        assert req.specifier.contains(pines[nombre], prereleases=True), (
            f"constraints.txt fija {req.name}=={pines[nombre]}, fuera de «{req.specifier}» (pyproject)"
        )


def test_el_entorno_instalado_es_el_lock() -> None:
    distintos = []
    for nombre, version in sorted(_lock().items()):
        try:
            instalada = md.version(nombre)
        except md.PackageNotFoundError:
            distintos.append(f"{nombre}: falta (lock {version})")
            continue
        if instalada != version:
            distintos.append(f"{nombre}: instalada {instalada}, lock {version}")
    assert not distintos, "el entorno no es el del lock:\n" + "\n".join(distintos)
