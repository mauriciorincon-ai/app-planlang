"""El expediente del demo B, la respuesta al solicitante y el documento de decisión adversa: los escribe el
CÓDIGO, en español y en inglés (RF-04b.7, regla dura 12). Ningún modelo redacta aquí.

Cada conclusión lleva su cita: el documento de donde salió un dato, la coincidencia de la lista (con la
versión y la fecha de la lista, decisión D3), la regla RI/RP/RD/RG que la motivó, la arista del plan que abrió
la pausa o la decisión D3 del plan. `conclusiones_sin_cita` cuenta las que no la tienen (criterio C3).
"""

from __future__ import annotations

from typing import Any

from app_agents.demo_b.mundo import Listas

CONSERVACION = {
    "es": "El expediente se conserva cinco años (decisión D3 del plan; plazo estimado, AMLR art. 77).",
    "en": "The file is kept for five years (plan decision D3; estimated term, AMLR art. 77).",
}
NIVEL = {
    "bajo": ("bajo", "low"),
    "medio": ("medio", "medium"),
    "alto": ("alto", "high"),
    "coherente": ("coherente", "consistent"),
    "incoherente": ("incoherente", "inconsistent"),
    "sin_dato": ("sin dato", "no data"),
}
CAMPO = {
    "nombre": ("nombre", "name"),
    "documento": ("documento", "document"),
    "nacimiento": ("año de nacimiento", "year of birth"),
    "nacionalidad": ("nacionalidad", "nationality"),
    "actividad": ("actividad", "activity"),
    "ingresos_mensuales": ("ingresos", "income"),
    "jurisdiccion_fondos": ("jurisdicción de los fondos", "jurisdiction of the funds"),
    "titular_actividad": ("documento citado en la actividad", "document cited in the activity statement"),
    "titular_fondos": ("titular citado en el origen de fondos", "holder cited in the source of funds"),
}
MESES = {
    "01": ("enero", "January"),
    "02": ("febrero", "February"),
    "03": ("marzo", "March"),
    "04": ("abril", "April"),
    "05": ("mayo", "May"),
    "06": ("junio", "June"),
    "07": ("julio", "July"),
    "08": ("agosto", "August"),
    "09": ("septiembre", "September"),
    "10": ("octubre", "October"),
    "11": ("noviembre", "November"),
    "12": ("diciembre", "December"),
}
DECISION = {"aprobar": ("aprobar", "approve"), "rechazar": ("rechazar", "reject")}
CONCLUSION = {"misma_persona": ("misma persona", "same person"), "homonimo": ("homónimo", "namesake")}
CAUSALES = {
    "RD-01": {
        "id": "lista_vinculante",
        "norma": "Ley 1121 de 2006, art. 20; AMLR art. 76(5)",
        "resumen": {
            "es": "La persona figura en una lista vinculante de sanciones.",
            "en": "The person appears on a binding sanctions list.",
        },
    },
    "RD-02": {
        "id": "identidad_no_verificable",
        "norma": "SARLAFT, conocimiento del cliente; AMLR art. 20",
        "resumen": {
            "es": "Los documentos no permiten verificar la identidad del solicitante.",
            "en": "The documents do not allow the applicant's identity to be verified.",
        },
    },
}
# La verdad conocida que sigue el oficial simulado nombra sus reglas RV-xx; su causa es la misma que la RD-xx.
RV_A_RD = {"RV-01": "RD-01", "RV-02": "RD-02"}
VIA_DE_CONTRADICCION = {
    "es": "Puede pedir que una persona revise de nuevo la decisión y aportar documentos que muestren que no "
    "es "
    "la persona de la lista o que aclaren su identidad.",
    "en": "You may ask for a person to review the decision again and provide documents showing you are not "
    "the "
    "person on the list or clarifying your identity.",
}


def mes_y_anio(fecha: str) -> tuple[str, str]:
    """«septiembre de 2026» / «September 2026»: la fecha de una lista en el TEXTO va sin día (una fecha con
    día y mes en texto libre es un identificador para el gate E-11); la completa viaja en la cita."""
    anio, mes = fecha[:4], fecha[5:7]
    es, en = MESES[mes]
    return f"{es} de {anio}", f"{en} {anio}"


def _c(id_: str, tema: str, es: str, en: str, cita: dict[str, Any] | None) -> dict[str, Any]:
    return {"cita": cita, "id": id_, "tema": tema, "texto": {"en": en, "es": es}}


def _jur(listas: Listas, codigo: str | None) -> tuple[str, str]:
    j = listas.jurisdiccion(codigo)
    return (j["nombre"]["es"], j["nombre"]["en"]) if j else ("sin dato", "no data")


def construir_expediente(estado: dict[str, Any], listas: Listas, plan_ref: dict[str, Any]) -> dict[str, Any]:
    campos = (estado.get("extraccion") or {}).get("campos") or {}
    conclusiones: list[dict[str, Any]] = []

    j_es, j_en = _jur(listas, campos.get("nacionalidad"))
    conclusiones.append(
        _c(
            "K1",
            "identidad",
            f"Identidad declarada: {campos.get('nombre') or 'sin nombre'}, documento "
            f"{campos.get('documento') or 'sin dato'}, nacido en "
            f"{campos.get('nacimiento') or 'año sin dato'}, "
            f"nacionalidad {j_es}.",
            f"Declared identity: {campos.get('nombre') or 'no name'}, document "
            f"{campos.get('documento') or 'no data'}, born in {campos.get('nacimiento') or 'year unknown'}, "
            f"nationality {j_en}.",
            {"tipo": "documento", "ref": "identidad"},
        )
    )

    co = estado.get("coincidencias") or {}
    mejor = co.get("mejor")
    if mejor:
        lista = next(x for x in listas.consultadas() if x["id"] == mejor["lista_id"])
        regla = "RL-01" if mejor["exacta"] else "RL-02"
        tipo_es, tipo_en = ("vinculante", "binding") if mejor["vinculante"] else ("de consulta", "reference")
        mes_es, mes_en = mes_y_anio(lista["fecha"])
        conclusiones.append(
            _c(
                "K2",
                "listas",
                f"La mayor similitud con las listas es {mejor['similitud']}, con la entrada "
                f"{mejor['entrada_id']} de la lista {tipo_es} {mejor['lista_id']} (versión "
                f"{lista['version']}, de {mes_es}; {regla}).",
                f"The highest similarity with the lists is {mejor['similitud']}, with entry "
                f"{mejor['entrada_id']} of {tipo_en} list {mejor['lista_id']} (version {lista['version']}, "
                f"{mes_en}; {regla}).",
                {
                    "tipo": "coincidencia",
                    "ref": mejor["entrada_id"],
                    "regla": regla,
                    "lista": {"fecha": lista["fecha"], "id": lista["id"], "version": lista["version"]},
                },
            )
        )
    else:
        conclusiones.append(
            _c(
                "K2",
                "listas",
                "Sin nombre que cruzar con las listas: falta el dato (RI-01).",
                "No name to check against the lists: the detail is missing (RI-01).",
                {"tipo": "regla", "ref": "RI-01"},
            )
        )

    inv = estado.get("investigacion")
    if inv:
        c_es, c_en = CONCLUSION[inv["conclusion"]]
        conclusiones.append(
            _c(
                "K3",
                "investigacion",
                f"El investigador de contexto concluyó «{c_es}» frente a {inv['entrada_id']}: "
                f"{inv['razones']['es']}",
                f"The context investigator concluded “{c_en}” against {inv['entrada_id']}: "
                f"{inv['razones']['en']}",
                {"tipo": "coincidencia", "ref": inv["entrada_id"]},
            )
        )

    pt = estado.get("puntaje") or {}
    incs = pt.get("inconsistencias") or []
    if incs:
        partes_es = "; ".join(f"{CAMPO[i['campo']][0]} ({i['regla']})" for i in incs)
        partes_en = "; ".join(f"{CAMPO[i['campo']][1]} ({i['regla']})" for i in incs)
        conclusiones.append(
            _c(
                "K4",
                "documentos",
                f"{len(incs)} inconsistencia(s) documental(es): {partes_es}.",
                f"{len(incs)} document inconsistenc{'y' if len(incs) == 1 else 'ies'}: {partes_en}.",
                {"tipo": "regla", "ref": ",".join(sorted({i["regla"] for i in incs}))},
            )
        )
    else:
        conclusiones.append(
            _c(
                "K4",
                "documentos",
                "Los documentos son consistentes entre sí y no les falta ningún dato exigido (RI-01 a "
                "RI-03).",
                "The documents are consistent with each other and no required detail is missing (RI-01 to "
                "RI-03).",
                {"tipo": "regla", "ref": "RI-01,RI-02,RI-03"},
            )
        )

    if pt.get("componentes"):
        comp = {c["factor"]: c for c in pt["componentes"]}
        a, j, h = comp["actividad"], comp["jurisdiccion"], comp["coherencia"]
        conclusiones.append(
            _c(
                "K5",
                "puntaje",
                f"Puntaje de riesgo {pt['total']} de 100: actividad {a['valor'] or 'sin dato'} "
                f"({NIVEL[a['nivel']][0]}, {a['puntos']}; RP-01), jurisdicción de los fondos "
                f"{j['valor'] or 'sin dato'} ({NIVEL[j['nivel']][0]}, {j['puntos']}; RP-02), coherencia de "
                "los "
                f"ingresos ({NIVEL[h['nivel']][0]}, {h['puntos']}; RP-03). El nombre y la nacionalidad no "
                "entran (RP-04).",
                f"Risk score {pt['total']} out of 100: activity {a['valor'] or 'no data'} "
                f"({NIVEL[a['nivel']][1]}, {a['puntos']}; RP-01), jurisdiction of the funds "
                f"{j['valor'] or 'no data'} ({NIVEL[j['nivel']][1]}, {j['puntos']}; RP-02), income "
                "consistency "
                f"({NIVEL[h['nivel']][1]}, {h['puntos']}; RP-03). Name and nationality do not count (RP-04).",
                {"tipo": "regla", "ref": "RP-01,RP-02,RP-03,RP-04"},
            )
        )

    if estado.get("carga_detectada"):
        conclusiones.append(
            _c(
                "K6",
                "guardia",
                "La guardia de entrada encontró instrucciones escondidas en los documentos: no cambiaron "
                "ninguna "
                "regla y el caso pasó por el oficial (RG-01).",
                "The input guard found hidden instructions in the documents: they changed no rule and the "
                "case "
                "went to the officer (RG-01).",
                {"tipo": "regla", "ref": "RG-01"},
            )
        )

    prop = estado.get("propuesta") or "aprobar"
    reglas_prop = pt.get("reglas_propuesta") or ["RD-03"]
    p_es, p_en = DECISION[prop]
    conclusiones.append(
        _c(
            "K7",
            "propuesta",
            f"Propuesta del agente: {p_es} ({', '.join(reglas_prop)}).",
            f"Agent proposal: {p_en} ({', '.join(reglas_prop)}).",
            {"tipo": "regla", "ref": ",".join(reglas_prop)},
        )
    )

    final = estado.get("decision_final") or prop
    f_es, f_en = DECISION[final]
    pausa = (estado.get("pausas") or [None])[-1]
    if estado.get("pausa_humana") and pausa:
        m = pausa["payload"]["motivo"]
        conclusiones.append(
            _c(
                "K8",
                "decision",
                f"Decidió el oficial de cumplimiento: {f_es}. Abrió la pausa la "
                f"{m['es'][0].lower()}{m['es'][1:]}",
                f"The compliance officer decided: {f_en}. The pause was opened by {m['en'][0].lower()}"
                f"{m['en'][1:]}",
                {"tipo": "arista", "ref": f"{m['desde']}/{m['orden_arista']}"},
            )
        )
    else:
        conclusiones.append(
            _c(
                "K8",
                "decision",
                f"Decisión sin pausa: {f_es}. Ninguna arista del nodo de decisión se cumplió y el plan no "
                "pide una "
                "persona.",
                f"Decision without a pause: {f_en}. No edge of the decision node held and the plan does not "
                "require a person.",
                {"tipo": "arista", "ref": "decision/por_defecto"},
            )
        )

    conclusiones.append(
        _c(
            "K9",
            "conservacion",
            CONSERVACION["es"],
            CONSERVACION["en"],
            {"tipo": "decision_del_plan", "ref": "D3"},
        )
    )
    sin_cita = sum(1 for c in conclusiones if not (c["cita"] or {}).get("ref"))
    return {
        "caso_id": estado["caso_id"],
        "conclusiones": conclusiones,
        "conclusiones_sin_cita": sin_cita,
        "datos_usados": sorted(k for k, v in campos.items() if v is not None),
        "decision": {
            "final": final,
            "propuesta": prop,
            "revisada_por_persona": bool(estado.get("pausa_humana")),
            "rol": "oficial" if estado.get("pausa_humana") else None,
        },
        "listas_consultadas": listas.consultadas(),
        "plan": plan_ref,
        "solicitud": estado["entrada"]["solicitud"]["id"],
    }


def respuesta_al_solicitante(decision: str) -> dict[str, str]:
    if decision == "rechazar":
        return {
            "es": "Su solicitud de vinculación no fue aprobada. Una persona revisó su caso. Recibirá un "
            "documento "
            "con la causa y con la forma de pedir una nueva revisión.",
            "en": "Your onboarding application was not approved. A person reviewed your case. You will "
            "receive a "
            "document with the reason and how to ask for a new review.",
        }
    return {
        "es": "Su solicitud de vinculación fue aprobada. Ya puede usar el producto que pidió.",
        "en": "Your onboarding application was approved. You can now use the product you requested.",
    }


def aviso_ia(con_persona: bool) -> dict[str, str]:
    if con_persona:
        return {
            "es": "Esta respuesta la preparó un sistema de IA en una simulación con datos sintéticos, y una "
            "persona "
            "revisó el caso.",
            "en": "This reply was prepared by an AI system in a simulation with synthetic data, and a person "
            "reviewed the case.",
        }
    return {
        "es": "Esta respuesta la preparó un sistema de IA en una simulación con datos sintéticos; ninguna "
        "regla "
        "pidió que una persona revisara el caso.",
        "en": "This reply was prepared by an AI system in a simulation with synthetic data; no rule required "
        "a "
        "person to review the case.",
    }


def causa_del_rechazo(estado: dict[str, Any]) -> str | None:
    """RD-01 o RD-02: la del oficial si dio una (sigue la verdad conocida), si no la de la propuesta."""
    for r in (estado.get("revision") or {}).get("reglas") or []:
        if r in RV_A_RD:
            return RV_A_RD[r]
    for r in (estado.get("puntaje") or {}).get("reglas_propuesta") or []:
        if r in CAUSALES:
            return str(r)
    return None


def documento_adverso(
    estado: dict[str, Any], listas: Listas, plan_ref: dict[str, Any], expediente: dict[str, Any]
) -> dict[str, Any]:
    """El documento de decisión adversa del rechazo: causal tasada, regla, datos usados, versión y vía de
    contradicción, en los dos idiomas."""
    rd = causa_del_rechazo(estado)
    causal = CAUSALES.get(rd) if rd else None
    regla = listas.regla(rd) if rd else None
    con_persona = bool(estado.get("pausa_humana"))
    revisado_es = "La revisó una persona" if con_persona else "No la revisó una persona"
    revisado_en = "A person reviewed it" if con_persona else "No person reviewed it"
    causa_es = (
        f"Causa: {causal['resumen']['es']} ({causal['norma']}). Regla aplicada: {rd}. " if causal else ""
    )
    causa_en = (
        f"Reason: {causal['resumen']['en']} ({causal['norma']}). Rule applied: {rd}. " if causal else ""
    )
    texto_es = f"Decisión: rechazar la vinculación. {causa_es}{revisado_es}. {VIA_DE_CONTRADICCION['es']}"
    texto_en = f"Decision: reject the onboarding. {causa_en}{revisado_en}. {VIA_DE_CONTRADICCION['en']}"
    return {
        "causal": causal,
        "completo": causal is not None and regla is not None and con_persona,
        "datos_usados": expediente["datos_usados"],
        "idiomas": ["es", "en"],
        "regla": regla,
        "revisado_por_persona": con_persona,
        "texto": {"en": texto_en, "es": texto_es},
        "version": {"listas": listas.referencia(), "plan": plan_ref},
        "via_de_contradiccion": VIA_DE_CONTRADICCION,
    }
