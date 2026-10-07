"""Exportador `planlang-trace/v1` (regla dura 8): las trazas PROPIAS de la app, con huella.

`runs/<demo>/<corrida>/`:
  - `corrida.json`          manifiesto: plan, lote de casos, proveedor, modelo, versión del grafo,
                            umbrales aplicados, sesiones, trazas con su huella, ficha.
  - `grafo.json`            el grafo compilado (`get_graph().to_json()`) ⊕ las aristas del plan.
  - `trazas/<caso_id>.json` una por caso: pasos, señales obligatorias, decisiones de arista, pausas,
                            extracción (enmascarada), salida final, documento adverso, guardia.
  - `ramas-esperadas.json`  lo que el intérprete Python recalcula desde lo observado (RF-09.2): el
                            intérprete TypeScript debe producir el mismo objeto (misma huella).
  - `entorno.json`          versiones del entorno (solo corridas reales; sin huella).
Nada de `session_id`, `uuid`, claves ni variables de entorno: solo conteos y costos.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app_agents.canonico import con_huella, escribir_bonito, escribir_con_huella, leer_verificando
from app_agents.reglas_arista import recalcular

FORMATO_TRAZA = "planlang-trace/v1"
FORMATO_GRAFO = "planlang-grafo/v1"
FORMATO_RAMAS = "planlang-ramas/v1"
ETIQUETA = {"es": "Simulación · no operativo", "en": "Simulation · not operational"}


def _suma_tokens(pasos: list[dict[str, Any]]) -> int:
    return sum(int(p["tokens"]["entrada"]) + int(p["tokens"]["salida"]) for p in pasos)


def traza_de_estado(
    estado: dict[str, Any],
    *,
    corrida_id: str,
    variante: str,
    senales_obligatorias: list[str],
    error: dict[str, Any] | None = None,
    tipo_de_nodo: Any = None,
    extras: tuple[str, ...] = (),
) -> dict[str, Any]:
    """Traza de UN caso desde su estado final (o parcial, si el proveedor falló).

    Las señales son las que el plan declara obligatorias: las que el exportador calcula (pasos, latencia,
    tokens, errores) y las demás tal como el grafo (o el arnés, si son de medición) las dejó en el estado.
    `extras`: campos propios de un demo que viajan en la traza (el B: coincidencias, investigación, puntaje y
    expediente)."""
    pasos = [dict(p) for p in estado.get("pasos", [])]
    if error is not None:
        fin = (pasos[-1]["inicio_ms"] + pasos[-1]["duracion_ms"]) if pasos else 0
        pasos.append(
            {
                "orden": len(pasos) + 1,
                "nodo": error["nodo"],
                "tipo_nodo": tipo_de_nodo(error["nodo"]) if tipo_de_nodo else None,
                "inicio_ms": fin,
                "duracion_ms": 0,
                "tokens": {"entrada": 0, "salida": 0},
                "costo_nominal_usd": error.get("costo_usd", 0.0),
                "error_proveedor": error["tipo"],
                "reintentos_esquema": 0,
            }
        )
    nodos = [p["nodo"] for p in pasos]
    # El primer paso que falló: el error que cortó el caso o el que el plan pasó a una persona (AU-9).
    primer_error = next((p["error_proveedor"] for p in pasos if p["error_proveedor"]), None)
    calculadas = {
        "ciclos_aclaracion": int(estado.get("aclaraciones_hechas", 0)),
        "decision_final": estado.get("decision_final") if error is None else None,
        "pausa_humana": bool(estado.get("pausa_humana", False)),
        "nodos_visitados": nodos,
        "latencia_total_s": round(sum(int(p["duracion_ms"]) for p in pasos) / 1000, 3),
        "tokens": _suma_tokens(pasos),
        "error_proveedor": primer_error,
        "proveedor_no_disponible": bool(estado.get("proveedor_no_disponible", False)),
    }
    traza = {
        "formato": FORMATO_TRAZA,
        "corrida_id": corrida_id,
        "caso_id": estado["caso_id"],
        "variante": variante,
        "resultado": "error" if error else "completo",
        "pasos": pasos,
        "nodos_visitados": nodos,
        "senales": {k: calculadas[k] if k in calculadas else estado.get(k) for k in senales_obligatorias},
        "decisiones_de_arista": sorted(
            estado.get("decisiones_de_arista", []), key=lambda d: (d["paso"], d["orden_arista"])
        ),
        "pausas_humanas": list(estado.get("pausas", [])),
        "extraccion": estado.get("extraccion"),
        "aclaraciones": list(estado.get("aclaraciones", [])),
        "cobertura": estado.get("cobertura"),
        "salida_final": estado.get("salida_final") if error is None else None,
        "documento_adverso": estado.get("documento_adverso") if error is None else None,
        "guardia_salida": estado.get("guardia_salida") if error is None else None,
        "error_proveedor": primer_error,
        "error_de_esquema_en_traspaso": any(p["error_proveedor"] == "esquema_invalido" for p in pasos),
    }
    for k in extras:
        traza[k] = estado.get(k) if error is None or k != "expediente" else None
    return con_huella(traza)


def grafo_json(
    app: Any,
    *,
    demo_id: str,
    variante: str,
    contrato: dict[str, Any],
    aristas: list[dict[str, Any]],
    ramas_por_defecto: dict[str, str],
    tipos: dict[str, str],
) -> dict[str, Any]:
    return con_huella(
        {
            "formato": FORMATO_GRAFO,
            "demo_id": demo_id,
            "variante": variante,
            "nodos": [{"id": n, "tipo": t} for n, t in sorted(tipos.items())],
            "aristas_condicionales": aristas,
            "ramas_por_defecto": dict(sorted(ramas_por_defecto.items())),
            "pausas_humanas": contrato["pausas_humanas"],
            "langgraph": app.get_graph().to_json(),
        }
    )


def ramas_esperadas(
    corrida_id: str, trazas: list[dict[str, Any]], grafo: dict[str, Any], umbrales: dict[str, Any]
) -> dict[str, Any]:
    visitas: list[dict[str, Any]] = []
    for t in sorted(trazas, key=lambda t: t["caso_id"]):
        for v in recalcular(
            t["decisiones_de_arista"], grafo["aristas_condicionales"], grafo["ramas_por_defecto"], umbrales
        ):
            visitas.append({"caso_id": t["caso_id"], **v})
    return con_huella(
        {
            "formato": FORMATO_RAMAS,
            "corrida_id": corrida_id,
            "fuente": "python · app_agents.reglas_arista",
            "umbrales_aplicados": umbrales,
            "visitas": visitas,
        }
    )


def escribir_corrida(
    directorio: Path,
    *,
    manifiesto: dict[str, Any],
    grafo: dict[str, Any],
    trazas: dict[str, dict[str, Any]],
    entorno: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Escribe grafo, trazas, ramas esperadas y manifiesto (con las huellas de todo)."""
    directorio.mkdir(parents=True, exist_ok=True)
    escribir_bonito(directorio / "grafo.json", grafo)
    for caso_id, traza in trazas.items():
        escribir_bonito(directorio / "trazas" / f"{caso_id}.json", traza)
    ramas = ramas_esperadas(
        manifiesto["corrida_id"], list(trazas.values()), grafo, manifiesto["umbrales_aplicados"]
    )
    escribir_bonito(directorio / "ramas-esperadas.json", ramas)
    orden = manifiesto["casos_ejecutados"]
    manifiesto = {
        **manifiesto,
        "version_grafo": grafo["huella"],
        "ramas_esperadas": {"archivo": "ramas-esperadas.json", "huella": ramas["huella"]},
        "trazas": [
            {
                "archivo": f"trazas/{c}.json",
                "caso_id": c,
                "huella": trazas[c]["huella"],
                "resultado": trazas[c]["resultado"],
            }
            for c in orden
        ],
    }
    if entorno is not None:
        escribir_bonito(directorio / "entorno.json", entorno)
    return escribir_con_huella(directorio / "corrida.json", manifiesto)


def leer_corrida(directorio: Path) -> tuple[dict[str, Any], dict[str, Any], dict[str, dict[str, Any]]]:
    """Lee manifiesto, grafo y trazas verificando cada huella contra el manifiesto (RF-06.1)."""
    manifiesto = leer_verificando(directorio / "corrida.json")
    grafo = leer_verificando(directorio / "grafo.json")
    if grafo["huella"] != manifiesto["version_grafo"]:
        raise ValueError(f"{directorio}: grafo.json no es la versión declarada")
    trazas: dict[str, dict[str, Any]] = {}
    for ref in manifiesto["trazas"]:
        t = leer_verificando(directorio / ref["archivo"])
        if t["huella"] != ref["huella"]:
            raise ValueError(f"{directorio}: la traza {ref['caso_id']} no es la declarada en el manifiesto")
        trazas[ref["caso_id"]] = t
    return manifiesto, grafo, trazas


def verificar_corrida(directorio: Path) -> list[str]:
    """Lado Python de RF-09.2 y de la integridad de la corrida. Devuelve las discrepancias (vacío = OK)."""
    problemas: list[str] = []
    manifiesto, grafo, trazas = leer_corrida(directorio)
    umbrales = manifiesto["umbrales_aplicados"]
    for caso_id, t in trazas.items():
        if t["nodos_visitados"] != [p["nodo"] for p in t["pasos"]]:
            problemas.append(f"{caso_id}: nodos_visitados no coincide con pasos")
        registradas = {(d["paso"], d["desde"]): d for d in t["decisiones_de_arista"]}
        for v in recalcular(
            t["decisiones_de_arista"], grafo["aristas_condicionales"], grafo["ramas_por_defecto"], umbrales
        ):
            reg = [
                d for d in t["decisiones_de_arista"] if d["paso"] == v["paso"] and d["desde"] == v["desde"]
            ]
            if [d["resultado"] for d in reg] != v["resultados"]:
                problemas.append(
                    f"{caso_id} paso {v['paso']} {v['desde']}: resultados {v['resultados']} ≠ registrados"
                )
            if registradas[(v["paso"], v["desde"])]["rama_tomada"] != v["rama_tomada"]:
                problemas.append(
                    f"{caso_id} paso {v['paso']} {v['desde']}: rama recalculada {v['rama_tomada']}"
                )
    esperado = ramas_esperadas(manifiesto["corrida_id"], list(trazas.values()), grafo, umbrales)
    en_disco = leer_verificando(directorio / "ramas-esperadas.json")
    if en_disco["huella"] != esperado["huella"]:
        problemas.append("ramas-esperadas.json no coincide con el recálculo del intérprete Python")
    return problemas
