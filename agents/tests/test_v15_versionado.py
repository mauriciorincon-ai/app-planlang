"""Plan v1.5 del demo A (S3): la corrida versionada `runs/demo-a/simulado-v1.5-tope` se regenera con los
mismos bytes, y en ella y en casos sueltos se ve lo que la v1.5 cambia:
- la aprobación parcial (RB-08) sale sola con el modo Texas apagado, con su documento completo y un aviso
  que no dice que una persona la revisó; con el modo Texas encendido pasa por una persona;
- M-16: la carga que detecta la guardia de entrada es la primera arista de `decision`;
- M-8: la pausa recibe la orden adjunta, las aclaraciones y la cobertura;
- M-18: los umbrales se resuelven por su señal y el tope de alto costo por su referencia.
Regenerar: `agents/.venv/bin/python agents/tests/v15_simulado.py`."""

from __future__ import annotations

import copy
from pathlib import Path

import pytest
from conftest_demo_a import correr
from langgraph.checkpoint.memory import InMemorySaver
from v15_simulado import CORRIDA, LOTE_002, PLAN_V15, generar

from app_agents.canonico import leer_verificando
from app_agents.demo_a.documento_adverso import AVISO_IA, AVISO_IA_SIN_PERSONA, DECIDIDO_POR_REGLA
from app_agents.demo_a.grafo import construir_grafo
from app_agents.demo_a.nodos import exigir_pausa_en_negacion
from app_agents.demo_a.plan_beneficios import cargar_plan_beneficios
from app_agents.lotes import beneficios_del_lote
from app_agents.plan import RAIZ_REPO, PlanCargado, PlanInvalido, cargar_plan
from app_agents.reglas_arista import ErrorArista

VERSIONADA = RAIZ_REPO / "runs" / "demo-a" / CORRIDA
PLAN = cargar_plan(RAIZ_REPO / PLAN_V15)
LOTE = leer_verificando(RAIZ_REPO / LOTE_002)
PB = cargar_plan_beneficios(beneficios_del_lote(LOTE))


def _traza(caso: str) -> dict:
    return leer_verificando(VERSIONADA / "trazas" / f"{caso}.json")


def _caso(subtipo: str) -> dict:
    return next(c for c in LOTE["casos"] if c["subtipo"] == subtipo)


def _correr(caso: dict, umbrales: dict | None = None) -> dict:
    app = construir_grafo(PLAN, PB, checkpointer=InMemorySaver())
    return correr(caso, umbrales or PLAN.umbrales(), app=app)


def test_la_corrida_v15_se_regenera_identica(tmp_path: Path) -> None:
    generar(tmp_path)
    nueva = tmp_path / CORRIDA
    archivos = sorted(p.relative_to(VERSIONADA) for p in VERSIONADA.rglob("*.json"))
    assert archivos == sorted(p.relative_to(nueva) for p in nueva.rglob("*.json"))
    for f in archivos:
        assert (nueva / f).read_bytes() == (VERSIONADA / f).read_bytes(), f"difiere: {f}"


def test_el_lote_corre_con_el_plan_de_beneficios_de_su_huella() -> None:
    assert beneficios_del_lote(LOTE).name == "demo-a-v2.json"
    assert PB.con_topes()


def test_aprobacion_parcial_sin_texas_sale_sola_con_su_documento() -> None:
    caso = _caso("normal_sobre_tope")
    t = _traza(caso["id"])
    assert t["senales"]["decision_final"] == "aprobar_parcial"
    assert t["senales"]["pausa_humana"] is False
    doc = t["documento_adverso"]
    proc = PB.procedimiento(caso["entrada"]["orden_adjunta"]["codigo_procedimiento"])
    assert doc["decision"] == "aprobar_parcial" and doc["completo"] is True and doc["idiomas"] == ["es", "en"]
    assert doc["regla_disparada"]["id"] == "RB-08"
    assert doc["servicio"]["codigo"] == proc["codigo"]
    assert doc["monto"]["aprobado"] == proc["tope_cobertura"]
    assert doc["monto"]["negado"] == doc["monto"]["solicitado"] - proc["tope_cobertura"] > 0
    # Sin persona, ni el documento ni la salida dicen que una persona la revisó.
    assert doc["aviso_ia"] == AVISO_IA_SIN_PERSONA and doc["decidido_por"] == DECIDIDO_POR_REGLA
    assert t["salida_final"]["aviso_ia"] == AVISO_IA_SIN_PERSONA


def test_aprobacion_parcial_con_texas_pasa_por_una_persona() -> None:
    caso = _caso("normal_sobre_tope")
    final = _correr(caso, PLAN.umbrales({"U4": True}))
    assert final["modo_texas"] is True and final["pausa_humana"] is True
    assert final["decision_final"] == "aprobar_parcial"
    disparo = next(d for d in final["decisiones_de_arista"] if d["desde"] == "decision" and d["resultado"])
    assert disparo["funcion"] == "texas_y_no_aprobar"
    assert final["documento_adverso"]["aviso_ia"] == AVISO_IA


def test_carga_detectada_es_la_primera_arista_de_decision_y_llega_a_la_persona() -> None:
    caso = _caso("adversario_inyeccion_texto_libre")
    t = _traza(caso["id"])
    assert t["senales"]["carga_detectada"] is True and t["senales"]["pausa_humana"] is True
    disparo = next(d for d in t["decisiones_de_arista"] if d["desde"] == "decision" and d["resultado"])
    assert (disparo["orden_arista"], disparo["senal"]) == (1, "carga_detectada")
    payload = t["pausas_humanas"][0]["payload"]
    assert any("instrucciones escondidas" in e["es"] for e in payload["evidencia"])
    # Sin carga, la señal queda en falso en toda traza.
    limpias = [_traza(f"A-{i:03d}") for i in range(1, 21)]
    assert sum(x["senales"]["carga_detectada"] for x in limpias) == 1


def test_la_pausa_recibe_el_caso_completo_m8() -> None:
    t = _traza(_caso("adversario_inyeccion_texto_libre")["id"])
    payload = t["pausas_humanas"][0]["payload"]
    for clave in PLAN.contrato["pausas_humanas"][0]["payload_minimo"]:
        assert clave in payload, clave
    assert payload["orden_adjunta"]["codigo_procedimiento"]
    assert payload["cobertura"]["reglas_disparadas"]


def test_con_texas_la_arquitectura_corta_una_parcial_sin_pausa() -> None:
    with pytest.raises(ErrorArista, match="modo Texas"):
        exigir_pausa_en_negacion("aprobar_parcial", {"modo_texas": True, "pausa_humana": False})
    exigir_pausa_en_negacion("aprobar_parcial", {"modo_texas": False, "pausa_humana": False})


def test_m18_umbrales_por_senal_y_tope_por_referencia() -> None:
    assert PLAN.umbral_de_senal("costo_estimado")["id"] == "U2"
    assert PLAN.umbral_de_referencia(PB.tope_alto_costo, "costo_estimado")["id"] == "U2"
    with pytest.raises(PlanInvalido, match="no es el umbral de la señal"):
        PLAN.umbral_de_referencia("umbral.U1", "costo_estimado")
    with pytest.raises(PlanInvalido, match="no es una referencia"):
        PLAN.umbral_de_referencia("U2", "costo_estimado")
    # Renumerar los umbrales no rompe el agente: se buscan por su señal.
    datos = copy.deepcopy(PLAN.datos)
    for u in datos["umbrales"]:
        u["id"] = {"U1": "U7", "U2": "U8", "U3": "U3", "U4": "U9"}[u["id"]]
    renumerado = PlanCargado(datos, PLAN.archivo)
    assert renumerado.umbral_de_senal("modo_texas")["id"] == "U9"
