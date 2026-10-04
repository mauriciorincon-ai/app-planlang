"""Lo que se resuelve sin modelo en cada respuesta: aceptar la propuesta, dejarla pendiente o salir (código
primero).

Solo el texto libre llega al modelo. Las palabras se comparan normalizadas (minúsculas, sin tildes ni signos
al final), así que «Acepto.», «ok» y «yes» aceptan; cualquier otra frase es texto libre.
"""

from __future__ import annotations

import re
import unicodedata

ACEPTAR = {
    "acepto",
    "ok",
    "si",
    "de acuerdo",
    "listo",
    "vale",
    "accept",
    "accepted",
    "yes",
    "agree",
    "agreed",
}
PENDIENTE = {"pendiente", "pending", "despues", "later", "paso", "skip", "no se", "dont know", "i dont know"}
SALIR = {"salir", "exit", "quit"}


def normalizada(texto: str) -> str:
    sin_tildes = "".join(
        ch for ch in unicodedata.normalize("NFD", texto.lower()) if unicodedata.category(ch) != "Mn"
    )
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", sin_tildes)).strip()


def clasificar(texto: str) -> str:
    """`vacia` · `aceptar` · `pendiente` · `salir` · `libre`."""
    n = normalizada(texto)
    if not n:
        return "vacia"
    if n in ACEPTAR:
        return "aceptar"
    if n in PENDIENTE:
        return "pendiente"
    if n in SALIR:
        return "salir"
    return "libre"


def pasos_literales(texto: str) -> list[str]:
    """El flujo sin modelo: una línea o una frase por paso."""
    lineas = [ln.strip(" -•\t") for ln in texto.splitlines() if ln.strip(" -•\t")]
    if len(lineas) > 1:
        return lineas
    return [p.strip() for p in re.split(r"(?<=[.;])\s+", texto.strip()) if p.strip()]
