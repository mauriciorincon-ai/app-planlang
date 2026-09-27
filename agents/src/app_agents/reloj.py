"""Reloj inyectable: el grafo mide latencias con él, nunca con `time` directamente.

`RelojReal` para corridas reales; `RelojFijo` para la corrida simulada de CI (avanza un paso fijo
por lectura), de modo que el exportador produzca los MISMOS bytes en cada ejecución.
"""

from __future__ import annotations

import time
from typing import Protocol


class Reloj(Protocol):
    def ahora_ms(self) -> int: ...


class RelojReal:
    def __init__(self) -> None:
        self._inicio = time.monotonic_ns()

    def ahora_ms(self) -> int:
        return (time.monotonic_ns() - self._inicio) // 1_000_000


class RelojFijo:
    def __init__(self, paso_ms: int = 1) -> None:
        self._t = 0
        self._paso = paso_ms

    def ahora_ms(self) -> int:
        valor = self._t
        self._t += self._paso
        return valor
