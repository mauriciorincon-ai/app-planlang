"""Demo B con el plan v1.2 (S9): el nodo `beneficiarios` solo corre para una sociedad, el código decide
quiénes son sus beneficiarios finales (31 CFR § 1010.230(d), ADR-019) y una estructura que no cierra no se
adivina.

Corrida versionada: `runs/demo-b/simulado-b-002-20` (y su línea base `-base`) se regenera con los mismos
bytes.
Regenerar: `agents/.venv/bin/python -m app_agents.lotes --demo b --proveedor simulado \\
  --plan plans/demo-b/v1.2.json --casos data/casos/demo-b/planlang-b-002-20.json \\
  --corrida simulado-b-002-20 --fecha 2026-11-03 --reloj fijo` (y con
`--variante agente_unico --corrida simulado-b-002-20-base`). La lee también
`tests/contrato/traza-demo-b.test.ts` (Zod) y la cruza RF-09.2 en los dos lenguajes.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

from app_agents.adaptador import crear_modelo
from app_agents.demo_b.agente_unico import construir_grafo_linea_base
from app_agents.demo_b.estado import ContextoCasoB, estado_inicial
from app_agents.demo_b.grafo import construir_grafo
from app_agents.demo_b.guardia import identificadores_de_la_estructura
from app_agents.demo_b.mundo import cargar_listas
from app_agents.demo_b.simulacion import EntornoSimulado, RespondedorSimulado
from app_agents.exportador import verificar_corrida
from app_agents.lotes import ejecutar_lote
from app_agents.plan import RAIZ_REPO, PlanCargado, cargar_plan
from app_agents.reloj import RelojFijo

PLAN_V1 = cargar_plan(RAIZ_REPO / "plans" / "demo-b" / "v1.json")
PLAN = cargar_plan(RAIZ_REPO / "plans" / "demo-b" / "v1.2.json")
LISTAS = cargar_listas(RAIZ_REPO / "data" / "listas" / "demo-b.json")
RUTA_LOTE = "data/casos/demo-b/planlang-b-002-20.json"
LOTE = json.loads((RAIZ_REPO / RUTA_LOTE).read_text(encoding="utf-8"))
VERSIONADAS = RAIZ_REPO / "runs" / "demo-b"
CORRIDAS = ["simulado-b-002-20", "simulado-b-002-20-base"]


class Contador(RespondedorSimulado):
    def __init__(self, entorno: EntornoSimulado, titulos: list[str]) -> None:
        super().__init__(entorno)
        self.titulos = titulos

    def __call__(self, peticion: dict[str, Any]) -> Any:
        self.titulos.append((peticion.get("json_schema") or {}).get("title"))
        return super().__call__(peticion)


def correr(
    caso: dict[str, Any],
    plan: PlanCargado = PLAN,
    linea_base: bool = False,
    umbrales: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    construir = construir_grafo_linea_base if linea_base else construir_grafo
    app = construir(plan, LISTAS, checkpointer=InMemorySaver())
    entorno = EntornoSimulado(caso)
    titulos: list[str] = []
    modelo = crear_modelo("simulado", respondedor=Contador(entorno, titulos))
    ctx = ContextoCasoB(caso["id"], modelo, entorno, RelojFijo())
    cfg = {"configurable": {"thread_id": caso["id"]}}
    s = app.invoke(estado_inicial(caso, plan.umbrales(umbrales)), cfg, context=ctx)
    while "__interrupt__" in s:
        s = app.invoke(Command(resume=entorno.revisar(s["__interrupt__"][0].value)), cfg, context=ctx)
    return dict(app.get_state(cfg).values), titulos


def subtipo(s: str) -> dict[str, Any]:
    return next(c for c in LOTE["casos"] if c["subtipo"] == s)


def trazas(corrida: str) -> list[dict[str, Any]]:
    return [
        json.loads(p.read_text(encoding="utf-8"))
        for p in sorted((VERSIONADAS / corrida / "trazas").glob("*.json"))
    ]


@pytest.mark.parametrize("corrida", CORRIDAS)
def test_la_corrida_simulada_v1_2_se_regenera_identica(tmp_path: Path, corrida: str) -> None:
    ejecutar_lote(
        corrida_id=corrida,
        fecha="2026-11-03",
        proveedor="simulado",
        casos_ruta=RUTA_LOTE,
        plan_ruta="plans/demo-b/v1.2.json",
        salida=tmp_path,
        reloj="fijo",
        demo_clave="b",
        variante="agente_unico" if corrida.endswith("-base") else "multiagente",
    )
    versionada, nueva = VERSIONADAS / corrida, tmp_path / corrida
    archivos = sorted(p.relative_to(versionada) for p in versionada.rglob("*.json"))
    assert archivos == sorted(p.relative_to(nueva) for p in nueva.rglob("*.json"))
    for f in archivos:
        assert (nueva / f).read_bytes() == (versionada / f).read_bytes(), f"difiere: {f}"
    assert verificar_corrida(nueva) == []


@pytest.mark.parametrize("corrida", CORRIDAS)
def test_cada_sociedad_pasa_por_beneficiarios_y_cada_persona_no(corrida: str) -> None:
    casos = {c["id"]: c for c in LOTE["casos"]}
    juridicas = 0
    for t in trazas(corrida):
        v = casos[t["caso_id"]]["verdad_conocida"]
        if v.get("tipo_solicitante") == "juridica":
            juridicas += 1
            assert "beneficiarios" in t["nodos_visitados"], t["caso_id"]
            assert t["senales"]["beneficiarios"] == v["beneficiarios"], t["caso_id"]
            assert t["beneficiarios_detalle"]["valida"] is True
        else:
            assert "beneficiarios" not in t["nodos_visitados"], t["caso_id"]
            assert t["senales"]["tipo_solicitante"] == "natural"
            assert t["senales"]["beneficiarios"] is None
            assert t["beneficiarios_detalle"] is None
        assert t["senales"]["decision_final"] == v["decision"], t["caso_id"]
    assert juridicas == 8


def nodos(plan: PlanCargado) -> set[str]:
    grafo = construir_grafo(plan, LISTAS, checkpointer=InMemorySaver()).get_graph()
    return set(grafo.nodes) - {"__start__", "__end__"}


def test_el_plan_v1_sigue_armando_su_grafo_de_nueve_nodos() -> None:
    nodos_v1, nodos_v12 = nodos(PLAN_V1), nodos(PLAN)
    assert len(nodos_v1) == 9 and "beneficiarios" not in nodos_v1
    assert nodos_v12 == nodos_v1 | {"beneficiarios"}


def test_un_dueno_homonimo_de_la_lista_va_al_oficial_por_la_arista_de_beneficiarios() -> None:
    caso = subtipo("adversario_juridica_beneficiario_homonimo")
    s, _ = correr(caso)
    assert s["similitud_beneficiarios_max"] == 1
    disparo = [d for d in s["decisiones_de_arista"] if d["resultado"] and d["desde"] == "decision"]
    assert [d["senal"] for d in disparo] == ["similitud_beneficiarios_max"]
    assert disparo[0]["rama_tomada"] == "pausa_humana"
    assert s["pausa_humana"] is True
    # El oficial ve a los dueños con su participación y su cruce con las listas.
    payload = s["pausas"][0]["payload"]
    assert payload["beneficiarios"]["beneficiarios"] == caso["verdad_conocida"]["beneficiarios"]
    assert s["decision_final"] == caso["verdad_conocida"]["decision"]


def test_quien_controla_sin_ser_dueno_tambien_es_beneficiario_y_el_expediente_lo_cita() -> None:
    caso = subtipo("normal_juridica_control_no_dueno")
    s, _ = correr(caso)
    d = s["beneficiarios_detalle"]
    assert d["controla"] not in d["por_participacion"]
    assert d["controla"] in s["beneficiarios"]
    citas = [c["cita"] for c in s["expediente"]["conclusiones"] if c["tema"] == "beneficiarios"]
    assert {"tipo": "regla", "ref": "RB-01,RB-02"} in citas
    assert s["expediente"]["conclusiones_sin_cita"] == 0


@pytest.mark.parametrize(
    ("dano", "problema"),
    [
        (lambda e: e["participaciones"][0].update(porcentaje="99.00"), "suma_sobre_100:"),
        (lambda e: e["participaciones"][0].update(porcentaje="60,00"), "porcentaje_invalido:"),
        (lambda e: e["participaciones"][0].update(titular="SYN-ID-000000"), "referencia_rota:"),
    ],
    ids=["suma_sobre_100", "porcentaje_mal_escrito", "dueno_que_no_esta"],
)
def test_una_estructura_que_no_cierra_no_se_adivina_y_decide_una_persona(dano: Any, problema: str) -> None:
    caso = copy.deepcopy(subtipo("normal_juridica_directa"))
    dano(caso["simulacion"]["estructura_extraida"])
    s, _ = correr(caso)
    d = s["beneficiarios_detalle"]
    assert d["valida"] is False and any(p.startswith(problema) for p in d["problemas"]), d["problemas"]
    assert s["beneficiarios"] is None and s["similitud_beneficiarios_max"] is None
    assert {"campo": "estructura", "regla": "RB-03"} in s["puntaje"]["inconsistencias"]
    assert s["pausa_humana"] is True
    citas = [c["cita"] for c in s["expediente"]["conclusiones"] if c["tema"] == "beneficiarios"]
    assert citas == [{"tipo": "regla", "ref": "RB-03"}]


def test_una_estructura_que_no_cierra_es_una_inconsistencia_y_con_tolerancia_mayor_no_pausa() -> None:
    """S9 M2: RB-03 suma UNA inconsistencia y la arista es `inconsistencias > U3`; la pausa depende de la
    tolerancia (0 en el plan). El texto del manual y de la pantalla dice lo mismo (S10)."""
    caso = copy.deepcopy(subtipo("normal_juridica_directa"))
    caso["simulacion"]["estructura_extraida"]["participaciones"][0]["porcentaje"] = "no es un número"
    en_el_plan, _ = correr(copy.deepcopy(caso))
    tolerante, _ = correr(copy.deepcopy(caso), umbrales={"U3": 1})
    assert en_el_plan["inconsistencias"] == tolerante["inconsistencias"] == 1
    assert en_el_plan["pausa_humana"] is True
    assert tolerante["pausa_humana"] is False


def test_una_sociedad_sin_estructura_tampoco_se_adivina() -> None:
    caso = copy.deepcopy(subtipo("normal_juridica_directa"))
    caso["simulacion"]["estructura_extraida"] = None
    s, _ = correr(caso)
    assert s["beneficiarios_detalle"]["problemas"] == ["sin_estructura"]
    assert s["pausa_humana"] is True


def test_la_linea_base_resuelve_la_sociedad_con_una_sola_llamada() -> None:
    caso = subtipo("borde_juridica_dos_caminos")
    s, titulos = correr(caso, linea_base=True)
    assert titulos == ["ExtraccionEIdentidadEstructura"]
    assert s["beneficiarios"] == caso["verdad_conocida"]["beneficiarios"]
    _, titulos_multi = correr(caso)
    assert titulos_multi[0] == "ExtraccionBEstructura"


def test_el_esquema_acota_lo_que_el_modelo_puede_escribir() -> None:
    """S10 M3: el esquema admite hasta el doble del tope del nodo; más de eso no llega al grafo."""
    from pydantic import ValidationError

    from app_agents.demo_b.beneficiarios import TOPE_ENTIDADES
    from app_agents.demo_b.esquemas import Estructura

    def con(n: int) -> dict[str, Any]:
        entidades = [{"nit": f"SYN-NIT-{i:06d}", "nombre": f"S{i}"} for i in range(n)]
        return {
            "entidad": "SYN-NIT-000000",
            "entidades": entidades,
            "personas": [],
            "participaciones": [],
            "controla": None,
        }

    Estructura.model_validate(con(2 * TOPE_ENTIDADES))
    with pytest.raises(ValidationError):
        Estructura.model_validate(con(2 * TOPE_ENTIDADES + 1))


def test_la_guardia_de_salida_solo_deja_propio_lo_que_el_certificado_trae() -> None:
    """B6: la estructura la escribe el modelo; un identificador que el certificado de la solicitud no trae
    no se vuelve «propio» porque el modelo lo listó (alucinación o carga escondida): la guardia lo filtra."""
    sociedad = next(c for c in LOTE["casos"] if c["entrada"]["documentos"].get("existencia"))
    certificado = sociedad["entrada"]["documentos"]["existencia"]["es"]
    verdadero = sociedad["verdad_conocida"]["estructura"]["personas"][0]["documento"]
    assert verdadero in certificado
    ajeno = "SYN-ID-999999"
    assert ajeno not in certificado
    estructura = {
        "entidades": [],
        "personas": [{"documento": verdadero}, {"documento": ajeno}],
    }
    assert identificadores_de_la_estructura(estructura, sociedad["entrada"]["documentos"]) == {verdadero}
    assert identificadores_de_la_estructura(None, sociedad["entrada"]["documentos"]) == set()
    assert identificadores_de_la_estructura(estructura, {}) == set()
