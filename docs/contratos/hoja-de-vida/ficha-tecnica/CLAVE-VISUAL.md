# Clave visual y contrato de la «Ficha técnica» — v1.3.1

> **v1.3.1 (2026-09-09):** PARCHE. `galeria[].archivo` debe ser una ruta relativa **de
> verdad**: se rechazan `..` y la raíz `/`, que antes pasaban y dejaban a la galería apuntar
> fuera de su carpeta. **No se impone una forma de carpetas** — organiza tus capturas como
> quieras — solo no se puede salir. Ninguna ficha entregada hasta hoy se ve afectada.
>
> **v1.3.0 (2026-09-09):** ADITIVO. Dos claves opcionales para la pieza que **produce datos** —un
> tablero, y mañana lo que sea—: **`conclusiones`** (3–6 tarjetas: `cifra` ≤16, `unidad` ≤24
> opcional, `titulo` ≤60, `texto` ≤240, y `fuente` obligatoria como en toda cifra) y **`galeria`**
> (1–12 pantallas reales: `archivo` ruta relativa a la ficha, `pie` ≤80). Las propuso la casa que
> produce los tableros y se adoptaron tal cual. En la ficha son dos secciones más —«Lo que dicen los
> datos» tras «Para quién», «Cómo se ve» tras «Qué tiene»— y la numeración corre seguida con las que
> haya. `required` no cambia; toda ficha 1.x válida lo sigue siendo.

> **v1.2.0 (2026-09-06):** ADITIVO, nada de lo anterior cambia. Dos cosas nuevas:
> `procedencia_proceso` admite **`planeadora`** (la casa que administra y cura las fichas de las
> apps del pipeline), y junto a este documento se publica **`plantilla.ficha-tecnica.json`**, el
> esqueleto con todos los campos y sus límites, **generado del mismo Zod** que valida — así que
> no puede desviarse del contrato. Toda ficha v1.0.0 o v1.1.0 válida lo sigue siendo.

> **v1.1.0 (2026-09-06):** el proceso BPMN (§3) pasa a ser **opcional**. Todo lo que valía en
> v1.0.0 sigue valiendo; una ficha sin `proceso` simplemente no tiene la sección «Cómo funciona».

> Para quien produce fichas técnicas de **investigaciones, agentes o tableros** que CV Viva va a
> mostrar en su vitrina. Entregas **contenido** (un JSON que cumple `ficha-tecnica.schema.json`);
> CV Viva lo pinta con esta plantilla. No entregas HTML, imágenes ni colores.
>
> Referencia visual: `referencia.html` (ábrelo en el navegador) o `referencia.png`.
> Ejemplo completo y real: `ejemplo.habla.json`. Esqueleto para rellenar:
> `plantilla.ficha-tecnica.json`.

## 1. Qué es una ficha técnica

La capa de **dos minutos** de una pieza: lo que se lee para decidir si se entra al detalle. Hasta
siete bloques, siempre en el mismo orden (el proceso es opcional). Cada bloque pide datos concretos, con límites concretos —
escribe **para el layout**, no para un documento.

| #   | Bloque                           | Campos del JSON                                       | Límites                                                  |
| --- | -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| 0   | **Cabecera**                     | `pieza.*` · `promesa.tagline` · `stack[]` · `titular` | tagline ≤ 80 · titular ≤ 240 · stack 1–8                 |
| —   | **Tira de cifras**               | `cifras[]`                                            | **3–5**, cada una con `fuente`                           |
| 1   | **Para quién, y qué resuelve**   | `promesa.para_quien` · `promesa.intro`                | ≤ 400 cada uno                                           |
| 2   | **Cómo funciona** (opcional)     | `proceso` (BPMN) + `procedencia_proceso`              | ver §3 · sin proceso, la sección no existe y se renumera |
| 3   | **Qué tiene**                    | `bloques[]`                                           | 2–10 · nombre ≤ 40 · línea ≤ 120                         |
| 4   | **Límites, y lo que nunca hace** | `limites[]` · `nunca[]`                               | 2–4 y 2–5 · ≤ 160 cada uno                               |
| 5   | **Dónde está**                   | `hitos[]`                                             | 3–5 · valor ≤ 24 · etiqueta ≤ 40                         |
| —   | **Cierre**                       | —                                                     | lo pone CV Viva: detalle (si existe) + lista de espera   |

## 2. Cómo escribir cada bloque

**Titular de valor** — _qué no hace nadie más_, en una frase. No es un eslogan ni una promesa
comercial: es la afirmación defendible que distingue la pieza. Si un competidor podría firmarla,
no es el titular.

**Cifras** — solo lo que se **midió, calculó, declaró o estimó**, y dices cuál de las cuatro
(`fuente`). `detalle` explica de dónde salió («salió de `pnpm test`», «lo fijó el equipo»). Elige
las 3–5 que más dicen de la pieza; el resto va en el detalle, si lo hay. `unidad` es opcional y
no se repite si la etiqueta ya la dice.

**Para quién** — la persona, su situación y lo que hoy hace sin la pieza. **La promesa** (`intro`)
— qué cambia para ella. Un párrafo cada uno.

**Bloques** — las áreas grandes de lo que la pieza tiene (los «grupos» de funcionalidades de una
app; las líneas de trabajo de una investigación; los oficios de un agente). Nombre + una línea +
`cuenta` (cuántas piezas contiene; 0 si no aplica).

**Límites, a propósito** — lo que la pieza **decidió no ser**. **Nunca** — lo que no hace bajo
ninguna circunstancia (privacidad, alcance, honestidad). Frases cortas, verbo al frente.

**Hitos** — 3–5 marcas de dónde está: ciclo, sprints o entregas cerradas, fecha de sello o de
validación, versión. Las etiquetas `ciclo` · `sprints` · `sellada` · `construccion` · `version` ·
`decisiones` se traducen solas; cualquier otra se muestra tal cual.

## 3. El proceso (BPMN) — opcional desde v1.1.0

Cuando la pieza tiene un proceso de uso, es la sección más leída de la ficha. **Es opcional:** si
tu pieza no tiene un proceso que contar (una línea de investigación sin flujo de uso, un tablero
que se mira y no se recorre), omite `proceso` y `procedencia_proceso` — los dos a la vez, nunca
uno solo — y la ficha sale sin «Cómo funciona», con las demás secciones renumeradas. Si lo
incluyes, el motor de CV Viva lo dibuja a partir de datos — **tú no dibujas nada**; describes:

```json
"proceso": {
  "titulo": "Una sesión de práctica en casa",
  "carriles": [ { "id": "padre", "nombre": "Papá · Mamá" }, { "id": "app", "nombre": "La app" } ],
  "pasos": [
    { "id": "ini",   "tipo": "inicio",   "carril": "padre", "texto": "Cada día" },
    { "id": "idea",  "tipo": "tarea",    "carril": "padre", "texto": "Abre la idea del día" },
    { "id": "mide",  "tipo": "tarea",    "carril": "app",   "texto": "Mide energía y tono, en memoria" },
    { "id": "ok",    "tipo": "decision", "carril": "padre", "texto": "¿Acertó?" },
    { "id": "fin",   "tipo": "fin",      "carril": "padre", "texto": "" }
  ],
  "flujos": [
    { "de": "ini", "a": "idea" }, { "de": "idea", "a": "mide" }, { "de": "mide", "a": "ok" },
    { "de": "ok", "a": "fin", "etiqueta": "sí" }, { "de": "ok", "a": "idea", "etiqueta": "no · otra vez" }
  ],
  "anotaciones": [ { "paso": "mide", "texto": "La voz del niño nunca sale del aparato." } ]
}
```

Reglas (el esquema las exige):

- **Carriles = actores** (personas, sistemas, terceros). Los que hagan falta, 1–5. Un actor que no
  hace nada en el proceso no tiene carril.
- **Un paso por acción.** `texto` ≤ 60 caracteres; si no cabe, son dos pasos. El orden del array
  es el orden de lectura (izquierda → derecha): tú controlas la narrativa.
- Exactamente **un inicio**; al menos **un fin**. Todo paso debe ser alcanzable y tener salida.
- **Una decisión tiene ≥ 2 caminos**, cada uno con `etiqueta` corta («sí», «no · ajusta»). Su
  `texto` es la pregunta: si tiene **≤ 9 caracteres** («¿Acertó?») se pinta dentro del rombo; más
  largo («¿Con sus palabras?») va encima, partido en líneas. Prefiere la corta cuando exista.
- **Los bucles se declaran** como flujos hacia atrás; el motor los dibuja por debajo del pool.
- **Anotaciones** (≤ 6, ≤ 140 caracteres): lo que el diagrama no dice y hay que saber
  (privacidad, garantías). Se pintan como llamadas numeradas ①② con el texto al pie.
- Si el proceso no cabe en una fila, el motor lo **parte en filas** con eventos de enlace Ⓐ…Ⓐ.
  No lo encoge. En móvil se desliza en horizontal. Un proceso de 8–12 pasos es lo normal; más de
  16 es señal de que estás describiendo el detalle, no la ficha.
- `procedencia_proceso`: `app` si lo declara la propia pieza; `cv-viva` si lo derivó CV Viva;
  `planeadora` si lo curó la casa que administra las fichas de las apps (v1.2.0).
  Va **si y solo si** hay `proceso`: el esquema rechaza un proceso sin procedencia y una
  procedencia sin proceso.
  Se muestra al pie del diagrama. **Sin dueño declarado, el proceso es una cifra sin fuente.**

BPMN es el lenguaje para piezas con un proceso que contar. Muchas lo tienen aunque no sea «de
uso» (una línea de investigación tiene una metodología; un agente, una cadena de comandos): los
carriles cambian (investigador · fuentes · agente), la gramática no. Si de verdad no hay proceso,
omítelo — una ficha sin «Cómo funciona» es mejor que un diagrama inventado.

## 4. Lo que CV Viva pone, y tú no

- **La piel.** Paleta paper/ink + pasteles, Fraunces/Inter/JetBrains Mono, radios y sombras del
  design system de CV Viva. No mandes colores, fuentes ni logos.
- **Los iconos** de los bloques (24×24, trazo 1.5, sin relleno) — nunca emojis.
- **El cierre**: el botón al detalle (si existe) y la lista de espera.
- **Las traducciones** de los rótulos. Tu contenido llega en **un idioma** (el de la pieza) y se
  respeta tal cual — ADR-013 §6: la ficha conserva la voz de su autor.

## 5. Reglas duras (las de toda la vitrina)

- **Cero enlaces.** Ni URL de producción, ni de preview, ni de repositorio. Ni en el JSON ni en
  los textos. El CTA público es la lista de espera, sin promesa de fecha.
- **Cero cifras inventadas.** Sin `fuente`, la cifra no entra.
- **Cero datos reales de personas** en ejemplos, capturas o textos.
- **Nada de tiempo real.** La ficha muestra la versión anclada (`actualizado`), y lo dice.

## 6. Cómo se entrega

Un archivo `<slug>.ficha-tecnica.json` que valide contra `ficha-tecnica.schema.json`
(`schema_version: "1.3.1"`; las versiones 1.x anteriores siguen siendo válidas). Si la ficha trae
`galeria`, las imágenes viajan junto al JSON en la ruta relativa que declara cada `archivo`
(`capturas/<slug>/NN-<pagina>.png`, 2560×1440); CV Viva las sirve desde `public/piezas/<frente>/` y
su test exige que cada una exista. CV Viva lo deja caer en `content/<frente>/` y la ficha existe sola:
ruta, sitemap, pruebas de accesibilidad. Si no valida, **la publicación falla** y el error dice el
campo — nunca se publica una ficha que miente sobre sí misma. El archivo **no se edita en CV
Viva**: se corrige en origen y se vuelve a entregar.
