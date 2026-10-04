"""Guardias deterministas del demo B (regla dura 5: arquitectura, no un nodo de modelo).

- Entrada (RG-01): si un documento trae instrucciones dirigidas al sistema, `carga_detectada` y el caso va al
  oficial; el texto jamás cambia qué regla se aplica. Los patrones son los mismos que en el A.
- Minimización: teléfonos, correos y documentos de terceros no llegan al modelo (no hacen falta para extraer).
- Salida (RG-02, RG-03): la respuesta al solicitante no lleva identificadores; el expediente solo lleva el
  documento del solicitante y el número de la solicitud; ninguna frase con instrucción inyectada; solo
  acciones de la lista blanca. Registra lo que encontró y la severidad de acción (misma escala que el A).
"""

from __future__ import annotations

import copy
import re
from typing import Any

from app_agents.demo_a.guardia import PROTEGIDO, RESPALDO, contiene_inyeccion, salida_malformada

ACCIONES_PERMITIDAS: tuple[str, ...] = ("registrar_expediente", "responder_solicitante")
# Identificadores de PERSONAS o solicitudes; los códigos de catálogo (SYN-ACT-…, SYN-J-…) no lo son.
IDENTIFICADOR = re.compile(r"SYN-(?!ACT-|J-)[A-Z]+-\d+(?:-X)?|555-01\d{2}|[A-Za-z0-9._%+-]+@example\.com")
TELEFONO_O_CORREO = re.compile(r"555-01\d{2}|[A-Za-z0-9._%+-]+@example\.com")
DOCUMENTO = re.compile(r"SYN-ID-\d+")
_FRASES = re.compile(r"(?<=[.!?])\s+")


def textos_de_documentos(entrada: dict[str, Any]) -> list[str]:
    docs = entrada["documentos"]
    return [docs[k]["es"] for k in ("identidad", "actividad", "fondos") if docs.get(k)]


def carga_en_documentos(entrada: dict[str, Any]) -> bool:
    return any(contiene_inyeccion(t) for t in textos_de_documentos(entrada))


def minimizar(documentos: dict[str, Any]) -> dict[str, str | None]:
    """El texto en español de cada documento, sin teléfonos ni correos, y sin números de documento en el
    origen de fondos (allí ninguno es del solicitante que haga falta extraer)."""
    salida: dict[str, str | None] = {}
    for k in ("identidad", "actividad", "fondos"):
        d = documentos.get(k)
        if not d:
            salida[k] = None
            continue
        t = TELEFONO_O_CORREO.sub("[DATO DE CONTACTO]", d["es"])
        salida[k] = DOCUMENTO.sub("[DOCUMENTO]", t) if k == "fondos" else t
    return salida


def _limpiar(
    texto: str, permitidos: set[str], idioma: str, destino: str, hallazgos: list[dict[str, Any]]
) -> str:
    for m in sorted(set(IDENTIFICADOR.findall(texto))):
        if m in permitidos:
            continue
        texto = texto.replace(m, PROTEGIDO[idioma])
        hallazgos.append({"destino": destino, "idioma": idioma, "tipo": "identificador_filtrado"})
    frases = _FRASES.split(texto.strip())
    limpias = [f for f in frases if not contiene_inyeccion(f)]
    if len(limpias) < len(frases):
        hallazgos.append(
            {
                "destino": destino,
                "frases": len(frases) - len(limpias),
                "idioma": idioma,
                "tipo": "instruccion_filtrada",
            }
        )
    return " ".join(limpias).strip()


def revisar_salida(
    respuesta: dict[str, str],
    expediente: dict[str, Any],
    acciones: list[str],
    entrada: dict[str, Any],
    propios: set[str],
) -> dict[str, Any]:
    hallazgos: list[dict[str, Any]] = []
    salida: dict[str, str] = {}
    for idioma in ("es", "en"):
        if salida_malformada(respuesta[idioma]):
            hallazgos.append({"destino": "respuesta", "idioma": idioma, "tipo": "salida_malformada"})
            salida[idioma] = RESPALDO[idioma]
            continue
        salida[idioma] = (
            _limpiar(respuesta[idioma], set(), idioma, "respuesta", hallazgos) or RESPALDO[idioma]
        )
    revisado = copy.deepcopy(expediente)
    for c in revisado["conclusiones"]:
        for idioma in ("es", "en"):
            c["texto"][idioma] = _limpiar(c["texto"][idioma], propios, idioma, "expediente", hallazgos)
    for a in sorted(set(acciones)):
        if a not in ACCIONES_PERMITIDAS:
            hallazgos.append({"accion": a, "tipo": "accion_bloqueada"})
    tipos = {h["tipo"] for h in hallazgos}
    if "accion_bloqueada" in tipos:
        severidad = 3
    elif "identificador_filtrado" in tipos:
        severidad = 2
    elif "instruccion_filtrada" in tipos:
        severidad = 1
    else:
        severidad = 0
    return {
        "acciones_ejecutadas": [a for a in sorted(set(acciones)) if a in ACCIONES_PERMITIDAS],
        "acciones_intentadas": sorted(set(acciones)),
        "carga_detectada_en_entrada": carga_en_documentos(entrada),
        "expediente": revisado,
        "hallazgos": hallazgos,
        "salida": salida,
        "severidad_accion": severidad,
    }
