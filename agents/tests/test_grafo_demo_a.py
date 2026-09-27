"""Grafo del demo A con el proveedor simulado: rutas del contrato, pausas con payload completo, límite de
aclaraciones, separación control/datos (D1: nada identificable llega al modelo; el redactor no ve el texto
libre) y la señal escrita ANTES de enrutar (el enrutamiento exige la rama registrada)."""

from __future__ import annotations

from typing import Any

import pytest
from conftest_demo_a import HUMO, LOTE_20, PB, PLAN, correr, de_subtipo
from langgraph.checkpoint.memory import InMemorySaver

from app_agents.demo_a import nodos as nodos_mod
from app_agents.demo_a.grafo import NODOS, construir_grafo
from app_agents.demo_a.simulacion import RespondedorSimulado
from app_agents.plan import PlanInvalido
from app_agents.reglas_arista import ErrorArista

PAYLOAD = {"motivo", "senal", "umbral", "extraccion", "texto_original", "evidencia", "contraevidencia"}


@pytest.mark.parametrize("caso", LOTE_20["casos"] + HUMO["casos"], ids=lambda c: f"{c['id']}-{c['subtipo']}")
def test_con_extraccion_simulada_el_grafo_llega_a_la_verdad_conocida(caso: dict[str, Any]) -> None:
    s = correr(caso)
    v = caso["verdad_conocida"]
    assert s["decision_final"] == v["decision"]
    assert s["pausa_humana"] == v["debe_escalar"]
    assert [p["nodo"] for p in s["pasos"]][0] == "enrutador"
    assert s["pasos"][-1]["nodo"] == "guardia_salida"
    if s["decision_final"] == "negar":  # C1 y C8
        assert s["pausa_humana"] is True
        assert s["documento_adverso"]["completo"] is True
        assert s["documento_adverso"]["idiomas"] == ["es", "en"]
    for p in s["pausas"]:  # C9
        assert set(p["payload"]) == PAYLOAD
        assert p["respuesta_simulada"]["politica"] == "sigue_verdad_conocida"
    assert s["salida_final"]["aviso_ia"]["es"].startswith("Aviso:")


@pytest.mark.parametrize("subtipo", ["normal_urgencia", "normal_exento", "borde_urgencia_cobertura_dudosa"])
def test_urgencias_y_exentos_no_pasan_por_el_verificador(subtipo: str) -> None:
    s = correr(de_subtipo(LOTE_20, subtipo))
    assert [p["nodo"] for p in s["pasos"]] == ["enrutador", "redactor", "guardia_salida"]
    assert s["decision_final"] == "aprobar"


def test_dos_aclaraciones_se_usan_las_dos_con_u3_igual_a_2() -> None:
    s = correr(de_subtipo(LOTE_20, "faltante_dos_ciclos"))
    nodos = [p["nodo"] for p in s["pasos"]]
    assert nodos.count("aclaracion") == 2 and nodos.count("extractor") == 3
    assert "pausa_humana" not in nodos and s["aclaraciones_hechas"] == 2
    visitas = [d for d in s["decisiones_de_arista"] if d["desde"] == "aclaracion"]
    assert [d["valor_observado"] for d in visitas] == [0, 1]


def test_con_u3_igual_a_1_el_mismo_caso_va_a_pausa_humana() -> None:
    s = correr(de_subtipo(LOTE_20, "faltante_dos_ciclos"), umbrales={**PLAN.umbrales(), "U3": 1})
    assert s["pausa_humana"] is True and s["aclaraciones_hechas"] == 1
    assert s["pausas"][0]["payload"]["senal"] == "ciclos_aclaracion"


def test_sin_respuesta_se_agota_en_u3_y_escala() -> None:
    s = correr(de_subtipo(LOTE_20, "faltante_sin_respuesta"))
    assert s["aclaraciones_hechas"] == 2 and s["pausa_humana"] is True
    assert s["decision_final"] == "aprobar"  # la duda favorece al afiliado (art. 8)


def test_empate_en_u1_y_u2_no_pausa() -> None:
    s = correr(HUMO["casos"][1])
    decision = [d for d in s["decisiones_de_arista"] if d["desde"] == "decision"]
    assert [
        (d["senal"], d["valor_observado"], d["umbral_aplicado"], d["resultado"]) for d in decision[:2]
    ] == [
        ("senal_confianza", 0.75, 0.75, False),
        ("costo_estimado", 1000, 1000, False),
    ]
    assert s["pausa_humana"] is False


def test_modo_texas_encendido_registra_la_funcion_verdadera_en_una_negacion() -> None:
    s = correr(HUMO["casos"][2], umbrales={**PLAN.umbrales(), "U4": True})
    texas = next(d for d in s["decisiones_de_arista"] if d["tipo"] == "funcion")
    assert texas["entradas"] == {"modo_texas": True, "propuesta": "negar"} and texas["resultado"] is True


class Espia(RespondedorSimulado):
    def __init__(self) -> None:
        self.peticiones: list[dict[str, Any]] = []

    def enlazar(self, entorno: Any) -> None:
        super().__init__(entorno)

    def __call__(self, peticion: dict[str, Any]) -> Any:
        self.peticiones.append(peticion)
        return super().__call__(peticion)


def test_d1_ningun_identificador_llega_al_modelo_y_el_redactor_no_ve_el_texto() -> None:
    caso = de_subtipo(LOTE_20, "adversario_dato_sensible")
    espia = Espia()
    s = correr(caso, respondedor=espia)
    textos = [p["system"] + p["prompt"] for p in espia.peticiones]
    for ident in caso["identificadores_sinteticos"]:
        assert all(ident not in t for t in textos), ident
    assert any("[DOCUMENTO]" in t for t in textos)
    redactor = next(p for p in espia.peticiones if p["json_schema"]["title"] == "Carta")
    assert "Nota del médico" not in redactor["prompt"]
    # El simulador «filtra» un documento a la carta: la guardia lo quita y lo registra.
    assert caso["entrada"]["afiliado"]["documento"] not in s["salida_final"]["es"]
    assert s["severidad_accion"] == 2


def test_el_enrutamiento_exige_la_rama_registrada() -> None:
    nodos = nodos_mod.NodosDemoA(PLAN, PB)
    estado = {
        "umbrales_aplicados": PLAN.umbrales(),
        "tipo_atencion": "urgencia",
        "servicio_exento": False,
        "decisiones_de_arista": [
            {
                "desde": "enrutador",
                "paso": 1,
                "rama_tomada": "extractor",
                "orden_arista": 1,
                "resultado": False,
            }
        ],
    }
    with pytest.raises(ErrorArista):
        nodos.ruta("enrutador")(estado)  # type: ignore[arg-type]


def test_el_grafo_exige_los_nodos_del_plan() -> None:
    plan_roto = type(PLAN)(
        datos={
            **PLAN.datos,
            "contrato_de_grafo": {**PLAN.contrato, "nodos_esperados": PLAN.contrato["nodos_esperados"][:-1]},
        },
        archivo="x",
    )
    with pytest.raises(PlanInvalido):
        construir_grafo(plan_roto, PB, checkpointer=InMemorySaver())
    assert len(NODOS) == 8
