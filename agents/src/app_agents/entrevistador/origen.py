"""Origen de cada elemento (RF-02.4) y la regla «nunca aprueba» (RF-02.6), por código.

El modelo declara el origen de lo que redacta, pero el código decide: un elemento idéntico a la propuesta
conserva el origen de la propuesta; uno que el modelo marca «plantilla» sin serlo pasa a «entrevistador» (un
cambio que el código no puede atribuir al usuario). Las claves de aprobación jamás sobreviven a una
redacción ni al borrador.
"""

from __future__ import annotations

from typing import Any

from app_agents.canonico import jcs_texto

ORIGENES = ("plantilla", "entrevistador", "usuario")
CLAVES_DE_APROBACION = ("estado_aprobacion", "aprobado_por", "aprobado_el", "huella")


def sin_claves_de_aprobacion(valor: Any) -> Any:
    if isinstance(valor, list):
        return [sin_claves_de_aprobacion(v) for v in valor]
    if isinstance(valor, dict):
        return {k: sin_claves_de_aprobacion(v) for k, v in valor.items() if k not in CLAVES_DE_APROBACION}
    return valor


def _comparable(valor: Any) -> Any:
    """Sin origen ni valores vacíos: un `depende_de: []` que el esquema completa no es un cambio."""
    if isinstance(valor, list):
        return [_comparable(v) for v in valor]
    if isinstance(valor, dict):
        return {
            k: _comparable(v)
            for k, v in valor.items()
            if k != "origen" and v is not None and v != [] and v != {}
        }
    return valor


def iguales(a: Any, b: Any) -> bool:
    return jcs_texto(_comparable(a)) == jcs_texto(_comparable(b))


def _marcar_uno(elemento: dict[str, Any], propuesto: dict[str, Any] | None) -> dict[str, Any]:
    # El modelo no borra con null lo que la propuesta ya traía (una decisión decidida que vuelve sin su opción
    # elegida): el campo conserva su valor y, si todo lo demás coincide, su origen.
    if propuesto is not None:
        elemento = {
            **elemento,
            **{k: v for k, v in propuesto.items() if elemento.get(k) is None and v is not None},
        }
    if propuesto is not None and iguales(elemento, propuesto):
        return {**elemento, "origen": propuesto.get("origen", "plantilla")}
    origen = elemento.get("origen")
    if origen not in ("usuario", "entrevistador"):
        origen = "entrevistador"
    return {**elemento, "origen": origen}


# Las secciones cuyos elementos llevan id y origen; `flujo` y `problema` son textos bilingües sin campos
# propios (su origen queda en la transcripción).
SECCIONES_CON_ELEMENTOS = ("actores", "decisiones", "riesgos", "supuestos", "criterios", "umbrales")
SECCIONES_OBJETO_CON_ORIGEN = ("contrato", "lotes")


def descartados(seccion: str, valor: Any, propuesta: Any) -> list[str]:
    """Los ids de la propuesta que una redacción dejó fuera (el modelo devolvió la lista incompleta)."""
    if seccion not in SECCIONES_CON_ELEMENTOS or not isinstance(valor, list):
        return []
    presentes = {e.get("id") for e in valor if isinstance(e, dict)}
    return [e["id"] for e in (propuesta or []) if isinstance(e, dict) and e.get("id") not in presentes]


def marcar(seccion: str, valor: Any, propuesta: Any) -> Any:
    """Fija el origen de cada elemento de una sección redactada contra la propuesta que tenía delante.

    Un elemento que la propuesta traía y el modelo dejó fuera se restaura en su lugar: el modelo no
    descarta elementos (visto en la entrevista real del B: al redactar D4 devolvió solo D4).
    """
    if seccion in SECCIONES_CON_ELEMENTOS and isinstance(valor, list):
        por_id = {
            e["id"]: e for e in (propuesta or []) if isinstance(e, dict) and isinstance(e.get("id"), str)
        }
        marcados = [_marcar_uno(e, por_id.get(e.get("id"))) if isinstance(e, dict) else e for e in valor]
        if not descartados(seccion, valor, propuesta):
            return marcados
        nuevos = {e.get("id"): e for e in marcados if isinstance(e, dict)}
        salida = [nuevos.get(i, p) for i, p in por_id.items()]
        return salida + [e for e in marcados if not isinstance(e, dict) or e.get("id") not in por_id]
    if seccion in SECCIONES_OBJETO_CON_ORIGEN and isinstance(valor, dict):
        return _marcar_uno(valor, propuesta if isinstance(propuesta, dict) else None)
    return valor
