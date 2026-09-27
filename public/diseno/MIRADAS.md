# Miradas — Etapa de Diseño de planlang

> Una entrada por mirada: qué se entregó, qué dijo el usuario (textual, sin resumir) y qué cambió
> en respuesta. Se responde con cambios, no con explicaciones. La entrada se escribe ANTES de
> construir el artefacto siguiente.

## Mirada 1 — `direccion.html` · 2026-09-26

**Entregado:** dos direcciones de identidad sobre la Entrada (P1), el nodo del grafo en 5 tipos ×
3 estados, un fragmento del grafo real del spike (lienzo horizontal y lista por capa), los tres
veredictos y la tipografía. Oscuro y claro, ES y EN, 380 px y desktop.

- **A · Instrumento:** Space Grotesk en todo + JetBrains Mono, cromo frío, rejilla medida, veredicto
  como sello, nodo con filete lateral del tipo.
- **B · Acta:** Newsreader para titulares y prosa de líder, Space Grotesk en UI y diagrama, cromo
  cálido, cláusulas numeradas al margen, veredicto como anotación en tinta, nodo con sello circular.

**Pasada de capturas del builder (antes de entregar):** 16 encuadres (2 direcciones × 2 temas × 2
idiomas × 380/1280) leídos como imagen + 64 con simulación de daltonismo (deutan, protan, tritan,
acromatopsia) + corrida con movimiento reducido. Ajustes hechos por lo visto: la cifra «casi nadie» se
pintaba a 14 px (una regla de etiqueta alcanzaba el span de idioma); el «★» de texto no existe en la
fuente (se dibuja); la pregunta de la banda 04 invadía el canal; el índice de capas del lienzo se
oculta solo cuando el lienzo cabe.

**Lo que dijo el usuario (2026-09-27, con la página abierta en el preview):**

> «No me gusta esta horrible realmente muy malo tipografia elementos de magnitud desproporcionada
> (muy grandes) tarjetas como tirada por ahi sin ningun sentido muy mal»

**Veredicto:** rechazo de las dos direcciones. Tres causas nombradas: (1) la tipografía; (2) la escala:
elementos desproporcionados, demasiado grandes; (3) la composición: tarjetas sueltas sin orden ni
sentido. No eligió entre lienzo y lista ni entre hexágono y escudo: esas dos preguntas siguen abiertas.

**Qué cambió:** se rehace la mirada 1 como ronda 2 (ver entrada siguiente). Tras un rechazo se cambia
de verdad, no se matiza.

## Mirada 1 · ronda 2 — `direccion.html` · 2026-09-27

**Respuesta al rechazo, causa por causa (se cambió de verdad, no se matizó):**

- **Tipografía.** Salen Space Grotesk y Newsreader. Entran tres familias sobre el MISMO diseño, para
  que la letra se juzgue sola: Inter + JetBrains Mono, IBM Plex Sans + Plex Mono, Geist + Geist Mono
  (conmutador «letra» en la barra de sala). El mono ya no rotula secciones en mayúscula: queda solo
  para datos (huellas, señales, fechas, etiqueta corta del nodo).
- **Magnitud.** Escala cerrada de siete tamaños, declarada en la propia página: título 36 (28 en
  teléfono), sección 20, subtítulo 15, texto 15, secundario 13, dato 12, cifra 28. La ronda 1 tenía
  un titular de ~64 px, cifras de ~60 px y píldoras de veredicto de 40 px; ahora el veredicto es un
  chip de 26 px y las cifras del gancho llevan una barra proporcional en lugar de tamaño.
- **Tarjetas sueltas.** Una rejilla de 12 columnas y 1120 px; filas con filete en lugar de tarjetas.
  Los demos son una tabla (demo · veredicto · corrida · abrir); el espécimen del nodo es una tabla
  tipo × estado que llena el ancho con cajas iguales; las etiquetas «exigido» ya no montan sobre las
  esquinas.
- **Cromo.** Salen el frío (A) y el cálido (B); entra un neutro casi sin tinte, superficies más
  oscuras y filetes más discretos. La paleta de tipos y veredictos no cambia: la búsqueda
  determinista cae en los mismos valores (gate `diseno-tokens` 24/24).
- **Grafo.** Redibujado a 1040 px: cabe entero en escritorio y en teléfono se desliza con índice de
  capas. Nodos de 160 × 56; las dos aristas condicionales ya no se cruzan; la reanudación
  (pausa_humana → fin) usa su línea punteada.
- **Honestidad del gancho.** «Casi nadie planeó qué evaluar» no es una cifra de la encuesta; la fila
  lo dice («La encuesta no lo pregunta. planlang parte de ahí») y no inventa un número.

**Pasada de capturas del builder (antes de entregar):** 24 encuadres (3 letras × 2 temas × 2
idiomas × 380/1280) + 30 con simulación de daltonismo + corrida con movimiento reducido: 0
desbordes, 0 textos fuera del lienzo o de su nodo, fuentes activas cargadas, 0 animaciones.
Ajustes hechos por lo visto: los números de banda se salían 2 px por arriba del lienzo; los nodos
del espécimen medían lo que su texto (cajas desiguales) y el nombre caía a la derecha;
«verificador_cobertura» se partía en dos; la cabecera de la tabla de nodos aparecía apilada en
teléfono; el índice de capas partía en dos líneas a 380 px.

**Preguntas abiertas para el usuario:** ¿orden y tamaños ya bien? · ¿qué letra? · lienzo o lista en
teléfono · hexágono o escudo para «regla».

**Lo que dijo el usuario (2026-09-27, con la página abierta en el preview):**

> «Si ya vamos por buen camino 1. Se ve mas proporcionado 2. Inter 3. No veo ningun telefono.
> TRaata de tener elementos visuales graficos atractivos iconos y cosas asi»

**Veredicto:** la dirección va por buen camino; la proporción queda aprobada; la letra es **Inter**
(con JetBrains Mono para datos). La pregunta 3 no se pudo contestar: la página no mostraba ningún
teléfono (la pregunta suponía abrirla en uno). Pide además **elementos visuales gráficos atractivos:
íconos y cosas así**.

**Qué cambió:** ronda 3 de la mirada 1 (entrada siguiente).

## Mirada 1 · ronda 3 — `direccion.html` · 2026-09-27

**Respuesta a la ronda 2, punto por punto:**

- **Letra:** Inter queda como la letra de la vitrina y del diagrama; JetBrains Mono solo para datos.
  Plex y Geist salen del repo (conmutador «letra» retirado).
- **«No veo ningún teléfono»:** la pregunta suponía abrir la página en un teléfono. Ahora, bajo el
  grafo, hay **dos teléfonos** (iframes de 390 px con esta misma página, sin la sala): A con el grafo
  como lienzo y B como lista por capa. En un teléfono de verdad, esa sección dice que lo que se ve
  ya es la vista de teléfono.
- **«Elementos visuales gráficos atractivos, íconos»:** íconos de línea (Lucide v1.48.0, ISC,
  incrustados, sin CDN) en el rótulo, la navegación, los botones, el gancho, los tres puntos, los
  demos, la pregunta y el pie; baldosas de 36 px al inicio de cada bloque. Franja nueva **«Cómo
  funciona»** con tres miniaturas: el plan (conteos reales del plan del demo A), el grafo del spike
  en miniatura con sus glifos a color, y la brecha (9 criterios como cuadros ✓/✕ y la barra de C5 con
  el hueco rayado entre 0,85 medido y 0,90 objetivo). Los íconos son monocromos: el color sigue
  reservado al tipo de nodo y al veredicto.
- **«Regla»:** hexágono y escudo lado a lado, con el mismo nodo en los dos estados.

**Pasada de capturas del builder:** 16 encuadres (2 páginas × 2 temas × 2 idiomas × 380/1280) con
los teléfonos cargados y sincronizados de tema e idioma + corrida con movimiento reducido: 0
desbordes, 0 textos fuera del lienzo o de su nodo, fuentes cargadas, 0 animaciones. Ajustes por lo
visto: los teléfonos salían vacíos en la captura (el arnés no esperaba a los iframes: con `file://`
su documento no es accesible; ahora espera por la API de marcos); el arnés cambiaba tema e idioma
por atributo y los teléfonos no se enteraban (ahora pulsa los botones); el teléfono A quedaba
desplazado (re-ancla tras cargar la letra); la tarjeta «Medí» tenía un hueco (leyenda 8 · 1).

**Lo que dijo el usuario (2026-09-27, con la página abierta en el preview):**

> «Excelente ahora si muchisimo mejor. 1. No, todo excelente muy buen trabajo 2. Me voy con el A
> 3. Que es regla? 4. lo abrí y apruebo»

**Veredicto: MIRADA 1 APROBADA** («lo abrí y apruebo», con comentario del archivo abierto).
Decisiones selladas:

- **Dirección:** la de la ronda 3: sobria, Inter + JetBrains Mono, escala de siete tamaños, rejilla
  de 12 columnas, filas antes que tarjetas, íconos de línea monocromos, miniaturas gráficas.
- **Grafo en teléfono:** **A · lienzo** que se desliza de lado con índice de capas; la lista por capa
  queda como vista alterna y versión en texto (G10).
- **Glifo de «regla»:** el usuario preguntó qué es «regla» (el tipo de nodo que hace código fijo, sin
  modelo: `aprobar`, `verificador_cobertura`). Se le explicó y se queda el **hexágono** de la
  gramática `agentes-ia` v1.0.0 por defecto, sin enmienda al contrato; si prefiere el escudo, se
  cambia el símbolo. Queda como asunción declarada, no como elección suya.

**Qué cambió:** nada en `direccion.html`. Siguiente: mirada 2 (`design-system.md` v0.1 + `kit.html`
+ `03-agente.html`), según el plan de miradas aprobado.

## Mirada 2 — `design-system.md` v0.1 + `kit.html` + `03-agente.html` · 2026-09-27

**Entregado:**

- `design-system.md` v0.1 (raíz del repo): personalidad (sobrio · exacto · franco), principios,
  tokens con sus valores por tema y contrastes, tipografía (Inter elegida por el usuario, mono solo
  para datos, siete tamaños), espacio y rejilla, radios, bordes (discontinuo = falta o no es real),
  sin sombras, iconografía (Lucide, monocroma), movimiento (150/200/250 ms, reducido = instantáneo),
  idioma, los dos juegos de estados y 18 componentes canon con su uso; anti-patrones.
- `kit.html`: el sistema en vivo. Color leído del CSS generado (hex y contraste se recalculan al
  cambiar de tema), escala tipográfica, espacio y forma, los 36 íconos, movimiento con demo, y cada
  componente con sus estados: botones, chips, veredictos, nodo 5 tipos × 5 estados, arista 3 modos,
  fila de criterio, fila de riesgo, deslizador de umbral, panel de consecuencias, curva
  riesgo-cobertura y ficha de reproducibilidad (contenido · éxito · vacío · cargando · error).
  Datos reales donde existen: latencia mediana del spike (4,74 s, C7 cumple), `costo_estimado` no
  registrado (U2 deshabilitado «no observado»), ficha del spike sin huella de lote.
- `03-agente.html` (P3): el grafo del spike contra el contrato del plan — 3 de 8 nodos, 1 de 8
  aristas condicionales (U1, en `enrutador` y no en `decision`), `aprobar` fuera del contrato; los 5
  nodos exigidos y ausentes punteados; lienzo A (se desliza en teléfono) y lista por capa; detalle
  por selección con texto de líder, de experto, el código real del spike (`spike.py`, líneas
  citadas) y sus trazas; la arista U1 con la distribución de la señal en los 5 casos y el hallazgo
  A-002 (0,75 exacto, 5 campos faltantes, fue a aprobar porque «menor que» no es inclusivo).

**Pasada de capturas del builder:** 48 encuadres (kit y agente × 2 temas × 2 idiomas × 380/1280;
el agente en sus 5 selecciones) + corrida con movimiento reducido en las 4 páginas: 0 desbordes,
0 textos fuera del lienzo o de su nodo, fuentes cargadas, 0 animaciones. Ajustes por lo visto: las
pestañas del detalle se estiraban a todo el ancho; las cabeceras de las tablas de criterio y riesgo
no quedaban sobre sus columnas; la marca «plan» del deslizador chocaba con la perilla (ahora va
debajo del riel); en la curva, la regla de ancho completo agrandaba los íconos de chips y avisos;
una etiqueta de la curva se cortaba en el borde.

**Corrección a `direccion.html` (aprobada):** el espécimen del nodo ponía `aclaracion` como pausa
humana; el contrato la declara `modelo`. Ahora usa un nombre de ejemplo con nota, igual que el kit
(el contrato no declara herramientas ni una segunda pausa humana).

**Lo que dijo el usuario (2026-09-27, con la pantalla del agente abierta en el preview):**

> «0. si aprobado el kit del sistema 1. Si hablamos de esta [URL del preview de `/diseno/03-agente`,
> omitida aquí por la regla de cero enlaces] la verda es que si es simpre pero no se enutnedo por que
> no dice el objetivo que hace que ingresa que actividades desarrolala y que entrega y capacidad cosas
> generales 2. Sime siven pero esperaria mucha mayor informacion segun el perfil 3. pues esta bien solo
> por los comentarios que te di»

**Veredicto:**

- **`kit.html` y `design-system.md` v0.1: APROBADOS** («si aprobado el kit del sistema»). La
  aprobación nombra el artefacto; la evidencia de mirada de la sesión es el comentario del mismo
  mensaje sobre la pantalla del agente, que cita su ruta en el preview. Sobre el kit no hubo
  comentario propio, y así se registra.
- **`03-agente.html`: NO aprobada todavía, pasa a ronda 2.** Lo que funciona: es simple, y las cuatro
  vistas del detalle (líder, experto, código, trazas) sirven. Lo que falta, en palabras del usuario:
  (1) **no se entiende el agente**, porque la pantalla no dice su objetivo, qué hace, qué recibe, qué
  actividades desarrolla, qué entrega ni su capacidad: las generalidades; (2) cada vista necesita
  **mucha más información según el perfil**. El punto 3 condiciona la aprobación a esos dos
  comentarios, así que la pantalla corregida se vuelve a mirar antes de la mirada 3.

**Qué cambia (ronda 2 de P3, entrada siguiente).** El plan de miradas no cambia: es una ronda dentro
de la mirada 2, como las tres rondas de la mirada 1. La mirada 3 no se construye hasta que la
ronda 2 de P3 quede aprobada.

## Mirada 2 · ronda 2 — `03-agente.html` · 2026-09-27

**Respuesta a los dos comentarios, uno por uno (se cambió de verdad, no se matizó):**

- **«No dice el objetivo, qué hace, qué ingresa, qué actividades desarrolla, qué entrega, capacidad,
  cosas generales».** La pantalla abre ahora con **«El agente en una mirada»**: el **objetivo** en una
  frase de líder; **Recibe → Hace → Entrega** en tres columnas unidas por flechas (4 entradas, las
  **7 actividades** del flujo del plan en orden con el nodo que hace cada una, 3 respuestas y la
  traza), cada fila con su marca frente al spike (● corrió · ◐ en parte · ◌ exigido y aún no; hoy
  1 actividad corrió, 1 en parte, 5 faltan); **Puede** (5 capacidades vistas en el spike, cada una
  con su evidencia), **Nunca** (5 reglas del plan con su decisión, criterio o ley) y **Participan**
  (médico, afiliado, auditor, plan de beneficios, el agente); y la **capacidad medida**: 4,74 s por
  caso (mediana, el plan pide ≤ 30 s), ≈ 0,010 USD nominal por caso, ~1,6 mil tokens de contexto,
  2 de 5 casos a una persona (≈ 24 min de auditor), 5 de 5 caminos iguales a la verdad y ≈ 65–70 min
  para un lote de 200 (estimación del spike, con su chip). «Experto» cambia la ficha por la **ficha
  técnica**: arquitectura, grafo, estado (11 claves y las 15 señales que el plan exige en la traza),
  modelo y proveedor, persistencia, evaluación, versiones, la **matriz plan → nodo** (qué decisiones,
  riesgos, supuestos, criterios y umbrales gobiernan cada uno de los 8 nodos del contrato, y si
  corrió) y el código del estado.
- **«Esperaría mucha mayor información según el perfil».** Cada nodo (extractor, enrutador,
  pausa_humana y ahora también `aprobar`, que pasa a ser seleccionable) trae una línea de rol y:
  **Líder**: recibe → nodo → entrega, y hasta siete campos (para qué existe, cómo lo hace, su punto clave,
  si falla, cómo se mide, qué pasó en los 5 casos, lo que aún no hace), cada texto ≤ 50 palabras.
  **Experto**: contrato y estado (lee, escribe, entra desde, sale hacia, lo que el plan le pide),
  configuración o regla, lo que el plan le exige (decisiones, riesgos con prioridad de acción y
  S·O·D, supuestos, criterios, umbrales), lo observado en el spike (latencias, tokens, costo) y las
  brechas frente al contrato. **Código**: firma, qué lee y escribe, y dos o tres bloques copiados del
  spike sin editar (el nodo, su esquema, su instrucción, el armado del grafo, la reanudación).
  **Trazas**: los casos que pasaron por el nodo; cada uno se abre y muestra el texto de la solicitud
  (con su glosa en inglés), lo que el nodo leyó o anotó, los tokens, el costo y la verdad conocida.
  La tabla de ausentes suma **recibe → entrega** por nodo; la arista U1, su lectura de líder, el
  rango jugable y el costo humano.
- **Selección por defecto:** `extractor`, el primer nodo del flujo (antes, `enrutador`).
- **Hallazgo nuevo, a la vista:** ningún modo de falla del plan cubre «aprobar sin verificar
  cobertura»; el plan lo evita con el contrato de grafo, no con un riesgo (panel de `aprobar`,
  chip «brecha no prevista»).
- **Corrección de fidelidad:** el código del enrutador ahora se copia del spike tal cual (la
  ronda 1 abreviaba un comentario y omitía `# type: ignore`); todo bloque se lee de `spike.py`.
- **Sistema:** `design-system.md` sube a 0.2.0 con seis componentes (ficha del agente, flujo del
  nodo, campos por perfil, referencias al plan, matriz plan → nodo, traza abrible), las tres marcas
  de estado y 13 íconos nuevos de la misma versión de Lucide. El kit aprobado no se toca; los
  componentes entran a él al consolidar G-Diseño.

**Pasada de capturas del builder (antes de entregar):** 64 encuadres (agente en sus 6 selecciones,
kit y dirección × 2 temas × 2 idiomas × 380/1280) + 60 con simulación de daltonismo (el agente a
1280 en sus 6 selecciones × 2 temas × normal, deutan, protan, tritan y acromatopsia) + corrida con
movimiento reducido en las tres páginas: 0 desbordes, 0 textos fuera del lienzo o de su nodo,
fuentes cargadas, 0 animaciones. Leídos como imagen: ficha líder y experto, las cuatro vistas del
extractor, trazas de la pausa en claro e inglés, ausentes, arista, y la ficha, los paneles y la
matriz a 380 px. Ajustes por lo visto: el panel perdía su rejilla al mostrarse (la sala lo abre con
`display: revert`); en la tabla de ausentes el texto de «recibe → entrega» se partía palabra por
palabra (una regla alcanzaba los spans de idioma); el chip de estimación heredaba 14 px; los chips
de tipo se estiraban en las trazas; en teléfono el número de faltantes quedaba sin rótulo y la
marca de la matriz sin etiqueta.

**Preguntas para el usuario:** ¿ahora se entiende qué es el agente? · ¿cada perfil trae lo que
esperabas? · «lo abrí y apruebo» para pasar a la mirada 3.

**Lo que dijo el usuario (2026-09-27, con la página abierta en el preview):**

> «Claro muchisimo mejor 1. Si se entiende perfecto muy buen trabajo 2. Igualmente el perfil perfecto
> tambien aprobado 3. lo abrí y apruebo»

**Veredicto: MIRADA 2 APROBADA** («lo abrí y apruebo», con comentario de la página abierta). Queda
sellado:

- **Kit y `design-system.md`** (aprobados en la primera entrega de la mirada 2) con los seis
  componentes de la 0.2.0.
- **P3 Agente, ronda 2:** la ficha general va ANTES del diagrama (objetivo · recibe → hace → entrega ·
  puede / nunca / participan · capacidad medida, y ficha técnica para expertos) y cada nodo trae los
  cuatro perfiles con contenido denso. El usuario confirma que se entiende y que los perfiles están
  completos.
- **Regla para las pantallas que siguen:** toda pantalla abre con su ficha general («qué es, qué
  recibe, qué produce») y trae su detalle por perfil. Se aplica desde la mirada 3.

**Qué cambió:** nada en `03-agente.html`. Siguiente: mirada 3 (`04-brecha.html` +
`05-playground.html`), según el plan de miradas aprobado.

## Mirada 3 — `04-brecha.html` + `05-playground.html` · 2026-09-27

**Cambio de fuente de datos, declarado (decisión 7 del plan de la etapa):** el plan preveía un lote de
20 de *maqueta* (inventado) para Brecha y Playground, porque al arrancar la etapa no había corrida. El
S1 ya la tiene: `runs/demo-a/suscripcion-planlang-a-001-20-v1.2` (plan v1.2, 20 casos sintéticos,
3 repeticiones y una línea base de agente único) con su informe real del verificador 1.0.0 (huella
`691e0e37…`). Las dos pantallas usan esos datos, leídos solo de la rama del S1 (`git show`, sin tocar
su árbol). Mostrar números inventados cuando existen los reales contradice «jamás se simula lo que no
corrió». El plan de miradas no cambia.

**Lo que dice la corrida real:** **cumple con alertas**. 9 de 9 criterios; 0 de 8 riesgos; S2
confirmado, **S3 refutado** (el multiagente acierta más, 100 % frente a 85 %, pero tarda más,
11,8 s frente a 9,3 s), **S1 sin probar** (los 15 casos fueron aciertos: sin errores no existe
AUROC); **5 brechas no previstas** (el modelo no entregó la salida estructurada al primer intento);
0 diferencias al rehacer 233 decisiones en TypeScript.

**El criterio fallido que pide la orden** («un criterio fallido visible»), para el gate de lectura
de G-Diseño: la corrida real no tiene ninguno, así que la sala trae el estado **«maqueta: no
cumple»**. Cambian el veredicto, el resumen, C5 (85 % frente a 90 %, con la brecha rayada) y R5
(ocurrió en 2 de 14), con números inventados y rotulados; lo demás sigue siendo la corrida real.
Lo que falló *de verdad* (S3 refutado y las 5 brechas no previstas) queda al frente en el resumen.

**Entregado:**

- **`04-brecha.html` (P4):** ficha «El informe en una mirada» (veredicto, frase para quien decide,
  recomendación del verificador, seis cifras; el verificador recibe → hace 8 pasos sin modelo →
  entrega; índice de las 9 secciones). Las 9 secciones de § 12 en su orden: resumen con el porqué
  del veredicto; plan en breve (problema, 7 pasos, decisiones de una vía); 9 criterios con regla,
  medido frente al objetivo y casos que incumplen; 8 riesgos con prioridad de acción, S·O·D y
  detector, más el contrato de grafo (visitas por nodo) y la prueba cruzada Python ↔ TypeScript;
  brechas no previstas y evaluadores; supuestos con la curva riesgo-cobertura de S1 y la
  comparación multiagente frente a agente único de S3; 4 casos ejemplares con su cadena de nodos
  (el fallido, vacío: «no se inventa uno»); umbrales jugables con lo observado; ficha de
  reproducibilidad con todas las huellas. «Leer como» líder o experto (el experto ve reglas,
  condiciones de los detectores, medidas y evaluadores). Estados: corrida real · maqueta no cumple ·
  cargando · error (huella alterada) · vacío.
- **`05-playground.html` (P5):** ficha «El playground en una mirada»; los 4 deslizadores del plan
  (U1–U3 y el interruptor del modo Texas) con regla, marca del plan y «movido desde»; panel de
  consecuencias en vivo sobre las **señales reales** de los 20 casos (casos que cambian, errores
  introducidos y evitados, minutos de auditor, criterios que dependen de los umbrales); lista de
  casos que cambian con antes → ahora por forma, el porqué y su consecuencia; curva riesgo-cobertura
  con tabla por umbral; límites del informe. La sala trae escenarios listos: U1 = 0,90 (A-008 a una
  persona, +12 min), **U2 = 1600 (A-010 saldría sin persona: error introducido real y C3 no
  cumple)**, U3 = 0 (+24 min), U3 = 3 (A-007 «no observado»), modo Texas (0 cambios), cargando,
  error. Comprobación: con los valores del plan, el recálculo de la sala reproduce el camino de los
  20 casos.
- **Sistema:** `design-system.md` 0.3.0 (perfil de lectura, franja de divulgación del oráculo,
  veredicto al frente, índice del informe, visitas por nodo, cadena de nodos, supuesto con su
  prueba, comparación de dos variantes, casos ejemplares, aviso de estado de maqueta, lista de
  casos que cambian); la mono sin ligaduras (el código se ve tal cual); la letra de las gráficas
  crece en teléfono. `03-agente.html` solo gana los enlaces a Brecha y Playground en su barra.

**Pasada de capturas del builder:** 168 encuadres (Brecha en 5 estados, Playground en 8, Agente,
kit y dirección × 2 temas × 2 idiomas × 380/1280) + 130 con simulación de daltonismo (Brecha y
Playground a 1280 en todos sus estados × 2 temas × 5 vistas) + corrida con movimiento reducido en
las 5 páginas: 0 desbordes, 0 textos fuera del lienzo, fuentes cargadas, 0 animaciones. Leídos como
imagen: Brecha completa en oscuro, «no cumple» en claro e inglés con perfil experto, teléfono; los
cinco escenarios del playground, claro e inglés con experto, teléfono y escala de grises. Ajustes
por lo visto: la cifra de supuestos se partía; las etiquetas de la curva de S1 se enciman (en
teléfono se ocultan); «2 de 2» heredaba 12 px; R5 decía «0 %» junto a «ocurrió» en el estado de
maqueta; la mono dibujaba `!=` como `≠`; el glifo de «a una persona» salía diminuto; los chips de
consecuencia se salían del panel; la tabla de la curva se apilaba en teléfono.

**Pendiente, anotado para la mirada 4:** la franja «Cómo funciona» de `direccion.html` muestra C5
fallido (rotulado «maqueta»); la Entrada final (P1) usará el veredicto real. Y P3 muestra el grafo
del spike (3 de 8 nodos), mientras el agente del S1 ya tiene los 8: se propondrá al usuario si P3
pasa al grafo real del S1 y guarda el spike como ejemplo del estado «exigido y ausente».

**Lo que dijo el usuario (2026-09-27, con las dos páginas abiertas en el preview):**

> «0. Antes que nadacada vez que me hagas mirar algo construye una matriz donde me digas que revisar
> y que deberia mirar. 0.1. Brecha esta letra "El plan se cumplió: 9 de 9 criterios y ningún riesgo
> ocurrió. Pero un supuesto quedó refutado, otro no se pudo probar y aparecieron 5 fallas que el plan
> no preveía." está muy grande, segundo pues si se ve que algo falla peor no se ve que exactamente.
> 0.2Playground en cambio esta esa muy bien al mover lor elementos va arrojando alertas. 1. No me
> queda claro que s e cumplio y que fallo 2. Si esta claro muy bien trabajo 3. No veo que cambie nada
> o noe s evidente la verdad 4. No hay que revisar»

**Veredicto: MIRADA 3 NO APROBADA — ronda 2.** Por partes:

- **Playground:** se entiende («Si esta claro muy bien trabajo»; «al mover los elementos va
  arrojando alertas»). Su contenido queda; solo le toca el arreglo de perfiles.
- **Brecha:** no se entiende qué se cumplió y qué falló. La frase del resumen tiene la letra muy
  grande, y la página dice *que* algo falló sin decir *qué* exactamente.
- **Perfiles líder y experto (las dos páginas):** el cambio no se ve o no es evidente.
- **Regla nueva del usuario, desde esta ronda y para toda mirada:** cada entrega trae una **matriz de
  qué revisar y qué debería ver** (pantalla · dónde · qué hacer · qué debe verse).
- La respuesta 4 («No hay que revisar») se lee como «no: hay que revisar» — no aprueba.

**Qué cambia en la ronda 2:** (1) la frase del resumen baja a la escala de lectura; (2) Brecha abre
con un balance «qué se planeó · qué pasó» renglón por renglón, cada uno con su marca (cumplió ·
alerta · falló), qué pasó exactamente, en qué casos y qué significa; (3) «Leer como» cambia lo
primero que se ve, dice qué cambió y marca cada bloque propio del perfil, en Brecha y en Playground;
(4) el mensaje de la mirada trae la matriz.

## Mirada 3, ronda 2 — `04-brecha.html` + `05-playground.html` · 2026-09-27

Responde a lo que el usuario dijo en la ronda 1: Brecha no decía qué se cumplió y qué falló, la frase
del veredicto tenía la letra muy grande y el cambio de perfil no se notaba. El contenido del
Playground, que se entendió, no cambia; solo su perfil. El plan de miradas no cambia.

**Brecha — la ficha abre con el balance, en este orden:**

1. **Veredicto y frase a escala de lectura** (15 px, antes 17). La frase nombra lo que falló: «Fallaron
   dos cosas: repartir el trabajo entre varios agentes resultó más lento que un solo agente (S3), y 5
   veces el modelo respondió fuera del formato pedido. Y quedó sin probar si su confianza es fiable
   (S1).» Todas las entradillas de sección bajan también a 15 px.
2. **«El plan frente a la corrida»**, una matriz: seis partes del plan (criterios, riesgos, supuestos,
   lo no previsto, grafo exigido, prueba cruzada) × se cumplió · falló · sin probar, con la cuenta y los
   identificadores; las cifras de «Falló» y «Sin probar» llevan a su renglón.
3. **«Lo que falló»**, renglón por renglón (S3 y las respuestas fuera de formato; en el estado de
   maqueta, también C5 y R5): qué se planeó · qué pasó · qué significa, con sus casos y la sección
   donde se detalla.
4. **«Lo que quedó sin probar»** (S1) y **«Se cumplió, con una nota»** (C7: A-008 tardó 31,2 s aunque la
   mediana cumple; C3: medido sobre 3 casos, y en el playground con U2 = 1600 deja de cumplirse).
5. **«Lo que se cumplió, uno por uno»**: los 9 criterios y los 8 riesgos por su nombre, cada uno con su
   marca y su cifra, más S2, el grafo completo y la prueba cruzada.
6. **«Cómo se obtuvo este informe»**: recibe → hace → entrega del verificador, y el índice. § 1 deja
   de repetir el porqué y apunta al balance.

**Perfil evidente, en las dos páginas:**

- Un **aviso de perfil** bajo el título dice qué ve quien lee y trae el botón para cambiar («Ver como
  experto» · «Volver a líder»); como experto, cuenta los bloques propios del perfil (30 en Brecha, 8
  en Playground). El conmutador también está en la barra de sala.
- **Lo que cambia se ve en la parte de arriba:** en Brecha la frase pasa a cifras exactas, la columna
  «Qué pide el plan» a reglas, y las columnas de «Lo que falló» a regla de medición · medido ·
  evidencia; bajo cada criterio y riesgo aparece su regla.
- **Bloques del experto marcados**: fondo elevado, filete y el rótulo «Experto» (Inter, sin mayúsculas
  espaciadas: el anti-patrón de la mono vale también aquí).
- Al cambiar, lo que aparece entra con un fundido de 0,45 s (`opacity` y `transform`); con movimiento
  reducido no hay fundido.
- **Playground, líder:** un ejemplo llano en la ficha (U1 a 0,90 → A-008 a una persona, +12 min, sin
  error nuevo) y, bajo las cifras, una frase que se reescribe con cada movimiento y nombra casos y
  criterios («Eso es un error: A-010 necesitaba a una persona… Deja de cumplirse C3.»).
- **Playground, experto:** ficha técnica; «La regla de decisión, con tus valores», escrita con las
  aristas del contrato del plan en su orden y el valor movido subrayado; «Las 20 decisiones, con sus
  señales», con ■ en los casos que cambian.

**Encontrado al construir (no lo pidió el usuario):** los **12 minutos por revisión** del playground
no salen del plan v1.2 ni de la planeadora: eran un supuesto de esta maqueta sin rótulo. Ahora
llevan su chip «maqueta» y una nota que lo dice. Para el plan: la carga humana en minutos (VISION,
funcionalidad del playground) necesita que el plan declare cuánto tarda una revisión. Se anota como
propuesta para la planeadora; no se escribe allá.

**Fuente de datos:** la rama del S1 se borró al mergearse; los generadores leen ahora de `main`
(`git show main:…`). Los datos extraídos salen idénticos byte a byte.

**Matriz de mirada (regla nueva del usuario):** cada página trae al pie «Qué revisar y qué deberías
ver» (dónde · qué hacer · qué deberías ver); el mensaje de la mirada la repite.

**Pasada de capturas del builder:** 280 encuadres (Brecha en 5 estados y Playground en 8, más Agente,
kit, dirección e índice, × 2 temas × 2 idiomas × 380/1280 × perfil líder y experto donde existe) +
260 con simulación de daltonismo (Brecha y Playground a 1280 × 2 perfiles × 5 vistas) + medida con
movimiento reducido: 0 desbordes, 0 textos fuera del lienzo, fuentes cargadas, 0 animaciones. El
arnés suma `--perfiles lider,experto`. Leídos como imagen: la ficha de Brecha en líder y experto,
oscuro y claro, español e inglés, teléfono; el estado «no cumple»; las secciones 3 y 6 en experto;
el Playground en líder con U2 = 1600 y en experto con la regla viva y la tabla de 20, en teléfono.
Frases del líder comprobadas en los 6 escenarios × 2 idiomas, sin errores de guion.

**Demo en rojo de la medida de movimiento reducido con el fundido nuevo:** quitar solo la guarda
local no la pone en rojo, porque la regla global (`animation: none` bajo movimiento reducido) ya lo
cubre; en una copia sin las dos guardas, la medida ve 9 animaciones; con la hoja real, 0.

**Ajustes por lo visto en las capturas:** sellos estirados a todo el ancho; el ícono de la matriz era
la marca de «cumplió» (ahora uno neutro); «8 de 8» se partía; los títulos de grupo se partían en
columnas en teléfono; la cifra de cada criterio le quitaba ancho a la regla en teléfono; el chip
«maqueta» quedaba dentro del enlace; la frase del líder repetía el error dos veces; «no observado»
también; la tabla de 20 no tenía aire arriba ni el rótulo «Tipo»; el rótulo del experto iba en mono
y mayúsculas espaciadas.

**Lo que dijo el usuario:** _(pendiente)_

