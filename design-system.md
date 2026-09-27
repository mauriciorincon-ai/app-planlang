---
version: 0.2.0
estado: kit aprobado en la mirada 2 (2026-09-27); 0.2 suma los componentes de la ronda 2 de P3 — sube a 1.0.0 al aprobar G-Diseño
fecha: 2026-09-27
fuente_visual: docs/diseno/ (kit.html es este documento en vivo)
tokens: scripts/paleta/generar-tokens.mjs → docs/diseno/assets/tokens.{json,css} (generados; gate diseno-tokens)
---

# Sistema de diseño de planlang

Fuente de verdad visual de la vitrina. Toda pantalla del S2 en adelante lo obedece; se extiende por
ADR y nunca se contradice en silencio. **`docs/diseno/kit.html` lo muestra en vivo** (tokens leídos
del CSS generado, componentes con sus estados, en los dos temas y los dos idiomas). La maqueta es
referencia, no producto: el S2 reproduce estos componentes en React; la maqueta no se copia.

Nació de la mirada 1 (tres rondas, 2026-09-26/27, registro textual en `docs/diseno/MIRADAS.md`): la
ronda 1 (dos direcciones con Space Grotesk y Newsreader) fue rechazada por «tipografía, elementos de
magnitud desproporcionada, tarjetas tiradas sin sentido»; la ronda 2 fijó la escala y la rejilla y el
usuario eligió **Inter**; la ronda 3 sumó íconos y miniaturas gráficas y fue aprobada («lo abrí y
apruebo»). En la mirada 2 el usuario aprobó el kit («si aprobado el kit del sistema») y pidió que la
pantalla del agente dijera qué es el agente (objetivo, qué recibe, qué hace, qué entrega, capacidad) y
trajera mucha más información por perfil: de ahí salen los componentes de la versión 0.2.

## 1. Personalidad

| Es                                                                                     | Jamás será                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Sobrio** — tamaños contenidos, una rejilla, filetes antes que cajas                  | Un panel de observabilidad genérico (tarjetas iguales, gradientes, números gigantes) |
| **Exacto** — toda cifra con su procedencia, todo umbral con su señal y su inclusividad | Festivo ni vendedor: nada de brillo, confeti ni superlativos                         |
| **Franco** — la falla se ve igual de clara que el acierto                              | Denso sin jerarquía: si todo pesa lo mismo, nada se lee                              |

Principios que se derivan de ahí:

1. **El color es dato.** La interfaz es tinta sobre neutro; el color existe solo para el tipo de nodo
   y el veredicto. Los íconos son monocromos.
2. **Forma antes que color** (regla dura 13, daltonismo leve del usuario): tipo de nodo = color +
   glifo + etiqueta corta; veredicto = símbolo dibujado + texto + color; modo de flujo = estilo de
   línea + marcador. Todo se lee en escala de grises.
3. **Toda cifra dice de dónde sale:** chip «real» (spike, plan, fuente citada) o «maqueta».
4. **La brecha tiene forma propia:** el hueco entre lo medido y el objetivo se dibuja rayado en el
   color de «no cumple», con su valor escrito.
5. **Una cosa importa por pantalla** y se le da el peso; el resto retrocede.

## 2. Tokens

Implementados como variables CSS. **Ningún valor suelto en un componente.** El color lo GENERA el
script (no se edita a mano); el resto vive en `docs/diseno/assets/planlang.css` (`:root`) y pasa a la
configuración de Tailwind en el S2.

### 2.1 Color — neutros (cromo neutro, matiz 260, croma 0,006 oscuro / 0,003 claro)

| Token       | Rol                                       | Oscuro    | Claro     | Contraste sobre `fondo` (oscuro / claro) |
| ----------- | ----------------------------------------- | --------- | --------- | ---------------------------------------- |
| `--fondo`   | fondo de página                           | `#0b0c0f` | `#fbfcfe` | —                                        |
| `--sup-1`   | superficie: lienzo, miniaturas, campos    | `#111315` | `#ffffff` | —                                        |
| `--sup-2`   | superficie elevada: nodos, baldosas, sala | `#191b1d` | `#f4f6f8` | —                                        |
| `--linea`   | filetes y separadores                     | `#2c2e31` | `#dee0e2` | 1,4 / 1,3                                |
| `--tinta-3` | guías gráficas y bordes de control        | `#75777b` | `#7f8082` | 4,4 / 3,9                                |
| `--tinta-2` | texto secundario, trazos de flujo         | `#b8bbbe` | `#515254` | 10,1 / 7,6                               |
| `--tinta-1` | texto principal, foco                     | `#eceff3` | `#17181a` | 17,0 / 17,3                              |

**VETADAS COMO TEXTO: `--tinta-3` y `--linea`.** No alcanzan 4,5:1 sobre sus superficies; `tinta-3`
sirve para bordes de control y guías (≥ 3:1). El gate `tests/unit/diseno-tokens.test.ts` lo exige
en la paleta, y en el S2 un barrido de clases prohibidas sobre `src/` debe fallar en `pnpm lint`
(regla de desarrollo 5-b) — se escribe con su demo en rojo en el primer sprint con UI.

### 2.2 Color — cromáticos (un matiz propio cada uno; claridad por búsqueda determinista)

| Token                         | Rol                                    | Glifo / símbolo      | Oscuro    | Claro     |
| ----------------------------- | -------------------------------------- | -------------------- | --------- | --------- |
| `--tipo-1` · `--modelo`       | nodo que razona con un modelo          | estrella             | `#a87eeb` | `#794db6` |
| `--tipo-2` · `--herramienta`  | nodo que llama a un sistema externo    | triángulo            | `#17d0d8` | `#02787d` |
| `--tipo-3` · `--regla`        | nodo de código fijo, sin modelo        | hexágono             | `#8ea1b4` | `#2f3f4f` |
| `--tipo-4` · `--pausa-humana` | nodo que espera a una persona          | cuadrado             | `#e4762c` | `#a04a02` |
| `--tipo-5` · `--enrutador`    | nodo que elige el camino por una señal | rombo                | `#badbfe` | `#015493` |
| `--cumple`                    | veredicto positivo                     | ✓ en círculo relleno | `#57c173` | `#037434` |
| `--alerta`                    | cumple con alertas                     | triángulo con «!»    | `#eac33f` | `#907402` |
| `--no-cumple`                 | veredicto negativo, la brecha          | ✕ en círculo         | `#ffa09c` | `#cb454a` |

Cada cromático tiene su **tinte** (`--<token>-tinte`, 15 % sobre `sup-2`) para fondos de estado
(nodo seleccionado, chip de veredicto). Garantías medidas por el gate: trazo ≥ 3:1 sobre `sup-1`,
`sup-2` y su tinte; `tinta-1` ≥ 4,5:1 sobre cada tinte; peor distancia ΔE entre los 8 ≥ 0,10 en visión
normal, ≥ 0,06 con protan/deutan/tritan 0,6 y ≥ 0,03 en dicromacia. En escala de grises no se exige
distancia: ahí cargan el glifo y la etiqueta.

### 2.3 Tipografía

- **Inter** (variable 400–700, OFL) en toda la interfaz y en el diagrama. Elegida por el usuario en la
  mirada 1 entre Inter, IBM Plex y Geist sobre el mismo diseño. El skill `diseno-ui` advierte que
  «Inter por defecto en todo» es firma del look genérico: aquí no es un defecto, es una elección
  registrada, y la personalidad la cargan la gramática del grafo, los datos en mono y la brecha rayada.
- **JetBrains Mono** (OFL) **solo para datos**: huellas, semillas, señales, operadores, fechas,
  versiones, la etiqueta corta del nodo (MOD, HER, REG, HUM, ENR). Jamás rotula secciones.
- Cifras con `font-variant-numeric: tabular-nums`. Decimales con coma en ES y punto en EN.
- Servidas desde el mismo sitio (woff2, subconjunto latino, `font-display: block`), nunca desde un CDN.

| Rol               | Tamaño (px)         | Interlínea | Peso                    | Token         |
| ----------------- | ------------------- | ---------- | ----------------------- | ------------- |
| Título de página  | 36 · 28 en teléfono | 1,15       | 600, tracking −0,022 em | `--t-titulo`  |
| Sección           | 20                  | 1,3        | 600, tracking −0,01 em  | `--t-seccion` |
| Subtítulo         | 15                  | 1,4        | 600                     | `--t-sub`     |
| Texto             | 15                  | 1,6        | 400                     | `--t-texto`   |
| Guía (entradilla) | 17 · 16 en teléfono | 1,55       | 400, `tinta-2`          | `--t-guia`    |
| Secundario        | 13                  | 1,5        | 400, `tinta-2`          | `--t-chico`   |
| Dato              | 12                  | 1,5        | 400 mono                | `--t-dato`    |
| Cifra             | 28 · 24 en teléfono | 1          | 600, tabular            | `--t-cifra`   |

Nada fuera de esta escala. Dentro del diagrama: nombre de nodo 12,5, etiqueta corta 10,5 mono,
cabecera de banda 13 / 11,5, etiqueta de arista 10,5 mono.

### 2.4 Espacio, rejilla, forma

- **Espaciado** (múltiplos de 4): `--e-1` 4 · `--e-2` 8 · `--e-3` 12 · `--e-4` 16 · `--e-5` 24 ·
  `--e-6` 32 · `--e-7` 48 · `--e-8` 64. Secciones separadas por 40 px y un filete.
- **Rejilla:** 12 columnas, `--ancho` 1120 px, medianil 24 px, margen `--margen` 32 px (16 en teléfono).
  Todo bloque arranca en una columna. Cortes: 720 px (tipografía y márgenes de teléfono), 860 px
  (las rejillas pasan a una columna), 900 px (teléfonos de sala).
- **Radios:** 6 px (botón, nodo, lienzo, controles), 4 px (chip, veredicto), 8 px (baldosa,
  miniatura). Sin radios grandes uniformes.
- **Bordes:** 1 px `linea` para estructura; 1 px `tinta-3` para controles; **discontinuo = algo que
  falta o no es real** (nodo exigido-ausente, «en construcción», chip «maqueta», «no observado»).
- **Sombras: ninguna.** La elevación se dice con `sup-2` y un filete. El foco es un contorno de 2 px
  `tinta-1` con 2 px de separación, igual en toda la app.

### 2.5 Iconografía

- **Lucide** v1.48.0 (ISC), trazo 1,75, puntas y uniones redondeadas, incrustados como símbolos SVG
  (licencia en `docs/diseno/assets/iconos/`). En el S2: `lucide-react` con la misma versión fijada.
- Tamaños: 14–16 px en línea con texto, 18 px dentro de una **baldosa** de 36 px (28 px la chica).
- Monocromos: heredan la tinta del texto. **Prohibido** colorear un ícono y **prohibidos los emojis**.
- Las marcas de veredicto, los glifos de tipo y la marca de «exigido» NO son íconos de Lucide: se
  dibujan (la gramática `agentes-ia` y las marcas ✓ ✕ ! son propias; la fuente no las trae).
- Juego actual: casa, portapapeles, flujo, indicador, deslizadores, matraz, archivo con visto,
  rama, ojo, lista con vistos, brújula, estetoscopio, edificio público, bocadillo con pregunta,
  escudo con visto, información, luna, sol, idiomas, teléfono, flecha, regla, lápiz sobre portapapeles.
  La 0.2 suma: diana (objetivo), personas, prohibido, base de datos (estado), procesador (modelo),
  documento, llaves (versiones), historial (reanudación), capas (arquitectura), bifurcación, enviar
  (entrega), visto y persona con visto (auditor).
- **Marcas de estado frente a lo que corrió** (dibujadas, 0.2): ● corrió (círculo lleno con visto) ·
  ◐ en parte (medio círculo) · ◌ exigido y aún no (círculo discontinuo). Se distinguen por forma, sin
  color; van con su palabra para lectores de pantalla y con leyenda visible.

### 2.6 Movimiento

| Uso                                  | Duración | Curva                        | Propiedades            |
| ------------------------------------ | -------- | ---------------------------- | ---------------------- |
| Hover y pulsación de controles       | 150 ms   | `cubic-bezier(0.2, 0, 0, 1)` | color, fondo, borde    |
| Selección de nodo, cambio de pestaña | 200 ms   | la misma                     | `opacity`, `transform` |
| Salto del lienzo a una capa          | 250 ms   | `scroll-behavior: smooth`    | desplazamiento         |

Solo `transform` y `opacity` (más color en controles). El movimiento explica causalidad, no decora.
**Con `prefers-reduced-motion: reduce` todo es instantáneo** y la FORMA del árbol no cambia (regla de
desarrollo 5-a: nada decide qué se pinta según `useReducedMotion()`).

## 3. Idioma

Bilingüe integral (regla 20): cada texto nace como `{ es, en }` **redactado**, nunca traducido por
máquina. Los identificadores de código (`senal_confianza`, `pausa_humana`, `aprobar`) no se traducen;
los números sí se formatean por idioma. Rótulo en toda pantalla: «Simulación · no operativo» /
«Simulation · not operational». Texto de líder: ≤ 50 palabras y ≤ 1 término definido.

## 4. Estados

- **De datos (cinco, en todo componente que muestra datos):** contenido · éxito · vacío · cargando ·
  error. El vacío se diseña (dice qué falta y qué hacer), el cargando es un esqueleto con la forma
  final (sin giradores), el error dice qué pasó y qué hacer, en llano.
- **De interacción (en todo control):** reposo · hover · foco · activo/seleccionado · deshabilitado.
  Deshabilitado siempre dice por qué (p. ej. «no observado»).

## 5. Componentes canon

Cada uno con su uso permitido; `kit.html` muestra sus estados. En el S2 son componentes React
propios (shadcn/ui personalizado donde aplique, jamás el estilo por defecto).

| Componente                    | Uso                                                                                                                     | Estados que muestra el kit                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Rótulo**                    | primera franja de toda pantalla: «Simulación · no operativo» + divulgación de datos sintéticos                          | escritorio · teléfono                                          |
| **Barra de navegación**       | marca, pestañas con ícono, idioma y tema                                                                                | pestaña activa · hover · foco                                  |
| **Botón**                     | principal (tinta-1 lleno, uno por vista), secundario (borde), chico                                                     | reposo · hover · foco · activo · deshabilitado                 |
| **Chip de procedencia**       | «real», «maqueta», «fuente», junto a toda cifra                                                                         | tres variantes                                                 |
| **Chip «no observado»**       | una señal del plan que las trazas no registran; desactiva su umbral                                                     | solo · dentro de un deslizador                                 |
| **Veredicto**                 | cumple · cumple con alertas · no cumple · en construcción; normal y chico                                               | cuatro variantes × dos tamaños                                 |
| **Nodo del grafo**            | 5 tipos de `agentes-ia`                                                                                                 | reposo · hover · foco · seleccionado · exigido-ausente         |
| **Arista**                    | secuencia (sólida) · condicional (discontinua + cuadro, con `señal · operador · valor`) · reanudación (punteada)        | tres modos                                                     |
| **Lienzo**                    | el grafo: 1040 px, se desliza de lado en teléfono con índice de capas; lista por capa como alterna                      | ver `03-agente.html`                                           |
| **Fila de criterio**          | criterio del plan: regla de medición, medido vs objetivo con la brecha rayada, veredicto                                | contenido · éxito · vacío · cargando · error                   |
| **Fila de riesgo**            | modo de falla con prioridad de acción AIAG-VDA (RPN solo secundario), detector en trazas, si ocurrió                    | contenido · éxito · vacío · cargando · error                   |
| **Deslizador de umbral**      | umbral del plan: `señal · operador · valor · inclusivo`, rango jugable, marca del valor del plan                        | reposo · movido · foco · deshabilitado · booleano (modo Texas) |
| **Panel de consecuencias**    | lo que cambia al mover umbrales: casos, errores evitados e introducidos, minutos humanos, criterios                     | contenido · éxito · vacío · cargando · error                   |
| **Curva riesgo-cobertura**    | X = cobertura, Y = riesgo; punto del plan y punto actual con forma y texto                                              | contenido · éxito · vacío · cargando · error                   |
| **Ficha de reproducibilidad** | versiones, huellas SHA-256, semilla, modelo, fecha — sin URLs                                                           | contenido · éxito · vacío · cargando · error                   |
| **Baldosa**                   | el ícono que abre un bloque (36 px; 28 px la chica)                                                                     | —                                                              |
| **Miniatura**                 | gráfico pequeño con su pie de procedencia («Cómo funciona»)                                                             | —                                                              |
| **Tabla de filas**            | listas comparables (demos, criterios, riesgos): filetes, cabecera en `t-dato`, en teléfono cada celda lleva su etiqueta | escritorio · teléfono                                          |
| **Ficha del agente** (0.2)    | abre toda pantalla de agente: objetivo · recibe → hace → entrega (tres columnas unidas por flechas, cada fila con su marca de estado) · puede / nunca / participan · capacidad medida; «Experto» la cambia por la ficha técnica | líder · experto · escritorio · teléfono (columnas apiladas, flechas hacia abajo) — ver `03-agente.html` |
| **Flujo del nodo** (0.2)      | la misma idea a escala de nodo: lo que recibe → el nodo → lo que entrega                                                | escritorio · teléfono                                          |
| **Campos por perfil** (0.2)   | lista de dos columnas con ícono y rótulo: para qué existe, cómo lo hace, si falla, cómo se mide, en los casos, lo que aún no hace (este último en tinta-2) | líder; cada texto ≤ 50 palabras                                |
| **Referencias al plan** (0.2) | id del plan + enunciado + su medida (prioridad de acción con S·O·D, «sin probar», regla, «una vía»)                      | experto                                                        |
| **Matriz plan → nodo** (0.2)  | qué decisiones, riesgos, supuestos, criterios y umbrales gobiernan cada nodo del contrato, y si corrió                   | escritorio · teléfono (cada celda con su etiqueta)             |
| **Traza abrible** (0.2)       | una fila por caso que se abre (`<details>`): el texto del caso, lo que el nodo leyó y escribió, tokens, costo, verdad    | cerrada · abierta · teléfono                                   |

## 6. Anti-patrones (prohibidos, además de los del skill `diseno-ui`)

- Números o titulares por encima de la escala; píldoras gigantes; «hero» de dos botones centrado.
- Tarjetas de tamaños distintos sin rejilla; rejillas de tarjetas idénticas como respuesta a todo.
- Color para decorar: íconos de colores, fondos de color en secciones, gradientes (el único rayado
  permitido es el de la brecha).
- Un color solo para decir algo (sin glifo, símbolo o texto que lo acompañe).
- Mono para rotular secciones o en mayúsculas espaciadas.
- Una cifra sin procedencia; un veredicto de maqueta sin su chip «maqueta».
- Sombras; radios grandes uniformes; emojis; texto de relleno o inglés residual.
- Simular lo que no corrió (el demo B dice «en construcción» y no muestra resultados).

## 7. Pendiente para 1.0.0 (G-Diseño)

- Los seis componentes de la 0.2 viven hoy en `03-agente.html`; entran al kit al consolidar
  G-Diseño (el kit ya aprobado no se toca a mitad de etapa).

- Miradas 3 y 4: pantallas Brecha, Playground, Entrada final, Plan, Caso y Fichas ensamblan estos
  componentes; lo que cambie en ellas vuelve aquí.
- Tabla de métricas de Inter para el diagramador (G15), propuesta como enmienda al contrato en el
  summary (el piloto big-d la fijó para Space Grotesk).
- Glifo de «regla»: hexágono por defecto (gramática v1.0.0); el escudo queda como alternativa
  explicada al usuario.
