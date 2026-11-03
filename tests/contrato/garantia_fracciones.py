"""Oráculo de la garantía de la calibración (S8, regla 19; ADR-018), con `fractions` y nada más que la
stdlib.

Lee `tests/contrato/garantia-entradas.json` (lo escribe `scripts/garantia-contrato.ts`) y calcula,
para cada caso, lo mismo que `core/brecha/garantia.ts`, escrito aparte desde la especificación:
Learn then Test con secuencia fija, el umbral conformal con su «+ 1» y la cobertura conjunta de
Bonferroni, con las colas binomiales en `Fraction`. Escribe `tests/contrato/garantia-esperada.json`:
la garantía de cada caso y la cola exacta de cada prueba («num/den»). La prueba TS
(`tests/contrato/garantia.test.ts`) exige lo mismo al bit; `agents/tests/test_garantia_contrato.py`
exige que el archivo esté al día.

Uso: python3 tests/contrato/garantia_fracciones.py [--escribir]
"""

from __future__ import annotations

import json
import sys
from fractions import Fraction
from math import comb
from pathlib import Path
from typing import Any

RAIZ = Path(__file__).resolve().parents[2]
ENTRADAS = RAIZ / "tests" / "contrato" / "garantia-entradas.json"
ESPERADA = RAIZ / "tests" / "contrato" / "garantia-esperada.json"
FORMATO = "planlang-contrato-garantia/v1"

NIVELES = (Fraction(1, 20), Fraction(1, 10), Fraction(1, 5))
ALFA_DEL_INFORME = Fraction(1, 10)
DELTA = Fraction(1, 10)
TOPE_DE_ESCALA = 20
OPERADORES = ("menor_que", "menor_o_igual_que")


def cola(n: int, e: int, alfa: Fraction) -> Fraction:
    """P(Bin(n, alfa) <= e), exacta."""
    return sum(
        (comb(n, i) * alfa**i * (1 - alfa) ** (n - i) for i in range(min(e, n) + 1)),
        Fraction(0),
    )


def decimal(x: Fraction, decimales: int = 4) -> float:
    """Redondeo a la mitad hacia arriba con `decimales` fijos, leído como número."""
    f = 10**decimales
    q = (2 * x.numerator * f + x.denominator) // (2 * x.denominator)
    return float(f"{q // f}.{q % f:0{decimales}d}")


def casos_sin_errores(alfa: Fraction, delta: Fraction) -> int:
    n = 0
    while (1 - alfa) ** n > delta:
        n += 1
    return n


def decide_solo(c: float, u: float, operador: str, inclusivo: bool) -> bool:
    escala = c <= u if operador == "menor_o_igual_que" or inclusivo else c < u
    return not escala


class Colas:
    """Cada cola que se calcula, con su valor exacto, para que la prueba TS la compare."""

    def __init__(self) -> None:
        self.vistas: dict[tuple[int, int, Fraction], Fraction] = {}

    def prueba(self, n: int, e: int, alfa: Fraction, delta: Fraction) -> dict[str, Any]:
        p = cola(n, e, alfa)
        self.vistas[(n, e, alfa)] = p
        return {"aceptados": n, "errores": e, "p": decimal(p), "rechaza": p <= delta}

    def faltan(
        self, u: float, n: int, e: int, alfa: Fraction, delta: Fraction, nodo: str | None
    ) -> dict[str, Any]:
        base = {"nodo": nodo, "umbral": u, "aceptados": n, "errores": e}
        if e == 0:
            return {**base, "motivo": "pocos_casos", "casos": casos_sin_errores(alfa, delta)}
        if Fraction(e, n) >= alfa:
            return {**base, "motivo": "tasa_sobre_alfa", "casos": None}
        for m in range(2, TOPE_DE_ESCALA + 1):
            if self.prueba(m * n, m * e, alfa, delta)["rechaza"]:
                return {**base, "motivo": "tasa_cerca_de_alfa", "casos": m * n}
        return {**base, "motivo": "tasa_cerca_de_alfa", "casos": None}


def garantia(e: dict[str, Any], colas: Colas) -> dict[str, Any] | None:
    operador, inclusivo = e["operador"], e["inclusivo"]
    if operador not in OPERADORES or not e["rejilla"]:
        return None
    muestras = sorted(e["muestras"], key=lambda m: m["caso_id"])
    orden = sorted(e["rejilla"], reverse=True)

    def solo(c: float, u: float) -> bool:
        return decide_solo(c, u, operador, inclusivo)

    etapas = []
    for et in e["etapas"]:
        medidas = [m["etapas"].get(et["nodo"]) for m in muestras]
        medidas = [v for v in medidas if isinstance(v, bool)]
        etapas.append(
            {
                "nodo": et["nodo"],
                "observada": et["observada"] and len(medidas) > 0,
                "casos": len(medidas) if et["observada"] else 0,
                "errores": sum(1 for v in medidas if not v) if et["observada"] else 0,
            }
        )
    nodos = [x["nodo"] for x in etapas if x["observada"]]
    comun = [m for m in muestras if all(isinstance(m["etapas"].get(n), bool) for n in nodos)]
    aciertos = sorted(m["confianza"] for m in muestras if m["correcto"])

    def conjunta(alfa: Fraction) -> dict[str, Any]:
        k = len(nodos)
        a, d = alfa / k, DELTA / k
        pruebas = []
        for u in orden:
            solos = [m for m in comun if solo(m["confianza"], u)]
            por_etapa = [
                {
                    "nodo": n,
                    **colas.prueba(len(solos), sum(1 for m in solos if m["etapas"][n] is False), a, d),
                }
                for n in nodos
            ]
            rechaza = all(x["rechaza"] for x in por_etapa)
            pruebas.append({"umbral": u, "etapas": por_etapa, "rechaza": rechaza})
            if not rechaza:
                break
        respaldadas = [p for p in pruebas if p["rechaza"]]
        en_umbral = respaldadas[-1]["umbral"] if respaldadas else orden[0]
        solos = [m for m in comun if solo(m["confianza"], en_umbral)]
        fallan = sum(1 for m in solos if any(m["etapas"][n] is False for n in nodos))
        peor = None
        if not respaldadas:
            for x in pruebas[0]["etapas"]:
                if x["rechaza"]:
                    continue
                f = colas.faltan(pruebas[0]["umbral"], x["aceptados"], x["errores"], a, d, x["nodo"])
                peso = float("inf") if f["motivo"] == "tasa_sobre_alfa" or f["casos"] is None else f["casos"]
                if peor is None or peso > peor[0]:
                    peor = (peso, f)
        return {
            "k": k,
            "nodos": nodos,
            "alfa_por_etapa": decimal(a, 6),
            "delta_por_etapa": decimal(d, 6),
            "casos": len(comun),
            "umbral": respaldadas[-1]["umbral"] if respaldadas else None,
            "pruebas": pruebas,
            "error_observado": {
                "umbral": en_umbral,
                "aceptados": len(solos),
                "errores": fallan,
                "tasa": decimal(Fraction(fallan, len(solos))) if solos else None,
            },
            "faltan": peor[1] if peor else None,
        }

    def nivel(alfa: Fraction) -> dict[str, Any]:
        pruebas = []
        for u in orden:
            solos = [m for m in muestras if solo(m["confianza"], u)]
            p = {
                "umbral": u,
                **colas.prueba(len(solos), sum(1 for m in solos if not m["correcto"]), alfa, DELTA),
            }
            pruebas.append(p)
            if not p["rechaza"]:
                break
        respaldados = [p for p in pruebas if p["rechaza"]]
        estrella = respaldados[-1] if respaldados else None
        n_c = len(aciertos)
        indice = (n_c + 1) * alfa.numerator // alfa.denominator
        tau_c = aciertos[indice - 1] if indice >= 1 else None
        umbrales = (
            sorted(p["umbral"] for p in respaldados if solo(tau_c, p["umbral"])) if tau_c is not None else []
        )
        zona = {"desde": umbrales[0], "hasta": umbrales[-1], "umbrales": umbrales} if umbrales else None
        if zona:
            sin_zona = None
        elif estrella is None:
            sin_zona = "sin_umbral_con_garantia"
        elif tau_c is None:
            sin_zona = "sin_cota_conformal"
        else:
            sin_zona = "conformal_bajo_el_umbral"
        aplicado = e["umbral_aplicado"]
        return {
            "alfa": decimal(alfa, 6),
            "umbral_con_garantia": {
                "umbral": estrella["umbral"] if estrella else None,
                "cobertura": decimal(Fraction(estrella["aceptados"], len(muestras)))
                if estrella and muestras
                else None,
                "riesgo": decimal(Fraction(estrella["errores"], estrella["aceptados"]))
                if estrella and estrella["aceptados"] > 0
                else None,
                "pruebas": pruebas,
                "faltan": None
                if estrella or not pruebas
                else colas.faltan(
                    pruebas[0]["umbral"],
                    pruebas[0]["aceptados"],
                    pruebas[0]["errores"],
                    alfa,
                    DELTA,
                    None,
                ),
            },
            "conformal": {
                "n_aciertos": n_c,
                "indice": indice,
                "umbral": tau_c,
                "aciertos_minimos": -(-alfa.denominator // alfa.numerator) - 1,
            },
            "zona": zona,
            "sin_zona": sin_zona,
            "umbral_aplicado_en_zona": None
            if aplicado is None
            else (aplicado in zona["umbrales"] if zona else False),
            "conjunta": conjunta(alfa) if nodos else None,
        }

    return {
        "delta": decimal(DELTA, 6),
        "alfa_del_informe": decimal(ALFA_DEL_INFORME, 6),
        "umbral_aplicado": e["umbral_aplicado"],
        "n": len(muestras),
        "aciertos": len(aciertos),
        "etapas": etapas,
        "niveles": [nivel(a) for a in NIVELES],
    }


def esperada(entradas: dict[str, Any]) -> dict[str, Any]:
    casos = []
    for c in entradas["casos"]:
        colas = Colas()
        g = garantia(c["entrada"], colas)
        casos.append(
            {
                "nombre": c["nombre"],
                "garantia": g,
                "colas": [
                    {
                        "n": n,
                        "e": e,
                        "alfa": f"{a.numerator}/{a.denominator}",
                        "p": f"{p.numerator}/{p.denominator}",
                    }
                    for (n, e, a), p in sorted(colas.vistas.items())
                ],
            }
        )
    return {"formato": FORMATO, "casos": casos}


def texto(obj: dict[str, Any]) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def calcular() -> str:
    return texto(esperada(json.loads(ENTRADAS.read_text(encoding="utf-8"))))


if __name__ == "__main__":
    salida = calcular()
    if "--escribir" in sys.argv:
        ESPERADA.write_text(salida, encoding="utf-8")
        print(f"✓ {ESPERADA.relative_to(RAIZ)}")
    else:
        sys.stdout.write(salida)
