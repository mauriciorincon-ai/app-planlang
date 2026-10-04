"""El borrador del plan: lo que la entrevista entrega (RF-02.1) y que M1 valida después, del lado
TypeScript.

Siempre `estado_aprobacion: "borrador"` y `huella: null` (RF-02.6: el entrevistador nunca aprueba). Completa
por código lo que se deriva del resto del plan: las señales que el agente tendrá que registrar en la traza
(RF-02.3), con quién las lee.
"""

from __future__ import annotations

import re
from typing import Any

from app_agents.canonico import normalizar
from app_agents.entrevistador.origen import sin_claves_de_aprobacion

# La marca de un texto que la entrevista no pudo redactar. Es la misma cadena que `MARCA_PENDIENTE` de
# `core/plan/contradicciones.ts`: el gate de contrato del borrador lo cruza.
MARCA_PENDIENTE = "⟨pendiente · pending⟩"
VERSION_DEL_PLAN = "1.0.0"

_CADENA = re.compile(r"'[^']*'")
_RAIZ = re.compile(r"(?<![.\w])([a-z_][a-z0-9_]*)\b(?!\s*\()")
_LITERALES = {"true", "false", "null"}


def pendiente_bilingue() -> dict[str, str]:
    return {"es": MARCA_PENDIENTE, "en": MARCA_PENDIENTE}


def raices(condicion: str) -> list[str]:
    """Las claves de primer nivel que lee una condición (sin cadenas, palabras clave ni funciones)."""
    vistas: list[str] = []
    for r in _RAIZ.findall(_CADENA.sub(" ", condicion)):
        if r not in _LITERALES and r not in vistas:
            vistas.append(r)
    return vistas


def _lectores(plan: dict[str, Any]) -> list[tuple[str, str]]:
    """(señal, quién la lee) para umbrales, aristas y condiciones de caso, en orden de aparición."""
    pares: list[tuple[str, str]] = []
    for u in plan.get("umbrales") or []:
        if u.get("senal"):
            pares.append((u["senal"], u["id"]))
    contrato = plan.get("contrato_de_grafo") or {}
    for a in contrato.get("aristas_condicionales") or []:
        nombre = f"{a.get('desde')}#{a.get('orden')}"
        if a.get("senal"):
            pares.append((a["senal"], nombre))
        for s in (a.get("funcion") or {}).get("entradas") or []:
            pares.append((s, nombre))
    condiciones: list[tuple[str, str | None]] = []
    for c in plan.get("criterios_aceptacion") or []:
        r = c.get("regla_de_medicion") or {}
        condiciones += [
            (c["id"], r.get("poblacion")),
            (c["id"], r.get("condicion")),
            (c["id"], r.get("metrica")),
        ]
    for r in plan.get("riesgos") or []:
        d = r.get("detector_en_trazas") or {}
        if d.get("ambito") != "sesion":
            condiciones += [(r["id"], d.get("poblacion")), (r["id"], d.get("condicion"))]
    for s in plan.get("supuestos") or []:
        m = s.get("medible_en_trazas") or {}
        condiciones += [(s["id"], m.get("poblacion")), (s["id"], m.get("condicion"))]
    for quien, texto in condiciones:
        if isinstance(texto, str):
            pares += [(raiz, quien) for raiz in raices(texto)]
    return pares


def completar_contrato(
    plan: dict[str, Any], vocabulario: tuple[str, ...]
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """Suma a las señales obligatorias toda señal que el plan lee y nadie declaró; devuelve las sumadas."""
    contrato = plan.get("contrato_de_grafo")
    if not isinstance(contrato, dict):
        return None, []
    declaradas = list(contrato.get("senales_obligatorias_en_traza") or [])
    nuevas: dict[str, list[str]] = {}
    for senal, quien in _lectores(plan):
        if senal in declaradas or senal in vocabulario:
            continue
        nuevas.setdefault(senal, [])
        if quien not in nuevas[senal]:
            nuevas[senal].append(quien)
    if not nuevas:
        return contrato, []
    completo = {
        **contrato,
        "senales_obligatorias_en_traza": declaradas + list(nuevas),
        "origen": "entrevistador" if contrato.get("origen") == "plantilla" else contrato.get("origen"),
    }
    return completo, [{"senal": s, "leida_por": q} for s, q in nuevas.items()]


def ensamblar(
    *,
    plan_id: str,
    plantilla: dict[str, Any],
    secciones: dict[str, Any],
    vocabulario: tuple[str, ...],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """El borrador completo y las señales que el código sumó al contrato."""
    problema = secciones.get("problema") or {}
    plan: dict[str, Any] = {
        "id": plan_id,
        "nombre": problema.get("nombre") or plantilla["nombre"],
        "version": VERSION_DEL_PLAN,
        "dominio_id": plantilla["id"],
        "problema": problema.get("problema") or pendiente_bilingue(),
        "actores": secciones.get("actores") or [],
        "flujo_objetivo": secciones.get("flujo") or [pendiente_bilingue()],
        "decisiones": secciones.get("decisiones") or [],
        "riesgos": secciones.get("riesgos") or [],
        "supuestos": secciones.get("supuestos") or [],
        "criterios_aceptacion": secciones.get("criterios") or [],
        "umbrales": secciones.get("umbrales") or [],
        "lotes": secciones.get("lotes"),
        "etiqueta_riesgo": plantilla["etiqueta_riesgo"],
    }
    if secciones.get("contrato") is not None:
        plan["contrato_de_grafo"] = secciones["contrato"]
    plan = sin_claves_de_aprobacion(plan)
    contrato, derivadas = completar_contrato(plan, vocabulario)
    if contrato is not None:
        plan["contrato_de_grafo"] = contrato
    if plan["lotes"] is None:
        del plan["lotes"]
    # RF-02.6: lo último que se escribe. Ninguna respuesta ni redacción puede cambiarlo.
    plan["estado_aprobacion"] = "borrador"
    plan["huella"] = None
    return normalizar(plan), derivadas
