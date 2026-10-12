# planlang · bundle del design system

> GENERADO por `node scripts/design-sync/generar.mjs` desde `design-system.md` 1.0.0 y los tokens de
> `scripts/paleta/generar-tokens.mjs`. No se edita a mano: `tests/unit/design-sync.test.ts` lo regenera y exige los
> mismos bytes.

Espejo publicable del design system de planlang para Claude Design (regla 16 de la constitución). La jerarquía es
fija: `design-system.md` (fuente de verdad) → `design-sync/` (este bundle, deriva) → el proyecto en Claude Design
(vitrina, jamás se edita allá). El destino y el registro de publicación viven en `project.json`.

**Estado:** sin publicar. Se publica después del gate único de los hitos H-1 y H-2 (el bloque G de la guía de prueba),
cuando el usuario invoque `/design-sync`; ese gate no ocurre en un sprint.

## Qué trae

- `styles.css`: los tokens de color de los dos temas (generados) y la escala de tipografía, espacio, forma y
  movimiento del § 2.
- 12 tarjetas autocontenidas (primera línea `@dsCard`, CSS en línea, sin CDN), cada una en los dos temas:

| Grupo | Tarjeta | Archivo |
| --- | --- | --- |
| Fundamentos | Color | `components/fundamentos/color.html` |
| Fundamentos | Tipografía | `components/fundamentos/tipografia.html` |
| Fundamentos | Espacio y forma | `components/fundamentos/espacio-y-forma.html` |
| Fundamentos | Movimiento | `components/fundamentos/movimiento.html` |
| Fundamentos | Glifos y marcas | `components/fundamentos/glifos-y-marcas.html` |
| Componentes | Rótulo y barra | `components/componentes/rotulo-y-barra.html` |
| Componentes | Botones y chips | `components/componentes/botones-y-chips.html` |
| Componentes | Veredicto | `components/componentes/veredicto.html` |
| Componentes | Nodo y arista | `components/componentes/nodo-y-arista.html` |
| Componentes | Deslizador de umbral | `components/componentes/deslizador-de-umbral.html` |
| Componentes | Fila de criterio | `components/componentes/fila-de-criterio.html` |
| Componentes | Marco de CV Viva | `components/componentes/marco-de-cv-viva.html` |

## Dónde se usan, desde el sprint 4

Las pantallas que llegaron en los hitos H-2 no trajeron componentes nuevos: se arman con estas mismas tarjetas.

- **Comparar dos corridas** (S4, `/es/comparar`): Veredicto, Tabla de filas (medidas, criterios, riesgos y casos que
  difieren) y Botones y chips.
- **Plan sin corrida** (S5 a S7, `/es/planes/<id>`): Veredicto (el rótulo «Sin corrida», con su símbolo y su texto),
  Tabla de filas (el contrato del grafo en detalle: nodos, aristas, ramas por defecto y pausas) y Botones y chips (quién
  propuso cada elemento).

## Lo que no está aquí

El catálogo completo de componentes canon (§ 5, más de 50) vive en `design-system.md` y en la vitrina construida;
estas tarjetas muestran los fundamentos y los componentes que fijan la gramática visual. Inter, JetBrains Mono y
Fraunces los sirve la app; las tarjetas declaran la pila de letras sin descargar fuentes.
