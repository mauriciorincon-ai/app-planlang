"""El plan aprobado como contrato del constructor (lado Python).

Carga el plan verificando su huella y expone lo que el grafo necesita: umbrales aplicados, aristas por
nodo escritor en su `orden`, rama por defecto y destinos posibles. Es el espejo de
`core/plan/contrato-constructor.ts`: ninguna arista se escribe a mano en el grafo, todas salen de aquí.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app_agents.canonico import HuellaInvalida, jcs_texto, leer_verificando

RAIZ_REPO = Path(__file__).resolve().parents[3]


class PlanInvalido(ValueError):
    pass


@dataclass(frozen=True)
class ContratoDeGrafo:
    """Aristas, ramas por defecto y tipos de nodo con que se construye (y se recalcula) un grafo."""

    aristas: list[dict[str, Any]]
    ramas_por_defecto: dict[str, str]
    tipos: dict[str, str]

    def aristas_de(self, nodo: str) -> list[dict[str, Any]]:
        return sorted((a for a in self.aristas if a["desde"] == nodo), key=lambda a: a["orden"])

    def nodos_escritores(self) -> list[str]:
        return sorted({a["desde"] for a in self.aristas})

    def rama_por_defecto(self, nodo: str) -> str:
        if nodo in self.ramas_por_defecto:
            return self.ramas_por_defecto[nodo]
        propias = self.aristas_de(nodo)
        if len(propias) == 1 and propias[0].get("si_falso"):
            return str(propias[0]["si_falso"])
        raise PlanInvalido(f"el nodo escritor {nodo} no tiene rama por defecto")

    def ramas_resueltas(self) -> dict[str, str]:
        return {n: self.rama_por_defecto(n) for n in self.nodos_escritores()}

    def destinos(self, nodo: str) -> list[str]:
        return sorted({a["si_verdadero"] for a in self.aristas_de(nodo)} | {self.rama_por_defecto(nodo)})

    def tipo_de_nodo(self, nodo: str) -> str:
        if nodo not in self.tipos:
            raise PlanInvalido(f"el contrato no declara el nodo {nodo}")
        return self.tipos[nodo]


@dataclass(frozen=True)
class PlanCargado:
    datos: dict[str, Any]
    archivo: str
    huella: str = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(self, "huella", self.datos["huella"])

    @property
    def id(self) -> str:
        return str(self.datos["id"])

    @property
    def version(self) -> str:
        return str(self.datos["version"])

    @property
    def contrato(self) -> dict[str, Any]:
        return self.datos["contrato_de_grafo"]

    def contrato_de_grafo(self) -> ContratoDeGrafo:
        """El contrato del plan tal cual (variante multiagente)."""
        return ContratoDeGrafo(
            aristas=sorted(self.contrato["aristas_condicionales"], key=lambda a: (a["desde"], a["orden"])),
            ramas_por_defecto=dict(self.contrato.get("ramas_por_defecto", {})),
            tipos={n["id"]: n["tipo"] for n in self.contrato["nodos_esperados"]},
        )

    def umbrales(self, cambios: dict[str, Any] | None = None) -> dict[str, Any]:
        """Valores aplicados de U1…Un (los del plan, con los `cambios` jugados encima)."""
        base = {u["id"]: u["valor_en_plan"] for u in self.datos["umbrales"]}
        for k, v in (cambios or {}).items():
            if k not in base:
                raise PlanInvalido(f"el plan no declara el umbral {k}")
            base[k] = v
        return dict(sorted(base.items()))

    def senales_obligatorias(self) -> list[str]:
        return list(self.contrato["senales_obligatorias_en_traza"])

    def umbral_de_senal(self, senal: str) -> dict[str, Any]:
        """M-18: el umbral se busca por la señal que compara, no por su id (renumerar U1…Un no rompe nada)."""
        hallados = [u for u in self.datos["umbrales"] if u["senal"] == senal]
        if len(hallados) != 1:
            raise PlanInvalido(
                f"el plan declara {len(hallados)} umbrales sobre la señal {senal}; se espera uno"
            )
        return dict(hallados[0])

    def umbral_de_referencia(self, referencia: str, senal: str) -> dict[str, Any]:
        """Un umbral citado como `umbral.Ux` (p. ej. el tope de alto costo del plan de beneficios),
        exigiendo que sea el de `senal`: una referencia que apunte a otro umbral es un error del plan, no
        un número que se usa igual."""
        if not referencia.startswith("umbral."):
            raise PlanInvalido(f"«{referencia}» no es una referencia a un umbral")
        u = self.umbral_de_senal(senal)
        if u["id"] != referencia.removeprefix("umbral."):
            raise PlanInvalido(f"«{referencia}» no es el umbral de la señal {senal} ({u['id']})")
        return u

    def referencia(self) -> dict[str, str]:
        return {"archivo": self.archivo, "huella": self.huella, "id": self.id, "version": self.version}


def cargar_plan(ruta: str | Path) -> PlanCargado:
    """Lee y verifica la huella; exige un plan aprobado (RF-06.1)."""
    ruta = Path(ruta)
    datos = leer_verificando(ruta)
    if datos.get("estado_aprobacion") != "aprobado":
        raise PlanInvalido(f"{ruta}: el constructor solo trabaja sobre un plan aprobado")
    try:
        archivo = ruta.resolve().relative_to(RAIZ_REPO).as_posix()
    except ValueError:
        archivo = ruta.name
    return PlanCargado(datos=datos, archivo=archivo)


def misma_verdad(a: dict[str, Any], b: dict[str, Any]) -> bool:
    """¿Da el plan `b` la misma verdad conocida que el plan `a`? Sí si conserva exactamente umbrales y
    contrato de grafo: una enmienda de solo medición no invalida los lotes. Espejo de
    `core/plan/compatibilidad.ts` (compara los objetos tal como están en disco)."""
    claves = ("umbrales", "contrato_de_grafo")
    if any(k not in a or k not in b for k in claves):
        return False
    return all(jcs_texto(a[k]) == jcs_texto(b[k]) for k in claves)


def plan_por_huella(directorio: str | Path, huella: str) -> PlanCargado | None:
    """El plan aprobado de `directorio` con esa huella (verificada), o `None`."""
    for ruta in sorted(Path(directorio).glob("*.json")):
        try:
            plan = cargar_plan(ruta)
        except (PlanInvalido, HuellaInvalida):
            continue
        if plan.huella == huella:
            return plan
    return None
