"""Entrevista simulada del demo B: respuestas fijas y un modelo simulado que redacta cada sección.

Es el gate de contrato del borrador (regla 19): Python lo escribe con su serializador real en
`tests/contrato/entrevista-demo-b/` y TypeScript lo lee con el esquema del plan, M1 y las contradicciones.
`test_entrevistador.py` la regenera y exige los mismos bytes.

Las respuestas son un FIXTURE de prueba, no la entrevista del plan B: sus valores son deliberadamente
distintos del § 10.3 de la especificación (similitud 0,9; escalamiento 70; una inconsistencia; zona gris
desde 0,75). La entrevista real la corre el usuario.
Regenerar: `agents/.venv/bin/python agents/tests/entrevista_simulada.py`.
"""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

from app_agents.adaptador import crear_modelo
from app_agents.canonico import escribir_bonito, escribir_con_huella
from app_agents.entrevistador.cli import DEMOS, Lector, Resultado, ejecutar
from app_agents.entrevistador.plantilla import cargar_plantilla
from app_agents.plan import RAIZ_REPO

FIXTURE = RAIZ_REPO / "tests" / "contrato" / "entrevista-demo-b"
FECHA = "2026-10-04"
VOCABULARIO = (
    "todos",
    "caso",
    "extraccion",
    "salida_final",
    "documento_adverso",
    "interrupt_payload",
    "error_de_esquema_en_traspaso",
    "tipo",
    "subtipo",
    "adversario_detalle",
    "verdad_conocida",
    "umbral",
)
RESPUESTAS: dict[str, str] = {
    "P01": "Las vinculaciones se atascan revisando listas a mano. El agente arma el expediente para el "
    "oficial y jamás rechaza a nadie sin una persona.",
    "P02": "acepto",
    "P03": "Llega la solicitud con sus documentos; se extraen los datos; se cruzan con las listas; si el "
    "parecido es dudoso, el investigador mira el contexto; se calcula el puntaje; decide el oficial cuando "
    "toca; se redacta el expediente.",
    "P04": "La segunda opción: toda coincidencia en lista vinculante y toda aproximada sobre el umbral.",
    "P05": "En cascada: reglas, luego el investigador de contexto y al final el oficial.",
    "P06": "Entradas, reglas, versión de la lista, salida y quién revisó.",
    "P07": "Puntaje por reglas: actividad, jurisdicción y coherencia entre ingresos y actividad. Ninguno "
    "es atributo protegido.",
    "P08": "acepto",
    "P09": "Acepto.",
    "P10": "Que la similitud de nombre sola da demasiados falsos positivos; se prueba en el lote de 20.",
    "P11": "Acepto los cuatro y agrego: exactitud de extracción de al menos 90 %.",
    "P12": "Similitud 0,9; escalamiento desde 70 puntos; tolero una inconsistencia; la zona gris empieza en "
    "0,75.",
    "P13": "acepto",
    "P14": "ok",
}


def _b(es: str, en: str) -> dict[str, str]:
    return {"es": es, "en": en}


def _decidir(dec: list[dict[str, Any]], did: str, elegida: str, es: str, en: str) -> list[dict[str, Any]]:
    salida = copy.deepcopy(dec)
    for d in salida:
        if d["id"] == did:
            d.update(estado="decidida", opcion_elegida=elegida, justificacion=_b(es, en), origen="usuario")
    return salida


def _parche(pid: str, actual: Any) -> tuple[Any, list[dict[str, str]]]:
    """Lo que el modelo simulado hace con la propuesta actual de cada pregunta."""
    if pid == "P01":
        return {
            "nombre": _b(
                "Vinculación de clientes con debida diligencia", "Customer onboarding with due diligence"
            ),
            "problema": _b(
                "Las vinculaciones se atascan revisando listas a mano. El agente arma el expediente para "
                "el oficial y jamás rechaza a nadie sin una persona.",
                "Onboarding stalls on manual list checks. The agent builds the file for the officer and "
                "never rejects anyone without a person.",
            ),
        }, []
    if pid == "P03":
        pasos = [
            ("Llega la solicitud con sus documentos.", "The application arrives with its documents."),
            ("Se extraen los datos de los documentos.", "The data are extracted from the documents."),
            ("Se cruzan los nombres con las listas de control.", "Names are checked against the lists."),
            (
                "Si el parecido es dudoso, el investigador mira el contexto.",
                "If the resemblance is doubtful, the investigator checks the context.",
            ),
            ("Se calcula el puntaje de riesgo por reglas.", "The risk score is computed by rules."),
            ("Decide el oficial cuando el plan lo exige.", "The officer decides when the plan requires it."),
            ("Se redacta el expediente con sus citas.", "The file is written with its citations."),
        ]
        return [_b(es, en) for es, en in pasos], []
    if pid == "P04":
        return _decidir(
            actual,
            "D1",
            "toda coincidencia en lista vinculante y toda aproximada sobre el umbral",
            "La homonimia no puede escaparse.",
            "Homonymy must not slip through.",
        ), []
    if pid == "P05":
        return _decidir(
            actual,
            "D2",
            "cascada: reglas → modelo de contexto → oficial humano",
            "Menos falsos positivos sin que nadie decida solo.",
            "Fewer false positives without anyone deciding alone.",
        ), []
    if pid == "P06":
        return _decidir(
            actual,
            "D3",
            "entradas, reglas, versión de lista, salida y revisor",
            "El expediente tiene que poder auditarse.",
            "The file must be auditable.",
        ), []
    if pid == "P07":
        return _decidir(
            actual,
            "D4",
            "puntaje por reglas declaradas: actividad, jurisdicción y coherencia entre ingresos y actividad",
            "Auditable y sin atributos protegidos.",
            "Auditable and with no protected attributes.",
        ), []
    if pid == "P10":
        return [
            {
                "id": "S1",
                "enunciado": _b(
                    "La similitud de nombre sola da demasiados falsos positivos y necesita el investigador.",
                    "Name similarity alone gives too many false positives and needs the investigator.",
                ),
                "criticidad": "alta",
                "prueba_barata": _b(
                    "En el lote de 20, contar cuántas coincidencias por nombre eran homónimos.",
                    "On the 20-case batch, count how many name matches were homonyms.",
                ),
                "estado": "sin_probar",
                "origen": "usuario",
            }
        ], []
    if pid == "P11":
        nuevo = {
            "id": "C5",
            "enunciado": _b(
                "La extracción es exacta en al menos el 90 % de los casos.",
                "Extraction is exact in at least 90% of cases.",
            ),
            "tipo": "tasa",
            "regla_de_medicion": {
                "poblacion": "todos",
                "condicion": "extraccion_exacta == true",
                "agregacion": "tasa",
            },
            "valor_objetivo": 0.9,
            "origen": "usuario",
        }
        return [*actual, nuevo], [
            {
                "elemento": "C5",
                "es": "El agente registra si cada caso se extrajo exacto (extraccion_exacta).",
                "en": "The agent records whether each case was extracted exactly (extraccion_exacta).",
            }
        ]
    if pid == "P12":
        valores = {"U1": 0.9, "U2": 70, "U3": 1, "U4": 0.75}
        return [{**u, "valor_en_plan": valores[u["id"]], "origen": "usuario"} for u in actual], [
            {
                "elemento": u,
                "es": "Se mide con la señal declarada en el umbral.",
                "en": "Measured with the threshold's declared signal.",
            }
            for u in valores
        ]
    raise AssertionError(f"el modelo simulado no espera la pregunta {pid}")


def respondedor(peticion: dict[str, Any]) -> dict[str, Any]:
    prompt = peticion["prompt"]
    plantilla = cargar_plantilla("dom-financiero")
    texto_pregunta = re.search(r"^PREGUNTA: (.*)$", prompt, re.M).group(1)  # type: ignore[union-attr]
    pid = next(q["id"] for q in plantilla["preguntas_guia"] if texto_pregunta in (q["es"], q["en"]))
    bloque = prompt.split("PROPUESTA ACTUAL:\n", 1)[1].split("\nCONTEXTO DEL PLAN", 1)[0]
    valor, explicaciones = _parche(pid, json.loads(bloque))
    return {"valor": valor, "explicaciones": explicaciones}


def entrevistar(respuestas: dict[str, Any] | None = None, **opciones: Any) -> Resultado:
    return ejecutar(
        DEMOS["b"],
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
    print(f"entrevista simulada → {FIXTURE.relative_to(RAIZ_REPO)} ({llamadas} redacciones)")
