"""La transcripción de la entrevista (RF-02.4): cada pregunta con su ejemplo, cada respuesta literal en su
idioma, qué elementos produjo con qué origen, y qué idioma redactó el usuario y cuál el entrevistador.

Es el registro con que el usuario revisa el borrador antes de aprobarlo: dice qué quedó pendiente y
cuánto costó.
"""

from __future__ import annotations

from typing import Any

FORMATO_TRANSCRIPCION = "planlang-transcripcion/v1"


def transcripcion(
    *,
    demo_id: str,
    plan_id: str,
    plantilla: dict[str, Any],
    estado: dict[str, Any],
    fecha: str,
    proveedor: str,
    modelo: str,
) -> dict[str, Any]:
    turnos = estado.get("turnos") or []
    estados = estado.get("estados") or {}
    preguntas = []
    for q in plantilla["preguntas_guia"]:
        propios = [
            {k: v for k, v in t.items() if k != "pregunta"} for t in turnos if t["pregunta"] == q["id"]
        ]
        preguntas.append(
            {
                "id": q["id"],
                "seccion": q["seccion"],
                "pregunta": {"es": q["es"], "en": q["en"]},
                "ejemplo": q["ejemplo"],
                "obligatoria": q["obligatoria"],
                "estado": estados.get(q["id"], "sin_responder"),
                "turnos": propios,
            }
        )
    costo = round(sum(float(t.get("costo_nominal_usd") or 0.0) for t in turnos), 6)
    return {
        "formato": FORMATO_TRANSCRIPCION,
        "demo_id": demo_id,
        "plan_id": plan_id,
        "plantilla": {"id": plantilla["id"], "version": plantilla["version"], "huella": plantilla["huella"]},
        "idioma": estado.get("idioma", "es"),
        "fecha": fecha,
        "proveedor": proveedor,
        "modelo": modelo,
        "pasadas": estado.get("pasada", 1),
        "preguntas": preguntas,
        "senales_derivadas": estado.get("senales_derivadas") or [],
        "llamadas_al_modelo": sum(1 for t in turnos if t.get("resultado") == "redactada"),
        "costo_nominal_usd": costo,
    }


def pendientes(transcripcion_: dict[str, Any]) -> list[dict[str, str]]:
    return [
        {"id": p["id"], "seccion": p["seccion"]}
        for p in transcripcion_["preguntas"]
        if p["estado"] in ("pendiente", "sin_responder")
    ]
