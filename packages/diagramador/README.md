# diagramador (copia fijada del contrato)

Reusable de la casa planeadora. planlang es su segundo consumidor. `contrato/` guarda la **copia fijada** de lo que
consume — `CONTRATO.md` 0.5.0, los esquemas `esquema/{mapa,gramatica}.schema.json` y la gramática
`gramaticas/agentes-ia.json` 1.2.0 — y `CONTRATO.lock` sus huellas SHA-256 (`tests/unit/guardias/contratos-lock.test.ts`
las recalcula en la CI y, con la planeadora en la máquina, compara byte a byte). Se renueva copiando, nunca editando.

El conversor desde el grafo compilado de LangGraph al mapa del contrato vive en `core/visor` (S2), junto con el SVG
propio de la vitrina; este paquete no importa nada de la app.
