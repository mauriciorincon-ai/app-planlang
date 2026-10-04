"""Las secciones del plan que conduce la entrevista: su esquema de salida y cuándo su propuesta está
completa.

El esquema que recibe el modelo (`--json-schema`) sale del MISMO `core/plan/plan.schema.json` que genera
Zod: una sola fuente para lo que el modelo puede escribir y lo que M1 acepta. Se le suma lo que la
entrevista exige y el plan no: el origen obligatorio en cada elemento, y un umbral sin valor (null) mientras
el usuario no lo diga.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from app_agents.entrevistador.borrador import MARCA_PENDIENTE
from app_agents.plan import RAIZ_REPO

SECCIONES = (
    "problema",
    "actores",
    "flujo",
    "decisiones",
    "riesgos",
    "supuestos",
    "criterios",
    "umbrales",
    "contrato",
    "lotes",
)
CLAVE_DEL_PLAN = {
    "actores": "actores",
    "flujo": "flujo_objetivo",
    "decisiones": "decisiones",
    "riesgos": "riesgos",
    "supuestos": "supuestos",
    "criterios": "criterios_aceptacion",
    "umbrales": "umbrales",
    "contrato": "contrato_de_grafo",
    "lotes": "lotes",
}
_EXPLICACIONES = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "elemento": {"type": "string", "minLength": 1},
            "es": {"type": "string", "minLength": 1},
            "en": {"type": "string", "minLength": 1},
        },
        "required": ["elemento", "es", "en"],
        "additionalProperties": False,
    },
}


def cargar_esquema_plan(raiz: Path = RAIZ_REPO) -> dict[str, Any]:
    return json.loads((raiz / "core" / "plan" / "plan.schema.json").read_text(encoding="utf-8"))


def _origen_requerido(objeto: dict[str, Any]) -> dict[str, Any]:
    o = copy.deepcopy(objeto)
    if "origen" in o.get("properties", {}) and "origen" not in o.get("required", []):
        o["required"] = [*o.get("required", []), "origen"]
    return o


def _con_nulo(esquema: dict[str, Any]) -> dict[str, Any]:
    """Admite null además de lo que el esquema ya admite (Zod escribe `type: [...]` o `anyOf`)."""
    if isinstance(esquema.get("type"), list):
        return {**esquema, "type": [*esquema["type"], "null"]}
    if "anyOf" in esquema:
        return {**esquema, "anyOf": [*esquema["anyOf"], {"type": "null"}]}
    return {"anyOf": [esquema, {"type": "null"}]}


def esquema_de_valor(seccion: str, esquema_plan: dict[str, Any]) -> dict[str, Any]:
    props = esquema_plan["properties"]
    if seccion == "problema":
        bilingue = props["problema"]
        return {
            "type": "object",
            "properties": {"nombre": bilingue, "problema": bilingue},
            "required": ["nombre", "problema"],
            "additionalProperties": False,
        }
    base = copy.deepcopy(props[CLAVE_DEL_PLAN[seccion]])
    if seccion in ("contrato", "lotes"):
        return _origen_requerido(base)
    if seccion == "flujo":
        return base
    base["items"] = _origen_requerido(base["items"])
    if seccion == "umbrales":
        base["items"]["properties"]["valor_en_plan"] = _con_nulo(base["items"]["properties"]["valor_en_plan"])
    return base


def esquema_de_salida(seccion: str, esquema_plan: dict[str, Any]) -> dict[str, Any]:
    """Lo que el modelo devuelve: la sección completa como debe quedar y por qué propuso lo que propuso."""
    return {
        "type": "object",
        "properties": {"valor": esquema_de_valor(seccion, esquema_plan), "explicaciones": _EXPLICACIONES},
        "required": ["valor", "explicaciones"],
        "additionalProperties": False,
    }


def _sin_pendientes(valor: Any) -> bool:
    if isinstance(valor, str):
        return MARCA_PENDIENTE not in valor
    if isinstance(valor, list):
        return all(_sin_pendientes(v) for v in valor)
    if isinstance(valor, dict):
        return all(_sin_pendientes(v) for v in valor.values())
    return True


def completa(seccion: str, valor: Any) -> bool:
    """Si «acepto» basta: la propuesta ya es un elemento del plan, sin huecos que solo el usuario llena."""
    if valor is None or not _sin_pendientes(valor):
        return False
    if seccion == "problema":
        return bool(valor.get("problema"))
    if seccion == "decisiones":
        return bool(valor) and all(d.get("estado") != "abierta" for d in valor)
    if seccion == "umbrales":
        return bool(valor) and all(u.get("valor_en_plan") is not None for u in valor)
    if isinstance(valor, list):
        return bool(valor)
    return True


def es_valor_valido(seccion: str, valor: Any) -> bool:
    """Forma mínima antes de aceptar una redacción (el esquema completo lo exige el CLI y, al final, M1)."""
    if seccion == "problema":
        return isinstance(valor, dict) and all(isinstance(valor.get(k), dict) for k in ("nombre", "problema"))
    if seccion in ("contrato", "lotes"):
        return isinstance(valor, dict)
    if seccion == "flujo":
        return isinstance(valor, list) and bool(valor) and all(isinstance(v, dict) for v in valor)
    return isinstance(valor, list) and all(
        isinstance(v, dict) and isinstance(v.get("id"), str) for v in valor
    )
