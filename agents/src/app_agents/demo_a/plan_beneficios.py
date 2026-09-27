"""Plan de beneficios sintético (lo escribe `core/sintetico`, lo lee el demo con huella verificada)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app_agents.canonico import leer_verificando


@dataclass(frozen=True)
class PlanBeneficios:
    datos: dict[str, Any]

    @property
    def huella(self) -> str:
        return str(self.datos["huella"])

    def referencia(self) -> dict[str, str]:
        return {"huella": self.huella, "id": self.datos["id"], "version": self.datos["version"]}

    def procedimiento(self, codigo: str | None) -> dict[str, Any] | None:
        return next((p for p in self.datos["procedimientos"] if p["codigo"] == codigo), None)

    def diagnostico(self, codigo: str | None) -> dict[str, Any] | None:
        return next((d for d in self.datos["diagnosticos"] if d["codigo"] == codigo), None)

    def causal(self, id_: str) -> dict[str, Any]:
        return next(c for c in self.datos["causales_de_exclusion"] if c["id"] == id_)

    def regla(self, id_: str) -> dict[str, Any]:
        return next(r for r in self.datos["reglas"] if r["id"] == id_)

    def es_exento(self, codigo: str | None) -> bool:
        p = self.procedimiento(codigo)
        return p is not None and p["estado"] == "exento"

    def codigos_procedimiento(self) -> list[str]:
        return [p["codigo"] for p in self.datos["procedimientos"]]

    def codigos_diagnostico(self) -> list[str]:
        return [d["codigo"] for d in self.datos["diagnosticos"]]

    def catalogo_texto(self, con_estado: bool = False) -> str:
        """Catálogo en español para el prompt: códigos y nombres (con `con_estado`, también cobertura)."""

        def linea(p: dict[str, Any]) -> str:
            base = f"{p['codigo']} {p['nombre']['es']}"
            if not con_estado or p["estado"] == "requiere_autorizacion":
                return base
            return (
                f"{base} [excluido: causal {p['causal']}]"
                if p["estado"] == "excluido"
                else f"{base} [exento]"
            )

        procs = "\n".join(linea(p) for p in self.datos["procedimientos"])
        diags = "\n".join(f"{d['codigo']} {d['nombre']['es']}" for d in self.datos["diagnosticos"])
        return f"Procedimientos:\n{procs}\n\nDiagnósticos:\n{diags}"


def cargar_plan_beneficios(ruta: str | Path) -> PlanBeneficios:
    return PlanBeneficios(leer_verificando(Path(ruta)))
