"""Intérprete Python de aristas (RF-09.2 lado Python): tabla de operadores con empates e `inclusivo`,
igualdad estricta de tipo, función nombrada del modo Texas, orden «primera verdadera gana» y recálculo
de toda corrida versionada. El último test prueba que el gate PUEDE fallar: un intérprete que ignora
`inclusivo` se detecta nombrando el caso de empate."""

from __future__ import annotations

from pathlib import Path

import pytest

from app_agents import exportador, reglas_arista
from app_agents.plan import RAIZ_REPO
from app_agents.reglas_arista import (
    ErrorArista,
    comparar,
    decidir,
    evaluar_arista,
    recalcular,
    resolver_valor,
)

CORRIDAS = sorted(p.parent for p in (RAIZ_REPO / "runs" / "demo-a").glob("*/corrida.json"))


@pytest.mark.parametrize(
    ("obs", "op", "val", "incl", "esperado"),
    [
        (0.75, "menor_que", 0.75, False, False),
        (0.75, "menor_que", 0.75, True, True),
        (0.74, "menor_que", 0.75, False, True),
        (1000, "mayor_que", 1000, False, False),
        (1000, "mayor_que", 1000, True, True),
        (1001, "mayor_que", 1000, False, True),
        (2, "mayor_o_igual_que", 2, True, True),
        (1, "mayor_o_igual_que", 2, True, False),
        (2, "menor_o_igual_que", 2, True, True),
        (3, "menor_o_igual_que", 2, True, False),
        ("urgencia", "igual_a", "urgencia", False, True),
        ("urgencia", "igual_a", "urgencia", True, True),
        ("ambulatoria", "distinto_de", "urgencia", False, True),
        (True, "igual_a", True, False, True),
        (True, "igual_a", 1, False, False),
        (1, "igual_a", 1.0, False, True),
        (False, "distinto_de", 0, False, True),
    ],
)
def test_tabla_de_operadores(obs, op, val, incl, esperado) -> None:
    assert comparar(obs, op, val, incl) is esperado


def test_orden_solo_entre_numeros_y_operador_conocido() -> None:
    with pytest.raises(ErrorArista):
        comparar("a", "menor_que", "b", False)
    with pytest.raises(ErrorArista):
        comparar(True, "mayor_que", 0, False)
    with pytest.raises(ErrorArista):
        comparar(1, "parecido_a", 1, False)
    with pytest.raises(ErrorArista):
        comparar(None, "mayor_que", "x", False)


def test_una_senal_nula_no_cumple_ninguna_comparacion_de_orden() -> None:
    """AU-9: sin proveedor el extractor no observa sus señales (nulas) y su arista de faltantes es falsa."""
    for op in ("menor_que", "mayor_que", "menor_o_igual_que", "mayor_o_igual_que"):
        assert comparar(None, op, 0, False) is False
        assert comparar(None, op, 0.75, True) is False


def test_con_senal_nula_tampoco_es_distinta() -> None:
    """AU-S2-B51: el nulo no cumple ninguna comparación, tampoco «distinto de» (como el intérprete TS)."""
    assert comparar(None, "distinto_de", "urgencia", False) is False
    assert comparar(None, "igual_a", "urgencia", False) is False


def test_operador_desconocido_aun_con_senal_nula() -> None:
    with pytest.raises(ErrorArista, match="operador desconocido"):
        comparar(None, "parecido_a", 0.75, False)


def test_resolver_valor() -> None:
    assert resolver_valor("umbral.U1", {"U1": 0.75}) == 0.75
    assert resolver_valor("urgencia", {}) == "urgencia"
    assert resolver_valor(0, {}) == 0
    with pytest.raises(ErrorArista):
        resolver_valor("umbral.U9", {"U1": 0.75})


def test_funcion_texas() -> None:
    arista = {
        "desde": "decision",
        "orden": 5,
        "funcion": {"nombre": "texas_y_no_aprobar"},
        "si_verdadero": "p",
    }

    def r(modo, propuesta):
        return evaluar_arista(arista, {"modo_texas": modo, "propuesta": propuesta}, {})["resultado"]

    assert r(True, "negar") is True
    assert r(True, "aprobar") is False
    assert r(False, "negar") is False
    with pytest.raises(ErrorArista):
        evaluar_arista({**arista, "funcion": {"nombre": "inventada"}}, {}, {})


def test_decidir_evalua_todas_y_gana_la_primera_verdadera() -> None:
    aristas = [
        {
            "desde": "d",
            "orden": 2,
            "senal": "b",
            "operador": "igual_a",
            "valor": True,
            "inclusivo": False,
            "si_verdadero": "y",
        },
        {
            "desde": "d",
            "orden": 1,
            "senal": "a",
            "operador": "mayor_que",
            "valor": "umbral.U2",
            "inclusivo": False,
            "si_verdadero": "x",
        },
    ]
    rama, regs = decidir(aristas, "z", {"a": 5, "b": True}, {"U2": 1}, paso=7)
    assert rama == "x"
    assert [r["orden_arista"] for r in regs] == [1, 2]
    assert [r["resultado"] for r in regs] == [True, True]
    assert {r["rama_tomada"] for r in regs} == {"x"} and {r["paso"] for r in regs} == {7}
    assert regs[0]["umbral_aplicado"] == 1 and regs[0]["valor_declarado"] == "umbral.U2"
    assert decidir(aristas, "z", {"a": 0, "b": False}, {"U2": 1}, paso=1)[0] == "z"
    with pytest.raises(ErrorArista):
        decidir(aristas, "z", {"a": 5}, {"U2": 1}, paso=1)


@pytest.mark.parametrize("corrida", CORRIDAS, ids=lambda p: p.name)
def test_rf_09_2_lado_python_sobre_toda_corrida_versionada(corrida: Path) -> None:
    assert exportador.verificar_corrida(corrida) == []


def test_el_gate_puede_fallar_un_interprete_que_ignora_inclusivo(monkeypatch: pytest.MonkeyPatch) -> None:
    original = reglas_arista.comparar

    def roto(observado, operador, declarado, inclusivo):
        if operador == "menor_que":
            return observado <= declarado  # ignora `inclusivo`: el defecto que RF-09.2 debe cazar
        return original(observado, operador, declarado, inclusivo)

    monkeypatch.setattr(reglas_arista, "comparar", roto)
    problemas = exportador.verificar_corrida(RAIZ_REPO / "runs" / "demo-a" / "simulado-3casos")
    assert any(p.startswith("AH-002 paso 4 decision") for p in problemas), problemas
    assert "ramas-esperadas.json no coincide con el recálculo del intérprete Python" in problemas


def test_recalcular_agrupa_por_visita() -> None:
    aristas = [
        {
            "desde": "e",
            "orden": 1,
            "senal": "n",
            "operador": "mayor_que",
            "valor": 0,
            "inclusivo": False,
            "si_verdadero": "a",
            "si_falso": "b",
        }
    ]
    _, r1 = decidir(aristas, "b", {"n": 2}, {}, paso=2)
    _, r2 = decidir(aristas, "b", {"n": 0}, {}, paso=4)
    assert recalcular(r1 + r2, aristas, {"e": "b"}, {}) == [
        {"desde": "e", "paso": 2, "rama_tomada": "a", "resultados": [True]},
        {"desde": "e", "paso": 4, "rama_tomada": "b", "resultados": [False]},
    ]
