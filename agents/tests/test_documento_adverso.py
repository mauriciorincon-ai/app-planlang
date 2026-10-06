"""Documento de decisión adversa (C8): completo, bilingüe, con causal tasada, regla, datos, versión y vía."""

from __future__ import annotations

from conftest_demo_a import PB, PLAN

from app_agents.demo_a.documento_adverso import (
    AVISO_IA,
    AVISO_IA_HASTA_V15,
    AVISO_IA_SIN_PERSONA,
    aviso_ia,
    documento_adverso,
)


def _doc(**cambios):
    base = {
        "caso_id": "A-004",
        "procedimiento": PB.procedimiento("SYN-P-038"),
        "causal": PB.causal("d"),
        "regla": PB.regla("RB-03"),
        "extraccion": {
            "campos": {"procedimiento": "SYN-P-038", "diagnostico": "SYN-D-34", "costo_estimado": 650}
        },
        "plan": {"id": PLAN.id, "version": PLAN.version, "huella": PLAN.huella},
        "plan_beneficios": PB.referencia(),
    }
    return documento_adverso(**{**base, **cambios})


def test_completo_y_bilingue() -> None:
    d = _doc()
    assert d["completo"] is True and d["idiomas"] == ["es", "en"]
    assert d["causal"]["norma"].endswith("literal d")
    assert d["regla_disparada"]["id"] == "RB-03"
    assert [x["campo"] for x in d["datos_usados"]] == ["procedimiento", "diagnostico", "costo_estimado"]
    assert d["version"]["plan"]["version"] == "1.2.0"
    for campo in ("via_de_contradiccion", "decidido_por", "aviso_ia"):
        assert d[campo]["es"] and d[campo]["en"]
    assert d["aviso_ia"] == AVISO_IA_HASTA_V15


def test_el_aviso_dice_negacion_completa_desde_el_plan_v1_5_1() -> None:
    """F22: con el v1.5 la parte negada sale sin persona si el modo Texas está apagado; desde el v1.5.1 el
    aviso no promete más de lo que el agente cumple. Hasta el v1.5, el texto que sus corridas dejaron
    escrito."""
    assert "negación completa" in AVISO_IA["es"] and "full denial" in AVISO_IA["en"]
    assert _doc(plan={"id": PLAN.id, "version": "1.5.1", "huella": PLAN.huella})["aviso_ia"] == AVISO_IA
    assert [aviso_ia("negar", True, v) for v in ("1.4.0", "1.5.0", "1.5.1", "1.6.0")] == [
        AVISO_IA_HASTA_V15,
        AVISO_IA_HASTA_V15,
        AVISO_IA,
        AVISO_IA,
    ]
    assert aviso_ia("aprobar_parcial", False, "1.5.1") == AVISO_IA_SIN_PERSONA


def test_sin_causal_no_esta_completo() -> None:
    assert _doc(causal=None)["completo"] is False
    assert _doc(extraccion=None)["completo"] is False
