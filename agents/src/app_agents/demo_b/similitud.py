"""Similitud de nombres contra las listas (RL-01 y RL-02): espejo de `core/sintetico/demo-b/similitud.ts`.

Mismas operaciones en el mismo orden que TypeScript: plegado de tildes por tabla (no `unicodedata`, que
depende de la versión de Unicode), Jaro-Winkler clásico y redondeo `floor(x·10⁴ + ½) / 10⁴`. La suite
recalcula la similitud verdadera que el generador escribió en cada caso versionado y exige el mismo número
(gate de contrato entre los dos lenguajes).
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

PLIEGUE: dict[str, str] = {
    "á": "a",
    "à": "a",
    "â": "a",
    "ä": "a",
    "ã": "a",
    "é": "e",
    "è": "e",
    "ê": "e",
    "ë": "e",
    "í": "i",
    "ì": "i",
    "î": "i",
    "ï": "i",
    "ó": "o",
    "ò": "o",
    "ô": "o",
    "ö": "o",
    "õ": "o",
    "ú": "u",
    "ù": "u",
    "û": "u",
    "ü": "u",
    "ñ": "n",
    "ç": "c",
}


def normalizar_nombre(nombre: str) -> str:
    salida = []
    for ch in nombre.lower():
        p = PLIEGUE.get(ch, ch)
        salida.append(p if len(p) == 1 and "a" <= p <= "z" else " ")
    return " ".join(sorted(t for t in "".join(salida).split(" ") if t))


def jaro(a: str, b: str) -> float:
    if a == b:
        return 1.0
    la, lb = len(a), len(b)
    if la == 0 or lb == 0:
        return 0.0
    ventana = max(math.floor(max(la, lb) / 2) - 1, 0)
    en_a = [False] * la
    en_b = [False] * lb
    m = 0
    for i in range(la):
        for j in range(max(0, i - ventana), min(i + ventana + 1, lb)):
            if en_b[j] or a[i] != b[j]:
                continue
            en_a[i] = True
            en_b[j] = True
            m += 1
            break
    if m == 0:
        return 0.0
    k = 0
    transpuestos = 0
    for i in range(la):
        if not en_a[i]:
            continue
        while not en_b[k]:
            k += 1
        if a[i] != b[k]:
            transpuestos += 1
        k += 1
    t = transpuestos / 2
    return (m / la + m / lb + (m - t) / m) / 3


def jaro_winkler(a: str, b: str) -> float:
    j = jaro(a, b)
    tope = min(4, len(a), len(b))
    lon = 0
    while lon < tope and a[lon] == b[lon]:
        lon += 1
    return j + lon * 0.1 * (1 - j)


def redondear4(x: float) -> float:
    return math.floor(x * 10000 + 0.5) / 10000


def similitud(a: str, b: str) -> float:
    return redondear4(jaro_winkler(normalizar_nombre(a), normalizar_nombre(b)))


@dataclass(frozen=True)
class Coincidencia:
    lista_id: str
    entrada_id: str
    nombre_listado: str
    similitud: float
    vinculante: bool
    exacta: bool

    def como_dict(self) -> dict[str, Any]:
        return {
            "entrada_id": self.entrada_id,
            "exacta": self.exacta,
            "lista_id": self.lista_id,
            "nombre_listado": self.nombre_listado,
            "similitud": self.similitud,
            "vinculante": self.vinculante,
        }


def mejor_coincidencia(nombre: str | None, mundo: Mapping[str, Any]) -> Coincidencia | None:
    """La entrada más parecida de todas las listas (nombre y alias), en el orden del archivo; el empate lo
    gana la primera. `None` solo si no hay nombre que comparar."""
    if nombre is None or normalizar_nombre(nombre) == "":
        return None
    propio = normalizar_nombre(nombre)
    mejor: Coincidencia | None = None
    for lista in mundo["listas"]:
        for e in lista["entradas"]:
            for n in [e["nombre"], *e["alias"]]:
                s = redondear4(jaro_winkler(propio, normalizar_nombre(n)))
                if mejor is None or s > mejor.similitud:
                    mejor = Coincidencia(
                        lista_id=lista["id"],
                        entrada_id=e["id"],
                        nombre_listado=n,
                        similitud=s,
                        vinculante=bool(lista["vinculante"]),
                        exacta=normalizar_nombre(n) == propio,
                    )
    return mejor
