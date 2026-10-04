"""La plantilla del dominio como fuente de propuestas (RF-02.1).

Lee `data/dominios/<id>.json` verificando su huella y traduce los ids típicos a ids de plan (DT1 → D1, RT1 →
R1, CT1 → C1, UT1 → U1) en todas sus referencias, incluidas las `umbral.UTn` de las condiciones. Lo que la
plantilla propone entra al borrador con origen `plantilla`; los lotes, que la plantilla no trae, los propone
el código con origen `entrevistador`.
"""

from __future__ import annotations

import copy
import re
from pathlib import Path
from typing import Any

from app_agents.canonico import leer_verificando
from app_agents.plan import RAIZ_REPO

_ID_TIPICO = re.compile(r"^([DRCU])T(\d+)$")
_REF_UMBRAL = re.compile(r"\bumbral\.UT(\d+)\b")

# Lo que el código propone para los lotes (regla 6: de 20, espaciados, fuera de CI, por la suscripción).
LOTES_POR_DEFECTO: dict[str, Any] = {
    "demo": 20,
    "completo": 200,
    "corridas_espaciadas_de": 20,
    "fuera_de_ci": True,
    "proveedor": "suscripcion-claude-code",
    "modelo_alias": "sonnet",
}


def cargar_plantilla(dominio_id: str, raiz: Path = RAIZ_REPO) -> dict[str, Any]:
    return leer_verificando(raiz / "data" / "dominios" / f"{dominio_id}.json")


def id_de_plan(id_tipico: str) -> str:
    m = _ID_TIPICO.match(id_tipico)
    return f"{m.group(1)}{m.group(2)}" if m else id_tipico


def _ids_tipicos(plantilla: dict[str, Any]) -> set[str]:
    claves = ("decisiones_tipicas", "riesgos_tipicos", "criterios_sugeridos", "umbrales_sugeridos")
    return {e["id"] for k in claves for e in plantilla.get(k) or []}


def mapear(valor: Any, ids: set[str]) -> Any:
    """Reescribe cada id típico (cadena completa) y cada `umbral.UTn` dentro de una condición."""
    if isinstance(valor, str):
        if valor in ids:
            return id_de_plan(valor)
        return _REF_UMBRAL.sub(lambda m: f"umbral.U{m.group(1)}", valor)
    if isinstance(valor, list):
        return [mapear(v, ids) for v in valor]
    if isinstance(valor, dict):
        return {k: mapear(v, ids) for k, v in valor.items()}
    return valor


def _con_origen(elementos: list[dict[str, Any]], origen: str) -> list[dict[str, Any]]:
    return [{**e, "origen": e.get("origen", origen)} for e in elementos]


def propuestas(plantilla: dict[str, Any]) -> dict[str, Any]:
    """La propuesta inicial de cada sección. `None` o lista vacía: la sección no tiene propuesta."""
    ids = _ids_tipicos(plantilla)
    p = mapear(copy.deepcopy(plantilla), ids)
    contrato = p.get("contrato_sugerido")
    return {
        "problema": {"nombre": p["nombre"], "problema": None},
        "actores": _con_origen(p["actores_tipicos"], "plantilla"),
        "flujo": [],
        "decisiones": _con_origen(p["decisiones_tipicas"], "plantilla"),
        "riesgos": _con_origen(p["riesgos_tipicos"], "plantilla"),
        "supuestos": [],
        "criterios": p["criterios_sugeridos"],
        "umbrales": _con_origen(p.get("umbrales_sugeridos") or [], "plantilla"),
        "contrato": {**contrato, "origen": "plantilla"} if contrato else None,
        "lotes": {**LOTES_POR_DEFECTO, "origen": "entrevistador"},
    }
