"""`python -m app_agents.entrevistador (--demo b | --dominio <id> --plan <id>) [--retomar] [--nueva]
[--respuestas archivo] [--idioma es|en]`

La llama `pnpm entrevistar` (que después corre M1 y las contradicciones del lado TypeScript). El
proveedor sale de PLANLANG_PROVEEDOR (por defecto, la suscripción de Claude Code); `--sin-modelo` corre
la entrevista sin ninguna llamada: las respuestas libres quedan literales y su sección pendiente
(ADR-012).
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from app_agents.adaptador import MODELO_POR_DEFECTO, crear_modelo, proveedor_activo
from app_agents.entrevistador.cli import (
    DEMOS,
    DominioOPlanInvalido,
    EntrevistaEnCurso,
    Lector,
    PlanYaAprobado,
    SinEntrevista,
    checkpointer_sqlite,
    demo_de_dominio,
    ejecutar,
    leer_respuestas,
)
from app_agents.plan import RAIZ_REPO

SALIDA_GUARDADA = 3


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="entrevistar", description="Entrevistador M2: propone el plan de un demo o de un plan real."
    )
    p.add_argument("--demo", choices=sorted(DEMOS), help="un demo de planlang")
    p.add_argument("--dominio", help="un plan real: la plantilla de data/dominios/<id>.json (con --plan)")
    p.add_argument("--plan", help="un plan real: el id del plan, su carpeta es plans/<id>/ (con --dominio)")
    p.add_argument("--idioma", choices=("es", "en"), default="es")
    p.add_argument(
        "--retomar", action="store_true", help="sigue la entrevista guardada (o pregunta lo pendiente)"
    )
    p.add_argument("--nueva", action="store_true", help="borra la entrevista guardada y empieza de cero")
    p.add_argument(
        "--pregunta", action="append", default=[], help="con --retomar: vuelve a hacer esta pregunta"
    )
    p.add_argument("--respuestas", help="archivo JSON {pregunta: respuesta}: entrevista sin consola")
    p.add_argument(
        "--sin-modelo", action="store_true", help="ninguna llamada al modelo: respuestas literales"
    )
    p.add_argument(
        "--vocabulario", default="", help="claves del contexto de condiciones, separadas por comas"
    )
    p.add_argument("--fecha", default=date.today().isoformat())
    p.add_argument(
        "--salida",
        help="carpeta de la entrevista (obligatoria si el plan del demo ya está aprobado: v1.json existe)",
    )
    a = p.parse_args(argv)
    if a.demo and (a.dominio or a.plan):
        p.error("--demo no se combina con --dominio ni con --plan")
    if a.demo:
        demo = DEMOS[a.demo]
    elif a.dominio and a.plan:
        try:
            demo = demo_de_dominio(a.dominio, a.plan)
        except DominioOPlanInvalido as e:
            p.error(str(e))
    else:
        p.error("indica --demo <id> o, para un plan real, --dominio <id> --plan <id>")
    if a.sin_modelo:
        modelo, proveedor, nombre = None, "ninguno", "ninguno"
    else:
        proveedor = proveedor_activo()
        modelo = crear_modelo(proveedor)
        nombre = str(getattr(modelo, "modelo", None) or MODELO_POR_DEFECTO)
    try:
        r = ejecutar(
            demo,
            idioma=a.idioma,
            lector=Lector(leer_respuestas(a.respuestas) if a.respuestas else None),
            modelo=modelo,
            proveedor=proveedor,
            modelo_nombre=nombre,
            checkpointer=checkpointer_sqlite(
                RAIZ_REPO / ".entrevistas" / f"{demo.demo_id}.sqlite", nueva=a.nueva
            ),
            retomar=a.retomar,
            forzadas=a.pregunta,
            vocabulario=tuple(v for v in a.vocabulario.split(",") if v),
            fecha=a.fecha,
            directorio_salida=Path(a.salida).resolve() if a.salida else None,
        )
    except PlanYaAprobado:
        print(
            f"{demo.directorio}/v1.json ya está aprobado: "
            "la entrevista nueva va a la carpeta que indiques con --salida.",
            file=sys.stderr,
        )
        return 2
    except EntrevistaEnCurso:
        print(
            "Ya hay una entrevista guardada: --retomar para seguirla o --nueva para empezar de cero.",
            file=sys.stderr,
        )
        return 2
    except SinEntrevista:
        print("No hay entrevista guardada que retomar: corre sin --retomar.", file=sys.stderr)
        return 2
    return 0 if r.terminada else SALIDA_GUARDADA


if __name__ == "__main__":
    sys.exit(main())
