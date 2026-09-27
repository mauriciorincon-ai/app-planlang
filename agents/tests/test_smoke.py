"""Prueba de humo del perfil --python: el paquete importa y declara versión.

El sprint 1 la reemplaza por pruebas reales (regla del kit: el estampado nace con CI verde y
pruebas de humo; el primer sprint las sustituye).
"""

from app_agents import __version__


def test_version_declarada() -> None:
    assert __version__
