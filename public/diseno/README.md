# Etapa de Diseño — maqueta de fundación de planlang (F2a)

> Este directorio se llena ANTES de cualquier código de producto. La orden de diseño de la
> planeadora (`portafolio/planlang/ordenes/DISENO-orden.md`) manda; este archivo registra el
> resultado. Regla dura: cero React, cero motores, cero `src/` de producto hasta que el usuario
> apruebe **G-Diseño** sobre la maqueta desplegada en Vercel. El S1 «El contrato y la corrida»
> corre en paralelo en `sprint-001/contrato-y-corrida` (excepción registrada F1) y no se mezcla.

## Cómo abrir la maqueta

- **En local:** doble clic en `docs/diseno/index.html` (sin red, sin build).
- **En el preview de Vercel del PR** (protegido: pide tu sesión): ruta `/diseno/index.html`.
  La URL vive en la planeadora y en el chat, jamás aquí.
- **Dónde están los archivos de verdad:** en `public/diseno/` (Next los sirve tal cual, sin paso
  de copia ni dependencia del comando de build de Vercel); `docs/diseno/` es un enlace simbólico a
  esa carpeta para respetar la ruta que el kit y las órdenes citan. Nació así tras la mirada 1: el
  preview no servía `/diseno/…` porque Vercel no ejecutó el script que copiaba la maqueta.
- Cada página trae su **barra de sala**: estado · tema (oscuro/claro) · idioma (ES/EN). Lo que hay
  que mirar está en la nota bajo la barra. Todo lo que ves es utilería de sala, no producto.

## Qué vive aquí

- `index.html` — el recorrido de sala: todas las pantallas en orden de flujo.
- `direccion.html` — **mirada 1**: dos direcciones de identidad (A «Instrumento» · B «Acta») sobre la
  Entrada (P1), el nodo del grafo, un fragmento del grafo real del spike, los tres veredictos y la
  tipografía.
- `kit.html` _(mirada 2)_ — el design system en vivo: componentes canon y sus 5 estados.
- `01-entrada.html … 07-fichas.html` _(miradas 2–4)_ — una página por pantalla, HTML autocontenido
  (cero CDNs, cero frameworks), 380 px y desktop, oscuro y claro, ES y EN.
- `assets/` — `tokens.{json,css}` (**GENERADOS** por `pnpm tokens` desde `scripts/paleta/generar-tokens.mjs`),
  `planlang.css` (identidad), `diagrama.css` (gramática visual del visor), `fuentes/` (woff2 + OFL),
  `maqueta.{css,js}` y `lienzo.js` (utilería de sala).
- `MIRADAS.md` — cada mirada: lo que el usuario dijo, textual, y lo que cambió.
- La maqueta es **referencia, no producto**: el S2 la reproduce; el gate de FIDELIDAD del primer
  sprint con UI compara contra ella. El grafo del visor es el único diagrama dibujado a mano de la
  app (regla dura 11): el S2 lo genera con el diagramador o mermaid estático y los golden files lo reproducen.

## Decisiones de diseño que la orden no escribió (declaradas antes de construir)

Las doce están en el plan aprobado de la etapa (2026-09-26) y se resumen aquí para que la mirada las
valide a la vista: (1) fuente del diagrama = la del reusable (Space Grotesk + JetBrains Mono; big-d fijó la
tabla de métricas); (2) glifos de `agentes-ia` tal cual, como paths; (3) en teléfono el lienzo se desliza
de lado y la lista por capa es vista alterna y versión en texto; (4) rótulo «Simulación · no operativo»

- «datos 100 % sintéticos» y divulgación de oráculo en el pie; (5) curva riesgo-cobertura con X =
  cobertura, Y = riesgo, punto del plan; (6) inclusividad visible en cada umbral; (7) chip de procedencia
  en toda cifra (real · spike vs maqueta); (8) visor sobre el grafo del spike con los nodos exigidos y
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
| 2026-09-26 | `direccion.html` (mirada 1) | _(pendiente)_                   | nada todavía            |

## Gates de esta etapa y su demo en rojo (regla 15 del kit)

| Gate                               | Qué vigila                                                                                                                                                    | Rojo visto (2026-09-26)                                                                                                                                                                                                                       | Verde                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `tests/unit/diseno-tokens.test.ts` | deriva generador ↔ `tokens.{json,css}` · contraste ≥ 3:1 de trazos y ≥ 4,5:1 de tintas · tintas vetadas como texto · distancia entre cromáticos bajo 7 vistas | (a) naranja `tipo-4` forzado a L 0,86 en claro sin restricción: **2 fallos**, «tipo-4 sobre sup-1: expected 1.4885 to be ≥ 3» en ambos cromos; (b) un hex editado a mano en `tokens.css`: «tokens.css es lo que el generador produce» en rojo | 30/30 tras restaurar y regenerar                        |
| `scripts/capturar-maqueta.mjs`     | desborde horizontal a 380 px · texto fuera del lienzo · fuentes cargadas · animaciones con movimiento reducido                                                | primera corrida sobre `direccion.html`: **12 fallos** «desplazamiento horizontal de 840px» a 380 px (el lienzo ensanchaba la rejilla: `min-width: auto`)                                                                                      | 0 desbordes tras `min-width: 0` en los hijos de rejilla |

## Cobertura (se llena durante la etapa)

| Página de la maqueta | Funcionalidad de la VISION                                          | Estados que muestra                                                                                                                              |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `direccion.html`     | Página de entrada (P1) · el nodo de «El grafo real desde el código» | dirección A · dirección B · oscuro y claro · ES y EN · 380 px y desktop · nodo normal / seleccionado / exigido-ausente · lienzo y lista por capa |

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
