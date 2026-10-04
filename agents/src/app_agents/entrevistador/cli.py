"""La entrevista de punta a punta: arranca o retoma el hilo, muestra cada pregunta, lee la respuesta y
escribe el borrador y la transcripción al terminar. La usan la consola (`__main__`) y las pruebas por
igual.
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TextIO

from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

from app_agents.canonico import escribir_bonito, escribir_con_huella
from app_agents.entrevistador.grafo import ContextoEntrevista, construir_entrevista
from app_agents.entrevistador.plantilla import cargar_plantilla, propuestas
from app_agents.entrevistador.respuestas import clasificar
from app_agents.entrevistador.secciones import cargar_esquema_plan
from app_agents.entrevistador.transcripcion import transcripcion
from app_agents.entrevistador.vista import TEXTOS, pantalla_de_pregunta
from app_agents.plan import RAIZ_REPO


@dataclass(frozen=True)
class Demo:
    id: str
    plan_id: str
    dominio: str
    directorio: str

    @property
    def demo_id(self) -> str:
        return f"demo-{self.id}"


DEMOS = {"b": Demo(id="b", plan_id="plan-demo-b", dominio="dom-financiero", directorio="plans/demo-b")}
ARCHIVO_BORRADOR = "v0-borrador.json"
ARCHIVO_TRANSCRIPCION = "transcripcion.json"


class EntrevistaEnCurso(RuntimeError):
    pass


class SinEntrevista(RuntimeError):
    pass


@dataclass
class Resultado:
    terminada: bool
    borrador: dict[str, Any] | None = None
    transcripcion: dict[str, Any] | None = None


class Lector:
    """Las respuestas: de un archivo (`--respuestas`, por pregunta, en orden) o de la consola."""

    def __init__(self, respuestas: dict[str, Any] | None = None, entrada: TextIO | None = None) -> None:
        self._colas = {k: list(v) if isinstance(v, list) else [v] for k, v in (respuestas or {}).items()}
        self._archivo = respuestas is not None
        self._entrada = entrada or sys.stdin

    def leer(self, pregunta_id: str) -> str:
        if self._archivo:
            cola = self._colas.get(pregunta_id) or []
            return str(cola.pop(0)) if cola else "pendiente"
        lineas: list[str] = []
        while True:
            print("> " if not lineas else "  ", end="", flush=True)
            linea = self._entrada.readline()
            if linea == "":  # fin de la entrada: se guarda y se sale
                return "\n".join(lineas) if lineas else "salir"
            if not linea.strip():
                return "\n".join(lineas)
            lineas.append(linea.rstrip("\n"))


def checkpointer_sqlite(ruta: Path, *, nueva: bool) -> Any:
    """El hilo de la entrevista en disco, privado (regla 17-bis: un derivado nace 700/600)."""
    if nueva:
        for sufijo in ("", "-wal", "-shm", "-journal"):
            Path(f"{ruta}{sufijo}").unlink(missing_ok=True)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(ruta.parent, 0o700)
    conexion = sqlite3.connect(ruta, check_same_thread=False)
    os.chmod(ruta, 0o600)
    from langgraph.checkpoint.sqlite import SqliteSaver

    return SqliteSaver(conexion)


def _interrupciones(estado: Any) -> list[Any]:
    return [i for t in getattr(estado, "tasks", ()) or () for i in getattr(t, "interrupts", ()) or ()]


def ejecutar(
    demo: Demo,
    *,
    idioma: str,
    lector: Lector,
    modelo: BaseChatModel | None,
    proveedor: str,
    modelo_nombre: str,
    checkpointer: Any | None = None,
    retomar: bool = False,
    forzadas: list[str] | None = None,
    vocabulario: tuple[str, ...] = (),
    fecha: str,
    raiz: Path = RAIZ_REPO,
    escribir: bool = True,
    salida: Callable[[str], None] = print,
) -> Resultado:
    plantilla = cargar_plantilla(demo.dominio, raiz)
    app = construir_entrevista(checkpointer=checkpointer or InMemorySaver())
    config: Any = {"configurable": {"thread_id": f"entrevista-{demo.demo_id}"}}
    ctx = ContextoEntrevista(
        plan_id=demo.plan_id,
        plantilla=plantilla,
        esquema_plan=cargar_esquema_plan(raiz),
        modelo=modelo,
        vocabulario=vocabulario,
    )
    previo = app.get_state(config)
    if previo.values:
        if not retomar:
            raise EntrevistaEnCurso(demo.id)
        pendientes = _interrupciones(previo)
        if pendientes:
            resultado: Any = {"__interrupt__": pendientes}
        else:
            siguiente = {"pasada": int(previo.values.get("pasada", 1)) + 1, "forzadas": forzadas or []}
            resultado = app.invoke(siguiente, config, context=ctx)
    else:
        if retomar:
            raise SinEntrevista(demo.id)
        inicial = {
            "idioma": idioma,
            "pasada": 1,
            "forzadas": [],
            "secciones": propuestas(plantilla),
            "estados": {q["id"]: "sin_responder" for q in plantilla["preguntas_guia"]},
            "vistas": {},
            "turnos": [],
        }
        resultado = app.invoke(inicial, config, context=ctx)

    t = TEXTOS[idioma]
    while isinstance(resultado, dict) and resultado.get("__interrupt__"):
        payload = resultado["__interrupt__"][0].value
        salida(pantalla_de_pregunta(payload, idioma))
        texto = lector.leer(payload["id"])
        clase = clasificar(texto)
        if clase == "salir":
            salida(t["salida"].format(demo=demo.id))
            return Resultado(terminada=False)
        if clase == "libre" and modelo is not None:
            salida(f"  … {t['redactando']}")
        resultado = app.invoke(Command(resume=texto), config, context=ctx)

    final = app.get_state(config).values
    borrador = final["borrador"]
    registro = transcripcion(
        demo_id=demo.demo_id,
        plan_id=demo.plan_id,
        plantilla=plantilla,
        estado=final,
        fecha=fecha,
        proveedor=proveedor,
        modelo=modelo_nombre,
    )
    if escribir:
        directorio = raiz / demo.directorio
        escribir_bonito(directorio / ARCHIVO_BORRADOR, borrador)
        registro = escribir_con_huella(directorio / ARCHIVO_TRANSCRIPCION, registro)
        salida(
            t["archivos"].format(
                b=f"{demo.directorio}/{ARCHIVO_BORRADOR}", t=f"{demo.directorio}/{ARCHIVO_TRANSCRIPCION}"
            )
        )
    estados = list((final.get("estados") or {}).values())
    salida(
        t["fin"].format(
            r=estados.count("respondida"),
            a=estados.count("aceptada"),
            p=sum(1 for e in estados if e in ("pendiente", "sin_responder")),
            m=registro["llamadas_al_modelo"],
        )
    )
    return Resultado(terminada=True, borrador=borrador, transcripcion=registro)


def leer_respuestas(ruta: str) -> dict[str, Any]:
    datos = json.loads(Path(ruta).read_text(encoding="utf-8"))
    if not isinstance(datos, dict):
        raise ValueError("--respuestas: un objeto {pregunta: respuesta | [respuestas]}")
    return {k: v for k, v in datos.items() if not k.startswith("_")}
