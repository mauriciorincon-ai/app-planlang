"""Gate de contrato TS → Python sobre los lotes de casos (regla 19): los emite el generador de
TypeScript (`core/sintetico`) y los leerá el demo A en Python. Aquí Python recalcula la huella de cada
lote versionado con `rfc8785` + `hashlib`: textos en dos idiomas con tildes, «comillas», ñ y cifras."""

from __future__ import annotations

from pathlib import Path

import pytest

from app_agents.canonico import HuellaInvalida, leer_verificando

RAIZ = Path(__file__).resolve().parents[2]
CASOS = RAIZ / "data" / "casos" / "demo-a"
LOTES = sorted(CASOS.glob("*.json"))


def test_hay_lotes_versionados() -> None:
    assert {p.name for p in LOTES} >= {
        "planlang-a-001-20.json",
        "planlang-a-001-200.json",
        "planlang-a-humo-3.json",
    }


@pytest.mark.parametrize("ruta", LOTES, ids=lambda p: p.stem)
def test_la_huella_del_lote_verifica_desde_python(ruta: Path) -> None:
    lote = leer_verificando(ruta)
    assert lote["formato"] == "planlang-casos/v1"
    assert len(lote["casos"]) == lote["n"]
    plan = leer_verificando(RAIZ / "plans" / "demo-a" / "v1.json")
    assert lote["plan"]["huella"] == plan["huella"]


def test_el_prefijo_de_20_es_el_lote_de_20() -> None:
    l20 = leer_verificando(CASOS / "planlang-a-001-20.json")
    l200 = leer_verificando(CASOS / "planlang-a-001-200.json")
    assert l200["casos"][:20] == l20["casos"]


def test_un_lote_alterado_no_pasa(tmp_path: Path) -> None:
    texto = (CASOS / "planlang-a-humo-3.json").read_text(encoding="utf-8")
    (tmp_path / "alterado.json").write_text(texto.replace("Gracias.", "Gracias!", 1), encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_verificando(tmp_path / "alterado.json")
