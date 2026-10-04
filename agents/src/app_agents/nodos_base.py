"""Utilidades comunes de los nodos de un demo, con la misma semántica que las del demo A.

Lo que todo demo necesita: el registro de un paso (tokens, costo, error del proveedor), la evaluación de las
aristas de un nodo escritor con el intérprete del plan, la llamada al modelo con salida estructurada y la
función de enrutamiento que exige la misma rama que quedó registrada (regla dura 3). El demo B la hereda; el
A conserva sus propios métodos (idénticos) para no mover el código que publica la vitrina en
`data/vitrina/demo-a/grafo-codigo.json`.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app_agents.adaptador import ErrorProveedor
from app_agents.plan import ContratoDeGrafo
from app_agents.reglas_arista import ErrorArista, decidir

OPERADOR_TEXTO = {
    "igual_a": ("igual a", "equal to"),
    "distinto_de": ("distinto de", "different from"),
    "menor_que": ("menor que", "less than"),
    "mayor_que": ("mayor que", "greater than"),
    "menor_o_igual_que": ("menor o igual que", "at most"),
    "mayor_o_igual_que": ("mayor o igual que", "at least"),
}


def como_json(valor: Any) -> Any:
    return valor.model_dump(mode="json") if hasattr(valor, "model_dump") else valor


class NodosBase:
    cg: ContratoDeGrafo

    def _paso(
        self,
        estado: dict[str, Any],
        nodo: str,
        inicio: int,
        fin: int,
        raw: Any = None,
        error: ErrorProveedor | None = None,
    ) -> dict[str, Any]:
        if error is not None:
            meta: dict[str, Any] = {"total_cost_usd": error.costo_usd}
        else:
            meta = (getattr(raw, "response_metadata", None) or {}) if raw is not None else {}
        uso = meta.get("usage") or {}
        entrada = (
            int(uso.get("input_tokens", 0))
            + int(uso.get("cache_creation_input_tokens", 0))
            + int(uso.get("cache_read_input_tokens", 0))
        )
        return {
            "orden": len(estado.get("pasos", [])) + 1,
            "nodo": nodo,
            "tipo_nodo": self.cg.tipo_de_nodo(nodo),
            "inicio_ms": inicio,
            "duracion_ms": fin - inicio,
            "tokens": {"entrada": entrada, "salida": int(uso.get("output_tokens", 0))},
            "costo_nominal_usd": round(
                float(meta.get("total_cost_usd") or 0.0) + float(meta.get("costo_reintentos_usd") or 0.0), 6
            ),
            "error_proveedor": error.tipo if error is not None else None,
            "reintentos_esquema": int(meta.get("reintentos_esquema") or 0),
        }

    def _decidir(self, nodo: str, senales: dict[str, Any], paso: int) -> tuple[str, list[dict[str, Any]]]:
        return decidir(
            self.cg.aristas_de(nodo),
            self.cg.rama_por_defecto(nodo),
            senales,
            senales["umbrales_aplicados"],
            paso,
        )

    def _llamar(self, modelo: Any, esquema: Any, sistema: str, prompt: str, nodo: str) -> tuple[Any, Any]:
        try:
            r = modelo.with_structured_output(esquema, include_raw=True).invoke(
                [SystemMessage(content=sistema), HumanMessage(content=prompt)]
            )
        except ErrorProveedor as e:
            e.nodo = nodo  # type: ignore[attr-defined]
            raise
        return r["parsed"], r["raw"]

    def ruta(self, nodo: str) -> Callable[[dict[str, Any]], str]:
        def _ruta(estado: dict[str, Any]) -> str:
            propias = [d for d in estado["decisiones_de_arista"] if d["desde"] == nodo]
            paso = max(d["paso"] for d in propias)
            rama, _ = self._decidir(nodo, dict(estado), paso)
            registrada = next(d["rama_tomada"] for d in propias if d["paso"] == paso)
            if rama != registrada:
                raise ErrorArista(f"{nodo}: el enrutamiento ({rama}) difiere de lo registrado ({registrada})")
            return rama

        _ruta.__name__ = f"ruta_{nodo}"
        return _ruta

    @staticmethod
    def motivo(registro: dict[str, Any]) -> dict[str, Any]:
        """El motivo legible de una pausa: la arista que se cumplió, con lo observado y el umbral aplicado."""
        n, desde = registro["orden_arista"], registro["desde"]
        if registro["tipo"] == "funcion":
            args = ", ".join(f"{k}={registro['entradas'][k]}" for k in sorted(registro["entradas"]))
            texto = f"{registro['funcion']}({args})"
            return {
                "desde": desde,
                "orden_arista": n,
                "es": f"Arista {n} de {desde}: {texto}.",
                "en": f"Edge {n} of {desde}: {texto}.",
            }
        es, en = OPERADOR_TEXTO[registro["operador"]]
        obs, dec, apl = registro["valor_observado"], registro["valor_declarado"], registro["umbral_aplicado"]
        senal = registro["senal"]
        return {
            "desde": desde,
            "orden_arista": n,
            "es": f"Arista {n} de {desde}: {senal} ({obs}) {es} {dec} ({apl}).",
            "en": f"Edge {n} of {desde}: {senal} ({obs}) {en} {dec} ({apl}).",
        }
