"""Ejecutor de lotes: acumulación sin duplicar (RF-05.5), límite de uso (R8), traza parcial ante error de
proveedor (R7), compatibilidad de sesiones, línea base de agente único y la CLI."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from app_agents import lotes
from app_agents.adaptador import ErrorProveedor
from app_agents.canonico import escribir_con_huella, leer_verificando
from app_agents.demo_a import simulacion as simulacion_a
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


def test_un_lote_de_otro_plan_solo_vale_si_da_la_misma_verdad(tmp_path: Path) -> None:
    # El lote de 20 se generó con la v1.1; la v1.2 (por defecto) solo cambió la medición: se acepta.
    assert _lote(tmp_path, n=1).ejecutados == ["A-001"]
    # Un plan con otro umbral en un directorio donde no está la v1.1: se rechaza.
    v12 = leer_verificando(lotes.RAIZ_REPO / lotes.PLAN_POR_DEFECTO)
    otro = dict(v12, umbrales=[dict(u, valor_en_plan=900) if u["id"] == "U2" else u for u in v12["umbrales"]])
    planes = tmp_path / "planes"
    escribir_con_huella(planes / "otro.json", otro)
    with pytest.raises(lotes.CorridaIncompatible, match="cambia umbrales"):
        _lote(tmp_path / "x", n=1, plan_ruta=planes / "otro.json")
    # Aunque la v1.1 esté a su lado: el umbral distinto cambia la verdad conocida.
    escribir_con_huella(planes / "v1.1.json", leer_verificando(lotes.RAIZ_REPO / "plans/demo-a/v1.1.json"))
    with pytest.raises(lotes.CorridaIncompatible):
        _lote(tmp_path / "y", n=1, plan_ruta=planes / "otro.json")


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
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=5)
    assert r.detenida_por == "limite_de_uso" and r.limites_alcanzados == 1
    assert r.ejecutados == ["A-001"]  # A-002 cae en su segunda llamada y se reintenta en otra sesión
    m, _, _ = leer_corrida(tmp_path / "c")
    assert m["sesiones"][0]["detenida_por"] == "limite_de_uso"
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", RespondedorSimulado)
    r2 = _lote(tmp_path, n=1)
    assert r2.ejecutados == ["A-002"]


def test_esquema_invalido_tras_los_reintentos_deja_traza_parcial(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "esquema_invalido", "en": 1, "veces": 3})
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", falla)
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
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", falla)
    r = _lote(tmp_path, n=1)
    assert r.con_error == []
    t = leer_verificando(tmp_path / "c" / "trazas" / "A-001.json")
    extractor = next(p for p in t["pasos"] if p["nodo"] == "extractor")
    assert extractor["reintentos_esquema"] == 1


class _Excepcion(RespondedorSimulado):
    """Una excepción que nadie clasificó (un fallo de red, un bug) en la llamada `en` de la sesión."""

    llamadas = 0
    en = 4

    def __call__(self, peticion: dict[str, Any]) -> Any:
        type(self).llamadas += 1
        if type(self).llamadas == self.en:
            raise ConnectionError("simulado")
        return super().__call__(peticion)


def test_una_excepcion_no_clasificada_no_se_lleva_las_trazas(tmp_path: Path, monkeypatch) -> None:
    """M-9: el caso terminado queda escrito, la sesión «detenida por excepción», el en curso pendiente."""
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", type("E", (_Excepcion,), {"llamadas": 0}))
    with pytest.raises(ConnectionError):
        _lote(tmp_path, n=5)
    m, _, trazas = leer_corrida(tmp_path / "c")
    assert m["casos_ejecutados"] == ["A-001"]
    assert m["sesiones"][0]["detenida_por"] == "excepcion"
    assert list(trazas) == ["A-001"]
    assert verificar_corrida(tmp_path / "c") == []
    # La sesión siguiente retoma desde A-002 sin duplicar.
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", RespondedorSimulado)
    r = _lote(tmp_path, n=1)
    assert r.ejecutados == ["A-002"]


def test_otro_error_no_se_reintenta_y_deja_traza_parcial(tmp_path: Path, monkeypatch) -> None:
    falla = type("F", (_Falla,), {"llamadas": 0, "tipo": "otro", "en": 1, "veces": 1})
    monkeypatch.setattr(simulacion_a, "RespondedorSimulado", falla)
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


def test_el_tamano_de_sesion_y_el_modelo_salen_del_plan(tmp_path: Path) -> None:
    # AU-10: un plan que declara sesiones de 2 corre 2 casos sin que nadie pase --n.
    v12 = leer_verificando(lotes.RAIZ_REPO / lotes.PLAN_POR_DEFECTO)
    chico = dict(v12, lotes=dict(v12["lotes"], corridas_espaciadas_de=2, modelo_alias="haiku"))
    planes = tmp_path / "planes"
    escribir_con_huella(planes / "chico.json", chico)
    escribir_con_huella(planes / "v1.1.json", leer_verificando(lotes.RAIZ_REPO / "plans/demo-a/v1.1.json"))
    r = _lote(tmp_path / "s", plan_ruta=planes / "chico.json")
    assert r.ejecutados == ["A-001", "A-002"] and r.pendientes == 18
    # Con la suscripción, el plan fija el techo y exige espaciar: se rechaza ANTES de invocar el binario.
    with pytest.raises(ValueError, match="a lo sumo 2 casos"):
        _lote(tmp_path / "t", plan_ruta=planes / "chico.json", proveedor="suscripcion", n=3, pausa_s=2)
    with pytest.raises(ValueError, match="espaciados"):
        _lote(tmp_path / "u", plan_ruta=planes / "chico.json", proveedor="suscripcion", pausa_s=0)


def test_la_cli_exige_espaciar_con_la_suscripcion(tmp_path: Path) -> None:
    with pytest.raises(SystemExit):
        lotes.main(["--proveedor", "suscripcion", "--casos", LOTE20, "--salida", str(tmp_path)])


def test_un_lote_de_otro_plan_de_beneficios_se_rechaza(tmp_path: Path) -> None:
    # M-2: la verdad conocida del lote se derivó con su plan de beneficios; con otro, no vale.
    pb = leer_verificando(lotes.RAIZ_REPO / lotes.BENEFICIOS_POR_DEFECTO)
    otro = tmp_path / "pb.json"
    escribir_con_huella(otro, dict(pb, version="9.9.9"))
    with pytest.raises(lotes.CorridaIncompatible, match="plan de beneficios"):
        _lote(tmp_path / "z", n=1, beneficios_ruta=otro)


# ── AU-9: sin proveedor, el caso va a una persona (plan v1.4) ─────────────────────────────────────────────


def _respaldo(tmp_path: Path, fallas: dict[str, tuple[str, str]], n: int):
    from respaldo_simulado import CORRIDA, generar

    r = generar(tmp_path, fallas, n)
    return r, tmp_path / CORRIDA


def test_sin_proveedor_al_extraer_el_caso_va_a_una_persona(tmp_path: Path) -> None:
    r, corrida = _respaldo(tmp_path, {"A-001": ("Extraccion", "otro")}, 1)
    assert r.ejecutados == ["A-001"] and r.con_error == []
    t = leer_verificando(corrida / "trazas" / "A-001.json")
    assert t["resultado"] == "completo" and t["error_proveedor"] == "otro"
    assert t["nodos_visitados"] == ["enrutador", "extractor", "pausa_humana", "redactor", "guardia_salida"]
    s = t["senales"]
    assert (s["proveedor_no_disponible"], s["error_proveedor"], s["pausa_humana"]) == (True, "otro", True)
    assert s["decision_final"] == "aprobar" and s["senal_confianza"] is None
    extractor = [d for d in t["decisiones_de_arista"] if d["desde"] == "extractor"]
    assert [(d["orden_arista"], d["valor_observado"], d["resultado"]) for d in extractor] == [
        (1, True, True),
        (2, None, False),  # la arista de faltantes no se cumple con la señal nula
    ]
    paso = next(p for p in t["pasos"] if p["nodo"] == "extractor")
    assert (paso["error_proveedor"], paso["costo_nominal_usd"]) == ("otro", 0.01)
    assert t["pausas_humanas"][0]["payload"]["senal"] == "proveedor_no_disponible"
    assert t["salida_final"] is not None
    assert verificar_corrida(corrida) == []


def test_una_negacion_sin_proveedor_la_decide_la_persona_con_su_documento(tmp_path: Path) -> None:
    _, corrida = _respaldo(tmp_path, {"A-004": ("Extraccion", "timeout")}, 4)
    t = leer_verificando(corrida / "trazas" / "A-004.json")
    assert t["senales"]["decision_final"] == "negar" and t["senales"]["pausa_humana"] is True
    assert t["pausas_humanas"][0]["respuesta_simulada"]["decision"] == "negar"
    assert t["documento_adverso"] is not None
    # AU-S2-9: sin extracción, el documento no está completo (C8 lo reporta) y la persona no decide con una
    # evidencia vacía: el payload le dice qué falló y que decide con el texto original.
    assert t["documento_adverso"]["completo"] is False
    payload = t["pausas_humanas"][0]["payload"]
    assert payload["extraccion"] is None and payload["texto_original"]
    assert [e["es"] for e in payload["evidencia"]] == [
        "El modelo no respondió (timeout): el caso llega sin la lectura que faltaba y se decide con el texto "
        "original."
    ]
    # Los casos sin falla de la misma sesión no cambian: A-001 aprueba sin pasar por la persona.
    a1 = leer_verificando(corrida / "trazas" / "A-001.json")
    assert a1["senales"]["proveedor_no_disponible"] is False and a1["senales"]["pausa_humana"] is False
    assert verificar_corrida(corrida) == []


def test_sin_proveedor_al_aclarar_el_caso_va_a_una_persona(tmp_path: Path) -> None:
    _, corrida = _respaldo(tmp_path, {"A-008": ("PreguntaAclaracion", "esquema_invalido")}, 8)
    t = leer_verificando(corrida / "trazas" / "A-008.json")
    assert t["nodos_visitados"][:4] == ["enrutador", "extractor", "aclaracion", "pausa_humana"]
    assert t["aclaraciones"] == [] and t["error_de_esquema_en_traspaso"] is True
    aclaracion = [d for d in t["decisiones_de_arista"] if d["desde"] == "aclaracion"]
    assert [(d["orden_arista"], d["resultado"], d["rama_tomada"]) for d in aclaracion] == [
        (1, True, "pausa_humana"),
        (2, False, "pausa_humana"),
    ]
    assert t["senales"]["error_proveedor"] == "esquema_invalido"
    assert verificar_corrida(corrida) == []


def test_el_limite_de_uso_no_pasa_a_una_persona(tmp_path: Path) -> None:
    """R8 sigue igual con la v1.4: el límite detiene la sesión y el caso se reintenta después."""
    r, corrida = _respaldo(tmp_path, {"A-001": ("Extraccion", "limite_de_uso")}, 2)
    assert r.detenida_por == "limite_de_uso" and r.ejecutados == []
    assert not (corrida / "trazas" / "A-001.json").exists()


def test_el_manual_dice_con_que_plan_y_lote_corre_lote_demo_por_defecto():
    """AU-S2-B10: sin `--plan`, `pnpm lote:demo` corre con el plan y el lote por defecto, y el manual lo
    dice en los dos idiomas (no es ni el plan publicado ni el último; quien quiera el v1.4 lo pide)."""
    manual = (lotes.RAIZ_REPO / "docs" / "MANUAL-DE-USO.md").read_text(encoding="utf-8")
    es, en = manual.split("## English", 1)
    for mitad in (es, en):
        assert f"`{lotes.PLAN_POR_DEFECTO}`" in mitad
        assert f"`{lotes.CASOS_POR_DEFECTO}`" in mitad
