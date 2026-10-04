---
id: contrato-diagramador
titulo: Diagramador — contrato
arquetipo: harness
elemento_tipo: contrato
rigor: completo
capa: producto
version: 0.5.0
fecha: 2026-10-01
estado: aprobado
objetivo: Fijar qué garantiza el motor de diagramas, con qué modelo de datos trabaja, qué vistas produce, con qué reglas dibuja y valida, con qué gramática visual, y cómo lo consume una app
depende_de: [reusables/README.md, "corpus/raw/[APP Bigdata Planeador] - Requerimientos v1.1.md"]
relacionado_con: [reusables/diagramador/REGISTRO-DE-FALLAS.md, reusables/diagramador/CHANGELOG.md, portafolio/big-d/investigacion/spike-diagramador/README.md, portafolio/big-d/investigacion/2026-09-26-tecnica-diagramador.md, portafolio/big-d/sprints/ETAPA-DISENO.md]
tags: [reusables, diagramador, contrato, determinismo, accesibilidad, bilingue]
---

# Diagramador — contrato v0.4.0

> **v0.4.0, cierre del S1 del piloto (2026-10-01, G-Metodo aprobado).** La primera implementación
> (`app-big-d/packages/diagramador/`, 31/31 casos, 30 golden files idénticos en Node + 3 navegadores × 2
> sistemas) y el **primer mapa real** (Fabric: 19 nodos, 19 flujos, 7 pistas en un canal) devolvieron 44
> enmiendas y 13 fallas (F-013 a F-025). Esta versión las absorbe agrupadas: geometría del carril y los
> canales (§ 5.3), **envejecimiento** (§ 4.8, § 5.6), validación (V3, V4, V5, V16, informe en tres listas),
> API (§ 8: `toCard`, `toBlockCards`, vista «bloque», textos y fecha de consulta), marcas (triángulo de
> «por revisar»), y un anexo con el **contrato de la propuesta** (§ 12). Es **MINOR de datos**: ningún mapa
> o gramática 0.3.0 válido deja de serlo, salvo los que tuvieran un paso que se sigue a sí mismo o a uno
> posterior, o un flujo de un nodo hacia sí mismo (siempre fueron defectos). Un campo opcional nuevo:
> `escala_madurez[].etiqueta_corta`. Carnadas: 34 casos (entran P1, P2 y P3 del piloto). El estado del
> reusable pasa a **`piloto`**.
>
> **v0.3.0, G-Diseño del piloto (2026-09-27, G-Metodo aprobado).** La v0.2.0 salió probada del spike y
> de la investigación técnica de la F1. Esta versión absorbe lo que **el G-Diseño de Big-D decidió
> mirando** (`app-big-d/docs/diseno/diagramador-tokens.md`, propuesta de la Etapa de Diseño; retro en
> `portafolio/big-d/sprints/ETAPA-DISENO.md`), lo que **la auditoría F1 fijó** (bilingüe integral) y lo
> que **planlang pidió** como segundo consumidor (condición en los flujos condicionales). **Es MAJOR de
> datos:** invalida los mapas y gramáticas 0.2.0; todos los artefactos del contrato vienen ya convertidos.
>
> **Artefactos del contrato (todos normativos y ya en 0.3.0):**
> - esquemas: [`esquema/`](esquema/) (`gramatica.schema.json`, `mapa.schema.json`);
> - seis gramáticas: [`gramaticas/`](gramaticas/) — `plataformas-datos` (piloto, ES/EN), `agentes-ia`
>   (planlang, ES/EN) y cuatro de prueba de generalidad (solo ES);
> - seis mapas de ejemplo: [`ejemplos/`](ejemplos/) — la Plataforma Ejemplo y el Agente Ejemplo
>   (ficticios, bilingües) y cuatro de prueba;
> - **34 casos de carnada**: [`carnadas/`](carnadas/) con `esperado.json` (21 errores de mapa, 5 de
>   gramática, 3 de aceptación, 3 del piloto —P1 mapa denso que se dibuja sin avisos; P2 y P3 de V5— y 2
>   mapas reales; C03, C06 y C07 declaran sus `secundarios` legítimos).
>
> **Cómo se generaron:** `portafolio/big-d/investigacion/spike-diagramador/scripts/convertir-0.3.0.mjs`
> (script de la planeadora; valida todo con Ajv 2020 contra los esquemas de aquí; P1 se copia del paquete
> piloto). Nada se editó a mano.

## 0. Qué es y qué no es

**Es** un motor que recibe un **mapa** (datos aprobados) y la **gramática** a la que ese mapa pertenece, y
produce, **por cada idioma declarado**:
- la **geometría** de cada vista (idéntica en todos los idiomas, § 5.3);
- el **SVG** de esa geometría;
- la **versión en texto** equivalente;
- la **comparación lado a lado** de varios mapas de la misma gramática;
- las **diferencias** entre dos versiones de un mapa;
- el **informe de validación**.

**No es** un editor visual ni una herramienta de dibujo libre. Tampoco decide el contenido: el contenido
lo propone quien investiga y lo aprueba un humano. El motor no guarda nada, no lee archivos, no consulta
la red ni conoce ningún dominio.

**Principio rector:** *el visual se genera, no se dibuja.* Ningún diagrama se edita a mano; si el dibujo
está mal, se corrige el dato o la regla, nunca el SVG.

## 1. Vocabulario

| Término | Qué es |
|---|---|
| **Gramática** | Reglas de un dominio: idiomas, bandas, tipos de nodo, modos de flujo, escala de madurez, umbrales de vigencia, límites y términos a explicar. Es un dato versionado. Los mapas de una misma gramática son comparables por construcción |
| **Idiomas** | Los que la gramática declara (`idiomas`, con un `idioma_base`). Todo texto que se dibuja o se lee es un **mapa de idioma** `{ "es": "…", "en": "…" }` con exactamente esos idiomas (G7, V14). Regla de la casa: toda app es ES/EN desde el primer sprint (estándares 6-B) |
| **Banda** | Franja espacial del diagrama. Tres clases: **capa** (columna de la pila ordenada sobre el eje del flujo; ej. Ingesta), **carril** (un actor en un proceso; ej. Admisiones) y **transversal** (franja bajo las capas, que las abarca todas; ej. Gobierno y seguridad). Una gramática v0.x no mezcla capas y carriles (G4) |
| **Tipo de nodo** | Categoría que marca un nodo (en el piloto, la capacidad). Siempre lleva token de color + glifo + etiqueta corta |
| **Bloque** | Agrupación para la visión general, **anclada en una banda**. Es opcional por nodo: una banda sin bloque muestra «N componentes» (F-005) |
| **Nodo** | Una pieza de la arquitectura o un paso de un proceso |
| **Flujo** | Conexión dirigida entre dos nodos: qué viaja, de qué modo y, si el modo lo exige, bajo qué **condición** (señal · operador · valor). Se permiten los flujos dentro de una banda y hacia atrás |
| **Flujo agregado** | Dato calculado para el nivel 1: una conexión por cada par ordenado de bloques, con la lista de modos que la componen (en el orden de la gramática) y cuántos flujos resume |
| **Referencia de franja** | Forma en que se representa, en los niveles 1 y 2, un flujo que toca una banda transversal: no una línea, sino un texto dentro de la franja alineado bajo la columna con la que conecta (flecha de sentido + marcadores de modo + nombre del elemento). Ver § 4.1 y D15 |
| **Recorrido** | Grafo de **pasos** sobre nodos del mismo mapa. Cada paso sigue a uno anterior (`sigue_de`); dos pasos que siguen al mismo forman una **bifurcación** `paralela` o `alternativa` |
| **Glosario** | Términos explicados para todo el mapa, por idioma; se suma a los `terminos` de cada nodo (F-001) |
| **Mapa** | Contenido de un **sujeto** (una plataforma, una app, un sistema de agentes, un proceso) bajo una gramática |
| **Registro** | Cada una de las dos voces con que se explica un nodo: **líder** (lenguaje llano) y **experto** (detalle riguroso) |
| **Geometría** | Resultado puro de la disposición: cajas de bandas y nodos, trazados de flujos, posición de etiquetas y referencias. Se prueba sin mirar el SVG y **no depende del idioma** |
| **Manifiesto** | Archivo junto al SVG con las versiones del motor, el contrato, la gramática, el idioma y las métricas de texto. El SVG no lleva sellos de versión |
| **Tabla de métricas** | Avances (y kerning, cuando exista) de la fuente de licencia abierta con la que el motor mide el texto (G15). **Una tabla por fuente** (0.5.0): el piloto mide con Space Grotesk y JetBrains Mono; planlang, con Inter y JetBrains Mono. El consumidor declara en `options.fuente_metricas` cuál usa y su `CONTRATO.lock` fija la huella de ESA tabla |
| **Cobertura** | Conjunto de puntos de código que la tabla de métricas cubre. Todo carácter de todo texto debe estar en ella (V15) |

## 2. Garantías

Cada garantía dice cómo se verifica; ninguna se da por cumplida sin su prueba. La columna «Evidencia» dice
lo que ya se midió (spike F1 en Node + 3 navegadores, macOS; referencia de la Etapa de Diseño en Chromium).

| # | Garantía | Cómo se verifica | Evidencia |
|---|---|---|---|
| **G1** | **Determinismo.** El mismo mapa, con la misma gramática, el mismo idioma, las mismas versiones y las mismas opciones, produce el mismo SVG byte a byte. La **referencia** se genera en el build (Node) y el mismo render debe salir idéntico en Chromium, Firefox y WebKit. Serialización canónica: UTF-8 sin BOM, LF, un salto final, orden de atributos fijo por tipo de elemento, números desde enteros cuantizados con `-0` normalizado, sin fechas ni versiones dentro del SVG | *Golden files* por hash, en 3 corridas × Node + 3 navegadores × 2 sistemas operativos (macOS y Linux en CI), **por idioma** | ✓ spike 55/55 (macOS) · ✓ **piloto S1: 30 golden files idénticos en Node, Chromium, Firefox y WebKit, macOS y Linux** (job `diagramador`) |
| **G2** | **Sin reloj, sin azar, sin funciones inexactas.** La fecha de consulta es una **entrada**. Un lint prohíbe en el paquete: `Date.now`, `new Date()` sin argumento, `Math.random`, `performance.now`, `crypto.getRandomValues`, `Math.sin/cos/tan/asin/acos/atan/atan2/exp/expm1/log*/pow/cbrt/hypot/sinh/cosh/tanh`, el operador `**`, `localeCompare`, `Intl.*`, `toLocaleString`, las API de medición del DOM (`getBBox`, `getComputedTextLength`, `measureText`) y cualquier formato de número fuera de la función canónica | Lint en CI con su carnada: un archivo con `Math.cos` debe hacerlo fallar | ✓ el spike respetó la regla a propósito; lint pendiente del piloto |
| **G3** | **Neutralidad de dominio.** El motor no contiene ningún nombre de dominio, plataforma o producto | Lint que busca en el paquete los nombres de todas las gramáticas y mapas registrados: cero coincidencias | pendiente del piloto |
| **G4** | **Gramática cerrada.** Un mapa no declara bandas, tipos ni modos: los toma de su gramática. Una «capa inventada» es imposible por esquema | Carnada C03 | ✓ |
| **G5** | **Mapas comparables.** La posición de cada banda sobre el eje del flujo sale **solo** de la gramática; en el nivel 1 la altura de cada fila también. Dos mapas de la misma gramática ponen cada capa en la misma columna y cada franja en la misma fila, y el lado a lado alinea sin cálculo adicional. En el nivel 2 la alineación es **por banda** (la fila crece con el mapa más denso, las columnas no se mueven) | Prueba: tres mapas de una gramática con coordenadas de banda idénticas; `compare` con un nivel por banda sin desplazar columnas | ✓ rejilla · ✗ ELK (3 capas se desplazan) · ✗ dagre (desordena las capas) |
| **G6** | **Localidad del cambio.** (a) Cambiar un atributo de un nodo (que no sea `banda_id`, `orden` ni `bloque_id`) cambia solo los elementos de ese nodo. (b) Agregar, quitar o reordenar un nodo cambia solo los nodos de su banda con posición igual o posterior, los flujos que los tocan y los flujos cuyo trazado atravesaría su caja. (c) Agregar o quitar un flujo cambia ese flujo, la etiqueta del flujo agregado al que pertenece **y los flujos que comparten con él un extremo, un canal o una fila de referencias** (los puertos se reparten `y + alto × i / (k + 1)`, D-S1-25). (d) Nada más cambia, salvo el tamaño del lienzo y la descripción del documento. Convención de datos: `orden` espaciado (10, 20, 30…) para insertar sin correr a los demás | Prueba de propiedades (fast-check): mapas válidos + una edición aleatoria; los ids cambiados deben estar dentro del conjunto permitido | ✓ rejilla (6 cambios, 0 fuera) · ✗ ELK (42 cambios, 31 fuera) |
| **G7** | **El color nunca va solo** (el usuario tiene daltonismo leve): tipo = matiz + glifo + etiqueta; modo de flujo = estilo de línea + marcador; semáforo = marca dibujada + texto + días (sin matiz: peso y relleno de la tinta); madurez = medidor + palabra. **El texto va siempre en tinta**, nunca sobre un relleno tintado (D14) | Capturas en escala de grises y con deuteranopía, protanopía, tritanopía y acromatopsia (severidad 0,6 y 1,0); la información debe sobrevivir. Paleta medida contra el umbral de § 5.2 | ✓ referencia medida bajo las 7 vistas |
| **G8** | **Dos registros por nodo.** El de líder omite detalle pero jamás contradice al de experto | V3 (existencia) + gate ⭐ humano (no contradicción) | — |
| **G9** | **Tres niveles de lectura** sobre el mismo mapa: visión general, componentes y recorrido (§ 4) | Pruebas por vista | ✓ las tres vistas |
| **G10** | **Texto equivalente.** Cada diagrama tiene una versión en HTML (`<ol>` anidada banda → bloque → nodo → flujos; referencias de franja incluidas; recorridos como lista ordenada con sus ramas), **enlazada desde la raíz del SVG**, y cada vista lleva un enlace **«Saltar el diagrama»** a esa lectura | Prueba: todo nodo, flujo y referencia del SVG aparece en el texto y al revés, en cada idioma | ✓ 5/5 mapas |
| **G11** | **Legible a 380 px con una sola disposición.** Hay **una** disposición determinista, horizontal, **a escala 1** en cualquier ancho: la letra mínima mide 12 px en pantalla siempre y **jamás se escala por debajo**. Si el lienzo no cabe en su contenedor, **el lienzo se desliza de lado** dentro de un contenedor propio con índice de bandas, sombras de borde y pista escrita; **la página jamás desborda**. **Ningún texto sale del lienzo ni queda encima de una caja que no es la suya** (F-002, F-004), **a cualquier edad del mapa** (§ 5.6: matriz de envejecimiento, F-017). *(La disposición angosta de la v0.2.0 se retiró: F-007.)* | e2e a 380 px: `scrollWidth ≤ clientWidth` de la página + desplazamiento propio del contenedor + medición de cada texto con `getBBox` en la prueba (nunca en el motor), en los dos idiomas y los tres navegadores | ✓ referencia: 0 desbordes de página, 0 textos fuera, 0 textos encima (Chromium, 2 idiomas × 2 temas × 2 anchos × 5 estados) |
| **G12** | **Movimiento opcional.** El recorrido se lee paso a paso sin animación. La animación vive en una hoja CSS aparte cargada con `media="(prefers-reduced-motion: no-preference)"`; el controlador solo cambia un atributo del contenedor; el SVG no cambia y el árbol del DOM no depende de la preferencia | e2e con `reducedMotion: "reduce"`: `document.getAnimations()` vacío en todos los pasos y el hash del SVG sin cambios | ✓ referencia |
| **G13** | **Un solo SVG para los dos temas.** Los colores se referencian por variable CSS; los valores por tema viven en una hoja aparte. Contraste: trazos y glifos ≥ 3:1 sobre el lienzo y sobre la tarjeta, texto ≥ 4,5:1 frente a su fondo real, también en colores forzados | Prueba propia de contraste de tokens (axe no mide texto SVG) + axe en los dos temas | ✓ referencia (piloto: tinta sobre tarjeta 13,6:1 y 17,3:1) |
| **G14** | **Sin dato válido no hay dibujo.** Un mapa que no pasa la validación falla al cargar con la regla, el campo y el id que fallaron, y nunca se completa por inferencia | Carnadas (§ 6) | ✓ 24/24 en 0.2.0; 31 casos en 0.3.0 |
| **G15** | **Las métricas de texto son un dato.** Los anchos salen de una tabla de avances (y kerning, cuando exista) de una fuente de licencia abierta, versionada en el paquete y con huella en `CONTRATO.lock`; el sitio sirve esa misma fuente. **0.5.0: el paquete puede traer una tabla por fuente** (Space Grotesk para el piloto, Inter para planlang) y el consumidor declara cuál usa en `options.fuente_metricas`; la geometría de un mapa es determinista POR tabla. Jamás se mide el texto en el navegador para disponer. **Todo carácter de todo texto está en la cobertura de la tabla (V15):** un carácter fuera cae a la fuente del sistema, cambia de ancho entre navegadores y rompe G1 (F-006). **El consumidor dibuja el texto con `text-rendering: geometricPrecision`** (sin él, Chromium/Linux redondea a píxel entero y el texto excede la tabla: F-013) | Diferencia máxima tabla vs. navegador en 3 motores × 2 sistemas, con textos de todos los idiomas declarados (tildes, «ñ», «¿»); margen de seguridad fijado; carnada C19 | ✓ **piloto: la tabla sin kerning + 3 % es cota superior en 3 motores × 2 sistemas (el más ajustado, 97,1 %)** (P12 respondida) |

## 3. Modelo de datos

**Normativo:** los JSON Schema 2020-12 de [`esquema/`](esquema/): `gramatica.schema.json` y
`mapa.schema.json`. Están escritos a mano y son portables: sin palabras clave propias de Ajv, con
`pattern` en lugar de `format` y `anyOf` en lugar de tipos unión. El esquema valida la forma. Las
referencias entre documentos y dentro del mapa se validan en código (§ 6). Lo que sigue es el resumen.

### 3.0 Mapas de idioma (nuevo en 0.3.0)
- **Todo texto que se dibuja o se lee es un mapa de idioma** `{ "es": "…", "en": "…" }`. Aplica a nombres,
  preguntas, etiquetas cortas, descripciones de modo, nombres de madurez, registros, títulos de fuente,
  `que_viaja`, `que_pasa`, títulos de recorrido y nombres anteriores.
- Los **diccionarios** (`terminos` del nodo, `glosario` del mapa, `terminos_a_explicar` de la gramática)
  van **por idioma**: `{ "es": { término: explicación }, "en": { term: explanation } }` y
  `{ "es": [términos], "en": [terms] }`.
- La gramática declara `idiomas` e `idioma_base`. **G7:** el base está en la lista y todo texto de la
  gramática trae exactamente esos idiomas. **V14:** todo texto del mapa también. Un mapa por idioma
  duplicaría ids, flujos y recorridos y rompería el cálculo de diferencias: por eso el idioma vive
  dentro del dato.
- Lo que **no** es mapa de idioma: `descripcion` de la gramática (nota de mantenimiento, no se dibuja),
  `refs_externas` (opacas) y las URL.
- El motor recibe el idioma en `options` y emite un SVG por idioma con `lang` en la raíz y su
  `<title>`; la **geometría es la misma** en todos (§ 5.3).

### 3.1 Gramática
`id` · `version` · `nombre` · `idiomas` · `idioma_base`. Además:
- `bandas`: cada una con `id`, `nombre`, `clase`, `orden` (único dentro de su clase) y `pregunta_lider`.
- `tipos_de_nodo`: cada uno con `token_color`, `glifo` (§ 5.4) y `etiqueta_corta` (≤ 4 caracteres por idioma).
- `modos_de_flujo`: cada uno con `estilo_linea`, `marcador` (§ 5.4), `descripcion` y, opcional,
  `exige_condicion` (V13).
- `escala_madurez`: cada nivel con `nivel` (entero de −1 a 4, único; se dibuja como medidor, D13), `disponible` y, opcional, `etiqueta_corta` por idioma (0.4.0: el nombre largo no cabe en bloques ni nodos; si falta, el motor usa el nombre).
- `vigencia`: `umbral_revisar_dias` y `umbral_vencido_dias`.
- `recorrido_referencia`: `desde_bandas`, `hasta_bandas` y `llegadas` (`todas` · `alguna`).
- `limites`: `bloques_min`, `bloques_max`, `frases_lider_max` y **`nodos_por_banda_max`** (V11; 6 en el piloto).
- `terminos_a_explicar`, por idioma.

### 3.2 Mapa
- Identificación: `gramatica_id` + `gramatica_version`, `sujeto_id` + `sujeto_nombre`, `version`.
- Estado: `fecha_actualizacion` y `estado` (el motor solo lee el estado; no aprueba).
- Contenido: `bloques`, `nodos`, `flujos`, `recorridos`, `glosario` (por idioma) y `refs_externas`
  (opacos para el motor).

### 3.3 Nodo
- Ubicación: `banda_id`, `tipo_id`, `bloque_id` (opcional) y `orden`.
- **`papel`** (opcional, 0.5.0 — planlang ADR-010): `inicio` · `fin`. Marca los nodos terminales de un grafo
  (`__start__` / `__end__` de un agente) para que el motor dibuje el marcador de entrada o salida junto a la
  tarjeta; no es un tipo de la gramática y no cambia la geometría de la banda. Antes, los terminales se dibujaban
  fuera del mapa, sin dato.
- Nombre: `nombre` y `nombres_anteriores`.
- Registros: `lider` (máx. `frases_lider_max` frases en cada idioma), `experto`, `por_que_importa` y
  `terminos` (por idioma).
- Estado y evidencia: `madurez`, `fuentes` (al menos una; título por idioma, fecha y tipo; con `url` `https` si
  el tipo es `oficial` o `tercero`, o **`ruta` + `lineas` del repositorio si el tipo es `codigo`** — 0.5.0,
  planlang: un nodo de un agente cita el archivo y las líneas que lo implementan sin una URL pública; el motor lo
  escribe como `ruta:lineas`, nunca como enlace), `fecha_verificacion` y `refs_externas`.

### 3.4 Flujo
`origen` · `destino` · `modo_id` · `que_viaja` · `lider` · **`condicion`** (opcional; **obligatoria si el modo
declara `exige_condicion`**, V13). Tres formas (0.5.0, planlang ADR-010; antes solo la primera):
- `{ senal, operador, valor }` con `operador` ∈ `< <= = != >= >` — la tripleta del plan;
- `{ funcion, entradas: [señal…] }` — una **función nombrada** del plan (`texas_y_no_aprobar`) con las señales que
  lee; el motor la dibuja como etiqueta `f(entradas)` y no la evalúa;
- `{ por_defecto: true }` — la **rama «si no»** de un enrutador; a lo sumo una por nodo de origen (V17).
Pedido de planlang: en el grafo de un agente, una arista condicional sin su señal es un dato incompleto; y una
condición que no cabe en la tripleta tampoco se disfraza de señal (`senal: "rama-por-defecto"`).

### 3.5 Recorrido
`titulo` y `pasos`. Cada paso tiene:
- `nodo_id`;
- `sigue_de`: si falta, es el paso anterior de la lista;
- `bifurca`: `paralela` o `alternativa`, obligatorio si del paso salen dos o más (V12);
- `que_pasa`, `lider` y `experto`.

Un nodo puede aparecer en varios pasos (ida y vuelta). **Un paso solo puede seguir a uno que está ANTES en la
lista, y nunca a sí mismo** (V5, F-018). La numeración de las ramas (6a, 6b) la deriva el motor.

### 3.6 Correspondencia con el piloto

| Requerimientos v1.1 | Contrato | Qué se queda en la app |
|---|---|---|
| Capa del atlas (6.12) | Banda `capa` o `transversal`. **Desviación declarada de § 10.6 (P9):** Orquestación es transversal en `plataformas-datos` | la asociación capa → capacidades del comparador |
| Componente (6.13) | Nodo (tipo = capacidad, más dos tipos sin capacidad: `tipo-externo` y `tipo-operacion`) | `evidencias_relacionadas`, como `refs_externas` |
| Flujo (6.14) | Flujo | — |
| Recorrido de un dato (6.15) | Recorrido con bifurcación paralela (tablero **y** agente) | — |
| Mapa de arquitectura (6.16) | Mapa | aprobación, `informe_investigacion`; `cambios_respecto_anterior` lo **calcula** el motor (§ 4.7) |
| Informe de investigación (6.17), evidencias, puntajes, casos, decisiones | — | todo: es el comparador, no el diagramador |

### 3.7 Idiomas — resuelto
Auditoría F1 (2026-09-26): bilingüe integral. Implementado en 0.3.0 como § 3.0. Las pruebas de texto
(G10, G11, G15) corren en todos los idiomas declarados.

## 4. Vistas

### 4.1 Nivel 1 — visión general (líder)
- Muestra las capas como columnas en su orden, cada una con su número, su nombre y su pregunta, y los
  bloques en lugar de los nodos; las franjas transversales van **abajo, a todo lo ancho**, con su
  cabecera a la izquierda (D1).
- Un bloque muestra el glifo de su tipo, su nombre y «N componentes»; si la banda tiene un solo
  componente, su nombre. Una banda sin bloque muestra «N componentes» en una caja sin nombre.
- Las conexiones entre bloques de **capas** son **flujos agregados**: **una línea por par ordenado de
  bloques** con una **etiqueta de modos** (píldora con los marcadores de sus modos en el orden de la
  gramática; con un solo modo la línea lleva su trazo, con varios es un haz sólido). Todo flujo lleva
  su etiqueta, también el de un solo modo (G7). Decisión P4 del G-Diseño; la alternativa «una línea
  por modo» queda como opción del renderizador, no del dato.
- Los flujos que tocan una **franja** no se dibujan como líneas: se escriben como **referencias de
  franja** (D15), cada una bajo la columna de la capa con la que conectan.
- **Cada bloque (y cada banda sin bloque) es activable y abre la vista «bloque»** (§ 4.10): lo que hay
  dentro, con la misma tarjeta del nivel 2. Pedido del usuario al mirar el primer mapa real.
- Debe entenderse en menos de dos minutos.

### 4.2 Nivel 2 — componentes (experto)
Los nodos de cada banda apilados en su columna, con su tipo (filete + glifo), su madurez (solo si no es
el nivel disponible) y sus fuentes; los flujos entre nodos de capas como líneas con su modo; los
flujos con una franja como **referencias de franja** en la fila del nodo de la franja (D15). En el
recorrido, si un paso toca una franja, su referencia se resalta como cualquier flujo.

### 4.3 Nivel 3 — recorrido
Resalta los pasos y los numera, ramas incluidas (1–5, 6a → 7a, 6b); el nodo que bifurca lleva la marca
de rama dibujada. El avance paso a paso (anterior y siguiente) lo maneja un controlador que cambia un
atributo del contenedor (`data-paso`); el CSS generado del recorrido decide qué nodo es activo,
visitado o pendiente. El panel explica cada paso en los dos registros. La reproducción automática es
opcional y nunca ocurre con movimiento reducido (G12).

### 4.4 Lado a lado (`compare`)
- N mapas de la **misma** gramática, alineados por banda (G5). **N es una constante de la vista que el
  consumidor declara** (tres a la vez en ancho en el piloto, con paginación más allá; una banda a la vez
  con todas las plataformas apiladas en angosto); **jamás un número cableado en el motor**.
- Acepta **el nivel 2 alineado por banda** (no por nodo) y **un nivel por banda en el mismo SVG**: una
  banda desplegada a nivel 2 en todas las plataformas y las demás a nivel 1; la fila desplegada crece
  sin mover las columnas (G5). Decisión del usuario en las miradas 2–4 del G-Diseño.
- Expone los nodos de cada bloque agregado (G10 también aquí).
- Orden de los mapas por `sujeto_id`, el mismo en todos los idiomas.
- Comparar mapas de gramáticas distintas es un error de validación.

### 4.5 Ficha de nodo
Qué es, qué hace, por qué importa, términos (los del nodo más el glosario, en el idioma de la vista),
madurez, fuentes con fecha y fecha de verificación, y la vigencia calculada. **El motor la entrega con `toCard(map, grammar, nodeId, { language, textos, fechaConsulta })`** (§ 8); el panel es de la app.

### 4.6 Versión en texto
HTML equivalente (G10), por idioma. Sirve a lectores de pantalla y como oráculo de las pruebas.

### 4.7 Diferencias entre versiones (`diff`)
Nodos nuevos (+), retirados (−), renombrados (→, por `nombres_anteriores`) y con madurez cambiada (▮),
marcados siempre con glifo dibujado + palabra, y una lista explicativa debajo. **La comparación se hace sobre JSON
canónico (claves ordenadas)**: el orden de las claves no es un cambio (F-023).

### 4.8 Semáforo de vigencia
- **vigente** por debajo del primer umbral; **por revisar** desde el primero; **vencido** desde el segundo.
- Siempre con «N días», calculados con la fecha de consulta como entrada. En el piloto cambia exactamente
  en los días 30 y 60 (✓ medido).
- **Dentro del lienzo se marca la excepción:** lo vigente no lleva insignia; *por revisar* y *vencido*
  llevan la **insignia compacta** (marca dibujada + «N d», píldora montada sobre el borde superior del
  bloque, alineada a la derecha; *por revisar* con contorno, *vencido* con relleno de tinta y texto en
  el color del lienzo). El texto completo («por revisar · 34 días») va en la píldora del mapa, en la
  leyenda y en la lectura en texto. El semáforo **no usa matiz**: sobrevive en grises y en colores forzados.
- **La insignia envejece sin romper nada (F-017):** con «NNN d» la insignia montada **no pasa de la mitad de
  la tarjeta + 4 u**; la vista «bloque» reserva su lugar; una fila de referencias de franja llena abrevia
  nombres con «…» (el nombre entero queda en `aria-label`). La **geometría expone la vigencia** del mapa y de
  cada elemento activable para que la app no repita la regla de los umbrales, y **`toText` recibe la fecha de
  consulta** para escribir «por revisar · N días» también en la lectura.
- **La marca de «por revisar» es un triángulo de precaución con «!»** (pedido del usuario al mirar el atlas
  envejecido, 2026-09-30; § 5.4).

### 4.9 Leyenda
Todo diagrama lleva una leyenda generada de la gramática, con los mismos paths: tipos (glifo + etiqueta +
nombre), modos (trazo + marcador + nombre + descripción), madurez (medidor + nombre) y vigencia (marca +
regla de días), **y la regla del haz** («varios modos en una conexión: línea gruesa y una etiqueta que dice
cuáles, en orden»), que es gramática y no copy de la app. Incluye la nota de marcas (D7).

### 4.10 Vista «bloque» (nuevo en 0.4.0)
`layout(map, grammar, "bloque", { group })` dibuja lo que hay dentro de un elemento activable del nivel 1
(un bloque, o `_<banda>` para los nodos sin bloque) con la **misma tarjeta** que el nivel 2 (de capa, o ficha
compacta de franja) y solo los flujos de adentro; el canal va tras la tarjeta real (152 o 168 u).
`toBlockCards(map, grammar, group, opts)` da una tarjeta de texto por componente con todas sus conexiones,
con `id` para enlazar su lectura. Reserva el lugar de la insignia de vigencia (F-017).

## 5. Gramática visual (nuevo en 0.3.0 — decisiones del G-Diseño)

### 5.1 Codificación de los elementos
- **Nodo y bloque = tarjeta**: fondo de superficie (`sup-2`), borde fino de 1 u en `linea`, **filete
  izquierdo de 4 u en el matiz del tipo**, **glifo del tipo** antes del nombre, **texto siempre en
  tinta** (D14). Sin rellenos tintados por tipo: el contraste del texto no depende del matiz.
- **Foco y selección:** borde de 2 u en tinta principal (el normal es de 1 u); se distingue por grosor y
  tinta, no por color. En colores forzados todo pasa a `Canvas`/`CanvasText` y quedan glifo, trazo,
  marcador y texto.
- **Flujos, etiquetas, insignias y semáforo van en tinta** (tinta secundaria para trazos): los matices se
  reservan a los tipos de nodo.

### 5.2 Paleta: un matiz por tipo y umbral declarado
- El consumidor asigna a cada `token_color` un matiz **propio** (OKLCH; el mismo matiz en los dos temas,
  claridad buscada por tema) y lo declara en su design system. El motor solo referencia el token.
- **Umbral del contrato (medido en el piloto):** ΔE en OKLab del **peor par** de tipos ≥ **0,10** en visión
  normal, ≥ **0,06** en protan/deutan/tritan a severidad 0,6 y ≥ **0,03** en dicromacia (1,0); cada trazo y
  glifo ≥ 3:1 sobre el lienzo y sobre la tarjeta en ambos temas. En acromatopsia no se exige distancia
  por pares: ahí la información la cargan glifo y etiqueta (G7). Los mínimos se escriben como literales
  en el test del consumidor: bajar el umbral y la paleta a la vez pone el gate en rojo.
- **Paleta del piloto (informativa; la fuente de verdad es el generador de Big-D):** azul (250°) ingesta ·
  violeta (295°) almacenamiento · naranja (62°) transformación · rojo (22°) gobierno · verde (148°) consumo ·
  magenta (345°) IA · pizarra (250°, casi neutro) externo · cian (205°) operación. Peor par medido: 0,124
  normal, 0,074 a 0,6, 0,038 en tritan 1,0.

### 5.3 Geometría (dirección «plano», la única disposición)
Unidades de usuario del SVG (u); a escala 1, 1 u = 1 px.

| Constante | Valor |
|---|---|
| Márgenes laterales | 8 u |
| Columna de capa | 152 u; el texto usa todo el ancho |
| Canal entre columnas | 50 u, con guía punteada en su mitad. **Pistas** fijas `[-50, 50, 120, 190, -120, -190]` décimas (centro, derecha, izquierda), **a 6 u de las tarjetas y nunca sobre un borde** (F-015, F-021); con más de 6 pistas, reparto parejo dentro de ±19 u con piso de 4 u (máximo 10; la 11.ª avisa). Aviso `pistas: <flujo> corre a N u del borde de <caja>` por debajo de 5 u (§ 5.6) |
| viewBox (ancho) | `2 × 8 + n × 152 + (n − 1) × 50` (1178 u con 6 capas, 1380 con 7) |
| Cabecera de capa | `4 + 16 (número) + 6 + líneas del nombre × 21 + 6 + líneas de la pregunta × 19 + 18`, con **las líneas máximas entre todos los idiomas declarados** |
| Bloque (nivel 1) | 152 × 104, esquina 6, filete de 4 u, glifo antes del nombre |
| Nodo (nivel 2) | 152 × 84, esquina 6, filete de 4 u, glifo + nombre en 13/700 (≤ 3 líneas), fila inferior con madurez (si no es disponible) y «N fuentes»; apilados a 40 u entre sí |
| Puertos | vecinos: adelante sale por la derecha y entra por la izquierda, atrás al revés, líneas de un par a 22 u alrededor del centro; nivel 2: `k` puertos en un borde en `y + alto × i / (k + 1)`, ordenados por la fila del otro extremo. **Un flujo entre tarjetas vecinas de una columna va directo solo con filas contiguas, sin par de vuelta y con hueco ≥ 300 décimas; si no, por el canal** (F-019) |
| Carril exprés | bajo los bloques/nodos, pistas a 24 y 46 u del borde inferior; **más de 2 saltos → pistas adicionales sin aviso** (el carril crece y las franjas bajan; F-014); la conexión más lejana en la pista baja y con el puerto más a la izquierda; los saltos salen por el borde inferior del nodo más bajo y suben por el canal anterior al destino |
| Franja transversal | a todo lo ancho, bajo las capas; nivel 1: 80 u de alto, filete superior, cabecera de 200 u (primera columna + canal), ficha compacta de 180 × 60; nivel 2: `máx(64, 20 + 44 × k + 8 × (k − 1))` con `k` nodos en fichas de 168 × 44; referencias bajo la columna que tocan; **fila de referencias llena: de 8 u a 4 u entre referencias, corrimiento hacia adentro empujando a las anteriores y nombres abreviados con «…»** (entero en `aria-label`; F-016, F-017) |
| Etiqueta de modos | píldora de 18 u de alto y `6 + 16 × k` de ancho; **con más de 2 marcadores, dos filas (38 × 32 u)** porque 70 u no caben en el canal de 50 (A3, F-016). Lugar: el centro del canal (corrida 4 u hacia el origen) o su pista del carril exprés; **si choca, segundo lugar en el tramo de llegada pegado a la pista; si tampoco está libre, se reporta**. Etiqueta de un salto con saltos no anidados: a la mitad de su propio tramo. Etiqueta de un flujo dentro de una columna: a 2 u de la tarjeta. **Invariante: toda etiqueta a ≤ 30 u de su trazo** (§ 5.6) |
| Insignia de vigencia | píldora de 20 u montada sobre el borde superior del bloque, alineada a la derecha |
| Insignia de paso (recorrido) | 24 u (30 si «6a») en la esquina superior izquierda del nodo; marca de rama a su derecha |
| Carriles (procesos) | filas con cabecera de 200 u y ranuras de 152/50 u por `orden` global del nodo sobre el eje (D-S1-05) |
| Lado a lado | 9 columnas de 118 u a 14 u (viewBox 1190); fila = 26 u de rótulo + bloques de 118 × 64; vista de componentes: columnas de 152 u a 14 u (viewBox 1496), nodos de 152 × 88 a 8 u; la fila mide su celda más alta |
| Piso tipográfico | 12 u; el lienzo se pinta a escala 1 y se desliza (G11) |
| Corte de líneas | nunca dentro de un paréntesis corto («Fabric capacity (F SKU)» no se parte entre «(F» y «SKU)») |
| Tamaños (piloto) | número de capa 12 mono 500 · nombre de capa 17/21 700 · pregunta 14/19 400 · nombre de bloque 16/20 700 · «N componentes» y madurez 13/18 400 · franja 15/19 700 y 13/17 400 · ficha compacta 14/17 700 y 12/16 400 · referencia 13 700 · insignia 12 mono 700 |

**La geometría no depende del idioma:** alturas de cabecera, cortes de caja y umbrales se calculan con
el texto más largo entre los idiomas declarados; los SVG de cada idioma tienen las mismas cajas y
difieren solo en el texto. Así G5 vale también entre idiomas.

### 5.4 Glifos, marcadores y marcas (paths; nunca caracteres)
Todos pintan con `currentColor`; el color lo pone la clase del uso. Glifos en caja de 16 × 16 centrada
en (0, 0); marcadores y marcas en caja de 12.

| Glifo de tipo | Pintura | Path |
|---|---|---|
| `triangulo` | lleno | `M0,-7.5 L7.5,6 L-7.5,6 Z` |
| `cuadrado` | lleno | `M-6.5,-6.5 H6.5 V6.5 H-6.5 Z` |
| `rombo` | lleno | `M0,-8 L8,0 L0,8 L-8,0 Z` |
| `escudo` | lleno | `M0,-7.5 L6.5,-5 V0 C6.5,4 3.5,6.3 0,7.8 C-3.5,6.3 -6.5,4 -6.5,0 V-5 Z` |
| `circulo` | lleno | `M0,-7 A7,7 0 1 1 0,7 A7,7 0 1 1 0,-7 Z` |
| `estrella` | lleno | `M0.0,-8.2 L2.1,-2.8 L7.8,-2.5 L3.3,1.1 L4.8,6.6 L0.0,3.5 L-4.8,6.6 L-3.3,1.1 L-7.8,-2.5 L-2.1,-2.8 Z` |
| `anillo` | trazo 2,6 u | `M0,-6 A6,6 0 1 1 0,6 A6,6 0 1 1 0,-6 Z` |
| `barras` | lleno | `M-7.5,2 H-4 V7.5 H-7.5 Z M-1.75,-2.5 H1.75 V7.5 H-1.75 Z M4,-7.5 H7.5 V7.5 H4 Z` |
| `hexagono` | lleno | `M0,-8 L6.9,-4 L6.9,4 L0,8 L-6.9,4 L-6.9,-4 Z` |

*(0.3.0: salen `hexagono` y `pentagono` —a 12 px se confundían con el círculo, F-009— y entran `escudo` y `barras`. **0.5.0: vuelve `hexagono`** para la gramática `agentes-ia` —«regla»—, sellado en el design system 1.0.0 de planlang: se dibuja a 16 u con etiqueta corta, nunca a 12 solo; cada gramática elige entre `escudo` y `hexagono`.)*

| Modo (estilo de línea) | Trazo | Marcador | Path |
|---|---|---|---|
| `discontinua` | `8 5`, 1,6 u | `cuadros` | `M-5.5,-2.5 H-1.5 V1.5 H-5.5 Z M1.5,-2.5 H5.5 V1.5 H1.5 Z M-5.5,3.5 H5.5` |
| `continua` | sólido, 1,6 u | `onda` | `M-6,0 C-4.5,-4.5 -1.5,-4.5 0,0 S4.5,4.5 6,0` |
| `punteada` | `0.1 5.5`, extremo redondo, 2,8 u | `ida-y-vuelta` | `M-5.5,-2.5 H4 M1.5,-5 L4.5,-2.5 L1.5,0 M5.5,2.5 H-4 M-1.5,0 L-4.5,2.5 L-1.5,5` |
| `doble` | 6,5 u en tinta con 2,5 u de lienzo encima | `enlace` | `M-1.2,-3 H-3.5 A3,3 0 0 0 -3.5,3 H-1.2 M1.2,-3 H3.5 A3,3 0 0 1 3.5,3 H1.2 M-2.5,0 H2.5` |
| haz (varios modos) | sólido 4 u | la etiqueta lista los modos | — |
| — | — | `ninguno` | — |

*(0.3.0: sale `reloj` —dice «a una hora», que es lo que hace *por lotes*— y entra `ida-y-vuelta`: una pregunta y su respuesta.)*
El periodo del patrón cabe al menos 3 veces en el tramo más corto.

| Marca de estado | Path (caja 12) |
|---|---|
| vigente | `M-4.5,0.5 L-1.5,3.5 L4.5,-3.5` |
| por revisar | **triángulo de precaución con «!»** (0.4.0, pedido del usuario): `M0,-6.6 L6.8,5 H-6.8 Z M0,-2.3 V0.8 M0,3.05 V3.15`, contorno con trazo 1,6 u, 14 × 13 u (sale de la caja de 12 y cabe en la insignia de 20); de contorno y en tinta para no leerse como el triángulo lleno de un tipo de nodo. La leyenda dibuja las tres marcas en caja de 16 u |
| vencido | `M-3.8,-3.8 L3.8,3.8 M3.8,-3.8 L-3.8,3.8` |
| envía (referencia →) | `M-5,0 H4 M1,-3.5 L4.5,0 L1,3.5` (flecha horizontal; la 0.3.0 decía ↑ y dibujaba →, D-S1-19) |
| recibe (referencia ←) | `M5,0 H-4 M-1,-3.5 L-4.5,0 L-1,3.5` |
| bifurcación | marca de rama dibujada junto a la insignia del paso |

**Madurez = medidor:** rectángulo de 7 × 11 que se llena según `nivel`: −1 vacío y tachado (retirado) ·
0 vacío con contorno discontinuo (anunciado) · 1 un cuarto · 2 la mitad · 3 tres cuartos · 4 lleno.
Siempre con la palabra al lado. Es el reemplazo del `glifo` textual de la 0.2.0 (F-006).

### 5.5 Tipografía (piloto)
Space Grotesk (interfaz y diagrama, variable `wght` 300–700) y JetBrains Mono (huellas, fechas, códigos,
números de capa, insignias), SIL OFL 1.1, subconjunto latino en woff2 con huella SHA-256 y tabla de
avances a 400 y 700 (`unidades_por_em` 1000, ascendente 984, descendente −292, altura de mayúscula 700,
altura de x 486). El subconjunto **excluye a propósito** ✓ ✕ ▶ ⇉ β α; por eso toda marca es un path (D13).
Otro consumidor puede elegir otra fuente de licencia abierta: cambia la tabla, no el contrato.

### 5.6 Avisos de geometría y matriz de envejecimiento (nuevo en 0.4.0)
`layout` devuelve, además de la geometría, una lista de **avisos** con forma fija (`{ vista, tipo, id,
mensaje }`): `D11: <flujo> atraviesa la caja de <caja>` · `pistas: <flujo> corre a N u del borde de <caja>`
(< 5 u) · `fuera-del-lienzo: <elemento>` · `encima: <texto> sobre <caja>` · `etiqueta: <flujo> a N u de su
trazo` (> 30 u) · `bloque-vacio: <bloque>` · `canal: más de 10 pistas` · `carriles: pista fuera del canal`. Un
consumidor que publica aborta ante cualquier aviso. **Matriz de envejecimiento:** todo mapa del contrato y
todo mapa publicado se dibuja en **cuatro edades** (hoy, el día del primer umbral, el día del segundo, +100
días) en todas sus vistas, con 0 avisos y 0 cruces; la app además construye cada atlas en cada fecha en que
alguno de sus nodos cambia de estado. Origen: F-017 (el build se rompía solo 27 días después de pasar en
verde). Patrón: `wiki/patterns/matriz-de-envejecimiento.md`.

## 6. Reglas de dibujo

| # | Regla |
|---|---|
| **D1** | **Orden espacial = orden de la gramática** sobre el eje del flujo, **siempre horizontal**: las capas son columnas de izquierda a derecha, en todo ancho; las transversales son franjas **abajo, a todo lo ancho**, en el orden de su clase, con la cabecera a la izquierda y sus elementos en las ranuras alineadas con las columnas. No existe disposición angosta ni transposición (P5, decisión del usuario; F-007) |
| **D2** | **Colocación local por banda.** La geometría de las bandas sale de la gramática. Los nodos tienen altura uniforme: un cambio de texto nunca desplaza a otros. Toda banda reserva un encabezado de altura fija para el nombre y la pregunta, también las franjas (F-004). Las franjas ocupan una posición que no depende del contenido de las capas |
| **D3** | **Orden estable dentro de la banda:** primero `orden`, después `id`, comparado por unidades de código (nunca `localeCompare`). Queda excluida toda disposición por simulación de fuerzas |
| **D4** | **Ruteo ortogonal por canales:** los flujos van por canales entre columnas y por el carril exprés, con pistas fijas por nodo (§ 5.3). Un flujo hacia atrás entre columnas contiguas sale por la izquierda del origen y entra por la derecha del destino por el canal que comparten. La calidad del trazado sobre los mapas reales se juzga en el piloto (D11 como gate); elkjs (ruteo ortogonal sobre posiciones fijas) es el plan B si la calidad no alcanza |
| **D5** | **Matiz por tipo desde la gramática**, referenciado por variable CSS, bajo el umbral de § 5.2 en los dos temas. El glifo y la etiqueta están siempre; el texto nunca va sobre el matiz |
| **D6** | **Texto completo siempre disponible:** si una etiqueta se abrevia en el dibujo, el texto entero está en la ficha y en la versión en texto. Piso de 12 px |
| **D7** | **Sin logos ni íconos de fabricantes**, aunque sus guías los permitan. Los nombres comerciales van exactos, sin alterar y nunca más destacados que las demás etiquetas. No se usan colores de marca. La nota de marcas se genera en la leyenda. Todo se redibuja; nada se copia |
| **D8** | **Serializador propio:** ids derivados del modelo, orden de atributos fijo, números cuantizados. **Sin SVGO** ni formateadores sobre la salida, porque borran ids y roles. Las versiones van en el manifiesto, no en el SVG. **Los ids de `<defs>` (glifos, marcadores, patrones) llevan un espacio de nombres por SVG:** una página con varios lienzos no repite ids (F-010) |
| **D9** | **SVG accesible:** raíz `graphics-document document` con `<title>` y `<desc>` en el idioma del SVG (nunca `role="img"`); banda `group` con nombre y pregunta; nodo y bloque `graphics-symbol img` enfocables, con nombre, frase y componentes, en el orden de tabulación de la versión en texto; flujos y etiquetas `aria-hidden` (su contenido está en el texto) |
| **D10** | **Nada de dibujo manual:** ni ajustes de coordenadas a mano ni excepciones por sujeto. Si un mapa «se ve mal», se corrige la regla o el dato y se agrega una carnada o una prueba |
| **D11** | **Ningún tramo de un flujo atraviesa la caja de un nodo que no es su origen ni su destino** (F-003). Prueba geométrica sobre la geometría: cruces = 0, **y `layout` lo reporta como aviso** (`D11: …`, F-020) para que el consumidor también lo vea. Medido 0 en la referencia del G-Diseño y en los 7 mapas del piloto a 4 edades |
| **D12** | **Propiedad de cada elemento:** todo elemento del SVG lleva un `id` derivado del modelo, un `data-dueno` con el id del nodo, la banda o el flujo al que pertenece, **o el de su grupo** (D-S1-20). En el lado a lado, los ids llevan un prefijo por mapa. Se prohíbe cualquier hash de contenido global; esto hace posible la prueba de G6 |
| **D13** | **Toda marca es un path** (§ 5.4): símbolos de estado, marcadores, flechas de referencia, medidor de madurez, marca de rama. Ningún carácter fuera de la cobertura de la fuente entra al SVG (V15); ninguna marca se escribe como texto (F-006) |
| **D14** | **Tarjeta + filete + glifo, texto en tinta** (§ 5.1). Sin rellenos tintados por tipo; el matiz vive en el filete y el glifo (F-011) |
| **D15** | **Los flujos con una franja son referencias, no líneas**, en los niveles 1 y 2: texto dentro de la franja, bajo la columna del elemento de capa con el que conectan, con flecha de sentido dibujada, marcadores de modo y nombre del elemento; los niveles siguientes las resaltan como cualquier flujo y la lectura en texto las repite (F-008) |

## 7. Validación

Corre en dos fases. La fase 2 solo corre si pasa la fase 1.
1. **Esquema:** forma de los datos.
2. **Reglas en código:** referencias contra la gramática y dentro del mapa, idiomas, densidad,
   condiciones y cobertura.

`validate(map, grammar, { mode, coverage? })` y **`validateGrammar(grammar)`** (0.4.0): `coverage` es la
cobertura de la tabla de métricas (conjunto de puntos de código); si no se entrega, V15 no corre y el informe
lo declara como aviso.

**Informe de validación**, siempre con la misma forma (0.4.0: **tres listas**):
- `errores` (rechazan), `alertas` (V9, V10: no rechazan) y `avisos` (lo que no corrió, p. ej. V15 sin cobertura);
- cada entrada: `{ doc, fase, regla, ruta (JSON Pointer), id, idioma?, mensaje }`;
- ordenado por `(doc, ruta, regla)`;
- **los errores de esquema (fase 1) se traducen a regla e id** con una tabla fija del paquete (`required` de
  un nodo → V3 con el id del nodo; `pattern` de `url` → V3; `minItems` de `fuentes` → V3; `enum` de
  `estado` → V8; lo demás → V1 con la ruta), para que la fase 1 hable el mismo idioma que la 2.

**Gramática**

| # | Regla |
|---|---|
| G1 | Versión de contrato compatible |
| G2 | Ids únicos en bandas, tipos, modos y madurez; `nivel` único en la escala de madurez |
| G3 | `orden` único dentro de cada clase de banda |
| G4 | No mezclar capas y carriles (v0.x) |
| G5 | Las bandas del recorrido de referencia existen |
| G6 | Umbrales crecientes, `bloques_min ≤ bloques_max`, al menos un nivel de madurez disponible |
| **G7** | `idioma_base` está en `idiomas`; todo mapa de idioma y todo diccionario de la gramática trae exactamente los idiomas declarados |

**Mapa**

| # | Regla |
|---|---|
| V1 | Gramática y versiones compatibles (contrato y gramática por versión menor) |
| V2 | Toda banda, tipo, modo y madurez referidos existen en la gramática |
| V3 | Nodo completo: los dos registros, por qué importa, madurez, al menos una fuente `https` completa y fecha de verificación; su bloque existe y está anclado en su misma banda. *(alerta, 0.4.0)* un bloque sin componentes (F-022) |
| V4 | Todo flujo conecta nodos existentes del mapa **y distintos entre sí** (un flujo de un nodo hacia sí mismo es error, F-024) |
| V5 | El recorrido empieza en `desde_bandas`; cada rama termina en `hasta_bandas` (todas o alguna, según `llegadas`); dos pasos consecutivos están unidos por un flujo declarado; **todo `sigue_de` apunta a un paso que está ANTES en la lista y nunca al propio** (F-018; `numerarPasos` lanza ante un ciclo) |
| V6 | Ids únicos por colección (nodos, flujos, bloques y pasos son listas, nunca objetos con claves) |
| V7 | Número de bloques entre `bloques_min` y `bloques_max` |
| V8 | En modo publicación solo se acepta un mapa `aprobada` |
| V9 | *(alerta)* término a explicar sin explicación (en el nodo o en el glosario), **por idioma** sobre los textos de líder |
| V10 | *(alerta)* texto de líder con más frases que el límite, en cualquier idioma |
| **V11** | Ningún banda tiene más nodos que `nodos_por_banda_max` (P10) |
| V12 | Una bifurcación declara si es `paralela` o `alternativa`, y solo quien bifurca lo declara |
| **V13** | Todo flujo cuyo modo declara `exige_condicion` trae `condicion` (planlang) |
| **V14** | Todo mapa de idioma y todo diccionario del mapa trae exactamente los idiomas de la gramática |
| **V15** | Todo carácter de todo texto está en la cobertura de la tabla de métricas (G15, D13) |
| **V16** | **«El mapa se dibuja» (modo publicación, 0.4.0):** ninguna regla V1–V15 mira si los textos caben; en modo `publicacion` el validador dibuja las vistas del mapa (§ 5.6, a cuatro edades) y **cualquier aviso de geometría es error**. En modo privado, los avisos se informan sin rechazar |

**Carnadas** ([`carnadas/`](carnadas/), con `esperado.json`; cada caso dice regla, id y **fase**)
- **C01–C17:** errores de mapa heredados de la 0.2.0 (convertidos). Incluyen los tres del RF-09.6 (C03,
  C04, C06) y C17 (bifurcación sin tipo). C12 ahora alerta en los dos idiomas.
- **C18–C21 (nuevas):** siete nodos en una banda (V11) · un carácter fuera de la fuente (V15) · un flujo
  condicional sin condición (V13, sobre `agentes-ia`) · un texto sin uno de los idiomas (V14).
- **GC1–GC5:** errores de gramática; GC5 (nueva) idioma base no declarado (G7).
- **A1–A3:** casos límite válidos que **deben aceptarse** (5 y 8 bloques; **un flujo agregado con los
  cuatro modos entre dos bloques**, que además debe dibujarse con la etiqueta completa a 380 px sin
  avisos de geometría).
- **P1–P3 (del piloto, 0.4.0):** **P1 mapa denso** (la forma del primer mapa real con nombres neutrales) **debe aceptarse y dibujarse** con 0 avisos, D11 = 0 y toda etiqueta a ≤ 30 u de su trazo, en nivel 1, 2, recorrido y cada ventana, a cuatro edades; **P2** paso que se sigue a sí mismo y **P3** paso que sigue a uno posterior: exactamente un V5 en su paso.
- **Secundarios legítimos:** C03 reporta además V3 (su bloque quedó anclado en otra banda), C06 además V5 (sin ese flujo nada une los pasos 6 → 7) y C07 además V12 (p5 sigue declarando «paralela» con una rama); `esperado.json` los lista en `secundarios`.
- **Mapas reales:** la Plataforma Ejemplo y el Agente Ejemplo deben aceptarse sin errores ni alertas.

Cada carnada debe fallar **por su regla y con su id**. El resultado se reporta como «detectó *k* de *n*».
**Medido:** 24/24 en el spike (0.2.0); **31/31 en el piloto (0.3.0, S1 de Big-D)** más P1–P3; **34 casos** consistentes con los esquemas 0.4.0 (fase 1 verificada con Ajv al generarlos).

## 8. Cómo lo consume una app

- **Paquete aislado** `packages/diagramador/`, en TypeScript. Corre en Node (build, validación y pruebas)
  y en el navegador (capa interactiva). No importa nada de la app.
- **API** (nombres en inglés), toda de **funciones puras**, sin I/O, sin reloj (la fecha llega en
  `options`) y sin red:
  - `validate(map, grammar, { mode, coverage? })` y `validateGrammar(grammar)` → informe en tres listas;
  - `layout(map, grammar, view, options)` → geometría + avisos (§ 5.6): un dato puro, sobre el que se prueban
    las propiedades sin parsear el SVG; **independiente del idioma**; `view` ∈ `nivel1 · nivel2 · recorrido ·
    carriles · bloque` (esta última con `options.group`); la geometría **expone la vigencia** del mapa y de
    cada activable, y declara como API los campos que el consumidor usa (`gramatica`, `filas[].banda/y/alto`,
    `rotulos`, `cruces`, `avisos`, `vigencia`);
  - `toSVG(geometry, { language, texts, … })` → SVG del idioma pedido;
  - `toText(map, grammar, { language, texts, queryDate })` → HTML (la fecha permite «por revisar · N días»);
  - `toCard(map, grammar, nodeId, { language, texts, queryDate? })` → contenido de la ficha (§ 4.5) y
    `toBlockCards(map, grammar, group, opts)` → tarjetas de la vista «bloque» (§ 4.10);
  - `toLegend(grammar, { language, texts })` → leyenda (§ 4.9);
  - `compare(maps, grammar, { levelByBand?, … })` y `diff(mapA, mapB)` (JSON canónico).
  - **Las cadenas de interfaz del motor** («N componentes», «N fuentes», títulos de la ficha, «por revisar»,
    la regla del haz…) **llegan en `options.texts`** como mapas de idioma: el motor no trae copy propio.
    **Plurales como dato por idioma** (`{ one, other }`), no `[singular, plural]` con `n === 1`.
  - **Los nombres de la API van en inglés** (`group`, `texts`, `queryDate`); los del DATO siguen en español.
  - Un idioma que la gramática no declara da un **error claro** en todas las salidas (F-025).
  - Otro destino de salida (p. ej., exportar a Mermaid) es otra función.
- **Esquemas:** Ajv 8 en Node, con validador *standalone* precompilado para el navegador.
- **Texto:** la hoja del consumidor aplica `text-rendering: geometricPrecision` a todo `<text>` del motor (G15, F-013).
- **SVG en el build, interacción en el cliente:** la capa interactiva (foco, ficha, pasos, animación,
  lienzo deslizable) se engancha a los ids estables. Todo control dibujado tiene su script cargado y
  una prueba que lo activa (regla del kit). El sitio es estático y no cuesta nada por visita.
- **Copia fijada:** `packages/diagramador/CONTRATO.lock` guarda la versión y las huellas SHA-256 de este
  contrato, los esquemas, las gramáticas y la tabla de métricas. `/cierre-sprint` las compara con esta casa.
- **Enmiendas:** el builder las propone en su summary (sección «Enmiendas al contrato del diagramador»)
  con la falla que las motiva. Se aplican en el cierre, con aprobación.

## 9. Usos previstos (prueba de generalidad)

| Uso | Bandas | Gramática | Estado |
|---|---|---|---|
| **Plataformas de datos** (piloto, Big-D) | 6 capas + 3 transversales | `plataformas-datos` v0.2.0 (ES/EN) | ✓ spike · ✓ G-Diseño · ✓ **S1: implementación + primer mapa real (Fabric)** |
| **Agentes y flujos de IA** (planlang, 2.º consumidor) | 6 capas + 2 transversales; aristas condicionales con `condicion`; pausa humana con reanudación | `agentes-ia` v1.1.0 (ES/EN) + `ejemplos/agente-ejemplo` | ✓ esquema; el conversor de planlang emite esta forma |
| **Otras plataformas y nubes** | capas + transversales (identidad, red) | `prueba-nubes` | ✓ spike |
| **Arquitectura de nuestras apps** | 5 capas + 2 transversales; recorrido de ida y vuelta | `prueba-arquitectura-app` | ✓ spike |
| **Procesos y recorridos de negocio** | 4 **carriles**, posición sobre el eje por `orden` | `prueba-procesos` | ✓ spike |

El modelo aguantó los cinco usos con dos ajustes en 0.2.0 (glosario del mapa, bloque opcional anclado) y
uno en 0.3.0 (condición en el flujo, pedido por el segundo consumidor).

## 10. Ciclo de vida y evolución

Sigue [reusables/README.md](../README.md): `semilla` → `piloto` → `probado` → `kit`. El registro de
fallas es el motor del cambio y G-Metodo es el gate. **Estado: `piloto`** (2026-10-01): la implementación
existe en `app-big-d/packages/diagramador/`, pasa todos los casos y dibuja un mapa real aprobado; `probado`
llega cuando el segundo consumidor (planlang) la use desde su propio repo. La v1.0.0 del contrato se sella
cuando `compare` (S2 del piloto) cierre la última vista sin implementar.

## 11. Preguntas

| # | Pregunta | Estado |
|---|---|---|
| P1 | Motor de disposición | **Respondida:** colocación propia por bandas + ruteo ortogonal por canales (D2, D4). Queda por juzgar en el piloto la **calidad del trazado** sobre los mapas reales (D11 como gate + ⭐ humano); elkjs es el plan B de ruteo |
| P2 | ¿SVG idéntico en Node y en el navegador? | **Respondida por medición:** sí, con G1, G2 y G15 |
| P3 | Recorrido que se ramifica | **Respondida:** `sigue_de` + `bifurca` (V12) |
| P4 | Flujos agregados con modos distintos en el nivel 1 | **Respondida en G-Diseño:** una línea con etiqueta de modos (§ 4.1); la alternativa es opción del renderizador |
| P5 | Orientación del eje | **Respondida por el usuario:** siempre horizontal con desplazamiento lateral (D1, G11) |
| P6 | Tecnología de la animación | **Respondida:** CSS en hoja aparte + controlador que cambia un atributo; nada de SMIL (G12) |
| P7 | Bilingüe | **Respondida:** integral, mapas de idioma (§ 3.0) |
| P8 | ¿Carriles dentro de capas? | Fuera de v0.x. Si un consumidor lo pide, se hace a la manera de BPMN: sub-bandas dentro de una banda, probadas con una gramática mínima |
| P9 | Orquestación, ¿capa o transversal? | **Respondida en G-Diseño:** transversal, tercera franja; nota de la gramática `plataformas-datos` (desviación declarada de § 10.6) |
| P10 | Densidad máxima por banda | **Respondida (estimada):** `nodos_por_banda_max: 6` en el piloto, con carnada C18; el piloto la mide con Fabric y la ajusta por enmienda si hace falta |
| P11 | Fuente de licencia abierta para G15 | **Respondida por el usuario:** Space Grotesk + JetBrains Mono (§ 5.5) |
| P12 | Kerning en la tabla de métricas | **Respondida en el S1:** la tabla sin kerning + 3 % es cota superior en 3 motores × 2 sistemas (97,1 %) con `geometricPrecision`; no hace falta kerning |
| P13 | Orden de las pistas por destino | Abierta para el S2: la punta de una flecha de llegada (8 u) cruza las pistas que corren entre la suya y la tarjeta; asignar primero, junto a cada columna, las pistas de los flujos que entran a ella |

## Gaps

- **`compare` sin implementar:** el lado a lado (§ 4.4) es la única vista del contrato sin código; la
  construye el S2 del piloto y ahí se fija su golden file y la alineación por banda en el nivel 2.
- **Orden de las pistas por destino (P13):** abierta.
- **Más de un elemento por banda en el nivel 1 con franjas de varios elementos:** P1 lo ejercita en el nivel 2;
  el nivel 1 con varios bloques por banda todavía no tiene mapa del contrato.
- *(Cerrados en el S1: G1 en Linux · calidad del trazado en un mapa real · G11 y G15 en Firefox y WebKit ·
  kerning.)*

## 12. Anexo — contrato de la propuesta (cómo se propone un mapa; nuevo en 0.4.0)

El motor no propone contenido, pero el piloto definió cómo llega un mapa propuesto a la aprobación humana, y
ese esquema sirve de base a cualquier consumidor que necesite el mismo flujo (planlang, por ejemplo):
- **La propuesta es una lista de afirmaciones**, cada una sobre **una entidad** (`{ entidad, id }`: nodo,
  flujo, bloque, paso) con **una cita literal** de una fuente verificada por código (el texto citado debe
  encontrarse en la página cruda, en el idioma de la fuente). No hay afirmaciones sin cita.
- **Aprobar y rechazar es por afirmación.** Rechazar una afirmación saca su entidad del mapa **en cascada**
  (los flujos y pasos que la tocan salen con ella) y el motivo queda registrado.
- **Un retiro** (algo que estaba en el mapa aprobado y la propuesta saca) lleva **motivo y cita oficial
  verificada**, salvo el flujo que sale por arrastre de su nodo; «ningún retiro sin argumento» es decisión
  del usuario (D-S1-56).
- **«Sin novedades»** no esquiva la cita ni el rechazo: renueva la fecha de verificación solo de las
  afirmaciones que vuelven a verificarse, nunca de todo el mapa.
- El resultado se **valida en modo publicación** (V1–V16, con cobertura) y se dibuja a cuatro edades antes
  de pedir la aprobación; la aprobación la ejecuta una persona en su terminal y deja registro
  (`data/revisiones/<sujeto>.jsonl` en el piloto).
- El contenido en texto nunca se corrige a mano después de aprobado: una corrección es una nueva propuesta.
