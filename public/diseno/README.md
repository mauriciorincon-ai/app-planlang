# Etapa de Diseño — maqueta de fundación de planlang (F2a)

> Este directorio se llena ANTES de cualquier código de producto. La orden de diseño de la
> planeadora (`portafolio/planlang/ordenes/DISENO-orden.md`) manda; este archivo registra el
> resultado. Regla dura: cero React, cero motores, cero `src/` de producto hasta que el usuario
> apruebe **G-Diseño** sobre la maqueta desplegada en Vercel. El S1 «El contrato y la corrida»
> corre en paralelo en `sprint-001/contrato-y-corrida` (excepción registrada F1) y no se mezcla.

## Cómo abrir la maqueta

- **En local:** doble clic en `docs/diseno/index.html` (sin red, sin build).
- **En el preview de Vercel del PR** (protegido: pide tu sesión): ruta `/diseno` (recorrido) y
  `/diseno/direccion` (mirada 1). **Sin `.html`:** el builder de Vercel para `next export` sirve
  cada HTML del `out/` por su nombre limpio; `vercel.json` lleva `cleanUrls: true` para que la ruta
  con `.html` (la que usan los enlaces internos de la maqueta, necesarios en local) redirija a la
  limpia en vez de dar 404. La URL vive en la planeadora y en el chat, jamás aquí.
- **Dónde están los archivos de verdad:** en `public/diseno/` (Next los copia a `out/` en la
  exportación, sin paso de copia propio); `docs/diseno/` es un enlace simbólico a esa carpeta para
  respetar la ruta que el kit y las órdenes citan. Nació así tras la mirada 1, cuando el preview
  daba 404 en `/diseno/…`: la causa real no era el paso de copia sino el nombre limpio de Vercel.
- Cada página trae su **barra de sala**: estado · tema (oscuro/claro) · idioma (ES/EN). Lo que hay
  que mirar está en la nota bajo la barra. Todo lo que ves es utilería de sala, no producto.

## Qué vive aquí

- `index.html` — el recorrido de sala: todas las pantallas en orden de flujo.
- `direccion.html` — **mirada 1, ronda 3**: una identidad sobria en Inter sobre la Entrada (P1) con
  íconos y la franja «Cómo funciona», el nodo del grafo (tipo × estado), un fragmento del grafo real
  del spike, dos teléfonos con la página a 390 px (lienzo y lista), hexágono y escudo lado a lado, los
  tres veredictos y la escala tipográfica. Las rondas 1 y 2 viven en la historia de git.
- `kit.html` — **mirada 2, aprobado**: el design system en vivo (tokens leídos del CSS generado, componentes canon
  con sus estados). El documento fuente es `design-system.md`, en la raíz del repo.
- `03-agente.html` — **mirada 2, ronda 2**: P3, primero la ficha del agente (objetivo, recibe → hace → entrega, puede / nunca /
  participan, capacidad medida; ficha técnica para expertos) y después el grafo real del spike contra el contrato del plan, con
  detalle por nodo en cuatro perfiles (líder, experto, código, trazas abribles).
- `04-brecha.html` — **mirada 3**: P4, el informe de brecha REAL de la corrida v1.2 del S1 en sus 9 secciones, con «Leer como»
  líder o experto y el estado «maqueta: no cumple» para ver un criterio fallido.
- `05-playground.html` — **mirada 3**: P5, los 4 umbrales del plan sobre las señales reales de 20 casos, con consecuencias en vivo,
  casos que cambian, curva riesgo-cobertura y escenarios de sala. `assets/perfil.js` es el conmutador «Leer como».
- `01-entrada.html`, `02-plan.html`, `06-caso.html`, `07-fichas.html` _(mirada 4)_ — una página por pantalla, HTML autocontenido
  (cero CDNs, cero frameworks), 380 px y desktop, oscuro y claro, ES y EN.
- `assets/` — `tokens.{json,css}` (**GENERADOS** por `pnpm tokens` desde `scripts/paleta/generar-tokens.mjs`),
  `planlang.css` (identidad), `diagrama.css` (gramática visual del visor), `fuentes/` (Inter y
  JetBrains Mono, woff2 + OFL), `iconos/` (licencia ISC de Lucide; los íconos van incrustados en cada
  página),
  `sprite.js` (glifos, marcas e íconos compartidos), `maqueta.{css,js}` y `lienzo.js` (utilería de sala).
- `MIRADAS.md` — cada mirada: lo que el usuario dijo, textual, y lo que cambió.
- La maqueta es **referencia, no producto**: el S2 la reproduce; el gate de FIDELIDAD del primer
  sprint con UI compara contra ella. El grafo del visor es el único diagrama dibujado a mano de la
  app (regla dura 11): el S2 lo genera con el diagramador o mermaid estático y los golden files lo reproducen.

## Decisiones de diseño que la orden no escribió (declaradas antes de construir)

Las doce están en el plan aprobado de la etapa (2026-09-26) y se resumen aquí para que la mirada las
valide a la vista: (1) ~~fuente del diagrama = la del reusable (Space Grotesk + JetBrains Mono)~~
**cambiada en la mirada 1**: el usuario rechazó Space Grotesk y eligió **Inter** (ronda 2); el diagrama usa
Inter y el summary propone al diagramador su tabla de métricas (G15); (2) glifos de `agentes-ia` tal cual, como paths; (3) en teléfono el lienzo se desliza
de lado y la lista por capa es vista alterna y versión en texto; (4) rótulo «Simulación · no operativo»
con «datos 100 % sintéticos» y divulgación de oráculo en el pie; (5) curva riesgo-cobertura con X =
cobertura, Y = riesgo, punto del plan; (6) inclusividad visible en cada umbral; (7) chip de procedencia
en toda cifra (real · spike vs maqueta) — **cambiada en la mirada 3**: Brecha y Playground usan la corrida real v1.2 del S1
(existe desde el 2026-09-27); el criterio fallido queda como estado de maqueta rotulado; (8) visor sobre el grafo del spike con los nodos exigidos y
  ausentes marcados; (9) un matiz por tipo y por veredicto, claridad por búsqueda determinista bajo 7
  vistas; (10) fichas en la piel de CV Viva; (11) textos EN redactados aquí; (12) JS mínimo de sala.

## Plan de miradas (parte del gate; cambios se aprueban ANTES de construir el siguiente artefacto)

| Mirada       | Artefacto(s)                                                                          | Qué se decide                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1            | `direccion.html`                                                                      | dirección (A, B o mezcla) · lienzo vs lista en teléfono · glifo de `regla`                     |
| 2            | `design-system.md` v0.1 + `kit.html` + `03-agente.html`                               | tokens y paleta · componentes canon × 5 estados · nodo, arista condicional y ausencia          |
| 3            | `04-brecha.html` + `05-playground.html`                                               | las dos ★: informe con sus fallas · umbrales, consecuencias, curva, «no observado», modo Texas |
| 4            | `01-entrada.html` + `02-plan.html` + `06-caso.html` + `07-fichas.html` + `index.html` | tesis en una pantalla · plan llano · traza y documento adverso · fichas                        |
| 5 = G-Diseño | todo, desplegado, en teléfono y desktop, oscuro y claro, ES y EN                      | «apruebo G-Diseño» + gate ⭐ de lectura                                                        |

## Registro de miradas

| Fecha      | Artefacto                   | Veredicto del usuario (textual) | Qué se construyó encima |
| ---------- | --------------------------- | ------------------------------- | ----------------------- |
| 2026-09-27 | `direccion.html` (mirada 1) | «No me gusta esta horrible realmente muy malo tipografia elementos de magnitud desproporcionada (muy grandes) tarjetas como tirada por ahi sin ningun sentido muy mal» | nada: se rehace la mirada 1 (ronda 2) |
| 2026-09-27 | `direccion.html` (mirada 1, ronda 2) | «Si ya vamos por buen camino 1. Se ve mas proporcionado 2. Inter 3. No veo ningun telefono. TRaata de tener elementos visuales graficos atractivos iconos y cosas asi» | ronda 3: Inter fija, íconos y gráficos, teléfonos dentro de la página, hexágono y escudo lado a lado |
| 2026-09-27 | `direccion.html` (mirada 1, ronda 3) | «Excelente ahora si muchisimo mejor. 1. No, todo excelente muy buen trabajo 2. Me voy con el A 3. Que es regla? 4. lo abrí y apruebo» — **mirada 1 aprobada** | mirada 2: `design-system.md` v0.1 + `kit.html` + `03-agente.html` (lienzo A; regla = hexágono por defecto, explicado) |
| 2026-09-27 | `design-system.md` v0.1 + `kit.html` + `03-agente.html` (mirada 2) | «0. si aprobado el kit del sistema 1. Si hablamos de esta [URL del preview omitida: regla de cero enlaces] la verda es que si es simpre pero no se enutnedo por que no dice el objetivo que hace que ingresa que actividades desarrolala y que entrega y capacidad cosas generales 2. Sime siven pero esperaria mucha mayor informacion segun el perfil 3. pues esta bien solo por los comentarios que te di» — **kit y design system aprobados**; P3 a ronda 2 | ronda 2 de `03-agente.html`: ficha del agente (objetivo, recibe, hace, entrega, capacidad) y vistas por perfil mucho más completas; la mirada 3 espera |
| 2026-09-27 | `03-agente.html` (mirada 2, ronda 2) | «Claro muchisimo mejor 1. Si se entiende perfecto muy buen trabajo 2. Igualmente el perfil perfecto tambien aprobado 3. lo abrí y apruebo» — **mirada 2 aprobada** | mirada 3: `04-brecha.html` + `05-playground.html`, cada una con su ficha general y detalle por perfil |
| 2026-09-27 | `04-brecha.html` + `05-playground.html` (mirada 3) | _(pendiente)_ | nada todavía |

## Gates de esta etapa y su demo en rojo (regla 15 del kit)

| Gate                               | Qué vigila                                                                                                                                                    | Rojo visto (2026-09-26)                                                                                                                                                                                                                       | Verde                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `tests/unit/diseno-tokens.test.ts` | deriva generador ↔ `tokens.{json,css}` · contraste ≥ 3:1 de trazos y ≥ 4,5:1 de tintas · tintas vetadas como texto · distancia entre cromáticos bajo 7 vistas | (a) naranja `tipo-4` forzado a L 0,86 en claro sin restricción: **2 fallos**, «tipo-4 sobre sup-1: expected 1.4885 to be ≥ 3» en ambos cromos; (b) un hex editado a mano en `tokens.css`: «tokens.css es lo que el generador produce» en rojo | 30/30 tras restaurar y regenerar                        |
| `scripts/capturar-maqueta.mjs`     | desborde horizontal a 380 px · texto fuera del lienzo · fuentes cargadas · animaciones con movimiento reducido                                                | primera corrida sobre `direccion.html`: **12 fallos** «desplazamiento horizontal de 840px» a 380 px (el lienzo ensanchaba la rejilla: `min-width: auto`)                                                                                      | 0 desbordes tras `min-width: 0` en los hijos de rejilla |
| `capturar-maqueta` · texto dentro de su nodo (ronda 2) | que el nombre y la etiqueta de cada nodo del lienzo quepan en su caja con 4 px de aire, en las tres letras | 2026-09-27: nombre forzado a «aprobar_sin_revision_humana», **3 fallos** «nodo … (33 / 29 / 32 px de más)» en Inter, Plex y Geist; con Inter solo lo ve esta medida (el texto aún cabía en el lienzo) | 0 fallos al revertir |

## Cobertura (se llena durante la etapa)

| Página de la maqueta | Funcionalidad de la VISION                                          | Estados que muestra                                                                                                                              |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `direccion.html`     | Página de entrada (P1) · el nodo de «El grafo real desde el código» | ronda 3: Inter · íconos · «Cómo funciona» · oscuro y claro · ES y EN · 380 px y desktop · dos teléfonos (lienzo y lista) · nodo normal / seleccionado / exigido-ausente · hexágono y escudo |
| `kit.html`           | el sistema de diseño (transversal) | tokens en vivo por tema · 5 tipos × 5 estados de nodo · 3 modos de arista · criterio, riesgo, consecuencias, curva y ficha en contenido / éxito / vacío / cargando / error · deslizador en reposo / movido / foco / deshabilitado / booleano |
| `04-brecha.html`     | Verificador de brecha ★ (P4) | corrida real v1.2 · maqueta no cumple (C5 y R5) · cargando · error · vacío · líder y experto · las 9 secciones de § 12 · oscuro y claro · ES y EN · 380 px y desktop |
| `05-playground.html` | Mover los umbrales del plan ★ (P5) | en el plan · U1 0,90 · U2 1600 (error introducido, C3 falla) · U3 0 · U3 3 (no observado) · modo Texas · cargando · error · líder y experto · curva y tabla · oscuro y claro · ES y EN · 380 px y desktop |
| `03-agente.html`     | El grafo real desde el código (P3) | ronda 2: ficha del agente líder / experto · selección extractor / enrutador / pausa_humana / aprobar / arista U1 / ausentes · líder · experto · código · trazas cerradas y abiertas · lienzo A y lista por capa · oscuro y claro · ES y EN · 380 px y desktop |

## Registro de G-Diseño (se llena al cerrar la etapa)

| Campo                        | Valor                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Veredicto del usuario**    | _(pendiente)_ — aprobado / aprobado con notas                                                       |
| **Fecha**                    |                                                                                                     |
| **Rondas de sala de diseño** |                                                                                                     |
| **Dónde se aprobó**          | preview de Vercel del PR de `diseno/fundacion` (la URL vive en la planeadora, jamás aquí: regla 17) |
| **Decisiones selladas**      |                                                                                                     |
| **Notas del usuario**        |                                                                                                     |

**Sin este registro lleno, G-Diseño no está aprobado y ninguna orden de construcción se ejecuta.**
