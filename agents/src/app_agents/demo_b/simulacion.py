"""El mundo alrededor del agente B en un lote, NUNCA el agente.

- `EntornoSimulado`: el oficial de cumplimiento que decide en las pausas siguiendo la verdad conocida
  (política declarada en el plan, DA-04; la vitrina lo divulga).
- `RespondedorSimulado`: el proveedor de modelo simulado (`ChatSimulado`) del demo B. Responde con lo que el
  generador declaró en `caso.simulacion` (ruido determinista por semilla): la corrida simulada de CI es
  reproducible byte a byte. Jamás se usa con un modelo real.
"""

from __future__ import annotations

from typing import Any

POLITICA_REVISOR = "sigue_verdad_conocida"
RAZONES = {
    "misma_persona": (
        "El año de nacimiento y la nacionalidad no permiten descartar que sea la persona de la lista.",
        "The year of birth and nationality do not rule out that this is the listed person.",
    ),
    "homonimo": (
        "El año de nacimiento y la nacionalidad no son los de la persona de la lista.",
        "The year of birth and nationality are not those of the listed person.",
    ),
}


class EntornoSimulado:
    def __init__(self, caso: dict[str, Any]) -> None:
        self.caso = caso

    def revisar(self, payload: dict[str, Any]) -> dict[str, Any]:
        """El oficial simulado: decide lo que dice la verdad conocida del caso, con sus reglas RV-xx."""
        v = self.caso["verdad_conocida"]
        return {"decision": v["decision"], "politica": POLITICA_REVISOR, "reglas": list(v["reglas"])}


class RespondedorSimulado:
    """`respondedor(peticion)` para `ChatSimulado`: despacha por el título del esquema pedido."""

    def __init__(self, entorno: EntornoSimulado) -> None:
        self.caso = entorno.caso

    def _razones(self, conclusion: str) -> dict[str, str]:
        es, en = RAZONES[conclusion]
        return {"razones_en": en, "razones_es": es}

    def __call__(self, peticion: dict[str, Any]) -> Any:
        titulo = (peticion.get("json_schema") or {}).get("title")
        sim = self.caso["simulacion"]
        if titulo == "ExtraccionB":
            return dict(sim["campos_extraidos"])
        if titulo == "Investigacion":
            return {
                "conclusion": sim["conclusion_investigador"],
                **self._razones(sim["conclusion_investigador"]),
            }
        if titulo == "ExtraccionEIdentidad":
            v = self.caso["verdad_conocida"]
            conclusion = (
                "sin_parecido" if v["conclusion_investigador"] is None else sim["conclusion_investigador"]
            )
            return {
                **sim["campos_extraidos"],
                "conclusion_lista": conclusion,
                "entrada_lista": v["entrada_lista"],
                **self._razones("homonimo" if conclusion == "sin_parecido" else conclusion),
            }
        raise ValueError(f"petición simulada sin respuesta declarada: {titulo!r}")
