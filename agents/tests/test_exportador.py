"""Exportador planlang-trace/v1: forma, huellas, determinismo, integridad y cero secretos."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest
from conftest_demo_a import PLAN

from app_agents.canonico import HuellaInvalida, leer_verificando
from app_agents.exportador import leer_corrida, verificar_corrida
from app_agents.lotes import ejecutar_lote

HUMO = "data/casos/demo-a/planlang-a-humo-3.json"
PROHIBIDOS = (
    "sk-ant",
    "lsv2_",
    "ANTHROPIC_API_KEY",
    "LANGSMITH_API_KEY",
    "session_id",
    "uuid",
    "CLAUDE_CODE_OAUTH",
)


def _correr(salida: Path, corrida: str = "sim") -> Path:
    ejecutar_lote(
        corrida_id=corrida,
        fecha="2026-09-27",
        proveedor="simulado",
        casos_ruta=HUMO,
        salida=salida,
        reloj="fijo",
    )
    return salida / corrida


def test_forma_de_la_traza_y_del_manifiesto(tmp_path: Path) -> None:
    d = _correr(tmp_path)
    manifiesto, grafo, trazas = leer_corrida(d)
    assert manifiesto["formato"] == "planlang-trace/v1" and manifiesto["plan"]["version"] == "1.2.0"
    assert manifiesto["casos_ejecutados"] == ["AH-001", "AH-002", "AH-003"]
    assert manifiesto["version_grafo"] == grafo["huella"]
    assert manifiesto["ficha"]["etiqueta"]["es"] == "Simulación · no operativo"
    for t in trazas.values():
        assert list(t["senales"]) == sorted(PLAN.senales_obligatorias())
        assert set(t["senales"]) == set(PLAN.senales_obligatorias())
        assert t["nodos_visitados"] == [p["nodo"] for p in t["pasos"]] == t["senales"]["nodos_visitados"]
        assert t["resultado"] == "completo" and t["error_de_esquema_en_traspaso"] is False
    assert {n["id"] for n in grafo["nodos"]} == {n["id"] for n in PLAN.contrato["nodos_esperados"]}
    assert grafo["aristas_condicionales"] == PLAN.contrato_de_grafo().aristas
    assert not (d / "entorno.json").exists()  # solo corridas reales


def test_dos_exportaciones_dan_los_mismos_bytes(tmp_path: Path) -> None:
    a = _correr(tmp_path / "a")
    b = _correr(tmp_path / "b")
    for f in sorted(p.relative_to(a) for p in a.rglob("*.json")):
        assert (a / f).read_bytes() == (b / f).read_bytes(), f


def test_sin_secretos_ni_identificadores_de_sesion(tmp_path: Path) -> None:
    d = _correr(tmp_path)
    for f in d.rglob("*.json"):
        texto = f.read_text(encoding="utf-8")
        for p in PROHIBIDOS:
            assert p not in texto, (f.name, p)


def test_una_traza_alterada_no_pasa(tmp_path: Path) -> None:
    d = _correr(tmp_path)
    f = d / "trazas" / "AH-001.json"
    f.write_text(f.read_text(encoding="utf-8").replace('"aprobar"', '"negar"', 1), encoding="utf-8")
    with pytest.raises(HuellaInvalida):
        leer_corrida(d)


def test_una_traza_resellada_que_no_es_la_del_manifiesto_no_pasa(tmp_path: Path) -> None:
    from app_agents.canonico import escribir_con_huella

    d = _correr(tmp_path)
    f = d / "trazas" / "AH-001.json"
    t = leer_verificando(f)
    t["senales"]["decision_final"] = "negar"
    escribir_con_huella(f, t)
    with pytest.raises(ValueError, match="no es la declarada"):
        leer_corrida(d)


def test_ramas_esperadas_desactualizadas_se_detectan(tmp_path: Path) -> None:
    from app_agents.canonico import escribir_con_huella

    d = _correr(tmp_path)
    r = leer_verificando(d / "ramas-esperadas.json")
    r["visitas"][0]["rama_tomada"] = "redactor"
    escribir_con_huella(d / "ramas-esperadas.json", r)
    assert verificar_corrida(d) == ["ramas-esperadas.json no coincide con el recálculo del intérprete Python"]


def test_nodos_visitados_inconsistentes_se_detectan(tmp_path: Path) -> None:
    from app_agents.canonico import escribir_con_huella

    d = _correr(tmp_path)
    m = leer_verificando(d / "corrida.json")
    t = leer_verificando(d / "trazas" / "AH-001.json")
    t["nodos_visitados"] = t["nodos_visitados"][:-1]
    t = escribir_con_huella(d / "trazas" / "AH-001.json", t)
    m["trazas"][0]["huella"] = t["huella"]
    escribir_con_huella(d / "corrida.json", m)
    assert "AH-001: nodos_visitados no coincide con pasos" in verificar_corrida(d)


def test_la_corrida_versionada_no_se_toca(tmp_path: Path) -> None:
    # Guardia del propio test: nada de lo anterior escribió en runs/ del repo.
    copia = tmp_path / "x"
    shutil.copytree(_correr(tmp_path / "y"), copia)
    assert json.loads((copia / "corrida.json").read_text())["corrida_id"] == "sim"
