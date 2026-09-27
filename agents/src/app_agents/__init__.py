"""Agentes de la app — perfil `--python` del kit-app (v1.30.0).

Reglas del perfil (estándar 7-S y regla 19 de la constitución):
- Todo puente con el núcleo TypeScript lleva su gate de contrato en el mismo sprint que lo crea.
- Si el proveedor de modelo es una suscripción (binario oficial en modo no interactivo): sesión
  propia, token jamás en variables de entorno, trazas ni repo; invocación en un directorio temporal
  limpio con MCP vacío; lotes fuera de CI; ADR de cumplimiento.
"""

__version__ = "0.1.0"
