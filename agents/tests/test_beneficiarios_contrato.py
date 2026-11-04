"""Frescura del contrato de los beneficiarios finales (S9, regla 19; ADR-019).

`tests/contrato/beneficiarios-esperada.json` es EXACTAMENTE lo que calcula hoy el nodo del agente
(`app_agents.demo_b.beneficiarios`) sobre `tests/contrato/beneficiarios-entradas.json`; la prueba TS
(`tests/contrato/beneficiarios.test.ts`) le exige al gemelo de verdad lo mismo al bit. Y la verdad conocida de
cada persona jurídica del lote versionado es la que calcula el nodo.
"""

from __future__ import annotations

import importlib.util
import json
from fractions import Fraction
from pathlib import Path

from app_agents.demo_b.beneficiarios import beneficiarios_de, centesimas

RAIZ = Path(__file__).resolve().parents[2]
RUTA = RAIZ / "tests" / "contrato" / "beneficiarios_agente.py"
LOTE = RAIZ / "data" / "casos" / "demo-b" / "planlang-b-002-20.json"

_spec = importlib.util.spec_from_file_location("beneficiarios_agente", RUTA)
assert _spec and _spec.loader
oraculo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(oraculo)


def test_lo_esperado_esta_al_dia() -> None:
    assert oraculo.ESPERADA.exists(), (
        "genera: agents/.venv/bin/python tests/contrato/beneficiarios_agente.py --escribir"
    )
    assert oraculo.ESPERADA.read_text(encoding="utf-8") == oraculo.calcular()


def test_la_verdad_del_lote_es_la_del_nodo() -> None:
    lote = json.loads(LOTE.read_text(encoding="utf-8"))
    juridicos = [c for c in lote["casos"] if c["verdad_conocida"].get("tipo_solicitante") == "juridica"]
    assert len(juridicos) == 8
    for c in juridicos:
        v = c["verdad_conocida"]
        assert beneficiarios_de(v["estructura"])["beneficiarios"] == v["beneficiarios"], c["id"]


def test_los_porcentajes_se_leen_en_centesimas_exactas() -> None:
    assert centesimas("33.33") == 3333
    assert centesimas("100") == 10000
    assert centesimas("0.5") == 50
    for malo in ("33.333", "101", "60,5", "", None, 60):
        assert centesimas(malo) is None


def test_el_25_es_inclusivo_y_se_decide_sobre_la_fraccion() -> None:
    def estructura(porcentajes: list[tuple[str, str, str]]) -> dict:
        return {
            "entidad": "SYN-NIT-100000",
            "entidades": [{"nit": "SYN-NIT-100000", "nombre": "S"}, {"nit": "SYN-NIT-200000", "nombre": "E"}],
            "personas": [{"documento": f"SYN-ID-00000{i}", "nombre": f"P{i}"} for i in (1, 2)],
            "participaciones": [{"titular": t, "participada": p, "porcentaje": x} for t, p, x in porcentajes],
            "controla": None,
        }

    exacto = beneficiarios_de(estructura([("SYN-ID-000001", "SYN-NIT-100000", "25.00")]))
    assert exacto["por_participacion"] == ["SYN-ID-000001"]
    # 49,99 % de un 50 %: 24,995 % se muestra 25,00 y no llega.
    casi = beneficiarios_de(
        estructura(
            [
                ("SYN-NIT-200000", "SYN-NIT-100000", "49.99"),
                ("SYN-ID-000001", "SYN-NIT-200000", "50.00"),
            ]
        )
    )
    p1 = next(x for x in casi["participaciones"] if x["documento"] == "SYN-ID-000001")
    assert p1["porcentaje"] == "25.00"
    assert Fraction(int(p1["num"]), int(p1["den"])) < Fraction(1, 4)
    assert casi["por_participacion"] == []
