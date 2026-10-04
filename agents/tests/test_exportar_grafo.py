"""Frescura del código por nodo que publica la vitrina (P3, pestaña «Código»): regenerarlo da los mismos bytes
que el archivo versionado; cada nodo del grafo trae su función, sus líneas y lo que escribe."""

from __future__ import annotations

import json

from app_agents import exportar_grafo as eg
from app_agents.canonico import huella
from app_agents.demo_a.grafo import NODOS


def test_el_archivo_versionado_esta_al_dia() -> None:
    assert eg.SALIDA.read_text(encoding="utf-8") == eg.texto(), (
        "grafo-codigo.json desactualizado: corre `python -m app_agents.exportar_grafo`"
    )


def test_cada_nodo_trae_su_funcion_lineas_y_lo_que_escribe() -> None:
    datos = json.loads(eg.SALIDA.read_text(encoding="utf-8"))
    assert datos["huella"] == huella(datos)
    assert list(datos["nodos"]) == sorted(NODOS)
    for n, b in datos["nodos"].items():
        assert b["archivo"] == "agents/src/app_agents/demo_a/nodos.py"
        assert b["codigo"].startswith(f"def {n}(")
        assert b["hasta"] - b["desde"] + 1 == len(b["codigo"].splitlines())
        assert "pasos" in b["escribe"]
    escribe = {n: set(b["escribe"]) for n, b in datos["nodos"].items()}
    assert escribe["enrutador"] == {"decisiones_de_arista", "pasos", "servicio_exento", "tipo_atencion"}
    assert "decision_final" in datos["nodos"]["pausa_humana"]["escribe"]
    # Sigue los nombres locales: `{**senales, …}` en el extractor y `return salida` en la aclaración.
    assert {"senal_confianza", "campos_faltantes_count", "costo_estimado"} <= escribe["extractor"]
    assert {"ciclos_aclaracion", "aclaraciones", "aclaraciones_hechas"} <= escribe["aclaracion"]
    assert datos["estado"]["codigo"].startswith("class Estado(TypedDict")
    assert datos["ruta"]["codigo"].startswith("def ruta(")


def test_sin_url_ni_rutas_absolutas() -> None:
    texto = eg.SALIDA.read_text(encoding="utf-8")
    assert "http" not in texto and "/Users/" not in texto and "/home/" not in texto


def test_verificar_detecta_un_archivo_viejo(tmp_path, monkeypatch) -> None:
    viejo = tmp_path / "grafo-codigo.json"
    viejo.write_text("{}\n", encoding="utf-8")
    monkeypatch.setattr(eg, "SALIDA", viejo)
    assert eg.main(["--verificar"]) == 1
    assert eg.main([]) == 0
    assert eg.main(["--verificar"]) == 0
