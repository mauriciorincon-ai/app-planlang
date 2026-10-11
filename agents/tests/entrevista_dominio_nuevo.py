"""Entrevista simulada de un dominio nuevo (S5): `dom-seguridad-ia`, sin tocar el entrevistador ni `core/`.

Es el gate de contrato de «un dominio nuevo es solo datos» (regla 19): Python escribe el borrador y la
transcripción con su serializador real en `tests/contrato/entrevista-dominio-nuevo/` y TypeScript los lee con
el esquema del plan, M1 y las contradicciones. `test_dominio_nuevo.py` la regenera y exige los mismos bytes.

Las respuestas son un FIXTURE de prueba, no la entrevista del plan de HackGuard: sus valores son
deliberadamente distintos de los que el usuario dé (similitud 0,95; 3 fuentes; 120 días). La entrevista real
la corre el usuario.
Regenerar: `agents/.venv/bin/python agents/tests/entrevista_dominio_nuevo.py`.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from entrevista_simulada import FECHA, VOCABULARIO, _b, _decidir

from app_agents.adaptador import crear_modelo
from app_agents.canonico import escribir_bonito, escribir_con_huella
from app_agents.entrevistador.cli import Lector, Resultado, demo_de_dominio, ejecutar
from app_agents.entrevistador.plantilla import cargar_plantilla
from app_agents.plan import RAIZ_REPO

DOMINIO = "dom-seguridad-ia"
PLAN = "fixture-dominio-nuevo"
FIXTURE = RAIZ_REPO / "tests" / "contrato" / "entrevista-dominio-nuevo"
RESPUESTAS: dict[str, str] = {
    "P01": "Las alertas de dependencias se acumulan sin leer. Los agentes proponen pruebas y asocian "
    "resultados, y jamás cierran un hallazgo por su cuenta.",
    "P02": "acepto",
    "P03": "Llega la tarea; si es investigar, el investigador propone y el código verifica las fuentes; "
    "si es extraer, se filtra el texto, se extraen campos con cita, el código verifica las citas y "
    "calcula el veredicto; una persona confirma.",
    "P04": "Solo fuentes de la lista blanca, comprobadas por código.",
    "P05": "El veredicto lo calcula la regla del catálogo sobre campos con cita verificada.",
    "P06": "La severidad la fija siempre una persona.",
    "P07": "Una prueba nueva es borrador hasta que una persona la aprueba.",
    "P08": "acepto",
    "P09": "Acepto.",
    "P10": "Acepto los de la plantilla; los pruebo antes de construir.",
    "P11": "ok",
    "P12": "Similitud mínima 0,95; al menos 3 fuentes verificadas; un marco de más de 120 días pasa a "
    "una persona.",
    "P13": "acepto",
    "P14": "ok",
}


def _parche(pid: str, actual: Any) -> tuple[Any, list[dict[str, str]]]:
    """Lo que el modelo simulado hace con la propuesta actual de cada pregunta que no se acepta tal cual."""
    if pid == "P01":
        return {
            "nombre": _b(
                "Seguridad de IA: planeación de pruebas y evidencia de resultados",
                "AI security: test planning and result evidence",
            ),
            "problema": _b(
                "Las alertas de dependencias se acumulan sin leer. Los agentes proponen pruebas y asocian "
                "resultados, y jamás cierran un hallazgo por su cuenta.",
                "Dependency alerts pile up unread. The agents propose tests and match results, and never "
                "close a finding on their own.",
            ),
        }, []
    if pid == "P03":
        pasos = [
            (
                "Llega la tarea: investigar una prueba o extraer un resultado.",
                "The task arrives: research a test or extract a result.",
            ),
            (
                "El investigador propone y el código verifica cada fuente.",
                "The researcher proposes and the code checks each source.",
            ),
            (
                "Se filtra el texto pegado por si trae instrucciones.",
                "The pasted text is filtered for instructions.",
            ),
            (
                "El extractor propone campos con cita literal.",
                "The extractor proposes fields with literal quotes.",
            ),
            (
                "El código verifica las citas y calcula el veredicto.",
                "The code checks the quotes and computes the verdict.",
            ),
            ("Una persona confirma o corrige.", "A person confirms or corrects."),
        ]
        return [_b(es, en) for es, en in pasos], []
    if pid == "P04":
        return _decidir(
            actual,
            "D1",
            "solo fuentes de una lista blanca, cada una comprobada por código: que exista y diga lo que "
            "se cita",
            "Se reducen las citas inventadas.",
            "Invented citations are reduced.",
        ), []
    if pid == "P05":
        return _decidir(
            actual,
            "D2",
            "la regla del catálogo calcula el veredicto sobre campos cuyas citas se verificaron",
            "El veredicto no depende del texto pegado.",
            "The verdict does not depend on the pasted text.",
        ), []
    if pid == "P06":
        return _decidir(
            actual,
            "D3",
            "la severidad la fija siempre una persona, con la calculadora de referencia del marco",
            "Un auditor puede reproducirla.",
            "An auditor can reproduce it.",
        ), []
    if pid == "P07":
        return _decidir(
            actual,
            "D4",
            "toda prueba nueva entra como borrador y se activa solo cuando una persona la aprueba",
            "La persona ve la versión del marco antes de aprobar.",
            "The person sees the framework version before approving.",
        ), []
    if pid == "P10":
        return actual, []
    if pid == "P12":
        valores = {"U1": 0.95, "U2": 3, "U3": 120}
        return [{**u, "valor_en_plan": valores[u["id"]], "origen": "usuario"} for u in actual], [
            {
                "elemento": u,
                "es": "Se mide con la señal declarada en el umbral.",
                "en": "Measured with the threshold's declared signal.",
            }
            for u in valores
        ]
    raise AssertionError(f"el modelo simulado no espera la pregunta {pid}")


def _pregunta(prompt: str) -> str:
    plantilla = cargar_plantilla(DOMINIO)
    texto_pregunta = re.search(r"^PREGUNTA: (.*)$", prompt, re.M).group(1)  # type: ignore[union-attr]
    return next(q["id"] for q in plantilla["preguntas_guia"] if texto_pregunta in (q["es"], q["en"]))


def respondedor(peticion: dict[str, Any]) -> dict[str, Any]:
    prompt = peticion["prompt"]
    pid = _pregunta(prompt)
    bloque = prompt.split("PROPUESTA ACTUAL:\n", 1)[1].split("\nCONTEXTO DEL PLAN", 1)[0]
    valor, explicaciones = _parche(pid, json.loads(bloque))
    return {"valor": valor, "explicaciones": explicaciones}


def entrevistar(respuestas: dict[str, Any] | None = None, **opciones: Any) -> Resultado:
    return ejecutar(
        demo_de_dominio(DOMINIO, PLAN),
        idioma="es",
        lector=Lector(respuestas if respuestas is not None else RESPUESTAS),
        modelo=opciones.pop("modelo", crear_modelo("simulado", respondedor=respondedor)),
        proveedor="simulado",
        modelo_nombre="simulado",
        vocabulario=VOCABULARIO,
        fecha=FECHA,
        escribir=False,
        salida=opciones.pop("salida", lambda _t: None),
        **opciones,
    )


def generar(directorio: Path = FIXTURE) -> Resultado:
    r = entrevistar()
    assert r.borrador is not None and r.transcripcion is not None
    escribir_bonito(directorio / "v0-borrador.json", r.borrador)
    escribir_con_huella(directorio / "transcripcion.json", r.transcripcion)
    return r


if __name__ == "__main__":
    r = generar()
    llamadas = r.transcripcion["llamadas_al_modelo"]  # type: ignore[index]
    print(f"{FIXTURE}: {llamadas} llamadas simuladas")
