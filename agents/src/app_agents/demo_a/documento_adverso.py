"""Documento de decisión adversa (legal F4: Res. 3047/2008, CMS-0057-F, TX § 4201.303, AI Act art. 86).

Lo genera CÓDIGO, nunca el modelo, en español y en inglés: servicio, causal tasada con su norma, regla
del plan de beneficios que la dispara, datos usados, versión del plan y del plan de beneficios, quién
decidió y la vía de contradicción. `completo` se calcula: el criterio C8 lo exige.
"""

from __future__ import annotations

from typing import Any

AVISO_IA = {
    "es": "Aviso: esta respuesta la redactó una inteligencia artificial en una simulación con datos "
    "sintéticos. Ninguna negación se emite sin la revisión de una persona.",
    "en": "Notice: this reply was drafted by an artificial intelligence in a simulation with synthetic "
    "data. No denial is issued without review by a person.",
}

VIA_DE_CONTRADICCION = {
    "es": "Puede pedir que se revise esta decisión: presente una solicitud de revisión ante la entidad, con "
    "este documento, dentro de los plazos de ley; también puede acudir a la Superintendencia Nacional de "
    "Salud. En esta simulación no hay un trámite real.",
    "en": "You can ask for this decision to be reviewed: file a review request with the insurer, with this "
    "document, within the legal deadlines; you can also go to Colombia's National Health "
    "Superintendency. This simulation has no real procedure.",
}

DECIDIDO_POR = {
    "es": "Un auditor humano. En esta corrida por lotes el auditor es simulado y sigue la verdad conocida "
    "del caso.",
    "en": "A human auditor. In this batch run the auditor is simulated and follows the case's known truth.",
}

REQUERIDOS = (
    "servicio",
    "causal",
    "regla_disparada",
    "datos_usados",
    "version",
    "via_de_contradiccion",
    "decidido_por",
    "aviso_ia",
)


def documento_adverso(
    *,
    caso_id: str,
    procedimiento: dict[str, Any] | None,
    causal: dict[str, Any] | None,
    regla: dict[str, Any] | None,
    extraccion: dict[str, Any] | None,
    plan: dict[str, str],
    plan_beneficios: dict[str, str],
) -> dict[str, Any]:
    datos_usados = []
    if extraccion is not None:
        for campo in ("procedimiento", "diagnostico", "costo_estimado"):
            datos_usados.append({"campo": campo, "valor": extraccion["campos"].get(campo)})
    doc: dict[str, Any] = {
        "formato": "planlang-documento-adverso/v1",
        "caso_id": caso_id,
        "decision": "negar",
        "servicio": {"codigo": procedimiento["codigo"], "nombre": procedimiento["nombre"]}
        if procedimiento
        else None,
        "causal": {"id": causal["id"], "norma": causal["norma"], "resumen": causal["resumen"]}
        if causal
        else None,
        "regla_disparada": {"id": regla["id"], "texto": regla["texto"]} if regla else None,
        "datos_usados": datos_usados or None,
        "version": {"plan": plan, "plan_beneficios": plan_beneficios},
        "via_de_contradiccion": VIA_DE_CONTRADICCION,
        "decidido_por": DECIDIDO_POR,
        "aviso_ia": AVISO_IA,
        "idiomas": ["es", "en"],
    }
    doc["completo"] = all(doc.get(k) not in (None, [], {}) for k in REQUERIDOS)
    return doc
