"""Documento de decisión adversa (legal F4: Res. 3047/2008, CMS-0057-F, TX § 4201.303, AI Act art. 86).

Lo genera CÓDIGO, nunca el modelo, en español y en inglés: servicio, causal tasada con su norma, regla
del plan de beneficios que la dispara, datos usados, versión del plan y del plan de beneficios, quién
decidió y la vía de contradicción. `completo` se calcula: el criterio C8 lo exige.

S3 (M-15 y plan v1.5): el documento dice qué se decidió (`negar` o `aprobar_parcial`); la regla la pone
quien llama según la causal (RB-03 para una exclusión, RB-08 para el tope de cobertura); el servicio es el
de la orden; una aprobación parcial lleva el monto aprobado y el negado; `idiomas` se calcula de los textos
que trae, no se declara; y si la parte negada salió sin una persona (modo Texas apagado), el documento y el
aviso lo dicen.
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

AVISO_IA_SIN_PERSONA = {
    "es": "Aviso: esta respuesta la redactó una inteligencia artificial en una simulación con datos "
    "sintéticos. La parte no cubierta la decidió una regla del plan, sin revisión de una persona, porque el "
    "modo Texas está apagado; puede pedir que una persona la revise.",
    "en": "Notice: this reply was drafted by an artificial intelligence in a simulation with synthetic "
    "data. The part not covered was decided by a plan rule, without review by a person, because Texas mode "
    "is off; you can ask for a person to review it.",
}

DECIDIDO_POR = {
    "es": "Un auditor humano. En esta corrida por lotes el auditor es simulado y sigue la verdad conocida "
    "del caso.",
    "en": "A human auditor. In this batch run the auditor is simulated and follows the case's known truth.",
}

DECIDIDO_POR_REGLA = {
    "es": "Una regla del plan de beneficios (RB-08), sin revisión de una persona: el modo Texas está "
    "apagado. Puede pedir que una persona la revise.",
    "en": "A benefit-plan rule (RB-08), without review by a person: Texas mode is off. You can ask for a "
    "person to review it.",
}

IDIOMAS = ("es", "en")

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


def aviso_ia(decision: str, con_persona: bool) -> dict[str, str]:
    """El aviso de IA que corresponde: una negación parcial sin persona no puede decir que una persona
    la revisó."""
    return AVISO_IA if con_persona or decision != "aprobar_parcial" else AVISO_IA_SIN_PERSONA


def _textos(v: Any) -> list[dict[str, Any]]:
    """Los textos bilingües de un valor: todo mapa con exactamente las claves de idioma."""
    if isinstance(v, dict):
        if set(v) == set(IDIOMAS):
            return [v]
        return [t for x in v.values() for t in _textos(x)]
    if isinstance(v, list):
        return [t for x in v for t in _textos(x)]
    return []


def idiomas_de(doc: dict[str, Any]) -> list[str]:
    """Los idiomas en que el documento está COMPLETO: cada texto bilingüe trae ese idioma, no vacío (M-15)."""
    textos = _textos(doc)
    return [i for i in IDIOMAS if textos and all(isinstance(t.get(i), str) and t[i].strip() for t in textos)]


def documento_adverso(
    *,
    caso_id: str,
    procedimiento: dict[str, Any] | None,
    causal: dict[str, Any] | None,
    regla: dict[str, Any] | None,
    extraccion: dict[str, Any] | None,
    plan: dict[str, str],
    plan_beneficios: dict[str, str],
    decision: str = "negar",
    monto: dict[str, Any] | None = None,
    con_persona: bool = True,
) -> dict[str, Any]:
    datos_usados = []
    if extraccion is not None:
        for campo in ("procedimiento", "diagnostico", "costo_estimado"):
            datos_usados.append({"campo": campo, "valor": extraccion["campos"].get(campo)})
    doc: dict[str, Any] = {
        "formato": "planlang-documento-adverso/v1",
        "caso_id": caso_id,
        "decision": decision,
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
        "decidido_por": DECIDIDO_POR if con_persona else DECIDIDO_POR_REGLA,
        "aviso_ia": aviso_ia(decision, con_persona),
    }
    requeridos = REQUERIDOS
    if decision == "aprobar_parcial":
        doc["monto"] = monto
        requeridos = (*REQUERIDOS, "monto")
    doc["idiomas"] = idiomas_de(doc)
    doc["completo"] = all(doc.get(k) not in (None, [], {}) for k in requeridos)
    return doc
