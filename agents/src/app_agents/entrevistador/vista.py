"""Cómo se ve la entrevista en la consola, en el idioma de la entrevista (regla 20: ES y EN redactados)."""

from __future__ import annotations

from typing import Any

from app_agents.entrevistador.borrador import MARCA_PENDIENTE

TEXTOS: dict[str, dict[str, str]] = {
    "es": {
        "pregunta": "Pregunta {n} de {t}",
        "pasada": "pasada {p}",
        "obligatoria": "obligatoria",
        "ejemplo": "Ejemplo",
        "propuesta": "Propuesta actual",
        "sin_propuesta": "(sin propuesta: la escribe tu respuesta)",
        "ayuda": (
            "Escribe tu respuesta y termina con una línea vacía. «acepto» deja la propuesta, "
            "«pendiente» la deja para después y «salir» guarda y sale (vuelves con --retomar)."
        ),
        "redactando": "redactando tu respuesta…",
        "pendiente": "pendiente",
        "salida": "Entrevista guardada. Para seguir: pnpm entrevistar --demo {demo} --retomar",
        "fin": (
            "Entrevista terminada: {r} respondidas · {a} aceptadas · {p} pendientes · {m} llamadas al modelo."
        ),
        "archivos": "Borrador: {b}\nTranscripción: {t}",
        "secciones": (
            "problema|actores|flujo|decisiones|riesgos|supuestos|criterios|umbrales|contrato|lotes"
        ),
        "nombres": (
            "Problema|Actores|Flujo|Decisiones|Riesgos|Supuestos|Criterios|Umbrales|Contrato de grafo|Lotes"
        ),
    },
    "en": {
        "pregunta": "Question {n} of {t}",
        "pasada": "pass {p}",
        "obligatoria": "required",
        "ejemplo": "Example",
        "propuesta": "Current proposal",
        "sin_propuesta": "(no proposal: your answer writes it)",
        "ayuda": (
            "Type your answer and finish with an empty line. “accept” keeps the proposal, "
            "“pending” leaves it for later and “exit” saves and quits (come back with --retomar)."
        ),
        "redactando": "drafting your answer…",
        "pendiente": "pending",
        "salida": "Interview saved. To continue: pnpm entrevistar --demo {demo} --retomar",
        "fin": "Interview finished: {r} answered · {a} accepted · {p} pending · {m} model calls.",
        "archivos": "Draft: {b}\nTranscript: {t}",
        "secciones": (
            "problema|actores|flujo|decisiones|riesgos|supuestos|criterios|umbrales|contrato|lotes"
        ),
        "nombres": (
            "Problem|Actors|Flow|Decisions|Risks|Assumptions|Criteria|Thresholds|Graph contract|Batches"
        ),
    },
}


def nombre_seccion(seccion: str, idioma: str) -> str:
    t = TEXTOS[idioma]
    return dict(zip(t["secciones"].split("|"), t["nombres"].split("|"), strict=True))[seccion]


def _t(valor: Any, idioma: str) -> str:
    if isinstance(valor, dict):
        texto = str(valor.get(idioma) or valor.get("es") or "")
    else:
        texto = "" if valor is None else str(valor)
    return TEXTOS[idioma]["pendiente"] if not texto or MARCA_PENDIENTE in texto else texto


def _num(v: Any, idioma: str) -> str:
    if v is None:
        return TEXTOS[idioma]["pendiente"]
    texto = str(v)
    return texto.replace(".", ",") if idioma == "es" and isinstance(v, float) else texto


_OP = {
    "igual_a": "=",
    "distinto_de": "≠",
    "menor_que": "<",
    "menor_o_igual_que": "≤",
    "mayor_que": ">",
    "mayor_o_igual_que": "≥",
}


def lineas_de_propuesta(seccion: str, valor: Any, idioma: str) -> list[str]:
    """Una línea por elemento, con lo que hace falta para decidir si se acepta."""
    if valor is None or valor == []:
        return [TEXTOS[idioma]["sin_propuesta"]]
    if seccion == "problema":
        return [f"· {_t(valor.get('nombre'), idioma)}", f"  {_t(valor.get('problema'), idioma)}"]
    if seccion == "flujo":
        return [f"{i}. {_t(p, idioma)}" for i, p in enumerate(valor, 1)]
    if seccion == "actores":
        return [f"· {a['id']} · {_t(a, idioma)} ({a.get('tipo')})" for a in valor]
    if seccion == "decisiones":
        return [
            f"· {d['id']} · {_t(d.get('pregunta'), idioma)} — {d.get('estado')}"
            + (f" · {_t(d.get('opcion_elegida'), idioma)}" if d.get("opcion_elegida") else "")
            for d in valor
        ]
    if seccion == "riesgos":
        return [
            f"· {r['id']} · {_t(r.get('modo'), idioma)} — S{r.get('severidad')} O{r.get('ocurrencia')} "
            f"D{r.get('deteccion')}"
            for r in valor
        ]
    if seccion == "supuestos":
        return [f"· {s['id']} · {_t(s.get('enunciado'), idioma)} — {s.get('criticidad')}" for s in valor]
    if seccion == "criterios":
        return [
            f"· {c['id']} · {_t(c.get('enunciado'), idioma)} — {c.get('tipo')} · "
            f"{_num(c.get('valor_objetivo'), idioma)}"
            for c in valor
        ]
    if seccion == "umbrales":
        return [
            f"· {u['id']} · {_t(u.get('nombre'), idioma)} — {u.get('senal')} "
            f"{_OP.get(u.get('operador'), '?')} {_num(u.get('valor_en_plan'), idioma)} "
            f"→ {u.get('consecuencia_si_verdadero')}"
            for u in valor
        ]
    if seccion == "contrato":
        nodos = ", ".join(n["id"] for n in valor.get("nodos_esperados") or [])
        lineas = [f"· {nodos}"]
        for a in valor.get("aristas_condicionales") or []:
            if a.get("funcion"):
                cond = f"{a['funcion']['nombre']}({', '.join(a['funcion']['entradas'])})"
            else:
                cond = f"{a.get('senal')} {_OP.get(a.get('operador'), '?')} {a.get('valor')}"
            lineas.append(f"  {a.get('desde')} #{a.get('orden')}: {cond} → {a.get('si_verdadero')}")
        for p in valor.get("pausas_humanas") or []:
            lineas.append(f"  ⏸ {p.get('nodo')} · {p.get('rol')}")
        return lineas
    if seccion == "lotes":
        return [
            f"· {valor.get('demo')} / {valor.get('completo')} · {valor.get('corridas_espaciadas_de')} · "
            f"{valor.get('proveedor')} · {valor.get('modelo_alias')}"
        ]
    return [str(valor)]


def pantalla_de_pregunta(payload: dict[str, Any], idioma: str) -> str:
    t = TEXTOS[idioma]
    cabeza = t["pregunta"].format(n=payload["numero"], t=payload["total"])
    extras = [nombre_seccion(payload["seccion"], idioma)]
    if payload.get("obligatoria"):
        extras.append(t["obligatoria"])
    if payload.get("pasada", 1) > 1:
        extras.append(t["pasada"].format(p=payload["pasada"]))
    lineas = [
        "",
        f"── {cabeza} · {' · '.join(extras)} " + "─" * 8,
        payload["pregunta"][idioma],
        f"  {t['ejemplo']}: {payload['ejemplo'][idioma]}",
        f"  {t['propuesta']}:",
        *(f"    {ln}" for ln in lineas_de_propuesta(payload["seccion"], payload.get("propuesta"), idioma)),
    ]
    if payload.get("aviso"):
        lineas.append(f"  ! {payload['aviso'][idioma]}")
    lineas.append(f"  {t['ayuda']}")
    return "\n".join(lineas)
