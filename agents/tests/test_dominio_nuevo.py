"""Un dominio nuevo es solo datos (S5): el entrevistador recorre `dom-seguridad-ia` sin cambios de código y
el fixture que escribe se regenera con los mismos bytes (gate de contrato: el lado TypeScript lo lee en
`tests/contrato/entrevista-dominio-nuevo.test.ts`)."""

from __future__ import annotations

from pathlib import Path

import pytest
from entrevista_dominio_nuevo import DOMINIO, FIXTURE, PLAN, entrevistar, generar

from app_agents.entrevistador.cli import DEMOS, DominioOPlanInvalido, demo_de_dominio


def test_la_entrevista_del_dominio_nuevo_se_regenera_con_los_mismos_bytes(tmp_path: Path) -> None:
    generar(tmp_path)
    for archivo in ("v0-borrador.json", "transcripcion.json"):
        assert (tmp_path / archivo).read_bytes() == (FIXTURE / archivo).read_bytes(), archivo


def test_el_borrador_trae_lo_de_la_plantilla_y_lo_que_respondio_el_usuario() -> None:
    r = entrevistar()
    assert r.terminada and r.borrador is not None
    b = r.borrador
    assert (b["id"], b["dominio_id"], b["estado_aprobacion"], b["huella"]) == (
        PLAN,
        DOMINIO,
        "borrador",
        None,
    )
    # Lo que la plantilla propone y el usuario aceptó conserva su origen; lo que respondió, el suyo.
    assert [a["id"] for a in b["actores"]][:4] == ["analista", "propietario", "auditor", "revisor"]
    assert {r["id"] for r in b["riesgos"]} == {"R1", "R2", "R3", "R4"}
    assert {c["origen"] for c in b["criterios_aceptacion"]} == {"plantilla"}
    assert {u["id"]: u["valor_en_plan"] for u in b["umbrales"]} == {"U1": 0.95, "U2": 3, "U3": 120}
    assert {d["id"]: d["estado"] for d in b["decisiones"]} == {
        "D1": "decidida",
        "D2": "decidida",
        "D3": "decidida",
        "D4": "decidida",
    }


def test_un_plan_real_no_choca_con_los_demos() -> None:
    d = demo_de_dominio(DOMINIO, "hackguard-agentes")
    assert (d.directorio, d.demo_id, d.plan_id) == (
        "plans/hackguard-agentes",
        "hackguard-agentes",
        "hackguard-agentes",
    )
    assert d.bandera == "--dominio dom-seguridad-ia --plan hackguard-agentes"
    # El demo de siempre se nombra como siempre.
    assert (DEMOS["b"].demo_id, DEMOS["b"].bandera) == ("demo-b", "--demo b")


@pytest.mark.parametrize(
    ("dominio", "plan"),
    [
        ("../x", "p"),  # el dominio no sale de data/dominios/
        (DOMINIO, "a/../b"),  # el plan no sale de plans/
        (DOMINIO, "con espacio"),
        (DOMINIO, ""),
        ("dom-que-no-existe", "p"),
    ],
)
def test_un_id_que_no_es_estable_o_una_plantilla_que_no_existe_se_rechazan(dominio: str, plan: str) -> None:
    with pytest.raises(DominioOPlanInvalido):
        demo_de_dominio(dominio, plan)
