"""Arnés común de pytest (planlang S1).

- La CI solo conoce el proveedor `simulado`: el binario `claude` jamás se invoca en un job.
- Las pruebas de HUMO REAL (P1, P2, P6 del spike; tamaño de contexto) corren solo en la máquina
  del usuario con `PLANLANG_HUMO_REAL=1`. Son la prueba que exige el estándar 7-S y se corren a
  mano antes de cada lote (regla 6).
"""

from __future__ import annotations

import os

os.environ.setdefault("PLANLANG_PROVEEDOR", "simulado")
