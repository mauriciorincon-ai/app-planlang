# ADR-010 — Del grafo compilado al mapa del diagramador 0.3.0: conversión, geometría y el gate «diagrama = grafo»

**Summary (EN):** The Agent screen's canvas is generated, never drawn: `core/visor` turns the compiled LangGraph
graph of the run the manifest declares, plus the plan's graph contract and the node texts, into a map valid against
the pinned diagrammer 0.3.0 contract (`agentes-ia` grammar 1.1.0), lays it out with the approved mock-up's geometry,
routes edges orthogonally with zero box crossings, and serialises one SVG for both themes. Where the app does not fit
the contract (terminals, function rules, default branches, underscore ids, code sources, the rule glyph) the
conventions below apply and are proposed as amendments. A build-time gate checks that the PUBLISHED page draws
exactly the compiled graph and the plan's rules.

**Estado:** aceptado · **Fecha:** 2026-09-29 · **Sprint:** S2 «La vitrina» (fase 2)
**Cítese por tema:** «ADR de la conversión grafo → mapa».
**Origen:** orden del S2 (fase 2: visor generado desde el grafo compilado, contrato diagramador 0.3.0), regla dura
11 del `CLAUDE.md` («el visual se genera, no se dibuja») y desviación 5 del plan aprobado.

## Contexto

- El contrato del diagramador (reusable de la casa, copia fijada en `packages/diagramador/contrato/` con
  `CONTRATO.lock`) define un **mapa** (bandas, nodos, flujos, condiciones, textos `{ es, en }`) y las reglas del
  dibujo (D1–D14, G1–G15). No trae un conversor: cada app consumidora convierte su fuente.
- La fuente de planlang es doble: el **grafo compilado** que exporta la corrida (`runs/<demo>/<corrida>/grafo.json`:
  `get_graph().to_json()` más las aristas condicionales y las ramas por defecto) y el **contrato de grafo del plan**
  (`nodos_esperados`, `aristas_condicionales` con su tripleta `señal · operador · valor`). El plan es el código de
  la arista (regla dura 2): el dibujo tiene que mostrar las reglas del plan, no solo las aristas de LangGraph.
- La maqueta aprobada en G-Diseño (`docs/diseno/03-agente.html`) se dibujó a mano; el producto debe reproducirla
  generándola (regla 11), con el mismo resultado en Node y en el navegador (regla dura 1: `core/` sin reloj, azar,
  `Intl` ni `node:*`).

## Decisión

1. **Conversión (`core/visor/mapa.ts`).**
   - Nodo del plan presente en el grafo → madurez `implementado`; del plan y ausente del grafo →
     `exigido-por-el-plan` (el dibujo lo marca «exigido»); del grafo y fuera del plan → `implementado` con la
     referencia opaca `planlang:fuera-del-contrato`.
   - Banda por tipo: enrutador → orquestación · modelo y herramienta → agentes · regla → reglas · pausa humana →
     pausa humana. Las franjas transversales no reciben nodos del grafo.
   - **Un flujo por regla del plan** (una arista de LangGraph puede llevar varias: enrutador → redactor lleva dos),
     uno por rama por defecto y uno por arista incondicional (`secuencia`, o `reanudacion` si sale de una pausa
     humana). Los ids de flujo son `<origen>-a-<destino>-r<orden>`, `…-defecto` o `…` a secas.
   - Los textos de líder, experto y «por qué importa» de cada nodo viven en `src/textos/agente.ts` como `{ es, en }`
     y el conversor falla si falta uno: no hay texto por inferencia (G14).
2. **Convenciones donde la app no cabe en el contrato 0.3.0** (se proponen como enmiendas en el summary):
   - **`__start__` y `__end__` son terminales del dibujo, no nodos del mapa** (0.3.0 no tiene tipo terminal):
     círculos con su rótulo, dibujados por el visor. Enmienda: tipo `terminal`.
   - **Regla que es función nombrada** (`texas_y_no_aprobar`): condición `{ senal: "texas-y-no-aprobar", operador:
     "=", valor: true }`. Enmienda: `condicion.funcion` con sus entradas.
   - **Rama por defecto** (el «si no»): condición `{ senal: "rama-por-defecto", operador: "=", valor: true }`.
     Enmienda: `condicion.por_defecto`.
   - **Ids con guion** (`^[a-z0-9]+(-[a-z0-9]+)*$`): `_` → `-` (`verificador_cobertura` → `verificador-cobertura`).
     La conversión es inyectiva mientras ningún id del código traiga guion, y `core/visor/ids.ts` lo comprueba.
   - **Fuentes `https` obligatorias por nodo:** la documentación oficial de LangGraph o LangChain del primitivo que
     usa el nodo (grafo, `interrupt`, salida estructurada). **La ubicación en el código no viaja en el mapa**: la
     exporta `agents/src/app_agents/exportar_grafo.py` a `data/vitrina/demo-a/grafo-codigo.json` (archivo, líneas,
     claves que escribe; prueba de frescura) y la pestaña Código la muestra como `ruta:línea`, sin enlace. Así
     `refs_externas` queda solo para `planlang:fuera-del-contrato`. Enmienda: `fuente.tipo: "codigo"`.
   - **Glifo de `regla` = hexágono**, sellado por el usuario en el design system 1.0.0, frente a `escudo` de la
     gramática (desviación 4).
3. **Geometría de la maqueta, no la de § 5.3** (`core/visor/disposicion.ts`, `geometria.ts`): columna 160 u, paso
   172, nodo 160 × 56, filas cada 140 u, para que el lienzo quepa en 1040 px como el aprobado. Filas por
   «serpiente»: el camino principal (rama por defecto o única secuencia) avanza de izquierda a derecha y abre fila
   nueva cuando vuelve atrás; los nodos fuera del camino van en la fila intermedia. Sin azar ni fuerzas (D3). La
   geometría es igual en los dos idiomas: se mide con el texto más largo de ambos.
4. **Medición sin navegador (G15):** los avances de Inter y JetBrains Mono se leen de los woff2 del repo (con HVAR:
   las dos son variables) a `core/visor/metricas.json`, con prueba de deriva y huella en `CONTRATO.lock`. El ancho
   es la suma de avances sin kerning (cota superior); los nombres largos se parten después de un guion bajo. Piso
   de letra de 12 u (G11; la maqueta usaba 10,5 y 11,5 px).
5. **Ruteo ortogonal (`core/visor/ruteo.ts`):** camino de menor costo sobre una rejilla dispersa de líneas
   candidatas (canales, calles, carriles y puertos); costo = largo + codos + cruces + solapes; dos pasadas (lados,
   luego puertos repartidos en `i/(k+1)` y permutaciones). Ningún tramo atraviesa una caja que no es su origen ni
   su destino (D11), **ni el rótulo de un terminal**; un terminal no se conecta por abajo (`sinLado`), porque ahí
   va su rótulo.
6. **SVG propio (`core/visor/svg.ts`):** orden de atributos fijo, números cuantizados, ids con espacio de nombres
   por lienzo (dos lienzos en una página: el del agente y el del spike), un solo SVG para los dos temas (el color
   sale de clases que leen los tokens), raíz accesible con título y descripción; nodos y líneas con reglas son
   botones enfocables que la vitrina selecciona; el resto es `aria-hidden` y la **lista por capa** es la versión en
   texto (G10). El nodo seleccionado lleva relleno tintado (D14 dice solo borde): lo pide la maqueta aprobada.
7. **Gates.**
   - `core/visor/igualdad.ts` (en pruebas): biyección de nodos, reglas y aristas entre el plan, el mapa y el grafo
     compilado; las ausencias se nombran.
   - `scripts/diagrama-igual-grafo.ts` (`pnpm diagrama:verificar`, job `quality`, después del build): el SVG que
     lleva `out/<idioma>/agente.html` dibuja cada nodo del grafo (sin la marca «exigido»), cada nodo del plan
     ausente del grafo (con ella), una línea por cada arista de LangGraph y un flujo por cada regla y rama por
     defecto. Prueba la página construida, no solo el mapa: un build viejo, un filtro en la vista o un SVG
     cambiado a mano lo ponen en rojo.
   - Golden SVG ES/EN en los proyectos `core` y `core-jsdom`; validación del mapa contra `mapa.schema.json` (Ajv,
     fase 1) y en código (fase 2: V2–V4, V6, V10, V11, V13–V15); guardia de determinismo sobre `core/visor`.
8. **El spike, contra el mismo contrato:** la sección «Antes: el spike» dibuja con el mismo conversor la copia
   fijada del grafo del spike de la F1 (`data/vitrina/demo-a/spike-2026-09-26/`, con huella en el manifiesto) y
   una lectura que lo asigna al contrato; el lector falla si la lectura no cubre el grafo.

## Consecuencias

- El lienzo cambia solo si cambian el grafo compilado de la corrida declarada, el plan, los textos o el código del
  visor; cada uno tiene su huella o su golden, y el gate publicado cierra el último hueco (la página).
- Cinco enmiendas al contrato del diagramador (`terminal`, `condicion.funcion`, `condicion.por_defecto`,
  `fuente.tipo: "codigo"`, glifo de regla) y dos notas (la geometría de la maqueta y el relleno del seleccionado)
  van al summary para la planeadora, que decide y sube la versión (G-Metodo).
- Un id de código con guion rompería la inyectividad: la prueba lo nombra antes de dibujar nada.
- Reemplazar el ruteo propio por una librería de disposición (ELK, dagre) queda descartado mientras el núcleo deba
  dar los mismos bytes en Node y en los tres motores sin `Math` trigonométrico ni coma flotante dependiente del
  motor.
