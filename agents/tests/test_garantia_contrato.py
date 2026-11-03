"""Frescura del oráculo de la garantía (S8, regla 19).

`tests/contrato/garantia-esperada.json` es EXACTAMENTE lo que calcula hoy
`tests/contrato/garantia_fracciones.py` con `fractions` sobre
`tests/contrato/garantia-entradas.json`; la prueba TS (`tests/contrato/garantia.test.ts`) le exige
al núcleo lo mismo al bit.
"""

from __future__ import annotations

import importlib.util
import json
from fractions import Fraction
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
RUTA = RAIZ / "tests" / "contrato" / "garantia_fracciones.py"

_spec = importlib.util.spec_from_file_location("garantia_fracciones", RUTA)
assert _spec and _spec.loader
oraculo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(oraculo)


def test_lo_esperado_esta_al_dia() -> None:
    assert oraculo.ESPERADA.exists(), "genera: python3 tests/contrato/garantia_fracciones.py --escribir"
    assert oraculo.ESPERADA.read_text(encoding="utf-8") == oraculo.calcular()


def test_la_cola_es_exacta() -> None:
    # P(Bin(2, 1/2) <= 1) = 3/4; P(Bin(3, 1/10) <= 0) = (9/10)^3.
    assert oraculo.cola(2, 1, Fraction(1, 2)) == Fraction(3, 4)
    assert oraculo.cola(3, 0, Fraction(1, 10)) == Fraction(729, 1000)
    assert oraculo.cola(0, 0, Fraction(1, 10)) == 1


def test_el_redondeo_es_a_la_mitad_hacia_arriba() -> None:
    assert oraculo.decimal(Fraction(1, 8), 2) == 0.13
    assert oraculo.decimal(Fraction(1, 3)) == 0.3333
    assert oraculo.decimal(Fraction(1, 1)) == 1.0


def test_casos_sin_errores_es_el_menor_n_con_la_cota() -> None:
    # (1 − α)ⁿ ≤ δ: 22 con α = 0,10 y δ = 0,10 (0,9²¹ ≈ 0,109 > 0,1 ≥ 0,9²² ≈ 0,098).
    assert oraculo.casos_sin_errores(Fraction(1, 10), Fraction(1, 10)) == 22
    assert oraculo.casos_sin_errores(Fraction(1, 20), Fraction(1, 10)) == 45


def test_la_corrida_publicada_tiene_zona_y_dice_lo_que_no_alcanza() -> None:
    esperada = json.loads(oraculo.ESPERADA.read_text(encoding="utf-8"))
    g = next(c for c in esperada["casos"] if c["nombre"] == "publicada-demo-a")["garantia"]
    diez = next(n for n in g["niveles"] if n["alfa"] == 0.1)
    assert diez["zona"]["desde"] == 0.5 and diez["zona"]["hasta"] == 0.9
    assert diez["conjunta"]["umbral"] is None
    assert diez["conjunta"]["faltan"]["motivo"] == "tasa_cerca_de_alfa"
