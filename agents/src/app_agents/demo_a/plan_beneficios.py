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

    @property
    def tope_alto_costo(self) -> str:
        """La referencia al umbral de alto costo del plan (`umbral.U2`): se resuelve contra el plan (M-18)."""
        return str(self.datos["tope_alto_costo"])

    @property
    def unidad_de_costo(self) -> dict[str, str]:
        return dict(self.datos["unidad_de_costo"])

    def tope_cobertura(self, codigo: str | None) -> int | None:
        """Hasta cuánto cubre el plan un servicio (plan de beneficios v2, RB-08); `None` si no tiene tope."""
        p = self.procedimiento(codigo)
        return p.get("tope_cobertura") if p is not None else None

    def con_topes(self) -> bool:
        return any(p.get("tope_cobertura") is not None for p in self.datos["procedimientos"])

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
                tope = p.get("tope_cobertura")
                return f"{base} [tope de cobertura: {tope}]" if con_estado and tope is not None else base
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
