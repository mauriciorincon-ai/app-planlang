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

**Lo que dijo el usuario:** _(pendiente)_

**Qué cambió:** _(pendiente)_

