---
version: 1.0.0
estado: kit aprobado en la mirada 2 (2026-09-27); 0.2 suma los componentes de P3, 0.3 los de Brecha y Playground (mirada 3) 0.3.1 el balance y el perfil evidente (mirada 3, ronda 2) 0.4.0 los de Entrada, Plan, Caso y Fichas (mirada 4) 0.4.1 «Ver N más», el aviso de estado arriba y la pestaña Casos (mirada 4, ronda 2) y 0.5.0 el salto, la distribución de una arista y el kit consolidado (mirada 5) — 1.0.0: G-Diseño aprobado por el usuario el 2026-09-27 (mirada 5, ronda 2)
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
trajera mucha más información por perfil: de ahí salen los componentes de la versión 0.2. La
mirada 2 cerró con una regla para lo que sigue: toda pantalla abre con su ficha general («qué es, qué
recibe, qué produce») y trae su detalle por perfil; la 0.3 la aplica al informe y al playground.

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

La guía de 17 px es solo la entradilla de la portada. **Toda lectura dentro de una sección —la frase
del veredicto, la entradilla de cada sección, los renglones del balance, el objetivo de cada ficha—
va en Texto (15 px).** En la mirada 3 la frase del veredicto a 17 px se leyó «muy grande» (0.3.1); en
la 0.4.0 el objetivo de la ficha general también baja a 15 px en todas las pantallas (Agente y
Playground incluidas).

**Fraunces 500** (OFL) existe en la maqueta **solo dentro del marco de CV Viva** de Fichas (0.4.0): es
la piel con que hoja-de-vida pinta las fichas de la app y del agente, no una letra de planlang. Fuera
de ese marco no se usa.

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
los números sí se formatean por idioma: la cifra y su signo van unidos por un espacio duro
(«89 %» no se parte al final de la línea) y todo texto armado con un número concuerda con él («1
bloque es», «3 bloques son»; «1 sprint»). Rótulo en toda pantalla: «Simulación · no operativo» /
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
| **Barra de navegación**       | marca, pestañas con ícono (Entrada · Plan · Agente · Brecha · Playground · Casos · Fichas; 0.4.1), idioma y tema          | pestaña activa · hover · foco                                  |
| **Botón**                     | principal (tinta-1 lleno, uno por vista), secundario (borde), chico                                                     | reposo · hover · foco · activo · deshabilitado                 |
| **Chip de procedencia**       | «real», «maqueta», «fuente», junto a toda cifra                                                                         | tres variantes                                                 |
| **Chip «no observado»**       | una señal del plan que las trazas no registran; desactiva su umbral                                                     | solo · dentro de un deslizador                                 |
| **Veredicto**                 | cumple · cumple con alertas · no cumple · en construcción; normal y chico                                               | cuatro variantes × dos tamaños                                 |
| **Nodo del grafo**            | 5 tipos de `agentes-ia`                                                                                                 | reposo · hover · foco · seleccionado · exigido-ausente         |
| **Arista**                    | secuencia (sólida) · condicional (discontinua + cuadro, con `señal · operador · valor`; «si no» rotula la rama por defecto) · reanudación (punteada); dos flechas que se cruzan lo hacen con **salto** (0.5) | tres modos · salto                                             |
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
| **Leer como** (0.3)           | conmutador de página líder · experto (`html[data-perfil]`); lo técnico lleva `.solo-experto`, nunca se duplica la página | líder · experto                                                |
| **Franja del oráculo** (0.3)  | divulgación obligatoria en Brecha y Playground: las decisiones humanas se simularon (DA-04); filete del color de la pausa humana | —                                                              |
| **Veredicto al frente** (0.3) | el sello, una frase para quien decide, la recomendación del verificador y seis cifras                                   | cumple con alertas · no cumple (maqueta) · teléfono            |
| **Índice del informe** (0.3)  | las 9 secciones de § 12 como enlaces numerados; cada sección repite su número                                            | —                                                              |
| **Visitas por nodo** (0.3)    | contrato de grafo: nodo con su glifo, barra de visitas y marca de presencia                                              | escritorio · teléfono                                          |
| **Cadena de nodos** (0.3)     | el camino de un caso como glifos unidos por flechas                                                                      | —                                                              |
| **Supuesto con su prueba** (0.3) | enunciado, estado (confirmado · refutado · sin probar), lectura de líder, medidas (experto), límites y su gráfico      | los tres estados                                               |
| **Comparación de variantes** (0.3) | barras pareadas: la variante del plan llena, la línea base con trazo y rayado; se distinguen sin color               | —                                                              |
| **Casos ejemplares** (0.3)    | cuatro bloques (exitoso · escalado · fallido · adversario); el que no existe queda vacío y lo dice                        | contenido · vacío                                              |
| **Aviso de estado de maqueta** (0.3) | borde discontinuo: qué cambia y que sus números son inventados                                                    | —                                                              |
| **Casos que cambian** (0.3)   | playground: antes → ahora por forma (■ a una persona · ○ solo · ◌ no observado), el porqué y la consecuencia            | vacío · con cambios · error introducido · no observado         |
| **Aviso de perfil** (0.3.1)   | bajo el título: qué ve quien lee, el botón para cambiar y, como experto, cuántos bloques son solo suyos                   | líder · experto · teléfono                                     |
| **Bloque del experto** (0.3.1) | lo que solo ve el experto: fondo elevado, filete y rótulo «Experto» en Inter; la variante `sutil` (reglas dentro de filas) no lleva rótulo; lo nuevo entra con un fundido de 0,45 s | experto · movimiento reducido (sin fundido)                     |
| **Balance del plan** (0.3.1)  | matriz: cada parte del plan × se cumplió · falló · sin probar, con marca, cuenta e identificadores; lo fallido enlaza a su renglón | real · no cumple (maqueta) · teléfono (cada celda con su etiqueta) |
| **Lo que falló** (0.3.1)      | un renglón por cosa: sello, id y título · qué se planeó · qué pasó · qué significa (experto: regla · medido · evidencia) · casos y sección | falló · ocurrió · sin probar · cumple con nota · teléfono      |
| **Lo cumplido, uno por uno** (0.3.1) | dos listas compactas (criterios · riesgos) con marca, id, nombre y cifra; el experto ve la regla bajo cada uno    | líder · experto · teléfono (la cifra baja a su línea)          |
| **Frase viva** (0.3.1)        | playground, líder: una frase llana que se reescribe con cada movimiento y nombra casos, errores, minutos y criterios       | en el plan · con cambios · error · no observado                |
| **Regla viva** (0.3.1)        | playground, experto: la regla de cada nodo escrita con las aristas del contrato del plan, en orden, con el valor movido subrayado | en el plan · movido                                        |
| **Selector de casos** (0.4)   | Caso: un chip por caso con su id en mono y su tipo en llano; el activo con borde; debajo, que en el producto abren los 20 | activo · reposo · teléfono (se envuelven)                      |
| **Debía y pasó** (0.4)        | cabeza del caso: lo que debía pasar según la verdad conocida frente a lo que pasó, con sello y «coincide con la verdad conocida» | coincide · no coincide · error                                 |
| **Recorrido paso a paso** (0.4) | un paso por nodo visitado: glifo y nombre en mono, qué hizo en llano, la razón de su rama tras una flecha, costo a la derecha («sin modelo» o segundos · tokens); el experto suma medidas y la tabla de aristas | líder · experto · teléfono                                     |
| **Tabla de aristas** (0.4)    | las reglas de un nodo en orden: señal, regla, observado, ¿se cumple?, rama; la rama se escribe solo en la regla que decidió (la primera que se cumple o, si ninguna, la última) y esa fila se resalta | escritorio · teléfono (la señal a todo el ancho; los identificadores se parten solo tras «_») |
| **Pausa humana** (0.4)        | por qué se detuvo (en llano; el experto ve además el motivo crudo del payload), evidencia, contraevidencia, lo que leyó el extractor y lo que respondió el auditor, con la divulgación de que fue simulado | con pausa · sin pausa (la sección no aparece)                  |
| **Instrucción inyectada** (0.4) | dentro del texto del caso, la instrucción escondida va con borde discontinuo y ⚠; la guardia dice que la vio y que no cambió nada | —                                                              |
| **Respuesta y guardia** (0.4) | la respuesta al afiliado con su aviso de IA, y la guardia de salida: acciones intentadas y ejecutadas, instrucción en la entrada, hallazgos, severidad | escritorio · teléfono                                          |
| **Documento de decisión adversa** (0.4) | lo arma el código: servicio, decisión, causal con su ley, regla aplicada, datos usados, versión con huellas, quién decidió y cómo contradecirla; los códigos de catálogo no se parten | ES · EN · teléfono (una columna)                               |
| **Fila del plan** (0.4)       | id en mono, enunciado, lo elegido y un desplegable («por qué y qué más se consideró», «qué pasaría y qué se hizo», «cómo se prueba y qué dio»); a la derecha su sello: una vía (⚠ y filete a la izquierda) · dos vías · costosa; prioridad de acción con barras y S·O·D; estado del supuesto; cumplió | cerrada · abierta · teléfono (el sello baja bajo el texto)     |
| **Cifras del plan** (0.4)     | cinco cifras (decisiones, riesgos, supuestos, criterios, umbrales), cada una con lo que pasó en la corrida y enlace a su sección | —                                                              |
| **Índice del plan** (0.4)     | seis anclas numeradas a las partes del plan                                                                             | —                                                              |
| **Miniaturas del ciclo** (0.4) | «Cómo funciona» de la Entrada: barras del plan, cadena de las 8 piezas del agente, 9 marcas de criterio y lo que falló nombrado | real · no cumple (maqueta) · teléfono                          |
| **Capacidad medida** (0.4)    | cuatro cifras con su chip de procedencia (real con su fuente · declarado)                                               | —                                                              |
| **Marco de CV Viva** (0.4)    | las fichas de la app y del agente como las pinta hoja-de-vida: papel, Fraunces en titulares, Inter en texto; la cabecera del marco nombra el archivo y el contrato. Es el único lugar con otra piel | ficha de la app · ficha del agente · error (ficha inválida)    |
| **Pasos por carril** (0.4)    | proceso de la ficha del agente: pasos numerados por actor (médico, agente, auditor, afiliado), las decisiones con borde discontinuo; en hoja-de-vida los dibuja su motor BPMN | —                                                              |
| **Ver N más** (0.4.1)         | una lista larga muestra sus 5 primeras filas; el botón dice cuántas y cuáles faltan («Ver 3 más: R7, R4, R8»), las abre en su sitio y «Ver menos» las cierra sin perder el botón de vista; lo plegado cuenta igual para el aviso de perfil | cerrado · abierto · teléfono                                   |
| **Aviso de estado arriba** (0.4.1) | un estado de maqueta que cambia bloques lejanos pone su aviso donde se pulsa, arriba de todo, con enlaces a lo que cambia | —                                                              |
| **Distribución de una arista** (0.5) | los valores observados de una señal frente a su umbral: ■ los que la regla manda a una persona, ○ los que siguen; el umbral, línea discontinua con su valor | escritorio · teléfono (la letra crece en unidades del SVG)      |
| **Validación de campos** (0.4) | experto: cada campo de una ficha contra los límites del contrato v1.3.1 con «Cabe» o «No cabe»                         | cabe · no cabe (error)                                         |

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

## 7. 1.0.0: lo que selló G-Diseño y lo que queda abierto

G-Diseño aprobado el 2026-09-27 («apruebo G-Diseño», mirada 5, ronda 2); el veredicto textual y el
registro viven en `docs/diseno/README.md`. Desde aquí el sistema se extiende por ADR y nunca se
contradice en silencio; el S2 reproduce la maqueta, no la copia. Entró en la 1.0.0:

- **Consolidado en la mirada 5:** `kit.html` suma «Componentes de pantalla», el catálogo de los 44
  componentes de la 0.2 a la 0.5, cada uno con su uso, sus estados y el enlace a su instancia viva
  (pantalla, estado y perfil). Las piezas canon de la mirada 2 no cambiaron.
- **Agente con el grafo real del sprint 1 (mirada 5, aprobado por el usuario en la mirada 4):** las 8
  piezas del contrato en sus bandas, las 9 reglas de arista, un solo cruce con salto; el grafo del spike
  queda como el ejemplo vivo del estado «exigido y ausente».
- La mono va sin ligaduras en código y datos (`!=` no se dibuja `≠`, `->` no es `→`); en teléfono, la
  letra de las gráficas crece en unidades del SVG. En la mirada 5 se encontró que el bloque de código
  de Agente las volvía a encender (su regla `font:` las reiniciaba): corregido.
- Toda cifra lleva su procedencia: chip «real» con su fuente o chip «maqueta». Los 12 minutos por
  revisión del playground son el `costo_humano_por_caso_min` que el plan v1.2 declara en cada umbral.
- Glifo de «regla»: hexágono (gramática v1.0.0); el escudo quedó como alternativa explicada al
  usuario, no elegida.
- El gate ⭐ de lectura de la etapa (una persona no técnica explica, tras Entrada y Brecha en «maqueta:
  no cumple», qué se planeó y qué falló) se omitió por decisión explícita del usuario; consta en el
  registro de G-Diseño.

Queda abierto después de la 1.0.0:

- Tabla de métricas de Inter para el diagramador (G15), propuesta como enmienda al contrato en el
  summary del S2 (el piloto big-d la fijó para Space Grotesk).
