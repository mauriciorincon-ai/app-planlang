"""Ejecutor de lotes: acumulación sin duplicar (RF-05.5), límite de uso (R8), traza parcial ante error de
proveedor (R7), compatibilidad de sesiones, línea base de agente único y la CLI."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from app_agents import lotes
from app_agents.adaptador import ErrorProveedor
from app_agents.canonico import leer_verificando
from app_agents.demo_a.simulacion import RespondedorSimulado
from app_agents.exportador import leer_corrida, verificar_corrida

LOTE20 = "data/casos/demo-a/planlang-a-001-20.json"
HUMO = "data/casos/demo-a/planlang-a-humo-3.json"


def _lote(salida: Path, **kw: Any) -> lotes.ResumenSesion:
    base = {
        "corrida_id": "c",
        "fecha": "2026-09-27",
        "proveedor": "simulado",
        "casos_ruta": LOTE20,
        "salida": salida,
        "reloj": "fijo",
    }
    return lotes.ejecutar_lote(**{**base, **kw})


def test_sesiones_acumulables_sin_duplicar(tmp_path: Path) -> None:
    r1 = _lote(tmp_path, n=2)
    r2 = _lote(tmp_path, n=3, fecha="2026-09-28")
    assert r1.ejecutados == ["A-001", "A-002"] and r2.ejecutados == ["A-003", "A-004", "A-005"]
    assert r2.pendientes == 15
    m, _, trazas = leer_corrida(tmp_path / "c")
    assert m["casos_ejecutados"] == ["A-001", "A-002", "A-003", "A-004", "A-005"] and len(trazas) == 5
    assert [s["fecha"] for s in m["sesiones"]] == ["2026-09-27", "2026-09-28"]
    assert m["fecha"] == "2026-09-27"
    assert verificar_corrida(tmp_path / "c") == []


def test_no_mezcla_sesiones_incompatibles(tmp_path: Path) -> None:
    _lote(tmp_path, n=1)
    with pytest.raises(lotes.CorridaIncompatible):
        _lote(tmp_path, n=1, variante="agente_unico")
    with pytest.raises(lotes.CorridaIncompatible):
        _lote(tmp_path, n=1, casos_ruta=HUMO)


class _Falla(RespondedorSimulado):
    """Falla en las llamadas `en` … `en + veces - 1` (contadas en toda la sesión)."""

    llamadas = 0
    tipo = "limite_de_uso"
    en = 4
    veces = 1

    def __call__(self, peticion: dict[str, Any]) -> Any:
        type(self).llamadas += 1
        if self.en <= type(self).llamadas < self.en + self.veces:
            raise ErrorProveedor(self.tipo, "simulado", 0.01)
        return super().__call__(peticion)


def test_limite_de_uso_detiene_la_sesion_y_no_exporta_el_caso(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "limite_de_uso", "en": 4, "veces": 1})
    monkeypatch.setattr(lotes, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=5)
    assert r.detenida_por == "limite_de_uso" and r.limites_alcanzados == 1
    assert r.ejecutados == ["A-001"]  # A-002 cae en su segunda llamada y se reintenta en otra sesión
    m, _, _ = leer_corrida(tmp_path / "c")
    assert m["sesiones"][0]["detenida_por"] == "limite_de_uso"
    monkeypatch.setattr(lotes, "RespondedorSimulado", RespondedorSimulado)
    r2 = _lote(tmp_path, n=1)
    assert r2.ejecutados == ["A-002"]


def test_esquema_invalido_tras_los_reintentos_deja_traza_parcial(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "esquema_invalido", "en": 1, "veces": 3})
    monkeypatch.setattr(lotes, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=1)
    assert r.con_error == ["A-001"]
    t = leer_verificando(tmp_path / "c" / "trazas" / "A-001.json")
    assert t["resultado"] == "error" and t["error_de_esquema_en_traspaso"] is True
    ultimo = t["pasos"][-1]
    assert (ultimo["nodo"], ultimo["error_proveedor"], ultimo["costo_nominal_usd"]) == (
        "extractor",
        "esquema_invalido",
        0.03,
    )
    assert t["senales"]["decision_final"] is None and t["salida_final"] is None
    assert leer_verificando(tmp_path / "c" / "corrida.json")["casos_con_error"] == ["A-001"]


def test_un_esquema_invalido_aislado_se_reintenta_y_queda_registrado(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "esquema_invalido", "en": 1, "veces": 1})
    monkeypatch.setattr(lotes, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=1)
    assert r.con_error == []
    t = leer_verificando(tmp_path / "c" / "trazas" / "A-001.json")
    extractor = next(p for p in t["pasos"] if p["nodo"] == "extractor")
    assert extractor["reintentos_esquema"] == 1


def test_otro_error_no_se_reintenta_y_deja_traza_parcial(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "otro", "en": 1, "veces": 1})
    monkeypatch.setattr(lotes, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=2)
    assert r.con_error == ["A-001"] and r.ejecutados == ["A-001", "A-002"]
    t = leer_verificando(tmp_path / "c" / "trazas" / "A-001.json")
    assert t["error_proveedor"] == "otro" and t["error_de_esquema_en_traspaso"] is False


def test_linea_base_de_agente_unico(tmp_path: Path) -> None:
    _lote(tmp_path, corrida_id="b", variante="agente_unico")
    m, grafo, trazas = leer_corrida(tmp_path / "b")
    assert m["variante"] == "agente_unico" and len(trazas) == 20
    assert {n["id"] for n in grafo["nodos"]} >= {"agente_unico", "cierre"}
    assert all(a["desde"] != "aclaracion" for a in grafo["aristas_condicionales"])
    llamadas = [sum(p["nodo"] == "agente_unico" for p in t["pasos"]) for t in trazas.values()]
    assert max(llamadas) <= 1  # presupuesto: una llamada por caso como máximo
    lote = leer_verificando(lotes._ruta(LOTE20))
    verdad = {c["id"]: c["verdad_conocida"]["decision"] for c in lote["casos"]}
    assert all(t["senales"]["decision_final"] == verdad[c] for c, t in trazas.items())
    assert verificar_corrida(tmp_path / "b") == []


def test_la_cli(tmp_path: Path, capsys) -> None:
    rc = lotes.main(
        ["--proveedor", "simulado", "--casos", HUMO, "--salida", str(tmp_path), "--fecha", "2026-09-27"]
    )
    assert rc == 0
    assert "corrida simulado-planlang-a-humo-3: 3 casos" in capsys.readouterr().out
    assert (tmp_path / "simulado-planlang-a-humo-3" / "corrida.json").exists()
    with pytest.raises(ValueError):
        _lote(tmp_path, variante="otra")
