"""Ejecución por lotes del demo A (RF-04.9, RF-05.5) y exportación `planlang-trace/v1`.

`pnpm lote:demo` ≡ `python -m app_agents.lotes --demo a --n 20`. Fuera de CI con la suscripción (regla 6):
lotes pequeños, espaciados (`--pausa-s`) y ACUMULABLES: la corrida es el directorio; una sesión nueva
salta los casos ya exportados, añade su sesión al manifiesto y reescribe ramas y manifiesto. Si el
proveedor llega al límite de uso, la sesión se detiene, el caso no se exporta (se reintenta después) y
el límite queda registrado. Otro error del proveedor exporta una traza parcial con el nodo que falló.

LangSmith es ESPEJO: si `LANGSMITH_TRACING=true` y hay clave en el entorno del builder, LangChain
traza solo; la clave jamás se lee aquí ni viaja al subproceso de `claude` (adaptador).
"""

from __future__ import annotations

import argparse
import datetime as dt
import importlib.metadata as md
import os
import platform
import sqlite3
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

from app_agents.adaptador import CLAUDE_BIN, ErrorProveedor, crear_modelo
from app_agents.agente_unico import construir_grafo_linea_base, contrato_linea_base
from app_agents.canonico import leer_verificando
from app_agents.demo_a.estado import ContextoCaso, estado_inicial
from app_agents.demo_a.grafo import construir_grafo
from app_agents.demo_a.plan_beneficios import PlanBeneficios, cargar_plan_beneficios
from app_agents.demo_a.simulacion import EntornoSimulado, RespondedorSimulado
from app_agents.exportador import (
    ETIQUETA,
    FORMATO_TRAZA,
    escribir_corrida,
    grafo_json,
    leer_corrida,
    traza_de_estado,
)
from app_agents.logger import registrar
from app_agents.plan import RAIZ_REPO, ContratoDeGrafo, PlanCargado, cargar_plan
from app_agents.reloj import RelojFijo, RelojReal

PLAN_POR_DEFECTO = "plans/demo-a/v1.1.json"
CASOS_POR_DEFECTO = "data/casos/demo-a/planlang-a-001-20.json"
BENEFICIOS_POR_DEFECTO = "data/plan-beneficios/demo-a.json"
SALIDA_POR_DEFECTO = "runs/demo-a"
VARIANTES = ("multiagente", "agente_unico")
MODELO_POR_PROVEEDOR = {"suscripcion": "sonnet", "simulado": "simulado"}


class CorridaIncompatible(ValueError):
    pass


@dataclass
class ResumenSesion:
    corrida_id: str
    directorio: Path
    ejecutados: list[str] = field(default_factory=list)
    con_error: list[str] = field(default_factory=list)
    limites_alcanzados: int = 0
    detenida_por: str | None = None
    pendientes: int = 0


def _ruta(p: str | Path) -> Path:
    p = Path(p)
    return p if p.is_absolute() else RAIZ_REPO / p


def _relativa(p: Path) -> str:
    try:
        return p.resolve().relative_to(RAIZ_REPO).as_posix()
    except ValueError:
        return p.name


def _grafo_y_contrato(
    variante: str, plan: PlanCargado, pb: PlanBeneficios, checkpointer: Any
) -> tuple[Any, ContratoDeGrafo]:
    if variante == "agente_unico":
        return construir_grafo_linea_base(plan, pb, checkpointer=checkpointer), contrato_linea_base(plan)
    return construir_grafo(plan, pb, checkpointer=checkpointer), plan.contrato_de_grafo()


def _entorno(proveedor: str) -> dict[str, Any]:
    versiones = {
        p: md.version(p) for p in ("langchain", "langchain-core", "langgraph", "langsmith", "pydantic")
    }
    datos: dict[str, Any] = {
        "python": platform.python_version(),
        "paquetes": versiones,
        "sistema": platform.system(),
    }
    if proveedor == "suscripcion":
        try:
            r = subprocess.run([CLAUDE_BIN, "--version"], capture_output=True, text=True, timeout=30)
            datos["claude_cli"] = r.stdout.strip()
        except (OSError, subprocess.TimeoutExpired):
            datos["claude_cli"] = None
    return datos


def _espejo_langsmith() -> bool:
    return os.environ.get("LANGSMITH_TRACING", "").lower() == "true" and bool(
        os.environ.get("LANGSMITH_API_KEY")
    )


def _ficha(variante: str, proveedor: str, modelo: str, lote: dict[str, Any]) -> dict[str, Any]:
    nombre_es = "Demo A · autorizaciones médicas" + (
        " · línea base de agente único" if variante == "agente_unico" else ""
    )
    nombre_en = "Demo A · medical prior authorisation" + (
        " · single-agent baseline" if variante == "agente_unico" else ""
    )
    return {
        "nombre": {"es": nombre_es, "en": nombre_en},
        "descripcion": {
            "es": f"Corrida sobre el lote sintético {lote['id']} con el proveedor {proveedor} "
            f"(modelo {modelo}). "
            "Las decisiones humanas se simularon en lote: el auditor sigue la verdad conocida del caso.",
            "en": f"Run over the synthetic batch {lote['id']} with provider {proveedor} (model {modelo}). "
            "Human decisions were simulated in batch: the auditor follows the case's known truth.",
        },
        "etiqueta": ETIQUETA,
    }


def ejecutar_caso(
    app: Any, caso: dict[str, Any], ctx: ContextoCaso, config: dict[str, Any], umbrales: dict[str, Any]
):
    salida = app.invoke(estado_inicial(caso, umbrales), config, context=ctx)
    while "__interrupt__" in salida:
        respuesta = ctx.entorno.revisar(salida["__interrupt__"][0].value)
        salida = app.invoke(Command(resume=respuesta), config, context=ctx)
    return app.get_state(config).values


def ejecutar_lote(
    *,
    corrida_id: str,
    fecha: str,
    proveedor: str,
    plan_ruta: str | Path = PLAN_POR_DEFECTO,
    casos_ruta: str | Path = CASOS_POR_DEFECTO,
    beneficios_ruta: str | Path = BENEFICIOS_POR_DEFECTO,
    salida: str | Path = SALIDA_POR_DEFECTO,
    n: int | None = None,
    variante: str = "multiagente",
    modelo: str | None = None,
    pausa_s: float = 0.0,
    reloj: str = "real",
) -> ResumenSesion:
    if variante not in VARIANTES:
        raise ValueError(f"variante desconocida: {variante}")
    plan = cargar_plan(_ruta(plan_ruta))
    pb = cargar_plan_beneficios(_ruta(beneficios_ruta))
    lote_ruta = _ruta(casos_ruta)
    lote = leer_verificando(lote_ruta)
    if lote["plan"]["huella"] != plan.huella:
        raise CorridaIncompatible("el lote de casos se generó con otro plan (huella distinta)")
    modelo_nombre = modelo or MODELO_POR_PROVEEDOR.get(proveedor, proveedor)
    umbrales = plan.umbrales()
    directorio = _ruta(salida) / corrida_id

    previo: dict[str, Any] | None = None
    trazas: dict[str, dict[str, Any]] = {}
    if (directorio / "corrida.json").exists():
        previo, _, trazas = leer_corrida(directorio)
        esperado = {
            "variante": variante,
            "proveedor": proveedor,
            "modelo": modelo_nombre,
            "umbrales_aplicados": umbrales,
        }
        for k, v in esperado.items():
            if previo[k] != v:
                raise CorridaIncompatible(f"{corrida_id}: {k} = {previo[k]!r}, esta sesión trae {v!r}")
        if previo["plan"]["huella"] != plan.huella or previo["casos"]["huella"] != lote["huella"]:
            raise CorridaIncompatible(f"{corrida_id}: otro plan u otro lote de casos")

    simulado = proveedor == "simulado"
    if simulado:
        checkpointer: Any = InMemorySaver()
    else:
        directorio.mkdir(parents=True, exist_ok=True)
        ruta_sqlite = directorio / "checkpoints.sqlite"
        conexion = sqlite3.connect(ruta_sqlite, check_same_thread=False)
        os.chmod(ruta_sqlite, 0o600)  # derivado local: nace privado (regla 17-bis)
        from langgraph.checkpoint.sqlite import SqliteSaver

        checkpointer = SqliteSaver(conexion)
    app, contrato = _grafo_y_contrato(variante, plan, pb, checkpointer)
    sesion_n = len(previo["sesiones"]) + 1 if previo else 1
    orden_lote = [c["id"] for c in lote["casos"]]
    pendientes = [c for c in lote["casos"] if c["id"] not in trazas]
    a_correr = pendientes if n is None else pendientes[:n]
    resumen = ResumenSesion(corrida_id=corrida_id, directorio=directorio)
    modelo_real = None if simulado else crear_modelo(proveedor, modelo=modelo)
    registrar(
        "sesion_inicia",
        corrida_id=corrida_id,
        proveedor=proveedor,
        modelo=modelo_nombre,
        n=len(a_correr),
        detalle=f"espejo_langsmith={'si' if _espejo_langsmith() else 'no'}",
    )

    for i, caso in enumerate(a_correr):
        entorno = EntornoSimulado(caso)
        llm = crear_modelo("simulado", respondedor=RespondedorSimulado(entorno)) if simulado else modelo_real
        ctx = ContextoCaso(caso["id"], llm, entorno, RelojFijo() if reloj == "fijo" else RelojReal())
        config = {
            "configurable": {"thread_id": f"{corrida_id}:{caso['id']}:s{sesion_n}"},
            "run_name": f"demo-a:{caso['id']}",
            "tags": [corrida_id, variante],
            "metadata": {"caso_id": caso["id"], "corrida_id": corrida_id, "plan_version": plan.version},
        }
        error = None
        try:
            final = ejecutar_caso(app, caso, ctx, config, umbrales)
        except ErrorProveedor as e:
            if e.tipo == "limite_de_uso":
                resumen.limites_alcanzados += 1
                resumen.detenida_por = "limite_de_uso"
                registrar("limite_de_uso", corrida_id=corrida_id, caso_id=caso["id"], error_proveedor=e.tipo)
                break
            error = {
                "costo_usd": round(e.costo_usd, 6),
                "nodo": getattr(e, "nodo", "desconocido"),
                "tipo": e.tipo,
            }
            # Solo al log local (stderr), truncado: el detalle del CLI jamás entra a la traza.
            registrar(
                "error_proveedor",
                corrida_id=corrida_id,
                caso_id=caso["id"],
                nodo=error["nodo"],
                error_proveedor=e.tipo,
                detalle=str(e.detalle)[:200],
            )
            final = dict(app.get_state(config).values) or estado_inicial(caso, umbrales)
        traza = traza_de_estado(
            final,
            corrida_id=corrida_id,
            variante=variante,
            senales_obligatorias=plan.senales_obligatorias(),
            error=error,
            tipo_de_nodo=contrato.tipo_de_nodo,
        )
        trazas[caso["id"]] = traza
        resumen.ejecutados.append(caso["id"])
        if error:
            resumen.con_error.append(caso["id"])
        s = traza["senales"]
        registrar(
            "caso_terminado",
            corrida_id=corrida_id,
            caso_id=caso["id"],
            rama=str(s.get("decision_final")),
            latencia_ms=int(round(float(s["latencia_total_s"]) * 1000)),
            tokens_entrada=sum(p["tokens"]["entrada"] for p in traza["pasos"]),
            tokens_salida=sum(p["tokens"]["salida"] for p in traza["pasos"]),
            costo_nominal_usd=round(sum(p["costo_nominal_usd"] for p in traza["pasos"]), 6),
            error_proveedor=s.get("error_proveedor"),
        )
        if pausa_s > 0 and i < len(a_correr) - 1:
            time.sleep(pausa_s)

    resumen.pendientes = len(pendientes) - len(resumen.ejecutados)
    sesiones = list(previo["sesiones"]) if previo else []
    sesiones.append(
        {
            "casos_ejecutados": resumen.ejecutados,
            "detenida_por": resumen.detenida_por,
            "fecha": fecha,
            "limites_alcanzados": resumen.limites_alcanzados,
            "numero": sesion_n,
        }
    )
    if not trazas:
        return resumen
    grafo = grafo_json(
        app,
        demo_id="demo-a",
        variante=variante,
        contrato=plan.contrato,
        aristas=contrato.aristas,
        ramas_por_defecto=contrato.ramas_resueltas(),
        tipos=contrato.tipos,
    )
    ejecutados = [c for c in orden_lote if c in trazas]
    manifiesto = {
        "formato": FORMATO_TRAZA,
        "tipo": "corrida",
        "corrida_id": corrida_id,
        "demo_id": "demo-a",
        "variante": variante,
        "fecha": previo["fecha"] if previo else fecha,
        "plan": plan.referencia(),
        "plan_beneficios": {**pb.referencia(), "archivo": _relativa(_ruta(beneficios_ruta))},
        "casos": {
            "archivo": _relativa(lote_ruta),
            "huella": lote["huella"],
            "id": lote["id"],
            "n_lote": lote["n"],
            "semilla": lote["semilla"],
        },
        "proveedor": proveedor,
        "modelo": modelo_nombre,
        "umbrales_aplicados": umbrales,
        "revisor_simulado": plan.contrato["pausas_humanas"][0]["politica_simulada"],
        "sesiones": sesiones,
        "casos_ejecutados": ejecutados,
        "casos_con_error": [c for c in ejecutados if trazas[c]["resultado"] == "error"],
        "ficha": _ficha(variante, proveedor, modelo_nombre, lote),
    }
    escribir_corrida(
        directorio,
        manifiesto=manifiesto,
        grafo=grafo,
        trazas=trazas,
        entorno=None if simulado else _entorno(proveedor),
    )
    return resumen


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Corre un lote del demo A y exporta planlang-trace/v1")
    p.add_argument("--demo", default="a", choices=["a"])
    p.add_argument("--proveedor", default=os.environ.get("PLANLANG_PROVEEDOR", "suscripcion"))
    p.add_argument("--modelo", default=None)
    p.add_argument("--plan", default=PLAN_POR_DEFECTO)
    p.add_argument("--casos", default=CASOS_POR_DEFECTO)
    p.add_argument("--beneficios", default=BENEFICIOS_POR_DEFECTO)
    p.add_argument("--salida", default=SALIDA_POR_DEFECTO)
    p.add_argument("--corrida", default=None)
    p.add_argument("--variante", default="multiagente", choices=VARIANTES)
    p.add_argument("--n", type=int, default=None)
    p.add_argument("--fecha", default=None, help="fecha declarada de la sesión (YYYY-MM-DD)")
    p.add_argument("--pausa-s", type=float, default=0.0)
    p.add_argument("--reloj", default=None, choices=["real", "fijo"])
    a = p.parse_args(argv)
    lote_id = Path(a.casos).stem
    corrida = a.corrida or f"{a.proveedor}-{lote_id}" + ("-base" if a.variante == "agente_unico" else "")
    fecha = a.fecha or dt.date.today().isoformat()
    reloj = a.reloj or ("fijo" if a.proveedor == "simulado" else "real")
    r = ejecutar_lote(
        corrida_id=corrida,
        fecha=fecha,
        proveedor=a.proveedor,
        plan_ruta=a.plan,
        casos_ruta=a.casos,
        beneficios_ruta=a.beneficios,
        salida=a.salida,
        n=a.n,
        variante=a.variante,
        modelo=a.modelo,
        pausa_s=a.pausa_s,
        reloj=reloj,
    )
    print(
        f"corrida {r.corrida_id}: {len(r.ejecutados)} casos en esta sesión"
        f" ({len(r.con_error)} con error) · pendientes {r.pendientes}"
        f" · límites {r.limites_alcanzados}{' · DETENIDA por límite de uso' if r.detenida_por else ''}"
        f" → {_relativa(r.directorio)}"
    )
    return 3 if r.detenida_por else 0


if __name__ == "__main__":
    sys.exit(main())
