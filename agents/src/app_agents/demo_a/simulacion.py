"""El mundo alrededor del agente en un lote — NUNCA el agente.

- `EntornoSimulado`: el médico que responde las aclaraciones según el guion del caso y el auditor
  humano que decide en las pausas siguiendo la verdad conocida (política declarada en el plan, DA-04;
  la vitrina lo divulga).
- `RespondedorSimulado`: el proveedor de modelo simulado (`ChatSimulado`) del demo A. Responde con lo
  que el generador sintético declaró en `caso.simulacion` (ruido determinista por semilla), así la
  corrida simulada de CI es reproducible byte a byte. Jamás se usa con un modelo real.
"""

from __future__ import annotations

import re
from typing import Any

POLITICA_REVISOR = "sigue_verdad_conocida"
SIN_RESPUESTA = {"es": "Sin respuesta del médico.", "en": "No reply from the doctor."}
PREGUNTA_SIMULADA = "Por favor, complete los datos que faltan en la solicitud."

CARTAS_SIMULADAS = {
    "aprobar": {
        "es": "Su solicitud fue aprobada. Puede coordinar la atención con su prestador.",
        "en": "Your request was approved. You can arrange the care with your provider.",
    },
    "negar": {
        "es": "Su solicitud no fue aprobada porque el servicio está excluido del plan por una causa de ley. "
        "Recibirá un documento que explica cómo reclamar.",
        "en": "Your request was not approved because the service is excluded from the plan on a legal "
        "ground. You will receive a document explaining how to appeal.",
    },
}


class EntornoSimulado:
    def __init__(self, caso: dict[str, Any]) -> None:
        self.caso = caso
        self.respuestas_entregadas = 0

    def responder_aclaracion(self) -> dict[str, Any]:
        guion = self.caso["entrada"]["aclaraciones_simuladas"]
        i = self.respuestas_entregadas
        self.respuestas_entregadas += 1
        if i < len(guion):
            return {"ciclo": i + 1, "respuesta": guion[i]["texto"]["es"]}
        return {"ciclo": i + 1, "respuesta": SIN_RESPUESTA["es"]}

    def revisar(self, payload: dict[str, Any]) -> dict[str, Any]:
        """El auditor simulado: decide lo que dice la verdad conocida del caso."""
        verdad = self.caso["verdad_conocida"]
        return {"causal": verdad["causal"], "decision": verdad["decision"], "politica": POLITICA_REVISOR}

    def campos_conocidos(self) -> set[str]:
        """Campos que el texto y las respuestas entregadas hasta ahora permiten conocer."""
        sim = self.caso["simulacion"]
        conocidos = {"procedimiento", "diagnostico", "urgencia", "costo_estimado"}
        conocidos -= set(sim["campos_ausentes_en_texto"])
        for g in self.caso["entrada"]["aclaraciones_simuladas"][: self.respuestas_entregadas]:
            conocidos |= set(g["aporta"])
        return conocidos


_DECISION = re.compile(r"^Decisión: (aprobar|negar)$", re.MULTILINE)


class RespondedorSimulado:
    """`respondedor(peticion)` para `ChatSimulado`: despacha por el título del esquema pedido."""

    def __init__(self, entorno: EntornoSimulado) -> None:
        self.entorno = entorno
        self.caso = entorno.caso

    def _extraccion(self) -> dict[str, Any]:
        sim = self.caso["simulacion"]
        conocidos = self.entorno.campos_conocidos()
        campos = {k: (v if k in conocidos else None) for k, v in sim["campos_extraidos"].items()}
        return {**campos, "confianza": sim["confianza_extractor"]}

    def _carta(self, decision: str) -> dict[str, Any]:
        carta = dict(CARTAS_SIMULADAS[decision])
        if self.caso["simulacion"]["redactor_repite_identificador"]:
            # Simula una fuga (p. ej. un enmascarado roto) para ejercitar la guardia de salida.
            doc = self.caso["entrada"]["afiliado"]["documento"]
            carta = {
                "es": f"{carta['es']} Documento del afiliado: {doc}.",
                "en": f"{carta['en']} Member ID: {doc}.",
            }
        return carta

    def __call__(self, peticion: dict[str, Any]) -> Any:
        titulo = (peticion.get("json_schema") or {}).get("title")
        if titulo == "Extraccion":
            return self._extraccion()
        if titulo == "PreguntaAclaracion":
            return {"pregunta": PREGUNTA_SIMULADA}
        if titulo == "Carta":
            m = _DECISION.search(peticion["prompt"])
            decision = m.group(1) if m else "aprobar"
            return {**self._carta(decision), "acciones": ["responder_afiliado"]}
        if titulo == "ExtraccionYCarta":
            propuesta = self.caso["verdad_conocida"]["decision"]
            carta = self._carta(propuesta)
            return {
                **self._extraccion(),
                "propuesta": propuesta,
                "carta_es": carta["es"],
                "carta_en": carta["en"],
                "acciones": ["responder_afiliado"],
            }
        raise ValueError(f"petición simulada sin respuesta declarada: {titulo!r}")
