"""Las listas de control sintéticas del demo B (las escribe `core/sintetico`; se leen con huella verificada).

Hacen para el B lo que el plan de beneficios para el A: el «mundo» con que se derivó la verdad conocida del
lote, que por eso lo cita por huella.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app_agents.canonico import leer_verificando


@dataclass(frozen=True)
class Listas:
    datos: dict[str, Any]

    @property
    def huella(self) -> str:
        return str(self.datos["huella"])

    def referencia(self) -> dict[str, str]:
        return {"huella": self.huella, "id": self.datos["id"], "version": self.datos["version"]}

    def consultadas(self) -> list[dict[str, Any]]:
        """Versión y fecha de cada lista (decisión D3: el expediente las cita)."""
        return [
            {
                "fecha": lista["fecha"],
                "id": lista["id"],
                "version": lista["version"],
                "vinculante": lista["vinculante"],
            }
            for lista in self.datos["listas"]
        ]

    def entrada(self, id_: str | None) -> dict[str, Any] | None:
        for lista in self.datos["listas"]:
            for e in lista["entradas"]:
                if e["id"] == id_:
                    return {**e, "lista_id": lista["id"], "vinculante": lista["vinculante"]}
        return None

    def jurisdiccion(self, codigo: str | None) -> dict[str, Any] | None:
        return next((j for j in self.datos["jurisdicciones"] if j["codigo"] == codigo), None)

    def actividad(self, codigo: str | None) -> dict[str, Any] | None:
        return next((a for a in self.datos["actividades"] if a["codigo"] == codigo), None)

    def regla(self, id_: str) -> dict[str, Any]:
        for clave in (
            "reglas_coincidencia",
            "reglas_inconsistencia",
            "reglas_puntaje",
            "reglas_propuesta",
            "reglas_guardia",
        ):
            for r in self.datos[clave]:
                if r["id"] == id_:
                    return dict(r)
        raise KeyError(id_)

    def codigos_actividad(self) -> list[str]:
        return [a["codigo"] for a in self.datos["actividades"]]

    def codigos_jurisdiccion(self) -> list[str]:
        return [j["codigo"] for j in self.datos["jurisdicciones"]]

    def catalogo_texto(self) -> str:
        """Catálogo en español para el prompt del extractor: códigos y nombres, sin niveles de riesgo."""
        acts = "\n".join(f"{a['codigo']} {a['nombre']['es']}" for a in self.datos["actividades"])
        jurs = "\n".join(f"{j['codigo']} {j['nombre']['es']}" for j in self.datos["jurisdicciones"])
        return f"Actividades económicas:\n{acts}\n\nJurisdicciones:\n{jurs}"

    def listas_texto(self) -> str:
        """Las entradas de todas las listas, para la línea base de agente único (que no tiene
        investigador)."""
        lineas = []
        for lista in self.datos["listas"]:
            for e in lista["entradas"]:
                alias = f" (alias: {', '.join(e['alias'])})" if e["alias"] else ""
                lineas.append(
                    f"{e['id']}: {e['nombre']}{alias}; nacido en {e['nacimiento']}; {e['nacionalidad']}"
                )
        return "\n".join(lineas)


def cargar_listas(ruta: str | Path) -> Listas:
    return Listas(leer_verificando(Path(ruta)))
