"""Los beneficiarios finales de una persona jurídica: el nodo determinista `beneficiarios` del demo B (S9,
ADR-019).

Espejo de `core/sintetico/demo-b/beneficiarios.ts`, el gemelo de verdad con que el generador fija la verdad
conocida; el gate de contrato (`tests/contrato/beneficiarios.test.ts` y
`agents/tests/test_beneficiarios_contrato.py`) exige que los dos den lo mismo, al bit.

La norma es 31 CFR § 1010.230(d), leída en su fuente el 2026-11-03: beneficiario es (1) cada persona que,
directa o indirectamente, tiene el 25 % o más de la participación («25 percent or more»: inclusivo) y (2)
una persona con responsabilidad significativa de controlar la sociedad. La participación indirecta se
calcula multiplicando el porcentaje de cada eslabón de un camino y sumando los caminos que llegan a la misma
persona (la norma no fija el cálculo; ADR-019).

Exacto: cada porcentaje es un texto con dos decimales a lo sumo y se lee en centésimas enteras; la
participación es una `Fraction`. El modelo solo extrae la estructura; quién es beneficiario lo decide este
código. Lo que no cierra (un ciclo, una suma de más del 100 %, un porcentaje mal escrito, alguien que no
está en la estructura) no se adivina: la estructura queda inválida, sin beneficiarios, y el caso suma una
inconsistencia que lo manda al oficial.
"""

from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from fractions import Fraction
from typing import Any

PORCENTAJE_TEXTO = re.compile(r"^(100(\.0{1,2})?|\d{1,2}(\.\d{1,2})?)$")
UMBRAL = Fraction(25, 100)
CIEN_POR_CIENTO = 10000

# : Las reglas del nodo, citables en el expediente (no viven en el archivo de listas: no son del mundo, son
# del plan).
REGLAS_BENEFICIARIOS: dict[str, dict[str, str]] = {
    "RB-01": {
        "es": "Es beneficiario final quien tiene, directa o indirectamente, el 25 % o más de la "
        "participación "
        "(31 CFR § 1010.230(d)(1)).",
        "en": "A beneficial owner is whoever holds, directly or indirectly, 25% or more of the ownership "
        "(31 CFR § 1010.230(d)(1)).",
    },
    "RB-02": {
        "es": "También es beneficiario final la persona que controla la sociedad (31 CFR § 1010.230(d)(2)).",
        "en": "The person who controls the company is also a beneficial owner (31 CFR § 1010.230(d)(2)).",
    },
    "RB-03": {
        "es": "La estructura societaria no cierra (un ciclo, una suma de más del 100 %, un porcentaje mal "
        "escrito o "
        "alguien que no está en ella): no se calculan beneficiarios y decide una persona.",
        "en": "The ownership structure does not add up (a cycle, a total above 100%, a malformed "
        "percentage or "
        "someone missing from it): no beneficial owners are computed and a person decides.",
    },
}


def centesimas(texto: Any) -> int | None:
    """«33.33» → 3333; `None` si no es un porcentaje con dos decimales a lo sumo."""
    if not isinstance(texto, str) or not PORCENTAJE_TEXTO.match(texto):
        return None
    entero, _, dec = texto.partition(".")
    return int(entero) * 100 + int(dec.ljust(2, "0"))


def _a_porcentaje(f: Fraction) -> str:
    """Dos decimales, redondeado a la mitad hacia arriba (como el lado TS)."""
    c = (f.numerator * CIEN_POR_CIENTO * 2 + f.denominator) // (2 * f.denominator)
    return f"{c // 100}.{c % 100:02d}"


def _lista(v: Any) -> list[Mapping[str, Any]]:
    return (
        [x for x in v if isinstance(x, Mapping)] if isinstance(v, Sequence) and not isinstance(v, str) else []
    )


def _ciclo_desde(participaciones: list[Mapping[str, Any]], raiz: str, nits: set[str]) -> str | None:
    en_camino: set[str] = set()
    cerrado: set[str] = set()

    def visitar(nit: str) -> str | None:
        if nit in en_camino:
            return nit
        if nit in cerrado:
            return None
        en_camino.add(nit)
        for x in participaciones:
            if x.get("participada") == nit and x.get("titular") in nits:
                r = visitar(str(x["titular"]))
                if r:
                    return r
        en_camino.discard(nit)
        cerrado.add(nit)
        return None

    return visitar(raiz)


def _problemas(e: Mapping[str, Any]) -> list[str]:
    p: list[str] = []
    entidades = _lista(e.get("entidades"))
    personas = _lista(e.get("personas"))
    participaciones = _lista(e.get("participaciones"))
    nits = {str(x.get("nit")) for x in entidades}
    docs = {str(x.get("documento")) for x in personas}
    entidad = e.get("entidad")
    if not entidad or entidad not in nits:
        p.append("sin_entidad")
    vistos: set[str] = set()
    for id_ in [str(x.get("nit")) for x in entidades] + [str(x.get("documento")) for x in personas]:
        if id_ in vistos:
            p.append(f"id_repetido:{id_}")
        vistos.add(id_)
    suma: dict[str, int] = {}
    for x in participaciones:
        titular, participada = str(x.get("titular")), str(x.get("participada"))
        c = centesimas(x.get("porcentaje"))
        if c is None or c == 0:
            p.append(f"porcentaje_invalido:{titular}>{participada}")
        if participada not in nits:
            p.append(f"referencia_rota:{participada}")
        if titular not in nits and titular not in docs:
            p.append(f"referencia_rota:{titular}")
        if c is not None:
            suma[participada] = suma.get(participada, 0) + c
    for x in entidades:
        if suma.get(str(x.get("nit")), 0) > CIEN_POR_CIENTO:
            p.append(f"suma_sobre_100:{x.get('nit')}")
    controla = e.get("controla")
    if isinstance(controla, Mapping) and controla.get("documento") not in docs:
        p.append(f"referencia_rota:{controla.get('documento')}")
    if entidad and entidad in nits:
        ciclo = _ciclo_desde(participaciones, str(entidad), nits)
        if ciclo:
            p.append(f"ciclo:{ciclo}")
    return list(dict.fromkeys(p))


def beneficiarios_de(e: Mapping[str, Any]) -> dict[str, Any]:
    """Los beneficiarios finales de la estructura, o por qué no se pueden calcular (mismas claves que el lado
    TS)."""
    problemas = _problemas(e)
    controla_dato = e.get("controla")
    controla = str(controla_dato["documento"]) if isinstance(controla_dato, Mapping) else None
    if problemas:
        return {
            "beneficiarios": None,
            "controla": controla,
            "participaciones": [],
            "por_participacion": [],
            "problemas": problemas,
            "valida": False,
        }
    personas = _lista(e.get("personas"))
    participaciones = _lista(e.get("participaciones"))
    docs = {str(x["documento"]) for x in personas}
    acumulado: dict[str, Fraction] = {str(x["documento"]): Fraction(0) for x in personas}

    def recorrer(nit: str, factor: Fraction) -> None:
        for x in participaciones:
            if x["participada"] != nit:
                continue
            f = factor * Fraction(centesimas(x["porcentaje"]) or 0, CIEN_POR_CIENTO)
            if x["titular"] in docs:
                acumulado[str(x["titular"])] += f
            else:
                recorrer(str(x["titular"]), f)

    recorrer(str(e["entidad"]), Fraction(1))
    efectivas = [
        {
            "den": str(acumulado[d].denominator),
            "documento": d,
            "num": str(acumulado[d].numerator),
            "porcentaje": _a_porcentaje(acumulado[d]),
        }
        for d in sorted(acumulado)
    ]
    # La comparación es exacta, sobre la fracción, nunca sobre el redondeo.
    por_participacion = [x["documento"] for x in efectivas if acumulado[x["documento"]] >= UMBRAL]
    return {
        "beneficiarios": sorted({*por_participacion, *([controla] if controla else [])}),
        "controla": controla,
        "participaciones": efectivas,
        "por_participacion": por_participacion,
        "problemas": [],
        "valida": True,
    }
