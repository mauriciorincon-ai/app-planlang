# agents/ — perfil `--python` del kit-app (v1.30.0)

Carpeta de los agentes de la app cuando el pipeline exige Python (primera app: planlang, LangGraph
1.x). El resto de la app (UI, núcleo determinista, CI web) sigue siendo TypeScript: este perfil se
**combina** con el web o el estático, no los reemplaza.

```bash
cd agents
python3.12 -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/ruff check . && .venv/bin/ruff format --check .
.venv/bin/pytest            # el MISMO comando del job `python` de la CI
```

Reglas:
- **Sin librerías de agentes ni proveedor en el estampado.** LangGraph, LangChain, SDK de modelos y
  sus pines entran por ADR en el sprint que los active (paridad con `ai`/`@ai-sdk` del perfil web).
- **Python 3.12 en CI**; el `pyproject.toml` admite 3.12–3.14 en local, con aviso si no es 3.12.
- **Regla 19 de la constitución:** todo puente Python ↔ TypeScript (un formato de traza, una regla de
  decisión declarada como dato) lleva su **gate de contrato** en el mismo sprint que lo crea.
- **Estándar 7-S (IA de construcción por suscripción):** si el modelo se sirve con la suscripción del
  usuario por un binario oficial en modo no interactivo: sesión propia, token jamás en variables de
  entorno, trazas ni repo; invocación en directorio temporal limpio con MCP vacío (la constitución de
  la app no entra al prompt del agente); lotes fuera de CI, pequeños y espaciados; ADR de cumplimiento
  con re-lectura de la fuente oficial antes de cada release; interruptor a proveedor por clave.
- **Dependabot:** ecosistema `pip` agrupado con límite 1 (máximo dos PRs de dependencias abiertos).
