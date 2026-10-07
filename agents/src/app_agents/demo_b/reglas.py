"""Reglas deterministas del demo B (RF-04b.3): espejo de `core/sintetico/demo-b/reglas.ts`, más la propuesta.

- Inconsistencias documentales: RI-01 dato exigido ausente · RI-02 otro documento en la actividad · RI-03
  otro titular en el origen de fondos.
- Puntaje de riesgo: RP-01 actividad · RP-02 jurisdicción de los fondos · RP-03 coherencia entre ingresos y
  actividad, con los pesos del archivo de listas. RP-04 en código: `puntaje` recibe solo esos tres datos,
  jamás el nombre, la nacionalidad ni el año de nacimiento (prueba de permutación en la suite).
- Propuesta: RD-01 el investigador concluye «misma persona» sobre una entrada vinculante · RD-02 identidad
  no verificable · RD-03 aprobar.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app_agents.demo_b.similitud import normalizar_nombre

CAMPOS_EXIGIDOS: tuple[str, ...] = (
    "nombre",
    "documento",
    "nacimiento",
    "nacionalidad",
    "actividad",
    "ingresos_mensuales",
    "jurisdiccion_fondos",
)
CAMPOS: tuple[str, ...] = (*CAMPOS_EXIGIDOS, "titular_actividad", "titular_fondos")


def inconsistencias(c: Mapping[str, Any]) -> list[dict[str, str]]:
    salida = [{"campo": k, "regla": "RI-01"} for k in CAMPOS_EXIGIDOS if c.get(k) is None]
    if (
        c.get("titular_actividad") is not None
        and c.get("documento") is not None
        and c["titular_actividad"] != c["documento"]
    ):
        salida.append({"campo": "titular_actividad", "regla": "RI-02"})
    if (
        c.get("titular_fondos") is not None
        and c.get("nombre") is not None
        and normalizar_nombre(c["titular_fondos"]) != normalizar_nombre(c["nombre"])
    ):
        salida.append({"campo": "titular_fondos", "regla": "RI-03"})
    return salida


def identidad_verificable(c: Mapping[str, Any]) -> bool:
    return not any(i["regla"] != "RI-01" for i in inconsistencias(c))


def puntaje(
    actividad: str | None,
    jurisdiccion_fondos: str | None,
    ingresos_mensuales: int | None,
    mundo: Mapping[str, Any],
) -> dict[str, Any]:
    """RP-01…RP-03. La firma recibe SOLO los tres datos del puntaje: nada que identifique a la persona
    (RP-04)."""
    pesos = mundo["puntaje"]
    act = next((a for a in mundo["actividades"] if a["codigo"] == actividad), None)
    jur = next((j for j in mundo["jurisdicciones"] if j["codigo"] == jurisdiccion_fondos), None)
    n_act = act["riesgo"] if act else "sin_dato"
    n_jur = jur["riesgo"] if jur else "sin_dato"
    if act is None or ingresos_mensuales is None:
        coh = "sin_dato"
    elif act["ingreso_tipico"]["min"] <= ingresos_mensuales <= act["ingreso_tipico"]["max"]:
        coh = "coherente"
    else:
        coh = "incoherente"
    componentes = [
        {
            "factor": "actividad",
            "nivel": n_act,
            "puntos": pesos["actividad"][n_act],
            "regla": "RP-01",
            "valor": actividad,
        },
        {
            "factor": "jurisdiccion",
            "nivel": n_jur,
            "puntos": pesos["jurisdiccion"][n_jur],
            "regla": "RP-02",
            "valor": jurisdiccion_fondos,
        },
        {
            "factor": "coherencia",
            "nivel": coh,
            "puntos": pesos["coherencia"][coh],
            "regla": "RP-03",
            "valor": None if ingresos_mensuales is None else str(ingresos_mensuales),
        },
    ]
    return {"componentes": componentes, "total": sum(int(x["puntos"]) for x in componentes)}


def puntaje_de_campos(c: Mapping[str, Any], mundo: Mapping[str, Any]) -> dict[str, Any]:
    return puntaje(c.get("actividad"), c.get("jurisdiccion_fondos"), c.get("ingresos_mensuales"), mundo)


def propuesta(
    conclusion_investigador: str | None, coincidencia: Mapping[str, Any] | None, campos: Mapping[str, Any]
) -> tuple[str, list[str]]:
    """(propuesta, reglas RD-xx que la motivan)."""
    reglas: list[str] = []
    if conclusion_investigador == "misma_persona" and coincidencia is not None and coincidencia["vinculante"]:
        reglas.append("RD-01")
    if not identidad_verificable(campos):
        reglas.append("RD-02")
    if reglas:
        return "rechazar", reglas
    return "aprobar", ["RD-03"]
