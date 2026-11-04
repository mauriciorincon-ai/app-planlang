"""Lo esperado del gate de contrato de los beneficiarios finales (S9, regla 19; ADR-019).

Calcula, con el NODO del agente (`app_agents.demo_b.beneficiarios`), los beneficiarios de cada estructura de
`tests/contrato/beneficiarios-entradas.json` y lo escribe en `tests/contrato/beneficiarios-esperada.json`. El gemelo
de verdad en TS (`core/sintetico/demo-b/beneficiarios.ts`) tiene que dar lo mismo, al bit
(`tests/contrato/beneficiarios.test.ts`); `agents/tests/test_beneficiarios_contrato.py` vigila que lo escrito sea lo
que el nodo calcula hoy.

Uso (desde la raíz del repo): `agents/.venv/bin/python tests/contrato/beneficiarios_agente.py --escribir`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "agents" / "src"))

from app_agents.demo_b.beneficiarios import beneficiarios_de  # noqa: E402

ENTRADAS = RAIZ / "tests" / "contrato" / "beneficiarios-entradas.json"
ESPERADA = RAIZ / "tests" / "contrato" / "beneficiarios-esperada.json"
FORMATO = "planlang-contrato-beneficiarios/v1"


def calcular() -> str:
    entradas = json.loads(ENTRADAS.read_text(encoding="utf-8"))
    casos = [
        {"nombre": c["nombre"], "resultado": beneficiarios_de(c["estructura"])} for c in entradas["casos"]
    ]
    return json.dumps({"casos": casos, "formato": FORMATO}, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


if __name__ == "__main__":
    if "--escribir" in sys.argv:
        ESPERADA.write_text(calcular(), encoding="utf-8")
        print(f"escrito {ESPERADA.relative_to(RAIZ)}")
    else:
        sys.stdout.write(calcular())
